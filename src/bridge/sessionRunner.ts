// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { type ChildProcess, spawn } from 'child_process'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { createWriteStream, type WriteStream } from 'fs'
// 引入 tmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { tmpdir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 使用 Node/Bun 的 readline 能力处理本地运行时资源。
import { createInterface } from 'readline'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../utils/slowOperations.js'
// 引入 debugTruncate，将 ./debugUtils.js 中已经封装好的能力接到本文件流程里。
import { debugTruncate } from './debugUtils.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import type {
  SessionActivity,
  SessionDoneStatus,
  SessionHandle,
  SessionSpawner,
  SessionSpawnOpts,
} from './types.js'

// MAX_ACTIVITIES 集合保存`10`，供后续判断或组装使用。
const MAX_ACTIVITIES = 10
// MAX_STDERR_LINES 集合保存`10`，供后续判断或组装使用。
const MAX_STDERR_LINES = 10

/**
 * Sanitize a session ID for use in file names.
 * Strips any characters that could cause path traversal (e.g. `../`, `/`)
 * or other filesystem issues, replacing them with underscores.
 */
// safeFilenameId 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function safeFilenameId(id: string): string {
  // 返回 `id.replace(/[^a-zA-Z0-9_-]/g, '_')`，作为远程桥接会话这次计算的结果。
  return id.replace(/[^a-zA-Z0-9_-]/g, '_')
}

/**
 * A control_request emitted by the child CLI when it needs permission to
 * execute a **specific** tool invocation (not a general capability check).
 * The bridge forwards this to the server so the user can approve/deny.
 */
// PermissionRequest 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRequest = {
  type: 'control_request'
  request_id: string
  request: {
    /** Per-invocation permission check — "may I run this tool with these inputs?" */
    subtype: 'can_use_tool'
    tool_name: string
    input: Record<string, unknown>
    tool_use_id: string
  }
}

// SessionSpawnerDeps 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionSpawnerDeps = {
  execPath: string
  /**
   * Arguments that must precede the CLI flags when spawning. Empty for
   * compiled binaries (where execPath is the claude binary itself); contains
   * the script path (process.argv[1]) for npm installs where execPath is the
   * node runtime. Without this, node sees --sdk-url as a node option and
   * exits with "bad option: --sdk-url" (see anthropics/claude-code#28334).
   */
  scriptArgs: string[]
  env: NodeJS.ProcessEnv
  verbose: boolean
  sandbox: boolean
  debugFile?: string
  permissionMode?: string
  // 这个回调绑定到 onDebug: (msg: string) => void，负责远程桥接会话在该局部场景下的响应。
  onDebug: (msg: string) => void
  onActivity?: (sessionId: string, activity: SessionActivity) => void
  onPermissionRequest?: (
    sessionId: string,
    request: PermissionRequest,
    accessToken: string,
  ) => void
}

/** Map tool names to human-readable verbs for the status display. */
// TOOL_VERBS 集合 集中保存远程桥接 session Runner要一起传递的字段。
const TOOL_VERBS: Record<string, string> = {
  Read: 'Reading',
  Write: 'Writing',
  Edit: 'Editing',
  MultiEdit: 'Editing',
  Bash: 'Running',
  Glob: 'Searching',
  Grep: 'Searching',
  WebFetch: 'Fetching',
  WebSearch: 'Searching',
  Task: 'Running task',
  FileReadTool: 'Reading',
  FileWriteTool: 'Writing',
  FileEditTool: 'Editing',
  GlobTool: 'Searching',
  GrepTool: 'Searching',
  BashTool: 'Running',
  NotebookEditTool: 'Editing notebook',
  LSP: 'LSP',
}

