// 类型依赖 { SDKMessage } 来自 src/entrypoints/agentSdkTypes.js，用于校准共享工具的数据契约。
import type { SDKMessage } from 'src/entrypoints/agentSdkTypes.js'
// 接入 checkGate_CACHED_OR_BLOCKING 服务层能力，把外部通信或共享状态交给 ../../../services/analytics/growthbook.js 处理。
import { checkGate_CACHED_OR_BLOCKING } from '../../../services/analytics/growthbook.js'
// 接入 isPolicyAllowed 服务层能力，把外部通信或共享状态交给 ../../../services/policyLimits/index.js 处理。
import { isPolicyAllowed } from '../../../services/policyLimits/index.js'
// 引入 detectCurrentRepositoryWithHost，将 ../../detectRepository.js 中已经封装好的能力接到本文件流程里。
import { detectCurrentRepositoryWithHost } from '../../detectRepository.js'
// 引入 isEnvTruthy，将 ../../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../../envUtils.js'
// 类型依赖 { TodoList } 来自 ../../todo/types.js，用于校准共享工具的数据契约。
import type { TodoList } from '../../todo/types.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  checkGithubAppInstalled,
  checkHasRemoteEnvironment,
  checkIsInGitRepo,
  checkNeedsClaudeAiLogin,
} from './preconditions.js'

/**
 * Background remote session type for managing teleport sessions
 */
// BackgroundRemoteSession 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type BackgroundRemoteSession = {
  id: string
  command: string
  startTime: number
  status: 'starting' | 'running' | 'completed' | 'failed' | 'killed'
  todoList: TodoList
  title: string
  type: 'remote_session'
  log: SDKMessage[]
}

/**
 * Precondition failures for background remote sessions
 */
// BackgroundRemoteSessionPrecondition 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type BackgroundRemoteSessionPrecondition =
  | { type: 'not_logged_in' }
  | { type: 'no_remote_environment' }
  | { type: 'not_in_git_repo' }
  | { type: 'no_git_remote' }
  | { type: 'github_app_not_installed' }
  | { type: 'policy_blocked' }

/**
 * Checks eligibility for creating a background remote session
 * Returns an array of failed preconditions (empty array means all checks passed)
 *
 * @returns Array of failed preconditions
 */
// checkBackgroundRemoteSessionEligibility 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkBackgroundRemoteSessionEligibility({
  skipBundle = false,
}: {
  skipBundle?: boolean
} = {}): Promise<BackgroundRemoteSessionPrecondition[]> {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: BackgroundRemoteSessionPrecondition[] = []

  // Check policy first - if blocked, no need to check other preconditions
  // 满足 `!isPolicyAllowed('allow_remote_sessions')` 时，共享工具执行该分支。
  if (!isPolicyAllowed('allow_remote_sessions')) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push({ type: 'policy_blocked' })
    // 返回 `errors`，作为共享工具这次计算的结果。
    return errors
  }

  // 并行获取 needsLogin、hasRemoteEnv、repository，缩短共享工具 remote Session等待多个独立异步任务的时间。
  const [needsLogin, hasRemoteEnv, repository] = await Promise.all([
    checkNeedsClaudeAiLogin(),
    checkHasRemoteEnvironment(),
    detectCurrentRepositoryWithHost(),
  ])

  // 满足 `needsLogin` 时，共享工具执行该分支。
  if (needsLogin) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push({ type: 'not_logged_in' })
  }

  // hasRemoteEnv缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!hasRemoteEnv) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push({ type: 'no_remote_environment' })
  }

  // When bundle seeding is on, in-git-repo is enough — CCR can seed from
  // a local bundle. No GitHub remote or app needed. Same gate as
  // teleport.tsx bundleSeedGateOn.
  // bundleSeedGateOn 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const bundleSeedGateOn =
    !skipBundle &&
    (isEnvTruthy(process.env.CCR_FORCE_BUNDLE) ||
      isEnvTruthy(process.env.CCR_ENABLE_BUNDLE) ||
      (await checkGate_CACHED_OR_BLOCKING('tengu_ccr_bundle_seed_enabled')))

  // 满足 `!checkIsInGitRepo()` 时，共享工具执行该分支。
  if (!checkIsInGitRepo()) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push({ type: 'not_in_git_repo' })
  // 共享工具 remote Session在这里处理 `} else if (bundleSeedGateOn) {`，完成这一小步状态转换。
  } else if (bundleSeedGateOn) {
    // has .git/, bundle will work — skip remote+app checks
  // 共享工具 remote Session在这里处理 `} else if (repository === null) {`，完成这一小步状态转换。
  } else if (repository === null) {
    // 错误列表追加新条目，保持收集顺序与输入顺序一致。
    errors.push({ type: 'no_git_remote' })
  // 共享工具 remote Session在这里处理 `} else if (repository.host === 'github.com') {`，完成这一小步状态转换。
  } else if (repository.host === 'github.com') {
    // hasGithubApp记录 `checkGithubAppInstalled` 是否成立，共享工具随后按该结果分支。
    const hasGithubApp = await checkGithubAppInstalled(
      repository.owner,
      repository.name,
    )
    // hasGithubApp缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!hasGithubApp) {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push({ type: 'github_app_not_installed' })
    }
  }

  // 返回 `errors`，作为共享工具这次计算的结果。
  return errors
}
