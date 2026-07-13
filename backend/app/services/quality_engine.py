"""QR品質診断エンジン。

画像を「保存」することなくメモリ上で解析し、以下を判定する。
- デコード検証: 3エンジンで元のURLと完全一致する文字列が読み取れるか
- コントラスト解析: 前景/背景の輝度コントラスト比（WCAGの相対輝度式を流用）
- Quiet Zone: QR仕様上の推奨最小値（4モジュール）を満たしているか
- ロゴ被覆率: Error Correctionレベルごとの安全上限を超えていないか
- 出力サイズ: ペイロード長・EC levelから決まるモジュール数に対して
  1モジュールあたりの物理ピクセル数が十分か（カメラでの読み取り下限は経験則で約4px/モジュール）
"""
from dataclasses import dataclass

import numpy as np
import qrcode
from qrcode.constants import ERROR_CORRECT_H, ERROR_CORRECT_L, ERROR_CORRECT_M, ERROR_CORRECT_Q

from app.models.schemas import ErrorCorrectionLevel, QrDesignParams
from app.services.decode_engines import available_decoders

_EC_MAP = {
    ErrorCorrectionLevel.L: ERROR_CORRECT_L,
    ErrorCorrectionLevel.M: ERROR_CORRECT_M,
    ErrorCorrectionLevel.Q: ERROR_CORRECT_Q,
    ErrorCorrectionLevel.H: ERROR_CORRECT_H,
}

# ロゴを載せる場合の、EC levelごとの安全な最大ロゴ幅比率（QR全体の幅に対する比率）。
# 幅比率がそのまま面積比率になるわけではなく、正方形ロゴの被覆面積は
# おおよそ(幅比率)^2で効いてくるため、実際の誤り訂正バジェット消費は見た目の
# 比率よりかなり小さい（例: H levelで0.45なら面積は約20%、バジェットは30%
# あるので依然として余裕がある）。「読み取れる最大まで」を追求するため上限は
# 積極的寄りに設定しているが、それでも実際のデコードに失敗した場合の
# 最終手段としてロゴ比率自体を縮小する補正を
# correction_engine.build_corrections内に安全網として用意している
# (EC levelが既にHかつ四隅がsquare形状で、それでも読み取れない場合に発動)。
_MAX_LOGO_RATIO = {
    ErrorCorrectionLevel.L: 0.0,
    ErrorCorrectionLevel.M: 0.26,
    ErrorCorrectionLevel.Q: 0.34,
    ErrorCorrectionLevel.H: 0.45,
}

_MIN_QUIET_ZONE_MODULES = 4
_MIN_PX_PER_MODULE = 4.0
_MIN_CONTRAST_RATIO = 4.5


@dataclass
class QualityMetrics:
    decoders_matched: list[str]
    all_decoders_matched: bool
    contrast_ratio: float
    contrast_ok: bool
    quiet_zone_ok: bool
    logo_ratio_ok: bool
    size_ok: bool
    module_count: int
    recommended_min_size_px: int


def compute_module_count(payload: str, error_correction: ErrorCorrectionLevel) -> int:
    """指定のペイロード・EC levelでQRを構成した場合のモジュール数（1辺）を返す。"""
    qr = qrcode.QRCode(error_correction=_EC_MAP[error_correction])
    qr.add_data(payload)
    qr.make(fit=True)
    modules_per_side = len(qr.get_matrix())
    return modules_per_side


def _relative_luminance(rgb: np.ndarray) -> float:
    srgb = rgb / 255.0
    linear = np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)
    return float(0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2])


