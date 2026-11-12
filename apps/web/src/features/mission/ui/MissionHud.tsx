import { Button } from '../../../shared/ui';
import type { useMissionDirector } from '../model/useMissionDirector';
import type { AudioMode } from '../model/useMissionAudio';
import styles from './hud.module.css';
type Props = {
  started: boolean;
  director: ReturnType<typeof useMissionDirector>;
  mode: AudioMode;
  open: (panel: 'menu' | 'journal') => void;
};
export function MissionHud({ started, director, mode, open }: Props) {
  return (
    <>
      <header className={styles.hud}>
        <a href="/" className={styles.brand} aria-label="GamEnglish bosh sahifa">
          <span className={styles.brandMark}>G</span> gamenglish
          <span className={styles.brandDot}>.</span>
        </a>
        <div className={styles.missionBadge}>
          ZERO <span>/</span> MISSIYA 01
        </div>
        {started && (
          <nav className={styles.tools} aria-label="O‘yin menyusi">
            <Button onClick={() => open('journal')}>So‘zlar daftari</Button>
            <Button onClick={() => open('menu')} aria-label="O‘yinni to‘xtatish">
              Ⅱ
            </Button>
          </nav>
        )}
      </header>
      {started && (
        <section className={styles.quest} aria-label="Joriy vazifa">
          <span className={styles.eyebrow}>YANGI MAHALLA · {director.step.chapter + 1}/6</span>
          <h1>{director.story.chapters[director.step.chapter]}</h1>
          <div className={styles.chapterTrack}>
            {director.story.chapters.map((chapter, index) => (
              <span
                key={chapter}
                className={index <= director.step.chapter ? styles.chapterDone : ''}
              />
            ))}
          </div>
          <p>
            {director.step.kind === 'travel'
              ? 'Onang bilan uchrashuv joyiga yur.'
              : 'Tingla. Tushun. O‘zing sinab ko‘r.'}
          </p>
        </section>
      )}
      {started && (
        <div className={styles.modeBadge}>
          {mode === 'subtitles' ? 'Subtitrli sinov · ovozlar hali yuklanmagan' : 'Yozilgan ovozlar'}
          <span>
            Vaqt:{' '}
            {director.step.time === 'night'
              ? 'tun'
              : director.step.time === 'evening'
                ? 'kechqurun'
                : director.step.time === 'afternoon'
                  ? 'tushdan keyin'
                  : 'ertalab'}
          </span>
        </div>
      )}
    </>
  );
}
