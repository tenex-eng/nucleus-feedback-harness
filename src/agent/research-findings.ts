import type { FeedbackItem } from '../feedback/types.js';
import type { ResearchFinding } from './schema.js';

const rank = { low: 0, medium: 1, high: 2 } as const;

export function mergeResearchFindings(findings: ResearchFinding[], options: { maxFindings?: number } = {}): ResearchFinding[] {
  const merged: ResearchFinding[] = [];
  for (const finding of findings) {
    const relatedIndex = merged.findIndex((candidate) => areRelatedResearchFindings(candidate, finding));
    if (relatedIndex === -1) {
      merged.push(cloneResearchFinding(finding));
      continue;
    }
    merged[relatedIndex] = mergeRelatedResearchFindings(merged[relatedIndex], finding);
  }
  return merged.sort(compareResearchFindings).slice(0, options.maxFindings ?? merged.length);
}

export function researchFindingIdentity(finding: ResearchFinding): string {
  return `${normalize(finding.title)}|${normalize(finding.affectedWorkflow)}|${normalize(finding.painOrNeed)}`;
}

export function repairResearchFindingSourceDiversity(findings: ResearchFinding[], items: FeedbackItem[]): ResearchFinding[] {
  const evidenceItems = new Map(items.map((item) => [item.id, item]));
  return findings.map((finding) => {
    const evidenceIds = unique(finding.evidenceIds.map((evidenceId) => canonicalEvidenceId(evidenceId, items)).filter((id) => evidenceItems.has(id)));
    return {
      ...finding,
      evidenceIds,
      sourceDiversity: evidenceIds.reduce<ResearchFinding['sourceDiversity']>((counts, evidenceId) => {
        const source = evidenceItems.get(evidenceId)?.source;
        if (source === 'case_closure') counts.caseClosure += 1;
        if (source === 'general') counts.general += 1;
        if (source === 'targeted') counts.targeted += 1;
        return counts;
      }, { caseClosure: 0, general: 0, targeted: 0 }),
    };
  });
}

function canonicalEvidenceId(evidenceId: string, items: FeedbackItem[]): string {
  if (items.some((item) => item.id === evidenceId)) return evidenceId;
  const prefixMatches = items.filter((item) => item.id.startsWith(evidenceId));
  return prefixMatches.length === 1 ? prefixMatches[0].id : evidenceId;
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

function areRelatedResearchFindings(a: ResearchFinding, b: ResearchFinding): boolean {
  if (researchFindingIdentity(a) === researchFindingIdentity(b)) return true;
  const aCategory = researchFindingCategory(a);
  if (aCategory != null && aCategory === researchFindingCategory(b)) return true;
  if (overlaps(a.evidenceIds, b.evidenceIds) && tokenSimilarity(findingText(a), findingText(b)) >= 0.25) return true;
  return tokenSimilarity(findingText(a), findingText(b)) >= 0.45 && hasSharedDistinctiveToken(a, b);
}

function researchFindingCategory(finding: ResearchFinding): string | undefined {
  const text = `${findingText(finding)} ${finding.recommendedNextStep}`.toLowerCase();
  if (text.includes('false positive') || (text.includes('tuning') && text.includes('alert'))) return 'false-positive-tuning';
  if (text.includes('misclassification') || text.includes('misclassifies') || (text.includes('benign') && text.includes('malicious'))) return 'ai-disposition-quality';
  if ((text.includes('ai') || text.includes('disposition') || text.includes('summary') || text.includes('classification')) && (text.includes('inaccur') || text.includes('inconsistent') || text.includes('misleading') || text.includes('manual verification') || text.includes('incorrect'))) return 'ai-disposition-quality';
  if (text.includes('intelligence hub') || (text.includes('case') && text.includes('correlation') && text.includes('history'))) return 'intelligence-hub-context';
  if (text.includes('investigate tab') && (text.includes('query') || text.includes('rate limit') || text.includes('too many requests'))) return 'investigate-query-limits';
}

function hasSharedDistinctiveToken(a: ResearchFinding, b: ResearchFinding): boolean {
  const bTokens = tokens(`${b.title} ${b.affectedWorkflow}`);
  return [...tokens(`${a.title} ${a.affectedWorkflow}`)].some((token) => bTokens.has(token));
}

function findingText(finding: ResearchFinding): string {
  return `${finding.title} ${finding.affectedWorkflow} ${finding.painOrNeed}`;
}

function tokenSimilarity(a: string, b: string): number {
  const aTokens = tokens(a);
  const bTokens = tokens(b);
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return intersection / union;
}

function tokens(value: string): Set<string> {
  return new Set(normalize(value).split(' ').filter((token) => token.length > 2 && !stopwords.has(token)));
}

function overlaps(a: string[], b: string[]): boolean {
  const bSet = new Set(b);
  return a.some((value) => bSet.has(value));
}

const stopwords = new Set(['and', 'are', 'but', 'for', 'from', 'into', 'need', 'needs', 'not', 'the', 'this', 'that', 'their', 'users', 'with', 'workflow', 'finding', 'requires', 'specific', 'remediation']);

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
