/**
 * Shell-agnostic git operation tracking for usage metrics.
 *
 * Detects `git commit`, `git push`, `gh pr create`, `glab mr create`, and
 * curl-based PR creation in command strings, then increments OTLP counters
 * and fires analytics events. The regexes operate on raw command text so they
 * work identically for Bash and PowerShell (both invoke git/gh/glab/curl as
 * external binaries with the same argv syntax).
 */

// 引入 getCommitCounter、getPrCounter，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getCommitCounter, getPrCounter } from '../../bootstrap/state.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'

/**
 * Build a regex that matches `git <subcmd>` while tolerating git's global
 * options between `git` and the subcommand (e.g. `-c key=val`, `-C path`,
 * `--git-dir=path`). Common when the model retries with
 * `git -c commit.gpgsign=false commit` after a signing failure.
 */
// gitCmdRe 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function gitCmdRe(subcmd: string, suffix = ''): RegExp {
  // 返回 `new RegExp(`，作为工具调用这次计算的结果。
  return new RegExp(
    `\\bgit(?:\\s+-[cC]\\s+\\S+|\\s+--\\S+=\\S+)*\\s+${subcmd}\\b${suffix}`,
  )
}

// GIT_COMMIT_RE保存`gitCmdRe`，供工具调用后续处理使用。
const GIT_COMMIT_RE = gitCmdRe('commit')
// GIT_PUSH_RE保存`gitCmdRe`，供工具调用后续处理使用。
const GIT_PUSH_RE = gitCmdRe('push')
// GIT_CHERRY_PICK_RE保存`gitCmdRe`，供工具调用后续处理使用。
const GIT_CHERRY_PICK_RE = gitCmdRe('cherry-pick')
// GIT_MERGE_RE保存`gitCmdRe`，供工具调用后续处理使用。
const GIT_MERGE_RE = gitCmdRe('merge', '(?!-)')
// GIT_REBASE_RE保存`gitCmdRe`，供工具调用后续处理使用。
const GIT_REBASE_RE = gitCmdRe('rebase')

// CommitKind 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type CommitKind = 'committed' | 'amended' | 'cherry-picked'
// BranchAction 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type BranchAction = 'merged' | 'rebased'
// PrAction 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type PrAction =
  | 'created'
  | 'edited'
  | 'merged'
  | 'commented'
  | 'closed'
  | 'ready'

// GH_PR_ACTIONS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const GH_PR_ACTIONS: readonly { re: RegExp; action: PrAction; op: string }[] = [
  { re: /\bgh\s+pr\s+create\b/, action: 'created', op: 'pr_create' },
  { re: /\bgh\s+pr\s+edit\b/, action: 'edited', op: 'pr_edit' },
  { re: /\bgh\s+pr\s+merge\b/, action: 'merged', op: 'pr_merge' },
  { re: /\bgh\s+pr\s+comment\b/, action: 'commented', op: 'pr_comment' },
  { re: /\bgh\s+pr\s+close\b/, action: 'closed', op: 'pr_close' },
  { re: /\bgh\s+pr\s+ready\b/, action: 'ready', op: 'pr_ready' },
]

/**
 * Parse PR info from a GitHub PR URL.
 * Returns { prNumber, prUrl, prRepository } or null if not a valid PR URL.
 */
// parsePrUrl 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parsePrUrl(
  url: string,
): { prNumber: number; prUrl: string; prRepository: string } | null {
  // match匹配`url.match`，供工具调用后续处理使用。
  const match = url.match(/https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/)
  // 只有 `match?.[1] && match?.[2]` 满足时，工具调用才执行该分支。
  if (match?.[1] && match?.[2]) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      prNumber: parseInt(match[2], 10),
      prUrl: url,
      prRepository: match[1],
    }
  }
  // 返回 `null`，作为工具调用这次计算的结果。
  return null
}

