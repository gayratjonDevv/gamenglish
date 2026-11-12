export interface DisposableResource {
  dispose(): void;
}
export interface Lease<T> {
  value: T;
  release(): void;
}
type Entry<T> = { value: T; bytes: number; refs: number; used: number };

/** Exclusive ownership of decoded resources. Instances borrow, never dispose shared GPU data. */
export class AssetStore<T extends DisposableResource> {
  private entries = new Map<string, Entry<T>>();
  private pending = new Map<string, Promise<void>>();
  private waiters = new Map<string, number>();
  private usedBytes = 0;
  private clock = 0;
  private closed = false;
  constructor(readonly budgetBytes: number) {
    if (budgetBytes <= 0) throw new Error('Positive budget required');
  }
  async acquire(id: string, bytes: number, load: () => Promise<T>): Promise<Lease<T>> {
    if (this.closed) throw new Error('Asset store disposed');
    this.waiters.set(id, (this.waiters.get(id) ?? 0) + 1);
    try {
      if (!this.entries.has(id)) {
        let job = this.pending.get(id);
        if (!job) {
          job = (async () => {
            const value = await load();
            try {
              if (this.closed) throw new Error('Asset store disposed');
              this.makeRoom(bytes);
              this.entries.set(id, { value, bytes, refs: 0, used: ++this.clock });
              this.usedBytes += bytes;
            } catch (error) {
              value.dispose();
              throw error;
            }
          })();
          this.pending.set(id, job);
          // Delete only this job; rejection remains observed by every waiting caller.
          void job
            .finally(() => {
              if (this.pending.get(id) === job) this.pending.delete(id);
            })
            .catch(() => undefined);
        }
        await job;
      }
      if (this.closed) throw new Error('Asset store disposed');
      const entry = this.entries.get(id);
      if (!entry) throw new Error(`Asset ${id} unavailable`);
      entry.refs++;
      entry.used = ++this.clock;
      let released = false;
      return {
        value: entry.value,
        release: () => {
          if (released) return;
          released = true;
          entry.refs--;
          entry.used = ++this.clock;
        },
      };
    } finally {
      const count = (this.waiters.get(id) ?? 1) - 1;
      if (count) this.waiters.set(id, count);
      else this.waiters.delete(id);
    }
  }
  private makeRoom(bytes: number): void {
    if (!Number.isFinite(bytes) || bytes <= 0 || bytes > this.budgetBytes)
      throw new Error('Asset exceeds resident budget');
    const candidates = [...this.entries.entries()]
      .filter(([id, e]) => e.refs === 0 && !this.waiters.has(id))
      .sort((a, b) => a[1].used - b[1].used);
    for (const [id, entry] of candidates) {
      if (this.usedBytes + bytes <= this.budgetBytes) break;
      this.entries.delete(id);
      this.usedBytes -= entry.bytes;
      entry.value.dispose();
    }
    if (this.usedBytes + bytes > this.budgetBytes)
      throw new Error('Resident budget exhausted by active assets');
  }
  stats() {
    return { bytes: this.usedBytes, entries: this.entries.size, pending: this.pending.size };
  }
  dispose(): void {
    if (this.closed) return;
    this.closed = true;
    for (const entry of this.entries.values()) entry.value.dispose();
    this.entries.clear();
    this.usedBytes = 0;
  }
}
