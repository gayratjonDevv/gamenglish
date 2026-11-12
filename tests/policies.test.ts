import { describe, it, expect } from 'vitest';
import { inspectSource, findDuplicateFunctions } from '../tools/policies/sourceRules';
import { inspectStyles } from '../tools/policies/styleRules';
describe('architecture guardrails', () => {
  it('rejects oversized source instead of relying on a prose rule', () => {
    expect(
      inspectSource(
        'apps/web/src/features/demo/ui/Large.tsx',
        '\n'.repeat(999) + 'export const value=1;',
      ).some((issue) => issue.rule === 'file-size'),
    ).toBe(true);
  });
  it('rejects cross-feature deep imports and unshared controls', () => {
    const issues = inspectSource(
      'apps/web/src/features/world/ui/Card.tsx',
      `import {Voice} from '../../voice/ui/Voice'; export function Card(){return <button style={{color:'red'}}>Go</button>;}`,
    );
    expect(issues.map((i) => i.rule)).toEqual(
      expect.arrayContaining(['feature-boundary', 'shared-control', 'inline-style']),
    );
  });
  it('keeps lower layers independent', () => {
    expect(
      inspectSource('packages/learning/src/bad.ts', `import {Scene} from 'three';`).some(
        (issue) => issue.rule === 'learning-boundary',
      ),
    ).toBe(true);
    expect(
      inspectSource(
        'apps/web/src/shared/ui/bad.ts',
        `import {Engine} from '@gamenglish/engine';`,
      ).some((issue) => issue.rule === 'shared-boundary'),
    ).toBe(true);
  });
  it('allows the shared primitive and public feature entrypoints', () => {
    expect(
      inspectSource(
        'apps/web/src/shared/ui/Button.tsx',
        'export function Button(){return <button/>;}',
      ),
    ).toEqual([]);
    expect(
      inspectSource('apps/web/src/app/App.tsx', `import {VoicePanel} from '../features/voice';`),
    ).toEqual([]);
  });
  it('rejects color/size literals and !important outside token owner', () => {
    const issues = inspectStyles(
      'apps/web/src/features/world/ui/world.module.css',
      '.card{color:#fff;padding:12px!important;}',
    );
    expect(issues.map((i) => i.rule)).toEqual(
      expect.arrayContaining(['color-token', 'size-token', 'specificity']),
    );
    expect(
      inspectStyles('apps/web/src/shared/styles/tokens.css', ':root{--space:12px;--color:#fff;}'),
    ).toEqual([]);
  });
  it('detects large identical function bodies across source files', () => {
    const source =
      'export function action(){' +
      Array.from({ length: 30 }, (_, i) => `console.log("operation-${i}");`).join('') +
      '}';
    expect(
      findDuplicateFunctions([
        { file: 'one.ts', source },
        { file: 'two.ts', source },
      ]),
    ).toHaveLength(1);
  });
  it('enforces exported arrow component count and named color tokens', () => {
    expect(
      inspectSource(
        'apps/web/src/features/demo/ui/Two.tsx',
        'export const First=()=> <p/>; export const Second=()=> <p/>;',
      ).some((issue) => issue.rule === 'one-component'),
    ).toBe(true);
    expect(
      inspectStyles(
        'apps/web/src/features/demo/ui/demo.module.css',
        '.card { background: red; }',
      ).some((issue) => issue.rule === 'color-token'),
    ).toBe(true);
    expect(
      inspectStyles(
        'apps/web/src/features/demo/ui/demo.module.css',
        '.card { color: var(--unknown); }',
        new Set(),
      ).some((issue) => issue.rule === 'unknown-token'),
    ).toBe(true);
  });
});
