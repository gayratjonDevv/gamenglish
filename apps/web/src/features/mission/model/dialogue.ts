import type { Dispatch } from 'react';
import type { MissionStep } from '@gamenglish/contracts';
import type { MissionAction, MissionState } from '@gamenglish/learning';
import type { useMissionAudio } from './useMissionAudio';
export type MissionDialogueProps = {
  step: MissionStep;
  state: MissionState;
  audio: ReturnType<typeof useMissionAudio>;
  dispatch: Dispatch<MissionAction>;
  walk: () => void;
  lineReady: boolean;
  stageComplete: boolean;
};
