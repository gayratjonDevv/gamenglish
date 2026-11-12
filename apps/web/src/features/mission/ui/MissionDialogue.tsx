import type { Dispatch } from 'react';
import type { MissionStep } from '@gamenglish/contracts';
import type { MissionAction, MissionState } from '@gamenglish/learning';
import { Button } from '../../../shared/ui';
import type { useMissionAudio } from '../model/useMissionAudio';
import { VoicePractice } from './VoicePractice';
import styles from './dialogue.module.css';
type Props = {
  step: MissionStep;
  state: MissionState;
  audio: ReturnType<typeof useMissionAudio>;
  dispatch: Dispatch<MissionAction>;
  walk: () => void;
};
export function MissionDialogue({ step, state, audio, dispatch, walk }: Props) {
  const advance = () => dispatch({ type: 'advance' });
  return (
    <section className={styles.dialogue} aria-label="Suhbat va mashq">
      <div className={styles.speakerRow}>
        <span className={styles.avatar}>
          {step.speaker === 'Ona'
            ? 'O'
            : step.speaker === 'Bola'
              ? 'B'
              : step.speaker === 'Qo‘shni'
                ? 'Q'
                : '01'}
        </span>
        <div>
          <strong>{step.speaker}</strong>
          <span>
            {step.speaker === 'Vazifa'
              ? 'SENING NAVBATING'
              : step.english
                ? 'ENGLISH'
                : 'O‘ZBEKCHA TUSHUNTIRISH'}
          </span>
        </div>
        <span className={styles.status}>
          {audio.playing
            ? 'Ovoz ijro etilmoqda'
            : step.kind === 'choice'
              ? 'O‘zing sinab ko‘r'
              : 'Birinchi salom'}
        </span>
      </div>
      <p
        className={step.english ? styles.english : styles.transcript}
        lang={step.english ? 'en' : 'uz'}
      >
        {step.text}
      </p>
      {step.word && !step.english && (
        <div className={styles.word}>
          <strong lang="en">{step.word}</strong>
          <span>{step.translation}</span>
        </div>
      )}
      {step.english && step.translation && <p className={styles.translation}>{step.translation}</p>}
      {step.kind === 'repeat' && <VoicePractice />}
      {step.kind === 'choice' && (
        <div className={styles.choices} aria-label="Javobni tanlang">
          {step.options?.map((answer, index) => (
            <Button
              key={answer}
              disabled={state.accepted}
              onClick={() => dispatch({ type: 'answer', answer })}
            >
              <span>{index + 1}</span>
              <span lang="en">{answer}</span>
            </Button>
          ))}
        </div>
      )}
      {state.feedback && (
        <p className={state.accepted ? styles.success : styles.feedback} role="status">
          {state.feedback}
        </p>
      )}
      {audio.error && (
        <p className={styles.feedback} role="alert">
          {audio.error}
        </p>
      )}
      <div className={styles.actions}>
        <div>
          {audio.has(step.id) && (
            <Button onClick={() => (audio.playing ? audio.stop() : audio.play(step.id))}>
              {audio.playing ? 'Ovozni to‘xtatish' : 'Qayta eshitish'}
            </Button>
          )}
          {step.kind === 'choice' && !state.accepted && (
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
            disabled={step.kind === 'choice' && !state.accepted}
            onClick={advance}
          >
            {step.kind === 'repeat'
              ? 'Ovoz chiqarib takrorladim →'
              : state.accepted
                ? 'Davom etamiz →'
                : 'Davom etish →'}
          </Button>
        )}
      </div>
    </section>
  );
}
