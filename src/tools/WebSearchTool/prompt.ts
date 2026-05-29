// 引入 getLocalMonthYear，将 src/constants/common.js 中已经封装好的能力接到本文件流程里。
import { getLocalMonthYear } from 'src/constants/common.js'

// WEB_SEARCH_TOOL_NAME 命名 `'WebSearch'`，让后续代码直接表达这个值的用途。
export const WEB_SEARCH_TOOL_NAME = 'WebSearch'

// getWebSearchPrompt 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getWebSearchPrompt(): string {
  // currentMonthYear读取`getLocalMonthYear`，供工具调用后续处理使用。
  const currentMonthYear = getLocalMonthYear()
  // 返回 ```，作为工具调用这次计算的结果。
  return `
- Allows Claude to search the web and use the results to inform responses
- Provides up-to-date information for current events and recent data
- Returns search result information formatted as search result blocks, including links as markdown hyperlinks
- Use this tool for accessing information beyond Claude's knowledge cutoff
- Searches are performed automatically within a single API call

CRITICAL REQUIREMENT - You MUST follow this:
  - After answering the user's question, you MUST include a "Sources:" section at the end of your response
  - In the Sources section, list all relevant URLs from the search results as markdown hyperlinks: [Title](URL)
  - This is MANDATORY - never skip including sources in your response
  - Example format:

    [Your answer here]

    Sources:
    - [Source Title 1](https://example.com/1)
    - [Source Title 2](https://example.com/2)

Usage notes:
  - Domain filtering is supported to include or block specific websites
  - Web search is only available in the US

IMPORTANT - Use the correct year in search queries:
  - The current month is ${currentMonthYear}. You MUST use this year when searching for recent information, documentation, or current events.
  - Example: If the user asks for "latest React docs", search for "React documentation" with the current year, NOT last year
`
}
