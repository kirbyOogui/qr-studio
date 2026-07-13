"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from "react";
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

interface PinchState {
  initialDistance: number;
  initialZoom: number;
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

function pointersDistance(pointers: Map<number, { x: number; y: number }>): number {
  const [a, b] = [...pointers.values()];
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
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
  // 指の数(1本=パン/2本=ピンチズーム)を判定するため、アクティブなポインタの
  // 現在位置をrefで追跡する(再描画のたびに作り直す必要が無い値のため)。
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<PinchState | null>(null);

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

  // ビューポート中央にある画像上の点をズーム後も中央に保つ。スライダー操作・
  // ピンチ操作のどちらもこの1つのロジックを共有する。
  const handleZoomChange = (nextZoom: number) => {
    if (!naturalSize) return;
    const baseScale = VIEWPORT / Math.min(naturalSize.w, naturalSize.h);
    const oldScale = baseScale * zoom;
    const newScale = baseScale * nextZoom;
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
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size >= 2) {
      // 2本指になった瞬間にピンチ操作へ切り替える(1本指のパンは中断する)。
      setDragState(null);
      pinchStateRef.current = { initialDistance: pointersDistance(pointersRef.current), initialZoom: zoom };
    } else {
      setDragState({
        startX: event.clientX,
        startY: event.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
      });
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size >= 2 && pinchStateRef.current) {
      const { initialDistance, initialZoom } = pinchStateRef.current;
      if (initialDistance > 0) {
        const distance = pointersDistance(pointersRef.current);
        handleZoomChange(clamp(initialZoom * (distance / initialDistance), MIN_ZOOM, maxZoom));
      }
      return;
    }

    if (!dragState || !naturalSize) return;
    const baseScale = VIEWPORT / Math.min(naturalSize.w, naturalSize.h);
    const scale = baseScale * zoom;
    const dw = naturalSize.w * scale;
    const dh = naturalSize.h * scale;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    setOffset(clampOffset(dragState.startOffsetX + dx, dragState.startOffsetY + dy, dw, dh));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);

    if (pointersRef.current.size >= 2) {
      // まだ2本以上残っている場合はピンチの基準を取り直して続行する。
      pinchStateRef.current = { initialDistance: pointersDistance(pointersRef.current), initialZoom: zoom };
      return;
    }

    pinchStateRef.current = null;
    const remaining = [...pointersRef.current.entries()][0];
    if (remaining) {
      // 2本指→1本指に戻ったら、残った指の現在位置からパンを再開する。
      const [, pos] = remaining;
      setDragState({ startX: pos.x, startY: pos.y, startOffsetX: offset.x, startOffsetY: offset.y });
    } else {
      setDragState(null);
    }
  };

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
      <div className="mx-auto w-full max-w-[288px] rounded-2xl border border-black/10 bg-black/[0.02] p-3">
        <div
          className="relative mx-auto touch-none overflow-hidden rounded-xl bg-black/5"
          style={{ width: VIEWPORT, height: VIEWPORT, cursor: dragState ? "grabbing" : "grab" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
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
          <div className="mt-3">
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
      </div>
      <p className="text-center text-xs text-ink/40">
        ドラッグして位置を調整、2本指のピンチでも拡大縮小できます
      </p>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-11 rounded-lg border border-black/10 px-4 py-2.5 text-sm font-medium text-ink/60 hover:border-black/20 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!naturalSize || isSubmitting}
          className="min-h-11 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "処理中…" : "この範囲でトリミング"}
        </button>
      </div>
    </div>
  );
}
