import type { ActingCue, MissionSceneEvent, MissionStep } from '@gamenglish/contracts';
/** Learner pacing and authored performance have separate clocks. No wall-clock timers. */
export class ActingTimeline {
  private step?: MissionStep;
  private elapsed = 0;
  private cursor = 0;
  private started = false;
  private completed = false;
  private lineShown = false;
  constructor(
    private apply: (cue: ActingCue) => void,
    private emit: (event: MissionSceneEvent) => void,
  ) {}
  begin(step: MissionStep) {
    if (this.step?.id === step.id) return;
    this.step = step;
    this.elapsed = 0;
    this.cursor = 0;
    this.started = false;
    this.completed = false;
    this.lineShown = false;
    if (!step.staging) {
      this.showLine();
      this.finish();
    }
  }
  advance(delta: number, settled: boolean) {
    const staging = this.step?.staging;
    if (!staging || this.completed || !Number.isFinite(delta) || delta < 0) return;
    if (!this.started && !settled) return;
    this.started = true;
    this.elapsed += delta;
    while (this.cursor < staging.cues.length && staging.cues[this.cursor]!.at <= this.elapsed) {
      const cue = staging.cues[this.cursor++]!;
      this.apply(cue);
      if (cue.line) this.showLine();
    }
    if (this.elapsed >= staging.minimumSeconds) {
      this.showLine();
      this.finish();
    }
  }
  private showLine() {
    if (!this.lineShown && this.step) {
      this.lineShown = true;
      this.emit({ type: 'line-ready', stepId: this.step.id });
    }
  }
  private finish() {
    if (!this.completed && this.step) {
      this.completed = true;
      this.emit({ type: 'staged', stepId: this.step.id });
    }
  }
}
