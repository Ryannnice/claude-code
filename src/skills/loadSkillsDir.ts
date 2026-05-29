// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { realpath } from 'fs/promises'
// 引入 ignore，将 ignore 中已经封装好的能力接到本文件流程里。
import ignore from 'ignore'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 整理这一组导入，让load Skills Dir后续逻辑可以直接复用这些外部能力。
import {
  basename,
  dirname,
  isAbsolute,
  join,
  sep as pathSep,
  relative,
} from 'path'
// 整理这一组导入，让load Skills Dir后续逻辑可以直接复用这些外部能力。
import {
  getAdditionalDirectoriesForClaudeMd,
  getSessionId,
} from '../bootstrap/state.js'
// 整理这一组导入，让load Skills Dir后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 接入 roughTokenCountEstimation 服务层能力，把外部通信或共享状态交给 ../services/tokenEstimation.js 处理。
import { roughTokenCountEstimation } from '../services/tokenEstimation.js'
// 类型依赖 { Command, PromptCommand } 来自 ../types/command.js，用于校准load Skills Dir的数据契约。
import type { Command, PromptCommand } from '../types/command.js'
// 整理这一组导入，让load Skills Dir后续逻辑可以直接复用这些外部能力。
import {
  parseArgumentNames,
  substituteArguments,
} from '../utils/argumentSubstitution.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 整理这一组导入，让load Skills Dir后续逻辑可以直接复用这些外部能力。
import {
  EFFORT_LEVELS,
  type EffortValue,
  parseEffortValue,
} from '../utils/effort.js'
// 整理这一组导入，让load Skills Dir后续逻辑可以直接复用这些外部能力。
import {
  getClaudeConfigHomeDir,
  isBareMode,
  isEnvTruthy,
} from '../utils/envUtils.js'
// 复用 isENOENT、isFsInaccessible 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { isENOENT, isFsInaccessible } from '../utils/errors.js'
// 整理这一组导入，让load Skills Dir后续逻辑可以直接复用这些外部能力。
import {
  coerceDescriptionToString,
  type FrontmatterData,
  type FrontmatterShell,
  parseBooleanFrontmatter,
  parseFrontmatter,
  parseShellFrontmatter,
  splitPathInFrontmatter,
} from '../utils/frontmatterParser.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../utils/fsOperations.js'
// 复用 isPathGitignored 工具函数，把通用处理留在 ../utils/git/gitignore.js 中维护。
import { isPathGitignored } from '../utils/git/gitignore.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 整理这一组导入，让load Skills Dir后续逻辑可以直接复用这些外部能力。
import {
  extractDescriptionFromMarkdown,
  getProjectDirsUpToHome,
  loadMarkdownFilesForSubdir,
  type MarkdownFile,
  parseSlashCommandToolsFromFrontmatter,
} from '../utils/markdownConfigLoader.js'
// 复用 parseUserSpecifiedModel 工具函数，把通用处理留在 ../utils/model/model.js 中维护。
import { parseUserSpecifiedModel } from '../utils/model/model.js'
// 复用 executeShellCommandsInPrompt 工具函数，把通用处理留在 ../utils/promptShellExecution.js 中维护。
import { executeShellCommandsInPrompt } from '../utils/promptShellExecution.js'
// 类型依赖 { SettingSource } 来自 ../utils/settings/constants.js，用于校准load Skills Dir的数据契约。
import type { SettingSource } from '../utils/settings/constants.js'
// 复用 isSettingSourceEnabled 工具函数，把通用处理留在 ../utils/settings/constants.js 中维护。
import { isSettingSourceEnabled } from '../utils/settings/constants.js'
// 复用 getManagedFilePath 工具函数，把通用处理留在 ../utils/settings/managedPath.js 中维护。
import { getManagedFilePath } from '../utils/settings/managedPath.js'
// 复用 isRestrictedToPluginOnly 工具函数，把通用处理留在 ../utils/settings/pluginOnlyPolicy.js 中维护。
import { isRestrictedToPluginOnly } from '../utils/settings/pluginOnlyPolicy.js'
// 复用 HooksSchema、HooksSettings 工具函数，把通用处理留在 ../utils/settings/types.js 中维护。
import { HooksSchema, type HooksSettings } from '../utils/settings/types.js'
// 复用 createSignal 工具函数，把通用处理留在 ../utils/signal.js 中维护。
import { createSignal } from '../utils/signal.js'
// 引入 registerMCPSkillBuilders，将 ./mcpSkillBuilders.js 中已经封装好的能力接到本文件流程里。
import { registerMCPSkillBuilders } from './mcpSkillBuilders.js'

// LoadedFrom 固化load Skills Dir里传递的数据形状，帮助调用方按同一结构读写字段。
export type LoadedFrom =
  | 'commands_DEPRECATED'
  | 'skills'
  | 'plugin'
  | 'managed'
  | 'bundled'
  | 'mcp'

/**
 * Returns a claude config directory path for a given source.
 */
// getSkillsPath 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSkillsPath(
  source: SettingSource | 'plugin',
  dir: 'skills' | 'commands',
): string {
  // 按照 source 的取值选择load Skills Dir的具体处理分支。
  switch (source) {
    case 'policySettings':
      // 返回 `join(getManagedFilePath(), '.claude', dir)`，作为load Skills Dir这次计算的结果。
      return join(getManagedFilePath(), '.claude', dir)
    case 'userSettings':
      // 返回 `join(getClaudeConfigHomeDir(), dir)`，作为load Skills Dir这次计算的结果。
      return join(getClaudeConfigHomeDir(), dir)
    case 'projectSettings':
      // 返回 ``.claude/${dir}``，作为load Skills Dir这次计算的结果。
      return `.claude/${dir}`
    case 'plugin':
      // 返回 `'plugin'`，作为load Skills Dir这次计算的结果。
      return 'plugin'
    default:
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return ''
  }
}

/**
 * Estimates token count for a skill based on frontmatter only
 * (name, description, whenToUse) since full content is only loaded on invocation.
 */
// estimateSkillFrontmatterTokens 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function estimateSkillFrontmatterTokens(skill: Command): number {
  // frontmatterText 聚合成有序列表，保持后续遍历顺序稳定。
  const frontmatterText = [skill.name, skill.description, skill.whenToUse]
    .filter(Boolean)
    .join(' ')
  // 返回 `roughTokenCountEstimation(frontmatterText)`，作为load Skills Dir这次计算的结果。
  return roughTokenCountEstimation(frontmatterText)
}

/**
 * Gets a unique identifier for a file by resolving symlinks to a canonical path.
 * This allows detection of duplicate files accessed through different paths
 * (e.g., via symlinks or overlapping parent directories).
 * Returns null if the file doesn't exist or can't be resolved.
 *
 * Uses realpath to resolve symlinks, which is filesystem-agnostic and avoids
 * issues with filesystems that report unreliable inode values (e.g., inode 0 on
 * some virtual/container/NFS filesystems, or precision loss on ExFAT).
 * See: https://github.com/anthropics/claude-code/issues/13893
 */
// getFileIdentity 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getFileIdentity(filePath: string): Promise<string | null> {
  // 保护这一段可能失败的load Skills Dir操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `realpath(filePath)`，调用方直接接收异步结果。
    return await realpath(filePath)
  } catch {
    // 返回 `null`，作为load Skills Dir这次计算的结果。
    return null
  }
}

