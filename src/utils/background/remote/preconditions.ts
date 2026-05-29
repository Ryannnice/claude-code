// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 src/constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from 'src/constants/oauth.js'
// 接入 getOrganizationUUID 服务层能力，把外部通信或共享状态交给 src/services/oauth/client.js 处理。
import { getOrganizationUUID } from 'src/services/oauth/client.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getClaudeAIOAuthTokens,
  isClaudeAISubscriber,
} from '../../auth.js'
// 引入 getCwd，将 ../../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../../cwd.js'
// 引入 logForDebugging，将 ../../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../../debug.js'
// 引入 detectCurrentRepository，将 ../../detectRepository.js 中已经封装好的能力接到本文件流程里。
import { detectCurrentRepository } from '../../detectRepository.js'
// 引入 errorMessage，将 ../../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../../errors.js'
// 引入 findGitRoot、getIsClean，将 ../../git.js 中已经封装好的能力接到本文件流程里。
import { findGitRoot, getIsClean } from '../../git.js'
// 引入 getOAuthHeaders，将 ../../teleport/api.js 中已经封装好的能力接到本文件流程里。
import { getOAuthHeaders } from '../../teleport/api.js'
// 引入 fetchEnvironments，将 ../../teleport/environments.js 中已经封装好的能力接到本文件流程里。
import { fetchEnvironments } from '../../teleport/environments.js'

/**
 * Checks if user needs to log in with Claude.ai
 * Extracted from getTeleportErrors() in TeleportError.tsx
 * @returns true if login is required, false otherwise
 */
// checkNeedsClaudeAiLogin 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkNeedsClaudeAiLogin(): Promise<boolean> {
  // 满足 `!isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (!isClaudeAISubscriber()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `checkAndRefreshOAuthTokenIfNeeded()`，作为共享工具这次计算的结果。
  return checkAndRefreshOAuthTokenIfNeeded()
}

/**
 * Checks if git working directory is clean (no uncommitted changes)
 * Ignores untracked files since they won't be lost during branch switching
 * Extracted from getTeleportErrors() in TeleportError.tsx
 * @returns true if git is clean, false otherwise
 */
// checkIsGitClean 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkIsGitClean(): Promise<boolean> {
  // isClean记录 `getIsClean` 是否成立，共享工具随后按该结果分支。
  const isClean = await getIsClean({ ignoreUntracked: true })
  // 返回 `isClean`，作为共享工具这次计算的结果。
  return isClean
}

/**
 * Checks if user has access to at least one remote environment
 * @returns true if user has remote environments, false otherwise
 */
// checkHasRemoteEnvironment 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkHasRemoteEnvironment(): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // environments 集合读取`fetchEnvironments`，供共享工具后续处理使用。
    const environments = await fetchEnvironments()
    // 返回 `environments.length > 0`，作为共享工具这次计算的结果。
    return environments.length > 0
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`checkHasRemoteEnvironment failed: ${errorMessage(error)}`)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Checks if current directory is inside a git repository (has .git/).
 * Distinct from checkHasGitRemote — a local-only repo passes this but not that.
 */
// checkIsInGitRepo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkIsInGitRepo(): boolean {
  // 返回 `findGitRoot(getCwd()) !== null`，作为共享工具这次计算的结果。
  return findGitRoot(getCwd()) !== null
}

/**
 * Checks if current repository has a GitHub remote configured.
 * Returns false for local-only repos (git init with no `origin`).
 */
// checkHasGitRemote 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkHasGitRemote(): Promise<boolean> {
  // repository读取`detectCurrentRepository`，供共享工具后续处理使用。
  const repository = await detectCurrentRepository()
  // 返回 `repository !== null`，作为共享工具这次计算的结果。
  return repository !== null
}

/**
 * Checks if GitHub app is installed on a specific repository
 * @param owner The repository owner (e.g., "anthropics")
 * @param repo The repository name (e.g., "claude-cli-internal")
 * @returns true if GitHub app is installed, false otherwise
 */
