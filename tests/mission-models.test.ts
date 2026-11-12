import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { Vector2, Vector3 } from 'three';
import { MissionWorld } from '../packages/engine/src/MissionWorld';
import type { MissionSceneEvent } from '../packages/contracts/src';
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
    expect(boy.animations.map((clip) => clip.name)).toEqual([
      'idle',
      'walk',
      'talk',
      'wave',
      'listen',
    ]);
    const city = await readPreparedModel(path('city'));
    let arrivals = 0;
    const events: MissionSceneEvent[] = [];
    const world = new MissionWorld(
      { boy, city },
      () => arrivals++,
      (event) => events.push(event),
    );
    try {
      const child = world.actors[0]!;
      child.root.updateMatrixWorld(true);
      const hand = child.root.getObjectByName('handl');
      expect(hand).toBeDefined();
      world.update(1 / 60, 1, new Vector2());
      child.root.updateMatrixWorld(true);
      const shoulder = child.root.getObjectByName('arm_stretchl')!.getWorldPosition(new Vector3());
      expect(hand!.getWorldPosition(new Vector3()).y).toBeLessThan(shoulder.y - 0.15);
      child.waving = true;
      const heights: number[] = [];
      for (let frame = 0; frame < 360; frame++) {
        child.update(1 / 60, frame / 60, false);
        child.root.updateMatrixWorld(true);
        heights.push(child.root.getObjectByName('handr')!.getWorldPosition(new Vector3()).y);
      }
      expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.3);
      const shoulderHeight = child.root
        .getObjectByName('arm_stretchr')!
        .getWorldPosition(new Vector3()).y;
      expect(heights.at(-1)!).toBeLessThan(shoulderHeight - 0.2);
      for (const id of ['walk', 'walk-again']) {
        const step = firstHello.steps.find((item) => item.id === id)!;
        world.setStep(step);
        world.walkToGoal();
        for (let frame = 0; frame < 600; frame++) world.update(1 / 60, frame / 60, new Vector2());
      }
      expect(arrivals).toBe(2);
      const meeting = firstHello.steps.find((step) => step.id === 'first-hello')!;
      world.setStep(meeting);
      expect(
        events.some((event) => event.type === 'line-ready' && event.stepId === meeting.id),
      ).toBe(false);
      for (let frame = 0; frame < 1200; frame++) world.update(1 / 60, frame / 60, new Vector2());
      world.setStep(meeting);
      expect(
        events.filter((event) => event.type === 'line-ready' && event.stepId === meeting.id),
      ).toHaveLength(1);
      expect(
        events.filter((event) => event.type === 'staged' && event.stepId === meeting.id),
      ).toHaveLength(1);

      for (const id of ['mother-hello', 'hello-meaning']) {
        const positions = world.actors.map((actor) => actor.root.position.clone());
        const step = firstHello.steps.find((item) => item.id === id)!;
        world.setStep(step);
        world.actors.forEach((actor, index) =>
          expect(actor.root.position.distanceTo(positions[index]!)).toBe(0),
        );
        for (let frame = 0; frame < 450; frame++) world.update(1 / 60, frame / 60, new Vector2());
        expect(
          events.filter((event) => event.type === 'line-ready' && event.stepId === id),
        ).toHaveLength(1);
        expect(
          events.filter((event) => event.type === 'staged' && event.stepId === id),
        ).toHaveLength(1);
        expect(child.root.getObjectByName('headx')!.quaternion.lengthSq()).toBeCloseTo(1);
      }
      for (let frame = 0; frame < 600; frame++) world.update(1 / 60, frame / 60, new Vector2(1, 0));
      expect(child.root.position.x).toBeLessThanOrEqual(22);
    } finally {
      world.dispose();
      vi.unstubAllGlobals();
    }
  }, 30000);
});