def _estimate_contrast_ratio(image: np.ndarray) -> float:
    """Otsuの二値化でQRのモジュール(暗)と背景(明)を分離し、WCAG式のコントラスト比を推定する。

    QRコードは背景（Quiet Zoneを含む）の面積がモジュールより大きく偏るため、
    中央値ベースの単純な閾値では分離に失敗する。Otsu法は面積比に依存せず
    2クラスの分散が最大になる閾値を選ぶため、この用途に適している。

    グラデーションを使ったデザインでは、暗色クラスタ内の色がグラデーションの
    位置によってばらつく。「クラスタの平均色」同士で比較すると、実際には
    背景とのコントラストが不十分な部分(グラデーションの薄い側の端など)が
    平均に埋もれて見逃されてしまう。そのため各クラスタの平均ではなく、
    分布の悲観的な端(パーセンタイル)を使って保守的なコントラスト比を採用する。

    ただし真の最大値/最小値(min/max)を使うと、実際のブラウザ描画では
    モジュールの縁のアンチエイリアシング(滑らかにするための中間色ピクセル)が
    ごく少数だけ紛れ込み、それを「最悪ケース」として拾ってしまい、
    黒背景に白のような理想的なQRでも不合格判定になってしまう(実機検証で
    発覚した不具合)。パーセンタイル(上位/下位5%を切り捨てる)を使うことで、
    ごく少数の縁ピクセルは無視しつつ、グラデーションのように広い範囲が
    薄くなっているような本当の問題は引き続き検出できる。
    """
    import cv2

    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    _threshold_value, binary = cv2.threshold(
        gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    dark_mask = (binary == 0).reshape(-1)
    light_mask = ~dark_mask
    if not dark_mask.any() or not light_mask.any():
        # 単色画像など分離不能な場合はデコード検証側で不合格になるため、ここでは中立に扱う。
        return _MIN_CONTRAST_RATIO

    pixels = image.reshape(-1, 3).astype(np.float32)
    dark_pixels = pixels[dark_mask]
    light_pixels = pixels[light_mask]

    # サンプリングで計算コストを抑えつつ、各クラスタの輝度分布の最悪端を推定する。
    rng = np.random.default_rng(seed=0)

    # 上位/下位5%はアンチエイリアシングの縁ピクセルとみなして切り捨てる。
    _EDGE_NOISE_PERCENTILE = 5.0

    def worst_case_luminance(cluster: np.ndarray, want_max: bool) -> float:
        sample = cluster
        if sample.shape[0] > 5_000:
            idx = rng.choice(sample.shape[0], size=5_000, replace=False)
            sample = sample[idx]
        luminances = np.array([_relative_luminance(px) for px in sample])
        percentile = 100 - _EDGE_NOISE_PERCENTILE if want_max else _EDGE_NOISE_PERCENTILE
        return float(np.percentile(luminances, percentile))

    # 暗色クラスタの中で最も明るいピクセル、明色クラスタの中で最も暗いピクセルを取る。
    l_dark_worst = worst_case_luminance(dark_pixels, want_max=True)
    l_light_worst = worst_case_luminance(light_pixels, want_max=False)

    lighter, darker = max(l_dark_worst, l_light_worst), min(l_dark_worst, l_light_worst)
    return (lighter + 0.05) / (darker + 0.05)


def analyze(image: np.ndarray, expected_payload: str, design: QrDesignParams) -> QualityMetrics:
    matched: list[str] = []
    for decoder in available_decoders():
        try:
            decoded_text = decoder.decode(image)
        except Exception:  # noqa: BLE001 デコーダー内部エラーは「読み取り失敗」として扱う
            decoded_text = None
        if decoded_text is not None and decoded_text == expected_payload:
            matched.append(decoder.name)

    total_available = len(available_decoders())
    all_matched = total_available > 0 and len(matched) == total_available

    contrast_ratio = _estimate_contrast_ratio(image)
    contrast_ok = contrast_ratio >= _MIN_CONTRAST_RATIO

    quiet_zone_ok = design.quiet_zone_modules >= _MIN_QUIET_ZONE_MODULES

    max_logo_ratio = _MAX_LOGO_RATIO[design.error_correction]
    logo_ratio_ok = design.logo_ratio is None or design.logo_ratio <= max_logo_ratio

    module_count = compute_module_count(expected_payload, design.error_correction)
    total_modules_with_quiet_zone = module_count + 2 * design.quiet_zone_modules
    recommended_min_size_px = int(total_modules_with_quiet_zone * _MIN_PX_PER_MODULE)
    size_ok = design.size_px >= recommended_min_size_px

    return QualityMetrics(
        decoders_matched=matched,
        all_decoders_matched=all_matched,
        contrast_ratio=contrast_ratio,
        contrast_ok=contrast_ok,
        quiet_zone_ok=quiet_zone_ok,
        logo_ratio_ok=logo_ratio_ok,
        size_ok=size_ok,
        module_count=module_count,
        recommended_min_size_px=recommended_min_size_px,
    )
