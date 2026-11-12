import type { ButtonHTMLAttributes } from 'react';
import styles from './ui.module.css';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary';
  fullWidth?: boolean;
};
export function Button({
  variant = 'default',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      {...props}
      type={type}
      className={[
        styles.button,
        variant === 'primary' ? styles.primary : '',
        fullWidth ? styles.fullWidth : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
