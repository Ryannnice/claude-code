// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 shouldInferenceConfigCommandBeImmediate 工具函数，把通用处理留在 ../../utils/immediateCommand.js 中维护。
import { shouldInferenceConfigCommandBeImmediate } from '../../utils/immediateCommand.js'
// 复用 getMainLoopModel、renderModelName 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { getMainLoopModel, renderModelName } from '../../utils/model/model.js'

export default {
  type: 'local-jsx',
  name: 'model',
  // 斜杠命令 index在这里处理 `get description() {`，完成这一小步状态转换。
  get description() {
    // 返回 ``Set the AI model for Claude Code (currently ${renderModelName(getMainL...`，作为命令处理这次计算的结果。
    return `Set the AI model for Claude Code (currently ${renderModelName(getMainLoopModel())})`
  },
  argumentHint: '[model]',
  // 斜杠命令 index在这里处理 `get immediate() {`，完成这一小步状态转换。
  get immediate() {
    // 返回 `shouldInferenceConfigCommandBeImmediate()`，作为命令处理这次计算的结果。
    return shouldInferenceConfigCommandBeImmediate()
  },
  // 这个回调绑定到 load: () => import('./model.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./model.js'),
} satisfies Command
