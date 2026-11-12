import type { z } from 'zod';

/** Base URLs are deployment configuration, never lesson-controlled arbitrary hosts. */
export function resolvePath(base: string, path: string): string {
  const origin = typeof location === 'undefined' ? 'https://local.invalid/' : location.href;
  const root = new URL(base.endsWith('/') ? base : `${base}/`, origin);
  const url = new URL(path, root);
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname))
    throw new Error('Path escaped configured base');
  return url.href;
}
export async function fetchBytes(
  url: string,
  maxBytes: number,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const timeout = AbortSignal.timeout(30_000);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const response = await fetch(url, { signal: combined, credentials: 'omit' });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  if (Number(response.headers.get('Content-Length')) > maxBytes) {
    await response.body?.cancel();
    throw new Error('Download exceeds byte budget');
  }
  if (!response.body) throw new Error('Empty response body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error('Download exceeds byte budget');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const bytes = await fetchBytes(url, 2 * 1024 * 1024, signal);
  return schema.parse(JSON.parse(new TextDecoder().decode(bytes)));
}
