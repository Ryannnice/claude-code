// 类型依赖 { BetaContentBlock } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准服务层 vcr的数据契约。
import type { BetaContentBlock } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash, randomUUID, type UUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, writeFile } from 'fs/promises'
// 引入 isPlainObject，将 lodash-es/isPlainObject.js 中已经封装好的能力接到本文件流程里。
import isPlainObject from 'lodash-es/isPlainObject.js'
// 引入 mapValues，将 lodash-es/mapValues.js 中已经封装好的能力接到本文件流程里。
import mapValues from 'lodash-es/mapValues.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 addToTotalSessionCost，将 src/cost-tracker.js 中已经封装好的能力接到本文件流程里。
import { addToTotalSessionCost } from 'src/cost-tracker.js'
// 复用 calculateUSDCost 工具函数，把通用处理留在 src/utils/modelCost.js 中维护。
import { calculateUSDCost } from 'src/utils/modelCost.js'
// 整理这一组导入，让服务层 vcr后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  Message,
  StreamEvent,
  SystemAPIErrorMessage,
  UserMessage,
} from '../types/message.js'
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js'
// 复用 env 工具函数，把通用处理留在 ../utils/env.js 中维护。
import { env } from '../utils/env.js'
// 复用 getClaudeConfigHomeDir、isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir, isEnvTruthy } from '../utils/envUtils.js'
// 复用 getErrnoCode 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { getErrnoCode } from '../utils/errors.js'
// 复用 normalizeMessagesForAPI 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { normalizeMessagesForAPI } from '../utils/messages.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../utils/slowOperations.js'

// shouldUseVCR 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldUseVCR(): boolean {
  // 当 `process.env.NODE_ENV` 匹配 `'test'` 时，服务层 vcr执行对应分支。
  if (process.env.NODE_ENV === 'test') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 组合条件 `process.env.USER_TYPE === 'ant' && isEnvTruthy(process.env.FORCE_VCR)` 成立时，服务层 vcr才启用这条专门路径。
  if (process.env.USER_TYPE === 'ant' && isEnvTruthy(process.env.FORCE_VCR)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Generic fixture management helper
 * Handles caching, reading, writing fixtures for any data type
 */
// withFixture 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function withFixture<T>(
  input: unknown,
  fixtureName: string,
  // 这个回调绑定到 f: () => Promise<T>,，负责服务层 vcr在该局部场景下的响应。
  f: () => Promise<T>,
): Promise<T> {
  // 满足 `!shouldUseVCR()` 时，服务层 vcr执行该分支。
  if (!shouldUseVCR()) {
    // 等待并返回 `f()`，调用方直接接收异步结果。
    return await f()
  }

  // Create hash of input for fixture filename
  // hash构建`createHash`，供服务层 vcr后续处理使用。
  const hash = createHash('sha1')
    .update(jsonStringify(input))
    .digest('hex')
    .slice(0, 12)
  // filename 文件数据格式化`join`，供服务层 vcr后续处理使用。
  const filename = join(
    process.env.CLAUDE_CODE_TEST_FIXTURES_ROOT ?? getCwd(),
    `fixtures/${fixtureName}-${hash}.json`,
  )

  // Fetch cached fixture
  // 保护这一段可能失败的服务层 vcr操作，确保异常能进入相邻错误处理。
  try {
    // cached 缓存解析`jsonParse`，供服务层 vcr后续处理使用。
    const cached = jsonParse(
      await readFile(filename, { encoding: 'utf8' }),
    ) as T
    // 返回 `cached`，作为服务层 vcr这次计算的结果。
    return cached
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供服务层 vcr后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT') {
      // 抛出 e，阻止服务层 vcr在无效状态下继续运行。
      throw e
    }
  }

  // 组合条件 `(env.isCI || process.env.CI) && !isEnvTruthy(process.env.VCR_RECORD)` 成立时，服务层 vcr才启用这条专门路径。
  if ((env.isCI || process.env.CI) && !isEnvTruthy(process.env.VCR_RECORD)) {
    // 抛出 new Error(，阻止服务层 vcr在无效状态下继续运行。
    throw new Error(
      `Fixture missing: ${filename}. Re-run tests with VCR_RECORD=1, then commit the result.`,
    )
  }

  // Create & write new fixture
  // 结果保存`f`，供服务层 vcr后续处理使用。
  const result = await f()

  // 等待 `mkdir(dirname(filename), { recursive: true })` 完成，再继续服务层 vcr的异步流程。
  await mkdir(dirname(filename), { recursive: true })
  // 等待 `writeFile(filename, jsonStringify(result, null, 2), {` 完成，再继续服务层 vcr的异步流程。
  await writeFile(filename, jsonStringify(result, null, 2), {
    encoding: 'utf8',
  })

  // 返回 `result`，作为服务层 vcr这次计算的结果。
  return result
}

