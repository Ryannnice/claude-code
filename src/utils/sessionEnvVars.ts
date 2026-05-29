/**
 * Session-scoped environment variables set via /env.
 * Applied only to spawned child processes (via bash provider env overrides),
 * not to the REPL process itself.
 */
// sessionEnvVars 会话数据构建`new Map<string, string>()`，供后续判断或组装使用。
const sessionEnvVars = new Map<string, string>()

// getSessionEnvVars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionEnvVars(): ReadonlyMap<string, string> {
  // 返回 `sessionEnvVars`，作为共享工具这次计算的结果。
  return sessionEnvVars
}

// setSessionEnvVar 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionEnvVar(name: string, value: string): void {
  // sessionEnvVars.set 写入新的状态值，使共享工具后续读取保持一致。
  sessionEnvVars.set(name, value)
}

// deleteSessionEnvVar 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function deleteSessionEnvVar(name: string): void {
  // 调用 sessionEnvVars.delete，触发共享工具此处需要的副作用。
  sessionEnvVars.delete(name)
}

// clearSessionEnvVars 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSessionEnvVars(): void {
  // 调用 sessionEnvVars.clear，触发共享工具此处需要的副作用。
  sessionEnvVars.clear()
}
