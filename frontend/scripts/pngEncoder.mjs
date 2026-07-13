// 依存ライブラリなし(Node標準のzlibのみ)でRGBAピクセルバッファをPNGにエンコードする最小実装。
// sharp等のネイティブモジュールがビルド環境によっては使用できないため、
// アイコン生成を完全にポータブルにする目的で自前実装している。
import zlib from "node:zlib";

let crcTable;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

export function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  const ihdr = chunk("IHDR", ihdrData);

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // フィルタなし
    rgba.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }
  const idat = chunk("IDAT", zlib.deflateSync(raw));
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

export function createCanvas(width, height) {
  const pixels = new Uint8Array(width * height * 4);
  return {
    width,
    height,
    pixels,
    fillRect(x, y, w, h, [r, g, b, a = 255]) {
      const x0 = Math.max(0, Math.round(x));
      const y0 = Math.max(0, Math.round(y));
      const x1 = Math.min(width, Math.round(x + w));
      const y1 = Math.min(height, Math.round(y + h));
      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          const idx = (py * width + px) * 4;
          pixels[idx] = r;
          pixels[idx + 1] = g;
          pixels[idx + 2] = b;
          pixels[idx + 3] = a;
        }
      }
    },
    fillRoundedRect(x, y, w, h, radius, color) {
      const x0 = Math.round(x);
      const y0 = Math.round(y);
      const x1 = Math.round(x + w);
      const y1 = Math.round(y + h);
      const r = radius;
      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          const inTopLeft = px < x0 + r && py < y0 + r;
          const inTopRight = px >= x1 - r && py < y0 + r;
          const inBottomLeft = px < x0 + r && py >= y1 - r;
          const inBottomRight = px >= x1 - r && py >= y1 - r;
          let inside = true;
          if (inTopLeft) inside = dist(px, py, x0 + r, y0 + r) <= r;
          else if (inTopRight) inside = dist(px, py, x1 - r, y0 + r) <= r;
          else if (inBottomLeft) inside = dist(px, py, x0 + r, y1 - r) <= r;
          else if (inBottomRight) inside = dist(px, py, x1 - r, y1 - r) <= r;
          if (inside && px >= 0 && py >= 0 && px < width && py < height) {
            const idx = (py * width + px) * 4;
            pixels[idx] = color[0];
            pixels[idx + 1] = color[1];
            pixels[idx + 2] = color[2];
            pixels[idx + 3] = color[3] ?? 255;
          }
        }
      }
    },
    toPngBuffer() {
      return encodePng(width, height, Buffer.from(pixels));
    },
  };
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}
