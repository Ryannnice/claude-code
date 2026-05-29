// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { PartialCompactDirection } 来自 ../../types/message.js，用于校准服务层 prompt的数据契约。
import type { PartialCompactDirection } from '../../types/message.js'

// Dead code elimination: conditional import for proactive mode
/* eslint-disable @typescript-eslint/no-require-imports */
// proactiveModule 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const proactiveModule =
  feature('PROACTIVE') || feature('KAIROS')
    ? (require('../../proactive/index.js') as typeof import('../../proactive/index.js'))
    : null
/* eslint-enable @typescript-eslint/no-require-imports */

// Aggressive no-tools preamble. The cache-sharing fork path inherits the
// parent's full tool set (required for cache-key match), and on Sonnet 4.6+
// adaptive-thinking models the model sometimes attempts a tool call despite
// the weaker trailer instruction. With maxTurns: 1, a denied tool call means
// no text output → falls through to the streaming fallback (2.79% on 4.6 vs
// 0.01% on 4.5). Putting this FIRST and making it explicit about rejection
// consequences prevents the wasted turn.
// NO_TOOLS_PREAMBLE保存``CRITICAL: Respond with TEXT ONLY. Do NOT call any tools.`，作为后续固定文本处理的输入。
const NO_TOOLS_PREAMBLE = `CRITICAL: Respond with TEXT ONLY. Do NOT call any tools.

- Do NOT use Read, Bash, Grep, Glob, Edit, Write, or ANY other tool.
- You already have all the context you need in the conversation above.
- Tool calls will be REJECTED and will waste your only turn — you will fail the task.
- Your entire response must be plain text: an <analysis> block followed by a <summary> block.

`

// Two variants: BASE scopes to "the conversation", PARTIAL scopes to "the
// recent messages". The <analysis> block is a drafting scratchpad that
// formatCompactSummary() strips before the summary reaches context.
// DETAILED_ANALYSIS_INSTRUCTION_BASE 命名 ``Before providing your final summary, wrap your analysis ...`，让后续代码直接表达这个值的用途。
const DETAILED_ANALYSIS_INSTRUCTION_BASE = `Before providing your final summary, wrap your analysis in <analysis> tags to organize your thoughts and ensure you've covered all necessary points. In your analysis process:

1. Chronologically analyze each message and section of the conversation. For each section thoroughly identify:
   - The user's explicit requests and intents
   - Your approach to addressing the user's requests
   - Key decisions, technical concepts and code patterns
   - Specific details like:
     - file names
     - full code snippets
     - function signatures
     - file edits
   - Errors that you ran into and how you fixed them
   - Pay special attention to specific user feedback that you received, especially if the user told you to do something differently.
2. Double-check for technical accuracy and completeness, addressing each required element thoroughly.`

// DETAILED_ANALYSIS_INSTRUCTION_PARTIAL保存``Before providing your final summary, wrap your analysis ...`，作为后续固定文本处理的输入。
const DETAILED_ANALYSIS_INSTRUCTION_PARTIAL = `Before providing your final summary, wrap your analysis in <analysis> tags to organize your thoughts and ensure you've covered all necessary points. In your analysis process:

1. Analyze the recent messages chronologically. For each section thoroughly identify:
   - The user's explicit requests and intents
   - Your approach to addressing the user's requests
   - Key decisions, technical concepts and code patterns
   - Specific details like:
     - file names
     - full code snippets
     - function signatures
     - file edits
   - Errors that you ran into and how you fixed them
   - Pay special attention to specific user feedback that you received, especially if the user told you to do something differently.
2. Double-check for technical accuracy and completeness, addressing each required element thoroughly.`

