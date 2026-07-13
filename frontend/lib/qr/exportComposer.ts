import type { DownloadFormat, QrDesignConfig } from "@/types/qr";
import { buildComposedSvg } from "./patternComposer";
import { rasterizeSvgToBlob } from "./svgRaster";

interface ComposeArgs {
  design: QrDesignConfig;
  format: DownloadFormat;
  exportPngBase64: () => Promise<string | null>;
  getRawData: (extension: "png" | "svg" | "webp") => Promise<Blob | null>;
}

/**
 * ダウンロード用のBlobを組み立てる。
 * フレーム・枠線いずれも未使用ならqr-code-stylingの出力をそのまま使い、
 * 使用時はQR画像(無加工)を合成SVGに埋め込んでから書き出す。
 */
export async function composeDownloadBlob({
  design,
  format,
  exportPngBase64,
  getRawData,
}: ComposeArgs): Promise<Blob | null> {
  const needsCompose = design.frameTemplate !== "none" || design.borderEnabled;

  if (!needsCompose) {
    if (format === "pdf") return getRawData("png");
    return getRawData(format);
  }

  const pngBase64 = await exportPngBase64();
  if (!pngBase64) return null;

  const composed = buildComposedSvg(design, `data:image/png;base64,${pngBase64}`);
  if (!composed) return getRawData(format === "pdf" ? "png" : format);

  if (format === "svg") {
    return new Blob([composed.svg], { type: "image/svg+xml" });
  }
  const mime = format === "webp" ? "image/webp" : "image/png";
  return rasterizeSvgToBlob(composed.svg, composed.width, composed.height, mime);
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
