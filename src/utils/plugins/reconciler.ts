/**
 * Marketplace reconciler — makes known_marketplaces.json consistent with
 * declared intent in settings.
 *
 * Two layers:
 * - diffMarketplaces(): comparison (reads .git for worktree canonicalization, memoized)
 * - reconcileMarketplaces(): bundled diff + install (I/O, idempotent, additive)
 */

// 引入 isEqual，将 lodash-es/isEqual.js 中已经封装好的能力接到本文件流程里。
import isEqual from 'lodash-es/isEqual.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { isAbsolute, resolve } from 'path'
// 引入 getOriginalCwd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../../bootstrap/state.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 pathExists，将 ../file.js 中已经封装好的能力接到本文件流程里。
import { pathExists } from '../file.js'
// 引入 findCanonicalGitRoot，将 ../git.js 中已经封装好的能力接到本文件流程里。
import { findCanonicalGitRoot } from '../git.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  addMarketplaceSource,
  type DeclaredMarketplace,
  getDeclaredMarketplaces,
  loadKnownMarketplacesConfig,
} from './marketplaceManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  isLocalMarketplaceSource,
  type KnownMarketplacesFile,
  type MarketplaceSource,
} from './schemas.js'

// MarketplaceDiff 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type MarketplaceDiff = {
  /** Declared in settings, absent from known_marketplaces.json */
  missing: string[]
  /** Present in both, but settings source ≠ JSON source (settings wins) */
  sourceChanged: Array<{
    name: string
    declaredSource: MarketplaceSource
    materializedSource: MarketplaceSource
  }>
  /** Present in both, sources match */
  upToDate: string[]
}

/**
 * Compare declared intent (settings) against materialized state (JSON).
 *
 * Resolves relative directory/file paths in `declared` before comparing,
 * so project settings with `./path` match JSON's absolute path. Path
 * resolution reads `.git` to canonicalize worktree paths (memoized).
 */
// diffMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function diffMarketplaces(
  declared: Record<string, DeclaredMarketplace>,
  materialized: KnownMarketplacesFile,
  opts?: { projectRoot?: string },
): MarketplaceDiff {
  // missing 从空数组开始收集，后续循环会按处理顺序追加条目。
  const missing: string[] = []
  // sourceChanged 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sourceChanged: MarketplaceDiff['sourceChanged'] = []
  // upToDate 从空数组开始收集，后续循环会按处理顺序追加条目。
  const upToDate: string[] = []

  // 循环处理 `const [name, intent] of Object.entries(declared)`，让插件管理把同类条目按顺序走完。
  for (const [name, intent] of Object.entries(declared)) {
    // 状态 命名 `materialized[name]`，让后续代码直接表达这个值的用途。
    const state = materialized[name]
    // normalizedIntent保存`normalizeSource`，供插件管理后续处理使用。
    const normalizedIntent = normalizeSource(intent.source, opts?.projectRoot)

    // 状态缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!state) {
      // missing追加新条目，保持收集顺序与输入顺序一致。
      missing.push(name)
    // 插件工具 reconciler在这里处理 `} else if (intent.sourceIsFallback) {`，完成这一小步状态转换。
    } else if (intent.sourceIsFallback) {
      // Fallback: presence suffices. Don't compare sources — the declared source
      // is only a default for the `missing` branch. If seed/prior-install/mirror
      // materialized this marketplace under ANY source, leave it alone. Comparing
      // would report sourceChanged → re-clone → stomp the materialized content.
      // upToDate追加新条目，保持收集顺序与输入顺序一致。
      upToDate.push(name)
    // 插件工具 reconciler在这里处理 `} else if (!isEqual(normalizedIntent, state.source)) {`，完成这一小步状态转换。
    } else if (!isEqual(normalizedIntent, state.source)) {
      // sourceChanged追加新条目，保持收集顺序与输入顺序一致。
      sourceChanged.push({
        name,
        declaredSource: normalizedIntent,
        materializedSource: state.source,
      })
    } else {
      // upToDate追加新条目，保持收集顺序与输入顺序一致。
      upToDate.push(name)
    }
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { missing, sourceChanged, upToDate }
}

