/**
 * CCR upstreamproxy — container-side wiring.
 *
 * When running inside a CCR session container with upstreamproxy configured,
 * this module:
 *   1. Reads the session token from /run/ccr/session_token
 *   2. Sets prctl(PR_SET_DUMPABLE, 0) to block same-UID ptrace of the heap
 *   3. Downloads the upstreamproxy CA cert and concatenates it with the
 *      system bundle so curl/gh/python trust the MITM proxy
 *   4. Starts a local CONNECT→WebSocket relay (see relay.ts)
 *   5. Unlinks the token file (token stays heap-only; file is gone before
 *      the agent loop can see it, but only after the relay is confirmed up
 *      so a supervisor restart can retry)
 *   6. Exposes HTTPS_PROXY / SSL_CERT_FILE env vars for all agent subprocesses
 *
 * Every step fails open: any error logs a warning and disables the proxy.
 * A broken proxy setup must never break an otherwise-working session.
 *
 * Design doc: api-go/ccr/docs/plans/CCR_AUTH_DESIGN.md § "Week-1 pilot scope".
 */

// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 复用 registerCleanup 工具函数，把通用处理留在 ../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../utils/cleanupRegistry.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../utils/envUtils.js'
// 复用 isENOENT 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { isENOENT } from '../utils/errors.js'
// 引入 startUpstreamProxyRelay，将 ./relay.js 中已经封装好的能力接到本文件流程里。
import { startUpstreamProxyRelay } from './relay.js'

// SESSION_TOKEN_PATH 会话数据 命名 `'/run/ccr/session_token'`，让后续代码直接表达这个值的用途。
export const SESSION_TOKEN_PATH = '/run/ccr/session_token'
// SYSTEM_CA_BUNDLE 命名 `'/etc/ssl/certs/ca-certificates.crt'`，让后续代码直接表达这个值的用途。
const SYSTEM_CA_BUNDLE = '/etc/ssl/certs/ca-certificates.crt'

// Hosts the proxy must NOT intercept. Covers loopback, RFC1918, the IMDS
// range, and the package registries + GitHub that CCR containers already
// reach directly. Mirrors airlock/scripts/sandbox-shell-ccr.sh.
// NO_PROXY_LIST 集合 聚合成有序列表，保持后续遍历顺序稳定。
const NO_PROXY_LIST = [
  'localhost',
  '127.0.0.1',
  '::1',
  '169.254.0.0/16',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  // Anthropic API: no upstream route will ever match, and the MITM breaks
  // non-Bun runtimes (Python httpx/certifi doesn't trust the forged CA).
  // Three forms because NO_PROXY parsing differs across runtimes:
  //   *.anthropic.com  — Bun, curl, Go (glob match)
  //   .anthropic.com   — Python urllib/httpx (suffix match, strips leading dot)
  //   anthropic.com    — apex domain fallback
  'anthropic.com',
  '.anthropic.com',
  '*.anthropic.com',
  'github.com',
  'api.github.com',
  '*.github.com',
  '*.githubusercontent.com',
  'registry.npmjs.org',
  'pypi.org',
  'files.pythonhosted.org',
  'index.crates.io',
  'proxy.golang.org',
].join(',')

// UpstreamProxyState 固化upstreamproxy里传递的数据形状，帮助调用方按同一结构读写字段。
type UpstreamProxyState = {
  enabled: boolean
  port?: number
  caBundlePath?: string
}

// 状态 集中保存upstreamproxy要一起传递的字段。
let state: UpstreamProxyState = { enabled: false }

/**
 * Initialize upstreamproxy. Called once from init.ts. Safe to call when the
 * feature is off or the token file is absent — returns {enabled: false}.
 *
 * Overridable paths are for tests; production uses the defaults.
 */
