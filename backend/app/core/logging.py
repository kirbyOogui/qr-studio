"""ロギング設定。

Stateless / プライバシー要件により、URLやQR画像データ（ペイロード）を
ログに一切出力しないことを保証する。標準の uvicorn アクセスログではなく、
パス・メソッド・ステータス・処理時間のみを記録する専用ミドルウェアを使う。
"""
import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("qr_studio")


def configure_logging(log_level: str) -> None:
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    # uvicorn のアクセスログはリクエストパスにクエリパラメータを含み得るため無効化し、
    # 独自ミドルウェアの安全なログのみを使用する。
    logging.getLogger("uvicorn.access").disabled = True


class SafeAccessLogMiddleware(BaseHTTPMiddleware):
    """URL・画像等の機微データを一切含まない最小限のアクセスログを出力する。"""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "method=%s path=%s status=%d duration_ms=%.1f",
            request.method,
            request.url.path,  # クエリ文字列・ボディは含めない
            response.status_code,
            duration_ms,
        )
        return response
