// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'
// 引入 getBranch、getDefaultBranch、getIsGit，将 ./git.js 中已经封装好的能力接到本文件流程里。
import { getBranch, getDefaultBranch, getIsGit } from './git.js'
// 引入 jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from './slowOperations.js'

// PrReviewState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PrReviewState =
  | 'approved'
  | 'pending'
  | 'changes_requested'
  | 'draft'
  | 'merged'
  | 'closed'

// PrStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PrStatus = {
  number: number
  url: string
  reviewState: PrReviewState
}

// GH_TIMEOUT_MS 集合 命名 `5000`，让后续代码直接表达这个值的用途。
const GH_TIMEOUT_MS = 5000

/**
 * Derive review state from GitHub API values.
 * Draft PRs always show as 'draft' regardless of reviewDecision.
 * reviewDecision can be: APPROVED, CHANGES_REQUESTED, REVIEW_REQUIRED, or empty string.
 */
// deriveReviewState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function deriveReviewState(
  isDraft: boolean,
  reviewDecision: string,
): PrReviewState {
  // 满足 `isDraft` 时，共享工具执行该分支。
  if (isDraft) return 'draft'
  // 按照 reviewDecision 的取值选择共享工具的具体处理分支。
  switch (reviewDecision) {
    case 'APPROVED':
      // 返回 `'approved'`，作为共享工具这次计算的结果。
      return 'approved'
    case 'CHANGES_REQUESTED':
      // 返回 `'changes_requested'`，作为共享工具这次计算的结果。
      return 'changes_requested'
    default:
      // 返回 `'pending'`，作为共享工具这次计算的结果。
      return 'pending'
  }
}

/**
 * Fetch PR status for the current branch using `gh pr view`.
 * Returns null on any failure (gh not installed, no PR, not in git repo, etc).
 * Also returns null if the PR's head branch is the default branch (e.g., main/master).
 */
// fetchPrStatus 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchPrStatus(): Promise<PrStatus | null> {
  // isGit记录 `getIsGit` 是否成立，共享工具随后按该结果分支。
  const isGit = await getIsGit()
  // isGit缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isGit) return null

  // Skip on the default branch — `gh pr view` returns the most recently
  // merged PR there, which is misleading.
  // 并行获取 branch、defaultBranch，缩短共享工具 gh Pr Status等待多个独立异步任务的时间。
  const [branch, defaultBranch] = await Promise.all([
    getBranch(),
    getDefaultBranch(),
  ])
  // 满足 `branch === defaultBranch` 时，共享工具执行该分支。
  if (branch === defaultBranch) return null

  // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 gh Pr Status对同一对象的重复访问。
  const { stdout, code } = await execFileNoThrow(
    'gh',
    [
      'pr',
      'view',
      '--json',
      'number,url,reviewDecision,isDraft,headRefName,state',
    ],
    { timeout: GH_TIMEOUT_MS, preserveOutputOnError: false },
  )

  // `code` 与 `0 || !stdout.trim()` 不一致时刷新派生状态，避免使用过期结果。
  if (code !== 0 || !stdout.trim()) return null

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // data解析`jsonParse`，供共享工具后续处理使用。
    const data = jsonParse(stdout) as {
      number: number
      url: string
      reviewDecision: string
      isDraft: boolean
      headRefName: string
      state: string
    }

    // Don't show PR status for PRs from the default branch (e.g., main, master)
    // This can happen when someone opens a PR from main to another branch
    // 共享工具在这里按实际状态进入对应分支。
    if (
      data.headRefName === defaultBranch ||
      data.headRefName === 'main' ||
      data.headRefName === 'master'
    ) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Don't show PR status for merged or closed PRs — `gh pr view` returns
    // the most recently associated PR for a branch, which may be merged/closed.
    // The status line should only display open PRs.
    // 当 `data.state` 匹配 `'MERGED' || data.state === ...` 时，共享工具执行对应分支。
    if (data.state === 'MERGED' || data.state === 'CLOSED') {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      number: data.number,
      url: data.url,
      reviewState: deriveReviewState(data.isDraft, data.reviewDecision),
    }
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}
