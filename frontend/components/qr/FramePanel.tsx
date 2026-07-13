"use client";

import { useId } from "react";
import { ColorField } from "@/components/ui/ColorField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FRAME_TEMPLATES } from "@/lib/qr/frameTemplates";
import type { FrameTemplateKey } from "@/types/qr";

interface FramePanelProps {
  frameTemplate: FrameTemplateKey;
  frameText: string;
  frameTextEnabled: boolean;
  frameColor: string;
  onChangeTemplate: (template: FrameTemplateKey) => void;
  onChangeText: (text: string) => void;
  onChangeTextEnabled: (enabled: boolean) => void;
  onChangeColor: (color: string) => void;
}

const MAX_FRAME_TEXT_LENGTH = 20;

export function FramePanel({
  frameTemplate,
  frameText,
  frameTextEnabled,
  frameColor,
  onChangeTemplate,
  onChangeText,
  onChangeTextEnabled,
  onChangeColor,
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
          「背景」タブのパターンと組み合わせることもできます(「コーナー」を除く)。
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
