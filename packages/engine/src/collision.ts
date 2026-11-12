import type { SceneDefinition } from '@gamenglish/contracts';
/** Authored static AABBs; invisible metadata, never visible placeholder meshes. */
export function canOccupy(x: number, z: number, scene: SceneDefinition, radius = 0.25) {
  const b = scene.bounds;
  if (
    x - radius < b.min[0] ||
    x + radius > b.max[0] ||
    z - radius < b.min[1] ||
    z + radius > b.max[1]
  )
    return false;
  return !scene.colliders.some((c) => {
    if (c.max[1] < b.groundY || c.min[1] > b.groundY + 1.6) return false;
    const px = Math.max(c.min[0], Math.min(x, c.max[0]));
    const pz = Math.max(c.min[2], Math.min(z, c.max[2]));
    return (px - x) ** 2 + (pz - z) ** 2 < radius ** 2;
  });
}
