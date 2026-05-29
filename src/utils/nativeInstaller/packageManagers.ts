/**
 * Package manager detection for Claude CLI
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 execFileNoThrow，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from '../execFileNoThrow.js'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'

// PackageManager 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PackageManager =
  | 'homebrew'
  | 'winget'
  | 'pacman'
  | 'deb'
  | 'rpm'
  | 'apk'
  | 'mise'
  | 'asdf'
  | 'unknown'

/**
 * Parses /etc/os-release to extract the distro ID and ID_LIKE fields.
 * ID_LIKE identifies the distro family (e.g. Ubuntu has ID_LIKE=debian),
 * letting us skip package manager execs on distros that can't have them.
 * Returns null if the file is unreadable (pre-systemd or non-standard systems);
 * callers fall through to the exec in that case as a conservative fallback.
 */
// getOsRelease保存`memoize`，供共享工具后续处理使用。
export const getOsRelease = memoize(
  // 这个异步回调接收 无，串起共享工具的等待、调用和返回。
  async (): Promise<{ id: string; idLike: string[] } | null> => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 文本内容读取`readFile`，供共享工具后续处理使用。
      const content = await readFile('/etc/os-release', 'utf8')
      // idMatch匹配`content.match`，供共享工具后续处理使用。
      const idMatch = content.match(/^ID=["']?(\S+?)["']?\s*$/m)
      // idLikeMatch匹配`content.match`，供共享工具后续处理使用。
      const idLikeMatch = content.match(/^ID_LIKE=["']?(.+?)["']?\s*$/m)
      // 返回 {，把共享工具这个分支的结果交还调用方。
      return {
        id: idMatch?.[1] ?? '',
        idLike: idLikeMatch?.[1]?.split(' ') ?? [],
      }
    } catch {
      // 返回 null，把共享工具这个分支的结果交还调用方。
      return null
    }
  },
)

// isDistroFamily 承担共享工具中的独立步骤，串起共享工具 package Managers需要的输入整理、状态更新和结果输出。
function isDistroFamily(
  osRelease: { id: string; idLike: string[] },
  families: string[],
): boolean {
  // 返回 (，把共享工具这个分支的结果交还调用方。
  return (
    families.includes(osRelease.id) ||
    // osRelease.idLike.some执行共享工具在此处需要的副作用或外部交互。
    osRelease.idLike.some(like => families.includes(like))
  )
}

/**
 * Detects if the currently running Claude instance was installed via mise
 * (a polyglot tool version manager) by checking if the executable path
 * is within a mise installs directory.
 *
 * mise installs to: ~/.local/share/mise/installs/<tool>/<version>/
 */
// detectMise 承担共享工具中的独立步骤，串起共享工具 package Managers需要的输入整理、状态更新和结果输出。
export function detectMise(): boolean {
  // execPath 文件数据记录当前扫描状态，共享工具 package Managers随后按该状态分支。
  const execPath = process.execPath || process.argv[0] || ''

  // Check if the executable is within a mise installs directory
  // 判断 /[/\\]mise[/\\]installs[/\\]/i.test(execPath)，将共享工具分流到只适用于该条件的处理路径。
  if (/[/\\]mise[/\\]installs[/\\]/i.test(execPath)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Detected mise installation: ${execPath}`)
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

/**
 * Detects if the currently running Claude instance was installed via asdf
 * (another polyglot tool version manager) by checking if the executable path
 * is within an asdf installs directory.
 *
 * asdf installs to: ~/.asdf/installs/<tool>/<version>/
 */
// detectAsdf 承担共享工具中的独立步骤，串起共享工具 package Managers需要的输入整理、状态更新和结果输出。
export function detectAsdf(): boolean {
  // execPath 文件数据记录当前扫描状态，共享工具 package Managers随后按该状态分支。
  const execPath = process.execPath || process.argv[0] || ''

  // Check if the executable is within an asdf installs directory
  // 判断 /[/\\]\.?asdf[/\\]installs[/\\]/i.test(execPath)，将共享工具分流到只适用于该条件的处理路径。
  if (/[/\\]\.?asdf[/\\]installs[/\\]/i.test(execPath)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Detected asdf installation: ${execPath}`)
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

/**
 * Detects if the currently running Claude instance was installed via Homebrew
 * by checking if the executable path is within a Homebrew Caskroom directory.
 *
 * Note: We specifically check for Caskroom because npm can also be installed via
 * Homebrew, which would place npm global packages under the same Homebrew prefix
 * (e.g., /opt/homebrew/lib/node_modules). We need to distinguish between:
 * - Homebrew cask: /opt/homebrew/Caskroom/claude-code/...
 * - npm-global (via Homebrew's npm): /opt/homebrew/lib/node_modules/@anthropic-ai/...
 */
// detectHomebrew 承担共享工具中的独立步骤，串起共享工具 package Managers需要的输入整理、状态更新和结果输出。
export function detectHomebrew(): boolean {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // Homebrew is only for macOS and Linux
  // `platform` 与 `'macos' && platform !== 'linux'...` 不一致时刷新派生状态。
  if (platform !== 'macos' && platform !== 'linux' && platform !== 'wsl') {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // Get the path of the currently running executable
  // execPath 文件数据记录当前扫描状态，共享工具 package Managers随后按该状态分支。
  const execPath = process.execPath || process.argv[0] || ''

  // Check if the executable is within a Homebrew Caskroom directory
  // This is specific to Homebrew cask installations
  // 判断 execPath.includes('/Caskroom/')，将共享工具分流到只适用于该条件的处理路径。
  if (execPath.includes('/Caskroom/')) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Detected Homebrew cask installation: ${execPath}`)
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

/**
 * Detects if the currently running Claude instance was installed via winget
 * by checking if the executable path is within a WinGet directory.
 *
 * Winget installs to:
 * - User: %LOCALAPPDATA%\Microsoft\WinGet\Packages
 * - System: C:\Program Files\WinGet\Packages
 * And creates links at: %LOCALAPPDATA%\Microsoft\WinGet\Links\
 */
// detectWinget 承担共享工具中的独立步骤，串起共享工具 package Managers需要的输入整理、状态更新和结果输出。
export function detectWinget(): boolean {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // Winget is only for Windows
  // `platform` 与 `'windows'` 不一致时刷新派生状态。
  if (platform !== 'windows') {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // execPath 文件数据记录当前扫描状态，共享工具 package Managers随后按该状态分支。
  const execPath = process.execPath || process.argv[0] || ''

  // Check for WinGet paths (handles both forward and backslashes)
  // wingetPatterns 集合聚合成有序列表，保持后续遍历顺序稳定。
  const wingetPatterns = [
    /Microsoft[/\\]WinGet[/\\]Packages/i,
    /Microsoft[/\\]WinGet[/\\]Links/i,
  ]

  // 遍历 const pattern of wingetPatterns，让共享工具逐项完成同一类处理。
  for (const pattern of wingetPatterns) {
    // 判断 pattern.test(execPath)，将共享工具分流到只适用于该条件的处理路径。
    if (pattern.test(execPath)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Detected winget installation: ${execPath}`)
      // 返回 true，把共享工具这个分支的结果交还调用方。
      return true
    }
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

/**
 * Detects if the currently running Claude instance was installed via pacman
 * by querying pacman's database for file ownership.
 *
 * We gate on the Arch distro family before invoking pacman. On other distros
 * like Ubuntu/Debian, 'pacman' in PATH may resolve to the pacman game
 * (/usr/games/pacman) rather than the Arch package manager.
 */
// detectPacman保存`memoize`，供共享工具后续处理使用。
export const detectPacman = memoize(async (): Promise<boolean> => {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // `platform` 与 `'linux'` 不一致时刷新派生状态。
  if (platform !== 'linux') {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // osRelease读取`getOsRelease`，供共享工具后续处理使用。
  const osRelease = await getOsRelease()
  // 判断 osRelease && !isDistroFamily(osRelease, ['arch'])，将共享工具分流到只适用于该条件的处理路径。
  if (osRelease && !isDistroFamily(osRelease, ['arch'])) {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // execPath 文件数据记录当前扫描状态，共享工具 package Managers随后按该状态分支。
  const execPath = process.execPath || process.argv[0] || ''

  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow('pacman', ['-Qo', execPath], {
    timeout: 5000,
    useCwd: false,
  })

  // 组合条件 `result.code === 0 && result.stdout` 成立时，共享工具才启用这条专门路径。
  if (result.code === 0 && result.stdout) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Detected pacman installation: ${result.stdout.trim()}`)
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
})

/**
 * Detects if the currently running Claude instance was installed via a .deb package
 * by querying dpkg's database for file ownership.
 *
 * We use `dpkg -S <execPath>` to check if the executable is owned by a dpkg-managed package.
 */
// detectDeb保存`memoize`，供共享工具后续处理使用。
export const detectDeb = memoize(async (): Promise<boolean> => {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // `platform` 与 `'linux'` 不一致时刷新派生状态。
  if (platform !== 'linux') {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // osRelease读取`getOsRelease`，供共享工具后续处理使用。
  const osRelease = await getOsRelease()
  // 判断 osRelease && !isDistroFamily(osRelease, ['debian'])，将共享工具分流到只适用于该条件的处理路径。
  if (osRelease && !isDistroFamily(osRelease, ['debian'])) {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // execPath 文件数据记录当前扫描状态，共享工具 package Managers随后按该状态分支。
  const execPath = process.execPath || process.argv[0] || ''

  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow('dpkg', ['-S', execPath], {
    timeout: 5000,
    useCwd: false,
  })

  // 组合条件 `result.code === 0 && result.stdout` 成立时，共享工具才启用这条专门路径。
  if (result.code === 0 && result.stdout) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Detected deb installation: ${result.stdout.trim()}`)
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
})

/**
 * Detects if the currently running Claude instance was installed via an RPM package
 * by querying the RPM database for file ownership.
 *
 * We use `rpm -qf <execPath>` to check if the executable is owned by an RPM package.
 */
// detectRpm保存`memoize`，供共享工具后续处理使用。
export const detectRpm = memoize(async (): Promise<boolean> => {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // `platform` 与 `'linux'` 不一致时刷新派生状态。
  if (platform !== 'linux') {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // osRelease读取`getOsRelease`，供共享工具后续处理使用。
  const osRelease = await getOsRelease()
  // 判断 osRelease && !isDistroFamily(osRelease, ['fedora', 'rhel', 'suse'])，将共享工具分流到只适用于该条件的处理路径。
  if (osRelease && !isDistroFamily(osRelease, ['fedora', 'rhel', 'suse'])) {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // execPath 文件数据记录当前扫描状态，共享工具 package Managers随后按该状态分支。
  const execPath = process.execPath || process.argv[0] || ''

  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow('rpm', ['-qf', execPath], {
    timeout: 5000,
    useCwd: false,
  })

  // 组合条件 `result.code === 0 && result.stdout` 成立时，共享工具才启用这条专门路径。
  if (result.code === 0 && result.stdout) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Detected rpm installation: ${result.stdout.trim()}`)
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
})

/**
 * Detects if the currently running Claude instance was installed via Alpine APK
 * by querying apk's database for file ownership.
 *
 * We use `apk info --who-owns <execPath>` to check if the executable is owned
 * by an apk-managed package.
 */
// detectApk保存`memoize`，供共享工具后续处理使用。
export const detectApk = memoize(async (): Promise<boolean> => {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // `platform` 与 `'linux'` 不一致时刷新派生状态。
  if (platform !== 'linux') {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // osRelease读取`getOsRelease`，供共享工具后续处理使用。
  const osRelease = await getOsRelease()
  // 判断 osRelease && !isDistroFamily(osRelease, ['alpine'])，将共享工具分流到只适用于该条件的处理路径。
  if (osRelease && !isDistroFamily(osRelease, ['alpine'])) {
    // 返回 false，把共享工具这个分支的结果交还调用方。
    return false
  }

  // execPath 文件数据记录当前扫描状态，共享工具 package Managers随后按该状态分支。
  const execPath = process.execPath || process.argv[0] || ''

  // 结果保存`execFileNoThrow`，供共享工具后续处理使用。
  const result = await execFileNoThrow(
    'apk',
    ['info', '--who-owns', execPath],
    {
      timeout: 5000,
      useCwd: false,
    },
  )

  // 组合条件 `result.code === 0 && result.stdout` 成立时，共享工具才启用这条专门路径。
  if (result.code === 0 && result.stdout) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Detected apk installation: ${result.stdout.trim()}`)
    // 返回 true，把共享工具这个分支的结果交还调用方。
    return true
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
})

/**
 * Memoized function to detect which package manager installed Claude
 * Returns 'unknown' if no package manager is detected
 */
// getPackageManager保存`memoize`，供共享工具后续处理使用。
export const getPackageManager = memoize(async (): Promise<PackageManager> => {
  // 判断 detectHomebrew()，将共享工具分流到只适用于该条件的处理路径。
  if (detectHomebrew()) {
    // 返回 'homebrew'，把共享工具这个分支的结果交还调用方。
    return 'homebrew'
  }

  // 判断 detectWinget()，将共享工具分流到只适用于该条件的处理路径。
  if (detectWinget()) {
    // 返回 'winget'，把共享工具这个分支的结果交还调用方。
    return 'winget'
  }

  // 判断 detectMise()，将共享工具分流到只适用于该条件的处理路径。
  if (detectMise()) {
    // 返回 'mise'，把共享工具这个分支的结果交还调用方。
    return 'mise'
  }

  // 判断 detectAsdf()，将共享工具分流到只适用于该条件的处理路径。
  if (detectAsdf()) {
    // 返回 'asdf'，把共享工具这个分支的结果交还调用方。
    return 'asdf'
  }

  // 判断 await detectPacman()，将共享工具分流到只适用于该条件的处理路径。
  if (await detectPacman()) {
    // 返回 'pacman'，把共享工具这个分支的结果交还调用方。
    return 'pacman'
  }

  // 判断 await detectApk()，将共享工具分流到只适用于该条件的处理路径。
  if (await detectApk()) {
    // 返回 'apk'，把共享工具这个分支的结果交还调用方。
    return 'apk'
  }

  // 判断 await detectDeb()，将共享工具分流到只适用于该条件的处理路径。
  if (await detectDeb()) {
    // 返回 'deb'，把共享工具这个分支的结果交还调用方。
    return 'deb'
  }

  // 判断 await detectRpm()，将共享工具分流到只适用于该条件的处理路径。
  if (await detectRpm()) {
    // 返回 'rpm'，把共享工具这个分支的结果交还调用方。
    return 'rpm'
  }

  // 返回 'unknown'，把共享工具这个分支的结果交还调用方。
  return 'unknown'
})
