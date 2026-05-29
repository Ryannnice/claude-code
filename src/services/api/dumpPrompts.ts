// 类型依赖 { ClientOptions } 来自 @anthropic-ai/sdk，用于校准API 服务 dump Prompts的数据契约。
import type { ClientOptions } from '@anthropic-ai/sdk'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { promises as fs } from 'fs'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 getSessionId，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from 'src/bootstrap/state.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'

// hashString 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hashString(str: string): string {
  // 返回 `createHash('sha256').update(str).digest('hex')`，作为API 服务 dump Prompts这次计算的结果。
  return createHash('sha256').update(str).digest('hex')
}

// Cache last few API requests for ant users (e.g., for /issue command)
// MAX_CACHED_REQUESTS 请求数据保存`5`，供API 服务 dump Prompts后续判断或输出使用。
const MAX_CACHED_REQUESTS = 5
// cachedApiRequests 请求数据 从空数组开始收集，后续循环会按处理顺序追加条目。
const cachedApiRequests: Array<{ timestamp: string; request: unknown }> = []

// DumpState 固化API 服务 dump Prompts里传递的数据形状，帮助调用方按同一结构读写字段。
type DumpState = {
  initialized: boolean
  messageCountSeen: number
  lastInitDataHash: string
  // Cheap proxy for change detection — skips the expensive stringify+hash
  // when model/tools/system are structurally identical to the last call.
  lastInitFingerprint: string
}

// Track state per session to avoid duplicating data
// dumpState 状态构建`new Map<string, DumpState>()`，供后续判断或组装使用。
const dumpState = new Map<string, DumpState>()

// getLastApiRequests 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastApiRequests(): Array<{
  timestamp: string
  request: unknown
}> {
  // 返回列表结果，保留API 服务 dump Prompts已经排好的条目顺序。
  return [...cachedApiRequests]
}

// clearApiRequestCache 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearApiRequestCache(): void {
  // cachedApiRequests 请求数据被清空，API 服务从干净状态继续。
  cachedApiRequests.length = 0
}

// clearDumpState 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearDumpState(agentIdOrSessionId: string): void {
  // 调用 dumpState.delete，触发API 服务 dump Prompts此处需要的副作用。
  dumpState.delete(agentIdOrSessionId)
}

// clearAllDumpState 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAllDumpState(): void {
  // 调用 dumpState.clear，触发API 服务 dump Prompts此处需要的副作用。
  dumpState.clear()
}

// addApiRequestToCache 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addApiRequestToCache(requestData: unknown): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') return
  // cachedApiRequests 请求数据追加新条目，保持收集顺序与输入顺序一致。
  cachedApiRequests.push({
    timestamp: new Date().toISOString(),
    request: requestData,
  })
  // 满足 `cachedApiRequests.length > MAX_CACHED_REQUESTS` 时，API 服务 dump Prompts执行该分支。
  if (cachedApiRequests.length > MAX_CACHED_REQUESTS) {
    // 调用 cachedApiRequests.shift，触发API 服务 dump Prompts此处需要的副作用。
    cachedApiRequests.shift()
  }
}

// getDumpPromptsPath 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDumpPromptsPath(agentIdOrSessionId?: string): string {
  // 返回 `join(`，作为API 服务 dump Prompts这次计算的结果。
  return join(
    getClaudeConfigHomeDir(),
    'dump-prompts',
    `${agentIdOrSessionId ?? getSessionId()}.jsonl`,
  )
}

// appendToFile 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function appendToFile(filePath: string, entries: string[]): void {
  // entries 集合为空时立即返回或跳过，避免API 服务 dump Prompts把空集合当成可处理内容。
  if (entries.length === 0) return
  // 调用 fs.mkdir，触发API 服务 dump Prompts此处需要的副作用。
  fs.mkdir(dirname(filePath), { recursive: true })
    .then(() => fs.appendFile(filePath, entries.join('\n') + '\n'))
    .catch(() => {})
}

// initFingerprint 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function initFingerprint(req: Record<string, unknown>): string {
  // tools 集合保存`req.tools as Array<{ name?: string }> | undefined`，供API 服务 dump Prompts后续判断或输出使用。
  const tools = req.tools as Array<{ name?: string }> | undefined
  // system保存`req.system as unknown[] | string | undefined`，供后续判断或组装使用。
  const system = req.system as unknown[] | string | undefined
  // sysLen 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const sysLen =
    typeof system === 'string'
      ? system.length
      : Array.isArray(system)
        ? system.reduce(
            // 这个回调绑定到 (n: number, b) => n + ((b as { text?: string }).text?.length ?? 0),，负责API 服务 dump Prompts在该局部场景下的响应。
            (n: number, b) => n + ((b as { text?: string }).text?.length ?? 0),
            0,
          )
        : 0
  // toolNames 集合派生`map`，供API 服务 dump Prompts后续处理使用。
  const toolNames = tools?.map(t => t.name ?? '').join(',') ?? ''
  // 返回 ``${req.model}|${toolNames}|${sysLen}``，作为API 服务 dump Prompts这次计算的结果。
  return `${req.model}|${toolNames}|${sysLen}`
}

