// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 复用 fileHistoryEnabled 工具函数，把通用处理留在 src/utils/fileHistory.js 中维护。
import { fileHistoryEnabled } from 'src/utils/fileHistory.js'
// 整理这一组导入，让服务层 tip Registry后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  getSettings_DEPRECATED,
  getSettingsForSource,
} from 'src/utils/settings/settings.js'
// 注册 shouldOfferTerminalSetup 命令实现，后续会把它纳入斜杠命令集合。
import { shouldOfferTerminalSetup } from '../../commands/terminalSetup/terminalSetup.js'
// 复用 getDesktopUpsellConfig 终端界面组件，避免在这里重复拼装显示逻辑。
import { getDesktopUpsellConfig } from '../../components/DesktopUpsell/DesktopUpsellStartup.js'
// 复用 color 终端界面组件，避免在这里重复拼装显示逻辑。
import { color } from '../../components/design-system/color.js'
// 复用 shouldShowOverageCreditUpsell 终端界面组件，避免在这里重复拼装显示逻辑。
import { shouldShowOverageCreditUpsell } from '../../components/LogoV2/OverageCreditUpsell.js'
// 引入 getShortcutDisplay，将 ../../keybindings/shortcutFormat.js 中已经封装好的能力接到本文件流程里。
import { getShortcutDisplay } from '../../keybindings/shortcutFormat.js'
// 接入 isKairosCronEnabled 工具实现，后续工具池会按权限和开关决定是否暴露。
import { isKairosCronEnabled } from '../../tools/ScheduleCronTool/prompt.js'
// 复用 is1PApiCustomer 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { is1PApiCustomer } from '../../utils/auth.js'
// 复用 countConcurrentSessions 工具函数，把通用处理留在 ../../utils/concurrentSessions.js 中维护。
import { countConcurrentSessions } from '../../utils/concurrentSessions.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig } from '../../utils/config.js'
// 整理这一组导入，让服务层 tip Registry后续逻辑可以直接复用这些外部能力。
import {
  getEffortEnvOverride,
  modelSupportsEffort,
} from '../../utils/effort.js'
// 复用 env 工具函数，把通用处理留在 ../../utils/env.js 中维护。
import { env } from '../../utils/env.js'
// 复用 cacheKeys 工具函数，把通用处理留在 ../../utils/fileStateCache.js 中维护。
import { cacheKeys } from '../../utils/fileStateCache.js'
// 复用 getWorktreeCount 工具函数，把通用处理留在 ../../utils/git.js 中维护。
import { getWorktreeCount } from '../../utils/git.js'
// 整理这一组导入，让服务层 tip Registry后续逻辑可以直接复用这些外部能力。
import {
  detectRunningIDEsCached,
  getSortedIdeLockfiles,
  isCursorInstalled,
  isSupportedTerminal,
  isSupportedVSCodeTerminal,
  isVSCodeInstalled,
  isWindsurfInstalled,
} from '../../utils/ide.js'
// 整理这一组导入，让服务层 tip Registry后续逻辑可以直接复用这些外部能力。
import {
  getMainLoopModel,
  getUserSpecifiedModelSetting,
} from '../../utils/model/model.js'
// 复用 getPlatform 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform } from '../../utils/platform.js'
// 复用 isPluginInstalled 工具函数，把通用处理留在 ../../utils/plugins/installedPluginsManager.js 中维护。
import { isPluginInstalled } from '../../utils/plugins/installedPluginsManager.js'
// 复用 loadKnownMarketplacesConfigSafe 工具函数，把通用处理留在 ../../utils/plugins/marketplaceManager.js 中维护。
import { loadKnownMarketplacesConfigSafe } from '../../utils/plugins/marketplaceManager.js'
// 复用 OFFICIAL_MARKETPLACE_NAME 工具函数，把通用处理留在 ../../utils/plugins/officialMarketplace.js 中维护。
import { OFFICIAL_MARKETPLACE_NAME } from '../../utils/plugins/officialMarketplace.js'
// 整理这一组导入，让服务层 tip Registry后续逻辑可以直接复用这些外部能力。
import {
  getCurrentSessionAgentColor,
  isCustomTitleEnabled,
} from '../../utils/sessionStorage.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
// 整理这一组导入，让服务层 tip Registry后续逻辑可以直接复用这些外部能力。
import {
  formatGrantAmount,
  getCachedOverageCreditGrant,
} from '../api/overageCreditGrant.js'
// 整理这一组导入，让服务层 tip Registry后续逻辑可以直接复用这些外部能力。
import {
  checkCachedPassesEligibility,
  formatCreditAmount,
  getCachedReferrerReward,
} from '../api/referral.js'
// 引入 getSessionsSinceLastShown，将 ./tipHistory.js 中已经封装好的能力接到本文件流程里。
import { getSessionsSinceLastShown } from './tipHistory.js'
// 类型依赖 { Tip, TipContext } 来自 ./types.js，用于校准服务层 tip Registry的数据契约。
import type { Tip, TipContext } from './types.js'

