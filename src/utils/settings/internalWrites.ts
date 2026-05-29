/**
 * Tracks timestamps of in-process settings-file writes so the chokidar watcher
 * in changeDetector.ts can ignore its own echoes.
 *
 * Extracted from changeDetector.ts to break the settings.ts → changeDetector.ts →
 * hooks.ts → … → settings.ts cycle. settings.ts needs to mark "I'm about to
 * write" before the write lands; changeDetector needs to read the mark when
 * chokidar fires. The map is the only shared state — everything else in
 * changeDetector (chokidar, hooks, mdm polling) is irrelevant to settings.ts.
 *
 * Callers pass resolved paths. The path→source resolution (getSettingsFilePathForSource)
 * lives in settings.ts, so settings.ts does it before calling here. No imports.
 */

// timestamps 集合 命名 `new Map<string, number>()`，让后续代码直接表达这个值的用途。
const timestamps = new Map<string, number>()

// markInternalWrite 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markInternalWrite(path: string): void {
  // timestamps.set 写入新的状态值，使共享工具后续读取保持一致。
  timestamps.set(path, Date.now())
}

/**
 * True if `path` was marked within `windowMs`. Consumes the mark on match —
 * the watcher fires once per write, so a matched mark shouldn't suppress
 * the next (real, external) change to the same file.
 */
// consumeInternalWrite 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function consumeInternalWrite(path: string, windowMs: number): boolean {
  // ts 集合读取`timestamps.get`，供共享工具后续处理使用。
  const ts = timestamps.get(path)
  // `ts` 与 `undefined && Date.now() - ts < ...` 不一致时刷新派生状态，避免使用过期结果。
  if (ts !== undefined && Date.now() - ts < windowMs) {
    // 调用 timestamps.delete，触发共享工具此处需要的副作用。
    timestamps.delete(path)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// clearInternalWrites 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearInternalWrites(): void {
  // 调用 timestamps.clear，触发共享工具此处需要的副作用。
  timestamps.clear()
}
