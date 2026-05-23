import { mergeResearchFindings } from './research-findings.js';
import type { Digest } from './schema.js';

const DEFAULT_MAX_FINDINGS = 7;

export function mergeChunkDigests(input: { start: Date; end: Date; digests: Digest[]; allChunksFailed?: boolean; maxFindings?: number }): Digest {
  const researchFindings = mergeResearchFindings(input.digests.flatMap((digest) => digest.researchFindings), { maxFindings: input.maxFindings ?? DEFAULT_MAX_FINDINGS });
  return {
    period: { start: input.start.toISOString(), end: input.end.toISOString() },
    totals: sumTotals(input.digests),
    executiveSummary: buildExecutiveSummary(researchFindings, input.allChunksFailed ?? false),
    researchFindings,
  };
}

function sumTotals(digests: Digest[]): Digest['totals'] {
  return digests.reduce((totals, digest) => ({
    caseClosure: totals.caseClosure + digest.totals.caseClosure,
    general: totals.general + digest.totals.general,
    targeted: totals.targeted + digest.totals.targeted,
  }), { caseClosure: 0, general: 0, targeted: 0 });
}

function buildExecutiveSummary(findings: Digest['researchFindings'], allChunksFailed: boolean): string {
  if (allChunksFailed) return 'No Research Findings were produced because synthesis failed for every non-empty Feedback Signal.';
  if (findings.length === 0) return 'No Research Findings were produced from the synthesized Feedback Signals.';

  const topFindings = findings.slice(0, 3).map((finding) => `${finding.title} (${finding.affectedWorkflow})`);
  const evidenceCount = new Set(findings.flatMap((finding) => finding.evidenceIds)).size;
  const highSeverityCount = findings.filter((finding) => finding.severity === 'high').length;
  const severityLine = highSeverityCount === 0 ? 'No high-severity Research Findings were identified.' : `${highSeverityCount} high-severity Research Finding${highSeverityCount === 1 ? '' : 's'} need attention.`;
  const patternLabel = topFindings.length === 1 ? 'pattern is' : 'patterns are';
  return `${severityLine} The strongest ${patternLabel} ${formatList(topFindings)}. These findings are backed by ${evidenceCount} Feedback Signal${evidenceCount === 1 ? '' : 's'} and should guide the next product-improvement pass.`;
}

function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
