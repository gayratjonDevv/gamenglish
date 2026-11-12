import { useCallback, useEffect, useRef, useState } from 'react';
import { firstHello } from './story';
export type AudioMode = 'subtitles' | 'recorded';
export function useMissionAudio(stepId: string, active: boolean, mode: AudioMode) {
  const urls = useRef(new Map<string, string>());
  const player = useRef<HTMLAudioElement | undefined>(undefined);
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const recordingIds = firstHello.steps
    .filter((step) => step.speaker !== 'Vazifa')
    .map((step) => step.id);
  const stop = useCallback(() => {
    if (player.current) {
      player.current.pause();
      player.current.onended = null;
      player.current.onerror = null;
      player.current.src = '';
      player.current = undefined;
    }
    setPlaying(false);
  }, []);
  const play = useCallback(
    (id: string) => {
      stop();
      setError('');
      const url = urls.current.get(id);
      if (!url) {
        setError('Bu replika uchun ovoz yozuvi hali yuklanmagan.');
        return;
      }
      const audio = new Audio(url);
      player.current = audio;
      audio.onended = () => {
        if (player.current === audio) setPlaying(false);
      };
      audio.onerror = () => {
        if (player.current === audio) {
          setPlaying(false);
          setError('Audio fayl ijro etilmadi. Boshqa format bilan urinib ko‘ring.');
        }
      };
      setPlaying(true);
      void audio.play().catch(() => {
        if (player.current === audio) {
          setPlaying(false);
          setError('Ovozni boshlash uchun “Eshitish” tugmasini bosing.');
        }
      });
    },
    [stop],
  );
  function importFiles(files: FileList | null) {
    if (!files) return;
    stop();
    let matched = 0;
    for (const file of Array.from(files)) {
      const id = file.name.replace(/\.[^.]+$/, '');
      if (!recordingIds.includes(id) || !/\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name)) continue;
      const previous = urls.current.get(id);
      if (previous) URL.revokeObjectURL(previous);
      urls.current.set(id, URL.createObjectURL(file));
      matched++;
    }
    setCount(urls.current.size);
    setError(
      matched
        ? ''
        : 'Fayl nomlari ssenariydagi ID bilan bir xil bo‘lsin. Masalan: first-hello.mp3.',
    );
  }
  useEffect(() => {
    if (active && mode === 'recorded' && urls.current.has(stepId)) play(stepId);
    else stop();
    return stop;
  }, [stepId, active, mode, play, stop]);
  useEffect(
    () => () => {
      for (const url of urls.current.values()) URL.revokeObjectURL(url);
      urls.current.clear();
    },
    [],
  );
  return {
    count,
    total: recordingIds.length,
    ready: count === recordingIds.length,
    playing,
    error,
    play,
    stop,
    importFiles,
    has: (id: string) => urls.current.has(id),
  };
}
