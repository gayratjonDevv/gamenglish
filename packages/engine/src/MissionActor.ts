import { Bone, Box3, Group, Mesh, Quaternion, SkinnedMesh, Vector3, type Object3D } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { MissionActorId } from '@gamenglish/contracts';
type Joint = { bone: Bone; rest: Quaternion; parentInverse: Quaternion };
export class MissionActor {
  readonly root = new Group();
  private joints = new Map<string, Joint>();
  private faces: Mesh[] = [];
  private phase = Math.random() * 10;
  moving = false;
  speaking = false;
  waving = false;
  constructor(
    source: Object3D,
    readonly id: MissionActorId,
  ) {
    const model = clone(source);
    // Every role uses the exact supplied character; only its scale and role label differ.
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model);
    const height = id === 'child' ? 1.42 : 1.72;
    const scale = height / (box.max.y - box.min.y);
    const center = box.getCenter(new Vector3());
    model.scale.multiplyScalar(scale);
    model.position.y -= box.min.y * scale;
    model.position.x -= center.x * scale;
    model.position.z -= center.z * scale;
    this.root.add(model);
    model.traverse((object) => {
      if (object instanceof Bone)
        this.joints.set(object.name, {
          bone: object,
          rest: object.quaternion.clone(),
          parentInverse: object.parent
            ? object.parent.getWorldQuaternion(new Quaternion()).invert()
            : new Quaternion(),
        });
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.morphTargetDictionary && object.morphTargetInfluences) this.faces.push(object);
      }
      if (object instanceof SkinnedMesh) object.frustumCulled = false;
    });
  }
  private turn(name: string, axis: Vector3, angle: number) {
    const joint = this.joints.get(name.replaceAll('.', ''));
    if (!joint) return;
    joint.bone.quaternion
      .copy(
        new Quaternion().setFromAxisAngle(axis.clone().applyQuaternion(joint.parentInverse), angle),
      )
      .multiply(joint.rest);
  }
  private expression(name: string, value: number) {
    for (const mesh of this.faces) {
      const index = mesh.morphTargetDictionary?.[name];
      if (index !== undefined && mesh.morphTargetInfluences)
        mesh.morphTargetInfluences[index] = value;
    }
  }
  update(delta: number, time: number, reducedMotion: boolean) {
    this.phase += delta * (this.moving ? 8 : 1);
    const swing = this.moving ? Math.sin(this.phase) * 0.32 : 0;
    const x = new Vector3(1, 0, 0),
      z = new Vector3(0, 0, 1);
    // Lightweight bone motion, not a claim of authored mocap/retargeted walk clips.
    this.turn('thigh_stretch.l', x, swing);
    this.turn('thigh_stretch.r', x, -swing);
    this.turn('leg_stretch.l', x, Math.max(0, -swing) * 0.8);
    this.turn('leg_stretch.r', x, Math.max(0, swing) * 0.8);
    this.turn('arm_stretch.l', z, -1.15);
    this.turn('arm_stretch.r', z, this.waving ? -0.65 + Math.sin(time * 5) * 0.16 : 1.15);
    this.turn('forearm_stretch.r', x, this.waving ? -0.9 : -0.12);
    const blink = time % 4.3 < 0.14 ? 1 : 0;
    this.expression('eyeBlinkLeft', blink);
    this.expression('eyeBlinkRight', blink);
    this.expression('mouthSmileLeft', 0.12);
    this.expression('mouthSmileRight', 0.12);
    this.expression(
      'jawOpen',
      this.speaking && !reducedMotion ? 0.12 + Math.abs(Math.sin(time * 9)) * 0.18 : 0,
    );
  }
  dispose() {
    this.root.traverse((object) => {
      if (object instanceof SkinnedMesh) object.skeleton.dispose();
    });
    this.root.clear();
  }
}
