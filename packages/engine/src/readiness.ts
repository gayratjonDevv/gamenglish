import type { AssetCatalog, SceneDefinition } from '@gamenglish/contracts';
export function missingSceneAssets(scene: SceneDefinition, catalog: AssetCatalog) {
  return [...new Set(scene.nodes.map((n) => n.assetId))].filter(
    (id) => !catalog.assets.some((a) => a.id === id && a.status === 'ready' && a.kind === 'model'),
  );
}
