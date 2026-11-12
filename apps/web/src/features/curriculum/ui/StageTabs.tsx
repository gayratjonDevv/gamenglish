import { useRef } from 'react';
import { Button } from '../../../shared/ui';
import { stages, type StageId } from '../model/stages';
import styles from './curriculum.module.css';
export function StageTabs({
  stage,
  onChange,
  panelId,
}: {
  stage: StageId;
  onChange: (id: StageId) => void;
  panelId: string;
}) {
  const group = useRef<HTMLDivElement>(null);
  function select(index: number) {
    const target = stages[(index + stages.length) % stages.length]!;
    onChange(target.id);
    group.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [(index + stages.length) % stages.length]?.focus();
  }
  return (
    <div ref={group} className={styles['stage-tabs']} role="tablist" aria-label="Bosqichlar">
      {stages.map((item, index) => (
        <Button
          key={item.id}
          id={`${panelId}-${item.id}`}
          role="tab"
          aria-controls={panelId}
          aria-selected={stage === item.id}
          tabIndex={stage === item.id ? 0 : -1}
          className={stage === item.id ? styles.selected : ''}
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => {
            const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (offset || event.key === 'Home' || event.key === 'End') {
              event.preventDefault();
              select(
                event.key === 'Home' ? 0 : event.key === 'End' ? stages.length - 1 : index + offset,
              );
            }
          }}
        >
          <span className={styles['stage-number']}>0{index + 1}</span>
          <strong>{item.label}</strong>
          <small>{item.range}</small>
        </Button>
      ))}
    </div>
  );
}
