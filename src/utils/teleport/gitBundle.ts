/**
 * Git bundle creation + upload for CCR seed-bundle seeding.
 *
 * Flow:
 *   1. git stash create → update-ref refs/seed/stash (makes it reachable)
 *   2. git bundle create --all (packs refs/seed/stash + its objects)
 *   3. Upload to /v1/files
 *   4. Cleanup refs/seed/stash (don't pollute user's repo)
 *   5. Caller sets seed_bundle_file_id on SessionContext
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { stat, unlink } from 'fs/promises'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 接入 FilesApiConfig、uploadFile 服务层能力，把外部通信或共享状态交给 ../../services/api/filesApi.js 处理。
import { type FilesApiConfig, uploadFile } from '../../services/api/filesApi.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 execFileNoThrowWithCwd，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from '../execFileNoThrow.js'
// 引入 findGitRoot、gitExe，将 ../git.js 中已经封装好的能力接到本文件流程里。
import { findGitRoot, gitExe } from '../git.js'
// 引入 generateTempFilePath，将 ../tempfile.js 中已经封装好的能力接到本文件流程里。
import { generateTempFilePath } from '../tempfile.js'

// Tunable via tengu_ccr_bundle_max_bytes.
// DEFAULT_BUNDLE_MAX_BYTES 集合保存`100 * 1024 * 1024`，供后续判断或组装使用。
const DEFAULT_BUNDLE_MAX_BYTES = 100 * 1024 * 1024

// BundleScope 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BundleScope = 'all' | 'head' | 'squashed'

// BundleUploadResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type BundleUploadResult =
  | {
      success: true
      fileId: string
      bundleSizeBytes: number
      scope: BundleScope
      hasWip: boolean
    }
  | { success: false; error: string; failReason?: BundleFailReason }

// BundleFailReason 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BundleFailReason = 'git_error' | 'too_large' | 'empty_repo'

// BundleCreateResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BundleCreateResult =
  | { ok: true; size: number; scope: BundleScope }
  | { ok: false; error: string; failReason: BundleFailReason }

// Bundle --all → HEAD → squashed-root. HEAD drops side branches/tags but
// keeps full current-branch history. Squashed-root is a single parentless
// commit of HEAD's tree (or the stash tree if WIP exists) — no history,
// just the snapshot. Receiver needs refs/seed/root handling for that tier.
// _bundleWithFallback 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function _bundleWithFallback(
  gitRoot: string,
  bundlePath: string,
  maxBytes: number,
  hasStash: boolean,
  signal: AbortSignal | undefined,
): Promise<BundleCreateResult> {
  // --all picks up refs/seed/stash; HEAD needs it explicit.
  // extra读取 `hasStash ? ['refs/seed/stash'] : []` 对应条目，后续围绕该成员继续处理。
  const extra = hasStash ? ['refs/seed/stash'] : []
  // mkBundle封装成回调，供共享工具 git Bundle在事件触发或异步步骤中调用。
  const mkBundle = (base: string) =>
    execFileNoThrowWithCwd(
      gitExe(),
      ['bundle', 'create', bundlePath, base, ...extra],
      { cwd: gitRoot, abortSignal: signal },
    )

  // allResult保存`mkBundle`，供共享工具后续处理使用。
  const allResult = await mkBundle('--all')
  // `allResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (allResult.code !== 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ok: false,
      error: `git bundle create --all failed (${allResult.code}): ${allResult.stderr.slice(0, 200)}`,
      failReason: 'git_error',
    }
  }

  // 从 `await stat(bundlePath)` 解构 size，减少共享工具 git Bundle对同一对象的重复访问。
  const { size: allSize } = await stat(bundlePath)
  // 满足 `allSize <= maxBytes` 时，共享工具执行该分支。
  if (allSize <= maxBytes) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { ok: true, size: allSize, scope: 'all' }
  }

  // bundle create overwrites in place.
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[gitBundle] --all bundle is ${(allSize / 1024 / 1024).toFixed(1)}MB (> ${(maxBytes / 1024 / 1024).toFixed(0)}MB), retrying HEAD-only`,
  )
  // headResult保存`mkBundle`，供共享工具后续处理使用。
  const headResult = await mkBundle('HEAD')
  // `headResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (headResult.code !== 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ok: false,
      error: `git bundle create HEAD failed (${headResult.code}): ${headResult.stderr.slice(0, 200)}`,
      failReason: 'git_error',
    }
  }

  // 从 `await stat(bundlePath)` 解构 size，减少共享工具 git Bundle对同一对象的重复访问。
  const { size: headSize } = await stat(bundlePath)
  // 满足 `headSize <= maxBytes` 时，共享工具执行该分支。
  if (headSize <= maxBytes) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { ok: true, size: headSize, scope: 'head' }
  }

  // Last resort: squash to a single parentless commit. Uses the stash tree
  // when WIP exists (bakes uncommitted changes in — can't bundle the stash
  // ref separately since its parents would drag history back).
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[gitBundle] HEAD bundle is ${(headSize / 1024 / 1024).toFixed(1)}MB, retrying squashed-root`,
  )
  // treeRef 引用 命名 `hasStash ? 'refs/seed/stash^{tree}' : 'HEAD^{tree}'`，让后续代码直接表达这个值的用途。
  const treeRef = hasStash ? 'refs/seed/stash^{tree}' : 'HEAD^{tree}'
  // commitTree保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const commitTree = await execFileNoThrowWithCwd(
    gitExe(),
    ['commit-tree', treeRef, '-m', 'seed'],
    { cwd: gitRoot, abortSignal: signal },
  )
  // `commitTree.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (commitTree.code !== 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ok: false,
      error: `git commit-tree failed (${commitTree.code}): ${commitTree.stderr.slice(0, 200)}`,
      failReason: 'git_error',
    }
  }
  // squashedSha格式化`stdout.trim`，供共享工具后续处理使用。
  const squashedSha = commitTree.stdout.trim()
  // 等待 `execFileNoThrowWithCwd(` 完成，再继续共享工具 git Bundle的异步流程。
  await execFileNoThrowWithCwd(
    gitExe(),
    ['update-ref', 'refs/seed/root', squashedSha],
    { cwd: gitRoot },
  )
  // squashResult保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const squashResult = await execFileNoThrowWithCwd(
    gitExe(),
    ['bundle', 'create', bundlePath, 'refs/seed/root'],
    { cwd: gitRoot, abortSignal: signal },
  )
  // `squashResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (squashResult.code !== 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ok: false,
      error: `git bundle create refs/seed/root failed (${squashResult.code}): ${squashResult.stderr.slice(0, 200)}`,
      failReason: 'git_error',
    }
  }
  // 从 `await stat(bundlePath)` 解构 size，减少共享工具 git Bundle对同一对象的重复访问。
  const { size: squashSize } = await stat(bundlePath)
  // 满足 `squashSize <= maxBytes` 时，共享工具执行该分支。
  if (squashSize <= maxBytes) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { ok: true, size: squashSize, scope: 'squashed' }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ok: false,
    error:
      'Repo is too large to bundle. Please setup GitHub on https://claude.ai/code',
    failReason: 'too_large',
  }
}

// Bundle the repo and upload to Files API; return file_id for
// seed_bundle_file_id. --all → HEAD → squashed-root fallback chain.
// Tracked WIP via stash create → refs/seed/stash (or baked into the
// squashed tree); untracked not captured.
// createAndUploadGitBundle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createAndUploadGitBundle(
  config: FilesApiConfig,
  opts?: { cwd?: string; signal?: AbortSignal },
): Promise<BundleUploadResult> {
  // workdir读取`getCwd`，供共享工具后续处理使用。
  const workdir = opts?.cwd ?? getCwd()
  // gitRoot筛选`findGitRoot`，供共享工具后续处理使用。
  const gitRoot = findGitRoot(workdir)
  // gitRoot缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gitRoot) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: false, error: 'Not in a git repository' }
  }

  // Sweep stale refs from a crashed prior run before --all bundles them.
  // Runs before the empty-repo check so it's never skipped by an early return.
  // 按顺序遍历 `['refs/seed/stash', 'refs/seed/root']` 中的ref 引用，逐个交给共享工具处理。
  for (const ref of ['refs/seed/stash', 'refs/seed/root']) {
    // 等待 `execFileNoThrowWithCwd(gitExe(), ['update-ref', '-d', ref], {` 完成，再继续共享工具 git Bundle的异步流程。
    await execFileNoThrowWithCwd(gitExe(), ['update-ref', '-d', ref], {
      cwd: gitRoot,
    })
  }

  // `git bundle create` refuses to create an empty bundle (exit 128), and
  // `stash create` fails with "You do not have the initial commit yet".
  // Check for any refs (not just HEAD) so orphan branches with commits
  // elsewhere still bundle — `--all` packs those refs regardless of HEAD.
  // refCheck保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const refCheck = await execFileNoThrowWithCwd(
    gitExe(),
    ['for-each-ref', '--count=1', 'refs/'],
    { cwd: gitRoot },
  )
  // 只有 `refCheck.code === 0 && refCheck.stdout.trim() === ''` 满足时，共享工具才执行该分支。
  if (refCheck.code === 0 && refCheck.stdout.trim() === '') {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_ccr_bundle_upload', {
      outcome:
        'empty_repo' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: 'Repository has no commits yet',
      failReason: 'empty_repo',
    }
  }

  // stash create writes a dangling commit — doesn't touch refs/stash or
  // the working tree. Untracked files intentionally excluded.
  // stashResult保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const stashResult = await execFileNoThrowWithCwd(
    gitExe(),
    ['stash', 'create'],
    { cwd: gitRoot, abortSignal: opts?.signal },
  )
  // exit 0 + empty stdout = nothing to stash. Nonzero is rare; non-fatal.
  // wipStashSha格式化`stdout.trim`，供共享工具后续处理使用。
  const wipStashSha = stashResult.code === 0 ? stashResult.stdout.trim() : ''
  // hasWip标记共享工具 git Bundle是否启用对应路径。
  const hasWip = wipStashSha !== ''
  // `stashResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (stashResult.code !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[gitBundle] git stash create failed (${stashResult.code}), proceeding without WIP: ${stashResult.stderr.slice(0, 200)}`,
    )
  // 共享工具 git Bundle在这里处理 `} else if (hasWip) {`，完成这一小步状态转换。
  } else if (hasWip) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[gitBundle] Captured WIP as stash ${wipStashSha}`)
    // env-runner reads the SHA via bundle list-heads refs/seed/stash.
    // 等待 `execFileNoThrowWithCwd(` 完成，再继续共享工具 git Bundle的异步流程。
    await execFileNoThrowWithCwd(
      gitExe(),
      ['update-ref', 'refs/seed/stash', wipStashSha],
      { cwd: gitRoot },
    )
  }

  // bundlePath 路径数据保存`generateTempFilePath`，供共享工具后续处理使用。
  const bundlePath = generateTempFilePath('ccr-seed', '.bundle')

  // git leaves a partial file on nonzero exit (e.g. empty-repo 128).
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // maxBytes 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const maxBytes =
      getFeatureValue_CACHED_MAY_BE_STALE<number | null>(
        'tengu_ccr_bundle_max_bytes',
        null,
      ) ?? DEFAULT_BUNDLE_MAX_BYTES

    // bundle保存`_bundleWithFallback`，供共享工具后续处理使用。
    const bundle = await _bundleWithFallback(
      gitRoot,
      bundlePath,
      maxBytes,
      hasWip,
      opts?.signal,
    )

    // bundle.ok缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!bundle.ok) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[gitBundle] ${bundle.error}`)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_ccr_bundle_upload', {
        outcome:
          bundle.failReason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        max_bytes: maxBytes,
      })
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        success: false,
        error: bundle.error,
        failReason: bundle.failReason,
      }
    }

    // Fixed relativePath so CCR can locate it.
    // upload读取`uploadFile`，供共享工具后续处理使用。
    const upload = await uploadFile(bundlePath, '_source_seed.bundle', config, {
      signal: opts?.signal,
    })

    // upload.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!upload.success) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_ccr_bundle_upload', {
        outcome:
          'failed' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false, error: upload.error }
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[gitBundle] Uploaded ${upload.size} bytes as file_id ${upload.fileId}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_ccr_bundle_upload', {
      outcome:
        'success' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      size_bytes: upload.size,
      scope:
        bundle.scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      has_wip: hasWip,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: true,
      fileId: upload.fileId,
      bundleSizeBytes: upload.size,
      scope: bundle.scope,
      hasWip,
    }
  } finally {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(bundlePath)` 完成，再继续共享工具 git Bundle的异步流程。
      await unlink(bundlePath)
    } catch {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[gitBundle] Could not delete ${bundlePath} (non-fatal)`)
    }
    // Always delete — also sweeps a stale ref from a crashed prior run.
    // update-ref -d on a missing ref exits 0.
    // 按顺序遍历 `['refs/seed/stash', 'refs/seed/root']` 中的ref 引用，逐个交给共享工具处理。
    for (const ref of ['refs/seed/stash', 'refs/seed/root']) {
      // 等待 `execFileNoThrowWithCwd(gitExe(), ['update-ref', '-d', ref], {` 完成，再继续共享工具 git Bundle的异步流程。
      await execFileNoThrowWithCwd(gitExe(), ['update-ref', '-d', ref], {
        cwd: gitRoot,
      })
    }
  }
}
