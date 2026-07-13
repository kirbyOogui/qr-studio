"use client";

import { useId } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { SwatchPicker } from "@/components/ui/SwatchPicker";
import { FONT_OPTIONS } from "@/lib/qr/fonts";
import { MAX_TEXT_LOGO_LENGTH, TEXT_LOGO_MIN_HEIGHT_RATIO, TEXT_LOGO_MIN_FONT_SCALE } from "@/lib/qr/logoConstraints";
import { SAFE_BACKGROUNDS, SAFE_COLORS } from "@/lib/qr/safeColors";
import type { FontKey, LogoShape } from "@/types/qr";

export interface TextLogoDraft {
  text: string;
  fontKey: FontKey;
  fillColor: string;
  textColor: string;
  shape: LogoShape;
  /** 幅に対する高さの比率(TEXT_LOGO_MIN_HEIGHT_RATIO〜1)。丸形状では常に1として扱う。 */
  heightRatio: number;
  bold: boolean;
  italic: boolean;
  /** trueの場合、文字を塗りつぶさず輪郭線のみで描く(縁取り文字)。 */
  outlineOnly: boolean;
  /** 自動計算される最大フォントサイズに対する倍率(TEXT_LOGO_MIN_FONT_SCALE〜1)。 */
  fontScale: number;
}

interface LogoTextComposerProps {
  draft: TextLogoDraft;
  /** 何か1項目でも変更されるたびに呼ばれる(即時反映)。形状・ロゴサイズは呼び出し側で共通管理する。 */
  onChange: (patch: Partial<TextLogoDraft>) => void;
}

// 形状(四角/丸)とロゴサイズは、画像ロゴと同じ場所(LogoUploader側)で
// 一元的に扱うため、ここではテキスト固有の項目のみを編集する。
// 変更は「適用」ボタンを待たず、その場で呼び出し側(実際のロゴ)へ即時反映する。
export function LogoTextComposer({ draft, onChange }: LogoTextComposerProps) {
  const inputId = useId();

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink/80">
          ロゴのテキスト
        </label>
        <textarea
          id={inputId}
          value={draft.text}
          maxLength={MAX_TEXT_LOGO_LENGTH}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder={"例: SALE\n(Enterで改行できます)"}
          rows={2}
          className="w-full resize-none rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <p className="mt-1 text-xs text-ink/40">
          {draft.text.length}/{MAX_TEXT_LOGO_LENGTH}文字・Enterで改行・幅と高さに収まる最大サイズで自動調整します
        </p>
      </div>

      <div className="space-y-4">
        {draft.shape === "square" && (
          <Slider
            id="text-logo-height"
            label="縦の高さ"
            min={TEXT_LOGO_MIN_HEIGHT_RATIO}
            max={1}
            step={0.05}
            value={draft.heightRatio}
            onChange={(heightRatio) => onChange({ heightRatio })}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        )}
        <Slider
          id="text-logo-font-scale"
          label="文字サイズ"
          min={TEXT_LOGO_MIN_FONT_SCALE}
          max={1}
          step={0.05}
          value={draft.fontScale}
          onChange={(fontScale) => onChange({ fontScale })}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">フォント</p>
        <SegmentedControl
          ariaLabel="フォント"
          options={FONT_OPTIONS}
          value={draft.fontKey}
          onChange={(fontKey) => onChange({ fontKey })}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">文字スタイル</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ bold: !draft.bold })}
            aria-pressed={draft.bold}
            className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              draft.bold
                ? "border-accent bg-accent/10 text-accent"
                : "border-black/10 text-ink/60 hover:border-black/20"
            }`}
          >
            太字
          </button>
          <button
            type="button"
            onClick={() => onChange({ italic: !draft.italic })}
            aria-pressed={draft.italic}
            className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium italic transition-colors ${
              draft.italic
                ? "border-accent bg-accent/10 text-accent"
                : "border-black/10 text-ink/60 hover:border-black/20"
            }`}
          >
            斜体
          </button>
          <button
            type="button"
            onClick={() => onChange({ outlineOnly: !draft.outlineOnly })}
            aria-pressed={draft.outlineOnly}
            className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              draft.outlineOnly
                ? "border-accent bg-accent/10 text-accent"
                : "border-black/10 text-ink/60 hover:border-black/20"
            }`}
          >
            縁のみ
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">背景色</p>
        <SwatchPicker
          ariaLabel="ロゴの背景色"
          columns={4}
          value={SAFE_BACKGROUNDS.find((c) => c.color === draft.fillColor)?.key ?? SAFE_BACKGROUNDS[0]!.key}
          onChange={(key) => {
            const found = SAFE_BACKGROUNDS.find((c) => c.key === key);
            if (found) onChange({ fillColor: found.color });
          }}
          options={SAFE_BACKGROUNDS.map((c) => ({ key: c.key, label: c.label, swatchCss: c.color }))}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">
          {draft.outlineOnly ? "文字色(縁の色)" : "文字色"}
        </p>
        <SwatchPicker
          ariaLabel="ロゴの文字色"
          columns={4}
          value={SAFE_COLORS.find((c) => c.color === draft.textColor)?.key ?? SAFE_COLORS[0]!.key}
          onChange={(key) => {
            const found = SAFE_COLORS.find((c) => c.key === key);
            if (found) onChange({ textColor: found.color });
          }}
          options={SAFE_COLORS.map((c) => ({ key: c.key, label: c.label, swatchCss: c.color }))}
        />
      </div>
    </div>
  );
}
