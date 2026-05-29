// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, join } from 'path'
// 引入 getInlinePlugins、getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getInlinePlugins, getSessionId } from '../../bootstrap/state.js'
// 类型依赖 { Command } 来自 ../../types/command.js，用于校准插件管理的数据契约。
import type { Command } from '../../types/command.js'
// 引入 getPluginErrorMessage，将 ../../types/plugin.js 中已经封装好的能力接到本文件流程里。
import { getPluginErrorMessage } from '../../types/plugin.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  parseArgumentNames,
  substituteArguments,
} from '../argumentSubstitution.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 EFFORT_LEVELS、parseEffortValue，将 ../effort.js 中已经封装好的能力接到本文件流程里。
import { EFFORT_LEVELS, parseEffortValue } from '../effort.js'
// 引入 isBareMode，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isBareMode } from '../envUtils.js'
// 引入 isENOENT，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { isENOENT } from '../errors.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  coerceDescriptionToString,
  type FrontmatterData,
  parseBooleanFrontmatter,
  parseFrontmatter,
  parseShellFrontmatter,
} from '../frontmatterParser.js'
// 引入 getFsImplementation、isDuplicatePath，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation, isDuplicatePath } from '../fsOperations.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  extractDescriptionFromMarkdown,
  parseSlashCommandToolsFromFrontmatter,
} from '../markdownConfigLoader.js'
// 引入 parseUserSpecifiedModel，将 ../model/model.js 中已经封装好的能力接到本文件流程里。
import { parseUserSpecifiedModel } from '../model/model.js'
// 引入 executeShellCommandsInPrompt，将 ../promptShellExecution.js 中已经封装好的能力接到本文件流程里。
import { executeShellCommandsInPrompt } from '../promptShellExecution.js'
// 引入 loadAllPluginsCacheOnly，将 ./pluginLoader.js 中已经封装好的能力接到本文件流程里。
import { loadAllPluginsCacheOnly } from './pluginLoader.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  loadPluginOptions,
  substitutePluginVariables,
  substituteUserConfigInContent,
} from './pluginOptionsStorage.js'
// 类型依赖 { CommandMetadata, PluginManifest } 来自 ./schemas.js，用于校准插件管理的数据契约。
import type { CommandMetadata, PluginManifest } from './schemas.js'
// 引入 walkPluginMarkdown，将 ./walkPluginMarkdown.js 中已经封装好的能力接到本文件流程里。
import { walkPluginMarkdown } from './walkPluginMarkdown.js'

// Similar to MarkdownFile but for plugin sources
// PluginMarkdownFile 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type PluginMarkdownFile = {
  filePath: string
  baseDir: string
  frontmatter: FrontmatterData
  content: string
}

// Configuration for loading commands or skills
// LoadConfig 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type LoadConfig = {
  isSkillMode: boolean // true when loading from skills/ directory
}

/**
 * Check if a file path is a skill file (SKILL.md)
 */
// isSkillFile 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSkillFile(filePath: string): boolean {
  // 返回 `/^skill\.md$/i.test(basename(filePath))`，作为插件管理这次计算的结果。
  return /^skill\.md$/i.test(basename(filePath))
}

/**
 * Get command name from file path, handling both regular files and skills
 */
