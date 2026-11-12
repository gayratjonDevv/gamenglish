import { evidenceSchema, type Evidence } from '@gamenglish/contracts';
import { applyEvidence, emptyMastery, type WordMastery } from './mastery';
export type ProgressSnapshot = { words: WordMastery[]; completedLevels: string[] };
const request = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
const transaction = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Storage transaction aborted'));
    tx.onerror = () => reject(tx.error);
  });
/** Versioned local-only profile. No raw microphone recordings stored here. */
export class ProgressRepository {
  private constructor(private db: IDBDatabase) {}
  static async open(name = 'gamenglish-progress-v1'): Promise<ProgressRepository> {
    if (typeof indexedDB === 'undefined') throw new Error('Persistent browser storage unavailable');
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('attempts', { keyPath: 'id' });
      db.createObjectStore('words', { keyPath: 'wordId' });
      db.createObjectStore('levels', { keyPath: 'id' });
      db.createObjectStore('outbox', { keyPath: 'id' });
    };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      let abandoned = false;
      req.onsuccess = () => {
        if (abandoned) req.result.close();
        else resolve(req.result);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        abandoned = true;
        reject(new Error('Close other tabs to upgrade progress storage'));
      };
    });
    db.onversionchange = () => db.close();
    return new ProgressRepository(db);
  }
  async record(input: Evidence): Promise<boolean> {
    const evidence = evidenceSchema.parse(input);
    const tx = this.db.transaction(['attempts', 'words', 'outbox'], 'readwrite');
    const done = transaction(tx);
    try {
      const attempts = tx.objectStore('attempts');
      if (await request(attempts.get(evidence.id))) {
        await done;
        return false;
      }
      const words = tx.objectStore('words');
      const previous = (await request(words.get(evidence.wordId))) as WordMastery | undefined;
      attempts.put(evidence);
      words.put(applyEvidence(previous ?? emptyMastery(evidence.wordId), evidence));
      tx.objectStore('outbox').put({ id: evidence.id, type: 'evidence', payload: evidence });
      await done;
      return true;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* already finished */
      }
      await done.catch(() => undefined);
      throw error;
    }
  }
  async snapshot(): Promise<ProgressSnapshot> {
    const tx = this.db.transaction(['words', 'levels'], 'readonly');
    const done = transaction(tx);
    const [words, levels] = await Promise.all([
      request(tx.objectStore('words').getAll()),
      request(tx.objectStore('levels').getAll()),
    ]);
    await done;
    return {
      words: words as WordMastery[],
      completedLevels: (levels as { id: string }[]).map((l) => l.id),
    };
  }
  async markLevelComplete(id: string) {
    const tx = this.db.transaction('levels', 'readwrite');
    const done = transaction(tx);
    tx.objectStore('levels').put({ id, at: Date.now() });
    await done;
  }
  async pending(limit = 100): Promise<unknown[]> {
    const tx = this.db.transaction('outbox', 'readonly');
    const done = transaction(tx);
    const values = await request(
      tx.objectStore('outbox').getAll(undefined, Math.min(100, Math.max(1, limit))),
    );
    await done;
    return values;
  }
  async acknowledge(ids: string[]) {
    const tx = this.db.transaction('outbox', 'readwrite');
    const done = transaction(tx);
    for (const id of ids) tx.objectStore('outbox').delete(id);
    await done;
  }
  close() {
    this.db.close();
  }
}
