// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 引入 isAutoMemoryEnabled，将 ../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { isAutoMemoryEnabled } from '../../memdir/paths.js'
// 类型依赖 { AgentColorName } 来自 ../../tools/AgentTool/agentColorManager.js，用于校准插件管理的数据契约。
import type { AgentColorName } from '../../tools/AgentTool/agentColorManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type AgentMemoryScope,
  loadAgentMemoryPrompt,
} from '../../tools/AgentTool/agentMemory.js'
// 类型依赖 { AgentDefinition } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准插件管理的数据契约。
import type { AgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js'
// 接入 FILE_EDIT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_EDIT_TOOL_NAME } from '../../tools/FileEditTool/constants.js'
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from '../../tools/FileReadTool/prompt.js'
// 接入 FILE_WRITE_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_WRITE_TOOL_NAME } from '../../tools/FileWriteTool/prompt.js'
// 引入 getPluginErrorMessage，将 ../../types/plugin.js 中已经封装好的能力接到本文件流程里。
import { getPluginErrorMessage } from '../../types/plugin.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 EFFORT_LEVELS、parseEffortValue，将 ../effort.js 中已经封装好的能力接到本文件流程里。
import { EFFORT_LEVELS, parseEffortValue } from '../effort.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  coerceDescriptionToString,
  parseFrontmatter,
  parsePositiveIntFromFrontmatter,
} from '../frontmatterParser.js'
// 引入 getFsImplementation、isDuplicatePath，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation, isDuplicatePath } from '../fsOperations.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  parseAgentToolsFromFrontmatter,
  parseSlashCommandToolsFromFrontmatter,
} from '../markdownConfigLoader.js'
// 引入 loadAllPluginsCacheOnly，将 ./pluginLoader.js 中已经封装好的能力接到本文件流程里。
import { loadAllPluginsCacheOnly } from './pluginLoader.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  loadPluginOptions,
  substitutePluginVariables,
  substituteUserConfigInContent,
} from './pluginOptionsStorage.js'
// 类型依赖 { PluginManifest } 来自 ./schemas.js，用于校准插件管理的数据契约。
import type { PluginManifest } from './schemas.js'
// 引入 walkPluginMarkdown，将 ./walkPluginMarkdown.js 中已经封装好的能力接到本文件流程里。
import { walkPluginMarkdown } from './walkPluginMarkdown.js'

// VALID_MEMORY_SCOPES 集合 聚合成有序列表，保持后续遍历顺序稳定。
const VALID_MEMORY_SCOPES: AgentMemoryScope[] = ['user', 'project', 'local']

// loadAgentsFromDirectory 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadAgentsFromDirectory(
  agentsPath: string,
  pluginName: string,
  sourceName: string,
  pluginPath: string,
  pluginManifest: PluginManifest,
  loadedPaths: Set<string>,
): Promise<AgentDefinition[]> {
  // agents 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const agents: AgentDefinition[] = []
  // 等待 `walkPluginMarkdown(` 完成，再继续插件工具 load Plugin Agents的异步流程。
  await walkPluginMarkdown(
    agentsPath,
    // 调用 async，触发插件管理此处需要的副作用。
    async (fullPath, namespace) => {
      // agent读取`loadAgentFromFile`，供插件管理后续处理使用。
      const agent = await loadAgentFromFile(
        fullPath,
        pluginName,
        namespace,
        sourceName,
        pluginPath,
        pluginManifest,
        loadedPaths,
      )
      // 满足 `agent) agents.push(agent` 时，插件管理执行该分支。
      if (agent) agents.push(agent)
    },
    { logLabel: 'agents' },
  )
  // 返回 `agents`，作为插件管理这次计算的结果。
  return agents
}

