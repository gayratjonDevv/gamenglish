import type { Evidence, WordRequirement } from '@gamenglish/contracts';
export type Skill = Evidence['skill'];
export type SkillState = { successes: number; lastAt: number };
export type WordMastery = {
  wordId: string;
  skills: Record<Skill, SkillState>;
  reviewStep: number;
  dueAt: number;
  updatedAt: number;
};
const intervals = [1, 3, 7, 14, 30].map((days) => days * 86_400_000);
export function emptyMastery(wordId: string): WordMastery {
  return {
    wordId,
    skills: {
      listening: { successes: 0, lastAt: 0 },
      recall: { successes: 0, lastAt: 0 },
      speaking: { successes: 0, lastAt: 0 },
      writing: { successes: 0, lastAt: 0 },
    },
    reviewStep: 0,
    dueAt: 0,
    updatedAt: 0,
  };
}
export function applyEvidence(previous: WordMastery, evidence: Evidence): WordMastery {
  if (previous.wordId !== evidence.wordId) throw new Error('Word mismatch');
  if (evidence.technicalFailure || evidence.at < previous.updatedAt) return previous;
  const next = structuredClone(previous);
  next.updatedAt = evidence.at;
  if (evidence.assisted) return next;
  const skill = next.skills[evidence.skill];
  if (!evidence.correct) {
    skill.successes = 0;
    skill.lastAt = evidence.at;
    next.reviewStep = 0;
    next.dueAt = evidence.at + 300_000;
    return next;
  }
  if (skill.successes > 0 && evidence.at - skill.lastAt < 30_000) return next;
  skill.successes++;
  skill.lastAt = evidence.at;
  // One review step per due review, not per button press or per skill in the same session.
  if (!next.dueAt || evidence.at >= next.dueAt) {
    next.dueAt = evidence.at + intervals[next.reviewStep]!;
    next.reviewStep = Math.min(next.reviewStep + 1, intervals.length - 1);
  }
  return next;
}
export function vocabularyGate(
  requirements: WordRequirement[],
  mastery: ReadonlyMap<string, WordMastery>,
) {
  const missing = requirements
    .filter((r) => {
      const state = mastery.get(r.wordId);
      if (!state) return r.receptive || r.productive;
      return (
        (r.receptive && state.skills.listening.successes < 2) ||
        (r.productive && state.skills.recall.successes < 1)
      );
    })
    .map((r) => r.wordId);
  return { ready: missing.length === 0, missing };
}
