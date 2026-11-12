import type { ReactNode } from 'react';
import styles from './ui.module.css';
export function SectionHeading({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <div className={styles.sectionLabel}>
      <h2>{title}</h2>
      {meta ? <span>{meta}</span> : null}
    </div>
  );
}
