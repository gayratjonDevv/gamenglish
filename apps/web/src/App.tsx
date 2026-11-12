import { useEffect, useRef, useState } from 'react';
import {
  assetCatalogSchema,
  audioCatalogSchema,
  curriculumSchema,
  sceneSchema,
  type AssetCatalog,
  type AudioCatalog,
  type Curriculum,
  type SceneDefinition,
} from '@gamenglish/contracts';
import {
  AudioDirector,
  ContentRepository,
  fetchJson,
  resolvePath,
  missingSceneAssets,
  type VoiceMode,
} from '@gamenglish/engine';
import type { GameEngine } from '@gamenglish/engine/runtime';
import { ProgressRepository } from '@gamenglish/learning';

type Loaded = {
  repository: ContentRepository;
  assets: AssetCatalog;
  audio: AudioCatalog;
  curriculum: Curriculum;
  scene: SceneDefinition;
};
const contentBase = import.meta.env.VITE_CONTENT_BASE_URL ?? '/content/v1/';
const assetBase = import.meta.env.VITE_ASSET_BASE_URL ?? '/assets/';
const stages = [
  { id: 'zero', label: 'Zero', caption: 'Ilk so‘zlardan boshlaymiz', range: '0 → Pre-A1' },
  {
    id: 'beginner',
    label: 'Beginner',
    caption: 'Kundalik hayotga bir qadam',
    range: 'A1 yo‘nalishi',
  },
  {
    id: 'elementary',
    label: 'Elementary',
    caption: 'Kengroq dunyoga yo‘l',
    range: 'A2 yo‘nalishi',
  },
] as const;
export function App() {
  const [data, setData] = useState<Loaded>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [stage, setStage] = useState<string>('zero');
  const [mode, setMode] = useState<VoiceMode>('uz-en');
  const [subtitle, setSubtitle] = useState('Yozib tayyorlangan ovozlar shu yerda eshitiladi.');
  const [audioNotice, setAudioNotice] = useState('');
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [storage, setStorage] = useState('Tekshirilmoqda');
  const canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<GameEngine | undefined>(undefined),
    voice = useRef<AudioDirector | undefined>(undefined);
  useEffect(() => {
    const abort = new AbortController();
    let disposed = false;
    let progress: ProgressRepository | undefined;
    setLoading(true);
    setError('');
    const boot = async () => {
      try {
        const repository = await ContentRepository.open(contentBase, abort.signal);
        const [assets, audio, curriculum, scene] = await Promise.all([
          fetchJson(
            resolvePath(contentBase, repository.index.assetsPath),
            assetCatalogSchema,
            abort.signal,
          ),
          fetchJson(
            resolvePath(contentBase, repository.index.audioPath),
            audioCatalogSchema,
            abort.signal,
          ),
          fetchJson(resolvePath(contentBase, 'curriculum.json'), curriculumSchema, abort.signal),
          fetchJson(
            resolvePath(contentBase, repository.index.scenes[0]!.path),
            sceneSchema,
            abort.signal,
          ),
        ]);
        if (disposed) return;
        voice.current = new AudioDirector(audio, assets, assetBase, (event) => {
          if (event.kind === 'subtitle') setSubtitle(event.line.text);
          else if (event.kind !== 'idle') setAudioNotice(event.message);
        });
        setData({ repository, assets, audio, curriculum, scene });
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : 'Yuklanmadi');
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    void boot();
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
      voice.current?.dispose();
      voice.current = undefined;
      engine.current?.dispose();
      engine.current = undefined;
    };
  }, [retry]);
  useEffect(() => {
    voice.current?.setMode(mode);
  }, [mode, data]);
  useEffect(() => {
    const stop = () => {
      if (document.hidden) voice.current?.stop();
    };
    document.addEventListener('visibilitychange', stop);
    return () => document.removeEventListener('visibilitychange', stop);
  }, []);
  const modules = data?.curriculum.modules.filter((m) => m.stage === stage) ?? [];
  const missing = data ? missingSceneAssets(data.scene, data.assets) : [];
  const readyModels =
    data?.assets.assets.filter((a) => a.kind === 'model' && a.status === 'ready').length ?? 0;
  const readyAudio =
    data?.assets.assets.filter((a) => a.kind === 'audio' && a.status === 'ready').length ?? 0;
  async function start() {
    if (!data || !canvas.current || busy || missing.length) return;
    setBusy(true);
    setError('');
    try {
      engine.current?.dispose();
      const { GameEngine } = await import('@gamenglish/engine/runtime');
      const runtime = new GameEngine(
        canvas.current,
        data.assets,
        assetBase,
        (event) => {
          if (event.type === 'error') {
            setError(event.message);
            setStarted(false);
          } else setSubtitle(`Tanlangan obyekt: ${event.nodeId}`);
        },
        import.meta.env.VITE_DECODER_BASE_URL || undefined,
      );
      engine.current = runtime;
      await runtime.enter(data.scene);
      setStarted(true);
    } catch (e) {
      engine.current?.dispose();
      engine.current = undefined;
      setError(e instanceof Error ? e.message : 'Sahna ochilmadi');
    } finally {
      setBusy(false);
    }
  }
  const stop = () => {
    voice.current?.stop();
    engine.current?.dispose();
    engine.current = undefined;
    setStarted(false);
  };
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#">
          gam<span>english</span>
          <span className="brand-dot" />
        </a>
        <span className="edition">O‘YIN ASOSI · 0.1</span>
        <span className="storage">{storage}</span>
      </header>
      <main>
        <section className="intro">
          <div className="eyebrow">BIR DO‘ST. BIR DUNYO. YANGI TIL.</div>
          <h1>
            Birga ulg‘ayamiz.
            <br />
            <span>Inglizcha gaplashamiz.</span>
          </h1>
          <p>
            O‘z do‘sting bilan tanishishdan katta sarguzashtlargacha.
            <br />
            Har bir yangi so‘z keyingi qadamga yo‘l ochadi.
          </p>
        </section>
        {loading ? (
          <div className="notice" role="status">
            O‘quv xaritasi yuklanmoqda…
          </div>
        ) : null}
        {error ? (
          <div className="notice error" role="alert">
            {error}{' '}
            <button
              onClick={() => {
                stop();
                setRetry((n) => n + 1);
              }}
            >
              Qayta yuklash
            </button>
          </div>
        ) : null}
        <div className="workspace">
          <section className="curriculum">
            <div className="section-label">
              <h2>O‘rganish yo‘li</h2>
              <span>34 modul · 204 mavzu</span>
            </div>
            <div className="stage-tabs" role="tablist" aria-label="Bosqichlar">
              {stages.map((s, i) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={stage === s.id}
                  className={stage === s.id ? 'selected' : ''}
                  onClick={() => setStage(s.id)}
                >
                  <span className="stage-number">0{i + 1}</span>
                  <strong>{s.label}</strong>
                  <small>{s.range}</small>
                </button>
              ))}
            </div>
            <div className="path-caption">
              {stages.find((s) => s.id === stage)?.caption}
              <span>{modules.length} modul</span>
            </div>
            <div className="modules">
              {modules.map((m, i) => (
                <details key={m.id}>
                  <summary>
                    <span className="module-index">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <strong>{m.title}</strong>
                      <small>
                        {m.id} · {m.topics.length} mavzu
                      </small>
                    </span>
                    <span className="expand">+</span>
                  </summary>
                  <div className="module-body">
                    <p>{m.objective}</p>
                    <p className="prerequisite">
                      <b>Old shart:</b> {m.prerequisites}
                    </p>
                    <ol>
                      {m.topics.map((t) => (
                        <li key={t.id}>
                          <span>{t.id}</span>
                          <div>
                            <strong>{t.title}</strong>
                            <small>{t.example}</small>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <p className="outline-note">
                      Mavzular xaritasi. Lug‘at banki, ovoz va o‘yin vazifalari hali yozilmoqda.
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
          <aside>
            <section className="world-card">
              <div className="section-label">
                <span className="eyebrow">BIRINCHI MANZIL</span>
                <span className="badge">ASSET KUTILMOQDA</span>
              </div>
              <h2>Uy va yangi do‘st</h2>
              <p>Bola avatari, mushukcha va haqiqiy 3D buyumlar uchun tayyor sahna tuzilmasi.</p>
              <div className="world-availability">
                <strong>{readyModels} / 5</strong>
                <span>tasdiqlangan 3D model</span>
              </div>
              <ul className="asset-list">
                {data?.assets.assets
                  .filter((a) => a.kind === 'model')
                  .map((a) => (
                    <li key={a.id}>
                      <span>{a.label}</span>
                      <small>{a.status === 'ready' ? 'Tayyor' : 'GLB kerak'}</small>
                    </li>
                  ))}
              </ul>
              <button
                className="primary"
                disabled={!data || missing.length > 0 || busy}
                onClick={() => void start()}
              >
                {busy ? 'Sahna yuklanmoqda…' : 'Sahnani ochish'}
              </button>
              <p className="fineprint">
                Tayyor GLB modellari qo‘shilgach ochiladi. Ularning o‘rniga yasama modellar
                qo‘yilmagan.
              </p>
            </section>
            <section className="voice-card">
              <div className="section-label">
                <h2>Ikki tilda ovoz</h2>
                <span>{readyAudio} yozuv</span>
              </div>
              <label htmlFor="voice-mode">Tinglash tartibi</label>
              <select
                id="voice-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as VoiceMode)}
              >
                <option value="uz-en">O‘zbekcha → English</option>
                <option value="en">English</option>
                <option value="uz">O‘zbekcha</option>
              </select>
              <blockquote aria-live="polite">{subtitle}</blockquote>
              <div className="voice-actions">
                <button
                  onClick={() => {
                    setAudioNotice('');
                    void voice.current?.playCue('cue.welcome');
                  }}
                  disabled={!data}
                >
                  Namunani tinglash
                </button>
                <button onClick={() => voice.current?.stop()}>To‘xtatish</button>
              </div>
              {audioNotice ? (
                <p role="status" className="fineprint">
                  {audioNotice}
                </p>
              ) : null}
              <p className="fineprint">Siz tayyorlagan ovoz yozuvlari ishlatiladi.</p>
            </section>
            <details className="delivery">
              <summary>Ishlab chiqish holati</summary>
              <p>
                204 mavzu rejasi, 2 draft level shabloni. Nashr qilingan o‘ynaladigan level hozircha
                yo‘q. 10 001 yozuvli tekshiruv infratuzilma sinovidir.
              </p>
            </details>
          </aside>
        </div>
        <section
          className={`game-view ${started ? 'active' : ''}`}
          aria-label="Three.js o‘yin sahnasi"
        >
          <canvas ref={canvas} />
          {started ? (
            <>
              <button className="close-scene" onClick={stop}>
                Sahnadan chiqish
              </button>
              <p className="game-help">
                WASD / strelkalar — yurish · Shift — yugurish · buyum ustiga bosish
              </p>
              <div className="touch-pad" aria-label="Harakat boshqaruvi">
                {[
                  ['↑', 0, -1],
                  ['←', -1, 0],
                  ['↓', 0, 1],
                  ['→', 1, 0],
                ].map(([label, x, z]) => (
                  <button
                    key={label}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      engine.current?.setTouch(Number(x), Number(z));
                    }}
                    onPointerUp={() => engine.current?.setTouch(0, 0)}
                    onPointerCancel={() => engine.current?.setTouch(0, 0)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      </main>
      <footer>
        <span>GamEnglish</span>
        <span>O‘rganish — dunyongning bir qismi.</span>
      </footer>
    </div>
  );
}
