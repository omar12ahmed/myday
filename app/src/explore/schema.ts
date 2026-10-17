import { z } from 'zod';
import { AssetIdSchema } from './assets';

const id = z.string().regex(/^[a-zA-Z0-9_.:-]+$/).max(100);
const text = z.string().trim().min(1).max(1000);
const base = { id, title: text, eyebrow: text, basis: z.enum(['brief', 'assumption', 'example']) };
export const HeroSchema = z.strictObject({ ...base, type: z.literal('hero'), proposition: text, image: z.enum(['market-aerial', 'none']), caption: text });
export const NodeSchema = z.strictObject({ id, label: z.string().min(1).max(45), detail: z.string().max(90), optional: z.boolean().default(false) });
export const ConnectionSchema = z.strictObject({ from: id, to: id, label: z.string().min(1).max(80), kind: z.enum(['order', 'goods', 'payment', 'coordination']) });
export const ArchitectureSchema = z.strictObject({ ...base, type: z.literal('architecture'), description: text, nodes: z.array(NodeSchema).min(2).max(7), connections: z.array(ConnectionSchema).min(1).max(14) });
const item = z.strictObject({ title: z.string().min(1).max(80), body: text });
export const ContextSchema = z.strictObject({ ...base, type: z.literal('context'), location: text, description: text, image: AssetIdSchema.optional(), actors: z.array(NodeSchema).min(2).max(5), caption: text, connections: z.array(ConnectionSchema).max(10).optional() });
export const ProblemSchema = z.strictObject({ ...base, type: z.literal('problem'), description: text, issues: z.array(item.extend({ image: AssetIdSchema.optional() })).min(1).max(4) });
export const FlowSchema = z.strictObject({ ...base, type: z.literal('flow'), description: text, steps: z.array(item.extend({ responsibility: z.enum(['order', 'stock', 'payment', 'fulfilment', 'delivery']).optional() })).min(2).max(5) });
const money = z.number().finite().min(0).max(10000);
export const EconomicsInputsSchema = z.strictObject({ orderValue: money, productCost: money, logistics: money, delivery: money, operating: money, takeRate: z.number().finite().min(0).max(100) });
export const EconomicsSchema = z.strictObject({ ...base, type: z.literal('economics'), description: text, currency: z.literal('USD'), inputs: EconomicsInputsSchema });
export const ActionSchema = z.strictObject({ ...base, type: z.literal('action'), description: text, image: AssetIdSchema.optional(), established: text.optional(), uncertain: text.optional(), task: z.strictObject({ id, title: z.string().min(1).max(120), notes: z.string().min(1).max(1500), minutes: z.number().int().min(5).max(120), assumptionId: id.optional() }) });
export const SceneSchema = z.discriminatedUnion('type', [HeroSchema, ContextSchema, ProblemSchema, FlowSchema, ArchitectureSchema, EconomicsSchema, ActionSchema]);
export const ExploreSchema = z.strictObject({
  schemaVersion: z.literal(1), id, projectId: z.string().min(1).max(160), title: text,
  edition: z.enum(['curated', 'starter']), scenes: z.array(SceneSchema).min(2).max(7),
}).superRefine((doc, ctx) => {
  if (doc.scenes[0].type !== 'hero') ctx.addIssue({ code: 'custom', message: 'The opening scene must be a hero.' });
  if (new Set(doc.scenes.map(s => s.id)).size !== doc.scenes.length) ctx.addIssue({ code: 'custom', message: 'Scene IDs must be unique.' });
  if (new Set(doc.scenes.map(s => s.type)).size !== doc.scenes.length) ctx.addIssue({ code: 'custom', message: 'This edition supports one scene of each type.' });
  for (const scene of doc.scenes) if (scene.type === 'architecture' || scene.type === 'context') {
    const nodes = scene.type === 'architecture' ? scene.nodes : scene.actors;
    const ids = new Set(nodes.map(n => n.id));
    if (ids.size !== nodes.length || (scene.connections ?? []).some(c => !ids.has(c.from) || !ids.has(c.to))) ctx.addIssue({ code: 'custom', message: 'Diagram references must resolve to unique nodes.' });
  }
});

export type ExploreData = z.infer<typeof ExploreSchema>;
export type ExploreScene = ExploreData['scenes'][number];
export type SceneOf<T extends ExploreScene['type']> = Extract<ExploreScene, { type: T }>;

// This boundary is shared by curated content and a future AI adapter. Presentation is never data.
export function validateExplore(input: unknown): ExploreData {
  const serialized = JSON.stringify(input);
  if (!serialized || serialized.length > 64_000) throw new Error('This exploration is missing or too large.');
  return ExploreSchema.parse(input);
}
