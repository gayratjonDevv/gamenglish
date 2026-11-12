import { useEffect, useState } from 'react';
import type { GameContent } from '@gamenglish/contracts';
import { ProgressRepository } from '@gamenglish/learning';
import { loadGameContent } from './loadGameContent';
export function useBootstrap(base: string) {
  const [data, setData] = useState<GameContent>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [storage, setStorage] = useState('Tekshirilmoqda');
  useEffect(() => {
    const abort = new AbortController();
    let disposed = false;
    let progress: ProgressRepository | undefined;
    setLoading(true);
    setError('');
    setData(undefined);
    void loadGameContent(base, abort.signal)
      .then((content) => {
        if (!disposed) setData(content);
      })
      .catch((failure: unknown) => {
        if (!disposed) setError(failure instanceof Error ? failure.message : 'Yuklanmadi');
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    void ProgressRepository.open()
      .then((db) => {
        if (disposed) {
          db.close();
          return;
        }
        progress = db;
        setStorage('Qurilmada saqlash tayyor');
      })
      .catch(() => {
        if (!disposed) setStorage('Saqlash mavjud emas — progressni ishonchli saqlab bo‘lmaydi');
      });
    return () => {
      disposed = true;
      abort.abort();
      progress?.close();
    };
  }, [base, revision]);
  return { data, error, loading, storage, reload: () => setRevision((value) => value + 1) };
}
