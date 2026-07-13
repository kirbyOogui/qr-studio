"""品質診断結果から「補正後のデザインパラメータ」を計算する。

ユーザーには一切通知せず、フロントエンドが自動的に適用して再生成できる
具体的な値（Error Correctionレベル・Quiet Zone・ロゴ比率・出力サイズ）を返す。
"""
from app.models.schemas import CornerSquareStyle, DotStyle, ErrorCorrectionLevel, QrDesignParams
from app.services.quality_engine import _MAX_LOGO_RATIO, _MIN_QUIET_ZONE_MODULES, QualityMetrics

_MAX_SIZE_PX = 4096

_EC_ESCALATION_LADDER = [
    ErrorCorrectionLevel.L,
    ErrorCorrectionLevel.M,
    ErrorCorrectionLevel.Q,
    ErrorCorrectionLevel.H,
]


def _escalate_error_correction(current: ErrorCorrectionLevel) -> ErrorCorrectionLevel:
    idx = _EC_ESCALATION_LADDER.index(current)
    next_idx = min(idx + 1, len(_EC_ESCALATION_LADDER) - 1)
    return _EC_ESCALATION_LADDER[next_idx]


def build_corrections(
    design: QrDesignParams, metrics: QualityMetrics
) -> QrDesignParams | None:
    """全項目が問題なければ None（補正不要）を返す。"""
    if (
        metrics.all_decoders_matched
        and metrics.contrast_ok
        and metrics.quiet_zone_ok
        and metrics.logo_ratio_ok
        and metrics.size_ok
    ):
        return None

    error_correction = design.error_correction
    quiet_zone_modules = design.quiet_zone_modules
    logo_ratio = design.logo_ratio
    size_px = design.size_px
    corner_square_style = design.corner_square_style
    dot_style = design.dot_style

    if not metrics.quiet_zone_ok:
        quiet_zone_modules = max(quiet_zone_modules, _MIN_QUIET_ZONE_MODULES)

    if not metrics.logo_ratio_ok and logo_ratio is not None:
        # まずEC levelを上げてロゴ許容量を増やし、それでも収まらない場合はロゴ自体を縮小する。
        error_correction = _escalate_error_correction(error_correction)
        max_ratio_after_escalation = _MAX_LOGO_RATIO[error_correction]
        logo_ratio = min(logo_ratio, max_ratio_after_escalation)

    if not metrics.all_decoders_matched:
        if corner_square_style != CornerSquareStyle.SQUARE:
            # OpenCVはWeChatQRCode検出器の採用により丸め形状(dot/extra-rounded)でも
            # 通常は読み取れるが、万一デコードに失敗した場合の安全策として、
            # Error Correctionのエスカレーションより先にsquareへのフォールバックを試す
            # (最も見た目への影響が小さい根本原因である可能性が高いため)。
            corner_square_style = CornerSquareStyle.SQUARE
        elif error_correction != ErrorCorrectionLevel.H:
            error_correction = _escalate_error_correction(error_correction)

    if not metrics.size_ok:
        size_px = max(size_px, metrics.recommended_min_size_px)

    if not metrics.contrast_ok:
        # モジュールが小さいと、丸みのあるドット/コーナー形状の縁の
        # アンチエイリアシングが実効コントラストを下げる主因になる
        # (実機検証で確認)。まずは配色を変えずに出力サイズを大きくして
        # 1モジュールあたりのピクセル数を増やすことを試みる。
        if size_px < _MAX_SIZE_PX:
            size_px = min(_MAX_SIZE_PX, max(size_px, int(size_px * 1.5)))
        elif dot_style != DotStyle.SQUARE:
            # 出力サイズが上限に達してもなお不十分な場合の最終手段として、
            # モジュール形状自体を(丸みのない)squareへフォールバックする。
            dot_style = DotStyle.SQUARE

    return QrDesignParams(
        error_correction=error_correction,
        quiet_zone_modules=quiet_zone_modules,
        logo_ratio=logo_ratio,
        size_px=size_px,
        corner_square_style=corner_square_style,
        dot_style=dot_style,
    )
