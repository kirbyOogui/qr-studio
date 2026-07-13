import base64
from io import BytesIO

import pytest
import qrcode


@pytest.fixture
def make_qr_png_base64():
    """指定ペイロードからPNG画像を生成しBase64文字列で返すヘルパー。"""

    def _make(payload: str, quiet_zone_modules: int = 4, box_size: int = 10) -> str:
        qr = qrcode.QRCode(border=quiet_zone_modules, box_size=box_size)
        qr.add_data(payload)
        qr.make(fit=True)
        image = qr.make_image(fill_color="black", back_color="white").convert("RGB")
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("ascii")

    return _make
