// アップロードされたロゴ画像のMIMEスニッフィング・サイズ制限。
// 拡張子ではなくファイルの先頭バイト（マジックナンバー）で種別を判定し、
// 拡張子偽装によるMIMEタイプ詐称を防ぐ。

export const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024; // 5MB
export type SniffedImageType = "png" | "jpeg" | "svg";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

// Blob#arrayBuffer/text はテスト環境(jsdom)での実装差異があるため、
// 実ブラウザ・テスト環境の双方で安定して動くFileReaderベースで読み取る。
function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

export async function sniffImageType(file: File): Promise<SniffedImageType | null> {
  if (file.size === 0 || file.size > MAX_LOGO_FILE_BYTES) {
    return null;
  }

  const headerBuffer = await readBlobAsArrayBuffer(file.slice(0, 8));
  const header = new Uint8Array(headerBuffer);

  if (matchesSignature(header, PNG_SIGNATURE)) return "png";
  if (matchesSignature(header, JPEG_SIGNATURE)) return "jpeg";

  // SVGはテキスト形式のため、先頭部分をデコードしてsvgタグの存在を確認する。
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    const text = await readBlobAsText(file.slice(0, 512));
    if (/<svg[\s>]/i.test(text)) return "svg";
  }

  return null;
}