// Internal type to track skill with its file path for deduplication
// SkillWithPath 固化load Skills Dir里传递的数据形状，帮助调用方按同一结构读写字段。
type SkillWithPath = {
  skill: Command
  filePath: string
}

/**
 * Parse and validate hooks from frontmatter.
 * Returns undefined if hooks are not defined or invalid.
 */
// parseHooksFromFrontmatter 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseHooksFromFrontmatter(
  frontmatter: FrontmatterData,
  skillName: string,
): HooksSettings | undefined {
  // frontmatter.hooks 集合缺失时提前走兜底路径，避免load Skills Dir继续依赖无效输入。
  if (!frontmatter.hooks) {
    // 返回 `undefined`，作为load Skills Dir这次计算的结果。
    return undefined
  }

  // 结果保存`HooksSchema`，供load Skills Dir后续处理使用。
  const result = HooksSchema().safeParse(frontmatter.hooks)
  // result.success 集合缺失时提前走兜底路径，避免load Skills Dir继续依赖无效输入。
  if (!result.success) {
    // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Invalid hooks in skill '${skillName}': ${result.error.message}`,
    )
    // 返回 `undefined`，作为load Skills Dir这次计算的结果。
    return undefined
  }

  // 返回 `result.data`，作为load Skills Dir这次计算的结果。
  return result.data
}

/**
 * Parse paths frontmatter from a skill, using the same format as CLAUDE.md rules.
 * Returns undefined if no paths are specified or if all patterns are match-all.
 */
// parseSkillPaths 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseSkillPaths(frontmatter: FrontmatterData): string[] | undefined {
  // frontmatter.paths 路径数据缺失时提前走兜底路径，避免load Skills Dir继续依赖无效输入。
  if (!frontmatter.paths) {
    // 返回 `undefined`，作为load Skills Dir这次计算的结果。
    return undefined
  }

  // patterns 集合格式化`splitPathInFrontmatter`，供load Skills Dir后续处理使用。
  const patterns = splitPathInFrontmatter(frontmatter.paths)
    // 链式调用 map，继续加工上一行在load Skills Dir中产生的数据。
    .map(pattern => {
      // Remove /** suffix - ignore library treats 'path' as matching both
      // the path itself and everything inside it
      // 返回 `pattern.endsWith('/**') ? pattern.slice(0, -3) : pattern`，作为load Skills Dir这次计算的结果。
      return pattern.endsWith('/**') ? pattern.slice(0, -3) : pattern
    })
    // 链式调用 filter，继续加工上一行在load Skills Dir中产生的数据。
    .filter((p: string) => p.length > 0)

  // If all patterns are ** (match-all), treat as no paths (undefined)
  // 组合条件 `patterns.length === 0 || patterns.every((p: string) => p === '**')` 成立时，load Skills Dir才启用这条专门路径。
  if (patterns.length === 0 || patterns.every((p: string) => p === '**')) {
    // 返回 `undefined`，作为load Skills Dir这次计算的结果。
    return undefined
  }

  // 返回 `patterns`，作为load Skills Dir这次计算的结果。
  return patterns
}

/**
 * Parses all skill frontmatter fields that are shared between file-based and
 * MCP skill loading. Caller supplies the resolved skill name and the
 * source/loadedFrom/baseDir/paths fields separately.
 */
// parseSkillFrontmatterFields 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseSkillFrontmatterFields(
  frontmatter: FrontmatterData,
  markdownContent: string,
  resolvedName: string,
  descriptionFallbackLabel: 'Skill' | 'Custom command' = 'Skill',
): {
  displayName: string | undefined
  description: string
  hasUserSpecifiedDescription: boolean
  allowedTools: string[]
  argumentHint: string | undefined
  argumentNames: string[]
  whenToUse: string | undefined
  version: string | undefined
  model: ReturnType<typeof parseUserSpecifiedModel> | undefined
  disableModelInvocation: boolean
  userInvocable: boolean
  hooks: HooksSettings | undefined
  executionContext: 'fork' | undefined
  agent: string | undefined
  effort: EffortValue | undefined
  shell: FrontmatterShell | undefined
} {
  // validatedDescription保存`coerceDescriptionToString`，供load Skills Dir后续处理使用。
  const validatedDescription = coerceDescriptionToString(
    frontmatter.description,
    resolvedName,
  )
  // description 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const description =
    validatedDescription ??
    extractDescriptionFromMarkdown(markdownContent, descriptionFallbackLabel)

  // userInvocable 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const userInvocable =
    frontmatter['user-invocable'] === undefined
      ? true
      : parseBooleanFrontmatter(frontmatter['user-invocable'])

  // model 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const model =
    frontmatter.model === 'inherit'
      ? undefined
      : frontmatter.model
        ? parseUserSpecifiedModel(frontmatter.model as string)
        : undefined

  // effortRaw 命名 `frontmatter['effort']`，让后续代码直接表达这个值的用途。
  const effortRaw = frontmatter['effort']
  // effort 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const effort =
    effortRaw !== undefined ? parseEffortValue(effortRaw) : undefined
  // `effortRaw` 与 `undefined && effort === undefin...` 不一致时刷新派生状态，避免使用过期结果。
  if (effortRaw !== undefined && effort === undefined) {
    // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Skill ${resolvedName} has invalid effort '${effortRaw}'. Valid options: ${EFFORT_LEVELS.join(', ')} or an integer`,
    )
  }

  // 返回结构化结果，集中表达load Skills Dir已经整理出的状态。
  return {
    displayName:
      frontmatter.name != null ? String(frontmatter.name) : undefined,
    description,
    hasUserSpecifiedDescription: validatedDescription !== null,
    allowedTools: parseSlashCommandToolsFromFrontmatter(
      frontmatter['allowed-tools'],
    ),
    argumentHint:
      frontmatter['argument-hint'] != null
        ? String(frontmatter['argument-hint'])
        : undefined,
    argumentNames: parseArgumentNames(
      frontmatter.arguments as string | string[] | undefined,
    ),
    whenToUse: frontmatter.when_to_use as string | undefined,
    version: frontmatter.version as string | undefined,
    model,
    disableModelInvocation: parseBooleanFrontmatter(
      frontmatter['disable-model-invocation'],
    ),
    userInvocable,
    hooks: parseHooksFromFrontmatter(frontmatter, resolvedName),
    executionContext: frontmatter.context === 'fork' ? 'fork' : undefined,
    agent: frontmatter.agent as string | undefined,
    effort,
    shell: parseShellFrontmatter(frontmatter.shell, resolvedName),
  }
}

/**
 * Creates a skill command from parsed data
 */
