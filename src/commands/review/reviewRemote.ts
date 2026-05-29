/**
 * Teleported /ultrareview execution. Creates a CCR session with the current repo,
 * sends the review prompt as the initial message, and registers a
 * RemoteAgentTask so the polling loop pipes results back into the local
 * session via task-notification. Mirrors the /ultraplan → CCR flow.
 *
 * TODO(#22051): pass useBundleMode once landed so local-only / uncommitted
 * repo state is captured. The GitHub-clone path (current) only works for
 * pushed branches on repos with the Claude GitHub app installed.
 */

// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.js，用于校准命令处理的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 fetchUltrareviewQuota 服务层能力，把外部通信或共享状态交给 ../../services/api/ultrareviewQuota.js 处理。
import { fetchUltrareviewQuota } from '../../services/api/ultrareviewQuota.js'
// 接入 fetchUtilization 服务层能力，把外部通信或共享状态交给 ../../services/api/usage.js 处理。
import { fetchUtilization } from '../../services/api/usage.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准命令处理的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  checkRemoteAgentEligibility,
  formatPreconditionError,
  getRemoteTaskSessionUrl,
  registerRemoteAgentTask,
} from '../../tasks/RemoteAgentTask/RemoteAgentTask.js'
// 复用 isEnterpriseSubscriber、isTeamSubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isEnterpriseSubscriber, isTeamSubscriber } from '../../utils/auth.js'
// 复用 detectCurrentRepositoryWithHost 工具函数，把通用处理留在 ../../utils/detectRepository.js 中维护。
import { detectCurrentRepositoryWithHost } from '../../utils/detectRepository.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../../utils/execFileNoThrow.js'
// 复用 getDefaultBranch、gitExe 工具函数，把通用处理留在 ../../utils/git.js 中维护。
import { getDefaultBranch, gitExe } from '../../utils/git.js'
// 复用 teleportToRemote 工具函数，把通用处理留在 ../../utils/teleport.js 中维护。
import { teleportToRemote } from '../../utils/teleport.js'

// One-time session flag: once the user confirms overage billing via the
// dialog, all subsequent /ultrareview invocations in this session proceed
// without re-prompting.
// sessionOverageConfirmed 会话数据标记命令处理斜杠命令 review Remote是否启用对应路径。
let sessionOverageConfirmed = false

// confirmOverage 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function confirmOverage(): void {
  // sessionOverageConfirmed 会话数据更新为 `true`，确保斜杠命令后续读取最新状态。
  sessionOverageConfirmed = true
}

// OverageGate 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
export type OverageGate =
  | { kind: 'proceed'; billingNote: string }
  | { kind: 'not-enabled' }
  | { kind: 'low-balance'; available: number }
  | { kind: 'needs-confirm' }

/**
 * Determine whether the user can launch an ultrareview and under what
 * billing terms. Fetches quota and utilization in parallel.
 */
// checkOverageGate 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkOverageGate(): Promise<OverageGate> {
  // Team and Enterprise plans include ultrareview — no free-review quota
  // or Extra Usage dialog. The quota endpoint is scoped to consumer plans
  // (pro/max); hitting it on team/ent would surface a confusing dialog.
  // 只有 `isTeamSubscriber() || isEnterpriseSubscriber()` 满足时，命令处理才执行该分支。
  if (isTeamSubscriber() || isEnterpriseSubscriber()) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { kind: 'proceed', billingNote: '' }
  }

  // 并行获取 quota、utilization，缩短斜杠命令 review Remote等待多个独立异步任务的时间。
  const [quota, utilization] = await Promise.all([
    fetchUltrareviewQuota(),
    // 调用 fetchUtilization，触发命令处理此处需要的副作用。
    fetchUtilization().catch(() => null),
  ])

  // No quota info (non-subscriber or endpoint down) — let it through,
  // server-side billing will handle it.
  // quota缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!quota) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { kind: 'proceed', billingNote: '' }
  }

  // 满足 `quota.reviews_remaining > 0` 时，命令处理执行该分支。
  if (quota.reviews_remaining > 0) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      kind: 'proceed',
      billingNote: ` This is free ultrareview ${quota.reviews_used + 1} of ${quota.reviews_limit}.`,
    }
  }

  // Utilization fetch failed (transient network error, timeout, etc.) —
  // let it through, same rationale as the quota fallback above.
  // utilization缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!utilization) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { kind: 'proceed', billingNote: '' }
  }

  // Free reviews exhausted — check Extra Usage setup.
  // extraUsage 命名 `utilization.extra_usage`，让后续代码直接表达这个值的用途。
  const extraUsage = utilization.extra_usage
  // 满足 `!extraUsage?.is_enabled` 时，命令处理执行该分支。
  if (!extraUsage?.is_enabled) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_review_overage_not_enabled', {})
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { kind: 'not-enabled' }
  }

  // Check available balance (null monthly_limit = unlimited).
  // monthlyLimit 命名 `extraUsage.monthly_limit`，让后续代码直接表达这个值的用途。
  const monthlyLimit = extraUsage.monthly_limit
  // usedCredits 集合 命名 `extraUsage.used_credits ?? 0`，让后续代码直接表达这个值的用途。
  const usedCredits = extraUsage.used_credits ?? 0
  // available 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const available =
    monthlyLimit === null || monthlyLimit === undefined
      ? Infinity
      : monthlyLimit - usedCredits

  // 满足 `available < 10` 时，命令处理执行该分支。
  if (available < 10) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_review_overage_low_balance', { available })
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { kind: 'low-balance', available }
  }

  // sessionOverageConfirmed 会话数据缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!sessionOverageConfirmed) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_review_overage_dialog_shown', {})
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { kind: 'needs-confirm' }
  }

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    kind: 'proceed',
    billingNote: ' This review bills as Extra Usage.',
  }
}

