// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js'
// 类型依赖 { PermissionUpdate } 来自 ../../types/permissions.js，用于校准工具调用的数据契约。
import type { PermissionUpdate } from '../../types/permissions.js'
// 复用 formatFileSize 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatFileSize } from '../../utils/format.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js'
// 复用 getRuleByContentsForTool 工具函数，把通用处理留在 ../../utils/permissions/permissions.js 中维护。
import { getRuleByContentsForTool } from '../../utils/permissions/permissions.js'
// 引入 isPreapprovedHost，将 ./preapproved.js 中已经封装好的能力接到本文件流程里。
import { isPreapprovedHost } from './preapproved.js'
// 引入 DESCRIPTION、WEB_FETCH_TOOL_NAME，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { DESCRIPTION, WEB_FETCH_TOOL_NAME } from './prompt.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  getToolUseSummary,
  renderToolResultMessage,
  renderToolUseMessage,
  renderToolUseProgressMessage,
} from './UI.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  applyPromptToMarkdown,
  type FetchedContent,
  getURLMarkdownContent,
  isPreapprovedUrl,
  MAX_MARKDOWN_LENGTH,
} from './utils.js'

// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    url: z.string().url().describe('The URL to fetch content from'),
    prompt: z.string().describe('The prompt to run on the fetched content'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    bytes: z.number().describe('Size of the fetched content in bytes'),
    code: z.number().describe('HTTP response code'),
    codeText: z.string().describe('HTTP response code text'),
    result: z
      .string()
      .describe('Processed result from applying the prompt to the content'),
    durationMs: z
      .number()
      .describe('Time taken to fetch and process the content'),
    url: z.string().describe('The URL that was fetched'),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>

// webFetchToolInputToPermissionRuleContent 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function webFetchToolInputToPermissionRuleContent(input: {
  [k: string]: unknown
}): string {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // parsedInput保存`inputSchema.safeParse`，供工具调用后续处理使用。
    const parsedInput = WebFetchTool.inputSchema.safeParse(input)
    // parsedInput.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!parsedInput.success) {
      // 返回 ``input:${input.toString()}``，作为工具调用这次计算的结果。
      return `input:${input.toString()}`
    }
    // 从 `parsedInput.data` 解构 url，减少工具实现 Web Fetch Tool对同一对象的重复访问。
    const { url } = parsedInput.data
    // hostname保存`URL`，供工具调用后续处理使用。
    const hostname = new URL(url).hostname
    // 返回 ``domain:${hostname}``，作为工具调用这次计算的结果。
    return `domain:${hostname}`
  } catch {
    // 返回 ``input:${input.toString()}``，作为工具调用这次计算的结果。
    return `input:${input.toString()}`
  }
}