// createSkillCommand 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSkillCommand({
  skillName,
  displayName,
  description,
  hasUserSpecifiedDescription,
  markdownContent,
  allowedTools,
  argumentHint,
  argumentNames,
  whenToUse,
  version,
  model,
  disableModelInvocation,
  userInvocable,
  source,
  baseDir,
  loadedFrom,
  hooks,
  executionContext,
  agent,
  paths,
  effort,
  shell,
}: {
  skillName: string
  displayName: string | undefined
  description: string
  hasUserSpecifiedDescription: boolean
  markdownContent: string
  allowedTools: string[]
  argumentHint: string | undefined
  argumentNames: string[]
  whenToUse: string | undefined
  version: string | undefined
  model: string | undefined
  disableModelInvocation: boolean
  userInvocable: boolean
  source: PromptCommand['source']
  baseDir: string | undefined
  loadedFrom: LoadedFrom
  hooks: HooksSettings | undefined
  executionContext: 'inline' | 'fork' | undefined
  agent: string | undefined
  paths: string[] | undefined
  effort: EffortValue | undefined
  shell: FrontmatterShell | undefined
}): Command {
  // 返回结构化结果，集中表达load Skills Dir已经整理出的状态。
  return {
    type: 'prompt',
    name: skillName,
    description,
    hasUserSpecifiedDescription,
    allowedTools,
    argumentHint,
    argNames: argumentNames.length > 0 ? argumentNames : undefined,
    whenToUse,
    version,
    model,
    disableModelInvocation,
    userInvocable,
    context: executionContext,
    agent,
    effort,
    paths,
    contentLength: markdownContent.length,
    isHidden: !userInvocable,
    progressMessage: 'running',
    // userFacingName 使用 无 完成load Skills Dir里的对应操作。
    userFacingName(): string {
      // 返回 `displayName || skillName`，作为load Skills Dir这次计算的结果。
      return displayName || skillName
    },
    source,
    loadedFrom,
    hooks,
    skillRoot: baseDir,
    // getPromptForCommand 根据 args, toolUseContext 读取或计算load Skills Dir需要的结果。
    async getPromptForCommand(args, toolUseContext) {
      // finalContent保存`baseDir`，供后续判断或组装使用。
      let finalContent = baseDir
        ? `Base directory for this skill: ${baseDir}\n\n${markdownContent}`
        : markdownContent

      // finalContent更新为 `substituteArguments(`，确保loadSkillsDir后续读取最新状态。
      finalContent = substituteArguments(
        finalContent,
        args,
        true,
        argumentNames,
      )

      // Replace ${CLAUDE_SKILL_DIR} with the skill's own directory so bash
      // injection (!`...`) can reference bundled scripts. Normalize backslashes
      // to forward slashes on Windows so shell commands don't treat them as escapes.
      // 满足 `baseDir` 时，load Skills Dir执行该分支。
      if (baseDir) {
        // skillDir 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const skillDir =
          process.platform === 'win32' ? baseDir.replace(/\\/g, '/') : baseDir
        // finalContent更新为 `finalContent.replace(/\$\{CLAUDE_SKILL_DIR\}/g, skillDir)`，确保loadSkillsDir后续读取最新状态。
        finalContent = finalContent.replace(/\$\{CLAUDE_SKILL_DIR\}/g, skillDir)
      }

      // Replace ${CLAUDE_SESSION_ID} with the current session ID
      // finalContent更新为 `finalContent.replace(`，确保loadSkillsDir后续读取最新状态。
      finalContent = finalContent.replace(
        /\$\{CLAUDE_SESSION_ID\}/g,
        getSessionId(),
      )

      // Security: MCP skills are remote and untrusted — never execute inline
      // shell commands (!`…` / ```! … ```) from their markdown body.
      // ${CLAUDE_SKILL_DIR} is meaningless for MCP skills anyway.
      // `loadedFrom` 与 `'mcp'` 不一致时刷新派生状态，避免使用过期结果。
      if (loadedFrom !== 'mcp') {
        // finalContent更新为 `await executeShellCommandsInPrompt(`，确保loadSkillsDir后续读取最新状态。
        finalContent = await executeShellCommandsInPrompt(
          finalContent,
          {
            ...toolUseContext,
            // getAppState不依赖额外参数，直接计算load Skills Dir需要的结果。
            getAppState() {
              // appState 状态读取`toolUseContext.getAppState`，供load Skills Dir后续处理使用。
              const appState = toolUseContext.getAppState()
              // 返回结构化结果，集中表达load Skills Dir已经整理出的状态。
              return {
                ...appState,
                toolPermissionContext: {
                  ...appState.toolPermissionContext,
                  alwaysAllowRules: {
                    ...appState.toolPermissionContext.alwaysAllowRules,
                    command: allowedTools,
                  },
                },
              }
            },
          },
          `/${skillName}`,
          shell,
        )
      }

      // 返回列表结果，保留load Skills Dir已经排好的条目顺序。
      return [{ type: 'text', text: finalContent }]
    },
  } satisfies Command
}

/**
 * Loads skills from a /skills/ directory path.
 * Only supports directory format: skill-name/SKILL.md
 */
// loadSkillsFromSkillsDir 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadSkillsFromSkillsDir(
  basePath: string,
  source: SettingSource,
): Promise<SkillWithPath[]> {
  // fs 集合读取`getFsImplementation`，供load Skills Dir后续处理使用。
  const fs = getFsImplementation()

  // entries 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let entries
  // 保护这一段可能失败的load Skills Dir操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合更新为 `await fs.readdir(basePath)`，确保loadSkillsDir后续读取最新状态。
    entries = await fs.readdir(basePath)
  } catch (e: unknown) {
    // 满足 `!isFsInaccessible(e)) logError(e` 时，load Skills Dir执行该分支。
    if (!isFsInaccessible(e)) logError(e)
    // 返回列表结果，保留load Skills Dir已经排好的条目顺序。
    return []
  }

  // 结果列表保存`Promise.all`，供load Skills Dir后续处理使用。
  const results = await Promise.all(
    // 调用 entries.map，触发load Skills Dir此处需要的副作用。
    entries.map(async (entry): Promise<SkillWithPath | null> => {
      // 保护这一段可能失败的load Skills Dir操作，确保异常能进入相邻错误处理。
      try {
        // Only support directory format: skill-name/SKILL.md
        // 组合条件 `!entry.isDirectory() && !entry.isSymbolicLink()` 成立时，load Skills Dir才启用这条专门路径。
        if (!entry.isDirectory() && !entry.isSymbolicLink()) {
          // Single .md files are NOT supported in /skills/ directory
          // 返回 `null`，作为load Skills Dir这次计算的结果。
          return null
        }

        // skillDirPath 路径数据格式化`join`，供load Skills Dir后续处理使用。
        const skillDirPath = join(basePath, entry.name)
        // skillFilePath 路径数据格式化`join`，供load Skills Dir后续处理使用。
        const skillFilePath = join(skillDirPath, 'SKILL.md')

        // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
        let content: string
        // 保护这一段可能失败的load Skills Dir操作，确保异常能进入相邻错误处理。
        try {
          // 文本内容更新为 `await fs.readFile(skillFilePath, { encoding: 'utf-8' })`，确保loadSkillsDir后续读取最新状态。
          content = await fs.readFile(skillFilePath, { encoding: 'utf-8' })
        } catch (e: unknown) {
          // SKILL.md doesn't exist, skip this entry. Log non-ENOENT errors
          // (EACCES/EPERM/EIO) so permission/IO problems are diagnosable.
          // 满足 `!isENOENT(e)` 时，load Skills Dir执行该分支。
          if (!isENOENT(e)) {
            // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`[skills] failed to read ${skillFilePath}: ${e}`, {
              level: 'warn',
            })
          }
          // 返回 `null`，作为load Skills Dir这次计算的结果。
          return null
        }

        // 从 `parseFrontmatter(` 解构 frontmatter、content，减少load Skills Dir对同一对象的重复访问。
        const { frontmatter, content: markdownContent } = parseFrontmatter(
          content,
          skillFilePath,
        )

        // skillName 命名 `entry.name`，让后续代码直接表达这个值的用途。
        const skillName = entry.name
        // 解析结果解析`parseSkillFrontmatterFields`，供load Skills Dir后续处理使用。
        const parsed = parseSkillFrontmatterFields(
          frontmatter,
          markdownContent,
          skillName,
        )
        // 路径列表解析`parseSkillPaths`，供load Skills Dir后续处理使用。
        const paths = parseSkillPaths(frontmatter)

        // 返回结构化结果，集中表达load Skills Dir已经整理出的状态。
        return {
          skill: createSkillCommand({
            ...parsed,
            skillName,
            markdownContent,
            source,
            baseDir: skillDirPath,
            loadedFrom: 'skills',
            paths,
          }),
          filePath: skillFilePath,
        }
      } catch (error) {
        // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
        logError(error)
        // 返回 `null`，作为load Skills Dir这次计算的结果。
        return null
      }
    }),
  )

  // 返回 `results.filter((r): r is SkillWithPath => r !== null)`，作为load Skills Dir这次计算的结果。
  return results.filter((r): r is SkillWithPath => r !== null)
}

