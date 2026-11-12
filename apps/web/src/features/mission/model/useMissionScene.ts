import { useCallback, useEffect, useRef, useState } from 'react';
import type { MissionStep } from '@gamenglish/contracts';
import type { MissionRuntime } from '@gamenglish/engine/runtime';
export function useMissionScene(step: MissionStep, paused: boolean, arrived: () => void) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<MissionRuntime | undefined>(undefined);
  const callbacks = useRef({ step, arrived, paused });
  callbacks.current = { step, arrived, paused };
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState('Modellar tayyorlanmoqda…');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let closed = false;
    let instance: MissionRuntime | undefined;
    setReady(false);
    setError('');
    setProgress(0);
    async function mount() {
      try {
        const { MissionRuntime } = await import('@gamenglish/engine/runtime');
        if (closed || !canvas.current) return;
        instance = new MissionRuntime(canvas.current, (event) => {
          if (closed) return;
          if (event.type === 'ready') {
            setReady(true);
            setProgress(1);
          }
          if (event.type === 'loading') {
            setLoading(event.text);
            setProgress(event.progress);
          }
          if (event.type === 'error') setError(event.text);
          if (event.type === 'arrived') callbacks.current.arrived();
        });
        runtime.current = instance;
        instance.setStep(callbacks.current.step);
        instance.setPaused(callbacks.current.paused);
        await instance.load();
      } catch (failure) {
        if (!closed) setError(failure instanceof Error ? failure.message : 'WebGL ochilmadi.');
      }
    }
    void mount();
    return () => {
      closed = true;
      instance?.dispose();
      if (runtime.current === instance) runtime.current = undefined;
    };
  }, [revision]);
  useEffect(() => {
    runtime.current?.setStep(step);
  }, [step, ready]);
  useEffect(() => {
    runtime.current?.setPaused(paused);
  }, [paused, ready]);
  return {
    canvas,
    ready,
    loading,
    progress,
    error,
    retry: useCallback(() => setRevision((value) => value + 1), []),
    walk: () => runtime.current?.walkToGoal(),
    touch: (x: number, z: number) => runtime.current?.setTouch(x, z),
    speak: (active: boolean) => runtime.current?.setSpeaking(active),
  };
}
