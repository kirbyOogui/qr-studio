"use client";

import { useId, useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SwatchPicker } from "@/components/ui/SwatchPicker";
import { FONT_OPTIONS } from "@/lib/qr/fonts";
import { renderTextLogo } from "@/lib/qr/logoProcessing";
import { MAX_TEXT_LOGO_LENGTH } from "@/lib/qr/logoConstraints";
import { SAFE_BACKGROUNDS, SAFE_COLORS } from "@/lib/qr/safeColors";
import type { FontKey, LogoShape } from "@/types/qr";

export interface TextLogoDraft {
  text: string;
  fontKey: FontKey;
  fillColor: string;
  textColor: string;
  shape: LogoShape;
}

interface LogoTextComposerProps {
  initial: TextLogoDraft;
  onConfirm: (draft: TextLogoDraft) => void;
  onCancel: () => void;
}

export function LogoTextComposer({ initial, onConfirm, onCancel }: LogoTextComposerProps) {
  const [draft, setDraft] = useState<TextLogoDraft>(initial);
  const inputId = useId();
  const trimmed = draft.text.trim();

  // renderTextLogoはcanvas描画のみで完結する同期処理のため、入力のたびに
  // その場でプレビューを再生成できる(画像ロゴのような非同期読み込みが不要)。
  const previewDataUrl = useMemo(() => {
    if (!trimmed) return null;
    try {
      return renderTextLogo({ ...draft, text: trimmed });
    } catch {
      return null;
    }
  }, [draft, trimmed]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/[0.02] p-1">
          {previewDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewDataUrl} alt="テキストロゴのプレビュー" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-ink/30">未入力</span>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink/80">
            ロゴのテキスト
          </label>
          <input
            id={inputId}
            type="text"
            value={draft.text}
            maxLength={MAX_TEXT_LOGO_LENGTH}
            onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))}
            placeholder="例: SALE"
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-ink/40">
            {draft.text.length}/{MAX_TEXT_LOGO_LENGTH}文字・幅に収まるようフォントサイズを自動調整します
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">形状</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraft((prev) => ({ ...prev, shape: "square" }))}
            aria-pressed={draft.shape === "square"}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              draft.shape === "square"
                ? "border-accent bg-accent/10 text-accent"
                : "border-black/10 text-ink/60 hover:border-black/20"
            }`}
          >
            四角
          </button>
          <button
            type="button"
            onClick={() => setDraft((prev) => ({ ...prev, shape: "circle" }))}
            aria-pressed={draft.shape === "circle"}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              draft.shape === "circle"
                ? "border-accent bg-accent/10 text-accent"
                : "border-black/10 text-ink/60 hover:border-black/20"
            }`}
          >
            丸
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">フォント</p>
        <SegmentedControl
          ariaLabel="フォント"
          options={FONT_OPTIONS}
          value={draft.fontKey}
          onChange={(fontKey) => setDraft((prev) => ({ ...prev, fontKey }))}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">背景色</p>
        <SwatchPicker
          ariaLabel="ロゴの背景色"
          columns={4}
          value={SAFE_BACKGROUNDS.find((c) => c.color === draft.fillColor)?.key ?? SAFE_BACKGROUNDS[0]!.key}
          onChange={(key) => {
            const found = SAFE_BACKGROUNDS.find((c) => c.key === key);
            if (found) setDraft((prev) => ({ ...prev, fillColor: found.color }));
          }}
          options={SAFE_BACKGROUNDS.map((c) => ({ key: c.key, label: c.label, swatchCss: c.color }))}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">文字色</p>
        <SwatchPicker
          ariaLabel="ロゴの文字色"
          columns={4}
          value={SAFE_COLORS.find((c) => c.color === draft.textColor)?.key ?? SAFE_COLORS[0]!.key}
          onChange={(key) => {
            const found = SAFE_COLORS.find((c) => c.key === key);
            if (found) setDraft((prev) => ({ ...prev, textColor: found.color }));
          }}
          options={SAFE_COLORS.map((c) => ({ key: c.key, label: c.label, swatchCss: c.color }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-black/10 px-4 py-1.5 text-sm font-medium text-ink/60 hover:border-black/20"
        >
          キャンセル
        </button>
        <button
          type="button"
          disabled={!trimmed}
          onClick={() => onConfirm({ ...draft, text: trimmed })}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          適用
        </button>
      </div>
    </div>
  );
}
