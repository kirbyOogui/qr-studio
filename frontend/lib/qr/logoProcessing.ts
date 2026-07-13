// アップロードされたロゴ画像を、ユーザーが指定した範囲で正方形にクロップし、
// 四角/丸の指定形状でマスクしたPNG(data URL)に変換する。
// PNG・JPEG・SVGいずれの入力もCanvas経由で同一パイプラインに揃えることで、
// どんな縦横比・形式の画像が来ても中央配置の正方形ロゴとして扱えるようにする。
// 画像の代わりに短いテキストをロゴとして描画するrenderTextLogoも提供し、
// どちらの経路で作られたロゴも同じPNG data URLとしてLogoConfig.dataUrlに渡せる
// (QR側は画像かテキストかを一切意識しなくてよい)。

import type { FontKey } from "@/types/qr";
import { FONT_STACKS } from "./fonts";
import { TEXT_LOGO_MIN_HEIGHT_RATIO } from "./logoConstraints";

export type LogoShape = "square" | "circle";

/** 元画像の座標系での正方形クロップ範囲(px)。 */
export interface CropRect {
  sx: number;
  sy: number;
  sSize: number;
}

// 元画像の解像度を超えて拡大はしない(ぼやけ防止)。
// 極端に小さいクロップ範囲のみ最低限見られる大きさまで補間し、
// 極端に大きいクロップ範囲は処理速度とデータサイズのために上限で縮小する。
const MIN_OUTPUT_SIZE = 256;
const MAX_OUTPUT_SIZE = 1024;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    image.src = src;
  });
}

function centerSquareCrop(width: number, height: number): CropRect {
  const sSize = Math.min(width, height);
  return { sx: (width - sSize) / 2, sy: (height - sSize) / 2, sSize };
}

/**
 * ロゴ画像を指定範囲でcrop・指定形状でmaskしたPNG data URLを返す。
 * `crop`省略時は中央正方形クロップ(自動)にフォールバックする。
 */
export async function processLogoImage(
  sourceDataUrl: string,
  shape: LogoShape,
  crop?: CropRect,
): Promise<string> {
  const image = await loadImage(sourceDataUrl);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  if (!naturalWidth || !naturalHeight) {
    throw new Error("画像のサイズを取得できませんでした。");
  }

  const { sx, sy, sSize } = crop ?? centerSquareCrop(naturalWidth, naturalHeight);
  const outputSize = Math.round(Math.min(MAX_OUTPUT_SIZE, Math.max(MIN_OUTPUT_SIZE, sSize)));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("この環境では画像処理に対応していません。");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(image, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);

  if (shape === "circle") {
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  return canvas.toDataURL("image/png");
}

export interface TextLogoOptions {
  text: string;
  fontKey: FontKey;
  fillColor: string;
  textColor: string;
  shape: LogoShape;
  /**
   * 幅に対する高さの比率(TEXT_LOGO_MIN_HEIGHT_RATIO〜1)。
   * 1未満にすると縦が狭い横長のロゴになる。circle形状では常に1として扱う
   * (楕円にはしない)。
   */
  heightRatio: number;
  bold: boolean;
  italic: boolean;
  /** trueの場合、文字を塗りつぶさず輪郭線のみで描く(縁取り文字)。 */
  outlineOnly: boolean;
}

// 文字数に関わらず一定の解像度で描く(ベクター的なテキスト描画のため、
// 画像ロゴのように元解像度を気にする必要が無い)。
const TEXT_LOGO_WIDTH = 512;
const TEXT_LOGO_MIN_FONT_SIZE = 14;
// 複数行を並べる際の行間(行の中心間の距離)。
const TEXT_LOGO_LINE_HEIGHT_RATIO = 1.15;
// 1行の実際に視認される文字の高さの概算(fontSizeに対する比率)。
// lineHeightRatioをそのまま「1行あたりの専有高さ」として使うと、行間の
// 余白(leading)を1行しかない場合にも上下に確保してしまい、単発行の
// テキストが必要以上に小さく縮小される原因になっていた。
const TEXT_LOGO_GLYPH_HEIGHT_RATIO = 0.74;

/**
 * 短い(複数行可の)テキストを、塗りつぶした四角/丸の背景の上に中央揃えで
 * 描いたPNG data URLを返す。フォントサイズは指定の幅・高さの両方に収まる
 * 最大値までcanvasの実測(measureText)で段階的に縮小して求めるため、
 * 行数や1行の長さが変わっても背景からはみ出さず、かつ可能な限り大きく描かれる。
 */
export function renderTextLogo({
  text,
  fontKey,
  fillColor,
  textColor,
  shape,
  heightRatio,
  bold,
  italic,
  outlineOnly,
}: TextLogoOptions): string {
  const width = TEXT_LOGO_WIDTH;
  const height =
    shape === "circle" ? width : Math.round(width * Math.min(1, Math.max(TEXT_LOGO_MIN_HEIGHT_RATIO, heightRatio)));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("この環境では画像処理に対応していません。");
  }

  ctx.fillStyle = fillColor;
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, width, height);
  }

  const lines = text.split("\n").map((line) => line.trim());
  if (lines.some((line) => line.length > 0)) {
    // 円形は角の分だけ実効的に使える幅・高さが狭くなるため、内接する正方形相当に絞る。
    const usableWidth = shape === "circle" ? width * 0.68 : width * 0.9;
    const usableHeight = shape === "circle" ? height * 0.68 : height * 0.9;
    const fontFamily = FONT_STACKS[fontKey];
    const fontStyle = italic ? "italic " : "";
    const fontWeight = bold ? "700" : "400";
    const buildFont = (size: number) => `${fontStyle}${fontWeight} ${size}px ${fontFamily}`;
    // 実際に文字ブロックが専有する高さ。1行目はglyphHeightRatio分だけ、
    // 2行目以降は行間(lineHeight)分だけ追加で積み上がる
    // (1行しか無い場合に余分な行間を上下へ持たせないための計算)。
    const blockHeight = (fontSize: number) =>
      fontSize * TEXT_LOGO_GLYPH_HEIGHT_RATIO + (lines.length - 1) * fontSize * TEXT_LOGO_LINE_HEIGHT_RATIO;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 上限は「収まる範囲で最大限大きく」を実測ベースの縮小ループに任せるため、
    // キャンバスサイズそのものから開始する(恣意的な上限比率を設けない)。
    let fontSize = Math.max(width, height);
    while (fontSize > TEXT_LOGO_MIN_FONT_SIZE) {
      ctx.font = buildFont(fontSize);
      const widestLine = Math.max(...lines.map((line) => ctx.measureText(line || " ").width));
      if (widestLine <= usableWidth && blockHeight(fontSize) <= usableHeight) break;
      fontSize -= 2;
    }

    ctx.font = buildFont(fontSize);
    const lineHeight = fontSize * TEXT_LOGO_LINE_HEIGHT_RATIO;
    const firstLineY = height / 2 - blockHeight(fontSize) / 2 + (fontSize * TEXT_LOGO_GLYPH_HEIGHT_RATIO) / 2;

    if (outlineOnly) {
      ctx.strokeStyle = textColor;
      ctx.lineWidth = Math.max(1, fontSize * 0.06);
      ctx.lineJoin = "round";
      lines.forEach((line, index) => {
        ctx.strokeText(line, width / 2, firstLineY + index * lineHeight);
      });
    } else {
      ctx.fillStyle = textColor;
      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, firstLineY + index * lineHeight);
      });
    }
  }

  return canvas.toDataURL("image/png");
}
