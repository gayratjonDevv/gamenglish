import { Box3, Group, Mesh, type BufferGeometry, type Material, type Object3D } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export type Town = { root: Group; surfaces: Mesh[]; obstacles: Box3[]; dispose(): void };
export function createMissionTown(source: Object3D): Town {
  source.scale.setScalar(0.01);
  source.position.y = -1.94;
  source.updateMatrixWorld(true);
  const root = new Group();
  const obstacles: Box3[] = [];
  const batches = new Map<Material, BufferGeometry[]>();
  source.traverse((object) => {
    if (/^(casa|villa|albergo|barbiere)/i.test(object.name) && !('_0' === object.name.slice(-2))) {
      obstacles.push(new Box3().setFromObject(object).expandByScalar(0.3));
    }
    if (
      !(object instanceof Mesh) ||
      Array.isArray(object.material) ||
      /Icosphere.020/.test(object.name)
    )
      return;
    const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
    // Original scene is static. Bake transforms, then batch by its existing materials.
    const group = batches.get(object.material) ?? [];
    group.push(geometry);
    batches.set(object.material, group);
  });
  const surfaces: Mesh[] = [];
  for (const [material, geometries] of batches) {
    const merged = mergeGeometries(geometries, false);
    if (merged) {
      const mesh = new Mesh(merged, material);
      mesh.receiveShadow = true;
      // The town is large; characters cast the important foreground shadows.
      root.add(mesh);
      surfaces.push(mesh);
    }
    geometries.forEach((geometry) => geometry.dispose());
  }
  root.updateMatrixWorld(true);
  return {
    root,
    surfaces,
    obstacles,
    dispose: () => {
      surfaces.forEach((mesh) => mesh.geometry.dispose());
      root.clear();
    },
  };
}
