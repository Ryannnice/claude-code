// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js'
// 引入 AgentTool，将 ../AgentTool/AgentTool.js 中已经封装好的能力接到本文件流程里。
import { AgentTool } from '../AgentTool/AgentTool.js'
// 引入 BashTool，将 ../BashTool/BashTool.js 中已经封装好的能力接到本文件流程里。
import { BashTool } from '../BashTool/BashTool.js'
// 引入 FileEditTool，将 ../FileEditTool/FileEditTool.js 中已经封装好的能力接到本文件流程里。
import { FileEditTool } from '../FileEditTool/FileEditTool.js'
// 引入 FileReadTool，将 ../FileReadTool/FileReadTool.js 中已经封装好的能力接到本文件流程里。
import { FileReadTool } from '../FileReadTool/FileReadTool.js'
// 引入 FileWriteTool，将 ../FileWriteTool/FileWriteTool.js 中已经封装好的能力接到本文件流程里。
import { FileWriteTool } from '../FileWriteTool/FileWriteTool.js'
// 引入 GlobTool，将 ../GlobTool/GlobTool.js 中已经封装好的能力接到本文件流程里。
import { GlobTool } from '../GlobTool/GlobTool.js'
// 引入 GrepTool，将 ../GrepTool/GrepTool.js 中已经封装好的能力接到本文件流程里。
import { GrepTool } from '../GrepTool/GrepTool.js'
// 引入 NotebookEditTool，将 ../NotebookEditTool/NotebookEditTool.js 中已经封装好的能力接到本文件流程里。
import { NotebookEditTool } from '../NotebookEditTool/NotebookEditTool.js'

// _primitiveTools 集合 先占位，稍后的条件分支会根据实际输入补齐它。
let _primitiveTools: readonly Tool[] | undefined

/**
 * Primitive tools hidden from direct model use when REPL mode is on
 * (REPL_ONLY_TOOLS) but still accessible inside the REPL VM context.
 * Exported so display-side code (collapseReadSearch, renderers) can
 * classify/render virtual messages for these tools even when they're
 * absent from the filtered execution tools list.
 *
 * Lazy getter — the import chain collapseReadSearch.ts → primitiveTools.ts
 * → FileReadTool.tsx → ... loops back through the tool registry, so a
 * top-level const hits "Cannot access before initialization". Deferring
 * to call time avoids the TDZ.
 *
 * Referenced directly rather than via getAllBaseTools() because that
 * excludes Glob/Grep when hasEmbeddedSearchTools() is true.
 */
// getReplPrimitiveTools 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getReplPrimitiveTools(): readonly Tool[] {
  // 返回 `(_primitiveTools ??= [`，作为工具调用这次计算的结果。
  return (_primitiveTools ??= [
    FileReadTool,
    FileWriteTool,
    FileEditTool,
    GlobTool,
    GrepTool,
    BashTool,
    NotebookEditTool,
    AgentTool,
  ])
}
