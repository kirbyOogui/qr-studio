"""アプリケーション設定。環境変数から読み込み、機密情報やURLなどの状態は一切保持しない。"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 環境
    environment: str = "development"

    # CORS: 本番ではVercelの本番ドメインのみを許可する
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "https://qr-studio.vercel.app",
    ]

    # リクエストボディの最大サイズ（バイト）。画像はメモリ上でのみ扱うため上限を厳格に設ける。
    max_request_body_bytes: int = 6 * 1024 * 1024  # 6MB

    # 品質チェック対象画像の最大辺（px）。これを超える画像は処理前に拒否する。
    max_image_dimension_px: int = 4096

    # レート制限（slowapi）
    rate_limit_default: str = "60/minute"
    rate_limit_quality_check: str = "20/minute"

    # ログレベル
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
