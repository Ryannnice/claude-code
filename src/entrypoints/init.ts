// 复用 profileCheckpoint 工具函数，把通用处理留在 ../utils/startupProfiler.js 中维护。
import { profileCheckpoint } from '../utils/startupProfiler.js'
// 加载 ../bootstrap/state.js 的模块副作用，确保init启动前完成必要初始化。
import '../bootstrap/state.js'
// 加载 ../utils/config.js 的模块副作用，确保init启动前完成必要初始化。
import '../utils/config.js'
// 类型依赖 { Attributes, MetricOptions } 来自 @opentelemetry/api，用于校准init的数据契约。
import type { Attributes, MetricOptions } from '@opentelemetry/api'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 getIsNonInteractiveSession，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from 'src/bootstrap/state.js'
// 类型依赖 { AttributedCounter } 来自 ../bootstrap/state.js，用于校准init的数据契约。
import type { AttributedCounter } from '../bootstrap/state.js'
// 引入 getSessionCounter、setMeter，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionCounter, setMeter } from '../bootstrap/state.js'
// 接入 shutdownLspServerManager 服务层能力，把外部通信或共享状态交给 ../services/lsp/manager.js 处理。
import { shutdownLspServerManager } from '../services/lsp/manager.js'
// 接入 populateOAuthAccountInfoIfNeeded 服务层能力，把外部通信或共享状态交给 ../services/oauth/client.js 处理。
import { populateOAuthAccountInfoIfNeeded } from '../services/oauth/client.js'
// 整理这一组导入，让init后续逻辑可以直接复用这些外部能力。
import {
  initializePolicyLimitsLoadingPromise,
  isPolicyLimitsEligible,
} from '../services/policyLimits/index.js'
// 整理这一组导入，让init后续逻辑可以直接复用这些外部能力。
import {
  initializeRemoteManagedSettingsLoadingPromise,
  isEligibleForRemoteManagedSettings,
  waitForRemoteManagedSettingsToLoad,
} from '../services/remoteManagedSettings/index.js'
// 复用 preconnectAnthropicApi 工具函数，把通用处理留在 ../utils/apiPreconnect.js 中维护。
import { preconnectAnthropicApi } from '../utils/apiPreconnect.js'
// 复用 applyExtraCACertsFromConfig 工具函数，把通用处理留在 ../utils/caCertsConfig.js 中维护。
import { applyExtraCACertsFromConfig } from '../utils/caCertsConfig.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../utils/cleanupRegistry.js'
// 复用 enableConfigs、recordFirstStartTime 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { enableConfigs, recordFirstStartTime } from '../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 detectCurrentRepository 工具函数，把通用处理留在 ../utils/detectRepository.js 中维护。
import { detectCurrentRepository } from '../utils/detectRepository.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../utils/diagLogs.js'
// 复用 initJetBrainsDetection 工具函数，把通用处理留在 ../utils/envDynamic.js 中维护。
import { initJetBrainsDetection } from '../utils/envDynamic.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../utils/envUtils.js'
// 复用 ConfigParseError、errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { ConfigParseError, errorMessage } from '../utils/errors.js'
// showInvalidConfigDialog is dynamically imported in the error path to avoid loading React at init
// 整理这一组导入，让init后续逻辑可以直接复用这些外部能力。
import {
  gracefulShutdownSync,
  setupGracefulShutdown,
} from '../utils/gracefulShutdown.js'
// 整理这一组导入，让init后续逻辑可以直接复用这些外部能力。
import {
  applyConfigEnvironmentVariables,
  applySafeConfigEnvironmentVariables,
} from '../utils/managedEnv.js'
// 复用 configureGlobalMTLS 工具函数，把通用处理留在 ../utils/mtls.js 中维护。
import { configureGlobalMTLS } from '../utils/mtls.js'
// 整理这一组导入，让init后续逻辑可以直接复用这些外部能力。
import {
  ensureScratchpadDir,
  isScratchpadEnabled,
} from '../utils/permissions/filesystem.js'
// initializeTelemetry is loaded lazily via import() in setMeterState() to defer
// ~400KB of OpenTelemetry + protobuf modules until telemetry is actually initialized.
// gRPC exporters (~700KB via @grpc/grpc-js) are further lazy-loaded within instrumentation.ts.
// 复用 configureGlobalAgents 工具函数，把通用处理留在 ../utils/proxy.js 中维护。
import { configureGlobalAgents } from '../utils/proxy.js'
// 复用 isBetaTracingEnabled 工具函数，把通用处理留在 ../utils/telemetry/betaSessionTracing.js 中维护。
import { isBetaTracingEnabled } from '../utils/telemetry/betaSessionTracing.js'
// 复用 getTelemetryAttributes 工具函数，把通用处理留在 ../utils/telemetryAttributes.js 中维护。
import { getTelemetryAttributes } from '../utils/telemetryAttributes.js'
// 复用 setShellIfWindows 工具函数，把通用处理留在 ../utils/windowsPaths.js 中维护。
import { setShellIfWindows } from '../utils/windowsPaths.js'

