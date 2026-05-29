/**
 * Protocol Handler Registration
 *
 * Registers the `claude-cli://` custom URI scheme with the OS,
 * so that clicking a `claude-cli://` link in a browser (or any app) will
 * invoke `claude --handle-uri <url>`.
 *
 * Platform details:
 *   macOS  — Creates a minimal .app trampoline in ~/Applications with
 *            CFBundleURLTypes in its Info.plist
 *   Linux  — Creates a .desktop file in $XDG_DATA_HOME/applications
 *            (default ~/.local/share/applications) and registers it with xdg-mime
 *   Windows — Writes registry keys under HKEY_CURRENT_USER\Software\Classes
 */

// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { promises as fs } from 'fs'
// 引入 * as os，将 os 中已经封装好的能力接到本文件流程里。
import * as os from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getClaudeConfigHomeDir，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir } from '../envUtils.js'
// 引入 getErrnoCode，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from '../errors.js'
// 引入 execFileNoThrow，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from '../execFileNoThrow.js'
// 引入 getInitialSettings，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getInitialSettings } from '../settings/settings.js'
// 引入 which，将 ../which.js 中已经封装好的能力接到本文件流程里。
import { which } from '../which.js'
// 引入 getUserBinDir、getXDGDataHome，将 ../xdg.js 中已经封装好的能力接到本文件流程里。
import { getUserBinDir, getXDGDataHome } from '../xdg.js'
// 引入 DEEP_LINK_PROTOCOL，将 ./parseDeepLink.js 中已经封装好的能力接到本文件流程里。
import { DEEP_LINK_PROTOCOL } from './parseDeepLink.js'

// MACOS_BUNDLE_ID固定为 `'com.anthropic.claude-code-url-handler'`，作为共享工具 register Protocol后续展示或比较的基准。
export const MACOS_BUNDLE_ID = 'com.anthropic.claude-code-url-handler'
// APP_NAME保存`'Claude Code URL Handler'`，作为后续固定文本处理的输入。
const APP_NAME = 'Claude Code URL Handler'
// DESKTOP_FILE_NAME 文件数据 命名 `'claude-code-url-handler.desktop'`，让后续代码直接表达这个值的用途。
const DESKTOP_FILE_NAME = 'claude-code-url-handler.desktop'
// MACOS_APP_NAME保存`'Claude Code URL Handler.app'`，作为后续固定文本处理的输入。
const MACOS_APP_NAME = 'Claude Code URL Handler.app'

// Shared between register* (writes these paths/values) and
// isProtocolHandlerCurrent (reads them back). Keep the writer and reader
// in lockstep — drift here means the check returns a perpetual false.
// MACOS_APP_DIR格式化`path.join`，供共享工具后续处理使用。
const MACOS_APP_DIR = path.join(os.homedir(), 'Applications', MACOS_APP_NAME)
// MACOS_SYMLINK_PATH 路径数据格式化`path.join`，供共享工具后续处理使用。
const MACOS_SYMLINK_PATH = path.join(
  MACOS_APP_DIR,
  'Contents',
  'MacOS',
  'claude',
)
// linuxDesktopPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function linuxDesktopPath(): string {
  // 返回 `path.join(getXDGDataHome(), 'applications', DESKTOP_FILE_NAME)`，作为共享工具这次计算的结果。
  return path.join(getXDGDataHome(), 'applications', DESKTOP_FILE_NAME)
}
// WINDOWS_REG_KEY固定为 ``HKEY_CURRENT_USER\\Software\\Classes\\${DEEP_LINK_PROTOC...`，作为共享工具 register Protocol后续展示或比较的基准。
const WINDOWS_REG_KEY = `HKEY_CURRENT_USER\\Software\\Classes\\${DEEP_LINK_PROTOCOL}`
// WINDOWS_COMMAND_KEY 命令数据 命名 ``${WINDOWS_REG_KEY}\\shell\\open\\command``，让后续代码直接表达这个值的用途。
const WINDOWS_COMMAND_KEY = `${WINDOWS_REG_KEY}\\shell\\open\\command`

// FAILURE_BACKOFF_MS 集合保存`24 * 60 * 60 * 1000`，供后续判断或组装使用。
const FAILURE_BACKOFF_MS = 24 * 60 * 60 * 1000

// linuxExecLine 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function linuxExecLine(claudePath: string): string {
  // 返回 ``Exec="${claudePath}" --handle-uri %u``，作为共享工具这次计算的结果。
  return `Exec="${claudePath}" --handle-uri %u`
}
// windowsCommandValue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function windowsCommandValue(claudePath: string): string {
  // 返回 ``"${claudePath}" --handle-uri "%1"``，作为共享工具这次计算的结果。
  return `"${claudePath}" --handle-uri "%1"`
}

