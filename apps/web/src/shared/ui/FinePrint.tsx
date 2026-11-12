import type { HTMLAttributes } from 'react';
import styles from './ui.module.css';
export function FinePrint({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={`${styles.fineprint} ${className}`} />;
}
