import type { Curriculum } from '@gamenglish/contracts';
import { Disclosure } from '../../../shared/ui';
import styles from './curriculum.module.css';
type Module = Curriculum['modules'][number];
export function ModuleCard({ module, index }: { module: Module; index: number }) {
  return (
    <Disclosure
      summary={
        <>
          <span className={styles['module-index']}>{String(index + 1).padStart(2, '0')}</span>
          <span>
            <strong>{module.title}</strong>
            <small>
              {module.id} · {module.topics.length} mavzu
            </small>
          </span>
          <span className={styles.expand} aria-hidden="true">
            +
          </span>
        </>
      }
    >
      <div className={styles['module-body']}>
        <p>{module.objective}</p>
        <p className={styles.prerequisite}>
          <b>Old shart:</b> {module.prerequisites}
        </p>
        <ol>
          {module.topics.map((topic) => (
            <li key={topic.id}>
              <span>{topic.id}</span>
              <div>
                <strong>{topic.title}</strong>
                <small>{topic.example}</small>
              </div>
            </li>
          ))}
        </ol>
        <p className={styles['outline-note']}>
          Mavzular xaritasi. Lug‘at banki, ovoz va o‘yin vazifalari hali yozilmoqda.
        </p>
      </div>
    </Disclosure>
  );
}
