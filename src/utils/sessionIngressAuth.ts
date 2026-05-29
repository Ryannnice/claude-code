// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSessionIngressToken,
  setSessionIngressToken,
} from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  CCR_SESSION_INGRESS_TOKEN_PATH,
  maybePersistTokenForSubprocesses,
  readTokenFromWellKnownFile,
} from './authFileDescriptor.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 errorMessage，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from './errors.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'

/**
 * Read token via file descriptor, falling back to well-known file.
 * Uses global state to cache the result since file descriptors can only be read once.
 */
// getTokenFromFileDescriptor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTokenFromFileDescriptor(): string | null {
  // Check if we've already attempted to read the token
  // cachedToken 缓存读取`getSessionIngressToken`，供共享工具后续处理使用。
  const cachedToken = getSessionIngressToken()
  // `cachedToken` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (cachedToken !== undefined) {
    // 返回 `cachedToken`，作为共享工具这次计算的结果。
    return cachedToken
  }

  // fdEnv 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const fdEnv = process.env.CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR
  // fdEnv缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!fdEnv) {
    // No FD env var — either we're not in CCR, or we're a subprocess whose
    // parent stripped the (useless) FD env var. Try the well-known file.
    // path 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const path =
      process.env.CLAUDE_SESSION_INGRESS_TOKEN_FILE ??
      CCR_SESSION_INGRESS_TOKEN_PATH
    // fromFile 文件数据读取`readTokenFromWellKnownFile`，供共享工具后续处理使用。
    const fromFile = readTokenFromWellKnownFile(path, 'session ingress token')
    // setSessionIngressToken 写入新的状态值，使共享工具后续读取保持一致。
    setSessionIngressToken(fromFile)
    // 返回 `fromFile`，作为共享工具这次计算的结果。
    return fromFile
  }

  // fd解析`parseInt`，供共享工具后续处理使用。
  const fd = parseInt(fdEnv, 10)
  // 满足 `Number.isNaN(fd)` 时，共享工具执行该分支。
  if (Number.isNaN(fd)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR must be a valid file descriptor number, got: ${fdEnv}`,
      { level: 'error' },
    )
    // setSessionIngressToken 写入新的状态值，使共享工具后续读取保持一致。
    setSessionIngressToken(null)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Read from the file descriptor
    // Use /dev/fd on macOS/BSD, /proc/self/fd on Linux
    // fsOps 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fsOps = getFsImplementation()
    // fdPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const fdPath =
      process.platform === 'darwin' || process.platform === 'freebsd'
        ? `/dev/fd/${fd}`
        : `/proc/self/fd/${fd}`

    // token读取`fsOps.readFileSync`，供共享工具后续处理使用。
    const token = fsOps.readFileSync(fdPath, { encoding: 'utf8' }).trim()
    // token缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!token) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('File descriptor contained empty token', {
        level: 'error',
      })
      // setSessionIngressToken 写入新的状态值，使共享工具后续读取保持一致。
      setSessionIngressToken(null)
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Successfully read token from file descriptor ${fd}`)
    // setSessionIngressToken 写入新的状态值，使共享工具后续读取保持一致。
    setSessionIngressToken(token)
    // 调用 maybePersistTokenForSubprocesses，触发共享工具此处需要的副作用。
    maybePersistTokenForSubprocesses(
      CCR_SESSION_INGRESS_TOKEN_PATH,
      token,
      'session ingress token',
    )
    // 返回 `token`，作为共享工具这次计算的结果。
    return token
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to read token from file descriptor ${fd}: ${errorMessage(error)}`,
      { level: 'error' },
    )
    // FD env var was set but read failed — typically a subprocess that
    // inherited the env var but not the FD (ENXIO). Try the well-known file.
    // path 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const path =
      process.env.CLAUDE_SESSION_INGRESS_TOKEN_FILE ??
      CCR_SESSION_INGRESS_TOKEN_PATH
    // fromFile 文件数据读取`readTokenFromWellKnownFile`，供共享工具后续处理使用。
    const fromFile = readTokenFromWellKnownFile(path, 'session ingress token')
    // setSessionIngressToken 写入新的状态值，使共享工具后续读取保持一致。
    setSessionIngressToken(fromFile)
    // 返回 `fromFile`，作为共享工具这次计算的结果。
    return fromFile
  }
}

/**
 * Get session ingress authentication token.
 *
 * Priority order:
 *  1. Environment variable (CLAUDE_CODE_SESSION_ACCESS_TOKEN) — set at spawn time,
 *     updated in-process via updateSessionIngressAuthToken or
 *     update_environment_variables stdin message from the parent bridge process.
 *  2. File descriptor (legacy path) — CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR,
 *     read once and cached.
 *  3. Well-known file — CLAUDE_SESSION_INGRESS_TOKEN_FILE env var path, or
 *     /home/claude/.claude/remote/.session_ingress_token. Covers subprocesses
 *     that can't inherit the FD.
 */
// getSessionIngressAuthToken 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionIngressAuthToken(): string | null {
  // 1. Check environment variable
  // envToken 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envToken = process.env.CLAUDE_CODE_SESSION_ACCESS_TOKEN
  // 满足 `envToken` 时，共享工具执行该分支。
  if (envToken) {
    // 返回 `envToken`，作为共享工具这次计算的结果。
    return envToken
  }

  // 2. Check file descriptor (legacy path), with file fallback
  // 返回 `getTokenFromFileDescriptor()`，作为共享工具这次计算的结果。
  return getTokenFromFileDescriptor()
}

/**
 * Build auth headers for the current session token.
 * Session keys (sk-ant-sid) use Cookie auth + X-Organization-Uuid;
 * JWTs use Bearer auth.
 */
// getSessionIngressAuthHeaders 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionIngressAuthHeaders(): Record<string, string> {
  // token读取`getSessionIngressAuthToken`，供共享工具后续处理使用。
  const token = getSessionIngressAuthToken()
  // token缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!token) return {}
  // 满足 `token.startsWith('sk-ant-sid')` 时，共享工具执行该分支。
  if (token.startsWith('sk-ant-sid')) {
    // 请求头 集中保存共享工具 session Ingress Auth要一起传递的字段。
    const headers: Record<string, string> = {
      Cookie: `sessionKey=${token}`,
    }
    // orgUuid 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const orgUuid = process.env.CLAUDE_CODE_ORGANIZATION_UUID
    // 满足 `orgUuid` 时，共享工具执行该分支。
    if (orgUuid) {
      // headers['X-Organization-Uuid'更新为 `orgUuid`，确保共享工具 session Ingress Auth后续读取最新状态。
      headers['X-Organization-Uuid'] = orgUuid
    }
    // 返回 `headers`，作为共享工具这次计算的结果。
    return headers
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { Authorization: `Bearer ${token}` }
}

/**
 * Update the session ingress auth token in-process by setting the env var.
 * Used by the REPL bridge to inject a fresh token after reconnection
 * without restarting the process.
 */
// updateSessionIngressAuthToken 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateSessionIngressAuthToken(token: string): void {
  // CLAUDE_CODE_SESSION_ACCESS_TOKEN 会话数据更新为 `token`，确保共享工具后续读取最新状态。
  process.env.CLAUDE_CODE_SESSION_ACCESS_TOKEN = token
}
