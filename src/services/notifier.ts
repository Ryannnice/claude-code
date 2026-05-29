// 类型依赖 { TerminalNotification } 来自 ../ink/useTerminalNotification.js，用于校准服务层 notifier的数据契约。
import type { TerminalNotification } from '../ink/useTerminalNotification.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js'
// 复用 env 工具函数，把通用处理留在 ../utils/env.js 中维护。
import { env } from '../utils/env.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../utils/execFileNoThrow.js'
// 复用 executeNotificationHooks 工具函数，把通用处理留在 ../utils/hooks.js 中维护。
import { executeNotificationHooks } from '../utils/hooks.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 整理这一组导入，让服务层 notifier后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from './analytics/index.js'

// NotificationOptions 固化服务层 notifier里传递的数据形状，帮助调用方按同一结构读写字段。
export type NotificationOptions = {
  message: string
  title?: string
  notificationType: string
}

// sendNotification 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sendNotification(
  notif: NotificationOptions,
  terminal: TerminalNotification,
): Promise<void> {
  // 配置读取`getGlobalConfig`，供服务层 notifier后续处理使用。
  const config = getGlobalConfig()
  // channel保存`config.preferredNotifChannel`，供服务层 notifier后续判断或输出使用。
  const channel = config.preferredNotifChannel

  // 等待 `executeNotificationHooks(notif)` 完成，再继续服务层 notifier的异步流程。
  await executeNotificationHooks(notif)

  // methodUsed保存`sendToChannel`，供服务层 notifier后续处理使用。
  const methodUsed = await sendToChannel(channel, notif, terminal)

  // 记录服务层 notifier运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_notification_method_used', {
    configured_channel:
      channel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    method_used:
      methodUsed as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    term: env.terminal as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
}

// DEFAULT_TITLE 标题固定为 `'Claude Code'`，作为服务层 notifier后续展示或比较的基准。
const DEFAULT_TITLE = 'Claude Code'

// sendToChannel 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function sendToChannel(
  channel: string,
  opts: NotificationOptions,
  terminal: TerminalNotification,
): Promise<string> {
  // title 标题标记服务层 notifier是否启用对应路径。
  const title = opts.title || DEFAULT_TITLE

  // 保护这一段可能失败的服务层 notifier操作，确保异常能进入相邻错误处理。
  try {
    // 按照 channel 的取值选择服务层 notifier的具体处理分支。
    switch (channel) {
      case 'auto':
        // 返回 `sendAuto(opts, terminal)`，作为服务层 notifier这次计算的结果。
        return sendAuto(opts, terminal)
      case 'iterm2':
        // 调用 terminal.notifyITerm2，触发服务层 notifier此处需要的副作用。
        terminal.notifyITerm2(opts)
        // 返回 `'iterm2'`，作为服务层 notifier这次计算的结果。
        return 'iterm2'
      case 'iterm2_with_bell':
        // 调用 terminal.notifyITerm2，触发服务层 notifier此处需要的副作用。
        terminal.notifyITerm2(opts)
        // 调用 terminal.notifyBell，触发服务层 notifier此处需要的副作用。
        terminal.notifyBell()
        // 返回 `'iterm2_with_bell'`，作为服务层 notifier这次计算的结果。
        return 'iterm2_with_bell'
      case 'kitty':
        // 调用 terminal.notifyKitty，触发服务层 notifier此处需要的副作用。
        terminal.notifyKitty({ ...opts, title, id: generateKittyId() })
        // 返回 `'kitty'`，作为服务层 notifier这次计算的结果。
        return 'kitty'
      case 'ghostty':
        // 调用 terminal.notifyGhostty，触发服务层 notifier此处需要的副作用。
        terminal.notifyGhostty({ ...opts, title })
        // 返回 `'ghostty'`，作为服务层 notifier这次计算的结果。
        return 'ghostty'
      case 'terminal_bell':
        // 调用 terminal.notifyBell，触发服务层 notifier此处需要的副作用。
        terminal.notifyBell()
        // 返回 `'terminal_bell'`，作为服务层 notifier这次计算的结果。
        return 'terminal_bell'
      case 'notifications_disabled':
        // 返回 `'disabled'`，作为服务层 notifier这次计算的结果。
        return 'disabled'
      default:
        // 返回 `'none'`，作为服务层 notifier这次计算的结果。
        return 'none'
    }
  } catch {
    // 返回 `'error'`，作为服务层 notifier这次计算的结果。
    return 'error'
  }
}

