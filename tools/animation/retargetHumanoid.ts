import {
  AnimationClip,
  AnimationMixer,
  Bone,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
  type Object3D,
} from 'three';
export type BoneNames = Record<string, string>;
const worldQuaternion = (object: Object3D) => object.getWorldQuaternion(new Quaternion());
const worldPosition = (object: Object3D) => object.getWorldPosition(new Vector3());
export function retargetHumanoid(
  source: Object3D,
  clip: AnimationClip,
  reference: AnimationClip,
  target: Object3D,
  names: BoneNames,
  name: string,
) {
  const mixer = new AnimationMixer(source);
  mixer.clipAction(reference).play();
  mixer.setTime(0);
  source.updateMatrixWorld(true);
  const sourceRest = new Map(
    Object.values(names).map((id) => {
      const bone = source.getObjectByName(id);
      if (!bone) throw new Error(`Missing source bone ${id}`);
      return [id, worldQuaternion(bone)];
    }),
  );
  const sourceHip = source.getObjectByName(names.rootx!);
  const targetHip = target.getObjectByName('rootx');
  if (!sourceHip || !targetHip) throw new Error('Missing pelvis mapping');
  const hipReference = worldPosition(sourceHip);
  target.updateMatrixWorld(true);
  const targetRest = new Map<string, Quaternion>();
  const boneOrder: Bone[] = [];
  target.traverse((object) => {
    if (object instanceof Bone && names[object.name]) {
      boneOrder.push(object);
      targetRest.set(object.name, worldQuaternion(object));
    }
  });
  const originalHip = targetHip.position.clone();
  const scale = worldPosition(targetHip).y / hipReference.y;
  const sole = () =>
    Math.min(
      ...['footl', 'footr', 'toes_01l', 'toes_01r'].map((id) => {
        const bone = target.getObjectByName(id);
        return bone ? worldPosition(bone).y - (id.startsWith('foot') ? 0.07 : 0) : Infinity;
      }),
    );
  const floor = sole();
  mixer.stopAllAction();
  mixer.clipAction(clip).play();
  const frames = Math.ceil(clip.duration * 30),
    times: number[] = [],
    positions: number[] = [];
  const values = new Map(boneOrder.map((bone) => [bone.name, [] as number[]]));
  for (let frame = 0; frame <= frames; frame++) {
    const time = (frame / frames) * clip.duration;
    times.push(time);
    mixer.setTime(Math.min(time, clip.duration - 0.00001));
    source.updateMatrixWorld(true);
    const hipOffset = worldPosition(sourceHip).sub(hipReference).multiplyScalar(scale);
    targetHip.position.copy(originalHip).add(hipOffset);
    target.updateMatrixWorld(true);
    for (const bone of boneOrder) {
      const sourceBone = source.getObjectByName(names[bone.name]!)!;
      const desired = worldQuaternion(sourceBone)
        .multiply(sourceRest.get(names[bone.name]!)!.clone().invert())
        .multiply(targetRest.get(bone.name)!);
      if (bone.parent) desired.premultiply(worldQuaternion(bone.parent).invert());
      bone.quaternion.copy(desired).normalize();
      bone.updateMatrixWorld(true);
      values.get(bone.name)!.push(...bone.quaternion.toArray());
    }
    targetHip.position.y += floor - sole();
    targetHip.updateMatrixWorld(true);
    positions.push(...targetHip.position.toArray());
  }
  const tracks = boneOrder.map(
    (bone) => new QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values.get(bone.name)!),
  );
  const result = new AnimationClip(name, clip.duration, [
    ...tracks,
    new VectorKeyframeTrack('rootx.position', times, positions),
  ]);
  mixer.stopAllAction();
  mixer.uncacheRoot(source);
  return result;
}
export function quaterniusMapping(): BoneNames {
  const names: BoneNames = {
    rootx: 'DEF-hips',
    spine_01x: 'DEF-spine001',
    spine_02x: 'DEF-spine002',
    spine_03x: 'DEF-spine003',
    neckx: 'DEF-neck',
    headx: 'DEF-head',
  };
  for (const [target, source] of [
    ['shoulder', 'shoulder'],
    ['arm_stretch', 'upper_arm'],
    ['forearm_stretch', 'forearm'],
    ['hand', 'hand'],
    ['thigh_stretch', 'thigh'],
    ['leg_stretch', 'shin'],
    ['foot', 'foot'],
    ['toes_01', 'toe'],
  ]) {
    for (const side of ['l', 'r']) names[`${target}${side}`] = `DEF-${source}${side.toUpperCase()}`;
  }
  for (const finger of ['index', 'middle', 'ring', 'pinky', 'thumb']) {
    for (const side of ['l', 'r'])
      for (let segment = 1; segment <= 3; segment++)
        names[`c_${finger}${segment}${side}`] =
          `DEF-${finger === 'thumb' ? '' : 'f_'}${finger}0${segment}${side.toUpperCase()}`;
  }
  return names;
}
export function mesh2MotionMapping(): BoneNames {
  const names: BoneNames = {
    rootx: 'pelvis',
    spine_01x: 'spine_01',
    spine_02x: 'spine_02',
    spine_03x: 'spine_03',
    neckx: 'neck_01',
    headx: 'head',
  };
  for (const [target, source] of [
    ['shoulder', 'clavicle'],
    ['arm_stretch', 'upperarm'],
    ['forearm_stretch', 'lowerarm'],
    ['hand', 'hand'],
    ['thigh_stretch', 'thigh'],
    ['leg_stretch', 'calf'],
    ['foot', 'foot'],
    ['toes_01', 'ball'],
  ]) {
    for (const side of ['l', 'r']) names[`${target}${side}`] = `${source}_${side}`;
  }
  for (const finger of ['index', 'middle', 'ring', 'pinky', 'thumb'])
    for (const side of ['l', 'r'])
      for (let segment = 1; segment <= 3; segment++)
        names[`c_${finger}${segment}${side}`] = `${finger}_0${segment}_${side}`;
  return names;
}