// --- Legacy /commands/ loader ---

// isSkillFile 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSkillFile(filePath: string): boolean {
  // 返回 `/^skill\.md$/i.test(basename(filePath))`，作为load Skills Dir这次计算的结果。
  return /^skill\.md$/i.test(basename(filePath))
}

/**
 * Transforms markdown files to handle "skill" commands in legacy /commands/ folder.
 * When a SKILL.md file exists in a directory, only that file is loaded
 * and it takes the name of its parent directory.
 */
// transformSkillFiles 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function transformSkillFiles(files: MarkdownFile[]): MarkdownFile[] {
  // filesByDir 文件数据构建`new Map<string, MarkdownFile[]>()`，供后续判断或组装使用。
  const filesByDir = new Map<string, MarkdownFile[]>()

  // 按顺序遍历 `files` 中的file 文件数据，逐个交给load Skills Dir处理。
  for (const file of files) {
    // dir保存`dirname`，供load Skills Dir后续处理使用。
    const dir = dirname(file.filePath)
    // dirFiles 文件数据读取`filesByDir.get`，供load Skills Dir后续处理使用。
    const dirFiles = filesByDir.get(dir) ?? []
    // dirFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
    dirFiles.push(file)
    // filesByDir.set 写入新的状态值，使load Skills Dir后续读取保持一致。
    filesByDir.set(dir, dirFiles)
  }

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: MarkdownFile[] = []

  // 循环处理 `const [dir, dirFiles] of filesByDir`，让load Skills Dir逐项把同类条目按顺序走完。
  for (const [dir, dirFiles] of filesByDir) {
    // skillFiles 文件数据筛选`dirFiles.filter`，供load Skills Dir后续处理使用。
    const skillFiles = dirFiles.filter(f => isSkillFile(f.filePath))
    // 满足 `skillFiles.length > 0` 时，load Skills Dir执行该分支。
    if (skillFiles.length > 0) {
      // skillFile 文件数据保存`skillFiles[0]!`，供load Skills Dir后续判断或输出使用。
      const skillFile = skillFiles[0]!
      // 满足 `skillFiles.length > 1` 时，load Skills Dir执行该分支。
      if (skillFiles.length > 1) {
        // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Multiple skill files found in ${dir}, using ${basename(skillFile.filePath)}`,
        )
      }
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(skillFile)
    } else {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(...dirFiles)
    }
  }

  // 返回 `result`，作为load Skills Dir这次计算的结果。
  return result
}

// buildNamespace 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildNamespace(targetDir: string, baseDir: string): string {
  // normalizedBaseDir保存`baseDir.endsWith`，供load Skills Dir后续处理使用。
  const normalizedBaseDir = baseDir.endsWith(pathSep)
    ? baseDir.slice(0, -1)
    : baseDir

  // 满足 `targetDir === normalizedBaseDir` 时，load Skills Dir执行该分支。
  if (targetDir === normalizedBaseDir) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // relativePath 路径数据格式化`targetDir.slice`，供load Skills Dir后续处理使用。
  const relativePath = targetDir.slice(normalizedBaseDir.length + 1)
  // 返回 `relativePath ? relativePath.split(pathSep).join(':') : ''`，作为load Skills Dir这次计算的结果。
  return relativePath ? relativePath.split(pathSep).join(':') : ''
}

// getSkillCommandName 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSkillCommandName(filePath: string, baseDir: string): string {
  // skillDirectory保存`dirname`，供load Skills Dir后续处理使用。
  const skillDirectory = dirname(filePath)
  // parentOfSkillDir保存`dirname`，供load Skills Dir后续处理使用。
  const parentOfSkillDir = dirname(skillDirectory)
  // commandBaseName 命令数据保存`basename`，供load Skills Dir后续处理使用。
  const commandBaseName = basename(skillDirectory)

  // namespace构建`buildNamespace`，供load Skills Dir后续处理使用。
  const namespace = buildNamespace(parentOfSkillDir, baseDir)
  // 返回 `namespace ? `${namespace}:${commandBaseName}` : commandBaseName`，作为load Skills Dir这次计算的结果。
  return namespace ? `${namespace}:${commandBaseName}` : commandBaseName
}

// getRegularCommandName 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRegularCommandName(filePath: string, baseDir: string): string {
  // fileName 文件数据保存`basename`，供load Skills Dir后续处理使用。
  const fileName = basename(filePath)
  // fileDirectory 文件数据保存`dirname`，供load Skills Dir后续处理使用。
  const fileDirectory = dirname(filePath)
  // commandBaseName 命令数据格式化`fileName.replace`，供load Skills Dir后续处理使用。
  const commandBaseName = fileName.replace(/\.md$/, '')

  // namespace构建`buildNamespace`，供load Skills Dir后续处理使用。
  const namespace = buildNamespace(fileDirectory, baseDir)
  // 返回 `namespace ? `${namespace}:${commandBaseName}` : commandBaseName`，作为load Skills Dir这次计算的结果。
  return namespace ? `${namespace}:${commandBaseName}` : commandBaseName
}

// getCommandName 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCommandName(file: MarkdownFile): string {
  // isSkill记录 `isSkillFile` 是否成立，load Skills Dir随后按该结果分支。
  const isSkill = isSkillFile(file.filePath)
  // 返回 `isSkill`，作为load Skills Dir这次计算的结果。
  return isSkill
    ? getSkillCommandName(file.filePath, file.baseDir)
    : getRegularCommandName(file.filePath, file.baseDir)
}

/**
 * Loads skills from legacy /commands/ directories.
 * Supports both directory format (SKILL.md) and single .md file format.
 * Commands from /commands/ default to user-invocable: true
 */
