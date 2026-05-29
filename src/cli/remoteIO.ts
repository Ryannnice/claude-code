// 类型依赖 { StdoutMessage } 来自 src/entrypoints/sdk/controlTypes.js，用于校准remote IO的数据契约。
import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'
// 引入 PassThrough，将 stream 中已经封装好的能力接到本文件流程里。
import { PassThrough } from 'stream'
// 引入 URL，将 url 中已经封装好的能力接到本文件流程里。
import { URL } from 'url'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 引入 getPollIntervalConfig，将 ../bridge/pollConfig.js 中已经封装好的能力接到本文件流程里。
import { getPollIntervalConfig } from '../bridge/pollConfig.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../utils/cleanupRegistry.js'
// 复用 setCommandLifecycleListener 工具函数，把通用处理留在 ../utils/commandLifecycle.js 中维护。
import { setCommandLifecycleListener } from '../utils/commandLifecycle.js'
// 复用 isDebugMode、logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { isDebugMode, logForDebugging } from '../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../utils/diagLogs.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../utils/envUtils.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 gracefulShutdown 工具函数，把通用处理留在 ../utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from '../utils/gracefulShutdown.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 writeToStdout 工具函数，把通用处理留在 ../utils/process.js 中维护。
import { writeToStdout } from '../utils/process.js'
// 复用 getSessionIngressAuthToken 工具函数，把通用处理留在 ../utils/sessionIngressAuth.js 中维护。
import { getSessionIngressAuthToken } from '../utils/sessionIngressAuth.js'
// 整理这一组导入，让remote IO后续逻辑可以直接复用这些外部能力。
import {
  setSessionMetadataChangedListener,
  setSessionStateChangedListener,
} from '../utils/sessionState.js'
// 整理这一组导入，让remote IO后续逻辑可以直接复用这些外部能力。
import {
  setInternalEventReader,
  setInternalEventWriter,
} from '../utils/sessionStorage.js'
// 引入 ndjsonSafeStringify，将 ./ndjsonSafeStringify.js 中已经封装好的能力接到本文件流程里。
import { ndjsonSafeStringify } from './ndjsonSafeStringify.js'
// 引入 StructuredIO，将 ./structuredIO.js 中已经封装好的能力接到本文件流程里。
import { StructuredIO } from './structuredIO.js'
// 引入 CCRClient、CCRInitError，将 ./transports/ccrClient.js 中已经封装好的能力接到本文件流程里。
import { CCRClient, CCRInitError } from './transports/ccrClient.js'
// 引入 SSETransport，将 ./transports/SSETransport.js 中已经封装好的能力接到本文件流程里。
import { SSETransport } from './transports/SSETransport.js'
// 类型依赖 { Transport } 来自 ./transports/Transport.js，用于校准remote IO的数据契约。
import type { Transport } from './transports/Transport.js'
// 引入 getTransportForUrl，将 ./transports/transportUtils.js 中已经封装好的能力接到本文件流程里。
import { getTransportForUrl } from './transports/transportUtils.js'

/**
 * Bidirectional streaming for SDK mode with session tracking
 * Supports WebSocket transport
 */
// RemoteIO 聚合remote IO相关状态与操作，把同一职责的行为收束到类实例中。
export class RemoteIO extends StructuredIO {
  private url: URL
  private transport: Transport
  private inputStream: PassThrough
  private readonly isBridge: boolean = false
  private readonly isDebug: boolean = false
  private ccrClient: CCRClient | null = null
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null

