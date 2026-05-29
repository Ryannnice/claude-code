// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import type { CommandSpec } from '../registry.js'

// nohup 集中保存共享工具 nohup要一起传递的字段。
const nohup: CommandSpec = {
  name: 'nohup',
  description: 'Run a command immune to hangups',
  args: {
    name: 'command',
    description: 'Command to run with nohup',
    isCommand: true,
  },
}

export default nohup
