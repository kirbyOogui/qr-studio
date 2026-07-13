import { quietZoneModulesToPx } from "./moduleCount";
import type { QrDesignConfig } from "@/types/qr";

/**
 * 枠線の「大きさ」(borderSizeRatio)がこれより小さくなると、枠線の内側の
 * 端(太さ分を差し引いた位置)がQuiet Zoneを越えて実際のQRモジュールに
 * 重なってしまう。そうならない下限を、現在のQuiet Zone実ピクセル幅と
 * 枠線の太さから逆算する。
 *
 * URL未入力などQuiet Zone幅が計算できない場合は、縮小自体を許可しない
 * (=1を返す)。
 */
export function computeMinBorderSizeRatio(
  design: Pick<QrDesignConfig, "url" | "errorCorrection" | "quietZoneModules" | "sizePx" | "borderWidthPx">,
): number {
  if (!design.url.trim() || design.sizePx <= 0) return 1;

  const quietZonePx = quietZoneModulesToPx(
    design.url,
    design.errorCorrection,
    design.quietZoneModules,
    design.sizePx,
  );
  // 枠線の内側の端がQuiet Zoneの内側境界(=モジュールが始まる位置)を
  // 越えないための、外側からの最大マージン。
  const safeMargin = quietZonePx - design.borderWidthPx;
  if (safeMargin <= 0) return 1;

  return Math.min(1, Math.max(0, 1 - (2 * safeMargin) / design.sizePx));
}
