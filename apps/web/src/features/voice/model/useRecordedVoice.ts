import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameContent } from '@gamenglish/contracts';
import { AudioDirector, type VoiceMode } from '@gamenglish/engine';
export function useRecordedVoice(content: GameContent | undefined, base: string) {
  const [mode, setMode] = useState<VoiceMode>('uz-en');
  const [subtitle, setSubtitle] = useState('Yozib tayyorlangan ovozlar shu yerda eshitiladi.');
  const [notice, setNotice] = useState('');
  const director = useRef<AudioDirector | undefined>(undefined);
  useEffect(() => {
    if (!content) return;
    const audio = new AudioDirector(content.audio, content.assets, base, (event) => {
      if (event.kind === 'subtitle') setSubtitle(event.line.text);
      else if (event.kind !== 'idle') setNotice(event.message);
    });
    director.current = audio;
    setNotice('');
    const stopWhenHidden = () => {
      if (document.hidden) audio.stop();
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden);
      audio.dispose();
      if (director.current === audio) director.current = undefined;
    };
  }, [content, base]);
  useEffect(() => {
    director.current?.setMode(mode);
  }, [content, base, mode]);
  const stop = useCallback(() => director.current?.stop(), []);
  const play = () => {
    setNotice('');
    void director.current?.playCue('cue.welcome');
  };
  return {
    mode,
    setMode,
    subtitle,
    setSubtitle,
    notice,
    stop,
    play,
    available: !!content,
    recordingCount:
      content?.assets.assets.filter((asset) => asset.kind === 'audio' && asset.status === 'ready')
        .length ?? 0,
  };
}
export type RecordedVoice = ReturnType<typeof useRecordedVoice>;
