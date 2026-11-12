import { Box3, Group, Mesh, SkinnedMesh, Vector3, type AnimationClip, type Object3D } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { MissionActorId } from '@gamenglish/contracts';
import { ActorMotion } from './ActorMotion';
import { ActorFace } from './ActorFace';
export class MissionActor {
  readonly root = new Group();
  readonly face: ActorFace;
  readonly height: number;
  private motion: ActorMotion;
  private waveRequested = false;
  private heading = Math.PI;
  moving = false;
  speaking = false;
  presenting = false;
  listening = false;
  constructor(
    source: Object3D,
    readonly id: MissionActorId,
    clips: AnimationClip[],
  ) {
    const model = clone(source);
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model);
    this.height = id === 'child' ? 1.42 : 1.72;
    const scale = this.height / (box.max.y - box.min.y);
    const center = box.getCenter(new Vector3());
    model.scale.multiplyScalar(scale);
    model.position.y -= box.min.y * scale;
    model.position.x -= center.x * scale;
    model.position.z -= center.z * scale;
    this.root.add(model);
    model.traverse((object) => {
      if (object instanceof Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        object.castShadow = !materials.some((material) =>
          /Eye|Cornea|Tearline/.test(material.name),
        );
        object.receiveShadow = true;
      }
      if (object instanceof SkinnedMesh) object.frustumCulled = false;
    });
    this.face = new ActorFace(model);
    this.motion = new ActorMotion(model, clips);
  }
  set waving(value: boolean) {
    if (value && !this.waveRequested) this.motion.greet();
    this.waveRequested = value;
  }
  faceToward(x: number, z: number) {
    this.heading = Math.atan2(x - this.root.position.x, z - this.root.position.z);
  }
  update(delta: number, _time: number, reducedMotion: boolean) {
    const difference = Math.atan2(
      Math.sin(this.heading - this.root.rotation.y),
      Math.cos(this.heading - this.root.rotation.y),
    );
    this.root.rotation.y += difference * (1 - Math.exp(-delta * 8));
    this.motion.update(
      delta,
      this.moving
        ? 'walk'
        : this.speaking || this.presenting
          ? 'talk'
          : this.listening
            ? 'listen'
            : 'idle',
      reducedMotion,
    );
    this.face.update(delta, reducedMotion);
  }
  dispose() {
    this.motion.dispose();
    this.root.traverse((object) => {
      if (object instanceof SkinnedMesh) object.skeleton.dispose();
    });
    this.root.clear();
  }
}