// loadAgentFromFile 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadAgentFromFile(
  filePath: string,
  pluginName: string,
  namespace: string[],
  sourceName: string,
  pluginPath: string,
  pluginManifest: PluginManifest,
  loadedPaths: Set<string>,
): Promise<AgentDefinition | null> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // 满足 `isDuplicatePath(fs, filePath, loadedPaths)` 时，插件管理执行该分支。
  if (isDuplicatePath(fs, filePath, loadedPaths)) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`fs.readFile`，供插件管理后续处理使用。
    const content = await fs.readFile(filePath, { encoding: 'utf-8' })
    // 从 `parseFrontmatter(` 解构 frontmatter、content，减少插件工具 load Plugin Agents对同一对象的重复访问。
    const { frontmatter, content: markdownContent } = parseFrontmatter(
      content,
      filePath,
    )

    // baseAgentName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const baseAgentName =
      (frontmatter.name as string) || basename(filePath).replace(/\.md$/, '')

    // Apply namespace prefixing like we do for commands
    // nameParts 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const nameParts = [pluginName, ...namespace, baseAgentName]
    // agentType格式化`nameParts.join`，供插件管理后续处理使用。
    const agentType = nameParts.join(':')

    // Parse agent metadata from frontmatter
    // whenToUse 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const whenToUse =
      coerceDescriptionToString(frontmatter.description, agentType) ??
      coerceDescriptionToString(frontmatter['when-to-use'], agentType) ??
      `Agent from ${pluginName} plugin`

    // tools 集合解析`parseAgentToolsFromFrontmatter`，供插件管理后续处理使用。
    let tools = parseAgentToolsFromFrontmatter(frontmatter.tools)
    // skills 集合解析`parseSlashCommandToolsFromFrontmatter`，供插件管理后续处理使用。
    const skills = parseSlashCommandToolsFromFrontmatter(frontmatter.skills)
    // color 命名 `frontmatter.color as AgentColorName | undefined`，让后续代码直接表达这个值的用途。
    const color = frontmatter.color as AgentColorName | undefined
    // modelRaw保存`frontmatter.model`，供插件工具 load Plugin Agents后续判断或输出使用。
    const modelRaw = frontmatter.model
    // 模型名称 先占位，稍后的条件分支会根据实际输入补齐它。
    let model: string | undefined
    // 只有 `typeof modelRaw === 'string' && modelRaw.trim().length > 0` 满足时，插件管理才执行该分支。
    if (typeof modelRaw === 'string' && modelRaw.trim().length > 0) {
      // trimmed格式化`modelRaw.trim`，供插件管理后续处理使用。
      const trimmed = modelRaw.trim()
      // 模型名称更新为 `trimmed.toLowerCase() === 'inherit' ? 'inherit' : trimmed`，确保插件工具后续读取最新状态。
      model = trimmed.toLowerCase() === 'inherit' ? 'inherit' : trimmed
    }
    // backgroundRaw保存`frontmatter.background`，供后续判断或组装使用。
    const backgroundRaw = frontmatter.background
    // background 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const background =
      backgroundRaw === 'true' || backgroundRaw === true ? true : undefined
    // Substitute ${CLAUDE_PLUGIN_ROOT} so agents can reference bundled files,
    // and ${user_config.X} (non-sensitive only) so they can embed configured
    // usernames, endpoints, etc. Sensitive refs resolve to a placeholder.
    // 系统提示词保存`substitutePluginVariables`，供插件管理后续处理使用。
    let systemPrompt = substitutePluginVariables(markdownContent.trim(), {
      path: pluginPath,
      source: sourceName,
    })
    // 满足 `pluginManifest.userConfig` 时，插件管理执行该分支。
    if (pluginManifest.userConfig) {
      // 系统提示词更新为 `substituteUserConfigInContent(`，确保插件工具后续读取最新状态。
      systemPrompt = substituteUserConfigInContent(
        systemPrompt,
        loadPluginOptions(sourceName),
        pluginManifest.userConfig,
      )
    }

    // Parse memory scope
    // memoryRaw 命名 `frontmatter.memory as string | undefined`，让后续代码直接表达这个值的用途。
    const memoryRaw = frontmatter.memory as string | undefined
    // memory 先占位，稍后的条件分支会根据实际输入补齐它。
    let memory: AgentMemoryScope | undefined
    // `memoryRaw` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (memoryRaw !== undefined) {
      // 满足 `VALID_MEMORY_SCOPES.includes(memoryRaw as AgentMemoryScope)` 时，插件管理执行该分支。
      if (VALID_MEMORY_SCOPES.includes(memoryRaw as AgentMemoryScope)) {
        // memory更新为 `memoryRaw as AgentMemoryScope`，确保插件工具后续读取最新状态。
        memory = memoryRaw as AgentMemoryScope
      } else {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin agent file ${filePath} has invalid memory value '${memoryRaw}'. Valid options: ${VALID_MEMORY_SCOPES.join(', ')}`,
        )
      }
    }

    // Parse isolation mode
    // isolationRaw保存`frontmatter.isolation as string | undefined`，供后续判断或组装使用。
    const isolationRaw = frontmatter.isolation as string | undefined
    // isolation 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isolation =
      isolationRaw === 'worktree' ? ('worktree' as const) : undefined

    // Parse effort (string level or integer)
    // effortRaw保存`frontmatter.effort`，供插件工具 load Plugin Agents后续判断或输出使用。
    const effortRaw = frontmatter.effort
    // effort 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const effort =
      effortRaw !== undefined ? parseEffortValue(effortRaw) : undefined
    // `effortRaw` 与 `undefined && effort === undefin...` 不一致时刷新派生状态，避免使用过期结果。
    if (effortRaw !== undefined && effort === undefined) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Plugin agent file ${filePath} has invalid effort '${effortRaw}'. Valid options: ${EFFORT_LEVELS.join(', ')} or an integer`,
      )
    }

    // permissionMode, hooks, and mcpServers are intentionally NOT parsed for
    // plugin agents. Plugins are third-party marketplace code; these fields
    // escalate what the agent can do beyond what the user approved at install
    // time. For this level of control, define the agent in .claude/agents/
    // where the user explicitly wrote the frontmatter. (Note: plugins can
    // still ship hooks and MCP servers at the manifest level — that's the
    // install-time trust boundary. Per-agent declarations would let a single
    // agent file buried in agents/ silently add them.) See PR #22558 review.
    // 按顺序遍历 `['permissionMode', 'hooks', 'mcpSe` 中的field，逐个交给插件管理处理。
    for (const field of ['permissionMode', 'hooks', 'mcpServers'] as const) {
      // `frontmatter[field]` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (frontmatter[field] !== undefined) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin agent file ${filePath} sets ${field}, which is ignored for plugin agents. Use .claude/agents/ for this level of control.`,
          { level: 'warn' },
        )
      }
    }

    // Parse maxTurns
    // maxTurnsRaw 命名 `frontmatter.maxTurns`，让后续代码直接表达这个值的用途。
    const maxTurnsRaw = frontmatter.maxTurns
    // maxTurns 集合解析`parsePositiveIntFromFrontmatter`，供插件管理后续处理使用。
    const maxTurns = parsePositiveIntFromFrontmatter(maxTurnsRaw)
    // `maxTurnsRaw` 与 `undefined && maxTurns === undef...` 不一致时刷新派生状态，避免使用过期结果。
    if (maxTurnsRaw !== undefined && maxTurns === undefined) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Plugin agent file ${filePath} has invalid maxTurns '${maxTurnsRaw}'. Must be a positive integer.`,
      )
    }

    // Parse disallowedTools
    // disallowedTools 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const disallowedTools =
      frontmatter.disallowedTools !== undefined
        ? parseAgentToolsFromFrontmatter(frontmatter.disallowedTools)
        : undefined

    // If memory is enabled, inject Write/Edit/Read tools for memory access
    // `isAutoMemoryEnabled() && memory && tools` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (isAutoMemoryEnabled() && memory && tools !== undefined) {
      // toolSet保存`Set`，供插件管理后续处理使用。
      const toolSet = new Set(tools)
      // 调用 for，触发插件管理此处需要的副作用。
      for (const tool of [
        FILE_WRITE_TOOL_NAME,
        FILE_EDIT_TOOL_NAME,
        FILE_READ_TOOL_NAME,
      ]) {
        // 满足 `!toolSet.has(tool)` 时，插件管理执行该分支。
        if (!toolSet.has(tool)) {
          // tools 集合更新为 `[...tools, tool]`，确保插件工具后续读取最新状态。
          tools = [...tools, tool]
        }
      }
    }

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      agentType,
      whenToUse,
      tools,
      ...(disallowedTools !== undefined ? { disallowedTools } : {}),
      ...(skills !== undefined ? { skills } : {}),
      // 这个回调绑定到 getSystemPrompt: () => {，负责插件管理在该局部场景下的响应。
      getSystemPrompt: () => {
        // 只有 `isAutoMemoryEnabled() && memory` 满足时，插件管理才执行该分支。
        if (isAutoMemoryEnabled() && memory) {
          // memoryPrompt读取`loadAgentMemoryPrompt`，供插件管理后续处理使用。
          const memoryPrompt = loadAgentMemoryPrompt(agentType, memory)
          // 返回 `systemPrompt + '\n\n' + memoryPrompt`，作为插件管理这次计算的结果。
          return systemPrompt + '\n\n' + memoryPrompt
        }
        // 返回 `systemPrompt`，作为插件管理这次计算的结果。
        return systemPrompt
      },
      source: 'plugin' as const,
      color,
      model,
      filename: baseAgentName,
      plugin: sourceName,
      ...(background ? { background } : {}),
      ...(memory ? { memory } : {}),
      ...(isolation ? { isolation } : {}),
      ...(effort !== undefined ? { effort } : {}),
      ...(maxTurns !== undefined ? { maxTurns } : {}),
    } as AgentDefinition
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to load agent from ${filePath}: ${error}`, {
      level: 'error',
    })
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

