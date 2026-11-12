import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { inspectSource } from './policies/sourceRules';
import { inspectStyles } from './policies/styleRules';
const { values } = parseArgs({ options: { name: { type: 'string' } } });
const name = values.name;
if (!name || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name))
  throw new Error('Use --name kebab-case; no path separators');
const panel =
  name
    .split('-')
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join('') + 'Panel';
const root = resolve('apps/web/src/features', name);
try {
  await access(root);
  throw new Error(`Feature already exists: ${name}`);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
const templates = [
  ['index.ts.tpl', 'index.ts'],
  ['model/types.ts.tpl', 'model/types.ts'],
  ['ui/Panel.tsx.tpl', `ui/${panel}.tsx`],
  ['ui/styles.module.css.tpl', `ui/${name}.module.css`],
];
const files = await Promise.all(
  templates.map(async ([template, target]) => {
    const source = (await readFile(resolve('templates/feature', template!), 'utf8'))
      .replaceAll('__FEATURE__', name)
      .replaceAll('__PANEL__', panel);
    const file = `apps/web/src/features/${name}/${target}`;
    const errors = file.endsWith('.css')
      ? inspectStyles(file, source)
      : inspectSource(file, source);
    if (errors.length) throw new Error(JSON.stringify(errors));
    return { target: resolve(root, target!), source };
  }),
);
await mkdir(root);
for (const file of files) {
  await mkdir(dirname(file.target), { recursive: true });
  await writeFile(file.target, file.source, { flag: 'wx' });
}
console.log(
  `Created ${name}: public API, typed props, UI and scoped styles. Run npm run format and npm run check before using it.`,
);
