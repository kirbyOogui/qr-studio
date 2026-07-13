"use client";

import { useId, useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Slider } from "@/components/ui/Slider";
import { SwatchPicker } from "@/components/ui/SwatchPicker";
import { FONT_OPTIONS } from "@/lib/qr/fonts";
import { renderTextLogo } from "@/lib/qr/logoProcessing";
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
  initial: TextLogoDraft;
  /** 何か1項目でも変更されるたびに呼ばれる(即時反映)。 */
  onChange: (draft: TextLogoDraft) => void;
  /** 「キャンセル」。呼び出し側でこの編集セッション開始前の状態に戻す。 */
  onCancel: () => void;
  /** 「完了」。変更は既に反映済みのため、単に編集画面を閉じる。 */
  onDone: () => void;
}

export function LogoTextComposer({ initial, onChange, onCancel, onDone }: LogoTextComposerProps) {
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

  // 変更のたびにローカルの下書きを更新すると同時に、呼び出し側(実際のロゴ)へも
  // 即座に反映する。「適用」ボタンを待たずに操作結果がQRプレビューへ出るようにするため。
  const updateDraft = (patch: Partial<TextLogoDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      onChange(next);
      return next;
    });
  };

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
          <textarea
            id={inputId}
            value={draft.text}
            maxLength={MAX_TEXT_LOGO_LENGTH}
            onChange={(event) => updateDraft({ text: event.target.value })}
            placeholder={"例: SALE\n(Enterで改行できます)"}
            rows={2}
            className="w-full resize-none rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <p className="mt-1 text-xs text-ink/40">
            {draft.text.length}/{MAX_TEXT_LOGO_LENGTH}文字・Enterで改行・幅と高さに収まる最大サイズで自動調整します
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">形状</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateDraft({ shape: "square" })}
            aria-pressed={draft.shape === "square"}
            className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              draft.shape === "square"
                ? "border-accent bg-accent/10 text-accent"
                : "border-black/10 text-ink/60 hover:border-black/20"
            }`}
          >
            四角
          </button>
          <button
            type="button"
            onClick={() => updateDraft({ shape: "circle" })}
            aria-pressed={draft.shape === "circle"}
            className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              draft.shape === "circle"
                ? "border-accent bg-accent/10 text-accent"
                : "border-black/10 text-ink/60 hover:border-black/20"
            }`}
          >
            丸
          </button>
        </div>
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
            onChange={(heightRatio) => updateDraft({ heightRatio })}
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
          onChange={(fontScale) => updateDraft({ fontScale })}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">フォント</p>
        <SegmentedControl
          ariaLabel="フォント"
          options={FONT_OPTIONS}
          value={draft.fontKey}
          onChange={(fontKey) => updateDraft({ fontKey })}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink/80">文字スタイル</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateDraft({ bold: !draft.bold })}
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
            onClick={() => updateDraft({ italic: !draft.italic })}
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
            onClick={() => updateDraft({ outlineOnly: !draft.outlineOnly })}
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
            if (found) updateDraft({ fillColor: found.color });
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
            if (found) updateDraft({ textColor: found.color });
          }}
          options={SAFE_COLORS.map((c) => ({ key: c.key, label: c.label, swatchCss: c.color }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-black/10 px-4 py-2.5 text-sm font-medium text-ink/60 hover:border-black/20"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onDone}
          className="min-h-11 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white"
        >
          完了
        </button>
      </div>
    </div>
  );
}
