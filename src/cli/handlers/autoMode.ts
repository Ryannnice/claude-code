/**
 * Auto mode subcommand handlers — dump default/merged classifier rules and
 * critique user-written rules. Dynamically imported when `claude auto-mode ...` runs.
 */

// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 整理这一组导入，让auto Mode后续逻辑可以直接复用这些外部能力。
import {
  getMainLoopModel,
  parseUserSpecifiedModel,
} from '../../utils/model/model.js'
// 整理这一组导入，让auto Mode后续逻辑可以直接复用这些外部能力。
import {
  type AutoModeRules,
  buildDefaultExternalSystemPrompt,
  getDefaultExternalAutoModeRules,
} from '../../utils/permissions/yoloClassifier.js'
// 复用 getAutoModeConfig 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getAutoModeConfig } from '../../utils/settings/settings.js'
// 复用 sideQuery 工具函数，把通用处理留在 ../../utils/sideQuery.js 中维护。
import { sideQuery } from '../../utils/sideQuery.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'

// writeRules 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function writeRules(rules: AutoModeRules): void {
  // 向标准输出写入auto Mode要展示给用户的文本。
  process.stdout.write(jsonStringify(rules, null, 2) + '\n')
}

// autoModeDefaultsHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function autoModeDefaultsHandler(): void {
  // 调用 writeRules，触发auto Mode此处需要的副作用。
  writeRules(getDefaultExternalAutoModeRules())
}

/**
 * Dump the effective auto mode config: user settings where provided, external
 * defaults otherwise. Per-section REPLACE semantics — matches how
 * buildYoloSystemPrompt resolves the external template (a non-empty user
 * section replaces that section's defaults entirely; an empty/absent section
 * falls through to defaults).
 */
// autoModeConfigHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function autoModeConfigHandler(): void {
  // 配置读取`getAutoModeConfig`，供auto Mode后续处理使用。
  const config = getAutoModeConfig()
  // defaults 集合读取`getDefaultExternalAutoModeRules`，供auto Mode后续处理使用。
  const defaults = getDefaultExternalAutoModeRules()
  // 调用 writeRules，触发auto Mode此处需要的副作用。
  writeRules({
    allow: config?.allow?.length ? config.allow : defaults.allow,
    soft_deny: config?.soft_deny?.length
      ? config.soft_deny
      : defaults.soft_deny,
    environment: config?.environment?.length
      ? config.environment
      : defaults.environment,
  })
}

// CRITIQUE_SYSTEM_PROMPT 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const CRITIQUE_SYSTEM_PROMPT =
  'You are an expert reviewer of auto mode classifier rules for Claude Code.\n' +
  '\n' +
  'Claude Code has an "auto mode" that uses an AI classifier to decide whether ' +
  'tool calls should be auto-approved or require user confirmation. Users can ' +
  'write custom rules in three categories:\n' +
  '\n' +
  '- **allow**: Actions the classifier should auto-approve\n' +
  '- **soft_deny**: Actions the classifier should block (require user confirmation)\n' +
  "- **environment**: Context about the user's setup that helps the classifier make decisions\n" +
  '\n' +
  "Your job is to critique the user's custom rules for clarity, completeness, " +
  'and potential issues. The classifier is an LLM that reads these rules as ' +
  'part of its system prompt.\n' +
  '\n' +
  'For each rule, evaluate:\n' +
  '1. **Clarity**: Is the rule unambiguous? Could the classifier misinterpret it?\n' +
  "2. **Completeness**: Are there gaps or edge cases the rule doesn't cover?\n" +
  '3. **Conflicts**: Do any of the rules conflict with each other?\n' +
  '4. **Actionability**: Is the rule specific enough for the classifier to act on?\n' +
  '\n' +
  'Be concise and constructive. Only comment on rules that could be improved. ' +
  'If all rules look good, say so.'

// autoModeCritiqueHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function autoModeCritiqueHandler(options: {
  model?: string
}): Promise<void> {
  // 配置读取`getAutoModeConfig`，供auto Mode后续处理使用。
  const config = getAutoModeConfig()
  // hasCustomRules 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasCustomRules =
    (config?.allow?.length ?? 0) > 0 ||
    (config?.soft_deny?.length ?? 0) > 0 ||
    (config?.environment?.length ?? 0) > 0

  // hasCustomRules 集合缺失时提前走兜底路径，避免auto Mode继续依赖无效输入。
  if (!hasCustomRules) {
    // 向标准输出写入auto Mode要展示给用户的文本。
    process.stdout.write(
      'No custom auto mode rules found.\n\n' +
        'Add rules to your settings file under autoMode.{allow, soft_deny, environment}.\n' +
        'Run `claude auto-mode defaults` to see the default rules for reference.\n',
    )
    // auto Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 模型名称保存`options.model`，供auto Mode后续判断或输出使用。
  const model = options.model
    ? parseUserSpecifiedModel(options.model)
    : getMainLoopModel()

  // defaults 集合读取`getDefaultExternalAutoModeRules`，供auto Mode后续处理使用。
  const defaults = getDefaultExternalAutoModeRules()
  // classifierPrompt构建`buildDefaultExternalSystemPrompt`，供auto Mode后续处理使用。
  const classifierPrompt = buildDefaultExternalSystemPrompt()

  // userRulesSummary 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const userRulesSummary =
    formatRulesForCritique('allow', config?.allow ?? [], defaults.allow) +
    formatRulesForCritique(
      'soft_deny',
      config?.soft_deny ?? [],
      defaults.soft_deny,
    ) +
    formatRulesForCritique(
      'environment',
      config?.environment ?? [],
      defaults.environment,
    )

  // 向标准输出写入auto Mode要展示给用户的文本。
  process.stdout.write('Analyzing your auto mode rules…\n\n')

  // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let response
  // 保护这一段可能失败的auto Mode操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应更新为 `await sideQuery({`，确保CLI后续读取最新状态。
    response = await sideQuery({
      querySource: 'auto_mode_critique',
      model,
      system: CRITIQUE_SYSTEM_PROMPT,
      skipSystemPromptPrefix: true,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content:
            'Here is the full classifier system prompt that the auto mode classifier receives:\n\n' +
            '<classifier_system_prompt>\n' +
            classifierPrompt +
            '\n</classifier_system_prompt>\n\n' +
            "Here are the user's custom rules that REPLACE the corresponding default sections:\n\n" +
            userRulesSummary +
            '\nPlease critique these custom rules.',
        },
      ],
    })
  } catch (error) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      'Failed to analyze rules: ' + errorMessage(error) + '\n',
    )
    // 设置进程退出码为 `1`，让外层 shell 感知CLI运行失败。
    process.exitCode = 1
    // auto Mode在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // textBlock筛选`content.find`，供auto Mode后续处理使用。
  const textBlock = response.content.find(block => block.type === 'text')
  // 当 `textBlock?.type` 匹配 `'text'` 时，auto Mode执行对应分支。
  if (textBlock?.type === 'text') {
    // 向标准输出写入auto Mode要展示给用户的文本。
    process.stdout.write(textBlock.text + '\n')
  } else {
    // 向标准输出写入auto Mode要展示给用户的文本。
    process.stdout.write('No critique was generated. Please try again.\n')
  }
}

// formatRulesForCritique 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatRulesForCritique(
  section: string,
  userRules: string[],
  defaultRules: string[],
): string {
  // userRules 集合为空时立即返回或跳过，避免auto Mode把空集合当成可处理内容。
  if (userRules.length === 0) return ''
  // customLines 集合派生`userRules.map`，供auto Mode后续处理使用。
  const customLines = userRules.map(r => '- ' + r).join('\n')
  // defaultLines 集合派生`defaultRules.map`，供auto Mode后续处理使用。
  const defaultLines = defaultRules.map(r => '- ' + r).join('\n')
  // 返回 `(`，作为auto Mode这次计算的结果。
  return (
    '## ' +
    section +
    ' (custom rules replacing defaults)\n' +
    'Custom:\n' +
    customLines +
    '\n\n' +
    'Defaults being replaced:\n' +
    defaultLines +
    '\n\n'
  )
}