// loadSkillsFromCommandsDir 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadSkillsFromCommandsDir(
  cwd: string,
): Promise<SkillWithPath[]> {
  // 保护这一段可能失败的load Skills Dir操作，确保异常能进入相邻错误处理。
  try {
    // markdownFiles 文件数据读取`loadMarkdownFilesForSubdir`，供load Skills Dir后续处理使用。
    const markdownFiles = await loadMarkdownFilesForSubdir('commands', cwd)
    // processedFiles 文件数据保存`transformSkillFiles`，供load Skills Dir后续处理使用。
    const processedFiles = transformSkillFiles(markdownFiles)

    // skills 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const skills: SkillWithPath[] = []

    // 调用 for，触发load Skills Dir此处需要的副作用。
    for (const {
      baseDir,
      filePath,
      frontmatter,
      content,
      source,
    } of processedFiles) {
      // 保护这一段可能失败的load Skills Dir操作，确保异常能进入相邻错误处理。
      try {
        // isSkillFormat记录 `isSkillFile` 是否成立，load Skills Dir随后按该结果分支。
        const isSkillFormat = isSkillFile(filePath)
        // skillDirectory保存`dirname`，供load Skills Dir后续处理使用。
        const skillDirectory = isSkillFormat ? dirname(filePath) : undefined
        // cmdName 命令数据读取`getCommandName`，供load Skills Dir后续处理使用。
        const cmdName = getCommandName({
          baseDir,
          filePath,
          frontmatter,
          content,
          source,
        })

        // 解析结果解析`parseSkillFrontmatterFields`，供load Skills Dir后续处理使用。
        const parsed = parseSkillFrontmatterFields(
          frontmatter,
          content,
          cmdName,
          'Custom command',
        )

        // skills 集合追加新条目，保持收集顺序与输入顺序一致。
        skills.push({
          skill: createSkillCommand({
            ...parsed,
            skillName: cmdName,
            displayName: undefined,
            markdownContent: content,
            source,
            baseDir: skillDirectory,
            loadedFrom: 'commands_DEPRECATED',
            paths: undefined,
          }),
          filePath,
        })
      } catch (error) {
        // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
        logError(error)
      }
    }

    // 返回 `skills`，作为load Skills Dir这次计算的结果。
    return skills
  } catch (error) {
    // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回列表结果，保留load Skills Dir已经排好的条目顺序。
    return []
  }
}

/**
 * Loads all skills from both /skills/ and legacy /commands/ directories.
 *
 * Skills from /skills/ directories:
 * - Only support directory format: skill-name/SKILL.md
 * - Default to user-invocable: true (can opt-out with user-invocable: false)
 *
 * Skills from legacy /commands/ directories:
 * - Support both directory format (SKILL.md) and single .md file format
 * - Default to user-invocable: true (user can type /cmd)
 *
 * @param cwd Current working directory for project directory traversal
 */
