// Stub for external builds - classifier permissions feature is ANT-ONLY

// PROMPT_PREFIX保存`'prompt:'`，作为后续固定文本处理的输入。
export const PROMPT_PREFIX = 'prompt:'

// ClassifierResult 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClassifierResult = {
  matches: boolean
  matchedDescription?: string
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

// ClassifierBehavior 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClassifierBehavior = 'deny' | 'ask' | 'allow'

// extractPromptDescription 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractPromptDescription(
  _ruleContent: string | undefined,
): string | null {
  // 返回 `null`，作为权限判定这次计算的结果。
  return null
}

// createPromptRuleContent 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createPromptRuleContent(description: string): string {
  // 返回 ``${PROMPT_PREFIX} ${description.trim()}``，作为权限判定这次计算的结果。
  return `${PROMPT_PREFIX} ${description.trim()}`
}

// isClassifierPermissionsEnabled 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isClassifierPermissionsEnabled(): boolean {
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// getBashPromptDenyDescriptions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBashPromptDenyDescriptions(_context: unknown): string[] {
  // 返回列表结果，保留权限判定已经排好的条目顺序。
  return []
}

// getBashPromptAskDescriptions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBashPromptAskDescriptions(_context: unknown): string[] {
  // 返回列表结果，保留权限判定已经排好的条目顺序。
  return []
}

// getBashPromptAllowDescriptions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBashPromptAllowDescriptions(_context: unknown): string[] {
  // 返回列表结果，保留权限判定已经排好的条目顺序。
  return []
}

// classifyBashCommand 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function classifyBashCommand(
  _command: string,
  _cwd: string,
  _descriptions: string[],
  _behavior: ClassifierBehavior,
  _signal: AbortSignal,
  _isNonInteractiveSession: boolean,
): Promise<ClassifierResult> {
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    matches: false,
    confidence: 'high',
    reason: 'This feature is disabled',
  }
}

// generateGenericDescription 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateGenericDescription(
  _command: string,
  specificDescription: string | undefined,
  _signal: AbortSignal,
): Promise<string | null> {
  // 返回 `specificDescription || null`，作为权限判定这次计算的结果。
  return specificDescription || null
}
