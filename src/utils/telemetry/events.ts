// 类型依赖 { Attributes } 来自 @opentelemetry/api，用于校准共享工具的数据契约。
import type { Attributes } from '@opentelemetry/api'
// 引入 getEventLogger、getPromptId，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getEventLogger, getPromptId } from 'src/bootstrap/state.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 引入 getTelemetryAttributes，将 ../telemetryAttributes.js 中已经封装好的能力接到本文件流程里。
import { getTelemetryAttributes } from '../telemetryAttributes.js'

// Monotonically increasing counter for ordering events within a session
// eventSequence保存`0`，供共享工具 events后续判断或输出使用。
let eventSequence = 0

// Track whether we've already warned about a null event logger to avoid spamming
// hasWarnedNoEventLogger标记共享工具 events是否启用对应路径。
let hasWarnedNoEventLogger = false

// isUserPromptLoggingEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isUserPromptLoggingEnabled() {
  // 返回 `isEnvTruthy(process.env.OTEL_LOG_USER_PROMPTS)`，作为共享工具这次计算的结果。
  return isEnvTruthy(process.env.OTEL_LOG_USER_PROMPTS)
}

// redactIfDisabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function redactIfDisabled(content: string): string {
  // 返回 `isUserPromptLoggingEnabled() ? content : '<REDACTED>'`，作为共享工具这次计算的结果。
  return isUserPromptLoggingEnabled() ? content : '<REDACTED>'
}

// logOTelEvent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function logOTelEvent(
  eventName: string,
  metadata: { [key: string]: string | undefined } = {},
): Promise<void> {
  // eventLogger读取`getEventLogger`，供共享工具后续处理使用。
  const eventLogger = getEventLogger()
  // eventLogger缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!eventLogger) {
    // hasWarnedNoEventLogger缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!hasWarnedNoEventLogger) {
      // hasWarnedNoEventLogger更新为 `true`，确保共享工具后续读取最新状态。
      hasWarnedNoEventLogger = true
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[3P telemetry] Event dropped (no event logger initialized): ${eventName}`,
        { level: 'warn' },
      )
    }
    // 共享工具 events在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Skip logging in test environment
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，共享工具执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 共享工具 events在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // attributes 集合 集中保存共享工具 events要一起传递的字段。
  const attributes: Attributes = {
    ...getTelemetryAttributes(),
    'event.name': eventName,
    'event.timestamp': new Date().toISOString(),
    'event.sequence': eventSequence++,
  }

  // Add prompt ID to events (but not metrics, where it would cause unbounded cardinality)
  // promptId读取`getPromptId`，供共享工具后续处理使用。
  const promptId = getPromptId()
  // 满足 `promptId` 时，共享工具执行该分支。
  if (promptId) {
    // id'更新为 `promptId`，确保共享工具 events后续读取最新状态。
    attributes['prompt.id'] = promptId
  }

  // Workspace directory from the desktop app (host path). Events only —
  // filesystem paths are too high-cardinality for metric dimensions, and
  // the BQ metrics pipeline must never see them.
  // workspaceDir 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const workspaceDir = process.env.CLAUDE_CODE_WORKSPACE_HOST_PATHS
  // 满足 `workspaceDir` 时，共享工具执行该分支。
  if (workspaceDir) {
    // host_paths' 路径数据更新为 `workspaceDir.split('|')`，确保共享工具 events后续读取最新状态。
    attributes['workspace.host_paths'] = workspaceDir.split('|')
  }

  // Add metadata as attributes - all values are already strings
  // 循环处理 `const [key, value] of Object.entries(metadata)`，让共享工具把同类条目按顺序走完。
  for (const [key, value] of Object.entries(metadata)) {
    // `value` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (value !== undefined) {
      // attributes[key更新为 `value`，确保共享工具 events后续读取最新状态。
      attributes[key] = value
    }
  }

  // Emit log record as an event
  // 调用 eventLogger.emit，触发共享工具此处需要的副作用。
  eventLogger.emit({
    body: `claude_code.${eventName}`,
    attributes,
  })
}
