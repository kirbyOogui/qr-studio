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

// アップロードされた元画像。「切り抜き形状」の再編集時に、ここから再度
// 切り抜きをやり直す(logo.dataUrlは既に加工・描画済みのため再利用できない)。
interface ImageSource {
  sourceDataUrl: string;
  crop: CropRect;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function ShapeButtons({
  shape,
  onSelect,
  extra,
}: {
  shape: LogoShape;
  onSelect: (shape: LogoShape) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-ink/80">形状</span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect("square")}
          aria-pressed={shape === "square"}
          className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            shape === "square"
              ? "border-accent bg-accent/10 text-accent"
              : "border-black/10 text-ink/60 hover:border-black/20"
          }`}
        >
          四角
        </button>
        <button
          type="button"
          onClick={() => onSelect("circle")}
          aria-pressed={shape === "circle"}
          className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            shape === "circle"
              ? "border-accent bg-accent/10 text-accent"
              : "border-black/10 text-ink/60 hover:border-black/20"
          }`}
        >
          丸
        </button>
        {extra}
      </div>
    </div>
  );
}

export function LogoUploader({ logo, onChange, errorCorrection, onErrorCorrectionChange }: LogoUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  // テキストロゴを作成・編集している間、常に非nullになる(確定前の下書き段階も含む)。
  // 形状・ロゴサイズは画像ロゴと同じ場所で一元管理し、テキスト固有の項目のみを
  // ここで保持する。「適用」ボタンは無く、変更のたびに即座に実際のロゴへ反映する。
  const [textDraft, setTextDraft] = useState<TextLogoDraft | null>(null);
  const [imageSource, setImageSource] = useState<ImageSource | null>(null);
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
      setImageSource({ sourceDataUrl, crop });
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

  // テキストロゴの下書きを更新し、テキストが入力されていれば即座に実際のロゴへ
  // 反映する(「適用」ボタンを待たず、キー入力やボタン操作の結果がすぐQRプレビューに出るようにするため)。
  // 親のonChangeはsetTextDraftの更新関数の外で呼ぶ(別コンポーネントの状態更新を
  // レンダー中に行うとReactの警告になるため)。
  const handleTextDraftChange = (patch: Partial<TextLogoDraft>) => {
    if (!textDraft) return;
    const next = { ...textDraft, ...patch };
    setTextDraft(next);
    const trimmed = next.text.trim();
    if (trimmed) {
      const isFirstLogo = !logo;
      try {
        const dataUrl = renderTextLogo({ ...next, text: trimmed });
        onChange({
          dataUrl,
          sizeRatio: logo?.sizeRatio ?? DEFAULT_SIZE_RATIO,
          fileName: trimmed,
          shape: next.shape,
        });
        if (isFirstLogo) promoteToBestErrorCorrection();
      } catch {
        setError("テキストロゴの作成に失敗しました。");
      }
    }
  };

  const handleStartTextLogo = () => {
    setError(null);
    setTextDraft(DEFAULT_TEXT_DRAFT);
  };

  const handleCancelTextLogo = () => setTextDraft(null);

  const handleDelete = () => {
    setImageSource(null);
    setTextDraft(null);
    onChange(null);
  };

  const handleEditCrop = () => {
    if (!logo) return;
    if (imageSource) {
      setPendingUpload({ sourceDataUrl: imageSource.sourceDataUrl, fileName: logo.fileName, initialCrop: imageSource.crop });
    } else {
      // 元情報を保持していない場合(再訪時など)は、現在の加工済み画像を対象にする。
      setPendingUpload({ sourceDataUrl: logo.dataUrl, fileName: logo.fileName });
    }
  };

  const handleShapeSelect = async (shape: LogoShape) => {
    if (textDraft) {
      handleTextDraftChange({ shape });
      return;
    }
    if (!logo || shape === logo.shape) return;

    setIsProcessing(true);
    try {
      const dataUrl = imageSource
        ? await processLogoImage(imageSource.sourceDataUrl, shape, imageSource.crop)
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
              onClick={handleDelete}
              className="ml-auto min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              削除
            </button>
          </div>

          <ShapeButtons
            shape={logo.shape}
            onSelect={(shape) => void handleShapeSelect(shape)}
            extra={
              !textDraft && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleEditCrop}
                  className="min-h-11 rounded-lg border border-black/10 px-4 py-2.5 text-sm font-medium text-ink/60 hover:border-black/20 disabled:opacity-50"
                >
                  トリミングを編集
                </button>
              )
            }
          />

          {textDraft && <LogoTextComposer draft={textDraft} onChange={handleTextDraftChange} />}

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
      ) : textDraft ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink/80">テキストでロゴを作成</span>
            <button
              type="button"
              onClick={handleCancelTextLogo}
              className="min-h-11 rounded-lg px-3 text-sm font-medium text-ink/40 hover:text-ink/60"
            >
              やめる
            </button>
          </div>

          <ShapeButtons shape={textDraft.shape} onSelect={(shape) => void handleShapeSelect(shape)} />

          <LogoTextComposer draft={textDraft} onChange={handleTextDraftChange} />
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
