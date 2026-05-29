// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 getInvokedSkillsForAgent，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getInvokedSkillsForAgent } from '../../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 queryModelWithoutStreaming 服务层能力，把外部通信或共享状态交给 ../../services/api/claude.js 处理。
import { queryModelWithoutStreaming } from '../../services/api/claude.js'
// 引入 getEmptyToolPermissionContext，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { getEmptyToolPermissionContext } from '../../Tool.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准共享工具的数据契约。
import type { Message } from '../../types/message.js'
// 引入 createAbortController，将 ../abortController.js 中已经封装好的能力接到本文件流程里。
import { createAbortController } from '../abortController.js'
// 引入 count，将 ../array.js 中已经封装好的能力接到本文件流程里。
import { count } from '../array.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  createUserMessage,
  extractTag,
  extractTextContent,
} from '../messages.js'
// 引入 getSmallFastModel，将 ../model/model.js 中已经封装好的能力接到本文件流程里。
import { getSmallFastModel } from '../model/model.js'
// 引入 jsonParse，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from '../slowOperations.js'
// 引入 asSystemPrompt，将 ../systemPromptType.js 中已经封装好的能力接到本文件流程里。
import { asSystemPrompt } from '../systemPromptType.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type ApiQueryHookConfig,
  createApiQueryHook,
} from './apiQueryHookHelper.js'
// 引入 registerPostSamplingHook，将 ./postSamplingHooks.js 中已经封装好的能力接到本文件流程里。
import { registerPostSamplingHook } from './postSamplingHooks.js'

// TURN_BATCH_SIZE 命名 `5`，让后续代码直接表达这个值的用途。
const TURN_BATCH_SIZE = 5

// SkillUpdate 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SkillUpdate = {
  section: string
  change: string
  reason: string
}

// formatRecentMessages 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatRecentMessages(messages: Message[]): string {
  // 返回 `messages`，作为共享工具这次计算的结果。
  return messages
    .filter(m => m.type === 'user' || m.type === 'assistant')
    .map(m => {
      // role标记共享工具React hook skill Improvement是否启用对应路径。
      const role = m.type === 'user' ? 'User' : 'Assistant'
      // 文本内容 命名 `m.message.content`，让后续代码直接表达这个值的用途。
      const content = m.message.content
      // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof content === 'string')
        // 返回 ``${role}: ${content.slice(0, 500)}``，作为共享工具这次计算的结果。
        return `${role}: ${content.slice(0, 500)}`
      // 文本内容保存`content`，供后续判断或组装使用。
      const text = content
        .filter(
          // 这个回调绑定到 (b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text',，负责共享工具在该局部场景下的响应。
          (b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text',
        )
        // 链式调用 map，继续加工上一行在共享工具中产生的数据。
        .map(b => b.text)
        .join('\n')
      // 返回 ``${role}: ${text.slice(0, 500)}``，作为共享工具这次计算的结果。
      return `${role}: ${text.slice(0, 500)}`
    })
    .join('\n\n')
}

