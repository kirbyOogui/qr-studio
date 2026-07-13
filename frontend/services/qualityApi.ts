import type { QualityCheckRequestDto, QualityCheckResponseDto } from "@/types/qr";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// Cloud Run は min-instances=0 のためコールドスタートが発生し得る。
// ユーザー体験を損なわないよう十分なタイムアウトを確保しつつ、
// 到達不能な場合はフロントエンドだけで安全側にフォールバックする。
const REQUEST_TIMEOUT_MS = 15_000;

export class QualityApiUnreachableError extends Error {}

export async function checkQuality(
  request: QualityCheckRequestDto,
): Promise<QualityCheckResponseDto> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/qr/quality-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        // 4xxはネットワーク到達不能ではなく、リクエスト自体が拒否されている
        // (フロントとバックエンドのスキーマ制約がずれている等、実装側の不具合の
        // 可能性が高い)。UIへは安全側にフォールバックしつつ、原因調査できるよう
        // devtoolsのコンソールには詳細を残す。
        const body = await response.text().catch(() => "");
        console.error(`quality-check request was rejected (${response.status}): ${body}`);
      }
      throw new QualityApiUnreachableError(`quality-check failed with status ${response.status}`);
    }

    return (await response.json()) as QualityCheckResponseDto;
  } catch (error) {
    if (error instanceof QualityApiUnreachableError) throw error;
    throw new QualityApiUnreachableError("quality-check request failed");
  } finally {
    clearTimeout(timeoutId);
  }
}
