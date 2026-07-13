import type { PatternIntensity, PatternKey } from "@/types/qr";

// 各段階の柄の不透明度。連続スライダーではなく、事前にデコード検証済みの3段階のみを使う。
const INTENSITY_OPACITY: Record<PatternIntensity, number> = {
  0: 0.07,
  1: 0.13,
  2: 0.2,
};

export interface PatternDef {
  key: Exclude<PatternKey, "none">;
  label: string;
  /** UIのスウォッチに使う色(装飾のみ。QRの色には一切影響しない)。 */
  swatchColor: string;
  /** タイル状に敷き詰めるSVGパターンの中身(<pattern>要素の子要素)を返す。 */
  tile: (opacity: number) => { size: number; content: string };
}

export const PATTERNS: PatternDef[] = [
  {
    key: "sakura",
    label: "桜",
    swatchColor: "#F472B6",
    tile: (o) => ({
      size: 72,
      content: `
        <g fill="#F472B6" fill-opacity="${o}">
          <path d="M18 10c3 0 5 3 5 6s-2 6-5 6-5-3-5-6 2-6 5-6z"/>
          <path d="M54 30c3 0 5 3 5 6s-2 6-5 6-5-3-5-6 2-6 5-6z"/>
          <path d="M8 48c3 0 5 3 5 6s-2 6-5 6-5-3-5-6 2-6 5-6z"/>
          <path d="M40 58c3 0 5 3 5 6s-2 6-5 6-5-3-5-6 2-6 5-6z"/>
        </g>`,
    }),
  },
  {
    key: "ocean",
    label: "海",
    swatchColor: "#0A7C82",
    tile: (o) => ({
      size: 64,
      content: `
        <g stroke="#0A7C82" stroke-opacity="${o}" stroke-width="3" fill="none">
          <path d="M0 16 Q16 8 32 16 T64 16"/>
          <path d="M0 40 Q16 32 32 40 T64 40"/>
          <path d="M0 58 Q16 50 32 58 T64 58"/>
        </g>`,
    }),
  },
  {
    key: "space",
    label: "宇宙",
    swatchColor: "#8B7FE8",
    tile: (o) => ({
      size: 80,
      content: `
        <g fill="#8B7FE8" fill-opacity="${o}">
          <circle cx="12" cy="14" r="2.4"/>
          <circle cx="46" cy="8" r="1.6"/>
          <circle cx="64" cy="36" r="2.2"/>
          <circle cx="26" cy="48" r="1.8"/>
          <circle cx="58" cy="66" r="2.4"/>
          <circle cx="10" cy="70" r="1.6"/>
          <path d="M70 12a10 10 0 1 0 0 14 8 8 0 1 1 0-14z"/>
        </g>`,
    }),
  },
  {
    key: "cat",
    label: "猫",
    swatchColor: "#C2703D",
    tile: (o) => ({
      size: 72,
      content: `
        <g fill="#C2703D" fill-opacity="${o}">
          <path d="M16 20c-2-4-1-8 2-9 1 3 2 5 4 6 2-1 3-3 4-6 3 1 4 5 2 9-2 3-6 5-6 5s-4-2-6-5z"/>
          <circle cx="20" cy="26" r="6"/>
          <path d="M50 46c-2-4-1-8 2-9 1 3 2 5 4 6 2-1 3-3 4-6 3 1 4 5 2 9-2 3-6 5-6 5s-4-2-6-5z"/>
          <circle cx="54" cy="52" r="6"/>
        </g>`,
    }),
  },
  {
    key: "game",
    label: "ゲーム",
    swatchColor: "#6D28D9",
    tile: (o) => ({
      size: 40,
      content: `
        <g fill="#6D28D9" fill-opacity="${o}">
          <rect x="4" y="4" width="8" height="8"/>
          <rect x="20" y="4" width="8" height="8"/>
          <rect x="12" y="12" width="8" height="8"/>
          <rect x="28" y="20" width="8" height="8"/>
          <rect x="4" y="28" width="8" height="8"/>
        </g>`,
    }),
  },
  {
    key: "wagara",
    label: "和柄",
    swatchColor: "#B8860B",
    tile: (o) => ({
      size: 56,
      content: `
        <g stroke="#B8860B" stroke-opacity="${o}" stroke-width="2" fill="none">
          <path d="M28 2 L54 16 L54 40 L28 54 L2 40 L2 16 Z"/>
          <path d="M28 2 L28 54 M2 16 L54 40 M54 16 L2 40"/>
        </g>`,
    }),
  },
  {
    key: "snow",
    label: "雪",
    swatchColor: "#60A5FA",
    tile: (o) => ({
      size: 60,
      content: `
        <g stroke="#60A5FA" stroke-opacity="${o}" stroke-width="2" stroke-linecap="round">
          <path d="M20 6 L20 26 M11 11 L29 21 M29 11 L11 21"/>
          <path d="M48 32 L48 52 M39 37 L57 47 M57 37 L39 47"/>
        </g>`,
    }),
  },
  {
    key: "autumn",
    label: "紅葉",
    swatchColor: "#D97706",
    tile: (o) => ({
      size: 68,
      content: `
        <g fill="#D97706" fill-opacity="${o}">
          <path d="M20 8 L24 18 L34 16 L26 24 L32 32 L20 28 L8 32 L14 24 L6 16 L16 18 Z"/>
          <path d="M50 34 L54 44 L64 42 L56 50 L62 58 L50 54 L38 58 L44 50 L36 42 L46 44 Z"/>
        </g>`,
    }),
  },
  {
    key: "fireworks",
    label: "花火",
    swatchColor: "#FB923C",
    tile: (o) => ({
      size: 84,
      content: `
        <g stroke="#FB923C" stroke-opacity="${o}" stroke-width="2" stroke-linecap="round">
          <path d="M20 4 L20 36 M4 20 L36 20 M9 9 L31 31 M31 9 L9 31"/>
          <circle cx="60" cy="56" r="3" fill="#FB923C" fill-opacity="${o}" stroke="none"/>
          <circle cx="70" cy="46" r="2" fill="#FB923C" fill-opacity="${o}" stroke="none"/>
          <circle cx="50" cy="66" r="2" fill="#FB923C" fill-opacity="${o}" stroke="none"/>
        </g>`,
    }),
  },
  {
    key: "heart",
    label: "ハート",
    swatchColor: "#FB7185",
    tile: (o) => ({
      size: 56,
      content: `
        <g fill="#FB7185" fill-opacity="${o}">
          <path d="M16 12c-3-4-9-2-9 3 0 5 9 11 9 11s9-6 9-11c0-5-6-7-9-3z"/>
          <path d="M44 32c-2.4-3.2-7.2-1.6-7.2 2.4 0 4 7.2 8.8 7.2 8.8s7.2-4.8 7.2-8.8c0-4-4.8-5.6-7.2-2.4z"/>
        </g>`,
    }),
  },
  {
    key: "music",
    label: "音符",
    swatchColor: "#22D3EE",
    tile: (o) => ({
      size: 64,
      content: `
        <g fill="#22D3EE" fill-opacity="${o}">
          <path d="M20 8 L20 30a5 5 0 1 1-3-4.6V12l8-2v18a5 5 0 1 1-3-4.6V8z"/>
          <path d="M46 30 L46 52a5 5 0 1 1-3-4.6V34l8-2v18a5 5 0 1 1-3-4.6V30z"/>
        </g>`,
    }),
  },
  {
    key: "forest",
    label: "森",
    swatchColor: "#15803D",
    tile: (o) => ({
      size: 68,
      content: `
        <g fill="#15803D" fill-opacity="${o}">
          <path d="M18 6 L28 22 L23 22 L30 34 L6 34 L13 22 L8 22 Z"/>
          <rect x="16" y="34" width="4" height="8"/>
          <path d="M48 20 L56 32 L52 32 L58 42 L38 42 L44 32 L40 32 Z"/>
          <rect x="46" y="42" width="4" height="7"/>
        </g>`,
    }),
  },
];

export function getPattern(key: Exclude<PatternKey, "none">): PatternDef {
  const pattern = PATTERNS.find((p) => p.key === key);
  if (!pattern) throw new Error(`unknown background pattern: ${key}`);
  return pattern;
}

export function intensityOpacity(intensity: PatternIntensity): number {
  return INTENSITY_OPACITY[intensity];
}

/** はしごの1段階安全な方(不透明度が低い方)へ下げる。既に最も控えめならnullを返す。 */
export function stepDownIntensity(intensity: PatternIntensity): PatternIntensity | null {
  if (intensity === 0) return null;
  return (intensity - 1) as PatternIntensity;
}
