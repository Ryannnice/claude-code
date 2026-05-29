// Voice keyterms for improving STT accuracy in the voice_stream endpoint.
//
// Provides domain-specific vocabulary hints (Deepgram "keywords") so the STT
// engine correctly recognises coding terminology, project names, and branch
// names that would otherwise be misheard.

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 引入 getProjectRoot，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getProjectRoot } from '../bootstrap/state.js'
// 复用 getBranch 工具函数，把通用处理留在 ../utils/git.js 中维护。
import { getBranch } from '../utils/git.js'

// ─── Global keyterms ────────────────────────────────────────────────

// GLOBAL_KEYTERMS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const GLOBAL_KEYTERMS: readonly string[] = [
  // Terms Deepgram consistently mangles without keyword hints.
  // Note: "Claude" and "Anthropic" are already server-side base keyterms.
  // Avoid terms nobody speaks aloud as-spelled (stdout → "standard out").
  'MCP',
  'symlink',
  'grep',
  'regex',
  'localhost',
  'codebase',
  'TypeScript',
  'JSON',
  'OAuth',
  'webhook',
  'gRPC',
  'dotfiles',
  'subagent',
  'worktree',
]

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Split an identifier (camelCase, PascalCase, kebab-case, snake_case, or
 * path segments) into individual words.  Fragments of 2 chars or fewer are
 * discarded to avoid noise.
 */
// splitIdentifier 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function splitIdentifier(name: string): string[] {
  // 返回 `name`，作为服务层 voice Keyterms这次计算的结果。
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[-_./\s]+/)
    .map(w => w.trim())
    // 链式调用 filter，继续加工上一行在服务层 voice Keyterms中产生的数据。
    .filter(w => w.length > 2 && w.length <= 20)
}

// fileNameWords 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fileNameWords(filePath: string): string[] {
  // stem保存`basename`，供服务层 voice Keyterms后续处理使用。
  const stem = basename(filePath).replace(/\.[^.]+$/, '')
  // 返回 `splitIdentifier(stem)`，作为服务层 voice Keyterms这次计算的结果。
  return splitIdentifier(stem)
}

// ─── Public API ─────────────────────────────────────────────────────

// MAX_KEYTERMS 集合保存`50`，供后续判断或组装使用。
const MAX_KEYTERMS = 50

/**
 * Build a list of keyterms for the voice_stream STT endpoint.
 *
 * Combines hardcoded global coding terms with session context (project name,
 * git branch, recent files) without any model calls.
 */
// getVoiceKeyterms 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getVoiceKeyterms(
  recentFiles?: ReadonlySet<string>,
): Promise<string[]> {
  // terms 集合构建`new Set<string>(GLOBAL_KEYTERMS)`，供后续判断或组装使用。
  const terms = new Set<string>(GLOBAL_KEYTERMS)

  // Project root basename as a single term — users say "claude CLI internal"
  // as a phrase, not isolated words. Keeping the whole basename lets the
  // STT's keyterm boosting match the phrase regardless of separator.
  // 保护这一段可能失败的服务层 voice Keyterms操作，确保异常能进入相邻错误处理。
  try {
    // projectRoot读取`getProjectRoot`，供服务层 voice Keyterms后续处理使用。
    const projectRoot = getProjectRoot()
    // 满足 `projectRoot` 时，服务层 voice Keyterms执行该分支。
    if (projectRoot) {
      // 名称保存`basename`，供服务层 voice Keyterms后续处理使用。
      const name = basename(projectRoot)
      // 组合条件 `name.length > 2 && name.length <= 50` 成立时，服务层 voice Keyterms才启用这条专门路径。
      if (name.length > 2 && name.length <= 50) {
        // 调用 terms.add，触发服务层 voice Keyterms此处需要的副作用。
        terms.add(name)
      }
    }
  } catch {
    // getProjectRoot() may throw if not initialised yet — ignore
  }

  // Git branch words (e.g. "feat/voice-keyterms" → "feat", "voice", "keyterms")
  // 保护这一段可能失败的服务层 voice Keyterms操作，确保异常能进入相邻错误处理。
  try {
    // branch读取`getBranch`，供服务层 voice Keyterms后续处理使用。
    const branch = await getBranch()
    // 满足 `branch` 时，服务层 voice Keyterms执行该分支。
    if (branch) {
      // 逐项读取 `splitIdentifier(branch)` 中的word，按输入顺序推进服务层 voice Keyterms。
      for (const word of splitIdentifier(branch)) {
        // 调用 terms.add，触发服务层 voice Keyterms此处需要的副作用。
        terms.add(word)
      }
    }
  } catch {
    // getBranch() may fail if not in a git repo — ignore
  }

  // Recent file names — only scan enough to fill remaining slots
  // 满足 `recentFiles` 时，服务层 voice Keyterms执行该分支。
  if (recentFiles) {
    // 按顺序遍历 `recentFiles` 中的文件路径，逐个交给服务层 voice Keyterms处理。
    for (const filePath of recentFiles) {
      // 满足 `terms.size >= MAX_KEYTERMS` 时，服务层 voice Keyterms执行该分支。
      if (terms.size >= MAX_KEYTERMS) break
      // 逐项读取 `fileNameWords(filePath)` 中的word，按输入顺序推进服务层 voice Keyterms。
      for (const word of fileNameWords(filePath)) {
        // 调用 terms.add，触发服务层 voice Keyterms此处需要的副作用。
        terms.add(word)
      }
    }
  }

  // 返回列表结果，保留服务层 voice Keyterms已经排好的条目顺序。
  return [...terms].slice(0, MAX_KEYTERMS)
}
