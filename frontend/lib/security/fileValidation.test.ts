import { describe, expect, it } from "vitest";
import { sniffImageType } from "./fileValidation";

function makeFile(bytes: number[], name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("sniffImageType", () => {
  it("PNGのマジックナンバーを検出する", async () => {
    const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0];
    const file = makeFile(pngHeader, "logo.png", "image/png");
    expect(await sniffImageType(file)).toBe("png");
  });

  it("拡張子偽装を検出する(pngを名乗るがJPEGの中身)", async () => {
    const jpegHeader = [0xff, 0xd8, 0xff, 0, 0, 0, 0, 0];
    const file = makeFile(jpegHeader, "fake.png", "image/png");
    expect(await sniffImageType(file)).toBe("jpeg");
  });

  it("不正なバイナリはnullを返す", async () => {
    const file = makeFile([1, 2, 3, 4, 5, 6, 7, 8], "evil.exe", "application/octet-stream");
    expect(await sniffImageType(file)).toBeNull();
  });

  it("SVGの中身を検出する", async () => {
    const svgText = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const file = new File([svgText], "logo.svg", { type: "image/svg+xml" });
    expect(await sniffImageType(file)).toBe("svg");
  });
});
