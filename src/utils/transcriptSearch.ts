// 类型依赖 { RenderableMessage } 来自 ../types/message.js，用于校准共享工具的数据契约。
import type { RenderableMessage } from '../types/message.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  INTERRUPT_MESSAGE,
  INTERRUPT_MESSAGE_FOR_TOOL_USE,
} from './messages.js'

// SYSTEM_REMINDER_CLOSE 命名 `'</system-reminder>'`，让后续代码直接表达这个值的用途。
const SYSTEM_REMINDER_CLOSE = '</system-reminder>'

// UserTextMessage.tsx:~84 replaces these with <InterruptedByUser />
// (renders 'Interrupted · /issue...'). Raw text never appears on screen;
// searching it yields phantom matches — /terr → in[terr]upted.
// RENDERED_AS_SENTINEL保存`Set`，供共享工具后续处理使用。
const RENDERED_AS_SENTINEL = new Set([
  INTERRUPT_MESSAGE,
  INTERRUPT_MESSAGE_FOR_TOOL_USE,
])

// searchTextCache 缓存构建`new WeakMap<RenderableMessage, string>()`，供后续判断或组装使用。
const searchTextCache = new WeakMap<RenderableMessage, string>()

/** Flatten a RenderableMessage to lowercased searchable text. WeakMap-
 *  cached — messages are append-only and immutable so a hit is always
 *  valid. Lowercased at cache time: the only caller immediately
 *  .toLowerCase()d the result, re-lowering ~1.5MB on every keystroke
 *  (the backspace hang). Returns '' for non-searchable types. */