// toolSummary 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toolSummary(name: string, input: Record<string, unknown>): string {
  // verb保存`TOOL_VERBS[name] ?? name`，供远程桥接会话远程桥接 session Runner后续判断或输出使用。
  const verb = TOOL_VERBS[name] ?? name
  // target 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const target =
    (input.file_path as string) ??
    (input.filePath as string) ??
    (input.pattern as string) ??
    (input.command as string | undefined)?.slice(0, 60) ??
    (input.url as string) ??
    (input.query as string) ??
    ''
  // 满足 `target` 时，远程桥接会话执行该分支。
  if (target) {
    // 返回 ``${verb} ${target}``，作为远程桥接会话这次计算的结果。
    return `${verb} ${target}`
  }
  // 返回 `verb`，作为远程桥接会话这次计算的结果。
  return verb
}

// extractActivities 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractActivities(
  line: string,
  sessionId: string,
  // 这个回调绑定到 onDebug: (msg: string) => void,，负责远程桥接会话在该局部场景下的响应。
  onDebug: (msg: string) => void,
): SessionActivity[] {
  // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsed: unknown
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `jsonParse(line)`，确保Bridge 通信后续读取最新状态。
    parsed = jsonParse(line)
  } catch {
    // 返回列表结果，保留远程桥接会话已经排好的条目顺序。
    return []
  }

  // `!parsed || typeof parsed` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!parsed || typeof parsed !== 'object') {
    // 返回列表结果，保留远程桥接会话已经排好的条目顺序。
    return []
  }

  // 消息 命名 `parsed as Record<string, unknown>`，让后续代码直接表达这个值的用途。
  const msg = parsed as Record<string, unknown>
  // activities 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const activities: SessionActivity[] = []
  // now记录时间`Date.now`，供远程桥接会话后续处理使用。
  const now = Date.now()

  // 按照 msg.type 的取值选择远程桥接会话的具体处理分支。
  switch (msg.type) {
    case 'assistant': {
      // 消息保存`msg.message as Record<string, unknown> | undefined`，供后续判断或组装使用。
      const message = msg.message as Record<string, unknown> | undefined
      // 消息缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!message) break
      // 文本内容保存`message.content`，供远程桥接会话远程桥接 session Runner后续判断或输出使用。
      const content = message.content
      // 满足 `!Array.isArray(content)` 时，远程桥接会话执行该分支。
      if (!Array.isArray(content)) break

      // 按顺序遍历 `content` 中的block，逐个交给远程桥接会话处理。
      for (const block of content) {
        // `!block || typeof block` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
        if (!block || typeof block !== 'object') continue
        // b保存`block as Record<string, unknown>`，供后续判断或组装使用。
        const b = block as Record<string, unknown>

        // 当 `b.type` 匹配 `'tool_use'` 时，远程桥接会话执行对应分支。
        if (b.type === 'tool_use') {
          // 名称保存`(b.name as string) ?? 'Tool'`，供后续判断或组装使用。
          const name = (b.name as string) ?? 'Tool'
          // 用户输入 命名 `(b.input as Record<string, unknown>) ?? {}`，让后续代码直接表达这个值的用途。
          const input = (b.input as Record<string, unknown>) ?? {}
          // summary保存`toolSummary`，供远程桥接会话后续处理使用。
          const summary = toolSummary(name, input)
          // activities 集合追加新条目，保持收集顺序与输入顺序一致。
          activities.push({
            type: 'tool_start',
            summary,
            timestamp: now,
          })
          // 调用 onDebug，触发远程桥接会话此处需要的副作用。
          onDebug(
            `[bridge:activity] sessionId=${sessionId} tool_use name=${name} ${inputPreview(input)}`,
          )
        // 远程桥接 session Runner在这里处理 `} else if (b.type === 'text') {`，完成这一小步状态转换。
        } else if (b.type === 'text') {
          // 文本内容保存`(b.text as string) ?? ''`，供后续判断或组装使用。
          const text = (b.text as string) ?? ''
          // 满足 `text.length > 0` 时，远程桥接会话执行该分支。
          if (text.length > 0) {
            // activities 集合追加新条目，保持收集顺序与输入顺序一致。
            activities.push({
              type: 'text',
              summary: text.slice(0, 80),
              timestamp: now,
            })
            // 调用 onDebug，触发远程桥接会话此处需要的副作用。
            onDebug(
              `[bridge:activity] sessionId=${sessionId} text "${text.slice(0, 100)}"`,
            )
          }
        }
      }
      // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
      break
    }
    case 'result': {
      // subtype保存`msg.subtype as string | undefined`，供后续判断或组装使用。
      const subtype = msg.subtype as string | undefined
      // 当 `subtype` 匹配 `'success'` 时，远程桥接会话执行对应分支。
      if (subtype === 'success') {
        // activities 集合追加新条目，保持收集顺序与输入顺序一致。
        activities.push({
          type: 'result',
          summary: 'Session completed',
          timestamp: now,
        })
        // 调用 onDebug，触发远程桥接会话此处需要的副作用。
        onDebug(
          `[bridge:activity] sessionId=${sessionId} result subtype=success`,
        )
      // 远程桥接 session Runner在这里处理 `} else if (subtype) {`，完成这一小步状态转换。
      } else if (subtype) {
        // 错误列表保存`msg.errors as string[] | undefined`，供后续判断或组装使用。
        const errors = msg.errors as string[] | undefined
        // errorSummary 错误信息 命名 `errors?.[0] ?? `Error: ${subtype}``，让后续代码直接表达这个值的用途。
        const errorSummary = errors?.[0] ?? `Error: ${subtype}`
        // activities 集合追加新条目，保持收集顺序与输入顺序一致。
        activities.push({
          type: 'error',
          summary: errorSummary,
          timestamp: now,
        })
        // 调用 onDebug，触发远程桥接会话此处需要的副作用。
        onDebug(
          `[bridge:activity] sessionId=${sessionId} result subtype=${subtype} error="${errorSummary}"`,
        )
      } else {
        // 调用 onDebug，触发远程桥接会话此处需要的副作用。
        onDebug(
          `[bridge:activity] sessionId=${sessionId} result subtype=undefined`,
        )
      }
      // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
      break
    }
    default:
      // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
      break
  }

  // 返回 `activities`，作为远程桥接会话这次计算的结果。
  return activities
}

