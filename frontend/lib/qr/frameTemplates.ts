import { FONT_STACKS } from "./fonts";
import type { FontKey, FrameTemplateKey } from "@/types/qr";

export const FRAME_TEMPLATES: { value: FrameTemplateKey; label: string }[] = [
  { value: "none", label: "なし" },
  { value: "ribbon", label: "リボン" },
  { value: "speech", label: "吹き出し" },
  { value: "badge", label: "バッジ" },
  { value: "ticket", label: "チケット" },
  { value: "tag", label: "タグ" },
  { value: "polaroid", label: "ポラロイド" },
  { value: "stamp", label: "スタンプ" },
  { value: "pin", label: "ピン" },
  { value: "corner", label: "コーナー" },
];

export const DEFAULT_FRAME_TEXT = "スキャンしてね";

interface BuildFramedSvgArgs {
  template: Exclude<FrameTemplateKey, "none">;
  qrDataUrl: string;
  qrSize: number;
  text: string;
  /** falseの場合、呼びかけテキストを載せる領域を非表示にする(テンプレートによって
   *  「テキストの入れ物ごと消す」か「入れ物は残しテキストだけ消す」かが異なる。
   *  各ビルダー関数のコメントを参照)。 */
  textEnabled: boolean;
  accentColor: string;
  fontKey: FontKey;
}

export interface FramedSvgResult {
  svg: string;
  width: number;
  height: number;
}

/**
 * QRコード本体(qrDataUrl)は一切変形・加工せずそのまま<image>として貼り付け、
 * その「外側」にのみ装飾を描く。これによりどのフレームを選んでも
 * QRの読み取り精度には影響しないことを保証する。
 */
export function buildFramedSvg({
  template,
  qrDataUrl,
  qrSize,
  text,
  textEnabled,
  accentColor,
  fontKey,
}: BuildFramedSvgArgs): FramedSvgResult {
  const fontFamily = FONT_STACKS[fontKey];
  switch (template) {
    case "ribbon":
      return buildRibbonFrame(qrDataUrl, qrSize, text, textEnabled, accentColor, fontFamily);
    case "speech":
      return buildSpeechFrame(qrDataUrl, qrSize, text, textEnabled, accentColor, fontFamily);
    case "badge":
      return buildBadgeFrame(qrDataUrl, qrSize, text, textEnabled, accentColor, fontFamily);
    case "ticket":
      return buildTicketFrame(qrDataUrl, qrSize, text, textEnabled, accentColor, fontFamily);
    case "tag":
      return buildTagFrame(qrDataUrl, qrSize, text, textEnabled, accentColor, fontFamily);
    case "polaroid":
      return buildPolaroidFrame(qrDataUrl, qrSize, text, textEnabled, accentColor, fontFamily);
    case "stamp":
      return buildStampFrame(qrDataUrl, qrSize, text, textEnabled, accentColor, fontFamily);
    case "pin":
      return buildPinFrame(qrDataUrl, qrSize, text, textEnabled, accentColor, fontFamily);
    case "corner":
      return buildCornerFrame(qrDataUrl, qrSize, text, textEnabled, accentColor, fontFamily);
  }
}

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let maskIdCounter = 0;
function nextMaskId(prefix: string): string {
  maskIdCounter += 1;
  return `${prefix}-${maskIdCounter}`;
}

