import { Button } from '../../../shared/ui';
import type { GameScene } from '../model/useGameScene';
import styles from './viewport.module.css';
const directions = [
  { label: '↑', name: 'Oldinga', x: 0, z: -1 },
  { label: '←', name: 'Chapga', x: -1, z: 0 },
  { label: '↓', name: 'Orqaga', x: 0, z: 1 },
  { label: '→', name: 'O‘ngga', x: 1, z: 0 },
] as const;
export function GameViewport({ game }: { game: GameScene }) {
  return (
    <section
      className={`${styles['game-view']} ${game.started ? styles.active : ''}`}
      aria-label="Three.js o‘yin sahnasi"
    >
      <canvas ref={game.canvas} />
      {game.started ? (
        <>
          <Button className={styles['close-scene']} onClick={game.stop}>
            Sahnadan chiqish
          </Button>
          <p className={styles['game-help']}>
            WASD / strelkalar — yurish · Shift — yugurish · buyum ustiga bosish
          </p>
          <div className={styles['touch-pad']} aria-label="Harakat boshqaruvi">
            {directions.map((direction) => (
              <Button
                key={direction.name}
                aria-label={direction.name}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  game.setTouch(direction.x, direction.z);
                }}
                onPointerUp={() => game.setTouch(0, 0)}
                onLostPointerCapture={() => game.setTouch(0, 0)}
                onPointerCancel={() => game.setTouch(0, 0)}
              >
                {direction.label}
              </Button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
