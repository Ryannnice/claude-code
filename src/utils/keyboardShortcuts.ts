// Special characters that macOS Option+key produces, mapped to their
// keybinding equivalents. Used to detect Option+key shortcuts on macOS
// terminals that don't have "Option as Meta" enabled.
// MACOS_OPTION_SPECIAL_CHARS 集合集中保存共享工具 keyboard Shortcuts要一起传递的字段。
export const MACOS_OPTION_SPECIAL_CHARS = {
  '†': 'alt+t', // Option+T -> thinking toggle
  π: 'alt+p', // Option+P -> model picker
  ø: 'alt+o', // Option+O -> fast mode
} as const satisfies Record<string, string>

// isMacosOptionChar 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMacosOptionChar(
  char: string,
): char is keyof typeof MACOS_OPTION_SPECIAL_CHARS {
  // 返回 `char in MACOS_OPTION_SPECIAL_CHARS`，作为共享工具这次计算的结果。
  return char in MACOS_OPTION_SPECIAL_CHARS
}