// renderableSearchText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderableSearchText(msg: RenderableMessage): string {
  // cached 缓存读取`searchTextCache.get`，供共享工具后续处理使用。
  const cached = searchTextCache.get(msg)
  // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== undefined) return cached
  // 结果保存`computeSearchText`，供共享工具后续处理使用。
  const result = computeSearchText(msg).toLowerCase()
  // searchTextCache.set 写入新的状态值，使共享工具后续读取保持一致。
  searchTextCache.set(msg, result)
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// computeSearchText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeSearchText(msg: RenderableMessage): string {
  // 原始文本固定为 `''`，作为共享工具 transcript Search后续展示或比较的基准。
  let raw = ''
  // 按照 msg.type 的取值选择共享工具的具体处理分支。
  switch (msg.type) {
    case 'user': {
      // c保存`msg.message.content`，供共享工具 transcript Search后续判断或输出使用。
      const c = msg.message.content
      // 当 `typeof c` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof c === 'string') {
        // 原始文本更新为 `RENDERED_AS_SENTINEL.has(c) ? '' : c`，确保共享工具后续读取最新状态。
        raw = RENDERED_AS_SENTINEL.has(c) ? '' : c
      } else {
        // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
        const parts: string[] = []
        // 按顺序遍历 `c` 中的b，逐个交给共享工具处理。
        for (const b of c) {
          // 当 `b.type` 匹配 `'text'` 时，共享工具执行对应分支。
          if (b.type === 'text') {
            // 满足 `!RENDERED_AS_SENTINEL.has(b.text)) parts.push(b.text` 时，共享工具执行该分支。
            if (!RENDERED_AS_SENTINEL.has(b.text)) parts.push(b.text)
          // 共享工具 transcript Search在这里处理 `} else if (b.type === 'tool_result') {`，完成这一小步状态转换。
          } else if (b.type === 'tool_result') {
            // b.content is the MODEL-facing serialization (from each tool's
            // mapToolResultToToolResultBlockParam) — adds system-reminders,
            // <persisted-output> wrappers, backgroundInfo strings,
            // CYBER_RISK_MITIGATION_REMINDER. The UI
            // renders msg.toolUseResult (the tool's native Out) via
            // renderToolResultMessage — DIFFERENT text. Indexing b.content
            // yields phantoms: /malware → matches the reminder, /background
            // → matches the model-only ID string, none render.
            //
            // Duck-type the native Out instead. Covers the common shapes:
            // Bash {stdout,stderr}, Grep {content,filenames}, Read
            // {file.content}. Unknown shapes index empty — under-count is
            // honest, phantom is a lie. Proper fix is per-tool
            // extractSearchText(Out) on the Tool interface (TODO).
            // 片段列表追加新条目，保持收集顺序与输入顺序一致。
            parts.push(toolResultSearchText(msg.toolUseResult))
          }
        }
        // 原始文本更新为 `parts.join('\n')`，确保共享工具后续读取最新状态。
        raw = parts.join('\n')
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    case 'assistant': {
      // c保存`msg.message.content`，供共享工具 transcript Search后续判断或输出使用。
      const c = msg.message.content
      // 满足 `Array.isArray(c)` 时，共享工具执行该分支。
      if (Array.isArray(c)) {
        // text blocks + tool_use inputs. tool_use renders as "⏺ Bash(cmd)"
        // — the command/pattern/path is visible and searchable-expected.
        // Skip thinking (hidden by hidePastThinking in transcript mount).
        // 原始文本更新为 `c`，确保共享工具后续读取最新状态。
        raw = c
          // 链式调用 flatMap，继续加工上一行在共享工具中产生的数据。
          .flatMap(b => {
            // 当 `b.type` 匹配 `'text'` 时，共享工具执行对应分支。
            if (b.type === 'text') return [b.text]
            // 满足 `b.type === 'tool_use') return [toolUseSearchText(b.input` 时，共享工具执行该分支。
            if (b.type === 'tool_use') return [toolUseSearchText(b.input)]
            // 返回列表结果，保留共享工具已经排好的条目顺序。
            return []
          })
          .join('\n')
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    case 'attachment': {
      // relevant_memories renders full m.content in transcript mode
      // (AttachmentMessage.tsx <Ansi>{m.content}</Ansi>). Visible but
      // unsearchable without this — [ dump finds it, / doesn't.
      // 当 `msg.attachment.type` 匹配 `'relevant_memories'` 时，共享工具执行对应分支。
      if (msg.attachment.type === 'relevant_memories') {
        // 原始文本更新为 `msg.attachment.memories.map(m => m.content).join('\n')`，确保共享工具后续读取最新状态。
        raw = msg.attachment.memories.map(m => m.content).join('\n')
      // 共享工具 transcript Search在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        // Mid-turn prompts — queued while an agent is running. Render via
        // UserTextMessage (AttachmentMessage.tsx:~348). stickyPromptText
        // (VirtualMessageList.tsx:~103) has the same guards — mirror here.
        msg.attachment.type === 'queued_command' &&
        msg.attachment.commandMode !== 'task-notification' &&
        !msg.attachment.isMeta
      ) {
        // p保存`msg.attachment.prompt`，供共享工具 transcript Search后续判断或输出使用。
        const p = msg.attachment.prompt
        // 共享工具 transcript Search在这里处理 `raw =`，完成这一小步状态转换。
        raw =
          typeof p === 'string'
            ? p
            // 这个回调绑定到 : p.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('\n')，负责共享工具在该局部场景下的响应。
            : p.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('\n')
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    case 'collapsed_read_search': {
      // relevant_memories attachments are absorbed into collapse groups
      // (collapseReadSearch.ts); their content is visible in transcript mode
      // via CollapsedReadSearchContent, so mirror it here for / search.
      // 满足 `msg.relevantMemories` 时，共享工具执行该分支。
      if (msg.relevantMemories) {
        // 原始文本更新为 `msg.relevantMemories.map(m => m.content).join('\n')`，确保共享工具后续读取最新状态。
        raw = msg.relevantMemories.map(m => m.content).join('\n')
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }
    default:
      // grouped_tool_use, system — no text content
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
  }
  // Strip <system-reminder> anywhere — Claude context, not user-visible.
  // Mid-message on cc -c resumes (memory reminders between prompt lines).
  // t 命名 `raw`，让后续代码直接表达这个值的用途。
  let t = raw
  // open保存`t.indexOf`，供共享工具后续处理使用。
  let open = t.indexOf('<system-reminder>')
  // while 使用 open >= 0 完成共享工具里的对应操作。
  while (open >= 0) {
    // close保存`t.indexOf`，供共享工具后续处理使用。
    const close = t.indexOf(SYSTEM_REMINDER_CLOSE, open)
    // 满足 `close < 0` 时，共享工具执行该分支。
    if (close < 0) break
    // t更新为 `t.slice(0, open) + t.slice(close + SYSTEM_REMINDER_CLOSE....`，确保共享工具后续读取最新状态。
    t = t.slice(0, open) + t.slice(close + SYSTEM_REMINDER_CLOSE.length)
    // open更新为 `t.indexOf('<system-reminder>')`，确保共享工具后续读取最新状态。
    open = t.indexOf('<system-reminder>')
  }
  // 返回 `t`，作为共享工具这次计算的结果。
  return t
}

/** Tool invocation display: renderToolUseMessage shows input fields like
 *  command (Bash), pattern (Grep), file_path (Read/Edit), prompt (Agent).
 *  Same duck-type strategy as toolResultSearchText — known field names,
 *  unknown → empty. Under-count > phantom. */
// toolUseSearchText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toolUseSearchText(input: unknown): string {
  // `!input || typeof input` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!input || typeof input !== 'object') return ''
  // o 命名 `input as Record<string, unknown>`，让后续代码直接表达这个值的用途。
  const o = input as Record<string, unknown>
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // renderToolUseMessage typically shows one or two of these as the
  // primary argument. tool_name itself is in the "⏺ Bash(...)" chrome,
  // handled by under-count (the overlay matches it but we don't count it).
  // 调用 for，触发共享工具此处需要的副作用。
  for (const k of [
    'command',
    'pattern',
    'file_path',
    'path',
    'prompt',
    'description',
    'query',
    'url',
    'skill', // SkillTool
  ]) {
    // v读取 `o[k]` 对应条目，后续围绕该成员继续处理。
    const v = o[k]
    // 满足 `typeof v === 'string') parts.push(v` 时，共享工具执行该分支。
    if (typeof v === 'string') parts.push(v)
  }
  // args[] (Tmux/TungstenTool), files[] (SendUserFile) — tool-use
  // renders the joined array as the primary display. Under-count > skip.
  // 按顺序遍历 `['args', 'files']` 中的k，逐个交给共享工具处理。
  for (const k of ['args', 'files']) {
    // v读取 `o[k]` 对应条目，后续围绕该成员继续处理。
    const v = o[k]
    // 只有 `Array.isArray(v) && v.every(x => typeof x === 'string')` 满足时，共享工具才执行该分支。
    if (Array.isArray(v) && v.every(x => typeof x === 'string')) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push((v as string[]).join(' '))
    }
  }
  // 返回 `parts.join('\n')`，作为共享工具这次计算的结果。
  return parts.join('\n')
}

/** Duck-type the tool's native Out for searchable text. Known shapes:
 *  {stdout,stderr} (Bash/Shell), {content} (Grep), {file:{content}} (Read),
 *  {filenames:[]} (Grep/Glob), {output} (generic). Falls back to concating
 *  all top-level string fields — crude but better than indexing model-chatter.
 *  Empty for unknown shapes: under-count > phantom. */
// toolResultSearchText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toolResultSearchText(r: unknown): string {
  // `!r || typeof r` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!r || typeof r !== 'object') return typeof r === 'string' ? r : ''
  // o 命名 `r as Record<string, unknown>`，让后续代码直接表达这个值的用途。
  const o = r as Record<string, unknown>
  // Known shapes first (common tools).
  // 当 `typeof o.stdout` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof o.stdout === 'string') {
    // err标记共享工具 transcript Search是否启用对应路径。
    const err = typeof o.stderr === 'string' ? o.stderr : ''
    // 返回 `o.stdout + (err ? '\n' + err : '')`，作为共享工具这次计算的结果。
    return o.stdout + (err ? '\n' + err : '')
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    o.file &&
    typeof o.file === 'object' &&
    typeof (o.file as { content?: unknown }).content === 'string'
  ) {
    // 返回 `(o.file as { content: string }).content`，作为共享工具这次计算的结果。
    return (o.file as { content: string }).content
  }
  // Known output-field names only. A blind walk would index metadata
  // the UI doesn't show (rawOutputPath, backgroundTaskId, filePath,
  // durationMs-as-string). Allowlist the fields tools actually render.
  // Tools not matching any shape index empty — add them here as found.
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // 按顺序遍历 `['content', 'output', 'result', 'text'` 中的k，逐个交给共享工具处理。
  for (const k of ['content', 'output', 'result', 'text', 'message']) {
    // v读取 `o[k]` 对应条目，后续围绕该成员继续处理。
    const v = o[k]
    // 满足 `typeof v === 'string') parts.push(v` 时，共享工具执行该分支。
    if (typeof v === 'string') parts.push(v)
  }
  // 按顺序遍历 `['filenames', 'lines', 'results']` 中的k，逐个交给共享工具处理。
  for (const k of ['filenames', 'lines', 'results']) {
    // v读取 `o[k]` 对应条目，后续围绕该成员继续处理。
    const v = o[k]
    // 只有 `Array.isArray(v) && v.every(x => typeof x === 'string')` 满足时，共享工具才执行该分支。
    if (Array.isArray(v) && v.every(x => typeof x === 'string')) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push((v as string[]).join('\n'))
    }
  }
  // 返回 `parts.join('\n')`，作为共享工具这次计算的结果。
  return parts.join('\n')
}
