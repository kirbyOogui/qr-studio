"use client";

import type { RefObject } from "react";
import type { QrDesignConfig, QaStatus } from "@/types/qr";
import type { ComposedSvgResult } from "@/lib/qr/patternComposer";
import { QualityLoadingOverlay } from "./QualityLoadingOverlay";

interface QrPreviewCanvasProps {
  design: QrDesignConfig;
  containerRef: RefObject<HTMLDivElement | null>;
  status: QaStatus;
  composedPreview: ComposedSvgResult | null;
}

export function QrPreviewCanvas({ design, containerRef, status, composedPreview }: QrPreviewCanvasProps) {
  const altText = design.url ? `${design.url} のQRコード` : "QRコードのプレビュー";
  const hasUrl = design.url.trim().length > 0;
  // qr-code-stylingのインスタンスはURL未入力時も裏側で保持し続ける必要があるため、
  // 表に出さない場合はsr-onlyで隠して描画だけ継続させる。
  const keepInstanceHidden = composedPreview !== null || !hasUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        {composedPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(composedPreview.svg)}`}
            alt={altText}
            style={{
              width: "min(360px, 100%)",
              height: "auto",
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.1))",
            }}
          />
        ) : hasUrl ? (
          // 枠線が有効な場合はcomposedPreview(実際の書き出しと同じ合成SVG)側で
          // 描画されるため、ここに到達するのは枠線・フレームどちらも未使用の
          // 場合のみ。
          <div
            className="flex items-center justify-center p-4 transition-shadow"
            style={{
              width: "min(360px, 100%)",
              // QR本体との間の余白(quiet zone相当)がQRの背景色と別の色に
              // ならないよう、常にdesign.backgroundColorに合わせる(以前は
              // 固定で白だったため、背景色を変えると隙間が見えてしまっていた)。
              backgroundColor: design.backgroundColor,
              borderRadius: `${design.cornerRadiusPx}px`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.08)",
            }}
          >
            {/* qr-code-stylingが挿入するcanvasの実ピクセルサイズ(sizePx)に関わらず、
                表示上は常に親幅いっぱいに収まるよう縮小表示する(書き出し解像度には影響しない)。 */}
            <div
              ref={containerRef}
              role="img"
              aria-label={altText}
              className="w-full [&>canvas]:h-auto [&>canvas]:w-full [&>img]:h-auto [&>img]:w-full"
              style={{ borderRadius: `${Math.max(0, design.cornerRadiusPx - 16)}px`, overflow: "hidden" }}
            />
          </div>
        ) : (
          <div
            className="flex aspect-square flex-col items-center justify-center gap-3 rounded-apple border border-dashed border-accent/25 bg-accent/[0.04] px-6 text-center"
            style={{ width: "min(360px, 100%)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden className="text-accent/50">
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
              <rect x="14.5" y="14.5" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
              <rect x="18.5" y="14.5" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
              <rect x="14.5" y="18.5" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
              <rect x="18.5" y="18.5" width="2.5" height="2.5" rx="0.5" fill="currentColor" />
            </svg>
            <p className="text-sm text-ink/40">
              URLを入力すると
              <br />
              ここにプレビューが表示されます
            </p>
          </div>
        )}
        {keepInstanceHidden && <div ref={containerRef} className="sr-only" aria-hidden />}
        {status === "checking" && <QualityLoadingOverlay />}
      </div>
      {hasUrl && status === "ready" && (
        <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-white py-1.5 pl-1.5 pr-3 text-xs font-medium text-ink shadow-soft">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <svg width="10" height="10" viewBox="0 0 8 8" fill="none">
              <path
                d="M1 4L3 6L7 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          読み取り確認済み
        </span>
      )}
      {status === "degraded" && (
        <p
          role="status"
          className="max-w-xs rounded-full bg-amber-50 px-4 py-2 text-center text-xs text-amber-700"
        >
          品質確認サーバーに接続できませんでした。標準設定でQRコードを表示しています。
        </p>
      )}
    </div>
  );
}