// checkGithubAppInstalled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkGithubAppInstalled(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // accessToken读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
    const accessToken = getClaudeAIOAuthTokens()?.accessToken
    // accessToken缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!accessToken) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'checkGithubAppInstalled: No access token found, assuming app not installed',
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // orgUUID读取`getOrganizationUUID`，供共享工具后续处理使用。
    const orgUUID = await getOrganizationUUID()
    // orgUUID缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!orgUUID) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'checkGithubAppInstalled: No org UUID found, assuming app not installed',
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // URL读取`getOauthConfig`，供共享工具后续处理使用。
    const url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/code/repos/${owner}/${repo}`
    // 请求头集中保存共享工具 preconditions要一起传递的字段。
    const headers = {
      ...getOAuthHeaders(accessToken),
      'x-organization-uuid': orgUUID,
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Checking GitHub app installation for ${owner}/${repo}`)

    // 接口响应 等待 `axios.get<{`，确保继续执行前已有结果。
    const response = await axios.get<{
      repo: {
        name: string
        owner: { login: string }
        default_branch: string
      }
      status: {
        app_installed: boolean
        relay_enabled: boolean
      } | null
    }>(url, {
      headers,
      timeout: 15000,
      signal,
    })

    // 满足 `response.status === 200` 时，共享工具执行该分支。
    if (response.status === 200) {
      // 满足 `response.data.status` 时，共享工具执行该分支。
      if (response.data.status) {
        // installed 命名 `response.data.status.app_installed`，让后续代码直接表达这个值的用途。
        const installed = response.data.status.app_installed
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `GitHub app ${installed ? 'is' : 'is not'} installed on ${owner}/${repo}`,
        )
        // 返回 `installed`，作为共享工具这次计算的结果。
        return installed
      }
      // status is null - app is not installed on this repo
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `GitHub app is not installed on ${owner}/${repo} (status is null)`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `checkGithubAppInstalled: Unexpected response status ${response.status}`,
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  } catch (error) {
    // 4XX errors typically mean app is not installed or repo not accessible
    // 满足 `axios.isAxiosError(error)` 时，共享工具执行该分支。
    if (axios.isAxiosError(error)) {
      // status 集合保存`error.response?.status`，供后续判断或组装使用。
      const status = error.response?.status
      // 只有 `status && status >= 400 && status < 500` 满足时，共享工具才执行该分支。
      if (status && status >= 400 && status < 500) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `checkGithubAppInstalled: Got ${status} error, app likely not installed on ${owner}/${repo}`,
        )
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`checkGithubAppInstalled error: ${errorMessage(error)}`)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Checks if the user has synced their GitHub credentials via /web-setup
 * @returns true if GitHub token is synced, false otherwise
 */
// checkGithubTokenSynced 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkGithubTokenSynced(): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // accessToken读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
    const accessToken = getClaudeAIOAuthTokens()?.accessToken
    // accessToken缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!accessToken) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('checkGithubTokenSynced: No access token found')
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // orgUUID读取`getOrganizationUUID`，供共享工具后续处理使用。
    const orgUUID = await getOrganizationUUID()
    // orgUUID缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!orgUUID) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('checkGithubTokenSynced: No org UUID found')
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // URL读取`getOauthConfig`，供共享工具后续处理使用。
    const url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/sync/github/auth`
    // 请求头集中保存共享工具 preconditions要一起传递的字段。
    const headers = {
      ...getOAuthHeaders(accessToken),
      'x-organization-uuid': orgUUID,
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Checking if GitHub token is synced via web-setup')

    // 接口响应读取`axios.get`，供共享工具后续处理使用。
    const response = await axios.get(url, {
      headers,
      timeout: 15000,
    })

    // synced 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const synced =
      response.status === 200 && response.data?.is_authenticated === true
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `GitHub token synced: ${synced} (status=${response.status}, data=${JSON.stringify(response.data)})`,
    )
    // 返回 `synced`，作为共享工具这次计算的结果。
    return synced
  } catch (error) {
    // 满足 `axios.isAxiosError(error)` 时，共享工具执行该分支。
    if (axios.isAxiosError(error)) {
      // status 集合保存`error.response?.status`，供后续判断或组装使用。
      const status = error.response?.status
      // 只有 `status && status >= 400 && status < 500` 满足时，共享工具才执行该分支。
      if (status && status >= 400 && status < 500) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `checkGithubTokenSynced: Got ${status}, token not synced`,
        )
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`checkGithubTokenSynced error: ${errorMessage(error)}`)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// RepoAccessMethod 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type RepoAccessMethod = 'github-app' | 'token-sync' | 'none'

/**
 * Tiered check for whether a GitHub repo is accessible for remote operations.
 * 1. GitHub App installed on the repo
 * 2. GitHub token synced via /web-setup
 * 3. Neither — caller should prompt user to set up access
 */
// checkRepoForRemoteAccess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkRepoForRemoteAccess(
  owner: string,
  repo: string,
): Promise<{ hasAccess: boolean; method: RepoAccessMethod }> {
  // 满足 `await checkGithubAppInstalled(owner, repo)` 时，共享工具执行该分支。
  if (await checkGithubAppInstalled(owner, repo)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { hasAccess: true, method: 'github-app' }
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_cobalt_lantern', false) &&
    (await checkGithubTokenSynced())
  ) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { hasAccess: true, method: 'token-sync' }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { hasAccess: false, method: 'none' }
}
