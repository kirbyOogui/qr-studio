// PWA用アイコンを手続き的に生成するビルド補助スクリプト（外部ネイティブ依存なし）。
// `npm run generate-icons` で実行する。
// 【注意】2026-07-13以降、public/icons/ 配下の実アイコンはこのスクリプトでは
// なく、独自デザイン画像(QR自動作成ツール直下の"ChatGPT Image ...png")を
// Pillowでリサイズして手動生成したものに差し替え済み。このスクリプトを
// 実行すると、その差し替え後のアイコンが古い手続き生成版で上書きされて
// しまうため、再実行しないこと(再生成が必要な場合は元画像から作り直す)。
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createCanvas } from "./pngEncoder.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "public", "icons");

const ACCENT = [0, 113, 227, 255];
const WHITE = [255, 255, 255, 255];

// public/icons/source.svg のデザイン(512viewBox基準)を手続き的に再現する。
function drawGlyph(canvas, offsetX, offsetY, scale) {
  const s = (v) => v * scale;
  const at = (x, y) => [offsetX + s(x), offsetY + s(y)];

  const square = (x, y, size, radius, dotX, dotY, dotSize, dotRadius) => {
    const [px, py] = at(x, y);
    canvas.fillRoundedRect(px, py, s(size), s(size), s(radius), WHITE);
    const [dx, dy] = at(dotX, dotY);
    canvas.fillRoundedRect(dx, dy, s(dotSize), s(dotSize), s(dotRadius), ACCENT);
  };

  square(120, 120, 88, 16, 152, 152, 24, 4);
  square(304, 120, 88, 16, 336, 152, 24, 4);
  square(120, 304, 88, 16, 152, 336, 24, 4);

  for (const [dx, dy] of [
    [304, 304],
    [356, 304],
    [304, 356],
    [356, 356],
  ]) {
    const [px, py] = at(dx, dy);
    canvas.fillRoundedRect(px, py, s(36), s(36), s(8), WHITE);
  }
}

function generateStandardIcon(size) {
  const canvas = createCanvas(size, size);
  canvas.fillRoundedRect(0, 0, size, size, size * (112 / 512), ACCENT);
  drawGlyph(canvas, 0, 0, size / 512);
  return canvas.toPngBuffer();
}

function generateMaskableIcon(size) {
  const canvas = createCanvas(size, size);
  canvas.fillRect(0, 0, size, size, ACCENT); // maskableはセーフゾーン確保のため角丸なし全面塗り
  const glyphScale = (size * 0.62) / 512;
  const glyphSize = 512 * glyphScale;
  const offset = (size - glyphSize) / 2;
  drawGlyph(canvas, offset, offset, glyphScale);
  return canvas.toPngBuffer();
}

const targets = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "apple-touch-icon.png", size: 180, maskable: false },
  { name: "favicon-32.png", size: 32, maskable: false },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
];

for (const target of targets) {
  const buffer = target.maskable ? generateMaskableIcon(target.size) : generateStandardIcon(target.size);
  writeFileSync(path.join(iconsDir, target.name), buffer);
  console.log(`generated ${target.name}`);
}