// initialize1PEventLogging is dynamically imported to defer OpenTelemetry sdk-logs/resources

// Track if telemetry has been initialized to prevent double initialization
// telemetryInitialized标记init是否启用对应路径。
let telemetryInitialized = false

// init保存`memoize`，供init后续处理使用。
export const init = memoize(async (): Promise<void> => {
  // initStartTime记录时间`Date.now`，供init后续处理使用。
  const initStartTime = Date.now()
  // 调用 logForDiagnosticsNoPII，触发init此处需要的副作用。
  logForDiagnosticsNoPII('info', 'init_started')
  // 调用 profileCheckpoint，触发init此处需要的副作用。
  profileCheckpoint('init_function_start')

  // Validate configs are valid and enable configuration system
  // 保护这一段可能失败的init操作，确保异常能进入相邻错误处理。
  try {
    // configsStart 配置记录时间`Date.now`，供init后续处理使用。
    const configsStart = Date.now()
    // 调用 enableConfigs，触发init此处需要的副作用。
    enableConfigs()
    // 调用 logForDiagnosticsNoPII，触发init此处需要的副作用。
    logForDiagnosticsNoPII('info', 'init_configs_enabled', {
      duration_ms: Date.now() - configsStart,
    })
    // 调用 profileCheckpoint，触发init此处需要的副作用。
    profileCheckpoint('init_configs_enabled')

    // Apply only safe environment variables before trust dialog
    // Full environment variables are applied after trust is established
    // envVarsStart记录时间`Date.now`，供init后续处理使用。
    const envVarsStart = Date.now()
    // 调用 applySafeConfigEnvironmentVariables，触发init此处需要的副作用。
    applySafeConfigEnvironmentVariables()

    // Apply NODE_EXTRA_CA_CERTS from settings.json to process.env early,
    // before any TLS connections. Bun caches the TLS cert store at boot
    // via BoringSSL, so this must happen before the first TLS handshake.
    // 调用 applyExtraCACertsFromConfig，触发init此处需要的副作用。
    applyExtraCACertsFromConfig()

    // 调用 logForDiagnosticsNoPII，触发init此处需要的副作用。
    logForDiagnosticsNoPII('info', 'init_safe_env_vars_applied', {
      duration_ms: Date.now() - envVarsStart,
    })
    // 调用 profileCheckpoint，触发init此处需要的副作用。
    profileCheckpoint('init_safe_env_vars_applied')

    // Make sure things get flushed on exit
    // 调用 setupGracefulShutdown，触发init此处需要的副作用。
    setupGracefulShutdown()
    // 调用 profileCheckpoint，触发init此处需要的副作用。
    profileCheckpoint('init_after_graceful_shutdown')

    // Initialize 1P event logging (no security concerns, but deferred to avoid
    // loading OpenTelemetry sdk-logs at startup). growthbook.js is already in
    // the module cache by this point (firstPartyEventLogger imports it), so the
    // second dynamic import adds no load cost.
    // 显式忽略 `Promise.all([` 的返回值，只保留它触发的副作用。
    void Promise.all([
      import('../services/analytics/firstPartyEventLogger.js'),
      import('../services/analytics/growthbook.js'),
    // 这个回调绑定到 ]).then(([fp, gb]) => {，负责init在该局部场景下的响应。
    ]).then(([fp, gb]) => {
      // 调用 fp.initialize1PEventLogging，触发init此处需要的副作用。
      fp.initialize1PEventLogging()
      // Rebuild the logger provider if tengu_1p_event_batch_config changes
      // mid-session. Change detection (isEqual) is inside the handler so
      // unchanged refreshes are no-ops.
      // 调用 gb.onGrowthBookRefresh，触发init此处需要的副作用。
      gb.onGrowthBookRefresh(() => {
        // 显式忽略 `fp.reinitialize1PEventLoggingIfConfigChanged()` 的返回值，只保留它触发的副作用。
        void fp.reinitialize1PEventLoggingIfConfigChanged()
      })
    })
    // 调用 profileCheckpoint，触发init此处需要的副作用。
    profileCheckpoint('init_after_1p_event_logging')

    // Populate OAuth account info if it is not already cached in config. This is needed since the
    // OAuth account info may not be populated when logging in through the VSCode extension.
    // 显式忽略 `populateOAuthAccountInfoIfNeeded()` 的返回值，只保留它触发的副作用。
    void populateOAuthAccountInfoIfNeeded()
    // 调用 profileCheckpoint，触发init此处需要的副作用。
    profileCheckpoint('init_after_oauth_populate')

    // Initialize JetBrains IDE detection asynchronously (populates cache for later sync access)
    // 显式忽略 `initJetBrainsDetection()` 的返回值，只保留它触发的副作用。
    void initJetBrainsDetection()
    // 调用 profileCheckpoint，触发init此处需要的副作用。
    profileCheckpoint('init_after_jetbrains_detection')

    // Detect GitHub repository asynchronously (populates cache for gitDiff PR linking)
    // 显式忽略 `detectCurrentRepository()` 的返回值，只保留它触发的副作用。
    void detectCurrentRepository()

    // Initialize the loading promise early so that other systems (like plugin hooks)
    // can await remote settings loading. The promise includes a timeout to prevent
    // deadlocks if loadRemoteManagedSettings() is never called (e.g., Agent SDK tests).
    // 满足 `isEligibleForRemoteManagedSettings()` 时，init执行该分支。
    if (isEligibleForRemoteManagedSettings()) {
      // 调用 initializeRemoteManagedSettingsLoadingPromise，触发init此处需要的副作用。
      initializeRemoteManagedSettingsLoadingPromise()
    }
    // 满足 `isPolicyLimitsEligible()` 时，init执行该分支。
    if (isPolicyLimitsEligible()) {
      // 调用 initializePolicyLimitsLoadingPromise，触发init此处需要的副作用。
      initializePolicyLimitsLoadingPromise()
    }
    // 调用 profileCheckpoint，触发init此处需要的副作用。
    profileCheckpoint('init_after_remote_settings_check')

    // Record the first start time
    // 调用 recordFirstStartTime，触发init此处需要的副作用。
    recordFirstStartTime()

    // Configure global mTLS settings
    // mtlsStart记录时间`Date.now`，供init后续处理使用。
    const mtlsStart = Date.now()
    // 记录init运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[init] configureGlobalMTLS starting')
    // 调用 configureGlobalMTLS，触发init此处需要的副作用。
    configureGlobalMTLS()
    // 调用 logForDiagnosticsNoPII，触发init此处需要的副作用。
    logForDiagnosticsNoPII('info', 'init_mtls_configured', {
      duration_ms: Date.now() - mtlsStart,
    })
    // 记录init运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[init] configureGlobalMTLS complete')

    // Configure global HTTP agents (proxy and/or mTLS)
    // proxyStart记录时间`Date.now`，供init后续处理使用。
    const proxyStart = Date.now()
    // 记录init运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[init] configureGlobalAgents starting')
    // 调用 configureGlobalAgents，触发init此处需要的副作用。
    configureGlobalAgents()
    // 调用 logForDiagnosticsNoPII，触发init此处需要的副作用。
    logForDiagnosticsNoPII('info', 'init_proxy_configured', {
      duration_ms: Date.now() - proxyStart,
    })
    // 记录init运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[init] configureGlobalAgents complete')
    // 调用 profileCheckpoint，触发init此处需要的副作用。
    profileCheckpoint('init_network_configured')

    // Preconnect to the Anthropic API — overlap TCP+TLS handshake
    // (~100-200ms) with the ~100ms of action-handler work before the API
    // request. After CA certs + proxy agents are configured so the warmed
    // connection uses the right transport. Fire-and-forget; skipped for
    // proxy/mTLS/unix/cloud-provider where the SDK's dispatcher wouldn't
    // reuse the global pool.
    // 调用 preconnectAnthropicApi，触发init此处需要的副作用。
    preconnectAnthropicApi()

    // CCR upstreamproxy: start the local CONNECT relay so agent subprocesses
    // can reach org-configured upstreams with credential injection. Gated on
    // CLAUDE_CODE_REMOTE + GrowthBook; fail-open on any error. Lazy import so
    // non-CCR startups don't pay the module load. The getUpstreamProxyEnv
    // function is registered with subprocessEnv.ts so subprocess spawning can
    // inject proxy vars without a static import of the upstreamproxy module.
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)` 时，init执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
      // 保护这一段可能失败的init操作，确保异常能进入相邻错误处理。
      try {
        // 从 `await import(` 解构 initUpstreamProxy、getUpstreamProxyEnv，减少init对同一对象的重复访问。
        const { initUpstreamProxy, getUpstreamProxyEnv } = await import(
          '../upstreamproxy/upstreamproxy.js'
        )
        // 从 `await import(` 解构 registerUpstreamProxyEnvFn，减少init对同一对象的重复访问。
        const { registerUpstreamProxyEnvFn } = await import(
          '../utils/subprocessEnv.js'
        )
        // 调用 registerUpstreamProxyEnvFn，触发init此处需要的副作用。
        registerUpstreamProxyEnvFn(getUpstreamProxyEnv)
        // 等待 `initUpstreamProxy()` 完成，再继续init的异步流程。
        await initUpstreamProxy()
      } catch (err) {
        // 记录init运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[init] upstreamproxy init failed: ${err instanceof Error ? err.message : String(err)}; continuing without proxy`,
          { level: 'warn' },
        )
      }
    }

    // Set up git-bash if relevant
    // setShellIfWindows 写入新的状态值，使init后续读取保持一致。
    setShellIfWindows()

    // Register LSP manager cleanup (initialization happens in main.tsx after --plugin-dir is processed)
    // 调用 registerCleanup，触发init此处需要的副作用。
    registerCleanup(shutdownLspServerManager)

    // gh-32730: teams created by subagents (or main agent without
    // explicit TeamDelete) were left on disk forever. Register cleanup
    // for all teams created this session. Lazy import: swarm code is
    // behind feature gate and most sessions never create teams.
    // 调用 registerCleanup，触发init此处需要的副作用。
    registerCleanup(async () => {
      // 从 `await import(` 解构 cleanupSessionTeams，减少init对同一对象的重复访问。
      const { cleanupSessionTeams } = await import(
        '../utils/swarm/teamHelpers.js'
      )
      // 等待 `cleanupSessionTeams()` 完成，再继续init的异步流程。
      await cleanupSessionTeams()
    })

    // Initialize scratchpad directory if enabled
    // 满足 `isScratchpadEnabled()` 时，init执行该分支。
    if (isScratchpadEnabled()) {
      // scratchpadStart记录时间`Date.now`，供init后续处理使用。
      const scratchpadStart = Date.now()
      // 等待 `ensureScratchpadDir()` 完成，再继续init的异步流程。
      await ensureScratchpadDir()
      // 调用 logForDiagnosticsNoPII，触发init此处需要的副作用。
      logForDiagnosticsNoPII('info', 'init_scratchpad_created', {
        duration_ms: Date.now() - scratchpadStart,
      })
    }

    // 调用 logForDiagnosticsNoPII，触发init此处需要的副作用。
    logForDiagnosticsNoPII('info', 'init_completed', {
      duration_ms: Date.now() - initStartTime,
    })
    // 调用 profileCheckpoint，触发init此处需要的副作用。
    profileCheckpoint('init_function_end')
  } catch (error) {
    // 满足 `error instanceof ConfigParseError` 时，init执行该分支。
    if (error instanceof ConfigParseError) {
      // Skip the interactive Ink dialog when we can't safely render it.
      // The dialog breaks JSON consumers (e.g. desktop marketplace plugin
      // manager running `plugin marketplace list --json` in a VM sandbox).
      // 满足 `getIsNonInteractiveSession()` 时，init执行该分支。
      if (getIsNonInteractiveSession()) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(
          `Configuration error in ${error.filePath}: ${error.message}\n`,
        )
        // 调用 gracefulShutdownSync，触发init此处需要的副作用。
        gracefulShutdownSync(1)
        // init在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Show the invalid config dialog with the error object and wait for it to complete
      // 返回 `import('../components/InvalidConfigDialog.js').then(m =>`，作为init这次计算的结果。
      return import('../components/InvalidConfigDialog.js').then(m =>
        m.showInvalidConfigDialog({ error }),
      )
      // Dialog itself handles process.exit, so we don't need additional cleanup here
    } else {
      // For non-config errors, rethrow them
      // 抛出 error，阻止init在无效状态下继续运行。
      throw error
    }
  }
})

