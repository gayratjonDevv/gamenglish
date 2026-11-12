import { CurriculumPanel } from '../features/curriculum';
import { VoicePanel, useRecordedVoice } from '../features/voice';
import { GameViewport, WorldCard, useGameScene } from '../features/world';
import { Button, Notice } from '../shared/ui';
import { appConfig } from './config';
import { useBootstrap } from './useBootstrap';
import { AppHeader } from './ui/AppHeader';
import { AppIntro } from './ui/AppIntro';
import { AppFooter } from './ui/AppFooter';
import { DeliveryNote } from './ui/DeliveryNote';
import styles from './app.module.css';
export function App() {
  const bootstrap = useBootstrap(appConfig.contentBase);
  const voice = useRecordedVoice(bootstrap.data, appConfig.assetBase);
  const game = useGameScene(bootstrap.data, {
    assetBase: appConfig.assetBase,
    decoderBase: appConfig.decoderBase,
    onInteraction: (nodeId) => voice.setSubtitle(`Tanlangan obyekt: ${nodeId}`),
    onExit: voice.stop,
  });
  const error = bootstrap.error || game.error;
  function reload() {
    game.stop();
    bootstrap.reload();
  }
  return (
    <div className={styles.shell}>
      <AppHeader storage={bootstrap.storage} />
      <main>
        <AppIntro />
        {bootstrap.loading ? <Notice>O‘quv xaritasi yuklanmoqda…</Notice> : null}
        {error ? (
          <Notice tone="error">
            {error} <Button onClick={reload}>Qayta yuklash</Button>
          </Notice>
        ) : null}
        <div className={styles.workspace}>
          <CurriculumPanel curriculum={bootstrap.data?.curriculum} />
          <aside className={styles.sideRail}>
            <WorldCard content={bootstrap.data} game={game} />
            <VoicePanel voice={voice} />
            <DeliveryNote />
          </aside>
        </div>
        <GameViewport game={game} />
      </main>
      <AppFooter />
    </div>
  );
}