// dumpRequest 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function dumpRequest(
  body: string,
  ts: string,
  state: DumpState,
  filePath: string,
): void {
  // 保护这一段可能失败的API 服务 dump Prompts操作，确保异常能进入相邻错误处理。
  try {
    // req解析`jsonParse`，供API 服务 dump Prompts后续处理使用。
    const req = jsonParse(body) as Record<string, unknown>
    // 调用 addApiRequestToCache，触发API 服务 dump Prompts此处需要的副作用。
    addApiRequestToCache(req)

    // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
    if (process.env.USER_TYPE !== 'ant') return
    // entries 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const entries: string[] = []
    // 对话消息保存`(req.messages ?? []) as Array<{ role?: string }>`，供后续判断或组装使用。
    const messages = (req.messages ?? []) as Array<{ role?: string }>

    // Write init data (system, tools, metadata) on first request,
    // and a system_update entry whenever it changes.
    // Cheap fingerprint first: system+tools don't change between turns,
    // so skip the 300ms stringify when the shape is unchanged.
    // fingerprint保存`initFingerprint`，供API 服务 dump Prompts后续处理使用。
    const fingerprint = initFingerprint(req)
    // `!state.initialized || fingerprint` 与 `state.lastI` 不一致时刷新派生状态，避免使用过期结果。
    if (!state.initialized || fingerprint !== state.lastInitFingerprint) {
      // 从 `req` 解构 messages、其余 initData，减少API 服务 dump Prompts对同一对象的重复访问。
      const { messages: _, ...initData } = req
      // initDataStr保存`jsonStringify`，供API 服务 dump Prompts后续处理使用。
      const initDataStr = jsonStringify(initData)
      // initDataHash保存`hashString`，供API 服务 dump Prompts后续处理使用。
      const initDataHash = hashString(initDataStr)
      // lastInitFingerprint更新为 `fingerprint`，确保API 服务后续读取最新状态。
      state.lastInitFingerprint = fingerprint
      // state.initialized 状态缺失时提前走兜底路径，避免API 服务 dump Prompts继续依赖无效输入。
      if (!state.initialized) {
        // initialized更新为 `true`，确保API 服务后续读取最新状态。
        state.initialized = true
        // lastInitDataHash更新为 `initDataHash`，确保API 服务后续读取最新状态。
        state.lastInitDataHash = initDataHash
        // Reuse initDataStr rather than re-serializing initData inside a wrapper.
        // timestamp from toISOString() contains no chars needing JSON escaping.
        // entries 集合追加新条目，保持收集顺序与输入顺序一致。
        entries.push(
          `{"type":"init","timestamp":"${ts}","data":${initDataStr}}`,
        )
      // API 服务 dump Prompts在这里处理 `} else if (initDataHash !== state.lastInitDataHash) {`，完成这一小步状态转换。
      } else if (initDataHash !== state.lastInitDataHash) {
        // lastInitDataHash更新为 `initDataHash`，确保API 服务后续读取最新状态。
        state.lastInitDataHash = initDataHash
        // entries 集合追加新条目，保持收集顺序与输入顺序一致。
        entries.push(
          `{"type":"system_update","timestamp":"${ts}","data":${initDataStr}}`,
        )
      }
    }

    // Write only new user messages (assistant messages captured in response)
    // 逐项读取 `messages.slice(state.messageCountSeen)` 中的消息，按输入顺序推进API 服务 dump Prompts。
    for (const msg of messages.slice(state.messageCountSeen)) {
      // 当 `msg.role` 匹配 `'user'` 时，API 服务 dump Prompts执行对应分支。
      if (msg.role === 'user') {
        // entries 集合追加新条目，保持收集顺序与输入顺序一致。
        entries.push(
          jsonStringify({ type: 'message', timestamp: ts, data: msg }),
        )
      }
    }
    // messageCountSeen 消息数据更新为 `messages.length`，确保API 服务后续读取最新状态。
    state.messageCountSeen = messages.length

    // 调用 appendToFile，触发API 服务 dump Prompts此处需要的副作用。
    appendToFile(filePath, entries)
  } catch {
    // Ignore parsing errors
  }
}

