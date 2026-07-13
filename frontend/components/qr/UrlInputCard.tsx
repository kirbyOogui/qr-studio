"use client";

import { useId, useState } from "react";
import { Card } from "@/components/ui/Card";
import { validateUrl } from "@/lib/validation/url";

interface UrlInputCardProps {
  value: string;
  onValidUrl: (url: string) => void;
}

export function UrlInputCard({ value, onValidUrl }: UrlInputCardProps) {
  const [rawInput, setRawInput] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  const handleChange = (next: string) => {
    setRawInput(next);
    if (next.trim().length === 0) {
      setError(null);
      onValidUrl("");
      return;
    }
    const result = validateUrl(next);
    if (result.isValid) {
      setError(null);
      onValidUrl(result.normalizedUrl);
    } else {
      setError(result.error ?? "URLを確認してください。");
    }
  };

  return (
    <Card>
      <label htmlFor={inputId} className="mb-3 block text-[15px] font-medium text-ink">
        URLを入力してください
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://example.com"
        value={rawInput}
        onChange={(event) => handleChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className="w-full rounded-2xl border border-black/10 bg-canvas px-4 py-3.5 text-[17px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
      {!error && (
        <p className="mt-2 text-sm text-ink/40">
          入力するだけで、読み取りやすく美しいQRコードを自動生成します。
        </p>
      )}
    </Card>
  );
}
