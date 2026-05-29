// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID, type UUID } from 'crypto'
// 引入 validateUuid，将 ./uuid.js 中已经封装好的能力接到本文件流程里。
import { validateUuid } from './uuid.js'

// ParsedSessionUrl 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedSessionUrl = {
  sessionId: UUID
  ingressUrl: string | null
  isUrl: boolean
  jsonlFile: string | null
  isJsonlFile: boolean
}

/**
 * Parses a session resume identifier which can be either:
 * - A URL containing session ID (e.g., https://api.example.com/v1/session_ingress/session/550e8400-e29b-41d4-a716-446655440000)
 * - A plain session ID (UUID)
 *
 * @param resumeIdentifier - The URL or session ID to parse
 * @returns Parsed session information or null if invalid
 */
// parseSessionIdentifier 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseSessionIdentifier(
  resumeIdentifier: string,
): ParsedSessionUrl | null {
  // Check for JSONL file path before URL parsing, since Windows absolute
  // paths (e.g., C:\path\file.jsonl) are parsed as valid URLs with C: as protocol
  // 满足 `resumeIdentifier.toLowerCase().endsWith('.jsonl')` 时，共享工具执行该分支。
  if (resumeIdentifier.toLowerCase().endsWith('.jsonl')) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      sessionId: randomUUID() as UUID,
      ingressUrl: null,
      isUrl: false,
      jsonlFile: resumeIdentifier,
      isJsonlFile: true,
    }
  }

  // Check if it's a plain UUID
  // 满足 `validateUuid(resumeIdentifier)` 时，共享工具执行该分支。
  if (validateUuid(resumeIdentifier)) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      sessionId: resumeIdentifier as UUID,
      ingressUrl: null,
      isUrl: false,
      jsonlFile: null,
      isJsonlFile: false,
    }
  }

  // Check if it's a URL
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // URL保存`URL`，供共享工具后续处理使用。
    const url = new URL(resumeIdentifier)

    // Use the entire URL as the ingress URL
    // Always generate a random session ID
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      sessionId: randomUUID() as UUID,
      ingressUrl: url.href,
      isUrl: true,
      jsonlFile: null,
      isJsonlFile: false,
    }
  } catch {
    // Not a valid URL
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}
