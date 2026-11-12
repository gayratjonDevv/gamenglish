import { Button } from '../../../shared/ui';
import styles from './mission.module.css';
export function TouchControls({ move }: { move: (x: number, z: number) => void }) {
  const directions = [
    ['↑', 0, -1],
    ['←', -1, 0],
    ['↓', 0, 1],
    ['→', 1, 0],
  ] as const;
  return (
    <div className={styles.touchControls} aria-label="Yurish tugmalari">
      {directions.map(([label, x, z]) => (
        <Button
          key={label}
          aria-label={`Yurish ${label}`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            move(x, z);
          }}
          onPointerUp={() => move(0, 0)}
          onPointerCancel={() => move(0, 0)}
          onLostPointerCapture={() => move(0, 0)}
          onKeyDown={(event) => {
            if (event.key === ' ' || event.key === 'Enter') move(x, z);
          }}
          onKeyUp={() => move(0, 0)}
          onBlur={() => move(0, 0)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
