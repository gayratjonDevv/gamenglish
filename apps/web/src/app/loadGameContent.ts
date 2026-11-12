import {
  assetCatalogSchema,
  audioCatalogSchema,
  curriculumSchema,
  sceneSchema,
  type GameContent,
} from '@gamenglish/contracts';
import { ContentRepository, fetchJson, resolvePath } from '@gamenglish/engine';
export async function loadGameContent(base: string, signal: AbortSignal): Promise<GameContent> {
  const repository = await ContentRepository.open(base, signal);
  const sceneRef = repository.index.scenes[0];
  if (!sceneRef) throw new Error('Content release has no starting scene');
  const [assets, audio, curriculum, scene] = await Promise.all([
    fetchJson(resolvePath(base, repository.index.assetsPath), assetCatalogSchema, signal),
    fetchJson(resolvePath(base, repository.index.audioPath), audioCatalogSchema, signal),
    fetchJson(resolvePath(base, 'curriculum.json'), curriculumSchema, signal),
    fetchJson(resolvePath(base, sceneRef.path), sceneSchema, signal),
  ]);
  return { assets, audio, curriculum, scene };
}
