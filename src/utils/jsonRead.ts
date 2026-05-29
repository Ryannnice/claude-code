/**
 * Leaf stripBOM — extracted from json.ts to break settings → json → log →
 * types/logs → … → settings. json.ts imports this for its memoized+logging
 * safeParseJSON; leaf callers that can't import json.ts use stripBOM +
 * jsonParse inline (syncCacheState does this).
 *
 * UTF-8 BOM (U+FEFF): PowerShell 5.x writes UTF-8 with BOM by default
 * (Out-File, Set-Content). We can't control user environments, so strip on
 * read. Without this, JSON.parse fails with "Unexpected token".
 */

// UTF8_BOM 命名 `'\uFEFF'`，让后续代码直接表达这个值的用途。
const UTF8_BOM = '\uFEFF'

// stripBOM 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripBOM(content: string): string {
  // 返回 `content.startsWith(UTF8_BOM) ? content.slice(1) : content`，作为共享工具这次计算的结果。
  return content.startsWith(UTF8_BOM) ? content.slice(1) : content
}
