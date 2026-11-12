import { z } from 'zod';

export const idSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/);
export const pathSchema = z
  .string()
  .min(1)
  .max(300)
  .refine(
    (value) =>
      !value.startsWith('/') &&
      !value.includes('..') &&
      !/[?#\\]/.test(value) &&
      /^[a-zA-Z0-9_./-]+$/.test(value),
    'Use a relative immutable path without traversal, query or fragment',
  );
export const localeSchema = z.enum(['uz', 'en']);
export type Locale = z.infer<typeof localeSchema>;
const vectorSchema = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
const assetCommon = {
  id: idSchema,
  kind: z.enum(['model', 'audio', 'texture', 'environment']),
  label: z.string(),
  license: z.string().min(1),
  source: z.string().min(1),
};
export const assetSchema = z.discriminatedUnion('status', [
  z.object({ ...assetCommon, status: z.literal('missing'), reason: z.string().min(1) }),
  z.object({
    ...assetCommon,
    status: z.literal('ready'),
    path: pathSchema,
    bytes: z.number().int().positive(),
    residentBytes: z.number().int().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    animationMap: z.record(z.string(), z.string()).default({}),
  }),
]);
export type Asset = z.infer<typeof assetSchema>;
export type ReadyAsset = Extract<Asset, { status: 'ready' }>;
export const assetCatalogSchema = z
  .object({ schemaVersion: z.literal(1), revision: idSchema, assets: z.array(assetSchema) })
  .superRefine((v, c) => {
    const ids = new Set<string>();
    for (const a of v.assets) {
      if (ids.has(a.id)) c.addIssue({ code: 'custom', message: `Duplicate asset ${a.id}` });
      ids.add(a.id);
    }
  });
export type AssetCatalog = z.infer<typeof assetCatalogSchema>;
export const voiceLineSchema = z.object({
  locale: localeSchema,
  text: z.string().min(1),
  assetId: idSchema.nullable(),
});
export type VoiceLine = z.infer<typeof voiceLineSchema>;
export const audioCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  revision: idSchema,
  cues: z.array(z.object({ id: idSchema, lines: z.array(voiceLineSchema).min(1) })),
});
export type AudioCatalog = z.infer<typeof audioCatalogSchema>;
export const colliderSchema = z
  .object({ min: vectorSchema, max: vectorSchema })
  .refine((b) => b.min.every((v, i) => v < b.max[i]!), 'Collider min must be below max');
export const sceneSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: idSchema,
    label: z.string(),
    camera: z.object({ position: vectorSchema, target: vectorSchema }),
    bounds: z
      .object({
        min: z.tuple([z.number(), z.number()]),
        max: z.tuple([z.number(), z.number()]),
        groundY: z.number(),
      })
      .refine((b) => b.min.every((v, i) => v < b.max[i]!)),
    colliders: z.array(colliderSchema),
    nodes: z.array(
      z.object({
        id: idSchema,
        assetId: idSchema,
        role: z.enum(['static', 'player', 'pet']),
        position: vectorSchema,
        rotation: vectorSchema,
        scale: z.number().positive().max(1000),
        interactive: z.boolean().default(false),
      }),
    ),
  })
  .superRefine((s, c) => {
    if (s.nodes.filter((n) => n.role === 'player').length > 1)
      c.addIssue({ code: 'custom', message: 'At most one player' });
    if (new Set(s.nodes.map((n) => n.id)).size !== s.nodes.length)
      c.addIssue({ code: 'custom', message: 'Duplicate scene node IDs' });
  });
export type SceneDefinition = z.infer<typeof sceneSchema>;
export const wordSchema = z.object({
  id: idSchema,
  en: z.string().min(1),
  uz: z.string().min(1),
  cueId: idSchema,
  topicId: idSchema,
});
export const vocabularySchema = z.object({
  schemaVersion: z.literal(1),
  words: z.array(wordSchema),
});
export const requirementSchema = z.object({
  wordId: idSchema,
  receptive: z.boolean(),
  productive: z.boolean(),
});
export type WordRequirement = z.infer<typeof requirementSchema>;
export const levelSchema = z.object({
  schemaVersion: z.literal(1),
  id: idSchema,
  ordinal: z.number().int().positive(),
  topicId: idSchema,
  sceneId: idSchema,
  title: z.string().min(1),
  status: z.enum(['draft', 'published']),
  prerequisites: z.array(idSchema),
  requiredWords: z.array(requirementSchema),
  taughtWords: z.array(idSchema),
  cueIds: z.array(idSchema),
  tasks: z
    .array(
      z.discriminatedUnion('kind', [
        z.object({ id: idSchema, kind: z.literal('instruction'), cueId: idSchema }),
        z.object({
          id: idSchema,
          kind: z.literal('interact'),
          targetNodeId: idSchema,
          wordId: idSchema,
          cueId: idSchema,
        }),
      ]),
    )
    .min(1),
});
export type Level = z.infer<typeof levelSchema>;
export const packSchema = z.object({
  schemaVersion: z.literal(1),
  id: idSchema,
  levels: z.array(levelSchema).min(1).max(100),
});
export type LevelPack = z.infer<typeof packSchema>;
export const contentIndexSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: idSchema,
    totalLevels: z.number().int().nonnegative(),
    assetsPath: pathSchema,
    audioPath: pathSchema,
    vocabularyPath: pathSchema,
    scenes: z.array(z.object({ id: idSchema, path: pathSchema })),
    packs: z.array(
      z.object({
        id: idSchema,
        path: pathSchema,
        first: z.number().int().positive(),
        last: z.number().int().positive(),
      }),
    ),
  })
  .superRefine((index, c) => {
    let previous = 0,
      total = 0;
    const ids = new Set<string>();
    for (const p of index.packs) {
      if (p.first > p.last || p.first <= previous || p.last - p.first + 1 > 100)
        c.addIssue({
          code: 'custom',
          message: 'Pack ranges must be ordered, disjoint, and at most 100 levels',
        });
      if (ids.has(p.id)) c.addIssue({ code: 'custom', message: 'Duplicate pack ID' });
      ids.add(p.id);
      previous = p.last;
      total += p.last - p.first + 1;
    }
    if (total !== index.totalLevels)
      c.addIssue({ code: 'custom', message: 'totalLevels must equal declared pack ranges' });
    if (new Set(index.scenes.map((s) => s.id)).size !== index.scenes.length)
      c.addIssue({ code: 'custom', message: 'Duplicate scene IDs' });
  });
export type ContentIndex = z.infer<typeof contentIndexSchema>;
export const evidenceSchema = z.object({
  id: idSchema,
  wordId: idSchema,
  sessionId: idSchema,
  at: z.number().int().nonnegative(),
  skill: z.enum(['listening', 'recall', 'speaking', 'writing']),
  correct: z.boolean(),
  assisted: z.boolean(),
  technicalFailure: z.boolean(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const curriculumSchema = z.object({
  schemaVersion: z.literal(1),
  status: z.literal('planning-outline'),
  note: z.string(),
  modules: z.array(
    z.object({
      id: idSchema,
      stage: z.enum(['zero', 'beginner', 'elementary']),
      title: z.string(),
      prerequisites: z.string(),
      objective: z.string(),
      topics: z.array(
        z.object({
          id: idSchema,
          title: z.string(),
          example: z.string(),
          status: z.literal('outline'),
          vocabularyBankStatus: z.literal('pending'),
          gameplayStatus: z.literal('pending'),
        }),
      ),
    }),
  ),
});
export type Curriculum = z.infer<typeof curriculumSchema>;
