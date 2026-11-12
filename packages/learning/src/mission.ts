import type { MissionStory } from '@gamenglish/contracts';
export type MissionState = {
  index: number;
  accepted: boolean;
  assisted: boolean;
  arrived: boolean;
  feedback: string;
  mastered: string[];
  attempts: number;
  review: boolean;
};
export type MissionAction =
  | { type: 'advance' }
  | { type: 'answer'; answer: string }
  | { type: 'hint' }
  | { type: 'arrived' }
  | { type: 'review' }
  | { type: 'restart' };
export const initialMissionState: MissionState = {
  index: 0,
  accepted: false,
  assisted: false,
  arrived: false,
  feedback: '',
  mastered: [],
  attempts: 0,
  review: false,
};
export function requiredSkills(story: MissionStory) {
  return [...new Set(story.steps.flatMap((step) => (step.skill ? [step.skill] : [])))];
}
export function missionPassed(story: MissionStory, state: MissionState) {
  return requiredSkills(story).every((skill) => state.mastered.includes(skill));
}
function enterStep(state: MissionState, index: number): MissionState {
  return { ...state, index, accepted: false, assisted: false, arrived: false, feedback: '' };
}
export function reduceMission(
  story: MissionStory,
  state: MissionState,
  action: MissionAction,
): MissionState {
  const step = story.steps[state.index];
  if (!step) return initialMissionState;
  if (action.type === 'restart') return { ...initialMissionState, mastered: [] };
  if (action.type === 'arrived') return { ...state, arrived: true };
  if (action.type === 'hint')
    return {
      ...state,
      assisted: true,
      feedback: step.hint ?? 'Onangning tushuntirishini qayta o‘qi.',
    };
  if (action.type === 'answer') {
    if (step.kind !== 'choice' || state.accepted || !step.options?.includes(action.answer))
      return state;
    const correct = step.correct?.includes(action.answer) === true;
    return {
      ...state,
      accepted: correct,
      attempts: state.attempts + 1,
      assisted: state.assisted || !correct,
      feedback: correct
        ? state.assisted
          ? 'Yaxshi mashq! Yakunda buni yordamsiz yana sinaymiz.'
          : 'To‘g‘ri! Vaziyatga mos javob berding.'
        : (step.hint ?? 'Yana urinib ko‘r.'),
      mastered:
        correct && !state.assisted && step.skill
          ? [...new Set([...state.mastered, step.skill])]
          : state.mastered,
    };
  }
  if (action.type === 'review') {
    const index = story.steps.findIndex(
      (item) => item.skill && !state.mastered.includes(item.skill),
    );
    return index < 0 ? state : { ...enterStep(state, index), review: true };
  }
  if (
    (step.kind === 'choice' && !state.accepted) ||
    (step.kind === 'travel' && !state.arrived) ||
    step.kind === 'finish'
  )
    return state;
  const next = state.review
    ? story.steps.findIndex((item) => item.kind === 'finish')
    : Math.min(state.index + 1, story.steps.length - 1);
  return enterStep(state, next);
}
export function restoreMission(story: MissionStory, value: unknown): MissionState {
  if (!value || typeof value !== 'object') return { ...initialMissionState };
  const candidate = value as Partial<MissionState>;
  const mastered = Array.isArray(candidate.mastered)
    ? candidate.mastered.filter(
        (item): item is string => typeof item === 'string' && requiredSkills(story).includes(item),
      )
    : [];
  const index =
    Number.isInteger(candidate.index) &&
    typeof candidate.index === 'number' &&
    candidate.index >= 0 &&
    candidate.index < story.steps.length
      ? candidate.index
      : 0;
  return { ...initialMissionState, index, mastered, review: candidate.review === true };
}
