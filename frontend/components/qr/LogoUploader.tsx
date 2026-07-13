"use client";

import { useId, useRef, useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { Spinner } from "@/components/ui/Spinner";
import { LogoCropper } from "@/components/qr/LogoCropper";
import { useDragAndDropFile } from "@/hooks/useDragAndDropFile";
import { sniffImageType, MAX_LOGO_FILE_BYTES } from "@/lib/security/fileValidation";
import { sanitizeSvg } from "@/lib/security/svgSanitize";
import { processLogoImage, type CropRect } from "@/lib/qr/logoProcessing";
import { MAX_LOGO_RATIO_BY_EC, LOGO_SIZE_MIN_RATIO, LOGO_ERROR_CORRECTION } from "@/lib/qr/logoConstraints";
import type { ErrorCorrectionLevel, LogoConfig, LogoShape } from "@/types/qr";

interface LogoUploaderProps {
  logo: LogoConfig | null;
  onChange: (logo: LogoConfig | null) => void;
  errorCorrection: ErrorCorrectionLevel;
  onErrorCorrectionChange: (errorCorrection: ErrorCorrectionLevel) => void;
}

const DEFAULT_SHAPE: LogoShape = "square";
const DEFAULT_SIZE_RATIO = 0.24;

interface PendingUpload {
  sourceDataUrl: string;
  fileName: string;
  initialCrop?: CropRect;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function LogoUploader({ logo, onChange, errorCorrection, onErrorCorrectionChange }: LogoUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  // 形状の切り替えや再トリミングのたびに元画像へ戻れるよう、加工前の画像と
  // 最後に確定したトリミング範囲を保持しておく(logo.dataUrlは加工済みのため)。
  const [cropSource, setCropSource] = useState<{ sourceDataUrl: string; crop: CropRect } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const maxSizeRatio = MAX_LOGO_RATIO_BY_EC[errorCorrection];

  const handleFile = async (file: File) => {
    setError(null);
    const sniffed = await sniffImageType(file);
    if (!sniffed) {
      setError("PNG・SVG・JPGのみ、5MB以下でアップロードできます。");
      return;
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      setError("ファイルサイズが上限(5MB)を超えています。");
      return;
    }

    let sourceDataUrl: string;
    if (sniffed === "svg") {
      const rawText = await file.text();
      const safeSvg = sanitizeSvg(rawText);
      sourceDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(safeSvg)))}`;
    } else {
      sourceDataUrl = await readFileAsDataUrl(file);
    }

    setPendingUpload({ sourceDataUrl, fileName: file.name });
  };

  const handleCropConfirm = async (crop: CropRect) => {
    if (!pendingUpload) return;
    const { sourceDataUrl, fileName } = pendingUpload;
    const shape = logo?.shape ?? DEFAULT_SHAPE;
    const isFirstLogo = !logo;
    setIsProcessing(true);
    try {
      const dataUrl = await processLogoImage(sourceDataUrl, shape, crop);
      setCropSource({ sourceDataUrl, crop });
      onChange({ dataUrl, sizeRatio: logo?.sizeRatio ?? DEFAULT_SIZE_RATIO, fileName, shape });
      // ロゴを初めて追加するときは、誤り訂正の余力が最も大きいレベルに引き上げて
      // ロゴを安全に大きく載せられるようにする(Mのままだと18%までしか許容されず
      // 見た目より優先して自動的に縮小されてしまうため)。
      if (isFirstLogo && errorCorrection !== LOGO_ERROR_CORRECTION) {
        onErrorCorrectionChange(LOGO_ERROR_CORRECTION);
      }
    } catch {
      setError("画像の処理に失敗しました。別の画像でお試しください。");
    } finally {
      setIsProcessing(false);
      setPendingUpload(null);
    }
  };

  const handleCropCancel = () => setPendingUpload(null);

  const handleEditCrop = () => {
    if (!logo) return;
    if (cropSource) {
      setPendingUpload({ sourceDataUrl: cropSource.sourceDataUrl, fileName: logo.fileName, initialCrop: cropSource.crop });
    } else {
      // 元画像を保持していない場合(再訪時など)は、現在の加工済み画像を対象にする。
      setPendingUpload({ sourceDataUrl: logo.dataUrl, fileName: logo.fileName });
    }
  };

  const handleShapeChange = async (shape: LogoShape) => {
    if (!logo || shape === logo.shape) return;
    setIsProcessing(true);
    try {
      const dataUrl = cropSource
        ? await processLogoImage(cropSource.sourceDataUrl, shape, cropSource.crop)
        : await processLogoImage(logo.dataUrl, shape);
      onChange({ ...logo, dataUrl, shape });
    } catch {
      setError("画像の処理に失敗しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  const { isDraggingOver, onDragOver, onDragLeave, onDrop } = useDragAndDropFile({
    onFile: handleFile,
  });

  if (pendingUpload) {
    return (
      <LogoCropper
        key={pendingUpload.sourceDataUrl}
        sourceDataUrl={pendingUpload.sourceDataUrl}
        shape={logo?.shape ?? DEFAULT_SHAPE}
        initialCrop={pendingUpload.initialCrop}
        isSubmitting={isProcessing}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    );
  }

  return (
    <div>
      {logo ? (
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo.dataUrl}
              alt={`アップロードされたロゴ: ${logo.fileName}`}
              className={`h-16 w-16 border border-black/10 object-contain p-1 ${
                logo.shape === "circle" ? "rounded-full" : "rounded-xl"
              }`}
            />
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                <Spinner className="h-5 w-5 text-accent" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <span className="mb-2 block text-sm font-medium text-ink/80">切り抜き形状</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void handleShapeChange("square")}
                  aria-pressed={logo.shape === "square"}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    logo.shape === "square"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-black/10 text-ink/60 hover:border-black/20"
                  }`}
                >
                  四角
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void handleShapeChange("circle")}
                  aria-pressed={logo.shape === "circle"}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    logo.shape === "circle"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-black/10 text-ink/60 hover:border-black/20"
                  }`}
                >
                  丸
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleEditCrop}
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-ink/60 hover:border-black/20 disabled:opacity-50"
                >
                  トリミングを編集
                </button>
              </div>
            </div>
            <Slider
              id="logo-size"
              label="ロゴサイズ"
              min={LOGO_SIZE_MIN_RATIO}
              max={maxSizeRatio}
              step={0.01}
              value={Math.min(logo.sizeRatio, maxSizeRatio)}
              onChange={(sizeRatio) => onChange({ ...logo, sizeRatio })}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setCropSource(null);
              onChange(null);
            }}
            className="text-sm font-medium text-red-500 hover:underline"
          >
            削除
          </button>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            isDraggingOver ? "border-accent bg-accent/5" : "border-black/10"
          }`}
        >
          <p className="text-sm text-ink/60">
            ロゴ画像をドラッグ&ドロップ、または
            <label htmlFor={inputId} className="ml-1 cursor-pointer text-accent hover:underline">
              ファイルを選択
            </label>
          </p>
          <p className="text-xs text-ink/30">PNG・SVG・JPG / 5MBまで</p>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
