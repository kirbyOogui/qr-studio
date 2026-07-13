"use client";

import { ColorField } from "@/components/ui/ColorField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { SwatchPicker } from "@/components/ui/SwatchPicker";
import { SAFE_BACKGROUNDS, SAFE_COLORS, SAFE_GRADIENTS } from "@/lib/qr/safeColors";
import type { QrDesignConfig, CornerDotType, CornerSquareType, DotType } from "@/types/qr";

const DOT_TYPE_OPTIONS: { value: DotType; label: string }[] = [
  { value: "square", label: "スクエア" },
  { value: "dots", label: "ドット" },
  { value: "rounded", label: "ラウンド" },
  { value: "classy", label: "クラシック" },
  { value: "classy-rounded", label: "クラシック丸" },
  { value: "extra-rounded", label: "エクストラ" },
];

const CORNER_SQUARE_OPTIONS: { value: CornerSquareType; label: string }[] = [
  { value: "square", label: "スクエア" },
  { value: "dot", label: "ドット" },
  { value: "extra-rounded", label: "ラウンド" },
];

const CORNER_DOT_OPTIONS: { value: CornerDotType; label: string }[] = [
  { value: "square", label: "スクエア" },
  { value: "dot", label: "ドット" },
];

interface DesignPanelProps {
  design: QrDesignConfig;
  onChange: <K extends keyof QrDesignConfig>(key: K, value: QrDesignConfig[K]) => void;
}

