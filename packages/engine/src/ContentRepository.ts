import {
  contentIndexSchema,
  packSchema,
  type ContentIndex,
  type Level,
  type LevelPack,
} from '@gamenglish/contracts';
import { fetchJson, resolvePath } from './net';

export function findPack(index: ContentIndex, ordinal: number) {
  let low = 0,
    high = index.packs.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    const p = index.packs[mid]!;
    if (ordinal < p.first) high = mid - 1;
    else if (ordinal > p.last) low = mid + 1;
    else return p;
  }
  return undefined;
}
export class ContentRepository {
  private cache = new Map<string, LevelPack>();
  constructor(
    readonly baseUrl: string,
    readonly index: ContentIndex,
    private maxPacks = 3,
  ) {
    if (maxPacks < 1) throw new Error('Positive pack cache required');
  }
  static async open(baseUrl: string, signal?: AbortSignal) {
    return new ContentRepository(
      baseUrl,
      await fetchJson(resolvePath(baseUrl, 'index.json'), contentIndexSchema, signal),
    );
  }
  async level(ordinal: number, signal?: AbortSignal): Promise<Level> {
    if (!Number.isSafeInteger(ordinal) || ordinal < 1) throw new Error('Invalid level ordinal');
    const ref = findPack(this.index, ordinal);
    if (!ref) throw new Error('Level not authored');
    let pack = this.cache.get(ref.id);
    if (!pack) {
      pack = await fetchJson(resolvePath(this.baseUrl, ref.path), packSchema, signal);
      if (
        pack.id !== ref.id ||
        pack.levels.length !== ref.last - ref.first + 1 ||
        pack.levels.some((l, i) => l.ordinal !== ref.first + i)
      )
        throw new Error('Pack differs from index range');
    }
    this.cache.delete(ref.id);
    this.cache.set(ref.id, pack);
    while (this.cache.size > this.maxPacks) this.cache.delete(this.cache.keys().next().value!);
    const level = pack.levels.find((l) => l.ordinal === ordinal);
    if (!level) throw new Error('Indexed level missing');
    return level;
  }
  cachedPacks() {
    return this.cache.size;
  }
  clear() {
    this.cache.clear();
  }
}