// loadPluginAgents 插件数据保存`memoize`，供插件管理后续处理使用。
export const loadPluginAgents = memoize(
  async (): Promise<AgentDefinition[]> => {
    // Only load agents from enabled plugins
    // 从 `await loadAllPluginsCacheOnly()` 解构 enabled、errors，减少插件工具 load Plugin Agents对同一对象的重复访问。
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
    // perPluginAgents 插件数据保存`Promise.all`，供插件管理后续处理使用。
    const perPluginAgents = await Promise.all(
      // 调用 enabled.map，触发插件管理此处需要的副作用。
      enabled.map(async (plugin): Promise<AgentDefinition[]> => {
        // Track loaded file paths to prevent duplicates within this plugin
        // loadedPaths 路径数据构建`new Set<string>()` 整理出中间结果，供插件工具 load Plugin Agents后续步骤使用。
        const loadedPaths = new Set<string>()
        // pluginAgents 插件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
        const pluginAgents: AgentDefinition[] = []

        // Load agents from default agents directory
        // 满足 `plugin.agentsPath` 时，插件管理执行该分支。
        if (plugin.agentsPath) {
          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // agents 集合读取`loadAgentsFromDirectory`，供插件管理后续处理使用。
            const agents = await loadAgentsFromDirectory(
              plugin.agentsPath,
              plugin.name,
              plugin.source,
              plugin.path,
              plugin.manifest,
              loadedPaths,
            )
            // pluginAgents 插件数据追加新条目，保持收集顺序与输入顺序一致。
            pluginAgents.push(...agents)

            // 满足 `agents.length > 0` 时，插件管理执行该分支。
            if (agents.length > 0) {
              // 记录插件管理运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Loaded ${agents.length} agents from plugin ${plugin.name} default directory`,
              )
            }
          } catch (error) {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Failed to load agents from plugin ${plugin.name} default directory: ${error}`,
              { level: 'error' },
            )
          }
        }

        // Load agents from additional paths specified in manifest
        // 满足 `plugin.agentsPaths` 时，插件管理执行该分支。
        if (plugin.agentsPaths) {
          // Process all agentsPaths in parallel. isDuplicatePath is synchronous
          // (check-and-add), so concurrent access to loadedPaths is safe.
          // pathResults 路径数据保存`Promise.all`，供插件管理后续处理使用。
          const pathResults = await Promise.all(
            plugin.agentsPaths.map(
              // 这个异步回调接收 agentPath，串起插件管理的等待、调用和返回。
              async (agentPath): Promise<AgentDefinition[]> => {
                // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
                try {
                  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
                  const fs = getFsImplementation()
                  // stats 集合保存`fs.stat`，供插件管理后续处理使用。
                  const stats = await fs.stat(agentPath)

                  // 满足 `stats.isDirectory()` 时，插件管理执行该分支。
                  if (stats.isDirectory()) {
                    // Load all .md files from directory
                    // agents 集合读取`loadAgentsFromDirectory`，供插件管理后续处理使用。
                    const agents = await loadAgentsFromDirectory(
                      agentPath,
                      plugin.name,
                      plugin.source,
                      plugin.path,
                      plugin.manifest,
                      loadedPaths,
                    )

                    // 满足 `agents.length > 0` 时，插件管理执行该分支。
                    if (agents.length > 0) {
                      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                      logForDebugging(
                        `Loaded ${agents.length} agents from plugin ${plugin.name} custom path: ${agentPath}`,
                      )
                    }
                    // 返回 `agents`，作为插件管理这次计算的结果。
                    return agents
                  // 插件工具 load Plugin Agents在这里处理 `} else if (stats.isFile() && agentPath.endsWith('.md')) {`，完成这一小步状态转换。
                  } else if (stats.isFile() && agentPath.endsWith('.md')) {
                    // Load single agent file
                    // agent读取`loadAgentFromFile`，供插件管理后续处理使用。
                    const agent = await loadAgentFromFile(
                      agentPath,
                      plugin.name,
                      [],
                      plugin.source,
                      plugin.path,
                      plugin.manifest,
                      loadedPaths,
                    )
                    // 满足 `agent` 时，插件管理执行该分支。
                    if (agent) {
                      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                      logForDebugging(
                        `Loaded agent from plugin ${plugin.name} custom file: ${agentPath}`,
                      )
                      // 返回列表结果，保留插件管理已经排好的条目顺序。
                      return [agent]
                    }
                  }
                  // 返回列表结果，保留插件管理已经排好的条目顺序。
                  return []
                } catch (error) {
                  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `Failed to load agents from plugin ${plugin.name} custom path ${agentPath}: ${error}`,
                    { level: 'error' },
                  )
                  // 返回列表结果，保留插件管理已经排好的条目顺序。
                  return []
                }
              },
            ),
          )
          // 按顺序遍历 `pathResults` 中的agents 集合，逐个交给插件管理处理。
          for (const agents of pathResults) {
            // pluginAgents 插件数据追加新条目，保持收集顺序与输入顺序一致。
            pluginAgents.push(...agents)
          }
        }
        // 返回 `pluginAgents`，作为插件管理这次计算的结果。
        return pluginAgents
      }),
    )

    // allAgents 集合保存`perPluginAgents.flat`，供插件管理后续处理使用。
    const allAgents = perPluginAgents.flat()
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Total plugin agents loaded: ${allAgents.length}`)
    // 返回 `allAgents`，作为插件管理这次计算的结果。
    return allAgents
  },
)

// clearPluginAgentCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearPluginAgentCache(): void {
  // 调用 loadPluginAgents.cache?.clear?.()，完成这一处局部操作。
  loadPluginAgents.cache?.clear?.()
}
