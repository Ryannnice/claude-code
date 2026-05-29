// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'
// 复用 shouldInferenceConfigCommandBeImmediate 工具函数，把通用处理留在 ../../utils/immediateCommand.js 中维护。
import { shouldInferenceConfigCommandBeImmediate } from '../../utils/immediateCommand.js'

export default {
  type: 'local-jsx',
  name: 'effort',
  description: 'Set effort level for model usage',
  argumentHint: '[low|medium|high|max|auto]',
  // 斜杠命令 index在这里处理 `get immediate() {`，完成这一小步状态转换。
  get immediate() {
    // 返回 `shouldInferenceConfigCommandBeImmediate()`，作为命令处理这次计算的结果。
    return shouldInferenceConfigCommandBeImmediate()
  },
  // 这个回调绑定到 load: () => import('./effort.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./effort.js'),
} satisfies Command
