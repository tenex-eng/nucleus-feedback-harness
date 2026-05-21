import { z } from 'zod';

export const FindingSeveritySchema = z.enum(['low', 'medium', 'high']);
export const FindingConfidenceSchema = z.enum(['low', 'medium', 'high']);

export const ResearchFindingSchema = z.object({
  title: z.string(),
  affectedWorkflow: z.string(),
  painOrNeed: z.string(),
  severity: FindingSeveritySchema,
  confidence: FindingConfidenceSchema,
  sourceDiversity: z.object({
    caseClosure: z.number(),
    general: z.number(),
    targeted: z.number(),
  }),
  evidenceIds: z.array(z.string()),
  representativeQuotes: z.array(z.object({
    id: z.string(),
    quote: z.string().max(280),
  })),
  recommendedNextStep: z.string(),
  openQuestions: z.array(z.string()),
});

export const DigestSchema = z.object({
  period: z.object({ start: z.string(), end: z.string() }),
  totals: z.object({ caseClosure: z.number(), general: z.number(), targeted: z.number() }),
  executiveSummary: z.string(),
  researchFindings: z.array(ResearchFindingSchema),
});

export type ResearchFinding = z.infer<typeof ResearchFindingSchema>;
export type Digest = z.infer<typeof DigestSchema>;
