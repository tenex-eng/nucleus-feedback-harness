import type { ArtifactStore } from '../run/feedback-digest.js';
import { writeJson } from './json.js';
import { writeDigest } from './write.js';

export function createFileArtifactStore(outputDir: string): ArtifactStore {
  return {
    async write(input) {
      const markdownPath = await writeDigest(input.markdown, { outputDir, out: input.markdownPath, end: input.end });
      if (input.jsonPath) await writeJson(input.jsonPath, input.artifact);
      return { markdownPath, jsonPath: input.jsonPath };
    },
  };
}
