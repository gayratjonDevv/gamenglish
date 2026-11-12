import {
  AnimationMixer,
  LoopOnce,
  type AnimationAction,
  type AnimationClip,
  type Object3D,
} from 'three';
export type MotionState = 'idle' | 'walk' | 'talk' | 'listen';
export class ActorMotion {
  private mixer: AnimationMixer;
  private actions = new Map<string, AnimationAction>();
  private current: AnimationAction | undefined;
  private state: MotionState = 'idle';
  private greeting = false;
  constructor(
    private root: Object3D,
    clips: AnimationClip[],
  ) {
    this.mixer = new AnimationMixer(root);
    for (const name of ['idle', 'walk', 'talk', 'listen', 'wave']) {
      const clip = clips.find((item) => item.name === name);
      if (!clip) throw new Error(`Qahramon animatsiyasi yetishmayapti: ${name}`);
      this.actions.set(name, this.mixer.clipAction(clip));
    }
    this.mixer.addEventListener('finished', this.onFinished);
    this.play('idle', true);
    this.current!.time = Math.random() * this.current!.getClip().duration;
    this.mixer.update(0);
  }
  private onFinished = () => {
    this.greeting = false;
    this.play(this.state);
  };
  private play(name: string, immediate = false) {
    const next = this.actions.get(name);
    if (!next || this.current === next) return;
    next
      .reset()
      .setEffectiveWeight(1)
      .setEffectiveTimeScale(name === 'walk' ? 1.08 : 1)
      .play();
    if (this.current && !immediate) {
      this.current.fadeOut(0.32);
      next.fadeIn(0.32);
    } else this.current?.stop();
    this.current = next;
  }
  greet() {
    if (this.greeting) return;
    const wave = this.actions.get('wave')!;
    wave.setLoop(LoopOnce, 1);
    wave.clampWhenFinished = true;
    this.greeting = true;
    this.play('wave');
  }
  update(delta: number, state: MotionState, reducedMotion: boolean) {
    this.state = state;
    if (state === 'walk' && this.greeting) this.greeting = false;
    if (!this.greeting) this.play(state);
    this.mixer.update(reducedMotion && state !== 'walk' ? delta * 0.65 : delta);
  }
  dispose() {
    this.mixer.removeEventListener('finished', this.onFinished);
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
  }
}
