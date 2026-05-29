// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js'

// 命令 集中保存命令处理斜杠命令 index要一起传递的字段。
const command = {
  name: 'sandbox',
  // 斜杠命令 index在这里处理 `get description() {`，完成这一小步状态转换。
  get description() {
    // currentlyEnabled保存`SandboxManager.isSandboxingEnabled`，供命令处理后续处理使用。
    const currentlyEnabled = SandboxManager.isSandboxingEnabled()
    // autoAllow保存`SandboxManager.isAutoAllowBashIfSandboxedEnabled`，供命令处理后续处理使用。
    const autoAllow = SandboxManager.isAutoAllowBashIfSandboxedEnabled()
    // allowUnsandboxed保存`SandboxManager.areUnsandboxedCommandsAllowed`，供命令处理后续处理使用。
    const allowUnsandboxed = SandboxManager.areUnsandboxedCommandsAllowed()
    // isLocked记录 `SandboxManager.areSandboxSettingsLockedByPolicy` 是否成立，命令处理随后按该结果分支。
    const isLocked = SandboxManager.areSandboxSettingsLockedByPolicy()
    // hasDeps 集合记录 `SandboxManager.checkDependencies` 是否成立，命令处理随后按该结果分支。
    const hasDeps = SandboxManager.checkDependencies().errors.length === 0

    // Show warning icon if dependencies missing, otherwise enabled/disabled status
    // icon 先占位，稍后的条件分支会根据实际输入补齐它。
    let icon: string
    // hasDeps 集合缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!hasDeps) {
      // icon更新为 `figures.warning`，确保斜杠命令后续读取最新状态。
      icon = figures.warning
    } else {
      // icon更新为 `currentlyEnabled ? figures.tick : figures.circle`，确保斜杠命令后续读取最新状态。
      icon = currentlyEnabled ? figures.tick : figures.circle
    }

    // statusText固定为 `'sandbox disabled'`，作为命令处理斜杠命令 index后续展示或比较的基准。
    let statusText = 'sandbox disabled'
    // 满足 `currentlyEnabled` 时，命令处理执行该分支。
    if (currentlyEnabled) {
      // statusText更新为 `autoAllow`，确保斜杠命令后续读取最新状态。
      statusText = autoAllow
        ? 'sandbox enabled (auto-allow)'
        : 'sandbox enabled'

      // Add unsandboxed fallback status
      // 斜杠命令 index在这里处理 `statusText += allowUnsandboxed ? ', fallback allowed' : ''`，完成这一小步状态转换。
      statusText += allowUnsandboxed ? ', fallback allowed' : ''
    }

    // 满足 `isLocked` 时，命令处理执行该分支。
    if (isLocked) {
      // 斜杠命令 index在这里处理 `statusText += ' (managed)'`，完成这一小步状态转换。
      statusText += ' (managed)'
    }

    // 返回 ``${icon} ${statusText} (⏎ to configure)``，作为命令处理这次计算的结果。
    return `${icon} ${statusText} (⏎ to configure)`
  },
  argumentHint: 'exclude "command pattern"',
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `(`，作为命令处理这次计算的结果。
    return (
      !SandboxManager.isSupportedPlatform() ||
      !SandboxManager.isPlatformInEnabledList()
    )
  },
  immediate: true,
  type: 'local-jsx',
  // 这个回调绑定到 load: () => import('./sandbox-toggle.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./sandbox-toggle.js'),
} satisfies Command

export default command