/**
 * Extract plain text from a replayed SDKUserMessage NDJSON line. Returns the
 * trimmed text if this looks like a real human-authored message, otherwise
 * undefined so the caller keeps waiting for the first real message.
 */
// extractUserMessageText 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractUserMessageText(
  msg: Record<string, unknown>,
): string | undefined {
  // Skip tool-result user messages (wrapped subagent results) and synthetic
  // caveat messages — neither is human-authored.
  // 组合条件 `msg.parent_tool_use_id != null || msg.isSynthetic || msg.isReplay` 成立时，远程桥接会话才启用这条专门路径。
  if (msg.parent_tool_use_id != null || msg.isSynthetic || msg.isReplay)
    // 返回 `undefined`，作为远程桥接会话这次计算的结果。
    return undefined

  // 消息保存`msg.message as Record<string, unknown> | undefined`，供后续判断或组装使用。
  const message = msg.message as Record<string, unknown> | undefined
  // 文本内容保存`message?.content`，供后续判断或组装使用。
  const content = message?.content
  // 文本 先占位，稍后的条件分支会根据实际输入补齐它。
  let text: string | undefined
  // 当 `typeof content` 匹配 `'string'` 时，远程桥接会话执行对应分支。
  if (typeof content === 'string') {
    // 文本更新为 `content`，确保Bridge 通信后续读取最新状态。
    text = content
  // 远程桥接 session Runner在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
  } else if (Array.isArray(content)) {
    // 按顺序遍历 `content` 中的block，逐个交给远程桥接会话处理。
    for (const block of content) {
      // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
      if (
        block &&
        typeof block === 'object' &&
        (block as Record<string, unknown>).type === 'text'
      ) {
        // 文本更新为 `(block as Record<string, unknown>).text as string | undef...`，确保Bridge 通信后续读取最新状态。
        text = (block as Record<string, unknown>).text as string | undefined
        // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
        break
      }
    }
  }
  // 文本更新为 `text?.trim()`，确保Bridge 通信后续读取最新状态。
  text = text?.trim()
  // 返回 `text ? text : undefined`，作为远程桥接会话这次计算的结果。
  return text ? text : undefined
}

