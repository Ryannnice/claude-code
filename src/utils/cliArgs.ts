/**
 * Parse a CLI flag value early, before Commander.js processes arguments.
 * Supports both space-separated (--flag value) and equals-separated (--flag=value) syntax.
 *
 * This function is intended for flags that must be parsed before init() runs,
 * such as --settings which affects configuration loading. For normal flag parsing,
 * rely on Commander.js which handles this automatically.
 *
 * @param flagName The flag name including dashes (e.g., '--settings')
 * @param argv Optional argv array to parse (defaults to process.argv)
 * @returns The value if found, undefined otherwise
 */
// eagerParseCliFlag 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function eagerParseCliFlag(
  flagName: string,
  argv: string[] = process.argv,
): string | undefined {
  // 按索引扫描 `argv.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < argv.length; i++) {
    // 当前参数读取 `argv[i]` 对应条目，后续围绕该成员继续处理。
    const arg = argv[i]
    // Handle --flag=value syntax
    // 满足 `arg?.startsWith(`${flagName}=`)` 时，共享工具执行该分支。
    if (arg?.startsWith(`${flagName}=`)) {
      // 返回 `arg.slice(flagName.length + 1)`，作为共享工具这次计算的结果。
      return arg.slice(flagName.length + 1)
    }
    // Handle --flag value syntax
    // 只有 `arg === flagName && i + 1 < argv.length` 满足时，共享工具才执行该分支。
    if (arg === flagName && i + 1 < argv.length) {
      // 返回 `argv[i + 1]`，作为共享工具这次计算的结果。
      return argv[i + 1]
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Handle the standard Unix `--` separator convention in CLI arguments.
 *
 * When using Commander.js with `.passThroughOptions()`, the `--` separator
 * is passed through as a positional argument rather than being consumed.
 * This means when a user runs:
 *   `cmd --opt value name -- subcmd --flag arg`
 *
 * Commander parses it as:
 *   positional1 = "name", positional2 = "--", rest = ["subcmd", "--flag", "arg"]
 *
 * This function corrects the parsing by extracting the actual command from
 * the rest array when the positional is `--`.
 *
 * @param commandOrValue - The parsed positional that may be "--"
 * @param args - The remaining arguments array
 * @returns Object with corrected command and args
 */
// extractArgsAfterDoubleDash 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractArgsAfterDoubleDash(
  commandOrValue: string,
  args: string[] = [],
): { command: string; args: string[] } {
  // 只有 `commandOrValue === '--' && args.length > 0` 满足时，共享工具才执行该分支。
  if (commandOrValue === '--' && args.length > 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      command: args[0]!,
      args: args.slice(1),
    }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { command: commandOrValue, args }
}
