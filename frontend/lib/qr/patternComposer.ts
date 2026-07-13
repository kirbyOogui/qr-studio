import { rasterizeSvgToPngBase64 } from "./svgRaster";
import { buildFramedSvg } from "./frameTemplates";
import type { FrameTemplateKey, QrDesignConfig } from "@/types/qr";

export interface ComposedSvgResult {
  svg: string;
  width: number;
  height: number;
}

/**
 * 既存の合成結果の内側に枠線を重ねる。キャンバスサイズ自体は一切拡大しない
 * (既存の背景色の領域の中だけで完結させる)。
 *
 * 「太さ」(borderWidthPx、線そのものの幅)と「大きさ」(sizeRatio、枠線が
 * 描く四角自体の面積)は独立したパラメータ。sizeRatio=1で外周ぎりぎり
 * (strokeを`width/2`だけ内側にオフセットし、外側の端をキャンバスの端に
 * 一致させる)、1未満にすると四角自体を中央へ縮小させ、外側に背景色の
 * 余白を生む。
 */
function wrapWithBorder(
  base: ComposedSvgResult,
  borderWidthPx: number,
  borderColor: string,
  cornerRadiusPx: number,
  sizeRatio: number,
): ComposedSvgResult {
  const clampedRatio = Math.min(1, Math.max(0, sizeRatio));
  const marginX = (base.width * (1 - clampedRatio)) / 2;
  const marginY = (base.height * (1 - clampedRatio)) / 2;
  const inset = borderWidthPx / 2;
  const x = marginX + inset;
  const y = marginY + inset;
  const rectWidth = base.width - marginX * 2 - borderWidthPx;
  const rectHeight = base.height - marginY * 2 - borderWidthPx;
  const rx = Math.max(0, cornerRadiusPx * clampedRatio - inset);
  const rect = `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${borderWidthPx}"/>`;
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

  return wrapWithBorder(
    base,
    design.borderWidthPx,
    design.borderColor,
    design.cornerRadiusPx,
    design.borderSizeRatio,
  );
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