// getSkillDirCommands 命令数据保存`memoize`，供load Skills Dir后续处理使用。
export const getSkillDirCommands = memoize(
  async (cwd: string): Promise<Command[]> => {
    // userSkillsDir格式化`join`，供load Skills Dir后续处理使用。
    const userSkillsDir = join(getClaudeConfigHomeDir(), 'skills')
    // managedSkillsDir格式化`join`，供load Skills Dir后续处理使用。
    const managedSkillsDir = join(getManagedFilePath(), '.claude', 'skills')
    // projectSkillsDirs 集合读取`getProjectDirsUpToHome`，供load Skills Dir后续处理使用。
    const projectSkillsDirs = getProjectDirsUpToHome('skills', cwd)

    // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Loading skills from: managed=${managedSkillsDir}, user=${userSkillsDir}, project=[${projectSkillsDirs.join(', ')}]`,
    )

    // Load from additional directories (--add-dir)
    // additionalDirs 集合读取`getAdditionalDirectoriesForClaudeMd`，供load Skills Dir后续处理使用。
    const additionalDirs = getAdditionalDirectoriesForClaudeMd()
    // skillsLocked保存`isRestrictedToPluginOnly`，供load Skills Dir后续处理使用。
    const skillsLocked = isRestrictedToPluginOnly('skills')
    // projectSettingsEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const projectSettingsEnabled =
      isSettingSourceEnabled('projectSettings') && !skillsLocked

    // --bare: skip auto-discovery (managed/user/project dir walks + legacy
    // commands-dir). Load ONLY explicit --add-dir paths. Bundled skills
    // register separately. skillsLocked still applies — --bare is not a
    // policy bypass.
    // 满足 `isBareMode()` 时，load Skills Dir执行该分支。
    if (isBareMode()) {
      // 组合条件 `additionalDirs.length === 0 || !projectSettingsEn` 成立时，load Skills Dir才启用这条专门路径。
      if (additionalDirs.length === 0 || !projectSettingsEnabled) {
        // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bare] Skipping skill dir discovery (${additionalDirs.length === 0 ? 'no --add-dir' : 'projectSettings disabled or skillsLocked'})`,
        )
        // 返回列表结果，保留load Skills Dir已经排好的条目顺序。
        return []
      }
      // additionalSkillsNested保存`Promise.all`，供load Skills Dir后续处理使用。
      const additionalSkillsNested = await Promise.all(
        // 调用 additionalDirs.map，触发load Skills Dir此处需要的副作用。
        additionalDirs.map(dir =>
          loadSkillsFromSkillsDir(
            join(dir, '.claude', 'skills'),
            'projectSettings',
          ),
        ),
      )
      // No dedup needed — explicit dirs, user controls uniqueness.
      // 返回 `additionalSkillsNested.flat().map(s => s.skill)`，作为load Skills Dir这次计算的结果。
      return additionalSkillsNested.flat().map(s => s.skill)
    }

    // Load from /skills/ directories, additional dirs, and legacy /commands/ in parallel
    // (all independent — different directories, no shared state)
    // load Skills Dir先整理这一处局部数据，后续分支可以直接读取。
    const [
      managedSkills,
      userSkills,
      projectSkillsNested,
      additionalSkillsNested,
      legacyCommands,
    ] = await Promise.all([
      isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_POLICY_SKILLS)
        ? Promise.resolve([])
        : loadSkillsFromSkillsDir(managedSkillsDir, 'policySettings'),
      isSettingSourceEnabled('userSettings') && !skillsLocked
        ? loadSkillsFromSkillsDir(userSkillsDir, 'userSettings')
        : Promise.resolve([]),
      projectSettingsEnabled
        ? Promise.all(
            // 调用 projectSkillsDirs.map，触发load Skills Dir此处需要的副作用。
            projectSkillsDirs.map(dir =>
              loadSkillsFromSkillsDir(dir, 'projectSettings'),
            ),
          )
        : Promise.resolve([]),
      projectSettingsEnabled
        ? Promise.all(
            // 调用 additionalDirs.map，触发load Skills Dir此处需要的副作用。
            additionalDirs.map(dir =>
              loadSkillsFromSkillsDir(
                join(dir, '.claude', 'skills'),
                'projectSettings',
              ),
            ),
          )
        : Promise.resolve([]),
      // Legacy commands-as-skills goes through markdownConfigLoader with
      // subdir='commands', which our agents-only guard there skips. Block
      // here when skills are locked — these ARE skills, regardless of the
      // directory they load from.
      skillsLocked ? Promise.resolve([]) : loadSkillsFromCommandsDir(cwd),
    ])

    // Flatten and combine all skills
    // allSkillsWithPaths 路径数据 聚合成有序列表，保持后续遍历顺序稳定。
    const allSkillsWithPaths = [
      ...managedSkills,
      ...userSkills,
      ...projectSkillsNested.flat(),
      ...additionalSkillsNested.flat(),
      ...legacyCommands,
    ]

    // Deduplicate by resolved path (handles symlinks and duplicate parent directories)
    // Pre-compute file identities in parallel (realpath calls are independent),
    // then dedup synchronously (order-dependent first-wins)
    // fileIds 文件数据保存`Promise.all`，供load Skills Dir后续处理使用。
    const fileIds = await Promise.all(
      // 调用 allSkillsWithPaths.map，触发load Skills Dir此处需要的副作用。
      allSkillsWithPaths.map(({ skill, filePath }) =>
        skill.type === 'prompt'
          ? getFileIdentity(filePath)
          : Promise.resolve(null),
      ),
    )

    // seenFileIds 文件数据构建`new Map<`，供后续判断或组装使用。
    const seenFileIds = new Map<
      string,
      SettingSource | 'builtin' | 'mcp' | 'plugin' | 'bundled'
    >()
    // deduplicatedSkills 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const deduplicatedSkills: Command[] = []

    // 按索引扫描 `allSkillsWithPaths.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < allSkillsWithPaths.length; i++) {
      // entry读取 `allSkillsWithPaths[i]` 对应条目，后续围绕该成员继续处理。
      const entry = allSkillsWithPaths[i]
      // `entry === undefined || entry.skill.type` 与 `'prompt'` 不一致时刷新派生状态，避免使用过期结果。
      if (entry === undefined || entry.skill.type !== 'prompt') continue
      // 从 `entry` 解构 skill，减少load Skills Dir对同一对象的重复访问。
      const { skill } = entry

      // fileId 文件数据保存`fileIds[i]`，供load Skills Dir后续判断或输出使用。
      const fileId = fileIds[i]
      // 组合条件 `fileId === null || fileId === undefined` 成立时，load Skills Dir才启用这条专门路径。
      if (fileId === null || fileId === undefined) {
        // deduplicatedSkills 集合追加新条目，保持收集顺序与输入顺序一致。
        deduplicatedSkills.push(skill)
        // 跳过当前项，继续处理load Skills Dir中的下一轮循环。
        continue
      }

      // existingSource读取`seenFileIds.get`，供load Skills Dir后续处理使用。
      const existingSource = seenFileIds.get(fileId)
      // `existingSource` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (existingSource !== undefined) {
        // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping duplicate skill '${skill.name}' from ${skill.source} (same file already loaded from ${existingSource})`,
        )
        // 跳过当前项，继续处理load Skills Dir中的下一轮循环。
        continue
      }

      // seenFileIds.set 写入新的状态值，使load Skills Dir后续读取保持一致。
      seenFileIds.set(fileId, skill.source)
      // deduplicatedSkills 集合追加新条目，保持收集顺序与输入顺序一致。
      deduplicatedSkills.push(skill)
    }

    // duplicatesRemoved 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const duplicatesRemoved =
      allSkillsWithPaths.length - deduplicatedSkills.length
    // 满足 `duplicatesRemoved > 0` 时，load Skills Dir执行该分支。
    if (duplicatesRemoved > 0) {
      // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Deduplicated ${duplicatesRemoved} skills (same file)`)
    }

    // Separate conditional skills (with paths frontmatter) from unconditional ones
    // unconditionalSkills 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const unconditionalSkills: Command[] = []
    // newConditionalSkills 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const newConditionalSkills: Command[] = []
    // 按顺序遍历 `deduplicatedSkills` 中的skill，逐个交给load Skills Dir处理。
    for (const skill of deduplicatedSkills) {
      // load Skills Dir在这里进入条件判断，后续代码按实际状态分流。
      if (
        skill.type === 'prompt' &&
        skill.paths &&
        skill.paths.length > 0 &&
        !activatedConditionalSkillNames.has(skill.name)
      ) {
        // newConditionalSkills 集合追加新条目，保持收集顺序与输入顺序一致。
        newConditionalSkills.push(skill)
      } else {
        // unconditionalSkills 集合追加新条目，保持收集顺序与输入顺序一致。
        unconditionalSkills.push(skill)
      }
    }

    // Store conditional skills for later activation when matching files are touched
    // 按顺序遍历 `newConditionalSkills` 中的skill，逐个交给load Skills Dir处理。
    for (const skill of newConditionalSkills) {
      // conditionalSkills.set 写入新的状态值，使load Skills Dir后续读取保持一致。
      conditionalSkills.set(skill.name, skill)
    }

    // 满足 `newConditionalSkills.length > 0` 时，load Skills Dir执行该分支。
    if (newConditionalSkills.length > 0) {
      // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[skills] ${newConditionalSkills.length} conditional skills stored (activated when matching files are touched)`,
      )
    }

    // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Loaded ${deduplicatedSkills.length} unique skills (${unconditionalSkills.length} unconditional, ${newConditionalSkills.length} conditional, managed: ${managedSkills.length}, user: ${userSkills.length}, project: ${projectSkillsNested.flat().length}, additional: ${additionalSkillsNested.flat().length}, legacy commands: ${legacyCommands.length})`,
    )

    // 返回 `unconditionalSkills`，作为load Skills Dir这次计算的结果。
    return unconditionalSkills
  },
)

// clearSkillCaches 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSkillCaches() {
  // 调用 getSkillDirCommands.cache?.clear?.()，完成这一处局部操作。
  getSkillDirCommands.cache?.clear?.()
  // 调用 loadMarkdownFilesForSubdir.cache?.clear?.()，完成这一处局部操作。
  loadMarkdownFilesForSubdir.cache?.clear?.()
  // 调用 conditionalSkills.clear，触发load Skills Dir此处需要的副作用。
  conditionalSkills.clear()
  // 调用 activatedConditionalSkillNames.clear，触发load Skills Dir此处需要的副作用。
  activatedConditionalSkillNames.clear()
}

// Backwards-compatible aliases for tests
// 重新导出这一组成员，让load Skills Dir的公共 API 保持集中入口。
export { getSkillDirCommands as getCommandDirCommands }
// 重新导出这一组成员，让load Skills Dir的公共 API 保持集中入口。
export { clearSkillCaches as clearCommandCaches }
// 重新导出这一组成员，让load Skills Dir的公共 API 保持集中入口。
export { transformSkillFiles }

// --- Dynamic skill discovery ---

// State for dynamically discovered skills
// dynamicSkillDirs 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
const dynamicSkillDirs = new Set<string>()
// dynamicSkills 集合构建`new Map<string, Command>()` 整理出中间结果，供load Skills Dir后续步骤使用。
const dynamicSkills = new Map<string, Command>()

// --- Conditional skills (path-filtered) ---

// Skills with paths frontmatter that haven't been activated yet
// conditionalSkills 集合构建`new Map<string, Command>()` 整理出中间结果，供load Skills Dir后续步骤使用。
const conditionalSkills = new Map<string, Command>()
// Names of skills that have been activated (survives cache clears within a session)
// activatedConditionalSkillNames 集合构建`new Set<string>()` 整理出中间结果，供load Skills Dir后续步骤使用。
const activatedConditionalSkillNames = new Set<string>()

