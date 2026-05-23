import { mergeResearchFindings } from './research-findings.js';
import type { Digest } from './schema.js';

const DEFAULT_MAX_FINDINGS = 7;

export function mergeChunkDigests(input: { start: Date; end: Date; digests: Digest[]; allChunksFailed?: boolean; maxFindings?: number }): Digest {
  const researchFindings = mergeResearchFindings(input.digests.flatMap((digest) => digest.researchFindings), { maxFindings: input.maxFindings ?? DEFAULT_MAX_FINDINGS });
  return {
    period: { start: input.start.toISOString(), end: input.end.toISOString() },
    totals: sumTotals(input.digests),
    executiveSummary: buildActionExecutiveSummary(researchFindings, input.allChunksFailed ?? false),
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

export function buildActionExecutiveSummary(findings: Digest['researchFindings'], allChunksFailed = false): string {
  if (allChunksFailed) return 'No Research Findings were produced because synthesis failed for every non-empty Feedback Signal.';
  if (findings.length === 0) return 'No Research Findings were produced from the synthesized Feedback Signals.';

  const actions = findings.slice(0, 3).map((finding, index) => `${index + 1}. **${finding.title}.** ${finding.recommendedNextStep} _Why now:_ ${finding.evidenceIds.length} supporting Feedback Signal${finding.evidenceIds.length === 1 ? '' : 's'} (${formatSourceDiversity(finding.sourceDiversity)}), ${finding.severity} severity.`);
  return `${actions.join('\n\n')}\n\n**Caveats**\n\n- Screenshots/images are not synthesized yet; image-only context may be missing because screenshot handling needs a safer path for customer-identifying or sensitive information.\n- Positive signals still use the Research Finding schema, so severity can overstate “what’s working” until we add a separate section.`;
}

function formatSourceDiversity(sourceDiversity: Digest['researchFindings'][number]['sourceDiversity']): string {
  const parts = [];
  if (sourceDiversity.caseClosure > 0) parts.push(`${sourceDiversity.caseClosure} case closure`);
  if (sourceDiversity.general > 0) parts.push(`${sourceDiversity.general} general`);
  if (sourceDiversity.targeted > 0) parts.push(`${sourceDiversity.targeted} targeted`);
  return parts.join(', ') || 'no source-matched evidence';
}
