// highlight.js's type defs carry `/// <reference lib="dom" />`. SSETransport,
// mcp/client, ssh, dumpPrompts use DOM types (TextDecodeOptions, RequestInfo)
// that only typecheck because this file's `typeof import('highlight.js')` pulls
// lib.dom in. tsconfig has lib: ["ESNext"] only — fixing the actual DOM-type
// deps is a separate sweep; this ref preserves the status quo.
/// <reference lib="dom" />

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { extname } from 'path'

// CliHighlight 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CliHighlight = {
  highlight: typeof import('cli-highlight').highlight
  supportsLanguage: typeof import('cli-highlight').supportsLanguage
}

// One promise shared by Fallback.tsx, markdown.ts, events.ts, getLanguageName.
// The highlight.js import piggybacks: cli-highlight has already pulled it into
// the module cache, so the second import() is a cache hit — no extra bytes
// faulted in.
// cliHighlightPromise 异步任务 先占位，稍后的条件分支会根据实际输入补齐它。
let cliHighlightPromise: Promise<CliHighlight | null> | undefined

// loadedGetLanguage 先占位，稍后的条件分支会根据实际输入补齐它。
let loadedGetLanguage: typeof import('highlight.js').getLanguage | undefined

// loadCliHighlight 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadCliHighlight(): Promise<CliHighlight | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // cliHighlight保存`import`，供共享工具后续处理使用。
    const cliHighlight = await import('cli-highlight')
    // cache hit — cli-highlight already loaded highlight.js
    // highlightJs 集合保存`import`，供共享工具后续处理使用。
    const highlightJs = await import('highlight.js')
    // loadedGetLanguage更新为 `highlightJs.getLanguage`，确保共享工具后续读取最新状态。
    loadedGetLanguage = highlightJs.getLanguage
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      highlight: cliHighlight.highlight,
      supportsLanguage: cliHighlight.supportsLanguage,
    }
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// getCliHighlightPromise 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCliHighlightPromise(): Promise<CliHighlight | null> {
  // 共享工具 cli Highlight在这里处理 `cliHighlightPromise ??= loadCliHighlight()`，完成这一小步状态转换。
  cliHighlightPromise ??= loadCliHighlight()
  // 返回 `cliHighlightPromise`，作为共享工具这次计算的结果。
  return cliHighlightPromise
}

/**
 * eg. "foo/bar.ts" → "TypeScript". Awaits the shared cli-highlight load,
 * then reads highlight.js's language registry. All callers are telemetry
 * (OTel counter attributes, permission-dialog unary events) — none block
 * on this, they fire-and-forget or the consumer already handles Promise<string>.
 */
// getLanguageName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getLanguageName(file_path: string): Promise<string> {
  // 等待 `getCliHighlightPromise()` 完成，再继续共享工具 cli Highlight的异步流程。
  await getCliHighlightPromise()
  // ext保存`extname`，供共享工具后续处理使用。
  const ext = extname(file_path).slice(1)
  // ext缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ext) return 'unknown'
  // 返回 `loadedGetLanguage?.(ext)?.name ?? 'unknown'`，作为共享工具这次计算的结果。
  return loadedGetLanguage?.(ext)?.name ?? 'unknown'
}
