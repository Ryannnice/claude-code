// 引入 DiagLogLevel、diag、trace，将 @opentelemetry/api 中已经封装好的能力接到本文件流程里。
import { DiagLogLevel, diag, trace } from '@opentelemetry/api'
// 引入 logs，将 @opentelemetry/api-logs 中已经封装好的能力接到本文件流程里。
import { logs } from '@opentelemetry/api-logs'
// OTLP/Prometheus exporters are dynamically imported inside the protocol
// switch statements below. A process uses at most one protocol variant per
// signal, but static imports would load all 6 (~1.2MB) on every startup.
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  envDetector,
  hostDetector,
  osDetector,
  resourceFromAttributes,
} from '@opentelemetry/resources'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter,
  LoggerProvider,
} from '@opentelemetry/sdk-logs'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  ConsoleMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-base'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_HOST_ARCH,
} from '@opentelemetry/semantic-conventions'
// 引入 HttpsProxyAgent，将 https-proxy-agent 中已经封装好的能力接到本文件流程里。
import { HttpsProxyAgent } from 'https-proxy-agent'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getLoggerProvider,
  getMeterProvider,
  getTracerProvider,
  setEventLogger,
  setLoggerProvider,
  setMeterProvider,
  setTracerProvider,
} from 'src/bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getOtelHeadersFromHelper,
  getSubscriptionType,
  is1PApiCustomer,
  isClaudeAISubscriber,
} from 'src/utils/auth.js'
// 复用 getPlatform、getWslVersion 工具函数，把通用处理留在 src/utils/platform.js 中维护。
import { getPlatform, getWslVersion } from 'src/utils/platform.js'

// 引入 getCACertificates，将 ../caCerts.js 中已经封装好的能力接到本文件流程里。
import { getCACertificates } from '../caCerts.js'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 getHasFormattedOutput、logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { getHasFormattedOutput, logForDebugging } from '../debug.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 getMTLSConfig，将 ../mtls.js 中已经封装好的能力接到本文件流程里。
import { getMTLSConfig } from '../mtls.js'
// 引入 getProxyUrl、shouldBypassProxy，将 ../proxy.js 中已经封装好的能力接到本文件流程里。
import { getProxyUrl, shouldBypassProxy } from '../proxy.js'
// 引入 getSettings_DEPRECATED，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettings_DEPRECATED } from '../settings/settings.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 profileCheckpoint，将 ../startupProfiler.js 中已经封装好的能力接到本文件流程里。
import { profileCheckpoint } from '../startupProfiler.js'
// 引入 isBetaTracingEnabled，将 ./betaSessionTracing.js 中已经封装好的能力接到本文件流程里。
import { isBetaTracingEnabled } from './betaSessionTracing.js'
// 引入 BigQueryMetricsExporter，将 ./bigqueryExporter.js 中已经封装好的能力接到本文件流程里。
import { BigQueryMetricsExporter } from './bigqueryExporter.js'
// 引入 ClaudeCodeDiagLogger，将 ./logger.js 中已经封装好的能力接到本文件流程里。
import { ClaudeCodeDiagLogger } from './logger.js'
// 引入 initializePerfettoTracing，将 ./perfettoTracing.js 中已经封装好的能力接到本文件流程里。
import { initializePerfettoTracing } from './perfettoTracing.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  endInteractionSpan,
  isEnhancedTelemetryEnabled,
} from './sessionTracing.js'

// DEFAULT_METRICS_EXPORT_INTERVAL_MS 集合 命名 `60000`，让后续代码直接表达这个值的用途。
const DEFAULT_METRICS_EXPORT_INTERVAL_MS = 60000
// DEFAULT_LOGS_EXPORT_INTERVAL_MS 集合保存`5000`，供共享工具 instrumentation后续判断或输出使用。
const DEFAULT_LOGS_EXPORT_INTERVAL_MS = 5000
// DEFAULT_TRACES_EXPORT_INTERVAL_MS 集合保存`5000`，供共享工具 instrumentation后续判断或输出使用。
const DEFAULT_TRACES_EXPORT_INTERVAL_MS = 5000

// TelemetryTimeoutError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class TelemetryTimeoutError extends Error {}

// telemetryTimeout 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function telemetryTimeout(ms: number, message: string): Promise<never> {
  // 返回 `new Promise((_, reject) => {`，作为共享工具这次计算的结果。
  return new Promise((_, reject) => {
    // setTimeout 写入新的状态值，使共享工具后续读取保持一致。
    setTimeout(
      (rej: (e: Error) => void, msg: string) =>
        rej(new TelemetryTimeoutError(msg)),
      ms,
      reject,
      message,
    ).unref()
  })
}

