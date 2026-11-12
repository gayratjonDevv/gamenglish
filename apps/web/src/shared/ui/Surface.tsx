import type { HTMLAttributes } from 'react';
import styles from './ui.module.css';
type Props = HTMLAttributes<HTMLElement> & { tone?: 'default' | 'soft' };
export function Surface({ tone = 'default', className = '', ...props }: Props) {
  return (
    <section
      {...props}
      className={`${styles.surface} ${tone === 'soft' ? styles.soft : ''} ${className}`}
    />
  );
}
