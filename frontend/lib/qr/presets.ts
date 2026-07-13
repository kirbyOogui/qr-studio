import type { SizePreset, SizePresetKey } from "@/types/qr";

// 用途別プリセット。印刷用途は 300dpi 換算のpx値を採用している。
export const SIZE_PRESETS: Record<Exclude<SizePresetKey, "custom">, SizePreset> = {
  auto: {
    key: "auto",
    label: "おまかせ",
    description: "画面表示・印刷どちらにも使える汎用サイズ",
    widthPx: 640,
    heightPx: 640,
  },
  web: {
    key: "web",
    label: "Web",
    description: "サイトへの埋め込みに最適",
    widthPx: 512,
    heightPx: 512,
  },
  sns: {
    key: "sns",
    label: "SNS",
    description: "投稿・プロフィールでの共有に最適",
    widthPx: 1080,
    heightPx: 1080,
  },
  businessCard: {
    key: "businessCard",
    label: "名刺",
    description: "名刺印刷でも高精細に読み取れるサイズ",
    widthPx: 900,
    heightPx: 900,
  },
  a4: {
    key: "a4",
    label: "A4",
    description: "チラシ・資料への挿入に最適",
    widthPx: 1240,
    heightPx: 1240,
  },
  poster: {
    key: "poster",
    label: "ポスター",
    description: "遠くからでも読み取りやすい大判サイズ",
    widthPx: 2000,
    heightPx: 2000,
  },
  presentation: {
    key: "presentation",
    label: "プレゼン",
    description: "スライド投影でくっきり見えるサイズ",
    widthPx: 1600,
    heightPx: 1600,
  },
  printHQ: {
    key: "printHQ",
    label: "高画質印刷",
    description: "商用印刷向けの最高解像度",
    widthPx: 3000,
    heightPx: 3000,
  },
};

export const DEFAULT_CUSTOM_SIZE_PX = 640;
export const MIN_SIZE_PX = 128;
export const MAX_SIZE_PX = 4096;

export function resolvePresetSize(preset: SizePresetKey, customSizePx?: number): number {
  if (preset === "custom") {
    return clampSize(customSizePx ?? DEFAULT_CUSTOM_SIZE_PX);
  }
  return SIZE_PRESETS[preset].widthPx;
}

export function clampSize(sizePx: number): number {
  return Math.min(MAX_SIZE_PX, Math.max(MIN_SIZE_PX, Math.round(sizePx)));
}
