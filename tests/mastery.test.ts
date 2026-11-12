import { describe, it, expect } from 'vitest';
import { applyEvidence, emptyMastery, vocabularyGate } from '@gamenglish/learning';
import type { Evidence } from '@gamenglish/contracts';
const e = (overrides: Partial<Evidence> = {}): Evidence => ({
  id: 'a',
  wordId: 'hello',
  sessionId: 'session',
  at: 1000,
  skill: 'listening',
  correct: true,
  assisted: false,
  technicalFailure: false,
  ...overrides,
});
describe('vocabulary evidence', () => {
  it('does not turn assistance or microphone errors into mastery', () => {
    const m = emptyMastery('hello');
    expect(applyEvidence(m, e({ technicalFailure: true }))).toEqual(m);
    expect(applyEvidence(m, e({ assisted: true })).skills.listening.successes).toBe(0);
  });
  it('requires spaced independent recognition and recall for an active prerequisite', () => {
    let m = applyEvidence(emptyMastery('hello'), e());
    m = applyEvidence(m, e({ at: 2000 }));
    expect(m.skills.listening.successes).toBe(1);
    m = applyEvidence(m, e({ at: 32_000 }));
    const req = [{ wordId: 'hello', receptive: true, productive: true }];
    expect(vocabularyGate(req, new Map([['hello', m]])).ready).toBe(false);
    m = applyEvidence(m, e({ at: 33_000, skill: 'recall' }));
    expect(vocabularyGate(req, new Map([['hello', m]])).ready).toBe(true);
  });
  it('does not advance review spacing for repeated immediate practice', () => {
    let m = applyEvidence(emptyMastery('hello'), e());
    const due = m.dueAt;
    m = applyEvidence(m, e({ at: 32_000 }));
    expect(m.dueAt).toBe(due);
    expect(m.reviewStep).toBe(1);
  });
  it('ignores out-of-order results and schedules failed recall soon', () => {
    let m = applyEvidence(emptyMastery('hello'), e({ at: 50_000 }));
    expect(applyEvidence(m, e({ at: 20_000 }))).toEqual(m);
    m = applyEvidence(m, e({ at: 60_000, correct: false }));
    expect(m.skills.listening.successes).toBe(0);
    expect(m.dueAt).toBe(360_000);
  });
});