// findProjectSkill 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findProjectSkill() {
  // skills 集合读取`getInvokedSkillsForAgent`，供共享工具后续处理使用。
  const skills = getInvokedSkillsForAgent(null)
  // 循环处理 `const [, info] of skills`，让共享工具逐项把同类条目按顺序走完。
  for (const [, info] of skills) {
    // 满足 `info.skillPath.startsWith('projectSettings:')` 时，共享工具执行该分支。
    if (info.skillPath.startsWith('projectSettings:')) {
      // 返回 `info`，作为共享工具这次计算的结果。
      return info
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// createSkillImprovementHook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createSkillImprovementHook() {
  // lastAnalyzedCount 数量保存`0`，供共享工具React hook skill Improvement后续判断或输出使用。
  let lastAnalyzedCount = 0
  // lastAnalyzedIndex 索引保存`0`，供后续判断或组装使用。
  let lastAnalyzedIndex = 0

  // 配置 集中保存React hook skill Improvement要一起传递的字段。
  const config: ApiQueryHookConfig<SkillUpdate[]> = {
    name: 'skill_improvement',

    // shouldRun 用 context 判断共享工具是否满足条件。
    async shouldRun(context) {
      // `context.querySource` 与 `'repl_main_thread'` 不一致时刷新派生状态，避免使用过期结果。
      if (context.querySource !== 'repl_main_thread') {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // 满足 `!findProjectSkill()` 时，共享工具执行该分支。
      if (!findProjectSkill()) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // Only run every TURN_BATCH_SIZE user messages
      // userCount 数量统计`count`，供共享工具后续处理使用。
      const userCount = count(context.messages, m => m.type === 'user')
      // 满足 `userCount - lastAnalyzedCount < TURN_BATCH_SIZE` 时，共享工具执行该分支。
      if (userCount - lastAnalyzedCount < TURN_BATCH_SIZE) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // lastAnalyzedCount 数量更新为 `userCount`，确保共享工具后续读取最新状态。
      lastAnalyzedCount = userCount
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    },

    // buildMessages 使用 context 完成共享工具里的对应操作。
    buildMessages(context) {
      // projectSkill筛选`findProjectSkill`，供共享工具后续处理使用。
      const projectSkill = findProjectSkill()!
      // Only analyze messages since the last check — the skill definition
      // provides enough context for the classifier to understand corrections
      // newMessages 消息数据格式化`messages.slice`，供共享工具后续处理使用。
      const newMessages = context.messages.slice(lastAnalyzedIndex)
      // lastAnalyzedIndex 索引更新为 `context.messages.length`，确保共享工具后续读取最新状态。
      lastAnalyzedIndex = context.messages.length

      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return [
        createUserMessage({
          content: `You are analyzing a conversation where a user is executing a skill (a repeatable process).
Your job: identify if the user's recent messages contain preferences, requests, or corrections that should be permanently added to the skill definition for future runs.

<skill_definition>
${projectSkill.content}
</skill_definition>

<recent_messages>
${formatRecentMessages(newMessages)}
</recent_messages>

Look for:
- Requests to add, change, or remove steps: "can you also ask me X", "please do Y too", "don't do Z"
- Preferences about how steps should work: "ask me about energy levels", "note the time", "use a casual tone"
- Corrections: "no, do X instead", "always use Y", "make sure to..."

Ignore:
- Routine conversation that doesn't generalize (one-time answers, chitchat)
- Things the skill already does

Output a JSON array inside <updates> tags. Each item: {"section": "which step/section to modify or 'new step'", "change": "what to add/modify", "reason": "which user message prompted this"}.
Output <updates>[]</updates> if no updates are needed.`,
        }),
      ]
    },

    systemPrompt:
      'You detect user preferences and process improvements during skill execution. Flag anything the user asks for that should be remembered for next time.',

    useTools: false,

    // parseResponse 使用 content 完成共享工具里的对应操作。
    parseResponse(content) {
      // updatesStr保存`extractTag`，供共享工具后续处理使用。
      const updatesStr = extractTag(content, 'updates')
      // updatesStr缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!updatesStr) {
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return []
      }
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 返回 `jsonParse(updatesStr) as SkillUpdate[]`，作为共享工具这次计算的结果。
        return jsonParse(updatesStr) as SkillUpdate[]
      } catch {
        // 返回列表结果，保留共享工具已经排好的条目顺序。
        return []
      }
    },

    // logResult 使用 result, context 完成共享工具里的对应操作。
    logResult(result, context) {
      // 只有 `result.type === 'success' && result.result.length` 满足时，共享工具才执行该分支。
      if (result.type === 'success' && result.result.length > 0) {
        // projectSkill筛选`findProjectSkill`，供共享工具后续处理使用。
        const projectSkill = findProjectSkill()
        // skillName保存`projectSkill?.skillName ?? 'unknown'`，供共享工具React hook skill Improvement后续判断或输出使用。
        const skillName = projectSkill?.skillName ?? 'unknown'

        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_skill_improvement_detected', {
          updateCount: result.result
            .length as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          uuid: result.uuid as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          // _PROTO_skill_name routes to the privileged skill_name BQ column.
          _PROTO_skill_name:
            skillName as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
        })

        // context.toolUseContext.setAppState 写入新的状态值，使共享工具后续读取保持一致。
        context.toolUseContext.setAppState(prev => ({
          ...prev,
          skillImprovement: {
            suggestion: { skillName, updates: result.result },
          },
        }))
      }
    },

    getModel: getSmallFastModel,
  }

  // 返回 `createApiQueryHook(config)`，作为共享工具这次计算的结果。
  return createApiQueryHook(config)
}