// _isOfficialMarketplaceInstalledCache 市场数据 先占位，稍后的条件分支会根据实际输入补齐它。
let _isOfficialMarketplaceInstalledCache: boolean | undefined
// isOfficialMarketplaceInstalled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isOfficialMarketplaceInstalled(): Promise<boolean> {
  // `_isOfficialMarketplaceInstalledCache` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (_isOfficialMarketplaceInstalledCache !== undefined) {
    // 返回 `_isOfficialMarketplaceInstalledCache`，作为服务层 tip Registry这次计算的结果。
    return _isOfficialMarketplaceInstalledCache
  }
  // 配置读取`loadKnownMarketplacesConfigSafe`，供服务层 tip Registry后续处理使用。
  const config = await loadKnownMarketplacesConfigSafe()
  // _isOfficialMarketplaceInstalledCache 市场数据更新为 `OFFICIAL_MARKETPLACE_NAME in config`，确保服务层后续读取最新状态。
  _isOfficialMarketplaceInstalledCache = OFFICIAL_MARKETPLACE_NAME in config
  // 返回 `_isOfficialMarketplaceInstalledCache`，作为服务层 tip Registry这次计算的结果。
  return _isOfficialMarketplaceInstalledCache
}

// isMarketplacePluginRelevant 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isMarketplacePluginRelevant(
  pluginName: string,
  context: TipContext | undefined,
  signals: { filePath?: RegExp; cli?: string[] },
): Promise<boolean> {
  // 满足 `!(await isOfficialMarketplaceInstalled())` 时，服务层 tip Registry执行该分支。
  if (!(await isOfficialMarketplaceInstalled())) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `isPluginInstalled(`${pluginName}@${OFFICIAL_MARKETPLACE_NAME}`)` 时，服务层 tip Registry执行该分支。
  if (isPluginInstalled(`${pluginName}@${OFFICIAL_MARKETPLACE_NAME}`)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 从 `context ?? {}` 解构 bashTools，减少服务层 tip Registry对同一对象的重复访问。
  const { bashTools } = context ?? {}
  // 组合条件 `signals.cli && bashTools?.size` 成立时，服务层 tip Registry才启用这条专门路径。
  if (signals.cli && bashTools?.size) {
    // 满足 `signals.cli.some(cmd => bashTools.has(cmd))` 时，服务层 tip Registry执行该分支。
    if (signals.cli.some(cmd => bashTools.has(cmd))) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 组合条件 `signals.filePath && context?.readFileState` 成立时，服务层 tip Registry才启用这条专门路径。
  if (signals.filePath && context?.readFileState) {
    // readFiles 文件数据保存`cacheKeys`，供服务层 tip Registry后续处理使用。
    const readFiles = cacheKeys(context.readFileState)
    // 满足 `readFiles.some(fp => signals.filePath!.test(fp))` 时，服务层 tip Registry执行该分支。
    if (readFiles.some(fp => signals.filePath!.test(fp))) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// externalTips 集合 聚合成有序列表，保持后续遍历顺序稳定。
const externalTips: Tip[] = [
  {
    id: 'new-user-warmup',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      `Start with small features or bug fixes, tell Claude to propose a plan, and verify its suggested edits`,
    cooldownSessions: 3,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `config.numStartups < 10`，作为服务层 tip Registry这次计算的结果。
      return config.numStartups < 10
    },
  },
  {
    id: 'plan-mode-for-complex-tasks',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      `Use Plan Mode to prepare for a complex request before making changes. Press ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} twice to enable.`,
    cooldownSessions: 5,
    // 这个回调绑定到 isRelevant: async () => {，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => {
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 tip Registry执行对应分支。
      if (process.env.USER_TYPE === 'ant') return false
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // Show to users who haven't used plan mode recently (7+ days)
      // daysSinceLastUse保存`config.lastPlanModeUse`，供后续判断或组装使用。
      const daysSinceLastUse = config.lastPlanModeUse
        ? (Date.now() - config.lastPlanModeUse) / (1000 * 60 * 60 * 24)
        : Infinity
      // 返回 `daysSinceLastUse > 7`，作为服务层 tip Registry这次计算的结果。
      return daysSinceLastUse > 7
    },
  },
  {
    id: 'default-permission-mode-config',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      `Use /config to change your default permission mode (including Plan Mode)`,
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => {，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => {
      // 保护这一段可能失败的服务层 tip Registry操作，确保异常能进入相邻错误处理。
      try {
        // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
        const config = getGlobalConfig()
        // settings 集合读取`getSettings_DEPRECATED`，供服务层 tip Registry后续处理使用。
        const settings = getSettings_DEPRECATED()
        // Show if they've used plan mode but haven't set a default
        // hasUsedPlanMode记录 `Boolean` 是否成立，服务层 tip Registry随后按该结果分支。
        const hasUsedPlanMode = Boolean(config.lastPlanModeUse)
        // hasDefaultMode记录 `Boolean` 是否成立，服务层 tip Registry随后按该结果分支。
        const hasDefaultMode = Boolean(settings?.permissions?.defaultMode)
        // 返回 `hasUsedPlanMode && !hasDefaultMode`，作为服务层 tip Registry这次计算的结果。
        return hasUsedPlanMode && !hasDefaultMode
      } catch (error) {
        // 记录服务层 tip Registry运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Failed to check default-permission-mode-config tip relevance: ${error}`,
          { level: 'warn' },
        )
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    },
  },
  {
    id: 'git-worktrees',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Use git worktrees to run multiple Claude sessions in parallel.',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => {，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => {
      // 保护这一段可能失败的服务层 tip Registry操作，确保异常能进入相邻错误处理。
      try {
        // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
        const config = getGlobalConfig()
        // worktreeCount 数量读取`getWorktreeCount`，供服务层 tip Registry后续处理使用。
        const worktreeCount = await getWorktreeCount()
        // 返回 `worktreeCount <= 1 && config.numStartups > 50`，作为服务层 tip Registry这次计算的结果。
        return worktreeCount <= 1 && config.numStartups > 50
      } catch (_) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    },
  },
  {
    id: 'color-when-multi-clauding',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Running multiple Claude sessions? Use /color and /rename to tell them apart at a glance.',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => {，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => {
      // 满足 `getCurrentSessionAgentColor()` 时，服务层 tip Registry执行该分支。
      if (getCurrentSessionAgentColor()) return false
      // count 数量统计`countConcurrentSessions`，供服务层 tip Registry后续处理使用。
      const count = await countConcurrentSessions()
      // 返回 `count >= 2`，作为服务层 tip Registry这次计算的结果。
      return count >= 2
    },
  },
  {
    id: 'terminal-setup',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      env.terminal === 'Apple_Terminal'
        ? 'Run /terminal-setup to enable convenient terminal integration like Option + Enter for new line and more'
        : 'Run /terminal-setup to enable convenient terminal integration like Shift + Enter for new line and more',
    cooldownSessions: 10,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 当 `env.terminal` 匹配 `'Apple_Terminal'` 时，服务层 tip Registry执行对应分支。
      if (env.terminal === 'Apple_Terminal') {
        // 返回 `!config.optionAsMetaKeyInstalled`，作为服务层 tip Registry这次计算的结果。
        return !config.optionAsMetaKeyInstalled
      }
      // 返回 `!config.shiftEnterKeyBindingInstalled`，作为服务层 tip Registry这次计算的结果。
      return !config.shiftEnterKeyBindingInstalled
    },
  },
  {
    id: 'shift-enter',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      env.terminal === 'Apple_Terminal'
        ? 'Press Option+Enter to send a multi-line message'
        : 'Press Shift+Enter to send a multi-line message',
    cooldownSessions: 10,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `Boolean(`，作为服务层 tip Registry这次计算的结果。
      return Boolean(
        (env.terminal === 'Apple_Terminal'
          ? config.optionAsMetaKeyInstalled
          : config.shiftEnterKeyBindingInstalled) && config.numStartups > 3,
      )
    },
  },
  {
    id: 'shift-enter-setup',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      env.terminal === 'Apple_Terminal'
        ? 'Run /terminal-setup to enable Option+Enter for new lines'
        : 'Run /terminal-setup to enable Shift+Enter for new lines',
    cooldownSessions: 10,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 满足 `!shouldOfferTerminalSetup()` 时，服务层 tip Registry执行该分支。
      if (!shouldOfferTerminalSetup()) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `!(env.terminal === 'Apple_Terminal'`，作为服务层 tip Registry这次计算的结果。
      return !(env.terminal === 'Apple_Terminal'
        ? config.optionAsMetaKeyInstalled
        : config.shiftEnterKeyBindingInstalled)
    },
  },
  {
    id: 'memory-command',
    // 这个回调绑定到 content: async () => 'Use /memory to view and manage Claude memory',，负责服务层 tip Registry在该局部场景下的响应。
    content: async () => 'Use /memory to view and manage Claude memory',
    cooldownSessions: 15,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `config.memoryUsageCount <= 0`，作为服务层 tip Registry这次计算的结果。
      return config.memoryUsageCount <= 0
    },
  },
  {
    id: 'theme-command',
    // 这个回调绑定到 content: async () => 'Use /theme to change the color theme',，负责服务层 tip Registry在该局部场景下的响应。
    content: async () => 'Use /theme to change the color theme',
    cooldownSessions: 20,
    // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => true,
  },
  {
    id: 'colorterm-truecolor',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Try setting environment variable COLORTERM=truecolor for richer colors',
    cooldownSessions: 30,
    // 这个回调绑定到 isRelevant: async () => !process.env.COLORTERM && chalk.level < 3,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => !process.env.COLORTERM && chalk.level < 3,
  },
  {
    id: 'powershell-tool-env',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Set CLAUDE_CODE_USE_POWERSHELL_TOOL=1 to enable the PowerShell tool (preview)',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () =>
      getPlatform() === 'windows' &&
      process.env.CLAUDE_CODE_USE_POWERSHELL_TOOL === undefined,
  },
  {
    id: 'status-line',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Use /statusline to set up a custom status line that will display beneath the input box',
    cooldownSessions: 25,
    // 这个回调绑定到 isRelevant: async () => getSettings_DEPRECATED().statusLine === undefined,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => getSettings_DEPRECATED().statusLine === undefined,
  },
  {
    id: 'prompt-queue',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Hit Enter to queue up additional messages while Claude is working.',
    cooldownSessions: 5,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `config.promptQueueUseCount <= 3`，作为服务层 tip Registry这次计算的结果。
      return config.promptQueueUseCount <= 3
    },
  },
  {
    id: 'enter-to-steer-in-relatime',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Send messages to Claude while it works to steer Claude in real-time',
    cooldownSessions: 20,
    // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => true,
  },
  {
    id: 'todo-list',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Ask Claude to create a todo list when working on complex tasks to track progress and remain on track',
    cooldownSessions: 20,
    // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => true,
  },
  {
    id: 'vscode-command-install',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      `Open the Command Palette (Cmd+Shift+P) and run "Shell Command: Install '${env.terminal === 'vscode' ? 'code' : env.terminal}' command in PATH" to enable IDE integration`,
    cooldownSessions: 0,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // Only show this tip if we're in a VS Code-style terminal
      // 满足 `!isSupportedVSCodeTerminal()` 时，服务层 tip Registry执行该分支。
      if (!isSupportedVSCodeTerminal()) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // `getPlatform()` 与 `'macos'` 不一致时刷新派生状态，避免使用过期结果。
      if (getPlatform() !== 'macos') {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // Check if the relevant command is available
      // 按照 env.terminal 的取值选择服务层 tip Registry的具体处理分支。
      switch (env.terminal) {
        case 'vscode':
          // 返回 `!(await isVSCodeInstalled())`，作为服务层 tip Registry这次计算的结果。
          return !(await isVSCodeInstalled())
        case 'cursor':
          // 返回 `!(await isCursorInstalled())`，作为服务层 tip Registry这次计算的结果。
          return !(await isCursorInstalled())
        case 'windsurf':
          // 返回 `!(await isWindsurfInstalled())`，作为服务层 tip Registry这次计算的结果。
          return !(await isWindsurfInstalled())
        default:
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
      }
    },
  },
  {
    id: 'ide-upsell-external-terminal',
    // 这个回调绑定到 content: async () => 'Connect Claude to your IDE · /ide',，负责服务层 tip Registry在该局部场景下的响应。
    content: async () => 'Connect Claude to your IDE · /ide',
    cooldownSessions: 4,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 满足 `isSupportedTerminal()` 时，服务层 tip Registry执行该分支。
      if (isSupportedTerminal()) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // Use lockfiles as a (quicker) signal for running IDEs
      // lockfiles 文件数据读取`getSortedIdeLockfiles`，供服务层 tip Registry后续处理使用。
      const lockfiles = await getSortedIdeLockfiles()
      // `lockfiles.length` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (lockfiles.length !== 0) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // runningIDEs 集合读取`detectRunningIDEsCached`，供服务层 tip Registry后续处理使用。
      const runningIDEs = await detectRunningIDEsCached()
      // 返回 `runningIDEs.length > 0`，作为服务层 tip Registry这次计算的结果。
      return runningIDEs.length > 0
    },
  },
  {
    id: 'install-github-app',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Run /install-github-app to tag @claude right from your Github issues and PRs',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => !getGlobalConfig().githubActionSetupCount,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => !getGlobalConfig().githubActionSetupCount,
  },
  {
    id: 'install-slack-app',
    // 这个回调绑定到 content: async () => 'Run /install-slack-app to use Claude in Slack',，负责服务层 tip Registry在该局部场景下的响应。
    content: async () => 'Run /install-slack-app to use Claude in Slack',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => !getGlobalConfig().slackAppInstallCount,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => !getGlobalConfig().slackAppInstallCount,
  },
  {
    id: 'permissions',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Use /permissions to pre-approve and pre-deny bash, edit, and MCP tools',
    cooldownSessions: 10,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `config.numStartups > 10`，作为服务层 tip Registry这次计算的结果。
      return config.numStartups > 10
    },
  },
  {
    id: 'drag-and-drop-images',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Did you know you can drag and drop image files into your terminal?',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => !env.isSSH(),，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => !env.isSSH(),
  },
  {
    id: 'paste-images-mac',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Paste images into Claude Code using control+v (not cmd+v!)',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => getPlatform() === 'macos',，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => getPlatform() === 'macos',
  },
  {
    id: 'double-esc',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Double-tap esc to rewind the conversation to a previous point in time',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => !fileHistoryEnabled(),，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => !fileHistoryEnabled(),
  },
  {
    id: 'double-esc-code-restore',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Double-tap esc to rewind the code and/or conversation to a previous point in time',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => fileHistoryEnabled(),，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => fileHistoryEnabled(),
  },
  {
    id: 'continue',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Run claude --continue or claude --resume to resume a conversation',
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => true,
  },
  {
    id: 'rename-conversation',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Name your conversations with /rename to find them easily in /resume later',
    cooldownSessions: 15,
    // 这个回调绑定到 isRelevant: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () =>
      isCustomTitleEnabled() && getGlobalConfig().numStartups > 10,
  },
  {
    id: 'custom-commands',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Create skills by adding .md files to .claude/skills/ in your project or ~/.claude/skills/ for skills that work in any project',
    cooldownSessions: 15,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `config.numStartups > 10`，作为服务层 tip Registry这次计算的结果。
      return config.numStartups > 10
    },
  },
  {
    id: 'shift-tab',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      process.env.USER_TYPE === 'ant'
        ? `Hit ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} to cycle between default mode and auto mode`
        : `Hit ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} to cycle between default mode, auto-accept edit mode, and plan mode`,
    cooldownSessions: 10,
    // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => true,
  },
  {
    id: 'image-paste',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      `Use ${getShortcutDisplay('chat:imagePaste', 'Chat', 'ctrl+v')} to paste images from your clipboard`,
    cooldownSessions: 20,
    // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => true,
  },
  {
    id: 'custom-agents',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Use /agents to optimize specific tasks. Eg. Software Architect, Code Writer, Code Reviewer',
    cooldownSessions: 15,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `config.numStartups > 5`，作为服务层 tip Registry这次计算的结果。
      return config.numStartups > 5
    },
  },
  {
    id: 'agent-flag',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Use --agent <agent_name> to directly start a conversation with a subagent',
    cooldownSessions: 15,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `config.numStartups > 5`，作为服务层 tip Registry这次计算的结果。
      return config.numStartups > 5
    },
  },
  {
    id: 'desktop-app',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Run Claude Code locally or remotely using the Claude desktop app: clau.de/desktop',
    cooldownSessions: 15,
    // 这个回调绑定到 isRelevant: async () => getPlatform() !== 'linux',，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => getPlatform() !== 'linux',
  },
  {
    id: 'desktop-shortcut',
    // 这个回调绑定到 content: async ctx => {，负责服务层 tip Registry在该局部场景下的响应。
    content: async ctx => {
      // blue保存`color`，供服务层 tip Registry后续处理使用。
      const blue = color('suggestion', ctx.theme)
      // 返回 ``Continue your session in Claude Code Desktop with ${blue('/desktop')}``，作为服务层 tip Registry这次计算的结果。
      return `Continue your session in Claude Code Desktop with ${blue('/desktop')}`
    },
    cooldownSessions: 15,
    // 这个回调绑定到 isRelevant: async () => {，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => {
      // 满足 `!getDesktopUpsellConfig().enable_shortcut_tip` 时，服务层 tip Registry执行该分支。
      if (!getDesktopUpsellConfig().enable_shortcut_tip) return false
      // 返回 `(`，作为服务层 tip Registry这次计算的结果。
      return (
        process.platform === 'darwin' ||
        (process.platform === 'win32' && process.arch === 'x64')
      )
    },
  },
  {
    id: 'web-app',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      'Run tasks in the cloud while you keep coding locally · clau.de/web',
    cooldownSessions: 15,
    // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => true,
  },
  {
    id: 'mobile-app',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      '/mobile to use Claude Code from the Claude app on your phone',
    cooldownSessions: 15,
    // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => true,
  },
  {
    id: 'opusplan-mode-reminder',
    // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
    content: async () =>
      `Your default model setting is Opus Plan Mode. Press ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} twice to activate Plan Mode and plan with Claude Opus.`,
    cooldownSessions: 2,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 tip Registry执行对应分支。
      if (process.env.USER_TYPE === 'ant') return false
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // modelSetting读取`getUserSpecifiedModelSetting`，供服务层 tip Registry后续处理使用。
      const modelSetting = getUserSpecifiedModelSetting()
      // hasOpusPlanMode标记服务层 tip Registry是否启用对应路径。
      const hasOpusPlanMode = modelSetting === 'opusplan'
      // Show reminder if they have Opus Plan Mode and haven't used plan mode recently (3+ days)
      // daysSinceLastUse保存`config.lastPlanModeUse`，供后续判断或组装使用。
      const daysSinceLastUse = config.lastPlanModeUse
        ? (Date.now() - config.lastPlanModeUse) / (1000 * 60 * 60 * 24)
        : Infinity
      // 返回 `hasOpusPlanMode && daysSinceLastUse > 3`，作为服务层 tip Registry这次计算的结果。
      return hasOpusPlanMode && daysSinceLastUse > 3
    },
  },
  {
    id: 'frontend-design-plugin',
    // 这个回调绑定到 content: async ctx => {，负责服务层 tip Registry在该局部场景下的响应。
    content: async ctx => {
      // blue保存`color`，供服务层 tip Registry后续处理使用。
      const blue = color('suggestion', ctx.theme)
      // 返回 ``Working with HTML/CSS? Install the frontend-design plugin:\n${blue(`/p...`，作为服务层 tip Registry这次计算的结果。
      return `Working with HTML/CSS? Install the frontend-design plugin:\n${blue(`/plugin install frontend-design@${OFFICIAL_MARKETPLACE_NAME}`)}`
    },
    cooldownSessions: 3,
    // 这个回调绑定到 isRelevant: async context =>，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async context =>
      isMarketplacePluginRelevant('frontend-design', context, {
        filePath: /\.(html|css|htm)$/i,
      }),
  },
  {
    id: 'vercel-plugin',
    // 这个回调绑定到 content: async ctx => {，负责服务层 tip Registry在该局部场景下的响应。
    content: async ctx => {
      // blue保存`color`，供服务层 tip Registry后续处理使用。
      const blue = color('suggestion', ctx.theme)
      // 返回 ``Working with Vercel? Install the vercel plugin:\n${blue(`/plugin insta...`，作为服务层 tip Registry这次计算的结果。
      return `Working with Vercel? Install the vercel plugin:\n${blue(`/plugin install vercel@${OFFICIAL_MARKETPLACE_NAME}`)}`
    },
    cooldownSessions: 3,
    // 这个回调绑定到 isRelevant: async context =>，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async context =>
      isMarketplacePluginRelevant('vercel', context, {
        filePath: /(?:^|[/\\])vercel\.json$/i,
        cli: ['vercel'],
      }),
  },
  {
    id: 'effort-high-nudge',
    // 这个回调绑定到 content: async ctx => {，负责服务层 tip Registry在该局部场景下的响应。
    content: async ctx => {
      // blue保存`color`，供服务层 tip Registry后续处理使用。
      const blue = color('suggestion', ctx.theme)
      // cmd 命令数据保存`blue`，供服务层 tip Registry后续处理使用。
      const cmd = blue('/effort high')
      // variant 命名 `getFeatureValue_CACHED_MAY_BE_STALE<`，让后续代码直接表达这个值的用途。
      const variant = getFeatureValue_CACHED_MAY_BE_STALE<
        'off' | 'copy_a' | 'copy_b'
      >('tengu_tide_elm', 'off')
      // 返回 `variant === 'copy_b'`，作为服务层 tip Registry这次计算的结果。
      return variant === 'copy_b'
        ? `Use ${cmd} for better one-shot answers. Claude thinks it through first.`
        : `Working on something tricky? ${cmd} gives better first answers`
    },
    cooldownSessions: 3,
    // 这个回调绑定到 isRelevant: async () => {，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => {
      // 满足 `!is1PApiCustomer()` 时，服务层 tip Registry执行该分支。
      if (!is1PApiCustomer()) return false
      // 满足 `!modelSupportsEffort(getMainLoopModel())` 时，服务层 tip Registry执行该分支。
      if (!modelSupportsEffort(getMainLoopModel())) return false
      // `getSettingsForSource('policySettings')?.eff...` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (getSettingsForSource('policySettings')?.effortLevel !== undefined) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // `getEffortEnvOverride()` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (getEffortEnvOverride() !== undefined) return false
      // persisted读取`getInitialSettings`，供服务层 tip Registry后续处理使用。
      const persisted = getInitialSettings().effortLevel
      // 当 `persisted` 匹配 `'high' || persisted === 'ma...` 时，服务层 tip Registry执行对应分支。
      if (persisted === 'high' || persisted === 'max') return false
      // 返回 `(`，作为服务层 tip Registry这次计算的结果。
      return (
        getFeatureValue_CACHED_MAY_BE_STALE<'off' | 'copy_a' | 'copy_b'>(
          'tengu_tide_elm',
          'off',
        ) !== 'off'
      )
    },
  },
  {
    id: 'subagent-fanout-nudge',
    // 这个回调绑定到 content: async ctx => {，负责服务层 tip Registry在该局部场景下的响应。
    content: async ctx => {
      // blue保存`color`，供服务层 tip Registry后续处理使用。
      const blue = color('suggestion', ctx.theme)
      // variant 命名 `getFeatureValue_CACHED_MAY_BE_STALE<`，让后续代码直接表达这个值的用途。
      const variant = getFeatureValue_CACHED_MAY_BE_STALE<
        'off' | 'copy_a' | 'copy_b'
      >('tengu_tern_alloy', 'off')
      // 返回 `variant === 'copy_b'`，作为服务层 tip Registry这次计算的结果。
      return variant === 'copy_b'
        ? `For big tasks, tell Claude to ${blue('use subagents')}. They work in parallel and keep your main thread clean.`
        : `Say ${blue('"fan out subagents"')} and Claude sends a team. Each one digs deep so nothing gets missed.`
    },
    cooldownSessions: 3,
    // 这个回调绑定到 isRelevant: async () => {，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => {
      // 满足 `!is1PApiCustomer()` 时，服务层 tip Registry执行该分支。
      if (!is1PApiCustomer()) return false
      // 返回 `(`，作为服务层 tip Registry这次计算的结果。
      return (
        getFeatureValue_CACHED_MAY_BE_STALE<'off' | 'copy_a' | 'copy_b'>(
          'tengu_tern_alloy',
          'off',
        ) !== 'off'
      )
    },
  },
  {
    id: 'loop-command-nudge',
    // 这个回调绑定到 content: async ctx => {，负责服务层 tip Registry在该局部场景下的响应。
    content: async ctx => {
      // blue保存`color`，供服务层 tip Registry后续处理使用。
      const blue = color('suggestion', ctx.theme)
      // variant 命名 `getFeatureValue_CACHED_MAY_BE_STALE<`，让后续代码直接表达这个值的用途。
      const variant = getFeatureValue_CACHED_MAY_BE_STALE<
        'off' | 'copy_a' | 'copy_b'
      >('tengu_timber_lark', 'off')
      // 返回 `variant === 'copy_b'`，作为服务层 tip Registry这次计算的结果。
      return variant === 'copy_b'
        ? `Use ${blue('/loop 5m check the deploy')} to run any prompt on a schedule. Set it and forget it.`
        : `${blue('/loop')} runs any prompt on a recurring schedule. Great for monitoring deploys, babysitting PRs, or polling status.`
    },
    cooldownSessions: 3,
    // 这个回调绑定到 isRelevant: async () => {，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => {
      // 满足 `!is1PApiCustomer()` 时，服务层 tip Registry执行该分支。
      if (!is1PApiCustomer()) return false
      // 满足 `!isKairosCronEnabled()` 时，服务层 tip Registry执行该分支。
      if (!isKairosCronEnabled()) return false
      // 返回 `(`，作为服务层 tip Registry这次计算的结果。
      return (
        getFeatureValue_CACHED_MAY_BE_STALE<'off' | 'copy_a' | 'copy_b'>(
          'tengu_timber_lark',
          'off',
        ) !== 'off'
      )
    },
  },
  {
    id: 'guest-passes',
    // 这个回调绑定到 content: async ctx => {，负责服务层 tip Registry在该局部场景下的响应。
    content: async ctx => {
      // claude保存`color`，供服务层 tip Registry后续处理使用。
      const claude = color('claude', ctx.theme)
      // reward读取`getCachedReferrerReward`，供服务层 tip Registry后续处理使用。
      const reward = getCachedReferrerReward()
      // 返回 `reward`，作为服务层 tip Registry这次计算的结果。
      return reward
        ? `Share Claude Code and earn ${claude(formatCreditAmount(reward))} of extra usage · ${claude('/passes')}`
        : `You have free guest passes to share · ${claude('/passes')}`
    },
    cooldownSessions: 3,
    // 这个回调绑定到 isRelevant: async () => {，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => {
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 满足 `config.hasVisitedPasses` 时，服务层 tip Registry执行该分支。
      if (config.hasVisitedPasses) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 从 `checkCachedPassesEligibility()` 解构 eligible，减少服务层 tip Registry对同一对象的重复访问。
      const { eligible } = checkCachedPassesEligibility()
      // 返回 `eligible`，作为服务层 tip Registry这次计算的结果。
      return eligible
    },
  },
  {
    id: 'overage-credit',
    // 这个回调绑定到 content: async ctx => {，负责服务层 tip Registry在该局部场景下的响应。
    content: async ctx => {
      // claude保存`color`，供服务层 tip Registry后续处理使用。
      const claude = color('claude', ctx.theme)
      // info读取`getCachedOverageCreditGrant`，供服务层 tip Registry后续处理使用。
      const info = getCachedOverageCreditGrant()
      // amount格式化`formatGrantAmount`，供服务层 tip Registry后续处理使用。
      const amount = info ? formatGrantAmount(info) : null
      // amount缺失时提前走兜底路径，避免服务层 tip Registry继续依赖无效输入。
      if (!amount) return ''
      // Copy from "OC & Bulk Overages copy" doc (#5 — CLI Rotating tip)
      // 返回 ``${claude(`${amount} in extra usage, on us`)} · third-party apps · ${cl...`，作为服务层 tip Registry这次计算的结果。
      return `${claude(`${amount} in extra usage, on us`)} · third-party apps · ${claude('/extra-usage')}`
    },
    cooldownSessions: 3,
    // 这个回调绑定到 isRelevant: async () => shouldShowOverageCreditUpsell(),，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => shouldShowOverageCreditUpsell(),
  },
  {
    id: 'feedback-command',
    // 这个回调绑定到 content: async () => 'Use /feedback to help us improve!',，负责服务层 tip Registry在该局部场景下的响应。
    content: async () => 'Use /feedback to help us improve!',
    cooldownSessions: 15,
    // isRelevant 用 无 判断服务层 tip Registry是否满足条件。
    async isRelevant() {
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 tip Registry执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 配置读取`getGlobalConfig`，供服务层 tip Registry后续处理使用。
      const config = getGlobalConfig()
      // 返回 `config.numStartups > 5`，作为服务层 tip Registry这次计算的结果。
      return config.numStartups > 5
    },
  },
]
// internalOnlyTips 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const internalOnlyTips: Tip[] =
  process.env.USER_TYPE === 'ant'
    ? [
        {
          id: 'important-claudemd',
          // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
          content: async () =>
            '[ANT-ONLY] Use "IMPORTANT:" prefix for must-follow CLAUDE.md rules',
          cooldownSessions: 30,
          // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
          isRelevant: async () => true,
        },
        {
          id: 'skillify',
          // 这个回调绑定到 content: async () =>，负责服务层 tip Registry在该局部场景下的响应。
          content: async () =>
            '[ANT-ONLY] Use /skillify at the end of a workflow to turn it into a reusable skill',
          cooldownSessions: 15,
          // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
          isRelevant: async () => true,
        },
      ]
    : []

