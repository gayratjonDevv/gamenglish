import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, extname, resolve, dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { assetCatalogSchema, assetSchema } from '@gamenglish/contracts';
import { inspectGLB } from '@gamenglish/engine';
const { values } = parseArgs({
  options: {
    file: { type: 'string' },
    id: { type: 'string' },
    license: { type: 'string' },
    source: { type: 'string' },
    'resident-mb': { type: 'string' },
    'animation-map': { type: 'string' },
  },
});
for (const name of ['file', 'id', 'license', 'source', 'resident-mb'] as const)
  if (!values[name]) throw new Error(`Missing --${name}`);
const catalogPath = resolve('apps/web/public/content/v1/assets.json');
const catalog = assetCatalogSchema.parse(JSON.parse(await readFile(catalogPath, 'utf8')));
const slot = catalog.assets.find((a) => a.id === values.id);
if (!slot) throw new Error('Declare the asset slot in assets.json first');
const file = resolve(values.file!),
  extension = extname(file).toLowerCase();
if (slot.kind === 'model' && extension !== '.glb')
  throw new Error('Only self-contained GLB models');
if (slot.kind === 'audio' && !['.mp3', '.ogg', '.m4a'].includes(extension))
  throw new Error('Use web audio derivatives, not WAV masters');
const info = await stat(file);
if (info.size > 128 * 1024 * 1024)
  throw new Error('Single asset exceeds starter 128MiB import limit; split/optimise it');
const bytes = await readFile(file);
const animationMap = JSON.parse(values['animation-map'] ?? '{}') as Record<string, string>;
if (slot.kind === 'model') {
  const glb = inspectGLB(bytes);
  for (const clip of Object.values(animationMap))
    if (!glb.animations.some((a) => a.name === clip))
      throw new Error(`Animation clip not found: ${clip}`);
}
const hash = createHash('sha256').update(bytes).digest('hex');
const folder = slot.kind === 'model' ? 'models' : slot.kind === 'audio' ? 'audio' : 'other';
const path = `${folder}/${values.id}.${hash.slice(0, 16)}${extension}`;
const asset = assetSchema.parse({
  ...slot,
  status: 'ready',
  path,
  bytes: bytes.byteLength,
  residentBytes: Math.ceil(Number(values['resident-mb']) * 1024 * 1024),
  sha256: hash,
  animationMap,
  license: values.license,
  source: values.source,
});
const destination = resolve('asset-source', path);
await mkdir(dirname(destination), { recursive: true });
await copyFile(file, destination);
catalog.assets = catalog.assets.map((a) => (a.id === asset.id ? asset : a));
catalog.revision = `dev-${Date.now()}`;
await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      assetId: asset.id,
      staged: destination,
      sourceName: basename(file),
      note: 'Metadata registered locally. Upload asset-source contents to your configured asset origin separately. No binaries enter Git.',
    },
    null,
    2,
  ),
);
