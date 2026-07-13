import { describe, expect, it } from "vitest";
import { validateUrl } from "./url";

describe("validateUrl", () => {
  it("accepts a well-formed https URL", () => {
    const result = validateUrl("https://example.com/path");
    expect(result.isValid).toBe(true);
    expect(result.normalizedUrl).toBe("https://example.com/path");
  });

  it("補完: スキームが省略された場合はhttpsを補う", () => {
    const result = validateUrl("example.com");
    expect(result.isValid).toBe(true);
    expect(result.normalizedUrl).toBe("https://example.com/");
  });

  it("rejects javascript: scheme (XSS対策)", () => {
    const result = validateUrl("javascript:alert(1)");
    expect(result.isValid).toBe(false);
  });

  it("rejects data: scheme", () => {
    const result = validateUrl("data:text/html,<script>alert(1)</script>");
    expect(result.isValid).toBe(false);
  });

  it("rejects empty input", () => {
    const result = validateUrl("   ");
    expect(result.isValid).toBe(false);
  });

  it("rejects overly long input", () => {
    const result = validateUrl(`https://example.com/${"a".repeat(3000)}`);
    expect(result.isValid).toBe(false);
  });
});