/**
 * Initialize telemetry after trust has been granted.
 * For remote-settings-eligible users, waits for settings to load (non-blocking),
 * then re-applies env vars (to include remote settings) before initializing telemetry.
 * For non-eligible users, initializes telemetry immediately.
 * This should only be called once, after the trust dialog has been accepted.
 */
// initializeTelemetryAfterTrust 封装init的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeTelemetryAfterTrust(): void {
  // 满足 `isEligibleForRemoteManagedSettings()` 时，init执行该分支。
  if (isEligibleForRemoteManagedSettings()) {
    // For SDK/headless mode with beta tracing, initialize eagerly first
    // to ensure the tracer is ready before the first query runs.
    // The async path below will still run but doInitializeTelemetry() guards against double init.
    // 组合条件 `getIsNonInteractiveSession() && isBetaTracingEnabled()` 成立时，init才启用这条专门路径。
    if (getIsNonInteractiveSession() && isBetaTracingEnabled()) {
      // 这个回调绑定到 void doInitializeTelemetry().catch(error => {，负责init在该局部场景下的响应。
      void doInitializeTelemetry().catch(error => {
        // 记录init运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[3P telemetry] Eager telemetry init failed (beta tracing): ${errorMessage(error)}`,
          { level: 'error' },
        )
      })
    }
    // 记录init运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[3P telemetry] Waiting for remote managed settings before telemetry init',
    )
    // 显式忽略 `waitForRemoteManagedSettingsToLoad()` 的返回值，只保留它触发的副作用。
    void waitForRemoteManagedSettingsToLoad()
      // 链式调用 then，继续加工上一行在init中产生的数据。
      .then(async () => {
        // 记录init运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[3P telemetry] Remote managed settings loaded, initializing telemetry',
        )
        // Re-apply env vars to pick up remote settings before initializing telemetry.
        // 调用 applyConfigEnvironmentVariables，触发init此处需要的副作用。
        applyConfigEnvironmentVariables()
        // 等待 `doInitializeTelemetry()` 完成，再继续init的异步流程。
        await doInitializeTelemetry()
      })
      // 链式调用 catch，继续加工上一行在init中产生的数据。
      .catch(error => {
        // 记录init运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[3P telemetry] Telemetry init failed (remote settings path): ${errorMessage(error)}`,
          { level: 'error' },
        )
      })
  } else {
    // 这个回调绑定到 void doInitializeTelemetry().catch(error => {，负责init在该局部场景下的响应。
    void doInitializeTelemetry().catch(error => {
      // 记录init运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[3P telemetry] Telemetry init failed: ${errorMessage(error)}`,
        { level: 'error' },
      )
    })
  }
}

