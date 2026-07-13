import { rasterizeSvgToPngBase64 } from "./svgRaster";
import { buildFramedSvg } from "./frameTemplates";
import type { FrameTemplateKey, QrDesignConfig } from "@/types/qr";

export interface ComposedSvgResult {
  svg: string;
  width: number;
  height: number;
}

/**
 * フレーム装飾の合成SVGを組み立てる。フレーム未選択の場合はnullを返す
 * (=通常のQR描画のみで合成不要)。QR画像(qrDataUrl)自体は常に無加工の
 * まま<image>として貼り付けるだけなので、フレームの有無に関わらず
 * 読み取り精度は変わらない。
 */
export function buildComposedSvg(design: QrDesignConfig, qrDataUrl: string): ComposedSvgResult | null {
  if (design.frameTemplate === "none") return null;

  return buildFramedSvg({
    template: design.frameTemplate as Exclude<FrameTemplateKey, "none">,
    qrDataUrl,
    qrSize: design.sizePx,
    text: design.frameText.trim() || " ",
    textEnabled: design.frameTextEnabled,
    accentColor: design.frameColor,
    fontKey: design.frameFont,
  });
}

/**
 * 品質チェックやダウンロードなど「実際に読み取り対象となる最終画像」が
 * 必要な場面で使う共通ヘルパー。フレーム未使用なら生のQR PNGをそのまま返す。
 */
export async function renderComposedPngBase64(
  design: QrDesignConfig,
  exportPngBase64: () => Promise<string | null>,
): Promise<string | null> {
  if (design.frameTemplate === "none") return exportPngBase64();

  const rawBase64 = await exportPngBase64();
  if (!rawBase64) return null;

  const composed = buildComposedSvg(design, `data:image/png;base64,${rawBase64}`);
  if (!composed) return rawBase64;

  return rasterizeSvgToPngBase64(composed.svg, composed.width, composed.height);
}
