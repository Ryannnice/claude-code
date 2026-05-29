// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, open, unlink } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 类型依赖 { SettingSource } 来自 src/utils/settings/constants.js，用于校准终端渲染的数据契约。
import type { SettingSource } from 'src/utils/settings/constants.js'
// 复用 getManagedFilePath 工具函数，把通用处理留在 src/utils/settings/managedPath.js 中维护。
import { getManagedFilePath } from 'src/utils/settings/managedPath.js'
// 类型依赖 { AgentMemoryScope } 来自 ../../tools/AgentTool/agentMemory.js，用于校准终端渲染的数据契约。
import type { AgentMemoryScope } from '../../tools/AgentTool/agentMemory.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  type AgentDefinition,
  isBuiltInAgent,
  isPluginAgent,
} from '../../tools/AgentTool/loadAgentsDir.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 类型依赖 { EffortValue } 来自 ../../utils/effort.js，用于校准终端渲染的数据契约。
import type { EffortValue } from '../../utils/effort.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
// 复用 getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { getErrnoCode } from '../../utils/errors.js'
// 引入 AGENT_PATHS，将 ./types.js 中已经封装好的能力接到本文件流程里。
import { AGENT_PATHS } from './types.js'

/**
 * Formats agent data as markdown file content
 */
// formatAgentAsMarkdown 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatAgentAsMarkdown(
  agentType: string,
  whenToUse: string,
  tools: string[] | undefined,
  systemPrompt: string,
  color?: string,
  model?: string,
  memory?: AgentMemoryScope,
  effort?: EffortValue,
): string {
  // For YAML double-quoted strings, we need to escape:
  // - Backslashes: \ -> \\
  // - Double quotes: " -> \"
  // - Newlines: \n -> \\n (so yaml reads it as literal backslash-n, not newline)
  // escapedWhenToUse保存`whenToUse`，供终端 UI agent File Utils后续判断或输出使用。
  const escapedWhenToUse = whenToUse
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\\\n') // Escape newlines as \\n so yaml preserves them as \n

  // Omit tools field entirely when tools is undefined or ['*'] (all tools allowed)
  // isAllTools 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isAllTools =
    tools === undefined || (tools.length === 1 && tools[0] === '*')
  // toolsLine格式化`tools.join`，供终端渲染后续处理使用。
  const toolsLine = isAllTools ? '' : `\ntools: ${tools.join(', ')}`
  // modelLine保存`model ? `\nmodel: ${model}` : ''`，供终端 UI agent File Utils后续步骤使用。
  const modelLine = model ? `\nmodel: ${model}` : ''
  // effortLine记录当前扫描状态，终端 UI agent File Utils随后按该状态分支。
  const effortLine = effort !== undefined ? `\neffort: ${effort}` : ''
  // colorLine保存`color ? `\ncolor: ${color}` : ''`，供终端 UI agent File Utils后续步骤使用。
  const colorLine = color ? `\ncolor: ${color}` : ''
  // memoryLine保存`memory ? `\nmemory: ${memory}` : ''`，供终端 UI agent File Utils后续步骤使用。
  const memoryLine = memory ? `\nmemory: ${memory}` : ''

  // 返回 `---，把终端渲染这个分支的结果交还调用方。
  return `---
name: ${agentType}
description: "${escapedWhenToUse}"${toolsLine}${modelLine}${effortLine}${colorLine}${memoryLine}
---

${systemPrompt}
`
}

/**
 * Gets the directory path for an agent location
 */
