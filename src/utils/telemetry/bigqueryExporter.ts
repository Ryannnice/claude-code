// 类型依赖 { Attributes, HrTime } 来自 @opentelemetry/api，用于校准共享工具的数据契约。
import type { Attributes, HrTime } from '@opentelemetry/api'
// 引入 ExportResult、ExportResultCode，将 @opentelemetry/core 中已经封装好的能力接到本文件流程里。
import { type ExportResult, ExportResultCode } from '@opentelemetry/core'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  AggregationTemporality,
  type MetricData,
  type DataPoint as OTelDataPoint,
  type PushMetricExporter,
  type ResourceMetrics,
} from '@opentelemetry/sdk-metrics'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 接入 checkMetricsEnabled 服务层能力，把外部通信或共享状态交给 src/services/api/metricsOptOut.js 处理。
import { checkMetricsEnabled } from 'src/services/api/metricsOptOut.js'
// 引入 getIsNonInteractiveSession，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../../bootstrap/state.js'
// 引入 getSubscriptionType、isClaudeAISubscriber，将 ../auth.js 中已经封装好的能力接到本文件流程里。
import { getSubscriptionType, isClaudeAISubscriber } from '../auth.js'
// 引入 checkHasTrustDialogAccepted，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { checkHasTrustDialogAccepted } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage、toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, toError } from '../errors.js'
// 引入 getAuthHeaders，将 ../http.js 中已经封装好的能力接到本文件流程里。
import { getAuthHeaders } from '../http.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 getClaudeCodeUserAgent，将 ../userAgent.js 中已经封装好的能力接到本文件流程里。
import { getClaudeCodeUserAgent } from '../userAgent.js'

// DataPoint 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type DataPoint = {
  attributes: Record<string, string>
  value: number
  timestamp: string
}

// Metric 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Metric = {
  name: string
  description?: string
  unit?: string
  data_points: DataPoint[]
}

// InternalMetricsPayload 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type InternalMetricsPayload = {
  resource_attributes: Record<string, string>
  metrics: Metric[]
}