/**
 * Register the protocol handler on macOS.
 *
 * Creates a .app bundle where the CFBundleExecutable is a symlink to the
 * already-installed (and signed) `claude` binary. When macOS opens a
 * `claude-cli://` URL, it launches `claude` through this app bundle.
 * Claude then uses the url-handler NAPI module to read the URL from the
 * Apple Event and handles it normally.
 *
 * This approach avoids shipping a separate executable (which would need
 * to be signed and allowlisted by endpoint security tools like Santa).
 */
// registerMacos 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function registerMacos(claudePath: string): Promise<void> {
  // contentsDir格式化`path.join`，供共享工具后续处理使用。
  const contentsDir = path.join(MACOS_APP_DIR, 'Contents')

  // Remove any existing app bundle to start clean
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fs.rm(MACOS_APP_DIR, { recursive: true })` 完成，再继续共享工具 register Protocol的异步流程。
    await fs.rm(MACOS_APP_DIR, { recursive: true })
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT') {
      // 抛出 e，阻止共享工具在无效状态下继续运行。
      throw e
    }
  }

  // 等待 `fs.mkdir(path.dirname(MACOS_SYMLINK_PATH), { recursive: true })` 完成，再继续共享工具 register Protocol的异步流程。
  await fs.mkdir(path.dirname(MACOS_SYMLINK_PATH), { recursive: true })

  // Info.plist — registers the URL scheme with claude as the executable
  // infoPlist 集合固定为 ``<?xml version="1.0" encoding="UTF-8"?>`，作为共享工具 register Protocol后续展示或比较的基准。
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${MACOS_BUNDLE_ID}</string>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleExecutable</key>
  <string>claude</string>
  <key>CFBundleVersion</key>
  <string>1.0</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>LSBackgroundOnly</key>
  <true/>
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleURLName</key>
      <string>Claude Code Deep Link</string>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>${DEEP_LINK_PROTOCOL}</string>
      </array>
    </dict>
  </array>
</dict>
</plist>`

  // 等待 `fs.writeFile(path.join(contentsDir, 'Info.plist'), infoPlist)` 完成，再继续共享工具 register Protocol的异步流程。
  await fs.writeFile(path.join(contentsDir, 'Info.plist'), infoPlist)

  // Symlink to the already-signed claude binary — avoids a new executable
  // that would need signing and endpoint-security allowlisting.
  // Written LAST among the throwing fs calls: isProtocolHandlerCurrent reads
  // this symlink, so it acts as the commit marker. If Info.plist write
  // failed above, no symlink → next session retries.
  // 等待 `fs.symlink(claudePath, MACOS_SYMLINK_PATH)` 完成，再继续共享工具 register Protocol的异步流程。
  await fs.symlink(claudePath, MACOS_SYMLINK_PATH)

  // Re-register the app with LaunchServices so macOS picks up the URL scheme.
  // lsregister 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const lsregister =
    '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister'
  // 等待 `execFileNoThrow(lsregister, ['-R', MACOS_APP_DIR], { useCwd: false })` 完成，再继续共享工具 register Protocol的异步流程。
  await execFileNoThrow(lsregister, ['-R', MACOS_APP_DIR], { useCwd: false })

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Registered ${DEEP_LINK_PROTOCOL}:// protocol handler at ${MACOS_APP_DIR}`,
  )
}

/**
 * Register the protocol handler on Linux.
 * Creates a .desktop file and registers it with xdg-mime.
 */
// registerLinux 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function registerLinux(claudePath: string): Promise<void> {
  // 等待 `fs.mkdir(path.dirname(linuxDesktopPath()), { recursive: true })` 完成，再继续共享工具 register Protocol的异步流程。
  await fs.mkdir(path.dirname(linuxDesktopPath()), { recursive: true })

  // desktopEntry固定为 ``[Desktop Entry]`，作为共享工具 register Protocol后续展示或比较的基准。
  const desktopEntry = `[Desktop Entry]
Name=${APP_NAME}
Comment=Handle ${DEEP_LINK_PROTOCOL}:// deep links for Claude Code
${linuxExecLine(claudePath)}
Type=Application
NoDisplay=true
MimeType=x-scheme-handler/${DEEP_LINK_PROTOCOL};
`

  // 等待 `fs.writeFile(linuxDesktopPath(), desktopEntry)` 完成，再继续共享工具 register Protocol的异步流程。
  await fs.writeFile(linuxDesktopPath(), desktopEntry)

  // Register as the default handler for the scheme. On headless boxes
  // (WSL, Docker, CI) xdg-utils isn't installed — not a failure: there's
  // no desktop to click links from, and some apps read the .desktop
  // MimeType line directly. The artifact check still short-circuits
  // next session since the .desktop file is present.
  // xdgMime保存`which`，供共享工具后续处理使用。
  const xdgMime = await which('xdg-mime')
  // 满足 `xdgMime` 时，共享工具执行该分支。
  if (xdgMime) {
    // 从 `await execFileNoThrow(` 解构 code，减少共享工具 register Protocol对同一对象的重复访问。
    const { code } = await execFileNoThrow(
      xdgMime,
      ['default', DESKTOP_FILE_NAME, `x-scheme-handler/${DEEP_LINK_PROTOCOL}`],
      { useCwd: false },
    )
    // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 0) {
      // 抛出 Object.assign(new Error(`xdg-mime exited with code ${code}`), {，阻止共享工具在无效状态下继续运行。
      throw Object.assign(new Error(`xdg-mime exited with code ${code}`), {
        code: 'XDG_MIME_FAILED',
      })
    }
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Registered ${DEEP_LINK_PROTOCOL}:// protocol handler at ${linuxDesktopPath()}`,
  )
}

