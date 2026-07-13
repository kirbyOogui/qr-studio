import qrcodegen from "qrcode-generator";
import type { ErrorCorrectionLevel } from "@/types/qr";

/**
 * 実際のQRエンコード結果からモジュール数(1辺)を求める。
 * バックエンド(Python `qrcode`ライブラリ)と同じQR規格アルゴリズムに基づくため、
 * 同一ペイロード・同一Error Correctionレベルであれば同じモジュール数になる。
 */
export function computeModuleCount(payload: string, errorCorrection: ErrorCorrectionLevel): number {
  const qr = qrcodegen(0, errorCorrection);
  qr.addData(payload);
  qr.make();
  return qr.getModuleCount();
}

/** Quiet Zone(モジュール数)を実ピクセルに変換する。 */
export function quietZoneModulesToPx(
  payload: string,
  errorCorrection: ErrorCorrectionLevel,
  quietZoneModules: number,
  sizePx: number,
): number {
  const moduleCount = computeModuleCount(payload, errorCorrection);
  const totalModules = moduleCount + quietZoneModules * 2;
  const modulePx = sizePx / totalModules;
  return Math.round(modulePx * quietZoneModules);
}
