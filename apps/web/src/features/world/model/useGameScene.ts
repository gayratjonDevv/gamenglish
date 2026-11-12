import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameContent } from '@gamenglish/contracts';
import { missingSceneAssets } from '@gamenglish/engine';
import type { GameEngine } from '@gamenglish/engine/runtime';
type Options = {
  assetBase: string;
  decoderBase?: string;
  onInteraction: (nodeId: string) => void;
  onExit: () => void;
};
export function useGameScene(content: GameContent | undefined, options: Options) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<GameEngine | undefined>(undefined);
  const epoch = useRef(0);
  const loading = useRef(false);
  const callbacks = useRef(options);
  callbacks.current = options;
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const missing = content ? missingSceneAssets(content.scene, content.assets) : [];
  const dispose = useCallback(() => {
    epoch.current++;
    runtime.current?.dispose();
    runtime.current = undefined;
    loading.current = false;
  }, []);
  const stop = useCallback(() => {
    dispose();
    setStarted(false);
    setBusy(false);
    callbacks.current.onExit();
  }, [dispose]);
  useEffect(() => {
    setStarted(false);
    setBusy(false);
    setError('');
    return dispose;
  }, [content, options.assetBase, options.decoderBase, dispose]);
  async function start() {
    if (!content || !canvas.current || loading.current || missing.length) return;
    dispose();
    const ticket = epoch.current;
    loading.current = true;
    setBusy(true);
    setError('');
    let instance: GameEngine | undefined;
    try {
      const { GameEngine } = await import('@gamenglish/engine/runtime');
      if (ticket !== epoch.current) return;
      instance = new GameEngine(
        canvas.current,
        content.assets,
        options.assetBase,
        (event) => {
          if (ticket !== epoch.current) return;
          if (event.type === 'error') {
            setError(event.message);
            stop();
          } else callbacks.current.onInteraction(event.nodeId);
        },
        options.decoderBase,
      );
      runtime.current = instance;
      await instance.enter(content.scene);
      if (ticket === epoch.current) setStarted(true);
    } catch (failure) {
      instance?.dispose();
      if (ticket === epoch.current) {
        runtime.current = undefined;
        setError(failure instanceof Error ? failure.message : 'Sahna ochilmadi');
      }
    } finally {
      if (ticket === epoch.current) {
        loading.current = false;
        setBusy(false);
      }
    }
  }
  return {
    canvas,
    started,
    busy,
    error,
    start,
    stop,
    missing,
    setTouch: (x: number, z: number) => runtime.current?.setTouch(x, z),
  };
}
export type GameScene = ReturnType<typeof useGameScene>;