/** Find a GitHub PR URL embedded anywhere in stdout and parse it. */
// findPrInStdout 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findPrInStdout(stdout: string): ReturnType<typeof parsePrUrl> {
  // m匹配`stdout.match`，供工具调用后续处理使用。
  const m = stdout.match(/https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+/)
  // 返回 `m ? parsePrUrl(m[0]) : null`，作为工具调用这次计算的结果。
  return m ? parsePrUrl(m[0]) : null
}

// Exported for testing purposes
// parseGitCommitId 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseGitCommitId(stdout: string): string | undefined {
  // git commit output: [branch abc1234] message
  // or for root commit: [branch (root-commit) abc1234] message
  // match匹配`stdout.match`，供工具调用后续处理使用。
  const match = stdout.match(/\[[\w./-]+(?: \(root-commit\))? ([0-9a-f]+)\]/)
  // 返回 `match?.[1]`，作为工具调用这次计算的结果。
  return match?.[1]
}

/**
 * Parse branch name from git push output. Push writes progress to stderr but
 * the ref update line ("abc..def  branch -> branch", "* [new branch]
 * branch -> branch", or " + abc...def  branch -> branch (forced update)") is
 * the signal. Works on either stdout or stderr. Git prefixes each ref line
 * with a status flag (space, +, -, *, !, =); the char class tolerates any.
 */
// parseGitPushBranch 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseGitPushBranch(output: string): string | undefined {
  // match匹配`output.match`，供工具调用后续处理使用。
  const match = output.match(
    /^\s*[+\-*!= ]?\s*(?:\[new branch\]|\S+\.\.+\S+)\s+\S+\s*->\s*(\S+)/m,
  )
  // 返回 `match?.[1]`，作为工具调用这次计算的结果。
  return match?.[1]
}

/**
 * gh pr merge/close/ready print "✓ <Verb> pull request owner/repo#1234" with
 * no URL. Extract the PR number from the text.
 */
// parsePrNumberFromText 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parsePrNumberFromText(stdout: string): number | undefined {
  // match匹配`stdout.match`，供工具调用后续处理使用。
  const match = stdout.match(/[Pp]ull request (?:\S+#)?#?(\d+)/)
  // 返回 `match?.[1] ? parseInt(match[1], 10) : undefined`，作为工具调用这次计算的结果。
  return match?.[1] ? parseInt(match[1], 10) : undefined
}

/**
 * Extract target ref from `git merge <ref>` / `git rebase <ref>` command.
 * Skips flags and keywords — first non-flag argument is the ref.
 */
// parseRefFromCommand 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseRefFromCommand(
  command: string,
  verb: string,
): string | undefined {
  // after格式化`command.split`，供工具调用后续处理使用。
  const after = command.split(gitCmdRe(verb))[1]
  // after缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!after) return undefined
  // 逐项读取 `after.trim().split(/\s+/)` 中的t，按输入顺序推进工具调用。
  for (const t of after.trim().split(/\s+/)) {
    // 满足 `/^[&|;><]/.test(t)` 时，工具调用执行该分支。
    if (/^[&|;><]/.test(t)) break
    // 满足 `t.startsWith('-')` 时，工具调用执行该分支。
    if (t.startsWith('-')) continue
    // 返回 `t`，作为工具调用这次计算的结果。
    return t
  }
  // 返回 `undefined`，作为工具调用这次计算的结果。
  return undefined
}

/**
 * Scan bash command + output for git operations worth surfacing in the
 * collapsed tool-use summary ("committed a1b2c3, created PR #42, ran 3 bash
 * commands"). Checks the command to avoid matching SHAs/URLs that merely
 * appear in unrelated output (e.g. `git log`).
 *
 * Pass stdout+stderr concatenated — git push writes the ref update to stderr.
 */
