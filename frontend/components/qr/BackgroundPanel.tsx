"use client";

import { SwatchPicker } from "@/components/ui/SwatchPicker";
import { PATTERNS, type PatternDef } from "@/lib/qr/backgroundPatterns";
import type { PatternKey } from "@/types/qr";

interface BackgroundPanelProps {
  patternKey: PatternKey;
  onSelect: (pattern: PatternDef | null) => void;
}

export function BackgroundPanel({ patternKey, onSelect }: BackgroundPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">背景パターン</p>
        <p className="mb-3 text-xs text-ink/40">
          QRの実データ(暗いモジュール)や色には一切影響しない、背景だけの飾りです。フレームとも
          組み合わせられます。生成のたびに読み取り検証し、必要なら柄の濃さを自動的に控えめへ
          調整します。
        </p>
        <SwatchPicker
          ariaLabel="背景パターン"
          columns={4}
          value={patternKey}
          onChange={(key) => {
            if (key === "none") {
              onSelect(null);
              return;
            }
            const found = PATTERNS.find((p) => p.key === key);
            if (found) onSelect(found);
          }}
          options={[
            { key: "none", label: "なし", swatchCss: "#FFFFFF" },
            ...PATTERNS.map((p) => ({ key: p.key, label: p.label, swatchCss: p.swatchColor })),
          ]}
        />
      </div>
    </div>
  );
}
