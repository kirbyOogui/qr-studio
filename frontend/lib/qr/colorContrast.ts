// WCAGの相対輝度式に基づくコントラスト比の計算・自動補正。
// バックエンドの品質エンジンが「コントラスト不足」と判定した場合、
// ユーザーには通知せず、この関数で前景色を自動的に暗く・背景色を自動的に明るく調整する。

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized.length === 3
    ? normalized.split("").map((c) => c + c).join("")
    : normalized, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(hexToRgb(foreground));
  const l2 = relativeLuminance(hexToRgb(background));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const MIN_SAFE_CONTRAST = 4.5;
const STEP = 12; // 1回の自動補正で暗く/明るくする量 (0-255スケール)

/** 前景を暗く・背景を明るくすることで、読み取りに十分なコントラストへ段階的に近づける。 */
export function strengthenContrast(
  foreground: string,
  background: string,
): { foreground: string; background: string } {
  if (contrastRatio(foreground, background) >= MIN_SAFE_CONTRAST) {
    return { foreground, background };
  }

  const [fr, fg, fb] = hexToRgb(foreground);
  const [br, bg, bb] = hexToRgb(background);

  const darker = [fr, fg, fb].map((c) => Math.max(0, c - STEP)) as [number, number, number];
  const lighter = [br, bg, bb].map((c) => Math.min(255, c + STEP)) as [number, number, number];

  const toHex = (rgb: [number, number, number]) =>
    "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");

  return { foreground: toHex(darker), background: toHex(lighter) };
}
