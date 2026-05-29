// 引入 createFallbackStorage，将 ./fallbackStorage.js 中已经封装好的能力接到本文件流程里。
import { createFallbackStorage } from './fallbackStorage.js'
// 引入 macOsKeychainStorage，将 ./macOsKeychainStorage.js 中已经封装好的能力接到本文件流程里。
import { macOsKeychainStorage } from './macOsKeychainStorage.js'
// 引入 plainTextStorage，将 ./plainTextStorage.js 中已经封装好的能力接到本文件流程里。
import { plainTextStorage } from './plainTextStorage.js'
// 类型依赖 { SecureStorage } 来自 ./types.js，用于校准共享工具的数据契约。
import type { SecureStorage } from './types.js'

/**
 * Get the appropriate secure storage implementation for the current platform
 */
// getSecureStorage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSecureStorage(): SecureStorage {
  // 当 `process.platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
  if (process.platform === 'darwin') {
    // 返回 `createFallbackStorage(macOsKeychainStorage, plainTextStorage)`，作为共享工具这次计算的结果。
    return createFallbackStorage(macOsKeychainStorage, plainTextStorage)
  }

  // TODO: add libsecret support for Linux

  // 返回 `plainTextStorage`，作为共享工具这次计算的结果。
  return plainTextStorage
}
