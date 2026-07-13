# デプロイ手順

## 前提

- Backend: Google Cloud Run（`min-instances=0`、完全無料枠運用を想定）
- Frontend: Vercel Free
- 両者は別々にデプロイし、環境変数でお互いのURLを共有する。

## 1. Backend（Cloud Run）

### 事前準備

```bash
gcloud auth login
gcloud config set project <YOUR_GCP_PROJECT_ID>
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
```

### ビルド & デプロイ

`backend/` ディレクトリから実行する。

```bash
cd backend

gcloud builds submit --tag asia-northeast1-docker.pkg.dev/<PROJECT_ID>/qr-studio/backend:latest

gcloud run deploy qr-studio-backend \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/qr-studio/backend:latest \
  --region asia-northeast1 \
  --platform managed \
  --min-instances=0 \
  --max-instances=3 \
  --cpu=1 \
  --memory=512Mi \
  --concurrency=10 \
  --timeout=15s \
  --allow-unauthenticated \
  --set-env-vars="ENVIRONMENT=production,ALLOWED_ORIGINS=[\"https://<YOUR_VERCEL_DOMAIN>\"]"
```

### ポイント

- `--min-instances=0`: 無料枠運用の最重要設定。リクエストが無い間は課金されない。
  その代わりコールドスタートが発生するため、フロントエンドの
  `QualityLoadingOverlay`（「品質を確認しています…」）でUXを吸収している。
- `--concurrency=10` / `--cpu=1`: 画像デコード処理はCPUバウンドのため、
  同時実行数を抑えて1リクエストあたりのCPU時間を安定させている。
- `--timeout=15s`: フロントエンドの品質チェックAPIタイムアウト(15秒)と揃えている。
- `ALLOWED_ORIGINS` は必ず本番のVercelドメインに絞る（ワイルドカードは使わない）。
- Stateless設計のため、Cloud SQLやCloud Storageなどの永続化リソースは一切不要。

### デプロイ後の確認

```bash
curl https://<CLOUD_RUN_URL>/api/v1/healthz
# {"status":"ok"}
```

## 2. Frontend（Vercel）

### 環境変数

Vercelプロジェクトの Settings > Environment Variables に設定する。

| 変数名 | 値 | 備考 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://<CLOUD_RUN_URL>` | ブラウザから直接呼び出すため`NEXT_PUBLIC_`必須 |

### デプロイ

```bash
cd frontend
vercel link
vercel env add NEXT_PUBLIC_API_BASE_URL production
vercel --prod
```

Vercel FreeプランはNext.js App Routerをフレームワークプリセットとして自動検出するため、
追加のビルド設定は不要（`next build`がそのまま実行される）。

### next.config.mjs のCSPについて

`next.config.mjs` の `connect-src` はビルド時の `NEXT_PUBLIC_API_BASE_URL` を埋め込む。
バックエンドURLを変更した場合は、Vercel側で環境変数を更新した上で再デプロイすること
（`headers()` はビルド時に評価されるため、環境変数のみの更新では反映されない）。

## 3. デプロイ後のチェックリスト

- [ ] `https://<CLOUD_RUN_URL>/api/v1/healthz` が200を返す
- [ ] フロントエンドからQRコードを生成し、ダウンロードできる
- [ ] ブラウザの開発者ツールでCSP等のセキュリティヘッダーが付与されていることを確認
- [ ] Lighthouse（PWA / Performance / Accessibility）を実行し、目標スコアを満たすことを確認
- [ ] モバイル端末で「ホーム画面に追加」からインストールできることを確認
