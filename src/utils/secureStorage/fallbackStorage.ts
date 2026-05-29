// 类型依赖 { SecureStorage, SecureStorageData } 来自 ./types.js，用于校准共享工具的数据契约。
import type { SecureStorage, SecureStorageData } from './types.js'

/**
 * Creates a fallback storage that tries to use the primary storage first,
 * and if that fails, falls back to the secondary storage
 */
// createFallbackStorage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createFallbackStorage(
  primary: SecureStorage,
  secondary: SecureStorage,
): SecureStorage {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    name: `${primary.name}-with-${secondary.name}-fallback`,
    // read 使用 无 完成共享工具里的对应操作。
    read(): SecureStorageData {
      // 结果读取`primary.read`，供共享工具后续处理使用。
      const result = primary.read()
      // `result` 与 `null && result !== undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (result !== null && result !== undefined) {
        // 返回 `result`，作为共享工具这次计算的结果。
        return result
      }
      // 返回 `secondary.read() || {}`，作为共享工具这次计算的结果。
      return secondary.read() || {}
    },
    // readAsync 使用 无 完成共享工具里的对应操作。
    async readAsync(): Promise<SecureStorageData | null> {
      // 结果读取`primary.readAsync`，供共享工具后续处理使用。
      const result = await primary.readAsync()
      // `result` 与 `null && result !== undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (result !== null && result !== undefined) {
        // 返回 `result`，作为共享工具这次计算的结果。
        return result
      }
      // 返回 `(await secondary.readAsync()) || {}`，作为共享工具这次计算的结果。
      return (await secondary.readAsync()) || {}
    },
    // update 使用 data: SecureStorageData 完成共享工具里的对应操作。
    update(data: SecureStorageData): { success: boolean; warning?: string } {
      // Capture state before update
      // primaryDataBefore读取`primary.read`，供共享工具后续处理使用。
      const primaryDataBefore = primary.read()

      // 结果保存`primary.update`，供共享工具后续处理使用。
      const result = primary.update(data)

      // 满足 `result.success` 时，共享工具执行该分支。
      if (result.success) {
        // Delete secondary when migrating to primary for the first time
        // This preserves credentials when sharing .claude between host and containers
        // See: https://github.com/anthropics/claude-code/issues/1414
        // 满足 `primaryDataBefore === null` 时，共享工具执行该分支。
        if (primaryDataBefore === null) {
          // 调用 secondary.delete，触发共享工具此处需要的副作用。
          secondary.delete()
        }
        // 返回 `result`，作为共享工具这次计算的结果。
        return result
      }

      // fallbackResult保存`secondary.update`，供共享工具后续处理使用。
      const fallbackResult = secondary.update(data)

      // 满足 `fallbackResult.success` 时，共享工具执行该分支。
      if (fallbackResult.success) {
        // Primary write failed but primary may still hold an *older* valid
        // entry. read() prefers primary whenever it returns non-null, so that
        // stale entry would shadow the fresh data we just wrote to secondary —
        // e.g. a refresh token the server has already rotated away, causing a
        // /login loop (#30337). Best-effort delete; if this also fails the
        // user's keychain is in a bad state we can't fix from here.
        // `primaryDataBefore` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
        if (primaryDataBefore !== null) {
          // 调用 primary.delete，触发共享工具此处需要的副作用。
          primary.delete()
        }
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {
          success: true,
          warning: fallbackResult.warning,
        }
      }

      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { success: false }
    },
    // delete 使用 无 完成共享工具里的对应操作。
    delete(): boolean {
      // primarySuccess 集合保存`primary.delete`，供共享工具后续处理使用。
      const primarySuccess = primary.delete()
      // secondarySuccess 集合保存`secondary.delete`，供共享工具后续处理使用。
      const secondarySuccess = secondary.delete()

      // 返回 `primarySuccess || secondarySuccess`，作为共享工具这次计算的结果。
      return primarySuccess || secondarySuccess
    },
  }
}
