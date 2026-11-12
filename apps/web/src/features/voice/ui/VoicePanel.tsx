import { FinePrint, Button, SelectField, SectionHeading, Surface } from '../../../shared/ui';
import type { VoiceMode } from '@gamenglish/engine';
import type { RecordedVoice } from '../model/useRecordedVoice';
import styles from './voice.module.css';
const modes = [
  { value: 'uz-en', label: 'O‘zbekcha → English' },
  { value: 'en', label: 'English' },
  { value: 'uz', label: 'O‘zbekcha' },
] as const;
export function VoicePanel({ voice }: { voice: RecordedVoice }) {
  return (
    <Surface className={styles['voice-card']}>
      <SectionHeading title="Ikki tilda ovoz" meta={`${voice.recordingCount} yozuv`} />
      <SelectField
        label="Tinglash tartibi"
        value={voice.mode}
        options={modes}
        onChange={(value) => voice.setMode(value as VoiceMode)}
      />
      <blockquote aria-live="polite">{voice.subtitle}</blockquote>
      <div className={styles['voice-actions']}>
        <Button onClick={voice.play} disabled={!voice.available}>
          Namunani tinglash
        </Button>
        <Button onClick={voice.stop}>To‘xtatish</Button>
      </div>
      {voice.notice ? <FinePrint role="status">{voice.notice}</FinePrint> : null}
      <FinePrint>Siz tayyorlagan ovoz yozuvlari ishlatiladi.</FinePrint>
    </Surface>
  );
}