// detectGitOperation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectGitOperation(
  command: string,
  output: string,
): {
  commit?: { sha: string; kind: CommitKind }
  push?: { branch: string }
  branch?: { ref: string; action: BranchAction }
  pr?: { number: number; url?: string; action: PrAction }
} {
  // 结果 从空对象开始收集键值，后续按名称补齐内容。
  const result: ReturnType<typeof detectGitOperation> = {}
  // commit and cherry-pick both produce "[branch sha] msg" output
  // isCherryPick记录 `GIT_CHERRY_PICK_RE.test` 是否成立，工具调用随后按该结果分支。
  const isCherryPick = GIT_CHERRY_PICK_RE.test(command)
  // 只有 `GIT_COMMIT_RE.test(command) || isCherryPick` 满足时，工具调用才执行该分支。
  if (GIT_COMMIT_RE.test(command) || isCherryPick) {
    // sha解析`parseGitCommitId`，供工具调用后续处理使用。
    const sha = parseGitCommitId(output)
    // 满足 `sha` 时，工具调用执行该分支。
    if (sha) {
      // commit更新为 `{`，确保工具调用后续读取最新状态。
      result.commit = {
        sha: sha.slice(0, 6),
        kind: isCherryPick
          ? 'cherry-picked'
          : /--amend\b/.test(command)
            ? 'amended'
            : 'committed',
      }
    }
  }
  // 满足 `GIT_PUSH_RE.test(command)` 时，工具调用执行该分支。
  if (GIT_PUSH_RE.test(command)) {
    // branch解析`parseGitPushBranch`，供工具调用后续处理使用。
    const branch = parseGitPushBranch(output)
    // 满足 `branch` 时，工具调用执行该分支。
    if (branch) result.push = { branch }
  }
  // 工具调用在这里按实际状态进入对应分支。
  if (
    GIT_MERGE_RE.test(command) &&
    /(Fast-forward|Merge made by)/.test(output)
  ) {
    // ref 引用解析`parseRefFromCommand`，供工具调用后续处理使用。
    const ref = parseRefFromCommand(command, 'merge')
    // 满足 `ref` 时，工具调用执行该分支。
    if (ref) result.branch = { ref, action: 'merged' }
  }
  // 只有 `GIT_REBASE_RE.test(command) && /Successfully rebased/.test(output)` 满足时，工具调用才执行该分支。
  if (GIT_REBASE_RE.test(command) && /Successfully rebased/.test(output)) {
    // ref 引用解析`parseRefFromCommand`，供工具调用后续处理使用。
    const ref = parseRefFromCommand(command, 'rebase')
    // 满足 `ref` 时，工具调用执行该分支。
    if (ref) result.branch = { ref, action: 'rebased' }
  }
  // prAction筛选`GH_PR_ACTIONS.find`，供工具调用后续处理使用。
  const prAction = GH_PR_ACTIONS.find(a => a.re.test(command))?.action
  // 满足 `prAction` 时，工具调用执行该分支。
  if (prAction) {
    // pr筛选`findPrInStdout`，供工具调用后续处理使用。
    const pr = findPrInStdout(output)
    // 满足 `pr` 时，工具调用执行该分支。
    if (pr) {
      // pr更新为 `{ number: pr.prNumber, url: pr.prUrl, action: prAction }`，确保工具调用后续读取最新状态。
      result.pr = { number: pr.prNumber, url: pr.prUrl, action: prAction }
    } else {
      // num解析`parsePrNumberFromText`，供工具调用后续处理使用。
      const num = parsePrNumberFromText(output)
      // 满足 `num` 时，工具调用执行该分支。
      if (num) result.pr = { number: num, action: prAction }
    }
  }
  // 返回 `result`，作为工具调用这次计算的结果。
  return result
}

