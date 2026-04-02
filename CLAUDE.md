# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

- Install dependencies: `bun install`
- Start the full interactive CLI: `./bin/claude-haha`
- Run headless for a single prompt: `./bin/claude-haha -p "explain src/main.tsx"`
- Pipe stdin into headless mode: `echo "hello" | ./bin/claude-haha -p`
- Show CLI help / do a startup smoke test: `./bin/claude-haha --help`
- Start the recovery CLI instead of the Ink TUI: `CLAUDE_CODE_FORCE_RECOVERY_CLI=1 ./bin/claude-haha`
- On Windows, run the TS entrypoint directly: `bun --env-file=.env ./src/entrypoints/cli.tsx`
- On Windows, headless single prompt: `bun --env-file=.env ./src/entrypoints/cli.tsx -p "your prompt here"`
- On Windows, recovery CLI: `bun --env-file=.env ./src/localRecoveryCli.ts`

## Runtime and setup

- This repo is run directly with Bun; there is no separate build step in `package.json`.
- `bin/claude-haha` is the normal launcher. It loads `.env` and dispatches either the full CLI or `src/localRecoveryCli.ts` when `CLAUDE_CODE_FORCE_RECOVERY_CLI=1` is set.
- Copy `.env.example` to `.env` before local runs. One of `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` must be set, and `ANTHROPIC_BASE_URL` can point at any Anthropic-compatible endpoint.
- `preload.ts` injects local build metadata into `globalThis.MACRO` and disables remote prefetch by default for this local fork.

## Architecture overview

### Entry flow

- `src/entrypoints/cli.tsx` is the bootstrap entrypoint. It handles fast paths first (`--version`, MCP/native-host modes, daemon/background/worktree-related paths) and only then loads the full CLI.
- The full interactive CLI is driven from `src/main.tsx`. This is the central orchestrator: it parses flags, initializes config/auth/telemetry/plugins/skills/MCP, resolves permissions and session state, and then launches the REPL UI.
- `src/setup.ts` performs early process/session setup before the app runs: cwd and project-root initialization, hook snapshotting, session/worktree creation, messaging socket startup, and terminal-backup restoration.
- `src/localRecoveryCli.ts` is a separate minimal readline-based client that talks to the Anthropic SDK directly. Use it when debugging startup issues in the full TUI.

### UI and interaction model

- The user-facing app is an Ink/React terminal app. `src/replLauncher.tsx` mounts `components/App` around `screens/REPL`, which is the main interactive screen.
- `src/main.tsx` is intentionally very large because it owns startup sequencing and all high-level mode selection before control reaches the REPL.
- `src/ink/`, `src/components/`, and `src/screens/` are the rendering and interaction layers; changes there usually require manual interactive testing, not just `--help`.

### Commands, skills, and tools

- Slash commands are registered through `src/commands.ts`, which aggregates built-in commands from `src/commands/**` and conditionally enables feature-flagged ones.
- Model tools are registered through `src/tools.ts`. This is the source of truth for tool availability and permission-sensitive filtering. Core tools include Bash, Read/Edit/Write, Glob/Grep, WebFetch/WebSearch, planning/worktree/task tools, MCP resource tools, and agent/skill tools.
- Bundled skills are registered from `src/skills/bundled/index.ts`. This repo includes bundled skills such as `update-config`, `remember`, and `simplify`, plus feature-gated skills.

### Integrations and services

- `src/services/**` holds external integration layers and shared services. A major subsystem is MCP: `src/services/mcp/client.ts` manages MCP transports, client connections, auth refresh, tool/resource exposure, and result handling.
- `src/main.tsx` wires together MCP, plugins, policy limits, remote-managed settings, telemetry/growthbook, model selection, and permission context before the session starts.
- The codebase uses feature flags from `bun:bundle` heavily. Many commands, tools, and modes are conditionally compiled or enabled, so check the surrounding feature gates before assuming a path is active.

## Repo-specific notes

- `tsconfig.json` defines the `src/*` path alias and maps some missing/native dependencies to local stubs in `stubs/`.
- This fork exists to make a leaked Claude Code source tree runnable locally. README documents local-specific fixes such as restoring the full CLI entry path, adding missing stubs/resources, and avoiding startup hangs.
- There is no committed automated test suite in this fork. Validate changes with targeted smoke tests using the relevant entry mode (`--help`, headless `-p`, recovery CLI, or full interactive TUI depending on the area changed).
