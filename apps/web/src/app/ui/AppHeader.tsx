import styles from '../app.module.css';
export function AppHeader({ storage }: { storage: string }) {
  return (
    <header className={styles.topbar}>
      <a className={styles.brand} href="#">
        gam<span>english</span>
        <span className={styles['brand-dot']} />
      </a>
      <span className={styles.edition}>O‘YIN ASOSI · 0.1</span>
      <span className={styles.storage}>{storage}</span>
    </header>
  );
}
