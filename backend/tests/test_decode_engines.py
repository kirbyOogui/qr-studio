"""3種のデコードエンジンすべてが同一のQRコードを正しく読み取れることを検証する。"""
from app.services.decode_engines import available_decoders
from app.utils.image_utils import decode_base64_image


def test_at_least_three_decoders_available():
    decoders = available_decoders()
    assert len(decoders) >= 3, "OpenCV/pyzbar/zxing-cppの3エンジンが利用可能である必要があります"


def test_all_decoders_read_the_same_payload(make_qr_png_base64):
    payload = "https://example.com/qr-studio-test"
    image = decode_base64_image(make_qr_png_base64(payload), max_dimension_px=4096)

    decoders = available_decoders()
    results = {decoder.name: decoder.decode(image) for decoder in decoders}

    for name, decoded in results.items():
        assert decoded == payload, f"{name} がQRコードを正しく読み取れませんでした: {decoded!r}"
