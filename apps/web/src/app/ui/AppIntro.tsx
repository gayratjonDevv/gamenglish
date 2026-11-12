import { Eyebrow } from '../../shared/ui';
import styles from '../app.module.css';
export function AppIntro() {
  return (
    <section className={styles.intro}>
      <Eyebrow>BIR DO‘ST. BIR DUNYO. YANGI TIL.</Eyebrow>
      <h1>
        Birga ulg‘ayamiz.
        <br />
        <span>Inglizcha gaplashamiz.</span>
      </h1>
      <p>
        O‘z do‘sting bilan tanishishdan katta sarguzashtlargacha.
        <br />
        Har bir yangi so‘z keyingi qadamga yo‘l ochadi.
      </p>
    </section>
  );
}
