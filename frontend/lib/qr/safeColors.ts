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
// 4.5:1以上を確保できることを実際に計算して検証済み。
//
// 明るい側の色は、白背景に対してWCAG比4.5:1を満たせる理論上の明るさの
// 上限ぎりぎりまで詰めてある(これより明るくすると読み取り安全性の
// 基準を割る)。ここが「これ以上明るくできない」実質的な壁になっている。
// その代わり彩度は100%(純色)にすることで、同じ明るさでもくすんで
// 見えず鮮やかに感じられるようにしている。暗い側も同様に彩度100%の
// 濃い純色にし、黒っぽく見える中間色(グレーがかった暗色)を避けている。
//
// sunset/ocean/grape/forestと、sunrise/aqua/berry/springはそれぞれ
// 似た系統(暖色・寒色・紫系・緑系)のペアだが、明るい側・暗い側とも
// 意図的に異なる色相を選び、単なる濃淡違いの重複にならないようにしている
// (例: sunsetは橙→濃い赤だが、sunriseは金→濃いローズにして別物にしている)。
export const SAFE_GRADIENTS: SafeGradientOption[] = [
  {
    key: "sunset",
    label: "サンセット",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#C33A00" },
        { offset: 1, color: "#7A0014" },
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
        { offset: 0, color: "#00758D" },
        { offset: 1, color: "#001C70" },
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
        { offset: 0, color: "#C200B2" },
        { offset: 1, color: "#33007A" },
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
        { offset: 0, color: "#337A00" },
        { offset: 1, color: "#04442E" },
      ],
    },
  },
  {
    key: "sunrise",
    label: "サンライズ",
    gradient: {
      type: "linear",
      rotationDeg: 45,
      stops: [
        { offset: 0, color: "#9D5B00" },
        { offset: 1, color: "#70002F" },
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
        { offset: 0, color: "#007969" },
        { offset: 1, color: "#39007A" },
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
        { offset: 0, color: "#CF0079" },
        { offset: 1, color: "#001A66" },
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
        { offset: 0, color: "#577400" },
        { offset: 1, color: "#004170" },
      ],
    },
  },
];
