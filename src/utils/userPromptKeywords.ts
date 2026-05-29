/**
 * Checks if input matches negative keyword patterns
 */
// matchesNegativeKeyword 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function matchesNegativeKeyword(input: string): boolean {
  // lowerInput保存`input.toLowerCase`，供共享工具后续处理使用。
  const lowerInput = input.toLowerCase()

  // negativePattern 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const negativePattern =
    /\b(wtf|wth|ffs|omfg|shit(ty|tiest)?|dumbass|horrible|awful|piss(ed|ing)? off|piece of (shit|crap|junk)|what the (fuck|hell)|fucking? (broken|useless|terrible|awful|horrible)|fuck you|screw (this|you)|so frustrating|this sucks|damn it)\b/

  // 返回 `negativePattern.test(lowerInput)`，作为共享工具这次计算的结果。
  return negativePattern.test(lowerInput)
}

/**
 * Checks if input matches keep going/continuation patterns
 */
// matchesKeepGoingKeyword 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function matchesKeepGoingKeyword(input: string): boolean {
  // lowerInput保存`input.toLowerCase`，供共享工具后续处理使用。
  const lowerInput = input.toLowerCase().trim()

  // Match "continue" only if it's the entire prompt
  // 当 `lowerInput` 匹配 `'continue'` 时，共享工具执行对应分支。
  if (lowerInput === 'continue') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Match "keep going" or "go on" anywhere in the input
  // keepGoingPattern保存`b`，供共享工具后续处理使用。
  const keepGoingPattern = /\b(keep going|go on)\b/
  // 返回 `keepGoingPattern.test(lowerInput)`，作为共享工具这次计算的结果。
  return keepGoingPattern.test(lowerInput)
}