  // 构造函数初始化实例状态，确保remote IO后续方法读取到完整配置。
  constructor(
    streamUrl: string,
    initialPrompt?: AsyncIterable<string>,
    replayUserMessages?: boolean,
  ) {
    // inputStream保存`PassThrough`，供remote IO后续处理使用。
    const inputStream = new PassThrough({ encoding: 'utf8' })
    // 调用 super，触发remote IO此处需要的副作用。
    super(inputStream, replayUserMessages)
    // 更新实例字段 inputStream 为 inputStream，同步remote IO的内部状态。
    this.inputStream = inputStream
    // 更新实例字段 url 为 new URL(streamUrl)，同步remote IO的内部状态。
    this.url = new URL(streamUrl)

    // Prepare headers with session token if available
    // 请求头 从空对象开始收集键值，后续按名称补齐内容。
    const headers: Record<string, string> = {}
    // sessionToken 会话数据读取`getSessionIngressAuthToken`，供remote IO后续处理使用。
    const sessionToken = getSessionIngressAuthToken()
    // 满足 `sessionToken` 时，remote IO执行该分支。
    if (sessionToken) {
      // headers['Authorization'更新为 ``Bearer ${sessionToken}``，确保remote IO后续读取最新状态。
      headers['Authorization'] = `Bearer ${sessionToken}`
    } else {
      // 记录remote IO运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[remote-io] No session ingress token available', {
        level: 'error',
      })
    }

    // Add environment runner version if available (set by Environment Manager)
    // erVersion 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const erVersion = process.env.CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION
    // 满足 `erVersion` 时，remote IO执行该分支。
    if (erVersion) {
      // headers['x-environment-runner-version'更新为 `erVersion`，确保remote IO后续读取最新状态。
      headers['x-environment-runner-version'] = erVersion
    }

    // Provide a callback that re-reads the session token dynamically.
    // When the parent process refreshes the token (via token file or env var),
    // the transport can pick it up on reconnection.
    // refreshHeaders 集合封装成回调，供remote IO在事件触发或异步步骤中调用。
    const refreshHeaders = (): Record<string, string> => {
      // h 从空对象开始收集键值，后续按名称补齐内容。
      const h: Record<string, string> = {}
      // freshToken读取`getSessionIngressAuthToken`，供remote IO后续处理使用。
      const freshToken = getSessionIngressAuthToken()
      // 满足 `freshToken` 时，remote IO执行该分支。
      if (freshToken) {
        // h['Authorization'更新为 ``Bearer ${freshToken}``，确保remote IO后续读取最新状态。
        h['Authorization'] = `Bearer ${freshToken}`
      }
      // freshErVersion 来自环境变量默认值，运行参数仍可在入口处覆盖。
      const freshErVersion = process.env.CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION
      // 满足 `freshErVersion` 时，remote IO执行该分支。
      if (freshErVersion) {
        // h['x-environment-runner-version'更新为 `freshErVersion`，确保remote IO后续读取最新状态。
        h['x-environment-runner-version'] = freshErVersion
      }
      // 返回 `h`，作为remote IO这次计算的结果。
      return h
    }

    // Get appropriate transport based on URL protocol
    // 更新实例字段 transport 为 getTransportForUrl(，同步remote IO的内部状态。
    this.transport = getTransportForUrl(
      this.url,
      headers,
      getSessionId(),
      refreshHeaders,
    )

    // Set up data callback
    // 更新实例字段 isBridge 为 process.env.CLAUDE_CODE_ENVIRONMENT_KIND === 'bridge'，同步remote IO的内部状态。
    this.isBridge = process.env.CLAUDE_CODE_ENVIRONMENT_KIND === 'bridge'
    // 更新实例字段 isDebug 为 isDebugMode()，同步remote IO的内部状态。
    this.isDebug = isDebugMode()
    // this.transport.setOnData 写入新的状态值，使remote IO后续读取保持一致。
    this.transport.setOnData((data: string) => {
      // 调用 this.inputStream.write，触发remote IO此处需要的副作用。
      this.inputStream.write(data)
      // 组合条件 `this.isBridge && this.isDebug` 成立时，remote IO才启用这条专门路径。
      if (this.isBridge && this.isDebug) {
        // 调用 writeToStdout，触发remote IO此处需要的副作用。
        writeToStdout(data.endsWith('\n') ? data : data + '\n')
      }
    })

    // Set up close callback to handle connection failures
    // this.transport.setOnClose 写入新的状态值，使remote IO后续读取保持一致。
    this.transport.setOnClose(() => {
      // End the input stream to trigger graceful shutdown
      // 调用 this.inputStream.end，触发remote IO此处需要的副作用。
      this.inputStream.end()
    })

    // Initialize CCR v2 client (heartbeats, epoch, state reporting, event writes).
    // The CCRClient constructor wires the SSE received-ack handler
    // synchronously, so new CCRClient() MUST run before transport.connect() —
    // otherwise early SSE frames hit an unwired onEventCallback and their
    // 'received' delivery acks are silently dropped.
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)` 时，remote IO执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_USE_CCR_V2)) {
      // CCR v2 is SSE+POST by definition. getTransportForUrl returns
      // SSETransport under the same env var, but the two checks live in
      // different files — assert the invariant so a future decoupling
      // fails loudly here instead of confusingly inside CCRClient.
      // 满足 `!(this.transport instanceof SSETransport)` 时，remote IO执行该分支。
      if (!(this.transport instanceof SSETransport)) {
        // 抛出 new Error(，阻止remote IO在无效状态下继续运行。
        throw new Error(
          'CCR v2 requires SSETransport; check getTransportForUrl',
        )
      }
      // 更新实例字段 ccrClient 为 new CCRClient(this.transport, this.url)，同步remote IO的内部状态。
      this.ccrClient = new CCRClient(this.transport, this.url)
      // init保存`ccrClient.initialize`，供remote IO后续处理使用。
      const init = this.ccrClient.initialize()
      // 更新实例字段 restoredWorkerState 为 init.catch(() => null)，同步remote IO的内部状态。
      this.restoredWorkerState = init.catch(() => null)
      // 调用 init.catch，触发remote IO此处需要的副作用。
      init.catch((error: unknown) => {
        // 调用 logForDiagnosticsNoPII，触发remote IO此处需要的副作用。
        logForDiagnosticsNoPII('error', 'cli_worker_lifecycle_init_failed', {
          reason: error instanceof CCRInitError ? error.reason : 'unknown',
        })
        // 记录remote IO运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(`CCRClient initialization failed: ${errorMessage(error)}`),
        )
        // 显式忽略 `gracefulShutdown(1, 'other')` 的返回值，只保留它触发的副作用。
        void gracefulShutdown(1, 'other')
      })
      // 调用 registerCleanup，触发remote IO此处需要的副作用。
      registerCleanup(async () => this.ccrClient?.close())

      // Register internal event writer for transcript persistence.
      // When set, sessionStorage writes transcript messages as CCR v2
      // internal events instead of v1 Session Ingress.
      // setInternalEventWriter 写入新的状态值，使remote IO后续读取保持一致。
      setInternalEventWriter((eventType, payload, options) =>
        this.ccrClient!.writeInternalEvent(eventType, payload, options),
      )

      // Register internal event readers for session resume.
      // When set, hydrateFromCCRv2InternalEvents() can fetch foreground
      // and subagent internal events to reconstruct conversation state.
      // setInternalEventReader 写入新的状态值，使remote IO后续读取保持一致。
      setInternalEventReader(
        // 这个回调绑定到 () => this.ccrClient!.readInternalEvents(),，负责remote IO在该局部场景下的响应。
        () => this.ccrClient!.readInternalEvents(),
        // 这个回调绑定到 () => this.ccrClient!.readSubagentInternalEvents(),，负责remote IO在该局部场景下的响应。
        () => this.ccrClient!.readSubagentInternalEvents(),
      )

      // LIFECYCLE_TO_DELIVERY 集中保存remote IO要一起传递的字段。
      const LIFECYCLE_TO_DELIVERY = {
        started: 'processing',
        completed: 'processed',
      } as const
      // setCommandLifecycleListener 写入新的状态值，使remote IO后续读取保持一致。
      setCommandLifecycleListener((uuid, state) => {
        // 调用 this.ccrClient?.reportDelivery(uuid, LIFECYCLE_TO_DELIVERY[state])，完成这一处局部操作。
        this.ccrClient?.reportDelivery(uuid, LIFECYCLE_TO_DELIVERY[state])
      })
      // setSessionStateChangedListener 写入新的状态值，使remote IO后续读取保持一致。
      setSessionStateChangedListener((state, details) => {
        // 调用 this.ccrClient?.reportState(state, details)，完成这一处局部操作。
        this.ccrClient?.reportState(state, details)
      })
      // setSessionMetadataChangedListener 写入新的状态值，使remote IO后续读取保持一致。
      setSessionMetadataChangedListener(metadata => {
        // 调用 this.ccrClient?.reportMetadata(metadata)，完成这一处局部操作。
        this.ccrClient?.reportMetadata(metadata)
      })
    }

    // Start connection only after all callbacks are wired (setOnData above,
    // setOnEvent inside new CCRClient() when CCR v2 is enabled).
    // 显式忽略 `this.transport.connect()` 的返回值，只保留它触发的副作用。
    void this.transport.connect()

    // Push a silent keep_alive frame on a fixed interval so upstream
    // proxies and the session-ingress layer don't GC an otherwise-idle
    // remote control session. The keep_alive type is filtered before
    // reaching any client UI (Query.ts drops it; structuredIO.ts drops it;
    // web/iOS/Android never see it in their message loop). Interval comes
    // from GrowthBook (tengu_bridge_poll_interval_config
    // session_keepalive_interval_v2_ms, default 120s); 0 = disabled.
    // Bridge-only: fixes Envoy idle timeout on bridge-topology sessions
    // (#21931). byoc workers ran without this before #21931 and do not
    // need it — different network path.
    // keepAliveIntervalMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const keepAliveIntervalMs =
      getPollIntervalConfig().session_keepalive_interval_v2_ms
    // 组合条件 `this.isBridge && keepAliveIntervalMs > 0` 成立时，remote IO才启用这条专门路径。
    if (this.isBridge && keepAliveIntervalMs > 0) {
      // 更新实例字段 keepAliveTimer 为 setInterval(() => {，同步remote IO的内部状态。
      this.keepAliveTimer = setInterval(() => {
        // 记录remote IO运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[remote-io] keep_alive sent')
        // 这个回调绑定到 void this.write({ type: 'keep_alive' }).catch(err => {，负责remote IO在该局部场景下的响应。
        void this.write({ type: 'keep_alive' }).catch(err => {
          // 记录remote IO运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[remote-io] keep_alive write failed: ${errorMessage(err)}`,
          )
        })
      }, keepAliveIntervalMs)
      // 调用 this.keepAliveTimer.unref?.()，完成这一处局部操作。
      this.keepAliveTimer.unref?.()
    }

    // Register for graceful shutdown cleanup
    // 调用 registerCleanup，触发remote IO此处需要的副作用。
    registerCleanup(async () => this.close())

    // If initial prompt is provided, send it through the input stream
    // 满足 `initialPrompt` 时，remote IO执行该分支。
    if (initialPrompt) {
      // Convert the initial prompt to the input stream format.
      // Chunks from stdin may already contain trailing newlines, so strip
      // them before appending our own to avoid double-newline issues that
      // cause structuredIO to parse empty lines. String() handles both
      // string chunks and Buffer objects from process.stdin.
      // stream保存`this.inputStream`，供remote IO后续判断或输出使用。
      const stream = this.inputStream
      // 调用 void，触发remote IO此处需要的副作用。
      void (async () => {
        // 逐项读取 `initialPrompt` 中的chunk，按输入顺序推进remote IO。
        for await (const chunk of initialPrompt) {
          // 调用 stream.write，触发remote IO此处需要的副作用。
          stream.write(String(chunk).replace(/\n$/, '') + '\n')
        }
      })()
    }
  }

  // remote IO在这里处理 `override flushInternalEvents(): Promise<void> {`，完成这一小步状态转换。
  override flushInternalEvents(): Promise<void> {
    // 返回 `this.ccrClient?.flushInternalEvents() ?? Promise.resolve()`，作为remote IO这次计算的结果。
    return this.ccrClient?.flushInternalEvents() ?? Promise.resolve()
  }

  // remote IO在这里处理 `override get internalEventsPending(): number {`，完成这一小步状态转换。
  override get internalEventsPending(): number {
    // 返回 `this.ccrClient?.internalEventsPending ?? 0`，作为remote IO这次计算的结果。
    return this.ccrClient?.internalEventsPending ?? 0
  }

  /**
   * Send output to the transport.
   * In bridge mode, control_request messages are always echoed to stdout so the
   * bridge parent can detect permission requests. Other messages are echoed only
   * in debug mode.
   */
  // write 使用 message: StdoutMessage 完成remote IO里的对应操作。
  async write(message: StdoutMessage): Promise<void> {
    // 满足 `this.ccrClient` 时，remote IO执行该分支。
    if (this.ccrClient) {
      // 等待 `this.ccrClient.writeEvent(message)` 完成，再继续remote IO的异步流程。
      await this.ccrClient.writeEvent(message)
    } else {
      // 等待 `this.transport.write(message)` 完成，再继续remote IO的异步流程。
      await this.transport.write(message)
    }
    // 满足 `this.isBridge` 时，remote IO执行该分支。
    if (this.isBridge) {
      // 组合条件 `message.type === 'control_request' || this.isDebug` 成立时，remote IO才启用这条专门路径。
      if (message.type === 'control_request' || this.isDebug) {
        // 调用 writeToStdout，触发remote IO此处需要的副作用。
        writeToStdout(ndjsonSafeStringify(message) + '\n')
      }
    }
  }

  /**
   * Clean up connections gracefully
   */
  // close 使用 无 完成remote IO里的对应操作。
  close(): void {
    // 满足 `this.keepAliveTimer` 时，remote IO执行该分支。
    if (this.keepAliveTimer) {
      // 调用 clearInterval，触发remote IO此处需要的副作用。
      clearInterval(this.keepAliveTimer)
      // 更新实例字段 keepAliveTimer 为 null，同步remote IO的内部状态。
      this.keepAliveTimer = null
    }
    // 调用 this.transport.close，触发remote IO此处需要的副作用。
    this.transport.close()
    // 调用 this.inputStream.end，触发remote IO此处需要的副作用。
    this.inputStream.end()
  }
}
