"""QR品質チェックAPI。

入力: レンダリング済みQR画像(Base64) + 想定ペイロード + 現在のデザインパラメータ
出力: 読み取り可否と、必要な場合のみ補正後パラメータ

画像・URLはこのリクエスト処理の間だけメモリ上に存在し、レスポンス送出後に破棄される。
ディスク・DB・キャッシュへの書き込みは一切行わない。
"""
from fastapi import APIRouter, HTTPException, Request

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.models.schemas import QualityCheckRequest, QualityCheckResponse
from app.services import correction_engine, quality_engine
from app.utils.image_utils import InvalidImageError, decode_base64_image

router = APIRouter(tags=["quality"])
settings = get_settings()


@router.post("/qr/quality-check", response_model=QualityCheckResponse)
@limiter.limit(settings.rate_limit_quality_check)
def quality_check(request: Request, payload: QualityCheckRequest) -> QualityCheckResponse:
    try:
        image = decode_base64_image(payload.image_base64, settings.max_image_dimension_px)
    except InvalidImageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        metrics = quality_engine.analyze(image, payload.expected_payload, payload.design)
    finally:
        # 明示的に参照を破棄し、レスポンス生成後にメモリ上から即座に解放されるようにする。
        del image

    corrections = correction_engine.build_corrections(payload.design, metrics)

    return QualityCheckResponse(
        passed=corrections is None,
        corrections=corrections,
        decoders_matched=metrics.decoders_matched,
        contrast_adjustment_needed=not metrics.contrast_ok,
    )
