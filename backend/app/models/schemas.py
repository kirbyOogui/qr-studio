"""API入出力スキーマ。

品質チェックのレスポンスには「スコア」や専門用語を含めない。
フロントエンドが自動補正ループでそのまま使える「補正後パラメータ」のみを返す。
"""
from enum import Enum

from pydantic import BaseModel, Field, field_validator

# Base64文字列としての最大長。約4MBの画像を想定した安全マージン。
_MAX_BASE64_LENGTH = 6_000_000
_MAX_PAYLOAD_LENGTH = 2048


class ErrorCorrectionLevel(str, Enum):
    L = "L"
    M = "M"
    Q = "Q"
    H = "H"


class CornerSquareStyle(str, Enum):
    """QRの四隅(ファインダーパターン)外枠の形状。

    実機検証の結果、"dot"/"extra-rounded"(丸め形状)はOpenCVの標準的な
    QRCodeDetectorのファインダーパターン検出(1:1:3:1:1比率の正方形を前提とする)を
    壊し、デコードに失敗することを確認している。読み取り precision との兼ね合いで
    補正の判断材料として扱う。
    """

    SQUARE = "square"
    DOT = "dot"
    EXTRA_ROUNDED = "extra-rounded"


class DotStyle(str, Enum):
    """QR本体のモジュール(ドット)形状。

    "square"以外(丸・クラシック等)は、モジュールが小さくなるほど縁の
    アンチエイリアシングが実効コントラストを下げやすい。出力サイズの拡大だけでは
    解決しない場合の最終手段として"square"へフォールバックする判断材料に使う。
    """

    SQUARE = "square"
    OTHER = "other"


class QrDesignParams(BaseModel):
    """デコード品質に影響するデザインパラメータ（色など純粋に見た目だけの項目は含めない）。"""

    error_correction: ErrorCorrectionLevel = ErrorCorrectionLevel.M
    quiet_zone_modules: int = Field(default=4, ge=0, le=20)
    logo_ratio: float | None = Field(default=None, ge=0.0, le=0.4)
    size_px: int = Field(default=512, ge=64, le=4096)
    corner_square_style: CornerSquareStyle = CornerSquareStyle.SQUARE
    dot_style: DotStyle = DotStyle.SQUARE


class QualityCheckRequest(BaseModel):
    image_base64: str = Field(min_length=1, max_length=_MAX_BASE64_LENGTH)
    expected_payload: str = Field(min_length=1, max_length=_MAX_PAYLOAD_LENGTH)
    design: QrDesignParams

    @field_validator("image_base64")
    @classmethod
    def _strip_data_url_prefix(cls, value: str) -> str:
        if "," in value and value.strip().startswith("data:"):
            return value.split(",", 1)[1]
        return value


class QualityCheckResponse(BaseModel):
    passed: bool
    corrections: QrDesignParams | None = None
    # 3エンジンのうちどれが読み取りに成功したかのみ返す（点数化はしない）。内部/デバッグ用途。
    decoders_matched: list[str] = Field(default_factory=list)
    # コントラスト不足の場合のみ true。具体的な色はフロントエンドの補正ロジックが決定する
    # （バックエンドは色そのものを知らず、構造的な読み取り可否のみを判定するため）。
    contrast_adjustment_needed: bool = False
