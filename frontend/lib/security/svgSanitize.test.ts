import { describe, expect, it } from "vitest";
import { sanitizeSvg } from "./svgSanitize";

describe("sanitizeSvg", () => {
  it("scriptタグを除去する", () => {
    const dirty = '<svg><script>alert(1)</script><circle r="5"/></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain("<script>");
  });

  it("onloadなどのイベントハンドラ属性を除去する", () => {
    const dirty = '<svg onload="alert(1)"><rect onclick="alert(2)" /></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain("onload");
    expect(clean).not.toContain("onclick");
  });

  it("foreignObjectを除去する", () => {
    const dirty = '<svg><foreignObject><body>evil</body></foreignObject></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain("foreignObject");
  });

  it("通常の描画要素は保持する", () => {
    const safe = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="5" fill="#000"/></svg>';
    const clean = sanitizeSvg(safe);
    expect(clean).toContain("circle");
  });
});
