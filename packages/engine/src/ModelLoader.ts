import { Box3, Texture, type Material, type Object3D } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { WebGLRenderer } from 'three';
import type { ReadyAsset } from '@gamenglish/contracts';
import { fetchBytes, resolvePath } from './net';
import { inspectGLB } from './glb';

export function disposeModel(root: Object3D) {
  const geometries = new Set<{ dispose(): void }>(),
    materials = new Set<Material>(),
    textures = new Set<Texture>();
  root.traverse((object) => {
    const mesh = object as Object3D & {
      geometry?: { dispose(): void };
      material?: Material | Material[];
    };
    if (mesh.geometry) geometries.add(mesh.geometry);
    for (const material of mesh.material
      ? Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      : []) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof Texture) textures.add(value);
    }
    const skinned = object as Object3D & { skeleton?: { boneTexture?: Texture } };
    if (skinned.skeleton?.boneTexture) textures.add(skinned.skeleton.boneTexture);
  });
  geometries.forEach((v) => v.dispose());
  textures.forEach((t) => {
    const image = t.image as { close?: () => void } | undefined;
    image?.close?.();
    t.dispose();
  });
  materials.forEach((m) => m.dispose());
}
export class ModelResource {
  constructor(readonly gltf: GLTF) {}
  instantiate() {
    return clone(this.gltf.scene);
  }
  dispose() {
    disposeModel(this.gltf.scene);
  }
}
export class ModelLoader {
  private loader = new GLTFLoader();
  private draco: DRACOLoader | undefined;
  private ktx: KTX2Loader | undefined;
  constructor(
    private baseUrl: string,
    renderer: WebGLRenderer,
    decoderBase?: string,
  ) {
    this.loader.setMeshoptDecoder(MeshoptDecoder);
    if (decoderBase) {
      this.draco = new DRACOLoader().setDecoderPath(resolvePath(decoderBase, 'draco/'));
      this.loader.setDRACOLoader(this.draco);
      this.ktx = new KTX2Loader()
        .setTranscoderPath(resolvePath(decoderBase, 'basis/'))
        .detectSupport(renderer);
      this.loader.setKTX2Loader(this.ktx);
    }
  }
  async load(asset: ReadyAsset): Promise<ModelResource> {
    if (asset.kind !== 'model' || !asset.path.endsWith('.glb'))
      throw new Error('Runtime accepts self-contained GLB models only');
    const url = resolvePath(this.baseUrl, asset.path),
      bytes = await fetchBytes(url, asset.bytes);
    if (bytes.byteLength !== asset.bytes) throw new Error('Model size mismatch');
    inspectGLB(bytes);
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)),
    )
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('');
    if (hash !== asset.sha256) throw new Error('Model checksum mismatch');
    const gltf = await this.loader.parseAsync(bytes.buffer as ArrayBuffer, new URL('.', url).href);
    const box = new Box3().setFromObject(gltf.scene);
    if (box.isEmpty()) {
      disposeModel(gltf.scene);
      throw new Error('GLB contains no renderable bounds');
    }
    return new ModelResource(gltf);
  }
  dispose() {
    this.draco?.dispose();
    this.ktx?.dispose();
  }
}
