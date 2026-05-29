// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 getOutputStyleDirStyles，将 ../outputStyles/loadOutputStylesDir.js 中已经封装好的能力接到本文件流程里。
import { getOutputStyleDirStyles } from '../outputStyles/loadOutputStylesDir.js'
// 类型依赖 { OutputStyle } 来自 ../utils/config.js，用于校准output Styles的数据契约。
import type { OutputStyle } from '../utils/config.js'
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 loadPluginOutputStyles 工具函数，把通用处理留在 ../utils/plugins/loadPluginOutputStyles.js 中维护。
import { loadPluginOutputStyles } from '../utils/plugins/loadPluginOutputStyles.js'
// 类型依赖 { SettingSource } 来自 ../utils/settings/constants.js，用于校准output Styles的数据契约。
import type { SettingSource } from '../utils/settings/constants.js'
// 复用 getSettings_DEPRECATED 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'

// OutputStyleConfig 固化output Styles里传递的数据形状，帮助调用方按同一结构读写字段。
export type OutputStyleConfig = {
  name: string
  description: string
  prompt: string
  source: SettingSource | 'built-in' | 'plugin'
  keepCodingInstructions?: boolean
  /**
   * If true, this output style will be automatically applied when the plugin is enabled.
   * Only applicable to plugin output styles.
   * When multiple plugins have forced output styles, only one is chosen (logged via debug).
   */
  forceForPlugin?: boolean
}

// OutputStyles 固化output Styles里传递的数据形状，帮助调用方按同一结构读写字段。
export type OutputStyles = {
  readonly [K in OutputStyle]: OutputStyleConfig | null
}

// Used in both the Explanatory and Learning modes
// EXPLANATORY_FEATURE_PROMPT 命名 ```，让后续代码直接表达这个值的用途。
const EXPLANATORY_FEATURE_PROMPT = `
## Insights
In order to encourage learning, before and after writing code, always provide brief educational explanations about implementation choices using (with backticks):
"\`${figures.star} Insight ─────────────────────────────────────\`
[2-3 key educational points]
\`─────────────────────────────────────────────────\`"

These insights should be included in the conversation, not in the codebase. You should generally focus on interesting insights that are specific to the codebase or the code you just wrote, rather than general programming concepts.`

// DEFAULT_OUTPUT_STYLE_NAME 命名 `'default'`，让后续代码直接表达这个值的用途。
export const DEFAULT_OUTPUT_STYLE_NAME = 'default'