// bootstrapTelemetry 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function bootstrapTelemetry() {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // Read from ANT_ prefixed variables that are defined at build time
    // 满足 `process.env.ANT_OTEL_METRICS_EXPORTER` 时，共享工具执行该分支。
    if (process.env.ANT_OTEL_METRICS_EXPORTER) {
      // OTEL_METRICS_EXPORTER更新为 `process.env.ANT_OTEL_METRICS_EXPORTER`，确保共享工具后续读取最新状态。
      process.env.OTEL_METRICS_EXPORTER = process.env.ANT_OTEL_METRICS_EXPORTER
    }
    // 满足 `process.env.ANT_OTEL_LOGS_EXPORTER` 时，共享工具执行该分支。
    if (process.env.ANT_OTEL_LOGS_EXPORTER) {
      // OTEL_LOGS_EXPORTER更新为 `process.env.ANT_OTEL_LOGS_EXPORTER`，确保共享工具后续读取最新状态。
      process.env.OTEL_LOGS_EXPORTER = process.env.ANT_OTEL_LOGS_EXPORTER
    }
    // 满足 `process.env.ANT_OTEL_TRACES_EXPORTER` 时，共享工具执行该分支。
    if (process.env.ANT_OTEL_TRACES_EXPORTER) {
      // OTEL_TRACES_EXPORTER更新为 `process.env.ANT_OTEL_TRACES_EXPORTER`，确保共享工具后续读取最新状态。
      process.env.OTEL_TRACES_EXPORTER = process.env.ANT_OTEL_TRACES_EXPORTER
    }
    // 满足 `process.env.ANT_OTEL_EXPORTER_OTLP_PROTOCOL` 时，共享工具执行该分支。
    if (process.env.ANT_OTEL_EXPORTER_OTLP_PROTOCOL) {
      // 共享工具 instrumentation在这里处理 `process.env.OTEL_EXPORTER_OTLP_PROTOCOL =`，完成这一小步状态转换。
      process.env.OTEL_EXPORTER_OTLP_PROTOCOL =
        process.env.ANT_OTEL_EXPORTER_OTLP_PROTOCOL
    }
    // 满足 `process.env.ANT_OTEL_EXPORTER_OTLP_ENDPOINT` 时，共享工具执行该分支。
    if (process.env.ANT_OTEL_EXPORTER_OTLP_ENDPOINT) {
      // 共享工具 instrumentation在这里处理 `process.env.OTEL_EXPORTER_OTLP_ENDPOINT =`，完成这一小步状态转换。
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT =
        process.env.ANT_OTEL_EXPORTER_OTLP_ENDPOINT
    }
    // 满足 `process.env.ANT_OTEL_EXPORTER_OTLP_HEADERS` 时，共享工具执行该分支。
    if (process.env.ANT_OTEL_EXPORTER_OTLP_HEADERS) {
      // 共享工具 instrumentation在这里处理 `process.env.OTEL_EXPORTER_OTLP_HEADERS =`，完成这一小步状态转换。
      process.env.OTEL_EXPORTER_OTLP_HEADERS =
        process.env.ANT_OTEL_EXPORTER_OTLP_HEADERS
    }
  }

  // Set default tempoality to 'delta' because it's the more sane default
  // process.env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALI缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!process.env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE) {
    // 更新为 `'delta'`，确保共享工具后续读取最新状态。
    process.env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE = 'delta'
  }
}

// Per OTEL spec, "none" means "no automatically configured exporter for this signal".
// https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/#exporter-selection
// parseExporterTypes 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseExporterTypes(value: string | undefined): string[] {
  // 返回 `(value || '')`，作为共享工具这次计算的结果。
  return (value || '')
    .trim()
    .split(',')
    .filter(Boolean)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map(t => t.trim())
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter(t => t !== 'none')
}

