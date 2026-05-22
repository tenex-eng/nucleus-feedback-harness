import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { createFileArtifactStore, resolveArtifactPaths } from './store.js';
import type { DigestArtifact } from './artifact.js';

let tempDir: string | undefined;

const artifact = (incomplete = false): DigestArtifact => ({
  period: { start: '2026-05-14T00:00:00.000Z', end: '2026-05-21T00:00:00.000Z' },
  generatedAt: '2026-05-21T00:00:00.000Z',
  provider: 'openai',
  model: 'gpt-4.1-mini',
  promptVersion: 'test',
  schemaVersion: 'test',
  coverageStats: {
    total: 0,
    nonEmpty: 0,
    empty: 0,
    sourceCounts: { caseClosure: 0, general: 0, targeted: 0 },
    screenshotCoverage: {
      withScreenshot: { caseClosure: 0, general: 0, targeted: 0 },
      withoutScreenshot: { caseClosure: 0, general: 0, targeted: 0 },
    },
  },
  screenshotReferences: [],
  completion: incomplete ? { status: 'incomplete', unsynthesizedSignalCount: 1, failedChunks: [{ index: 0, itemCount: 1, itemIds: ['x'], error: 'boom' }] } : { status: 'complete' },
  digest: {
    period: { start: '2026-05-14T00:00:00.000Z', end: '2026-05-21T00:00:00.000Z' },
    totals: { caseClosure: 0, general: 0, targeted: 0 },
    executiveSummary: 'summary',
    researchFindings: [],
  },
});

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe('resolveArtifactPaths', () => {
  it('defaults Markdown and JSON to dated complete paths', () => {
    expect(resolveArtifactPaths({ outputDir: './digests', end: new Date('2026-05-21T12:00:00.000Z'), incomplete: false })).toEqual({
      markdownPath: 'digests/2026-05-21-feedback-digest.md',
      jsonPath: 'digests/2026-05-21-feedback-digest.json',
    });
  });

  it('marks incomplete default paths', () => {
    expect(resolveArtifactPaths({ outputDir: './digests', end: new Date('2026-05-21T12:00:00.000Z'), incomplete: true })).toEqual({
      markdownPath: 'digests/2026-05-21-feedback-digest.incomplete.md',
      jsonPath: 'digests/2026-05-21-feedback-digest.incomplete.json',
    });
  });

  it('honors explicit output overrides', () => {
    expect(resolveArtifactPaths({
      outputDir: './digests',
      end: new Date('2026-05-21T12:00:00.000Z'),
      incomplete: true,
      markdownPath: './custom.md',
      jsonPath: './custom.json',
    })).toEqual({ markdownPath: './custom.md', jsonPath: './custom.json' });
  });
});

describe('createFileArtifactStore', () => {
  it('writes dated Markdown and JSON by default', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'feedback-digest-'));
    const store = createFileArtifactStore(tempDir);

    const paths = await store.write({ artifact: artifact(), markdown: '# digest', end: new Date('2026-05-21T12:00:00.000Z') });

    expect(paths).toEqual({
      markdownPath: join(tempDir, '2026-05-21-feedback-digest.md'),
      jsonPath: join(tempDir, '2026-05-21-feedback-digest.json'),
    });
    await expect(readFile(paths.markdownPath, 'utf8')).resolves.toBe('# digest');
    await expect(readFile(paths.jsonPath, 'utf8')).resolves.toContain('"completion"');
  });
});
