import { useCallback, useMemo, useState } from "react";
import type { QrDesignConfig, SizePresetKey } from "@/types/qr";
import { resolvePresetSize, SIZE_PRESETS } from "@/lib/qr/presets";
import { DEFAULT_FRAME_TEXT } from "@/lib/qr/frameTemplates";
import { stepDownIntensity, type PatternDef } from "@/lib/qr/backgroundPatterns";

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
  patternKey: "none",
  patternIntensity: 2,
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

  const applyBackgroundPattern = useCallback((pattern: PatternDef | null) => {
    // 背景パターンはQRの色(foregroundColor/gradient)には一切影響しない、
    // 純粋な装飾。フレームとも併用できる(排他にしない)。
    setDesign((prev) => ({
      ...prev,
      patternKey: pattern ? pattern.key : "none",
      // 「大胆な見た目」を既定にし、デコード検証に失敗した場合のみ
      // はしごを1段階ずつ下げて安全な方へ調整する(useQualityAssurance参照)。
      patternIntensity: 2,
    }));
  }, []);

  const applyPatternIntensityStepDown = useCallback((): boolean => {
    if (design.patternKey === "none") return false;
    const next = stepDownIntensity(design.patternIntensity);
    if (next !== null) {
      setDesign((prev) => ({ ...prev, patternIntensity: next }));
      return true;
    }
    // 最も控えめな段階でもまだ読み取れない場合の最終手段として、
    // 背景パターン自体をオフにする(見た目より読み取り可否を優先する)。
    // 色には一切触れていないため、これだけで安全な状態に戻る。
    setDesign((prev) => ({ ...prev, patternKey: "none" }));
    return true;
  }, [design.patternKey, design.patternIntensity]);

  const applyFrameTemplate = useCallback((template: QrDesignConfig["frameTemplate"]) => {
    // 背景パターンと併用できるため、フレーム選択では他の設定を変更しない。
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
    applyBackgroundPattern,
    applyPatternIntensityStepDown,
    applyFrameTemplate,
    resetDesign,
    isUrlProvided,
  };
}