// createDumpPromptsFetch 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createDumpPromptsFetch(
  agentIdOrSessionId: string,
): ClientOptions['fetch'] {
  // 文件路径读取`getDumpPromptsPath`，供API 服务 dump Prompts后续处理使用。
  const filePath = getDumpPromptsPath(agentIdOrSessionId)

  // 返回 `async (input: RequestInfo | URL, init?: RequestInit) => {`，作为API 服务 dump Prompts这次计算的结果。
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    // 状态读取`dumpState.get`，供API 服务 dump Prompts后续处理使用。
    const state = dumpState.get(agentIdOrSessionId) ?? {
      initialized: false,
      messageCountSeen: 0,
      lastInitDataHash: '',
      lastInitFingerprint: '',
    }
    // dumpState.set 写入新的状态值，使API 服务 dump Prompts后续读取保持一致。
    dumpState.set(agentIdOrSessionId, state)

    // timestamp 先占位，稍后的条件分支会根据实际输入补齐它。
    let timestamp: string | undefined

    // 组合条件 `init?.method === 'POST' && init.body` 成立时，API 服务 dump Prompts才启用这条专门路径。
    if (init?.method === 'POST' && init.body) {
      // timestamp更新为 `new Date().toISOString()`，确保API 服务后续读取最新状态。
      timestamp = new Date().toISOString()
      // Parsing + stringifying the request (system prompt + tool schemas = MBs)
      // takes hundreds of ms. Defer so it doesn't block the actual API call —
      // this is debug tooling for /issue, not on the critical path.
      // setImmediate 写入新的状态值，使API 服务 dump Prompts后续读取保持一致。
      setImmediate(dumpRequest, init.body as string, timestamp, state, filePath)
    }

    // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
    // 接口响应读取`globalThis.fetch`，供API 服务 dump Prompts后续处理使用。
    const response = await globalThis.fetch(input, init)

    // Save response async
    // 组合条件 `timestamp && response.ok && process.env.USER_TYPE` 成立时，API 服务 dump Prompts才启用这条专门路径。
    if (timestamp && response.ok && process.env.USER_TYPE === 'ant') {
      // cloned保存`response.clone`，供API 服务 dump Prompts后续处理使用。
      const cloned = response.clone()
      // 调用 void，触发API 服务 dump Prompts此处需要的副作用。
      void (async () => {
        // 保护这一段可能失败的API 服务 dump Prompts操作，确保异常能进入相邻错误处理。
        try {
          // isStreaming标记API 服务 dump Prompts是否启用对应路径。
          const isStreaming = cloned.headers
            .get('content-type')
            ?.includes('text/event-stream')

          // data 先占位，稍后的条件分支会根据实际输入补齐它。
          let data: unknown
          // 组合条件 `isStreaming && cloned.body` 成立时，API 服务 dump Prompts才启用这条专门路径。
          if (isStreaming && cloned.body) {
            // Parse SSE stream into chunks
            // reader读取`body.getReader`，供API 服务 dump Prompts后续处理使用。
            const reader = cloned.body.getReader()
            // decoder保存`TextDecoder`，供API 服务 dump Prompts后续处理使用。
            const decoder = new TextDecoder()
            // buffer固定为 `''`，作为API 服务 dump Prompts后续展示或比较的基准。
            let buffer = ''
            // 保护这一段可能失败的API 服务 dump Prompts操作，确保异常能进入相邻错误处理。
            try {
              // while 使用 true 完成API 服务 dump Prompts里的对应操作。
              while (true) {
                // 从 `await reader.read()` 解构 done、value，减少API 服务 dump Prompts对同一对象的重复访问。
                const { done, value } = await reader.read()
                // 满足 `done` 时，API 服务 dump Prompts执行该分支。
                if (done) break
                // API 服务 dump Prompts在这里处理 `buffer += decoder.decode(value, { stream: true })`，完成这一小步状态转换。
                buffer += decoder.decode(value, { stream: true })
              }
            } finally {
              // 调用 reader.releaseLock，触发API 服务 dump Prompts此处需要的副作用。
              reader.releaseLock()
            }
            // 输入块 从空数组开始收集，后续循环会按处理顺序追加条目。
            const chunks: unknown[] = []
            // 逐项读取 `buffer.split('\n\n')` 中的event，按输入顺序推进API 服务 dump Prompts。
            for (const event of buffer.split('\n\n')) {
              // 逐项读取 `event.split('\n')` 中的line，按输入顺序推进API 服务 dump Prompts。
              for (const line of event.split('\n')) {
                // `line.startsWith('data: ') && line` 与 `'data: [DONE]'` 不一致时刷新派生状态，避免使用过期结果。
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  // 保护这一段可能失败的API 服务 dump Prompts操作，确保异常能进入相邻错误处理。
                  try {
                    // 输入块追加新条目，保持收集顺序与输入顺序一致。
                    chunks.push(jsonParse(line.slice(6)))
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }
            // data更新为 `{ stream: true, chunks }`，确保API 服务后续读取最新状态。
            data = { stream: true, chunks }
          } else {
            // data更新为 `await cloned.json()`，确保API 服务后续读取最新状态。
            data = await cloned.json()
          }

          // 等待 `fs.appendFile(` 完成，再继续API 服务 dump Prompts的异步流程。
          await fs.appendFile(
            filePath,
            jsonStringify({ type: 'response', timestamp, data }) + '\n',
          )
        } catch {
          // Best effort
        }
      })()
    }

    // 返回 `response`，作为API 服务 dump Prompts这次计算的结果。
    return response
  }
}
