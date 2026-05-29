// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../../commands.js'

// branch 集中保存命令处理斜杠命令 index要一起传递的字段。
const branch = {
  type: 'local-jsx',
  name: 'branch',
  // 'fork' alias only when /fork doesn't exist as its own command
  aliases: feature('FORK_SUBAGENT') ? [] : ['fork'],
  description: 'Create a branch of the current conversation at this point',
  argumentHint: '[name]',
  // 这个回调绑定到 load: () => import('./branch.js'),，负责命令处理在该局部场景下的响应。
  load: () => import('./branch.js'),
} satisfies Command

export default branch
