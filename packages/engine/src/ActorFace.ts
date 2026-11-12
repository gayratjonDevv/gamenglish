import { MathUtils, Mesh, type Object3D } from 'three';
import presets from './data/boy-face-presets.json';
export type ActorEmotion = 'calm' | 'happy' | 'unsure' | 'listening';
export class ActorFace {
  private meshes: Mesh[] = [];
  private blinkAt = 2 + Math.random() * 3;
  private blinking = -1;
  private elapsed = 0;
  emotion: ActorEmotion = 'calm';
  constructor(root: Object3D) {
    root.traverse((object) => {
      if (object instanceof Mesh && object.morphTargetDictionary && object.morphTargetInfluences)
        this.meshes.push(object);
    });
  }
  update(delta: number, reducedMotion: boolean) {
    this.elapsed += delta;
    if (this.elapsed >= this.blinkAt) {
      this.blinking = this.elapsed;
      this.blinkAt = this.elapsed + 3 + Math.random() * 4;
    }
    const phase = (this.elapsed - this.blinking) / 0.18;
    const blink =
      this.blinking >= 0 && phase < 1 ? (phase < 0.4 ? phase / 0.4 : (1 - phase) / 0.6) : 0;
    const profile: Record<string, number> =
      this.emotion === 'happy'
        ? presets.Happy
        : this.emotion === 'unsure'
          ? presets.Confused
          : presets.Smile;
    for (const mesh of this.meshes) {
      for (const [name, index] of Object.entries(mesh.morphTargetDictionary!)) {
        let goal = name.startsWith('eyeBlink')
          ? blink
          : (profile[name] ?? 0) *
            (this.emotion === 'happy' ? 0.55 : this.emotion === 'unsure' ? 0.35 : 1);
        // An open mouth is never invented as a substitute for actual speech alignment.
        if (name === 'jawOpen') goal = this.emotion === 'happy' ? 0.04 : 0;
        mesh.morphTargetInfluences![index] = MathUtils.damp(
          mesh.morphTargetInfluences![index] ?? 0,
          goal,
          name.startsWith('eyeBlink') ? 45 : reducedMotion ? 4 : 8,
          delta,
        );
      }
    }
  }
}