// getAgentDirectoryPath 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
function getAgentDirectoryPath(location: SettingSource): string {
  // 按照 location 的取值选择终端渲染的具体处理分支。
  switch (location) {
    case 'flagSettings':
      // 抛出 new Error(`Cannot get directory path for ${location} agents`)，阻止终端渲染在无效状态下继续运行。
      throw new Error(`Cannot get directory path for ${location} agents`)
    case 'userSettings':
      // 返回 join(getClaudeConfigHomeDir(), AGENT_PATHS.AGENTS_DIR)，把终端渲染这个分支的结果交还调用方。
      return join(getClaudeConfigHomeDir(), AGENT_PATHS.AGENTS_DIR)
    case 'projectSettings':
      // 返回 join(getCwd(), AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR)，把终端渲染这个分支的结果交还调用方。
      return join(getCwd(), AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR)
    case 'policySettings':
      // 返回 join(，把终端渲染这个分支的结果交还调用方。
      return join(
        getManagedFilePath(),
        AGENT_PATHS.FOLDER_NAME,
        AGENT_PATHS.AGENTS_DIR,
      )
    case 'localSettings':
      // 返回 join(getCwd(), AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR)，把终端渲染这个分支的结果交还调用方。
      return join(getCwd(), AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR)
  }
}

// getRelativeAgentDirectoryPath 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
function getRelativeAgentDirectoryPath(location: SettingSource): string {
  // 按照 location 的取值选择终端渲染的具体处理分支。
  switch (location) {
    case 'projectSettings':
      // 返回 join('.', AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR)，把终端渲染这个分支的结果交还调用方。
      return join('.', AGENT_PATHS.FOLDER_NAME, AGENT_PATHS.AGENTS_DIR)
    default:
      // 返回 getAgentDirectoryPath(location)，把终端渲染这个分支的结果交还调用方。
      return getAgentDirectoryPath(location)
  }
}

/**
 * Gets the file path for a new agent based on its name
 * Used when creating new agent files
 */
// getNewAgentFilePath 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
export function getNewAgentFilePath(agent: {
  source: SettingSource
  agentType: string
}): string {
  // dirPath 文件数据读取`getAgentDirectoryPath`，供终端渲染后续处理使用。
  const dirPath = getAgentDirectoryPath(agent.source)
  // 返回 join(dirPath, `${agent.agentType}.md`)，把终端渲染这个分支的结果交还调用方。
  return join(dirPath, `${agent.agentType}.md`)
}

/**
 * Gets the actual file path for an agent (handles filename vs agentType mismatch)
 * Always use this for existing agents to get their real file location
 */
// getActualAgentFilePath 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
export function getActualAgentFilePath(agent: AgentDefinition): string {
  // `agent.source` 命中特定值 `'built-in'` 时，进入终端渲染对应处理。
  if (agent.source === 'built-in') {
    // 返回 'Built-in'，把终端渲染这个分支的结果交还调用方。
    return 'Built-in'
  }
  // `agent.source` 命中特定值 `'plugin'` 时，进入终端渲染对应处理。
  if (agent.source === 'plugin') {
    // 抛出 new Error('Cannot get file path for plugin agents')，阻止终端渲染在无效状态下继续运行。
    throw new Error('Cannot get file path for plugin agents')
  }

  // dirPath 文件数据读取`getAgentDirectoryPath`，供终端渲染后续处理使用。
  const dirPath = getAgentDirectoryPath(agent.source)
  // 文件名记录当前扫描状态，终端 UI agent File Utils随后按该状态分支。
  const filename = agent.filename || agent.agentType
  // 返回 join(dirPath, `${filename}.md`)，把终端渲染这个分支的结果交还调用方。
  return join(dirPath, `${filename}.md`)
}

/**
 * Gets the relative file path for a new agent based on its name
 * Used for displaying where new agent files will be created
 */
// getNewRelativeAgentFilePath 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
export function getNewRelativeAgentFilePath(agent: {
  source: SettingSource | 'built-in'
  agentType: string
}): string {
  // `agent.source` 命中特定值 `'built-in'` 时，进入终端渲染对应处理。
  if (agent.source === 'built-in') {
    // 返回 'Built-in'，把终端渲染这个分支的结果交还调用方。
    return 'Built-in'
  }
  // dirPath 文件数据读取`getRelativeAgentDirectoryPath`，供终端渲染后续处理使用。
  const dirPath = getRelativeAgentDirectoryPath(agent.source)
  // 返回 join(dirPath, `${agent.agentType}.md`)，把终端渲染这个分支的结果交还调用方。
  return join(dirPath, `${agent.agentType}.md`)
}

