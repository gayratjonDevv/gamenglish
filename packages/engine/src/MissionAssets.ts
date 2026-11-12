import { Mesh, Texture, type Material, type Object3D } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
type Entry = { url: string; bytes: number; sha256: string };
export type MissionAssets = { boy: GLTF; city: GLTF };
export async function loadMissionAssets(
  signal: AbortSignal,
  progress: (text: string, ratio: number) => void,
): Promise<MissionAssets> {
  const response = await fetch('/assets/m01/manifest.json', { signal });
  if (!response.ok)
    throw new Error('Model manifesti topilmadi. Aktivlarni tayyorlash buyrug‘ini bajaring.');
  const manifest = (await response.json()) as Record<string, Entry>;
  const models: GLTF[] = [];
  try {
    for (const [index, name] of ['city', 'boy'].entries()) {
      const entry = manifest[name];
      if (!entry || !/^\/assets\/m01\/[a-z]+\.[a-f0-9]+\.glb$/.test(entry.url))
        throw new Error('Model manzili noto‘g‘ri.');
      progress(name === 'city' ? 'Mahalla yuklanmoqda…' : 'Qahramonlar tayyorlanmoqda…', index / 2);
      const file = await fetch(entry.url, { signal });
      if (!file.ok) throw new Error(`${name} modeli yuklanmadi (${file.status}).`);
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength !== entry.bytes)
        throw new Error('Model to‘liq yuklanmadi. Qayta urinib ko‘ring.');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const hash = Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, '0'),
      ).join('');
      if (hash !== entry.sha256) throw new Error('Model yaxlitligi tekshiruvidan o‘tmadi.');
      const gltf = await new GLTFLoader().parseAsync(bytes, '/assets/m01/');
      models.push(gltf);
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    }
    const [city, boy] = models;
    if (!city || !boy) throw new Error('Modellar yetishmayapti.');
    return { boy, city };
  } catch (error) {
    models.forEach((model) => disposeModel(model.scene));
    throw error;
  }
}
export function disposeModel(root: Object3D) {
  const geometries = new Set<Mesh['geometry']>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof Texture) textures.add(value);
    }
  });
  textures.forEach((texture) => {
    texture.dispose();
    const image: unknown = texture.source.data;
    if (image instanceof ImageBitmap) image.close();
  });
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}
