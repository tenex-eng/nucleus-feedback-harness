import { mergeResearchFindings } from './research-findings.js';
import type { Digest } from './schema.js';

export function mergeChunkDigests(input: { start: Date; end: Date; digests: Digest[] }): Digest {
  return {
    period: { start: input.start.toISOString(), end: input.end.toISOString() },
    totals: sumTotals(input.digests),
    executiveSummary: buildExecutiveSummary(input.digests),
    researchFindings: mergeResearchFindings(input.digests.flatMap((digest) => digest.researchFindings)),
  };
}

function sumTotals(digests: Digest[]): Digest['totals'] {
  return digests.reduce((totals, digest) => ({
    caseClosure: totals.caseClosure + digest.totals.caseClosure,
    general: totals.general + digest.totals.general,
    targeted: totals.targeted + digest.totals.targeted,
  }), { caseClosure: 0, general: 0, targeted: 0 });
}

function buildExecutiveSummary(digests: Digest[]): string {
  const summaries = digests.map((digest) => digest.executiveSummary.trim()).filter(Boolean);
  if (summaries.length === 0) return 'No feedback findings were produced.';
  return summaries.join('\n\n');
}
