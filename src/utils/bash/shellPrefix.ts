// 引入 quote，将 ./shellQuote.js 中已经封装好的能力接到本文件流程里。
import { quote } from './shellQuote.js'

/**
 * Parses a shell prefix that may contain an executable path and arguments.
 *
 * Examples:
 * - "bash" -> quotes as 'bash'
 * - "/usr/bin/bash -c" -> quotes as '/usr/bin/bash' -c
 * - "C:\Program Files\Git\bin\bash.exe -c" -> quotes as 'C:\Program Files\Git\bin\bash.exe' -c
 *
 * @param prefix The shell prefix string containing executable and optional arguments
 * @param command The command to be executed
 * @returns The properly formatted command string with quoted components
 */
// formatShellPrefixCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatShellPrefixCommand(
  prefix: string,
  command: string,
): string {
  // Split on the last space before a dash to separate executable from arguments
  // spaceBeforeDash保存`prefix.lastIndexOf`，供共享工具后续处理使用。
  const spaceBeforeDash = prefix.lastIndexOf(' -')
  // 满足 `spaceBeforeDash > 0` 时，共享工具执行该分支。
  if (spaceBeforeDash > 0) {
    // execPath 路径数据格式化`prefix.substring`，供共享工具后续处理使用。
    const execPath = prefix.substring(0, spaceBeforeDash)
    // 参数列表格式化`prefix.substring`，供共享工具后续处理使用。
    const args = prefix.substring(spaceBeforeDash + 1)
    // 返回 ``${quote([execPath])} ${args} ${quote([command])}``，作为共享工具这次计算的结果。
    return `${quote([execPath])} ${args} ${quote([command])}`
  } else {
    // 返回 ``${quote([prefix])} ${quote([command])}``，作为共享工具这次计算的结果。
    return `${quote([prefix])} ${quote([command])}`
  }
}