// BASE_COMPACT_PROMPT固定为 ``Your task is to create a detailed summary of the convers...`，作为服务层 prompt后续展示或比较的基准。
const BASE_COMPACT_PROMPT = `Your task is to create a detailed summary of the conversation so far, paying close attention to the user's explicit requests and your previous actions.
This summary should be thorough in capturing technical details, code patterns, and architectural decisions that would be essential for continuing development work without losing context.

${DETAILED_ANALYSIS_INSTRUCTION_BASE}

Your summary should include the following sections:

1. Primary Request and Intent: Capture all of the user's explicit requests and intents in detail
2. Key Technical Concepts: List all important technical concepts, technologies, and frameworks discussed.
3. Files and Code Sections: Enumerate specific files and code sections examined, modified, or created. Pay special attention to the most recent messages and include full code snippets where applicable and include a summary of why this file read or edit is important.
4. Errors and fixes: List all errors that you ran into, and how you fixed them. Pay special attention to specific user feedback that you received, especially if the user told you to do something differently.
5. Problem Solving: Document problems solved and any ongoing troubleshooting efforts.
6. All user messages: List ALL user messages that are not tool results. These are critical for understanding the users' feedback and changing intent.
7. Pending Tasks: Outline any pending tasks that you have explicitly been asked to work on.
8. Current Work: Describe in detail precisely what was being worked on immediately before this summary request, paying special attention to the most recent messages from both user and assistant. Include file names and code snippets where applicable.
9. Optional Next Step: List the next step that you will take that is related to the most recent work you were doing. IMPORTANT: ensure that this step is DIRECTLY in line with the user's most recent explicit requests, and the task you were working on immediately before this summary request. If your last task was concluded, then only list next steps if they are explicitly in line with the users request. Do not start on tangential requests or really old requests that were already completed without confirming with the user first.
                       If there is a next step, include direct quotes from the most recent conversation showing exactly what task you were working on and where you left off. This should be verbatim to ensure there's no drift in task interpretation.

Here's an example of how your output should be structured:

<example>
<analysis>
[Your thought process, ensuring all points are covered thoroughly and accurately]
</analysis>

<summary>
1. Primary Request and Intent:
   [Detailed description]

2. Key Technical Concepts:
   - [Concept 1]
   - [Concept 2]
   - [...]

3. Files and Code Sections:
   - [File Name 1]
      - [Summary of why this file is important]
      - [Summary of the changes made to this file, if any]
      - [Important Code Snippet]
   - [File Name 2]
      - [Important Code Snippet]
   - [...]

4. Errors and fixes:
    - [Detailed description of error 1]:
      - [How you fixed the error]
      - [User feedback on the error if any]
    - [...]

5. Problem Solving:
   [Description of solved problems and ongoing troubleshooting]

6. All user messages: 
    - [Detailed non tool use user message]
    - [...]

7. Pending Tasks:
   - [Task 1]
   - [Task 2]
   - [...]

8. Current Work:
   [Precise description of current work]

9. Optional Next Step:
   [Optional Next step to take]

</summary>
</example>

Please provide your summary based on the conversation so far, following this structure and ensuring precision and thoroughness in your response. 

There may be additional summarization instructions provided in the included context. If so, remember to follow these instructions when creating the above summary. Examples of instructions include:
<example>
## Compact Instructions
When summarizing the conversation focus on typescript code changes and also remember the mistakes you made and how you fixed them.
</example>

<example>
# Summary instructions
When you are using compact - please focus on test output and code changes. Include file reads verbatim.
</example>
`

// PARTIAL_COMPACT_PROMPT固定为 ``Your task is to create a detailed summary of the RECENT ...`，作为服务层 prompt后续展示或比较的基准。
const PARTIAL_COMPACT_PROMPT = `Your task is to create a detailed summary of the RECENT portion of the conversation — the messages that follow earlier retained context. The earlier messages are being kept intact and do NOT need to be summarized. Focus your summary on what was discussed, learned, and accomplished in the recent messages only.

${DETAILED_ANALYSIS_INSTRUCTION_PARTIAL}

Your summary should include the following sections:

1. Primary Request and Intent: Capture the user's explicit requests and intents from the recent messages
2. Key Technical Concepts: List important technical concepts, technologies, and frameworks discussed recently.
3. Files and Code Sections: Enumerate specific files and code sections examined, modified, or created. Include full code snippets where applicable and include a summary of why this file read or edit is important.
4. Errors and fixes: List errors encountered and how they were fixed.
5. Problem Solving: Document problems solved and any ongoing troubleshooting efforts.
6. All user messages: List ALL user messages from the recent portion that are not tool results.
7. Pending Tasks: Outline any pending tasks from the recent messages.
8. Current Work: Describe precisely what was being worked on immediately before this summary request.
9. Optional Next Step: List the next step related to the most recent work. Include direct quotes from the most recent conversation.

Here's an example of how your output should be structured:

<example>
<analysis>
[Your thought process, ensuring all points are covered thoroughly and accurately]
</analysis>

<summary>
1. Primary Request and Intent:
   [Detailed description]

2. Key Technical Concepts:
   - [Concept 1]
   - [Concept 2]

3. Files and Code Sections:
   - [File Name 1]
      - [Summary of why this file is important]
      - [Important Code Snippet]

4. Errors and fixes:
    - [Error description]:
      - [How you fixed it]

5. Problem Solving:
   [Description]

6. All user messages:
    - [Detailed non tool use user message]

7. Pending Tasks:
   - [Task 1]

8. Current Work:
   [Precise description of current work]

9. Optional Next Step:
   [Optional Next step to take]

</summary>
</example>

Please provide your summary based on the RECENT messages only (after the retained earlier context), following this structure and ensuring precision and thoroughness in your response.
`

