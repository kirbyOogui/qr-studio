import { useCallback, useMemo, useState } from "react";
import type { QrDesignConfig, SizePresetKey } from "@/types/qr";
import { resolvePresetSize, SIZE_PRESETS } from "@/lib/qr/presets";
import { DEFAULT_FRAME_TEXT } from "@/lib/qr/frameTemplates";

export const DEFAULT_DESIGN: QrDesignConfig = {
  url: "",
  foregroundColor: "#000000",
  backgroundColor: "#FFFFFF",
  gradient: null,
  dotType: "rounded",
  // 既定は最もシンプルな"square"。丸め形状(dot/extra-rounded)も選択可能で、
  // バックエンドがWeChatQRCode検出器(cv2.wechat_qrcode)採用によりどちらでも
  // 読み取れることを実機検証済み。万一読み取れない場合のみ自動でsquareに補正される。
  cornerSquareType: "square",
  cornerDotType: "dot",
  borderEnabled: false,
  borderColor: "#E5E5E7",
  borderWidthPx: 0,
  borderSizeRatio: 1,
  cornerRadiusPx: 24,
  sizePreset: "auto",
  sizePx: SIZE_PRESETS.auto.widthPx,
  errorCorrection: "M",
  quietZoneModules: 4,
  logo: null,
  cornerAccentColor: null,
  frameTemplate: "none",
  frameText: DEFAULT_FRAME_TEXT,
  frameTextEnabled: true,
  frameColor: "#000000",
  frameFont: "gothic",
};

export function useQrDesign() {
  const [design, setDesign] = useState<QrDesignConfig>(DEFAULT_DESIGN);

  const update = useCallback(<K extends keyof QrDesignConfig>(key: K, value: QrDesignConfig[K]) => {
    setDesign((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = useCallback((preset: SizePresetKey, customSizePx?: number) => {
    setDesign((prev) => ({
      ...prev,
      sizePreset: preset,
      sizePx: resolvePresetSize(preset, customSizePx),
    }));
  }, []);

  const applyCorrections = useCallback(
    (corrections: {
      errorCorrection?: QrDesignConfig["errorCorrection"];
      quietZoneModules?: number;
      logoSizeRatio?: number;
      sizePx?: number;
      cornerSquareType?: QrDesignConfig["cornerSquareType"];
      dotType?: QrDesignConfig["dotType"];
    }) => {
      setDesign((prev) => ({
        ...prev,
        errorCorrection: corrections.errorCorrection ?? prev.errorCorrection,
        quietZoneModules: corrections.quietZoneModules ?? prev.quietZoneModules,
        sizePx: corrections.sizePx ?? prev.sizePx,
        cornerSquareType: corrections.cornerSquareType ?? prev.cornerSquareType,
        dotType: corrections.dotType ?? prev.dotType,
        logo:
          prev.logo && corrections.logoSizeRatio !== undefined
            ? { ...prev.logo, sizeRatio: corrections.logoSizeRatio }
            : prev.logo,
      }));
    },
    [],
  );

  const applyContrastCorrection = useCallback((foreground: string, background: string) => {
    setDesign((prev) => ({ ...prev, foregroundColor: foreground, backgroundColor: background }));
  }, []);

  const applyFrameTemplate = useCallback((template: QrDesignConfig["frameTemplate"]) => {
    setDesign((prev) => ({ ...prev, frameTemplate: template }));
  }, []);

  const resetDesign = useCallback(() => {
    // URL(入力内容)はユーザーの作業対象であり「デザイン」ではないため、
    // リセット対象から外して維持する。
    setDesign((prev) => ({ ...DEFAULT_DESIGN, url: prev.url }));
  }, []);

  const isUrlProvided = useMemo(() => design.url.trim().length > 0, [design.url]);

  return {
    design,
    update,
    applyPreset,
    applyCorrections,
    applyContrastCorrection,
    applyFrameTemplate,
    resetDesign,
    isUrlProvided,
  };
}
