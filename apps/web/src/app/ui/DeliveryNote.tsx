import { Disclosure } from '../../shared/ui';
import styles from '../app.module.css';
export function DeliveryNote() {
  return (
    <Disclosure className={styles.delivery} summary="Ishlab chiqish holati">
      <p>
        204 mavzu rejasi, 2 draft level shabloni. Nashr qilingan o‘ynaladigan level hozircha yo‘q.
        10 001 yozuvli tekshiruv infratuzilma sinovidir.
      </p>
    </Disclosure>
  );
}
