# Nucleus Feedback Harness

Standalone CLI that reads Nucleus feedback from BigQuery, normalizes it, asks an LLM for a strict JSON digest, and writes Markdown.

## Setup

```sh
pnpm install
cp .env.example .env
# fill OPENAI_API_KEY
```

BigQuery auth uses Application Default Credentials or local gcloud credentials:

```sh
gcloud auth application-default login
```

## Usage

```sh
pnpm digest --window 7d
pnpm digest --window 24h --out ./digests/today.md
pnpm digest --start 2026-05-01 --end 2026-05-20
pnpm digest --window 7d --limit 100 --dry-run
pnpm digest --provider openai --model gpt-4.1-mini --out ./digests/openai.md
pnpm digest --provider vertex --model gemini-2.5-flash --out ./digests/gemini.md
pnpm digest --provider vertex --save-json ./digests/gemini.json --out ./digests/gemini.md
```
