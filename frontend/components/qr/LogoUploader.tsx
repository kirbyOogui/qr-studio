"use client";

import { useId, useRef, useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { useDragAndDropFile } from "@/hooks/useDragAndDropFile";
import { sniffImageType, MAX_LOGO_FILE_BYTES } from "@/lib/security/fileValidation";
import { sanitizeSvg } from "@/lib/security/svgSanitize";
import type { LogoConfig } from "@/types/qr";

interface LogoUploaderProps {
  logo: LogoConfig | null;
  onChange: (logo: LogoConfig | null) => void;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function LogoUploader({ logo, onChange }: LogoUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

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

    if (sniffed === "svg") {
      const rawText = await file.text();
      const safeSvg = sanitizeSvg(rawText);
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(safeSvg)))}`;
      onChange({ dataUrl, sizeRatio: 0.2, fileName: file.name });
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    onChange({ dataUrl, sizeRatio: 0.2, fileName: file.name });
  };

  const { isDraggingOver, onDragOver, onDragLeave, onDrop } = useDragAndDropFile({
    onFile: handleFile,
  });

  return (
    <div>
      {logo ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.dataUrl}
            alt={`アップロードされたロゴ: ${logo.fileName}`}
            className="h-16 w-16 rounded-xl border border-black/10 object-contain p-1"
          />
          <div className="flex-1">
            <Slider
              id="logo-size"
              label="ロゴサイズ"
              min={0.1}
              max={0.35}
              step={0.01}
              value={logo.sizeRatio}
              onChange={(sizeRatio) => onChange({ ...logo, sizeRatio })}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
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
