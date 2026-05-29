// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readdir, readFile, stat } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type McpServerConfig,
  McpStdioServerConfigSchema,
} from '../services/mcp/types.js'
// 引入 getErrnoCode，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode } from './errors.js'
// 引入 safeParseJSON，将 ./json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from './json.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 getPlatform、SUPPORTED_PLATFORMS，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform, SUPPORTED_PLATFORMS } from './platform.js'

// getClaudeDesktopConfigPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getClaudeDesktopConfigPath(): Promise<string> {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // 满足 `!SUPPORTED_PLATFORMS.includes(platform)` 时，共享工具执行该分支。
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Unsupported platform: ${platform} - Claude Desktop integration only works on macOS and WSL.`,
    )
  }

  // 当 `platform` 匹配 `'macos'` 时，共享工具执行对应分支。
  if (platform === 'macos') {
    // 返回 `join(`，作为共享工具这次计算的结果。
    return join(
      homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json',
    )
  }

  // First, try using USERPROFILE environment variable if available
  // windowsHome 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const windowsHome = process.env.USERPROFILE
    ? process.env.USERPROFILE.replace(/\\/g, '/') // Convert Windows backslashes to forward slashes
    : null

  // 满足 `windowsHome` 时，共享工具执行该分支。
  if (windowsHome) {
    // Remove drive letter and convert to WSL path format
    // wslPath 路径数据格式化`windowsHome.replace`，供共享工具后续处理使用。
    const wslPath = windowsHome.replace(/^[A-Z]:/, '')
    // configPath 路径数据 命名 ``/mnt/c${wslPath}/AppData/Roaming/Claude/claude_desktop_c...`，让后续代码直接表达这个值的用途。
    const configPath = `/mnt/c${wslPath}/AppData/Roaming/Claude/claude_desktop_config.json`

    // Check if the file exists
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `stat(configPath)` 完成，再继续共享工具 claude Desktop的异步流程。
      await stat(configPath)
      // 返回 `configPath`，作为共享工具这次计算的结果。
      return configPath
    } catch {
      // File doesn't exist, continue
    }
  }

  // Alternative approach - try to construct path based on typical Windows user location
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // List the /mnt/c/Users directory to find potential user directories
    // usersDir保存`'/mnt/c/Users'`，作为后续固定文本处理的输入。
    const usersDir = '/mnt/c/Users'

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // userDirs 集合读取`readdir`，供共享工具后续处理使用。
      const userDirs = await readdir(usersDir, { withFileTypes: true })

      // Look for Claude Desktop config in each user directory
      // 按顺序遍历 `userDirs` 中的user，逐个交给共享工具处理。
      for (const user of userDirs) {
        // 共享工具在这里按实际状态进入对应分支。
        if (
          user.name === 'Public' ||
          user.name === 'Default' ||
          user.name === 'Default User' ||
          user.name === 'All Users'
        ) {
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue // Skip system directories
        }

        // potentialConfigPath 路径数据格式化`join`，供共享工具后续处理使用。
        const potentialConfigPath = join(
          usersDir,
          user.name,
          'AppData',
          'Roaming',
          'Claude',
          'claude_desktop_config.json',
        )

        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `stat(potentialConfigPath)` 完成，再继续共享工具 claude Desktop的异步流程。
          await stat(potentialConfigPath)
          // 返回 `potentialConfigPath`，作为共享工具这次计算的结果。
          return potentialConfigPath
        } catch {
          // File doesn't exist, continue
        }
      }
    } catch {
      // usersDir doesn't exist or can't be read
    }
  } catch (dirError) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(dirError)
  }

  // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
  throw new Error(
    'Could not find Claude Desktop config file in Windows. Make sure Claude Desktop is installed on Windows.',
  )
}

// readClaudeDesktopMcpServers 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function readClaudeDesktopMcpServers(): Promise<
  Record<string, McpServerConfig>
> {
  // 满足 `!SUPPORTED_PLATFORMS.includes(getPlatform())` 时，共享工具执行该分支。
  if (!SUPPORTED_PLATFORMS.includes(getPlatform())) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      'Unsupported platform - Claude Desktop integration only works on macOS and WSL.',
    )
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // configPath 路径数据读取`getClaudeDesktopConfigPath`，供共享工具后续处理使用。
    const configPath = await getClaudeDesktopConfigPath()

    // configContent 配置 先占位，稍后的条件分支会根据实际输入补齐它。
    let configContent: string
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // configContent 配置更新为 `await readFile(configPath, { encoding: 'utf8' })`，确保共享工具后续读取最新状态。
      configContent = await readFile(configPath, { encoding: 'utf8' })
    } catch (e: unknown) {
      // code读取`getErrnoCode`，供共享工具后续处理使用。
      const code = getErrnoCode(e)
      // 当 `code` 匹配 `'ENOENT'` 时，共享工具执行对应分支。
      if (code === 'ENOENT') {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return {}
      }
      // 抛出 e，阻止共享工具在无效状态下继续运行。
      throw e
    }

    // 配置保存`safeParseJSON`，供共享工具后续处理使用。
    const config = safeParseJSON(configContent)

    // `!config || typeof config` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
    if (!config || typeof config !== 'object') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {}
    }

    // mcpServers 集合 命名 `(config as Record<string, unknown>).mcpServers`，让后续代码直接表达这个值的用途。
    const mcpServers = (config as Record<string, unknown>).mcpServers
    // `!mcpServers || typeof mcpServers` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
    if (!mcpServers || typeof mcpServers !== 'object') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {}
    }

    // servers 集合 从空对象开始收集键值，后续按名称补齐内容。
    const servers: Record<string, McpServerConfig> = {}

    // 调用 for，触发共享工具此处需要的副作用。
    for (const [name, serverConfig] of Object.entries(
      mcpServers as Record<string, unknown>,
    )) {
      // `!serverConfig || typeof serverConfig` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
      if (!serverConfig || typeof serverConfig !== 'object') {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // 结果保存`McpStdioServerConfigSchema`，供共享工具后续处理使用。
      const result = McpStdioServerConfigSchema().safeParse(serverConfig)

      // 满足 `result.success` 时，共享工具执行该分支。
      if (result.success) {
        // servers[name更新为 `result.data`，确保共享工具 claude Desktop后续读取最新状态。
        servers[name] = result.data
      }
    }

    // 返回 `servers`，作为共享工具这次计算的结果。
    return servers
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {}
  }
}
