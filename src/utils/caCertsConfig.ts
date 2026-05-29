/**
 * Config/settings-backed NODE_EXTRA_CA_CERTS population for `caCerts.ts`.
 *
 * Split from `caCerts.ts` because `config.ts` → `file.ts` →
 * `permissions/filesystem.ts` → `commands.ts` transitively pulls in ~5300
 * modules (REPL, React, every slash command). `proxy.ts`/`mtls.ts` (and
 * therefore anything using HTTPS through our proxy agent — WebSocketTransport,
 * CCRClient, telemetry) must NOT depend on that graph, or the Agent SDK
 * bundle (`connectRemoteControl` path) bloats from ~0.4 MB to ~10.8 MB.
 *
 * `getCACertificates()` only reads `process.env.NODE_EXTRA_CA_CERTS`. This
 * module is the one place allowed to import `config.ts` to *populate* that
 * env var at CLI startup. Only `init.ts` imports this file.
 */

// 引入 getGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from './config.js'
// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 getSettingsForSource，将 ./settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettingsForSource } from './settings/settings.js'

/**
 * Apply NODE_EXTRA_CA_CERTS from settings.json to process.env early in init,
 * BEFORE any TLS connections are made.
 *
 * Bun caches the TLS certificate store at process boot via BoringSSL.
 * If NODE_EXTRA_CA_CERTS isn't set in the environment at boot, Bun won't
 * include the custom CA cert. By setting it on process.env before any
 * TLS connections, we give Bun a chance to pick it up (if the cert store
 * is lazy-initialized) and ensure Node.js compatibility.
 *
 * This is safe to call before the trust dialog because we only read from
 * user-controlled files (~/.claude/settings.json and ~/.claude.json),
 * not from project-level settings.
 */
// applyExtraCACertsFromConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyExtraCACertsFromConfig(): void {
  // 满足 `process.env.NODE_EXTRA_CA_CERTS` 时，共享工具执行该分支。
  if (process.env.NODE_EXTRA_CA_CERTS) {
    // 返回 `// Already set in environment, nothing to do`，作为共享工具这次计算的结果。
    return // Already set in environment, nothing to do
  }
  // configPath 路径数据读取`getExtraCertsPathFromConfig`，供共享工具后续处理使用。
  const configPath = getExtraCertsPathFromConfig()
  // 满足 `configPath` 时，共享工具执行该分支。
  if (configPath) {
    // NODE_EXTRA_CA_CERTS 集合更新为 `configPath`，确保共享工具后续读取最新状态。
    process.env.NODE_EXTRA_CA_CERTS = configPath
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `CA certs: Applied NODE_EXTRA_CA_CERTS from config to process.env: ${configPath}`,
    )
  }
}

/**
 * Read NODE_EXTRA_CA_CERTS from settings/config as a fallback.
 *
 * NODE_EXTRA_CA_CERTS is categorized as a non-safe env var (it allows
 * trusting attacker-controlled servers), so it's only applied to process.env
 * after the trust dialog. But we need the CA cert early to establish the TLS
 * connection to an HTTPS proxy during init().
 *
 * We read from global config (~/.claude.json) and user settings
 * (~/.claude/settings.json). These are user-controlled files that don't
 * require trust approval.
 */
// getExtraCertsPathFromConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getExtraCertsPathFromConfig(): string | undefined {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // globalConfig 配置读取`getGlobalConfig`，供共享工具后续处理使用。
    const globalConfig = getGlobalConfig()
    // globalEnv保存`globalConfig?.env`，供后续判断或组装使用。
    const globalEnv = globalConfig?.env
    // Only read from user-controlled settings (~/.claude/settings.json),
    // not project-level settings, to prevent malicious projects from
    // injecting CA certs before the trust dialog.
    // settings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
    const settings = getSettingsForSource('userSettings')
    // settingsEnv 命名 `settings?.env`，让后续代码直接表达这个值的用途。
    const settingsEnv = settings?.env

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `CA certs: Config fallback - globalEnv keys: ${globalEnv ? Object.keys(globalEnv).join(',') : 'none'}, settingsEnv keys: ${settingsEnv ? Object.keys(settingsEnv).join(',') : 'none'}`,
    )

    // Settings override global config (same precedence as applyConfigEnvironmentVariables)
    // path 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const path =
      settingsEnv?.NODE_EXTRA_CA_CERTS || globalEnv?.NODE_EXTRA_CA_CERTS
    // 满足 `path` 时，共享工具执行该分支。
    if (path) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `CA certs: Found NODE_EXTRA_CA_CERTS in config/settings: ${path}`,
      )
    }
    // 返回 `path`，作为共享工具这次计算的结果。
    return path
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`CA certs: Config fallback failed: ${error}`, {
      level: 'error',
    })
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
}