/**
 * Launch a teleported review session. Returns ContentBlockParam[] describing
 * the launch outcome for injection into the local conversation (model is then
 * queried with this content, so it can narrate the launch to the user).
 *
 * Returns ContentBlockParam[] with user-facing error messages on recoverable
 * failures (missing merge-base, empty diff, bundle too large), or null on
 * other failures so the caller falls through to the local-review prompt.
 * Reason is captured in analytics.
 *
 * Caller must run checkOverageGate() BEFORE calling this function
 * (ultrareviewCommand.tsx handles the dialog).
 */
// launchRemoteReview 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function launchRemoteReview(
  args: string,
  context: ToolUseContext,
  billingNote?: string,
): Promise<ContentBlockParam[] | null> {
  // eligibility读取`checkRemoteAgentEligibility`，供命令处理后续处理使用。
  const eligibility = await checkRemoteAgentEligibility()
  // Synthetic DEFAULT_CODE_REVIEW_ENVIRONMENT_ID works without per-org CCR
  // setup, so no_remote_environment isn't a blocker. Server-side quota
  // consume at session creation routes billing: first N zero-rate, then
  // anthropic:cccr org-service-key (overage-only).
  // eligibility.eligible缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!eligibility.eligible) {
    // blockers 集合筛选`errors.filter`，供命令处理后续处理使用。
    const blockers = eligibility.errors.filter(
      // e更新为 `> e.type !== 'no_remote_environment'`，确保斜杠命令后续读取最新状态。
      e => e.type !== 'no_remote_environment',
    )
    // 满足 `blockers.length > 0` 时，命令处理执行该分支。
    if (blockers.length > 0) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_review_remote_precondition_failed', {
        precondition_errors: blockers
          // 链式调用 map，继续加工上一行在命令处理中产生的数据。
          .map(e => e.type)
          .join(
            ',',
          ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // reasons 集合派生`blockers.map`，供命令处理后续处理使用。
      const reasons = blockers.map(formatPreconditionError).join('\n')
      // 返回列表结果，保留命令处理已经排好的条目顺序。
      return [
        {
          type: 'text',
          text: `Ultrareview cannot launch:\n${reasons}`,
        },
      ]
    }
  }

  // resolvedBillingNote保存`billingNote ?? ''`，供后续判断或组装使用。
  const resolvedBillingNote = billingNote ?? ''

  // prNumber格式化`args.trim`，供命令处理后续处理使用。
  const prNumber = args.trim()
  // isPrNumber记录 `test` 是否成立，命令处理随后按该结果分支。
  const isPrNumber = /^\d+$/.test(prNumber)
  // Synthetic code_review env. Go taggedid.FromUUID(TagEnvironment,
  // UUID{...,0x02}) encodes with version prefix '01' — NOT Python's
  // legacy tagged_id() format. Verified in prod.
  // CODE_REVIEW_ENV_ID固定为 `'env_011111111111111111111113'`，作为命令处理斜杠命令 review Remote后续展示或比较的基准。
  const CODE_REVIEW_ENV_ID = 'env_011111111111111111111113'
  // Lite-review bypasses bughunter.go entirely, so it doesn't see the
  // webhook's bug_hunter_config (different GB project). These env vars are
  // the only tuning surface — without them, run_hunt.sh's bash defaults
  // apply (60min, 120s agent timeout), and 120s kills verifiers mid-run
  // which causes infinite respawn.
  //
  // total_wallclock must stay below RemoteAgentTask's 30min poll timeout
  // with headroom for finalization (~3min synthesis). Per-field guards
  // match autoDream.ts — GB cache can return stale wrong-type values.
  // 原始文本读取`getFeatureValue_CACHED_MAY_BE_STALE<Record<` 整理出中间结果，供命令处理斜杠命令 review Remote后续步骤使用。
  const raw = getFeatureValue_CACHED_MAY_BE_STALE<Record<
    string,
    unknown
  > | null>('tengu_review_bughunter_config', null)
  // posInt封装成回调，供命令处理斜杠命令 review Remote在事件触发或异步步骤中调用。
  const posInt = (v: unknown, fallback: number, max?: number): number => {
    // `typeof v` 与 `'number' || !Number.isFinite(v)` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof v !== 'number' || !Number.isFinite(v)) return fallback
    // n保存`Math.floor`，供命令处理后续处理使用。
    const n = Math.floor(v)
    // 满足 `n <= 0` 时，命令处理执行该分支。
    if (n <= 0) return fallback
    // 返回 `max !== undefined && n > max ? fallback : n`，作为命令处理这次计算的结果。
    return max !== undefined && n > max ? fallback : n
  }
  // Upper bounds: 27min on wallclock leaves ~3min for finalization under
  // RemoteAgentTask's 30min poll timeout. If GB is set above that, the
  // hang we're fixing comes back — fall to the safe default instead.
  // commonEnvVars 集合 集中保存命令处理斜杠命令 review Remote要一起传递的字段。
  const commonEnvVars = {
    BUGHUNTER_DRY_RUN: '1',
    BUGHUNTER_FLEET_SIZE: String(posInt(raw?.fleet_size, 5, 20)),
    BUGHUNTER_MAX_DURATION: String(posInt(raw?.max_duration_minutes, 10, 25)),
    BUGHUNTER_AGENT_TIMEOUT: String(
      posInt(raw?.agent_timeout_seconds, 600, 1800),
    ),
    BUGHUNTER_TOTAL_WALLCLOCK: String(
      posInt(raw?.total_wallclock_minutes, 22, 27),
    ),
    ...(process.env.BUGHUNTER_DEV_BUNDLE_B64 && {
      BUGHUNTER_DEV_BUNDLE_B64: process.env.BUGHUNTER_DEV_BUNDLE_B64,
    }),
  }

  // session 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let session
  // command 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let command
  // target 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let target
  // 满足 `isPrNumber` 时，命令处理执行该分支。
  if (isPrNumber) {
    // PR mode: refs/pull/N/head via github.com. Orchestrator --pr N.
    // 当前仓库读取`detectCurrentRepositoryWithHost`，供命令处理后续处理使用。
    const repo = await detectCurrentRepositoryWithHost()
    // `!repo || repo.host` 与 `'github.com'` 不一致时刷新派生状态，避免使用过期结果。
    if (!repo || repo.host !== 'github.com') {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_review_remote_precondition_failed', {})
      // 返回 `null`，作为命令处理这次计算的结果。
      return null
    }
    // session 会话数据更新为 `await teleportToRemote({`，确保斜杠命令后续读取最新状态。
    session = await teleportToRemote({
      initialMessage: null,
      description: `ultrareview: ${repo.owner}/${repo.name}#${prNumber}`,
      signal: context.abortController.signal,
      branchName: `refs/pull/${prNumber}/head`,
      environmentId: CODE_REVIEW_ENV_ID,
      environmentVariables: {
        BUGHUNTER_PR_NUMBER: prNumber,
        BUGHUNTER_REPOSITORY: `${repo.owner}/${repo.name}`,
        ...commonEnvVars,
      },
    })
    // 命令更新为 ``/ultrareview ${prNumber}``，确保斜杠命令后续读取最新状态。
    command = `/ultrareview ${prNumber}`
    // target更新为 ``${repo.owner}/${repo.name}#${prNumber}``，确保斜杠命令后续读取最新状态。
    target = `${repo.owner}/${repo.name}#${prNumber}`
  } else {
    // Branch mode: bundle the working tree, orchestrator diffs against
    // the fork point. No PR, no existing comments, no dedup.
    // baseBranch读取`getDefaultBranch`，供命令处理后续处理使用。
    const baseBranch = (await getDefaultBranch()) || 'main'
    // Env-manager's `git remote remove origin` after bundle-clone
    // deletes refs/remotes/origin/* — the base branch name won't resolve
    // in the container. Pass the merge-base SHA instead: it's reachable
    // from HEAD's history so `git diff <sha>` works without a named ref.
    // 从 `await execFileNoThrow(` 解构 stdout、code，减少斜杠命令 review Remote对同一对象的重复访问。
    const { stdout: mbOut, code: mbCode } = await execFileNoThrow(
      gitExe(),
      ['merge-base', baseBranch, 'HEAD'],
      { preserveOutputOnError: false },
    )
    // mergeBaseSha格式化`mbOut.trim`，供命令处理后续处理使用。
    const mergeBaseSha = mbOut.trim()
    // `mbCode` 与 `0 || !mergeBaseSha` 不一致时刷新派生状态，避免使用过期结果。
    if (mbCode !== 0 || !mergeBaseSha) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_review_remote_precondition_failed', {})
      // 返回列表结果，保留命令处理已经排好的条目顺序。
      return [
        {
          type: 'text',
          text: `Could not find merge-base with ${baseBranch}. Make sure you're in a git repo with a ${baseBranch} branch.`,
        },
      ]
    }

    // Bail early on empty diffs instead of launching a container that
    // will just echo "no changes".
    // 从 `await execFileNoThrow(` 解构 stdout、code，减少斜杠命令 review Remote对同一对象的重复访问。
    const { stdout: diffStat, code: diffCode } = await execFileNoThrow(
      gitExe(),
      ['diff', '--shortstat', mergeBaseSha],
      { preserveOutputOnError: false },
    )
    // 只有 `diffCode === 0 && !diffStat.trim()` 满足时，命令处理才执行该分支。
    if (diffCode === 0 && !diffStat.trim()) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_review_remote_precondition_failed', {})
      // 返回列表结果，保留命令处理已经排好的条目顺序。
      return [
        {
          type: 'text',
          text: `No changes against the ${baseBranch} fork point. Make some commits or stage files first.`,
        },
      ]
    }

    // session 会话数据更新为 `await teleportToRemote({`，确保斜杠命令后续读取最新状态。
    session = await teleportToRemote({
      initialMessage: null,
      description: `ultrareview: ${baseBranch}`,
      signal: context.abortController.signal,
      useBundle: true,
      environmentId: CODE_REVIEW_ENV_ID,
      environmentVariables: {
        BUGHUNTER_BASE_BRANCH: mergeBaseSha,
        ...commonEnvVars,
      },
    })
    // session 会话数据缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!session) {
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_review_remote_teleport_failed', {})
      // 返回列表结果，保留命令处理已经排好的条目顺序。
      return [
        {
          type: 'text',
          text: 'Repo is too large. Push a PR and use `/ultrareview <PR#>` instead.',
        },
      ]
    }
    // 命令更新为 `'/ultrareview'`，确保斜杠命令后续读取最新状态。
    command = '/ultrareview'
    // target更新为 `baseBranch`，确保斜杠命令后续读取最新状态。
    target = baseBranch
  }

  // session 会话数据缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!session) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_review_remote_teleport_failed', {})
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }
  // 调用 registerRemoteAgentTask，触发命令处理此处需要的副作用。
  registerRemoteAgentTask({
    remoteTaskType: 'ultrareview',
    session,
    command,
    context,
    isRemoteReview: true,
  })
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_review_remote_launched', {})
  // sessionUrl 会话数据读取`getRemoteTaskSessionUrl`，供命令处理后续处理使用。
  const sessionUrl = getRemoteTaskSessionUrl(session.id)
  // Concise — the tool-output block is visible to the user, so the model
  // shouldn't echo the same info. Just enough for Claude to acknowledge the
  // launch without restating the target/URL (both already printed above).
  // 返回列表结果，保留命令处理已经排好的条目顺序。
  return [
    {
      type: 'text',
      text: `Ultrareview launched for ${target} (~10–20 min, runs in the cloud). Track: ${sessionUrl}${resolvedBillingNote} Findings arrive via task-notification. Briefly acknowledge the launch to the user without repeating the target or URL — both are already visible in the tool output above.`,
    },
  ]
}