// withVCR 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function withVCR(
  messages: Message[],
  // 这个回调绑定到 f: () => Promise<(AssistantMessage | StreamEvent | SystemAPIErrorMessage)[]>,，负责服务层 vcr在该局部场景下的响应。
  f: () => Promise<(AssistantMessage | StreamEvent | SystemAPIErrorMessage)[]>,
): Promise<(AssistantMessage | StreamEvent | SystemAPIErrorMessage)[]> {
  // 满足 `!shouldUseVCR()` 时，服务层 vcr执行该分支。
  if (!shouldUseVCR()) {
    // 等待并返回 `f()`，调用方直接接收异步结果。
    return await f()
  }

  // messagesForAPI 消息数据保存`normalizeMessagesForAPI`，供服务层 vcr后续处理使用。
  const messagesForAPI = normalizeMessagesForAPI(
    // 调用 messages.filter，触发服务层 vcr此处需要的副作用。
    messages.filter(_ => {
      // `_.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
      if (_.type !== 'user') {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
      // 满足 `_.isMeta` 时，服务层 vcr执行该分支。
      if (_.isMeta) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }),
  )

  // dehydratedInput派生`mapMessages`，供服务层 vcr后续处理使用。
  const dehydratedInput = mapMessages(
    // 调用 messagesForAPI.map，触发服务层 vcr此处需要的副作用。
    messagesForAPI.map(_ => _.message.content),
    dehydrateValue,
  )
  // filename 文件数据格式化`join`，供服务层 vcr后续处理使用。
  const filename = join(
    process.env.CLAUDE_CODE_TEST_FIXTURES_ROOT ?? getCwd(),
    // 这个回调绑定到 `fixtures/${dehydratedInput.map(_ => createHash('sha1').update(jsonStringify(_)).dig…，负责服务层 vcr在该局部场景下的响应。
    `fixtures/${dehydratedInput.map(_ => createHash('sha1').update(jsonStringify(_)).digest('hex').slice(0, 6)).join('-')}.json`,
  )

  // Fetch cached fixture
  // 保护这一段可能失败的服务层 vcr操作，确保异常能进入相邻错误处理。
  try {
    // cached 缓存解析`jsonParse`，供服务层 vcr后续处理使用。
    const cached = jsonParse(
      await readFile(filename, { encoding: 'utf8' }),
    ) as { output: (AssistantMessage | StreamEvent)[] }
    // 调用 cached.output.forEach，触发服务层 vcr此处需要的副作用。
    cached.output.forEach(addCachedCostToTotalSessionCost)
    // 返回 `cached.output.map((message, index) =>`，作为服务层 vcr这次计算的结果。
    return cached.output.map((message, index) =>
      mapMessage(message, hydrateValue, index, randomUUID()),
    )
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供服务层 vcr后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT') {
      // 抛出 e，阻止服务层 vcr在无效状态下继续运行。
      throw e
    }
  }

  // 组合条件 `env.isCI && !isEnvTruthy(process.env.VCR_RECORD)` 成立时，服务层 vcr才启用这条专门路径。
  if (env.isCI && !isEnvTruthy(process.env.VCR_RECORD)) {
    // 抛出 new Error(，阻止服务层 vcr在无效状态下继续运行。
    throw new Error(
      `Anthropic API fixture missing: ${filename}. Re-run tests with VCR_RECORD=1, then commit the result. Input messages:\n${jsonStringify(dehydratedInput, null, 2)}`,
    )
  }

  // Create & write new fixture
  // 结果列表保存`f`，供服务层 vcr后续处理使用。
  const results = await f()
  // 组合条件 `env.isCI && !isEnvTruthy(process.env.VCR_RECORD)` 成立时，服务层 vcr才启用这条专门路径。
  if (env.isCI && !isEnvTruthy(process.env.VCR_RECORD)) {
    // 返回 `results`，作为服务层 vcr这次计算的结果。
    return results
  }

  // 等待 `mkdir(dirname(filename), { recursive: true })` 完成，再继续服务层 vcr的异步流程。
  await mkdir(dirname(filename), { recursive: true })
  // 等待 `writeFile(` 完成，再继续服务层 vcr的异步流程。
  await writeFile(
    filename,
    jsonStringify(
      {
        input: dehydratedInput,
        // 这个回调绑定到 output: results.map((message, index) =>，负责服务层 vcr在该局部场景下的响应。
        output: results.map((message, index) =>
          mapMessage(message, dehydrateValue, index),
        ),
      },
      null,
      2,
    ),
    { encoding: 'utf8' },
  )
  // 返回 `results`，作为服务层 vcr这次计算的结果。
  return results
}