// BigQueryMetricsExporter 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class BigQueryMetricsExporter implements PushMetricExporter {
  private readonly endpoint: string
  private readonly timeout: number
  private pendingExports: Promise<void>[] = []
  private isShutdown = false

  // 构造函数接收 options: { timeout?: number } = {}，把外部输入整理成实例可复用的内部状态。
  constructor(options: { timeout?: number } = {}) {
    // defaultEndpoint保存`'https://api.anthropic.com/api/claude_code/metrics'`，作为后续固定文本处理的输入。
    const defaultEndpoint = 'https://api.anthropic.com/api/claude_code/metrics'

    // 共享工具在这里按实际状态进入对应分支。
    if (
      process.env.USER_TYPE === 'ant' &&
      process.env.ANT_CLAUDE_CODE_METRICS_ENDPOINT
    ) {
      // 共享工具 bigquery Exporter在这里处理 `this.endpoint =`，完成这一小步状态转换。
      this.endpoint =
        process.env.ANT_CLAUDE_CODE_METRICS_ENDPOINT +
        '/api/claude_code/metrics'
    } else {
      // 更新实例字段 endpoint 为 defaultEndpoint，同步共享工具的内部状态。
      this.endpoint = defaultEndpoint
    }

    // 更新实例字段 timeout 为 options.timeout || 5000，同步共享工具的内部状态。
    this.timeout = options.timeout || 5000
  }

  // 共享工具 bigquery Exporter在这里处理 `async export(`，完成这一小步状态转换。
  async export(
    metrics: ResourceMetrics,
    // 这个回调绑定到 resultCallback: (result: ExportResult) => void,，负责共享工具在该局部场景下的响应。
    resultCallback: (result: ExportResult) => void,
  ): Promise<void> {
    // 满足 `this.isShutdown` 时，共享工具执行该分支。
    if (this.isShutdown) {
      // 调用 resultCallback，触发共享工具此处需要的副作用。
      resultCallback({
        code: ExportResultCode.FAILED,
        error: new Error('Exporter has been shutdown'),
      })
      // 共享工具 bigquery Exporter在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // exportPromise 异步任务保存 `this.doExport` 启动的异步任务，稍后再决定等待还是后台完成。
    const exportPromise = this.doExport(metrics, resultCallback)
    // pendingExports 集合追加新条目，保持收集顺序与输入顺序一致。
    this.pendingExports.push(exportPromise)

    // Clean up completed exports
    // 这个回调绑定到 void exportPromise.finally(() => {，负责共享工具在该局部场景下的响应。
    void exportPromise.finally(() => {
      // index 索引保存`pendingExports.indexOf`，供共享工具后续处理使用。
      const index = this.pendingExports.indexOf(exportPromise)
      // 满足 `index > -1` 时，共享工具执行该分支。
      if (index > -1) {
        // 显式忽略 `this.pendingExports.splice(index, 1)` 的返回值，只保留它触发的副作用。
        void this.pendingExports.splice(index, 1)
      }
    })
  }

  // 共享工具 bigquery Exporter在这里处理 `private async doExport(`，完成这一小步状态转换。
  private async doExport(
    metrics: ResourceMetrics,
    // 这个回调绑定到 resultCallback: (result: ExportResult) => void,，负责共享工具在该局部场景下的响应。
    resultCallback: (result: ExportResult) => void,
  ): Promise<void> {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // Skip if trust not established in interactive mode
      // This prevents triggering apiKeyHelper before trust dialog
      // hasTrust 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const hasTrust =
        checkHasTrustDialogAccepted() || getIsNonInteractiveSession()
      // hasTrust缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!hasTrust) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'BigQuery metrics export: trust not established, skipping',
        )
        // 调用 resultCallback，触发共享工具此处需要的副作用。
        resultCallback({ code: ExportResultCode.SUCCESS })
        // 共享工具 bigquery Exporter在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Check organization-level metrics opt-out
      // metricsStatus 集合读取`checkMetricsEnabled`，供共享工具后续处理使用。
      const metricsStatus = await checkMetricsEnabled()
      // metricsStatus.enabled缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!metricsStatus.enabled) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging('Metrics export disabled by organization setting')
        // 调用 resultCallback，触发共享工具此处需要的副作用。
        resultCallback({ code: ExportResultCode.SUCCESS })
        // 共享工具 bigquery Exporter在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // payload保存`this.transformMetricsForInternal`，供共享工具后续处理使用。
      const payload = this.transformMetricsForInternal(metrics)

      // authResult读取`getAuthHeaders`，供共享工具后续处理使用。
      const authResult = getAuthHeaders()
      // 满足 `authResult.error` 时，共享工具执行该分支。
      if (authResult.error) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Metrics export failed: ${authResult.error}`)
        // 调用 resultCallback，触发共享工具此处需要的副作用。
        resultCallback({
          code: ExportResultCode.FAILED,
          error: new Error(authResult.error),
        })
        // 共享工具 bigquery Exporter在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 请求头 集中保存共享工具 bigquery Exporter要一起传递的字段。
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': getClaudeCodeUserAgent(),
        ...authResult.headers,
      }

      // 接口响应保存`axios.post`，供共享工具后续处理使用。
      const response = await axios.post(this.endpoint, payload, {
        timeout: this.timeout,
        headers,
      })

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('BigQuery metrics exported successfully')
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `BigQuery API Response: ${jsonStringify(response.data, null, 2)}`,
      )
      // 调用 resultCallback，触发共享工具此处需要的副作用。
      resultCallback({ code: ExportResultCode.SUCCESS })
    } catch (error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`BigQuery metrics export failed: ${errorMessage(error)}`)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 调用 resultCallback，触发共享工具此处需要的副作用。
      resultCallback({
        code: ExportResultCode.FAILED,
        error: toError(error),
      })
    }
  }

  // 共享工具 bigquery Exporter在这里处理 `private transformMetricsForInternal(`，完成这一小步状态转换。
  private transformMetricsForInternal(
    metrics: ResourceMetrics,
  ): InternalMetricsPayload {
    // attrs 集合保存`metrics.resource.attributes`，供后续判断或组装使用。
    const attrs = metrics.resource.attributes

    // resourceAttributes 集合 集中保存共享工具 bigquery Exporter要一起传递的字段。
    const resourceAttributes: Record<string, string> = {
      'service.name': (attrs['service.name'] as string) || 'claude-code',
      'service.version': (attrs['service.version'] as string) || 'unknown',
      'os.type': (attrs['os.type'] as string) || 'unknown',
      'os.version': (attrs['os.version'] as string) || 'unknown',
      'host.arch': (attrs['host.arch'] as string) || 'unknown',
      'aggregation.temporality':
        this.selectAggregationTemporality() === AggregationTemporality.DELTA
          ? 'delta'
          : 'cumulative',
    }

    // Only add wsl.version if it exists (omit instead of default)
    // 满足 `attrs['wsl.version']` 时，共享工具执行该分支。
    if (attrs['wsl.version']) {
      // version'更新为 `attrs['wsl.version'] as string`，确保共享工具 bigquery Exporter后续读取最新状态。
      resourceAttributes['wsl.version'] = attrs['wsl.version'] as string
    }

    // Add customer type and subscription type
    // 满足 `isClaudeAISubscriber()` 时，共享工具执行该分支。
    if (isClaudeAISubscriber()) {
      // customer_type'更新为 `'claude_ai'`，确保共享工具 bigquery Exporter后续读取最新状态。
      resourceAttributes['user.customer_type'] = 'claude_ai'
      // subscriptionType读取`getSubscriptionType`，供共享工具后续处理使用。
      const subscriptionType = getSubscriptionType()
      // 满足 `subscriptionType` 时，共享工具执行该分支。
      if (subscriptionType) {
        // subscription_type'更新为 `subscriptionType`，确保共享工具 bigquery Exporter后续读取最新状态。
        resourceAttributes['user.subscription_type'] = subscriptionType
      }
    } else {
      // customer_type'更新为 `'api'`，确保共享工具 bigquery Exporter后续读取最新状态。
      resourceAttributes['user.customer_type'] = 'api'
    }

    // transformed集中保存共享工具 bigquery Exporter要一起传递的字段。
    const transformed = {
      resource_attributes: resourceAttributes,
      // 这个回调绑定到 metrics: metrics.scopeMetrics.flatMap(scopeMetric =>，负责共享工具在该局部场景下的响应。
      metrics: metrics.scopeMetrics.flatMap(scopeMetric =>
        // 调用 scopeMetric.metrics.map，触发共享工具此处需要的副作用。
        scopeMetric.metrics.map(metric => ({
          name: metric.descriptor.name,
          description: metric.descriptor.description,
          unit: metric.descriptor.unit,
          data_points: this.extractDataPoints(metric),
        })),
      ),
    }

    // 返回 `transformed`，作为共享工具这次计算的结果。
    return transformed
  }

  // 共享工具 bigquery Exporter在这里处理 `private extractDataPoints(metric: MetricData): DataPoint[] {`，完成这一小步状态转换。
  private extractDataPoints(metric: MetricData): DataPoint[] {
    // dataPoints 集合标记共享工具 bigquery Exporter是否启用对应路径。
    const dataPoints = metric.dataPoints || []

    // 返回 `dataPoints`，作为共享工具这次计算的结果。
    return dataPoints
      .filter(
        // 这个回调绑定到 (point): point is OTelDataPoint<number> =>，负责共享工具在该局部场景下的响应。
        (point): point is OTelDataPoint<number> =>
          typeof point.value === 'number',
      )
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(point => ({
        attributes: this.convertAttributes(point.attributes),
        value: point.value,
        timestamp: this.hrTimeToISOString(
          point.endTime || point.startTime || [Date.now() / 1000, 0],
        ),
      }))
  }

  // shutdown 使用 无 完成共享工具里的对应操作。
  async shutdown(): Promise<void> {
    // 更新实例字段 isShutdown 为 true，同步共享工具的内部状态。
    this.isShutdown = true
    // 等待 `this.forceFlush()` 完成，再继续共享工具 bigquery Exporter的异步流程。
    await this.forceFlush()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('BigQuery metrics exporter shutdown complete')
  }

  // forceFlush 使用 无 完成共享工具里的对应操作。
  async forceFlush(): Promise<void> {
    // 等待 `Promise.all(this.pendingExports)` 完成，再继续共享工具 bigquery Exporter的异步流程。
    await Promise.all(this.pendingExports)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('BigQuery metrics exporter flush complete')
  }

  // 共享工具 bigquery Exporter在这里处理 `private convertAttributes(`，完成这一小步状态转换。
  private convertAttributes(
    attributes: Attributes | undefined,
  ): Record<string, string> {
    // 结果 从空对象开始收集键值，后续按名称补齐内容。
    const result: Record<string, string> = {}
    // 满足 `attributes` 时，共享工具执行该分支。
    if (attributes) {
      // 循环处理 `const [key, value] of Object.entries(attributes)`，让共享工具把同类条目按顺序走完。
      for (const [key, value] of Object.entries(attributes)) {
        // `value` 与 `undefined && value !== null` 不一致时刷新派生状态，避免使用过期结果。
        if (value !== undefined && value !== null) {
          // result[key更新为 `String(value)`，确保共享工具 bigquery Exporter后续读取最新状态。
          result[key] = String(value)
        }
      }
    }
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }

  // 共享工具 bigquery Exporter在这里处理 `private hrTimeToISOString(hrTime: HrTime): string {`，完成这一小步状态转换。
  private hrTimeToISOString(hrTime: HrTime): string {
    // 从 `hrTime` 按位置拆出 seconds、nanoseconds，让共享工具 bigquery Exporter分别处理这些返回值。
    const [seconds, nanoseconds] = hrTime
    // date记录时间`Date`，供共享工具后续处理使用。
    const date = new Date(seconds * 1000 + nanoseconds / 1000000)
    // 返回 `date.toISOString()`，作为共享工具这次计算的结果。
    return date.toISOString()
  }

  // selectAggregationTemporality 使用 无 完成共享工具里的对应操作。
  selectAggregationTemporality(): AggregationTemporality {
    // DO NOT CHANGE THIS TO CUMULATIVE
    // It would mess up the aggregation of metrics
    // for CC Productivity metrics dashboard
    // 返回 `AggregationTemporality.DELTA`，作为共享工具这次计算的结果。
    return AggregationTemporality.DELTA
  }
}
