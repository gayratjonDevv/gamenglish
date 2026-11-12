import { describe, expect, it } from 'vitest';
import { ActingTimeline } from '../packages/engine/src/ActingTimeline';
import type { ActingCue, MissionSceneEvent } from '../packages/contracts/src';
import { firstHello } from '../apps/web/src/features/mission';
const hello = firstHello.steps.find((step) => step.id === 'first-hello')!;
function setup() {
  const cues: ActingCue[] = [],
    events: MissionSceneEvent[] = [];
  const timeline = new ActingTimeline(
    (cue) => cues.push(cue),
    (event) => events.push(event),
  );
  timeline.begin(hello);
  return { timeline, cues, events };
}
describe('continuous encounter staging', () => {
  it('waits for actors to settle before starting the performance', () => {
    const { timeline, cues, events } = setup();
    timeline.advance(20, false);
    expect(cues).toHaveLength(0);
    expect(events).toHaveLength(0);
  });
  it('looks first, gestures next, then exposes the spoken line', () => {
    const { timeline, cues, events } = setup();
    timeline.advance(1, true);
    expect(cues.some((cue) => cue.look)).toBe(true);
    expect(cues.some((cue) => cue.motion === 'greet')).toBe(false);
    timeline.advance(0.8, true);
    expect(cues.some((cue) => cue.motion === 'greet')).toBe(true);
    expect(events).toHaveLength(0);
    timeline.advance(0.8, true);
    expect(events).toContainEqual({ type: 'line-ready', stepId: hello.id });
    expect(events.some((event) => event.type === 'staged')).toBe(false);
  });
  it('does not replay a greeting when the same step is re-applied', () => {
    const { timeline, cues, events } = setup();
    timeline.advance(3, true);
    timeline.begin(hello);
    timeline.advance(5, true);
    timeline.advance(20, true);
    expect(cues.filter((cue) => cue.motion === 'greet')).toHaveLength(1);
    expect(events.filter((event) => event.type === 'staged')).toHaveLength(1);
  });
  it('rejects invalid time deltas and emits completion once', () => {
    const { timeline, events } = setup();
    timeline.advance(NaN, true);
    timeline.advance(-100, true);
    expect(events).toHaveLength(0);
    timeline.advance(7.2, true);
    expect(events.at(-1)).toEqual({ type: 'staged', stepId: hello.id });
  });
  it('keeps learner answers manual and authored cues ordered within their duration', () => {
    for (const step of firstHello.steps) {
      if (step.kind === 'choice' || step.kind === 'repeat')
        expect(step.staging?.autoAdvance).not.toBe(true);
      if (!step.staging) continue;
      const times = step.staging.cues.map((cue) => cue.at);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(Math.max(...times)).toBeLessThanOrEqual(step.staging.minimumSeconds);
      expect(step.staging.cues.some((cue) => cue.line)).toBe(true);
    }
  });
});
