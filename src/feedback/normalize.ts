import type { FeedbackItem } from './types.js';

export function normalizeCaseClosureRow(row: Record<string, unknown>): FeedbackItem {
  return {
    id: stringValue(row.feedback_id),
    source: 'case_closure',
    createdAt: timestampValue(row.created_at),
    userId: optionalString(row.user_id),
    caseId: optionalString(row.case_id),
    rating: optionalNumber(row.rating),
    text: optionalString(row.explanation) ?? '',
    suggestedOutput: row.suggested_output,
  };
}

export function normalizeUniversalRow(row: Record<string, unknown>): FeedbackItem {
  const elementContext = row.element_context ?? undefined;
  const feedbackType = row.feedback_type === 'product' || row.feedback_type === 'ai' ? row.feedback_type : undefined;
  const screenshotStoragePath = optionalString(row.screenshot_storage_path);
  return {
    id: stringValue(row.feedback_id),
    source: elementContext == null ? 'general' : 'targeted',
    createdAt: timestampValue(row.created_at),
    tenantId: optionalString(row.tenant_id),
    userId: optionalString(row.user_id),
    caseId: optionalString(row.case_id),
    pageUrl: optionalString(row.page_url),
    feedbackType,
    text: optionalString(row.feedback_text) ?? '',
    elementContext,
    screenshot: screenshotStoragePath == null ? undefined : { storagePath: screenshotStoragePath },
  };
}

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

function optionalString(value: unknown): string | undefined {
  const text = stringValue(value).trim();
  return text ? text : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return undefined;
}

function timestampValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value != null && 'value' in value) return stringValue((value as { value: unknown }).value);
  return stringValue(value);
}
