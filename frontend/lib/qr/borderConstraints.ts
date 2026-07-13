import { quietZoneModulesToPx } from "./moduleCount";
import type { QrDesignConfig } from "@/types/qr";

/**
 * 枠線の「大きさ」(borderSizeRatio)がこれより小さくなると、枠線の内側の
 * 端(太さ分を差し引いた位置)がQuiet Zoneを越えて実際のQRモジュールに
 * 重なってしまう。そうならない下限を、現在のQuiet Zone実ピクセル幅と
 * 枠線の太さから逆算する。
 *
 * フレーム装飾(リボン・バッジ等)使用時は、枠線は「QR画像そのもの」ではなく
 * 一回り大きい「カード」部分(cardWidthPx)の中に描かれ、カードの縁とQR画像の
 * 縁の間には元々フレーム自体の余白(cardMarginPx)がある。この余白もQuiet Zoneと
 * 同様に安全な縮小代として使えるため、両方を合算して下限を計算する。
 * フレーム未使用時はcardWidthPx=design.sizePx・cardMarginPx=0のままでよい
 * (=枠線は直接QR画像を囲むため、従来通りQuiet Zoneのみが安全マージン)。
 *
 * URL未入力などQuiet Zone幅が計算できない場合は、縮小自体を許可しない
 * (=1を返す)。
 */
export function computeMinBorderSizeRatio(
  design: Pick<QrDesignConfig, "url" | "errorCorrection" | "quietZoneModules" | "sizePx" | "borderWidthPx">,
  cardWidthPx: number = design.sizePx,
  cardMarginPx = 0,
): number {
  if (!design.url.trim() || design.sizePx <= 0 || cardWidthPx <= 0) return 1;

  const quietZonePx = quietZoneModulesToPx(
    design.url,
    design.errorCorrection,
    design.quietZoneModules,
    design.sizePx,
  );
  // 枠線の内側の端が「カードの縁の余白+Quiet Zone」の内側境界を
  // 越えないための、カードの縁からの最大マージン。
  const safeMargin = cardMarginPx + quietZonePx - design.borderWidthPx;
  if (safeMargin <= 0) return 1;

  return Math.min(1, Math.max(0, 1 - (2 * safeMargin) / cardWidthPx));
}
