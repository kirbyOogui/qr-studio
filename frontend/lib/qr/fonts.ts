import type { FontKey } from "@/types/qr";

// 外部フォント読み込み(CSP/回線に依存)は避け、OS標準搭載フォントの
// スタックのみで見た目の違いを出す。フレームの呼びかけテキスト・
// ロゴのテキストの両方で共有する。
export const FONT_STACKS: Record<FontKey, string> = {
  gothic: `-apple-system, 'Hiragino Sans', 'Yu Gothic', sans-serif`,
  mincho: `'Hiragino Mincho ProN', 'Yu Mincho', serif`,
  rounded: `'Hiragino Maru Gothic ProN', 'UD Digi Kyokasho N-R', 'M PLUS Rounded 1c', sans-serif`,
};

export const FONT_OPTIONS: { value: FontKey; label: string }[] = [
  { value: "gothic", label: "ゴシック" },
  { value: "mincho", label: "明朝" },
  { value: "rounded", label: "丸ゴシック" },
];
