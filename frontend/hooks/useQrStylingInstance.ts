"use client";

import { useCallback, useEffect, useRef } from "react";
import type { QrDesignConfig } from "@/types/qr";
import { createQrStyling, type QRCodeStyling } from "@/lib/qr/qrStylingClient";
import { blobToBase64 } from "@/lib/qr/svgRaster";

/**
 * qr-code-styling のインスタンスをReactのライフサイクルに合わせて管理する。
 * DOMへの実描画とエクスポートは全てクライアントのメモリ上で完結し、
 * サーバーへは品質チェック時にのみ一時的にPNGを送信する。
 */
export function useQrStylingInstance(design: QrDesignConfig) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // qr-code-stylingの`update()`は内部でオプションを差分マージするだけのため、
    // グラデーションやロゴなど「オフにした/外した」ネストされた設定が新しいオブジェクトに
    // キーごと存在しない場合、古い値が消えずに残ってしまう(実機検証で確認した実バグ)。
    // そのため差分更新に頼らず、変更のたびにインスタンスを作り直して確実に反映する。
    containerRef.current.replaceChildren();
    instanceRef.current = createQrStyling(design);
    instanceRef.current.append(containerRef.current);
  }, [design]);

  const exportPngBase64 = useCallback(async (): Promise<string | null> => {
    if (!instanceRef.current || !design.url) return null;
    const blob = (await instanceRef.current.getRawData("png")) as Blob | null;
    if (!blob) return null;
    return blobToBase64(blob);
  }, [design.url]);

  const getRawData = useCallback(async (extension: "png" | "svg" | "webp"): Promise<Blob | null> => {
    if (!instanceRef.current) return null;
    // ブラウザ環境では常にBlobが返る(Node環境向けのBuffer分岐はここでは発生しない)。
    return (await instanceRef.current.getRawData(extension)) as Blob | null;
  }, []);

  return { containerRef, exportPngBase64, getRawData };
}