// sendAuto 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function sendAuto(
  opts: NotificationOptions,
  terminal: TerminalNotification,
): Promise<string> {
  // title 标题标记服务层 notifier是否启用对应路径。
  const title = opts.title || DEFAULT_TITLE

  // 按照 env.terminal 的取值选择服务层 notifier的具体处理分支。
  switch (env.terminal) {
    case 'Apple_Terminal': {
      // bellDisabled保存`isAppleTerminalBellDisabled`，供服务层 notifier后续处理使用。
      const bellDisabled = await isAppleTerminalBellDisabled()
      // 满足 `bellDisabled` 时，服务层 notifier执行该分支。
      if (bellDisabled) {
        // 调用 terminal.notifyBell，触发服务层 notifier此处需要的副作用。
        terminal.notifyBell()
        // 返回 `'terminal_bell'`，作为服务层 notifier这次计算的结果。
        return 'terminal_bell'
      }
      // 返回 `'no_method_available'`，作为服务层 notifier这次计算的结果。
      return 'no_method_available'
    }
    case 'iTerm.app':
      // 调用 terminal.notifyITerm2，触发服务层 notifier此处需要的副作用。
      terminal.notifyITerm2(opts)
      // 返回 `'iterm2'`，作为服务层 notifier这次计算的结果。
      return 'iterm2'
    case 'kitty':
      // 调用 terminal.notifyKitty，触发服务层 notifier此处需要的副作用。
      terminal.notifyKitty({ ...opts, title, id: generateKittyId() })
      // 返回 `'kitty'`，作为服务层 notifier这次计算的结果。
      return 'kitty'
    case 'ghostty':
      // 调用 terminal.notifyGhostty，触发服务层 notifier此处需要的副作用。
      terminal.notifyGhostty({ ...opts, title })
      // 返回 `'ghostty'`，作为服务层 notifier这次计算的结果。
      return 'ghostty'
    default:
      // 返回 `'no_method_available'`，作为服务层 notifier这次计算的结果。
      return 'no_method_available'
  }
}

// generateKittyId 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateKittyId(): number {
  // 返回 `Math.floor(Math.random() * 10000)`，作为服务层 notifier这次计算的结果。
  return Math.floor(Math.random() * 10000)
}

// isAppleTerminalBellDisabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isAppleTerminalBellDisabled(): Promise<boolean> {
  // 保护这一段可能失败的服务层 notifier操作，确保异常能进入相邻错误处理。
  try {
    // `env.terminal` 与 `'Apple_Terminal'` 不一致时刷新派生状态，避免使用过期结果。
    if (env.terminal !== 'Apple_Terminal') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // osascriptResult保存`execFileNoThrow`，供服务层 notifier后续处理使用。
    const osascriptResult = await execFileNoThrow('osascript', [
      '-e',
      'tell application "Terminal" to name of current settings of front window',
    ])
    // currentProfile 文件数据格式化`stdout.trim`，供服务层 notifier后续处理使用。
    const currentProfile = osascriptResult.stdout.trim()

    // currentProfile 文件数据缺失时提前走兜底路径，避免服务层 notifier继续依赖无效输入。
    if (!currentProfile) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // defaultsOutput保存`execFileNoThrow`，供服务层 notifier后续处理使用。
    const defaultsOutput = await execFileNoThrow('defaults', [
      'export',
      'com.apple.Terminal',
      '-',
    ])

    // `defaultsOutput.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (defaultsOutput.code !== 0) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Lazy-load plist (~280KB with xmlbuilder+@xmldom) — only hit on
    // Apple_Terminal with auto-channel, which is a small fraction of users.
    // plist 集合保存`import`，供服务层 notifier后续处理使用。
    const plist = await import('plist')
    // 解析结果解析`plist.parse(defaultsOutput.stdout)`，供后续判断或组装使用。
    const parsed: Record<string, unknown> = plist.parse(defaultsOutput.stdout)
    // windowSettings 集合读取 `parsed?.['Window Settings'] as` 对应条目，后续围绕该成员继续处理。
    const windowSettings = parsed?.['Window Settings'] as
      | Record<string, unknown>
      | undefined
    // profileSettings 文件数据保存`windowSettings?.[currentProfile] as`，供服务层 notifier后续判断或输出使用。
    const profileSettings = windowSettings?.[currentProfile] as
      | Record<string, unknown>
      | undefined

    // profileSettings 文件数据缺失时提前走兜底路径，避免服务层 notifier继续依赖无效输入。
    if (!profileSettings) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 返回 `profileSettings.Bell === false`，作为服务层 notifier这次计算的结果。
    return profileSettings.Bell === false
  } catch (error) {
    // 记录服务层 notifier运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}
