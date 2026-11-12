import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inspectSource, findDuplicateFunctions, type Violation } from './policies/sourceRules';
import { inspectStyles } from './policies/styleRules';
async function walk(path: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'public'].includes(entry.name)) continue;
    const file = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(file)));
    else if (/\.(?:ts|tsx|css)$/.test(file)) files.push(file);
  }
  return files;
}
const paths = (await Promise.all(['apps/web', 'packages', 'tools', 'tests'].map(walk))).flat();
const files = await Promise.all(
  paths.map(async (file) => ({
    file: file.replaceAll('\\', '/'),
    source: await readFile(file, 'utf8'),
  })),
);
const tokenSource = files.find((file) => file.file.endsWith('/shared/styles/tokens.css'))!.source;
const knownTokens = new Set([...tokenSource.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]!));
const issues: Violation[] = [];
for (const file of files)
  issues.push(
    ...(file.file.endsWith('.css')
      ? inspectStyles(file.file, file.source, knownTokens)
      : inspectSource(file.file, file.source)),
  );
issues.push(
  ...findDuplicateFunctions(
    files.filter((file) => file.file.startsWith('apps/web/src') && !file.file.endsWith('.css')),
  ),
);
if (issues.length) {
  for (const issue of issues) console.error(`${issue.file} [${issue.rule}] ${issue.message}`);
  process.exitCode = 1;
} else console.log(`Architecture/design policies passed for ${files.length} source files.`);
