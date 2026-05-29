// 引入 execFileNoThrow，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow } from './execFileNoThrow.js'

// validateUrl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateUrl(url: string): void {
  // parsedUrl 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsedUrl: URL

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // parsedUrl更新为 `new URL(url)`，确保共享工具后续读取最新状态。
    parsedUrl = new URL(url)
  } catch (_error) {
    // 抛出 new Error(`Invalid URL format: ${url}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Invalid URL format: ${url}`)
  }

  // Validate URL protocol for security
  // `parsedUrl.protocol` 与 `'http:' && parsedUrl.proto` 不一致时刷新派生状态，避免使用过期结果。
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Invalid URL protocol: must use http:// or https://, got ${parsedUrl.protocol}`,
    )
  }
}

/**
 * Open a file or folder path using the system's default handler.
 * Uses `open` on macOS, `explorer` on Windows, `xdg-open` on Linux.
 */
// openPath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function openPath(path: string): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // platform保存`process.platform`，供共享工具 browser后续判断或输出使用。
    const platform = process.platform
    // 当 `platform` 匹配 `'win32'` 时，共享工具执行对应分支。
    if (platform === 'win32') {
      // 从 `await execFileNoThrow('explorer', [path])` 解构 code，减少共享工具 browser对同一对象的重复访问。
      const { code } = await execFileNoThrow('explorer', [path])
      // 返回 `code === 0`，作为共享工具这次计算的结果。
      return code === 0
    }
    // 命令标记共享工具 browser是否启用对应路径。
    const command = platform === 'darwin' ? 'open' : 'xdg-open'
    // 从 `await execFileNoThrow(command, [path])` 解构 code，减少共享工具 browser对同一对象的重复访问。
    const { code } = await execFileNoThrow(command, [path])
    // 返回 `code === 0`，作为共享工具这次计算的结果。
    return code === 0
  } catch (_) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

// openBrowser 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function openBrowser(url: string): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Parse and validate the URL
    // 调用 validateUrl，触发共享工具此处需要的副作用。
    validateUrl(url)

    // browserEnv 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const browserEnv = process.env.BROWSER
    // platform保存`process.platform`，供共享工具 browser后续判断或输出使用。
    const platform = process.platform

    // 当 `platform` 匹配 `'win32'` 时，共享工具执行对应分支。
    if (platform === 'win32') {
      // 满足 `browserEnv` 时，共享工具执行该分支。
      if (browserEnv) {
        // browsers require shell, else they will treat this as a file:/// handle
        // 从 `await execFileNoThrow(browserEnv, [`"${url}"`])` 解构 code，减少共享工具 browser对同一对象的重复访问。
        const { code } = await execFileNoThrow(browserEnv, [`"${url}"`])
        // 返回 `code === 0`，作为共享工具这次计算的结果。
        return code === 0
      }
      // 从 `await execFileNoThrow(` 解构 code，减少共享工具 browser对同一对象的重复访问。
      const { code } = await execFileNoThrow(
        'rundll32',
        ['url,OpenURL', url],
        {},
      )
      // 返回 `code === 0`，作为共享工具这次计算的结果。
      return code === 0
    } else {
      // command 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const command =
        browserEnv || (platform === 'darwin' ? 'open' : 'xdg-open')
      // 从 `await execFileNoThrow(command, [url])` 解构 code，减少共享工具 browser对同一对象的重复访问。
      const { code } = await execFileNoThrow(command, [url])
      // 返回 `code === 0`，作为共享工具这次计算的结果。
      return code === 0
    }
  } catch (_) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}
