import type { Digest, ResearchFinding } from './schema.js';

export function mergeChunkDigests(input: { start: Date; end: Date; digests: Digest[] }): Digest {
  const findingsByKey = new Map<string, ResearchFinding>();

  for (const digest of input.digests) {
    for (const finding of digest.researchFindings) {
      const key = findingKey(finding);
      const existing = findingsByKey.get(key);
      findingsByKey.set(key, existing ? mergeFinding(existing, finding) : cloneFinding(finding));
    }
  }

  return {
    period: { start: input.start.toISOString(), end: input.end.toISOString() },
    totals: sumTotals(input.digests),
    executiveSummary: buildExecutiveSummary(input.digests),
    researchFindings: [...findingsByKey.values()].sort(compareFindings),
  };
}

function mergeFinding(a: ResearchFinding, b: ResearchFinding): ResearchFinding {
  const evidenceIds = unique([...a.evidenceIds, ...b.evidenceIds]);
  return {
    title: a.title,
    affectedWorkflow: a.affectedWorkflow,
    painOrNeed: a.painOrNeed,
    severity: maxRank(a.severity, b.severity),
    confidence: maxRank(a.confidence, b.confidence),
    sourceDiversity: {
      caseClosure: a.sourceDiversity.caseClosure + b.sourceDiversity.caseClosure,
      general: a.sourceDiversity.general + b.sourceDiversity.general,
      targeted: a.sourceDiversity.targeted + b.sourceDiversity.targeted,
    },
    evidenceIds,
    representativeQuotes: uniqueQuotes([...a.representativeQuotes, ...b.representativeQuotes]),
    recommendedNextStep: a.recommendedNextStep,
    openQuestions: unique([...a.openQuestions, ...b.openQuestions]),
  };
}

function cloneFinding(finding: ResearchFinding): ResearchFinding {
  return {
    ...finding,
    sourceDiversity: { ...finding.sourceDiversity },
    evidenceIds: unique(finding.evidenceIds),
    representativeQuotes: uniqueQuotes(finding.representativeQuotes),
    openQuestions: unique(finding.openQuestions),
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

function findingKey(finding: ResearchFinding): string {
  return `${normalize(finding.title)}|${normalize(finding.affectedWorkflow)}|${normalize(finding.painOrNeed)}`;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function uniqueQuotes(quotes: ResearchFinding['representativeQuotes']): ResearchFinding['representativeQuotes'] {
  const seen = new Set<string>();
  const output: ResearchFinding['representativeQuotes'] = [];
  for (const quote of quotes) {
    const key = `${quote.id}|${quote.quote}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ id: quote.id, quote: quote.quote.length <= 280 ? quote.quote : `${quote.quote.slice(0, 279)}…` });
    if (output.length === 3) break;
  }
  return output;
}

const rank = { low: 0, medium: 1, high: 2 } as const;

function maxRank<T extends keyof typeof rank>(a: T, b: T): T {
  return rank[a] >= rank[b] ? a : b;
}

function compareFindings(a: ResearchFinding, b: ResearchFinding): number {
  return rank[b.severity] - rank[a.severity] || rank[b.confidence] - rank[a.confidence] || b.evidenceIds.length - a.evidenceIds.length || a.title.localeCompare(b.title);
}
