import { Button } from '../../../shared/ui';
import type { AudioMode, useMissionAudio } from '../model/useMissionAudio';
import styles from './overlays.module.css';
type Props = {
  resume: boolean;
  audio: ReturnType<typeof useMissionAudio>;
  begin: (mode: AudioMode) => void;
};
export function MissionStart({ resume, audio, begin }: Props) {
  return (
    <section className={styles.intro} aria-labelledby="mission-title">
      <div className={styles.kicker}>INGLIZ TILIDAGI BIRINCHI SARGUZASHTING</div>
      <h1 id="mission-title">
        Har bir do‘stlik
        <br />
        bir <em>salomdan</em>
        <br />
        boshlanadi.
      </h1>
      <p>
        Yangi mahalla. Yangi qo‘shnilar. Onang bilan sayrga chiq va birinchi inglizcha suhbatingni
        boshla.
      </p>
      <div className={styles.metadata}>
        <span>01 / Birinchi salom</span>
        <span>8–12 daqiqa</span>
        <span>8 ta ibora</span>
      </div>
      <Button variant="primary" className={styles.begin} onClick={() => begin('subtitles')}>
        {resume ? 'Sayrni davom ettirish' : 'Sarguzashtni boshlash'} <span>→</span>
      </Button>
      <p className={styles.note}>
        Hozir subtitrli sinov. Tabiiy ovoz yozuvlari hali qo‘shilmagan. Robot ovoz ishlatilmaydi.
      </p>
      <details className={styles.audioImport}>
        <summary>
          Ovoz yozuvlarini ulash · {audio.count}/{audio.total}
        </summary>
        <p>
          Har bir audio nomi ssenariy IDsi bilan bir xil bo‘lsin: first-hello.mp3, hello-sample.mp3…
          Yozuvlar shu ochilgan sessiyada ishlaydi.
        </p>
        <input
          aria-label="Missiya ovozlarini yuklash"
          type="file"
          accept="audio/*"
          multiple
          onChange={(event) => audio.importFiles(event.target.files)}
        />
        <Button disabled={!audio.ready} onClick={() => begin('recorded')}>
          Tabiiy ovozlar bilan boshlash
        </Button>
        {audio.error && <p role="alert">{audio.error}</p>}
      </details>
    </section>
  );
}
