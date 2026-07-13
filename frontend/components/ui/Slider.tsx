import type { ChangeEvent } from "react";

interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({ id, label, min, max, step = 1, value, onChange, formatValue }: SliderProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink/80">
          {label}
        </label>
        <span className="text-sm tabular-nums text-ink/50">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
        // touch-none(touch-action: none)が無いと、親要素(カスタマイズ欄)に
        // 設定したtouch-pan-y(縦スワイプ専用)の影響で、このつまみの横方向の
        // ドラッグ操作がスクロール判定と競合し、ドラッグできたりできなかったり
        // する不具合が起きる。スライダー自身では常にドラッグを最優先させる。
        className="h-1.5 w-full touch-none cursor-pointer appearance-none rounded-full bg-black/10 accent-accent"
      />
    </div>
  );
}
