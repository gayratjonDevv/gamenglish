import { describe, expect, it } from 'vitest';
import {
  initialMissionState,
  reduceMission,
  restoreMission,
  missionPassed,
} from '../packages/learning/src/mission';
import { firstHello } from '../apps/web/src/features/mission';
const at = (id: string) => ({
  ...initialMissionState,
  index: firstHello.steps.findIndex((step) => step.id === id),
  mastered: [] as string[],
});
describe('first greeting mission', () => {
  it('blocks travel and unanswered questions', () => {
    for (const id of ['walk', 'final-hello']) {
      const state = at(id);
      expect(reduceMission(firstHello, state, { type: 'advance' })).toBe(state);
    }
  });
  it('accepts both natural greeting replies', () => {
    for (const answer of ['Hello', 'Hi']) {
      const state = reduceMission(firstHello, at('final-hello'), { type: 'answer', answer });
      expect(state.mastered).toContain('respond');
      expect(state.accepted).toBe(true);
    }
  });
  it('does not count hinted or corrected answers as independent mastery', () => {
    const wrong = reduceMission(firstHello, at('final-hello'), {
      type: 'answer',
      answer: 'Goodbye',
    });
    const corrected = reduceMission(firstHello, wrong, { type: 'answer', answer: 'Hi' });
    expect(corrected.accepted).toBe(true);
    expect(corrected.mastered).not.toContain('respond');
    expect(missionPassed(firstHello, corrected)).toBe(false);
  });
  it('reviews missing skills and returns to the summary', () => {
    const finish = at('finish');
    const review = reduceMission(firstHello, finish, { type: 'review' });
    expect(review.review).toBe(true);
    const step = firstHello.steps[review.index]!;
    const answered = reduceMission(firstHello, review, {
      type: 'answer',
      answer: step.correct![0]!,
    });
    const returned = reduceMission(firstHello, answered, { type: 'advance' });
    expect(firstHello.steps[returned.index]!.kind).toBe('finish');
  });
  it('rejects malformed saved state and unknown skills', () => {
    expect(restoreMission(firstHello, { index: 999, mastered: ['fake'] })).toEqual(
      initialMissionState,
    );
  });
  it('has unique recording IDs and valid answers for every choice', () => {
    expect(new Set(firstHello.steps.map((s) => s.id)).size).toBe(firstHello.steps.length);
    for (const step of firstHello.steps.filter((s) => s.kind === 'choice')) {
      expect(step.correct?.length).toBeGreaterThan(0);
      expect(step.correct?.every((answer) => step.options?.includes(answer))).toBe(true);
    }
  });
});
