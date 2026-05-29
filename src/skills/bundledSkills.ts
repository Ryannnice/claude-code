// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准bundled Skills的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { constants as fsConstants } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, open } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, isAbsolute, join, normalize, sep as pathSep } from 'path'
// 类型依赖 { ToolUseContext } 来自 ../Tool.js，用于校准bundled Skills的数据契约。
import type { ToolUseContext } from '../Tool.js'
// 类型依赖 { Command } 来自 ../types/command.js，用于校准bundled Skills的数据契约。
import type { Command } from '../types/command.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 getBundledSkillsRoot 工具函数，把通用处理留在 ../utils/permissions/filesystem.js 中维护。
import { getBundledSkillsRoot } from '../utils/permissions/filesystem.js'
// 类型依赖 { HooksSettings } 来自 ../utils/settings/types.js，用于校准bundled Skills的数据契约。
import type { HooksSettings } from '../utils/settings/types.js'

/**
 * Definition for a bundled skill that ships with the CLI.
 * These are registered programmatically at startup.
 */
// BundledSkillDefinition 固化bundled Skills里传递的数据形状，帮助调用方按同一结构读写字段。
export type BundledSkillDefinition = {
  name: string
  description: string
  aliases?: string[]
  whenToUse?: string
  argumentHint?: string
  allowedTools?: string[]
  model?: string
  disableModelInvocation?: boolean
  userInvocable?: boolean
  // 这个回调绑定到 isEnabled?: () => boolean，负责bundled Skills在该局部场景下的响应。
  isEnabled?: () => boolean
  hooks?: HooksSettings
  context?: 'inline' | 'fork'
  agent?: string
  /**
   * Additional reference files to extract to disk on first invocation.
   * Keys are relative paths (forward slashes, no `..`), values are content.
   * When set, the skill prompt is prefixed with a "Base directory for this
   * skill: <dir>" line so the model can Read/Grep these files on demand —
   * same contract as disk-based skills.
   */
  files?: Record<string, string>
  // bundled Skills在这里处理 `getPromptForCommand: (`，完成这一小步状态转换。
  getPromptForCommand: (
    args: string,
    context: ToolUseContext,
  ) => Promise<ContentBlockParam[]>
}

// Internal registry for bundled skills
// bundledSkills 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
const bundledSkills: Command[] = []

/**
 * Register a bundled skill that will be available to the model.
 * Call this at module initialization or in an init function.
 *
 * Bundled skills are compiled into the CLI binary and available to all users.
 * They follow the same pattern as registerPostSamplingHook() for internal features.
 */
// registerBundledSkill 封装bundledSkills的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerBundledSkill(definition: BundledSkillDefinition): void {
  // 从 `definition` 解构 files，减少bundled Skills对同一对象的重复访问。
  const { files } = definition

  // skillRoot 先占位，稍后的条件分支会根据实际输入补齐它。
  let skillRoot: string | undefined
  // getPromptForCommand 命令数据读取`definition.getPromptForCommand` 整理出中间结果，供bundled Skills后续步骤使用。
  let getPromptForCommand = definition.getPromptForCommand

  // 组合条件 `files && Object.keys(files).length > 0` 成立时，bundled Skills才启用这条专门路径。
  if (files && Object.keys(files).length > 0) {
    // skillRoot更新为 `getBundledSkillExtractDir(definition.name)`，确保bundledSkills后续读取最新状态。
    skillRoot = getBundledSkillExtractDir(definition.name)
    // Closure-local memoization: extract once per process.
    // Memoize the promise (not the result) so concurrent callers await
    // the same extraction instead of racing into separate writes.
    // extractionPromise 异步任务 先占位，稍后的条件分支会根据实际输入补齐它。
    let extractionPromise: Promise<string | null> | undefined
    // inner读取`definition.getPromptForCommand` 整理出中间结果，供bundled Skills后续步骤使用。
    const inner = definition.getPromptForCommand
    // getPromptForCommand 命令数据更新为 `async (args, ctx) => {`，确保bundledSkills后续读取最新状态。
    getPromptForCommand = async (args, ctx) => {
      // bundled Skills在这里处理 `extractionPromise ??= extractBundledSkillFiles(definition.name, files)`，完成这一小步状态转换。
      extractionPromise ??= extractBundledSkillFiles(definition.name, files)
      // extractedDir 等待 `extractionPromise`，确保继续执行前已有结果。
      const extractedDir = await extractionPromise
      // blocks 集合保存`inner`，供bundled Skills后续处理使用。
      const blocks = await inner(args, ctx)
      // 满足 `extractedDir === null` 时，bundled Skills执行该分支。
      if (extractedDir === null) return blocks
      // 返回 `prependBaseDir(blocks, extractedDir)`，作为bundled Skills这次计算的结果。
      return prependBaseDir(blocks, extractedDir)
    }
  }

  // 命令 集中保存bundled Skills要一起传递的字段。
  const command: Command = {
    type: 'prompt',
    name: definition.name,
    description: definition.description,
    aliases: definition.aliases,
    hasUserSpecifiedDescription: true,
    allowedTools: definition.allowedTools ?? [],
    argumentHint: definition.argumentHint,
    whenToUse: definition.whenToUse,
    model: definition.model,
    disableModelInvocation: definition.disableModelInvocation ?? false,
    userInvocable: definition.userInvocable ?? true,
    contentLength: 0, // Not applicable for bundled skills
    source: 'bundled',
    loadedFrom: 'bundled',
    hooks: definition.hooks,
    skillRoot,
    context: definition.context,
    agent: definition.agent,
    isEnabled: definition.isEnabled,
    isHidden: !(definition.userInvocable ?? true),
    progressMessage: 'running',
    getPromptForCommand,
  }
  // bundledSkills 集合追加新条目，保持收集顺序与输入顺序一致。
  bundledSkills.push(command)
}