/**
 * Gets the actual relative file path for an agent (handles filename vs agentType mismatch)
 */
// getActualRelativeAgentFilePath 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
export function getActualRelativeAgentFilePath(agent: AgentDefinition): string {
  // 判断 isBuiltInAgent(agent)，将终端渲染分流到只适用于该条件的处理路径。
  if (isBuiltInAgent(agent)) {
    // 返回 'Built-in'，把终端渲染这个分支的结果交还调用方。
    return 'Built-in'
  }
  // 判断 isPluginAgent(agent)，将终端渲染分流到只适用于该条件的处理路径。
  if (isPluginAgent(agent)) {
    // 返回 `Plugin: ${agent.plugin || 'Unknown'}`，把终端渲染这个分支的结果交还调用方。
    return `Plugin: ${agent.plugin || 'Unknown'}`
  }
  // `agent.source` 命中特定值 `'flagSettings'` 时，进入终端渲染对应处理。
  if (agent.source === 'flagSettings') {
    // 返回 'CLI argument'，把终端渲染这个分支的结果交还调用方。
    return 'CLI argument'
  }

  // dirPath 文件数据读取`getRelativeAgentDirectoryPath`，供终端渲染后续处理使用。
  const dirPath = getRelativeAgentDirectoryPath(agent.source)
  // 文件名记录当前扫描状态，终端 UI agent File Utils随后按该状态分支。
  const filename = agent.filename || agent.agentType
  // 返回 join(dirPath, `${filename}.md`)，把终端渲染这个分支的结果交还调用方。
  return join(dirPath, `${filename}.md`)
}

/**
 * Ensures the directory for an agent location exists
 */
// ensureAgentDirectoryExists 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
async function ensureAgentDirectoryExists(
  source: SettingSource,
): Promise<string> {
  // dirPath 文件数据读取`getAgentDirectoryPath`，供终端渲染后续处理使用。
  const dirPath = getAgentDirectoryPath(source)
  // 等待 `mkdir(dirPath, { recursive: true })` 完成，再继续终端 UI 组件 agent File Utils的异步流程。
  await mkdir(dirPath, { recursive: true })
  // 返回 dirPath，把终端渲染这个分支的结果交还调用方。
  return dirPath
}

/**
 * Saves an agent to the filesystem
 * @param checkExists - If true, throws error if file already exists
 */
// saveAgentToFile 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
export async function saveAgentToFile(
  source: SettingSource | 'built-in',
  agentType: string,
  whenToUse: string,
  tools: string[] | undefined,
  systemPrompt: string,
  checkExists = true,
  color?: string,
  model?: string,
  memory?: AgentMemoryScope,
  effort?: EffortValue,
): Promise<void> {
  // `source` 命中特定值 `'built-in'` 时，进入终端渲染对应处理。
  if (source === 'built-in') {
    // 抛出 new Error('Cannot save built-in agents')，阻止终端渲染在无效状态下继续运行。
    throw new Error('Cannot save built-in agents')
  }

  // 等待 `ensureAgentDirectoryExists(source)` 完成，再继续终端 UI 组件 agent File Utils的异步流程。
  await ensureAgentDirectoryExists(source)
  // filePath 文件数据读取`getNewAgentFilePath`，供终端渲染后续处理使用。
  const filePath = getNewAgentFilePath({ source, agentType })

  // content格式化`formatAgentAsMarkdown`，供终端渲染后续处理使用。
  const content = formatAgentAsMarkdown(
    agentType,
    whenToUse,
    tools,
    systemPrompt,
    color,
    model,
    memory,
    effort,
  )
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `writeFileAndFlush(filePath, content, checkExists ? 'wx' : 'w')` 完成，再继续终端 UI 组件 agent File Utils的异步流程。
    await writeFileAndFlush(filePath, content, checkExists ? 'wx' : 'w')
  } catch (e: unknown) {
    // 判断 getErrnoCode(e) === 'EEXIST'，将终端渲染分流到只适用于该条件的处理路径。
    if (getErrnoCode(e) === 'EEXIST') {
      // 抛出 new Error(`Agent file already exists: ${filePath}`)，阻止终端渲染在无效状态下继续运行。
      throw new Error(`Agent file already exists: ${filePath}`)
    }
    // 抛出 e，阻止终端渲染在无效状态下继续运行。
    throw e
  }
}

