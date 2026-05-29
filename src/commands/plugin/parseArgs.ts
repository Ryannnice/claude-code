// Parse plugin subcommand arguments into structured commands
// ParsedCommand 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedCommand =
  | { type: 'menu' }
  | { type: 'help' }
  | { type: 'install'; marketplace?: string; plugin?: string }
  | { type: 'manage' }
  | { type: 'uninstall'; plugin?: string }
  | { type: 'enable'; plugin?: string }
  | { type: 'disable'; plugin?: string }
  | { type: 'validate'; path?: string }
  | {
      type: 'marketplace'
      action?: 'add' | 'remove' | 'update' | 'list'
      target?: string
    }

// parsePluginArgs 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parsePluginArgs(args?: string): ParsedCommand {
  // 参数列表缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!args) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { type: 'menu' }
  }

  // 片段列表格式化`args.trim`，供命令处理后续处理使用。
  const parts = args.trim().split(/\s+/)
  // 命令保存`toLowerCase`，供命令处理后续处理使用。
  const command = parts[0]?.toLowerCase()

  // 按照 command 的取值选择命令处理的具体处理分支。
  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'help' }

    case 'install':
    case 'i': {
      // target 命名 `parts[1]`，让后续代码直接表达这个值的用途。
      const target = parts[1]
      // target缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!target) {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return { type: 'install' }
      }

      // Check if it's in format plugin@marketplace
      // 满足 `target.includes('@')` 时，命令处理执行该分支。
      if (target.includes('@')) {
        // 从 `target.split('@')` 按位置拆出 plugin、marketplace，让插件命令界面 parse Args分别处理这些返回值。
        const [plugin, marketplace] = target.split('@')
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return { type: 'install', plugin, marketplace }
      }

      // Check if the target looks like a marketplace (URL or path)
      // isMarketplace 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isMarketplace =
        target.startsWith('http://') ||
        target.startsWith('https://') ||
        target.startsWith('file://') ||
        target.includes('/') ||
        target.includes('\\')

      // 满足 `isMarketplace` 时，命令处理执行该分支。
      if (isMarketplace) {
        // This is a marketplace URL/path, no plugin specified
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return { type: 'install', marketplace: target }
      }

      // Otherwise treat it as a plugin name
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'install', plugin: target }
    }

    case 'manage':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'manage' }

    case 'uninstall':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'uninstall', plugin: parts[1] }

    case 'enable':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'enable', plugin: parts[1] }

    case 'disable':
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'disable', plugin: parts[1] }

    case 'validate': {
      // target格式化`parts.slice`，供命令处理后续处理使用。
      const target = parts.slice(1).join(' ').trim()
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'validate', path: target || undefined }
    }

    case 'marketplace':
    case 'market': {
      // action保存`toLowerCase`，供命令处理后续处理使用。
      const action = parts[1]?.toLowerCase()
      // target格式化`parts.slice`，供命令处理后续处理使用。
      const target = parts.slice(2).join(' ')

      // 按照 action 的取值选择命令处理的具体处理分支。
      switch (action) {
        case 'add':
          // 返回结构化结果，集中表达命令处理已经整理出的状态。
          return { type: 'marketplace', action: 'add', target }
        case 'remove':
        case 'rm':
          // 返回结构化结果，集中表达命令处理已经整理出的状态。
          return { type: 'marketplace', action: 'remove', target }
        case 'update':
          // 返回结构化结果，集中表达命令处理已经整理出的状态。
          return { type: 'marketplace', action: 'update', target }
        case 'list':
          // 返回结构化结果，集中表达命令处理已经整理出的状态。
          return { type: 'marketplace', action: 'list' }
        default:
          // No action specified, show marketplace menu
          // 返回结构化结果，集中表达命令处理已经整理出的状态。
          return { type: 'marketplace' }
      }
    }

    default:
      // Unknown command, show menu
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return { type: 'menu' }
  }
}
