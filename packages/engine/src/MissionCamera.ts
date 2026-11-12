import { PerspectiveCamera, Vector3 } from 'three';
import type { MissionShot } from '@gamenglish/contracts';
import type { MissionActor } from './MissionActor';
export class MissionCamera {
  readonly camera = new PerspectiveCamera(46, 1, 0.08, 240);
  private look = new Vector3(13, 1, -14.6);
  private position = new Vector3(25, 9, -4);
  private aim = new Vector3();
  constructor() {
    this.camera.position.copy(this.position);
  }
  update(shot: MissionShot, actors: MissionActor[], delta: number, instant: boolean) {
    const [child, mother, neighbor] = actors;
    if (!child || !mother || !neighbor) return;
    const subject = shot === 'mother' ? mother : shot === 'neighbor' ? neighbor : child;
    this.aim.copy(subject.root.position).add(new Vector3(0, 1.1, 0));
    if (shot === 'wide') {
      this.aim.set(13, 1, -14.6);
      this.position.set(25, 9, -4);
    } else if (shot === 'follow') {
      this.position.copy(child.root.position).add(new Vector3(5, 5, 7));
    } else if (shot === 'conversation') {
      this.aim
        .copy(child.root.position)
        .lerp(neighbor.root.position, 0.45)
        .add(new Vector3(0, 1, 0));
      this.position.copy(this.aim).add(new Vector3(5, 2.5, 5));
    } else {
      this.position.copy(subject.root.position).add(new Vector3(3, 1.9, 4));
    }
    const factor = instant ? 1 : 1 - Math.exp(-delta * 3.5);
    this.camera.position.lerp(this.position, factor);
    this.look.lerp(this.aim, factor);
    this.camera.lookAt(this.look);
  }
}
