// 类型依赖 { StructuredPatchHunk } 来自 diff，用于校准React hook 状态流的数据契约。
import type { StructuredPatchHunk } from 'diff'
// 引入 useEffect、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useMemo, useState } from 'react'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  fetchGitDiff,
  fetchGitDiffHunks,
  type GitDiffResult,
  type GitDiffStats,
} from '../utils/gitDiff.js'

// MAX_LINES_PER_FILE 文件数据保存`400`，供React hook use Diff D...后续判断或输出使用。
const MAX_LINES_PER_FILE = 400

// DiffFile 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type DiffFile = {
  path: string
  linesAdded: number
  linesRemoved: number
  isBinary: boolean
  isLargeFile: boolean
  isTruncated: boolean
  isNewFile?: boolean
  isUntracked?: boolean
}

// DiffData 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type DiffData = {
  stats: GitDiffStats | null
  files: DiffFile[]
  hunks: Map<string, StructuredPatchHunk[]>
  loading: boolean
}

/**
 * Hook to fetch current git diff data on demand.
 * Fetches both stats and hunks when component mounts.
 */
// useDiffData 封装useDiffData的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useDiffData(): DiffData {
  // diffResult 由 React state 持有，setDiffResult 会在用户操作或异步结果返回时触发刷新。
  const [diffResult, setDiffResult] = useState<GitDiffResult | null>(null)
  // 从 `useState<Map<string, StructuredPatchHunk[]>>(` 按位置拆出 hunks、setHunks，让React hook use Diff Data分别处理这些返回值。
  const [hunks, setHunks] = useState<Map<string, StructuredPatchHunk[]>>(
    new Map(),
  )
  // 加载状态 由 React state 持有，setLoading 会在用户操作或异步结果返回时触发刷新。
  const [loading, setLoading] = useState(true)

  // Fetch diff data on mount
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // cancelled标记React hook use Diff D...是否启用对应路径。
    let cancelled = false

    // loadDiffData 封装useDiffData的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    async function loadDiffData() {
      // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
      try {
        // Fetch both stats and hunks
        // 并行获取 statsResult、hunksResult，缩短React hook use Diff Data等待多个独立异步任务的时间。
        const [statsResult, hunksResult] = await Promise.all([
          fetchGitDiff(),
          fetchGitDiffHunks(),
        ])

        // cancelled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!cancelled) {
          // setDiffResult 写入新的状态值，使React hook 状态流后续读取保持一致。
          setDiffResult(statsResult)
          // setHunks 写入新的状态值，使React hook 状态流后续读取保持一致。
          setHunks(hunksResult)
          // setLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
          setLoading(false)
        }
      } catch (_error) {
        // cancelled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!cancelled) {
          // setDiffResult 写入新的状态值，使React hook 状态流后续读取保持一致。
          setDiffResult(null)
          // setHunks 写入新的状态值，使React hook 状态流后续读取保持一致。
          setHunks(new Map())
          // setLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
          setLoading(false)
        }
      }
    }

    // 显式忽略 `loadDiffData()` 的返回值，只保留它触发的副作用。
    void loadDiffData()

    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // cancelled更新为 `true`，确保useDiffData后续读取最新状态。
      cancelled = true
    }
  }, [])

  // 返回 `useMemo(() => {`，作为React hook 状态流这次计算的结果。
  return useMemo(() => {
    // diffResult缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!diffResult) {
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { stats: null, files: [], hunks: new Map(), loading }
    }

    // 从 `diffResult` 解构 stats、perFileStats，减少React hook use Diff Data对同一对象的重复访问。
    const { stats, perFileStats } = diffResult
    // files 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
    const files: DiffFile[] = []

    // Iterate over perFileStats to get all files including large/skipped ones
    // 循环处理 `const [path, fileStats] of perFileStats`，让React hook 状态流逐项把同类条目按顺序走完。
    for (const [path, fileStats] of perFileStats) {
      // fileHunks 文件数据读取`hunks.get`，供React hook后续处理使用。
      const fileHunks = hunks.get(path)
      // isUntracked标记React hook use Diff D...是否启用对应路径。
      const isUntracked = fileStats.isUntracked ?? false

      // Detect large file (in perFileStats but not in hunks, and not binary/untracked)
      // isLargeFile 文件数据标记React hook use Diff D...是否启用对应路径。
      const isLargeFile = !fileStats.isBinary && !isUntracked && !fileHunks

      // Detect truncated file (total > limit means we truncated)
      // totalLines 集合保存`fileStats.added + fileStats.removed`，供React hook use Diff D...后续判断或输出使用。
      const totalLines = fileStats.added + fileStats.removed
      // isTruncated 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isTruncated =
        !isLargeFile && !fileStats.isBinary && totalLines > MAX_LINES_PER_FILE

      // files 文件数据追加新条目，保持收集顺序与输入顺序一致。
      files.push({
        path,
        linesAdded: fileStats.added,
        linesRemoved: fileStats.removed,
        isBinary: fileStats.isBinary,
        isLargeFile,
        isTruncated,
        isUntracked,
      })
    }

    // 调用 files.sort，触发React hook此处需要的副作用。
    files.sort((a, b) => a.path.localeCompare(b.path))

    // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
    return { stats, files, hunks, loading: false }
  }, [diffResult, hunks, loading])
}
