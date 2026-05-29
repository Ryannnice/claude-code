// SHELL_TYPES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const SHELL_TYPES = ['bash', 'powershell'] as const
// ShellType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShellType = (typeof SHELL_TYPES)[number]
// DEFAULT_HOOK_SHELL固定为 `'bash'`，作为共享工具 shell Provider后续展示或比较的基准。
export const DEFAULT_HOOK_SHELL: ShellType = 'bash'

// ShellProvider 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShellProvider = {
  type: ShellType
  shellPath: string
  detached: boolean

  /**
   * Build the full command string including all shell-specific setup.
   * For bash: source snapshot, session env, disable extglob, eval-wrap, pwd tracking.
   */
  // 调用 buildExecCommand，触发共享工具此处需要的副作用。
  buildExecCommand(
    command: string,
    opts: {
      id: number | string
      sandboxTmpDir?: string
      useSandbox: boolean
    },
  ): Promise<{ commandString: string; cwdFilePath: string }>

  /**
   * Shell args for spawn (e.g., ['-c', '-l', cmd] for bash).
   */
  // getSpawnArgs 根据 commandString: string 读取或计算共享工具需要的结果。
  getSpawnArgs(commandString: string): string[]

  /**
   * Extra env vars for this shell type.
   * May perform async initialization (e.g., tmux socket setup for bash).
   */
  // getEnvironmentOverrides 根据 command: string 读取或计算共享工具需要的结果。
  getEnvironmentOverrides(command: string): Promise<Record<string, string>>
}
