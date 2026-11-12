import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three';
import type { MissionSceneEvent, MissionStep } from '@gamenglish/contracts';
import { disposeModel, loadMissionAssets, type MissionAssets } from './MissionAssets';
import { MissionCamera } from './MissionCamera';
import { MissionInput } from './MissionInput';
import { MissionWorld } from './MissionWorld';
import { createMissionLighting } from './MissionLighting';
export class MissionRuntime {
  private renderer: WebGLRenderer;
  private camera = new MissionCamera();
  private input: MissionInput;
  private world?: MissionWorld;
  private environment?: ReturnType<typeof createMissionLighting>;
  private assets?: MissionAssets;
  private abort = new AbortController();
  private resize: ResizeObserver;
  private closed = false;
  private paused = false;
  private previous = 0;
  private elapsed = 0;
  private step?: MissionStep;
  private firstFrame = true;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(
    private canvas: HTMLCanvasElement,
    private emit: (event: MissionSceneEvent) => void,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.input = new MissionInput(canvas, this.onPointer);
    this.resize = new ResizeObserver(this.onResize);
    this.resize.observe(canvas);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    this.onResize();
    this.renderer.setAnimationLoop(this.frame);
  }
  async load() {
    try {
      const assets = await loadMissionAssets(this.abort.signal, (text, progress) =>
        this.emit({ type: 'loading', text, progress }),
      );
      if (this.closed) {
        disposeModel(assets.boy.scene);
        disposeModel(assets.city.scene);
        return;
      }
      this.assets = assets;
      this.emit({ type: 'loading', text: 'Sahna va yoritish tayyorlanmoqda…', progress: 0.9 });
      this.world = new MissionWorld(assets, () => this.emit({ type: 'arrived' }));
      this.environment = createMissionLighting(this.renderer);
      this.world.scene.environment = this.environment.texture;
      this.world.scene.environmentIntensity = 0.45;
      if (this.step) this.world.setStep(this.step);
      this.emit({ type: 'ready' });
    } catch (error) {
      if (!this.closed)
        this.emit({
          type: 'error',
          text: error instanceof Error ? error.message : 'Sahna ochilmadi.',
        });
    }
  }
  setStep(step: MissionStep) {
    this.step = step;
    this.world?.setStep(step);
  }
  setSpeaking(active: boolean) {
    this.world?.setSpeaking(active);
  }
  walkToGoal() {
    this.world?.walkToGoal();
  }
  setTouch(x: number, z: number) {
    this.input.touch.set(x, z);
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    this.input.clear();
    this.previous = 0;
  }
  private onResize = () => {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.camera.aspect = rect.width / rect.height;
    this.camera.camera.updateProjectionMatrix();
  };
  private onPointer = (event: PointerEvent) => {
    if (this.paused) return;
    const rect = this.canvas.getBoundingClientRect();
    this.world?.clickGround(
      new Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera.camera,
    );
  };
  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.paused = true;
    this.emit({ type: 'error', text: 'Grafik kontekst uzildi. Sahnani qayta oching.' });
  };
  private frame = (now: number) => {
    const delta = this.previous ? Math.min((now - this.previous) / 1000, 0.05) : 0;
    this.previous = now;
    if (!this.world || document.hidden) return;
    this.elapsed += delta;
    if (!this.paused) this.world.update(delta, this.elapsed, this.input.direction());
    this.camera.update(
      this.step?.shot ?? 'wide',
      this.world.actors,
      delta,
      this.firstFrame || this.reducedMotion,
    );
    this.firstFrame = false;
    this.renderer.render(this.world.scene, this.camera.camera);
  };
  dispose() {
    if (this.closed) return;
    this.closed = true;
    this.abort.abort();
    this.renderer.setAnimationLoop(null);
    this.input.dispose();
    this.resize.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.world?.dispose();
    this.environment?.dispose();
    if (this.assets) {
      disposeModel(this.assets.boy.scene);
      disposeModel(this.assets.city.scene);
    }
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
