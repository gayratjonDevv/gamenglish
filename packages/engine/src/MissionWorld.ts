import {
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
} from 'three';
import type { MissionActorId, MissionStep, MissionTime } from '@gamenglish/contracts';
import type { MissionAssets } from './MissionAssets';
import { MissionActor } from './MissionActor';
import { createMissionTown, type Town } from './MissionTown';
export class MissionWorld {
  readonly scene = new Scene();
  readonly actors: MissionActor[];
  readonly sun = new DirectionalLight(0xffedcf, 3.2);
  private ambient = new HemisphereLight(0xeaf3ff, 0x817f66, 1.3);
  private town: Town;
  private ray = new Raycaster();
  private heightCache = new Map<string, number>();
  private destination: Vector2 | undefined;
  private step: MissionStep | undefined;
  private arrived = false;
  private neighborDeparting = false;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(
    assets: MissionAssets,
    private onArrival: () => void,
  ) {
    this.town = createMissionTown(assets.city.scene);
    this.scene.add(this.town.root, this.ambient, this.sun);
    this.scene.background = new Color('#c7e0e7');
    this.scene.fog = new Fog('#c7e0e7', 48, 140);
    this.sun.position.set(15, 28, 8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -14,
      right: 14,
      top: 14,
      bottom: -14,
      near: 1,
      far: 65,
    });
    this.sun.shadow.bias = -0.0004;
    this.sun.target.position.set(14, 0, -14.6);
    this.scene.add(this.sun.target);
    const roles: MissionActorId[] = ['child', 'mother', 'neighbor'];
    this.actors = roles.map(
      (role) => new MissionActor(assets.boy.scene, role, assets.boy.animations),
    );
    this.place('child', 8, -14.6);
    this.place('mother', 9.5, -14.9);
    this.place('neighbor', 15.2, -14.9);
    for (const actor of this.actors) this.scene.add(actor.root);
  }
  private place(id: MissionActorId, x: number, z: number) {
    const actor = this.actors.find((item) => item.id === id);
    if (actor) {
      actor.root.position.set(x, this.ground(x, z), z);
      actor.root.rotation.y = Math.PI;
    }
  }
  private ground(x: number, z: number) {
    const key = `${Math.round(x * 4)}:${Math.round(z * 4)}`;
    const cached = this.heightCache.get(key);
    if (cached !== undefined) return cached;
    this.ray.set(new Vector3(x, 2, z), new Vector3(0, -1, 0));
    const hit = this.ray
      .intersectObjects(this.town.surfaces, false)
      .find((item) => item.point.y < 0.5);
    const height = hit?.point.y ?? -0.03;
    this.heightCache.set(key, height);
    return height;
  }
  setStep(step: MissionStep) {
    if (step.id === 'welcome') {
      this.place('child', 8, -14.6);
      this.place('mother', 9.5, -14.9);
      this.place('neighbor', 15.2, -14.9);
      this.neighborDeparting = false;
    }
    if (step.cue === 'leave') this.neighborDeparting = true;
    if (step.cue === 'return' || step.id === 'hi') this.neighborDeparting = false;
    this.step = step;
    this.destination = undefined;
    this.arrived = false;
    this.setTime(step.time ?? 'morning');
    const child = this.actors[0],
      mother = this.actors[1],
      neighbor = this.actors[2];
    if (!child || !mother || !neighbor) return;
    if (
      step.kind === 'travel' &&
      step.target &&
      child.root.position.distanceTo(
        new Vector3(step.target[0], child.root.position.y, step.target[1]),
      ) < 0.8
    ) {
      this.arrived = true;
      this.onArrival();
    }
    this.setSpeaking(false);
    const id =
      step.speaker === 'Ona' ? 'mother' : step.speaker === 'Qo‘shni' ? 'neighbor' : 'child';
    this.actors.forEach((actor) => {
      actor.waving = actor.id === id && step.gesture === 'wave';
      actor.presenting = actor.id === id && step.speaker !== 'Vazifa';
      actor.listening = actor.id !== id;
      actor.face.emotion =
        actor.id === 'child' && step.id === 'worry'
          ? 'unsure'
          : step.kind === 'finish' || step.id === 'well-done'
            ? 'happy'
            : 'calm';
    });
  }
  setSpeaking(active: boolean) {
    const id =
      this.step?.speaker === 'Ona'
        ? 'mother'
        : this.step?.speaker === 'Qo‘shni'
          ? 'neighbor'
          : 'child';
    this.actors.forEach((actor) => {
      actor.speaking = actor.id === id && active;
    });
  }
  private setTime(time: MissionTime) {
    const colors = {
      morning: '#c7e0e7',
      afternoon: '#c0dcf3',
      evening: '#d59b91',
      night: '#23334e',
    };
    const sky = new Color(colors[time]);
    this.scene.background = sky;
    this.scene.fog = new Fog(sky, 48, 140);
    this.sun.intensity = time === 'night' ? 0.3 : time === 'evening' ? 1.8 : 3.2;
    this.ambient.intensity = time === 'night' ? 0.7 : 1.3;
    this.sun.color.set(time === 'evening' ? '#ffb886' : '#ffedcf');
  }
  walkToGoal() {
    if (this.step?.target) this.destination = new Vector2(...this.step.target);
  }
  clickGround(pointer: Vector2, camera: import('three').Camera) {
    if (this.step?.kind !== 'travel') return;
    this.ray.setFromCamera(pointer, camera);
    const hit = this.ray
      .intersectObjects(this.town.surfaces, false)
      .find((item) => item.point.y < 0.5);
    if (hit)
      this.destination = new Vector2(
        Math.max(7, Math.min(22, hit.point.x)),
        Math.max(-15.35, Math.min(-13.9, hit.point.z)),
      );
  }
  update(delta: number, time: number, direction: Vector2) {
    const [child, mother, neighbor] = this.actors;
    if (!child || !mother || !neighbor) return;
    child.moving = false;
    mother.moving = false;
    neighbor.moving = false;
    if (this.neighborDeparting)
      this.approach(
        neighbor,
        Math.min(21.8, child.root.position.x + 5),
        child.root.position.z - 0.2,
        delta,
      );
    if (this.step?.kind === 'travel') {
      if (direction.lengthSq() > 0) this.destination = undefined;
      else if (this.destination) {
        direction.set(
          this.destination.x - child.root.position.x,
          this.destination.y - child.root.position.z,
        );
        if (direction.length() < 0.15) {
          this.destination = undefined;
          direction.set(0, 0);
        } else direction.normalize();
      }
      this.move(child, direction, delta);
      this.approach(mother, child.root.position.x - 0.9, child.root.position.z + 0.4, delta);
      if (
        !this.arrived &&
        this.step.target &&
        new Vector2(
          child.root.position.x - this.step.target[0],
          child.root.position.z - this.step.target[1],
        ).length() < 0.85
      ) {
        this.arrived = true;
        this.destination = undefined;
        this.onArrival();
      }
    }
    if (this.step?.kind !== 'travel') {
      this.approach(mother, child.root.position.x - 0.9, child.root.position.z + 0.4, delta);
      if (!this.neighborDeparting)
        this.approach(
          neighbor,
          Math.min(21.8, child.root.position.x + 2.4),
          child.root.position.z - 0.2,
          delta,
        );
    }
    for (const actor of this.actors) {
      if (!actor.moving) {
        const partner =
          actor.id === 'child' ? (this.step?.speaker === 'Ona' ? mother : neighbor) : child;
        actor.faceToward(partner.root.position.x, partner.root.position.z);
      }
      actor.update(delta, time, this.reducedMotion);
    }
  }
  private approach(actor: MissionActor, x: number, z: number, delta: number) {
    const direction = new Vector2(x - actor.root.position.x, z - actor.root.position.z);
    if (direction.length() > 0.22) this.move(actor, direction.normalize(), delta);
  }
  private move(actor: MissionActor, direction: Vector2, delta: number) {
    if (direction.lengthSq() === 0) return;
    const speed = actor.id === 'child' ? 0.95 : 1.1;
    const x = actor.root.position.x + direction.x * delta * speed;
    const z = actor.root.position.z + direction.y * delta * speed;
    if (x < 7 || x > 22 || z < -15.35 || z > -13.9) return;
    if (
      this.town.obstacles.some(
        (box) => x > box.min.x && x < box.max.x && z > box.min.z && z < box.max.z,
      )
    )
      return;
    actor.root.position.set(x, this.ground(x, z), z);
    actor.faceToward(x + direction.x, z + direction.y);
    actor.moving = true;
  }
  dispose() {
    this.actors.forEach((actor) => actor.dispose());
    this.sun.shadow.dispose();
    this.town.dispose();
    this.scene.clear();
  }
}