// getCommandNameFromFile 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCommandNameFromFile(
  filePath: string,
  baseDir: string,
  pluginName: string,
): string {
  // isSkill记录 `isSkillFile` 是否成立，插件管理随后按该结果分支。
  const isSkill = isSkillFile(filePath)

  // 满足 `isSkill` 时，插件管理执行该分支。
  if (isSkill) {
    // For skills, use the parent directory name
    // skillDirectory保存`dirname`，供插件管理后续处理使用。
    const skillDirectory = dirname(filePath)
    // parentOfSkillDir保存`dirname`，供插件管理后续处理使用。
    const parentOfSkillDir = dirname(skillDirectory)
    // commandBaseName 命令数据保存`basename`，供插件管理后续处理使用。
    const commandBaseName = basename(skillDirectory)

    // Build namespace from parent of skill directory
    // relativePath 路径数据保存`parentOfSkillDir.startsWith`，供插件管理后续处理使用。
    const relativePath = parentOfSkillDir.startsWith(baseDir)
      ? parentOfSkillDir.slice(baseDir.length).replace(/^\//, '')
      : ''
    // namespace格式化`relativePath.split`，供插件管理后续处理使用。
    const namespace = relativePath ? relativePath.split('/').join(':') : ''

    // 返回 `namespace`，作为插件管理这次计算的结果。
    return namespace
      ? `${pluginName}:${namespace}:${commandBaseName}`
      : `${pluginName}:${commandBaseName}`
  } else {
    // For regular files, use filename without .md
    // fileDirectory 文件数据保存`dirname`，供插件管理后续处理使用。
    const fileDirectory = dirname(filePath)
    // commandBaseName 命令数据保存`basename`，供插件管理后续处理使用。
    const commandBaseName = basename(filePath).replace(/\.md$/, '')

    // Build namespace from file directory
    // relativePath 路径数据保存`fileDirectory.startsWith`，供插件管理后续处理使用。
    const relativePath = fileDirectory.startsWith(baseDir)
      ? fileDirectory.slice(baseDir.length).replace(/^\//, '')
      : ''
    // namespace格式化`relativePath.split`，供插件管理后续处理使用。
    const namespace = relativePath ? relativePath.split('/').join(':') : ''

    // 返回 `namespace`，作为插件管理这次计算的结果。
    return namespace
      ? `${pluginName}:${namespace}:${commandBaseName}`
      : `${pluginName}:${commandBaseName}`
  }
}

/**
 * Recursively collects all markdown files from a directory
 */
// collectMarkdownFiles 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function collectMarkdownFiles(
  dirPath: string,
  baseDir: string,
  loadedPaths: Set<string>,
): Promise<PluginMarkdownFile[]> {
  // files 文件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const files: PluginMarkdownFile[] = []
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()

  // 等待 `walkPluginMarkdown(` 完成，再继续插件工具 load Plugin Commands的异步流程。
  await walkPluginMarkdown(
    dirPath,
    // 这个回调绑定到 async fullPath => {，负责插件管理在该局部场景下的响应。
    async fullPath => {
      // 满足 `isDuplicatePath(fs, fullPath, loadedPaths)` 时，插件管理执行该分支。
      if (isDuplicatePath(fs, fullPath, loadedPaths)) return
      // 文本内容读取`fs.readFile`，供插件管理后续处理使用。
      const content = await fs.readFile(fullPath, { encoding: 'utf-8' })
      // 从 `parseFrontmatter(` 解构 frontmatter、content，减少插件工具 load Plugin Commands对同一对象的重复访问。
      const { frontmatter, content: markdownContent } = parseFrontmatter(
        content,
        fullPath,
      )
      // files 文件数据追加新条目，保持收集顺序与输入顺序一致。
      files.push({
        filePath: fullPath,
        baseDir,
        frontmatter,
        content: markdownContent,
      })
    },
    { stopAtSkillDir: true, logLabel: 'commands' },
  )

  // 返回 `files`，作为插件管理这次计算的结果。
  return files
}

/**
 * Transforms plugin markdown files to handle skill directories
 */
// transformPluginSkillFiles 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function transformPluginSkillFiles(
  files: PluginMarkdownFile[],
): PluginMarkdownFile[] {
  // filesByDir 文件数据 命名 `new Map<string, PluginMarkdownFile[]>()`，让后续代码直接表达这个值的用途。
  const filesByDir = new Map<string, PluginMarkdownFile[]>()

  // 按顺序遍历 `files` 中的file 文件数据，逐个交给插件管理处理。
  for (const file of files) {
    // dir保存`dirname`，供插件管理后续处理使用。
    const dir = dirname(file.filePath)
    // dirFiles 文件数据读取`filesByDir.get`，供插件管理后续处理使用。
    const dirFiles = filesByDir.get(dir) ?? []
    // dirFiles 文件数据追加新条目，保持收集顺序与输入顺序一致。
    dirFiles.push(file)
    // filesByDir.set 写入新的状态值，使插件管理后续读取保持一致。
    filesByDir.set(dir, dirFiles)
  }

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: PluginMarkdownFile[] = []

  // 循环处理 `const [dir, dirFiles] of filesByDir`，让插件管理逐项把同类条目按顺序走完。
  for (const [dir, dirFiles] of filesByDir) {
    // skillFiles 文件数据筛选`dirFiles.filter`，供插件管理后续处理使用。
    const skillFiles = dirFiles.filter(f => isSkillFile(f.filePath))
    // 满足 `skillFiles.length > 0` 时，插件管理执行该分支。
    if (skillFiles.length > 0) {
      // Use the first skill file if multiple exist
      // skillFile 文件数据读取 `skillFiles[0]!` 对应条目，后续围绕该成员继续处理。
      const skillFile = skillFiles[0]!
      // 满足 `skillFiles.length > 1` 时，插件管理执行该分支。
      if (skillFiles.length > 1) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Multiple skill files found in ${dir}, using ${basename(skillFile.filePath)}`,
        )
      }
      // Directory has a skill - only include the skill file
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(skillFile)
    } else {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(...dirFiles)
    }
  }

  // 返回 `result`，作为插件管理这次计算的结果。
  return result
}

// loadCommandsFromDirectory 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadCommandsFromDirectory(
  commandsPath: string,
  pluginName: string,
  sourceName: string,
  pluginManifest: PluginManifest,
  pluginPath: string,
  config: LoadConfig = { isSkillMode: false },
  loadedPaths: Set<string> = new Set(),
): Promise<Command[]> {
  // Collect all markdown files
  // markdownFiles 文件数据保存`collectMarkdownFiles`，供插件管理后续处理使用。
  const markdownFiles = await collectMarkdownFiles(
    commandsPath,
    commandsPath,
    loadedPaths,
  )

  // Apply skill transformation
  // processedFiles 文件数据保存`transformPluginSkillFiles`，供插件管理后续处理使用。
  const processedFiles = transformPluginSkillFiles(markdownFiles)

  // Convert to commands
  // commands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const commands: Command[] = []
  // 按顺序遍历 `processedFiles` 中的file 文件数据，逐个交给插件管理处理。
  for (const file of processedFiles) {
    // commandName 命令数据读取`getCommandNameFromFile`，供插件管理后续处理使用。
    const commandName = getCommandNameFromFile(
      file.filePath,
      file.baseDir,
      pluginName,
    )

    // 命令构建`createPluginCommand`，供插件管理后续处理使用。
    const command = createPluginCommand(
      commandName,
      file,
      sourceName,
      pluginManifest,
      pluginPath,
      isSkillFile(file.filePath),
      config,
    )

    // 满足 `command` 时，插件管理执行该分支。
    if (command) {
      // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
      commands.push(command)
    }
  }

  // 返回 `commands`，作为插件管理这次计算的结果。
  return commands
}

/**
 * Create a Command from a plugin markdown file
 */
// createPluginCommand 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createPluginCommand(
  commandName: string,
  file: PluginMarkdownFile,
  sourceName: string,
  pluginManifest: PluginManifest,
  pluginPath: string,
  isSkill: boolean,
  config: LoadConfig = { isSkillMode: false },
): Command | null {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 从 `file` 解构 frontmatter、content，减少插件工具 load Plugin Commands对同一对象的重复访问。
    const { frontmatter, content } = file

    // validatedDescription保存`coerceDescriptionToString`，供插件管理后续处理使用。
    const validatedDescription = coerceDescriptionToString(
      frontmatter.description,
      commandName,
    )
    // description 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const description =
      validatedDescription ??
      extractDescriptionFromMarkdown(
        content,
        isSkill ? 'Plugin skill' : 'Plugin command',
      )

    // Substitute ${CLAUDE_PLUGIN_ROOT} in allowed-tools before parsing
    // rawAllowedTools 集合保存`frontmatter['allowed-tools']`，供插件工具 load Plugin Commands后续判断或输出使用。
    const rawAllowedTools = frontmatter['allowed-tools']
    // substitutedAllowedTools 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const substitutedAllowedTools =
      typeof rawAllowedTools === 'string'
        ? substitutePluginVariables(rawAllowedTools, {
            path: pluginPath,
            source: sourceName,
          })
        : Array.isArray(rawAllowedTools)
          // 这个回调绑定到 ? rawAllowedTools.map(tool =>，负责插件管理在该局部场景下的响应。
          ? rawAllowedTools.map(tool =>
              typeof tool === 'string'
                ? substitutePluginVariables(tool, {
                    path: pluginPath,
                    source: sourceName,
                  })
                : tool,
            )
          : rawAllowedTools
    // allowedTools 集合解析`parseSlashCommandToolsFromFrontmatter`，供插件管理后续处理使用。
    const allowedTools = parseSlashCommandToolsFromFrontmatter(
      substitutedAllowedTools,
    )

    // argumentHint读取 `frontmatter['argument-hint'] as string | undefined` 对应条目，后续围绕该成员继续处理。
    const argumentHint = frontmatter['argument-hint'] as string | undefined
    // argumentNames 集合解析`parseArgumentNames`，供插件管理后续处理使用。
    const argumentNames = parseArgumentNames(
      frontmatter.arguments as string | string[] | undefined,
    )
    // whenToUse保存`frontmatter.when_to_use as string | undefined`，供后续判断或组装使用。
    const whenToUse = frontmatter.when_to_use as string | undefined
    // version保存`frontmatter.version as string | undefined`，供插件工具 load Plugin Commands后续判断或输出使用。
    const version = frontmatter.version as string | undefined
    // displayName保存`frontmatter.name as string | undefined`，供后续判断或组装使用。
    const displayName = frontmatter.name as string | undefined

    // Handle model configuration, resolving aliases like 'haiku', 'sonnet', 'opus'
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
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Plugin command ${commandName} has invalid effort '${effortRaw}'. Valid options: ${EFFORT_LEVELS.join(', ')} or an integer`,
      )
    }

    // disableModelInvocation解析`parseBooleanFrontmatter`，供插件管理后续处理使用。
    const disableModelInvocation = parseBooleanFrontmatter(
      frontmatter['disable-model-invocation'],
    )

    // userInvocableValue保存`frontmatter['user-invocable']`，供插件工具 load Plugin Commands后续判断或输出使用。
    const userInvocableValue = frontmatter['user-invocable']
    // userInvocable 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const userInvocable =
      userInvocableValue === undefined
        ? true
        : parseBooleanFrontmatter(userInvocableValue)

    // shell解析`parseShellFrontmatter`，供插件管理后续处理使用。
    const shell = parseShellFrontmatter(frontmatter.shell, commandName)

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      type: 'prompt',
      name: commandName,
      description,
      hasUserSpecifiedDescription: validatedDescription !== null,
      allowedTools,
      argumentHint,
      argNames: argumentNames.length > 0 ? argumentNames : undefined,
      whenToUse,
      version,
      model,
      effort,
      disableModelInvocation,
      userInvocable,
      contentLength: content.length,
      source: 'plugin' as const,
      loadedFrom: isSkill || config.isSkillMode ? 'plugin' : undefined,
      pluginInfo: {
        pluginManifest,
        repository: sourceName,
      },
      isHidden: !userInvocable,
      progressMessage: isSkill || config.isSkillMode ? 'loading' : 'running',
      // userFacingName 使用 无 完成插件管理里的对应操作。
      userFacingName(): string {
        // 返回 `displayName || commandName`，作为插件管理这次计算的结果。
        return displayName || commandName
      },
      // getPromptForCommand 根据 args, context 读取或计算插件管理需要的结果。
      async getPromptForCommand(args, context) {
        // For skills from skills/ directory, include base directory
        // finalContent 命名 `config.isSkillMode`，让后续代码直接表达这个值的用途。
        let finalContent = config.isSkillMode
          ? `Base directory for this skill: ${dirname(file.filePath)}\n\n${content}`
          : content

        // finalContent更新为 `substituteArguments(`，确保插件工具后续读取最新状态。
        finalContent = substituteArguments(
          finalContent,
          args,
          true,
          argumentNames,
        )

        // Replace ${CLAUDE_PLUGIN_ROOT} and ${CLAUDE_PLUGIN_DATA} with their paths
        // finalContent更新为 `substitutePluginVariables(finalContent, {`，确保插件工具后续读取最新状态。
        finalContent = substitutePluginVariables(finalContent, {
          path: pluginPath,
          source: sourceName,
        })

        // Replace ${user_config.X} with saved option values. Sensitive keys
        // resolve to a descriptive placeholder instead — skill content goes to
        // the model prompt and we don't put secrets there.
        // 满足 `pluginManifest.userConfig` 时，插件管理执行该分支。
        if (pluginManifest.userConfig) {
          // finalContent更新为 `substituteUserConfigInContent(`，确保插件工具后续读取最新状态。
          finalContent = substituteUserConfigInContent(
            finalContent,
            loadPluginOptions(sourceName),
            pluginManifest.userConfig,
          )
        }

        // Replace ${CLAUDE_SKILL_DIR} with this specific skill's directory.
        // Distinct from ${CLAUDE_PLUGIN_ROOT}: a plugin can contain multiple
        // skills, so CLAUDE_PLUGIN_ROOT points to the plugin root while
        // CLAUDE_SKILL_DIR points to the individual skill's subdirectory.
        // 满足 `config.isSkillMode` 时，插件管理执行该分支。
        if (config.isSkillMode) {
          // rawSkillDir保存`dirname`，供插件管理后续处理使用。
          const rawSkillDir = dirname(file.filePath)
          // skillDir 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const skillDir =
            process.platform === 'win32'
              ? rawSkillDir.replace(/\\/g, '/')
              : rawSkillDir
          // finalContent更新为 `finalContent.replace(`，确保插件工具后续读取最新状态。
          finalContent = finalContent.replace(
            /\$\{CLAUDE_SKILL_DIR\}/g,
            skillDir,
          )
        }

        // Replace ${CLAUDE_SESSION_ID} with the current session ID
        // finalContent更新为 `finalContent.replace(`，确保插件工具后续读取最新状态。
        finalContent = finalContent.replace(
          /\$\{CLAUDE_SESSION_ID\}/g,
          getSessionId(),
        )

        // finalContent更新为 `await executeShellCommandsInPrompt(`，确保插件工具后续读取最新状态。
        finalContent = await executeShellCommandsInPrompt(
          finalContent,
          {
            ...context,
            // getAppState不依赖额外参数，直接计算插件管理需要的结果。
            getAppState() {
              // appState 状态读取`context.getAppState`，供插件管理后续处理使用。
              const appState = context.getAppState()
              // 返回结构化结果，集中表达插件管理已经整理出的状态。
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
          `/${commandName}`,
          shell,
        )

        // 返回列表结果，保留插件管理已经排好的条目顺序。
        return [{ type: 'text', text: finalContent }]
      },
    } satisfies Command
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to create command from ${file.filePath}: ${error}`,
      {
        level: 'error',
      },
    )
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

// getPluginCommands 命令数据保存`memoize`，供插件管理后续处理使用。
export const getPluginCommands = memoize(async (): Promise<Command[]> => {
  // --bare: skip marketplace plugin auto-load. Explicit --plugin-dir still
  // works — getInlinePlugins() is set by main.tsx from --plugin-dir.
  // loadAllPluginsCacheOnly already short-circuits to inline-only when
  // inlinePlugins.length > 0.
  // isBareMode() && getInlinePlugin... 插件数据为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (isBareMode() && getInlinePlugins().length === 0) {
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }
  // Only load commands from enabled plugins
  // 从 `await loadAllPluginsCacheOnly()` 解构 enabled、errors，减少插件工具 load Plugin Commands对同一对象的重复访问。
  const { enabled, errors } = await loadAllPluginsCacheOnly()

  // 满足 `errors.length > 0` 时，插件管理执行该分支。
  if (errors.length > 0) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      // 这个回调绑定到 `Plugin loading errors: ${errors.map(e => getPluginErrorMessage(e)).join(', ')}`,，负责插件管理在该局部场景下的响应。
      `Plugin loading errors: ${errors.map(e => getPluginErrorMessage(e)).join(', ')}`,
    )
  }

  // Process plugins in parallel; each plugin has its own loadedPaths scope
  // perPluginCommands 命令数据保存`Promise.all`，供插件管理后续处理使用。
  const perPluginCommands = await Promise.all(
    // 调用 enabled.map，触发插件管理此处需要的副作用。
    enabled.map(async (plugin): Promise<Command[]> => {
      // Track loaded file paths to prevent duplicates within this plugin
      // loadedPaths 路径数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
      const loadedPaths = new Set<string>()
      // pluginCommands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const pluginCommands: Command[] = []

      // Load commands from default commands directory
      // 满足 `plugin.commandsPath` 时，插件管理执行该分支。
      if (plugin.commandsPath) {
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // commands 命令数据读取`loadCommandsFromDirectory`，供插件管理后续处理使用。
          const commands = await loadCommandsFromDirectory(
            plugin.commandsPath,
            plugin.name,
            plugin.source,
            plugin.manifest,
            plugin.path,
            { isSkillMode: false },
            loadedPaths,
          )
          // pluginCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
          pluginCommands.push(...commands)

          // 满足 `commands.length > 0` 时，插件管理执行该分支。
          if (commands.length > 0) {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Loaded ${commands.length} commands from plugin ${plugin.name} default directory`,
            )
          }
        } catch (error) {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Failed to load commands from plugin ${plugin.name} default directory: ${error}`,
            { level: 'error' },
          )
        }
      }

      // Load commands from additional paths specified in manifest
      // 满足 `plugin.commandsPaths` 时，插件管理执行该分支。
      if (plugin.commandsPaths) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin ${plugin.name} has commandsPaths: ${plugin.commandsPaths.join(', ')}`,
        )
        // Process all commandsPaths in parallel. isDuplicatePath is synchronous
        // (check-and-add), so concurrent access to loadedPaths is safe.
        // pathResults 路径数据保存`Promise.all`，供插件管理后续处理使用。
        const pathResults = await Promise.all(
          // 调用 plugin.commandsPaths.map，触发插件管理此处需要的副作用。
          plugin.commandsPaths.map(async (commandPath): Promise<Command[]> => {
            // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
            try {
              // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
              const fs = getFsImplementation()
              // stats 集合保存`fs.stat`，供插件管理后续处理使用。
              const stats = await fs.stat(commandPath)
              // 记录插件管理运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Checking commandPath ${commandPath} - isDirectory: ${stats.isDirectory()}, isFile: ${stats.isFile()}`,
              )

              // 满足 `stats.isDirectory()` 时，插件管理执行该分支。
              if (stats.isDirectory()) {
                // Load all .md files and skill directories from directory
                // commands 命令数据读取`loadCommandsFromDirectory`，供插件管理后续处理使用。
                const commands = await loadCommandsFromDirectory(
                  commandPath,
                  plugin.name,
                  plugin.source,
                  plugin.manifest,
                  plugin.path,
                  { isSkillMode: false },
                  loadedPaths,
                )

                // 满足 `commands.length > 0` 时，插件管理执行该分支。
                if (commands.length > 0) {
                  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `Loaded ${commands.length} commands from plugin ${plugin.name} custom path: ${commandPath}`,
                  )
                } else {
                  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `Warning: No commands found in plugin ${plugin.name} custom directory: ${commandPath}. Expected .md files or SKILL.md in subdirectories.`,
                    { level: 'warn' },
                  )
                }
                // 返回 `commands`，作为插件管理这次计算的结果。
                return commands
              // 插件工具 load Plugin Commands在这里处理 `} else if (stats.isFile() && commandPath.endsWith('.md')) {`，完成这一小步状态转换。
              } else if (stats.isFile() && commandPath.endsWith('.md')) {
                // 满足 `isDuplicatePath(fs, commandPath, loadedPaths)` 时，插件管理执行该分支。
                if (isDuplicatePath(fs, commandPath, loadedPaths)) {
                  // 返回列表结果，保留插件管理已经排好的条目顺序。
                  return []
                }

                // Load single command file
                // 文本内容读取`fs.readFile`，供插件管理后续处理使用。
                const content = await fs.readFile(commandPath, {
                  encoding: 'utf-8',
                })
                // 插件工具 load Plugin Commands先整理这一处局部数据，后续分支可以直接读取。
                const { frontmatter, content: markdownContent } =
                  parseFrontmatter(content, commandPath)

                // Check if there's metadata for this command (object-mapping format)
                // commandName 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
                let commandName: string | undefined
                // metadataOverride 先占位，稍后的条件分支会根据实际输入补齐它。
                let metadataOverride: CommandMetadata | undefined

                // 满足 `plugin.commandsMetadata` 时，插件管理执行该分支。
                if (plugin.commandsMetadata) {
                  // Find metadata by matching the command's absolute path to the metadata source
                  // Convert metadata.source (relative to plugin root) to absolute path for comparison
                  // 调用 for，触发插件管理此处需要的副作用。
                  for (const [name, metadata] of Object.entries(
                    plugin.commandsMetadata,
                  )) {
                    // 满足 `metadata.source` 时，插件管理执行该分支。
                    if (metadata.source) {
                      // fullMetadataPath 路径数据格式化`join`，供插件管理后续处理使用。
                      const fullMetadataPath = join(
                        plugin.path,
                        metadata.source,
                      )
                      // 满足 `commandPath === fullMetadataPath` 时，插件管理执行该分支。
                      if (commandPath === fullMetadataPath) {
                        // commandName 命令数据更新为 ``${plugin.name}:${name}``，确保插件工具后续读取最新状态。
                        commandName = `${plugin.name}:${name}`
                        // metadataOverride更新为 `metadata`，确保插件工具后续读取最新状态。
                        metadataOverride = metadata
                        // 结束这个分支或循环，避免插件管理继续落入后续路径。
                        break
                      }
                    }
                  }
                }

                // Fall back to filename-based naming if no metadata
                // commandName 命令数据缺失时直接走兜底路径，避免插件管理使用无效输入。
                if (!commandName) {
                  // commandName 命令数据更新为 ``${plugin.name}:${basename(commandPath).replace(/\.md$/, ...`，确保插件工具后续读取最新状态。
                  commandName = `${plugin.name}:${basename(commandPath).replace(/\.md$/, '')}`
                }

                // Apply metadata overrides to frontmatter
                // finalFrontmatter 命名 `metadataOverride`，让后续代码直接表达这个值的用途。
                const finalFrontmatter = metadataOverride
                  ? {
                      ...frontmatter,
                      ...(metadataOverride.description && {
                        description: metadataOverride.description,
                      }),
                      ...(metadataOverride.argumentHint && {
                        'argument-hint': metadataOverride.argumentHint,
                      }),
                      ...(metadataOverride.model && {
                        model: metadataOverride.model,
                      }),
                      ...(metadataOverride.allowedTools && {
                        'allowed-tools':
                          metadataOverride.allowedTools.join(','),
                      }),
                    }
                  : frontmatter

                // file 文件数据 集中保存插件工具 load Plugin Commands要一起传递的字段。
                const file: PluginMarkdownFile = {
                  filePath: commandPath,
                  baseDir: dirname(commandPath),
                  frontmatter: finalFrontmatter,
                  content: markdownContent,
                }

                // 命令构建`createPluginCommand`，供插件管理后续处理使用。
                const command = createPluginCommand(
                  commandName,
                  file,
                  plugin.source,
                  plugin.manifest,
                  plugin.path,
                  false,
                )

                // 满足 `command` 时，插件管理执行该分支。
                if (command) {
                  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `Loaded command from plugin ${plugin.name} custom file: ${commandPath}${metadataOverride ? ' (with metadata override)' : ''}`,
                  )
                  // 返回列表结果，保留插件管理已经排好的条目顺序。
                  return [command]
                }
              }
              // 返回列表结果，保留插件管理已经排好的条目顺序。
              return []
            } catch (error) {
              // 记录插件管理运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Failed to load commands from plugin ${plugin.name} custom path ${commandPath}: ${error}`,
                { level: 'error' },
              )
              // 返回列表结果，保留插件管理已经排好的条目顺序。
              return []
            }
          }),
        )
        // 按顺序遍历 `pathResults` 中的commands 命令数据，逐个交给插件管理处理。
        for (const commands of pathResults) {
          // pluginCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
          pluginCommands.push(...commands)
        }
      }

      // Load commands with inline content (no source file)
      // Note: Commands with source files were already loaded in the previous loop
      // when iterating through commandsPaths. This loop handles metadata entries
      // that specify inline content instead of file references.
      // 满足 `plugin.commandsMetadata` 时，插件管理执行该分支。
      if (plugin.commandsMetadata) {
        // 调用 for，触发插件管理此处需要的副作用。
        for (const [name, metadata] of Object.entries(
          plugin.commandsMetadata,
        )) {
          // Only process entries with inline content (no source)
          // 只有 `metadata.content && !metadata.source` 满足时，插件管理才执行该分支。
          if (metadata.content && !metadata.source) {
            // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
            try {
              // Parse inline content for frontmatter
              // 插件工具 load Plugin Commands先整理这一处局部数据，后续分支可以直接读取。
              const { frontmatter, content: markdownContent } =
                parseFrontmatter(
                  metadata.content,
                  `<inline:${plugin.name}:${name}>`,
                )

              // Apply metadata overrides to frontmatter
              // finalFrontmatter 集中保存插件工具 load Plugin Commands要一起传递的字段。
              const finalFrontmatter: FrontmatterData = {
                ...frontmatter,
                ...(metadata.description && {
                  description: metadata.description,
                }),
                ...(metadata.argumentHint && {
                  'argument-hint': metadata.argumentHint,
                }),
                ...(metadata.model && {
                  model: metadata.model,
                }),
                ...(metadata.allowedTools && {
                  'allowed-tools': metadata.allowedTools.join(','),
                }),
              }

              // commandName 命令数据固定为 ``${plugin.name}:${name}``，作为插件工具 load Plugin Commands后续展示或比较的基准。
              const commandName = `${plugin.name}:${name}`
              // file 文件数据 集中保存插件工具 load Plugin Commands要一起传递的字段。
              const file: PluginMarkdownFile = {
                filePath: `<inline:${commandName}>`, // Virtual path for inline content
                baseDir: plugin.path, // Use plugin root as base directory
                frontmatter: finalFrontmatter,
                content: markdownContent,
              }

              // 命令构建`createPluginCommand`，供插件管理后续处理使用。
              const command = createPluginCommand(
                commandName,
                file,
                plugin.source,
                plugin.manifest,
                plugin.path,
                false,
              )

              // 满足 `command` 时，插件管理执行该分支。
              if (command) {
                // pluginCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
                pluginCommands.push(command)
                // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `Loaded inline content command from plugin ${plugin.name}: ${commandName}`,
                )
              }
            } catch (error) {
              // 记录插件管理运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Failed to load inline content command ${name} from plugin ${plugin.name}: ${error}`,
                { level: 'error' },
              )
            }
          }
        }
      }
      // 返回 `pluginCommands`，作为插件管理这次计算的结果。
      return pluginCommands
    }),
  )

  // allCommands 命令数据保存`perPluginCommands.flat`，供插件管理后续处理使用。
  const allCommands = perPluginCommands.flat()
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Total plugin commands loaded: ${allCommands.length}`)
  // 返回 `allCommands`，作为插件管理这次计算的结果。
  return allCommands
})

// clearPluginCommandCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPluginCommandCache(): void {
  // 调用 getPluginCommands.cache?.clear?.()，完成这一处局部操作。
  getPluginCommands.cache?.clear?.()
}

/**
 * Loads skills from plugin skills directories
 * Skills are directories containing SKILL.md files
 */
// loadSkillsFromDirectory 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadSkillsFromDirectory(
  skillsPath: string,
  pluginName: string,
  sourceName: string,
  pluginManifest: PluginManifest,
  pluginPath: string,
  loadedPaths: Set<string>,
): Promise<Command[]> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // skills 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const skills: Command[] = []

  // First, check if skillsPath itself contains SKILL.md (direct skill directory)
  // directSkillPath 路径数据格式化`join`，供插件管理后续处理使用。
  const directSkillPath = join(skillsPath, 'SKILL.md')
  // directSkillContent保存`null`，作为后续空值处理的输入。
  let directSkillContent: string | null = null
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // directSkillContent更新为 `await fs.readFile(directSkillPath, {`，确保插件工具后续读取最新状态。
    directSkillContent = await fs.readFile(directSkillPath, {
      encoding: 'utf-8',
    })
  } catch (e: unknown) {
    // 满足 `!isENOENT(e)` 时，插件管理执行该分支。
    if (!isENOENT(e)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to load skill from ${directSkillPath}: ${e}`, {
        level: 'error',
      })
      // 返回 `skills`，作为插件管理这次计算的结果。
      return skills
    }
    // ENOENT: no direct SKILL.md, fall through to scan subdirectories
  }

  // `directSkillContent` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (directSkillContent !== null) {
    // This is a direct skill directory, load the skill from here
    // 满足 `isDuplicatePath(fs, directSkillPath, loadedPaths)` 时，插件管理执行该分支。
    if (isDuplicatePath(fs, directSkillPath, loadedPaths)) {
      // 返回 `skills`，作为插件管理这次计算的结果。
      return skills
    }
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 从 `parseFrontmatter(` 解构 frontmatter、content，减少插件工具 load Plugin Commands对同一对象的重复访问。
      const { frontmatter, content: markdownContent } = parseFrontmatter(
        directSkillContent,
        directSkillPath,
      )

      // skillName保存`basename`，供插件管理后续处理使用。
      const skillName = `${pluginName}:${basename(skillsPath)}`

      // file 文件数据 集中保存插件工具 load Plugin Commands要一起传递的字段。
      const file: PluginMarkdownFile = {
        filePath: directSkillPath,
        baseDir: dirname(directSkillPath),
        frontmatter,
        content: markdownContent,
      }

      // skill构建`createPluginCommand`，供插件管理后续处理使用。
      const skill = createPluginCommand(
        skillName,
        file,
        sourceName,
        pluginManifest,
        pluginPath,
        true, // isSkill
        { isSkillMode: true }, // config
      )

      // 满足 `skill` 时，插件管理执行该分支。
      if (skill) {
        // skills 集合追加新条目，保持收集顺序与输入顺序一致。
        skills.push(skill)
      }
    } catch (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to load skill from ${directSkillPath}: ${error}`,
        {
          level: 'error',
        },
      )
    }
    // 返回 `skills`，作为插件管理这次计算的结果。
    return skills
  }

  // Otherwise, scan for subdirectories containing SKILL.md files
  // entries 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let entries
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合更新为 `await fs.readdir(skillsPath)`，确保插件工具后续读取最新状态。
    entries = await fs.readdir(skillsPath)
  } catch (e: unknown) {
    // 满足 `!isENOENT(e)` 时，插件管理执行该分支。
    if (!isENOENT(e)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to load skills from directory ${skillsPath}: ${e}`,
        { level: 'error' },
      )
    }
    // 返回 `skills`，作为插件管理这次计算的结果。
    return skills
  }

  // 等待 `Promise.all(` 完成，再继续插件工具 load Plugin Commands的异步流程。
  await Promise.all(
    // 调用 entries.map，触发插件管理此处需要的副作用。
    entries.map(async entry => {
      // Accept both directories and symlinks (symlinks may point to skill directories)
      // 只有 `!entry.isDirectory() && !entry.isSymbolicLink()` 满足时，插件管理才执行该分支。
      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        // 插件工具 load Plugin Commands在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // skillDirPath 路径数据格式化`join`，供插件管理后续处理使用。
      const skillDirPath = join(skillsPath, entry.name)
      // skillFilePath 路径数据格式化`join`，供插件管理后续处理使用。
      const skillFilePath = join(skillDirPath, 'SKILL.md')

      // Try to read SKILL.md directly; skip if it doesn't exist
      // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
      let content: string
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容更新为 `await fs.readFile(skillFilePath, { encoding: 'utf-8' })`，确保插件工具后续读取最新状态。
        content = await fs.readFile(skillFilePath, { encoding: 'utf-8' })
      } catch (e: unknown) {
        // 满足 `!isENOENT(e)` 时，插件管理执行该分支。
        if (!isENOENT(e)) {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Failed to load skill from ${skillFilePath}: ${e}`, {
            level: 'error',
          })
        }
        // 插件工具 load Plugin Commands在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 满足 `isDuplicatePath(fs, skillFilePath, loadedPaths)` 时，插件管理执行该分支。
      if (isDuplicatePath(fs, skillFilePath, loadedPaths)) {
        // 插件工具 load Plugin Commands在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 从 `parseFrontmatter(` 解构 frontmatter、content，减少插件工具 load Plugin Commands对同一对象的重复访问。
        const { frontmatter, content: markdownContent } = parseFrontmatter(
          content,
          skillFilePath,
        )

        // skillName保存``${pluginName}:${entry.name}``，作为后续固定文本处理的输入。
        const skillName = `${pluginName}:${entry.name}`

        // file 文件数据 集中保存插件工具 load Plugin Commands要一起传递的字段。
        const file: PluginMarkdownFile = {
          filePath: skillFilePath,
          baseDir: dirname(skillFilePath),
          frontmatter,
          content: markdownContent,
        }

        // skill构建`createPluginCommand`，供插件管理后续处理使用。
        const skill = createPluginCommand(
          skillName,
          file,
          sourceName,
          pluginManifest,
          pluginPath,
          true, // isSkill
          { isSkillMode: true }, // config
        )

        // 满足 `skill` 时，插件管理执行该分支。
        if (skill) {
          // skills 集合追加新条目，保持收集顺序与输入顺序一致。
          skills.push(skill)
        }
      } catch (error) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Failed to load skill from ${skillFilePath}: ${error}`,
          { level: 'error' },
        )
      }
    }),
  )

  // 返回 `skills`，作为插件管理这次计算的结果。
  return skills
}