// addCachedCostToTotalSessionCost 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addCachedCostToTotalSessionCost(
  message: AssistantMessage | StreamEvent,
): void {
  // 当 `message.type` 匹配 `'stream_event'` 时，服务层 vcr执行对应分支。
  if (message.type === 'stream_event') {
    // 服务层 vcr在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 模型名称保存`message.message.model`，供服务层 vcr后续判断或输出使用。
  const model = message.message.model
  // usage 命名 `message.message.usage`，让后续代码直接表达这个值的用途。
  const usage = message.message.usage
  // costUSD保存`calculateUSDCost`，供服务层 vcr后续处理使用。
  const costUSD = calculateUSDCost(model, usage)
  // 调用 addToTotalSessionCost，触发服务层 vcr此处需要的副作用。
  addToTotalSessionCost(costUSD, usage, model)
}

// mapMessages 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mapMessages(
  // 服务层 vcr在这里处理 `messages: (UserMessage | AssistantMessage)['message']['content'][]`，完成这一小步状态转换。
  messages: (UserMessage | AssistantMessage)['message']['content'][],
  // 这个回调绑定到 f: (s: unknown) => unknown,，负责服务层 vcr在该局部场景下的响应。
  f: (s: unknown) => unknown,
): (UserMessage | AssistantMessage)['message']['content'][] {
  // 返回 `messages.map(_ => {`，作为服务层 vcr这次计算的结果。
  return messages.map(_ => {
    // 当 `typeof _` 匹配 `'string'` 时，服务层 vcr执行对应分支。
    if (typeof _ === 'string') {
      // 返回 `f(_)`，作为服务层 vcr这次计算的结果。
      return f(_)
    }
    // 返回 `_.map(_ => {`，作为服务层 vcr这次计算的结果。
    return _.map(_ => {
      // 按照 _.type 的取值选择服务层 vcr的具体处理分支。
      switch (_.type) {
        case 'tool_result':
          // 当 `typeof _.content` 匹配 `'string'` 时，服务层 vcr执行对应分支。
          if (typeof _.content === 'string') {
            // 返回结构化结果，集中表达服务层 vcr已经整理出的状态。
            return { ..._, content: f(_.content) }
          }
          // 满足 `Array.isArray(_.content)` 时，服务层 vcr执行该分支。
          if (Array.isArray(_.content)) {
            // 返回结构化结果，集中表达服务层 vcr已经整理出的状态。
            return {
              ..._,
              // 这个回调绑定到 content: _.content.map(_ => {，负责服务层 vcr在该局部场景下的响应。
              content: _.content.map(_ => {
                // 按照 _.type 的取值选择服务层 vcr的具体处理分支。
                switch (_.type) {
                  case 'text':
                    // 返回结构化结果，集中表达服务层 vcr已经整理出的状态。
                    return { ..._, text: f(_.text) }
                  case 'image':
                    // 返回 `_`，作为服务层 vcr这次计算的结果。
                    return _
                  default:
                    // 返回 `undefined`，作为服务层 vcr这次计算的结果。
                    return undefined
                }
              }),
            }
          }
          // 返回 `_`，作为服务层 vcr这次计算的结果。
          return _
        case 'text':
          // 返回结构化结果，集中表达服务层 vcr已经整理出的状态。
          return { ..._, text: f(_.text) }
        case 'tool_use':
          // 返回结构化结果，集中表达服务层 vcr已经整理出的状态。
          return {
            ..._,
            input: mapValuesDeep(_.input as Record<string, unknown>, f),
          }
        case 'image':
          // 返回 `_`，作为服务层 vcr这次计算的结果。
          return _
        default:
          // 返回 `undefined`，作为服务层 vcr这次计算的结果。
          return undefined
      }
    })
  }) as (UserMessage | AssistantMessage)['message']['content'][]
}

