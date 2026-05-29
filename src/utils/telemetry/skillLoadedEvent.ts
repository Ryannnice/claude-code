// 引入 getSkillToolCommands，将 ../../commands.js 中已经封装好的能力接到本文件流程里。
import { getSkillToolCommands } from '../../commands.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 getCharBudget 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getCharBudget } from '../../tools/SkillTool/prompt.js'

/**
 * Logs a tengu_skill_loaded event for each skill available at session startup.
 * This enables analytics on which skills are available across sessions.
 */
// logSkillsLoaded 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function logSkillsLoaded(
  cwd: string,
  contextWindowTokens: number,
): Promise<void> {
  // skills 集合读取`getSkillToolCommands`，供共享工具后续处理使用。
  const skills = await getSkillToolCommands(cwd)
  // skillBudget读取`getCharBudget`，供共享工具后续处理使用。
  const skillBudget = getCharBudget(contextWindowTokens)

  // 按顺序遍历 `skills` 中的skill，逐个交给共享工具处理。
  for (const skill of skills) {
    // `skill.type` 与 `'prompt'` 不一致时刷新派生状态，避免使用过期结果。
    if (skill.type !== 'prompt') continue

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_skill_loaded', {
      // _PROTO_skill_name routes to the privileged skill_name BQ column.
      // Unredacted names don't go in additional_metadata.
      _PROTO_skill_name:
        skill.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      skill_source:
        skill.source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      skill_loaded_from:
        skill.loadedFrom as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      skill_budget: skillBudget,
      ...(skill.kind && {
        skill_kind:
          skill.kind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
    })
  }
}
