import type { ResearchFinding } from './schema.js';

const rank = { low: 0, medium: 1, high: 2 } as const;

export function mergeResearchFindings(findings: ResearchFinding[]): ResearchFinding[] {
  const findingsByIdentity = new Map<string, ResearchFinding>();
  for (const finding of findings) {
    const identity = researchFindingIdentity(finding);
    const existing = findingsByIdentity.get(identity);
    findingsByIdentity.set(identity, existing ? mergeRelatedResearchFindings(existing, finding) : cloneResearchFinding(finding));
  }
  return [...findingsByIdentity.values()].sort(compareResearchFindings);
}

export function researchFindingIdentity(finding: ResearchFinding): string {
  return `${normalize(finding.title)}|${normalize(finding.affectedWorkflow)}|${normalize(finding.painOrNeed)}`;
}

function mergeRelatedResearchFindings(a: ResearchFinding, b: ResearchFinding): ResearchFinding {
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
    evidenceIds: unique([...a.evidenceIds, ...b.evidenceIds]),
    representativeQuotes: uniqueQuotes([...a.representativeQuotes, ...b.representativeQuotes]),
    recommendedNextStep: a.recommendedNextStep,
    openQuestions: unique([...a.openQuestions, ...b.openQuestions]),
  };
}

function cloneResearchFinding(finding: ResearchFinding): ResearchFinding {
  return {
    ...finding,
    sourceDiversity: { ...finding.sourceDiversity },
    evidenceIds: unique(finding.evidenceIds),
    representativeQuotes: uniqueQuotes(finding.representativeQuotes),
    openQuestions: unique(finding.openQuestions),
  };
}

function compareResearchFindings(a: ResearchFinding, b: ResearchFinding): number {
  return rank[b.severity] - rank[a.severity] || rank[b.confidence] - rank[a.confidence] || b.evidenceIds.length - a.evidenceIds.length || a.title.localeCompare(b.title);
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

function maxRank<T extends keyof typeof rank>(a: T, b: T): T {
  return rank[a] >= rank[b] ? a : b;
}