/**
 * Get all registered bundled skills.
 * Returns a copy to prevent external mutation.
 */
// getBundledSkills 封装bundledSkills的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBundledSkills(): Command[] {
  // 返回列表结果，保留bundled Skills已经排好的条目顺序。
  return [...bundledSkills]
}

/**
 * Clear bundled skills registry (for testing).
 */
// clearBundledSkills 封装bundledSkills的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearBundledSkills(): void {
  // bundledSkills 集合被清空，bundledSkills从干净状态继续。
  bundledSkills.length = 0
}

/**
 * Deterministic extraction directory for a bundled skill's reference files.
 */
// getBundledSkillExtractDir 封装bundledSkills的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBundledSkillExtractDir(skillName: string): string {
  // 返回 `join(getBundledSkillsRoot(), skillName)`，作为bundled Skills这次计算的结果。
  return join(getBundledSkillsRoot(), skillName)
}

/**
 * Extract a bundled skill's reference files to disk so the model can
 * Read/Grep them on demand. Called lazily on first skill invocation.
 *
 * Returns the directory written to, or null if write failed (skill
 * continues to work, just without the base-directory prefix).
 */
// extractBundledSkillFiles 封装bundledSkills的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function extractBundledSkillFiles(
  skillName: string,
  files: Record<string, string>,
): Promise<string | null> {
  // dir读取`getBundledSkillExtractDir`，供bundled Skills后续处理使用。
  const dir = getBundledSkillExtractDir(skillName)
  // 保护这一段可能失败的bundled Skills操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeSkillFiles(dir, files)` 完成，再继续bundled Skills的异步流程。
    await writeSkillFiles(dir, files)
    // 返回 `dir`，作为bundled Skills这次计算的结果。
    return dir
  } catch (e) {
    // 记录bundled Skills运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to extract bundled skill '${skillName}' to ${dir}: ${e instanceof Error ? e.message : String(e)}`,
    )
    // 返回 `null`，作为bundled Skills这次计算的结果。
    return null
  }
}

