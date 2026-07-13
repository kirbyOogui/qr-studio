# QR Studio Quality Engine — Cloud Run 用イメージ
# min-instances=0 前提のため、起動が速い軽量イメージ構成にしている。
FROM python:3.12-slim AS base

# pyzbarが依存するlibzbar0、OpenCVが必要とする最小限の共有ライブラリのみを導入する。
RUN apt-get update \
    && apt-get install -y --no-install-recommends libzbar0 libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# 非rootユーザーで実行（最小権限の原則）
RUN useradd --no-create-home --uid 10001 appuser
USER appuser

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Cloud Run は PORT 環境変数でリッスンポートを指定する
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
