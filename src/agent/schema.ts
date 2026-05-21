import { z } from 'zod';

export const DigestSchema = z.object({
  period: z.object({ start: z.string(), end: z.string() }),
  totals: z.object({ caseClosure: z.number(), general: z.number(), targeted: z.number() }),
  executiveSummary: z.string(),
  themes: z.array(z.object({
    title: z.string(),
    category: z.enum(['bug', 'ux', 'ai_quality', 'feature', 'case_quality', 'other']),
    severity: z.enum(['low', 'medium', 'high']),
    count: z.number(),
    evidenceIds: z.array(z.string()),
    summary: z.string(),
    recommendedAction: z.string(),
  })),
  notableFeedback: z.array(z.object({
    id: z.string(),
    source: z.enum(['case_closure', 'general', 'targeted']),
    quote: z.string(),
    whyItMatters: z.string(),
  })),
});

export type Digest = z.infer<typeof DigestSchema>;
