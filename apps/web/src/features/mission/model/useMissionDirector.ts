import { useEffect, useReducer, useState } from 'react';
import {
  initialMissionState,
  missionPassed,
  reduceMission,
  requiredSkills,
  restoreMission,
} from '@gamenglish/learning';
import { firstHello } from './story';
const STORAGE_KEY = 'gamenglish:Z001:mission-v1';
function savedState() {
  try {
    return restoreMission(firstHello, JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return { ...initialMissionState };
  }
}
export function useMissionDirector() {
  const [state, dispatch] = useReducer(
    (current: typeof initialMissionState, action: Parameters<typeof reduceMission>[2]) =>
      reduceMission(firstHello, current, action),
    undefined,
    savedState,
  );
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageError(true);
    }
  }, [state]);
  const step = firstHello.steps[state.index]!;
  return {
    state,
    step,
    dispatch,
    story: firstHello,
    passed: missionPassed(firstHello, state),
    totalSkills: requiredSkills(firstHello).length,
    storageError,
  };
}