// 'up_to': model sees only the summarized prefix (cache hit). Summary will
// precede kept recent messages, hence "Context for Continuing Work" section.
// PARTIAL_COMPACT_UP_TO_PROMPT保存`summary`，供服务层 prompt后续处理使用。
const PARTIAL_COMPACT_UP_TO_PROMPT = `Your task is to create a detailed summary of this conversation. This summary will be placed at the start of a continuing session; newer messages that build on this context will follow after your summary (you do not see them here). Summarize thoroughly so that someone reading only your summary and then the newer messages can fully understand what happened and continue the work.

${DETAILED_ANALYSIS_INSTRUCTION_BASE}

Your summary should include the following sections:

1. Primary Request and Intent: Capture the user's explicit requests and intents in detail
2. Key Technical Concepts: List important technical concepts, technologies, and frameworks discussed.
3. Files and Code Sections: Enumerate specific files and code sections examined, modified, or created. Include full code snippets where applicable and include a summary of why this file read or edit is important.
4. Errors and fixes: List errors encountered and how they were fixed.
5. Problem Solving: Document problems solved and any ongoing troubleshooting efforts.
6. All user messages: List ALL user messages that are not tool results.
7. Pending Tasks: Outline any pending tasks.
8. Work Completed: Describe what was accomplished by the end of this portion.
9. Context for Continuing Work: Summarize any context, decisions, or state that would be needed to understand and continue the work in subsequent messages.

Here's an example of how your output should be structured:

<example>
<analysis>
[Your thought process, ensuring all points are covered thoroughly and accurately]
</analysis>

<summary>
1. Primary Request and Intent:
   [Detailed description]

2. Key Technical Concepts:
   - [Concept 1]
   - [Concept 2]

3. Files and Code Sections:
   - [File Name 1]
      - [Summary of why this file is important]
      - [Important Code Snippet]

4. Errors and fixes:
    - [Error description]:
      - [How you fixed it]

5. Problem Solving:
   [Description]

6. All user messages:
    - [Detailed non tool use user message]

7. Pending Tasks:
   - [Task 1]

8. Work Completed:
   [Description of what was accomplished]

9. Context for Continuing Work:
   [Key context, decisions, or state needed to continue the work]

</summary>
</example>

Please provide your summary following this structure, ensuring precision and thoroughness in your response.
`

// NO_TOOLS_TRAILER 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const NO_TOOLS_TRAILER =
  '\n\nREMINDER: Do NOT call any tools. Respond with plain text only — ' +
  'an <analysis> block followed by a <summary> block. ' +
  'Tool calls will be rejected and you will fail the task.'

// getPartialCompactPrompt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPartialCompactPrompt(
  customInstructions?: string,
  direction: PartialCompactDirection = 'from',
): string {
  // template 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const template =
    direction === 'up_to'
      ? PARTIAL_COMPACT_UP_TO_PROMPT
      : PARTIAL_COMPACT_PROMPT
  // 提示词保存`NO_TOOLS_PREAMBLE + template`，供后续判断或组装使用。
  let prompt = NO_TOOLS_PREAMBLE + template

  // `customInstructions && customInstructions.tr...` 与 `''` 不一致时刷新派生状态，避免使用过期结果。
  if (customInstructions && customInstructions.trim() !== '') {
    // 服务层 prompt在这里处理 `prompt += `\n\nAdditional Instructions:\n${customInstructions}``，完成这一小步状态转换。
    prompt += `\n\nAdditional Instructions:\n${customInstructions}`
  }

  // 服务层 prompt在这里处理 `prompt += NO_TOOLS_TRAILER`，完成这一小步状态转换。
  prompt += NO_TOOLS_TRAILER

  // 返回 `prompt`，作为服务层 prompt这次计算的结果。
  return prompt
}

// getCompactPrompt 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCompactPrompt(customInstructions?: string): string {
  // 提示词 命名 `NO_TOOLS_PREAMBLE + BASE_COMPACT_PROMPT`，让后续代码直接表达这个值的用途。
  let prompt = NO_TOOLS_PREAMBLE + BASE_COMPACT_PROMPT

  // `customInstructions && customInstructions.tr...` 与 `''` 不一致时刷新派生状态，避免使用过期结果。
  if (customInstructions && customInstructions.trim() !== '') {
    // 服务层 prompt在这里处理 `prompt += `\n\nAdditional Instructions:\n${customInstructions}``，完成这一小步状态转换。
    prompt += `\n\nAdditional Instructions:\n${customInstructions}`
  }

  // 服务层 prompt在这里处理 `prompt += NO_TOOLS_TRAILER`，完成这一小步状态转换。
  prompt += NO_TOOLS_TRAILER

  // 返回 `prompt`，作为服务层 prompt这次计算的结果。
  return prompt
}