// getCustomTips 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCustomTips(): Tip[] {
  // settings 集合读取`getInitialSettings`，供服务层 tip Registry后续处理使用。
  const settings = getInitialSettings()
  // override保存`settings.spinnerTipsOverride`，供后续判断或组装使用。
  const override = settings.spinnerTipsOverride
  // 满足 `!override?.tips?.length` 时，服务层 tip Registry执行该分支。
  if (!override?.tips?.length) return []

  // 返回 `override.tips.map((content, i) => ({`，作为服务层 tip Registry这次计算的结果。
  return override.tips.map((content, i) => ({
    id: `custom-tip-${i}`,
    // 这个回调绑定到 content: async () => content,，负责服务层 tip Registry在该局部场景下的响应。
    content: async () => content,
    cooldownSessions: 0,
    // 这个回调绑定到 isRelevant: async () => true,，负责服务层 tip Registry在该局部场景下的响应。
    isRelevant: async () => true,
  }))
}

// getRelevantTips 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getRelevantTips(context?: TipContext): Promise<Tip[]> {
  // settings 集合读取`getInitialSettings`，供服务层 tip Registry后续处理使用。
  const settings = getInitialSettings()
  // override保存`settings.spinnerTipsOverride`，供后续判断或组装使用。
  const override = settings.spinnerTipsOverride
  // customTips 集合读取`getCustomTips`，供服务层 tip Registry后续处理使用。
  const customTips = getCustomTips()

  // If excludeDefault is true and there are custom tips, skip built-in tips entirely
  // 组合条件 `override?.excludeDefault && customTips.length > 0` 成立时，服务层 tip Registry才启用这条专门路径。
  if (override?.excludeDefault && customTips.length > 0) {
    // 返回 `customTips`，作为服务层 tip Registry这次计算的结果。
    return customTips
  }

  // Otherwise, filter built-in tips as before and combine with custom
  // tips 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const tips = [...externalTips, ...internalOnlyTips]
  // isRelevant记录 `Promise.all` 是否成立，服务层 tip Registry随后按该结果分支。
  const isRelevant = await Promise.all(tips.map(_ => _.isRelevant(context)))
  // filtered保存`tips`，供服务层 tip Registry后续判断或输出使用。
  const filtered = tips
    // 链式调用 filter，继续加工上一行在服务层 tip Registry中产生的数据。
    .filter((_, index) => isRelevant[index])
    // 链式调用 filter，继续加工上一行在服务层 tip Registry中产生的数据。
    .filter(_ => getSessionsSinceLastShown(_.id) >= _.cooldownSessions)

  // 返回列表结果，保留服务层 tip Registry已经排好的条目顺序。
  return [...filtered, ...customTips]
}
