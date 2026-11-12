import { describe, it, expect, vi } from 'vitest';
import { AssetStore } from '@gamenglish/engine';
const resource = () => ({ dispose: vi.fn() });
describe('asset ownership', () => {
  it('single-flights concurrent acquisition and releases idempotently', async () => {
    const s = new AssetStore(10),
      r = resource();
    const load = vi.fn(async () => r);
    const [a, b] = await Promise.all([s.acquire('a', 6, load), s.acquire('a', 6, load)]);
    expect(load).toHaveBeenCalledTimes(1);
    a.release();
    a.release();
    b.release();
    s.dispose();
    expect(r.dispose).toHaveBeenCalledTimes(1);
  });
  it('evicts only unreferenced resources and preserves active scenes', async () => {
    const s = new AssetStore(10),
      a = resource(),
      b = resource();
    const handle = await s.acquire('a', 6, async () => a);
    await expect(s.acquire('b', 6, async () => b)).rejects.toThrow('exhausted');
    expect(a.dispose).not.toHaveBeenCalled();
    expect(b.dispose).toHaveBeenCalledTimes(1);
    handle.release();
    await s.acquire('b', 6, async () => resource());
    expect(a.dispose).toHaveBeenCalledTimes(1);
    s.dispose();
  });
  it('disposes an in-flight result when engine closes', async () => {
    let finish!: (v: ReturnType<typeof resource>) => void;
    const s = new AssetStore(10),
      r = resource();
    const promise = s.acquire(
      'a',
      5,
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    s.dispose();
    finish(r);
    await expect(promise).rejects.toThrow('disposed');
    expect(r.dispose).toHaveBeenCalledTimes(1);
  });
  it('allows retry after a failed load', async () => {
    const s = new AssetStore(10);
    await expect(
      s.acquire('a', 5, async () => {
        throw Error('network');
      }),
    ).rejects.toThrow('network');
    const lease = await s.acquire('a', 5, async () => resource());
    lease.release();
    expect(s.stats().entries).toBe(1);
    s.dispose();
  });
});