// mapValuesDeep 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mapValuesDeep(
  obj: {
    [x: string]: unknown
  },
  // 这个回调绑定到 f: (val: unknown, key: string, obj: Record<string, unknown>) => unknown,，负责服务层 vcr在该局部场景下的响应。
  f: (val: unknown, key: string, obj: Record<string, unknown>) => unknown,
): Record<string, unknown> {
  // 返回 `mapValues(obj, (val, key) => {`，作为服务层 vcr这次计算的结果。
  return mapValues(obj, (val, key) => {
    // 满足 `Array.isArray(val)` 时，服务层 vcr执行该分支。
    if (Array.isArray(val)) {
      // 返回 `val.map(_ => mapValuesDeep(_, f))`，作为服务层 vcr这次计算的结果。
      return val.map(_ => mapValuesDeep(_, f))
    }
    // 满足 `isPlainObject(val)` 时，服务层 vcr执行该分支。
    if (isPlainObject(val)) {
      // 返回 `mapValuesDeep(val as Record<string, unknown>, f)`，作为服务层 vcr这次计算的结果。
      return mapValuesDeep(val as Record<string, unknown>, f)
    }
    // 返回 `f(val, key, obj)`，作为服务层 vcr这次计算的结果。
    return f(val, key, obj)
  })
}

// mapAssistantMessage 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mapAssistantMessage(
  message: AssistantMessage,
  // 这个回调绑定到 f: (s: unknown) => unknown,，负责服务层 vcr在该局部场景下的响应。
  f: (s: unknown) => unknown,
  index: number,
  uuid?: UUID,
): AssistantMessage {
  // 返回结构化结果，集中表达服务层 vcr已经整理出的状态。
  return {
    // Use provided UUID if given (hydrate path uses randomUUID for globally unique IDs),
    // otherwise fall back to deterministic index-based UUID (dehydrate/fixture path).
    // sessionStorage.ts deduplicates messages by UUID, so without unique UUIDs across
    // VCR calls, resumed sessions would treat different responses as duplicates.
    uuid: uuid ?? (`UUID-${index}` as unknown as UUID),
    requestId: 'REQUEST_ID',
    timestamp: message.timestamp,
    message: {
      ...message.message,
      content: message.message.content
        // 链式调用 map，继续加工上一行在服务层 vcr中产生的数据。
        .map(_ => {
          // 按照 _.type 的取值选择服务层 vcr的具体处理分支。
          switch (_.type) {
            case 'text':
              // 返回结构化结果，集中表达服务层 vcr已经整理出的状态。
              return {
                ..._,
                text: f(_.text) as string,
                citations: _.citations || [],
              } // Ensure citations
            case 'tool_use':
              // 返回结构化结果，集中表达服务层 vcr已经整理出的状态。
              return {
                ..._,
                input: mapValuesDeep(_.input as Record<string, unknown>, f),
              }
            default:
              // 返回 `_ // Handle other block types unchanged`，作为服务层 vcr这次计算的结果。
              return _ // Handle other block types unchanged
          }
        })
        .filter(Boolean) as BetaContentBlock[],
    },
    type: 'assistant',
  }
}

// mapMessage 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mapMessage(
  message: AssistantMessage | SystemAPIErrorMessage | StreamEvent,
  // 这个回调绑定到 f: (s: unknown) => unknown,，负责服务层 vcr在该局部场景下的响应。
  f: (s: unknown) => unknown,
  index: number,
  uuid?: UUID,
): AssistantMessage | SystemAPIErrorMessage | StreamEvent {
  // 当 `message.type` 匹配 `'assistant'` 时，服务层 vcr执行对应分支。
  if (message.type === 'assistant') {
    // 返回 `mapAssistantMessage(message, f, index, uuid)`，作为服务层 vcr这次计算的结果。
    return mapAssistantMessage(message, f, index, uuid)
  } else {
    // 返回 `message`，作为服务层 vcr这次计算的结果。
    return message
  }
}