/**
 * Formats the compact summary by stripping the <analysis> drafting scratchpad
 * and replacing <summary> XML tags with readable section headers.
 * @param summary The raw summary string potentially containing <analysis> and <summary> XML tags
 * @returns The formatted summary with analysis stripped and summary tags replaced by headers
 */
// formatCompactSummary 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatCompactSummary(summary: string): string {
  // formattedSummary保存`summary`，供服务层 prompt后续判断或输出使用。
  let formattedSummary = summary

  // Strip analysis section — it's a drafting scratchpad that improves summary
  // quality but has no informational value once the summary is written.
  // formattedSummary更新为 `formattedSummary.replace(`，确保服务层后续读取最新状态。
  formattedSummary = formattedSummary.replace(
    /<analysis>[\s\S]*?<\/analysis>/,
    '',
  )

  // Extract and format summary section
  // summaryMatch匹配`formattedSummary.match`，供服务层 prompt后续处理使用。
  const summaryMatch = formattedSummary.match(/<summary>([\s\S]*?)<\/summary>/)
  // 满足 `summaryMatch` 时，服务层 prompt执行该分支。
  if (summaryMatch) {
    // 文本内容标记服务层 prompt是否启用对应路径。
    const content = summaryMatch[1] || ''
    // formattedSummary更新为 `formattedSummary.replace(`，确保服务层后续读取最新状态。
    formattedSummary = formattedSummary.replace(
      /<summary>[\s\S]*?<\/summary>/,
      `Summary:\n${content.trim()}`,
    )
  }

  // Clean up extra whitespace between sections
  // formattedSummary更新为 `formattedSummary.replace(/\n\n+/g, '\n\n')`，确保服务层后续读取最新状态。
  formattedSummary = formattedSummary.replace(/\n\n+/g, '\n\n')

  // 返回 `formattedSummary.trim()`，作为服务层 prompt这次计算的结果。
  return formattedSummary.trim()
}

// getCompactUserSummaryMessage 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCompactUserSummaryMessage(
  summary: string,
  suppressFollowUpQuestions?: boolean,
  transcriptPath?: string,
  recentMessagesPreserved?: boolean,
): string {
  // formattedSummary格式化`formatCompactSummary`，供服务层 prompt后续处理使用。
  const formattedSummary = formatCompactSummary(summary)

  // baseSummary固定为 ``This session is being continued from a previous conversa...`，作为服务层 prompt后续展示或比较的基准。
  let baseSummary = `This session is being continued from a previous conversation that ran out of context. The summary below covers the earlier portion of the conversation.

${formattedSummary}`

  // 满足 `transcriptPath` 时，服务层 prompt执行该分支。
  if (transcriptPath) {
    // 服务层 prompt在这里处理 `baseSummary += `\n\nIf you need specific details from before compaction...`，完成这一小步状态转换。
    baseSummary += `\n\nIf you need specific details from before compaction (like exact code snippets, error messages, or content you generated), read the full transcript at: ${transcriptPath}`
  }

  // 满足 `recentMessagesPreserved` 时，服务层 prompt执行该分支。
  if (recentMessagesPreserved) {
    // 服务层 prompt在这里处理 `baseSummary += `\n\nRecent messages are preserved verbatim.``，完成这一小步状态转换。
    baseSummary += `\n\nRecent messages are preserved verbatim.`
  }

  // 满足 `suppressFollowUpQuestions` 时，服务层 prompt执行该分支。
  if (suppressFollowUpQuestions) {
    // continuation保存``${baseSummary}`，作为后续固定文本处理的输入。
    let continuation = `${baseSummary}
Continue the conversation from where it left off without asking the user any further questions. Resume directly — do not acknowledge the summary, do not recap what was happening, do not preface with "I'll continue" or similar. Pick up the last task as if the break never happened.`

    // 服务层 prompt在这里进入条件判断，后续代码按实际状态分流。
    if (
      (feature('PROACTIVE') || feature('KAIROS')) &&
      proactiveModule?.isProactiveActive()
    ) {
      // 服务层 prompt在这里处理 `continuation += ``，完成这一小步状态转换。
      continuation += `

You are running in autonomous/proactive mode. This is NOT a first wake-up — you were already working autonomously before compaction. Continue your work loop: pick up where you left off based on the summary above. Do not greet the user or ask what to work on.`
    }

    // 返回 `continuation`，作为服务层 prompt这次计算的结果。
    return continuation
  }

  // 返回 `baseSummary`，作为服务层 prompt这次计算的结果。
  return baseSummary
}
