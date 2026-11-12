import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve('dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp('apps/web/dist', output, { recursive: true });
let manifest;
try {
  manifest = JSON.parse(await readFile('asset-source/m01/manifest.json', 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  if (process.argv.includes('--require-assets'))
    throw new Error('Prepare the user-supplied mission models before deployment.');
  console.warn(
    'Mission binaries are external to Git. Run assets:prepare before playing; deployment requires assets:stage -- --require-assets.',
  );
  process.exit(0);
}
const target = resolve(output, 'assets/m01');
await mkdir(target, { recursive: true });
for (const entry of Object.values(manifest)) {
  const filename = entry.url.split('/').pop();
  if (!/^(boy|city)\.[a-f0-9]{12}\.glb$/.test(filename))
    throw new Error('Invalid prepared asset name.');
  const content = await readFile(resolve('asset-source/m01', filename));
  if (
    content.length !== entry.bytes ||
    createHash('sha256').update(content).digest('hex') !== entry.sha256
  )
    throw new Error(`Asset integrity failed: ${filename}`);
  await writeFile(resolve(target, filename), content);
}
await writeFile(resolve(target, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(
  'Verified mission models staged in dist/assets/m01. No model binaries are tracked in Git.',
);