// getPluginSkills 插件数据保存`memoize`，供插件管理后续处理使用。
export const getPluginSkills = memoize(async (): Promise<Command[]> => {
  // --bare: same gate as getPluginCommands above — honor explicit
  // --plugin-dir, skip marketplace auto-load.
  // isBareMode() && getInlinePlugin... 插件数据为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (isBareMode() && getInlinePlugins().length === 0) {
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }
  // Only load skills from enabled plugins
  // 从 `await loadAllPluginsCacheOnly()` 解构 enabled、errors，减少插件工具 load Plugin Commands对同一对象的重复访问。
  const { enabled, errors } = await loadAllPluginsCacheOnly()

  // 满足 `errors.length > 0` 时，插件管理执行该分支。
  if (errors.length > 0) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      // 这个回调绑定到 `Plugin loading errors: ${errors.map(e => getPluginErrorMessage(e)).join(', ')}`,，负责插件管理在该局部场景下的响应。
      `Plugin loading errors: ${errors.map(e => getPluginErrorMessage(e)).join(', ')}`,
    )
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `getPluginSkills: Processing ${enabled.length} enabled plugins`,
  )

  // Process plugins in parallel; each plugin has its own loadedPaths scope
  // perPluginSkills 插件数据保存`Promise.all`，供插件管理后续处理使用。
  const perPluginSkills = await Promise.all(
    // 调用 enabled.map，触发插件管理此处需要的副作用。
    enabled.map(async (plugin): Promise<Command[]> => {
      // Track loaded file paths to prevent duplicates within this plugin
      // loadedPaths 路径数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
      const loadedPaths = new Set<string>()
      // pluginSkills 插件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const pluginSkills: Command[] = []

      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Checking plugin ${plugin.name}: skillsPath=${plugin.skillsPath ? 'exists' : 'none'}, skillsPaths=${plugin.skillsPaths ? plugin.skillsPaths.length : 0} paths`,
      )
      // Load skills from default skills directory
      // 满足 `plugin.skillsPath` 时，插件管理执行该分支。
      if (plugin.skillsPath) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Attempting to load skills from plugin ${plugin.name} default skillsPath: ${plugin.skillsPath}`,
        )
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // skills 集合读取`loadSkillsFromDirectory`，供插件管理后续处理使用。
          const skills = await loadSkillsFromDirectory(
            plugin.skillsPath,
            plugin.name,
            plugin.source,
            plugin.manifest,
            plugin.path,
            loadedPaths,
          )
          // pluginSkills 插件数据追加新条目，保持收集顺序与输入顺序一致。
          pluginSkills.push(...skills)

          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Loaded ${skills.length} skills from plugin ${plugin.name} default directory`,
          )
        } catch (error) {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Failed to load skills from plugin ${plugin.name} default directory: ${error}`,
            { level: 'error' },
          )
        }
      }

      // Load skills from additional paths specified in manifest
      // 满足 `plugin.skillsPaths` 时，插件管理执行该分支。
      if (plugin.skillsPaths) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Attempting to load skills from plugin ${plugin.name} skillsPaths: ${plugin.skillsPaths.join(', ')}`,
        )
        // Process all skillsPaths in parallel. isDuplicatePath is synchronous
        // (check-and-add), so concurrent access to loadedPaths is safe.
        // pathResults 路径数据保存`Promise.all`，供插件管理后续处理使用。
        const pathResults = await Promise.all(
          // 调用 plugin.skillsPaths.map，触发插件管理此处需要的副作用。
          plugin.skillsPaths.map(async (skillPath): Promise<Command[]> => {
            // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
            try {
              // 记录插件管理运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Loading from skillPath: ${skillPath} for plugin ${plugin.name}`,
              )
              // skills 集合读取`loadSkillsFromDirectory`，供插件管理后续处理使用。
              const skills = await loadSkillsFromDirectory(
                skillPath,
                plugin.name,
                plugin.source,
                plugin.manifest,
                plugin.path,
                loadedPaths,
              )

              // 记录插件管理运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Loaded ${skills.length} skills from plugin ${plugin.name} custom path: ${skillPath}`,
              )
              // 返回 `skills`，作为插件管理这次计算的结果。
              return skills
            } catch (error) {
              // 记录插件管理运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Failed to load skills from plugin ${plugin.name} custom path ${skillPath}: ${error}`,
                { level: 'error' },
              )
              // 返回列表结果，保留插件管理已经排好的条目顺序。
              return []
            }
          }),
        )
        // 按顺序遍历 `pathResults` 中的skills 集合，逐个交给插件管理处理。
        for (const skills of pathResults) {
          // pluginSkills 插件数据追加新条目，保持收集顺序与输入顺序一致。
          pluginSkills.push(...skills)
        }
      }
      // 返回 `pluginSkills`，作为插件管理这次计算的结果。
      return pluginSkills
    }),
  )

  // allSkills 集合保存`perPluginSkills.flat`，供插件管理后续处理使用。
  const allSkills = perPluginSkills.flat()
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Total plugin skills loaded: ${allSkills.length}`)
  // 返回 `allSkills`，作为插件管理这次计算的结果。
  return allSkills
})

// clearPluginSkillsCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPluginSkillsCache(): void {
  // 调用 getPluginSkills.cache?.clear?.()，完成这一处局部操作。
  getPluginSkills.cache?.clear?.()
}
