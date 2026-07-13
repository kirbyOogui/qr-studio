// 生成したSVG(フレーム・テーマ合成結果)をラスタライズ/Base64化する共通ユーティリティ。

export async function rasterizeSvgToBlob(
  svg: string,
  width: number,
  height: number,
  mime: string,
): Promise<Blob | null> {
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function rasterizeSvgToPngBase64(
  svg: string,
  width: number,
  height: number,
): Promise<string | null> {
  const blob = await rasterizeSvgToBlob(svg, width, height, "image/png");
  if (!blob) return null;
  return blobToBase64(blob);
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
