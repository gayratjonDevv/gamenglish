import { useId, useState } from 'react';
import type { Curriculum } from '@gamenglish/contracts';
import { SectionHeading } from '../../../shared/ui';
import { stages, type StageId } from '../model/stages';
import { ModuleCard } from './ModuleCard';
import { StageTabs } from './StageTabs';
import styles from './curriculum.module.css';
export function CurriculumPanel({ curriculum }: { curriculum?: Curriculum }) {
  const [stage, setStage] = useState<StageId>('zero');
  const panelId = useId();
  const modules = curriculum?.modules.filter((module) => module.stage === stage) ?? [];
  const total = curriculum?.modules.reduce((count, module) => count + module.topics.length, 0) ?? 0;
  return (
    <section>
      <SectionHeading
        title="O‘rganish yo‘li"
        meta={curriculum ? `${curriculum.modules.length} modul · ${total} mavzu` : 'Yuklanmoqda'}
      />
      <StageTabs stage={stage} onChange={setStage} panelId={panelId} />
      <div role="tabpanel" id={panelId} aria-labelledby={`${panelId}-${stage}`}>
        <div className={styles['path-caption']}>
          {stages.find((item) => item.id === stage)?.caption}
          <span>{modules.length} modul</span>
        </div>
        <div className={styles.modules}>
          {modules.map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
