import { useEffect, useRef, useState } from "react";
import type { QrDesignConfig, QaStatus } from "@/types/qr";
import { useDebouncedValue } from "./useDebouncedValue";
import { checkQuality, QualityApiUnreachableError } from "@/services/qualityApi";
import { strengthenContrast } from "@/lib/qr/colorContrast";

// 全面テーマの段階的フォールバック(最大3段階)・EC/Quiet Zone/四隅形状/コントラストなど
// 複数の補正軸を組み合わせても十分収束できるよう余裕を持たせている。
const MAX_ITERATIONS = 10;
const DEBOUNCE_MS = 450;

interface CorrectionPatch {
  errorCorrection?: QrDesignConfig["errorCorrection"];
  quietZoneModules?: number;
  logoSizeRatio?: number;
  sizePx?: number;
  cornerSquareType?: QrDesignConfig["cornerSquareType"];
  dotType?: QrDesignConfig["dotType"];
}

interface UseQualityAssuranceArgs {
  design: QrDesignConfig;
  isUrlProvided: boolean;
  /**
   * 検証対象の画像をPNG(base64)として書き出す。呼び出し側は useCallback で安定化すること。
   * フレーム/背景パターン使用時は合成後の最終画像を返す必要がある
   * (lib/qr/patternComposer.ts の renderComposedPngBase64 を利用する)。
   */
  exportPngBase64: () => Promise<string | null>;
  applyCorrections: (patch: CorrectionPatch) => void;
  applyContrastCorrection: (foreground: string, background: string) => void;
}

/**
 * 品質保証エンジン(FastAPI)を用いた自動補正ループ。
 *
 * デザイン変更を検知するたびにバックエンドへ検証を依頼し、補正が必要なら
 * ユーザーに知らせず自動的にパラメータを更新して再検証する。補正の適用が
 * `design` state を更新することで、このフック自身のeffectが再度走り、
 * 収束するまで（または最大試行回数に達するまで）自然にループする。
 */
export function useQualityAssurance({
  design,
  isUrlProvided,
  exportPngBase64,
  applyCorrections,
  applyContrastCorrection,
}: UseQualityAssuranceArgs): { status: QaStatus } {
  const [asyncStatus, setAsyncStatus] = useState<QaStatus>("checking");
  const attemptRef = useRef(0);
  const lastUrlRef = useRef(design.url);
  const debouncedDesign = useDebouncedValue(design, DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedDesign.url !== lastUrlRef.current) {
      attemptRef.current = 0;
      lastUrlRef.current = debouncedDesign.url;
    }
  }, [debouncedDesign.url]);

  const debouncedUrlProvided = debouncedDesign.url.trim().length > 0;

  useEffect(() => {
    // isUrlProvided(非デバウンス)ではなく、必ずdebouncedDesignと同じ基準で判定する。
    // 基準がずれると、URLは入力済みだがdebouncedDesign.urlがまだ空文字の瞬間に
    // expected_payloadが空のリクエストを送ってしまい、バックエンドのバリデーションに
    // 弾かれる(422)レースコンディションが発生する。
    if (!debouncedUrlProvided) return;

    let cancelled = false;

    void (async () => {
      if (attemptRef.current >= MAX_ITERATIONS) {
        setAsyncStatus("ready");
        return;
      }
      setAsyncStatus("checking");

      const imageBase64 = await exportPngBase64();
      if (cancelled || !imageBase64) return;

      try {
        const response = await checkQuality({
          image_base64: imageBase64,
          expected_payload: debouncedDesign.url,
          design: {
            error_correction: debouncedDesign.errorCorrection,
            quiet_zone_modules: debouncedDesign.quietZoneModules,
            logo_ratio: debouncedDesign.logo?.sizeRatio ?? null,
            size_px: debouncedDesign.sizePx,
            corner_square_style: debouncedDesign.cornerSquareType,
            dot_style: debouncedDesign.dotType === "square" ? "square" : "other",
          },
        });
        if (cancelled) return;
        attemptRef.current += 1;

        // コントラスト補正(色)と構造的補正(サイズ・EC level等)は互いに独立した
        // 軸なので、両方問題があれば同じラウンドでまとめて適用する
        // (どちらか一方だけ適用して早期returnすると、収束が不必要に遅れたり、
        // 片方の補正だけでは解決しないケースを見逃したりする)。
        let appliedAnyCorrection = false;

        if (response.corrections) {
          applyCorrections({
            errorCorrection: response.corrections.error_correction,
            quietZoneModules: response.corrections.quiet_zone_modules,
            logoSizeRatio: response.corrections.logo_ratio ?? undefined,
            sizePx: response.corrections.size_px,
            cornerSquareType: response.corrections.corner_square_style,
            dotType: response.corrections.dot_style === "square" ? "square" : undefined,
          });
          appliedAnyCorrection = true;
        }

        if (response.contrast_adjustment_needed) {
          const { foreground, background } = strengthenContrast(
            debouncedDesign.foregroundColor,
            debouncedDesign.backgroundColor,
          );
          applyContrastCorrection(foreground, background);
          appliedAnyCorrection = true;
        }

        if (appliedAnyCorrection) return;

        setAsyncStatus("ready");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof QualityApiUnreachableError) {
          // バックエンド到達不能時はフロント側の安全なデフォルト設計に委ね、UXを止めない。
          setAsyncStatus("degraded");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDesign, debouncedUrlProvided]);

  const status: QaStatus = isUrlProvided ? asyncStatus : "idle";
  return { status };
}
