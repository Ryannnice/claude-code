/**
 * CLI exit helpers for subcommand handlers.
 *
 * Consolidates the 4-5 line "print + lint-suppress + exit" block that was
 * copy-pasted ~60 times across `claude mcp *` / `claude plugin *` handlers.
 * The `: never` return type lets TypeScript narrow control flow at call sites
 * without a trailing `return`.
 */
/* eslint-disable custom-rules/no-process-exit -- centralized CLI exit point */

// `return undefined as never` (not a post-exit throw) — tests spy on
// process.exit and let it return. Call sites write `return cliError(...)`
// where subsequent code would dereference narrowed-away values under mock.
// cliError uses console.error (tests spy on console.error); cliOk uses
// process.stdout.write (tests spy on process.stdout.write — Bun's console.log
// doesn't route through a spied process.stdout.write).

/** Write an error message to stderr (if given) and exit with code 1. */
// cliError 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cliError(msg?: string): never {
  // biome-ignore lint/suspicious/noConsole: centralized CLI error output
  // 满足 `msg) console.error(msg` 时，exit执行该分支。
  if (msg) console.error(msg)
  // 调用 process.exit，触发exit此处需要的副作用。
  process.exit(1)
  // 返回 `undefined as never`，作为exit这次计算的结果。
  return undefined as never
}

/** Write a message to stdout (if given) and exit with code 0. */
// cliOk 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cliOk(msg?: string): never {
  // 满足 `msg) process.stdout.write(msg + '\n'` 时，exit执行该分支。
  if (msg) process.stdout.write(msg + '\n')
  // 调用 process.exit，触发exit此处需要的副作用。
  process.exit(0)
  // 返回 `undefined as never`，作为exit这次计算的结果。
  return undefined as never
}
