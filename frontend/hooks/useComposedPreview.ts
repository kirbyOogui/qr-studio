import { useEffect, useState } from "react";
import type { QrDesignConfig } from "@/types/qr";
import { buildComposedSvg, type ComposedSvgResult } from "@/lib/qr/patternComposer";

/**
 * フレーム装飾の合成プレビューを組み立てる。
 * QR自体(暗いモジュール)は無加工のまま透明背景でエクスポートし、
 * その上に装飾を重ねる。ダウンロード時(lib/qr/exportComposer.ts)と
 * 同じロジックを使うため、プレビューと実際の書き出し結果は一致する。
 */
export function useComposedPreview(
  design: QrDesignConfig,
  exportPngBase64: () => Promise<string | null>,
): ComposedSvgResult | null {
  const [composed, setComposed] = useState<ComposedSvgResult | null>(null);
  const needsCompose = design.frameTemplate !== "none" && Boolean(design.url);

  useEffect(() => {
    if (!needsCompose) return;

    let cancelled = false;
    void (async () => {
      const base64 = await exportPngBase64();
      if (cancelled || !base64) return;
      const result = buildComposedSvg(design, `data:image/png;base64,${base64}`);
      if (!cancelled) setComposed(result);
    })();

    return () => {
      cancelled = true;
    };
  }, [needsCompose, design, exportPngBase64]);

  return needsCompose ? composed : null;
}
