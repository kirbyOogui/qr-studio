"use client";

import { useCallback } from "react";
import { useQrDesign } from "@/hooks/useQrDesign";
import { useQrStylingInstance } from "@/hooks/useQrStylingInstance";
import { useQualityAssurance } from "@/hooks/useQualityAssurance";
import { useComposedPreview } from "@/hooks/useComposedPreview";
import { renderComposedPngBase64 } from "@/lib/qr/patternComposer";
import { UrlInputCard } from "@/components/qr/UrlInputCard";
import { QrPreviewCanvas } from "@/components/qr/QrPreviewCanvas";
import { DesignPanel } from "@/components/qr/DesignPanel";
import { LogoUploader } from "@/components/qr/LogoUploader";
import { SizePanel } from "@/components/qr/SizePanel";
import { FramePanel } from "@/components/qr/FramePanel";
import { DownloadPanel } from "@/components/qr/DownloadPanel";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";

export function QrStudio() {
  const {
    design,
    update,
    applyPreset,
    applyCorrections,
    applyContrastCorrection,
    applyFrameTemplate,
    resetDesign,
    isUrlProvided,
  } = useQrDesign();
  const { containerRef, exportPngBase64, getRawData } = useQrStylingInstance(design);

  // 品質チェックには「実際にダウンロードされる最終画像」を渡す必要がある。
  // フレーム使用時は合成後の画像を、それ以外は生のQR画像を使う。
  const qualityCheckImage = useCallback(
    () => renderComposedPngBase64(design, exportPngBase64),
    [design, exportPngBase64],
  );

  const { status } = useQualityAssurance({
    design,
    isUrlProvided,
    exportPngBase64: qualityCheckImage,
    applyCorrections,
    applyContrastCorrection,
  });
  const composedPreview = useComposedPreview(design, exportPngBase64);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-24 pt-10 sm:px-6">
      <UrlInputCard value={design.url} onValidUrl={(url) => update("url", url)} />

      {/* スマホでは「QR・カスタマイズ・ダウンロード」が1画面に収まる専用の
          アプリのような構成にする(PCとはあえて別レイアウト)。QRとダウンロードは
          高さ固定(shrink-0)、カスタマイズ欄だけが残りの高さの中で内部スクロールする。
          PC(lg)幅では、これまで通りの左右2カラム・ページスクロールの構成に戻す。 */}
      <div className="flex h-[100dvh] flex-col gap-3 lg:h-auto lg:flex-row lg:items-start lg:gap-8 lg:justify-center">
        <div className="mx-auto w-full max-w-[120px] shrink-0 sm:max-w-[220px] lg:sticky lg:top-10 lg:mx-0 lg:w-[360px] lg:max-w-none">
          <QrPreviewCanvas
            design={design}
            containerRef={containerRef}
            status={status}
            composedPreview={composedPreview}
          />
        </div>

        <div className="flex w-full min-h-0 flex-1 flex-col gap-3 lg:max-w-md lg:flex-none lg:gap-6">
          <Card className="!p-5 flex min-h-0 flex-1 flex-col overflow-hidden lg:!p-8 lg:max-h-[min(70vh,640px)] lg:flex-none">
            <div className="mb-3 flex shrink-0 items-center justify-between lg:mb-4">
              <h2 className="text-[15px] font-semibold text-ink">QRのカスタマイズ</h2>
              <button
                type="button"
                onClick={resetDesign}
                title="デザインを初期状態に戻す"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:bg-accent/10 hover:text-accent active:scale-95"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M3 12a9 9 0 1 1 3 6.7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 17v-4h4"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                リセット
              </button>
            </div>
            <Tabs
              ariaLabel="編集タブ"
              tabs={[
                {
                  key: "design",
                  label: "デザイン",
                  accentColor: "#0071E3",
                  content: <DesignPanel design={design} onChange={update} />,
                },
                {
                  key: "frame",
                  label: "フレーム",
                  accentColor: "#C1440E",
                  content: (
                    <FramePanel
                      frameTemplate={design.frameTemplate}
                      frameText={design.frameText}
                      frameTextEnabled={design.frameTextEnabled}
                      frameColor={design.frameColor}
                      frameFont={design.frameFont}
                      onChangeTemplate={applyFrameTemplate}
                      onChangeText={(frameText) => update("frameText", frameText)}
                      onChangeTextEnabled={(enabled) => update("frameTextEnabled", enabled)}
                      onChangeColor={(color) => update("frameColor", color)}
                      onChangeFont={(frameFont) => update("frameFont", frameFont)}
                    />
                  ),
                },
                {
                  key: "logo",
                  label: "ロゴ",
                  accentColor: "#0F766E",
                  content: (
                    <LogoUploader
                      logo={design.logo}
                      onChange={(logo) => update("logo", logo)}
                      errorCorrection={design.errorCorrection}
                      onErrorCorrectionChange={(errorCorrection) => update("errorCorrection", errorCorrection)}
                    />
                  ),
                },
                {
                  key: "size",
                  label: "サイズ",
                  accentColor: "#C2185B",
                  content: (
                    <SizePanel
                      sizePreset={design.sizePreset}
                      sizePx={design.sizePx}
                      onSelectPreset={applyPreset}
                    />
                  ),
                },
              ]}
            />
          </Card>
          <div className="shrink-0">
            <DownloadPanel
              design={design}
              status={status}
              isUrlProvided={isUrlProvided}
              exportPngBase64={exportPngBase64}
              getRawData={getRawData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