function buildRibbonFrame(
  qrDataUrl: string,
  qrSize: number,
  text: string,
  textEnabled: boolean,
  accentColor: string,
  fontFamily: string,
): FramedSvgResult {
  const pad = Math.round(qrSize * 0.07);
  const bannerHeight = Math.round(qrSize * 0.2);
  const width = qrSize + pad * 2;
  const height = qrSize + pad * 2 + bannerHeight;
  const cardRadius = Math.round(qrSize * 0.06);
  const bannerY = pad + qrSize + Math.round(pad * 0.4);
  const fontSize = Math.max(14, Math.round(bannerHeight * 0.42));

  // リボンの帯自体がこのテンプレートの主役の装飾なので、テキストをオフにしても
  // 帯の形は残し、中の文字だけを消す(空のリボン帯として成立する)。
  // 帯の左右の先端は矢羽根状にカットするだけにとどめ、以前あった
  // 帯から浮いて見える別パーツの「しっぽ」三角形は描かない。
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${pad * 2 + qrSize}" rx="${cardRadius}" fill="#FFFFFF"/>
  <image href="${qrDataUrl}" x="${pad}" y="${pad}" width="${qrSize}" height="${qrSize}"/>
  <polygon points="${width * 0.14},${bannerY} ${width * 0.86},${bannerY} ${width * 0.94},${bannerY + bannerHeight / 2} ${width * 0.86},${bannerY + bannerHeight} ${width * 0.14},${bannerY + bannerHeight} ${width * 0.06},${bannerY + bannerHeight / 2}" fill="${accentColor}"/>
  ${textEnabled ? `<text x="${width / 2}" y="${bannerY + bannerHeight / 2}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">${escapeXml(text)}</text>` : ""}
</svg>`;

  return { svg, width, height };
}

function buildSpeechFrame(
  qrDataUrl: string,
  qrSize: number,
  text: string,
  textEnabled: boolean,
  accentColor: string,
  fontFamily: string,
): FramedSvgResult {
  const pad = Math.round(qrSize * 0.09);
  const tailHeight = Math.round(qrSize * 0.08);
  const strokeWidth = Math.max(3, Math.round(qrSize * 0.012));
  const bubbleRadius = Math.round(qrSize * 0.1);
  const width = qrSize + pad * 2;
  const bubbleHeight = qrSize + pad * 2;
  const labelWidth = Math.round(width * 0.34);
  const labelHeight = Math.round(pad * 1.1);
  // ラベルはバブルの角に重ねず、隙間を空けて上に独立して置く
  // (重ねると角の丸みの位置がずれて二重輪郭に見えてしまうため)。
  const labelGap = textEnabled ? Math.round(qrSize * 0.025) : 0;
  const bubbleTop = textEnabled ? labelHeight + labelGap : 0;
  const height = bubbleTop + bubbleHeight + tailHeight;
  const fontSize = Math.max(12, Math.round(labelHeight * 0.5));
  const cardFill = "#FFFFFF";

  const x0 = strokeWidth / 2;
  const x1 = width - strokeWidth / 2;
  const y0 = bubbleTop + strokeWidth / 2;
  const y1 = bubbleTop + bubbleHeight - strokeWidth / 2;
  const r = bubbleRadius;
  const cx = width / 2;

  // バブル本体としっぽを継ぎ目のない1本のパスとして描く(別パーツを重ねて
  // 継ぎ目を隠す方式だと、線の太さの丸め誤差でズレて見えることがあるため)。
  const bubblePath = `M ${x0 + r} ${y0}
    H ${x1 - r}
    A ${r} ${r} 0 0 1 ${x1} ${y0 + r}
    V ${y1 - r}
    A ${r} ${r} 0 0 1 ${x1 - r} ${y1}
    L ${cx + tailHeight} ${y1}
    L ${cx} ${y1 + tailHeight}
    L ${cx - tailHeight} ${y1}
    L ${x0 + r} ${y1}
    A ${r} ${r} 0 0 1 ${x0} ${y1 - r}
    V ${y0 + r}
    A ${r} ${r} 0 0 1 ${x0 + r} ${y0}
    Z`;

  // 「吹き出しの身」はバブル本体+しっぽのみ。上部のラベルはあくまで付加的な
  // タグなので、テキストをオフにした場合はタグ自体を描画しない
  // (空の入れ物が浮いて見えるのを避けるため)。
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path d="${bubblePath}" fill="${cardFill}" stroke="${accentColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
  <image href="${qrDataUrl}" x="${pad}" y="${bubbleTop + pad}" width="${qrSize}" height="${qrSize}"/>
  ${
    textEnabled
      ? `<rect x="${(width - labelWidth) / 2}" y="0" width="${labelWidth}" height="${labelHeight}" rx="${labelHeight / 2}" fill="${accentColor}"/>
  <text x="${width / 2}" y="${labelHeight / 2}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">${escapeXml(text)}</text>`
      : ""
  }
</svg>`;

  return { svg, width, height };
}

