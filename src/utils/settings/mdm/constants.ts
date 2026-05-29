/**
 * Shared constants and path builders for MDM settings modules.
 *
 * This module has ZERO heavy imports (only `os`) — safe to use from mdmRawRead.ts.
 * Both mdmRawRead.ts and mdmSettings.ts import from here to avoid duplication.
 */

// 引入 homedir、userInfo，将 os 中已经封装好的能力接到本文件流程里。
import { homedir, userInfo } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'

/** macOS preference domain for Claude Code MDM profiles. */
// MACOS_PREFERENCE_DOMAIN固定为 `'com.anthropic.claudecode'`，作为共享工具 constants后续展示或比较的基准。
export const MACOS_PREFERENCE_DOMAIN = 'com.anthropic.claudecode'

/**
 * Windows registry key paths for Claude Code MDM policies.
 *
 * These keys live under SOFTWARE\Policies which is on the WOW64 shared key
 * list — both 32-bit and 64-bit processes see the same values without
 * redirection. Do not move these to SOFTWARE\ClaudeCode, as SOFTWARE is
 * redirected and 32-bit processes would silently read from WOW6432Node.
 * See: https://learn.microsoft.com/en-us/windows/win32/winprog64/shared-registry-keys
 */
// WINDOWS_REGISTRY_KEY_PATH_HKLM 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const WINDOWS_REGISTRY_KEY_PATH_HKLM =
  'HKLM\\SOFTWARE\\Policies\\ClaudeCode'
// WINDOWS_REGISTRY_KEY_PATH_HKCU 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const WINDOWS_REGISTRY_KEY_PATH_HKCU =
  'HKCU\\SOFTWARE\\Policies\\ClaudeCode'

/** Windows registry value name containing the JSON settings blob. */
// WINDOWS_REGISTRY_VALUE_NAME 命名 `'Settings'`，让后续代码直接表达这个值的用途。
export const WINDOWS_REGISTRY_VALUE_NAME = 'Settings'

/** Path to macOS plutil binary. */
// PLUTIL_PATH 路径数据 命名 `'/usr/bin/plutil'`，让后续代码直接表达这个值的用途。
export const PLUTIL_PATH = '/usr/bin/plutil'

/** Arguments for plutil to convert plist to JSON on stdout (append plist path). */
// PLUTIL_ARGS_PREFIX 聚合成有序列表，保持后续遍历顺序稳定。
export const PLUTIL_ARGS_PREFIX = ['-convert', 'json', '-o', '-', '--'] as const

/** Subprocess timeout in milliseconds. */
// MDM_SUBPROCESS_TIMEOUT_MS 集合 命名 `5000`，让后续代码直接表达这个值的用途。
export const MDM_SUBPROCESS_TIMEOUT_MS = 5000

/**
 * Build the list of macOS plist paths in priority order (highest first).
 * Evaluates `process.env.USER_TYPE` at call time so ant-only paths are
 * included only when appropriate.
 */
// getMacOSPlistPaths 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMacOSPlistPaths(): Array<{ path: string; label: string }> {
  // username固定为 `''`，作为共享工具 constants后续展示或比较的基准。
  let username = ''
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // username更新为 `userInfo().username`，确保共享工具后续读取最新状态。
    username = userInfo().username
  } catch {
    // ignore
  }

  // 路径列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const paths: Array<{ path: string; label: string }> = []

  // 满足 `username` 时，共享工具执行该分支。
  if (username) {
    // 路径列表追加新条目，保持收集顺序与输入顺序一致。
    paths.push({
      path: `/Library/Managed Preferences/${username}/${MACOS_PREFERENCE_DOMAIN}.plist`,
      label: 'per-user managed preferences',
    })
  }

  // 路径列表追加新条目，保持收集顺序与输入顺序一致。
  paths.push({
    path: `/Library/Managed Preferences/${MACOS_PREFERENCE_DOMAIN}.plist`,
    label: 'device-level managed preferences',
  })

  // Allow user-writable preferences for local MDM testing in ant builds only.
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 路径列表追加新条目，保持收集顺序与输入顺序一致。
    paths.push({
      path: join(
        homedir(),
        'Library',
        'Preferences',
        `${MACOS_PREFERENCE_DOMAIN}.plist`,
      ),
      label: 'user preferences (ant-only)',
    })
  }

  // 返回 `paths`，作为共享工具这次计算的结果。
  return paths
}
