import { getPattern, intensityOpacity } from "./backgroundPatterns";
import { rasterizeSvgToPngBase64 } from "./svgRaster";
import { buildFramedSvg, type FrameBackgroundFill } from "./frameTemplates";
import type { FrameTemplateKey, PatternIntensity, PatternKey, QrDesignConfig } from "@/types/qr";

export interface ComposedSvgResult {
  svg: string;
  width: number;
  height: number;
}

function buildPatternFill(pattern: PatternKey, intensity: PatternIntensity): FrameBackgroundFill | null {
  if (pattern === "none") return null;
  const def = getPattern(pattern);
  const opacity = intensityOpacity(intensity);
  const { size, content } = def.tile(opacity);
  const patternId = `bg-pattern-${pattern}`;
  return {
    defs: `<pattern id="${patternId}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${content}</pattern>`,
    fillRef: `url(#${patternId})`,
  };
}

/** 背景パターンのみ(フレームなし)の場合の、シンプルな角丸カード。 */
function buildPatternOnlySvg(
  qrDataUrl: string,
  qrSize: number,
  cornerRadiusPx: number,
  fill: FrameBackgroundFill,
): ComposedSvgResult {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${qrSize}" height="${qrSize}" viewBox="0 0 ${qrSize} ${qrSize}">
  <defs>${fill.defs}</defs>
  <clipPath id="pattern-clip"><rect x="0" y="0" width="${qrSize}" height="${qrSize}" rx="${cornerRadiusPx}"/></clipPath>
  <g clip-path="url(#pattern-clip)">
    <rect x="0" y="0" width="${qrSize}" height="${qrSize}" fill="#FFFFFF"/>
    <rect x="0" y="0" width="${qrSize}" height="${qrSize}" fill="${fill.fillRef}"/>
    <image href="${qrDataUrl}" x="0" y="0" width="${qrSize}" height="${qrSize}"/>
  </g>
</svg>`;
  return { svg, width: qrSize, height: qrSize };
}

/**
 * フレーム・背景パターンの合成SVGを組み立てる。両方同時に選択されている場合、
 * フレームの土台(白いカード部分)に背景パターンを敷き込んで一体化する。
 * どちらも未選択の場合はnullを返す(=通常のQR描画のみで合成不要)。
 * QR画像(qrDataUrl)自体は常に無加工のまま<image>として貼り付けるだけなので、
 * 組み合わせに関わらず読み取り精度は変わらない。
 */
export function buildComposedSvg(design: QrDesignConfig, qrDataUrl: string): ComposedSvgResult | null {
  const patternFill = buildPatternFill(design.patternKey, design.patternIntensity);
  const hasFrame = design.frameTemplate !== "none";

  if (!hasFrame && !patternFill) return null;

  if (hasFrame) {
    return buildFramedSvg({
      template: design.frameTemplate as Exclude<FrameTemplateKey, "none">,
      qrDataUrl,
      qrSize: design.sizePx,
      text: design.frameText.trim() || " ",
      textEnabled: design.frameTextEnabled,
      accentColor: design.frameColor,
      backgroundFill: patternFill,
    });
  }

  return buildPatternOnlySvg(qrDataUrl, design.sizePx, design.cornerRadiusPx, patternFill as FrameBackgroundFill);
}

/**
 * 品質チェックやダウンロードなど「実際に読み取り対象となる最終画像」が
 * 必要な場面で使う共通ヘルパー。フレーム・背景パターンいずれも未使用なら
 * 生のQR PNGをそのまま返す。
 */
export async function renderComposedPngBase64(
  design: QrDesignConfig,
  exportPngBase64: () => Promise<string | null>,
): Promise<string | null> {
  const needsCompose = design.frameTemplate !== "none" || design.patternKey !== "none";
  if (!needsCompose) return exportPngBase64();

  const rawBase64 = await exportPngBase64();
  if (!rawBase64) return null;

  const composed = buildComposedSvg(design, `data:image/png;base64,${rawBase64}`);
  if (!composed) return rawBase64;

  return rasterizeSvgToPngBase64(composed.svg, composed.width, composed.height);
}