// doInitializeTelemetry 封装init的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function doInitializeTelemetry(): Promise<void> {
  // 满足 `telemetryInitialized` 时，init执行该分支。
  if (telemetryInitialized) {
    // Already initialized, nothing to do
    // init在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Set flag before init to prevent double initialization
  // telemetryInitialized更新为 `true`，确保init后续读取最新状态。
  telemetryInitialized = true
  // 保护这一段可能失败的init操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `setMeterState()` 完成，再继续init的异步流程。
    await setMeterState()
  } catch (error) {
    // Reset flag on failure so subsequent calls can retry
    // telemetryInitialized更新为 `false`，确保init后续读取最新状态。
    telemetryInitialized = false
    // 抛出 error，阻止init在无效状态下继续运行。
    throw error
  }
}

// setMeterState 封装init的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function setMeterState(): Promise<void> {
  // Lazy-load instrumentation to defer ~400KB of OpenTelemetry + protobuf
  // 从 `await import(` 解构 initializeTelemetry，减少init对同一对象的重复访问。
  const { initializeTelemetry } = await import(
    '../utils/telemetry/instrumentation.js'
  )
  // Initialize customer OTLP telemetry (metrics, logs, traces)
  // meter保存`initializeTelemetry`，供init后续处理使用。
  const meter = await initializeTelemetry()
  // 满足 `meter` 时，init执行该分支。
  if (meter) {
    // Create factory function for attributed counters
    // createAttributedCounter 数量保存`(`，供后续判断或组装使用。
    const createAttributedCounter = (
      name: string,
      options: MetricOptions,
    ): AttributedCounter => {
      // counter 数量构建`createCounter`，供init后续处理使用。
      const counter = meter?.createCounter(name, options)

      // 返回结构化结果，集中表达init已经整理出的状态。
      return {
        // add 使用 value: number, additionalAttributes: Attributes =… 完成init里的对应操作。
        add(value: number, additionalAttributes: Attributes = {}) {
          // Always fetch fresh telemetry attributes to ensure they're up to date
          // currentAttributes 集合读取`getTelemetryAttributes`，供init后续处理使用。
          const currentAttributes = getTelemetryAttributes()
          // mergedAttributes 集合 集中保存init要一起传递的字段。
          const mergedAttributes = {
            ...currentAttributes,
            ...additionalAttributes,
          }
          // 调用 counter?.add(value, mergedAttributes)，完成这一处局部操作。
          counter?.add(value, mergedAttributes)
        },
      }
    }

    // setMeter 写入新的状态值，使init后续读取保持一致。
    setMeter(meter, createAttributedCounter)

    // Increment session counter here because the startup telemetry path
    // runs before this async initialization completes, so the counter
    // would be null there.
    // 调用 getSessionCounter，触发init此处需要的副作用。
    getSessionCounter()?.add(1)
  }
}