// Signal fired when dynamic skills are loaded
// skillsLoaded构建`createSignal`，供load Skills Dir后续处理使用。
const skillsLoaded = createSignal()

/**
 * Register a callback to be invoked when dynamic skills are loaded.
 * Used by other modules to clear caches without creating import cycles.
 * Returns an unsubscribe function.
 */
// onDynamicSkillsLoaded 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function onDynamicSkillsLoaded(callback: () => void): () => void {
  // Wrap at subscribe time so a throwing listener is logged and skipped
  // rather than aborting skillsLoaded.emit() and breaking skill loading.
  // Same callSafe pattern as growthbook.ts — createSignal.emit() has no
  // per-listener try/catch.
  // 返回 `skillsLoaded.subscribe(() => {`，作为load Skills Dir这次计算的结果。
  return skillsLoaded.subscribe(() => {
    // 保护这一段可能失败的load Skills Dir操作，确保异常能进入相邻错误处理。
    try {
      // 调用 callback，触发load Skills Dir此处需要的副作用。
      callback()
    } catch (error) {
      // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  })
}

/**
 * Discovers skill directories by walking up from file paths to cwd.
 * Only discovers directories below cwd (cwd-level skills are loaded at startup).
 *
 * @param filePaths Array of file paths to check
 * @param cwd Current working directory (upper bound for discovery)
 * @returns Array of newly discovered skill directories, sorted deepest first
 */
// discoverSkillDirsForPaths 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function discoverSkillDirsForPaths(
  filePaths: string[],
  cwd: string,
): Promise<string[]> {
  // fs 集合读取`getFsImplementation`，供load Skills Dir后续处理使用。
  const fs = getFsImplementation()
  // resolvedCwd保存`cwd.endsWith`，供load Skills Dir后续处理使用。
  const resolvedCwd = cwd.endsWith(pathSep) ? cwd.slice(0, -1) : cwd
  // newDirs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const newDirs: string[] = []

  // 按顺序遍历 `filePaths` 中的文件路径，逐个交给load Skills Dir处理。
  for (const filePath of filePaths) {
    // Start from the file's parent directory
    // currentDir保存`dirname`，供load Skills Dir后续处理使用。
    let currentDir = dirname(filePath)

    // Walk up to cwd but NOT including cwd itself
    // CWD-level skills are already loaded at startup, so we only discover nested ones
    // Use prefix+separator check to avoid matching /project-backup when cwd is /project
    // 只要 currentDir.startsWith(resolvedCwd + pathSep) 成立，就持续推进load Skills Dir中的循环处理。
    while (currentDir.startsWith(resolvedCwd + pathSep)) {
      // skillDir格式化`join`，供load Skills Dir后续处理使用。
      const skillDir = join(currentDir, '.claude', 'skills')

      // Skip if we've already checked this path (hit or miss) — avoids
      // repeating the same failed stat on every Read/Write/Edit call when
      // the directory doesn't exist (the common case).
      // 满足 `!dynamicSkillDirs.has(skillDir)` 时，load Skills Dir执行该分支。
      if (!dynamicSkillDirs.has(skillDir)) {
        // 调用 dynamicSkillDirs.add，触发load Skills Dir此处需要的副作用。
        dynamicSkillDirs.add(skillDir)
        // 保护这一段可能失败的load Skills Dir操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `fs.stat(skillDir)` 完成，再继续load Skills Dir的异步流程。
          await fs.stat(skillDir)
          // Skills dir exists. Before loading, check if the containing dir
          // is gitignored — blocks e.g. node_modules/pkg/.claude/skills from
          // loading silently. `git check-ignore` handles nested .gitignore,
          // .git/info/exclude, and global gitignore. Fails open outside a
          // git repo (exit 128 → false); the invocation-time trust dialog
          // is the actual security boundary.
          // 满足 `await isPathGitignored(currentDir, resolvedCwd)` 时，load Skills Dir执行该分支。
          if (await isPathGitignored(currentDir, resolvedCwd)) {
            // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[skills] Skipped gitignored skills dir: ${skillDir}`,
            )
            // 跳过当前项，继续处理load Skills Dir中的下一轮循环。
            continue
          }
          // newDirs 集合追加新条目，保持收集顺序与输入顺序一致。
          newDirs.push(skillDir)
        } catch {
          // Directory doesn't exist — already recorded above, continue
        }
      }

      // Move to parent
      // parent保存`dirname`，供load Skills Dir后续处理使用。
      const parent = dirname(currentDir)
      // 满足 `parent === currentDir` 时，load Skills Dir执行该分支。
      if (parent === currentDir) break // Reached root
      // currentDir更新为 `parent`，确保loadSkillsDir后续读取最新状态。
      currentDir = parent
    }
  }

  // Sort by path depth (deepest first) so skills closer to the file take precedence
  // 返回 `newDirs.sort(`，作为load Skills Dir这次计算的结果。
  return newDirs.sort(
    // 这个回调绑定到 (a, b) => b.split(pathSep).length - a.split(pathSep).length,，负责load Skills Dir在该局部场景下的响应。
    (a, b) => b.split(pathSep).length - a.split(pathSep).length,
  )
}

/**
 * Loads skills from the given directories and merges them into the dynamic skills map.
 * Skills from directories closer to the file (deeper paths) take precedence.
 *
 * @param dirs Array of skill directories to load from (should be sorted deepest first)
 */
// addSkillDirectories 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function addSkillDirectories(dirs: string[]): Promise<void> {
  // load Skills Dir在这里进入条件判断，后续代码按实际状态分流。
  if (
    !isSettingSourceEnabled('projectSettings') ||
    isRestrictedToPluginOnly('skills')
  ) {
    // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[skills] Dynamic skill discovery skipped: projectSettings disabled or plugin-only policy',
    )
    // load Skills Dir在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // dirs 集合为空时立即返回或跳过，避免load Skills Dir把空集合当成可处理内容。
  if (dirs.length === 0) {
    // load Skills Dir在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // previousSkillNamesForLogging保存`Set`，供load Skills Dir后续处理使用。
  const previousSkillNamesForLogging = new Set(dynamicSkills.keys())

  // Load skills from all directories
  // loadedSkills 集合保存`Promise.all`，供load Skills Dir后续处理使用。
  const loadedSkills = await Promise.all(
    // 调用 dirs.map，触发load Skills Dir此处需要的副作用。
    dirs.map(dir => loadSkillsFromSkillsDir(dir, 'projectSettings')),
  )

  // Process in reverse order (shallower first) so deeper paths override
  // 循环处理 `let i = loadedSkills.length - 1; i >= 0; i--`，让load Skills Dir逐项把同类条目按顺序走完。
  for (let i = loadedSkills.length - 1; i >= 0; i--) {
    // 循环处理 `const { skill } of loadedSkills[i] ?? []`，让load Skills Dir逐项把同类条目按顺序走完。
    for (const { skill } of loadedSkills[i] ?? []) {
      // 当 `skill.type` 匹配 `'prompt'` 时，load Skills Dir执行对应分支。
      if (skill.type === 'prompt') {
        // dynamicSkills.set 写入新的状态值，使load Skills Dir后续读取保持一致。
        dynamicSkills.set(skill.name, skill)
      }
    }
  }

  // newSkillCount 数量读取`loadedSkills.flat`，供load Skills Dir后续处理使用。
  const newSkillCount = loadedSkills.flat().length
  // 满足 `newSkillCount > 0` 时，load Skills Dir执行该分支。
  if (newSkillCount > 0) {
    // addedSkills 集合保存`dynamicSkills.keys`，供load Skills Dir后续处理使用。
    const addedSkills = [...dynamicSkills.keys()].filter(
      // n更新为 `> !previousSkillNamesForLogging.has(n)`，确保loadSkillsDir后续读取最新状态。
      n => !previousSkillNamesForLogging.has(n),
    )
    // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[skills] Dynamically discovered ${newSkillCount} skills from ${dirs.length} directories`,
    )
    // 满足 `addedSkills.length > 0` 时，load Skills Dir执行该分支。
    if (addedSkills.length > 0) {
      // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_dynamic_skills_changed', {
        source:
          'file_operation' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        previousCount: previousSkillNamesForLogging.size,
        newCount: dynamicSkills.size,
        addedCount: addedSkills.length,
        directoryCount: dirs.length,
      })
    }
  }

  // Notify listeners that skills were loaded (so they can clear caches)
  // 调用 skillsLoaded.emit，触发load Skills Dir此处需要的副作用。
  skillsLoaded.emit()
}

