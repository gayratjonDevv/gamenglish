import { PerspectiveCamera, Vector3 } from 'three';
import type { MissionShot } from '@gamenglish/contracts';
import type { MissionActor } from './MissionActor';
export class MissionCamera {
  readonly camera = new PerspectiveCamera(40, 1, 0.08, 240);
  private look = new Vector3(10, 1.1, -14.6);
  private position = new Vector3(15, 3.6, -8);
  private aim = new Vector3();
  private offset = new Vector3();
  private previousShot?: MissionShot;
  constructor() {
    this.camera.position.copy(this.position);
  }
  update(shot: MissionShot, actors: MissionActor[], delta: number, instant: boolean) {
    const [child, mother, neighbor] = actors;
    if (!child || !mother || !neighbor) return;
    const subject = shot === 'mother' ? mother : shot === 'neighbor' ? neighbor : child;
    this.aim.copy(subject.root.position).add(new Vector3(0, subject.height * 0.83, 0));
    const portrait = this.camera.aspect < 0.8;
    if (shot === 'wide') {
      this.aim
        .copy(child.root.position)
        .lerp(neighbor.root.position, 0.4)
        .add(new Vector3(0, 0.9, 0));
      this.position.copy(this.aim).add(new Vector3(portrait ? 5 : 4.5, 2.2, portrait ? 7 : 5));
    } else if (shot === 'follow') {
      this.position.copy(child.root.position).add(new Vector3(-3, 2.5, 4.2));
    } else if (shot === 'conversation') {
      this.aim
        .copy(child.root.position)
        .lerp(neighbor.root.position, 0.5)
        .add(new Vector3(0, 1.05, 0));
      this.position.copy(this.aim).add(new Vector3(0.6, 1.2, portrait ? 6.6 : 4.8));
    } else {
      const distance = portrait ? 2.9 : 2.5;
      this.offset.set(
        Math.sin(subject.root.rotation.y) * distance,
        0.1,
        Math.abs(Math.cos(subject.root.rotation.y) * distance) + 0.95,
      );
      this.position.copy(this.aim).add(this.offset);
    }
    const factor = instant || shot !== this.previousShot ? 1 : 1 - Math.exp(-delta * 3);
    this.previousShot = shot;
    this.camera.position.lerp(this.position, factor);
    this.look.lerp(this.aim, factor);
    this.camera.lookAt(this.look);
  }
}
