// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 引入 which，将 ../which.js 中已经封装好的能力接到本文件流程里。
import { which } from '../which.js'

// GhAuthStatus 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GhAuthStatus =
  | 'authenticated'
  | 'not_authenticated'
  | 'not_installed'

/**
 * Returns gh CLI install + auth status for telemetry.
 * Uses which() first (Bun.which — no subprocess) to detect install, then
 * exit code of `gh auth token` to detect auth. Uses `auth token` instead of
 * `auth status` because the latter makes a network request to GitHub's API,
 * while `auth token` only reads local config/keyring. Spawns with
 * stdout: 'ignore' so the token never enters this process.
 */
// getGhAuthStatus 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getGhAuthStatus(): Promise<GhAuthStatus> {
  // ghPath 路径数据保存`which`，供共享工具后续处理使用。
  const ghPath = await which('gh')
  // ghPath 路径数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!ghPath) {
    // 返回 `'not_installed'`，作为共享工具这次计算的结果。
    return 'not_installed'
  }
  // 从 `await execa('gh', ['auth', 'token'], {` 解构 exitCode，减少共享工具 gh Auth Status对同一对象的重复访问。
  const { exitCode } = await execa('gh', ['auth', 'token'], {
    stdout: 'ignore',
    stderr: 'ignore',
    timeout: 5000,
    reject: false,
  })
  // 返回 `exitCode === 0 ? 'authenticated' : 'not_authenticated'`，作为共享工具这次计算的结果。
  return exitCode === 0 ? 'authenticated' : 'not_authenticated'
}
