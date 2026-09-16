# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Repository Overview

**botloggi** (`Repositório Prado`) hosts two independent projects:

- A static dashboard (`index.html`) — a single-file HTML page (Highcharts sunburst, no build step) visualizing "Como usamos IA no Viver de IA".
- A Python CLI application (`src/botloggi/`) scaffolded with [uv](https://docs.astral.sh/uv/), pytest, and ruff. The CLI itself is currently a placeholder (`botloggi` prints a stub message) — real functionality is still to be built.

These do not share code or build tooling — treat them as separate concerns when making changes.

## Directory Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Static AI-usage dashboard (self-contained, no build) |
| `src/botloggi/` | CLI package source (`cli.py` holds the entry point `main()`) |
| `tests/` | pytest test suite (CLI only) |
| `pyproject.toml` | CLI project metadata, dependencies, ruff/pytest config |
| `uv.lock` | Locked dependency versions (commit this file) |
| `README.md` | User-facing usage instructions for both projects |

## Install / Build / Test / Lint

```sh
uv sync               # install deps into .venv
uv run botloggi        # run the CLI
uv run pytest          # run tests
uv run ruff check .     # lint
uv run ruff format .    # format
```

## Default Branch & Working Branch

- Default branch: `main`
- Push changes to a feature branch and open a PR against `main`.

## Conventions for AI Assistants

- Use `uv` for all dependency and environment management — don't reach for plain `pip`/`venv` or another package manager.
- Keep the CLI entry point in `src/botloggi/cli.py`; add new subcommands/logic as modules under `src/botloggi/` and wire them in from there.
- Add a test under `tests/` for new behavior; keep tests minimal and focused.
- Run `uv run ruff check .` and `uv run pytest` before considering a change complete.
- Keep this file in sync with the codebase whenever conventions or structure change.
