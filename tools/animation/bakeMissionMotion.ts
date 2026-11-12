import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { readPreparedModel } from './loadRigGeometry';
import { quaterniusMapping, mesh2MotionMapping, retargetHumanoid } from './retargetHumanoid';
import { attachClips } from './attachClips';
const root = 'asset-source/m01';
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, 'utf8')) as Record<
  string,
  { url: string; bytes: number; sha256: string }
>;
const boyPath = 'asset-source' + manifest.boy!.url.replace('/assets', '');
const boy = await readPreparedModel(boyPath);
const source = await readPreparedModel(
  'asset-source/authoring/motions/Animation Library[Standard]/Godot/AnimationLibrary_Godot_Standard.glb',
);
const reference = source.animations.find((clip) => clip.name === 'A_TPose')!;
const mapping = quaterniusMapping();
const clips = [
  ['idle', 'Idle_Loop'],
  ['walk', 'Walk_Loop'],
  ['talk', 'Idle_Talking_Loop'],
].map(([name, original]) => {
  const clip = source.animations.find((item) => item.name === original);
  if (!clip) throw new Error(`Source motion missing: ${original}`);
  const retargeted = retargetHumanoid(
    source.scene,
    clip,
    reference,
    clone(boy.scene),
    mapping,
    name!,
  );
  console.log(name, retargeted.duration, retargeted.tracks.length, 'tracks');
  return retargeted;
});
const greeting = await readPreparedModel('asset-source/authoring/greeting.glb');
const rest = await readPreparedModel('asset-source/authoring/rest-pose.glb');
const listening = await readPreparedModel('asset-source/authoring/idle-listening.glb');
clips.push(
  retargetHumanoid(
    greeting.scene,
    greeting.animations[0]!,
    rest.animations[0]!,
    clone(boy.scene),
    mesh2MotionMapping(),
    'wave',
  ),
);
clips.push(
  retargetHumanoid(
    listening.scene,
    listening.animations[0]!,
    rest.animations[0]!,
    clone(boy.scene),
    mesh2MotionMapping(),
    'listen',
  ),
);
const output = attachClips(await readFile(boyPath), clips);
const digest = createHash('sha256').update(output).digest('hex');
const filename = `boy.${digest.slice(0, 12)}.glb`;
await writeFile(`${root}/${filename}`, output);
manifest.boy = { url: `/assets/m01/${filename}`, bytes: output.length, sha256: digest };
await writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log('ANIMATED_MODEL', filename, output.length);
