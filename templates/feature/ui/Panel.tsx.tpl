import { SectionHeading, Surface } from '../../../shared/ui';
import type { __PANEL__Props } from '../model/types';
import styles from './__FEATURE__.module.css';

export function __PANEL__({ title, description }: __PANEL__Props) {
  return (
    <Surface className={styles.panel}>
      <SectionHeading title={title} />
      <p>{description}</p>
    </Surface>
  );
}
