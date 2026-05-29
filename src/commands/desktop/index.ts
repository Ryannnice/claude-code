// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// isSupportedPlatform 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSupportedPlatform(): boolean {
  // 当 `process.platform` 匹配 `'darwin'` 时，命令处理执行对应分支。
  if (process.platform === 'darwin') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 只有 `process.platform === 'win32' && process.arch ===` 满足时，命令处理才执行该分支。
  if (process.platform === 'win32' && process.arch === 'x64') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// desktop 集中保存命令处理斜杠命令 index要一起传递的字段。
const desktop = {
  type: 'local-jsx',
  name: 'desktop',
  aliases: ['app'],
  description: 'Continue the current session in Claude Desktop',
  availability: ['claude-ai'],
  isEnabled: isSupportedPlatform,
  // 斜杠命令 index在这里处理 `get isHidden() {`，完成这一小步状态转换。
  get isHidden() {
    // 返回 `!isSupportedPlatform()`，作为命令处理这次计算的结果。
    return !isSupportedPlatform()
  },
  // 这个回调绑定到 load: () => import('./desktop.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./desktop.js'),
} satisfies Command

export default desktop