/**
 * 「認証済み」バッジ。SNSの認証済みアカウントアイコンと同じ見た目
 * (丸いカードの角に、白い縁取り+チェックマークの円形バッジを重ねる)を採用し、
 * 「これは公式/確認済みのQRである」という一目で伝わる意味を持たせている。
 * バッジ円はQuiet Zone相当の余白(pad)の内側にのみ重なるよう半径を抑えているため、
 * QR本体のモジュールには一切重ならない。
 */
function buildBadgeFrame(
  qrDataUrl: string,
  qrSize: number,
  text: string,
  textEnabled: boolean,
  accentColor: string,
  fontFamily: string,
): FramedSvgResult {
  const pad = Math.round(qrSize * 0.1);
  const bodySide = qrSize + pad * 2;
  const cardRadius = Math.round(qrSize * 0.08);
  const badgeRadius = Math.round(pad * 0.8);
  const badgeRingWidth = Math.max(2, Math.round(badgeRadius * 0.16));
  const outerMargin = badgeRadius;
  const captionHeight = textEnabled ? Math.round(qrSize * 0.12) : 0;
  const captionGap = textEnabled ? Math.round(qrSize * 0.03) : 0;
  const width = bodySide + outerMargin;
  const height = bodySide + outerMargin + captionGap + captionHeight;
  const fontSize = Math.max(12, Math.round(captionHeight * 0.55));
  const bx = bodySide;
  const by = bodySide;

  const checkStroke = Math.max(2, Math.round(badgeRadius * 0.22));
  const checkPath = `M ${bx - badgeRadius * 0.45} ${by} L ${bx - badgeRadius * 0.1} ${by + badgeRadius * 0.35} L ${bx + badgeRadius * 0.5} ${by - badgeRadius * 0.35}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${bodySide}" height="${bodySide}" rx="${cardRadius}" fill="#FFFFFF"/>
  <image href="${qrDataUrl}" x="${pad}" y="${pad}" width="${qrSize}" height="${qrSize}"/>
  <circle cx="${bx}" cy="${by}" r="${badgeRadius}" fill="#FFFFFF"/>
  <circle cx="${bx}" cy="${by}" r="${badgeRadius - badgeRingWidth}" fill="${accentColor}"/>
  <path d="${checkPath}" fill="none" stroke="#FFFFFF" stroke-width="${checkStroke}" stroke-linecap="round" stroke-linejoin="round"/>
  ${
    textEnabled
      ? `<text x="${bodySide / 2}" y="${bodySide + outerMargin + captionGap + captionHeight / 2}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="${accentColor}">${escapeXml(text)}</text>`
      : ""
  }
