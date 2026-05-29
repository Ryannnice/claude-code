/**
 * Matches any XML-like `<tag>…</tag>` block (lowercase tag names, optional
 * attributes, multi-line content). Used to strip system-injected wrapper tags
 * from display titles — IDE context, slash-command markers, hook output,
 * task notifications, channel messages, etc. A generic pattern avoids
 * maintaining an ever-growing allowlist that falls behind as new notification
 * types are added.
 *
 * Only matches lowercase tag names (`[a-z][\w-]*`) so user prose mentioning
 * JSX/HTML components ("fix the <Button> layout", "<!DOCTYPE html>") passes
 * through — those start with uppercase or `!`. The non-greedy body with a
 * backreferenced closing tag keeps adjacent blocks separate; unpaired angle
 * brackets ("when x < y") don't match.
 */
// XML_TAG_BLOCK_PATTERN读取 `/<([a-z][\w-]*)(?:\s[^>]*)?>[\s\S]*?<\/\1>\n?/g` 对应条目，后续围绕该成员继续处理。
const XML_TAG_BLOCK_PATTERN = /<([a-z][\w-]*)(?:\s[^>]*)?>[\s\S]*?<\/\1>\n?/g

/**
 * Strip XML-like tag blocks from text for use in UI titles (/rewind, /resume,
 * bridge session titles). System-injected context — IDE metadata, hook output,
 * task notifications — arrives wrapped in tags and should never surface as a
 * title.
 *
 * If stripping would result in empty text, returns the original unchanged
 * (better to show something than nothing).
 */
// stripDisplayTags 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripDisplayTags(text: string): string {
  // 结果格式化`text.replace`，供共享工具后续处理使用。
  const result = text.replace(XML_TAG_BLOCK_PATTERN, '').trim()
  // 返回 `result || text`，作为共享工具这次计算的结果。
  return result || text
}

/**
 * Like stripDisplayTags but returns empty string when all content is tags.
 * Used by getLogDisplayTitle to detect command-only prompts (e.g. /clear)
 * so they can fall through to the next title fallback, and by extractTitleText
 * to skip pure-XML messages during bridge title derivation.
 */
// stripDisplayTagsAllowEmpty 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripDisplayTagsAllowEmpty(text: string): string {
  // 返回 `text.replace(XML_TAG_BLOCK_PATTERN, '').trim()`，作为共享工具这次计算的结果。
  return text.replace(XML_TAG_BLOCK_PATTERN, '').trim()
}

// IDE_CONTEXT_TAGS_PATTERN 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const IDE_CONTEXT_TAGS_PATTERN =
  /<(ide_opened_file|ide_selection)(?:\s[^>]*)?>[\s\S]*?<\/\1>\n?/g

/**
 * Strip only IDE-injected context tags (ide_opened_file, ide_selection).
 * Used by textForResubmit so UP-arrow resubmit preserves user-typed content
 * including lowercase HTML like `<code>foo</code>` while dropping IDE noise.
 */
// stripIdeContextTags 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripIdeContextTags(text: string): string {
  // 返回 `text.replace(IDE_CONTEXT_TAGS_PATTERN, '').trim()`，作为共享工具这次计算的结果。
  return text.replace(IDE_CONTEXT_TAGS_PATTERN, '').trim()
}
