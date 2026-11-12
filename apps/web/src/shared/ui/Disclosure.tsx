import type { ReactNode } from 'react';
import styles from './ui.module.css';
export function Disclosure({
  summary,
  children,
  className = '',
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`${styles.disclosure} ${className}`}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
