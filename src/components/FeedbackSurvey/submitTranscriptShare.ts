// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile, stat } from 'fs/promises'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准终端渲染的数据契约。
import type { Message } from '../../types/message.js'
// 复用 checkAndRefreshOAuthTokenIfNeeded 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { checkAndRefreshOAuthTokenIfNeeded } from '../../utils/auth.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 getAuthHeaders、getUserAgent 工具函数，把通用处理留在 ../../utils/http.js 中维护。
import { getAuthHeaders, getUserAgent } from '../../utils/http.js'
// 复用 normalizeMessagesForAPI 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { normalizeMessagesForAPI } from '../../utils/messages.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  extractAgentIdsFromMessages,
  getTranscriptPath,
  loadSubagentTranscripts,
  MAX_TRANSCRIPT_READ_BYTES,
} from '../../utils/sessionStorage.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 引入 redactSensitiveInfo，将 ../Feedback.js 中已经封装好的能力接到本文件流程里。
import { redactSensitiveInfo } from '../Feedback.js'

// TranscriptShareResult 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TranscriptShareResult = {
  success: boolean
  transcriptId?: string
}

// TranscriptShareTrigger 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TranscriptShareTrigger =
  | 'bad_feedback_survey'
  | 'good_feedback_survey'
  | 'frustration'
  | 'memory_survey'

// submitTranscriptShare 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function submitTranscriptShare(
  messages: Message[],
  trigger: TranscriptShareTrigger,
  appearanceId: string,
): Promise<TranscriptShareResult> {
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Collecting transcript for sharing', { level: 'info' })

    // transcript保存`normalizeMessagesForAPI`，供终端渲染后续处理使用。
    const transcript = normalizeMessagesForAPI(messages)

    // Collect subagent transcripts
    // agentIds 集合保存`extractAgentIdsFromMessages`，供终端渲染后续处理使用。
    const agentIds = extractAgentIdsFromMessages(messages)
    // subagentTranscripts 集合读取`loadSubagentTranscripts`，供终端渲染后续处理使用。
    const subagentTranscripts = await loadSubagentTranscripts(agentIds)

    // Read raw JSONL transcript (with size guard to prevent OOM)
    // rawTranscriptJsonl 先占位，稍后的条件分支会根据实际输入补齐它。
    let rawTranscriptJsonl: string | undefined
    // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
    try {
      // transcriptPath 路径数据读取`getTranscriptPath`，供终端渲染后续处理使用。
      const transcriptPath = getTranscriptPath()
      // 从 `await stat(transcriptPath)` 解构 size，减少终端 UI 组件 submit Transcript Share对同一对象的重复访问。
      const { size } = await stat(transcriptPath)
      // 满足 `size <= MAX_TRANSCRIPT_READ_BYTES` 时，终端渲染执行该分支。
      if (size <= MAX_TRANSCRIPT_READ_BYTES) {
        // rawTranscriptJsonl更新为 `await readFile(transcriptPath, 'utf-8')`，确保终端 UI后续读取最新状态。
        rawTranscriptJsonl = await readFile(transcriptPath, 'utf-8')
      } else {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping raw transcript read: file too large (${size} bytes)`,
          { level: 'warn' },
        )
      }
    } catch {
      // File may not exist
    }

    // data集中保存终端 UI submit Transcript Sh...要一起传递的字段。
    const data = {
      trigger,
      version: MACRO.VERSION,
      platform: process.platform,
      transcript,
      subagentTranscripts:
        Object.keys(subagentTranscripts).length > 0
          ? subagentTranscripts
          : undefined,
      rawTranscriptJsonl,
    }

    // 文本内容保存`redactSensitiveInfo`，供终端渲染后续处理使用。
    const content = redactSensitiveInfo(jsonStringify(data))

    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续终端 UI 组件 submit Transcript Share的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()

    // authResult读取`getAuthHeaders`，供终端渲染后续处理使用。
    const authResult = getAuthHeaders()
    // 满足 `authResult.error` 时，终端渲染执行该分支。
    if (authResult.error) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return { success: false }
    }

    // 请求头 集中保存终端 UI 组件 submit Transcript Share要一起传递的字段。
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent(),
      ...authResult.headers,
    }

    // 接口响应保存`axios.post`，供终端渲染后续处理使用。
    const response = await axios.post(
      'https://api.anthropic.com/api/claude_code_shared_session_transcripts',
      { content, appearance_id: appearanceId },
      {
        headers,
        timeout: 30000,
      },
    )

    // 只有 `response.status === 200 || response.status === 201` 满足时，终端渲染才执行该分支。
    if (response.status === 200 || response.status === 201) {
      // 结果 命名 `response.data`，让后续代码直接表达这个值的用途。
      const result = response.data
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Transcript shared successfully', { level: 'info' })
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        success: true,
        transcriptId: result?.transcript_id,
      }
    }

    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { success: false }
  } catch (err) {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logForDebugging(errorMessage(err), {
      level: 'error',
    })
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return { success: false }
  }
}
