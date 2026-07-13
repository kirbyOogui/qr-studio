// アップロードされたロゴ画像を、ユーザーが指定した範囲で正方形にクロップし、
// 四角/丸の指定形状でマスクしたPNG(data URL)に変換する。
// PNG・JPEG・SVGいずれの入力もCanvas経由で同一パイプラインに揃えることで、
// どんな縦横比・形式の画像が来ても中央配置の正方形ロゴとして扱えるようにする。
// 画像の代わりに短いテキストをロゴとして描画するrenderTextLogoも提供し、
// どちらの経路で作られたロゴも同じPNG data URLとしてLogoConfig.dataUrlに渡せる
// (QR側は画像かテキストかを一切意識しなくてよい)。

import type { FontKey } from "@/types/qr";
import { FONT_STACKS } from "./fonts";

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
}

// 文字数に関わらず一定の解像度で描く(ベクター的なテキスト描画のため、
// 画像ロゴのように元解像度を気にする必要が無い)。
const TEXT_LOGO_SIZE = 512;

/**
 * 短いテキストを、塗りつぶした四角/丸の背景の上に中央揃えで描いたPNG data URLを返す。
 * フォントサイズは指定幅に収まるまでcanvasの実測(measureText)で段階的に縮小するため、
 * 何文字入れても背景からはみ出さない。
 */
export function renderTextLogo({ text, fontKey, fillColor, textColor, shape }: TextLogoOptions): string {
  const size = TEXT_LOGO_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("この環境では画像処理に対応していません。");
  }

  ctx.fillStyle = fillColor;
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, size, size);
  }

  const trimmed = text.trim();
  if (trimmed) {
    // 円形は角の分だけ実効的に使える幅が狭くなるため、内接する正方形相当に絞る。
    const usableWidth = shape === "circle" ? size * 0.62 : size * 0.8;
    const maxFontSize = size * 0.5;
    const minFontSize = size * 0.12;
    const fontFamily = FONT_STACKS[fontKey];

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let fontSize = maxFontSize;
    while (fontSize > minFontSize) {
      ctx.font = `700 ${fontSize}px ${fontFamily}`;
      if (ctx.measureText(trimmed).width <= usableWidth) break;
      fontSize -= 2;
    }
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.fillText(trimmed, size / 2, size / 2);
  }

  return canvas.toDataURL("image/png");
}
