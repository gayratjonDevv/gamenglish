import {
  AnimationMixer,
  Color,
  DirectionalLight,
  HemisphereLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SRGBColorSpace,
  ACESFilmicToneMapping,
  Vector2,
  Vector3,
  WebGLRenderer,
  type AnimationAction,
  type Object3D,
} from 'three';
import type { AssetCatalog, SceneDefinition } from '@gamenglish/contracts';
import { AssetStore, type Lease } from './AssetStore';
import { ModelLoader, type ModelResource } from './ModelLoader';
import { canOccupy } from './collision';
import { missingSceneAssets } from './readiness';

type Actor = {
  root: Object3D;
  mixer: AnimationMixer;
  actions: Map<string, AnimationAction>;
  current?: string;
};
type SceneScope = {
  scene: Scene;
  leases: Lease<ModelResource>[];
  actors: Actor[];
  player?: Actor;
  definition: SceneDefinition;
};
export type EngineEvent =
  | { type: 'interaction'; nodeId: string }
  | { type: 'error'; message: string };
export class GameEngine {
  readonly renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  private scope: SceneScope | undefined;
  private store: AssetStore<ModelResource>;
  private loader: ModelLoader;
  private version = 0;
  private closed = false;
  private keys = new Set<string>();
  private touch = new Vector2();
  private resize: ResizeObserver;
  private previous = 0;
  private raycaster = new Raycaster();
  private hidden = false;
  private contextLost = false;
  constructor(
    private canvas: HTMLCanvasElement,
    private catalog: AssetCatalog,
    assetBase: string,
    private emit: (event: EngineEvent) => void,
    decoderBase?: string,
    budgetBytes = 192 * 1024 * 1024,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.camera = new PerspectiveCamera(50, 1, 0.1, 150);
    this.store = new AssetStore(budgetBytes);
    this.loader = new ModelLoader(assetBase, this.renderer, decoderBase);
    this.resize = new ResizeObserver(() => this.resizeCanvas());
    this.resize.observe(canvas);
    this.resizeCanvas();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
    canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    this.renderer.setAnimationLoop(this.frame);
  }
  private resizeCanvas() {
    const { width, height } = this.canvas.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key))
      e.preventDefault();
    this.keys.add(e.key.toLowerCase());
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };
  private onBlur = () => {
    this.keys.clear();
    this.touch.set(0, 0);
  };
  private onVisibility = () => {
    this.hidden = document.hidden;
    this.previous = 0;
    if (this.hidden) this.onBlur();
  };
  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.onBlur();
    this.emit({ type: 'error', message: 'Grafik kontekst uzildi. Sahnani qayta oching.' });
  };
  setTouch(x: number, z: number) {
    this.touch.set(x, z).clampLength(0, 1);
  }
  private onClick = (event: MouseEvent) => {
    if (!this.scope) return;
    const rect = this.canvas.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    for (const hit of this.raycaster.intersectObjects(this.scope.scene.children, true)) {
      let object: Object3D | null = hit.object;
      while (object) {
        if (object.userData.interactive === true) {
          this.emit({ type: 'interaction', nodeId: String(object.userData.nodeId) });
          return;
        }
        object = object.parent;
      }
    }
  };
  async enter(definition: SceneDefinition): Promise<void> {
    if (this.closed) throw new Error('Engine disposed');
    const missing = missingSceneAssets(definition, this.catalog);
    if (missing.length) throw new Error(`Missing approved assets: ${missing.join(', ')}`);
    const version = ++this.version;
    const scope: SceneScope = { scene: new Scene(), leases: [], actors: [], definition };
    scope.scene.background = new Color('#c3d1cf');
    scope.scene.add(new HemisphereLight(0xffffff, 0x52605a, 2));
    const sun = new DirectionalLight(0xfff1d6, 3);
    sun.position.set(6, 10, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scope.scene.add(sun);
    try {
      // Bounded decoding concurrency; no unbounded Promise.all over a whole scene/world.
      for (const node of definition.nodes) {
        const asset = this.catalog.assets.find((a) => a.id === node.assetId);
        if (!asset || asset.status !== 'ready') throw new Error('Missing asset');
        const lease = await this.store.acquire(
          `${this.catalog.revision}:${asset.id}`,
          asset.residentBytes,
          () => this.loader.load(asset),
        );
        scope.leases.push(lease);
        if (this.closed || version !== this.version) throw new Error('Scene transition superseded');
        const root = lease.value.instantiate();
        root.position.fromArray(node.position);
        root.rotation.set(...node.rotation);
        root.scale.setScalar(node.scale);
        root.userData = { ...root.userData, nodeId: node.id, interactive: node.interactive };
        root.traverse((object) => {
          const mesh = object as Object3D & {
            isMesh?: boolean;
            castShadow?: boolean;
            receiveShadow?: boolean;
          };
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        scope.scene.add(root);
        if (node.role !== 'static') {
          const actor: Actor = { root, mixer: new AnimationMixer(root), actions: new Map() };
          for (const [name, clipName] of Object.entries(asset.animationMap)) {
            const clip = lease.value.gltf.animations.find((c) => c.name === clipName);
            if (!clip) throw new Error(`Animation ${clipName} missing in ${asset.id}`);
            actor.actions.set(name, actor.mixer.clipAction(clip));
          }
          if (node.role === 'player') {
            if (!actor.actions.has('idle') || !actor.actions.has('walk'))
              throw new Error('Player needs authored idle/walk animation mapping');
            if (!canOccupy(root.position.x, root.position.z, definition))
              throw new Error('Player spawn intersects collider or bounds');
            scope.player = actor;
          } else if (!actor.actions.has('idle'))
            throw new Error('Pet needs an authored idle animation mapping');
          scope.actors.push(actor);
          this.animate(actor, 'idle');
        }
      }
      if (this.closed || version !== this.version) throw new Error('Scene transition superseded');
      const previous = this.scope;
      this.scope = scope;
      this.camera.position.fromArray(definition.camera.position);
      this.camera.lookAt(new Vector3().fromArray(definition.camera.target));
      if (previous) this.releaseScope(previous);
    } catch (error) {
      this.releaseScope(scope);
      throw error;
    }
  }
  private animate(actor: Actor, name: string) {
    if (actor.current === name) return;
    const action = actor.actions.get(name);
    if (!action) return;
    if (actor.current) actor.actions.get(actor.current)?.fadeOut(0.15);
    action.reset().fadeIn(0.15).play();
    actor.current = name;
  }
  private frame = (time: number) => {
    if (this.closed || this.hidden || this.contextLost) {
      this.previous = 0;
      return;
    }
    const delta = this.previous ? Math.min((time - this.previous) / 1000, 0.05) : 0;
    this.previous = time;
    const scope = this.scope;
    if (!scope) return;
    const player = scope.player;
    if (player) {
      const x =
        Number(this.keys.has('d') || this.keys.has('arrowright')) -
        Number(this.keys.has('a') || this.keys.has('arrowleft')) +
        this.touch.x;
      const z =
        Number(this.keys.has('s') || this.keys.has('arrowdown')) -
        Number(this.keys.has('w') || this.keys.has('arrowup')) +
        this.touch.y;
      const direction = new Vector2(x, z).clampLength(0, 1),
        moving = direction.lengthSq() > 0;
      const running = this.keys.has('shift') && player.actions.has('run');
      const step = (running ? 3.5 : 1.7) * delta;
      // Axis separation allows sliding; capped dt keeps this starter controller below its collider radius.
      const nx = player.root.position.x + direction.x * step,
        nz = player.root.position.z + direction.y * step;
      if (canOccupy(nx, player.root.position.z, scope.definition)) player.root.position.x = nx;
      if (canOccupy(player.root.position.x, nz, scope.definition)) player.root.position.z = nz;
      if (moving) player.root.rotation.y = Math.atan2(direction.x, direction.y);
      this.animate(player, moving ? (running ? 'run' : 'walk') : 'idle');
      const target = player.root.position.clone().add(new Vector3(0, 1, 0));
      this.camera.position.lerp(target.clone().add(new Vector3(0, 3, 5)), 1 - Math.exp(-5 * delta));
      this.camera.lookAt(target);
    }
    for (const actor of scope.actors) actor.mixer.update(delta);
    this.renderer.render(scope.scene, this.camera);
  };
  private releaseScope(scope: SceneScope) {
    for (const actor of scope.actors) {
      actor.mixer.stopAllAction();
      actor.mixer.uncacheRoot(actor.root);
    }
    // Cloned skeletons own their bone textures; geometries/materials belong to the asset store.
    scope.scene.traverse((object) => {
      const item = object as Object3D & {
        skeleton?: { dispose(): void };
        shadow?: { dispose(): void };
      };
      item.skeleton?.dispose();
      item.shadow?.dispose();
    });
    scope.scene.clear();
    scope.leases.forEach((l) => l.release());
  }
  stats() {
    return {
      assets: this.store.stats(),
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    };
  }
  dispose() {
    if (this.closed) return;
    this.closed = true;
    this.version++;
    this.renderer.setAnimationLoop(null);
    this.resize.disconnect();
    this.onBlur();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    if (this.scope) this.releaseScope(this.scope);
    this.scope = undefined;
    this.store.dispose();
    this.loader.dispose();
    this.renderer.dispose();
  }
}
