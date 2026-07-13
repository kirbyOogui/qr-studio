"""Base64画像を安全にメモリ上のnumpy配列へ変換するユーティリティ。

- ディスクへは一切書き込まない（BytesIOのみ使用）。
- Pillowでの検証により、拡張子偽装や不正なファイルシグネチャ(MIME偽装)を弾く。
- 巨大画像（メモリ枯渇/デコード爆弾）を防ぐため寸法上限を設ける。
"""
import base64
import binascii
from io import BytesIO

import numpy as np
from PIL import Image, UnidentifiedImageError

_ALLOWED_FORMATS = {"PNG", "JPEG", "WEBP"}


class InvalidImageError(ValueError):
    pass


def decode_base64_image(image_base64: str, max_dimension_px: int) -> np.ndarray:
    """Base64文字列をRGBのnumpy配列にデコードする。処理後に元バイト列は参照を持たない。"""
    try:
        raw_bytes = base64.b64decode(image_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise InvalidImageError("画像データのBase64デコードに失敗しました。") from exc

    if len(raw_bytes) == 0:
        raise InvalidImageError("画像データが空です。")

    buffer = BytesIO(raw_bytes)
    try:
        with Image.open(buffer) as image:
            image.verify()  # ファイルシグネチャ検証（MIME偽装対策）
        buffer.seek(0)
        with Image.open(buffer) as image:
            if image.format not in _ALLOWED_FORMATS:
                raise InvalidImageError(f"未対応の画像形式です: {image.format}")
            if image.width > max_dimension_px or image.height > max_dimension_px:
                raise InvalidImageError("画像サイズが上限を超えています。")
            rgb_image = image.convert("RGB")
            array = np.array(rgb_image)
    except UnidentifiedImageError as exc:
        raise InvalidImageError("画像として認識できないデータです。") from exc
    finally:
        buffer.close()
        del raw_bytes

    return array
