# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Repository Overview

**botloggi** is a near-empty repository (`Repositório Prado`). At the time of writing, the only tracked file besides this one is `README.md`. There is no application code, build system, package manifest, test suite, lint configuration, or CI workflow yet.

Treat this as a greenfield repo: any conventions below are seed defaults to be revised once the project's real shape is decided.

## Current Contents

| Path | Purpose |
| --- | --- |
| `README.md` | One-line description (`# botloggi` / `Repositório Prado`) |
| `CLAUDE.md` | This file |

## Default Branch & Working Branch

- Default branch: `main`
- Session work branch: `claude/add-claude-documentation-jxbfp` — push all changes here and open a PR against `main`.

## Suggested Workflow Until the Stack Is Chosen

- Before adding code, confirm the language/runtime/framework with the user.
- Once a stack is picked, replace this file with a real CLAUDE.md describing:
  - Project purpose
  - Directory layout
  - Install / build / test / lint commands
  - Code style and commit conventions
  - CI and release process
- Keep this file in sync with the codebase whenever conventions change.

## Conventions for AI Assistants

- Do not invent commands or dependencies — if there is no `package.json` / `pyproject.toml` / `go.mod` / etc., there is no build to run.
- Prefer asking the user before scaffolding a stack; otherwise propose options.
- When the project starts taking shape, rewrite this document with concrete commands and structure rather than leaving these placeholders.
