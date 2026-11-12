import postcss from 'postcss';
import type { Violation } from './sourceRules';
export function inspectStyles(
  file: string,
  source: string,
  knownTokens?: ReadonlySet<string>,
): Violation[] {
  const issues: Violation[] = [];
  const report = (rule: string, message: string) => issues.push({ file, rule, message });
  if (source.trimEnd().split('\n').length > 250)
    report('style-size', 'CSS maximum is 250 lines; split by owner.');
  const tokens = file.endsWith('/shared/styles/tokens.css');
  const tree = postcss.parse(source, { from: file });
  const selectors = new WeakMap<object, Set<string>>();
  tree.walkRules((rule) => {
    if (!rule.parent) return;
    const scope = selectors.get(rule.parent) ?? new Set<string>();
    if (scope.has(rule.selector))
      report('duplicate-selector', 'Merge duplicate selectors within the same CSS scope.');
    scope.add(rule.selector);
    selectors.set(rule.parent, scope);
  });
  tree.walkDecls((declaration) => {
    if (knownTokens)
      for (const match of declaration.value.matchAll(/var\((--[\w-]+)/g))
        if (!knownTokens.has(match[1]!))
          report('unknown-token', `Unknown design token ${match[1]}`);
    const literal = declaration.value.replace(/var\([^)]*\)/g, '').trim();
    if (
      !tokens &&
      /^(color|background|background-color|fill|stroke)$/.test(declaration.prop) &&
      literal &&
      !/^(transparent|inherit|currentColor|none|unset)$/.test(literal)
    )
      report('color-token', 'Use an approved semantic color token.');
    if (!tokens && /#[a-f0-9]{3,8}\b|\b(?:rgb|hsl)a?\s*\(/i.test(declaration.value))
      report('color-token', 'Colors belong in tokens.css.');
    if (!tokens && /-?\d+(?:\.\d+)?px\b/.test(declaration.value))
      report(
        'size-token',
        'Pixel values belong in tokens.css; media-query breakpoints are the documented exception.',
      );
    if (!tokens && declaration.prop.startsWith('--'))
      report('token-owner', 'Define design tokens only in tokens.css.');
    if (declaration.important)
      report('specificity', 'Do not use !important; fix component ownership and selectors.');
  });
  tree.walkAtRules('import', (rule) => {
    if (/https?:/.test(rule.params))
      report('external-style', 'Styles must not depend on third-party network font/style imports.');
  });
  if (!file.endsWith('/shared/styles/base.css') && !tokens && !file.endsWith('.module.css'))
    report('scoped-style', 'Feature and component CSS must use CSS Modules.');
  return issues;
}
