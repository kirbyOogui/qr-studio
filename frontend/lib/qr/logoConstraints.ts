import type { ErrorCorrectionLevel } from "@/types/qr";

// backend/app/services/quality_engine.py の _MAX_LOGO_RATIO と同じ値を保つこと。
// Error Correctionレベルごとに安全に載せられるロゴの最大幅比率(QR全体の幅に対する比率)。
// Lはロゴとの併用を想定していない(誤り訂正の余力がほぼ無いため)。
export const MAX_LOGO_RATIO_BY_EC: Record<ErrorCorrectionLevel, number> = {
  L: 0,
  M: 0.2,
  Q: 0.28,
  H: 0.36,
};

export const LOGO_SIZE_MIN_RATIO = 0.1;

// ロゴを初めて追加する際に採用するEC level。
// 誤り訂正の余力が最大になり、ロゴを最も大きく載せられる。
export const LOGO_ERROR_CORRECTION: ErrorCorrectionLevel = "H";

// テキストロゴに入力できる文字数の上限。ロゴ領域は元々QR全体の一部でしかなく、
// 長い文字列を入れても縮小されて読めなくなるだけなので、モノグラム的な
// 短い文字列(絵文字1〜2文字、"SALE"、"祝"など)を想定した上限にしている。
export const MAX_TEXT_LOGO_LENGTH = 6;
