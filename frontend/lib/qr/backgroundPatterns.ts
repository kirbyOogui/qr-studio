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

// 花びら5枚を中心から均等angle(-90/-18/54/126/198度)に配置した、左右対称な桜の花を1つ描く。
// 一番上の花びらが軸上(真上)に来るため、残り4枚は軸を挟んで自動的に鏡像対称になる。
function sakuraFlower(cx: number, cy: number): string {
  const r = 4.6;
  const petals = [-90, -18, 54, 126, 198]
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const px = (cx + r * Math.cos(rad)).toFixed(2);
      const py = (cy + r * Math.sin(rad)).toFixed(2);
      return `<ellipse cx="${px}" cy="${py}" rx="3.3" ry="2" transform="rotate(${deg} ${px} ${py})"/>`;
    })
    .join("");
  return `${petals}<circle cx="${cx}" cy="${cy}" r="1.6"/>`;
}

// 対称な猫の顔(丸い頭+左右対称な三角の耳+目2つ+鼻+ひげ)を1つ描く。
// 目・鼻・ひげは`featureOpacity`(本体より少し濃い値)を使うことで、低い強度でも
// 顔のパーツが埋没して見えなくならないようにしている。強度が下がれば
// featureOpacityも連動して下がるため、QR安全のための自動減光は損なわれない。
function catFace(cx: number, cy: number, featureOpacity: number): string {
  const r = 9;
  const earBaseX = r * 0.75;
  const earBaseY = r * 0.55;
  const earSpread = r * 0.9 * 0.35;
  const earHeight = r * 0.85;
  const eyeDx = r * 0.35;
  const eyeY = cy - r * 0.05;
  const whiskerY = cy + r * 0.15;
  return `
    <path d="M${cx - earBaseX} ${cy - earBaseY} L${cx - earBaseX - earSpread} ${cy - earBaseY - earHeight} L${cx - r * 0.15} ${cy - r * 0.85} Z"/>
    <circle cx="${cx}" cy="${cy}" r="${r}"/>
    <path d="M${cx + earBaseX} ${cy - earBaseY} L${cx + earBaseX + earSpread} ${cy - earBaseY - earHeight} L${cx + r * 0.15} ${cy - r * 0.85} Z"/>
    <g fill-opacity="${featureOpacity}">
      <circle cx="${(cx - eyeDx).toFixed(2)}" cy="${eyeY.toFixed(2)}" r="1"/>
      <circle cx="${(cx + eyeDx).toFixed(2)}" cy="${eyeY.toFixed(2)}" r="1"/>
      <path d="M${cx} ${(cy + r * 0.1).toFixed(2)} l-1.1 1.4 h2.2 Z"/>
    </g>
    <g stroke-width="0.6" stroke-opacity="${featureOpacity}" fill="none">
      <path d="M${(cx - r * 0.55).toFixed(2)} ${whiskerY.toFixed(2)} l-4.5 -0.8"/>
      <path d="M${(cx - r * 0.55).toFixed(2)} ${(whiskerY + 1.4).toFixed(2)} l-4.5 1.2"/>
      <path d="M${(cx + r * 0.55).toFixed(2)} ${whiskerY.toFixed(2)} l4.5 -0.8"/>
      <path d="M${(cx + r * 0.55).toFixed(2)} ${(whiskerY + 1.4).toFixed(2)} l4.5 1.2"/>
    </g>`;
}

// 符頭2つを上部の梁(はり)でつなぐ「連桁音符(♫)」を1つ描く。旗の代わりに
// 左右対称な梁でつなぐことで、単独の音符では避けられない左右非対称
// (旗は片側にしか付かない)を回避しつつ、実際の音符らしい見た目を保つ。
function beamedNotes(cx: number, cy: number): string {
  const spacing = 11;
  const r = 3.6;
  const stem = 14;
  const n1x = cx - spacing / 2;
  const n2x = cx + spacing / 2;
  const topY = cy - stem;
  return `
    <circle cx="${n1x}" cy="${cy}" r="${r}"/>
    <circle cx="${n2x}" cy="${cy}" r="${r}"/>
    <rect x="${n1x - 1.1}" y="${topY}" width="2.2" height="${stem}"/>
    <rect x="${n2x - 1.1}" y="${topY}" width="2.2" height="${stem}"/>
    <rect x="${n1x - 1.1}" y="${topY}" width="${spacing + 2.2}" height="2.6"/>`;
}

// 中央十字(D-pad)状の左右対称・上下対称なゲームパッドアイコンを1つ描く。
function dpad(cx: number, cy: number, s = 6.5): string {
  return `
    <rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}"/>
    <rect x="${cx - s / 2}" y="${cy - s / 2 - s}" width="${s}" height="${s}"/>
    <rect x="${cx - s / 2}" y="${cy - s / 2 + s}" width="${s}" height="${s}"/>
    <rect x="${cx - s / 2 - s}" y="${cy - s / 2}" width="${s}" height="${s}"/>
    <rect x="${cx - s / 2 + s}" y="${cy - s / 2}" width="${s}" height="${s}"/>`;
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
          ${sakuraFlower(20, 20)}
          ${sakuraFlower(52, 50)}
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
          <circle cx="26" cy="60" r="1.8"/>
          <circle cx="66" cy="14" r="1.6"/>
          <circle cx="10" cy="70" r="1.6"/>
          <circle cx="46" cy="42" r="8"/>
        </g>
        <g fill="none" stroke="#8B7FE8" stroke-opacity="${o}" stroke-width="2.4">
          <ellipse cx="46" cy="42" rx="15" ry="5"/>
        </g>`,
    }),
  },
  {
    key: "cat",
    label: "猫",
    swatchColor: "#C2703D",
    tile: (o) => {
      const featureOpacity = Math.min(o * 3, 0.9);
      return {
        size: 72,
        content: `
          <g fill="#C2703D" fill-opacity="${o}" stroke="#C2703D" stroke-opacity="${o}">
            ${catFace(20, 26, featureOpacity)}
            ${catFace(54, 54, featureOpacity)}
          </g>`,
      };
    },
  },
  {
    key: "game",
    label: "ゲーム",
    swatchColor: "#6D28D9",
    tile: (o) => ({
      size: 48,
      content: `
        <g fill="#6D28D9" fill-opacity="${o}">
          ${dpad(14, 14)}
          ${dpad(36, 36)}
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
        </g>
        <g fill="#FB923C" fill-opacity="${o}">
          <circle cx="58" cy="46" r="2.6"/>
          <circle cx="52" cy="60" r="2"/>
          <circle cx="64" cy="60" r="2"/>
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
          ${beamedNotes(20, 46)}
          ${beamedNotes(48, 18)}
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