/**
 * Register the protocol handler on Windows via the registry.
 */
// registerWindows 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function registerWindows(claudePath: string): Promise<void> {
  // 调用 for，触发共享工具此处需要的副作用。
  for (const args of [
    ['add', WINDOWS_REG_KEY, '/ve', '/d', `URL:${APP_NAME}`, '/f'],
    ['add', WINDOWS_REG_KEY, '/v', 'URL Protocol', '/d', '', '/f'],
    [
      'add',
      WINDOWS_COMMAND_KEY,
      '/ve',
      '/d',
      windowsCommandValue(claudePath),
      '/f',
    ],
  ]) {
    // 从 `await execFileNoThrow('reg', args, { useCwd: false })` 解构 code，减少共享工具 register Protocol对同一对象的重复访问。
    const { code } = await execFileNoThrow('reg', args, { useCwd: false })
    // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 0) {
      // 抛出 Object.assign(new Error(`reg add exited with code ${code}`), {，阻止共享工具在无效状态下继续运行。
      throw Object.assign(new Error(`reg add exited with code ${code}`), {
        code: 'REG_FAILED',
      })
    }
  }

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Registered ${DEEP_LINK_PROTOCOL}:// protocol handler in Windows registry`,
  )
}

/**
 * Register the `claude-cli://` protocol handler with the operating system.
 * After registration, clicking a `claude-cli://` link will invoke claude.
 */
// registerProtocolHandler 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function registerProtocolHandler(
  claudePath?: string,
): Promise<void> {
  // resolved读取`resolveClaudePath`，供共享工具后续处理使用。
  const resolved = claudePath ?? (await resolveClaudePath())

  // 按照 process.platform 的取值选择共享工具的具体处理分支。
  switch (process.platform) {
    case 'darwin':
      // 等待 `registerMacos(resolved)` 完成，再继续共享工具 register Protocol的异步流程。
      await registerMacos(resolved)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'linux':
      // 等待 `registerLinux(resolved)` 完成，再继续共享工具 register Protocol的异步流程。
      await registerLinux(resolved)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    case 'win32':
      // 等待 `registerWindows(resolved)` 完成，再继续共享工具 register Protocol的异步流程。
      await registerWindows(resolved)
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    default:
      // 抛出 new Error(`Unsupported platform: ${process.platform}`)，阻止共享工具在无效状态下继续运行。
      throw new Error(`Unsupported platform: ${process.platform}`)
  }
}

/**
 * Resolve the claude binary path for protocol registration. Prefers the
 * native installer's stable symlink (~/.local/bin/claude) which survives
 * auto-updates; falls back to process.execPath when the symlink is absent
 * (dev builds, non-native installs).
 */
// resolveClaudePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function resolveClaudePath(): Promise<string> {
  // binaryName标记共享工具 register Protocol是否启用对应路径。
  const binaryName = process.platform === 'win32' ? 'claude.exe' : 'claude'
  // stablePath 路径数据格式化`path.join`，供共享工具后续处理使用。
  const stablePath = path.join(getUserBinDir(), binaryName)
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fs.realpath(stablePath)` 完成，再继续共享工具 register Protocol的异步流程。
    await fs.realpath(stablePath)
    // 返回 `stablePath`，作为共享工具这次计算的结果。
    return stablePath
  } catch {
    // 返回 `process.execPath`，作为共享工具这次计算的结果。
    return process.execPath
  }
}

/**
 * Check whether the OS-level protocol handler is already registered AND
 * points at the expected `claude` binary. Reads the registration artifact
 * directly (symlink target, .desktop Exec line, registry value) rather than
 * a cached flag in ~/.claude.json, so:
 *   - the check is per-machine (config can sync across machines; OS state can't)
 *   - stale paths self-heal (install-method change → re-register next session)
 *   - deleted artifacts self-heal
 *
 * Any read error (ENOENT, EACCES, reg nonzero) → false → re-register.
 */
// isProtocolHandlerCurrent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isProtocolHandlerCurrent(
  claudePath: string,
): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 按照 process.platform 的取值选择共享工具的具体处理分支。
    switch (process.platform) {
      case 'darwin': {
        // target读取`fs.readlink`，供共享工具后续处理使用。
        const target = await fs.readlink(MACOS_SYMLINK_PATH)
        // 返回 `target === claudePath`，作为共享工具这次计算的结果。
        return target === claudePath
      }
      case 'linux': {
        // 文本内容读取`fs.readFile`，供共享工具后续处理使用。
        const content = await fs.readFile(linuxDesktopPath(), 'utf8')
        // 返回 `content.includes(linuxExecLine(claudePath))`，作为共享工具这次计算的结果。
        return content.includes(linuxExecLine(claudePath))
      }
      case 'win32': {
        // 从 `await execFileNoThrow(` 解构 stdout、code，减少共享工具 register Protocol对同一对象的重复访问。
        const { stdout, code } = await execFileNoThrow(
          'reg',
          ['query', WINDOWS_COMMAND_KEY, '/ve'],
          { useCwd: false },
        )
        // 返回 `code === 0 && stdout.includes(windowsCommandValue(claudePath))`，作为共享工具这次计算的结果。
        return code === 0 && stdout.includes(windowsCommandValue(claudePath))
      }
      default:
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
    }
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Auto-register the claude-cli:// deep link protocol handler when missing
 * or stale. Runs every session from backgroundHousekeeping (fire-and-forget),
 * but the artifact check makes it a no-op after the first successful run
 * unless the install path moves or the OS artifact is deleted.
 */
// ensureDeepLinkProtocolRegistered 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureDeepLinkProtocolRegistered(): Promise<void> {
  // 当 `getInitialSettings().disableDeepLinkRegistr...` 匹配 `'disable'` 时，共享工具执行对应分支。
  if (getInitialSettings().disableDeepLinkRegistration === 'disable') {
    // 共享工具 register Protocol在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 满足 `!getFeatureValue_CACHED_MAY_BE_STALE('tengu_lodestone_enabled', false)` 时，共享工具执行该分支。
  if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_lodestone_enabled', false)) {
    // 共享工具 register Protocol在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // claudePath 路径数据读取`resolveClaudePath`，供共享工具后续处理使用。
  const claudePath = await resolveClaudePath()
  // 满足 `await isProtocolHandlerCurrent(claudePath)` 时，共享工具执行该分支。
  if (await isProtocolHandlerCurrent(claudePath)) {
    // 共享工具 register Protocol在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // EACCES/ENOSPC are deterministic — retrying next session won't help.
  // Throttle to once per 24h so a read-only ~/.local/share/applications
  // doesn't generate a failure event on every startup. Marker lives in
  // ~/.claude (per-machine, not synced) rather than ~/.claude.json (can sync).
  // failureMarkerPath 路径数据格式化`path.join`，供共享工具后续处理使用。
  const failureMarkerPath = path.join(
    getClaudeConfigHomeDir(),
    '.deep-link-register-failed',
  )
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stat保存`fs.stat`，供共享工具后续处理使用。
    const stat = await fs.stat(failureMarkerPath)
    // 满足 `Date.now() - stat.mtimeMs < FAILURE_BACKOFF_MS` 时，共享工具执行该分支。
    if (Date.now() - stat.mtimeMs < FAILURE_BACKOFF_MS) {
      // 共享工具 register Protocol在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  } catch {
    // Marker absent — proceed.
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `registerProtocolHandler(claudePath)` 完成，再继续共享工具 register Protocol的异步流程。
    await registerProtocolHandler(claudePath)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_deep_link_registered', { success: true })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Auto-registered claude-cli:// deep link protocol handler')
    // 这个回调绑定到 await fs.rm(failureMarkerPath, { force: true }).catch(() => {})，负责共享工具在该局部场景下的响应。
    await fs.rm(failureMarkerPath, { force: true }).catch(() => {})
  } catch (error) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_deep_link_registered', {
      success: false,
      error_code:
        code as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to auto-register deep link protocol handler: ${error instanceof Error ? error.message : String(error)}`,
      { level: 'warn' },
    )
    // 当 `code` 匹配 `'EACCES' || code === 'ENOSP...` 时，共享工具执行对应分支。
    if (code === 'EACCES' || code === 'ENOSPC') {
      // 这个回调绑定到 await fs.writeFile(failureMarkerPath, '').catch(() => {})，负责共享工具在该局部场景下的响应。
      await fs.writeFile(failureMarkerPath, '').catch(() => {})
    }
  }
}