</svg>`;

  return { svg, width, height };
}

/**
 * 切手風フレーム。四辺に沿ってミシン目(半円の切り欠き)を並べ、
 * 「スタンプ/切手」であることが形だけで伝わるようにしている。
 * 呼びかけテキストはQR下側の余白(pad)内に収め、フレーム全体の縦横比を
 * qrSize基準の正方形のまま変えない(他のフレームと違い縦に伸びない)。
 */
function buildStampFrame(
  qrDataUrl: string,
  qrSize: number,
  text: string,
  textEnabled: boolean,
  accentColor: string,
  fontFamily: string,
): FramedSvgResult {
  const pad = Math.round(qrSize * 0.13);
  const bodySide = qrSize + pad * 2;
  const perfRadius = Math.max(5, Math.round(qrSize * 0.034));
  const perfSpacing = perfRadius * 2.1;
  const ringWidth = Math.round(qrSize * 0.022);
  const fontSize = Math.max(10, Math.round(pad * 0.4));
  const cardFill = "#FFFFFF";
  const clipId = nextMaskId("stamp-clip");

  // 四辺それぞれの中点を円で「かじり取る」ことで、切手のミシン目(半円の
  // 切り欠き)を再現する。円が辺(0またはbodySide)をまたぐように置くことで、
  // 縁がギザギザの半円の連続になる。白背景の上でも見えるよう、この縁取りは
  // 白いカードではなく差し色(accentColor)のリング(細い縁)として描く。
  const count = Math.max(4, Math.round(bodySide / perfSpacing));
  const step = bodySide / count;
  const circle = (cx: number, cy: number) =>
    `M ${cx + perfRadius} ${cy} A ${perfRadius} ${perfRadius} 0 1 0 ${cx - perfRadius} ${cy} A ${perfRadius} ${perfRadius} 0 1 0 ${cx + perfRadius} ${cy} Z`;
  let bites = "";
  for (let i = 0; i <= count; i += 1) {
    const pos = step * i;
    bites += circle(pos, 0);
    bites += circle(pos, bodySide);
    bites += circle(0, pos);
    bites += circle(bodySide, pos);
  }
  const clipPathD = `M0,0 H${bodySide} V${bodySide} H0 Z ${bites}`;
  // フレームの色を白系にしても縁のミシン目が完全に消えてしまわないよう、
  // 常に見える控えめな黒のベース縁取りを敷き、差し色のリングはひと回り
  // 内側に縮小して重ねる(外周にベースの縁取りが必ず一筋見える)。
  const insetPx = Math.max(1, ringWidth * 0.4);
  const accentScale = (bodySide - insetPx * 2) / bodySide;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bodySide}" height="${bodySide}" viewBox="0 0 ${bodySide} ${bodySide}">
  <defs>
    <clipPath id="${clipId}"><path d="${clipPathD}" clip-rule="evenodd"/></clipPath>
  </defs>
  <g clip-path="url(#${clipId})">
    <rect x="0" y="0" width="${bodySide}" height="${bodySide}" fill="rgba(0,0,0,0.16)"/>
  </g>
  <g clip-path="url(#${clipId})" transform="translate(${insetPx} ${insetPx}) scale(${accentScale})">
    <rect x="0" y="0" width="${bodySide}" height="${bodySide}" fill="${accentColor}"/>
  </g>
  <rect x="${ringWidth}" y="${ringWidth}" width="${bodySide - ringWidth * 2}" height="${bodySide - ringWidth * 2}" fill="${cardFill}"/>
  <image href="${qrDataUrl}" x="${pad}" y="${pad}" width="${qrSize}" height="${qrSize}"/>
  ${
    textEnabled
      ? `<text x="${bodySide / 2}" y="${bodySide - pad * 0.42}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="${accentColor}" paint-order="stroke" stroke="rgba(0,0,0,0.25)" stroke-width="${Math.max(1, Math.round(fontSize * 0.08))}">${escapeXml(text)}</text>`
      : ""
  }
