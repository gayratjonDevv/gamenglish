import type { GameContent } from '@gamenglish/contracts';
import { Eyebrow, FinePrint, Badge, Button, Surface } from '../../../shared/ui';
import type { GameScene } from '../model/useGameScene';
import styles from './world.module.css';
export function WorldCard({ content, game }: { content?: GameContent; game: GameScene }) {
  const models = content?.assets.assets.filter((asset) => asset.kind === 'model') ?? [];
  const ready = models.filter((asset) => asset.status === 'ready').length;
  return (
    <Surface tone="soft" className={styles['world-card']}>
      <div className={styles.heading}>
        <Eyebrow>BIRINCHI MANZIL</Eyebrow>
        <Badge>{content && game.missing.length === 0 ? 'SAHNA TAYYOR' : 'ASSET KUTILMOQDA'}</Badge>
      </div>
      <h2>{content?.scene.label ?? 'Uy va yangi do‘st'}</h2>
      <p>Bola avatari, mushukcha va haqiqiy 3D buyumlar uchun tayyor sahna tuzilmasi.</p>
      <div className={styles['world-availability']}>
        <strong>
          {ready} / {models.length}
        </strong>
        <span>tasdiqlangan 3D model</span>
      </div>
      <ul className={styles['asset-list']}>
        {models.map((asset) => (
          <li key={asset.id}>
            <span>{asset.label}</span>
            <small>{asset.status === 'ready' ? 'Tayyor' : 'GLB kerak'}</small>
          </li>
        ))}
      </ul>
      <Button
        variant="primary"
        fullWidth
        disabled={!content || game.missing.length > 0 || game.busy}
        onClick={() => void game.start()}
      >
        {game.busy ? 'Sahna yuklanmoqda…' : 'Sahnani ochish'}
      </Button>
      <FinePrint>
        Tayyor GLB modellari qo‘shilgach ochiladi. Ularning o‘rniga yasama modellar qo‘yilmagan.
      </FinePrint>
    </Surface>
  );
}
