// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import type { CommandSpec } from '../registry.js'

// srun 集中保存共享工具 srun要一起传递的字段。
const srun: CommandSpec = {
  name: 'srun',
  description: 'Run a command on SLURM cluster nodes',
  options: [
    {
      name: ['-n', '--ntasks'],
      description: 'Number of tasks',
      args: {
        name: 'count',
        description: 'Number of tasks to run',
      },
    },
    {
      name: ['-N', '--nodes'],
      description: 'Number of nodes',
      args: {
        name: 'count',
        description: 'Number of nodes to allocate',
      },
    },
  ],
  args: {
    name: 'command',
    description: 'Command to run on the cluster',
    isCommand: true,
  },
}

export default srun
