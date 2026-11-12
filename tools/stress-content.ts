import assert from 'node:assert/strict';
import { contentIndexSchema, levelSchema, packSchema } from '@gamenglish/contracts';
import { findPack } from '@gamenglish/engine';
const total = 10_001,
  batch = 100;
const packs = [];
for (let first = 1; first <= total; first += batch)
  packs.push({
    id: `synthetic-${first}`,
    path: `packs/synthetic-${first}.json`,
    first,
    last: Math.min(first + batch - 1, total),
  });
const index = contentIndexSchema.parse({
  schemaVersion: 1,
  revision: 'synthetic',
  totalLevels: total,
  assetsPath: 'assets.json',
  audioPath: 'audio.json',
  vocabularyPath: 'vocabulary.json',
  scenes: [],
  packs,
});
let checked = 0;
for (const pack of index.packs) {
  const levels = [];
  for (let i = pack.first; i <= pack.last; i++) {
    assert.equal(findPack(index, i)?.id, pack.id);
    levels.push(
      levelSchema.parse({
        schemaVersion: 1,
        id: `synthetic.${i}`,
        ordinal: i,
        topicId: 'Z001',
        sceneId: 'synthetic',
        title: 'Synthetic infrastructure test',
        status: 'draft',
        prerequisites: [],
        requiredWords: [],
        taughtWords: [],
        cueIds: ['synthetic'],
        tasks: [{ id: 'synthetic', kind: 'instruction', cueId: 'synthetic' }],
      }),
    );
    checked++;
  }
  packSchema.parse({ schemaVersion: 1, id: pack.id, levels });
}
assert.equal(checked, total);
assert.equal(findPack(index, total + 1), undefined);
console.log(
  JSON.stringify(
    {
      syntheticLevels: checked,
      packs: index.packs.length,
      maxPackSize: 100,
      note: 'Infrastructure addressing/schema test only. No authored lessons, GLB/GPU benchmark, or multi-GB download claim.',
    },
    null,
    2,
  ),
);
