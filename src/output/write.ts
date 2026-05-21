import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function writeDigest(markdown: string, options: { outputDir: string; out?: string; end: Date }): Promise<string> {
  const path = options.out ?? join(options.outputDir, `feedback-digest-${dateStamp(options.end)}.md`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, markdown, 'utf8');
  return path;
}

function dateStamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}
