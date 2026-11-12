import { Button } from '../../../shared/ui';
import { useVoicePractice } from '../model/useVoicePractice';
import styles from './dialogue.module.css';
export function VoicePractice() {
  const voice = useVoicePractice();
  return (
    <div className={styles.practice}>
      <span>Eshit. Ovoz chiqarib takrorla.</span>
      <Button onClick={voice.recording ? voice.stop : () => void voice.start()}>
        {voice.recording ? 'Yozishni tugatish' : 'Ovozimni yozish'}
      </Button>
      {voice.clip && <audio controls src={voice.clip} aria-label="O‘zingiz yozgan ovoz" />}
      <small>Yozuv qurilmangda qoladi. Talaffuzga avtomatik baho berilmaydi.</small>
      {voice.error && <p role="alert">{voice.error}</p>}
    </div>
  );
}
