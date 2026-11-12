import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { audioCatalogSchema } from '@gamenglish/contracts';
const data = audioCatalogSchema.parse(
  JSON.parse(await readFile('apps/web/public/content/v1/audio.json', 'utf8')),
);
const rows = data.cues.flatMap((cue) =>
  cue.lines.map((line) => ({
    cueId: cue.id,
    locale: line.locale,
    script: line.text,
    assetId: line.assetId,
    status: 'recording-to-supply',
    delivery: '48kHz WAV master outside git; web MP3/AAC/OGG derivative; see docs/AUDIO.md',
  })),
);
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/audio-inventory.json', JSON.stringify(rows, null, 2) + '\n');
console.log(`Wrote ${rows.length} recording slots to artifacts/audio-inventory.json`);
