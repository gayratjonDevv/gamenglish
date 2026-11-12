import { describe, it, expect, vi, afterEach } from 'vitest';
import { contentIndexSchema, pathSchema, levelSchema } from '@gamenglish/contracts';
import { ContentRepository, findPack, fetchBytes, resolvePath } from '@gamenglish/engine';
import { LevelSession } from '@gamenglish/learning';
const level = (ordinal: number) =>
  levelSchema.parse({
    schemaVersion: 1,
    id: `level.${ordinal}`,
    ordinal,
    topicId: 'Z001',
    sceneId: 'home',
    title: 'Hello',
    status: 'published',
    prerequisites: [],
    requiredWords: [],
    taughtWords: [],
    cueIds: ['cue'],
    tasks: [{ id: 'greet', kind: 'interact', targetNodeId: 'cat', wordId: 'hello', cueId: 'cue' }],
  });
const index = () =>
  contentIndexSchema.parse({
    schemaVersion: 1,
    revision: 'x',
    totalLevels: 4,
    assetsPath: 'assets.json',
    audioPath: 'audio.json',
    vocabularyPath: 'vocabulary.json',
    scenes: [],
    packs: [1, 2, 3, 4].map((i) => ({
      id: `pack-${i}`,
      path: `packs/${i}.json`,
      first: i,
      last: i,
    })),
  });
afterEach(() => vi.unstubAllGlobals());
describe('content delivery', () => {
  it('finds boundary ordinals and rejects overlapping ranges', () => {
    expect(findPack(index(), 4)?.id).toBe('pack-4');
    expect(findPack(index(), 5)).toBeUndefined();
    const invalid = index();
    invalid.packs[1]!.first = 1;
    expect(contentIndexSchema.safeParse(invalid).success).toBe(false);
  });
  it('loads only the requested pack and bounds its LRU', async () => {
    const fetch = vi.fn(async (url: string) => {
      const i = Number(url.match(/(\d+)\.json/)![1]);
      return new Response(
        JSON.stringify({ schemaVersion: 1, id: `pack-${i}`, levels: [level(i)] }),
      );
    });
    vi.stubGlobal('fetch', fetch);
    const repo = new ContentRepository('https://content.test/v1/', index(), 2);
    await repo.level(1);
    await repo.level(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    await repo.level(2);
    await repo.level(3);
    expect(repo.cachedPacks()).toBe(2);
    await repo.level(1);
    expect(fetch).toHaveBeenCalledTimes(4);
  });
  it('rejects path traversal and streamed over-budget responses', async () => {
    expect(pathSchema.safeParse('../secret').success).toBe(false);
    expect(() => resolvePath('https://a.test/root/', '../escape')).toThrow();
    vi.stubGlobal('fetch', async () => new Response('123456'));
    await expect(fetchBytes('https://a.test/', 3)).rejects.toThrow('budget');
  });
  it('does not award a draft lesson and advances only the correct interaction', () => {
    expect(() => new LevelSession({ ...level(1), status: 'draft' }, new Set(), new Map())).toThrow(
      'Draft',
    );
    const session = new LevelSession(level(1), new Set(), new Map());
    expect(session.advance({ kind: 'interaction', nodeId: 'bowl' })).toBe(false);
    expect(session.completed).toBe(false);
    expect(session.advance({ kind: 'interaction', nodeId: 'cat' })).toBe(true);
    expect(session.completed).toBe(true);
  });
});
