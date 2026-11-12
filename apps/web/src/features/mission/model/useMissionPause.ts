import { useEffect, useState } from 'react';
export function useMissionPause(started: boolean) {
  const [panel, setPanel] = useState<'none' | 'menu' | 'journal'>('none');
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && started)
        setPanel((current) => (current === 'none' ? 'menu' : 'none'));
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [started]);
  return [panel, setPanel] as const;
}
