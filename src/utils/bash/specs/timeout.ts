// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import type { CommandSpec } from '../registry.js'

// timeout 集中保存共享工具 timeout要一起传递的字段。
const timeout: CommandSpec = {
  name: 'timeout',
  description: 'Run a command with a time limit',
  args: [
    {
      name: 'duration',
      description: 'Duration to wait before timing out (e.g., 10, 5s, 2m)',
      isOptional: false,
    },
    {
      name: 'command',
      description: 'Command to run',
      isCommand: true,
    },
  ],
}

export default timeout