// getOtlpReaders 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getOtlpReaders() {
  // exporterTypes 集合解析`parseExporterTypes`，供共享工具后续处理使用。
  const exporterTypes = parseExporterTypes(process.env.OTEL_METRICS_EXPORTER)
  // exportInterval解析`parseInt`，供共享工具后续处理使用。
  const exportInterval = parseInt(
    process.env.OTEL_METRIC_EXPORT_INTERVAL ||
      DEFAULT_METRICS_EXPORT_INTERVAL_MS.toString(),
  )

  // exporters 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const exporters = []
  // 按顺序遍历 `exporterTypes` 中的exporterType，逐个交给共享工具处理。
  for (const exporterType of exporterTypes) {
    // 当 `exporterType` 匹配 `'console'` 时，共享工具执行对应分支。
    if (exporterType === 'console') {
      // Custom console exporter that shows resource attributes
      // consoleExporter保存`ConsoleMetricExporter`，供共享工具后续处理使用。
      const consoleExporter = new ConsoleMetricExporter()
      // originalExport保存`export.bind`，供共享工具后续处理使用。
      const originalExport = consoleExporter.export.bind(consoleExporter)

      // export更新为 `(metrics, callback) => {`，确保共享工具后续读取最新状态。
      consoleExporter.export = (metrics, callback) => {
        // Log resource attributes once at the start
        // 只有 `metrics.resource && metrics.resource.attributes` 满足时，共享工具才执行该分支。
        if (metrics.resource && metrics.resource.attributes) {
          // The console exporter is for debugging, so console output is intentional here

          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging('\n=== Resource Attributes ===')
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(jsonStringify(metrics.resource.attributes))
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging('===========================\n')
        }

        // 返回 `originalExport(metrics, callback)`，作为共享工具这次计算的结果。
        return originalExport(metrics, callback)
      }

      // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
      exporters.push(consoleExporter)
    // 共享工具 instrumentation在这里处理 `} else if (exporterType === 'otlp') {`，完成这一小步状态转换。
    } else if (exporterType === 'otlp') {
      // protocol 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const protocol =
        process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL?.trim() ||
        process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim()

      // httpConfig 配置读取`getOTLPExporterConfig`，供共享工具后续处理使用。
      const httpConfig = getOTLPExporterConfig()

      // 按照 protocol 的取值选择共享工具的具体处理分支。
      switch (protocol) {
        case 'grpc': {
          // Lazy-import to keep @grpc/grpc-js (~700KB) out of the telemetry chunk
          // when the protocol is http/protobuf (ant default) or http/json.
          // 从 `await import(` 解构 OTLPMetricExporter，减少共享工具 instrumentation对同一对象的重复访问。
          const { OTLPMetricExporter } = await import(
            '@opentelemetry/exporter-metrics-otlp-grpc'
          )
          // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
          exporters.push(new OTLPMetricExporter())
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        case 'http/json': {
          // 从 `await import(` 解构 OTLPMetricExporter，减少共享工具 instrumentation对同一对象的重复访问。
          const { OTLPMetricExporter } = await import(
            '@opentelemetry/exporter-metrics-otlp-http'
          )
          // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
          exporters.push(new OTLPMetricExporter(httpConfig))
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        case 'http/protobuf': {
          // 从 `await import(` 解构 OTLPMetricExporter，减少共享工具 instrumentation对同一对象的重复访问。
          const { OTLPMetricExporter } = await import(
            '@opentelemetry/exporter-metrics-otlp-proto'
          )
          // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
          exporters.push(new OTLPMetricExporter(httpConfig))
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        default:
          // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
          throw new Error(
            `Unknown protocol set in OTEL_EXPORTER_OTLP_METRICS_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${protocol}`,
          )
      }
    // 共享工具 instrumentation在这里处理 `} else if (exporterType === 'prometheus') {`，完成这一小步状态转换。
    } else if (exporterType === 'prometheus') {
      // 从 `await import(` 解构 PrometheusExporter，减少共享工具 instrumentation对同一对象的重复访问。
      const { PrometheusExporter } = await import(
        '@opentelemetry/exporter-prometheus'
      )
      // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
      exporters.push(new PrometheusExporter())
    } else {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Unknown exporter type set in OTEL_EXPORTER_OTLP_METRICS_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${exporterType}`,
      )
    }
  }

  // 返回 `exporters.map(exporter => {`，作为共享工具这次计算的结果。
  return exporters.map(exporter => {
    // 满足 `'export' in exporter` 时，共享工具执行该分支。
    if ('export' in exporter) {
      // 返回 `new PeriodicExportingMetricReader({`，作为共享工具这次计算的结果。
      return new PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: exportInterval,
      })
    }
    // 返回 `exporter`，作为共享工具这次计算的结果。
    return exporter
  })
}

// getOtlpLogExporters 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getOtlpLogExporters() {
  // exporterTypes 集合解析`parseExporterTypes`，供共享工具后续处理使用。
  const exporterTypes = parseExporterTypes(process.env.OTEL_LOGS_EXPORTER)

  // protocol 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const protocol =
    process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL?.trim() ||
    process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim()
  // endpoint 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[3P telemetry] getOtlpLogExporters: types=${jsonStringify(exporterTypes)}, protocol=${protocol}, endpoint=${endpoint}`,
  )

  // exporters 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const exporters = []
  // 按顺序遍历 `exporterTypes` 中的exporterType，逐个交给共享工具处理。
  for (const exporterType of exporterTypes) {
    // 当 `exporterType` 匹配 `'console'` 时，共享工具执行对应分支。
    if (exporterType === 'console') {
      // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
      exporters.push(new ConsoleLogRecordExporter())
    // 共享工具 instrumentation在这里处理 `} else if (exporterType === 'otlp') {`，完成这一小步状态转换。
    } else if (exporterType === 'otlp') {
      // httpConfig 配置读取`getOTLPExporterConfig`，供共享工具后续处理使用。
      const httpConfig = getOTLPExporterConfig()

      // 按照 protocol 的取值选择共享工具的具体处理分支。
      switch (protocol) {
        case 'grpc': {
          // 从 `await import(` 解构 OTLPLogExporter，减少共享工具 instrumentation对同一对象的重复访问。
          const { OTLPLogExporter } = await import(
            '@opentelemetry/exporter-logs-otlp-grpc'
          )
          // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
          exporters.push(new OTLPLogExporter())
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        case 'http/json': {
          // 从 `await import(` 解构 OTLPLogExporter，减少共享工具 instrumentation对同一对象的重复访问。
          const { OTLPLogExporter } = await import(
            '@opentelemetry/exporter-logs-otlp-http'
          )
          // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
          exporters.push(new OTLPLogExporter(httpConfig))
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        case 'http/protobuf': {
          // 从 `await import(` 解构 OTLPLogExporter，减少共享工具 instrumentation对同一对象的重复访问。
          const { OTLPLogExporter } = await import(
            '@opentelemetry/exporter-logs-otlp-proto'
          )
          // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
          exporters.push(new OTLPLogExporter(httpConfig))
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        default:
          // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
          throw new Error(
            `Unknown protocol set in OTEL_EXPORTER_OTLP_LOGS_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${protocol}`,
          )
      }
    } else {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Unknown exporter type set in OTEL_LOGS_EXPORTER env var: ${exporterType}`,
      )
    }
  }

  // 返回 `exporters`，作为共享工具这次计算的结果。
  return exporters
}

// getOtlpTraceExporters 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getOtlpTraceExporters() {
  // exporterTypes 集合解析`parseExporterTypes`，供共享工具后续处理使用。
  const exporterTypes = parseExporterTypes(process.env.OTEL_TRACES_EXPORTER)

  // exporters 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const exporters = []
  // 按顺序遍历 `exporterTypes` 中的exporterType，逐个交给共享工具处理。
  for (const exporterType of exporterTypes) {
    // 当 `exporterType` 匹配 `'console'` 时，共享工具执行对应分支。
    if (exporterType === 'console') {
      // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
      exporters.push(new ConsoleSpanExporter())
    // 共享工具 instrumentation在这里处理 `} else if (exporterType === 'otlp') {`，完成这一小步状态转换。
    } else if (exporterType === 'otlp') {
      // protocol 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const protocol =
        process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL?.trim() ||
        process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim()

      // httpConfig 配置读取`getOTLPExporterConfig`，供共享工具后续处理使用。
      const httpConfig = getOTLPExporterConfig()

      // 按照 protocol 的取值选择共享工具的具体处理分支。
      switch (protocol) {
        case 'grpc': {
          // 从 `await import(` 解构 OTLPTraceExporter，减少共享工具 instrumentation对同一对象的重复访问。
          const { OTLPTraceExporter } = await import(
            '@opentelemetry/exporter-trace-otlp-grpc'
          )
          // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
          exporters.push(new OTLPTraceExporter())
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        case 'http/json': {
          // 从 `await import(` 解构 OTLPTraceExporter，减少共享工具 instrumentation对同一对象的重复访问。
          const { OTLPTraceExporter } = await import(
            '@opentelemetry/exporter-trace-otlp-http'
          )
          // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
          exporters.push(new OTLPTraceExporter(httpConfig))
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        case 'http/protobuf': {
          // 从 `await import(` 解构 OTLPTraceExporter，减少共享工具 instrumentation对同一对象的重复访问。
          const { OTLPTraceExporter } = await import(
            '@opentelemetry/exporter-trace-otlp-proto'
          )
          // exporters 集合追加新条目，保持收集顺序与输入顺序一致。
          exporters.push(new OTLPTraceExporter(httpConfig))
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
        }
        default:
          // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
          throw new Error(
            `Unknown protocol set in OTEL_EXPORTER_OTLP_TRACES_PROTOCOL or OTEL_EXPORTER_OTLP_PROTOCOL env var: ${protocol}`,
          )
      }
    } else {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Unknown exporter type set in OTEL_TRACES_EXPORTER env var: ${exporterType}`,
      )
    }
  }

  // 返回 `exporters`，作为共享工具这次计算的结果。
  return exporters
}

// isTelemetryEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTelemetryEnabled() {
  // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_TELEMETRY)`，作为共享工具这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_CODE_ENABLE_TELEMETRY)
}

// getBigQueryExportingReader 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBigQueryExportingReader() {
  // bigqueryExporter保存`BigQueryMetricsExporter`，供共享工具后续处理使用。
  const bigqueryExporter = new BigQueryMetricsExporter()
  // 返回 `new PeriodicExportingMetricReader({`，作为共享工具这次计算的结果。
  return new PeriodicExportingMetricReader({
    exporter: bigqueryExporter,
    exportIntervalMillis: 5 * 60 * 1000, // 5mins for BigQuery metrics exporter to reduce load
  })
}

// isBigQueryMetricsEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBigQueryMetricsEnabled() {
  // BigQuery metrics are enabled for:
  // 1. API customers (excluding Claude.ai subscribers and Bedrock/Vertex)
  // 2. Claude for Enterprise (C4E) users
  // 3. Claude for Teams users
  // subscriptionType读取`getSubscriptionType`，供共享工具后续处理使用。
  const subscriptionType = getSubscriptionType()
  // isC4EOrTeamUser 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isC4EOrTeamUser =
    isClaudeAISubscriber() &&
    (subscriptionType === 'enterprise' || subscriptionType === 'team')

  // 返回 `is1PApiCustomer() || isC4EOrTeamUser`，作为共享工具这次计算的结果。
  return is1PApiCustomer() || isC4EOrTeamUser
}

/**
 * Initialize beta tracing - a separate code path for detailed debugging.
 * Uses BETA_TRACING_ENDPOINT instead of OTEL_EXPORTER_OTLP_ENDPOINT.
 */
// initializeBetaTracing 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function initializeBetaTracing(
  resource: ReturnType<typeof resourceFromAttributes>,
): Promise<void> {
  // endpoint 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const endpoint = process.env.BETA_TRACING_ENDPOINT
  // endpoint缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!endpoint) {
    // 共享工具 instrumentation在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 并行获取 { OTLPTraceExporter }、{ OTLPLogExporter }，缩短共享工具 instrumentation等待多个独立异步任务的时间。
  const [{ OTLPTraceExporter }, { OTLPLogExporter }] = await Promise.all([
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/exporter-logs-otlp-http'),
  ])

  // httpConfig 配置集中保存共享工具 instrumentation要一起传递的字段。
  const httpConfig = {
    url: `${endpoint}/v1/traces`,
  }

  // logHttpConfig 配置集中保存共享工具 instrumentation要一起传递的字段。
  const logHttpConfig = {
    url: `${endpoint}/v1/logs`,
  }

  // Initialize trace exporter
  // traceExporter保存`OTLPTraceExporter`，供共享工具后续处理使用。
  const traceExporter = new OTLPTraceExporter(httpConfig)
  // spanProcessor保存`BatchSpanProcessor`，供共享工具后续处理使用。
  const spanProcessor = new BatchSpanProcessor(traceExporter, {
    scheduledDelayMillis: DEFAULT_TRACES_EXPORT_INTERVAL_MS,
  })

  // tracerProvider保存`BasicTracerProvider`，供共享工具后续处理使用。
  const tracerProvider = new BasicTracerProvider({
    resource,
    spanProcessors: [spanProcessor],
  })

  // trace.setGlobalTracerProvider 写入新的状态值，使共享工具后续读取保持一致。
  trace.setGlobalTracerProvider(tracerProvider)
  // setTracerProvider 写入新的状态值，使共享工具后续读取保持一致。
  setTracerProvider(tracerProvider)

  // Initialize log exporter
  // logExporter保存`OTLPLogExporter`，供共享工具后续处理使用。
  const logExporter = new OTLPLogExporter(logHttpConfig)
  // loggerProvider保存`LoggerProvider`，供共享工具后续处理使用。
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor(logExporter, {
        scheduledDelayMillis: DEFAULT_LOGS_EXPORT_INTERVAL_MS,
      }),
    ],
  })

  // logs.setGlobalLoggerProvider 写入新的状态值，使共享工具后续读取保持一致。
  logs.setGlobalLoggerProvider(loggerProvider)
  // setLoggerProvider 写入新的状态值，使共享工具后续读取保持一致。
  setLoggerProvider(loggerProvider)

  // Initialize event logger
  // eventLogger读取`logs.getLogger`，供共享工具后续处理使用。
  const eventLogger = logs.getLogger(
    'com.anthropic.claude_code.events',
    MACRO.VERSION,
  )
  // setEventLogger 写入新的状态值，使共享工具后续读取保持一致。
  setEventLogger(eventLogger)

  // Setup flush handlers - flush both logs AND traces
  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('beforeExit', async () => {
    // 等待 `loggerProvider?.forceFlush()` 完成，再继续共享工具 instrumentation的异步流程。
    await loggerProvider?.forceFlush()
    // 等待 `tracerProvider?.forceFlush()` 完成，再继续共享工具 instrumentation的异步流程。
    await tracerProvider?.forceFlush()
  })

  // 调用 process.on，触发共享工具此处需要的副作用。
  process.on('exit', () => {
    // 显式忽略 `loggerProvider?.forceFlush()` 的返回值，只保留它触发的副作用。
    void loggerProvider?.forceFlush()
    // 显式忽略 `tracerProvider?.forceFlush()` 的返回值，只保留它触发的副作用。
    void tracerProvider?.forceFlush()
  })
}

// initializeTelemetry 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initializeTelemetry() {
  // 调用 profileCheckpoint，触发共享工具此处需要的副作用。
  profileCheckpoint('telemetry_init_start')
  // 调用 bootstrapTelemetry，触发共享工具此处需要的副作用。
  bootstrapTelemetry()

  // Console exporters call console.dir on a timer (5s logs/traces, 60s
  // metrics), writing pretty-printed objects to stdout. In stream-json
  // mode stdout is the SDK message channel; the first line (`{`) breaks
  // the SDK's line reader. Stripped here (not main.tsx) because init.ts
  // re-runs applyConfigEnvironmentVariables() inside initializeTelemetry-
  // AfterTrust for remote-managed-settings users, and bootstrapTelemetry
  // above copies ANT_OTEL_* for ant users — both would undo an earlier strip.
  // 满足 `getHasFormattedOutput()` 时，共享工具执行该分支。
  if (getHasFormattedOutput()) {
    // 调用 for，触发共享工具此处需要的副作用。
    for (const key of [
      'OTEL_METRICS_EXPORTER',
      'OTEL_LOGS_EXPORTER',
      'OTEL_TRACES_EXPORTER',
    ] as const) {
      // v保存`process.env[key]`，供共享工具 instrumentation后续判断或输出使用。
      const v = process.env[key]
      // 满足 `v?.includes('console')` 时，共享工具执行该分支。
      if (v?.includes('console')) {
        // env[key更新为 `v`，确保共享工具 instrumentation后续读取最新状态。
        process.env[key] = v
          .split(',')
          // 链式调用 map，继续加工上一行在共享工具中产生的数据。
          .map(s => s.trim())
          // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
          .filter(s => s !== 'console')
          .join(',')
      }
    }
  }

  // diag.setLogger 写入新的状态值，使共享工具后续读取保持一致。
  diag.setLogger(new ClaudeCodeDiagLogger(), DiagLogLevel.ERROR)

  // Initialize Perfetto tracing (independent of OTEL)
  // Enable via CLAUDE_CODE_PERFETTO_TRACE=1 or CLAUDE_CODE_PERFETTO_TRACE=<path>
  // 调用 initializePerfettoTracing，触发共享工具此处需要的副作用。
  initializePerfettoTracing()

  // readers 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const readers = []

  // Add customer exporters (if enabled)
  // telemetryEnabled保存`isTelemetryEnabled`，供共享工具后续处理使用。
  const telemetryEnabled = isTelemetryEnabled()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[3P telemetry] isTelemetryEnabled=${telemetryEnabled} (CLAUDE_CODE_ENABLE_TELEMETRY=${process.env.CLAUDE_CODE_ENABLE_TELEMETRY})`,
  )
  // 满足 `telemetryEnabled` 时，共享工具执行该分支。
  if (telemetryEnabled) {
    // readers 集合追加新条目，保持收集顺序与输入顺序一致。
    readers.push(...(await getOtlpReaders()))
  }

  // Add BigQuery exporter (for API customers, C4E users, and internal users)
  // 满足 `isBigQueryMetricsEnabled()` 时，共享工具执行该分支。
  if (isBigQueryMetricsEnabled()) {
    // readers 集合追加新条目，保持收集顺序与输入顺序一致。
    readers.push(getBigQueryExportingReader())
  }

  // Create base resource with service attributes
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()
  // baseAttributes 集合 集中保存共享工具 instrumentation要一起传递的字段。
  const baseAttributes: Record<string, string> = {
    [ATTR_SERVICE_NAME]: 'claude-code',
    [ATTR_SERVICE_VERSION]: MACRO.VERSION,
  }

  // Add WSL-specific attributes if running on WSL
  // 当 `platform` 匹配 `'wsl'` 时，共享工具执行对应分支。
  if (platform === 'wsl') {
    // wslVersion读取`getWslVersion`，供共享工具后续处理使用。
    const wslVersion = getWslVersion()
    // 满足 `wslVersion` 时，共享工具执行该分支。
    if (wslVersion) {
      // version'更新为 `wslVersion`，确保共享工具 instrumentation后续读取最新状态。
      baseAttributes['wsl.version'] = wslVersion
    }
  }

  // baseResource保存`resourceFromAttributes`，供共享工具后续处理使用。
  const baseResource = resourceFromAttributes(baseAttributes)

  // Use OpenTelemetry detectors
  // osResource保存`resourceFromAttributes`，供共享工具后续处理使用。
  const osResource = resourceFromAttributes(
    osDetector.detect().attributes || {},
  )

  // Extract only host.arch from hostDetector
  // hostDetected读取`hostDetector.detect`，供共享工具后续处理使用。
  const hostDetected = hostDetector.detect()
  // hostArchAttributes 集合读取 `hostDetected.attributes?.[SEMRESATTRS_HOST_ARCH]` 对应条目，后续围绕该成员继续处理。
  const hostArchAttributes = hostDetected.attributes?.[SEMRESATTRS_HOST_ARCH]
    ? {
        [SEMRESATTRS_HOST_ARCH]: hostDetected.attributes[SEMRESATTRS_HOST_ARCH],
      }
    : {}
  // hostArchResource保存`resourceFromAttributes`，供共享工具后续处理使用。
  const hostArchResource = resourceFromAttributes(hostArchAttributes)

  // envResource保存`resourceFromAttributes`，供共享工具后续处理使用。
  const envResource = resourceFromAttributes(
    envDetector.detect().attributes || {},
  )

  // Merge resources - later resources take precedence
  // resource 命名 `baseResource`，让后续代码直接表达这个值的用途。
  const resource = baseResource
    .merge(osResource)
    .merge(hostArchResource)
    .merge(envResource)

  // Check if beta tracing is enabled - this is a separate code path
  // Available to all users who set ENABLE_BETA_TRACING_DETAILED=1 and BETA_TRACING_ENDPOINT
  // 满足 `isBetaTracingEnabled()` 时，共享工具执行该分支。
  if (isBetaTracingEnabled()) {
    // 这个回调绑定到 void initializeBetaTracing(resource).catch(e =>，负责共享工具在该局部场景下的响应。
    void initializeBetaTracing(resource).catch(e =>
      logForDebugging(`Beta tracing init failed: ${e}`, { level: 'error' }),
    )
    // Still set up meter provider for metrics (but skip regular logs/traces setup)
    // meterProvider保存`MeterProvider`，供共享工具后续处理使用。
    const meterProvider = new MeterProvider({
      resource,
      views: [],
      readers,
    })
    // setMeterProvider 写入新的状态值，使共享工具后续读取保持一致。
    setMeterProvider(meterProvider)

    // Register shutdown for beta tracing
    // shutdownTelemetry保存`async`，供共享工具后续处理使用。
    const shutdownTelemetry = async () => {
      // timeoutMs 集合解析`parseInt`，供共享工具后续处理使用。
      const timeoutMs = parseInt(
        process.env.CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS || '2000',
      )
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 调用 endInteractionSpan，触发共享工具此处需要的副作用。
        endInteractionSpan()

        // Force flush + shutdown together inside the timeout. Previously forceFlush
        // was awaited unbounded BEFORE the race, blocking exit on slow OTLP endpoints.
        // Each provider's flush→shutdown is chained independently so a slow logger
        // flush doesn't delay meterProvider/tracerProvider shutdown (no waterfall).
        // loggerProvider读取`getLoggerProvider`，供共享工具后续处理使用。
        const loggerProvider = getLoggerProvider()
        // tracerProvider读取`getTracerProvider`，供共享工具后续处理使用。
        const tracerProvider = getTracerProvider()

        // chains 集合 聚合成有序列表，保持后续遍历顺序稳定。
        const chains: Promise<void>[] = [meterProvider.shutdown()]
        // 满足 `loggerProvider` 时，共享工具执行该分支。
        if (loggerProvider) {
          // chains 集合追加新条目，保持收集顺序与输入顺序一致。
          chains.push(
            // 调用 loggerProvider.forceFlush，触发共享工具此处需要的副作用。
            loggerProvider.forceFlush().then(() => loggerProvider.shutdown()),
          )
        }
        // 满足 `tracerProvider` 时，共享工具执行该分支。
        if (tracerProvider) {
          // chains 集合追加新条目，保持收集顺序与输入顺序一致。
          chains.push(
            // 调用 tracerProvider.forceFlush，触发共享工具此处需要的副作用。
            tracerProvider.forceFlush().then(() => tracerProvider.shutdown()),
          )
        }

        // 等待 `Promise.race([` 完成，再继续共享工具 instrumentation的异步流程。
        await Promise.race([
          Promise.all(chains),
          telemetryTimeout(timeoutMs, 'OpenTelemetry shutdown timeout'),
        ])
      } catch {
        // Ignore shutdown errors
      }
    }
    // 调用 registerCleanup，触发共享工具此处需要的副作用。
    registerCleanup(shutdownTelemetry)

    // 返回 `meterProvider.getMeter('com.anthropic.claude_code', MACRO.VERSION)`，作为共享工具这次计算的结果。
    return meterProvider.getMeter('com.anthropic.claude_code', MACRO.VERSION)
  }

  // meterProvider保存`MeterProvider`，供共享工具后续处理使用。
  const meterProvider = new MeterProvider({
    resource,
    views: [],
    readers,
  })

  // Store reference in state for flushing
  // setMeterProvider 写入新的状态值，使共享工具后续读取保持一致。
  setMeterProvider(meterProvider)

  // Initialize logs if telemetry is enabled
  // 满足 `telemetryEnabled` 时，共享工具执行该分支。
  if (telemetryEnabled) {
    // logExporters 集合读取`getOtlpLogExporters`，供共享工具后续处理使用。
    const logExporters = await getOtlpLogExporters()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[3P telemetry] Created ${logExporters.length} log exporter(s)`,
    )

    // 满足 `logExporters.length > 0` 时，共享工具执行该分支。
    if (logExporters.length > 0) {
      // loggerProvider保存`LoggerProvider`，供共享工具后续处理使用。
      const loggerProvider = new LoggerProvider({
        resource,
        // Add batch processors for each exporter
        processors: logExporters.map(
          // exporter更新为 `>`，确保共享工具后续读取最新状态。
          exporter =>
            new BatchLogRecordProcessor(exporter, {
              scheduledDelayMillis: parseInt(
                process.env.OTEL_LOGS_EXPORT_INTERVAL ||
                  DEFAULT_LOGS_EXPORT_INTERVAL_MS.toString(),
              ),
            }),
        ),
      })

      // Register the logger provider globally
      // logs.setGlobalLoggerProvider 写入新的状态值，使共享工具后续读取保持一致。
      logs.setGlobalLoggerProvider(loggerProvider)
      // setLoggerProvider 写入新的状态值，使共享工具后续读取保持一致。
      setLoggerProvider(loggerProvider)

      // Initialize event logger
      // eventLogger读取`logs.getLogger`，供共享工具后续处理使用。
      const eventLogger = logs.getLogger(
        'com.anthropic.claude_code.events',
        MACRO.VERSION,
      )
      // setEventLogger 写入新的状态值，使共享工具后续读取保持一致。
      setEventLogger(eventLogger)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[3P telemetry] Event logger set successfully')

      // 'beforeExit' is emitted when Node.js empties its event loop and has no additional work to schedule.
      // Unlike 'exit', it allows us to perform async operations, so it works well for letting
      // network requests complete before the process exits naturally.
      // 调用 process.on，触发共享工具此处需要的副作用。
      process.on('beforeExit', async () => {
        // 等待 `loggerProvider?.forceFlush()` 完成，再继续共享工具 instrumentation的异步流程。
        await loggerProvider?.forceFlush()
        // Also flush traces - they use BatchSpanProcessor which needs explicit flush
        // tracerProvider读取`getTracerProvider`，供共享工具后续处理使用。
        const tracerProvider = getTracerProvider()
        // 等待 `tracerProvider?.forceFlush()` 完成，再继续共享工具 instrumentation的异步流程。
        await tracerProvider?.forceFlush()
      })

      // 调用 process.on，触发共享工具此处需要的副作用。
      process.on('exit', () => {
        // Final attempt to flush logs and traces
        // 显式忽略 `loggerProvider?.forceFlush()` 的返回值，只保留它触发的副作用。
        void loggerProvider?.forceFlush()
        // 显式忽略 `getTracerProvider()?.forceFlush()` 的返回值，只保留它触发的副作用。
        void getTracerProvider()?.forceFlush()
      })
    }
  }

  // Initialize tracing if enhanced telemetry is enabled (BETA)
  // 只有 `telemetryEnabled && isEnhancedTelemetryEnabled()` 满足时，共享工具才执行该分支。
  if (telemetryEnabled && isEnhancedTelemetryEnabled()) {
    // traceExporters 集合读取`getOtlpTraceExporters`，供共享工具后续处理使用。
    const traceExporters = await getOtlpTraceExporters()
    // 满足 `traceExporters.length > 0` 时，共享工具执行该分支。
    if (traceExporters.length > 0) {
      // Create span processors for each exporter
      // spanProcessors 集合派生`traceExporters.map`，供共享工具后续处理使用。
      const spanProcessors = traceExporters.map(
        // exporter更新为 `>`，确保共享工具后续读取最新状态。
        exporter =>
          new BatchSpanProcessor(exporter, {
            scheduledDelayMillis: parseInt(
              process.env.OTEL_TRACES_EXPORT_INTERVAL ||
                DEFAULT_TRACES_EXPORT_INTERVAL_MS.toString(),
            ),
          }),
      )

      // tracerProvider保存`BasicTracerProvider`，供共享工具后续处理使用。
      const tracerProvider = new BasicTracerProvider({
        resource,
        spanProcessors,
      })

      // Register the tracer provider globally
      // trace.setGlobalTracerProvider 写入新的状态值，使共享工具后续读取保持一致。
      trace.setGlobalTracerProvider(tracerProvider)
      // setTracerProvider 写入新的状态值，使共享工具后续读取保持一致。
      setTracerProvider(tracerProvider)
    }
  }

  // Shutdown metrics and logs on exit (flushes and closes exporters)
  // shutdownTelemetry保存`async`，供共享工具后续处理使用。
  const shutdownTelemetry = async () => {
    // timeoutMs 集合解析`parseInt`，供共享工具后续处理使用。
    const timeoutMs = parseInt(
      process.env.CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS || '2000',
    )

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // End any active interaction span before shutdown
      // 调用 endInteractionSpan，触发共享工具此处需要的副作用。
      endInteractionSpan()

      // shutdownPromises 集合保存`meterProvider.shutdown`，供共享工具后续处理使用。
      const shutdownPromises = [meterProvider.shutdown()]
      // loggerProvider读取`getLoggerProvider`，供共享工具后续处理使用。
      const loggerProvider = getLoggerProvider()
      // 满足 `loggerProvider` 时，共享工具执行该分支。
      if (loggerProvider) {
        // shutdownPromises 集合追加新条目，保持收集顺序与输入顺序一致。
        shutdownPromises.push(loggerProvider.shutdown())
      }
      // tracerProvider读取`getTracerProvider`，供共享工具后续处理使用。
      const tracerProvider = getTracerProvider()
      // 满足 `tracerProvider` 时，共享工具执行该分支。
      if (tracerProvider) {
        // shutdownPromises 集合追加新条目，保持收集顺序与输入顺序一致。
        shutdownPromises.push(tracerProvider.shutdown())
      }

      // 等待 `Promise.race([` 完成，再继续共享工具 instrumentation的异步流程。
      await Promise.race([
        Promise.all(shutdownPromises),
        telemetryTimeout(timeoutMs, 'OpenTelemetry shutdown timeout'),
      ])
    } catch (error) {
      // 只有 `error instanceof Error && error.message.includes('timeout')` 满足时，共享工具才执行该分支。
      if (error instanceof Error && error.message.includes('timeout')) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `
OpenTelemetry telemetry flush timed out after ${timeoutMs}ms

To resolve this issue, you can:
1. Increase the timeout by setting CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS env var (e.g., 5000 for 5 seconds)
2. Check if your OpenTelemetry backend is experiencing scalability issues
3. Disable OpenTelemetry by unsetting CLAUDE_CODE_ENABLE_TELEMETRY env var

Current timeout: ${timeoutMs}ms
`,
          { level: 'error' },
        )
      }
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }
  }

  // Always register shutdown (internal metrics are always enabled)
  // 调用 registerCleanup，触发共享工具此处需要的副作用。
  registerCleanup(shutdownTelemetry)

  // 返回 `meterProvider.getMeter('com.anthropic.claude_code', MACRO.VERSION)`，作为共享工具这次计算的结果。
  return meterProvider.getMeter('com.anthropic.claude_code', MACRO.VERSION)
}

/**
 * Flush all pending telemetry data immediately.
 * This should be called before logout or org switching to prevent data leakage.
 */
// flushTelemetry 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function flushTelemetry(): Promise<void> {
  // meterProvider读取`getMeterProvider`，供共享工具后续处理使用。
  const meterProvider = getMeterProvider()
  // meterProvider缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!meterProvider) {
    // 共享工具 instrumentation在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // timeoutMs 集合解析`parseInt`，供共享工具后续处理使用。
  const timeoutMs = parseInt(
    process.env.CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS || '5000',
  )

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // flushPromises 集合保存`meterProvider.forceFlush`，供共享工具后续处理使用。
    const flushPromises = [meterProvider.forceFlush()]
    // loggerProvider读取`getLoggerProvider`，供共享工具后续处理使用。
    const loggerProvider = getLoggerProvider()
    // 满足 `loggerProvider` 时，共享工具执行该分支。
    if (loggerProvider) {
      // flushPromises 集合追加新条目，保持收集顺序与输入顺序一致。
      flushPromises.push(loggerProvider.forceFlush())
    }
    // tracerProvider读取`getTracerProvider`，供共享工具后续处理使用。
    const tracerProvider = getTracerProvider()
    // 满足 `tracerProvider` 时，共享工具执行该分支。
    if (tracerProvider) {
      // flushPromises 集合追加新条目，保持收集顺序与输入顺序一致。
      flushPromises.push(tracerProvider.forceFlush())
    }

    // 等待 `Promise.race([` 完成，再继续共享工具 instrumentation的异步流程。
    await Promise.race([
      Promise.all(flushPromises),
      telemetryTimeout(timeoutMs, 'OpenTelemetry flush timeout'),
    ])

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Telemetry flushed successfully')
  } catch (error) {
    // 满足 `error instanceof TelemetryTimeoutError` 时，共享工具执行该分支。
    if (error instanceof TelemetryTimeoutError) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Telemetry flush timed out after ${timeoutMs}ms. Some metrics may not be exported.`,
        { level: 'warn' },
      )
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Telemetry flush failed: ${errorMessage(error)}`, {
        level: 'error',
      })
    }
    // Don't throw - allow logout to continue even if flush fails
  }
}

