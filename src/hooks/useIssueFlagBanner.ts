// 引入 useMemo、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo, useRef } from 'react'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../tools/BashTool/toolName.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message } from '../types/message.js'
// 复用 getUserMessageText 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { getUserMessageText } from '../utils/messages.js'

// EXTERNAL_COMMAND_PATTERNS 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
const EXTERNAL_COMMAND_PATTERNS = [
  /\bcurl\b/,
  /\bwget\b/,
  /\bssh\b/,
  /\bkubectl\b/,
  /\bsrun\b/,
  /\bdocker\b/,
  /\bbq\b/,
  /\bgsutil\b/,
  /\bgcloud\b/,
  /\baws\b/,
  /\bgit\s+push\b/,
  /\bgit\s+pull\b/,
  /\bgit\s+fetch\b/,
  /\bgh\s+(pr|issue)\b/,
  /\bnc\b/,
  /\bncat\b/,
  /\btelnet\b/,
  /\bftp\b/,
]

// FRICTION_PATTERNS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const FRICTION_PATTERNS = [
  // "No," or "No!" at start — comma/exclamation implies correction tone
  // (avoids "No problem", "No thanks", "No I think we should...")
  /^no[,!]\s/i,
  // Direct corrections about Claude's output
  /\bthat'?s (wrong|incorrect|not (what|right|correct))\b/i,
  /\bnot what I (asked|wanted|meant|said)\b/i,
  // Referencing prior instructions Claude missed
  /\bI (said|asked|wanted|told you|already said)\b/i,
  // Questioning Claude's actions
  /\bwhy did you\b/i,
  /\byou should(n'?t| not)? have\b/i,
  /\byou were supposed to\b/i,
  // Explicit retry/revert of Claude's work
  /\btry again\b/i,
  /\b(undo|revert) (that|this|it|what you)\b/i,
]

// isSessionContainerCompatible 封装useIssueFlagBanner的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSessionContainerCompatible(messages: Message[]): boolean {
  // 按顺序遍历 `messages` 中的消息，逐个交给React hook处理。
  for (const msg of messages) {
    // `msg.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'assistant') {
      // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
      continue
    }
    // 文本内容保存`msg.message.content`，供后续判断或组装使用。
    const content = msg.message.content
    // 满足 `!Array.isArray(content)` 时，React hook执行该分支。
    if (!Array.isArray(content)) {
      // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
      continue
    }
    // 按顺序遍历 `content` 中的block，逐个交给React hook处理。
    for (const block of content) {
      // `block.type` 与 `'tool_use' || !('name' in block)` 不一致时刷新派生状态，避免使用过期结果。
      if (block.type !== 'tool_use' || !('name' in block)) {
        // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
        continue
      }
      // toolName保存`block.name as string`，供React hook use Issue ...后续判断或输出使用。
      const toolName = block.name as string
      // 满足 `toolName.startsWith('mcp__')` 时，React hook执行该分支。
      if (toolName.startsWith('mcp__')) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 满足 `toolName === BASH_TOOL_NAME` 时，React hook执行该分支。
      if (toolName === BASH_TOOL_NAME) {
        // 用户输入保存`(block as { input?: Record<string, unknown> }).input`，供React hook use Issue ...后续判断或输出使用。
        const input = (block as { input?: Record<string, unknown> }).input
        // 命令标记React hook use Issue ...是否启用对应路径。
        const command = (input?.command as string) || ''
        // 满足 `EXTERNAL_COMMAND_PATTERNS.some(p => p.test(command))` 时，React hook执行该分支。
        if (EXTERNAL_COMMAND_PATTERNS.some(p => p.test(command))) {
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
      }
    }
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// hasFrictionSignal 封装useIssueFlagBanner的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasFrictionSignal(messages: Message[]): boolean {
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让React hook 状态流逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息 命名 `messages[i]!`，让后续代码直接表达这个值的用途。
    const msg = messages[i]!
    // `msg.type` 与 `'user'` 不一致时刷新派生状态，避免使用过期结果。
    if (msg.type !== 'user') {
      // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
      continue
    }
    // 文本读取`getUserMessageText`，供React hook后续处理使用。
    const text = getUserMessageText(msg)
    // 文本缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!text) {
      // 跳过当前项，继续处理React hook 状态流中的下一轮循环。
      continue
    }
    // 返回 `FRICTION_PATTERNS.some(p => p.test(text))`，作为React hook 状态流这次计算的结果。
    return FRICTION_PATTERNS.some(p => p.test(text))
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// MIN_SUBMIT_COUNT 数量 命名 `3`，让后续代码直接表达这个值的用途。
const MIN_SUBMIT_COUNT = 3
// COOLDOWN_MS 集合保存`30 * 60 * 1000`，供React hook use Issue ...后续判断或输出使用。
const COOLDOWN_MS = 30 * 60 * 1000

// useIssueFlagBanner 封装useIssueFlagBanner的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useIssueFlagBanner(
  messages: Message[],
  submitCount: number,
): boolean {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // biome-ignore lint/correctness/useHookAtTopLevel: process.env.USER_TYPE is a compile-time constant
  // lastTriggeredAtRef 引用保存`useRef`，供React hook后续处理使用。
  const lastTriggeredAtRef = useRef(0)
  // biome-ignore lint/correctness/useHookAtTopLevel: process.env.USER_TYPE is a compile-time constant
  // activeForSubmitRef 引用保存`useRef`，供React hook后续处理使用。
  const activeForSubmitRef = useRef(-1)

  // Memoize the O(messages) scans. This hook runs on every REPL render
  // (including every keystroke), but messages is stable during typing.
  // isSessionContainerCompatible walks all messages + regex-tests each
  // bash command — by far the heaviest work here.
  // biome-ignore lint/correctness/useHookAtTopLevel: process.env.USER_TYPE is a compile-time constant
  // shouldTrigger记录 `useMemo` 是否成立，React hook随后按该结果分支。
  const shouldTrigger = useMemo(
    () => isSessionContainerCompatible(messages) && hasFrictionSignal(messages),
    [messages],
  )

  // Keep showing the banner until the user submits another message
  // 满足 `activeForSubmitRef.current === submitCount` 时，React hook执行该分支。
  if (activeForSubmitRef.current === submitCount) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 满足 `Date.now() - lastTriggeredAtRef.current < COOLDOWN_MS` 时，React hook执行该分支。
  if (Date.now() - lastTriggeredAtRef.current < COOLDOWN_MS) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `submitCount < MIN_SUBMIT_COUNT` 时，React hook执行该分支。
  if (submitCount < MIN_SUBMIT_COUNT) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // shouldTrigger缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!shouldTrigger) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // current更新为 `Date.now()`，确保useIssueFlagBanner后续读取最新状态。
  lastTriggeredAtRef.current = Date.now()
  // current更新为 `submitCount`，确保useIssueFlagBanner后续读取最新状态。
  activeForSubmitRef.current = submitCount
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}