// initUpstreamProxy 封装upstreamproxy的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initUpstreamProxy(opts?: {
  tokenPath?: string
  systemCaPath?: string
  caBundlePath?: string
  ccrBaseUrl?: string
}): Promise<UpstreamProxyState> {
  // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)` 时，upstreamproxy执行该分支。
  if (!isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
    // 返回 `state`，作为upstreamproxy这次计算的结果。
    return state
  }
  // CCR evaluates ccr_upstream_proxy_enabled server-side (where GrowthBook is
  // warm) and injects this env var via StartupContext.EnvironmentVariables.
  // Every CCR session is a fresh container with no GB cache, so a client-side
  // GB check here always returned the default (false).
  // 满足 `!isEnvTruthy(process.env.CCR_UPSTREAM_PROXY_ENABLED)` 时，upstreamproxy执行该分支。
  if (!isEnvTruthy(process.env.CCR_UPSTREAM_PROXY_ENABLED)) {
    // 返回 `state`，作为upstreamproxy这次计算的结果。
    return state
  }

  // sessionId 会话数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const sessionId = process.env.CLAUDE_CODE_REMOTE_SESSION_ID
  // sessionId 会话数据缺失时提前走兜底路径，避免upstreamproxy继续依赖无效输入。
  if (!sessionId) {
    // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[upstreamproxy] CLAUDE_CODE_REMOTE_SESSION_ID unset; proxy disabled',
      { level: 'warn' },
    )
    // 返回 `state`，作为upstreamproxy这次计算的结果。
    return state
  }

  // tokenPath 路径数据保存`opts?.tokenPath ?? SESSION_TOKEN_PATH`，供upstreamproxy后续判断或输出使用。
  const tokenPath = opts?.tokenPath ?? SESSION_TOKEN_PATH
  // token读取`readToken`，供upstreamproxy后续处理使用。
  const token = await readToken(tokenPath)
  // token缺失时提前走兜底路径，避免upstreamproxy继续依赖无效输入。
  if (!token) {
    // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[upstreamproxy] no session token file; proxy disabled')
    // 返回 `state`，作为upstreamproxy这次计算的结果。
    return state
  }

  // setNonDumpable 写入新的状态值，使upstreamproxy后续读取保持一致。
  setNonDumpable()

  // CCR injects ANTHROPIC_BASE_URL via StartupContext (sessionExecutor.ts /
  // sessionHandler.ts). getOauthConfig() is wrong here: it keys off
  // USER_TYPE + USE_{LOCAL,STAGING}_OAUTH, none of which the container sets,
  // so it always returned the prod URL and the CA fetch 404'd.
  // baseUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const baseUrl =
    opts?.ccrBaseUrl ??
    process.env.ANTHROPIC_BASE_URL ??
    'https://api.anthropic.com'
  // caBundlePath 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const caBundlePath =
    opts?.caBundlePath ?? join(homedir(), '.ccr', 'ca-bundle.crt')

  // caOk读取`downloadCaBundle`，供upstreamproxy后续处理使用。
  const caOk = await downloadCaBundle(
    baseUrl,
    opts?.systemCaPath ?? SYSTEM_CA_BUNDLE,
    caBundlePath,
  )
  // caOk缺失时提前走兜底路径，避免upstreamproxy继续依赖无效输入。
  if (!caOk) return state

  // 保护这一段可能失败的upstreamproxy操作，确保异常能进入相邻错误处理。
  try {
    // wsUrl格式化`baseUrl.replace`，供upstreamproxy后续处理使用。
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/v1/code/upstreamproxy/ws'
    // relay保存`startUpstreamProxyRelay`，供upstreamproxy后续处理使用。
    const relay = await startUpstreamProxyRelay({ wsUrl, sessionId, token })
    // 调用 registerCleanup，触发upstreamproxy此处需要的副作用。
    registerCleanup(async () => relay.stop())
    // 状态更新为 `{ enabled: true, port: relay.port, caBundlePath }`，确保upstreamproxy后续读取最新状态。
    state = { enabled: true, port: relay.port, caBundlePath }
    // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[upstreamproxy] enabled on 127.0.0.1:${relay.port}`)
    // Only unlink after the listener is up: if CA download or listen()
    // fails, a supervisor restart can retry with the token still on disk.
    // 这个回调绑定到 await unlink(tokenPath).catch(() => {，负责upstreamproxy在该局部场景下的响应。
    await unlink(tokenPath).catch(() => {
      // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[upstreamproxy] token file unlink failed', {
        level: 'warn',
      })
    })
  } catch (err) {
    // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[upstreamproxy] relay start failed: ${err instanceof Error ? err.message : String(err)}; proxy disabled`,
      { level: 'warn' },
    )
  }

  // 返回 `state`，作为upstreamproxy这次计算的结果。
  return state
}

