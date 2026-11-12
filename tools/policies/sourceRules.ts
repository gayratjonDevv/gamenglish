import * as ts from 'typescript-ast';
import { posix } from 'node:path';
export type Violation = { file: string; rule: string; message: string };
const normalized = (value: string) => value.replaceAll('\\', '/');
function exportedComponentCount(node: ts.Node): number {
  if (
    !ts.canHaveModifiers(node) ||
    !ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  )
    return 0;
  if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name)
    return /^[A-Z]/.test(node.name.text) ? 1 : 0;
  if (ts.isVariableStatement(node))
    return node.declarationList.declarations.filter(
      (declaration) =>
        ts.isIdentifier(declaration.name) &&
        /^[A-Z]/.test(declaration.name.text) &&
        declaration.initializer,
    ).length;
  return 0;
}
export function inspectSource(file: string, source: string): Violation[] {
  const issues: Violation[] = [];
  const name = normalized(file);
  const report = (rule: string, message: string) => issues.push({ file: name, rule, message });
  const ui = name.endsWith('.tsx');
  const hook = /\/use[A-Z][^/]*\.ts$/.test(name);
  const limit = ui || hook ? 180 : 350;
  const lines = source.trimEnd().split('\n').length;
  if (lines > limit)
    report(
      'file-size',
      `${lines} lines; maximum ${limit}. Split responsibilities, never minify to evade the limit.`,
    );
  const tree = ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.Latest,
    true,
    ui ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const imports = ts.preProcessFile(source, true, true).importedFiles.map((item) => item.fileName);
  for (const specifier of imports) {
    const target = specifier.startsWith('.')
      ? posix.normalize(posix.join(posix.dirname(name), specifier))
      : specifier;
    const currentFeature = /apps\/web\/src\/features\/([^/]+)/.exec(name)?.[1];
    const targetFeature = /apps\/web\/src\/features\/([^/]+)/.exec(target)?.[1];
    if (currentFeature && targetFeature && currentFeature !== targetFeature)
      report(
        'feature-boundary',
        'Features communicate through app orchestration, not imports from another feature.',
      );
    if (
      name.includes('/shared/') &&
      (target.includes('/features/') ||
        target.includes('/app/') ||
        /^@gamenglish\/(engine|learning)/.test(target))
    )
      report(
        'shared-boundary',
        'Shared UI cannot depend on app, features, engine or learning infrastructure.',
      );
    if (!currentFeature && targetFeature && target.split('/features/')[1]!.split('/').length > 1)
      report('public-api', 'Use the feature public index rather than a deep import.');
    if (
      name.startsWith('packages/contracts/') &&
      (/@gamenglish\/(engine|learning)/.test(specifier) || ['react', 'three'].includes(specifier))
    )
      report('contracts-boundary', 'Contracts must not import upper layers.');
    if (
      name.startsWith('packages/learning/') &&
      (/@gamenglish\/engine/.test(specifier) || ['react', 'react-dom', 'three'].includes(specifier))
    )
      report('learning-boundary', 'Learning domain must not depend on rendering.');
    if (
      name.startsWith('packages/engine/') &&
      (specifier.startsWith('react') || specifier.startsWith('@gamenglish/learning'))
    )
      report('engine-boundary', 'Engine must not import React or learning domain.');
    if (/^@gamenglish\/[^/]+\//.test(specifier) && specifier !== '@gamenglish/engine/runtime')
      report('package-api', 'Import declared package entrypoints only.');
  }
  let components = 0;
  function visit(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword)
      report('no-explicit-any', 'Use a domain type or unknown with narrowing.');
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(tree);
      if (tag === 'button' && !name.endsWith('/shared/ui/Button.tsx'))
        report('shared-control', 'Use shared Button.');
      if (tag === 'select' && !name.endsWith('/shared/ui/SelectField.tsx'))
        report('shared-control', 'Use shared SelectField.');
      for (const attribute of node.attributes.properties)
        if (ts.isJsxAttribute(attribute) && attribute.name.getText(tree) === 'style')
          report('inline-style', 'Use a scoped CSS module and design tokens.');
    }
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node) ||
      ts.isMethodDeclaration(node)
    ) {
      const start = tree.getLineAndCharacterOfPosition(node.getStart(tree)).line,
        end = tree.getLineAndCharacterOfPosition(node.end).line;
      if (end - start + 1 > 120)
        report(
          'function-size',
          'Function exceeds 120 physical lines; extract a coherent responsibility.',
        );
    }
    components += exportedComponentCount(node);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  if (ui && components > 1) report('one-component', 'One exported UI component per TSX file.');
  return issues;
}
/** Exact structural clones only. Semantic duplication still needs human review. */
export function findDuplicateFunctions(files: { file: string; source: string }[]): Violation[] {
  const seen = new Map<string, string>();
  const issues: Violation[] = [];
  for (const { file, source } of files) {
    const tree = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const printer = ts.createPrinter({ removeComments: true });
    function visit(node: ts.Node) {
      if (
        (ts.isFunctionDeclaration(node) ||
          ts.isArrowFunction(node) ||
          ts.isFunctionExpression(node)) &&
        node.body
      ) {
        const fingerprint = printer.printNode(ts.EmitHint.Unspecified, node.body, tree).trim();
        if (fingerprint.length >= 300) {
          const previous = seen.get(fingerprint);
          if (previous && previous !== file)
            issues.push({
              file,
              rule: 'duplicate-function',
              message: `Large identical function body also exists in ${previous}; reuse or justify separate behavior.`,
            });
          else seen.set(fingerprint, file);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  return issues;
}
