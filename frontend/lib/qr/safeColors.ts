import type { GradientConfig } from "@/types/qr";

/**
 * QRの前景色として選べる色をあらかじめ検証済みの範囲だけに絞る。
 * 全て白背景に対してWCAGコントラスト比4.5:1以上を確保している
 * (実機検証で、コントラスト不足はモジュールが小さい場合の読み取り失敗の
 * 主要因になることを確認済み)。自由入力の色ピッカーは廃止し、
 * 「読み取りやすさを最優先」でこの中からのみ選べるようにしている。
 */
export interface SafeColorOption {
  key: string;
  label: string;
  color: string;
}

export const SAFE_COLORS: SafeColorOption[] = [
  { key: "black", label: "ブラック", color: "#000000" },
  { key: "charcoal", label: "チャコール", color: "#1F2937" },
  { key: "navy", label: "ネイビー", color: "#0B2545" },
  { key: "indigo", label: "インディゴ", color: "#1E1B4B" },
  { key: "purple", label: "パープル", color: "#6D28D9" },
  { key: "burgundy", label: "バーガンディ", color: "#9E1B32" },
  { key: "pink", label: "ピンク", color: "#C2185B" },
  { key: "brown", label: "ブラウン", color: "#7C4A03" },
  { key: "forest", label: "フォレスト", color: "#2F6F4E" },
  { key: "teal", label: "ティール", color: "#0F766E" },
  { key: "blue", label: "ブルー", color: "#005A9E" },
  { key: "slate", label: "スレート", color: "#334155" },
];

// 背景色も自由入力にはせず、前景色(SAFE_COLORSのどれを選んでも)との組み合わせで
// 常に4.5:1以上を確保できるごく明るい色のみに絞る。
// (SAFE_COLORS全色に対する最小コントラスト比を実際に計算して検証済み: 最も低い
// blush/#FDE8EDでも4.68、他は4.7〜5.5程度の余裕がある)。
export const SAFE_BACKGROUNDS: SafeColorOption[] = [
  { key: "white", label: "ホワイト", color: "#FFFFFF" },
  { key: "softgray", label: "ソフトグレー", color: "#F5F5F7" },
  { key: "cream", label: "クリーム", color: "#F5F1E8" },
  { key: "blush", label: "ブラッシュピンク", color: "#FDE8ED" },
  { key: "sky", label: "スカイブルー", color: "#E4F2FB" },
  { key: "mint", label: "ミント", color: "#E3F5EC" },
  { key: "lemon", label: "レモン", color: "#FBF3D9" },
  { key: "peach", label: "ピーチ", color: "#FDEAE0" },
];

export interface SafeGradientOption {
  key: string;
  label: string;
  gradient: GradientConfig;
}

// 開始色・終了色の全てで、SAFE_BACKGROUNDSのどの背景色に対してもコントラスト比
// 4.5:1以上を確保できることを実際に計算して検証済み(最も低い組み合わせでも4.6程度)。
// 加えて、開始色と終了色は明度(Lightness)の差を意図的に大きく取っている
// (以前の版は両端とも中間的な暗さの色相違いだけで、コントラスト制約の都合上
// 「地味で変化が分かりにくい」グラデーションになっていた不具合の修正)。
// ただし暗い側をほぼ黒(Lightness 10〜14%)にすると「黒っぽくて暗い」という
// 印象になってしまったため、彩度を保ったまま明度16〜24%程度の「濃い色」に
// 留め、黒に寄せすぎないようにしている。
// 色相もわずかにずらしてあり、単なる濃淡ではなく色味の変化も感じられるようにしている。
export const SAFE_GRADIENTS: SafeGradientOption[] = [
  {
    key: "sunset",
    label: "サンセット",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#B24A16" },
        { offset: 1, color: "#6D0D1D" },
      ],
    },
  },
  {
    key: "ocean",
    label: "オーシャン",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#137488" },
        { offset: 1, color: "#0C2A64" },
      ],
    },
  },
  {
    key: "grape",
    label: "グレープ",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#BC17AF" },
        { offset: 1, color: "#361169" },
      ],
    },
  },
  {
    key: "forest",
    label: "フォレスト",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#417719" },
        { offset: 1, color: "#104129" },
      ],
    },
  },
  // ここから下は上記4色より全体的に明るい「ブライト」系。安全に選べる色の
  // 中で最も明るい色(コントラスト比4.5:1ぎりぎり)同士を組み合わせるだけだと
  // 両端がほぼ同じ明るさになり内部コントラストが失われる(=地味に見える)ため、
  // 片方は安全上限の明るさ、もう片方はそれより少し濃いめの色にして
  // 変化を保っている。ただし濃い方も明度30%前後までに留め、黒っぽくは
  // 見えないようにしている。
  {
    key: "sunrise",
    label: "サンライズ",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#A95113" },
        { offset: 1, color: "#841037" },
      ],
    },
  },
  {
    key: "aqua",
    label: "アクア",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#197390" },
        { offset: 1, color: "#122391" },
      ],
    },
  },
  {
    key: "berry",
    label: "ベリー",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#B917B9" },
        { offset: 1, color: "#3B188B" },
      ],
    },
  },
  {
    key: "spring",
    label: "スプリング",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#417719" },
        { offset: 1, color: "#156544" },
      ],
    },
  },
];