// parseOtelHeadersEnvVar 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseOtelHeadersEnvVar(): Record<string, string> {
  // 请求头 从空对象开始收集键值，后续按名称补齐内容。
  const headers: Record<string, string> = {}
  // envHeaders 集合 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envHeaders = process.env.OTEL_EXPORTER_OTLP_HEADERS
  // 满足 `envHeaders` 时，共享工具执行该分支。
  if (envHeaders) {
    // 逐项读取 `envHeaders.split(',')` 中的pair，按输入顺序推进共享工具。
    for (const pair of envHeaders.split(',')) {
      // 从 `pair.split('=')` 按位置拆出 key、其余 valueParts，让共享工具 instrumentation分别处理这些返回值。
      const [key, ...valueParts] = pair.split('=')
      // 只有 `key && valueParts.length > 0` 满足时，共享工具才执行该分支。
      if (key && valueParts.length > 0) {
        // trim()更新为 `valueParts.join('=').trim()`，确保共享工具 instrumentation后续读取最新状态。
        headers[key.trim()] = valueParts.join('=').trim()
      }
    }
  }
  // 返回 `headers`，作为共享工具这次计算的结果。
  return headers
}

/**
 * Get configuration for OTLP exporters including:
 * - HTTP agent options (proxy, mTLS)
 * - Dynamic headers via otelHeadersHelper or static headers from env var
 */
// getOTLPExporterConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOTLPExporterConfig() {
  // proxyUrl读取`getProxyUrl`，供共享工具后续处理使用。
  const proxyUrl = getProxyUrl()
  // mtlsConfig 配置读取`getMTLSConfig`，供共享工具后续处理使用。
  const mtlsConfig = getMTLSConfig()
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED()

  // Build base config
  // 配置 从空对象开始收集键值，后续按名称补齐内容。
  const config: Record<string, unknown> = {}

  // Parse static headers from env var once (doesn't change at runtime)
  // staticHeaders 集合解析`parseOtelHeadersEnvVar`，供共享工具后续处理使用。
  const staticHeaders = parseOtelHeadersEnvVar()

  // If otelHeadersHelper is configured, use async headers function for dynamic refresh
  // Otherwise just return static headers if any exist
  // 满足 `settings?.otelHeadersHelper` 时，共享工具执行该分支。
  if (settings?.otelHeadersHelper) {
    // 请求头更新为 `async (): Promise<Record<string, string>> => {`，确保共享工具后续读取最新状态。
    config.headers = async (): Promise<Record<string, string>> => {
      // dynamicHeaders 集合读取`getOtelHeadersFromHelper`，供共享工具后续处理使用。
      const dynamicHeaders = getOtelHeadersFromHelper()
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { ...staticHeaders, ...dynamicHeaders }
    }
  // 共享工具 instrumentation在这里处理 `} else if (Object.keys(staticHeaders).length > 0) {`，完成这一小步状态转换。
  } else if (Object.keys(staticHeaders).length > 0) {
    // 请求头更新为 `async (): Promise<Record<string, string>> => staticHeaders`，确保共享工具后续读取最新状态。
    config.headers = async (): Promise<Record<string, string>> => staticHeaders
  }

  // Check if we should bypass proxy for OTEL endpoint
  // otelEndpoint 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  // 只有 `!proxyUrl || (otelEndpoint && shouldBypassProxy(otelEndpoint))` 满足时，共享工具才执行该分支。
  if (!proxyUrl || (otelEndpoint && shouldBypassProxy(otelEndpoint))) {
    // No proxy configured or OTEL endpoint should bypass proxy
    // caCerts 集合读取`getCACertificates`，供共享工具后续处理使用。
    const caCerts = getCACertificates()
    // 只有 `mtlsConfig || caCerts` 满足时，共享工具才执行该分支。
    if (mtlsConfig || caCerts) {
      // httpAgentOptions 集合更新为 `{`，确保共享工具后续读取最新状态。
      config.httpAgentOptions = {
        ...mtlsConfig,
        ...(caCerts && { ca: caCerts }),
      }
    }
    // 返回 `config`，作为共享工具这次计算的结果。
    return config
  }

  // Return an HttpAgentFactory function that creates our proxy agent
  // caCerts 集合读取`getCACertificates`，供共享工具后续处理使用。
  const caCerts = getCACertificates()
  // agentFactory封装成回调，供共享工具 instrumentation在事件触发或异步步骤中调用。
  const agentFactory = (_protocol: string) => {
    // Create and return the proxy agent with mTLS and CA cert config
    // proxyAgent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const proxyAgent =
      mtlsConfig || caCerts
        ? new HttpsProxyAgent(proxyUrl, {
            ...(mtlsConfig && {
              cert: mtlsConfig.cert,
              key: mtlsConfig.key,
              passphrase: mtlsConfig.passphrase,
            }),
            ...(caCerts && { ca: caCerts }),
          })
        : new HttpsProxyAgent(proxyUrl)

    // 返回 `proxyAgent`，作为共享工具这次计算的结果。
    return proxyAgent
  }

  // httpAgentOptions 集合更新为 `agentFactory`，确保共享工具后续读取最新状态。
  config.httpAgentOptions = agentFactory
  // 返回 `config`，作为共享工具这次计算的结果。
  return config
}
