// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 接入 getOrganizationUUID 服务层能力，把外部通信或共享状态交给 ../../services/oauth/client.js 处理。
import { getOrganizationUUID } from '../../services/oauth/client.js'
// 接入 isPolicyAllowed 服务层能力，把外部通信或共享状态交给 ../../services/policyLimits/index.js 处理。
import { isPolicyAllowed } from '../../services/policyLimits/index.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getClaudeAIOAuthTokens,
} from '../../utils/auth.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 引入 DESCRIPTION、PROMPT、REMOTE_TRIGGER_TOOL_NAME，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, PROMPT, REMOTE_TRIGGER_TOOL_NAME } from './prompt.js'
// 引入 renderToolResultMessage、renderToolUseMessage，将 ./UI.js 中已经封装好的能力接到本文件流程里。
import { renderToolResultMessage, renderToolUseMessage } from './UI.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    action: z.enum(['list', 'get', 'create', 'update', 'run']),
    trigger_id: z
      .string()
      .regex(/^[\w-]+$/)
      .optional()
      .describe('Required for get, update, and run'),
    body: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('JSON body for create and update'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>
// Input 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Input = z.infer<InputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    status: z.number(),
    json: z.string(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>
// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// TRIGGERS_BETA 命名 `'ccr-triggers-2026-01-30'`，让后续代码直接表达这个值的用途。
const TRIGGERS_BETA = 'ccr-triggers-2026-01-30'

// RemoteTriggerTool构建`buildTool`，供工具调用后续处理使用。
export const RemoteTriggerTool = buildTool({
  name: REMOTE_TRIGGER_TOOL_NAME,
  searchHint: 'manage scheduled remote agent triggers',
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  // 工具实现 Remote Trigger Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Remote Trigger Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // 返回 `(`，作为工具调用这次计算的结果。
    return (
      getFeatureValue_CACHED_MAY_BE_STALE('tengu_surreal_dali', false) &&
      isPolicyAllowed('allow_remote_sessions')
    )
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isReadOnly 用 input: Input 判断工具调用是否满足条件。
  isReadOnly(input: Input) {
    // 返回 `input.action === 'list' || input.action === 'get'`，作为工具调用这次计算的结果。
    return input.action === 'list' || input.action === 'get'
  },
  // toAutoClassifierInput 使用 input: Input 完成工具调用里的对应操作。
  toAutoClassifierInput(input: Input) {
    // 返回 ``RemoteTrigger ${input.action}${input.trigger_id ? ` ${input.trigger_id...`，作为工具调用这次计算的结果。
    return `RemoteTrigger ${input.action}${input.trigger_id ? ` ${input.trigger_id}` : ''}`
  },
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 `DESCRIPTION`，作为工具调用这次计算的结果。
    return DESCRIPTION
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // 返回 `PROMPT`，作为工具调用这次计算的结果。
    return PROMPT
  },
  // call 使用 input: Input, context: ToolUseContext 完成工具调用里的对应操作。
  async call(input: Input, context: ToolUseContext) {
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续工具实现 Remote Trigger Tool的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()
    // accessToken读取`getClaudeAIOAuthTokens`，供工具调用后续处理使用。
    const accessToken = getClaudeAIOAuthTokens()?.accessToken
    // accessToken缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!accessToken) {
      // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
      throw new Error(
        'Not authenticated with a claude.ai account. Run /login and try again.',
      )
    }
    // orgUUID读取`getOrganizationUUID`，供工具调用后续处理使用。
    const orgUUID = await getOrganizationUUID()
    // orgUUID缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!orgUUID) {
      // 抛出 new Error('Unable to resolve organization UUID.')，阻止工具调用在无效状态下继续运行。
      throw new Error('Unable to resolve organization UUID.')
    }

    // base读取`getOauthConfig`，供工具调用后续处理使用。
    const base = `${getOauthConfig().BASE_API_URL}/v1/code/triggers`
    // 请求头集中保存工具实现 Remote Trigger Tool要一起传递的字段。
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': TRIGGERS_BETA,
      'x-organization-uuid': orgUUID,
    }

    // 从 `input` 解构 action、trigger_id、body，减少工具实现 Remote Trigger Tool对同一对象的重复访问。
    const { action, trigger_id, body } = input
    // method 先占位，稍后的条件分支会根据实际输入补齐它。
    let method: 'GET' | 'POST'
    // URL 先占位，稍后的条件分支会根据实际输入补齐它。
    let url: string
    // data 先占位，稍后的条件分支会根据实际输入补齐它。
    let data: unknown
    // 按照 action 的取值选择工具调用的具体处理分支。
    switch (action) {
      case 'list':
        // method更新为 `'GET'`，确保工具调用后续读取最新状态。
        method = 'GET'
        // URL更新为 `base`，确保工具调用后续读取最新状态。
        url = base
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'get':
        // 满足 `!trigger_id) throw new Error('get requires trigger_id'` 时，工具调用执行该分支。
        if (!trigger_id) throw new Error('get requires trigger_id')
        // method更新为 `'GET'`，确保工具调用后续读取最新状态。
        method = 'GET'
        // URL更新为 ``${base}/${trigger_id}``，确保工具调用后续读取最新状态。
        url = `${base}/${trigger_id}`
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'create':
        // 满足 `!body) throw new Error('create requires body'` 时，工具调用执行该分支。
        if (!body) throw new Error('create requires body')
        // method更新为 `'POST'`，确保工具调用后续读取最新状态。
        method = 'POST'
        // URL更新为 `base`，确保工具调用后续读取最新状态。
        url = base
        // data更新为 `body`，确保工具调用后续读取最新状态。
        data = body
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'update':
        // 满足 `!trigger_id) throw new Error('update requires trigger_id'` 时，工具调用执行该分支。
        if (!trigger_id) throw new Error('update requires trigger_id')
        // 满足 `!body) throw new Error('update requires body'` 时，工具调用执行该分支。
        if (!body) throw new Error('update requires body')
        // method更新为 `'POST'`，确保工具调用后续读取最新状态。
        method = 'POST'
        // URL更新为 ``${base}/${trigger_id}``，确保工具调用后续读取最新状态。
        url = `${base}/${trigger_id}`
        // data更新为 `body`，确保工具调用后续读取最新状态。
        data = body
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      case 'run':
        // 满足 `!trigger_id) throw new Error('run requires trigger_id'` 时，工具调用执行该分支。
        if (!trigger_id) throw new Error('run requires trigger_id')
        // method更新为 `'POST'`，确保工具调用后续读取最新状态。
        method = 'POST'
        // URL更新为 ``${base}/${trigger_id}/run``，确保工具调用后续读取最新状态。
        url = `${base}/${trigger_id}/run`
        // data更新为 `{}`，确保工具调用后续读取最新状态。
        data = {}
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
    }

    // res 集合保存`axios.request`，供工具调用后续处理使用。
    const res = await axios.request({
      method,
      url,
      headers,
      data,
      timeout: 20_000,
      signal: context.abortController.signal,
      // 这个回调绑定到 validateStatus: () => true,，负责工具调用在该局部场景下的响应。
      validateStatus: () => true,
    })

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        status: res.status,
        json: jsonStringify(res.data),
      },
    }
  },
  // mapToolResultToToolResultBlockParam 使用 output, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `HTTP ${output.status}\n${output.json}`,
    }
  },
  renderToolUseMessage,
  renderToolResultMessage,
} satisfies ToolDef<InputSchema, Output>)