// initSkillImprovement 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initSkillImprovement(): void {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    feature('SKILL_IMPROVEMENT') &&
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_copper_panda', false)
  ) {
    // 调用 registerPostSamplingHook，触发共享工具此处需要的副作用。
    registerPostSamplingHook(createSkillImprovementHook())
  }
}

/**
 * Apply skill improvements by calling a side-channel LLM to rewrite the skill file.
 * Fire-and-forget — does not block the main conversation.
 */
// applySkillImprovement 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function applySkillImprovement(
  skillName: string,
  updates: SkillUpdate[],
): Promise<void> {
  // skillName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!skillName) return

  // 从 `await import('path')` 解构 join，减少React hook skill Improvement对同一对象的重复访问。
  const { join } = await import('path')
  // fs 集合保存`import`，供共享工具后续处理使用。
  const fs = await import('fs/promises')

  // Skills live at .claude/skills/<name>/SKILL.md relative to CWD
  // 文件路径格式化`join`，供共享工具后续处理使用。
  const filePath = join(getCwd(), '.claude', 'skills', skillName, 'SKILL.md')

  // currentContent 先占位，稍后的条件分支会根据实际输入补齐它。
  let currentContent: string
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // currentContent更新为 `await fs.readFile(filePath, 'utf-8')`，确保共享工具后续读取最新状态。
    currentContent = await fs.readFile(filePath, 'utf-8')
  } catch {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(`Failed to read skill file for improvement: ${filePath}`),
    )
    // React hook skill Improvement在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // updateList 集合派生`updates.map`，供共享工具后续处理使用。
  const updateList = updates.map(u => `- ${u.section}: ${u.change}`).join('\n')

  // 接口响应保存`queryModelWithoutStreaming`，供共享工具后续处理使用。
  const response = await queryModelWithoutStreaming({
    messages: [
      createUserMessage({
        content: `You are editing a skill definition file. Apply the following improvements to the skill.

<current_skill_file>
${currentContent}
</current_skill_file>

<improvements>
${updateList}
</improvements>

Rules:
- Integrate the improvements naturally into the existing structure
- Preserve frontmatter (--- block) exactly as-is
- Preserve the overall format and style
- Do not remove existing content unless an improvement explicitly replaces it
- Output the complete updated file inside <updated_file> tags`,
      }),
    ],
    systemPrompt: asSystemPrompt([
      'You edit skill definition files to incorporate user preferences. Output only the updated file content.',
    ]),
    thinkingConfig: { type: 'disabled' as const },
    tools: [],
    signal: createAbortController().signal,
    options: {
      // 这个回调绑定到 getToolPermissionContext: async () => getEmptyToolPermissionContext(),，负责共享工具在该局部场景下的响应。
      getToolPermissionContext: async () => getEmptyToolPermissionContext(),
      model: getSmallFastModel(),
      toolChoice: undefined,
      isNonInteractiveSession: false,
      hasAppendSystemPrompt: false,
      temperatureOverride: 0,
      agents: [],
      querySource: 'skill_improvement_apply',
      mcpTools: [],
    },
  })

  // responseText 响应数据保存`extractTextContent`，供共享工具后续处理使用。
  const responseText = extractTextContent(response.message.content).trim()

  // updatedContent保存`extractTag`，供共享工具后续处理使用。
  const updatedContent = extractTag(responseText, 'updated_file')
  // updatedContent缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!updatedContent) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error('Skill improvement apply: no updated_file tag in response'),
    )
    // React hook skill Improvement在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fs.writeFile(filePath, updatedContent, 'utf-8')` 完成，再继续React hook skill Improvement的异步流程。
    await fs.writeFile(filePath, updatedContent, 'utf-8')
  } catch (e) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(toError(e))
  }
}
