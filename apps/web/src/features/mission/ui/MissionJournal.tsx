import { Button } from '../../../shared/ui';
import { words } from '../model/story';
import type { useMissionAudio } from '../model/useMissionAudio';
import styles from './overlays.module.css';
export function MissionJournal({
  audio,
  close,
}: {
  audio: ReturnType<typeof useMissionAudio>;
  close: () => void;
}) {
  return (
    <div className={styles.scrim}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-title"
        className={styles.modal}
      >
        <div className={styles.kicker}>SENING KICHIK LUG‘ATING</div>
        <h2 id="journal-title">So‘zlar daftari</h2>
        <p>Uchrashganda salomlashamiz. Ketayotganda xayrlashamiz.</p>
        <div className={styles.wordGrid}>
          {words.map(([word, translation, id]) => (
            <div key={word}>
              <strong lang="en">{word}</strong>
              <span>{translation}</span>
              {audio.has(id) && (
                <Button onClick={() => audio.play(id)} aria-label={`${word} so‘zini eshitish`}>
                  Eshitish
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className={styles.note}>
          Good evening — kechqurun uchrashganda. Good night — uxlash oldidan yoki kechasi
          xayrlashganda.
        </p>
        <Button
          variant="primary"
          onClick={() => {
            audio.stop();
            close();
          }}
          autoFocus
        >
          O‘yinga qaytish →
        </Button>
      </section>
    </div>
  );
}
