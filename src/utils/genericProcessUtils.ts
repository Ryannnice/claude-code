// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  execFileNoThrowWithCwd,
  execSyncWithDefaults_DEPRECATED,
} from './execFileNoThrow.js'

// This file contains platform-agnostic implementations of common `ps` type commands.
// When adding new code to this file, make sure to handle:
// - Win32, as `ps` within cygwin and WSL may not behave as expected, particularly when attempting to access processes on the host.
// - Unix vs BSD-style `ps` have different options.

/**
 * Check if a process with the given PID is running (signal 0 probe).
 *
 * PID ≤ 1 returns false (0 is current process group, 1 is init).
 *
 * Note: `process.kill(pid, 0)` throws EPERM when the process exists but is
 * owned by another user. This reports such processes as NOT running, which
 * is conservative for lock recovery (we won't steal a live lock).
 */
// isProcessRunning 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isProcessRunning(pid: number): boolean {
  // 满足 `pid <= 1` 时，共享工具执行该分支。
  if (pid <= 1) return false
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 process.kill，触发共享工具此处需要的副作用。
    process.kill(pid, 0)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Gets the ancestor process chain for a given process (up to maxDepth levels)
 * @param pid - The starting process ID
 * @param maxDepth - Maximum number of ancestors to fetch (default: 10)
 * @returns Array of ancestor PIDs from immediate parent to furthest ancestor
 */
// getAncestorPidsAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getAncestorPidsAsync(
  pid: string | number,
  maxDepth = 10,
): Promise<number[]> {
  // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (process.platform === 'win32') {
    // For Windows, use a PowerShell script that walks the process tree
    // script保存```，作为后续固定文本处理的输入。
    const script = `
      $pid = ${String(pid)}
      $ancestors = @()
      for ($i = 0; $i -lt ${maxDepth}; $i++) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$pid" -ErrorAction SilentlyContinue
        if (-not $proc -or -not $proc.ParentProcessId -or $proc.ParentProcessId -eq 0) { break }
        $pid = $proc.ParentProcessId
        $ancestors += $pid
      }
      $ancestors -join ','
    `.trim()

    // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const result = await execFileNoThrowWithCwd(
      'powershell.exe',
      ['-NoProfile', '-Command', script],
      { timeout: 3000 },
    )
    // `result.code` 与 `0 || !result.stdout?.trim()` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0 || !result.stdout?.trim()) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }
    // 返回 `result.stdout`，作为共享工具这次计算的结果。
    return result.stdout
      .trim()
      .split(',')
      .filter(Boolean)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(p => parseInt(p, 10))
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(p => !isNaN(p))
  }

  // For Unix, use a shell command that walks up the process tree
  // This uses a single process invocation instead of multiple sequential calls
  // script保存`String`，供共享工具后续处理使用。
  const script = `pid=${String(pid)}; for i in $(seq 1 ${maxDepth}); do ppid=$(ps -o ppid= -p $pid 2>/dev/null | tr -d ' '); if [ -z "$ppid" ] || [ "$ppid" = "0" ] || [ "$ppid" = "1" ]; then break; fi; echo $ppid; pid=$ppid; done`

  // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const result = await execFileNoThrowWithCwd('sh', ['-c', script], {
    timeout: 3000,
  })
  // `result.code` 与 `0 || !result.stdout?.trim()` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0 || !result.stdout?.trim()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回 `result.stdout`，作为共享工具这次计算的结果。
  return result.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(p => parseInt(p, 10))
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(p => !isNaN(p))
}

/**
 * Gets the command line for a given process
 * @param pid - The process ID to get the command for
 * @returns The command line string, or null if not found
 * @deprecated Use getAncestorCommandsAsync instead
 */
// getProcessCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProcessCommand(pid: string | number): string | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // pidStr保存`String`，供共享工具后续处理使用。
    const pidStr = String(pid)
    // command 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const command =
      process.platform === 'win32'
        ? `powershell.exe -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pidStr}\\").CommandLine"`
        : `ps -o command= -p ${pidStr}`

    // 结果保存`execSyncWithDefaults_DEPRECATED`，供共享工具后续处理使用。
    const result = execSyncWithDefaults_DEPRECATED(command, { timeout: 1000 })
    // 返回 `result ? result.trim() : null`，作为共享工具这次计算的结果。
    return result ? result.trim() : null
  } catch {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Gets the command lines for a process and its ancestors in a single call
 * @param pid - The starting process ID
 * @param maxDepth - Maximum depth to traverse (default: 10)
 * @returns Array of command strings for the process chain
 */
// getAncestorCommandsAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getAncestorCommandsAsync(
  pid: string | number,
  maxDepth = 10,
): Promise<string[]> {
  // 当 `process.platform` 匹配 `'win32'` 时，共享工具执行对应分支。
  if (process.platform === 'win32') {
    // For Windows, use a PowerShell script that walks the process tree and collects commands
    // script保存```，作为后续固定文本处理的输入。
    const script = `
      $currentPid = ${String(pid)}
      $commands = @()
      for ($i = 0; $i -lt ${maxDepth}; $i++) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$currentPid" -ErrorAction SilentlyContinue
        if (-not $proc) { break }
        if ($proc.CommandLine) { $commands += $proc.CommandLine }
        if (-not $proc.ParentProcessId -or $proc.ParentProcessId -eq 0) { break }
        $currentPid = $proc.ParentProcessId
      }
      $commands -join [char]0
    `.trim()

    // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const result = await execFileNoThrowWithCwd(
      'powershell.exe',
      ['-NoProfile', '-Command', script],
      { timeout: 3000 },
    )
    // `result.code` 与 `0 || !result.stdout?.trim()` 不一致时刷新派生状态，避免使用过期结果。
    if (result.code !== 0 || !result.stdout?.trim()) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }
    // 返回 `result.stdout.split('\0').filter(Boolean)`，作为共享工具这次计算的结果。
    return result.stdout.split('\0').filter(Boolean)
  }

  // For Unix, use a shell command that walks up the process tree and collects commands
  // Using null byte as separator to handle commands with newlines
  // script保存`String`，供共享工具后续处理使用。
  const script = `currentpid=${String(pid)}; for i in $(seq 1 ${maxDepth}); do cmd=$(ps -o command= -p $currentpid 2>/dev/null); if [ -n "$cmd" ]; then printf '%s\\0' "$cmd"; fi; ppid=$(ps -o ppid= -p $currentpid 2>/dev/null | tr -d ' '); if [ -z "$ppid" ] || [ "$ppid" = "0" ] || [ "$ppid" = "1" ]; then break; fi; currentpid=$ppid; done`

  // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
  const result = await execFileNoThrowWithCwd('sh', ['-c', script], {
    timeout: 3000,
  })
  // `result.code` 与 `0 || !result.stdout?.trim()` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0 || !result.stdout?.trim()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回 `result.stdout.split('\0').filter(Boolean)`，作为共享工具这次计算的结果。
  return result.stdout.split('\0').filter(Boolean)
}

/**
 * Gets the child process IDs for a given process
 * @param pid - The parent process ID
 * @returns Array of child process IDs as numbers
 */
// getChildPids 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getChildPids(pid: string | number): number[] {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // pidStr保存`String`，供共享工具后续处理使用。
    const pidStr = String(pid)
    // command 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const command =
      process.platform === 'win32'
        ? `powershell.exe -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ParentProcessId=${pidStr}\\").ProcessId"`
        : `pgrep -P ${pidStr}`

    // 结果保存`execSyncWithDefaults_DEPRECATED`，供共享工具后续处理使用。
    const result = execSyncWithDefaults_DEPRECATED(command, { timeout: 1000 })
    // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!result) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(p => parseInt(p, 10))
      // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
      .filter(p => !isNaN(p))
  } catch {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
}
