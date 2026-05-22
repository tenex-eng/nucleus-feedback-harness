import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ArtifactStore } from '../run/feedback-digest.js';
import { writeJson } from './json.js';

export function createFileArtifactStore(outputDir: string): ArtifactStore {
  return {
    async write(input) {
      const paths = resolveArtifactPaths({
        outputDir,
        end: input.end,
        incomplete: input.artifact.completion.status === 'incomplete',
        markdownPath: input.markdownPath,
        jsonPath: input.jsonPath,
      });
      await writeText(paths.markdownPath, input.markdown);
      await writeJson(paths.jsonPath, input.artifact);
      return paths;
    },
  };
}

export function resolveArtifactPaths(input: {
  outputDir: string;
  end: Date;
  incomplete: boolean;
  markdownPath?: string;
  jsonPath?: string;
}): { markdownPath: string; jsonPath: string } {
  const base = join(input.outputDir, `${dateStamp(input.end)}-feedback-digest${input.incomplete ? '.incomplete' : ''}`);
  return {
    markdownPath: input.markdownPath ?? `${base}.md`,
    jsonPath: input.jsonPath ?? `${base}.json`,
  };
}

async function writeText(path: string, text: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, 'utf8');
}

function dateStamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}