// WebFetchTool构建`buildTool`，供工具调用后续处理使用。
export const WebFetchTool = buildTool({
  name: WEB_FETCH_TOOL_NAME,
  searchHint: 'fetch and extract content from a URL',
  // 100K chars - tool result persistence threshold
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  // description 使用 input 完成工具调用里的对应操作。
  async description(input) {
    // 从 `input as { url: string }` 解构 url，减少工具实现 Web Fetch Tool对同一对象的重复访问。
    const { url } = input as { url: string }
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // hostname保存`URL`，供工具调用后续处理使用。
      const hostname = new URL(url).hostname
      // 返回 ``Claude wants to fetch content from ${hostname}``，作为工具调用这次计算的结果。
      return `Claude wants to fetch content from ${hostname}`
    } catch {
      // 返回 ``Claude wants to fetch content from this URL``，作为工具调用这次计算的结果。
      return `Claude wants to fetch content from this URL`
    }
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回 `'Fetch'`，作为工具调用这次计算的结果。
    return 'Fetch'
  },
  getToolUseSummary,
  // getActivityDescription 根据 input 读取或计算工具调用需要的结果。
  getActivityDescription(input) {
    // summary读取`getToolUseSummary`，供工具调用后续处理使用。
    const summary = getToolUseSummary(input)
    // 返回 `summary ? `Fetching ${summary}` : 'Fetching web page'`，作为工具调用这次计算的结果。
    return summary ? `Fetching ${summary}` : 'Fetching web page'
  },
  // 工具实现 Web Fetch Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema()
  },
  // 工具实现 Web Fetch Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema()
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.prompt ? `${input.url}: ${input.prompt}` : input.url`，作为工具调用这次计算的结果。
    return input.prompt ? `${input.url}: ${input.prompt}` : input.url
  },
  // checkPermissions 使用 input, context 完成工具调用里的对应操作。
  async checkPermissions(input, context): Promise<PermissionDecision> {
    // appState 状态读取`context.getAppState`，供工具调用后续处理使用。
    const appState = context.getAppState()
    // permissionContext 权限数据保存`appState.toolPermissionContext`，供后续判断或组装使用。
    const permissionContext = appState.toolPermissionContext

    // Check if the hostname is in the preapproved list
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 从 `input as { url: string }` 解构 url，减少工具实现 Web Fetch Tool对同一对象的重复访问。
      const { url } = input as { url: string }
      // parsedUrl保存`URL`，供工具调用后续处理使用。
      const parsedUrl = new URL(url)
      // 满足 `isPreapprovedHost(parsedUrl.hostname, parsedUrl.pathname)` 时，工具调用执行该分支。
      if (isPreapprovedHost(parsedUrl.hostname, parsedUrl.pathname)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'allow',
          updatedInput: input,
          decisionReason: { type: 'other', reason: 'Preapproved host' },
        }
      }
    } catch {
      // If URL parsing fails, continue with normal permission checks
    }

    // Check for a rule specific to the tool input (matching hostname)
    // ruleContent保存`webFetchToolInputToPermissionRuleContent`，供工具调用后续处理使用。
    const ruleContent = webFetchToolInputToPermissionRuleContent(input)

    // denyRule读取`getRuleByContentsForTool`，供工具调用后续处理使用。
    const denyRule = getRuleByContentsForTool(
      permissionContext,
      WebFetchTool,
      'deny',
    ).get(ruleContent)
    // 满足 `denyRule` 时，工具调用执行该分支。
    if (denyRule) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'deny',
        message: `${WebFetchTool.name} denied access to ${ruleContent}.`,
        decisionReason: {
          type: 'rule',
          rule: denyRule,
        },
      }
    }

    // askRule读取`getRuleByContentsForTool`，供工具调用后续处理使用。
    const askRule = getRuleByContentsForTool(
      permissionContext,
      WebFetchTool,
      'ask',
    ).get(ruleContent)
    // 满足 `askRule` 时，工具调用执行该分支。
    if (askRule) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: `Claude requested permissions to use ${WebFetchTool.name}, but you haven't granted it yet.`,
        decisionReason: {
          type: 'rule',
          rule: askRule,
        },
        suggestions: buildSuggestions(ruleContent),
      }
    }

    // allowRule读取`getRuleByContentsForTool`，供工具调用后续处理使用。
    const allowRule = getRuleByContentsForTool(
      permissionContext,
      WebFetchTool,
      'allow',
    ).get(ruleContent)
    // 满足 `allowRule` 时，工具调用执行该分支。
    if (allowRule) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'allow',
        updatedInput: input,
        decisionReason: {
          type: 'rule',
          rule: allowRule,
        },
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: `Claude requested permissions to use ${WebFetchTool.name}, but you haven't granted it yet.`,
      suggestions: buildSuggestions(ruleContent),
    }
  },
  // prompt 使用 _options 完成工具调用里的对应操作。
  async prompt(_options) {
    // Always include the auth warning regardless of whether ToolSearch is
    // currently in the tools list. Conditionally toggling this prefix based
    // on ToolSearch availability caused the tool description to flicker
    // between SDK query() calls (when ToolSearch enablement varies due to
    // MCP tool count thresholds), invalidating the Anthropic API prompt
    // cache on each toggle — two consecutive cache misses per flicker event.
    // 返回 ``IMPORTANT: WebFetch WILL FAIL for authenticated or private URLs. Befor...`，作为工具调用这次计算的结果。
    return `IMPORTANT: WebFetch WILL FAIL for authenticated or private URLs. Before using this tool, check if the URL points to an authenticated service (e.g. Google Docs, Confluence, Jira, GitHub). If so, look for a specialized MCP tool that provides authenticated access.
${DESCRIPTION}`
  },
  // validateInput 使用 input 完成工具调用里的对应操作。
  async validateInput(input) {
    // 从 `input` 解构 url，减少工具实现 Web Fetch Tool对同一对象的重复访问。
    const { url } = input
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 工具实现 Web Fetch Tool在这里处理 `new URL(url)`，完成这一小步状态转换。
      new URL(url)
    } catch {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: false,
        message: `Error: Invalid URL "${url}". The URL provided could not be parsed.`,
        meta: { reason: 'invalid_url' },
        errorCode: 1,
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { result: true }
  },
  renderToolUseMessage,
  renderToolUseProgressMessage,
  renderToolResultMessage,
  // 工具实现 Web Fetch Tool在这里处理 `async call(`，完成这一小步状态转换。
  async call(
    { url, prompt },
    { abortController, options: { isNonInteractiveSession } },
  ) {
    // start记录时间`Date.now`，供工具调用后续处理使用。
    const start = Date.now()

    // 接口响应读取`getURLMarkdownContent`，供工具调用后续处理使用。
    const response = await getURLMarkdownContent(url, abortController)

    // Check if we got a redirect to a different host
    // 当 `'type' in response && response.type` 匹配 `'redirect'` 时，工具调用执行对应分支。
    if ('type' in response && response.type === 'redirect') {
      // statusText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const statusText =
        response.statusCode === 301
          ? 'Moved Permanently'
          : response.statusCode === 308
            ? 'Permanent Redirect'
            : response.statusCode === 307
              ? 'Temporary Redirect'
              : 'Found'

      // 消息保存``REDIRECT DETECTED: The URL redirects to a different host.`，作为后续固定文本处理的输入。
      const message = `REDIRECT DETECTED: The URL redirects to a different host.

Original URL: ${response.originalUrl}
Redirect URL: ${response.redirectUrl}
Status: ${response.statusCode} ${statusText}

To complete your request, I need to fetch content from the redirected URL. Please use WebFetch again with these parameters:
- url: "${response.redirectUrl}"
- prompt: "${prompt}"`

      // output 集中保存工具实现 Web Fetch Tool要一起传递的字段。
      const output: Output = {
        bytes: Buffer.byteLength(message),
        code: response.statusCode,
        codeText: statusText,
        result: message,
        durationMs: Date.now() - start,
        url,
      }

      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        data: output,
      }
    }

    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      content,
      bytes,
      code,
      codeText,
      contentType,
      persistedPath,
      persistedSize,
    } = response as FetchedContent

    // isPreapproved记录 `isPreapprovedUrl` 是否成立，工具调用随后按该结果分支。
    const isPreapproved = isPreapprovedUrl(url)

    // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
    let result: string
    // 工具调用在这里按实际状态进入对应分支。
    if (
      isPreapproved &&
      contentType.includes('text/markdown') &&
      content.length < MAX_MARKDOWN_LENGTH
    ) {
      // 结果更新为 `content`，确保工具调用后续读取最新状态。
      result = content
    } else {
      // 结果更新为 `await applyPromptToMarkdown(`，确保工具调用后续读取最新状态。
      result = await applyPromptToMarkdown(
        prompt,
        content,
        abortController.signal,
        isNonInteractiveSession,
        isPreapproved,
      )
    }

    // Binary content (PDFs, etc.) was additionally saved to disk with a
    // mime-derived extension. Note it so Claude can inspect the raw file
    // if the Haiku summary above isn't enough.
    // 满足 `persistedPath` 时，工具调用执行该分支。
    if (persistedPath) {
      // 工具实现 Web Fetch Tool在这里处理 `result += `\n\n[Binary content (${contentType}, ${formatFileSize(persis...`，完成这一小步状态转换。
      result += `\n\n[Binary content (${contentType}, ${formatFileSize(persistedSize ?? bytes)}) also saved to ${persistedPath}]`
    }

    // output 集中保存工具实现 Web Fetch Tool要一起传递的字段。
    const output: Output = {
      bytes,
      code,
      codeText,
      result,
      durationMs: Date.now() - start,
      url,
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: output,
    }
  },
  // mapToolResultToToolResultBlockParam 使用 { result }, toolUseID 完成工具调用里的对应操作。
  mapToolResultToToolResultBlockParam({ result }, toolUseID) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: result,
    }
  },
} satisfies ToolDef<InputSchema, Output>)

// buildSuggestions 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildSuggestions(ruleContent: string): PermissionUpdate[] {
  // 返回列表结果，保留工具调用已经排好的条目顺序。
  return [
    {
      type: 'addRules',
      destination: 'localSettings',
      rules: [{ toolName: WEB_FETCH_TOOL_NAME, ruleContent }],
      behavior: 'allow',
    },
  ]
}