// ReconcileOptions 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReconcileOptions = {
  /** Skip a declared marketplace. Used by zip-cache mode for unsupported source types. */
  skip?: (name: string, source: MarketplaceSource) => boolean
  onProgress?: (event: ReconcileProgressEvent) => void
}

// ReconcileProgressEvent 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReconcileProgressEvent =
  | {
      type: 'installing'
      name: string
      action: 'install' | 'update'
      index: number
      total: number
    }
  | { type: 'installed'; name: string; alreadyMaterialized: boolean }
  | { type: 'failed'; name: string; error: string }

// ReconcileResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReconcileResult = {
  installed: string[]
  updated: string[]
  failed: Array<{ name: string; error: string }>
  upToDate: string[]
  skipped: string[]
}

/**
 * Make known_marketplaces.json consistent with declared intent.
 * Idempotent. Additive only (never deletes). Does not touch AppState.
 */
// reconcileMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function reconcileMarketplaces(
  opts?: ReconcileOptions,
): Promise<ReconcileResult> {
  // declared读取`getDeclaredMarketplaces`，供插件管理后续处理使用。
  const declared = getDeclaredMarketplaces()
  // Object.keys(declared)为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (Object.keys(declared).length === 0) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { installed: [], updated: [], failed: [], upToDate: [], skipped: [] }
  }

  // materialized 先占位，稍后的条件分支会根据实际输入补齐它。
  let materialized: KnownMarketplacesFile
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // materialized更新为 `await loadKnownMarketplacesConfig()`，确保插件工具后续读取最新状态。
    materialized = await loadKnownMarketplacesConfig()
  } catch (e) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // materialized更新为 `{}`，确保插件工具后续读取最新状态。
    materialized = {}
  }

  // diff保存`diffMarketplaces`，供插件管理后续处理使用。
  const diff = diffMarketplaces(declared, materialized, {
    projectRoot: getOriginalCwd(),
  })

  // WorkItem 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
  type WorkItem = {
    name: string
    source: MarketplaceSource
    action: 'install' | 'update'
  }
  // work 聚合成有序列表，保持后续遍历顺序稳定。
  const work: WorkItem[] = [
    ...diff.missing.map(
      // 这个回调绑定到 (name): WorkItem => ({，负责插件管理在该局部场景下的响应。
      (name): WorkItem => ({
        name,
        source: normalizeSource(declared[name]!.source),
        action: 'install',
      }),
    ),
    ...diff.sourceChanged.map(
      // 这个回调绑定到 ({ name, declaredSource }): WorkItem => ({，负责插件管理在该局部场景下的响应。
      ({ name, declaredSource }): WorkItem => ({
        name,
        source: declaredSource,
        action: 'update',
      }),
    ),
  ]

  // skipped 从空数组开始收集，后续循环会按处理顺序追加条目。
  const skipped: string[] = []
  // toProcess 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const toProcess: WorkItem[] = []
  // 按顺序遍历 `work` 中的item，逐个交给插件管理处理。
  for (const item of work) {
    // 满足 `opts?.skip?.(item.name, item.source)` 时，插件管理执行该分支。
    if (opts?.skip?.(item.name, item.source)) {
      // skipped追加新条目，保持收集顺序与输入顺序一致。
      skipped.push(item.name)
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }
    // For sourceChanged local-path entries, skip if the declared path doesn't
    // exist. Guards multi-checkout scenarios where normalizeSource can't
    // canonicalize and produces a dead path — the materialized entry may still
    // be valid; addMarketplaceSource would fail anyway, so skipping avoids a
    // noisy "failed" event and preserves the working entry. Missing entries
    // are NOT skipped (nothing to preserve; the user should see the error).
    // 插件管理在这里按实际状态进入对应分支。
    if (
      item.action === 'update' &&
      isLocalMarketplaceSource(item.source) &&
      !(await pathExists(item.source.path))
    ) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[reconcile] '${item.name}' declared path does not exist; keeping materialized entry`,
      )
      // skipped追加新条目，保持收集顺序与输入顺序一致。
      skipped.push(item.name)
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }
    // toProcess 集合追加新条目，保持收集顺序与输入顺序一致。
    toProcess.push(item)
  }

  // toProcess 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (toProcess.length === 0) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      installed: [],
      updated: [],
      failed: [],
      upToDate: diff.upToDate,
      skipped,
    }
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    // 这个回调绑定到 `[reconcile] ${toProcess.length} marketplace(s): ${toProcess.map(w => `${w.name}(${w…，负责插件管理在该局部场景下的响应。
    `[reconcile] ${toProcess.length} marketplace(s): ${toProcess.map(w => `${w.name}(${w.action})`).join(', ')}`,
  )

  // installed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const installed: string[] = []
  // updated 从空数组开始收集，后续循环会按处理顺序追加条目。
  const updated: string[] = []
  // failed 从空数组开始收集，后续循环会按处理顺序追加条目。
  const failed: ReconcileResult['failed'] = []

  // 按索引扫描 `toProcess.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < toProcess.length; i++) {
    // 从 `toProcess[i]!` 解构 name、source、action，减少插件工具 reconciler对同一对象的重复访问。
    const { name, source, action } = toProcess[i]!
    // 调用 opts?.onProgress?.({，完成这一处局部操作。
    opts?.onProgress?.({
      type: 'installing',
      name,
      action,
      index: i + 1,
      total: toProcess.length,
    })

    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // addMarketplaceSource is source-idempotent — same source returns
      // alreadyMaterialized:true without cloning. For 'update' (source
      // changed), the new source won't match existing → proceeds with clone
      // and overwrites the old JSON entry.
      // 结果保存`addMarketplaceSource`，供插件管理后续处理使用。
      const result = await addMarketplaceSource(source)

      // 满足 `action === 'install') installed.push(name` 时，插件管理执行该分支。
      if (action === 'install') installed.push(name)
      else updated.push(name)
      // 调用 opts?.onProgress?.({，完成这一处局部操作。
      opts?.onProgress?.({
        type: 'installed',
        name,
        alreadyMaterialized: result.alreadyMaterialized,
      })
    } catch (e) {
      // 错误保存`errorMessage`，供插件管理后续处理使用。
      const error = errorMessage(e)
      // failed追加新条目，保持收集顺序与输入顺序一致。
      failed.push({ name, error })
      // 调用 opts?.onProgress?.({ type: 'failed', name, error })，完成这一处局部操作。
      opts?.onProgress?.({ type: 'failed', name, error })
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(e)
    }
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { installed, updated, failed, upToDate: diff.upToDate, skipped }
}

/**
 * Resolve relative directory/file paths for stable comparison.
 * Settings declared at project scope may use project-relative paths;
 * JSON stores absolute paths.
 *
 * For git worktrees, resolve against the main checkout (canonical root)
 * instead of the worktree cwd. Project settings are checked into git,
 * so `./foo` means "relative to this repo" — but known_marketplaces.json is
 * user-global with one entry per marketplace name. Resolving against the
 * worktree cwd means each worktree session overwrites the shared entry with
 * its own absolute path, and deleting the worktree leaves a dead
 * installLocation. The canonical root is stable across all worktrees.
 */
// normalizeSource 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function normalizeSource(
  source: MarketplaceSource,
  projectRoot?: string,
): MarketplaceSource {
  // 插件管理在这里按实际状态进入对应分支。
  if (
    (source.source === 'directory' || source.source === 'file') &&
    !isAbsolute(source.path)
  ) {
    // base读取`getOriginalCwd`，供插件管理后续处理使用。
    const base = projectRoot ?? getOriginalCwd()
    // canonicalRoot筛选`findCanonicalGitRoot`，供插件管理后续处理使用。
    const canonicalRoot = findCanonicalGitRoot(base)
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...source,
      path: resolve(canonicalRoot ?? base, source.path),
    }
  }
  // 返回 `source`，作为插件管理这次计算的结果。
  return source
}