/**
 * Gets all dynamically discovered skills.
 * These are skills discovered from file paths during the session.
 */
// getDynamicSkills 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDynamicSkills(): Command[] {
  // 返回 `Array.from(dynamicSkills.values())`，作为load Skills Dir这次计算的结果。
  return Array.from(dynamicSkills.values())
}

/**
 * Activates conditional skills (skills with paths frontmatter) whose path
 * patterns match the given file paths. Activated skills are added to the
 * dynamic skills map, making them available to the model.
 *
 * Uses the `ignore` library (gitignore-style matching), matching the behavior
 * of CLAUDE.md conditional rules.
 *
 * @param filePaths Array of file paths being operated on
 * @param cwd Current working directory (paths are matched relative to cwd)
 * @returns Array of newly activated skill names
 */
// activateConditionalSkillsForPaths 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function activateConditionalSkillsForPaths(
  filePaths: string[],
  cwd: string,
): string[] {
  // 满足 `conditionalSkills.size === 0` 时，load Skills Dir执行该分支。
  if (conditionalSkills.size === 0) {
    // 返回列表结果，保留load Skills Dir已经排好的条目顺序。
    return []
  }

  // activated 从空数组开始收集，后续循环会按处理顺序追加条目。
  const activated: string[] = []

  // 循环处理 `const [name, skill] of conditionalSkills`，让load Skills Dir逐项把同类条目按顺序走完。
  for (const [name, skill] of conditionalSkills) {
    // `skill.type` 与 `'prompt' || !skill.paths || ski...` 不一致时刷新派生状态，避免使用过期结果。
    if (skill.type !== 'prompt' || !skill.paths || skill.paths.length === 0) {
      // 跳过当前项，继续处理load Skills Dir中的下一轮循环。
      continue
    }

    // skillIgnore保存`ignore`，供load Skills Dir后续处理使用。
    const skillIgnore = ignore().add(skill.paths)
    // 按顺序遍历 `filePaths` 中的文件路径，逐个交给load Skills Dir处理。
    for (const filePath of filePaths) {
      // relativePath 路径数据保存`isAbsolute`，供load Skills Dir后续处理使用。
      const relativePath = isAbsolute(filePath)
        ? relative(cwd, filePath)
        : filePath

      // ignore() throws on empty strings, paths escaping the base (../),
      // and absolute paths (Windows cross-drive relative() returns absolute).
      // Files outside cwd can't match cwd-relative patterns anyway.
      // load Skills Dir在这里进入条件判断，后续代码按实际状态分流。
      if (
        !relativePath ||
        relativePath.startsWith('..') ||
        isAbsolute(relativePath)
      ) {
        // 跳过当前项，继续处理load Skills Dir中的下一轮循环。
        continue
      }

      // 满足 `skillIgnore.ignores(relativePath)` 时，load Skills Dir执行该分支。
      if (skillIgnore.ignores(relativePath)) {
        // Activate this skill by moving it to dynamic skills
        // dynamicSkills.set 写入新的状态值，使load Skills Dir后续读取保持一致。
        dynamicSkills.set(name, skill)
        // 调用 conditionalSkills.delete，触发load Skills Dir此处需要的副作用。
        conditionalSkills.delete(name)
        // 调用 activatedConditionalSkillNames.add，触发load Skills Dir此处需要的副作用。
        activatedConditionalSkillNames.add(name)
        // activated追加新条目，保持收集顺序与输入顺序一致。
        activated.push(name)
        // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[skills] Activated conditional skill '${name}' (matched path: ${relativePath})`,
        )
        // 结束这个分支或循环，避免load Skills Dir继续落入后续路径。
        break
      }
    }
  }

  // 满足 `activated.length > 0` 时，load Skills Dir执行该分支。
  if (activated.length > 0) {
    // 记录load Skills Dir运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_dynamic_skills_changed', {
      source:
        'conditional_paths' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      previousCount: dynamicSkills.size - activated.length,
      newCount: dynamicSkills.size,
      addedCount: activated.length,
      directoryCount: 0,
    })

    // Notify listeners that skills were loaded (so they can clear caches)
    // 调用 skillsLoaded.emit，触发load Skills Dir此处需要的副作用。
    skillsLoaded.emit()
  }

  // 返回 `activated`，作为load Skills Dir这次计算的结果。
  return activated
}

/**
 * Gets the number of pending conditional skills (for testing/debugging).
 */
// getConditionalSkillCount 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getConditionalSkillCount(): number {
  // 返回 `conditionalSkills.size`，作为load Skills Dir这次计算的结果。
  return conditionalSkills.size
}

/**
 * Clears dynamic skill state (for testing).
 */
// clearDynamicSkills 封装loadSkillsDir的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearDynamicSkills(): void {
  // 调用 dynamicSkillDirs.clear，触发load Skills Dir此处需要的副作用。
  dynamicSkillDirs.clear()
  // 调用 dynamicSkills.clear，触发load Skills Dir此处需要的副作用。
  dynamicSkills.clear()
  // 调用 conditionalSkills.clear，触发load Skills Dir此处需要的副作用。
  conditionalSkills.clear()
  // 调用 activatedConditionalSkillNames.clear，触发load Skills Dir此处需要的副作用。
  activatedConditionalSkillNames.clear()
}

// Expose createSkillCommand + parseSkillFrontmatterFields to MCP skill
// discovery via a leaf registry module. See mcpSkillBuilders.ts for why this
// indirection exists (a literal dynamic import from mcpSkills.ts fans a single
// edge out into many cycle violations; a variable-specifier dynamic import
// passes dep-cruiser but fails to resolve in Bun-bundled binaries at runtime).
// eslint-disable-next-line custom-rules/no-top-level-side-effects -- write-once registration, idempotent
// 调用 registerMCPSkillBuilders，触发load Skills Dir此处需要的副作用。
registerMCPSkillBuilders({
  createSkillCommand,
  parseSkillFrontmatterFields,
})