// OUTPUT_STYLE_CONFIG 配置 集中保存output Styles要一起传递的字段。
export const OUTPUT_STYLE_CONFIG: OutputStyles = {
  [DEFAULT_OUTPUT_STYLE_NAME]: null,
  Explanatory: {
    name: 'Explanatory',
    source: 'built-in',
    description:
      'Claude explains its implementation choices and codebase patterns',
    keepCodingInstructions: true,
    prompt: `You are an interactive CLI tool that helps users with software engineering tasks. In addition to software engineering tasks, you should provide educational insights about the codebase along the way.

You should be clear and educational, providing helpful explanations while remaining focused on the task. Balance educational content with task completion. When providing insights, you may exceed typical length constraints, but remain focused and relevant.

# Explanatory Style Active
${EXPLANATORY_FEATURE_PROMPT}`,
  },
  Learning: {
    name: 'Learning',
    source: 'built-in',
    description:
      'Claude pauses and asks you to write small pieces of code for hands-on practice',
    keepCodingInstructions: true,
    prompt: `You are an interactive CLI tool that helps users with software engineering tasks. In addition to software engineering tasks, you should help users learn more about the codebase through hands-on practice and educational insights.

You should be collaborative and encouraging. Balance task completion with learning by requesting user input for meaningful design decisions while handling routine implementation yourself.   

# Learning Style Active
## Requesting Human Contributions
In order to encourage learning, ask the human to contribute 2-10 line code pieces when generating 20+ lines involving:
- Design decisions (error handling, data structures)
- Business logic with multiple valid approaches  
- Key algorithms or interface definitions

**TodoList Integration**: If using a TodoList for the overall task, include a specific todo item like "Request human input on [specific decision]" when planning to request human input. This ensures proper task tracking. Note: TodoList is not required for all tasks.

Example TodoList flow:
   ✓ "Set up component structure with placeholder for logic"
   ✓ "Request human collaboration on decision logic implementation"
   ✓ "Integrate contribution and complete feature"

### Request Format
\`\`\`
${figures.bullet} **Learn by Doing**
**Context:** [what's built and why this decision matters]
**Your Task:** [specific function/section in file, mention file and TODO(human) but do not include line numbers]
**Guidance:** [trade-offs and constraints to consider]
\`\`\`

### Key Guidelines
- Frame contributions as valuable design decisions, not busy work
- You must first add a TODO(human) section into the codebase with your editing tools before making the Learn by Doing request      
- Make sure there is one and only one TODO(human) section in the code
- Don't take any action or output anything after the Learn by Doing request. Wait for human implementation before proceeding.

### Example Requests

**Whole Function Example:**
\`\`\`
${figures.bullet} **Learn by Doing**

**Context:** I've set up the hint feature UI with a button that triggers the hint system. The infrastructure is ready: when clicked, it calls selectHintCell() to determine which cell to hint, then highlights that cell with a yellow background and shows possible values. The hint system needs to decide which empty cell would be most helpful to reveal to the user.

**Your Task:** In sudoku.js, implement the selectHintCell(board) function. Look for TODO(human). This function should analyze the board and return {row, col} for the best cell to hint, or null if the puzzle is complete.

**Guidance:** Consider multiple strategies: prioritize cells with only one possible value (naked singles), or cells that appear in rows/columns/boxes with many filled cells. You could also consider a balanced approach that helps without making it too easy. The board parameter is a 9x9 array where 0 represents empty cells.
\`\`\`

**Partial Function Example:**
\`\`\`
${figures.bullet} **Learn by Doing**

**Context:** I've built a file upload component that validates files before accepting them. The main validation logic is complete, but it needs specific handling for different file type categories in the switch statement.

**Your Task:** In upload.js, inside the validateFile() function's switch statement, implement the 'case "document":' branch. Look for TODO(human). This should validate document files (pdf, doc, docx).

**Guidance:** Consider checking file size limits (maybe 10MB for documents?), validating the file extension matches the MIME type, and returning {valid: boolean, error?: string}. The file object has properties: name, size, type.
\`\`\`

**Debugging Example:**
\`\`\`
${figures.bullet} **Learn by Doing**

**Context:** The user reported that number inputs aren't working correctly in the calculator. I've identified the handleInput() function as the likely source, but need to understand what values are being processed.

**Your Task:** In calculator.js, inside the handleInput() function, add 2-3 console.log statements after the TODO(human) comment to help debug why number inputs fail.

**Guidance:** Consider logging: the raw input value, the parsed result, and any validation state. This will help us understand where the conversion breaks.
\`\`\`

### After Contributions
Share one insight connecting their code to broader patterns or system effects. Avoid praise or repetition.

## Insights
${EXPLANATORY_FEATURE_PROMPT}`,
  },
}

