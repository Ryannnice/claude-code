// 类型依赖 { HistoryMode } 来自 src/hooks/useArrowKeyHistory.js，用于校准终端渲染的数据契约。
import type { HistoryMode } from 'src/hooks/useArrowKeyHistory.js'
// 类型依赖 { PromptInputMode } 来自 src/types/textInputTypes.js，用于校准终端渲染的数据契约。
import type { PromptInputMode } from 'src/types/textInputTypes.js'

// prependModeCharacterToInput 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prependModeCharacterToInput(
  input: string,
  mode: PromptInputMode,
): string {
  // 按照 mode 的取值选择终端渲染的具体处理分支。
  switch (mode) {
    case 'bash':
      // 返回 ``!${input}``，作为终端渲染这次计算的结果。
      return `!${input}`
    default:
      // 返回 `input`，作为终端渲染这次计算的结果。
      return input
  }
}

// getModeFromInput 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModeFromInput(input: string): HistoryMode {
  // 满足 `input.startsWith('!')` 时，终端渲染执行该分支。
  if (input.startsWith('!')) {
    // 返回 `'bash'`，作为终端渲染这次计算的结果。
    return 'bash'
  }
  // 返回 `'prompt'`，作为终端渲染这次计算的结果。
  return 'prompt'
}

// getValueFromInput 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getValueFromInput(input: string): string {
  // mode读取`getModeFromInput`，供终端渲染后续处理使用。
  const mode = getModeFromInput(input)
  // 当 `mode` 匹配 `'prompt'` 时，终端渲染执行对应分支。
  if (mode === 'prompt') {
    // 返回 `input`，作为终端渲染这次计算的结果。
    return input
  }
  // 返回 `input.slice(1)`，作为终端渲染这次计算的结果。
  return input.slice(1)
}

// isInputModeCharacter 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInputModeCharacter(input: string): boolean {
  // 返回 `input === '!'`，作为终端渲染这次计算的结果。
  return input === '!'
}
