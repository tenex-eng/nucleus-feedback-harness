import { Command } from 'commander';
import { loadConfig } from './config.js';
import { createBigQueryClient } from './bq/client.js';
import { fetchFeedback } from './bq/queries.js';
import { computeFeedbackStats } from './feedback/stats.js';
import { createJsonLlmProvider, parseProvider } from './llm/factory.js';
import { createFileArtifactStore } from './output/store.js';
import { runFeedbackDigest, type FeedbackSignalSource } from './run/feedback-digest.js';

const program = new Command();

program
  .name('feedback-digest')
  .option('--window <duration>', 'relative window, e.g. 24h or 7d')
  .option('--start <date>', 'start date/time')
  .option('--end <date>', 'end date/time')
  .option('--out <path>', 'markdown output path')
  .option('--save-json <path>', 'write raw digest JSON')
  .option('--provider <name>', 'LLM provider: openai or vertex')
  .option('--model <name>', 'LLM model override')
  .option('--limit <number>', 'limit rows per source table', parseInt)
  .option('--dry-run', 'query and print normalized feedback count only')
  .action(async (opts) => {
    const config = loadConfig();
    const { start, end } = parsePeriod(opts);
    const client = createBigQueryClient(config);
    const signalSource: FeedbackSignalSource = {
      fetch: async ({ period, limit }) => fetchFeedback(client, { dataset: config.bqDataset, start: period.start, end: period.end, limit }),
    };

    if (opts.dryRun) {
      const items = await signalSource.fetch({ period: { start, end }, limit: opts.limit });
      const stats = computeFeedbackStats(items);
      console.log(JSON.stringify({ period: { start, end }, ...stats }, null, 2));
      return;
    }

    const providerName = parseProvider(opts.provider) ?? config.llmProvider;
    const model = opts.model ?? (providerName === 'openai' ? config.openaiModel : config.vertexModel);
    const provider = createJsonLlmProvider(config, { provider: providerName, model });
    const result = await runFeedbackDigest({
      period: { start, end },
      signalSource,
      llmProvider: provider,
      provider: providerName,
      model,
      limit: opts.limit,
      markdownPath: opts.out,
      jsonPath: opts.saveJson,
      artifactStore: createFileArtifactStore(config.outputDir),
    });
    console.log(`Wrote ${result.writtenPaths?.markdownPath}`);
  });

program.parseAsync().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

function parsePeriod(opts: { window?: string; start?: string; end?: string }): { start: Date; end: Date } {
  const end = opts.end ? new Date(opts.end) : new Date();
  if (Number.isNaN(end.getTime())) throw new Error(`Invalid --end: ${opts.end}`);

  const start = opts.start ? new Date(opts.start) : subtractWindow(end, opts.window ?? '7d');
  if (Number.isNaN(start.getTime())) throw new Error(`Invalid --start: ${opts.start}`);
  if (start >= end) throw new Error('Start must be before end');
  return { start, end };
}

function subtractWindow(end: Date, window: string): Date {
  const match = /^(\d+)(h|d)$/.exec(window);
  if (!match) throw new Error(`Invalid --window: ${window}. Use e.g. 24h or 7d.`);
  const amount = Number(match[1]);
  const millis = match[2] === 'h' ? amount * 60 * 60 * 1000 : amount * 24 * 60 * 60 * 1000;
  return new Date(end.getTime() - millis);
}
