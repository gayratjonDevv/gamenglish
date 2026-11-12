# GamEnglish contributor rules

- Keep all visible world objects sourced from approved licensed GLB assets. Never substitute primitive meshes, generated characters, emoji characters or invented placeholder art for missing assets.
- React owns menus/HUD; Three.js owns scene lifecycle. Domain learning code imports no renderer, DOM or React.
- Keep exact dependency versions and package-lock.json. Change Three and its types together; validate before upgrading.
- No multi-GB asset binaries in Git. Use versioned manifests and immutable CDN/object-storage paths.
- Levels are data, not one TSX component/file per level. Load bounded packs, not the entire level corpus.
- Recorded uz/en audio only. Do not silently replace missing recordings with browser TTS.
- Do not invent authored lessons, validated learning efficacy, or production-ready assets. Missing content must be visible and block relevant gameplay safely.
- Preserve resource ownership: scene instances release handles; asset cache disposes shared geometry/materials/textures once.
- Run npm run check. Keep behavior tests for resource lifecycle, gates, persistence, audio cancellation and content addressing.
- Never claim a synthetic scalability test is a 10,000-level game or a real-device performance result.

## Mandatory frontend and design policy

- Read docs/CLEAN_CODE.md and docs/DESIGN_SYSTEM.md before frontend changes.
- Limits: TSX/hooks 180 lines, other TypeScript 350, functions 120, CSS 250. Count formatted physical lines. Never minify or split arbitrarily to evade limits. JSON course data/lockfiles/docs are not executable components.
- One exported UI component per TSX file. app composes features through public index files; features do not import one another. shared must not depend on app/features/game infrastructure.
- Reuse shared/ui controls and existing feature blocks. Raw button/select outside their shared primitives and inline style are prohibited. Do not make Button2/CustomCard copies.
- Feature/component styles use CSS Modules. Design values belong to shared/styles/tokens.css. No literal colors/px, !important, per-feature token definitions or external style/font imports. Documented media query breakpoints are the exception.
- Use npm run feature:create -- --name kebab-case for the approved feature skeleton. Do not overwrite an existing feature.
- Run npm run format and npm run check. CI enforces format, architecture/design policies, domain tests and content checks. Semantic reuse, visual quality, accessibility and behavior still need review.
