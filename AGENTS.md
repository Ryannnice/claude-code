# Repository Guidelines

## Project Structure & Module Organization
`src/entrypoints/cli.tsx` boots the full Bun CLI, `bin/claude-haha` is the main launcher, and `src/localRecoveryCli.ts` is the fallback REPL. Keep terminal UI work in `src/screens/`, `src/components/`, and `src/ink/`. Put agent tools in `src/tools/`, slash commands in `src/commands/`, shared integration logic in `src/services/`, and general helpers in `src/utils/`. Store compatibility shims in `stubs/`, architecture diagrams and screenshots in `docs/`, and configuration examples in `.env.example`.

## Build, Test, and Development Commands
`bun install` installs dependencies.

`./bin/claude-haha` starts the interactive TUI with `.env`.

`./bin/claude-haha -p "summarize src/main.tsx"` runs headless for scripts or CI-style checks.

`CLAUDE_CODE_FORCE_RECOVERY_CLI=1 ./bin/claude-haha` starts the simplified recovery CLI.

`bun --env-file=.env ./src/entrypoints/cli.tsx --help` is the quickest startup smoke test after CLI changes.

This fork does not define a separate build step; Bun executes the TypeScript sources directly.

## Coding Style & Naming Conventions
Follow the existing TypeScript/ESM style: 2-space indentation, single quotes, and semicolon-free statements unless the surrounding file differs. Keep React and Ink components in `PascalCase.tsx`, hooks in `useX.ts`, command directories in lowercase, and tool implementations in feature folders such as `src/tools/FileReadTool/`. Prefer the `src/*` path alias from `tsconfig.json` when it improves readability. No repo-level formatter config is checked in, so avoid formatting-only churn.

## Testing Guidelines
No dedicated automated test suite or coverage gate is committed in this repository today. For each change, run a targeted smoke test and record it in the PR. Minimum checks are `--help` for startup, one interactive flow if you touched TUI code, and one headless `-p` run if you changed tools, commands, or API wiring.

## Commit & Pull Request Guidelines
Recent history uses short Conventional Commit prefixes such as `docs:` and `fix:`. Keep commit subjects imperative and focused, for example `fix: guard modifier key detection on Enter`. PRs should summarize user-visible impact, list manual verification steps, link related issues, and include terminal screenshots when changing `src/components/`, `src/screens/`, or `src/ink/`.

## Configuration & Security
Do not commit `.env` or real API credentials. Add new environment variables to `.env.example` and document behavior changes in `README.md` when setup or runtime expectations change. If a change affects external API routing, permissions, or sandbox behavior, call that out explicitly in the PR.
