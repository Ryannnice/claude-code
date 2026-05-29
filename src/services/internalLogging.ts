// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 类型依赖 { ToolPermissionContext } 来自 ../Tool.js，用于校准服务层 internal Logging的数据契约。
import type { ToolPermissionContext } from '../Tool.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonStringify } from '../utils/slowOperations.js'
// 整理这一组导入，让服务层 internal Logging后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from './analytics/index.js'

/**
 * Get the current Kubernetes namespace:
 * Returns null on laptops/local development,
 * "default" for devboxes in default namespace,
 * "ts" for devboxes in ts namespace,
 * ...
 */
// getKubernetesNamespace保存`memoize`，供服务层 internal Logging后续处理使用。
const getKubernetesNamespace = memoize(async (): Promise<string | null> => {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `null`，作为服务层 internal Logging这次计算的结果。
    return null
  }
  // namespacePath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const namespacePath =
    '/var/run/secrets/kubernetes.io/serviceaccount/namespace'
  // namespaceNotFound 命名 `'namespace not found'`，让后续代码直接表达这个值的用途。
  const namespaceNotFound = 'namespace not found'
  // 保护这一段可能失败的服务层 internal Logging操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供服务层 internal Logging后续处理使用。
    const content = await readFile(namespacePath, { encoding: 'utf8' })
    // 返回 `content.trim()`，作为服务层 internal Logging这次计算的结果。
    return content.trim()
  } catch {
    // 返回 `namespaceNotFound`，作为服务层 internal Logging这次计算的结果。
    return namespaceNotFound
  }
})

/**
 * Get the OCI container ID from within a running container
 */
// getContainerId保存`memoize`，供服务层 internal Logging后续处理使用。
export const getContainerId = memoize(async (): Promise<string | null> => {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `null`，作为服务层 internal Logging这次计算的结果。
    return null
  }
  // containerIdPath 路径数据保存`'/proc/self/mountinfo'`，作为后续固定文本处理的输入。
  const containerIdPath = '/proc/self/mountinfo'
  // containerIdNotFound保存`'container ID not found'`，作为后续固定文本处理的输入。
  const containerIdNotFound = 'container ID not found'
  // containerIdNotFoundInMountinfo 命名 `'container ID not found in mountinfo'`，让后续代码直接表达这个值的用途。
  const containerIdNotFoundInMountinfo = 'container ID not found in mountinfo'
  // 保护这一段可能失败的服务层 internal Logging操作，确保异常能进入相邻错误处理。
  try {
    // mountinfo 命名 `(`，让后续代码直接表达这个值的用途。
    const mountinfo = (
      await readFile(containerIdPath, { encoding: 'utf8' })
    ).trim()

    // Pattern to match both Docker and containerd/CRI-O container IDs
    // Docker: /docker/containers/[64-char-hex]
    // Containerd: /sandboxes/[64-char-hex]
    // containerIdPattern 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const containerIdPattern =
      /(?:\/docker\/containers\/|\/sandboxes\/)([0-9a-f]{64})/

    // 文本行格式化`mountinfo.split`，供服务层 internal Logging后续处理使用。
    const lines = mountinfo.split('\n')

    // 按顺序遍历 `lines` 中的line，逐个交给服务层 internal Logging处理。
    for (const line of lines) {
      // match匹配`line.match`，供服务层 internal Logging后续处理使用。
      const match = line.match(containerIdPattern)
      // 组合条件 `match && match[1]` 成立时，服务层 internal Logging才启用这条专门路径。
      if (match && match[1]) {
        // 返回 `match[1]`，作为服务层 internal Logging这次计算的结果。
        return match[1]
      }
    }

    // 返回 `containerIdNotFoundInMountinfo`，作为服务层 internal Logging这次计算的结果。
    return containerIdNotFoundInMountinfo
  } catch {
    // 返回 `containerIdNotFound`，作为服务层 internal Logging这次计算的结果。
    return containerIdNotFound
  }
})

/**
 * Logs an event with the current namespace and tool permission context
 */
// logPermissionContextForAnts 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function logPermissionContextForAnts(
  toolPermissionContext: ToolPermissionContext | null,
  moment: 'summary' | 'initialization',
): Promise<void> {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 服务层 internal Logging在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 显式忽略 `logEvent('tengu_internal_record_permission_context', {` 的返回值，只保留它触发的副作用。
  void logEvent('tengu_internal_record_permission_context', {
    moment:
      moment as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    namespace:
      (await getKubernetesNamespace()) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    toolPermissionContext: jsonStringify(
      toolPermissionContext,
    ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    containerId:
      (await getContainerId()) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
}