/**
 * Env vars to merge into every agent subprocess. Empty when the proxy is
 * disabled. Called from subprocessEnv() so Bash/MCP/LSP/hooks all inherit
 * the same recipe.
 */
// getUpstreamProxyEnv 封装upstreamproxy的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUpstreamProxyEnv(): Record<string, string> {
  // 组合条件 `!state.enabled || !state.port || !state.caBundleP` 成立时，upstreamproxy才启用这条专门路径。
  if (!state.enabled || !state.port || !state.caBundlePath) {
    // Child CLI processes can't re-initialize the relay (token file was
    // unlinked by the parent), but the parent's relay is still running and
    // reachable at 127.0.0.1:<port>. If we inherited proxy vars from the
    // parent (HTTPS_PROXY + SSL_CERT_FILE both set), pass them through so
    // our subprocesses also route through the parent's relay.
    // 组合条件 `process.env.HTTPS_PROXY && process.env.SSL_CERT_F` 成立时，upstreamproxy才启用这条专门路径。
    if (process.env.HTTPS_PROXY && process.env.SSL_CERT_FILE) {
      // inherited 从空对象开始收集键值，后续按名称补齐内容。
      const inherited: Record<string, string> = {}
      // 调用 for，触发upstreamproxy此处需要的副作用。
      for (const key of [
        'HTTPS_PROXY',
        'https_proxy',
        'NO_PROXY',
        'no_proxy',
        'SSL_CERT_FILE',
        'NODE_EXTRA_CA_CERTS',
        'REQUESTS_CA_BUNDLE',
        'CURL_CA_BUNDLE',
      ]) {
        // 满足 `process.env[key]` 时，upstreamproxy执行该分支。
        if (process.env[key]) inherited[key] = process.env[key]
      }
      // 返回 `inherited`，作为upstreamproxy这次计算的结果。
      return inherited
    }
    // 返回结构化结果，集中表达upstreamproxy已经整理出的状态。
    return {}
  }
  // proxyUrl固定为 ``http://127.0.0.1:${state.port}``，作为upstreamproxy后续展示或比较的基准。
  const proxyUrl = `http://127.0.0.1:${state.port}`
  // HTTPS only: the relay handles CONNECT and nothing else. Plain HTTP has
  // no credentials to inject, so routing it through the relay would just
  // break the request with a 405.
  // 返回结构化结果，集中表达upstreamproxy已经整理出的状态。
  return {
    HTTPS_PROXY: proxyUrl,
    https_proxy: proxyUrl,
    NO_PROXY: NO_PROXY_LIST,
    no_proxy: NO_PROXY_LIST,
    SSL_CERT_FILE: state.caBundlePath,
    NODE_EXTRA_CA_CERTS: state.caBundlePath,
    REQUESTS_CA_BUNDLE: state.caBundlePath,
    CURL_CA_BUNDLE: state.caBundlePath,
  }
}

/** Test-only: reset module state between test cases. */
// resetUpstreamProxyForTests 封装upstreamproxy的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetUpstreamProxyForTests(): void {
  // 状态更新为 `{ enabled: false }`，确保upstreamproxy后续读取最新状态。
  state = { enabled: false }
}

