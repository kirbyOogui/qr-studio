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

// 符頭(楕円)+軸+旗を持つ、実際の八分音符(♪)らしい見た目の音符を1つ描く。
// 音符という記号自体は旗が片側にしか付かない本質的に非対称な形だが、
// タイル内での「配置」はミラー配置にすることで左右対称にする(形は非対称のままでよい)。
function musicNote(cx: number, cy: number): string {
  const r = 4.2;
  const stemH = 16;
  const stemX = cx + r * 0.82;
  const topY = cy - stemH;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${(r * 0.72).toFixed(2)}" transform="rotate(-18 ${cx} ${cy})"/>
    <rect x="${(stemX - 0.9).toFixed(2)}" y="${topY}" width="1.8" height="${stemH + 1}"/>
    <path d="M${(stemX + 0.9).toFixed(2)} ${topY} q6.5 2.2 5.2 8.6 q-3.2 -2.8 -5.2 -1.6 Z"/>`;
}

// ゲームコントローラーのシルエット(丸みを帯びた本体+左にD-pad+右に丸ボタン2つ)を1つ描く。
function gameController(cx: number, cy: number): string {
  const bodyW = 26;
  const bodyH = 14;
  const left = cx - bodyW / 2;
  const top = cy - bodyH / 2;
  const dpadCx = left + 7;
  const s = 3;
  const btn1x = left + bodyW - 9;
  const btn1y = cy - 3;
  const btn2x = left + bodyW - 5;
  const btn2y = cy + 2;
  return `
    <rect x="${left}" y="${top}" width="${bodyW}" height="${bodyH}" rx="6"/>
    <g fill="#fff">
      <rect x="${dpadCx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}"/>
      <rect x="${dpadCx - s / 2}" y="${cy - s / 2 - s}" width="${s}" height="${s}"/>
      <rect x="${dpadCx - s / 2}" y="${cy - s / 2 + s}" width="${s}" height="${s}"/>
      <rect x="${dpadCx - s / 2 - s}" y="${cy - s / 2}" width="${s}" height="${s}"/>
      <rect x="${dpadCx - s / 2 + s}" y="${cy - s / 2}" width="${s}" height="${s}"/>
      <circle cx="${btn1x}" cy="${btn1y}" r="1.6"/>
      <circle cx="${btn2x}" cy="${btn2y}" r="1.6"/>
    </g>`;
}

export const PATTERNS: PatternDef[] = [
  {
    key: "sakura",
    label: "桜",
    swatchColor: "#F472B6",
    // タイル中心線(x=36)を挟んで各段が左右対(同じy・鏡写しのx)になるよう配置。
    tile: (o) => ({
      size: 72,
      content: `
        <g fill="#F472B6" fill-opacity="${o}">
          ${sakuraFlower(20, 18)}
          ${sakuraFlower(52, 18)}
          ${sakuraFlower(20, 54)}
          ${sakuraFlower(52, 54)}
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
    // 惑星をタイル中心線(x=40)の真上に置き、星はその中心線を挟んだ鏡写しのペアで配置。
    tile: (o) => ({
      size: 80,
      content: `
        <g fill="#8B7FE8" fill-opacity="${o}">
          <circle cx="14" cy="12" r="2.2"/>
          <circle cx="66" cy="12" r="2.2"/>
          <circle cx="18" cy="68" r="1.7"/>
          <circle cx="62" cy="68" r="1.7"/>
          <circle cx="40" cy="40" r="8"/>
        </g>
        <g fill="none" stroke="#8B7FE8" stroke-opacity="${o}" stroke-width="2.4">
          <ellipse cx="40" cy="40" rx="15" ry="5" transform="rotate(-20 40 40)"/>
        </g>`,
    }),
  },
  {
    key: "cat",
    label: "猫",
    swatchColor: "#C2703D",
    // タイル中心線(x=36)を挟んで同じ高さに配置。
    tile: (o) => {
      const featureOpacity = Math.min(o * 3, 0.9);
      return {
        size: 72,
        content: `
          <g fill="#C2703D" fill-opacity="${o}" stroke="#C2703D" stroke-opacity="${o}">
            ${catFace(20, 30, featureOpacity)}
            ${catFace(52, 30, featureOpacity)}
          </g>`,
      };
    },
  },
  {
    key: "game",
    label: "ゲーム",
    swatchColor: "#6D28D9",
    // タイル中心線(x=32)を挟んで同じ高さに配置。
    tile: (o) => ({
      size: 64,
      content: `
        <g fill="#6D28D9" fill-opacity="${o}">
          ${gameController(16, 20)}
          ${gameController(48, 20)}
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
    // タイル中心線(x=30)を挟んで同じ高さに配置。
    tile: (o) => ({
      size: 60,
      content: `
        <g stroke="#60A5FA" stroke-opacity="${o}" stroke-width="2" stroke-linecap="round">
          <path d="M20 6 L20 26 M11 11 L29 21 M29 11 L11 21"/>
          <path d="M40 6 L40 26 M31 11 L49 21 M49 11 L31 21"/>
        </g>`,
    }),
  },
  {
    key: "autumn",
    label: "紅葉",
    swatchColor: "#D97706",
    // タイル中心線(x=34)を挟んで同じ高さに配置。
    tile: (o) => ({
      size: 68,
      content: `
        <g fill="#D97706" fill-opacity="${o}">
          <path d="M20 8 L24 18 L34 16 L26 24 L32 32 L20 28 L8 32 L14 24 L6 16 L16 18 Z"/>
          <path d="M48 8 L52 18 L62 16 L54 24 L60 32 L48 28 L36 32 L42 24 L34 16 L44 18 Z"/>
        </g>`,
    }),
  },
  {
    key: "fireworks",
    label: "花火",
    swatchColor: "#FB923C",
    // 大きな打ち上げ花火をタイル中心線(x=42)の真上に置き、飛び散る火花は
    // その中心線を挟んだ鏡写しのペアで配置。
    tile: (o) => ({
      size: 84,
      content: `
        <g stroke="#FB923C" stroke-opacity="${o}" stroke-width="2" stroke-linecap="round">
          <path d="M42 4 L42 36 M26 20 L58 20 M31 9 L53 31 M53 9 L31 31"/>
        </g>
        <g fill="#FB923C" fill-opacity="${o}">
          <circle cx="12" cy="58" r="2.4"/>
          <circle cx="72" cy="58" r="2.4"/>
          <circle cx="18" cy="64" r="1.8"/>
          <circle cx="66" cy="64" r="1.8"/>
        </g>`,
    }),
  },
  {
    key: "heart",
    label: "ハート",
    swatchColor: "#FB7185",
    // タイル中心線(x=28)を挟んで同じ高さ・同じ大きさで配置。
    tile: (o) => ({
      size: 56,
      content: `
        <g fill="#FB7185" fill-opacity="${o}">
          <path d="M16 12c-3-4-9-2-9 3 0 5 9 11 9 11s9-6 9-11c0-5-6-7-9-3z"/>
          <path d="M40 12c-3-4-9-2-9 3 0 5 9 11 9 11s9-6 9-11c0-5-6-7-9-3z"/>
        </g>`,
    }),
  },
  {
    key: "music",
    label: "音符",
    swatchColor: "#22D3EE",
    // タイル中心線(x=32)を挟んで同じ高さに配置(音符の向き自体は非対称のままでよい)。
    tile: (o) => ({
      size: 64,
      content: `
        <g fill="#22D3EE" fill-opacity="${o}">
          ${musicNote(18, 40)}
          ${musicNote(46, 40)}
        </g>`,
    }),
  },
  {
    key: "forest",
    label: "森",
    swatchColor: "#15803D",
    // タイル中心線(x=34)を挟んで同じ高さに配置。
    tile: (o) => ({
      size: 68,
      content: `
        <g fill="#15803D" fill-opacity="${o}">
          <path d="M18 6 L28 22 L23 22 L30 34 L6 34 L13 22 L8 22 Z"/>
          <rect x="16" y="34" width="4" height="8"/>
          <path d="M50 6 L60 22 L55 22 L62 34 L38 34 L45 22 L40 22 Z"/>
          <rect x="48" y="34" width="4" height="8"/>
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
