import { describe, expect, it } from "vitest";
import { clampSize, MAX_SIZE_PX, MIN_SIZE_PX, resolvePresetSize, SIZE_PRESETS } from "./presets";

describe("resolvePresetSize", () => {
  it("プリセットに応じた既定サイズを返す", () => {
    expect(resolvePresetSize("web")).toBe(SIZE_PRESETS.web.widthPx);
    expect(resolvePresetSize("poster")).toBe(SIZE_PRESETS.poster.widthPx);
  });

  it("customの場合は指定サイズをクランプして返す", () => {
    expect(resolvePresetSize("custom", 999999)).toBe(MAX_SIZE_PX);
    expect(resolvePresetSize("custom", 1)).toBe(MIN_SIZE_PX);
    expect(resolvePresetSize("custom", 800)).toBe(800);
  });
});

describe("clampSize", () => {
  it("範囲内の値はそのまま", () => {
    expect(clampSize(500)).toBe(500);
  });
  it("下限・上限でクランプされる", () => {
    expect(clampSize(-100)).toBe(MIN_SIZE_PX);
    expect(clampSize(999999)).toBe(MAX_SIZE_PX);
  });
});
