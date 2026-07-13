"use client";

import { useId, useRef, useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { Spinner } from "@/components/ui/Spinner";
import { LogoCropper } from "@/components/qr/LogoCropper";
import { LogoTextComposer, type TextLogoDraft } from "@/components/qr/LogoTextComposer";
import { useDragAndDropFile } from "@/hooks/useDragAndDropFile";
import { sniffImageType, MAX_LOGO_FILE_BYTES } from "@/lib/security/fileValidation";
import { sanitizeSvg } from "@/lib/security/svgSanitize";
import { processLogoImage, renderTextLogo, type CropRect } from "@/lib/qr/logoProcessing";
import {
  MAX_LOGO_RATIO_BY_EC,
  LOGO_SIZE_MIN_RATIO,
  LOGO_ERROR_CORRECTION,
  TEXT_LOGO_DEFAULT_HEIGHT_RATIO,
  TEXT_LOGO_DEFAULT_FONT_SCALE,
} from "@/lib/qr/logoConstraints";
import { SAFE_BACKGROUNDS, SAFE_COLORS } from "@/lib/qr/safeColors";
import type { ErrorCorrectionLevel, LogoConfig, LogoShape } from "@/types/qr";

interface LogoUploaderProps {
  logo: LogoConfig | null;
  onChange: (logo: LogoConfig | null) => void;
  errorCorrection: ErrorCorrectionLevel;
  onErrorCorrectionChange: (errorCorrection: ErrorCorrectionLevel) => void;
}

const DEFAULT_SHAPE: LogoShape = "square";
const DEFAULT_SIZE_RATIO = 0.28;
const DEFAULT_TEXT_DRAFT: TextLogoDraft = {
  text: "",
  fontKey: "gothic",
  fillColor: SAFE_BACKGROUNDS[0]!.color,
  textColor: SAFE_COLORS[0]!.color,
  shape: DEFAULT_SHAPE,
  heightRatio: TEXT_LOGO_DEFAULT_HEIGHT_RATIO,
  bold: true,
  italic: false,
  outlineOnly: false,
  fontScale: TEXT_LOGO_DEFAULT_FONT_SCALE,
};

interface PendingUpload {
  sourceDataUrl: string;
  fileName: string;
  initialCrop?: CropRect;
}

// ロゴの「元になった情報」。形状(四角/丸)を切り替えたり再編集したりするたびに
// ここから再生成する(logo.dataUrlは既に加工・描画済みのため再利用できない)。
type LogoSource =
  | { type: "image"; sourceDataUrl: string; crop: CropRect }
  | {
      type: "text";
      text: string;
      fontKey: TextLogoDraft["fontKey"];
      fillColor: string;
      textColor: string;
      heightRatio: number;
      bold: boolean;
      italic: boolean;
      outlineOnly: boolean;
      fontScale: number;
    };

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
  const [pendingText, setPendingText] = useState<TextLogoDraft | null>(null);
  const [logoSource, setLogoSource] = useState<LogoSource | null>(null);
  // テキストロゴの編集セッションを開始する直前の状態。「キャンセル」時に
  // ここへ戻す(編集中は即時反映するため、それ以外に取り消す手段が無いため)。
  const [textEditSnapshot, setTextEditSnapshot] = useState<{
    logo: LogoConfig | null;
    logoSource: LogoSource | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const maxSizeRatio = MAX_LOGO_RATIO_BY_EC[errorCorrection];

  const promoteToBestErrorCorrection = () => {
    // ロゴを初めて追加するときは、誤り訂正の余力が最も大きいレベルに引き上げて
    // ロゴを安全に大きく載せられるようにする(Mのままだと20%までしか許容されず
    // 見た目より優先して自動的に縮小されてしまうため)。
    if (errorCorrection !== LOGO_ERROR_CORRECTION) {
      onErrorCorrectionChange(LOGO_ERROR_CORRECTION);
    }
  };

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
      setLogoSource({ type: "image", sourceDataUrl, crop });
      onChange({ dataUrl, sizeRatio: logo?.sizeRatio ?? DEFAULT_SIZE_RATIO, fileName, shape });
      if (isFirstLogo) promoteToBestErrorCorrection();
    } catch {
      setError("画像の処理に失敗しました。別の画像でお試しください。");
    } finally {
      setIsProcessing(false);
      setPendingUpload(null);
    }
  };

  const handleCropCancel = () => setPendingUpload(null);

  // テキストロゴは「適用」ボタンを待たず、1項目変更するたびに実際のロゴへ
  // 即時反映する(キー入力やボタン操作の結果がすぐQRプレビューに出るようにするため)。
  const handleTextChange = (draft: TextLogoDraft) => {
    const trimmed = draft.text.trim();
    if (!trimmed) return;
    const isFirstLogo = !logo;
    try {
      const dataUrl = renderTextLogo({ ...draft, text: trimmed });
      setLogoSource({
        type: "text",
        text: trimmed,
        fontKey: draft.fontKey,
        fillColor: draft.fillColor,
        textColor: draft.textColor,
        heightRatio: draft.heightRatio,
        bold: draft.bold,
        italic: draft.italic,
        outlineOnly: draft.outlineOnly,
        fontScale: draft.fontScale,
      });
      onChange({
        dataUrl,
        sizeRatio: logo?.sizeRatio ?? DEFAULT_SIZE_RATIO,
        fileName: trimmed,
        shape: draft.shape,
      });
      if (isFirstLogo) promoteToBestErrorCorrection();
    } catch {
      setError("テキストロゴの作成に失敗しました。");
    }
  };

  const handleTextCancel = () => {
    if (textEditSnapshot) {
      onChange(textEditSnapshot.logo);
      setLogoSource(textEditSnapshot.logoSource);
    }
    setPendingText(null);
    setTextEditSnapshot(null);
  };

  const handleTextDone = () => {
    setPendingText(null);
    setTextEditSnapshot(null);
  };

  const handleStartTextLogo = () => {
    setError(null);
    setTextEditSnapshot({ logo, logoSource });
    setPendingText(
      logoSource?.type === "text"
        ? {
            text: logoSource.text,
            fontKey: logoSource.fontKey,
            fillColor: logoSource.fillColor,
            textColor: logoSource.textColor,
            shape: logo?.shape ?? DEFAULT_SHAPE,
            heightRatio: logoSource.heightRatio,
            bold: logoSource.bold,
            italic: logoSource.italic,
            outlineOnly: logoSource.outlineOnly,
            fontScale: logoSource.fontScale,
          }
        : DEFAULT_TEXT_DRAFT,
    );
  };

  const handleEdit = () => {
    if (!logo) return;
    if (logoSource?.type === "text") {
      setTextEditSnapshot({ logo, logoSource });
      setPendingText({
        text: logoSource.text,
        fontKey: logoSource.fontKey,
        fillColor: logoSource.fillColor,
        textColor: logoSource.textColor,
        shape: logo.shape,
        heightRatio: logoSource.heightRatio,
        bold: logoSource.bold,
        italic: logoSource.italic,
        outlineOnly: logoSource.outlineOnly,
        fontScale: logoSource.fontScale,
      });
      return;
    }
    if (logoSource?.type === "image") {
      setPendingUpload({ sourceDataUrl: logoSource.sourceDataUrl, fileName: logo.fileName, initialCrop: logoSource.crop });
    } else {
      // 元情報を保持していない場合(再訪時など)は、現在の加工済み画像を対象にする。
      setPendingUpload({ sourceDataUrl: logo.dataUrl, fileName: logo.fileName });
    }
  };

  const handleShapeChange = async (shape: LogoShape) => {
    if (!logo || shape === logo.shape) return;

    if (logoSource?.type === "text") {
      try {
        const dataUrl = renderTextLogo({
          text: logoSource.text,
          fontKey: logoSource.fontKey,
          fillColor: logoSource.fillColor,
          textColor: logoSource.textColor,
          heightRatio: logoSource.heightRatio,
          bold: logoSource.bold,
          italic: logoSource.italic,
          outlineOnly: logoSource.outlineOnly,
          fontScale: logoSource.fontScale,
          shape,
        });
        onChange({ ...logo, dataUrl, shape });
      } catch {
        setError("テキストロゴの作成に失敗しました。");
      }
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl =
        logoSource?.type === "image"
          ? await processLogoImage(logoSource.sourceDataUrl, shape, logoSource.crop)
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

  if (pendingText) {
    return (
      <LogoTextComposer
        initial={pendingText}
        onChange={handleTextChange}
        onCancel={handleTextCancel}
        onDone={handleTextDone}
      />
    );
  }

  return (
    <div>
      {logo ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
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
            <button
              type="button"
              onClick={() => {
                setLogoSource(null);
                onChange(null);
              }}
              className="ml-auto min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              削除
            </button>
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-ink/80">切り抜き形状</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => void handleShapeChange("square")}
                aria-pressed={logo.shape === "square"}
                className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
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
                className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
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
                onClick={handleEdit}
                className="min-h-11 rounded-lg border border-black/10 px-4 py-2.5 text-sm font-medium text-ink/60 hover:border-black/20 disabled:opacity-50"
              >
                {logoSource?.type === "text" ? "テキストを編集" : "トリミングを編集"}
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
      ) : (
        <div>
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
          <p className="mt-3 text-center text-sm text-ink/50">
            画像が無くても、
            <button type="button" onClick={handleStartTextLogo} className="text-accent hover:underline">
              テキストでロゴを作成
            </button>
            できます
          </p>
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
