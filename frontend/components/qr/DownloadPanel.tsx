"use client";

import { useState, useSyncExternalStore } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { exportPngBlobAsPdf } from "@/lib/qr/pdfExport";
import { composeDownloadBlob, triggerBlobDownload } from "@/lib/qr/exportComposer";
import type { DownloadFormat, QaStatus, QrDesignConfig } from "@/types/qr";

interface DownloadPanelProps {
  design: QrDesignConfig;
  status: QaStatus;
  isUrlProvided: boolean;
  exportPngBase64: () => Promise<string | null>;
  getRawData: (extension: "png" | "svg" | "webp") => Promise<Blob | null>;
}

const FORMAT_OPTIONS: { value: DownloadFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "svg", label: "SVG" },
  { value: "pdf", label: "PDF" },
  { value: "webp", label: "WebP" },
];

// ブラウザが画像ファイルの共有(navigator.share)に対応しているかどうかは
// レンダー中に変化しない値なので、useEffect+setStateではなく
// useSyncExternalStoreで読み取る(SSR時はサーバー用の既定値falseを返す)。
function subscribeNoop() {
  return () => {};
}
function getCanShareFilesSnapshot(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  const testFile = new File([new Blob(["x"], { type: "image/png" })], "test.png", { type: "image/png" });
  return navigator.canShare({ files: [testFile] });
}
function getCanShareFilesServerSnapshot(): boolean {
  return false;
}

export function DownloadPanel({
  design,
  status,
  isUrlProvided,
  exportPngBase64,
  getRawData,
}: DownloadPanelProps) {
  const [format, setFormat] = useState<DownloadFormat>("png");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const canShareFiles = useSyncExternalStore(
    subscribeNoop,
    getCanShareFilesSnapshot,
    getCanShareFilesServerSnapshot,
  );

  const isReady = isUrlProvided && (status === "ready" || status === "degraded");

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await composeDownloadBlob({ design, format, exportPngBase64, getRawData });
      if (!blob) return;

      if (format === "pdf") {
        await exportPngBlobAsPdf(blob, "qr-studio.pdf");
      } else {
        triggerBlobDownload(blob, `qr-studio.${format}`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // 共有は選択中のダウンロード形式に関わらず、共有シートでの互換性が最も高い
      // PNG画像として行う。
      const blob = await composeDownloadBlob({ design, format: "png", exportPngBase64, getRawData });
      if (!blob) return;
      const file = new File([blob], "qr-studio.png", { type: "image/png" });
      await navigator.share({ files: [file], title: "QR Studio" });
    } catch (error) {
      // ユーザーが共有シートを閉じた場合(AbortError)は正常な操作なので無視する。
      if ((error as DOMException)?.name !== "AbortError") throw error;
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Card className="!p-3 flex flex-col items-center gap-1.5 text-center lg:!p-8 lg:gap-4">
      <h2 className="hidden text-[17px] font-semibold text-ink lg:block">ダウンロード</h2>
      <SegmentedControl
        ariaLabel="ダウンロード形式"
        options={FORMAT_OPTIONS}
        value={format}
        onChange={setFormat}
      />
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button
          onClick={handleDownload}
          disabled={!isReady || isDownloading}
          className="w-full sm:w-auto"
        >
          {isDownloading ? "書き出し中…" : `${format.toUpperCase()}でダウンロード`}
        </Button>
        {canShareFiles && (
          <Button
            variant="secondary"
            onClick={handleShare}
            disabled={!isReady || isSharing}
            className="w-full sm:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M7 8l5-5 5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isSharing ? "共有中…" : "共有"}
          </Button>
        )}
      </div>
      {!isUrlProvided && <p className="text-sm text-ink/40">URLを入力すると準備できます</p>}
    </Card>
  );
}
