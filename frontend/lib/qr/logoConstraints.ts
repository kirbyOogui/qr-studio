import type { ErrorCorrectionLevel } from "@/types/qr";

// backend/app/services/quality_engine.py の _MAX_LOGO_RATIO と同じ値を保つこと。
// Error Correctionレベルごとに安全に載せられるロゴの最大幅比率(QR全体の幅に対する比率)。
// Lはロゴとの併用を想定していない(誤り訂正の余力がほぼ無いため)。
export const MAX_LOGO_RATIO_BY_EC: Record<ErrorCorrectionLevel, number> = {
  L: 0,
  M: 0.26,
  Q: 0.34,
  H: 0.45,
};

export const LOGO_SIZE_MIN_RATIO = 0.1;

// ロゴを初めて追加する際に採用するEC level。
// 誤り訂正の余力が最大になり、ロゴを最も大きく載せられる。
export const LOGO_ERROR_CORRECTION: ErrorCorrectionLevel = "H";

// テキストロゴに入力できる文字数の上限(改行込み)。ロゴ領域は元々QR全体の
// 一部でしかなく、長い文字列を入れても縮小されて読めなくなるだけなので、
// モノグラム的な短い文字列(例: "SALE"、"祝\n開店"など2〜3行程度)を
// 想定した上限にしている。
export const MAX_TEXT_LOGO_LENGTH = 16;

export const TEXT_LOGO_MIN_HEIGHT_RATIO = 0.4;
export const TEXT_LOGO_DEFAULT_HEIGHT_RATIO = 1;

// 文字サイズは自動計算される最大サイズに対する倍率として持つ(1.0=自動最大)。
// 幅・高さに収まる最大値をベースに、ユーザーが意図的に小さくしたい場合の
// 調整幅を持たせる。
export const TEXT_LOGO_MIN_FONT_SCALE = 0.5;
export const TEXT_LOGO_DEFAULT_FONT_SCALE = 1;
