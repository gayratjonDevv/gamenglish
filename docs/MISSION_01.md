# Z001 — Birinchi salom

Playthrough: `npm run dev`. This branch opens the first mission rather than the earlier curriculum planning dashboard. The existing curriculum/voice/world modules and 204-topic outlines remain in source.

## Models and local preparation

Originals stay outside Git. User supplied:

- `cartoon_Young_Boy_Glb.zip`: TurboSquid 2429764, Giyasudeen. Standard License listing; retain your original download/license record. The same character is intentionally used for child, mother and neighbor at the user's request. The actual mother GLB is kept unused until character selection is finalized.
- `lowpoly_city.glb`: user supplied. Original creator/license not established from the filename; preserve its source license before any public release. Preview is private.

Install Python Pillow if unavailable. Put the original ZIP and city file in a local uploads directory, then:

```bash
npm ci
npm run assets:prepare -- /absolute/path/to/uploads asset-source/m01
npm run dev
```

The processor preserves the supplied mesh, skin and selected facial controls; downsizes images, removes facial test clips and unused/redundant morphs, repacks referenced dense AND sparse accessors, and converts the city's legacy specular/glossiness materials. Immutable asset names include a SHA-256 prefix. Full checksums are verified at load/staging. City meshes are batched by original material at runtime.

No visible primitive/generated substitute world objects are used. Runtime skeletal poses provide basic idle/walk/wave motion; these are not mocap or complete authored clips. The avatar has an expression approximation during recorded audio, not phoneme-aligned lip sync. Real-device animation/art review is still needed.

## Lesson and progression

Authored data: `apps/web/src/features/mission/data/first-hello.json`. One scene renderer and one reusable task UI, not one component per beat. The mission has six chapters, two travel tasks, eight phrases, modeling, guided practice, independent choices, hints, delayed review, a word journal and local progress.

A wrong answer or requested hint marks the attempt assisted. A corrected answer advances the story but does not award independent mastery. The summary requires missing skills to be retried. Both Hello and Hi are valid greeting replies; Goodbye and See you are valid farewell replies. Good evening and Good night are distinguished.

Progress uses `gamenglish:Z001:mission-v1` in localStorage. This is a local prototype, not an authenticated/cross-device grade. Next mission has not been implemented; the summary says so. Time is learner-paced, not a fixed movie timer. Movement is constrained to the mission corridor, ground raycasts and building bounds; it is not a full physics simulation.

## Recorded voices

No voice recordings were supplied. The explicitly labeled subtitle trial is available. Recorded-voice mode is disabled until every speaking beat has its recording. No browser TTS or synthesized voice is substituted.

The full recording inventory is `content/mission-01-recordings.csv`. The title/pause screen accepts multiple MP3/OGG/WAV/M4A/WebM files named exactly by step ID, e.g. `welcome.mp3`, `first-hello.mp3`, `hello-sample.mp3`. Each file contains that beat's entire spoken line, performed by its indicated speaker. Recordings are session-local object URLs, not uploaded or persisted. Playback stops on pause, step transition and unmount. Invalid/missing recordings never count as pronunciation success.

English sample listening and pronunciation are not certified by subtitle completion. Optional microphone self-recording lasts up to eight seconds and stays on the device; there is no ASR/scoring claim. The uploaded recordings should be performed naturally in Uzbek and English by matching mother/child/neighbor voices.

## Build and verification

```bash
npm run check
npm run assets:stage -- --require-assets
```

Build outputs root `dist/` for static hosting. Without local binary staging, a source-only CI build warns that the game models are absent; `--require-assets` must pass for deployment. Binaries are deployed in the private build archive and never committed to Git.

Tests cover mission gates, both valid greeting variants, assisted retries, malformed restoration, source policy, actual model sparse geometry parsing, actor bone movement and both travel goals when the supplied assets are staged. The browser in this workspace reports WebGL disabled; desktop/mobile visual quality and real-device performance remain unverified. No claim of 100% learning efficacy or production readiness is made.
