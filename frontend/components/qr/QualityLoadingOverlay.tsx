import { Spinner } from "@/components/ui/Spinner";

/**
 * Cloud Runのコールドスタートを含む品質チェックの待ち時間を
 * ストレスに感じさせないための、控えめで自然なローディング演出。
 * 「診断」「スコア」等の専門用語は一切表示しない。
 */
export function QualityLoadingOverlay() {
  return (
    <div
      className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center gap-3 rounded-[inherit] bg-white/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Spinner className="text-accent" />
      <p className="text-sm font-medium text-ink/70">品質を確認しています…</p>
    </div>
  );
}
