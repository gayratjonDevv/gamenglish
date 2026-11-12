import { Button } from '../../../shared/ui';
import type { AudioMode, useMissionAudio } from '../model/useMissionAudio';
import styles from './overlays.module.css';
type Props = {
  audio: ReturnType<typeof useMissionAudio>;
  mode: AudioMode;
  changeMode: (mode: AudioMode) => void;
  close: () => void;
  restart: () => void;
};
export function MissionMenu({ audio, mode, changeMode, close, restart }: Props) {
  return (
    <div className={styles.scrim}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
      >
        <div className={styles.kicker}>BIR OZ TANAFFUS</div>
        <h2 id="pause-title">Sayr seni kutadi.</h2>
        <p>
          Yurish: WASD yoki yo‘nalish tugmalari. Yo‘lakka bosib ham yurish mumkin. Suhbat sening
          javobingni kutadi.
        </p>
        <p>
          Progress shu brauzerda saqlanadi. Hozirgi rejim:{' '}
          {mode === 'subtitles' ? 'subtitrli sinov' : 'yozilgan ovozlar'}.
        </p>
        <label className={styles.audioImport}>
          Tabiiy ovozlar · {audio.count}/{audio.total}
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={(event) => audio.importFiles(event.target.files)}
          />
        </label>
        <p className={styles.note}>
          Fayllar replika IDsi bilan nomlanadi. Masalan: welcome.mp3, first-hello.mp3. Yozuvlar
          sahifa yopilganda saqlanmaydi.
        </p>
        {audio.error && <p role="alert">{audio.error}</p>}
        <div className={styles.menuActions}>
          <Button disabled={!audio.ready} onClick={() => changeMode('recorded')}>
            Ovozli rejim
          </Button>
          <Button onClick={() => changeMode('subtitles')}>Subtitr rejimi</Button>
          <Button onClick={restart}>Boshidan boshlash</Button>
          <Button variant="primary" onClick={close} autoFocus>
            Davom etish →
          </Button>
        </div>
      </section>
    </div>
  );
}