// Exported for testing purposes
// trackGitOperations 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function trackGitOperations(
  command: string,
  exitCode: number,
  stdout?: string,
): void {
  // success 集合标记工具实现 git Operation Tracking是否启用对应路径。
  const success = exitCode === 0
  // success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!success) {
    // 工具实现 git Operation Tracking在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `GIT_COMMIT_RE.test(command)` 时，工具调用执行该分支。
  if (GIT_COMMIT_RE.test(command)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_git_operation', {
      operation:
        'commit' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 满足 `command.match(/--amend\b/)` 时，工具调用执行该分支。
    if (command.match(/--amend\b/)) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_git_operation', {
        operation:
          'commit_amend' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
    }
    // 调用 getCommitCounter，触发工具调用此处需要的副作用。
    getCommitCounter()?.add(1)
  }
  // 满足 `GIT_PUSH_RE.test(command)` 时，工具调用执行该分支。
  if (GIT_PUSH_RE.test(command)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_git_operation', {
      operation:
        'push' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }
  // prHit筛选`GH_PR_ACTIONS.find`，供工具调用后续处理使用。
  const prHit = GH_PR_ACTIONS.find(a => a.re.test(command))
  // 满足 `prHit` 时，工具调用执行该分支。
  if (prHit) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_git_operation', {
      operation:
        prHit.op as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }
  // 当 `prHit?.action` 匹配 `'created'` 时，工具调用执行对应分支。
  if (prHit?.action === 'created') {
    // 调用 getPrCounter，触发工具调用此处需要的副作用。
    getPrCounter()?.add(1)
    // Auto-link session to PR if we can extract PR URL from stdout
    // 满足 `stdout` 时，工具调用执行该分支。
    if (stdout) {
      // prInfo筛选`findPrInStdout`，供工具调用后续处理使用。
      const prInfo = findPrInStdout(stdout)
      // 满足 `prInfo` 时，工具调用执行该分支。
      if (prInfo) {
        // Import is done dynamically to avoid circular dependency
        // 显式忽略 `import('../../utils/sessionStorage.js').then(` 的返回值，只保留它触发的副作用。
        void import('../../utils/sessionStorage.js').then(
          // 这个回调绑定到 ({ linkSessionToPR }) => {，负责工具调用在该局部场景下的响应。
          ({ linkSessionToPR }) => {
            // 这个回调绑定到 void import('../../bootstrap/state.js').then(({ getSessionId }) => {，负责工具调用在该局部场景下的响应。
            void import('../../bootstrap/state.js').then(({ getSessionId }) => {
              // sessionId 会话数据读取`getSessionId`，供工具调用后续处理使用。
              const sessionId = getSessionId()
              // 满足 `sessionId` 时，工具调用执行该分支。
              if (sessionId) {
                // 显式忽略 `linkSessionToPR(` 的返回值，只保留它触发的副作用。
                void linkSessionToPR(
                  sessionId as `${string}-${string}-${string}-${string}-${string}`,
                  prInfo.prNumber,
                  prInfo.prUrl,
                  prInfo.prRepository,
                )
              }
            })
          },
        )
      }
    }
  }
  // 满足 `command.match(/\bglab\s+mr\s+create\b/)` 时，工具调用执行该分支。
  if (command.match(/\bglab\s+mr\s+create\b/)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_git_operation', {
      operation:
        'pr_create' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 调用 getPrCounter，触发工具调用此处需要的副作用。
    getPrCounter()?.add(1)
  }
  // Detect PR creation via curl to REST APIs (Bitbucket, GitHub API, GitLab API)
  // Check for POST method and PR endpoint separately to handle any argument order
  // Also detect implicit POST when -d is used (curl defaults to POST with data)
  // isCurlPost 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isCurlPost =
    command.match(/\bcurl\b/) &&
    (command.match(/-X\s*POST\b/i) ||
      command.match(/--request\s*=?\s*POST\b/i) ||
      command.match(/\s-d\s/))
  // Match PR endpoints in URLs, but not sub-resources like /pulls/123/comments
  // Require https?:// prefix to avoid matching text in POST body or other params
  // isPrEndpoint记录 `command.match` 是否成立，工具调用随后按该结果分支。
  const isPrEndpoint = command.match(
    /https?:\/\/[^\s'"]*\/(pulls|pull-requests|merge[-_]requests)(?!\/\d)/i,
  )
  // 只有 `isCurlPost && isPrEndpoint` 满足时，工具调用才执行该分支。
  if (isCurlPost && isPrEndpoint) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_git_operation', {
      operation:
        'pr_create' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // getPrCounter执行工具调用在此处需要的副作用或外部交互。
    getPrCounter()?.add(1)
  }
}
