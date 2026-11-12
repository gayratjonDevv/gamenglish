import { it, expect } from 'vitest';
import { sceneSchema } from '@gamenglish/contracts';
import { canOccupy, missingSceneAssets } from '@gamenglish/engine';
const scene = sceneSchema.parse({
  schemaVersion: 1,
  id: 'home',
  label: 'Home',
  camera: { position: [0, 3, 5], target: [0, 0, 0] },
  bounds: { min: [-5, -5], max: [5, 5], groundY: 0 },
  colliders: [{ min: [1, 0, 1], max: [2, 2, 2] }],
  nodes: [
    {
      id: 'home',
      assetId: 'home-glb',
      role: 'static',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
    },
  ],
});
it('blocks authored walls and world bounds without rendering primitive meshes', () => {
  expect(canOccupy(0, 0, scene)).toBe(true);
  expect(canOccupy(1.1, 1.1, scene)).toBe(false);
  expect(canOccupy(5, 0, scene)).toBe(false);
});
it('blocks missing models instead of substituting shapes', () => {
  expect(missingSceneAssets(scene, { schemaVersion: 1, revision: 'x', assets: [] })).toEqual([
    'home-glb',
  ]);
});
