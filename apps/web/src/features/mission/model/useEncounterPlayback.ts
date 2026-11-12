import { useEffect } from 'react';
import type { useMissionDirector } from './useMissionDirector';
import type { useMissionAudio } from './useMissionAudio';
import type { useMissionScene } from './useMissionScene';
export function useEncounterPlayback(
  director: ReturnType<typeof useMissionDirector>,
  scene: ReturnType<typeof useMissionScene>,
  audio: ReturnType<typeof useMissionAudio>,
  active: boolean,
) {
  useEffect(() => {
    scene.speak(audio.playing);
  }, [audio.playing, director.step.id, scene.ready]);
  useEffect(() => {
    if (
      active &&
      scene.staged &&
      scene.lineReady &&
      !audio.playing &&
      !audio.error &&
      director.step.staging?.autoAdvance
    )
      director.dispatch({ type: 'advance' });
  }, [
    active,
    scene.staged,
    scene.lineReady,
    audio.playing,
    audio.error,
    director.step,
    director.dispatch,
  ]);
}
