// ユーザー入力URLのバリデーション。XSS/SSRF/スキーム偽装対策として
// http/https以外のスキーム（javascript:, data:, file: 等）を明示的に拒否する。

const MAX_URL_LENGTH = 2048;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  error?: string;
}

export function validateUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { isValid: false, normalizedUrl: "", error: "URLを入力してください。" };
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return { isValid: false, normalizedUrl: "", error: "URLが長すぎます。" };
  }

  // スキームが省略されている場合は https を補完する（ユーザーに手間をかけさせない）。
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { isValid: false, normalizedUrl: "", error: "有効なURLの形式ではありません。" };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { isValid: false, normalizedUrl: "", error: "http/https形式のURLのみ利用できます。" };
  }
  if (!parsed.hostname) {
    return { isValid: false, normalizedUrl: "", error: "有効なURLの形式ではありません。" };
  }

  return { isValid: true, normalizedUrl: parsed.toString() };
}
