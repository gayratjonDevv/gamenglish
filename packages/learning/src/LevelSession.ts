import type { Level } from '@gamenglish/contracts';
import { vocabularyGate, type WordMastery } from './mastery';
export class LevelSession {
  private cursor = 0;
  constructor(
    readonly level: Level,
    completed: ReadonlySet<string>,
    words: ReadonlyMap<string, WordMastery>,
  ) {
    if (level.status !== 'published') throw new Error('Draft lessons cannot award progress');
    if (level.prerequisites.some((id) => !completed.has(id)))
      throw new Error('Level prerequisites missing');
    if (!vocabularyGate(level.requiredWords, words).ready)
      throw new Error('Required vocabulary not ready');
  }
  current() {
    return this.level.tasks[this.cursor];
  }
  get completed() {
    return this.cursor === this.level.tasks.length;
  }
  advance(input: { kind: 'instruction-read' } | { kind: 'interaction'; nodeId: string }) {
    const task = this.current();
    if (!task) return false;
    const correct =
      task.kind === 'instruction'
        ? input.kind === 'instruction-read'
        : input.kind === 'interaction' && input.nodeId === task.targetNodeId;
    if (correct) this.cursor++;
    return correct;
  }
}
