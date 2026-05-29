// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { mkdirSync, writeFileSync } from 'fs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getApiKeyFromFd,
  getOauthTokenFromFd,
  setApiKeyFromFd,
  setOauthTokenFromFd,
} from '../bootstrap/state.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 errorMessage、isENOENT，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, isENOENT } from './errors.js'
// 引入 getFsImplementation，将 ./fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from './fsOperations.js'

/**
 * Well-known token file locations in CCR. The Go environment-manager creates
 * /home/claude/.claude/remote/ and will (eventually) write these files too.
 * Until then, this module writes them on successful FD read so subprocesses
 * spawned inside the CCR container can find the token without inheriting
 * the FD — which they can't: pipe FDs don't cross tmux/shell boundaries.
 */
// CCR_TOKEN_DIR 命名 `'/home/claude/.claude/remote'`，让后续代码直接表达这个值的用途。
const CCR_TOKEN_DIR = '/home/claude/.claude/remote'
// CCR_OAUTH_TOKEN_PATH 路径数据保存``${CCR_TOKEN_DIR}/.oauth_token``，作为后续固定文本处理的输入。
export const CCR_OAUTH_TOKEN_PATH = `${CCR_TOKEN_DIR}/.oauth_token`
// CCR_API_KEY_PATH 路径数据 命名 ``${CCR_TOKEN_DIR}/.api_key``，让后续代码直接表达这个值的用途。
export const CCR_API_KEY_PATH = `${CCR_TOKEN_DIR}/.api_key`
// CCR_SESSION_INGRESS_TOKEN_PATH 会话数据保存``${CCR_TOKEN_DIR}/.session_ingress_token``，作为后续固定文本处理的输入。
export const CCR_SESSION_INGRESS_TOKEN_PATH = `${CCR_TOKEN_DIR}/.session_ingress_token`

/**
 * Best-effort write of the token to a well-known location for subprocess
 * access. CCR-gated: outside CCR there's no /home/claude/ and no reason to
 * put a token on disk that the FD was meant to keep off disk.
 */
// maybePersistTokenForSubprocesses 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function maybePersistTokenForSubprocesses(
  path: string,
  token: string,
  tokenName: string,
): void {
  // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)` 时，共享工具执行该分支。
  if (!isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
    // 共享工具 auth File Descriptor在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line custom-rules/no-sync-fs -- one-shot startup write in CCR, caller is sync
    // 调用 mkdirSync，触发共享工具此处需要的副作用。
    mkdirSync(CCR_TOKEN_DIR, { recursive: true, mode: 0o700 })
    // eslint-disable-next-line custom-rules/no-sync-fs -- one-shot startup write in CCR, caller is sync
    // 调用 writeFileSync，触发共享工具此处需要的副作用。
    writeFileSync(path, token, { encoding: 'utf8', mode: 0o600 })
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Persisted ${tokenName} to ${path} for subprocess access`)
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to persist ${tokenName} to disk (non-fatal): ${errorMessage(error)}`,
      { level: 'error' },
    )
  }
}

/**
 * Fallback read from a well-known file. The path only exists in CCR (env-manager
 * creates the directory), so file-not-found is the expected outcome everywhere
 * else — treated as "no fallback", not an error.
 */
// readTokenFromWellKnownFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function readTokenFromWellKnownFile(
  path: string,
  tokenName: string,
): string | null {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // fsOps 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fsOps = getFsImplementation()
    // eslint-disable-next-line custom-rules/no-sync-fs -- fallback read for CCR subprocess path, one-shot at startup, caller is sync
    // token读取`fsOps.readFileSync`，供共享工具后续处理使用。
    const token = fsOps.readFileSync(path, { encoding: 'utf8' }).trim()
    // token缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!token) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Read ${tokenName} from well-known file ${path}`)
    // 返回 `token`，作为共享工具这次计算的结果。
    return token
  } catch (error) {
    // ENOENT is the expected outcome outside CCR — stay silent. Anything
    // else (EACCES from perm misconfig, etc.) is worth surfacing in the
    // debug log so subprocess auth failures aren't mysterious.
    // 满足 `!isENOENT(error)` 时，共享工具执行该分支。
    if (!isENOENT(error)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to read ${tokenName} from ${path}: ${errorMessage(error)}`,
        { level: 'debug' },
      )
    }
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

/**
 * Shared FD-or-well-known-file credential reader.
 *
 * Priority order:
 *  1. File descriptor (legacy path) — env var points at a pipe FD passed by
 *     the Go env-manager via cmd.ExtraFiles. Pipe is drained on first read
 *     and doesn't cross exec/tmux boundaries.
 *  2. Well-known file — written by this function on successful FD read (and
 *     eventually by the env-manager directly). Covers subprocesses that can't
 *     inherit the FD.
 *
 * Returns null if neither source has a credential. Cached in global state.
 */
// getCredentialFromFd 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCredentialFromFd({
  envVar,
  wellKnownPath,
  label,
  getCached,
  setCached,
}: {
  envVar: string
  wellKnownPath: string
  label: string
  // 这个回调绑定到 getCached: () => string | null | undefined，负责共享工具在该局部场景下的响应。
  getCached: () => string | null | undefined
  // 这个回调绑定到 setCached: (value: string | null) => void，负责共享工具在该局部场景下的响应。
  setCached: (value: string | null) => void
}): string | null {
  // cached 缓存读取`getCached`，供共享工具后续处理使用。
  const cached = getCached()
  // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== undefined) {
    // 返回 `cached`，作为共享工具这次计算的结果。
    return cached
  }

  // fdEnv保存`process.env[envVar]`，供共享工具 auth File Descriptor后续判断或输出使用。
  const fdEnv = process.env[envVar]
  // fdEnv缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!fdEnv) {
    // No FD env var — either we're not in CCR, or we're a subprocess whose
    // parent stripped the (useless) FD env var. Try the well-known file.
    // fromFile 文件数据读取`readTokenFromWellKnownFile`，供共享工具后续处理使用。
    const fromFile = readTokenFromWellKnownFile(wellKnownPath, label)
    // setCached 写入新的状态值，使共享工具后续读取保持一致。
    setCached(fromFile)
    // 返回 `fromFile`，作为共享工具这次计算的结果。
    return fromFile
  }

  // fd解析`parseInt`，供共享工具后续处理使用。
  const fd = parseInt(fdEnv, 10)
  // 满足 `Number.isNaN(fd)` 时，共享工具执行该分支。
  if (Number.isNaN(fd)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `${envVar} must be a valid file descriptor number, got: ${fdEnv}`,
      { level: 'error' },
    )
    // setCached 写入新的状态值，使共享工具后续读取保持一致。
    setCached(null)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Use /dev/fd on macOS/BSD, /proc/self/fd on Linux
    // fsOps 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const fsOps = getFsImplementation()
    // fdPath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const fdPath =
      process.platform === 'darwin' || process.platform === 'freebsd'
        ? `/dev/fd/${fd}`
        : `/proc/self/fd/${fd}`

    // eslint-disable-next-line custom-rules/no-sync-fs -- legacy FD path, read once at startup, caller is sync
    // token读取`fsOps.readFileSync`，供共享工具后续处理使用。
    const token = fsOps.readFileSync(fdPath, { encoding: 'utf8' }).trim()
    // token缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!token) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`File descriptor contained empty ${label}`, {
        level: 'error',
      })
      // setCached 写入新的状态值，使共享工具后续读取保持一致。
      setCached(null)
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Successfully read ${label} from file descriptor ${fd}`)
    // setCached 写入新的状态值，使共享工具后续读取保持一致。
    setCached(token)
    // 调用 maybePersistTokenForSubprocesses，触发共享工具此处需要的副作用。
    maybePersistTokenForSubprocesses(wellKnownPath, token, label)
    // 返回 `token`，作为共享工具这次计算的结果。
    return token
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to read ${label} from file descriptor ${fd}: ${errorMessage(error)}`,
      { level: 'error' },
    )
    // FD env var was set but read failed — typically a subprocess that
    // inherited the env var but not the FD (ENXIO). Try the well-known file.
    // fromFile 文件数据读取`readTokenFromWellKnownFile`，供共享工具后续处理使用。
    const fromFile = readTokenFromWellKnownFile(wellKnownPath, label)
    // setCached 写入新的状态值，使共享工具后续读取保持一致。
    setCached(fromFile)
    // 返回 `fromFile`，作为共享工具这次计算的结果。
    return fromFile
  }
}

/**
 * Get the CCR-injected OAuth token. See getCredentialFromFd for FD-vs-disk
 * rationale. Env var: CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR.
 * Well-known file: /home/claude/.claude/remote/.oauth_token.
 */
// getOAuthTokenFromFileDescriptor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOAuthTokenFromFileDescriptor(): string | null {
  // 返回 `getCredentialFromFd({`，作为共享工具这次计算的结果。
  return getCredentialFromFd({
    envVar: 'CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR',
    wellKnownPath: CCR_OAUTH_TOKEN_PATH,
    label: 'OAuth token',
    getCached: getOauthTokenFromFd,
    setCached: setOauthTokenFromFd,
  })
}

/**
 * Get the CCR-injected API key. See getCredentialFromFd for FD-vs-disk
 * rationale. Env var: CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR.
 * Well-known file: /home/claude/.claude/remote/.api_key.
 */
// getApiKeyFromFileDescriptor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getApiKeyFromFileDescriptor(): string | null {
  // 返回 `getCredentialFromFd({`，作为共享工具这次计算的结果。
  return getCredentialFromFd({
    envVar: 'CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR',
    wellKnownPath: CCR_API_KEY_PATH,
    label: 'API key',
    getCached: getApiKeyFromFd,
    setCached: setApiKeyFromFd,
  })
}
