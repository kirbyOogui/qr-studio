// アップロードされたロゴ画像を、ユーザーが指定した範囲で正方形にクロップし、
// 四角/丸の指定形状でマスクしたPNG(data URL)に変換する。
// PNG・JPEG・SVGいずれの入力もCanvas経由で同一パイプラインに揃えることで、
// どんな縦横比・形式の画像が来ても中央配置の正方形ロゴとして扱えるようにする。

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