</svg>`;

  return { svg, width: bodySide, height: bodySide };
}

/**
 * 地図ピン風フレーム。角丸カードの下端中央に大きな三角の「先端」を
 * つけるだけの単純な形にすることで、吹き出し(小さいしっぽ+上部ラベル)とは
 * はっきり区別できるようにしている。呼びかけテキストは先端の下に
 * 装飾なしのプレーンテキストとして置く。
 */
function buildPinFrame(
  qrDataUrl: string,
  qrSize: number,
  text: string,
  textEnabled: boolean,
  accentColor: string,
  fontFamily: string,
): FramedSvgResult {
  const pad = Math.round(qrSize * 0.09);
  const strokeWidth = Math.max(3, Math.round(qrSize * 0.014));
  const cardRadius = Math.round(qrSize * 0.1);
  const bodySide = qrSize + pad * 2;
  const pointerHeight = Math.round(qrSize * 0.22);
  const pointerWidth = Math.round(bodySide * 0.34);
  const captionHeight = textEnabled ? Math.round(qrSize * 0.12) : 0;
  const captionGap = textEnabled ? Math.round(qrSize * 0.02) : 0;
  const width = bodySide;
  const height = bodySide + pointerHeight + captionGap + captionHeight;
  const fontSize = Math.max(12, Math.round(captionHeight * 0.55));
  const cardFill = "#FFFFFF";
  const cx = width / 2;
  const r = cardRadius;
  const x0 = strokeWidth / 2;
  const x1 = bodySide - strokeWidth / 2;
  const y0 = strokeWidth / 2;
  const y1 = bodySide - strokeWidth / 2;

  // カードと先端を継ぎ目のない1本のパスとして描く(別パーツを重ねて継ぎ目を
  // 隠す方式だと、線の太さの丸め誤差で輪郭がわずかにズレて見えることがあるため)。
  const pinPath = `M ${x0 + r} ${y0}
    H ${x1 - r}
    A ${r} ${r} 0 0 1 ${x1} ${y0 + r}
    V ${y1 - r}
    A ${r} ${r} 0 0 1 ${x1 - r} ${y1}
    L ${cx + pointerWidth / 2} ${y1}
    L ${cx} ${bodySide + pointerHeight - strokeWidth / 2}
    L ${cx - pointerWidth / 2} ${y1}
    L ${x0 + r} ${y1}
    A ${r} ${r} 0 0 1 ${x0} ${y1 - r}
    V ${y0 + r}
    A ${r} ${r} 0 0 1 ${x0 + r} ${y0}
    Z`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path d="${pinPath}" fill="${cardFill}" stroke="${accentColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
  <image href="${qrDataUrl}" x="${pad}" y="${pad}" width="${qrSize}" height="${qrSize}"/>
  ${
    textEnabled
      ? `<text x="${cx}" y="${bodySide + pointerHeight + captionGap + captionHeight / 2}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="${accentColor}">${escapeXml(text)}</text>`
      : ""
  }
</svg>`;

  return { svg, width, height };
}

/**
 * カード面を持たない、四隅の"L字"ブラケットのみのミニマルなフレーム
 * (カメラのビューファインダーのような見た目)。
 */
function buildCornerFrame(
  qrDataUrl: string,
  qrSize: number,
  text: string,
  textEnabled: boolean,
  accentColor: string,
  fontFamily: string,
): FramedSvgResult {
  const gap = Math.round(qrSize * 0.06);
  const bracketLen = Math.round(qrSize * 0.16);
  const strokeWidth = Math.max(3, Math.round(qrSize * 0.024));
  const pad = gap + strokeWidth;
  const bodySide = qrSize + pad * 2;
  const captionHeight = textEnabled ? Math.round(qrSize * 0.12) : 0;
  const captionGap = textEnabled ? Math.round(qrSize * 0.03) : 0;
  const width = bodySide;
  const height = bodySide + captionGap + captionHeight;
  const fontSize = Math.max(12, Math.round(captionHeight * 0.55));

  const left = pad - gap;
  const top = pad - gap;
  const right = pad + qrSize + gap;
  const bottom = pad + qrSize + gap;

  const brackets = [
    `M ${left} ${top + bracketLen} V ${top} H ${left + bracketLen}`,
    `M ${right - bracketLen} ${top} H ${right} V ${top + bracketLen}`,
    `M ${left} ${bottom - bracketLen} V ${bottom} H ${left + bracketLen}`,
    `M ${right - bracketLen} ${bottom} H ${right} V ${bottom - bracketLen}`,
  ]
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${accentColor}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${brackets}
  <image href="${qrDataUrl}" x="${pad}" y="${pad}" width="${qrSize}" height="${qrSize}"/>
  ${
    textEnabled
      ? `<text x="${width / 2}" y="${bottom + captionGap + captionHeight / 2}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="${accentColor}">${escapeXml(text)}</text>`
      : ""
  }