// readToken 封装upstreamproxy的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readToken(path: string): Promise<string | null> {
  // 保护这一段可能失败的upstreamproxy操作，确保异常能进入相邻错误处理。
  try {
    // 原始文本读取`readFile`，供upstreamproxy后续处理使用。
    const raw = await readFile(path, 'utf8')
    // 返回 `raw.trim() || null`，作为upstreamproxy这次计算的结果。
    return raw.trim() || null
  } catch (err) {
    // 满足 `isENOENT(err)` 时，upstreamproxy执行该分支。
    if (isENOENT(err)) return null
    // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[upstreamproxy] token read failed: ${err instanceof Error ? err.message : String(err)}`,
      { level: 'warn' },
    )
    // 返回 `null`，作为upstreamproxy这次计算的结果。
    return null
  }
}

/**
 * prctl(PR_SET_DUMPABLE, 0) via libc FFI. Blocks same-UID ptrace of this
 * process, so a prompt-injected `gdb -p $PPID` can't scrape the token from
 * the heap. Linux-only; silently no-ops elsewhere.
 */
// setNonDumpable 封装upstreamproxy的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function setNonDumpable(): void {
  // 当 `process.platform !== 'linux' || typeof Bun` 匹配 `'undefined'` 时，upstreamproxy执行对应分支。
  if (process.platform !== 'linux' || typeof Bun === 'undefined') return
  // 保护这一段可能失败的upstreamproxy操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // ffi保存`require`，供upstreamproxy后续处理使用。
    const ffi = require('bun:ffi') as typeof import('bun:ffi')
    // lib保存`ffi.dlopen`，供upstreamproxy后续处理使用。
    const lib = ffi.dlopen('libc.so.6', {
      prctl: {
        args: ['int', 'u64', 'u64', 'u64', 'u64'],
        returns: 'int',
      },
    } as const)
    // PR_SET_DUMPABLE 命名 `4`，让后续代码直接表达这个值的用途。
    const PR_SET_DUMPABLE = 4
    // rc保存`symbols.prctl`，供upstreamproxy后续处理使用。
    const rc = lib.symbols.prctl(PR_SET_DUMPABLE, 0n, 0n, 0n, 0n)
    // `rc` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (rc !== 0) {
      // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[upstreamproxy] prctl(PR_SET_DUMPABLE,0) returned nonzero',
        {
          level: 'warn',
        },
      )
    }
  } catch (err) {
    // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[upstreamproxy] prctl unavailable: ${err instanceof Error ? err.message : String(err)}`,
      { level: 'warn' },
    )
  }
}

// downloadCaBundle 封装upstreamproxy的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function downloadCaBundle(
  baseUrl: string,
  systemCaPath: string,
  outPath: string,
): Promise<boolean> {
  // 保护这一段可能失败的upstreamproxy操作，确保异常能进入相邻错误处理。
  try {
    // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
    // resp读取`fetch`，供upstreamproxy后续处理使用。
    const resp = await fetch(`${baseUrl}/v1/code/upstreamproxy/ca-cert`, {
      // Bun has no default fetch timeout — a hung endpoint would block CLI
      // startup forever. 5s is generous for a small PEM.
      signal: AbortSignal.timeout(5000),
    })
    // resp.ok缺失时提前走兜底路径，避免upstreamproxy继续依赖无效输入。
    if (!resp.ok) {
      // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[upstreamproxy] ca-cert fetch ${resp.status}; proxy disabled`,
        { level: 'warn' },
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // ccrCa保存`resp.text`，供upstreamproxy后续处理使用。
    const ccrCa = await resp.text()
    // systemCa读取`readFile`，供upstreamproxy后续处理使用。
    const systemCa = await readFile(systemCaPath, 'utf8').catch(() => '')
    // 等待 `mkdir(join(outPath, '..'), { recursive: true })` 完成，再继续upstreamproxy的异步流程。
    await mkdir(join(outPath, '..'), { recursive: true })
    // 等待 `writeFile(outPath, systemCa + '\n' + ccrCa, 'utf8')` 完成，再继续upstreamproxy的异步流程。
    await writeFile(outPath, systemCa + '\n' + ccrCa, 'utf8')
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (err) {
    // 记录upstreamproxy运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[upstreamproxy] ca-cert download failed: ${err instanceof Error ? err.message : String(err)}; proxy disabled`,
      { level: 'warn' },
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}
