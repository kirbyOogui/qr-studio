"use client";

import { useId } from "react";
import { ColorField } from "@/components/ui/ColorField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FRAME_TEMPLATES } from "@/lib/qr/frameTemplates";
import { FONT_OPTIONS } from "@/lib/qr/fonts";
import type { FontKey, FrameTemplateKey } from "@/types/qr";

interface FramePanelProps {
  frameTemplate: FrameTemplateKey;
  frameText: string;
  frameTextEnabled: boolean;
  frameColor: string;
  frameFont: FontKey;
  onChangeTemplate: (template: FrameTemplateKey) => void;
  onChangeText: (text: string) => void;
  onChangeTextEnabled: (enabled: boolean) => void;
  onChangeColor: (color: string) => void;
  onChangeFont: (font: FontKey) => void;
}

const MAX_FRAME_TEXT_LENGTH = 20;

export function FramePanel({
  frameTemplate,
  frameText,
  frameTextEnabled,
  frameColor,
  frameFont,
  onChangeTemplate,
  onChangeText,
  onChangeTextEnabled,
  onChangeColor,
  onChangeFont,
}: FramePanelProps) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">フレームテンプレート</p>
        <SegmentedControl
          ariaLabel="フレームテンプレート"
          options={FRAME_TEMPLATES}
          value={frameTemplate}
          onChange={onChangeTemplate}
        />
        <p className="mt-2 text-xs text-ink/40">
          QRコード自体は一切加工しないため、フレームを付けても読み取り精度は変わりません。
        </p>
      </div>

      {frameTemplate !== "none" && (
        <>
          {/* フレームの装飾色はQuiet Zoneの外側にしか使わないため自由に選べる */}
          <ColorField id="frame-color" label="フレームの色" value={frameColor} onChange={onChangeColor} />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink/80">テキストボックス</span>
            <button
              type="button"
              role="switch"
              aria-checked={frameTextEnabled}
              aria-label="テキストボックス"
              onClick={() => onChangeTextEnabled(!frameTextEnabled)}
              className={`h-6 w-11 rounded-full transition-colors ${frameTextEnabled ? "bg-accent" : "bg-black/10"}`}
            >
              <span
                className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
                  frameTextEnabled ? "translate-x-[22px]" : ""
                }`}
              />
            </button>
          </div>

          {frameTextEnabled && (
            <>
              <div>
                <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink/80">
                  呼びかけテキスト
                </label>
                <input
                  id={inputId}
                  type="text"
                  value={frameText}
                  maxLength={MAX_FRAME_TEXT_LENGTH}
                  onChange={(event) => onChangeText(event.target.value)}
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <p className="mt-1 text-xs text-ink/40">
                  {frameText.length}/{MAX_FRAME_TEXT_LENGTH}文字
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink/80">フォント</p>
                <SegmentedControl
                  ariaLabel="フォント"
                  options={FONT_OPTIONS}
                  value={frameFont}
                  onChange={onChangeFont}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