</svg>`;

  return { svg, width, height };
}

/**
 * 半券の切り取り線(点線+半円の切り欠き)を持つチケット風フレーム。
 * 右側に細いスタブ(半券)を設け、そこに縦書き風の呼びかけテキストを載せる。
 */
function buildTicketFrame(
  qrDataUrl: string,
  qrSize: number,
  text: string,
  textEnabled: boolean,
  accentColor: string,
  fontFamily: string,
): FramedSvgResult {
  const pad = Math.round(qrSize * 0.08);
  const mainHeight = qrSize + pad * 2;
  const stubWidth = Math.round(mainHeight * 0.26);
  const mainWidth = qrSize + pad * 2;
  const width = mainWidth + stubWidth;
  const height = mainHeight;
  const cardRadius = Math.round(qrSize * 0.05);
  const notchRadius = Math.round(mainHeight * 0.09);
  const seamX = mainWidth;
  const fontSize = Math.max(12, Math.round(stubWidth * 0.26));
  const cardFill = "#FFFFFF";
  const maskId = nextMaskId("ticket-mask");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <mask id="${maskId}">
      <rect x="0" y="0" width="${width}" height="${height}" rx="${cardRadius}" fill="#FFFFFF"/>
      <circle cx="${seamX}" cy="0" r="${notchRadius}" fill="#000000"/>
      <circle cx="${seamX}" cy="${height}" r="${notchRadius}" fill="#000000"/>
    </mask>
  </defs>
  <g mask="url(#${maskId})">
    <rect x="0" y="0" width="${width}" height="${height}" fill="${cardFill}"/>
    <rect x="${mainWidth}" y="0" width="${stubWidth}" height="${height}" fill="${accentColor}" opacity="0.12"/>
  </g>
  <line x1="${seamX}" y1="${notchRadius * 2}" x2="${seamX}" y2="${height - notchRadius * 2}" stroke="${accentColor}" stroke-width="${Math.max(1.5, Math.round(qrSize * 0.006))}" stroke-dasharray="${Math.round(qrSize * 0.02)} ${Math.round(qrSize * 0.016)}"/>
  <image href="${qrDataUrl}" x="${pad}" y="${pad}" width="${qrSize}" height="${qrSize}"/>
  ${
    textEnabled
      ? `<text x="${mainWidth + stubWidth / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="${accentColor}" transform="rotate(-90 ${mainWidth + stubWidth / 2} ${height / 2})">${escapeXml(text)}</text>`
      : ""
  }
