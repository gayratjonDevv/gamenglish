import { useEffect, useState } from 'react';
import { Button } from '../../../shared/ui';
import { useMissionDirector } from '../model/useMissionDirector';
import { useMissionScene } from '../model/useMissionScene';
import { useMissionAudio, type AudioMode } from '../model/useMissionAudio';
import { MissionHud } from './MissionHud';
import { MissionDialogue } from './MissionDialogue';
import { MissionStart } from './MissionStart';
import { MissionJournal } from './MissionJournal';
import { MissionMenu } from './MissionMenu';
import { MissionSummary } from './MissionSummary';
import { TouchControls } from './TouchControls';
import styles from './mission.module.css';
export function MissionScreen() {
  const director = useMissionDirector();
  const [started, setStarted] = useState(false);
  const [panel, setPanel] = useState<'none' | 'menu' | 'journal'>('none');
  const [mode, setMode] = useState<AudioMode>('subtitles');
  const scene = useMissionScene(director.step, !started || panel !== 'none', () =>
    director.dispatch({ type: 'arrived' }),
  );
  const audio = useMissionAudio(director.step.id, started && panel === 'none', mode);
  useEffect(() => {
    scene.speak(audio.playing);
  }, [audio.playing, director.step.id, scene.ready]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && started)
        setPanel((value) => (value === 'none' ? 'menu' : 'none'));
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [started]);
  const begin = (selected: AudioMode) => {
    setMode(selected);
    setStarted(true);
  };
  return (
    <main className={styles.game} aria-label="GamEnglish: Birinchi salom">
      <canvas
        ref={scene.canvas}
        className={styles.canvas}
        aria-label="Uch o‘lchamli mahalla. Yurish uchun WASD yoki yerga bosing."
      />
      <div className={styles.vignette} />
      <MissionHud started={started} director={director} mode={mode} open={setPanel} />
      {!scene.ready && !scene.error && (
        <div className={styles.loading}>
          <span className={styles.spinner} />
          <h2>{scene.loading}</h2>
          <progress value={scene.progress} max={1} />
          <p>Haqiqiy 3D modellar yuklanmoqda. Birinchi ochilish biroz vaqt oladi.</p>
        </div>
      )}
      {scene.error && (
        <div className={styles.loading} role="alert">
          <h2>Sahna ochilmadi</h2>
          <p>{scene.error}</p>
          <Button variant="primary" onClick={scene.retry}>
            Qayta urinish
          </Button>
        </div>
      )}
      {scene.ready && !started && (
        <MissionStart resume={director.state.index > 0} audio={audio} begin={begin} />
      )}
      {scene.ready &&
        started &&
        panel === 'none' &&
        (director.step.kind === 'finish' ? (
          <MissionSummary
            passed={director.passed}
            mastered={director.state.mastered.length}
            total={director.totalSkills}
            subtitleMode={mode === 'subtitles'}
            review={() => director.dispatch({ type: 'review' })}
            journal={() => setPanel('journal')}
            restart={() => {
              director.dispatch({ type: 'restart' });
              setStarted(false);
            }}
          />
        ) : (
          <MissionDialogue
            key={director.step.id}
            step={director.step}
            state={director.state}
            audio={audio}
            dispatch={director.dispatch}
            walk={scene.walk}
          />
        ))}
      {started &&
        panel === 'none' &&
        director.step.kind === 'travel' &&
        !director.state.arrived && <TouchControls move={scene.touch} />}
      {panel === 'journal' && <MissionJournal audio={audio} close={() => setPanel('none')} />}
      {panel === 'menu' && (
        <MissionMenu
          audio={audio}
          mode={mode}
          changeMode={setMode}
          close={() => setPanel('none')}
          restart={() => {
            director.dispatch({ type: 'restart' });
            setPanel('none');
            setStarted(false);
          }}
        />
      )}
      {director.storageError && (
        <p className={styles.storageError} role="status">
          Brauzer progressni saqlashga ruxsat bermadi.
        </p>
      )}
      <footer className={styles.worldNote}>
        Siz bergan mahalla va qahramon modeli{' '}
        <span>Ona va qo‘shni ko‘rinishi vaqtincha bir xil</span>
      </footer>
    </main>
  );
}
