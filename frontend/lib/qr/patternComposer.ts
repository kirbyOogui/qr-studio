import { rasterizeSvgToPngBase64 } from "./svgRaster";
import { buildFramedSvg } from "./frameTemplates";
import type { FrameTemplateKey, QrDesignConfig } from "@/types/qr";

export interface ComposedSvgResult {
  svg: string;
  width: number;
  height: number;
}

/**
 * 既存の合成結果の外周ぎりぎりに、内側へ収まる形(inset)で枠線を重ねる。
 * strokeをrectの中心線ではなく`width/2`だけ内側にオフセットして描くことで、
 * 枠線の外側の端がちょうどキャンバスの端に一致する(=キャンバスサイズを
 * 一切拡大せず、既存の背景色の領域を削って枠線を描く)。
 */
function wrapWithBorder(
  base: ComposedSvgResult,
  borderWidthPx: number,
  borderColor: string,
  cornerRadiusPx: number,
): ComposedSvgResult {
  const inset = borderWidthPx / 2;
  const rx = Math.max(0, cornerRadiusPx - inset);
  const rect = `<rect x="${inset}" y="${inset}" width="${base.width - borderWidthPx}" height="${base.height - borderWidthPx}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${borderWidthPx}"/>`;
  return { svg: base.svg.replace("</svg>", `${rect}</svg>`), width: base.width, height: base.height };
}

/**
 * フレーム装飾・枠線の合成SVGを組み立てる。どちらも未使用の場合はnullを返す
 * (=通常のQR描画のみで合成不要)。QR画像(qrDataUrl)自体は常に無加工の
 * まま<image>として貼り付けるだけなので、フレーム・枠線の有無に関わらず
 * 読み取り精度は変わらない。
 */
export function buildComposedSvg(design: QrDesignConfig, qrDataUrl: string): ComposedSvgResult | null {
  if (design.frameTemplate === "none" && !design.borderEnabled) return null;

  const base: ComposedSvgResult =
    design.frameTemplate !== "none"
      ? buildFramedSvg({
          template: design.frameTemplate as Exclude<FrameTemplateKey, "none">,
          qrDataUrl,
          qrSize: design.sizePx,
          text: design.frameText.trim() || " ",
          textEnabled: design.frameTextEnabled,
          accentColor: design.frameColor,
          fontKey: design.frameFont,
        })
      : {
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${design.sizePx}" height="${design.sizePx}" viewBox="0 0 ${design.sizePx} ${design.sizePx}"><image href="${qrDataUrl}" x="0" y="0" width="${design.sizePx}" height="${design.sizePx}"/></svg>`,
          width: design.sizePx,
          height: design.sizePx,
        };

  if (!design.borderEnabled) return base;

  return wrapWithBorder(base, design.borderWidthPx, design.borderColor, design.cornerRadiusPx);
}

/**
 * 品質チェックやダウンロードなど「実際に読み取り対象となる最終画像」が
 * 必要な場面で使う共通ヘルパー。フレーム・枠線いずれも未使用なら
 * 生のQR PNGをそのまま返す。
 */
export async function renderComposedPngBase64(
  design: QrDesignConfig,
  exportPngBase64: () => Promise<string | null>,
): Promise<string | null> {
  if (design.frameTemplate === "none" && !design.borderEnabled) return exportPngBase64();

  const rawBase64 = await exportPngBase64();
  if (!rawBase64) return null;

  const composed = buildComposedSvg(design, `data:image/png;base64,${rawBase64}`);
  if (!composed) return rawBase64;

  return rasterizeSvgToPngBase64(composed.svg, composed.width, composed.height);
}
