import { Button } from '../../../shared/ui';
import type { MissionDialogueProps } from '../model/dialogue';
import { DialogueActions } from './DialogueActions';
import { VoicePractice } from './VoicePractice';
import styles from './dialogue.module.css';

export function MissionDialogue({
  step,
  state,
  audio,
  dispatch,
  walk,
  lineReady,
  stageComplete,
}: MissionDialogueProps) {
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
        className={step.english && lineReady ? styles.english : styles.transcript}
        lang={step.english && lineReady ? 'en' : 'uz'}
      >
        {lineReady ? step.text : (step.staging?.waitingText ?? 'Sahna tayyorlanmoqda…')}
      </p>
      {lineReady && step.word && !step.english && (
        <div className={styles.word}>
          <strong lang="en">{step.word}</strong>
          <span>{step.translation}</span>
        </div>
      )}
      {lineReady && step.english && step.translation && (
        <p className={styles.translation}>{step.translation}</p>
      )}
      {lineReady && step.kind === 'repeat' && <VoicePractice />}
      {lineReady && step.kind === 'choice' && (
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
      <DialogueActions
        step={step}
        state={state}
        audio={audio}
        dispatch={dispatch}
        walk={walk}
        lineReady={lineReady}
        stageComplete={stageComplete}
      />
    </section>
  );
}
