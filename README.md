# QR Studio

**考えなくても、最高品質のQRコード。**

URLを入力するだけで、誰でも読み取りやすく美しいQRコードを最短30秒で作れるWebアプリです。
QRコードの専門知識（誤り訂正・Quiet Zone・コントラスト等）はすべてシステムが自動で判断し、
ユーザーには一切意識させません。

詳細な設計思想は [docs/architecture.md](docs/architecture.md)、デプロイ手順は
[docs/deployment.md](docs/deployment.md) を参照してください。

## 構成

```
frontend/   Next.js (App Router) + TypeScript + Tailwind CSS + PWA  → Vercel Free
backend/    FastAPI = QR Quality Engine（品質保証エンジン）          → Google Cloud Run (min-instances=0)
docs/       設計・デプロイドキュメント
```

## Stateless（最重要）

URL・QR画像・ロゴ・ダウンロード履歴・Cookie・LocalStorage・DB・Cloud Storage — これらは
**一切保存しません**。バックエンドはリクエスト処理後、画像・URLの参照をメモリ上から即座に破棄し、
アクセスログにもURLや画像データを出力しません。詳細は [docs/architecture.md](docs/architecture.md) を参照。

## ローカル開発

### Backend

```bash
cd backend
python -m venv .venv
./.venv/Scripts/activate  # Windows
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8080
```

テスト:

```bash
pytest
ruff check app tests
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run generate-icons   # PWAアイコンを初回生成（以後は不要）
npm run dev
```

テスト:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

> **Windows環境での既知の注意点**: プロジェクトパスに日本語などの非ASCII文字が含まれていると、
> 一部のNode.jsネイティブアドオン（Next.jsのSWCコンパイラ等）の読み込みで
> `STATUS_ACCESS_VIOLATION` によりクラッシュする既知の環境依存の問題を確認しています。
> これはコードの不具合ではなく、ローカルのNode.js/OS環境固有の問題です。
> 発生した場合は、プロジェクトを英数字のみのパス（例: `C:\dev\qr-studio`）にコピーして
> `npm install` / `npm run dev` を実行してください。Vercel等のLinuxビルド環境では発生しません。

## 品質保証の仕組み

1. フロントエンドが `qr-code-styling` でQRコードをその場で生成・プレビュー
2. 生成画像をバックエンド `/api/v1/qr/quality-check` に送信
3. バックエンドが **OpenCV / pyzbar(zbar) / zxing-cpp** の3エンジンでデコード検証し、
   コントラスト・Quiet Zone・ロゴ被覆率・出力サイズを解析
4. 問題があれば、ユーザーに通知せず補正後パラメータを返却
5. フロントエンドが自動的に再生成・再検証（最大5回収束を試行）
6. 全デコーダーで読み取り可能と判定されたQRコードのみダウンロード可能になる

## セキュリティ

- HTTPS前提、CSP / HSTS / X-Frame-Options / X-Content-Type-Options / Referrer-Policy /
  Permissions-Policy をフロント（`next.config.mjs`）・バックエンド（`SecurityHeadersMiddleware`）
  双方で付与
- URLバリデーション（`javascript:`/`data:`等の危険なスキームを拒否）
- アップロードされたロゴ画像はマジックナンバーによるMIMEスニッフィング + サイズ上限(5MB)
- SVGロゴは`DOMPurify`で`<script>`・イベントハンドラ・`foreignObject`等を除去
- Cloud Run側で`slowapi`によるレート制限、リクエストボディサイズ上限
- URLは検証のためにも一切アウトバウンドでアクセスしない（SSRF対策）

## テスト実施状況

- Backend: pytest 10件（3デコーダーのクロス検証を含む）全て通過、ruff lint通過
- Frontend: Vitest 22件（URL検証・コントラスト計算・サイズプリセット・ファイル検証・SVGサニタイズ）
  全て通過、TypeScript型チェック・ESLint通過、`next build`本番ビルド成功
- 実ブラウザでのインタラクティブ操作（URL入力→デザイン編集→ロゴ追加→ダウンロードの一連の流れ）は
  本セッションの環境ではブラウザ操作ツールが利用できず未検証です。デプロイ後に実機・実ブラウザでの
  最終確認を推奨します。
