import { Button } from '../../../shared/ui';
import styles from './overlays.module.css';
type Props = {
  passed: boolean;
  mastered: number;
  total: number;
  subtitleMode: boolean;
  review: () => void;
  journal: () => void;
  restart: () => void;
};
export function MissionSummary({
  passed,
  mastered,
  total,
  subtitleMode,
  review,
  journal,
  restart,
}: Props) {
  return (
    <div className={styles.scrim}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
      >
        <div className={styles.kicker}>MISSIYA 01 · BIRINCHI SALOM</div>
        <div className={styles.achievement}>{passed ? '01' : `${mastered}/${total}`}</div>
        <h2 id="summary-title">
          {passed ? 'Birinchi suhbat — bajarildi!' : 'Yana birga mashq qilamiz.'}
        </h2>
        <p>
          {passed
            ? 'Salomlashish va xayrlashish vaziyatlarini yordamsiz bajarding.'
            : `${total} ko‘nikmadan ${mastered} tasini yordamsiz bajarding. Yordam olgan vaziyatlarni yana mustaqil sinab ko‘ramiz.`}
        </p>
        <p className={styles.note}>
          {subtitleMode
            ? 'Bu matnli mashq natijasi. Tinglab tushunish va talaffuz tasdiqlanmadi.'
            : 'Bu vaziyatga mos javob tanlash natijasi. Talaffuz avtomatik tekshirilmagan.'}
        </p>
        <div className={styles.menuActions}>
          {!passed && (
            <Button variant="primary" onClick={review} autoFocus>
              Mustaqil qayta sinash →
            </Button>
          )}
          <Button onClick={journal}>So‘zlarimni ko‘rish</Button>
          <Button onClick={restart}>Yana o‘ynash</Button>
        </div>
        {passed && (
          <div className={styles.nextLesson}>
            <span>KEYINGI SARGUZASHT</span>
            <strong>My name is…</strong>
            <p>Ismingni aytishni o‘rganamiz. Bu missiya hali tayyorlanmoqda.</p>
          </div>
        )}
      </section>
    </div>
  );
}