/** Build a short preview of tool input for debug logging. */
// inputPreview 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function inputPreview(input: Record<string, unknown>): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // 循环处理 `const [key, val] of Object.entries(input)`，让远程桥接会话把同类条目按顺序走完。
  for (const [key, val] of Object.entries(input)) {
    // 当 `typeof val` 匹配 `'string'` 时，远程桥接会话执行对应分支。
    if (typeof val === 'string') {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`${key}="${val.slice(0, 100)}"`)
    }
    // 满足 `parts.length >= 3` 时，远程桥接会话执行该分支。
    if (parts.length >= 3) break
  }
  // 返回 `parts.join(' ')`，作为远程桥接会话这次计算的结果。
  return parts.join(' ')
}

// createSessionSpawner 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSessionSpawner(deps: SessionSpawnerDeps): SessionSpawner {
  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    // spawn 使用 opts: SessionSpawnOpts, dir: string 完成远程桥接会话里的对应操作。
    spawn(opts: SessionSpawnOpts, dir: string): SessionHandle {
      // Debug file resolution:
      // 1. If deps.debugFile is provided, use it with session ID suffix for uniqueness
      // 2. If verbose or ant build, auto-generate a temp file path
      // 3. Otherwise, no debug file
      // safeId保存`safeFilenameId`，供远程桥接会话后续处理使用。
      const safeId = safeFilenameId(opts.sessionId)
      // debugFile 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
      let debugFile: string | undefined
      // 满足 `deps.debugFile` 时，远程桥接会话执行该分支。
      if (deps.debugFile) {
        // ext保存`debugFile.lastIndexOf`，供远程桥接会话后续处理使用。
        const ext = deps.debugFile.lastIndexOf('.')
        // 满足 `ext > 0` 时，远程桥接会话执行该分支。
        if (ext > 0) {
          // debugFile 文件数据更新为 ``${deps.debugFile.slice(0, ext)}-${safeId}${deps.debugFil...`，确保Bridge 通信后续读取最新状态。
          debugFile = `${deps.debugFile.slice(0, ext)}-${safeId}${deps.debugFile.slice(ext)}`
        } else {
          // debugFile 文件数据更新为 ``${deps.debugFile}-${safeId}``，确保Bridge 通信后续读取最新状态。
          debugFile = `${deps.debugFile}-${safeId}`
        }
      // 远程桥接 session Runner在这里处理 `} else if (deps.verbose || process.env.USER_TYPE === 'ant') {`，完成这一小步状态转换。
      } else if (deps.verbose || process.env.USER_TYPE === 'ant') {
        // debugFile 文件数据更新为 `join(tmpdir(), 'claude', `bridge-session-${safeId}.log`)`，确保Bridge 通信后续读取最新状态。
        debugFile = join(tmpdir(), 'claude', `bridge-session-${safeId}.log`)
      }

      // Transcript file: write raw NDJSON lines for post-hoc analysis.
      // Placed alongside the debug file when one is configured.
      // transcriptStream初始化为空值，后续分支会在有数据时补齐。
      let transcriptStream: WriteStream | null = null
      // transcriptPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
      let transcriptPath: string | undefined
      // 满足 `deps.debugFile` 时，远程桥接会话执行该分支。
      if (deps.debugFile) {
        // transcriptPath 路径数据更新为 `join(`，确保Bridge 通信后续读取最新状态。
        transcriptPath = join(
          dirname(deps.debugFile),
          `bridge-transcript-${safeId}.jsonl`,
        )
        // transcriptStream更新为 `createWriteStream(transcriptPath, { flags: 'a' })`，确保Bridge 通信后续读取最新状态。
        transcriptStream = createWriteStream(transcriptPath, { flags: 'a' })
        // 调用 transcriptStream.on，触发远程桥接会话此处需要的副作用。
        transcriptStream.on('error', err => {
          // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
          deps.onDebug(
            `[bridge:session] Transcript write error: ${err.message}`,
          )
          // transcriptStream更新为 `null`，确保Bridge 通信后续读取最新状态。
          transcriptStream = null
        })
        // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
        deps.onDebug(`[bridge:session] Transcript log: ${transcriptPath}`)
      }

      // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
      const args = [
        ...deps.scriptArgs,
        '--print',
        '--sdk-url',
        opts.sdkUrl,
        '--session-id',
        opts.sessionId,
        '--input-format',
        'stream-json',
        '--output-format',
        'stream-json',
        '--replay-user-messages',
        ...(deps.verbose ? ['--verbose'] : []),
        ...(debugFile ? ['--debug-file', debugFile] : []),
        ...(deps.permissionMode
          ? ['--permission-mode', deps.permissionMode]
          : []),
      ]

      // env 集中保存远程桥接 session Runner要一起传递的字段。
      const env: NodeJS.ProcessEnv = {
        ...deps.env,
        // Strip the bridge's OAuth token so the child CC process uses
        // the session access token for inference instead.
        CLAUDE_CODE_OAUTH_TOKEN: undefined,
        CLAUDE_CODE_ENVIRONMENT_KIND: 'bridge',
        ...(deps.sandbox && { CLAUDE_CODE_FORCE_SANDBOX: '1' }),
        CLAUDE_CODE_SESSION_ACCESS_TOKEN: opts.accessToken,
        // v1: HybridTransport (WS reads + POST writes) to Session-Ingress.
        // Harmless in v2 mode — transportUtils checks CLAUDE_CODE_USE_CCR_V2 first.
        CLAUDE_CODE_POST_FOR_SESSION_INGRESS_V2: '1',
        // v2: SSETransport + CCRClient to CCR's /v1/code/sessions/* endpoints.
        // Same env vars environment-manager sets in the container path.
        ...(opts.useCcrV2 && {
          CLAUDE_CODE_USE_CCR_V2: '1',
          CLAUDE_CODE_WORKER_EPOCH: String(opts.workerEpoch),
        }),
      }

      // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
      deps.onDebug(
        `[bridge:session] Spawning sessionId=${opts.sessionId} sdkUrl=${opts.sdkUrl} accessToken=${opts.accessToken ? 'present' : 'MISSING'}`,
      )
      // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
      deps.onDebug(`[bridge:session] Child args: ${args.join(' ')}`)
      // 满足 `debugFile` 时，远程桥接会话执行该分支。
      if (debugFile) {
        // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
        deps.onDebug(`[bridge:session] Debug log: ${debugFile}`)
      }

      // Pipe all three streams: stdin for control, stdout for NDJSON parsing,
      // stderr for error capture and diagnostics.
      // child 命名 `spawn(deps.execPath, args, {`，让后续代码直接表达这个值的用途。
      const child: ChildProcess = spawn(deps.execPath, args, {
        cwd: dir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        windowsHide: true,
      })

      // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
      deps.onDebug(
        `[bridge:session] sessionId=${opts.sessionId} pid=${child.pid}`,
      )

      // activities 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      const activities: SessionActivity[] = []
      // currentActivity初始化为空值，后续分支会在有数据时补齐。
      let currentActivity: SessionActivity | null = null
      // lastStderr 从空数组开始收集，后续循环会按处理顺序追加条目。
      const lastStderr: string[] = []
      // sigkillSent标记远程桥接会话远程桥接 session Runner是否启用对应路径。
      let sigkillSent = false
      // firstUserMessageSeen 消息数据标记远程桥接会话远程桥接 session Runner是否启用对应路径。
      let firstUserMessageSeen = false

      // Buffer stderr for error diagnostics
      // 满足 `child.stderr` 时，远程桥接会话执行该分支。
      if (child.stderr) {
        // stderrRl构建`createInterface`，供远程桥接会话后续处理使用。
        const stderrRl = createInterface({ input: child.stderr })
        // 调用 stderrRl.on，触发远程桥接会话此处需要的副作用。
        stderrRl.on('line', line => {
          // Forward stderr to bridge's stderr in verbose mode
          // 满足 `deps.verbose` 时，远程桥接会话执行该分支。
          if (deps.verbose) {
            // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
            process.stderr.write(line + '\n')
          }
          // Ring buffer of last N lines
          // 满足 `lastStderr.length >= MAX_STDERR_LINES` 时，远程桥接会话执行该分支。
          if (lastStderr.length >= MAX_STDERR_LINES) {
            // 调用 lastStderr.shift，触发远程桥接会话此处需要的副作用。
            lastStderr.shift()
          }
          // lastStderr追加新条目，保持收集顺序与输入顺序一致。
          lastStderr.push(line)
        })
      }

      // Parse NDJSON from child stdout
      // 满足 `child.stdout` 时，远程桥接会话执行该分支。
      if (child.stdout) {
        // rl构建`createInterface`，供远程桥接会话后续处理使用。
        const rl = createInterface({ input: child.stdout })
        // 调用 rl.on，触发远程桥接会话此处需要的副作用。
        rl.on('line', line => {
          // Write raw NDJSON to transcript file
          // 满足 `transcriptStream` 时，远程桥接会话执行该分支。
          if (transcriptStream) {
            // 调用 transcriptStream.write，触发远程桥接会话此处需要的副作用。
            transcriptStream.write(line + '\n')
          }

          // Log all messages flowing from the child CLI to the bridge
          // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
          deps.onDebug(
            `[bridge:ws] sessionId=${opts.sessionId} <<< ${debugTruncate(line)}`,
          )

          // In verbose mode, forward raw output to stderr
          // 满足 `deps.verbose` 时，远程桥接会话执行该分支。
          if (deps.verbose) {
            // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
            process.stderr.write(line + '\n')
          }

          // extracted保存`extractActivities`，供远程桥接会话后续处理使用。
          const extracted = extractActivities(
            line,
            opts.sessionId,
            deps.onDebug,
          )
          // 按顺序遍历 `extracted` 中的activity，逐个交给远程桥接会话处理。
          for (const activity of extracted) {
            // Maintain ring buffer
            // 满足 `activities.length >= MAX_ACTIVITIES` 时，远程桥接会话执行该分支。
            if (activities.length >= MAX_ACTIVITIES) {
              // 调用 activities.shift，触发远程桥接会话此处需要的副作用。
              activities.shift()
            }
            // activities 集合追加新条目，保持收集顺序与输入顺序一致。
            activities.push(activity)
            // currentActivity更新为 `activity`，确保Bridge 通信后续读取最新状态。
            currentActivity = activity

            // 调用 deps.onActivity?.(opts.sessionId, activity)，完成这一处局部操作。
            deps.onActivity?.(opts.sessionId, activity)
          }

          // Detect control_request and replayed user messages.
          // extractActivities parses the same line but swallows parse errors
          // and skips 'user' type — re-parse here is cheap (NDJSON lines are
          // small) and keeps each path self-contained.
          {
            // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
            let parsed: unknown
            // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
            try {
              // 解析结果更新为 `jsonParse(line)`，确保Bridge 通信后续读取最新状态。
              parsed = jsonParse(line)
            } catch {
              // Non-JSON line, skip detection
            }
            // 当 `parsed && typeof parsed` 匹配 `'object'` 时，远程桥接会话执行对应分支。
            if (parsed && typeof parsed === 'object') {
              // 消息 命名 `parsed as Record<string, unknown>`，让后续代码直接表达这个值的用途。
              const msg = parsed as Record<string, unknown>

              // 当 `msg.type` 匹配 `'control_request'` 时，远程桥接会话执行对应分支。
              if (msg.type === 'control_request') {
                // request 请求数据保存`msg.request as`，供后续判断或组装使用。
                const request = msg.request as
                  | Record<string, unknown>
                  | undefined
                // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
                if (
                  request?.subtype === 'can_use_tool' &&
                  deps.onPermissionRequest
                ) {
                  // 调用 deps.onPermissionRequest，触发远程桥接会话此处需要的副作用。
                  deps.onPermissionRequest(
                    opts.sessionId,
                    parsed as PermissionRequest,
                    opts.accessToken,
                  )
                }
                // interrupt is turn-level; the child handles it internally (print.ts)
              // 远程桥接 session Runner在这里处理 `} else if (`，完成这一小步状态转换。
              } else if (
                msg.type === 'user' &&
                !firstUserMessageSeen &&
                opts.onFirstUserMessage
              ) {
                // 文本保存`extractUserMessageText`，供远程桥接会话后续处理使用。
                const text = extractUserMessageText(msg)
                // 满足 `text` 时，远程桥接会话执行该分支。
                if (text) {
                  // firstUserMessageSeen 消息数据更新为 `true`，确保Bridge 通信后续读取最新状态。
                  firstUserMessageSeen = true
                  // 调用 opts.onFirstUserMessage，触发远程桥接会话此处需要的副作用。
                  opts.onFirstUserMessage(text)
                }
              }
            }
          }
        })
      }

      // done封装成回调，供远程桥接会话远程桥接 session Runner在事件触发或异步步骤中调用。
      const done = new Promise<SessionDoneStatus>(resolve => {
        // 调用 child.on，触发远程桥接会话此处需要的副作用。
        child.on('close', (code, signal) => {
          // Close transcript stream on exit
          // 满足 `transcriptStream` 时，远程桥接会话执行该分支。
          if (transcriptStream) {
            // 调用 transcriptStream.end，触发远程桥接会话此处需要的副作用。
            transcriptStream.end()
            // transcriptStream更新为 `null`，确保Bridge 通信后续读取最新状态。
            transcriptStream = null
          }

          // 当 `signal` 匹配 `'SIGTERM' || signal === 'SI...` 时，远程桥接会话执行对应分支。
          if (signal === 'SIGTERM' || signal === 'SIGINT') {
            // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
            deps.onDebug(
              `[bridge:session] sessionId=${opts.sessionId} interrupted signal=${signal} pid=${child.pid}`,
            )
            // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolve('interrupted')
          // 远程桥接 session Runner在这里处理 `} else if (code === 0) {`，完成这一小步状态转换。
          } else if (code === 0) {
            // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
            deps.onDebug(
              `[bridge:session] sessionId=${opts.sessionId} completed exit_code=0 pid=${child.pid}`,
            )
            // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolve('completed')
          } else {
            // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
            deps.onDebug(
              `[bridge:session] sessionId=${opts.sessionId} failed exit_code=${code} pid=${child.pid}`,
            )
            // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolve('failed')
          }
        })

        // 调用 child.on，触发远程桥接会话此处需要的副作用。
        child.on('error', err => {
          // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
          deps.onDebug(
            `[bridge:session] sessionId=${opts.sessionId} spawn error: ${err.message}`,
          )
          // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolve('failed')
        })
      })

      // handle 集中保存远程桥接 session Runner要一起传递的字段。
      const handle: SessionHandle = {
        sessionId: opts.sessionId,
        done,
        activities,
        accessToken: opts.accessToken,
        lastStderr,
        // 远程桥接 session Runner在这里处理 `get currentActivity(): SessionActivity | null {`，完成这一小步状态转换。
        get currentActivity(): SessionActivity | null {
          // 返回 `currentActivity`，作为远程桥接会话这次计算的结果。
          return currentActivity
        },
        // kill 使用 无 完成远程桥接会话里的对应操作。
        kill(): void {
          // child.killed缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
          if (!child.killed) {
            // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
            deps.onDebug(
              `[bridge:session] Sending SIGTERM to sessionId=${opts.sessionId} pid=${child.pid}`,
            )
            // On Windows, child.kill('SIGTERM') throws; use default signal.
            // 当 `process.platform` 匹配 `'win32'` 时，远程桥接会话执行对应分支。
            if (process.platform === 'win32') {
              // 调用 child.kill，触发远程桥接会话此处需要的副作用。
              child.kill()
            } else {
              // 调用 child.kill，触发远程桥接会话此处需要的副作用。
              child.kill('SIGTERM')
            }
          }
        },
        // forceKill 使用 无 完成远程桥接会话里的对应操作。
        forceKill(): void {
          // Use separate flag because child.killed is set when kill() is called,
          // not when the process exits. We need to send SIGKILL even after SIGTERM.
          // 组合条件 `!sigkillSent && child.pid` 成立时，远程桥接会话才启用这条专门路径。
          if (!sigkillSent && child.pid) {
            // sigkillSent更新为 `true`，确保Bridge 通信后续读取最新状态。
            sigkillSent = true
            // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
            deps.onDebug(
              `[bridge:session] Sending SIGKILL to sessionId=${opts.sessionId} pid=${child.pid}`,
            )
            // 当 `process.platform` 匹配 `'win32'` 时，远程桥接会话执行对应分支。
            if (process.platform === 'win32') {
              // 调用 child.kill，触发远程桥接会话此处需要的副作用。
              child.kill()
            } else {
              // 调用 child.kill，触发远程桥接会话此处需要的副作用。
              child.kill('SIGKILL')
            }
          }
        },
        // writeStdin 使用 data: string 完成远程桥接会话里的对应操作。
        writeStdin(data: string): void {
          // 组合条件 `child.stdin && !child.stdin.destroyed` 成立时，远程桥接会话才启用这条专门路径。
          if (child.stdin && !child.stdin.destroyed) {
            // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
            deps.onDebug(
              `[bridge:ws] sessionId=${opts.sessionId} >>> ${debugTruncate(data)}`,
            )
            // 调用 child.stdin.write，触发远程桥接会话此处需要的副作用。
            child.stdin.write(data)
          }
        },
        // updateAccessToken 使用 token: string 完成远程桥接会话里的对应操作。
        updateAccessToken(token: string): void {
          // accessToken更新为 `token`，确保Bridge 通信后续读取最新状态。
          handle.accessToken = token
          // Send the fresh token to the child process via stdin. The child's
          // StructuredIO handles update_environment_variables messages by
          // setting process.env directly, so getSessionIngressAuthToken()
          // picks up the new token on the next refreshHeaders call.
          // 调用 handle.writeStdin，触发远程桥接会话此处需要的副作用。
          handle.writeStdin(
            jsonStringify({
              type: 'update_environment_variables',
              variables: { CLAUDE_CODE_SESSION_ACCESS_TOKEN: token },
            }) + '\n',
          )
          // 调用 deps.onDebug，触发远程桥接会话此处需要的副作用。
          deps.onDebug(
            `[bridge:session] Sent token refresh via stdin for sessionId=${opts.sessionId}`,
          )
        },
      }

      // 返回 `handle`，作为远程桥接会话这次计算的结果。
      return handle
    },
  }
}

// 重新导出这一组成员，让远程桥接会话的公共 API 保持集中入口。
export { extractActivities as _extractActivitiesForTesting }