// writeSkillFiles 封装bundledSkills的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeSkillFiles(
  dir: string,
  files: Record<string, string>,
): Promise<void> {
  // Group by parent dir so we mkdir each subtree once, then write.
  // byParent 命名 `new Map<string, [string, string][]>()`，让后续代码直接表达这个值的用途。
  const byParent = new Map<string, [string, string][]>()
  // 循环处理 `const [relPath, content] of Object.entries(files)`，让bundled Skills把同类条目按顺序走完。
  for (const [relPath, content] of Object.entries(files)) {
    // target读取`resolveSkillFilePath`，供bundled Skills后续处理使用。
    const target = resolveSkillFilePath(dir, relPath)
    // parent保存`dirname`，供bundled Skills后续处理使用。
    const parent = dirname(target)
    // entry 聚合成有序列表，保持后续遍历顺序稳定。
    const entry: [string, string] = [target, content]
    // group读取`byParent.get`，供bundled Skills后续处理使用。
    const group = byParent.get(parent)
    // 满足 `group) group.push(entry` 时，bundled Skills执行该分支。
    if (group) group.push(entry)
    else byParent.set(parent, [entry])
  }
  // 等待 `Promise.all(` 完成，再继续bundled Skills的异步流程。
  await Promise.all(
    // 这个回调绑定到 [...byParent].map(async ([parent, entries]) => {，负责bundled Skills在该局部场景下的响应。
    [...byParent].map(async ([parent, entries]) => {
      // 等待 `mkdir(parent, { recursive: true, mode: 0o700 })` 完成，再继续bundled Skills的异步流程。
      await mkdir(parent, { recursive: true, mode: 0o700 })
      // 这个回调绑定到 await Promise.all(entries.map(([p, c]) => safeWriteFile(p, c)))，负责bundled Skills在该局部场景下的响应。
      await Promise.all(entries.map(([p, c]) => safeWriteFile(p, c)))
    }),
  )
}

// The per-process nonce in getBundledSkillsRoot() is the primary defense
// against pre-created symlinks/dirs. Explicit 0o700/0o600 modes keep the
// nonce subtree owner-only even on umask=0, so an attacker who learns the
// nonce via inotify on the predictable parent still can't write into it.
// O_NOFOLLOW|O_EXCL is belt-and-suspenders (O_NOFOLLOW only protects the
// final component); we deliberately do NOT unlink+retry on EEXIST — unlink()
// follows intermediate symlinks too.
// O_NOFOLLOW保存`fsConstants.O_NOFOLLOW ?? 0`，供后续判断或组装使用。
const O_NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0
// On Windows, use string flags — numeric O_EXCL can produce EINVAL through libuv.
// SAFE_WRITE_FLAGS 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const SAFE_WRITE_FLAGS =
  process.platform === 'win32'
    ? 'wx'
    : fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      O_NOFOLLOW

// safeWriteFile 封装bundledSkills的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function safeWriteFile(p: string, content: string): Promise<void> {
  // fh保存`open`，供bundled Skills后续处理使用。
  const fh = await open(p, SAFE_WRITE_FLAGS, 0o600)
  // 保护这一段可能失败的bundled Skills操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fh.writeFile(content, 'utf8')` 完成，再继续bundled Skills的异步流程。
    await fh.writeFile(content, 'utf8')
  } finally {
    // 等待 `fh.close()` 完成，再继续bundled Skills的异步流程。
    await fh.close()
  }
}

/** Normalize and validate a skill-relative path; throws on traversal. */
// resolveSkillFilePath 封装bundledSkills的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveSkillFilePath(baseDir: string, relPath: string): string {
  // normalized保存`normalize`，供bundled Skills后续处理使用。
  const normalized = normalize(relPath)
  // bundled Skills在这里进入条件判断，后续代码按实际状态分流。
  if (
    isAbsolute(normalized) ||
    normalized.split(pathSep).includes('..') ||
    normalized.split('/').includes('..')
  ) {
    // 抛出 new Error(`bundled skill file path escapes skill dir: ${relPath}`)，阻止bundled Skills在无效状态下继续运行。
    throw new Error(`bundled skill file path escapes skill dir: ${relPath}`)
  }
  // 返回 `join(baseDir, normalized)`，作为bundled Skills这次计算的结果。
  return join(baseDir, normalized)
}

// prependBaseDir 封装bundledSkills的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function prependBaseDir(
  blocks: ContentBlockParam[],
  baseDir: string,
): ContentBlockParam[] {
  // prefix固定为 ``Base directory for this skill: ${baseDir}\n\n``，作为bundled Skills后续展示或比较的基准。
  const prefix = `Base directory for this skill: ${baseDir}\n\n`
  // 当 `blocks.length > 0 && blocks[0]!.type` 匹配 `'text'` 时，bundled Skills执行对应分支。
  if (blocks.length > 0 && blocks[0]!.type === 'text') {
    // 返回列表结果，保留bundled Skills已经排好的条目顺序。
    return [
      { type: 'text', text: prefix + blocks[0]!.text },
      ...blocks.slice(1),
    ]
  }
  // 返回列表结果，保留bundled Skills已经排好的条目顺序。
  return [{ type: 'text', text: prefix }, ...blocks]
}
