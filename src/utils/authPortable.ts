// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 复用 getMacOsKeychainStorageServiceName 工具函数，把通用处理留在 src/utils/secureStorage/macOsKeychainHelpers.js 中维护。
import { getMacOsKeychainStorageServiceName } from 'src/utils/secureStorage/macOsKeychainHelpers.js'

// maybeRemoveApiKeyFromMacOSKeychainThrows 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function maybeRemoveApiKeyFromMacOSKeychainThrows(): Promise<void> {
  // 当 `process.platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
  if (process.platform === 'darwin') {
    // storageServiceName读取`getMacOsKeychainStorageServiceName`，供共享工具后续处理使用。
    const storageServiceName = getMacOsKeychainStorageServiceName()
    // 结果保存`execa`，供共享工具后续处理使用。
    const result = await execa(
      `security delete-generic-password -a $USER -s "${storageServiceName}"`,
      { shell: true, reject: false },
    )
    // `result.exitCode` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (result.exitCode !== 0) {
      // 抛出 new Error('Failed to delete keychain entry')，阻止共享工具在无效状态下继续运行。
      throw new Error('Failed to delete keychain entry')
    }
  }
}

// normalizeApiKeyForConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeApiKeyForConfig(apiKey: string): string {
  // 返回 `apiKey.slice(-20)`，作为共享工具这次计算的结果。
  return apiKey.slice(-20)
}