export function DesignPanel({ design, onChange }: DesignPanelProps) {
  const hasBackgroundPattern = design.patternKey !== "none";

  const selectedGradientKey =
    SAFE_GRADIENTS.find(
      (g) =>
        design.gradient &&
        g.gradient.stops[0].color === design.gradient.stops[0].color &&
        g.gradient.stops[1].color === design.gradient.stops[1].color,
    )?.key ?? SAFE_GRADIENTS[0]!.key;

  const toggleGradient = (enabled: boolean) => {
    onChange("gradient", enabled ? SAFE_GRADIENTS[0]!.gradient : null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink/80">グラデーション</span>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(design.gradient)}
            onClick={() => toggleGradient(!design.gradient)}
            className={`h-6 w-11 rounded-full transition-colors ${design.gradient ? "bg-accent" : "bg-black/10"}`}
          >
            <span
              className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
                design.gradient ? "translate-x-[22px]" : ""
              }`}
            />
          </button>
        </div>

        {design.gradient ? (
          <div>
            <p className="mb-2 text-sm font-medium text-ink/80">グラデーション</p>
            <SwatchPicker
              ariaLabel="グラデーション"
              columns={4}
              value={selectedGradientKey}
              onChange={(key) => {
                const found = SAFE_GRADIENTS.find((g) => g.key === key);
                if (found) onChange("gradient", found.gradient);
              }}
              options={SAFE_GRADIENTS.map((g) => ({
                key: g.key,
                label: g.label,
                swatchCss: `linear-gradient(45deg, ${g.gradient.stops[0].color}, ${g.gradient.stops[1].color})`,
              }))}
            />
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-ink/80">前景色</p>
            <SwatchPicker
              ariaLabel="前景色"
              columns={4}
              value={SAFE_COLORS.find((c) => c.color === design.foregroundColor)?.key ?? SAFE_COLORS[0]!.key}
              onChange={(key) => {
                const found = SAFE_COLORS.find((c) => c.key === key);
                if (found) onChange("foregroundColor", found.color);
              }}
              options={SAFE_COLORS.map((c) => ({ key: c.key, label: c.label, swatchCss: c.color }))}
            />
            <p className="mt-2 text-xs text-ink/40">
              読み取りやすさを保証するため、検証済みの色のみ選べます。
            </p>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink/80">背景色</p>
            {hasBackgroundPattern && (
              <p className="text-xs text-ink/40">背景パターン使用中は変更できません</p>
            )}
          </div>
          <div
            className={hasBackgroundPattern ? "pointer-events-none opacity-40" : undefined}
            aria-disabled={hasBackgroundPattern}
          >
            <SwatchPicker
              ariaLabel="背景色"
              columns={3}
              value={SAFE_BACKGROUNDS.find((c) => c.color === design.backgroundColor)?.key ?? SAFE_BACKGROUNDS[0]!.key}
              onChange={(key) => {
                const found = SAFE_BACKGROUNDS.find((c) => c.key === key);
                if (found) onChange("backgroundColor", found.color);
              }}
              options={SAFE_BACKGROUNDS.map((c) => ({ key: c.key, label: c.label, swatchCss: c.color }))}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">ドット形状</p>
        <SegmentedControl
          ariaLabel="ドット形状"
          options={DOT_TYPE_OPTIONS}
          value={design.dotType}
          onChange={(value) => onChange("dotType", value)}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">四隅の外枠デザイン</p>
        <SegmentedControl
          ariaLabel="四隅の外枠デザイン"
          options={CORNER_SQUARE_OPTIONS}
          value={design.cornerSquareType}
          onChange={(value) => onChange("cornerSquareType", value)}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">四隅のドットデザイン</p>
        <SegmentedControl
          ariaLabel="四隅のドットデザイン"
          options={CORNER_DOT_OPTIONS}
          value={design.cornerDotType}
          onChange={(value) => onChange("cornerDotType", value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink/80">四隅だけ差し色にする</span>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(design.cornerAccentColor)}
            onClick={() =>
              onChange("cornerAccentColor", design.cornerAccentColor ? null : SAFE_COLORS[6]!.color)
            }
            className={`h-6 w-11 rounded-full transition-colors ${design.cornerAccentColor ? "bg-accent" : "bg-black/10"}`}
          >
            <span
              className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
                design.cornerAccentColor ? "translate-x-[22px]" : ""
              }`}
            />
          </button>
        </div>
        {design.cornerAccentColor && (
          <SwatchPicker
            ariaLabel="四隅の差し色"
            columns={4}
            value={SAFE_COLORS.find((c) => c.color === design.cornerAccentColor)?.key ?? SAFE_COLORS[6]!.key}
            onChange={(key) => {
              const found = SAFE_COLORS.find((c) => c.key === key);
              if (found) onChange("cornerAccentColor", found.color);
            }}
            options={SAFE_COLORS.map((c) => ({ key: c.key, label: c.label, swatchCss: c.color }))}
          />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink/80">枠線</span>
          <button
            type="button"
            role="switch"
            aria-checked={design.borderEnabled}
            onClick={() => onChange("borderEnabled", !design.borderEnabled)}
            className={`h-6 w-11 rounded-full transition-colors ${design.borderEnabled ? "bg-accent" : "bg-black/10"}`}
          >
            <span
              className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
                design.borderEnabled ? "translate-x-[22px]" : ""
              }`}
            />
          </button>
        </div>
        {design.borderEnabled && (
          <>
            {/* 枠線はQuiet Zoneの外側の装飾でありモジュールの読み取りに影響しないため、自由に選べる */}
            <ColorField
              id="border-color"
              label="枠線の色"
              value={design.borderColor}
              onChange={(color) => onChange("borderColor", color)}
            />
            <Slider
              id="border-width"
              label="枠線の太さ"
              min={1}
              max={24}
              value={design.borderWidthPx}
              onChange={(value) => onChange("borderWidthPx", value)}
              formatValue={(v) => `${v}px`}
            />
          </>
        )}
      </div>

      <Slider
        id="corner-radius"
        label="角丸"
        min={0}
        max={48}
        value={design.cornerRadiusPx}
        onChange={(value) => onChange("cornerRadiusPx", value)}
        formatValue={(v) => `${v}px`}
      />
    </div>
  );
}
