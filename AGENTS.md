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
