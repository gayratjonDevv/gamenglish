import type {
  ActingCue,
  MissionActorId,
  MissionSceneEvent,
  MissionShot,
  MissionStep,
} from '@gamenglish/contracts';
import { ActingTimeline } from './ActingTimeline';
import type { MissionActor } from './MissionActor';
export class EncounterActing {
  private timeline: ActingTimeline;
  private looks = new Map<MissionActorId, { target: MissionActorId; turn: boolean }>();
  shot: MissionShot = 'wide';
  constructor(
    private actors: MissionActor[],
    emit: (event: MissionSceneEvent) => void,
  ) {
    this.timeline = new ActingTimeline((cue) => this.apply(cue), emit);
  }
  begin(step: MissionStep) {
    this.shot = step.shot ?? 'wide';
    for (const actor of this.actors) {
      actor.presenting = false;
      actor.listening = true;
      actor.waving = false;
      if (actor.id === 'neighbor' && step.chapter === 0) {
        this.looks.delete(actor.id);
        actor.lookAway();
        continue;
      }
      const target =
        actor.id === 'child' ? (step.speaker === 'Ona' ? 'mother' : 'neighbor') : 'child';
      if (!step.staging) this.looks.set(actor.id, { target, turn: true });
    }
    this.timeline.begin(step);
  }
  private apply(cue: ActingCue) {
    if (cue.camera) this.shot = cue.camera;
    const actor = this.actors.find((item) => item.id === cue.actor);
    if (!actor) return;
    if (cue.look) this.looks.set(actor.id, { target: cue.look, turn: cue.turn ?? false });
    if (cue.motion) {
      actor.presenting = cue.motion === 'talk';
      actor.listening = cue.motion === 'listen';
      if (cue.motion === 'greet') actor.waving = true;
    }
    if (cue.emotion) actor.face.emotion = cue.emotion;
  }
  update(delta: number) {
    this.timeline.advance(
      delta,
      this.actors.every((actor) => !actor.moving),
    );
    for (const actor of this.actors) {
      const gaze = this.looks.get(actor.id);
      const target = this.actors.find((item) => item.id === gaze?.target);
      if (target && gaze) actor.lookAtActor(target, gaze.turn && !actor.moving);
    }
  }
}
