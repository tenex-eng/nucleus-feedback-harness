# Nucleus Feedback Harness

Standalone CLI that reads Nucleus Feedback Signals from BigQuery, normalizes them, synthesizes a Feedback Digest with an LLM, repairs/merges findings in the harness, and writes Markdown + JSON Digest Artifacts.

## Feedback Signals

The digest currently covers three feedback sources:

- Case Closure Feedback
- General Feedback
- Targeted Feedback

Text is synthesized. Screenshots/images are tracked as artifact references and coverage metadata, but are not sent to the model yet because they may contain customer-identifying or otherwise sensitive information.

## Setup

```sh
pnpm install
cp .env.example .env
```

BigQuery auth uses Application Default Credentials or local gcloud credentials:

```sh
gcloud auth application-default login
```

Default LLM provider is Vertex Gemini. OpenAI can be selected explicitly when `OPENAI_API_KEY` is configured.

## Usage

```sh
pnpm run digest -- --window 7d
pnpm run digest -- --window 24h
pnpm run digest -- --start 2026-05-01 --end 2026-05-20
pnpm run digest -- --window 7d --limit 100 --dry-run
pnpm run digest -- --provider openai --model gpt-4.1-mini
pnpm run digest -- --provider vertex --model gemini-2.5-flash
pnpm run digest -- --provider vertex --save-json ./digests/gemini.json --out ./digests/gemini.md
```

By default each run writes dated Markdown and JSON outputs:

```txt
digests/2026-05-23-feedback-digest.md
digests/2026-05-23-feedback-digest.json
```

Incomplete runs are visibly marked in both filenames and Markdown:

```txt
digests/2026-05-23-feedback-digest.incomplete.md
digests/2026-05-23-feedback-digest.incomplete.json
```

## Digest quality controls

The harness post-processes model output before writing artifacts:

- merges duplicate or related Research Findings
- caps the final digest to the strongest findings
- computes Source Diversity from evidence IDs and Feedback Signal sources instead of trusting model-provided counts
- canonicalizes model-shortened evidence IDs when they uniquely match a Feedback Signal ID prefix
- truncates overlong representative quotes instead of failing a whole chunk
- rewrites the executive summary into an action-oriented format with top actions, evidence/source mix, severity, and caveats

## Verify

```sh
pnpm test
pnpm build
```
