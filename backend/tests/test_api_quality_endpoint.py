from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthz():
    response = client.get("/api/v1/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_quality_check_passes_for_valid_qr(make_qr_png_base64):
    payload = "https://example.com/"
    image_b64 = make_qr_png_base64(payload, quiet_zone_modules=4, box_size=10)

    response = client.post(
        "/api/v1/qr/quality-check",
        json={
            "image_base64": image_b64,
            "expected_payload": payload,
            "design": {
                "error_correction": "M",
                "quiet_zone_modules": 4,
                "logo_ratio": None,
                "size_px": 600,
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["passed"] is True
    assert body["corrections"] is None
    assert "opencv" in body["decoders_matched"]


def test_quality_check_rejects_oversized_body():
    huge_payload = "A" * (7 * 1024 * 1024)
    response = client.post(
        "/api/v1/qr/quality-check",
        content=huge_payload,
        headers={"content-type": "application/json"},
    )
    assert response.status_code == 413


def test_quality_check_rejects_invalid_image():
    response = client.post(
        "/api/v1/qr/quality-check",
        json={
            "image_base64": "not-a-valid-base64-image==",
            "expected_payload": "https://example.com/",
            "design": {
                "error_correction": "M",
                "quiet_zone_modules": 4,
                "logo_ratio": None,
                "size_px": 600,
            },
        },
    )
    assert response.status_code == 422


def test_security_headers_present():
    response = client.get("/api/v1/healthz")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert "Strict-Transport-Security" in response.headers
    assert "Content-Security-Policy" in response.headers
