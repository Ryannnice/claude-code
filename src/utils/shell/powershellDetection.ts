// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { realpath, stat } from 'fs/promises'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'
// 引入 which，将 ../which.js 中已经封装好的能力接到本文件流程里。
import { which } from '../which.js'

// probePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function probePath(p: string): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `(await stat(p)).isFile() ? p : null`，作为共享工具这次计算的结果。
    return (await stat(p)).isFile() ? p : null
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Attempts to find PowerShell on the system via PATH.
 * Prefers pwsh (PowerShell Core 7+), falls back to powershell (5.1).
 *
 * On Linux, if PATH resolves to a snap launcher (/snap/…) — directly or
 * via a symlink chain like /usr/bin/pwsh → /snap/bin/pwsh — probe known
 * apt/rpm install locations instead: the snap launcher can hang in
 * subprocesses while snapd initializes confinement, but the underlying
 * binary at /opt/microsoft/powershell/7/pwsh is reliable. On
 * Windows/macOS, PATH is sufficient.
 */
// findPowerShell 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function findPowerShell(): Promise<string | null> {
  // pwshPath 路径数据保存`which`，供共享工具后续处理使用。
  const pwshPath = await which('pwsh')
  // 满足 `pwshPath` 时，共享工具执行该分支。
  if (pwshPath) {
    // Snap launcher hangs in subprocesses. Prefer the direct binary.
    // Check both the resolved PATH entry and its symlink target: on
    // some distros /usr/bin/pwsh is a symlink to /snap/bin/pwsh, which
    // would bypass a naive startsWith('/snap/') on the which() result.
    // 当 `getPlatform()` 匹配 `'linux'` 时，共享工具执行对应分支。
    if (getPlatform() === 'linux') {
      // resolved保存`realpath`，供共享工具后续处理使用。
      const resolved = await realpath(pwshPath).catch(() => pwshPath)
      // 只有 `pwshPath.startsWith('/snap/') || resolved.startsWith('/snap/')` 满足时，共享工具才执行该分支。
      if (pwshPath.startsWith('/snap/') || resolved.startsWith('/snap/')) {
        // direct 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const direct =
          (await probePath('/opt/microsoft/powershell/7/pwsh')) ??
          (await probePath('/usr/bin/pwsh'))
        // 满足 `direct` 时，共享工具执行该分支。
        if (direct) {
          // directResolved保存`realpath`，供共享工具后续处理使用。
          const directResolved = await realpath(direct).catch(() => direct)
          // 共享工具在这里按实际状态进入对应分支。
          if (
            !direct.startsWith('/snap/') &&
            !directResolved.startsWith('/snap/')
          ) {
            // 返回 `direct`，作为共享工具这次计算的结果。
            return direct
          }
        }
      }
    }
    // 返回 `pwshPath`，作为共享工具这次计算的结果。
    return pwshPath
  }

  // powershellPath 路径数据保存`which`，供共享工具后续处理使用。
  const powershellPath = await which('powershell')
  // 满足 `powershellPath` 时，共享工具执行该分支。
  if (powershellPath) {
    // 返回 `powershellPath`，作为共享工具这次计算的结果。
    return powershellPath
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

// cachedPowerShellPath 路径数据初始化为空值，后续分支会在有数据时补齐。
let cachedPowerShellPath: Promise<string | null> | null = null

/**
 * Gets the cached PowerShell path. Returns a memoized promise that
 * resolves to the PowerShell executable path or null.
 */
// getCachedPowerShellPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedPowerShellPath(): Promise<string | null> {
  // cachedPowerShellPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cachedPowerShellPath) {
    // cachedPowerShellPath 路径数据更新为 `findPowerShell()`，确保共享工具后续读取最新状态。
    cachedPowerShellPath = findPowerShell()
  }
  // 返回 `cachedPowerShellPath`，作为共享工具这次计算的结果。
  return cachedPowerShellPath
}

// PowerShellEdition 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PowerShellEdition = 'core' | 'desktop'

/**
 * Infers the PowerShell edition from the binary name without spawning.
 * - `pwsh` / `pwsh.exe` → 'core' (PowerShell 7+: supports `&&`, `||`, `?:`, `??`)
 * - `powershell` / `powershell.exe` → 'desktop' (Windows PowerShell 5.1:
 *   no pipeline chain operators, stderr-sets-$? bug, UTF-16 default encoding)
 *
 * PowerShell 6 (also `pwsh`, no `&&`) has been EOL since 2020 and is not
 * a realistic install target, so 'core' safely implies 7+ semantics.
 *
 * Used by the tool prompt to give version-appropriate syntax guidance so
 * the model doesn't emit `cmd1 && cmd2` on 5.1 (parser error) or avoid
 * `&&` on 7+ where it's the correct short-circuiting operator.
 */
// getPowerShellEdition 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPowerShellEdition(): Promise<PowerShellEdition | null> {
  // p读取`getCachedPowerShellPath`，供共享工具后续处理使用。
  const p = await getCachedPowerShellPath()
  // p缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!p) return null
  // basename without extension, case-insensitive. Covers:
  //   C:\Program Files\PowerShell\7\pwsh.exe
  //   /opt/microsoft/powershell/7/pwsh
  //   C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
  // base保存`p`，供后续判断或组装使用。
  const base = p
    .split(/[/\\]/)
    .pop()!
    .toLowerCase()
    .replace(/\.exe$/, '')
  // 返回 `base === 'pwsh' ? 'core' : 'desktop'`，作为共享工具这次计算的结果。
  return base === 'pwsh' ? 'core' : 'desktop'
}

/**
 * Resets the cached PowerShell path. Only for testing.
 */
// resetPowerShellCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetPowerShellCache(): void {
  // cachedPowerShellPath 路径数据更新为 `null`，确保共享工具后续读取最新状态。
  cachedPowerShellPath = null
}
