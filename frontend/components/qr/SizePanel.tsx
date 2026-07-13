"use client";

import { Disclosure } from "@/components/ui/Disclosure";
import { SIZE_PRESETS, clampSize, MAX_SIZE_PX, MIN_SIZE_PX } from "@/lib/qr/presets";
import type { SizePresetKey } from "@/types/qr";

interface SizePanelProps {
  sizePreset: SizePresetKey;
  sizePx: number;
  onSelectPreset: (preset: SizePresetKey, customSizePx?: number) => void;
}

const PRESET_ENTRIES = Object.values(SIZE_PRESETS);

export function SizePanel({ sizePreset, sizePx, onSelectPreset }: SizePanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink/80">現在のサイズ</p>
        <p className="text-sm text-ink/40">
          {sizePx}px{sizePreset === "auto" ? "(おまかせ最適化済み)" : ""}
        </p>
      </div>

      <Disclosure title="詳細設定">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_ENTRIES.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => onSelectPreset(preset.key)}
              aria-pressed={sizePreset === preset.key}
              className={`flex flex-col gap-0.5 rounded-2xl border p-3 text-left transition-colors ${
                sizePreset === preset.key
                  ? "border-accent bg-accent/5"
                  : "border-black/10 hover:border-black/20"
              }`}
            >
              <span className="text-sm font-medium text-ink">{preset.label}</span>
              <span className="text-xs text-ink/40">{preset.widthPx}px</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="custom-size" className="text-sm font-medium text-ink/80">
            カスタムサイズ(px)
          </label>
          <input
            id="custom-size"
            type="number"
            min={MIN_SIZE_PX}
            max={MAX_SIZE_PX}
            value={sizePreset === "custom" ? sizePx : ""}
            placeholder={String(sizePx)}
            onChange={(event) => onSelectPreset("custom", clampSize(Number(event.target.value)))}
            className="w-28 rounded-xl border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </Disclosure>
    </div>
  );
}
