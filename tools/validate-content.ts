import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assetCatalogSchema,
  audioCatalogSchema,
  contentIndexSchema,
  packSchema,
  sceneSchema,
  vocabularySchema,
  type Level,
} from '@gamenglish/contracts';
const root = resolve('apps/web/public/content/v1');
const json = async (path: string) =>
  JSON.parse(await readFile(resolve(root, path), 'utf8')) as unknown;
const index = contentIndexSchema.parse(await json('index.json'));
const assets = assetCatalogSchema.parse(await json(index.assetsPath));
const audio = audioCatalogSchema.parse(await json(index.audioPath));
const vocabulary = vocabularySchema.parse(await json(index.vocabularyPath));
const unique = (ids: string[], label: string) => {
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${label}`);
};
const requireId = (ids: Set<string>, id: string, label: string) => {
  if (!ids.has(id)) throw new Error(`Unknown ${label}: ${id}`);
};
unique(
  audio.cues.map((c) => c.id),
  'audio cue',
);
unique(
  vocabulary.words.map((w) => w.id),
  'word',
);
const assetIds = new Set(assets.assets.map((a) => a.id)),
  cueIds = new Set(audio.cues.map((c) => c.id)),
  wordIds = new Set(vocabulary.words.map((w) => w.id));
const curriculum = (await json('curriculum.json')) as { modules: { topics: { id: string }[] }[] };
const topicIds = new Set(curriculum.modules.flatMap((m) => m.topics.map((t) => t.id)));
for (const cue of audio.cues) {
  unique(
    cue.lines.map((l) => l.locale),
    `cue language ${cue.id}`,
  );
  for (const line of cue.lines)
    if (line.assetId) {
      requireId(assetIds, line.assetId, 'audio asset');
      if (assets.assets.find((a) => a.id === line.assetId)?.kind !== 'audio')
        throw new Error('Voice asset must be audio');
    }
}
for (const word of vocabulary.words) {
  requireId(cueIds, word.cueId, 'word cue');
  requireId(topicIds, word.topicId, 'word topic');
}
const scenes = new Map<string, ReturnType<typeof sceneSchema.parse>>();
for (const ref of index.scenes) {
  const scene = sceneSchema.parse(await json(ref.path));
  if (scene.id !== ref.id) throw new Error('Scene ID mismatch');
  for (const node of scene.nodes) {
    requireId(assetIds, node.assetId, 'model');
    if (assets.assets.find((a) => a.id === node.assetId)?.kind !== 'model')
      throw new Error('Scene asset must be model');
  }
  scenes.set(scene.id, scene);
}
const levels: Level[] = [];
for (const ref of index.packs) {
  const pack = packSchema.parse(await json(ref.path));
  if (
    pack.id !== ref.id ||
    pack.levels.length !== ref.last - ref.first + 1 ||
    pack.levels.some((l, i) => l.ordinal !== ref.first + i)
  )
    throw new Error('Pack/index mismatch');
  levels.push(...pack.levels);
}
unique(
  levels.map((l) => l.id),
  'level ID',
);
unique(
  levels.map((l) => String(l.ordinal)),
  'ordinal',
);
const levelIds = new Set(levels.map((l) => l.id));
for (const level of levels) {
  if (!scenes.has(level.sceneId)) throw new Error('Unknown scene');
  requireId(topicIds, level.topicId, 'topic');
  for (const id of level.prerequisites) requireId(levelIds, id, 'level prerequisite');
  for (const id of [...level.taughtWords, ...level.requiredWords.map((w) => w.wordId)])
    requireId(wordIds, id, 'level word');
  for (const id of level.cueIds) requireId(cueIds, id, 'level cue');
  for (const task of level.tasks) {
    requireId(cueIds, task.cueId, 'task cue');
    if (task.kind === 'interact') {
      requireId(wordIds, task.wordId, 'task word');
      if (
        !scenes.get(level.sceneId)!.nodes.some((n) => n.id === task.targetNodeId && n.interactive)
      )
        throw new Error('Task target not interactive');
    }
  }
}
// Kahn's algorithm avoids stack overflow on a 10k-node dependency chain.
const degree = new Map(levels.map((l) => [l.id, l.prerequisites.length]));
const outgoing = new Map<string, string[]>();
for (const l of levels)
  for (const id of l.prerequisites) {
    const list = outgoing.get(id) ?? [];
    list.push(l.id);
    outgoing.set(id, list);
  }
const queue = levels.filter((l) => !l.prerequisites.length).map((l) => l.id);
let visited = 0;
for (let i = 0; i < queue.length; i++) {
  visited++;
  for (const id of outgoing.get(queue[i]!) ?? []) {
    degree.set(id, degree.get(id)! - 1);
    if (degree.get(id) === 0) queue.push(id);
  }
}
if (visited !== levels.length) throw new Error('Level dependency cycle');
const missing = assets.assets.filter((a) => a.status === 'missing');
const drafts = levels.filter((l) => l.status === 'draft');
if (process.argv.includes('--release') && (missing.length || drafts.length))
  throw new Error(
    `Release blocked: ${missing.length} missing assets, ${drafts.length} draft lessons`,
  );
console.log(
  JSON.stringify(
    {
      valid: true,
      topicOutlines: topicIds.size,
      levels: levels.length,
      published: levels.length - drafts.length,
      missingAssets: missing.length,
      note: 'Draft content and missing licensed assets are intentional; --release blocks them.',
    },
    null,
    2,
  ),
);