/**
 * Updates an existing agent file
 */
// updateAgentFile 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
export async function updateAgentFile(
  agent: AgentDefinition,
  newWhenToUse: string,
  newTools: string[] | undefined,
  newSystemPrompt: string,
  newColor?: string,
  newModel?: string,
  newMemory?: AgentMemoryScope,
  newEffort?: EffortValue,
): Promise<void> {
  // `agent.source` 命中特定值 `'built-in'` 时，进入终端渲染对应处理。
  if (agent.source === 'built-in') {
    // 抛出 new Error('Cannot update built-in agents')，阻止终端渲染在无效状态下继续运行。
    throw new Error('Cannot update built-in agents')
  }

  // filePath 文件数据读取`getActualAgentFilePath`，供终端渲染后续处理使用。
  const filePath = getActualAgentFilePath(agent)

  // content格式化`formatAgentAsMarkdown`，供终端渲染后续处理使用。
  const content = formatAgentAsMarkdown(
    agent.agentType,
    newWhenToUse,
    newTools,
    newSystemPrompt,
    newColor,
    newModel,
    newMemory,
    newEffort,
  )

  // 等待 `writeFileAndFlush(filePath, content)` 完成，再继续终端 UI 组件 agent File Utils的异步流程。
  await writeFileAndFlush(filePath, content)
}

/**
 * Deletes an agent file
 */
// deleteAgentFromFile 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
export async function deleteAgentFromFile(
  agent: AgentDefinition,
): Promise<void> {
  // `agent.source` 命中特定值 `'built-in'` 时，进入终端渲染对应处理。
  if (agent.source === 'built-in') {
    // 抛出 new Error('Cannot delete built-in agents')，阻止终端渲染在无效状态下继续运行。
    throw new Error('Cannot delete built-in agents')
  }

  // filePath 文件数据读取`getActualAgentFilePath`，供终端渲染后续处理使用。
  const filePath = getActualAgentFilePath(agent)

  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(filePath)` 完成，再继续终端 UI 组件 agent File Utils的异步流程。
    await unlink(filePath)
  } catch (e: unknown) {
    // code读取`getErrnoCode`，供终端渲染后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT'` 不一致时刷新派生状态。
    if (code !== 'ENOENT') {
      // 抛出 e，阻止终端渲染在无效状态下继续运行。
      throw e
    }
  }
}

// writeFileAndFlush 承担终端渲染中的独立步骤，串起终端 UI 组件 agent File Utils需要的输入整理、状态更新和结果输出。
async function writeFileAndFlush(
  filePath: string,
  content: string,
  flag: 'w' | 'wx' = 'w',
): Promise<void> {
  // handle保存`open`，供终端渲染后续处理使用。
  const handle = await open(filePath, flag)
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `handle.writeFile(content, { encoding: 'utf-8' })` 完成，再继续终端 UI 组件 agent File Utils的异步流程。
    await handle.writeFile(content, { encoding: 'utf-8' })
    // 等待 `handle.datasync()` 完成，再继续终端 UI 组件 agent File Utils的异步流程。
    await handle.datasync()
  } finally {
    // 等待 `handle.close()` 完成，再继续终端 UI 组件 agent File Utils的异步流程。
    await handle.close()
  }
}
