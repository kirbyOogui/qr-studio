import type { ErrorCorrectionLevel } from "@/types/qr";

// backend/app/services/quality_engine.py の _MAX_LOGO_RATIO と同じ値を保つこと。
// Error Correctionレベルごとに安全に載せられるロゴの最大幅比率(QR全体の幅に対する比率)。
// Lはロゴとの併用を想定していない(誤り訂正の余力がほぼ無いため)。
export const MAX_LOGO_RATIO_BY_EC: Record<ErrorCorrectionLevel, number> = {
  L: 0,
  M: 0.18,
  Q: 0.24,
  H: 0.3,
};

export const LOGO_SIZE_MIN_RATIO = 0.1;

// ロゴを初めて追加する際に採用するEC level。
// 誤り訂正の余力が最大(30%)になり、ロゴを最も大きく載せられる。
export const LOGO_ERROR_CORRECTION: ErrorCorrectionLevel = "H";
