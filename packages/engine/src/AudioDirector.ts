import type { AssetCatalog, AudioCatalog, Locale, VoiceLine } from '@gamenglish/contracts';
import { resolvePath } from './net';
export type VoiceMode = 'uz-en' | 'en' | 'uz';
export interface AudioPort {
  src: string;
  volume: number;
  preload: string;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
  load(): void;
  addEventListener(type: string, callback: EventListener): void;
  removeEventListener(type: string, callback: EventListener): void;
  removeAttribute(name: string): void;
}
export type VoiceEvent =
  | { kind: 'subtitle'; line: VoiceLine }
  | { kind: 'missing' | 'blocked' | 'error'; message: string }
  | { kind: 'idle' };
/** Streams recorded audio; no Web Speech synthesis and no full voice library decoding. */
export class AudioDirector {
  private token = 0;
  private cancelCurrent: (() => void) | undefined;
  private current: AudioPort | undefined;
  private mode: VoiceMode = 'uz-en';
  private volume = 0.85;
  constructor(
    private catalog: AudioCatalog,
    private assets: AssetCatalog,
    private baseUrl: string,
    private emit: (event: VoiceEvent) => void,
    private createAudio: () => AudioPort = () => new Audio(),
  ) {}
  setMode(mode: VoiceMode) {
    this.stop();
    this.mode = mode;
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.current) this.current.volume = this.volume;
  }
  async playCue(id: string): Promise<void> {
    this.stop();
    const token = this.token;
    const cue = this.catalog.cues.find((c) => c.id === id);
    if (!cue) {
      this.emit({ kind: 'error', message: `Unknown cue: ${id}` });
      return;
    }
    const order: Locale[] = this.mode === 'uz-en' ? ['uz', 'en'] : [this.mode];
    for (const locale of order) {
      for (const line of cue.lines.filter((l) => l.locale === locale)) {
        if (token !== this.token) return;
        this.emit({ kind: 'subtitle', line });
        const asset = this.assets.assets.find((a) => a.id === line.assetId);
        if (!asset || asset.status !== 'ready' || asset.kind !== 'audio') {
          this.emit({ kind: 'missing', message: `${locale}: yozuv hali qo‘shilmagan` });
          continue;
        }
        const result = await this.playFile(resolvePath(this.baseUrl, asset.path));
        if (token !== this.token) return;
        if (result !== 'ended') return;
      }
    }
    if (token === this.token) this.emit({ kind: 'idle' });
  }
  private playFile(url: string): Promise<'ended' | 'stopped' | 'error'> {
    const audio = this.createAudio();
    this.current = audio;
    audio.src = url;
    audio.preload = 'metadata';
    audio.volume = this.volume;
    return new Promise((resolve) => {
      let done = false;
      const finish = (result: 'ended' | 'stopped' | 'error') => {
        if (done) return;
        done = true;
        audio.pause();
        audio.removeEventListener('ended', ended);
        audio.removeEventListener('error', failed);
        audio.removeAttribute('src');
        audio.load();
        if (this.current === audio) this.current = undefined;
        if (this.cancelCurrent === cancel) this.cancelCurrent = undefined;
        resolve(result);
      };
      const ended: EventListener = () => finish('ended');
      const failed: EventListener = () => {
        this.emit({ kind: 'error', message: 'Ovoz yuklanmadi. Qayta urinib ko‘ring.' });
        finish('error');
      };
      const cancel = () => finish('stopped');
      this.cancelCurrent = cancel;
      audio.addEventListener('ended', ended);
      audio.addEventListener('error', failed);
      void audio.play().catch((error) => {
        if (done) return;
        this.emit({
          kind: 'blocked',
          message: error instanceof Error ? error.message : 'Ovozni bosib qayta boshlang',
        });
        finish('error');
      });
    });
  }
  stop() {
    this.token++;
    this.cancelCurrent?.();
    this.cancelCurrent = undefined;
  }
  dispose() {
    this.stop();
  }
}
