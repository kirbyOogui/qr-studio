import { rasterizeSvgToPngBase64 } from "./svgRaster";
import { buildFramedSvg, type FrameCardRect } from "./frameTemplates";
import { computeMinBorderSizeRatio } from "./borderConstraints";
import type { FrameTemplateKey, QrDesignConfig } from "@/types/qr";

export interface ComposedSvgResult {
  svg: string;
  width: number;
  height: number;
  /**
   * 枠線を描くべき「カード」部分の矩形。フレーム未使用時はキャンバス全体
   * (=QR画像そのもの)と一致する。フレーム使用時は、リボンの帯やバッジの円
   * などカードからはみ出す装飾を除いた本体部分のみを指す。
   */
  cardRect: FrameCardRect;
  /** カードの縁からQR画像の縁までの、最も狭い辺での余白(px)。 */
  cardMarginPx: number;
}

/**
 * 既存の合成結果の「カード」部分の内側に枠線を重ねる。キャンバスサイズ自体は
 * 一切拡大しない(既存の背景色の領域の中だけで完結させる)。
 *
 * フレーム装飾(リボン・バッジ等)使用時、キャンバス全体にはカードから
 * はみ出す装飾(帯・しっぽ・円・キャプション等)が含まれるため、枠線は
 * キャンバス全体ではなくbase.cardRect(装飾を除いたカード本体)の中だけに
 * 描く。これを怠るとキャンバス全体を囲む四角がはみ出した装飾を突き抜けたり、
 * 装飾の外側の余白ごと囲ってしまい、デザインが崩れて見えてしまう。
 *
 * 「太さ」(borderWidthPx、線そのものの幅)と「大きさ」(sizeRatio、枠線が
 * 描く四角自体の面積)は独立したパラメータ。sizeRatio=1でカードの外周
 * ぎりぎり(strokeを`width/2`だけ内側にオフセットし、外側の端をカードの端に
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
  const { cardRect } = base;
  const clampedRatio = Math.min(1, Math.max(0, sizeRatio));
  const marginX = (cardRect.width * (1 - clampedRatio)) / 2;
  const marginY = (cardRect.height * (1 - clampedRatio)) / 2;
  const inset = borderWidthPx / 2;
  const x = cardRect.x + marginX + inset;
  const y = cardRect.y + marginY + inset;
  const rectWidth = cardRect.width - marginX * 2 - borderWidthPx;
  const rectHeight = cardRect.height - marginY * 2 - borderWidthPx;
  const rx = Math.max(0, cornerRadiusPx * clampedRatio - inset);
  const rect = `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${borderWidthPx}"/>`;
  return { ...base, svg: base.svg.replace("</svg>", `${rect}</svg>`) };
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
          cardRect: { x: 0, y: 0, width: design.sizePx, height: design.sizePx, radius: 0 },
          cardMarginPx: 0,
        };

  if (!design.borderEnabled) return base;

  // design.borderSizeRatioがUI側のクランプより古い/不整合な値であっても、
  // 実際の書き出し・プレビューではここで必ず安全な下限に丸める
  // (QRモジュールに枠線が重ならないことを保証する最後の砦)。
  // cardRectが正方形でない場合(タグのキャプション帯等で縦の方が長い等)、
  // 縦横どちらの辺でも安全側に倒すため、長い方の辺を基準に下限を計算する
  // (短い方の辺は同じ比率でもマージンが相対的に小さくなり、より安全になる)。
  const cardReferenceSizePx = Math.max(base.cardRect.width, base.cardRect.height);
  const safeSizeRatio = Math.max(
    design.borderSizeRatio,
    computeMinBorderSizeRatio(design, cardReferenceSizePx, base.cardMarginPx),
  );

  return wrapWithBorder(base, design.borderWidthPx, design.borderColor, design.cornerRadiusPx, safeSizeRatio);
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
