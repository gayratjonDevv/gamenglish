import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { Vector2, Vector3 } from 'three';
import { MissionWorld } from '../packages/engine/src/MissionWorld';
import { firstHello } from '../apps/web/src/features/mission';
import { readPreparedModel } from './helpers/preparedModels';
const prepared = existsSync('asset-source/m01/manifest.json');
describe.skipIf(!prepared)('supplied mission models — geometry integration', () => {
  it('parses sparse morph data, normalizes actors, animates bones and reaches both goals', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const manifest = JSON.parse(await readFile('asset-source/m01/manifest.json', 'utf8')) as Record<
      string,
      { url: string }
    >;
    const path = (role: string) => 'asset-source' + manifest[role]!.url.replace('/assets', '');
    const boy = await readPreparedModel(path('boy'));
    const city = await readPreparedModel(path('city'));
    let arrivals = 0;
    const world = new MissionWorld({ boy, city }, () => arrivals++);
    try {
      const child = world.actors[0]!;
      child.root.updateMatrixWorld(true);
      const hand = child.root.getObjectByName('handl');
      expect(hand).toBeDefined();
      const before = hand!.getWorldPosition(new Vector3());
      world.update(1 / 60, 1, new Vector2());
      child.root.updateMatrixWorld(true);
      expect(hand!.getWorldPosition(new Vector3()).distanceTo(before)).toBeGreaterThan(0.01);
      for (const id of ['walk', 'walk-again']) {
        const step = firstHello.steps.find((item) => item.id === id)!;
        world.setStep(step);
        world.walkToGoal();
        for (let frame = 0; frame < 400; frame++) world.update(1 / 60, frame / 60, new Vector2());
      }
      expect(arrivals).toBe(2);
      for (let frame = 0; frame < 400; frame++) world.update(1 / 60, frame / 60, new Vector2(1, 0));
      expect(child.root.position.x).toBeLessThanOrEqual(22);
    } finally {
      world.dispose();
      vi.unstubAllGlobals();
    }
  }, 30000);
});
