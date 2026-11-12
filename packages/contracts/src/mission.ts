export type MissionRole = 'Ona' | 'Bola' | 'Qo‘shni' | 'Vazifa';
export type MissionShot = 'wide' | 'child' | 'mother' | 'neighbor' | 'conversation' | 'follow';
export type MissionTime = 'morning' | 'afternoon' | 'evening' | 'night';
export type MissionStep = {
  id: string;
  chapter: number;
  speaker: MissionRole;
  text: string;
  kind: 'dialogue' | 'travel' | 'repeat' | 'choice' | 'finish';
  shot?: MissionShot;
  word?: string;
  translation?: string;
  english?: boolean;
  gesture?: string;
  cue?: string;
  time?: MissionTime;
  target?: [number, number];
  options?: string[];
  correct?: string[];
  hint?: string;
  skill?: string;
  staging?: {
    minimumSeconds: number;
    waitingText: string;
    autoAdvance?: boolean;
    cues: ActingCue[];
  };
};
export type MissionStory = {
  id: string;
  revision: number;
  title: string;
  chapters: string[];
  steps: MissionStep[];
};
export type MissionSceneEvent =
  | { type: 'ready' }
  | { type: 'arrived' }
  | { type: 'line-ready'; stepId: string }
  | { type: 'staged'; stepId: string }
  | { type: 'loading'; text: string; progress: number }
  | { type: 'error'; text: string };
export type MissionActorId = 'child' | 'mother' | 'neighbor';

export type ActingCue = {
  at: number;
  actor?: MissionActorId;
  look?: MissionActorId;
  turn?: boolean;
  motion?: 'idle' | 'listen' | 'talk' | 'greet';
  emotion?: 'calm' | 'happy' | 'unsure' | 'listening';
  camera?: MissionShot;
  line?: boolean;
};