// dehydrateValue 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function dehydrateValue(s: unknown): unknown {
  // `typeof s` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof s !== 'string') {
    // 返回 `s`，作为服务层 vcr这次计算的结果。
    return s
  }
  // cwd读取`getCwd`，供服务层 vcr后续处理使用。
  const cwd = getCwd()
  // configHome 配置读取`getClaudeConfigHomeDir`，供服务层 vcr后续处理使用。
  const configHome = getClaudeConfigHomeDir()
  // s1保存`s`，供服务层 vcr后续判断或输出使用。
  let s1 = s
    .replace(/num_files="\d+"/g, 'num_files="[NUM]"')
    .replace(/duration_ms="\d+"/g, 'duration_ms="[DURATION]"')
    .replace(/cost_usd="\d+"/g, 'cost_usd="[COST]"')
    // Note: We intentionally don't replace all forward slashes with path.sep here.
    // That would corrupt XML-like tags (e.g., </system-reminder> -> <\system-reminder>).
    // The [CONFIG_HOME] and [CWD] replacements below handle path normalization.
    .replaceAll(configHome, '[CONFIG_HOME]')
    .replaceAll(cwd, '[CWD]')
    .replace(/Available commands:.+/, 'Available commands: [COMMANDS]')
  // On Windows, paths may appear in multiple forms:
  // 1. Forward-slash variants (Git, some Node APIs)
  // 2. JSON-escaped variants (backslashes doubled in serialized JSON within messages)
  // 当 `process.platform` 匹配 `'win32'` 时，服务层 vcr执行对应分支。
  if (process.platform === 'win32') {
    // cwdFwd格式化`cwd.replaceAll`，供服务层 vcr后续处理使用。
    const cwdFwd = cwd.replaceAll('\\', '/')
    // configHomeFwd 配置格式化`configHome.replaceAll`，供服务层 vcr后续处理使用。
    const configHomeFwd = configHome.replaceAll('\\', '/')
    // jsonStringify escapes \ to \\ - match paths embedded in JSON strings
    // cwdJsonEscaped保存`jsonStringify`，供服务层 vcr后续处理使用。
    const cwdJsonEscaped = jsonStringify(cwd).slice(1, -1)
    // configHomeJsonEscaped 配置保存`jsonStringify`，供服务层 vcr后续处理使用。
    const configHomeJsonEscaped = jsonStringify(configHome).slice(1, -1)
    // s1更新为 `s1`，确保服务层后续读取最新状态。
    s1 = s1
      .replaceAll(cwdJsonEscaped, '[CWD]')
      .replaceAll(configHomeJsonEscaped, '[CONFIG_HOME]')
      .replaceAll(cwdFwd, '[CWD]')
      .replaceAll(configHomeFwd, '[CONFIG_HOME]')
  }
  // Normalize backslash path separators after placeholders so VCR fixture
  // hashes match across platforms (e.g., [CWD]\foo\bar -> [CWD]/foo/bar)
  // Handle both single backslashes and JSON-escaped double backslashes (\\)
  // s1更新为 `s1`，确保服务层后续读取最新状态。
  s1 = s1
    // 链式调用 replace，继续加工上一行在服务层 vcr中产生的数据。
    .replace(/\[CWD\][^\s"'<>]*/g, match =>
      match.replaceAll('\\\\', '/').replaceAll('\\', '/'),
    )
    // 链式调用 replace，继续加工上一行在服务层 vcr中产生的数据。
    .replace(/\[CONFIG_HOME\][^\s"'<>]*/g, match =>
      match.replaceAll('\\\\', '/').replaceAll('\\', '/'),
    )
  // 判断 s1.includes('Files modified by user:')，将服务层 vcr分流到只适用于该条件的处理路径。
  if (s1.includes('Files modified by user:')) {
    // 返回 'Files modified by user: [FILES]'，把服务层 vcr这个分支的结果交还调用方。
    return 'Files modified by user: [FILES]'
  }
  // 返回 s1，把服务层 vcr这个分支的结果交还调用方。
  return s1
}

// hydrateValue 承担服务层 vcr中的独立步骤，串起服务层 vcr需要的输入整理、状态更新和结果输出。
function hydrateValue(s: unknown): unknown {
  // `typeof s` 与 `'string'` 不一致时刷新派生状态。
  if (typeof s !== 'string') {
    // 返回 s，把服务层 vcr这个分支的结果交还调用方。
    return s
  }
  // 返回 s，把服务层 vcr这个分支的结果交还调用方。
  return s
    .replaceAll('[NUM]', '1')
    .replaceAll('[DURATION]', '100')
    .replaceAll('[CONFIG_HOME]', getClaudeConfigHomeDir())
    .replaceAll('[CWD]', getCwd())
}

// 服务层 vcr处理 `export async function* withStreamingVCR(`，完成这一小步状态转换。
export async function* withStreamingVCR(
  messages: Message[],
  // 这个回调绑定到 f: () => AsyncGenerator<，负责服务层 vcr在该局部场景下的响应。
  f: () => AsyncGenerator<
    StreamEvent | AssistantMessage | SystemAPIErrorMessage,
    void
  >,
): AsyncGenerator<
  StreamEvent | AssistantMessage | SystemAPIErrorMessage,
  void
> {
  // 判断 !shouldUseVCR()，将服务层 vcr分流到只适用于该条件的处理路径。
  if (!shouldUseVCR()) {
    // 返回 yield* f()，把服务层 vcr这个分支的结果交还调用方。
    return yield* f()
  }

  // Compute and yield messages
  // 流事件缓冲区从空数组开始收集，后续按处理顺序追加条目。
  const buffer: (StreamEvent | AssistantMessage | SystemAPIErrorMessage)[] = []

  // Record messages (or fetch from cache)
  // VCR 缓存缓冲区保存`withVCR`，供服务层 vcr后续处理使用。
  const cachedBuffer = await withVCR(messages, async () => {
    // 遍历 const message of f()，逐项推进服务层 vcr里的批量处理。
    for await (const message of f()) {
      // 流事件缓冲区追加新条目，保持收集顺序与输入顺序一致。
      buffer.push(message)
    }
    // 返回 buffer，把服务层 vcr这个分支的结果交还调用方。
    return buffer
  })

  // 满足 `cachedBuffer.length > 0` 时，服务层 vcr执行该分支。
  if (cachedBuffer.length > 0) {
    // 把 `cachedBuffer` 继续产出给调用方。
    yield* cachedBuffer
    // 服务层 vcr在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 把 `buffer` 继续产出给调用方。
  yield* buffer
}

// withTokenCountVCR 承担服务层 vcr中的独立步骤，串起服务层 vcr需要的输入整理、状态更新和结果输出。
export async function withTokenCountVCR(
  messages: unknown[],
  tools: unknown[],
  f: () => Promise<number | null>,
): Promise<number | null> {
  // Dehydrate before hashing so fixture keys survive cwd/config-home/tempdir
  // variation and message UUID/timestamp churn. System prompts embed the
  // working directory (both raw and as a slash→dash project slug in the
  // auto-memory path) and messages carry fresh UUIDs per run; without this,
  // every test run produces a new hash and fixtures never hit in CI.
  // 当前目录 slug读取`getCwd`，供服务层 vcr后续处理使用。
  const cwdSlug = getCwd().replace(/[^a-zA-Z0-9]/g, '-')
  // 脱水后的 fixture 输入保存`(`，供服务层 vcr后续步骤使用。
  const dehydrated = (
    dehydrateValue(jsonStringify({ messages, tools })) as string
  )
    .replaceAll(cwdSlug, '[CWD_SLUG]')
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '[UUID]',
    )
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/g, '[TIMESTAMP]')
  // 结果保存`withFixture`，供服务层 vcr后续处理使用。
  const result = await withFixture(dehydrated, 'token-count', async () => ({
    tokenCount: await f(),
  }))
  // 返回 result.tokenCount，把服务层 vcr这个分支的结果交还调用方。
  return result.tokenCount
}
