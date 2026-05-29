/**
 * XDG Base Directory utilities for Claude CLI Native Installer
 *
 * Implements the XDG Base Directory specification for organizing
 * native installer components across appropriate system directories.
 *
 * @see https://specifications.freedesktop.org/basedir-spec/latest/
 */

// 引入 homedir as osHomedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir as osHomedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'

// EnvLike 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type EnvLike = Record<string, string | undefined>

// XDGOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type XDGOptions = {
  env?: EnvLike
  homedir?: string
}

// resolveOptions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveOptions(options?: XDGOptions): { env: EnvLike; home: string } {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    env: options?.env ?? process.env,
    home: options?.homedir ?? process.env.HOME ?? osHomedir(),
  }
}

/**
 * Get XDG state home directory
 * Default: ~/.local/state
 * @param options Optional env and homedir overrides for testing
 */
// getXDGStateHome 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getXDGStateHome(options?: XDGOptions): string {
  // 从 `resolveOptions(options)` 解构 env、home，减少共享工具 xdg对同一对象的重复访问。
  const { env, home } = resolveOptions(options)
  // 返回 `env.XDG_STATE_HOME ?? join(home, '.local', 'state')`，作为共享工具这次计算的结果。
  return env.XDG_STATE_HOME ?? join(home, '.local', 'state')
}

/**
 * Get XDG cache home directory
 * Default: ~/.cache
 * @param options Optional env and homedir overrides for testing
 */
// getXDGCacheHome 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getXDGCacheHome(options?: XDGOptions): string {
  // 从 `resolveOptions(options)` 解构 env、home，减少共享工具 xdg对同一对象的重复访问。
  const { env, home } = resolveOptions(options)
  // 返回 `env.XDG_CACHE_HOME ?? join(home, '.cache')`，作为共享工具这次计算的结果。
  return env.XDG_CACHE_HOME ?? join(home, '.cache')
}

/**
 * Get XDG data home directory
 * Default: ~/.local/share
 * @param options Optional env and homedir overrides for testing
 */
// getXDGDataHome 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getXDGDataHome(options?: XDGOptions): string {
  // 从 `resolveOptions(options)` 解构 env、home，减少共享工具 xdg对同一对象的重复访问。
  const { env, home } = resolveOptions(options)
  // 返回 `env.XDG_DATA_HOME ?? join(home, '.local', 'share')`，作为共享工具这次计算的结果。
  return env.XDG_DATA_HOME ?? join(home, '.local', 'share')
}

/**
 * Get user bin directory (not technically XDG but follows the convention)
 * Default: ~/.local/bin
 * @param options Optional homedir override for testing
 */
// getUserBinDir 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUserBinDir(options?: XDGOptions): string {
  // 从 `resolveOptions(options)` 解构 home，减少共享工具 xdg对同一对象的重复访问。
  const { home } = resolveOptions(options)
  // 返回 `join(home, '.local', 'bin')`，作为共享工具这次计算的结果。
  return join(home, '.local', 'bin')
}
