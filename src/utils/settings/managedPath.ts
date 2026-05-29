// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'

/**
 * Get the path to the managed settings directory based on the current platform.
 */
// getManagedFilePath 路径数据保存`memoize`，供共享工具后续处理使用。
export const getManagedFilePath = memoize(function (): string {
  // Allow override for testing/demos (Ant-only, eliminated from external builds)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.USER_TYPE === 'ant' &&
    process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH
  ) {
    // 返回 `process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH`，作为共享工具这次计算的结果。
    return process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH
  }

  // 依据 getPlatform() 的取值选择共享工具的具体处理分支。
  switch (getPlatform()) {
    case 'macos':
      // 返回 `'/Library/Application Support/ClaudeCode'`，作为共享工具这次计算的结果。
      return '/Library/Application Support/ClaudeCode'
    case 'windows':
      // 返回 `'C:\\Program Files\\ClaudeCode'`，作为共享工具这次计算的结果。
      return 'C:\\Program Files\\ClaudeCode'
    default:
      // 返回 `'/etc/claude-code'`，作为共享工具这次计算的结果。
      return '/etc/claude-code'
  }
})

/**
 * Get the path to the managed-settings.d/ drop-in directory.
 * managed-settings.json is merged first (base), then files in this directory
 * are merged alphabetically on top (drop-ins override base, later files win).
 */
// getManagedSettingsDropInDir保存`memoize`，供共享工具后续处理使用。
export const getManagedSettingsDropInDir = memoize(function (): string {
  // 返回 `join(getManagedFilePath(), 'managed-settings.d')`，作为共享工具这次计算的结果。
  return join(getManagedFilePath(), 'managed-settings.d')
})