</svg>`;

  return { svg, width, height };
}

/**
 * 値札・荷札風のタグフレーム。上部に紐を通す穴付きの尖った「頭」を配置し、
 * 下部にキャプション帯を設ける。キャプション帯は付加的な要素のため、
 * テキストをオフにした場合は帯ごと非表示にし、タグ本体+穴のみのシンプルな形にする。
 */
function buildTagFrame(
  qrDataUrl: string,
  qrSize: number,
  text: string,
  textEnabled: boolean,
  accentColor: string,
  fontFamily: string,
): FramedSvgResult {
  const pad = Math.round(qrSize * 0.08);
  const bodyWidth = qrSize + pad * 2;
  const flapHeight = Math.round(qrSize * 0.16);
  const flapBaseWidth = Math.round(bodyWidth * 0.32);
  const holeRadius = Math.max(4, Math.round(flapHeight * 0.24));
  const captionHeight = textEnabled ? Math.round(qrSize * 0.14) : 0;
  const cardRadius = Math.round(qrSize * 0.05);
  const fontSize = Math.max(12, Math.round(captionHeight * 0.5));
  const cardFill = "#FFFFFF";
  const maskId = nextMaskId("tag-mask");

  const width = bodyWidth;
  const bodyTop = flapHeight;
  const bodyHeight = qrSize + pad * 2 + captionHeight;
  const height = bodyTop + bodyHeight;

  const flapCenterX = width / 2;
  const flapPath = `M ${flapCenterX - flapBaseWidth / 2} ${flapHeight}
    L ${flapCenterX - flapBaseWidth * 0.12} 0
    L ${flapCenterX + flapBaseWidth * 0.12} 0
    L ${flapCenterX + flapBaseWidth / 2} ${flapHeight}
    Z`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <mask id="${maskId}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#000000"/>
      <path d="${flapPath}" fill="#FFFFFF"/>
      <rect x="0" y="${bodyTop}" width="${width}" height="${bodyHeight}" rx="${cardRadius}" fill="#FFFFFF"/>
      <circle cx="${flapCenterX}" cy="${flapHeight * 0.42}" r="${holeRadius}" fill="#000000"/>
    </mask>
  </defs>
  <g mask="url(#${maskId})">
    <rect x="0" y="0" width="${width}" height="${height}" fill="${cardFill}"/>
  </g>
  <path d="${flapPath}" fill="none" stroke="${accentColor}" stroke-width="${Math.max(1.5, Math.round(qrSize * 0.006))}"/>
  <rect x="0" y="${bodyTop}" width="${width}" height="${bodyHeight}" rx="${cardRadius}" fill="none" stroke="${accentColor}" stroke-width="${Math.max(1.5, Math.round(qrSize * 0.006))}"/>
  <circle cx="${flapCenterX}" cy="${flapHeight * 0.42}" r="${holeRadius}" fill="none" stroke="${accentColor}" stroke-width="${Math.max(1.5, Math.round(qrSize * 0.006))}"/>
  <image href="${qrDataUrl}" x="${pad}" y="${bodyTop + pad}" width="${qrSize}" height="${qrSize}"/>
  ${
    textEnabled
      ? `<rect x="0" y="${bodyTop + pad * 2 + qrSize}" width="${width}" height="${captionHeight}" fill="${accentColor}"/>
  <text x="${width / 2}" y="${bodyTop + pad * 2 + qrSize + captionHeight / 2}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">${escapeXml(text)}</text>`
      : ""
  }
</svg>`;

  return { svg, width, height };
}

/**
 * インスタントカメラの写真風フレーム。上・左右は細い余白、下だけ太いキャプション帯
 * にする定番の「ポラロイド」比率。キャプションが空でも写真そのものとして
 * 成立するため、テキストオフ時は帯を残したまま文字だけ消す。
 */
function buildPolaroidFrame(
  qrDataUrl: string,
  qrSize: number,
  text: string,
  textEnabled: boolean,
  accentColor: string,
  fontFamily: string,
): FramedSvgResult {
  const thinBorder = Math.round(qrSize * 0.05);
  const bottomStrip = Math.round(qrSize * 0.22);
  const width = qrSize + thinBorder * 2;
  const height = thinBorder + qrSize + bottomStrip;
  const fontSize = Math.max(13, Math.round(bottomStrip * 0.26));
  const cardFill = "#FFFFFF";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="${cardFill}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>
  <image href="${qrDataUrl}" x="${thinBorder}" y="${thinBorder}" width="${qrSize}" height="${qrSize}"/>
  ${
    textEnabled
      ? `<text x="${width / 2}" y="${thinBorder + qrSize + bottomStrip / 2}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily}" font-style="italic" font-size="${fontSize}" font-weight="600" fill="${accentColor}">${escapeXml(text)}</text>`
      : ""
  }
</svg>`;

  return { svg, width, height };
}
