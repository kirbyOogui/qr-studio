/** @type {import('next').NextConfig} */
const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const isDev = process.env.NODE_ENV !== "production";

// このアプリはURL・画像を一切保存しないため、CSPは自ドメインとバックエンドAPIのみを許可する
// 最小構成にしている。インラインスクリプトはNext.jsのハイドレーションに必要な分のみ許可する。
// 開発モードのみ 'unsafe-eval' を許可する: React/Next.jsの開発用ツール(Fast Refresh、
// スタックトレース復元等)がeval()を使用するため、本番相当のCSPのままだと
// 開発サーバーがエラー画面しか表示できなくなる。本番ビルドではeval()を使わないため不要。
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // qr-code-stylingはロゴ画像(data URL)をfetch()で読み込むため、data:を許可しないと
  // CSPでブロックされ、画像読み込みが完了せずQR生成処理がフリーズする(実機で確認)。
  `connect-src 'self' ${apiOrigin} data:`,
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
