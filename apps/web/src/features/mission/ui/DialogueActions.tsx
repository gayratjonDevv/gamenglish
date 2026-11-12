import { Button } from '../../../shared/ui';
import type { MissionDialogueProps } from '../model/dialogue';
import styles from './dialogue.module.css';
export function DialogueActions({
  step,
  state,
  audio,
  dispatch,
  walk,
  lineReady,
  stageComplete,
}: MissionDialogueProps) {
  const advance = () => dispatch({ type: 'advance' });
  return (
    <div className={styles.actions}>
      <div>
        {lineReady && audio.has(step.id) && (
          <Button onClick={() => (audio.playing ? audio.stop() : audio.play(step.id))}>
            {audio.playing ? 'Ovozni to‘xtatish' : 'Qayta eshitish'}
          </Button>
        )}
        {lineReady && step.kind === 'choice' && !state.accepted && (
          <Button onClick={() => dispatch({ type: 'hint' })}>Onamdan yordam</Button>
        )}
      </div>
      {step.kind === 'travel' ? (
        <Button variant="primary" onClick={state.arrived ? advance : walk}>
          {state.arrived ? 'Yetib keldik →' : 'Onam bilan yurish →'}
        </Button>
      ) : (
        <Button
          variant="primary"
          disabled={
            !lineReady ||
            !stageComplete ||
            audio.playing ||
            (step.staging?.autoAdvance === true && !audio.error) ||
            (step.kind === 'choice' && !state.accepted)
          }
          onClick={advance}
        >
          {!stageComplete
            ? 'Sahna davom etmoqda…'
            : step.staging?.autoAdvance && !audio.error
              ? 'Suhbat davom etmoqda…'
              : step.kind === 'repeat'
                ? 'Ovoz chiqarib takrorladim →'
                : state.accepted
                  ? 'Davom etamiz →'
                  : 'Davom etish →'}
        </Button>
      )}
    </div>
  );
}
