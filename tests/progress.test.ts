import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { ProgressRepository } from '@gamenglish/learning';
import type { Evidence } from '@gamenglish/contracts';
const evidence: Evidence = {
  id: 'same-event',
  wordId: 'hello',
  sessionId: 's',
  at: 1000,
  skill: 'listening',
  correct: true,
  assisted: false,
  technicalFailure: false,
};
describe('durable progress', () => {
  it('commits attempt, mastery and outbox once across concurrent submissions and reopen', async () => {
    const name = `test-${crypto.randomUUID()}`,
      db = await ProgressRepository.open(name);
    const results = await Promise.all([db.record(evidence), db.record(evidence)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await db.pending()).length).toBe(1);
    await db.markLevelComplete('zero.hello');
    db.close();
    const reopened = await ProgressRepository.open(name);
    const snapshot = await reopened.snapshot();
    expect(snapshot.words[0]?.skills.listening.successes).toBe(1);
    expect(snapshot.completedLevels).toEqual(['zero.hello']);
    await reopened.acknowledge(['same-event']);
    expect(await reopened.pending()).toHaveLength(0);
    reopened.close();
  });
  it('rejects invalid evidence before mutating storage', async () => {
    const db = await ProgressRepository.open(`test-${crypto.randomUUID()}`);
    await expect(db.record({ ...evidence, at: -1 })).rejects.toThrow();
    expect((await db.snapshot()).words).toHaveLength(0);
    db.close();
  });
});