// getAllOutputStyles 集合保存`memoize`，供output Styles后续处理使用。
export const getAllOutputStyles = memoize(async function getAllOutputStyles(
  cwd: string,
): Promise<{ [styleName: string]: OutputStyleConfig | null }> {
  // customStyles 集合读取`getOutputStyleDirStyles`，供output Styles后续处理使用。
  const customStyles = await getOutputStyleDirStyles(cwd)
  // pluginStyles 插件数据读取`loadPluginOutputStyles`，供output Styles后续处理使用。
  const pluginStyles = await loadPluginOutputStyles()

  // Start with built-in modes
  // allStyles 集合 集中保存output Styles要一起传递的字段。
  const allStyles = {
    ...OUTPUT_STYLE_CONFIG,
  }

  // managedStyles 集合筛选`customStyles.filter`，供output Styles后续处理使用。
  const managedStyles = customStyles.filter(
    // style更新为 `> style.source === 'policySettings'`，确保outputStyles后续读取最新状态。
    style => style.source === 'policySettings',
  )
  // userStyles 集合筛选`customStyles.filter`，供output Styles后续处理使用。
  const userStyles = customStyles.filter(
    // style更新为 `> style.source === 'userSettings'`，确保outputStyles后续读取最新状态。
    style => style.source === 'userSettings',
  )
  // projectStyles 集合筛选`customStyles.filter`，供output Styles后续处理使用。
  const projectStyles = customStyles.filter(
    // style更新为 `> style.source === 'projectSettings'`，确保outputStyles后续读取最新状态。
    style => style.source === 'projectSettings',
  )

  // Add styles in priority order (lowest to highest): built-in, plugin, managed, user, project
  // styleGroups 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const styleGroups = [pluginStyles, userStyles, projectStyles, managedStyles]

  // 按顺序遍历 `styleGroups` 中的styles 集合，逐个交给output Styles处理。
  for (const styles of styleGroups) {
    // 按顺序遍历 `styles` 中的style，逐个交给output Styles处理。
    for (const style of styles) {
      // 名称更新为 `{`，确保output Styles后续读取最新状态。
      allStyles[style.name] = {
        name: style.name,
        description: style.description,
        prompt: style.prompt,
        source: style.source,
        keepCodingInstructions: style.keepCodingInstructions,
        forceForPlugin: style.forceForPlugin,
      }
    }
  }

  // 返回 `allStyles`，作为output Styles这次计算的结果。
  return allStyles
})

// clearAllOutputStylesCache 封装outputStyles的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAllOutputStylesCache(): void {
  // 调用 getAllOutputStyles.cache?.clear?.()，完成这一处局部操作。
  getAllOutputStyles.cache?.clear?.()
}

// getOutputStyleConfig 封装outputStyles的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getOutputStyleConfig(): Promise<OutputStyleConfig | null> {
  // allStyles 集合读取`getAllOutputStyles`，供output Styles后续处理使用。
  const allStyles = await getAllOutputStyles(getCwd())

  // Check for forced plugin output styles
  // forcedStyles 集合派生`Object.values`，供output Styles后续处理使用。
  const forcedStyles = Object.values(allStyles).filter(
    // 这个回调绑定到 (style): style is OutputStyleConfig =>，负责output Styles在该局部场景下的响应。
    (style): style is OutputStyleConfig =>
      style !== null &&
      style.source === 'plugin' &&
      style.forceForPlugin === true,
  )

  // firstForcedStyle读取 `forcedStyles[0]` 对应条目，后续围绕该成员继续处理。
  const firstForcedStyle = forcedStyles[0]
  // 满足 `firstForcedStyle` 时，output Styles执行该分支。
  if (firstForcedStyle) {
    // 满足 `forcedStyles.length > 1` 时，output Styles执行该分支。
    if (forcedStyles.length > 1) {
      // 记录output Styles运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        // 这个回调绑定到 `Multiple plugins have forced output styles: ${forcedStyles.map(s => s.name).join(',…，负责output Styles在该局部场景下的响应。
        `Multiple plugins have forced output styles: ${forcedStyles.map(s => s.name).join(', ')}. Using: ${firstForcedStyle.name}`,
        { level: 'warn' },
      )
    }
    // 记录output Styles运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Using forced plugin output style: ${firstForcedStyle.name}`,
    )
    // 返回 `firstForcedStyle`，作为output Styles这次计算的结果。
    return firstForcedStyle
  }

  // settings 集合读取`getSettings_DEPRECATED`，供output Styles后续处理使用。
  const settings = getSettings_DEPRECATED()
  // outputStyle 命名 `(settings?.outputStyle ||`，让后续代码直接表达这个值的用途。
  const outputStyle = (settings?.outputStyle ||
    DEFAULT_OUTPUT_STYLE_NAME) as string

  // 返回 `allStyles[outputStyle] ?? null`，作为output Styles这次计算的结果。
  return allStyles[outputStyle] ?? null
}

// hasCustomOutputStyle 封装outputStyles的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasCustomOutputStyle(): boolean {
  // style读取`getSettings_DEPRECATED`，供output Styles后续处理使用。
  const style = getSettings_DEPRECATED()?.outputStyle
  // 返回 `style !== undefined && style !== DEFAULT_OUTPUT_STYLE_NAME`，作为output Styles这次计算的结果。
  return style !== undefined && style !== DEFAULT_OUTPUT_STYLE_NAME
}
