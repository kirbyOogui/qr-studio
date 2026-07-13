"use client";

import { useState, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from "react";
import { Slider } from "@/components/ui/Slider";
import type { CropRect, LogoShape } from "@/lib/qr/logoProcessing";

interface LogoCropperProps {
  sourceDataUrl: string;
  shape: LogoShape;
  initialCrop?: CropRect | null;
  isSubmitting: boolean;
  onConfirm: (crop: CropRect) => void;
  onCancel: () => void;
}

const VIEWPORT = 260;
const MIN_ZOOM = 1;
const MAX_ZOOM_CAP = 6;
// これより小さい範囲までズームインすると、出力時に引き伸ばされてぼやけるため
// 「使用可能な大きさ」を割らないよう最大ズームを制限する。
const MIN_USABLE_CROP_PX = 64;

interface DragState {
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampOffset(x: number, y: number, dw: number, dh: number) {
  return {
    x: clamp(x, Math.min(0, VIEWPORT - dw), 0),
    y: clamp(y, Math.min(0, VIEWPORT - dh), 0),
  };
}

export function LogoCropper({
  sourceDataUrl,
  shape,
  initialCrop,
  isSubmitting,
  onConfirm,
  onCancel,
}: LogoCropperProps) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);

  const maxZoom = naturalSize
    ? Math.min(MAX_ZOOM_CAP, Math.max(MIN_ZOOM, Math.min(naturalSize.w, naturalSize.h) / MIN_USABLE_CROP_PX))
    : MAX_ZOOM_CAP;

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNaturalSize({ w, h });

    const baseScale = VIEWPORT / Math.min(w, h);
    if (initialCrop) {
      const scale = VIEWPORT / initialCrop.sSize;
      const dw = w * scale;
      const dh = h * scale;
      setZoom(clamp(scale / baseScale, MIN_ZOOM, MAX_ZOOM_CAP));
      setOffset(clampOffset(-initialCrop.sx * scale, -initialCrop.sy * scale, dw, dh));
    } else {
      const dw = w * baseScale;
      const dh = h * baseScale;
      setZoom(1);
      setOffset({ x: (VIEWPORT - dw) / 2, y: (VIEWPORT - dh) / 2 });
    }
  };

  const handleZoomChange = (nextZoom: number) => {
    if (!naturalSize) return;
    const baseScale = VIEWPORT / Math.min(naturalSize.w, naturalSize.h);
    const oldScale = baseScale * zoom;
    const newScale = baseScale * nextZoom;
    // ズーム前にビューポート中央にあった画像上の点を、ズーム後も中央に保つ。
    const centerImgX = (VIEWPORT / 2 - offset.x) / oldScale;
    const centerImgY = (VIEWPORT / 2 - offset.y) / oldScale;
    const dw = naturalSize.w * newScale;
    const dh = naturalSize.h * newScale;
    setZoom(nextZoom);
    setOffset(
      clampOffset(VIEWPORT / 2 - centerImgX * newScale, VIEWPORT / 2 - centerImgY * newScale, dw, dh),
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState || !naturalSize) return;
    const baseScale = VIEWPORT / Math.min(naturalSize.w, naturalSize.h);
    const scale = baseScale * zoom;
    const dw = naturalSize.w * scale;
    const dh = naturalSize.h * scale;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    setOffset(clampOffset(dragState.startOffsetX + dx, dragState.startOffsetY + dy, dw, dh));
  };

  const handlePointerUp = () => setDragState(null);

  const handleConfirm = () => {
    if (!naturalSize) return;
    const baseScale = VIEWPORT / Math.min(naturalSize.w, naturalSize.h);
    const scale = baseScale * zoom;
    const sSize = VIEWPORT / scale;
    const sx = clamp(-offset.x / scale, 0, naturalSize.w - sSize);
    const sy = clamp(-offset.y / scale, 0, naturalSize.h - sSize);
    onConfirm({ sx, sy, sSize });
  };

  const displayScale = naturalSize ? (VIEWPORT / Math.min(naturalSize.w, naturalSize.h)) * zoom : 0;

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto touch-none overflow-hidden rounded-2xl border border-black/10 bg-black/5"
        style={{ width: VIEWPORT, height: VIEWPORT, cursor: dragState ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sourceDataUrl}
          alt="トリミング対象のロゴ"
          draggable={false}
          onLoad={handleImageLoad}
          className="absolute max-w-none select-none"
          style={
            naturalSize
              ? {
                  left: offset.x,
                  top: offset.y,
                  width: naturalSize.w * displayScale,
                  height: naturalSize.h * displayScale,
                }
              : { opacity: 0 }
          }
        />
        {shape === "circle" && naturalSize && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "rgba(0,0,0,0.45)",
              WebkitMaskImage: "radial-gradient(circle at center, transparent 50%, black 51%)",
              maskImage: "radial-gradient(circle at center, transparent 50%, black 51%)",
            }}
          />
        )}
      </div>
      {naturalSize && (
        <div className="mx-auto max-w-[260px]">
          <Slider
            id="logo-crop-zoom"
            label="拡大"
            min={MIN_ZOOM}
            max={maxZoom}
            step={0.01}
            value={Math.min(zoom, maxZoom)}
            onChange={handleZoomChange}
            formatValue={(v) => `${v.toFixed(1)}x`}
          />
        </div>
      )}
      <p className="text-center text-xs text-ink/40">ドラッグして位置を調整できます</p>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-black/10 px-4 py-1.5 text-sm font-medium text-ink/60 hover:border-black/20 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!naturalSize || isSubmitting}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "処理中…" : "この範囲でトリミング"}
        </button>
      </div>
    </div>
  );
}
