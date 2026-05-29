// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import type { CommandSpec } from '../registry.js'

// alias 集合 集中保存共享工具 alias要一起传递的字段。
const alias: CommandSpec = {
  name: 'alias',
  description: 'Create or list command aliases',
  args: {
    name: 'definition',
    description: 'Alias definition in the form name=value',
    isOptional: true,
    isVariadic: true,
  },
}

export default alias
