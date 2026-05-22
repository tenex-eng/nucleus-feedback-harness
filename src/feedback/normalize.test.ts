import { describe, expect, it } from 'vitest';
import { normalizeCaseClosureRow, normalizeUniversalRow } from './normalize.js';

describe('normalizeCaseClosureRow', () => {
  it('maps case closure feedback', () => {
    expect(normalizeCaseClosureRow({
      feedback_id: 'f1', user_id: 'u1', case_id: 'c1', rating: 2, explanation: 'bad close', created_at: new Date('2026-01-01T00:00:00Z'), suggested_output: { x: 1 },
    })).toMatchObject({ id: 'f1', source: 'case_closure', userId: 'u1', caseId: 'c1', rating: 2, text: 'bad close' });
  });
});

describe('normalizeUniversalRow', () => {
  it('maps null element context to general', () => {
    expect(normalizeUniversalRow({ feedback_id: 'f2', feedback_text: 'hello', feedback_type: 'product', element_context: null, created_at: '2026-01-01' })).toMatchObject({ id: 'f2', source: 'general', feedbackType: 'product', text: 'hello' });
  });

  it('preserves screenshot metadata', () => {
    expect(normalizeUniversalRow({ feedback_id: 'f4', feedback_text: 'hello', screenshot_storage_path: 'universal-feedback/t/f4/screenshot.jpg', created_at: '2026-01-01' })).toMatchObject({
      id: 'f4',
      screenshot: { storagePath: 'universal-feedback/t/f4/screenshot.jpg' },
    });
  });

  it('maps present element context to targeted', () => {
    expect(normalizeUniversalRow({ feedback_id: 'f3', feedback_text: 'wrong', feedback_type: 'ai', element_context: { node: 'button' }, created_at: '2026-01-01' })).toMatchObject({ id: 'f3', source: 'targeted', feedbackType: 'ai', text: 'wrong' });
  });
});
