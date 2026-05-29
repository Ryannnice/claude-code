// 复用 saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { saveGlobalConfig } from '../utils/config.js'

/**
 * Migrate the `replBridgeEnabled` config key to `remoteControlAtStartup`.
 *
 * The old key was an implementation detail that leaked into user-facing config.
 * This migration copies the value to the new key and removes the old one.
 * Idempotent — only acts when the old key exists and the new one doesn't.
 */
// migrateReplBridgeEnabledToRemoteControlAtStartup 封装migrateReplBridgeEnabledToRemoteControlAtStartup的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateReplBridgeEnabledToRemoteControlAtStartup(): void {
  // 调用 saveGlobalConfig，触发migrate Repl Bridge Enabled To Remo...此处需要的副作用。
  saveGlobalConfig(prev => {
    // The old key is no longer in the GlobalConfig type, so access it via
    // an untyped cast. Only migrate if the old key exists and the new key
    // hasn't been set yet.
    // oldValue保存`(prev as Record<string, unknown>)['replBridgeEnabled']`，供migrate Repl Bridge Enabled To Remo...后续判断或输出使用。
    const oldValue = (prev as Record<string, unknown>)['replBridgeEnabled']
    // 满足 `oldValue === undefined` 时，migrate Repl Bridge Enabled To Remo...执行该分支。
    if (oldValue === undefined) return prev
    // `prev.remoteControlAtStartup` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (prev.remoteControlAtStartup !== undefined) return prev
    // next保存`Boolean`，供migrate Repl Bridge Enabled To Remo...后续处理使用。
    const next = { ...prev, remoteControlAtStartup: Boolean(oldValue) }
    // 调用 delete，触发migrate Repl Bridge Enabled To Remo...此处需要的副作用。
    delete (next as Record<string, unknown>)['replBridgeEnabled']
    // 返回 `next`，作为migrate Repl Bridge Enabled To Remo...这次计算的结果。
    return next
  })
}
