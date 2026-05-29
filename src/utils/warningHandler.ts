// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { posix, win32 } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'

// Track warnings to avoid spam — bounded to prevent unbounded memory growth
// MAX_WARNING_KEYS 警告信息保存`1000`，供共享工具 warning Handler后续判断或输出使用。
export const MAX_WARNING_KEYS = 1000
// warningCounts 警告信息构建`new Map<string, number>()`，供后续判断或组装使用。
const warningCounts = new Map<string, number>()

// Check if running from a build directory (development mode)
// This is a sync version of the logic in getCurrentInstallationType()
// isRunningFromBuildDirectory 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isRunningFromBuildDirectory(): boolean {
  // invokedPath 路径数据标记共享工具 warning Handler是否启用对应路径。
  let invokedPath = process.argv[1] || ''
  // execPath 路径数据标记共享工具 warning Handler是否启用对应路径。
  let execPath = process.execPath || process.argv[0] || ''

  // On Windows, convert backslashes to forward slashes for consistent path matching
  // 当 `getPlatform()` 匹配 `'windows'` 时，共享工具执行对应分支。
  if (getPlatform() === 'windows') {
    // invokedPath 路径数据更新为 `invokedPath.split(win32.sep).join(posix.sep)`，确保共享工具后续读取最新状态。
    invokedPath = invokedPath.split(win32.sep).join(posix.sep)
    // execPath 路径数据更新为 `execPath.split(win32.sep).join(posix.sep)`，确保共享工具后续读取最新状态。
    execPath = execPath.split(win32.sep).join(posix.sep)
  }

  // pathsToCheck 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
  const pathsToCheck = [invokedPath, execPath]
  // buildDirs 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const buildDirs = [
    '/build-ant/',
    '/build-external/',
    '/build-external-native/',
    '/build-ant-native/',
  ]

  // 返回 `pathsToCheck.some(path => buildDirs.some(dir => path.includes(dir)))`，作为共享工具这次计算的结果。
  return pathsToCheck.some(path => buildDirs.some(dir => path.includes(dir)))
}

// Warnings we know about and want to suppress from users
// INTERNAL_WARNINGS 警告信息 聚合成有序列表，保持后续遍历顺序稳定。
const INTERNAL_WARNINGS = [
  /MaxListenersExceededWarning.*AbortSignal/,
  /MaxListenersExceededWarning.*EventTarget/,
]

// isInternalWarning 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isInternalWarning(warning: Error): boolean {
  // warningStr 警告信息保存``${warning.name}: ${warning.message}``，作为后续固定文本处理的输入。
  const warningStr = `${warning.name}: ${warning.message}`
  // 返回 `INTERNAL_WARNINGS.some(pattern => pattern.test(warningStr))`，作为共享工具这次计算的结果。
  return INTERNAL_WARNINGS.some(pattern => pattern.test(warningStr))
}

// Store reference to our warning handler so we can detect if it's already installed
// 这个回调绑定到 let warningHandler: ((warning: Error) => void) | null = null，负责共享工具在该局部场景下的响应。
let warningHandler: ((warning: Error) => void) | null = null

// For testing only - allows resetting the warning handler state
// resetWarningHandler 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetWarningHandler(): void {
  // 满足 `warningHandler` 时，共享工具执行该分支。
  if (warningHandler) {
    // 调用 process.removeListener，触发共享工具此处需要的副作用。
    process.removeListener('warning', warningHandler)
  }
  // warningHandler 警告信息更新为 `null`，确保共享工具后续读取最新状态。
  warningHandler = null
  // 调用 warningCounts.clear，触发共享工具此处需要的副作用。
  warningCounts.clear()
}

// initializeWarningHandler 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeWarningHandler(): void {
  // Only set up handler once - check if our handler is already installed
  // currentListeners 集合保存`process.listeners`，供共享工具后续处理使用。
  const currentListeners = process.listeners('warning')
  // 只有 `warningHandler && currentListeners.includes(warningHandler)` 满足时，共享工具才执行该分支。
  if (warningHandler && currentListeners.includes(warningHandler)) {
    // 共享工具 warning Handler在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // For external users, remove default Node.js handler to suppress stderr output
  // For internal users, only keep default warnings for development builds
  // Check development mode directly to avoid async call in init
  // This preserves the same logic as getCurrentInstallationType() without async
  // isDevelopment 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isDevelopment =
    process.env.NODE_ENV === 'development' || isRunningFromBuildDirectory()
  // isDevelopment缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!isDevelopment) {
    // 调用 process.removeAllListeners，触发共享工具此处需要的副作用。
    process.removeAllListeners('warning')
  }

  // Create and store our warning handler
  // warningHandler 警告信息更新为 `(warning: Error) => {`，确保共享工具后续读取最新状态。
  warningHandler = (warning: Error) => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // warningKey 警告信息格式化`message.slice`，供共享工具后续处理使用。
      const warningKey = `${warning.name}: ${warning.message.slice(0, 50)}`
      // 计数读取`warningCounts.get`，供共享工具后续处理使用。
      const count = warningCounts.get(warningKey) || 0

      // Bound the map to prevent unbounded memory growth from unique warning keys.
      // Once the cap is reached, new unique keys are not tracked — their
      // occurrence_count will always be reported as 1 in analytics.
      // 共享工具在这里按实际状态进入对应分支。
      if (
        warningCounts.has(warningKey) ||
        warningCounts.size < MAX_WARNING_KEYS
      ) {
        // warningCounts.set 写入新的状态值，使共享工具后续读取保持一致。
        warningCounts.set(warningKey, count + 1)
      }

      // isInternal记录 `isInternalWarning` 是否成立，共享工具随后按该结果分支。
      const isInternal = isInternalWarning(warning)

      // Always log to Statsig for monitoring
      // Include full details for ant users only, since they may contain code or filepaths
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_node_warning', {
        is_internal: isInternal ? 1 : 0,
        occurrence_count: count + 1,
        classname:
          warning.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...(process.env.USER_TYPE === 'ant' && {
          message:
            warning.message as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
      })

      // In debug mode, show all warnings with context
      // 满足 `isEnvTruthy(process.env.CLAUDE_DEBUG)` 时，共享工具执行该分支。
      if (isEnvTruthy(process.env.CLAUDE_DEBUG)) {
        // prefix读取 `isInternal ? '[Internal Warning]' : '[Warning]'` 对应条目，后续围绕该成员继续处理。
        const prefix = isInternal ? '[Internal Warning]' : '[Warning]'
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`${prefix} ${warning.toString()}`, { level: 'warn' })
      }
      // Hide all warnings from users - they are only logged to Statsig for monitoring
    } catch {
      // Fail silently - we don't want the warning handler to cause issues
    }
  }

  // Install the warning handler
  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('warning', warningHandler)
}
