import { describe, expect, it } from "vitest";
import { contrastRatio, strengthenContrast } from "./colorContrast";

describe("contrastRatio", () => {
  it("計算: 黒×白は最大コントラスト(21:1)に近い", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("計算: 同色は最小コントラスト(1:1)", () => {
    expect(contrastRatio("#808080", "#808080")).toBeCloseTo(1, 5);
  });
});

describe("strengthenContrast", () => {
  it("十分なコントラストがあれば変更しない", () => {
    const result = strengthenContrast("#000000", "#FFFFFF");
    expect(result).toEqual({ foreground: "#000000", background: "#FFFFFF" });
  });

  it("コントラスト不足の場合は前景を暗く・背景を明るくする", () => {
    const result = strengthenContrast("#888888", "#999999");
    expect(contrastRatio(result.foreground, result.background)).toBeGreaterThan(
      contrastRatio("#888888", "#999999"),
    );
  });
});
