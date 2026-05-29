// 引入 BROWSER_TOOLS，将 @ant/claude-for-chrome-mcp 中已经封装好的能力接到本文件流程里。
import { BROWSER_TOOLS } from '@ant/claude-for-chrome-mcp'
// 复用 BASE_CHROME_PROMPT 工具函数，把通用处理留在 ../../utils/claudeInChrome/prompt.js 中维护。
import { BASE_CHROME_PROMPT } from '../../utils/claudeInChrome/prompt.js'
// 复用 shouldAutoEnableClaudeInChrome 工具函数，把通用处理留在 ../../utils/claudeInChrome/setup.js 中维护。
import { shouldAutoEnableClaudeInChrome } from '../../utils/claudeInChrome/setup.js'
// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'

// CLAUDE_IN_CHROME_MCP_TOOLS 集合派生`BROWSER_TOOLS.map`，供claude In Chrome后续处理使用。
const CLAUDE_IN_CHROME_MCP_TOOLS = BROWSER_TOOLS.map(
  // 工具更新为 `> `mcp__claude-in-chrome__${tool.name}``，确保claudeInChrome后续读取最新状态。
  tool => `mcp__claude-in-chrome__${tool.name}`,
)

// SKILL_ACTIVATION_MESSAGE 消息数据固定为 ```，作为claude In Chrome后续展示或比较的基准。
const SKILL_ACTIVATION_MESSAGE = `
Now that this skill is invoked, you have access to Chrome browser automation tools. You can now use the mcp__claude-in-chrome__* tools to interact with web pages.

IMPORTANT: Start by calling mcp__claude-in-chrome__tabs_context_mcp to get information about the user's current browser tabs.
`

// registerClaudeInChromeSkill 封装claudeInChrome的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerClaudeInChromeSkill(): void {
  // 调用 registerBundledSkill，触发claude In Chrome此处需要的副作用。
  registerBundledSkill({
    name: 'claude-in-chrome',
    description:
      'Automates your Chrome browser to interact with web pages - clicking elements, filling forms, capturing screenshots, reading console logs, and navigating sites. Opens pages in new tabs within your existing Chrome session. Requires site-level permissions before executing (configured in the extension).',
    whenToUse:
      'When the user wants to interact with web pages, automate browser tasks, capture screenshots, read console logs, or perform any browser-based actions. Always invoke BEFORE attempting to use any mcp__claude-in-chrome__* tools.',
    allowedTools: CLAUDE_IN_CHROME_MCP_TOOLS,
    userInvocable: true,
    // 这个回调绑定到 isEnabled: () => shouldAutoEnableClaudeInChrome(),，负责claude In Chrome在该局部场景下的响应。
    isEnabled: () => shouldAutoEnableClaudeInChrome(),
    // getPromptForCommand 根据 args 读取或计算claude In Chrome需要的结果。
    async getPromptForCommand(args) {
      // 提示词 命名 ``${BASE_CHROME_PROMPT}\n${SKILL_ACTIVATION_MESSAGE}``，让后续代码直接表达这个值的用途。
      let prompt = `${BASE_CHROME_PROMPT}\n${SKILL_ACTIVATION_MESSAGE}`
      // 满足 `args` 时，claude In Chrome执行该分支。
      if (args) {
        // claude In Chrome在这里处理 `prompt += `\n## Task\n\n${args}``，完成这一小步状态转换。
        prompt += `\n## Task\n\n${args}`
      }
      // 返回列表结果，保留claude In Chrome已经排好的条目顺序。
      return [{ type: 'text', text: prompt }]
    },
  })
}
