import { describe, it, expect, vi } from 'vitest';
import { AudioDirector, type AudioPort, type VoiceEvent } from '@gamenglish/engine';
import type { AssetCatalog, AudioCatalog } from '@gamenglish/contracts';
class FakeAudio extends EventTarget implements AudioPort {
  src = '';
  volume = 1;
  preload = '';
  currentTime = 0;
  play = vi.fn(async () => {});
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn();
}
const assets: AssetCatalog = {
  schemaVersion: 1,
  revision: 'x',
  assets: ['uz', 'en'].map((id) => ({
    id,
    kind: 'audio',
    label: id,
    license: 'owned',
    source: 'recorded',
    status: 'ready',
    path: `${id}.mp3`,
    bytes: 1,
    residentBytes: 1,
    sha256: 'a'.repeat(64),
    animationMap: {},
  })),
};
const catalog: AudioCatalog = {
  schemaVersion: 1,
  revision: 'x',
  cues: [
    {
      id: 'hello',
      lines: [
        { locale: 'uz', text: 'Salom', assetId: 'uz' },
        { locale: 'en', text: 'Hello', assetId: 'en' },
      ],
    },
  ],
};
describe('recorded bilingual audio', () => {
  it('plays uz then en and cleans up media handles', async () => {
    const ports: FakeAudio[] = [];
    const events: VoiceEvent[] = [];
    const d = new AudioDirector(
      catalog,
      assets,
      'https://assets.test/',
      (e) => events.push(e),
      () => {
        const a = new FakeAudio();
        ports.push(a);
        return a;
      },
    );
    const playing = d.playCue('hello');
    expect(ports[0]?.src).toBe('https://assets.test/uz.mp3');
    ports[0]!.dispatchEvent(new Event('ended'));
    await Promise.resolve();
    expect(ports[1]?.src).toBe('https://assets.test/en.mp3');
    ports[1]!.dispatchEvent(new Event('ended'));
    await playing;
    expect(events.filter((e) => e.kind === 'subtitle')).toHaveLength(2);
    expect(ports[0]!.removeAttribute).toHaveBeenCalledWith('src');
  });
  it('stop settles the pending cue without playing the second language', async () => {
    const ports: FakeAudio[] = [];
    const d = new AudioDirector(
      catalog,
      assets,
      'https://a.test/',
      () => {},
      () => {
        const a = new FakeAudio();
        ports.push(a);
        return a;
      },
    );
    const playing = d.playCue('hello');
    d.stop();
    await playing;
    expect(ports).toHaveLength(1);
    expect(ports[0]!.pause).toHaveBeenCalled();
  });
  it('reports missing recordings without synthesizing audio', async () => {
    const factory = vi.fn(() => new FakeAudio()),
      emit = vi.fn();
    const d = new AudioDirector(
      catalog,
      { ...assets, assets: [] },
      'https://a.test/',
      emit,
      factory,
    );
    await d.playCue('hello');
    expect(factory).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ kind: 'missing' }));
  });
  it('surfaces autoplay rejection and allows a later retry', async () => {
    const emit = vi.fn();
    const d = new AudioDirector(catalog, assets, 'https://a.test/', emit, () => {
      const a = new FakeAudio();
      a.play = vi.fn(async () => {
        throw new Error('NotAllowedError');
      });
      return a;
    });
    await d.playCue('hello');
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ kind: 'blocked' }));
  });
});
