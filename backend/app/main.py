"""QR Studio Backend = QR Quality Engine のエントリーポイント。

このサーバーは一般的な意味でのAPIサーバーではなく、フロントエンドが生成したQR画像の
読み取り品質を検証し、必要な補正値のみを返す「品質保証エンジン」として振る舞う。
完全Statelessであり、リクエスト処理後は画像・URLをメモリ上からも破棄する。
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.endpoints import health, quality
from app.core.config import get_settings
from app.core.logging import SafeAccessLogMiddleware, configure_logging, logger
from app.core.rate_limit import limiter
from app.core.security import BodySizeLimitMiddleware, SecurityHeadersMiddleware

settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(
    title="QR Studio Quality Engine",
    description="QRコードの読み取り品質を診断し、自動補正パラメータを返すStatelessなAPI。",
    version="1.0.0",
    # ルートを公開せず、詳細なAPIドキュメントは本番では露出しない。
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url=None,
)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    detail = "リクエストが多すぎます。しばらくしてから再度お試しください。"
    return JSONResponse(status_code=429, content={"detail": detail})


@app.exception_handler(RequestValidationError)
def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # 入力値の詳細（URLの中身など）を含まない一般的なメッセージのみを返す。
    logger.warning("validation_error path=%s", request.url.path)
    return JSONResponse(status_code=422, content={"detail": "入力内容を確認してください。"})


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(BodySizeLimitMiddleware, max_bytes=settings.max_request_body_bytes)
app.add_middleware(SafeAccessLogMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.add_middleware(SlowAPIMiddleware)

app.include_router(health.router, prefix="/api/v1")
app.include_router(quality.router, prefix="/api/v1")
