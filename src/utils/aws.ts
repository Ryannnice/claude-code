// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'

/** AWS short-term credentials format. */
// AwsCredentials 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AwsCredentials = {
  AccessKeyId: string
  SecretAccessKey: string
  SessionToken: string
  Expiration?: string
}

/** Output from `aws sts get-session-token` or `aws sts assume-role`. */
// AwsStsOutput 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AwsStsOutput = {
  Credentials: AwsCredentials
}

// AwsError 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type AwsError = {
  name: string
}

// isAwsCredentialsProviderError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAwsCredentialsProviderError(err: unknown) {
  // 返回 `(err as AwsError | undefined)?.name === 'CredentialsProviderError'`，作为共享工具这次计算的结果。
  return (err as AwsError | undefined)?.name === 'CredentialsProviderError'
}

/** Typeguard to validate AWS STS assume-role output */
// isValidAwsStsOutput 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isValidAwsStsOutput(obj: unknown): obj is AwsStsOutput {
  // `!obj || typeof obj` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!obj || typeof obj !== 'object') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // output保存`obj as Record<string, unknown>`，供后续判断或组装使用。
  const output = obj as Record<string, unknown>

  // Check if Credentials exists and has required fields
  // 只有 `!output.Credentials || typeof output.Credentials` 满足时，共享工具才执行该分支。
  if (!output.Credentials || typeof output.Credentials !== 'object') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // credentials 集合保存`output.Credentials as Record<string, unknown>`，供共享工具 aws后续判断或输出使用。
  const credentials = output.Credentials as Record<string, unknown>

  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    typeof credentials.AccessKeyId === 'string' &&
    typeof credentials.SecretAccessKey === 'string' &&
    typeof credentials.SessionToken === 'string' &&
    credentials.AccessKeyId.length > 0 &&
    credentials.SecretAccessKey.length > 0 &&
    credentials.SessionToken.length > 0
  )
}

/** Throws if STS caller identity cannot be retrieved. */
// checkStsCallerIdentity 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkStsCallerIdentity(): Promise<void> {
  // 从 `await import(` 解构 STSClient、GetCallerIdentityCommand，减少共享工具 aws对同一对象的重复访问。
  const { STSClient, GetCallerIdentityCommand } = await import(
    '@aws-sdk/client-sts'
  )
  // 等待 `new STSClient().send(new GetCallerIdentityCommand({}))` 完成，再继续共享工具 aws的异步流程。
  await new STSClient().send(new GetCallerIdentityCommand({}))
}

/**
 * Clear AWS credential provider cache by forcing a refresh
 * This ensures that any changes to ~/.aws/credentials are picked up immediately
 */
// clearAwsIniCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function clearAwsIniCache(): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Clearing AWS credential provider cache')
    // 从 `await import('@aws-sdk/credential-providers')` 解构 fromIni，减少共享工具 aws对同一对象的重复访问。
    const { fromIni } = await import('@aws-sdk/credential-providers')
    // iniProvider保存`fromIni`，供共享工具后续处理使用。
    const iniProvider = fromIni({ ignoreCache: true })
    // 等待 `iniProvider() // This updates the global file cache` 完成，再继续共享工具 aws的异步流程。
    await iniProvider() // This updates the global file cache
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('AWS credential provider cache refreshed')
  } catch (_error) {
    // Ignore errors - we're just clearing the cache
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Failed to clear AWS credential cache (this is expected if no credentials are configured)',
    )
  }
}
