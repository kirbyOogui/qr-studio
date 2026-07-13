import QRCodeStyling, { type Options as QrStylingOptions } from "qr-code-styling";
import type { QrDesignConfig } from "@/types/qr";
import { quietZoneModulesToPx } from "./moduleCount";

/** QrDesignConfig から qr-code-styling 用のオプションを組み立てる。 */
export function buildQrStylingOptions(design: QrDesignConfig): QrStylingOptions {
  const marginPx = quietZoneModulesToPx(
    design.url,
    design.errorCorrection,
    design.quietZoneModules,
    design.sizePx,
  );

  const gradientOptions = design.gradient
    ? {
        gradient: {
          type: design.gradient.type,
          rotation: (design.gradient.rotationDeg * Math.PI) / 180,
          colorStops: design.gradient.stops,
        },
      }
    : { color: design.foregroundColor };

  const dotsOptions = { type: design.dotType, ...gradientOptions };

  // 四隅は「差し色」が明示されていればそれを優先し、無ければ本体と同じ配色
  // (単色 or グラデーション)に揃える。以前は差し色未設定時に単色固定だったため、
  // グラデーションを選んでも四隅だけ古い色のまま変わらないように見える問題があった。
  const cornerColorOptions = design.cornerAccentColor
    ? { color: design.cornerAccentColor }
    : gradientOptions;

  return {
    width: design.sizePx,
    height: design.sizePx,
    type: "canvas",
    data: design.url,
    margin: marginPx,
    qrOptions: {
      errorCorrectionLevel: design.errorCorrection,
    },
    dotsOptions,
    // フレーム使用時は背景を透明にして書き出し、その上に装飾を重ねる
    // (lib/qr/patternComposer.ts)。QRのモジュール自体は一切変更しない。
    backgroundOptions: {
      color: design.frameTemplate !== "none" ? "rgba(0,0,0,0)" : design.backgroundColor,
    },
    cornersSquareOptions: { type: design.cornerSquareType, ...cornerColorOptions },
    cornersDotOptions: { type: design.cornerDotType, ...cornerColorOptions },
    // ロゴが無い場合、qr-code-stylingは`imageOptions`キー自体が存在しないことを前提に
    // 内部デフォルト値とマージするため、`undefined`を明示すると内部状態が壊れる。
    // そのためキーごと省略する(スプレッドで条件付きに追加する)。
    ...(design.logo
      ? {
          image: design.logo.dataUrl,
          imageOptions: {
            imageSize: design.logo.sizeRatio,
            hideBackgroundDots: true,
            margin: Math.round(design.sizePx * 0.02),
            crossOrigin: "anonymous" as const,
          },
        }
      : {}),
  };
}

export function createQrStyling(design: QrDesignConfig): QRCodeStyling {
  return new QRCodeStyling(buildQrStylingOptions(design));
}

export type { QRCodeStyling };
