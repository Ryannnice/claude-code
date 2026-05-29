// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { execFileSync } from 'child_process'
// 引入 diffLines，将 diff 中已经封装好的能力接到本文件流程里。
import { diffLines } from 'diff'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { constants as fsConstants } from 'fs'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from 'fs/promises'
// 引入 tmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { tmpdir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { extname, join } from 'path'
// 类型依赖 { Command } 来自 ../commands.js，用于校准命令处理的数据契约。
import type { Command } from '../commands.js'
// 接入 queryWithModel 服务层能力，把外部通信或共享状态交给 ../services/api/claude.js 处理。
import { queryWithModel } from '../services/api/claude.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  AGENT_TOOL_NAME,
  LEGACY_AGENT_TOOL_NAME,
} from '../tools/AgentTool/constants.js'
// 类型依赖 { LogOption } 来自 ../types/logs.js，用于校准命令处理的数据契约。
import type { LogOption } from '../types/logs.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
// 复用 toError 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { toError } from '../utils/errors.js'
// 复用 execFileNoThrow 工具函数，把通用处理留在 ../utils/execFileNoThrow.js 中维护。
import { execFileNoThrow } from '../utils/execFileNoThrow.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 extractTextContent 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { extractTextContent } from '../utils/messages.js'
// 复用 getDefaultOpusModel 工具函数，把通用处理留在 ../utils/model/model.js 中维护。
import { getDefaultOpusModel } from '../utils/model/model.js'
// 整理这一组导入，让命令处理后续逻辑可以直接复用这些外部能力。
import {
  getProjectsDir,
  getSessionFilesWithMtime,
  getSessionIdFromLog,
  loadAllLogsFromSessionFile,
} from '../utils/sessionStorage.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../utils/slowOperations.js'
// 复用 countCharInString 工具函数，把通用处理留在 ../utils/stringUtils.js 中维护。
import { countCharInString } from '../utils/stringUtils.js'
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../utils/systemPromptType.js'
// 复用 escapeXmlAttr as escapeHtml 工具函数，把通用处理留在 ../utils/xml.js 中维护。
import { escapeXmlAttr as escapeHtml } from '../utils/xml.js'

// Model for facet extraction and summarization (Opus - best quality)
// getAnalysisModel 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAnalysisModel(): string {
  // 返回 `getDefaultOpusModel()`，作为命令处理这次计算的结果。
  return getDefaultOpusModel()
}

// Model for narrative insights (Opus - best quality)
// getInsightsModel 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getInsightsModel(): string {
  // 返回 `getDefaultOpusModel()`，作为命令处理这次计算的结果。
  return getDefaultOpusModel()
}

// ============================================================================
// Homespace Data Collection
// ============================================================================

// RemoteHostInfo 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type RemoteHostInfo = {
  name: string
  sessionCount: number
}

/* eslint-disable custom-rules/no-process-env-top-level */
// 这个回调绑定到 const getRunningRemoteHosts: () => Promise<string[]> =，负责命令处理在该局部场景下的响应。
const getRunningRemoteHosts: () => Promise<string[]> =
  process.env.USER_TYPE === 'ant'
    // 这个回调绑定到 ? async () => {，负责命令处理在该局部场景下的响应。
    ? async () => {
        // 从 `await execFileNoThrow(` 解构 stdout、code，减少斜杠命令 insights对同一对象的重复访问。
        const { stdout, code } = await execFileNoThrow(
          'coder',
          ['list', '-o', 'json'],
          { timeout: 30000 },
        )
        // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
        if (code !== 0) return []
        // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
        try {
          // workspaces 集合解析`jsonParse`，供命令处理后续处理使用。
          const workspaces = jsonParse(stdout) as Array<{
            name: string
            latest_build?: { status?: string }
          }>
          // 返回 `workspaces`，作为命令处理这次计算的结果。
          return workspaces
            // 链式调用 filter，继续加工上一行在命令处理中产生的数据。
            .filter(w => w.latest_build?.status === 'running')
            // 链式调用 map，继续加工上一行在命令处理中产生的数据。
            .map(w => w.name)
        } catch {
          // 返回列表结果，保留命令处理已经排好的条目顺序。
          return []
        }
      }
    // 这个回调绑定到 : async () => []，负责命令处理在该局部场景下的响应。
    : async () => []

// 这个回调绑定到 const getRemoteHostSessionCount: (hs: string) => Promise<number> =，负责命令处理在该局部场景下的响应。
const getRemoteHostSessionCount: (hs: string) => Promise<number> =
  process.env.USER_TYPE === 'ant'
    // 这个回调绑定到 ? async (homespace: string) => {，负责命令处理在该局部场景下的响应。
    ? async (homespace: string) => {
        // 从 `await execFileNoThrow(` 解构 stdout、code，减少斜杠命令 insights对同一对象的重复访问。
        const { stdout, code } = await execFileNoThrow(
          'ssh',
          [
            `${homespace}.coder`,
            'find /root/.claude/projects -name "*.jsonl" 2>/dev/null | wc -l',
          ],
          { timeout: 30000 },
        )
        // `code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
        if (code !== 0) return 0
        // 返回 `parseInt(stdout.trim(), 10) || 0`，作为命令处理这次计算的结果。
        return parseInt(stdout.trim(), 10) || 0
      }
    // 这个回调绑定到 : async () => 0，负责命令处理在该局部场景下的响应。
    : async () => 0

// collectFromRemoteHost 先占位，稍后的条件分支会根据实际输入补齐它。
const collectFromRemoteHost: (
  hs: string,
  destDir: string,
) => Promise<{ copied: number; skipped: number }> =
  process.env.USER_TYPE === 'ant'
    // 这个回调绑定到 ? async (homespace: string, destDir: string) => {，负责命令处理在该局部场景下的响应。
    ? async (homespace: string, destDir: string) => {
        // 结果 集中保存命令处理斜杠命令 insights要一起传递的字段。
        const result = { copied: 0, skipped: 0 }

        // Create temp directory
        // tempDir保存`mkdtemp`，供命令处理后续处理使用。
        const tempDir = await mkdtemp(join(tmpdir(), 'claude-hs-'))

        // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
        try {
          // SCP the projects folder
          // scpResult保存`execFileNoThrow`，供命令处理后续处理使用。
          const scpResult = await execFileNoThrow(
            'scp',
            ['-rq', `${homespace}.coder:/root/.claude/projects/`, tempDir],
            { timeout: 300000 },
          )
          // `scpResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
          if (scpResult.code !== 0) {
            // SCP failed
            // 返回 `result`，作为命令处理这次计算的结果。
            return result
          }

          // projectsDir格式化`join`，供命令处理后续处理使用。
          const projectsDir = join(tempDir, 'projects')
          // projectDirents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
          let projectDirents: Awaited<ReturnType<typeof readdir>>
          // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
          try {
            // projectDirents 集合更新为 `await readdir(projectsDir, { withFileTypes: true })`，确保斜杠命令后续读取最新状态。
            projectDirents = await readdir(projectsDir, { withFileTypes: true })
          } catch {
            // 返回 `result`，作为命令处理这次计算的结果。
            return result
          }

          // Merge into destination (parallel per project directory)
          // 等待 `Promise.all(` 完成，再继续斜杠命令 insights的异步流程。
          await Promise.all(
            // 调用 projectDirents.map，触发命令处理此处需要的副作用。
            projectDirents.map(async dirent => {
              // projectName保存`dirent.name`，供后续判断或组装使用。
              const projectName = dirent.name
              // projectPath 路径数据格式化`join`，供命令处理后续处理使用。
              const projectPath = join(projectsDir, projectName)

              // Skip if not a directory
              // 满足 `!dirent.isDirectory()` 时，命令处理执行该分支。
              if (!dirent.isDirectory()) return

              // destProjectName 命名 ``${projectName}__${homespace}``，让后续代码直接表达这个值的用途。
              const destProjectName = `${projectName}__${homespace}`
              // destProjectPath 路径数据格式化`join`，供命令处理后续处理使用。
              const destProjectPath = join(destDir, destProjectName)

              // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
              try {
                // 等待 `mkdir(destProjectPath, { recursive: true })` 完成，再继续斜杠命令 insights的异步流程。
                await mkdir(destProjectPath, { recursive: true })
              } catch {
                // Directory may already exist
              }

              // Copy session files (skip existing)
              // files 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
              let files: Awaited<ReturnType<typeof readdir>>
              // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
              try {
                // files 文件数据更新为 `await readdir(projectPath, { withFileTypes: true })`，确保斜杠命令后续读取最新状态。
                files = await readdir(projectPath, { withFileTypes: true })
              } catch {
                // 斜杠命令 insights在这里结束当前路径，避免继续执行不适用的后续分支。
                return
              }
              // 等待 `Promise.all(` 完成，再继续斜杠命令 insights的异步流程。
              await Promise.all(
                // 调用 files.map，触发命令处理此处需要的副作用。
                files.map(async fileDirent => {
                  // fileName 文件数据保存`fileDirent.name`，供命令处理斜杠命令 insights后续判断或输出使用。
                  const fileName = fileDirent.name
                  // 满足 `!fileName.endsWith('.jsonl')` 时，命令处理执行该分支。
                  if (!fileName.endsWith('.jsonl')) return

                  // srcFile 文件数据格式化`join`，供命令处理后续处理使用。
                  const srcFile = join(projectPath, fileName)
                  // destFile 文件数据格式化`join`，供命令处理后续处理使用。
                  const destFile = join(destProjectPath, fileName)

                  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
                  try {
                    // 等待 `copyFile(srcFile, destFile, fsConstants.COPYFILE_EXCL)` 完成，再继续斜杠命令 insights的异步流程。
                    await copyFile(srcFile, destFile, fsConstants.COPYFILE_EXCL)
                    // 斜杠命令 insights在这里处理 `result.copied++`，完成这一小步状态转换。
                    result.copied++
                  } catch {
                    // EEXIST from COPYFILE_EXCL means dest already exists
                    // 斜杠命令 insights在这里处理 `result.skipped++`，完成这一小步状态转换。
                    result.skipped++
                  }
                }),
              )
            }),
          )
        } finally {
          // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `rm(tempDir, { recursive: true, force: true })` 完成，再继续斜杠命令 insights的异步流程。
            await rm(tempDir, { recursive: true, force: true })
          } catch {
            // Ignore cleanup errors
          }
        }

        // 返回 `result`，作为命令处理这次计算的结果。
        return result
      }
    // 这个回调绑定到 : async () => ({ copied: 0, skipped: 0 })，负责命令处理在该局部场景下的响应。
    : async () => ({ copied: 0, skipped: 0 })

// 这个回调绑定到 const collectAllRemoteHostData: (destDir: string) => Promise<{，负责命令处理在该局部场景下的响应。
const collectAllRemoteHostData: (destDir: string) => Promise<{
  hosts: RemoteHostInfo[]
  totalCopied: number
  totalSkipped: number
}> =
  process.env.USER_TYPE === 'ant'
    // 这个回调绑定到 ? async (destDir: string) => {，负责命令处理在该局部场景下的响应。
    ? async (destDir: string) => {
        // rHosts 集合读取`getRunningRemoteHosts`，供命令处理后续处理使用。
        const rHosts = await getRunningRemoteHosts()
        // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
        const result: RemoteHostInfo[] = []
        // totalCopied保存`0`，供后续判断或组装使用。
        let totalCopied = 0
        // totalSkipped保存`0`，供后续判断或组装使用。
        let totalSkipped = 0

        // Collect from all hosts in parallel (SCP per host can take seconds)
        // hostResults 集合保存`Promise.all`，供命令处理后续处理使用。
        const hostResults = await Promise.all(
          // 调用 rHosts.map，触发命令处理此处需要的副作用。
          rHosts.map(async hs => {
            // sessionCount 会话数据读取`getRemoteHostSessionCount`，供命令处理后续处理使用。
            const sessionCount = await getRemoteHostSessionCount(hs)
            // 满足 `sessionCount > 0` 时，命令处理执行该分支。
            if (sessionCount > 0) {
              // 从 `await collectFromRemoteHost(` 解构 copied、skipped，减少斜杠命令 insights对同一对象的重复访问。
              const { copied, skipped } = await collectFromRemoteHost(
                hs,
                destDir,
              )
              // 返回结构化结果，集中表达命令处理已经整理出的状态。
              return { name: hs, sessionCount, copied, skipped }
            }
            // 返回结构化结果，集中表达命令处理已经整理出的状态。
            return { name: hs, sessionCount, copied: 0, skipped: 0 }
          }),
        )

        // 按顺序遍历 `hostResults` 中的hr，逐个交给命令处理处理。
        for (const hr of hostResults) {
          // 结果追加新条目，保持收集顺序与输入顺序一致。
          result.push({ name: hr.name, sessionCount: hr.sessionCount })
          // 斜杠命令 insights在这里处理 `totalCopied += hr.copied`，完成这一小步状态转换。
          totalCopied += hr.copied
          // 斜杠命令 insights在这里处理 `totalSkipped += hr.skipped`，完成这一小步状态转换。
          totalSkipped += hr.skipped
        }

        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return { hosts: result, totalCopied, totalSkipped }
      }
    // 这个回调绑定到 : async () => ({ hosts: [], totalCopied: 0, totalSkipped: 0 })，负责命令处理在该局部场景下的响应。
    : async () => ({ hosts: [], totalCopied: 0, totalSkipped: 0 })
/* eslint-enable custom-rules/no-process-env-top-level */

// ============================================================================
// Types
// ============================================================================

// SessionMeta 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionMeta = {
  session_id: string
  project_path: string
  start_time: string
  duration_minutes: number
  user_message_count: number
  assistant_message_count: number
  tool_counts: Record<string, number>
  languages: Record<string, number>
  git_commits: number
  git_pushes: number
  input_tokens: number
  output_tokens: number
  first_prompt: string
  summary?: string
  // New stats
  user_interruptions: number
  user_response_times: number[]
  tool_errors: number
  tool_error_categories: Record<string, number>
  uses_task_agent: boolean
  uses_mcp: boolean
  uses_web_search: boolean
  uses_web_fetch: boolean
  // Additional stats
  lines_added: number
  lines_removed: number
  files_modified: number
  message_hours: number[]
  user_message_timestamps: string[] // ISO timestamps for multi-clauding detection
}

// SessionFacets 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionFacets = {
  session_id: string
  underlying_goal: string
  goal_categories: Record<string, number>
  outcome: string
  user_satisfaction_counts: Record<string, number>
  claude_helpfulness: string
  session_type: string
  friction_counts: Record<string, number>
  friction_detail: string
  primary_success: string
  brief_summary: string
  user_instructions_to_claude?: string[]
}

// AggregatedData 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type AggregatedData = {
  total_sessions: number
  total_sessions_scanned?: number
  sessions_with_facets: number
  date_range: { start: string; end: string }
  total_messages: number
  total_duration_hours: number
  total_input_tokens: number
  total_output_tokens: number
  tool_counts: Record<string, number>
  languages: Record<string, number>
  git_commits: number
  git_pushes: number
  projects: Record<string, number>
  goal_categories: Record<string, number>
  outcomes: Record<string, number>
  satisfaction: Record<string, number>
  helpfulness: Record<string, number>
  session_types: Record<string, number>
  friction: Record<string, number>
  success: Record<string, number>
  session_summaries: Array<{
    id: string
    date: string
    summary: string
    goal?: string
  }>
  // New aggregated stats
  total_interruptions: number
  total_tool_errors: number
  tool_error_categories: Record<string, number>
  user_response_times: number[]
  median_response_time: number
  avg_response_time: number
  sessions_using_task_agent: number
  sessions_using_mcp: number
  sessions_using_web_search: number
  sessions_using_web_fetch: number
  // Additional stats from Python reference
  total_lines_added: number
  total_lines_removed: number
  total_files_modified: number
  days_active: number
  messages_per_day: number
  message_hours: number[] // Hour of day for each user message (for time of day chart)
  // Multi-clauding stats (matching Python reference)
  multi_clauding: {
    overlap_events: number
    sessions_involved: number
    user_messages_during: number
  }
}

// ============================================================================
// Constants
// ============================================================================

// EXTENSION_TO_LANGUAGE 集中保存斜杠命令 insights要一起传递的字段。
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.rb': 'Ruby',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.md': 'Markdown',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.sh': 'Shell',
  '.css': 'CSS',
  '.html': 'HTML',
}

// Label map for cleaning up category names (matching Python reference)
// LABEL_MAP 集中保存斜杠命令 insights要一起传递的字段。
const LABEL_MAP: Record<string, string> = {
  // Goal categories
  debug_investigate: 'Debug/Investigate',
  implement_feature: 'Implement Feature',
  fix_bug: 'Fix Bug',
  write_script_tool: 'Write Script/Tool',
  refactor_code: 'Refactor Code',
  configure_system: 'Configure System',
  create_pr_commit: 'Create PR/Commit',
  analyze_data: 'Analyze Data',
  understand_codebase: 'Understand Codebase',
  write_tests: 'Write Tests',
  write_docs: 'Write Docs',
  deploy_infra: 'Deploy/Infra',
  warmup_minimal: 'Cache Warmup',
  // Success factors
  fast_accurate_search: 'Fast/Accurate Search',
  correct_code_edits: 'Correct Code Edits',
  good_explanations: 'Good Explanations',
  proactive_help: 'Proactive Help',
  multi_file_changes: 'Multi-file Changes',
  handled_complexity: 'Multi-file Changes',
  good_debugging: 'Good Debugging',
  // Friction types
  misunderstood_request: 'Misunderstood Request',
  wrong_approach: 'Wrong Approach',
  buggy_code: 'Buggy Code',
  user_rejected_action: 'User Rejected Action',
  claude_got_blocked: 'Claude Got Blocked',
  user_stopped_early: 'User Stopped Early',
  wrong_file_or_location: 'Wrong File/Location',
  excessive_changes: 'Excessive Changes',
  slow_or_verbose: 'Slow/Verbose',
  tool_failed: 'Tool Failed',
  user_unclear: 'User Unclear',
  external_issue: 'External Issue',
  // Satisfaction labels
  frustrated: 'Frustrated',
  dissatisfied: 'Dissatisfied',
  likely_satisfied: 'Likely Satisfied',
  satisfied: 'Satisfied',
  happy: 'Happy',
  unsure: 'Unsure',
  neutral: 'Neutral',
  delighted: 'Delighted',
  // Session types
  single_task: 'Single Task',
  multi_task: 'Multi Task',
  iterative_refinement: 'Iterative Refinement',
  exploration: 'Exploration',
  quick_question: 'Quick Question',
  // Outcomes
  fully_achieved: 'Fully Achieved',
  mostly_achieved: 'Mostly Achieved',
  partially_achieved: 'Partially Achieved',
  not_achieved: 'Not Achieved',
  unclear_from_transcript: 'Unclear',
  // Helpfulness
  unhelpful: 'Unhelpful',
  slightly_helpful: 'Slightly Helpful',
  moderately_helpful: 'Moderately Helpful',
  very_helpful: 'Very Helpful',
  essential: 'Essential',
}

// Lazy getters: getClaudeConfigHomeDir() is memoized and reads process.env.
// Calling it at module scope would populate the memoize cache before
// entrypoints can set CLAUDE_CONFIG_DIR, breaking all 150+ other callers.
// getDataDir 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDataDir(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'usage-data')`，作为命令处理这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'usage-data')
}
// getFacetsDir 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFacetsDir(): string {
  // 返回 `join(getDataDir(), 'facets')`，作为命令处理这次计算的结果。
  return join(getDataDir(), 'facets')
}
// getSessionMetaDir 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSessionMetaDir(): string {
  // 返回 `join(getDataDir(), 'session-meta')`，作为命令处理这次计算的结果。
  return join(getDataDir(), 'session-meta')
}

// FACET_EXTRACTION_PROMPT 命名 ``Analyze this Claude Code session and extract structured ...`，让后续代码直接表达这个值的用途。
const FACET_EXTRACTION_PROMPT = `Analyze this Claude Code session and extract structured facets.

CRITICAL GUIDELINES:

1. **goal_categories**: Count ONLY what the USER explicitly asked for.
   - DO NOT count Claude's autonomous codebase exploration
   - DO NOT count work Claude decided to do on its own
   - ONLY count when user says "can you...", "please...", "I need...", "let's..."

2. **user_satisfaction_counts**: Base ONLY on explicit user signals.
   - "Yay!", "great!", "perfect!" → happy
   - "thanks", "looks good", "that works" → satisfied
   - "ok, now let's..." (continuing without complaint) → likely_satisfied
   - "that's not right", "try again" → dissatisfied
   - "this is broken", "I give up" → frustrated

3. **friction_counts**: Be specific about what went wrong.
   - misunderstood_request: Claude interpreted incorrectly
   - wrong_approach: Right goal, wrong solution method
   - buggy_code: Code didn't work correctly
   - user_rejected_action: User said no/stop to a tool call
   - excessive_changes: Over-engineered or changed too much

4. If very short or just warmup, use warmup_minimal for goal_category

SESSION:
`

// ============================================================================
// Helper Functions
// ============================================================================

// getLanguageFromPath 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLanguageFromPath(filePath: string): string | null {
  // ext保存`extname`，供命令处理后续处理使用。
  const ext = extname(filePath).toLowerCase()
  // 返回 `EXTENSION_TO_LANGUAGE[ext] || null`，作为命令处理这次计算的结果。
  return EXTENSION_TO_LANGUAGE[ext] || null
}

// extractToolStats 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractToolStats(log: LogOption): {
  toolCounts: Record<string, number>
  languages: Record<string, number>
  gitCommits: number
  gitPushes: number
  inputTokens: number
  outputTokens: number
  // New stats
  userInterruptions: number
  userResponseTimes: number[]
  toolErrors: number
  toolErrorCategories: Record<string, number>
  usesTaskAgent: boolean
  usesMcp: boolean
  usesWebSearch: boolean
  usesWebFetch: boolean
  // Additional stats
  linesAdded: number
  linesRemoved: number
  filesModified: Set<string>
  messageHours: number[]
  userMessageTimestamps: string[] // ISO timestamps for multi-clauding detection
} {
  // toolCounts 数量 从空对象开始收集键值，后续按名称补齐内容。
  const toolCounts: Record<string, number> = {}
  // languages 集合 从空对象开始收集键值，后续按名称补齐内容。
  const languages: Record<string, number> = {}
  // gitCommits 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let gitCommits = 0
  // gitPushes 集合保存`0`，供后续判断或组装使用。
  let gitPushes = 0
  // inputTokens 集合保存`0`，供后续判断或组装使用。
  let inputTokens = 0
  // outputTokens 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let outputTokens = 0

  // New stats
  // userInterruptions 集合保存`0`，供后续判断或组装使用。
  let userInterruptions = 0
  // userResponseTimes 响应数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const userResponseTimes: number[] = []
  // toolErrors 错误信息保存`0`，供后续判断或组装使用。
  let toolErrors = 0
  // toolErrorCategories 错误信息 从空对象开始收集键值，后续按名称补齐内容。
  const toolErrorCategories: Record<string, number> = {}
  // usesTaskAgent标记命令处理斜杠命令 insights是否启用对应路径。
  let usesTaskAgent = false

  // Additional stats
  // linesAdded 命名 `0`，让后续代码直接表达这个值的用途。
  let linesAdded = 0
  // linesRemoved 命名 `0`，让后续代码直接表达这个值的用途。
  let linesRemoved = 0
  // filesModified 文件数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const filesModified = new Set<string>()
  // messageHours 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const messageHours: number[] = []
  // userMessageTimestamps 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
  const userMessageTimestamps: string[] = [] // For multi-clauding detection
  // usesMcp标记命令处理斜杠命令 insights是否启用对应路径。
  let usesMcp = false
  // usesWebSearch标记命令处理斜杠命令 insights是否启用对应路径。
  let usesWebSearch = false
  // usesWebFetch标记命令处理斜杠命令 insights是否启用对应路径。
  let usesWebFetch = false
  // lastAssistantTimestamp初始化为空值，后续分支会在有数据时补齐。
  let lastAssistantTimestamp: string | null = null

  // 按顺序遍历 `log.messages` 中的消息，逐个交给命令处理处理。
  for (const msg of log.messages) {
    // Get message timestamp for response time calculation
    // msgTimestamp 命名 `(msg as { timestamp?: string }).timestamp`，让后续代码直接表达这个值的用途。
    const msgTimestamp = (msg as { timestamp?: string }).timestamp

    // 只有 `msg.type === 'assistant' && msg.message` 满足时，命令处理才执行该分支。
    if (msg.type === 'assistant' && msg.message) {
      // Track timestamp for response time calculation
      // 满足 `msgTimestamp` 时，命令处理执行该分支。
      if (msgTimestamp) {
        // lastAssistantTimestamp更新为 `msgTimestamp`，确保斜杠命令后续读取最新状态。
        lastAssistantTimestamp = msgTimestamp
      }

      // usage 命名 `(`，让后续代码直接表达这个值的用途。
      const usage = (
        msg.message as {
          usage?: { input_tokens?: number; output_tokens?: number }
        }
      ).usage
      // 满足 `usage` 时，命令处理执行该分支。
      if (usage) {
        // 斜杠命令 insights在这里处理 `inputTokens += usage.input_tokens || 0`，完成这一小步状态转换。
        inputTokens += usage.input_tokens || 0
        // 斜杠命令 insights在这里处理 `outputTokens += usage.output_tokens || 0`，完成这一小步状态转换。
        outputTokens += usage.output_tokens || 0
      }

      // 文本内容保存`msg.message.content`，供命令处理斜杠命令 insights后续判断或输出使用。
      const content = msg.message.content
      // 满足 `Array.isArray(content)` 时，命令处理执行该分支。
      if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给命令处理处理。
        for (const block of content) {
          // 只有 `block.type === 'tool_use' && 'name' in block` 满足时，命令处理才执行该分支。
          if (block.type === 'tool_use' && 'name' in block) {
            // toolName保存`block.name as string`，供命令处理斜杠命令 insights后续判断或输出使用。
            const toolName = block.name as string
            // toolCounts[toolName 数量更新为 `(toolCounts[toolName] || 0) + 1`，确保斜杠命令 insights后续读取最新状态。
            toolCounts[toolName] = (toolCounts[toolName] || 0) + 1

            // Check for special tool usage
            // 命令处理在这里按实际状态进入对应分支。
            if (
              toolName === AGENT_TOOL_NAME ||
              toolName === LEGACY_AGENT_TOOL_NAME
            )
              // usesTaskAgent更新为 `true`，确保斜杠命令后续读取最新状态。
              usesTaskAgent = true
            // 满足 `toolName.startsWith('mcp__')` 时，命令处理执行该分支。
            if (toolName.startsWith('mcp__')) usesMcp = true
            // 当 `toolName` 匹配 `'WebSearch'` 时，命令处理执行对应分支。
            if (toolName === 'WebSearch') usesWebSearch = true
            // 当 `toolName` 匹配 `'WebFetch'` 时，命令处理执行对应分支。
            if (toolName === 'WebFetch') usesWebFetch = true

            // 用户输入保存`(block as { input?: Record<string, unknown> }).input`，供命令处理斜杠命令 insights后续判断或输出使用。
            const input = (block as { input?: Record<string, unknown> }).input

            // 满足 `input` 时，命令处理执行该分支。
            if (input) {
              // 文件路径标记命令处理斜杠命令 insights是否启用对应路径。
              const filePath = (input.file_path as string) || ''
              // 满足 `filePath` 时，命令处理执行该分支。
              if (filePath) {
                // lang读取`getLanguageFromPath`，供命令处理后续处理使用。
                const lang = getLanguageFromPath(filePath)
                // 满足 `lang` 时，命令处理执行该分支。
                if (lang) {
                  // languages[lang更新为 `(languages[lang] || 0) + 1`，确保斜杠命令 insights后续读取最新状态。
                  languages[lang] = (languages[lang] || 0) + 1
                }
                // Track files modified by Edit/Write tools
                // 当 `toolName` 匹配 `'Edit' || toolName === 'Wri...` 时，命令处理执行对应分支。
                if (toolName === 'Edit' || toolName === 'Write') {
                  // 调用 filesModified.add，触发命令处理此处需要的副作用。
                  filesModified.add(filePath)
                }
              }

              // 当 `toolName` 匹配 `'Edit'` 时，命令处理执行对应分支。
              if (toolName === 'Edit') {
                // oldString标记命令处理斜杠命令 insights是否启用对应路径。
                const oldString = (input.old_string as string) || ''
                // newString标记命令处理斜杠命令 insights是否启用对应路径。
                const newString = (input.new_string as string) || ''
                // 逐项读取 `diffLines(oldString, newString)` 中的change，按输入顺序推进命令处理。
                for (const change of diffLines(oldString, newString)) {
                  // 满足 `change.added` 时，命令处理执行该分支。
                  if (change.added) linesAdded += change.count || 0
                  // 满足 `change.removed` 时，命令处理执行该分支。
                  if (change.removed) linesRemoved += change.count || 0
                }
              }

              // Track lines from Write tool (all added)
              // 当 `toolName` 匹配 `'Write'` 时，命令处理执行对应分支。
              if (toolName === 'Write') {
                // writeContent标记命令处理斜杠命令 insights是否启用对应路径。
                const writeContent = (input.content as string) || ''
                // 满足 `writeContent` 时，命令处理执行该分支。
                if (writeContent) {
                  // 斜杠命令 insights在这里处理 `linesAdded += countCharInString(writeContent, '\n') + 1`，完成这一小步状态转换。
                  linesAdded += countCharInString(writeContent, '\n') + 1
                }
              }

              // 命令标记命令处理斜杠命令 insights是否启用对应路径。
              const command = (input.command as string) || ''
              // 满足 `command.includes('git commit')` 时，命令处理执行该分支。
              if (command.includes('git commit')) gitCommits++
              // 满足 `command.includes('git push')` 时，命令处理执行该分支。
              if (command.includes('git push')) gitPushes++
            }
          }
        }
      }
    }

    // Check user messages
    // 只有 `msg.type === 'user' && msg.message` 满足时，命令处理才执行该分支。
    if (msg.type === 'user' && msg.message) {
      // 文本内容保存`msg.message.content`，供命令处理斜杠命令 insights后续判断或输出使用。
      const content = msg.message.content

      // Check if this is an actual human message (has text) vs just tool_result
      // matching Python reference logic
      // isHumanMessage 消息数据标记命令处理斜杠命令 insights是否启用对应路径。
      let isHumanMessage = false
      // 只有 `typeof content === 'string' && content.trim()` 满足时，命令处理才执行该分支。
      if (typeof content === 'string' && content.trim()) {
        // isHumanMessage 消息数据更新为 `true`，确保斜杠命令后续读取最新状态。
        isHumanMessage = true
      // 斜杠命令 insights在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
      } else if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给命令处理处理。
        for (const block of content) {
          // 只有 `block.type === 'text' && 'text' in block` 满足时，命令处理才执行该分支。
          if (block.type === 'text' && 'text' in block) {
            // isHumanMessage 消息数据更新为 `true`，确保斜杠命令后续读取最新状态。
            isHumanMessage = true
            // 结束这个分支或循环，避免命令处理继续落入后续路径。
            break
          }
        }
      }

      // Only track message hours and response times for actual human messages
      // 满足 `isHumanMessage` 时，命令处理执行该分支。
      if (isHumanMessage) {
        // Track message hour for time-of-day analysis and timestamp for multi-clauding
        // 满足 `msgTimestamp` 时，命令处理执行该分支。
        if (msgTimestamp) {
          // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
          try {
            // msgDate记录时间`Date`，供命令处理后续处理使用。
            const msgDate = new Date(msgTimestamp)
            // hour读取`msgDate.getHours`，供命令处理后续处理使用。
            const hour = msgDate.getHours() // Local hour 0-23
            // messageHours 消息数据追加新条目，保持收集顺序与输入顺序一致。
            messageHours.push(hour)
            // Collect timestamp for multi-clauding detection (matching Python)
            // userMessageTimestamps 消息数据追加新条目，保持收集顺序与输入顺序一致。
            userMessageTimestamps.push(msgTimestamp)
          } catch {
            // Skip invalid timestamps
          }
        }

        // Calculate response time (time from last assistant message to this user message)
        // Only count gaps > 2 seconds (real user think time, not tool results)
        // 只有 `lastAssistantTimestamp && msgTimestamp` 满足时，命令处理才执行该分支。
        if (lastAssistantTimestamp && msgTimestamp) {
          // assistantTime记录时间`Date`，供命令处理后续处理使用。
          const assistantTime = new Date(lastAssistantTimestamp).getTime()
          // userTime记录时间`Date`，供命令处理后续处理使用。
          const userTime = new Date(msgTimestamp).getTime()
          // responseTimeSec 响应数据保存`(userTime - assistantTime) / 1000`，供命令处理斜杠命令 insights后续判断或输出使用。
          const responseTimeSec = (userTime - assistantTime) / 1000
          // Only count reasonable response times (2s-1 hour) matching Python
          // 只有 `responseTimeSec > 2 && responseTimeSec < 3600` 满足时，命令处理才执行该分支。
          if (responseTimeSec > 2 && responseTimeSec < 3600) {
            // userResponseTimes 响应数据追加新条目，保持收集顺序与输入顺序一致。
            userResponseTimes.push(responseTimeSec)
          }
        }
      }

      // Process tool results (for error tracking)
      // 满足 `Array.isArray(content)` 时，命令处理执行该分支。
      if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给命令处理处理。
        for (const block of content) {
          // 只有 `block.type === 'tool_result' && 'content' in block` 满足时，命令处理才执行该分支。
          if (block.type === 'tool_result' && 'content' in block) {
            // isError 错误信息标记命令处理斜杠命令 insights是否启用对应路径。
            const isError = (block as { is_error?: boolean }).is_error

            // Count and categorize tool errors (matching Python reference logic)
            // 满足 `isError` 时，命令处理执行该分支。
            if (isError) {
              // 斜杠命令 insights在这里处理 `toolErrors++`，完成这一小步状态转换。
              toolErrors++
              // resultContent保存`(block as { content?: string }).content`，供命令处理斜杠命令 insights后续判断或输出使用。
              const resultContent = (block as { content?: string }).content
              // category固定为 `'Other'`，作为命令处理斜杠命令 insights后续展示或比较的基准。
              let category = 'Other'
              // 当 `typeof resultContent` 匹配 `'string'` 时，命令处理执行对应分支。
              if (typeof resultContent === 'string') {
                // lowerContent保存`resultContent.toLowerCase`，供命令处理后续处理使用。
                const lowerContent = resultContent.toLowerCase()
                // 满足 `lowerContent.includes('exit code')` 时，命令处理执行该分支。
                if (lowerContent.includes('exit code')) {
                  // category更新为 `'Command Failed'`，确保斜杠命令后续读取最新状态。
                  category = 'Command Failed'
                // 斜杠命令 insights在这里处理 `} else if (`，完成这一小步状态转换。
                } else if (
                  lowerContent.includes('rejected') ||
                  lowerContent.includes("doesn't want")
                ) {
                  // category更新为 `'User Rejected'`，确保斜杠命令后续读取最新状态。
                  category = 'User Rejected'
                // 斜杠命令 insights在这里处理 `} else if (`，完成这一小步状态转换。
                } else if (
                  lowerContent.includes('string to replace not found') ||
                  lowerContent.includes('no changes')
                ) {
                  // category更新为 `'Edit Failed'`，确保斜杠命令后续读取最新状态。
                  category = 'Edit Failed'
                // 斜杠命令 insights在这里处理 `} else if (lowerContent.includes('modified since read')) {`，完成这一小步状态转换。
                } else if (lowerContent.includes('modified since read')) {
                  // category更新为 `'File Changed'`，确保斜杠命令后续读取最新状态。
                  category = 'File Changed'
                // 斜杠命令 insights在这里处理 `} else if (`，完成这一小步状态转换。
                } else if (
                  lowerContent.includes('exceeds maximum') ||
                  lowerContent.includes('too large')
                ) {
                  // category更新为 `'File Too Large'`，确保斜杠命令后续读取最新状态。
                  category = 'File Too Large'
                // 斜杠命令 insights在这里处理 `} else if (`，完成这一小步状态转换。
                } else if (
                  lowerContent.includes('file not found') ||
                  lowerContent.includes('does not exist')
                ) {
                  // category更新为 `'File Not Found'`，确保斜杠命令后续读取最新状态。
                  category = 'File Not Found'
                }
              }
              // 斜杠命令 insights在这里处理 `toolErrorCategories[category] =`，完成这一小步状态转换。
              toolErrorCategories[category] =
                (toolErrorCategories[category] || 0) + 1
            }
          }
        }
      }

      // Check for interruptions (matching Python reference)
      // 当 `typeof content` 匹配 `'string'` 时，命令处理执行对应分支。
      if (typeof content === 'string') {
        // 满足 `content.includes('[Request interrupted by user')` 时，命令处理执行该分支。
        if (content.includes('[Request interrupted by user')) {
          // 斜杠命令 insights在这里处理 `userInterruptions++`，完成这一小步状态转换。
          userInterruptions++
        }
      // 斜杠命令 insights在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
      } else if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给命令处理处理。
        for (const block of content) {
          // 命令处理在这里按实际状态进入对应分支。
          if (
            block.type === 'text' &&
            'text' in block &&
            (block.text as string).includes('[Request interrupted by user')
          ) {
            // 斜杠命令 insights在这里处理 `userInterruptions++`，完成这一小步状态转换。
            userInterruptions++
            // 结束这个分支或循环，避免命令处理继续落入后续路径。
            break
          }
        }
      }
    }
  }

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    toolCounts,
    languages,
    gitCommits,
    gitPushes,
    inputTokens,
    outputTokens,
    // New stats
    userInterruptions,
    userResponseTimes,
    toolErrors,
    toolErrorCategories,
    usesTaskAgent,
    usesMcp,
    usesWebSearch,
    usesWebFetch,
    // Additional stats
    linesAdded,
    linesRemoved,
    filesModified,
    messageHours,
    userMessageTimestamps,
  }
}

// hasValidDates 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasValidDates(log: LogOption): boolean {
  // 返回 `(`，作为命令处理这次计算的结果。
  return (
    !Number.isNaN(log.created.getTime()) &&
    !Number.isNaN(log.modified.getTime())
  )
}

// logToSessionMeta 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logToSessionMeta(log: LogOption): SessionMeta {
  // stats 集合保存`extractToolStats`，供命令处理后续处理使用。
  const stats = extractToolStats(log)
  // sessionId 会话数据读取`getSessionIdFromLog`，供命令处理后续处理使用。
  const sessionId = getSessionIdFromLog(log) || 'unknown'
  // startTime构建`created.toISOString`，供命令处理后续处理使用。
  const startTime = log.created.toISOString()
  // durationMinutes 集合保存`Math.round`，供命令处理后续处理使用。
  const durationMinutes = Math.round(
    (log.modified.getTime() - log.created.getTime()) / 1000 / 60,
  )

  // userMessageCount 消息数据保存`0`，供后续判断或组装使用。
  let userMessageCount = 0
  // assistantMessageCount 消息数据 命名 `0`，让后续代码直接表达这个值的用途。
  let assistantMessageCount = 0
  // 按顺序遍历 `log.messages` 中的消息，逐个交给命令处理处理。
  for (const msg of log.messages) {
    // 当 `msg.type` 匹配 `'assistant'` 时，命令处理执行对应分支。
    if (msg.type === 'assistant') assistantMessageCount++
    // Only count user messages that have actual text content (human messages)
    // not just tool_result messages (matching Python reference)
    // 只有 `msg.type === 'user' && msg.message` 满足时，命令处理才执行该分支。
    if (msg.type === 'user' && msg.message) {
      // 文本内容保存`msg.message.content`，供命令处理斜杠命令 insights后续判断或输出使用。
      const content = msg.message.content
      // isHumanMessage 消息数据标记命令处理斜杠命令 insights是否启用对应路径。
      let isHumanMessage = false
      // 只有 `typeof content === 'string' && content.trim()` 满足时，命令处理才执行该分支。
      if (typeof content === 'string' && content.trim()) {
        // isHumanMessage 消息数据更新为 `true`，确保斜杠命令后续读取最新状态。
        isHumanMessage = true
      // 斜杠命令 insights在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
      } else if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给命令处理处理。
        for (const block of content) {
          // 只有 `block.type === 'text' && 'text' in block` 满足时，命令处理才执行该分支。
          if (block.type === 'text' && 'text' in block) {
            // isHumanMessage 消息数据更新为 `true`，确保斜杠命令后续读取最新状态。
            isHumanMessage = true
            // 结束这个分支或循环，避免命令处理继续落入后续路径。
            break
          }
        }
      }
      // 满足 `isHumanMessage` 时，命令处理执行该分支。
      if (isHumanMessage) {
        // 斜杠命令 insights在这里处理 `userMessageCount++`，完成这一小步状态转换。
        userMessageCount++
      }
    }
  }

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    session_id: sessionId,
    project_path: log.projectPath || '',
    start_time: startTime,
    duration_minutes: durationMinutes,
    user_message_count: userMessageCount,
    assistant_message_count: assistantMessageCount,
    tool_counts: stats.toolCounts,
    languages: stats.languages,
    git_commits: stats.gitCommits,
    git_pushes: stats.gitPushes,
    input_tokens: stats.inputTokens,
    output_tokens: stats.outputTokens,
    first_prompt: log.firstPrompt || '',
    summary: log.summary,
    // New stats
    user_interruptions: stats.userInterruptions,
    user_response_times: stats.userResponseTimes,
    tool_errors: stats.toolErrors,
    tool_error_categories: stats.toolErrorCategories,
    uses_task_agent: stats.usesTaskAgent,
    uses_mcp: stats.usesMcp,
    uses_web_search: stats.usesWebSearch,
    uses_web_fetch: stats.usesWebFetch,
    // Additional stats
    lines_added: stats.linesAdded,
    lines_removed: stats.linesRemoved,
    files_modified: stats.filesModified.size,
    message_hours: stats.messageHours,
    user_message_timestamps: stats.userMessageTimestamps,
  }
}

/**
 * Deduplicate conversation branches within the same session.
 *
 * When a session file has multiple leaf messages (from retries or branching),
 * loadAllLogsFromSessionFile produces one LogOption per leaf. Each branch
 * shares the same root message, so its duration overlaps with sibling
 * branches. This keeps only the branch with the most user messages
 * (tie-break by longest duration) per session_id.
 */
// deduplicateSessionBranches 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function deduplicateSessionBranches(
  entries: Array<{ log: LogOption; meta: SessionMeta }>,
): Array<{ log: LogOption; meta: SessionMeta }> {
  // bestBySession 会话数据构建`new Map<string, { log: LogOption; meta: SessionMeta }>()` 整理出中间结果，供命令处理斜杠命令 insights后续步骤使用。
  const bestBySession = new Map<string, { log: LogOption; meta: SessionMeta }>()
  // 按顺序遍历 `entries` 中的entry，逐个交给命令处理处理。
  for (const entry of entries) {
    // 标识符保存`entry.meta.session_id`，供命令处理斜杠命令 insights后续判断或输出使用。
    const id = entry.meta.session_id
    // existing读取`bestBySession.get`，供命令处理后续处理使用。
    const existing = bestBySession.get(id)
    // 命令处理在这里按实际状态进入对应分支。
    if (
      !existing ||
      entry.meta.user_message_count > existing.meta.user_message_count ||
      (entry.meta.user_message_count === existing.meta.user_message_count &&
        entry.meta.duration_minutes > existing.meta.duration_minutes)
    ) {
      // bestBySession.set 写入新的状态值，使命令处理后续读取保持一致。
      bestBySession.set(id, entry)
    }
  }
  // 返回列表结果，保留命令处理已经排好的条目顺序。
  return [...bestBySession.values()]
}

// formatTranscriptForFacets 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatTranscriptForFacets(log: LogOption): string {
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // meta保存`logToSessionMeta`，供命令处理后续处理使用。
  const meta = logToSessionMeta(log)

  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(`Session: ${meta.session_id.slice(0, 8)}`)
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(`Date: ${meta.start_time}`)
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(`Project: ${meta.project_path}`)
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(`Duration: ${meta.duration_minutes} min`)
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('')

  // 按顺序遍历 `log.messages` 中的消息，逐个交给命令处理处理。
  for (const msg of log.messages) {
    // 只有 `msg.type === 'user' && msg.message` 满足时，命令处理才执行该分支。
    if (msg.type === 'user' && msg.message) {
      // 文本内容保存`msg.message.content`，供命令处理斜杠命令 insights后续判断或输出使用。
      const content = msg.message.content
      // 当 `typeof content` 匹配 `'string'` 时，命令处理执行对应分支。
      if (typeof content === 'string') {
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(`[User]: ${content.slice(0, 500)}`)
      // 斜杠命令 insights在这里处理 `} else if (Array.isArray(content)) {`，完成这一小步状态转换。
      } else if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给命令处理处理。
        for (const block of content) {
          // 只有 `block.type === 'text' && 'text' in block` 满足时，命令处理才执行该分支。
          if (block.type === 'text' && 'text' in block) {
            // 文本行追加新条目，保持收集顺序与输入顺序一致。
            lines.push(`[User]: ${(block.text as string).slice(0, 500)}`)
          }
        }
      }
    // 斜杠命令 insights在这里处理 `} else if (msg.type === 'assistant' && msg.message) {`，完成这一小步状态转换。
    } else if (msg.type === 'assistant' && msg.message) {
      // 文本内容保存`msg.message.content`，供命令处理斜杠命令 insights后续判断或输出使用。
      const content = msg.message.content
      // 满足 `Array.isArray(content)` 时，命令处理执行该分支。
      if (Array.isArray(content)) {
        // 按顺序遍历 `content` 中的block，逐个交给命令处理处理。
        for (const block of content) {
          // 只有 `block.type === 'text' && 'text' in block` 满足时，命令处理才执行该分支。
          if (block.type === 'text' && 'text' in block) {
            // 文本行追加新条目，保持收集顺序与输入顺序一致。
            lines.push(`[Assistant]: ${(block.text as string).slice(0, 300)}`)
          // 斜杠命令 insights在这里处理 `} else if (block.type === 'tool_use' && 'name' in block) {`，完成这一小步状态转换。
          } else if (block.type === 'tool_use' && 'name' in block) {
            // 文本行追加新条目，保持收集顺序与输入顺序一致。
            lines.push(`[Tool: ${block.name}]`)
          }
        }
      }
    }
  }

  // 返回 `lines.join('\n')`，作为命令处理这次计算的结果。
  return lines.join('\n')
}

// SUMMARIZE_CHUNK_PROMPT固定为 ``Summarize this portion of a Claude Code session transcri...`，作为命令处理斜杠命令 insights后续展示或比较的基准。
const SUMMARIZE_CHUNK_PROMPT = `Summarize this portion of a Claude Code session transcript. Focus on:
1. What the user asked for
2. What Claude did (tools used, files modified)
3. Any friction or issues
4. The outcome

Keep it concise - 3-5 sentences. Preserve specific details like file names, error messages, and user feedback.

TRANSCRIPT CHUNK:
`

// summarizeTranscriptChunk 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function summarizeTranscriptChunk(chunk: string): Promise<string> {
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`queryWithModel`，供命令处理后续处理使用。
    const result = await queryWithModel({
      systemPrompt: asSystemPrompt([]),
      userPrompt: SUMMARIZE_CHUNK_PROMPT + chunk,
      signal: new AbortController().signal,
      options: {
        model: getAnalysisModel(),
        querySource: 'insights',
        agents: [],
        isNonInteractiveSession: true,
        hasAppendSystemPrompt: false,
        mcpTools: [],
        maxOutputTokensOverride: 500,
      },
    })

    // 文本保存`extractTextContent`，供命令处理后续处理使用。
    const text = extractTextContent(result.message.content)
    // 返回 `text || chunk.slice(0, 2000)`，作为命令处理这次计算的结果。
    return text || chunk.slice(0, 2000)
  } catch {
    // On error, just return truncated chunk
    // 返回 `chunk.slice(0, 2000)`，作为命令处理这次计算的结果。
    return chunk.slice(0, 2000)
  }
}

// formatTranscriptWithSummarization 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function formatTranscriptWithSummarization(
  log: LogOption,
): Promise<string> {
  // fullTranscript格式化`formatTranscriptForFacets`，供命令处理后续处理使用。
  const fullTranscript = formatTranscriptForFacets(log)

  // If under 30k chars, use as-is
  // 满足 `fullTranscript.length <= 30000` 时，命令处理执行该分支。
  if (fullTranscript.length <= 30000) {
    // 返回 `fullTranscript`，作为命令处理这次计算的结果。
    return fullTranscript
  }

  // For long transcripts, split into chunks and summarize in parallel
  // CHUNK_SIZE 命名 `25000`，让后续代码直接表达这个值的用途。
  const CHUNK_SIZE = 25000
  // 输入块 从空数组开始收集，后续循环会按处理顺序追加条目。
  const chunks: string[] = []

  // 循环处理 `let i = 0; i < fullTranscript.length; i += CHUNK_`，让命令处理逐项把同类条目按顺序走完。
  for (let i = 0; i < fullTranscript.length; i += CHUNK_SIZE) {
    // 输入块追加新条目，保持收集顺序与输入顺序一致。
    chunks.push(fullTranscript.slice(i, i + CHUNK_SIZE))
  }

  // Summarize all chunks in parallel
  // summaries 集合保存`Promise.all`，供命令处理后续处理使用。
  const summaries = await Promise.all(chunks.map(summarizeTranscriptChunk))

  // Combine summaries with session header
  // meta保存`logToSessionMeta`，供命令处理后续处理使用。
  const meta = logToSessionMeta(log)
  // header 聚合成有序列表，保持后续遍历顺序稳定。
  const header = [
    `Session: ${meta.session_id.slice(0, 8)}`,
    `Date: ${meta.start_time}`,
    `Project: ${meta.project_path}`,
    `Duration: ${meta.duration_minutes} min`,
    `[Long session - ${chunks.length} parts summarized]`,
    '',
  ].join('\n')

  // 返回 `header + summaries.join('\n\n---\n\n')`，作为命令处理这次计算的结果。
  return header + summaries.join('\n\n---\n\n')
}

// loadCachedFacets 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadCachedFacets(
  sessionId: string,
): Promise<SessionFacets | null> {
  // facetPath 路径数据格式化`join`，供命令处理后续处理使用。
  const facetPath = join(getFacetsDir(), `${sessionId}.json`)
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供命令处理后续处理使用。
    const content = await readFile(facetPath, { encoding: 'utf-8' })
    // 解析结果解析`jsonParse(content)` 整理出中间结果，供斜杠命令 insights后续步骤使用。
    const parsed: unknown = jsonParse(content)
    // 满足 `!isValidSessionFacets(parsed)` 时，命令处理执行该分支。
    if (!isValidSessionFacets(parsed)) {
      // Delete corrupted cache file so it gets re-extracted next run
      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `unlink(facetPath)` 完成，再继续斜杠命令 insights的异步流程。
        await unlink(facetPath)
      } catch {
        // Ignore deletion errors
      }
      // 返回 `null`，作为命令处理这次计算的结果。
      return null
    }
    // 返回 `parsed`，作为命令处理这次计算的结果。
    return parsed
  } catch {
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }
}

// saveFacets 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function saveFacets(facets: SessionFacets): Promise<void> {
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(getFacetsDir(), { recursive: true })` 完成，再继续斜杠命令 insights的异步流程。
    await mkdir(getFacetsDir(), { recursive: true })
  } catch {
    // Directory may already exist
  }
  // facetPath 路径数据格式化`join`，供命令处理后续处理使用。
  const facetPath = join(getFacetsDir(), `${facets.session_id}.json`)
  // 等待 `writeFile(facetPath, jsonStringify(facets, null, 2), {` 完成，再继续斜杠命令 insights的异步流程。
  await writeFile(facetPath, jsonStringify(facets, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  })
}

// loadCachedSessionMeta 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadCachedSessionMeta(
  sessionId: string,
): Promise<SessionMeta | null> {
  // metaPath 路径数据格式化`join`，供命令处理后续处理使用。
  const metaPath = join(getSessionMetaDir(), `${sessionId}.json`)
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供命令处理后续处理使用。
    const content = await readFile(metaPath, { encoding: 'utf-8' })
    // 返回 `jsonParse(content)`，作为命令处理这次计算的结果。
    return jsonParse(content)
  } catch {
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }
}

// saveSessionMeta 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function saveSessionMeta(meta: SessionMeta): Promise<void> {
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(getSessionMetaDir(), { recursive: true })` 完成，再继续斜杠命令 insights的异步流程。
    await mkdir(getSessionMetaDir(), { recursive: true })
  } catch {
    // Directory may already exist
  }
  // metaPath 路径数据格式化`join`，供命令处理后续处理使用。
  const metaPath = join(getSessionMetaDir(), `${meta.session_id}.json`)
  // 等待 `writeFile(metaPath, jsonStringify(meta, null, 2), {` 完成，再继续斜杠命令 insights的异步流程。
  await writeFile(metaPath, jsonStringify(meta, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  })
}

// extractFacetsFromAPI 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function extractFacetsFromAPI(
  log: LogOption,
  sessionId: string,
): Promise<SessionFacets | null> {
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // Use summarization for long transcripts
    // transcript格式化`formatTranscriptWithSummarization`，供命令处理后续处理使用。
    const transcript = await formatTranscriptWithSummarization(log)

    // Build prompt asking for JSON directly (no tool use)
    // jsonPrompt 命名 ``${FACET_EXTRACTION_PROMPT}${transcript}`，让后续代码直接表达这个值的用途。
    const jsonPrompt = `${FACET_EXTRACTION_PROMPT}${transcript}

RESPOND WITH ONLY A VALID JSON OBJECT matching this schema:
{
  "underlying_goal": "What the user fundamentally wanted to achieve",
  "goal_categories": {"category_name": count, ...},
  "outcome": "fully_achieved|mostly_achieved|partially_achieved|not_achieved|unclear_from_transcript",
  "user_satisfaction_counts": {"level": count, ...},
  "claude_helpfulness": "unhelpful|slightly_helpful|moderately_helpful|very_helpful|essential",
  "session_type": "single_task|multi_task|iterative_refinement|exploration|quick_question",
  "friction_counts": {"friction_type": count, ...},
  "friction_detail": "One sentence describing friction or empty",
  "primary_success": "none|fast_accurate_search|correct_code_edits|good_explanations|proactive_help|multi_file_changes|good_debugging",
  "brief_summary": "One sentence: what user wanted and whether they got it"
}`

    // 结果保存`queryWithModel`，供命令处理后续处理使用。
    const result = await queryWithModel({
      systemPrompt: asSystemPrompt([]),
      userPrompt: jsonPrompt,
      signal: new AbortController().signal,
      options: {
        model: getAnalysisModel(),
        querySource: 'insights',
        agents: [],
        isNonInteractiveSession: true,
        hasAppendSystemPrompt: false,
        mcpTools: [],
        maxOutputTokensOverride: 4096,
      },
    })

    // 文本保存`extractTextContent`，供命令处理后续处理使用。
    const text = extractTextContent(result.message.content)

    // Parse JSON from response
    // jsonMatch匹配`text.match`，供命令处理后续处理使用。
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    // jsonMatch缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!jsonMatch) return null

    // 解析结果读取 `jsonParse(jsonMatch[0])` 对应条目，后续围绕该成员继续处理。
    const parsed: unknown = jsonParse(jsonMatch[0])
    // 满足 `!isValidSessionFacets(parsed)` 时，命令处理执行该分支。
    if (!isValidSessionFacets(parsed)) return null
    // facets 集合 集中保存斜杠命令 insights要一起传递的字段。
    const facets: SessionFacets = { ...parsed, session_id: sessionId }
    // 返回 `facets`，作为命令处理这次计算的结果。
    return facets
  } catch (err) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Facet extraction failed: ${toError(err).message}`))
    // 返回 `null`，作为命令处理这次计算的结果。
    return null
  }
}

/**
 * Detects multi-clauding (using multiple Claude sessions concurrently).
 * Uses a sliding window to find the pattern: session1 -> session2 -> session1
 * within a 30-minute window.
 */
// detectMultiClauding 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectMultiClauding(
  sessions: Array<{
    session_id: string
    user_message_timestamps: string[]
  }>,
): {
  overlap_events: number
  sessions_involved: number
  user_messages_during: number
} {
  // OVERLAP_WINDOW_MS 集合保存`30 * 60000`，供后续判断或组装使用。
  const OVERLAP_WINDOW_MS = 30 * 60000
  // allSessionMessages 会话数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allSessionMessages: Array<{ ts: number; sessionId: string }> = []

  // 按顺序遍历 `sessions` 中的session 会话数据，逐个交给命令处理处理。
  for (const session of sessions) {
    // 按顺序遍历 `session.user_message_timestamps` 中的timestamp，逐个交给命令处理处理。
    for (const timestamp of session.user_message_timestamps) {
      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // ts 集合记录时间`Date`，供命令处理后续处理使用。
        const ts = new Date(timestamp).getTime()
        // allSessionMessages 会话数据追加新条目，保持收集顺序与输入顺序一致。
        allSessionMessages.push({ ts, sessionId: session.session_id })
      } catch {
        // Skip invalid timestamps
      }
    }
  }

  // 调用 allSessionMessages.sort，触发命令处理此处需要的副作用。
  allSessionMessages.sort((a, b) => a.ts - b.ts)

  // multiClaudeSessionPairs 会话数据构建`new Set<string>()` 整理出中间结果，供命令处理斜杠命令 insights后续步骤使用。
  const multiClaudeSessionPairs = new Set<string>()
  // messagesDuringMulticlaude 消息数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const messagesDuringMulticlaude = new Set<string>()

  // Sliding window: sessionLastIndex tracks the most recent index for each session
  // windowStart 命名 `0`，让后续代码直接表达这个值的用途。
  let windowStart = 0
  // sessionLastIndex 会话数据构建`new Map<string, number>()`，供后续判断或组装使用。
  const sessionLastIndex = new Map<string, number>()

  // 按索引扫描 `allSessionMessages.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < allSessionMessages.length; i++) {
    // 消息保存`allSessionMessages[i]!`，供命令处理斜杠命令 insights后续判断或输出使用。
    const msg = allSessionMessages[i]!

    // Shrink window from the left
    // 调用 while，触发命令处理此处需要的副作用。
    while (
      windowStart < i &&
      msg.ts - allSessionMessages[windowStart]!.ts > OVERLAP_WINDOW_MS
    ) {
      // expiring读取 `allSessionMessages[windowStart]!` 对应条目，后续围绕该成员继续处理。
      const expiring = allSessionMessages[windowStart]!
      // 满足 `sessionLastIndex.get(expiring.sessionId) === windowStart` 时，命令处理执行该分支。
      if (sessionLastIndex.get(expiring.sessionId) === windowStart) {
        // 调用 sessionLastIndex.delete，触发命令处理此处需要的副作用。
        sessionLastIndex.delete(expiring.sessionId)
      }
      // 斜杠命令 insights在这里处理 `windowStart++`，完成这一小步状态转换。
      windowStart++
    }

    // Check if this session appeared earlier in the window (pattern: s1 -> s2 -> s1)
    // prevIndex 索引读取`sessionLastIndex.get`，供命令处理后续处理使用。
    const prevIndex = sessionLastIndex.get(msg.sessionId)
    // `prevIndex` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (prevIndex !== undefined) {
      // 循环处理 `let j = prevIndex + 1; j < i; j++`，让命令处理逐项把同类条目按顺序走完。
      for (let j = prevIndex + 1; j < i; j++) {
        // between读取 `allSessionMessages[j]!` 对应条目，后续围绕该成员继续处理。
        const between = allSessionMessages[j]!
        // `between.sessionId` 与 `msg.sessionId` 不一致时刷新派生状态，避免使用过期结果。
        if (between.sessionId !== msg.sessionId) {
          // pair保存`sort`，供命令处理后续处理使用。
          const pair = [msg.sessionId, between.sessionId].sort().join(':')
          // 调用 multiClaudeSessionPairs.add，触发命令处理此处需要的副作用。
          multiClaudeSessionPairs.add(pair)
          // 调用 messagesDuringMulticlaude.add，触发命令处理此处需要的副作用。
          messagesDuringMulticlaude.add(
            `${allSessionMessages[prevIndex]!.ts}:${msg.sessionId}`,
          )
          // 调用 messagesDuringMulticlaude.add，触发命令处理此处需要的副作用。
          messagesDuringMulticlaude.add(`${between.ts}:${between.sessionId}`)
          // 调用 messagesDuringMulticlaude.add，触发命令处理此处需要的副作用。
          messagesDuringMulticlaude.add(`${msg.ts}:${msg.sessionId}`)
          // 结束这个分支或循环，避免命令处理继续落入后续路径。
          break
        }
      }
    }

    // sessionLastIndex.set 写入新的状态值，使命令处理后续读取保持一致。
    sessionLastIndex.set(msg.sessionId, i)
  }

  // sessionsWithOverlaps 会话数据构建`new Set<string>()` 整理出中间结果，供命令处理斜杠命令 insights后续步骤使用。
  const sessionsWithOverlaps = new Set<string>()
  // 按顺序遍历 `multiClaudeSessionPairs` 中的pair，逐个交给命令处理处理。
  for (const pair of multiClaudeSessionPairs) {
    // 从 `pair.split(':')` 按位置拆出 s1、s2，让斜杠命令 insights分别处理这些返回值。
    const [s1, s2] = pair.split(':')
    // 满足 `s1) sessionsWithOverlaps.add(s1` 时，命令处理执行该分支。
    if (s1) sessionsWithOverlaps.add(s1)
    // 满足 `s2) sessionsWithOverlaps.add(s2` 时，命令处理执行该分支。
    if (s2) sessionsWithOverlaps.add(s2)
  }

  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    overlap_events: multiClaudeSessionPairs.size,
    sessions_involved: sessionsWithOverlaps.size,
    user_messages_during: messagesDuringMulticlaude.size,
  }
}

// aggregateData 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function aggregateData(
  sessions: SessionMeta[],
  facets: Map<string, SessionFacets>,
): AggregatedData {
  // 结果 集中保存斜杠命令 insights要一起传递的字段。
  const result: AggregatedData = {
    total_sessions: sessions.length,
    sessions_with_facets: facets.size,
    date_range: { start: '', end: '' },
    total_messages: 0,
    total_duration_hours: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    tool_counts: {},
    languages: {},
    git_commits: 0,
    git_pushes: 0,
    projects: {},
    goal_categories: {},
    outcomes: {},
    satisfaction: {},
    helpfulness: {},
    session_types: {},
    friction: {},
    success: {},
    session_summaries: [],
    // New stats
    total_interruptions: 0,
    total_tool_errors: 0,
    tool_error_categories: {},
    user_response_times: [],
    median_response_time: 0,
    avg_response_time: 0,
    sessions_using_task_agent: 0,
    sessions_using_mcp: 0,
    sessions_using_web_search: 0,
    sessions_using_web_fetch: 0,
    // Additional stats
    total_lines_added: 0,
    total_lines_removed: 0,
    total_files_modified: 0,
    days_active: 0,
    messages_per_day: 0,
    message_hours: [],
    // Multi-clauding stats (matching Python reference)
    multi_clauding: {
      overlap_events: 0,
      sessions_involved: 0,
      user_messages_during: 0,
    },
  }

  // dates 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const dates: string[] = []
  // allResponseTimes 响应数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allResponseTimes: number[] = []
  // allMessageHours 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allMessageHours: number[] = []

  // 按顺序遍历 `sessions` 中的session 会话数据，逐个交给命令处理处理。
  for (const session of sessions) {
    // dates 集合追加新条目，保持收集顺序与输入顺序一致。
    dates.push(session.start_time)
    // 斜杠命令 insights在这里处理 `result.total_messages += session.user_message_count`，完成这一小步状态转换。
    result.total_messages += session.user_message_count
    // 斜杠命令 insights在这里处理 `result.total_duration_hours += session.duration_minutes / 60`，完成这一小步状态转换。
    result.total_duration_hours += session.duration_minutes / 60
    // 斜杠命令 insights在这里处理 `result.total_input_tokens += session.input_tokens`，完成这一小步状态转换。
    result.total_input_tokens += session.input_tokens
    // 斜杠命令 insights在这里处理 `result.total_output_tokens += session.output_tokens`，完成这一小步状态转换。
    result.total_output_tokens += session.output_tokens
    // 斜杠命令 insights在这里处理 `result.git_commits += session.git_commits`，完成这一小步状态转换。
    result.git_commits += session.git_commits
    // 斜杠命令 insights在这里处理 `result.git_pushes += session.git_pushes`，完成这一小步状态转换。
    result.git_pushes += session.git_pushes

    // New stats aggregation
    // 斜杠命令 insights在这里处理 `result.total_interruptions += session.user_interruptions`，完成这一小步状态转换。
    result.total_interruptions += session.user_interruptions
    // 斜杠命令 insights在这里处理 `result.total_tool_errors += session.tool_errors`，完成这一小步状态转换。
    result.total_tool_errors += session.tool_errors
    // 循环处理 `const [cat, count] of Object.entries(session.tool_error_categories)`，让命令处理把同类条目按顺序走完。
    for (const [cat, count] of Object.entries(session.tool_error_categories)) {
      // 斜杠命令 insights在这里处理 `result.tool_error_categories[cat] =`，完成这一小步状态转换。
      result.tool_error_categories[cat] =
        (result.tool_error_categories[cat] || 0) + count
    }
    // allResponseTimes 响应数据追加新条目，保持收集顺序与输入顺序一致。
    allResponseTimes.push(...session.user_response_times)
    // 满足 `session.uses_task_agent` 时，命令处理执行该分支。
    if (session.uses_task_agent) result.sessions_using_task_agent++
    // 满足 `session.uses_mcp` 时，命令处理执行该分支。
    if (session.uses_mcp) result.sessions_using_mcp++
    // 满足 `session.uses_web_search` 时，命令处理执行该分支。
    if (session.uses_web_search) result.sessions_using_web_search++
    // 满足 `session.uses_web_fetch` 时，命令处理执行该分支。
    if (session.uses_web_fetch) result.sessions_using_web_fetch++

    // Additional stats aggregation
    // 斜杠命令 insights在这里处理 `result.total_lines_added += session.lines_added`，完成这一小步状态转换。
    result.total_lines_added += session.lines_added
    // 斜杠命令 insights在这里处理 `result.total_lines_removed += session.lines_removed`，完成这一小步状态转换。
    result.total_lines_removed += session.lines_removed
    // 斜杠命令 insights在这里处理 `result.total_files_modified += session.files_modified`，完成这一小步状态转换。
    result.total_files_modified += session.files_modified
    // allMessageHours 消息数据追加新条目，保持收集顺序与输入顺序一致。
    allMessageHours.push(...session.message_hours)

    // 循环处理 `const [tool, count] of Object.entries(session.tool_counts)`，让命令处理把同类条目按顺序走完。
    for (const [tool, count] of Object.entries(session.tool_counts)) {
      // tool_counts[tool 数量更新为 `(result.tool_counts[tool] || 0) + count`，确保斜杠命令 insights后续读取最新状态。
      result.tool_counts[tool] = (result.tool_counts[tool] || 0) + count
    }

    // 循环处理 `const [lang, count] of Object.entries(session.languages)`，让命令处理把同类条目按顺序走完。
    for (const [lang, count] of Object.entries(session.languages)) {
      // languages[lang更新为 `(result.languages[lang] || 0) + count`，确保斜杠命令 insights后续读取最新状态。
      result.languages[lang] = (result.languages[lang] || 0) + count
    }

    // 满足 `session.project_path` 时，命令处理执行该分支。
    if (session.project_path) {
      // 斜杠命令 insights在这里处理 `result.projects[session.project_path] =`，完成这一小步状态转换。
      result.projects[session.project_path] =
        (result.projects[session.project_path] || 0) + 1
    }

    // sessionFacets 会话数据读取`facets.get`，供命令处理后续处理使用。
    const sessionFacets = facets.get(session.session_id)
    // 满足 `sessionFacets` 时，命令处理执行该分支。
    if (sessionFacets) {
      // Goal categories
      // 循环处理 `const [cat, count] of safeEntries(sessionFacets.goal_categories)`，让命令处理把同类条目按顺序走完。
      for (const [cat, count] of safeEntries(sessionFacets.goal_categories)) {
        // 满足 `count > 0` 时，命令处理执行该分支。
        if (count > 0) {
          // 斜杠命令 insights在这里处理 `result.goal_categories[cat] =`，完成这一小步状态转换。
          result.goal_categories[cat] =
            (result.goal_categories[cat] || 0) + count
        }
      }

      // Outcomes
      // 斜杠命令 insights在这里处理 `result.outcomes[sessionFacets.outcome] =`，完成这一小步状态转换。
      result.outcomes[sessionFacets.outcome] =
        (result.outcomes[sessionFacets.outcome] || 0) + 1

      // Satisfaction counts
      // 调用 for，触发命令处理此处需要的副作用。
      for (const [level, count] of safeEntries(
        sessionFacets.user_satisfaction_counts,
      )) {
        // 满足 `count > 0` 时，命令处理执行该分支。
        if (count > 0) {
          // satisfaction[level更新为 `(result.satisfaction[level] || 0) + count`，确保斜杠命令 insights后续读取最新状态。
          result.satisfaction[level] = (result.satisfaction[level] || 0) + count
        }
      }

      // Helpfulness
      // 斜杠命令 insights在这里处理 `result.helpfulness[sessionFacets.claude_helpfulness] =`，完成这一小步状态转换。
      result.helpfulness[sessionFacets.claude_helpfulness] =
        (result.helpfulness[sessionFacets.claude_helpfulness] || 0) + 1

      // Session types
      // 斜杠命令 insights在这里处理 `result.session_types[sessionFacets.session_type] =`，完成这一小步状态转换。
      result.session_types[sessionFacets.session_type] =
        (result.session_types[sessionFacets.session_type] || 0) + 1

      // Friction counts
      // 循环处理 `const [type, count] of safeEntries(sessionFacets.friction_counts)`，让命令处理把同类条目按顺序走完。
      for (const [type, count] of safeEntries(sessionFacets.friction_counts)) {
        // 满足 `count > 0` 时，命令处理执行该分支。
        if (count > 0) {
          // friction[type更新为 `(result.friction[type] || 0) + count`，确保斜杠命令 insights后续读取最新状态。
          result.friction[type] = (result.friction[type] || 0) + count
        }
      }

      // Success factors
      // `sessionFacets.primary_success` 与 `'none'` 不一致时刷新派生状态，避免使用过期结果。
      if (sessionFacets.primary_success !== 'none') {
        // 斜杠命令 insights在这里处理 `result.success[sessionFacets.primary_success] =`，完成这一小步状态转换。
        result.success[sessionFacets.primary_success] =
          (result.success[sessionFacets.primary_success] || 0) + 1
      }
    }

    // 满足 `result.session_summaries.length < 50` 时，命令处理执行该分支。
    if (result.session_summaries.length < 50) {
      // session_summaries 会话数据追加新条目，保持收集顺序与输入顺序一致。
      result.session_summaries.push({
        id: session.session_id.slice(0, 8),
        date: session.start_time.split('T')[0] || '',
        summary: session.summary || session.first_prompt.slice(0, 100),
        goal: sessionFacets?.underlying_goal,
      })
    }
  }

  // 调用 dates.sort，触发命令处理此处需要的副作用。
  dates.sort()
  // start更新为 `dates[0]?.split('T')[0] || ''`，确保斜杠命令后续读取最新状态。
  result.date_range.start = dates[0]?.split('T')[0] || ''
  // end更新为 `dates[dates.length - 1]?.split('T')[0] || ''`，确保斜杠命令后续读取最新状态。
  result.date_range.end = dates[dates.length - 1]?.split('T')[0] || ''

  // Calculate response time stats
  // user_response_times 响应数据更新为 `allResponseTimes`，确保斜杠命令后续读取最新状态。
  result.user_response_times = allResponseTimes
  // 满足 `allResponseTimes.length > 0` 时，命令处理执行该分支。
  if (allResponseTimes.length > 0) {
    // sorted保存`sort`，供命令处理后续处理使用。
    const sorted = [...allResponseTimes].sort((a, b) => a - b)
    // median_response_time 响应数据更新为 `sorted[Math.floor(sorted.length / 2)] || 0`，确保斜杠命令后续读取最新状态。
    result.median_response_time = sorted[Math.floor(sorted.length / 2)] || 0
    // 斜杠命令 insights在这里处理 `result.avg_response_time =`，完成这一小步状态转换。
    result.avg_response_time =
      // 调用 allResponseTimes.reduce，触发命令处理此处需要的副作用。
      allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
  }

  // Calculate days active and messages per day
  // uniqueDays 集合保存`Set`，供命令处理后续处理使用。
  const uniqueDays = new Set(dates.map(d => d.split('T')[0]))
  // days_active更新为 `uniqueDays.size`，确保斜杠命令后续读取最新状态。
  result.days_active = uniqueDays.size
  // 斜杠命令 insights在这里处理 `result.messages_per_day =`，完成这一小步状态转换。
  result.messages_per_day =
    result.days_active > 0
      ? Math.round((result.total_messages / result.days_active) * 10) / 10
      : 0

  // Store message hours for time-of-day chart
  // message_hours 消息数据更新为 `allMessageHours`，确保斜杠命令后续读取最新状态。
  result.message_hours = allMessageHours

  // multi_clauding更新为 `detectMultiClauding(sessions)`，确保斜杠命令后续读取最新状态。
  result.multi_clauding = detectMultiClauding(sessions)

  // 返回 `result`，作为命令处理这次计算的结果。
  return result
}

// ============================================================================
// Parallel Insights Generation (6 sections)
// ============================================================================

// InsightSection 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type InsightSection = {
  name: string
  prompt: string
  maxTokens: number
}

// Sections that run in parallel first
// INSIGHT_SECTIONS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const INSIGHT_SECTIONS: InsightSection[] = [
  {
    name: 'project_areas',
    prompt: `Analyze this Claude Code usage data and identify project areas.

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "areas": [
    {"name": "Area name", "session_count": N, "description": "2-3 sentences about what was worked on and how Claude Code was used."}
  ]
}

Include 4-5 areas. Skip internal CC operations.`,
    maxTokens: 8192,
  },
  {
    name: 'interaction_style',
    prompt: `Analyze this Claude Code usage data and describe the user's interaction style.

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "narrative": "2-3 paragraphs analyzing HOW the user interacts with Claude Code. Use second person 'you'. Describe patterns: iterate quickly vs detailed upfront specs? Interrupt often or let Claude run? Include specific examples. Use **bold** for key insights.",
  "key_pattern": "One sentence summary of most distinctive interaction style"
}`,
    maxTokens: 8192,
  },
  {
    name: 'what_works',
    prompt: `Analyze this Claude Code usage data and identify what's working well for this user. Use second person ("you").

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "intro": "1 sentence of context",
  "impressive_workflows": [
    {"title": "Short title (3-6 words)", "description": "2-3 sentences describing the impressive workflow or approach. Use 'you' not 'the user'."}
  ]
}

Include 3 impressive workflows.`,
    maxTokens: 8192,
  },
  {
    name: 'friction_analysis',
    prompt: `Analyze this Claude Code usage data and identify friction points for this user. Use second person ("you").

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "intro": "1 sentence summarizing friction patterns",
  "categories": [
    {"category": "Concrete category name", "description": "1-2 sentences explaining this category and what could be done differently. Use 'you' not 'the user'.", "examples": ["Specific example with consequence", "Another example"]}
  ]
}

Include 3 friction categories with 2 examples each.`,
    maxTokens: 8192,
  },
  {
    name: 'suggestions',
    prompt: `Analyze this Claude Code usage data and suggest improvements.

## CC FEATURES REFERENCE (pick from these for features_to_try):
1. **MCP Servers**: Connect Claude to external tools, databases, and APIs via Model Context Protocol.
   - How to use: Run \`claude mcp add <server-name> -- <command>\`
   - Good for: database queries, Slack integration, GitHub issue lookup, connecting to internal APIs

2. **Custom Skills**: Reusable prompts you define as markdown files that run with a single /command.
   - How to use: Create \`.claude/skills/commit/SKILL.md\` with instructions. Then type \`/commit\` to run it.
   - Good for: repetitive workflows - /commit, /review, /test, /deploy, /pr, or complex multi-step workflows

3. **Hooks**: Shell commands that auto-run at specific lifecycle events.
   - How to use: Add to \`.claude/settings.json\` under "hooks" key.
   - Good for: auto-formatting code, running type checks, enforcing conventions

4. **Headless Mode**: Run Claude non-interactively from scripts and CI/CD.
   - How to use: \`claude -p "fix lint errors" --allowedTools "Edit,Read,Bash"\`
   - Good for: CI/CD integration, batch code fixes, automated reviews

5. **Task Agents**: Claude spawns focused sub-agents for complex exploration or parallel work.
   - How to use: Claude auto-invokes when helpful, or ask "use an agent to explore X"
   - Good for: codebase exploration, understanding complex systems

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "claude_md_additions": [
    {"addition": "A specific line or block to add to CLAUDE.md based on workflow patterns. E.g., 'Always run tests after modifying auth-related files'", "why": "1 sentence explaining why this would help based on actual sessions", "prompt_scaffold": "Instructions for where to add this in CLAUDE.md. E.g., 'Add under ## Testing section'"}
  ],
  "features_to_try": [
    {"feature": "Feature name from CC FEATURES REFERENCE above", "one_liner": "What it does", "why_for_you": "Why this would help YOU based on your sessions", "example_code": "Actual command or config to copy"}
  ],
  "usage_patterns": [
    {"title": "Short title", "suggestion": "1-2 sentence summary", "detail": "3-4 sentences explaining how this applies to YOUR work", "copyable_prompt": "A specific prompt to copy and try"}
  ]
}

IMPORTANT for claude_md_additions: PRIORITIZE instructions that appear MULTIPLE TIMES in the user data. If user told Claude the same thing in 2+ sessions (e.g., 'always run tests', 'use TypeScript'), that's a PRIME candidate - they shouldn't have to repeat themselves.

IMPORTANT for features_to_try: Pick 2-3 from the CC FEATURES REFERENCE above. Include 2-3 items for each category.`,
    maxTokens: 8192,
  },
  {
    name: 'on_the_horizon',
    prompt: `Analyze this Claude Code usage data and identify future opportunities.

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "intro": "1 sentence about evolving AI-assisted development",
  "opportunities": [
    {"title": "Short title (4-8 words)", "whats_possible": "2-3 ambitious sentences about autonomous workflows", "how_to_try": "1-2 sentences mentioning relevant tooling", "copyable_prompt": "Detailed prompt to try"}
  ]
}

Include 3 opportunities. Think BIG - autonomous workflows, parallel agents, iterating against tests.`,
    maxTokens: 8192,
  },
  ...(process.env.USER_TYPE === 'ant'
    ? [
        {
          name: 'cc_team_improvements',
          prompt: `Analyze this Claude Code usage data and suggest product improvements for the CC team.

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "improvements": [
    {"title": "Product/tooling improvement", "detail": "3-4 sentences describing the improvement", "evidence": "3-4 sentences with specific session examples"}
  ]
}

Include 2-3 improvements based on friction patterns observed.`,
          maxTokens: 8192,
        },
        {
          name: 'model_behavior_improvements',
          prompt: `Analyze this Claude Code usage data and suggest model behavior improvements.

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "improvements": [
    {"title": "Model behavior change", "detail": "3-4 sentences describing what the model should do differently", "evidence": "3-4 sentences with specific examples"}
  ]
}

Include 2-3 improvements based on friction patterns observed.`,
          maxTokens: 8192,
        },
      ]
    : []),
  {
    name: 'fun_ending',
    prompt: `Analyze this Claude Code usage data and find a memorable moment.

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "headline": "A memorable QUALITATIVE moment from the transcripts - not a statistic. Something human, funny, or surprising.",
  "detail": "Brief context about when/where this happened"
}

Find something genuinely interesting or amusing from the session summaries.`,
    maxTokens: 8192,
  },
]

// InsightResults 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type InsightResults = {
  at_a_glance?: {
    whats_working?: string
    whats_hindering?: string
    quick_wins?: string
    ambitious_workflows?: string
  }
  project_areas?: {
    areas?: Array<{ name: string; session_count: number; description: string }>
  }
  interaction_style?: {
    narrative?: string
    key_pattern?: string
  }
  what_works?: {
    intro?: string
    impressive_workflows?: Array<{ title: string; description: string }>
  }
  friction_analysis?: {
    intro?: string
    categories?: Array<{
      category: string
      description: string
      examples?: string[]
    }>
  }
  suggestions?: {
    claude_md_additions?: Array<{
      addition: string
      why: string
      where?: string
      prompt_scaffold?: string
    }>
    features_to_try?: Array<{
      feature: string
      one_liner: string
      why_for_you: string
      example_code?: string
    }>
    usage_patterns?: Array<{
      title: string
      suggestion: string
      detail?: string
      copyable_prompt?: string
    }>
  }
  on_the_horizon?: {
    intro?: string
    opportunities?: Array<{
      title: string
      whats_possible: string
      how_to_try?: string
      copyable_prompt?: string
    }>
  }
  cc_team_improvements?: {
    improvements?: Array<{
      title: string
      detail: string
      evidence?: string
    }>
  }
  model_behavior_improvements?: {
    improvements?: Array<{
      title: string
      detail: string
      evidence?: string
    }>
  }
  fun_ending?: {
    headline?: string
    detail?: string
  }
}

// generateSectionInsight 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function generateSectionInsight(
  section: InsightSection,
  dataContext: string,
): Promise<{ name: string; result: unknown }> {
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`queryWithModel`，供命令处理后续处理使用。
    const result = await queryWithModel({
      systemPrompt: asSystemPrompt([]),
      userPrompt: section.prompt + '\n\nDATA:\n' + dataContext,
      signal: new AbortController().signal,
      options: {
        model: getInsightsModel(),
        querySource: 'insights',
        agents: [],
        isNonInteractiveSession: true,
        hasAppendSystemPrompt: false,
        mcpTools: [],
        maxOutputTokensOverride: section.maxTokens,
      },
    })

    // 文本保存`extractTextContent`，供命令处理后续处理使用。
    const text = extractTextContent(result.message.content)

    // 满足 `text` 时，命令处理执行该分支。
    if (text) {
      // Parse JSON from response
      // jsonMatch匹配`text.match`，供命令处理后续处理使用。
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      // 满足 `jsonMatch` 时，命令处理执行该分支。
      if (jsonMatch) {
        // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
        try {
          // 返回结构化结果，集中表达命令处理已经整理出的状态。
          return { name: section.name, result: jsonParse(jsonMatch[0]) }
        } catch {
          // 返回结构化结果，集中表达命令处理已经整理出的状态。
          return { name: section.name, result: null }
        }
      }
    }
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { name: section.name, result: null }
  } catch (err) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`${section.name} failed: ${toError(err).message}`))
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return { name: section.name, result: null }
  }
}

// generateParallelInsights 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function generateParallelInsights(
  data: AggregatedData,
  facets: Map<string, SessionFacets>,
): Promise<InsightResults> {
  // Build data context string
  // facetSummaries 集合保存`Array.from`，供命令处理后续处理使用。
  const facetSummaries = Array.from(facets.values())
    .slice(0, 50)
    // 链式调用 map，继续加工上一行在命令处理中产生的数据。
    .map(f => `- ${f.brief_summary} (${f.outcome}, ${f.claude_helpfulness})`)
    .join('\n')

  // frictionDetails 集合保存`Array.from`，供命令处理后续处理使用。
  const frictionDetails = Array.from(facets.values())
    // 链式调用 filter，继续加工上一行在命令处理中产生的数据。
    .filter(f => f.friction_detail)
    .slice(0, 20)
    // 链式调用 map，继续加工上一行在命令处理中产生的数据。
    .map(f => `- ${f.friction_detail}`)
    .join('\n')

  // userInstructions 集合保存`Array.from`，供命令处理后续处理使用。
  const userInstructions = Array.from(facets.values())
    // 链式调用 flatMap，继续加工上一行在命令处理中产生的数据。
    .flatMap(f => f.user_instructions_to_claude || [])
    .slice(0, 15)
    // 链式调用 map，继续加工上一行在命令处理中产生的数据。
    .map(i => `- ${i}`)
    .join('\n')

  // dataContext保存`jsonStringify`，供命令处理后续处理使用。
  const dataContext = jsonStringify(
    {
      sessions: data.total_sessions,
      analyzed: data.sessions_with_facets,
      date_range: data.date_range,
      messages: data.total_messages,
      hours: Math.round(data.total_duration_hours),
      commits: data.git_commits,
      top_tools: Object.entries(data.tool_counts)
        // 链式调用 sort，继续加工上一行在命令处理中产生的数据。
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
      top_goals: Object.entries(data.goal_categories)
        // 链式调用 sort，继续加工上一行在命令处理中产生的数据。
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
      outcomes: data.outcomes,
      satisfaction: data.satisfaction,
      friction: data.friction,
      success: data.success,
      languages: data.languages,
    },
    null,
    2,
  )

  // fullContext 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const fullContext =
    dataContext +
    '\n\nSESSION SUMMARIES:\n' +
    facetSummaries +
    '\n\nFRICTION DETAILS:\n' +
    frictionDetails +
    '\n\nUSER INSTRUCTIONS TO CLAUDE:\n' +
    (userInstructions || 'None captured')

  // Run sections in parallel first (excluding at_a_glance)
  // 结果列表保存`Promise.all`，供命令处理后续处理使用。
  const results = await Promise.all(
    // 调用 INSIGHT_SECTIONS.map，触发命令处理此处需要的副作用。
    INSIGHT_SECTIONS.map(section =>
      generateSectionInsight(section, fullContext),
    ),
  )

  // Combine results
  // insights 集合 从空对象开始收集键值，后续按名称补齐内容。
  const insights: InsightResults = {}
  // 循环处理 `const { name, result } of results`，让命令处理逐项把同类条目按顺序走完。
  for (const { name, result } of results) {
    // 满足 `result` 时，命令处理执行该分支。
    if (result) {
      // 斜杠命令 insights在这里处理 `;(insights as Record<string, unknown>)[name] = result`，完成这一小步状态转换。
      ;(insights as Record<string, unknown>)[name] = result
    }
  }

  // Build rich context from generated sections for At a Glance
  // projectAreasText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const projectAreasText =
    (
      insights.project_areas as {
        areas?: Array<{ name: string; description: string }>
      }
    )?.areas
      // 这个回调绑定到 ?.map(a => `- ${a.name}: ${a.description}`)，负责命令处理在该局部场景下的响应。
      ?.map(a => `- ${a.name}: ${a.description}`)
      .join('\n') || ''

  // bigWinsText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const bigWinsText =
    (
      insights.what_works as {
        impressive_workflows?: Array<{ title: string; description: string }>
      }
    )?.impressive_workflows
      // 这个回调绑定到 ?.map(w => `- ${w.title}: ${w.description}`)，负责命令处理在该局部场景下的响应。
      ?.map(w => `- ${w.title}: ${w.description}`)
      .join('\n') || ''

  // frictionText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const frictionText =
    (
      insights.friction_analysis as {
        categories?: Array<{ category: string; description: string }>
      }
    )?.categories
      // 这个回调绑定到 ?.map(c => `- ${c.category}: ${c.description}`)，负责命令处理在该局部场景下的响应。
      ?.map(c => `- ${c.category}: ${c.description}`)
      .join('\n') || ''

  // featuresText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const featuresText =
    (
      insights.suggestions as {
        features_to_try?: Array<{ feature: string; one_liner: string }>
      }
    )?.features_to_try
      // 这个回调绑定到 ?.map(f => `- ${f.feature}: ${f.one_liner}`)，负责命令处理在该局部场景下的响应。
      ?.map(f => `- ${f.feature}: ${f.one_liner}`)
      .join('\n') || ''

  // patternsText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const patternsText =
    (
      insights.suggestions as {
        usage_patterns?: Array<{ title: string; suggestion: string }>
      }
    )?.usage_patterns
      // 这个回调绑定到 ?.map(p => `- ${p.title}: ${p.suggestion}`)，负责命令处理在该局部场景下的响应。
      ?.map(p => `- ${p.title}: ${p.suggestion}`)
      .join('\n') || ''

  // horizonText 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const horizonText =
    (
      insights.on_the_horizon as {
        opportunities?: Array<{ title: string; whats_possible: string }>
      }
    )?.opportunities
      // 这个回调绑定到 ?.map(o => `- ${o.title}: ${o.whats_possible}`)，负责命令处理在该局部场景下的响应。
      ?.map(o => `- ${o.title}: ${o.whats_possible}`)
      .join('\n') || ''

  // Now generate "At a Glance" with access to other sections' outputs
  // atAGlancePrompt保存``You're writing an "At a Glance" summary for a Claude Cod...`，作为后续固定文本处理的输入。
  const atAGlancePrompt = `You're writing an "At a Glance" summary for a Claude Code usage insights report for Claude Code users. The goal is to help them understand their usage and improve how they can use Claude better, especially as models improve.

Use this 4-part structure:

1. **What's working** - What is the user's unique style of interacting with Claude and what are some impactful things they've done? You can include one or two details, but keep it high level since things might not be fresh in the user's memory. Don't be fluffy or overly complimentary. Also, don't focus on the tool calls they use.

2. **What's hindering you** - Split into (a) Claude's fault (misunderstandings, wrong approaches, bugs) and (b) user-side friction (not providing enough context, environment issues -- ideally more general than just one project). Be honest but constructive.

3. **Quick wins to try** - Specific Claude Code features they could try from the examples below, or a workflow technique if you think it's really compelling. (Avoid stuff like "Ask Claude to confirm before taking actions" or "Type out more context up front" which are less compelling.)

4. **Ambitious workflows for better models** - As we move to much more capable models over the next 3-6 months, what should they prepare for? What workflows that seem impossible now will become possible? Draw from the appropriate section below.

Keep each section to 2-3 not-too-long sentences. Don't overwhelm the user. Don't mention specific numerical stats or underlined_categories from the session data below. Use a coaching tone.

RESPOND WITH ONLY A VALID JSON OBJECT:
{
  "whats_working": "(refer to instructions above)",
  "whats_hindering": "(refer to instructions above)",
  "quick_wins": "(refer to instructions above)",
  "ambitious_workflows": "(refer to instructions above)"
}

SESSION DATA:
${fullContext}

## Project Areas (what user works on)
${projectAreasText}

## Big Wins (impressive accomplishments)
${bigWinsText}

## Friction Categories (where things go wrong)
${frictionText}

## Features to Try
${featuresText}

## Usage Patterns to Adopt
${patternsText}

## On the Horizon (ambitious workflows for better models)
${horizonText}`

  // atAGlanceSection 集中保存斜杠命令 insights要一起传递的字段。
  const atAGlanceSection: InsightSection = {
    name: 'at_a_glance',
    prompt: atAGlancePrompt,
    maxTokens: 8192,
  }

  // atAGlanceResult保存`generateSectionInsight`，供命令处理后续处理使用。
  const atAGlanceResult = await generateSectionInsight(atAGlanceSection, '')
  // 满足 `atAGlanceResult.result` 时，命令处理执行该分支。
  if (atAGlanceResult.result) {
    // at_a_glance更新为 `atAGlanceResult.result as {`，确保斜杠命令后续读取最新状态。
    insights.at_a_glance = atAGlanceResult.result as {
      whats_working?: string
      whats_hindering?: string
      quick_wins?: string
      ambitious_workflows?: string
    }
  }

  // 返回 `insights`，作为命令处理这次计算的结果。
  return insights
}

// Escape HTML but render **bold** as <strong>
// escapeHtmlWithBold 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function escapeHtmlWithBold(text: string): string {
  // escaped保存`escapeHtml`，供命令处理后续处理使用。
  const escaped = escapeHtml(text)
  // 返回 `escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')`，作为命令处理这次计算的结果。
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

// Fixed orderings for specific charts (matching Python reference)
// SATISFACTION_ORDER 聚合成有序列表，保持后续遍历顺序稳定。
const SATISFACTION_ORDER = [
  'frustrated',
  'dissatisfied',
  'likely_satisfied',
  'satisfied',
  'happy',
  'unsure',
]

// OUTCOME_ORDER 聚合成有序列表，保持后续遍历顺序稳定。
const OUTCOME_ORDER = [
  'not_achieved',
  'partially_achieved',
  'mostly_achieved',
  'fully_achieved',
  'unclear_from_transcript',
]

// generateBarChart 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateBarChart(
  data: Record<string, number>,
  color: string,
  maxItems = 6,
  fixedOrder?: string[],
): string {
  // entries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let entries: [string, number][]

  // 满足 `fixedOrder` 时，命令处理执行该分支。
  if (fixedOrder) {
    // Use fixed order, only including items that exist in data
    // entries 集合更新为 `fixedOrder`，确保斜杠命令后续读取最新状态。
    entries = fixedOrder
      // 链式调用 filter，继续加工上一行在命令处理中产生的数据。
      .filter(key => key in data && (data[key] ?? 0) > 0)
      // 链式调用 map，继续加工上一行在命令处理中产生的数据。
      .map(key => [key, data[key] ?? 0] as [string, number])
  } else {
    // Sort by count descending
    // entries 集合更新为 `Object.entries(data)`，确保斜杠命令后续读取最新状态。
    entries = Object.entries(data)
      // 链式调用 sort，继续加工上一行在命令处理中产生的数据。
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxItems)
  }

  // entries 集合为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (entries.length === 0) return '<p class="empty">No data</p>'

  // maxVal保存`Math.max`，供命令处理后续处理使用。
  const maxVal = Math.max(...entries.map(e => e[1]))
  // 返回 `entries`，作为命令处理这次计算的结果。
  return entries
    // 链式调用 map，继续加工上一行在命令处理中产生的数据。
    .map(([label, count]) => {
      // pct统计`(count / maxVal) * 100`，供后续判断或组装使用。
      const pct = (count / maxVal) * 100
      // Use LABEL_MAP if available, otherwise clean up underscores and title case
      // cleanLabel 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const cleanLabel =
        LABEL_MAP[label] ||
        // 调用 label.replace，触发命令处理此处需要的副作用。
        label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      // 返回 ``<div class="bar-row">`，作为命令处理这次计算的结果。
      return `<div class="bar-row">
        <div class="bar-label">${escapeHtml(cleanLabel)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
        <div class="bar-value">${count}</div>
      </div>`
    })
    .join('\n')
}

// generateResponseTimeHistogram 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateResponseTimeHistogram(times: number[]): string {
  // times 集合为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (times.length === 0) return '<p class="empty">No response time data</p>'

  // Create buckets (matching Python reference)
  // buckets 集合 集中保存斜杠命令 insights要一起传递的字段。
  const buckets: Record<string, number> = {
    '2-10s': 0,
    '10-30s': 0,
    '30s-1m': 0,
    '1-2m': 0,
    '2-5m': 0,
    '5-15m': 0,
    '>15m': 0,
  }

  // 按顺序遍历 `times` 中的t，逐个交给命令处理处理。
  for (const t of times) {
    // 满足 `t < 10) buckets['2-10s'] = (buckets['2-10s'] ?? 0` 时，命令处理执行该分支。
    if (t < 10) buckets['2-10s'] = (buckets['2-10s'] ?? 0) + 1
    else if (t < 30) buckets['10-30s'] = (buckets['10-30s'] ?? 0) + 1
    else if (t < 60) buckets['30s-1m'] = (buckets['30s-1m'] ?? 0) + 1
    else if (t < 120) buckets['1-2m'] = (buckets['1-2m'] ?? 0) + 1
    else if (t < 300) buckets['2-5m'] = (buckets['2-5m'] ?? 0) + 1
    else if (t < 900) buckets['5-15m'] = (buckets['5-15m'] ?? 0) + 1
    else buckets['>15m'] = (buckets['>15m'] ?? 0) + 1
  }

  // maxVal保存`Math.max`，供命令处理后续处理使用。
  const maxVal = Math.max(...Object.values(buckets))
  // 满足 `maxVal === 0` 时，命令处理执行该分支。
  if (maxVal === 0) return '<p class="empty">No response time data</p>'

  // 返回 `Object.entries(buckets)`，作为命令处理这次计算的结果。
  return Object.entries(buckets)
    // 链式调用 map，继续加工上一行在命令处理中产生的数据。
    .map(([label, count]) => {
      // pct统计`(count / maxVal) * 100`，供后续判断或组装使用。
      const pct = (count / maxVal) * 100
      // 返回 ``<div class="bar-row">`，作为命令处理这次计算的结果。
      return `<div class="bar-row">
        <div class="bar-label">${label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:#6366f1"></div></div>
        <div class="bar-value">${count}</div>
      </div>`
    })
    .join('\n')
}

// generateTimeOfDayChart 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateTimeOfDayChart(messageHours: number[]): string {
  // messageHours 消息数据为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (messageHours.length === 0) return '<p class="empty">No time data</p>'

  // Group into time periods
  // periods 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const periods = [
    { label: 'Morning (6-12)', range: [6, 7, 8, 9, 10, 11] },
    { label: 'Afternoon (12-18)', range: [12, 13, 14, 15, 16, 17] },
    { label: 'Evening (18-24)', range: [18, 19, 20, 21, 22, 23] },
    { label: 'Night (0-6)', range: [0, 1, 2, 3, 4, 5] },
  ]

  // hourCounts 数量 从空对象开始收集键值，后续按名称补齐内容。
  const hourCounts: Record<number, number> = {}
  // 按顺序遍历 `messageHours` 中的h，逐个交给命令处理处理。
  for (const h of messageHours) {
    // hourCounts[h 数量更新为 `(hourCounts[h] || 0) + 1`，确保斜杠命令 insights后续读取最新状态。
    hourCounts[h] = (hourCounts[h] || 0) + 1
  }

  // periodCounts 数量派生`periods.map`，供命令处理后续处理使用。
  const periodCounts = periods.map(p => ({
    label: p.label,
    // 这个回调绑定到 count: p.range.reduce((sum, h) => sum + (hourCounts[h] || 0), 0),，负责命令处理在该局部场景下的响应。
    count: p.range.reduce((sum, h) => sum + (hourCounts[h] || 0), 0),
  }))

  // maxVal保存`Math.max`，供命令处理后续处理使用。
  const maxVal = Math.max(...periodCounts.map(p => p.count)) || 1

  // barsHtml保存`periodCounts`，供后续判断或组装使用。
  const barsHtml = periodCounts
    .map(
      // p更新为 `> ``，确保斜杠命令后续读取最新状态。
      p => `
      <div class="bar-row">
        <div class="bar-label">${p.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(p.count / maxVal) * 100}%;background:#8b5cf6"></div></div>
        <div class="bar-value">${p.count}</div>
      </div>`,
    )
    .join('\n')

  // 返回 ``<div id="hour-histogram">${barsHtml}</div>``，作为命令处理这次计算的结果。
  return `<div id="hour-histogram">${barsHtml}</div>`
}

// getHourCountsJson 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHourCountsJson(messageHours: number[]): string {
  // hourCounts 数量 从空对象开始收集键值，后续按名称补齐内容。
  const hourCounts: Record<number, number> = {}
  // 按顺序遍历 `messageHours` 中的h，逐个交给命令处理处理。
  for (const h of messageHours) {
    // hourCounts[h 数量更新为 `(hourCounts[h] || 0) + 1`，确保斜杠命令 insights后续读取最新状态。
    hourCounts[h] = (hourCounts[h] || 0) + 1
  }
  // 返回 `jsonStringify(hourCounts)`，作为命令处理这次计算的结果。
  return jsonStringify(hourCounts)
}

// generateHtmlReport 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateHtmlReport(
  data: AggregatedData,
  insights: InsightResults,
): string {
  // markdownToHtml封装成回调，供命令处理斜杠命令 insights在事件触发或异步步骤中调用。
  const markdownToHtml = (md: string): string => {
    // md缺失时直接走兜底路径，避免命令处理使用无效输入。
    if (!md) return ''
    // 返回 `md`，作为命令处理这次计算的结果。
    return md
      .split('\n\n')
      // 链式调用 map，继续加工上一行在命令处理中产生的数据。
      .map(p => {
        // html保存`escapeHtml`，供命令处理后续处理使用。
        let html = escapeHtml(p)
        // html更新为 `html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')`，确保斜杠命令后续读取最新状态。
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // html更新为 `html.replace(/^- /gm, '• ')`，确保斜杠命令后续读取最新状态。
        html = html.replace(/^- /gm, '• ')
        // html更新为 `html.replace(/\n/g, '<br>')`，确保斜杠命令后续读取最新状态。
        html = html.replace(/\n/g, '<br>')
        // 返回 ``<p>${html}</p>``，作为命令处理这次计算的结果。
        return `<p>${html}</p>`
      })
      .join('\n')
  }

  // Build At a Glance section (new 4-part format with links to sections)
  // atAGlance 命名 `insights.at_a_glance`，让后续代码直接表达这个值的用途。
  const atAGlance = insights.at_a_glance
  // atAGlanceHtml 命名 `atAGlance`，让后续代码直接表达这个值的用途。
  const atAGlanceHtml = atAGlance
    ? `
    <div class="at-a-glance">
      <div class="glance-title">At a Glance</div>
      <div class="glance-sections">
        ${atAGlance.whats_working ? `<div class="glance-section"><strong>What's working:</strong> ${escapeHtmlWithBold(atAGlance.whats_working)} <a href="#section-wins" class="see-more">Impressive Things You Did →</a></div>` : ''}
        ${atAGlance.whats_hindering ? `<div class="glance-section"><strong>What's hindering you:</strong> ${escapeHtmlWithBold(atAGlance.whats_hindering)} <a href="#section-friction" class="see-more">Where Things Go Wrong →</a></div>` : ''}
        ${atAGlance.quick_wins ? `<div class="glance-section"><strong>Quick wins to try:</strong> ${escapeHtmlWithBold(atAGlance.quick_wins)} <a href="#section-features" class="see-more">Features to Try →</a></div>` : ''}
        ${atAGlance.ambitious_workflows ? `<div class="glance-section"><strong>Ambitious workflows:</strong> ${escapeHtmlWithBold(atAGlance.ambitious_workflows)} <a href="#section-horizon" class="see-more">On the Horizon →</a></div>` : ''}
      </div>
    </div>
    `
    : ''

  // Build project areas section
  const projectAreas = insights.project_areas?.areas || []
  const projectAreasHtml =
    projectAreas.length > 0
      ? `
    <h2 id="section-work">What You Work On</h2>
    <div class="project-areas">
      ${projectAreas
        .map(
          // area更新为 `> ``，确保斜杠命令后续读取最新状态。
          area => `
        <div class="project-area">
          <div class="area-header">
            <span class="area-name">${escapeHtml(area.name)}</span>
            <span class="area-count">~${area.session_count} sessions</span>
          </div>
          <div class="area-desc">${escapeHtml(area.description)}</div>
        </div>
      `,
        )
        .join('')}
    </div>
    `
      : ''

  // Build interaction style section
  const interactionStyle = insights.interaction_style
  const interactionHtml = interactionStyle?.narrative
    ? `
    <h2 id="section-usage">How You Use Claude Code</h2>
    <div class="narrative">
      ${markdownToHtml(interactionStyle.narrative)}
      ${interactionStyle.key_pattern ? `<div class="key-insight"><strong>Key pattern:</strong> ${escapeHtml(interactionStyle.key_pattern)}</div>` : ''}
    </div>
    `
    : ''

  // Build what works section
  const whatWorks = insights.what_works
  const whatWorksHtml =
    whatWorks?.impressive_workflows && whatWorks.impressive_workflows.length > 0
      ? `
    <h2 id="section-wins">Impressive Things You Did</h2>
    ${whatWorks.intro ? `<p class="section-intro">${escapeHtml(whatWorks.intro)}</p>` : ''}
    <div class="big-wins">
      ${whatWorks.impressive_workflows
        .map(
          // wf更新为 `> ``，确保斜杠命令后续读取最新状态。
          wf => `
        <div class="big-win">
          <div class="big-win-title">${escapeHtml(wf.title || '')}</div>
          <div class="big-win-desc">${escapeHtml(wf.description || '')}</div>
        </div>
      `,
        )
        .join('')}
    </div>
    `
      : ''

  // Build friction section
  const frictionAnalysis = insights.friction_analysis
  const frictionHtml =
    frictionAnalysis?.categories && frictionAnalysis.categories.length > 0
      ? `
    <h2 id="section-friction">Where Things Go Wrong</h2>
    ${frictionAnalysis.intro ? `<p class="section-intro">${escapeHtml(frictionAnalysis.intro)}</p>` : ''}
    <div class="friction-categories">
      ${frictionAnalysis.categories
        .map(
          // cat更新为 `> ``，确保斜杠命令后续读取最新状态。
          cat => `
        <div class="friction-category">
          <div class="friction-title">${escapeHtml(cat.category || '')}</div>
          <div class="friction-desc">${escapeHtml(cat.description || '')}</div>
          ${cat.examples ? `<ul class="friction-examples">${cat.examples.map(ex => `<li>${escapeHtml(ex)}</li>`).join('')}</ul>` : ''}
        </div>
      `,
        )
        .join('')}
    </div>
    `
      : ''

  // Build suggestions section
  const suggestions = insights.suggestions
  const suggestionsHtml = suggestions
    ? `
    ${
      suggestions.claude_md_additions &&
      suggestions.claude_md_additions.length > 0
        ? `
    <h2 id="section-features">Existing CC Features to Try</h2>
    <div class="claude-md-section">
      <h3>Suggested CLAUDE.md Additions</h3>
      <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Just copy this into Claude Code to add it to your CLAUDE.md.</p>
      <div class="claude-md-actions">
        <button class="copy-all-btn" onclick="copyAllCheckedClaudeMd()">Copy All Checked</button>
      </div>
      ${suggestions.claude_md_additions
        .map(
          (add, i) => `
        <div class="claude-md-item">
          <input type="checkbox" id="cmd-${i}" class="cmd-checkbox" checked data-text="${escapeHtml(add.prompt_scaffold || add.where || 'Add to CLAUDE.md')}\\n\\n${escapeHtml(add.addition)}">
          <label for="cmd-${i}">
            <code class="cmd-code">${escapeHtml(add.addition)}</code>
            <button class="copy-btn" onclick="copyCmdItem(${i})">Copy</button>
          </label>
          <div class="cmd-why">${escapeHtml(add.why)}</div>
        </div>
      `,
        )
        .join('')}
    </div>
    `
        : ''
    }
    ${
      suggestions.features_to_try && suggestions.features_to_try.length > 0
        ? `
    <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Just copy this into Claude Code and it'll set it up for you.</p>
    <div class="features-section">
      ${suggestions.features_to_try
        .map(
          // feat更新为 `> ``，确保斜杠命令后续读取最新状态。
          feat => `
        <div class="feature-card">
          <div class="feature-title">${escapeHtml(feat.feature || '')}</div>
          <div class="feature-oneliner">${escapeHtml(feat.one_liner || '')}</div>
          <div class="feature-why"><strong>Why for you:</strong> ${escapeHtml(feat.why_for_you || '')}</div>
          ${
            feat.example_code
              ? `
          <div class="feature-examples">
            <div class="feature-example">
              <div class="example-code-row">
                <code class="example-code">${escapeHtml(feat.example_code)}</code>
                <button class="copy-btn" onclick="copyText(this)">Copy</button>
              </div>
            </div>
          </div>
          `
              : ''
          }
        </div>
      `,
        )
        .join('')}
    </div>
    `
        : ''
    }
    ${
      suggestions.usage_patterns && suggestions.usage_patterns.length > 0
        ? `
    <h2 id="section-patterns">New Ways to Use Claude Code</h2>
    <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Just copy this into Claude Code and it'll walk you through it.</p>
    <div class="patterns-section">
      ${suggestions.usage_patterns
        .map(
          // pat更新为 `> ``，确保斜杠命令后续读取最新状态。
          pat => `
        <div class="pattern-card">
          <div class="pattern-title">${escapeHtml(pat.title || '')}</div>
          <div class="pattern-summary">${escapeHtml(pat.suggestion || '')}</div>
          ${pat.detail ? `<div class="pattern-detail">${escapeHtml(pat.detail)}</div>` : ''}
          ${
            pat.copyable_prompt
              ? `
          <div class="copyable-prompt-section">
            <div class="prompt-label">Paste into Claude Code:</div>
            <div class="copyable-prompt-row">
              <code class="copyable-prompt">${escapeHtml(pat.copyable_prompt)}</code>
              <button class="copy-btn" onclick="copyText(this)">Copy</button>
            </div>
          </div>
          `
              : ''
          }
        </div>
      `,
        )
        .join('')}
    </div>
    `
        : ''
    }
    `
    : ''

  // Build On the Horizon section
  // horizonData保存`insights.on_the_horizon`，供命令处理斜杠命令 insights后续步骤使用。
  const horizonData = insights.on_the_horizon
  // horizonHtml 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const horizonHtml =
    horizonData?.opportunities && horizonData.opportunities.length > 0
      ? `
    <h2 id="section-horizon">On the Horizon</h2>
    ${horizonData.intro ? `<p class="section-intro">${escapeHtml(horizonData.intro)}</p>` : ''}
    <div class="horizon-section">
      ${horizonData.opportunities
        .map(
          opp => `
        <div class="horizon-card">
          <div class="horizon-title">${escapeHtml(opp.title || '')}</div>
          <div class="horizon-possible">${escapeHtml(opp.whats_possible || '')}</div>
          ${opp.how_to_try ? `<div class="horizon-tip"><strong>Getting started:</strong> ${escapeHtml(opp.how_to_try)}</div>` : ''}
          ${opp.copyable_prompt ? `<div class="pattern-prompt"><div class="prompt-label">Paste into Claude Code:</div><code>${escapeHtml(opp.copyable_prompt)}</code><button class="copy-btn" onclick="copyText(this)">Copy</button></div>` : ''}
        </div>
      `,
        )
        .join('')}
    </div>
    `
      : ''

  // Build Team Feedback section (collapsible, ant-only)
  const ccImprovements =
    process.env.USER_TYPE === 'ant'
      ? insights.cc_team_improvements?.improvements || []
      : []
  const modelImprovements =
    process.env.USER_TYPE === 'ant'
      ? insights.model_behavior_improvements?.improvements || []
      : []
  const teamFeedbackHtml =
    ccImprovements.length > 0 || modelImprovements.length > 0
      ? `
    <h2 id="section-feedback" class="feedback-header">Closing the Loop: Feedback for Other Teams</h2>
    <p class="feedback-intro">Suggestions for the CC product and model teams based on your usage patterns. Click to expand.</p>
    ${
      ccImprovements.length > 0
        ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleCollapsible(this)">
        <span class="collapsible-arrow">▶</span>
        <h3>Product Improvements for CC Team</h3>
      </div>
      <div class="collapsible-content">
        <div class="suggestions-section">
          ${ccImprovements
            .map(
              imp => `
            <div class="feedback-card team-card">
              <div class="feedback-title">${escapeHtml(imp.title || '')}</div>
              <div class="feedback-detail">${escapeHtml(imp.detail || '')}</div>
              ${imp.evidence ? `<div class="feedback-evidence"><em>Evidence:</em> ${escapeHtml(imp.evidence)}</div>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
    `
        : ''
    }
    ${
      modelImprovements.length > 0
        ? `
    <div class="collapsible-section">
      <div class="collapsible-header" onclick="toggleCollapsible(this)">
        <span class="collapsible-arrow">▶</span>
        <h3>Model Behavior Improvements</h3>
      </div>
      <div class="collapsible-content">
        <div class="suggestions-section">
          ${modelImprovements
            .map(
              // imp更新为 `> ``，确保斜杠命令后续读取最新状态。
              imp => `
            <div class="feedback-card model-card">
              <div class="feedback-title">${escapeHtml(imp.title || '')}</div>
              <div class="feedback-detail">${escapeHtml(imp.detail || '')}</div>
              ${imp.evidence ? `<div class="feedback-evidence"><em>Evidence:</em> ${escapeHtml(imp.evidence)}</div>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    </div>
    `
        : ''
    }
    `
      : ''

  // Build Fun Ending section
  // funEnding保存`insights.fun_ending`，供命令处理斜杠命令 insights后续步骤使用。
  const funEnding = insights.fun_ending
  // funEndingHtml保存`funEnding?.headline`，供命令处理斜杠命令 insights后续步骤使用。
  const funEndingHtml = funEnding?.headline
    ? `
    <div class="fun-ending">
      <div class="fun-headline">"${escapeHtml(funEnding.headline)}"</div>
      ${funEnding.detail ? `<div class="fun-detail">${escapeHtml(funEnding.detail)}</div>` : ''}
    </div>
    `
    : ''

  // css 集合保存```，供命令处理斜杠命令 insights后续步骤使用。
  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f8fafc; color: #334155; line-height: 1.65; padding: 48px 24px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    h2 { font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 48px; margin-bottom: 16px; }
    .subtitle { color: #64748b; font-size: 15px; margin-bottom: 32px; }
    .nav-toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0 32px 0; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; }
    .nav-toc a { font-size: 12px; color: #64748b; text-decoration: none; padding: 6px 12px; border-radius: 6px; background: #f1f5f9; transition: all 0.15s; }
    .nav-toc a:hover { background: #e2e8f0; color: #334155; }
    .stats-row { display: flex; gap: 24px; margin-bottom: 40px; padding: 20px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .at-a-glance { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 12px; padding: 20px 24px; margin-bottom: 32px; }
    .glance-title { font-size: 16px; font-weight: 700; color: #92400e; margin-bottom: 16px; }
    .glance-sections { display: flex; flex-direction: column; gap: 12px; }
    .glance-section { font-size: 14px; color: #78350f; line-height: 1.6; }
    .glance-section strong { color: #92400e; }
    .see-more { color: #b45309; text-decoration: none; font-size: 13px; white-space: nowrap; }
    .see-more:hover { text-decoration: underline; }
    .project-areas { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
    .project-area { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .area-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .area-name { font-weight: 600; font-size: 15px; color: #0f172a; }
    .area-count { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
    .area-desc { font-size: 14px; color: #475569; line-height: 1.5; }
    .narrative { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .narrative p { margin-bottom: 12px; font-size: 14px; color: #475569; line-height: 1.7; }
    .key-insight { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 12px; font-size: 14px; color: #166534; }
    .section-intro { font-size: 14px; color: #64748b; margin-bottom: 16px; }
    .big-wins { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
    .big-win { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; }
    .big-win-title { font-weight: 600; font-size: 15px; color: #166534; margin-bottom: 8px; }
    .big-win-desc { font-size: 14px; color: #15803d; line-height: 1.5; }
    .friction-categories { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
    .friction-category { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; }
    .friction-title { font-weight: 600; font-size: 15px; color: #991b1b; margin-bottom: 6px; }
    .friction-desc { font-size: 13px; color: #7f1d1d; margin-bottom: 10px; }
    .friction-examples { margin: 0 0 0 20px; font-size: 13px; color: #334155; }
    .friction-examples li { margin-bottom: 4px; }
    .claude-md-section { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .claude-md-section h3 { font-size: 14px; font-weight: 600; color: #1e40af; margin: 0 0 12px 0; }
    .claude-md-actions { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #dbeafe; }
    .copy-all-btn { background: #2563eb; color: white; border: none; border-radius: 4px; padding: 6px 12px; font-size: 12px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
    .copy-all-btn:hover { background: #1d4ed8; }
    .copy-all-btn.copied { background: #16a34a; }
    .claude-md-item { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 8px; padding: 10px 0; border-bottom: 1px solid #dbeafe; }
    .claude-md-item:last-child { border-bottom: none; }
    .cmd-checkbox { margin-top: 2px; }
    .cmd-code { background: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #1e40af; border: 1px solid #bfdbfe; font-family: monospace; display: block; white-space: pre-wrap; word-break: break-word; flex: 1; }
    .cmd-why { font-size: 12px; color: #64748b; width: 100%; padding-left: 24px; margin-top: 4px; }
    .features-section, .patterns-section { display: flex; flex-direction: column; gap: 12px; margin: 16px 0; }
    .feature-card { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; }
    .pattern-card { background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 8px; padding: 16px; }
    .feature-title, .pattern-title { font-weight: 600; font-size: 15px; color: #0f172a; margin-bottom: 6px; }
    .feature-oneliner { font-size: 14px; color: #475569; margin-bottom: 8px; }
    .pattern-summary { font-size: 14px; color: #475569; margin-bottom: 8px; }
    .feature-why, .pattern-detail { font-size: 13px; color: #334155; line-height: 1.5; }
    .feature-examples { margin-top: 12px; }
    .feature-example { padding: 8px 0; border-top: 1px solid #d1fae5; }
    .feature-example:first-child { border-top: none; }
    .example-desc { font-size: 13px; color: #334155; margin-bottom: 6px; }
    .example-code-row { display: flex; align-items: flex-start; gap: 8px; }
    .example-code { flex: 1; background: #f1f5f9; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #334155; overflow-x: auto; white-space: pre-wrap; }
    .copyable-prompt-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .copyable-prompt-row { display: flex; align-items: flex-start; gap: 8px; }
    .copyable-prompt { flex: 1; background: #f8fafc; padding: 10px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #334155; border: 1px solid #e2e8f0; white-space: pre-wrap; line-height: 1.5; }
    .feature-code { background: #f8fafc; padding: 12px; border-radius: 6px; margin-top: 12px; border: 1px solid #e2e8f0; display: flex; align-items: flex-start; gap: 8px; }
    .feature-code code { flex: 1; font-family: monospace; font-size: 12px; color: #334155; white-space: pre-wrap; }
    .pattern-prompt { background: #f8fafc; padding: 12px; border-radius: 6px; margin-top: 12px; border: 1px solid #e2e8f0; }
    .pattern-prompt code { font-family: monospace; font-size: 12px; color: #334155; display: block; white-space: pre-wrap; margin-bottom: 8px; }
    .prompt-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
    .copy-btn { background: #e2e8f0; border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #475569; flex-shrink: 0; }
    .copy-btn:hover { background: #cbd5e1; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
    .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .chart-title { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 12px; }
    .bar-row { display: flex; align-items: center; margin-bottom: 6px; }
    .bar-label { width: 100px; font-size: 11px; color: #475569; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { flex: 1; height: 6px; background: #f1f5f9; border-radius: 3px; margin: 0 8px; }
    .bar-fill { height: 100%; border-radius: 3px; }
    .bar-value { width: 28px; font-size: 11px; font-weight: 500; color: #64748b; text-align: right; }
    .empty { color: #94a3b8; font-size: 13px; }
    .horizon-section { display: flex; flex-direction: column; gap: 16px; }
    .horizon-card { background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%); border: 1px solid #c4b5fd; border-radius: 8px; padding: 16px; }
    .horizon-title { font-weight: 600; font-size: 15px; color: #5b21b6; margin-bottom: 8px; }
    .horizon-possible { font-size: 14px; color: #334155; margin-bottom: 10px; line-height: 1.5; }
    .horizon-tip { font-size: 13px; color: #6b21a8; background: rgba(255,255,255,0.6); padding: 8px 12px; border-radius: 4px; }
    .feedback-header { margin-top: 48px; color: #64748b; font-size: 16px; }
    .feedback-intro { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
    .feedback-section { margin-top: 16px; }
    .feedback-section h3 { font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 12px; }
    .feedback-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .feedback-card.team-card { background: #eff6ff; border-color: #bfdbfe; }
    .feedback-card.model-card { background: #faf5ff; border-color: #e9d5ff; }
    .feedback-title { font-weight: 600; font-size: 14px; color: #0f172a; margin-bottom: 6px; }
    .feedback-detail { font-size: 13px; color: #475569; line-height: 1.5; }
    .feedback-evidence { font-size: 12px; color: #64748b; margin-top: 8px; }
    .fun-ending { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #fbbf24; border-radius: 12px; padding: 24px; margin-top: 40px; text-align: center; }
    .fun-headline { font-size: 18px; font-weight: 600; color: #78350f; margin-bottom: 8px; }
    .fun-detail { font-size: 14px; color: #92400e; }
    .collapsible-section { margin-top: 16px; }
    .collapsible-header { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .collapsible-header h3 { margin: 0; font-size: 14px; font-weight: 600; color: #475569; }
    .collapsible-arrow { font-size: 12px; color: #94a3b8; transition: transform 0.2s; }
    .collapsible-content { display: none; padding-top: 16px; }
    .collapsible-content.open { display: block; }
    .collapsible-header.open .collapsible-arrow { transform: rotate(90deg); }
    @media (max-width: 640px) { .charts-row { grid-template-columns: 1fr; } .stats-row { justify-content: center; } }
  `

  // hourCountsJson读取`getHourCountsJson`，供命令处理后续处理使用。
  const hourCountsJson = getHourCountsJson(data.message_hours)

  // js 集合保存```，供命令处理斜杠命令 insights后续步骤使用。
  const js = `
    function toggleCollapsible(header) {
      header.classList.toggle('open');
      const content = header.nextElementSibling;
      content.classList.toggle('open');
    }
    function copyText(btn) {
      const code = btn.previousElementSibling;
      navigator.clipboard.writeText(code.textContent).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      });
    }
    function copyCmdItem(idx) {
      const checkbox = document.getElementById('cmd-' + idx);
      if (checkbox) {
        const text = checkbox.dataset.text;
        navigator.clipboard.writeText(text).then(() => {
          const btn = checkbox.nextElementSibling.querySelector('.copy-btn');
          if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy'; }, 2000); }
        });
      }
    }
    function copyAllCheckedClaudeMd() {
      const checkboxes = document.querySelectorAll('.cmd-checkbox:checked');
      const texts = [];
      checkboxes.forEach(cb => {
        if (cb.dataset.text) { texts.push(cb.dataset.text); }
      });
      const combined = texts.join('\\n');
      const btn = document.querySelector('.copy-all-btn');
      if (btn) {
        navigator.clipboard.writeText(combined).then(() => {
          btn.textContent = 'Copied ' + texts.length + ' items!';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = 'Copy All Checked'; btn.classList.remove('copied'); }, 2000);
        });
      }
    }
    // Timezone selector for time of day chart (data is from our own analytics, not user input)
    const rawHourCounts = ${hourCountsJson};
    function updateHourHistogram(offsetFromPT) {
      const periods = [
        { label: "Morning (6-12)", range: [6,7,8,9,10,11] },
        { label: "Afternoon (12-18)", range: [12,13,14,15,16,17] },
        { label: "Evening (18-24)", range: [18,19,20,21,22,23] },
        { label: "Night (0-6)", range: [0,1,2,3,4,5] }
      ];
      const adjustedCounts = {};
      for (const [hour, count] of Object.entries(rawHourCounts)) {
        const newHour = (parseInt(hour) + offsetFromPT + 24) % 24;
        adjustedCounts[newHour] = (adjustedCounts[newHour] || 0) + count;
      }
      const periodCounts = periods.map(p => ({
        label: p.label,
        count: p.range.reduce((sum, h) => sum + (adjustedCounts[h] || 0), 0)
      }));
      const maxCount = Math.max(...periodCounts.map(p => p.count)) || 1;
      const container = document.getElementById('hour-histogram');
      container.textContent = '';
      periodCounts.forEach(p => {
        const row = document.createElement('div');
        row.className = 'bar-row';
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = p.label;
        const track = document.createElement('div');
        track.className = 'bar-track';
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.width = (p.count / maxCount) * 100 + '%';
        fill.style.background = '#8b5cf6';
        track.appendChild(fill);
        const value = document.createElement('div');
        value.className = 'bar-value';
        value.textContent = p.count;
        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(value);
        container.appendChild(row);
      });
    }
    document.getElementById('timezone-select').addEventListener('change', function() {
      const customInput = document.getElementById('custom-offset');
      if (this.value === 'custom') {
        customInput.style.display = 'inline-block';
        customInput.focus();
      } else {
        customInput.style.display = 'none';
        updateHourHistogram(parseInt(this.value));
      }
    });
    document.getElementById('custom-offset').addEventListener('change', function() {
      const offset = parseInt(this.value) + 8;
      updateHourHistogram(offset);
    });
  `

  // 返回 `<!DOCTYPE html>，把命令处理这个分支的结果交还调用方。
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Claude Code Insights</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  <div class="container">
    <h1>Claude Code Insights</h1>
    <p class="subtitle">${data.total_messages.toLocaleString()} messages across ${data.total_sessions} sessions${data.total_sessions_scanned && data.total_sessions_scanned > data.total_sessions ? ` (${data.total_sessions_scanned.toLocaleString()} total)` : ''} | ${data.date_range.start} to ${data.date_range.end}</p>

    ${atAGlanceHtml}

    <nav class="nav-toc">
      <a href="#section-work">What You Work On</a>
      <a href="#section-usage">How You Use CC</a>
      <a href="#section-wins">Impressive Things</a>
      <a href="#section-friction">Where Things Go Wrong</a>
      <a href="#section-features">Features to Try</a>
      <a href="#section-patterns">New Usage Patterns</a>
      <a href="#section-horizon">On the Horizon</a>
      <a href="#section-feedback">Team Feedback</a>
    </nav>

    <div class="stats-row">
      <div class="stat"><div class="stat-value">${data.total_messages.toLocaleString()}</div><div class="stat-label">Messages</div></div>
      <div class="stat"><div class="stat-value">+${data.total_lines_added.toLocaleString()}/-${data.total_lines_removed.toLocaleString()}</div><div class="stat-label">Lines</div></div>
      <div class="stat"><div class="stat-value">${data.total_files_modified}</div><div class="stat-label">Files</div></div>
      <div class="stat"><div class="stat-value">${data.days_active}</div><div class="stat-label">Days</div></div>
      <div class="stat"><div class="stat-value">${data.messages_per_day}</div><div class="stat-label">Msgs/Day</div></div>
    </div>

    ${projectAreasHtml}

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">What You Wanted</div>
        ${generateBarChart(data.goal_categories, '#2563eb')}
      </div>
      <div class="chart-card">
        <div class="chart-title">Top Tools Used</div>
        ${generateBarChart(data.tool_counts, '#0891b2')}
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">Languages</div>
        ${generateBarChart(data.languages, '#10b981')}
      </div>
      <div class="chart-card">
        <div class="chart-title">Session Types</div>
        ${generateBarChart(data.session_types || {}, '#8b5cf6')}
      </div>
    </div>

    ${interactionHtml}

    <!-- Response Time Distribution -->
    <div class="chart-card" style="margin: 24px 0;">
      <div class="chart-title">User Response Time Distribution</div>
      ${generateResponseTimeHistogram(data.user_response_times)}
      <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
        Median: ${data.median_response_time.toFixed(1)}s &bull; Average: ${data.avg_response_time.toFixed(1)}s
      </div>
    </div>

    <!-- Multi-clauding Section (matching Python reference) -->
    <div class="chart-card" style="margin: 24px 0;">
      <div class="chart-title">Multi-Clauding (Parallel Sessions)</div>
      ${
        data.multi_clauding.overlap_events === 0
          ? `
        <p style="font-size: 14px; color: #64748b; padding: 8px 0;">
          No parallel session usage detected. You typically work with one Claude Code session at a time.
        </p>
      `
          : `
        <div style="display: flex; gap: 24px; margin: 12px 0;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #7c3aed;">${data.multi_clauding.overlap_events}</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Overlap Events</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #7c3aed;">${data.multi_clauding.sessions_involved}</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Sessions Involved</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #7c3aed;">${data.total_messages > 0 ? Math.round((100 * data.multi_clauding.user_messages_during) / data.total_messages) : 0}%</div>
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Of Messages</div>
          </div>
        </div>
        <p style="font-size: 13px; color: #475569; margin-top: 12px;">
          You run multiple Claude Code sessions simultaneously. Multi-clauding is detected when sessions
          overlap in time, suggesting parallel workflows.
        </p>
      `
      }
    </div>

    <!-- Time of Day & Tool Errors -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title" style="display: flex; align-items: center; gap: 12px;">
          User Messages by Time of Day
          <select id="timezone-select" style="font-size: 12px; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">
            <option value="0">PT (UTC-8)</option>
            <option value="3">ET (UTC-5)</option>
            <option value="8">London (UTC)</option>
            <option value="9">CET (UTC+1)</option>
            <option value="17">Tokyo (UTC+9)</option>
            <option value="custom">Custom offset...</option>
          </select>
          <input type="number" id="custom-offset" placeholder="UTC offset" style="display: none; width: 80px; font-size: 12px; padding: 4px; border-radius: 4px; border: 1px solid #e2e8f0;">
        </div>
        ${generateTimeOfDayChart(data.message_hours)}
      </div>
      <div class="chart-card">
        <div class="chart-title">Tool Errors Encountered</div>
        ${Object.keys(data.tool_error_categories).length > 0 ? generateBarChart(data.tool_error_categories, '#dc2626') : '<p class="empty">No tool errors</p>'}
      </div>
    </div>

    ${whatWorksHtml}

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">What Helped Most (Claude's Capabilities)</div>
        ${generateBarChart(data.success, '#16a34a')}
      </div>
      <div class="chart-card">
        <div class="chart-title">Outcomes</div>
        ${generateBarChart(data.outcomes, '#8b5cf6', 6, OUTCOME_ORDER)}
      </div>
    </div>

    ${frictionHtml}

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">Primary Friction Types</div>
        ${generateBarChart(data.friction, '#dc2626')}
      </div>
      <div class="chart-card">
        <div class="chart-title">Inferred Satisfaction (model-estimated)</div>
        ${generateBarChart(data.satisfaction, '#eab308', 6, SATISFACTION_ORDER)}
      </div>
    </div>

    ${suggestionsHtml}

    ${horizonHtml}

    ${funEndingHtml}

    ${teamFeedbackHtml}
  </div>
  <script>${js}</script>
</body>
</html>`
}

// ============================================================================
// Export Types & Functions
// ============================================================================

/**
 * Structured export format for claudescope consumption
 */
// InsightsExport 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
export type InsightsExport = {
  metadata: {
    username: string
    generated_at: string
    claude_code_version: string
    date_range: { start: string; end: string }
    session_count: number
    remote_hosts_collected?: string[]
  }
  aggregated_data: AggregatedData
  insights: InsightResults
  facets_summary?: {
    total: number
    goal_categories: Record<string, number>
    outcomes: Record<string, number>
    satisfaction: Record<string, number>
    friction: Record<string, number>
  }
}

/**
 * Build export data from already-computed values.
 * Used by background upload to S3.
 */
// buildExportData 承担命令处理中的独立步骤，串起斜杠命令 insights需要的输入整理、状态更新和结果输出。
export function buildExportData(
  data: AggregatedData,
  insights: InsightResults,
  facets: Map<string, SessionFacets>,
  remoteStats?: { hosts: RemoteHostInfo[]; totalCopied: number },
): InsightsExport {
  // version记录当前扫描状态，命令处理斜杠命令 insights随后按该状态分支。
  const version = typeof MACRO !== 'undefined' ? MACRO.VERSION : 'unknown'

  // remote_hosts_collected保存`remoteStats?.hosts`，供命令处理斜杠命令 insights后续步骤使用。
  const remote_hosts_collected = remoteStats?.hosts
    // 链式调用 filter，继续加工上一行在命令处理中产生的数据。
    .filter(h => h.sessionCount > 0)
    // 链式调用 map，继续加工上一行在命令处理中产生的数据。
    .map(h => h.name)

  // facets_summary集中保存命令处理斜杠命令 insights要一起传递的字段。
  const facets_summary = {
    total: facets.size,
    goal_categories: {} as Record<string, number>,
    outcomes: {} as Record<string, number>,
    satisfaction: {} as Record<string, number>,
    friction: {} as Record<string, number>,
  }
  // 遍历 const f of facets.values()，按顺序处理命令处理中的批量条目。
  for (const f of facets.values()) {
    // 遍历 const [cat, count] of safeEntries(f.goal_categories)，按顺序处理命令处理中的批量条目。
    for (const [cat, count] of safeEntries(f.goal_categories)) {
      // 满足 `count > 0` 时，命令处理执行该分支。
      if (count > 0) {
        // 斜杠命令 insights处理 `facets_summary.goal_categories[cat] =`，完成这一小步状态转换。
        facets_summary.goal_categories[cat] =
          (facets_summary.goal_categories[cat] || 0) + count
      }
    }
    // 斜杠命令 insights处理 `facets_summary.outcomes[f.outcome] =`，完成这一小步状态转换。
    facets_summary.outcomes[f.outcome] =
      (facets_summary.outcomes[f.outcome] || 0) + 1
    // 遍历 const [level, count] of safeEntries(f.user_satisfaction_counts)，按顺序处理命令处理中的批量条目。
    for (const [level, count] of safeEntries(f.user_satisfaction_counts)) {
      // 满足 `count > 0` 时，命令处理执行该分支。
      if (count > 0) {
        // 斜杠命令 insights处理 `facets_summary.satisfaction[level] =`，完成这一小步状态转换。
        facets_summary.satisfaction[level] =
          (facets_summary.satisfaction[level] || 0) + count
      }
    }
    // 遍历 const [type, count] of safeEntries(f.friction_counts)，按顺序处理命令处理中的批量条目。
    for (const [type, count] of safeEntries(f.friction_counts)) {
      // 满足 `count > 0` 时，命令处理执行该分支。
      if (count > 0) {
        // 斜杠命令 insights处理 `facets_summary.friction[type] =`，完成这一小步状态转换。
        facets_summary.friction[type] =
          (facets_summary.friction[type] || 0) + count
      }
    }
  }

  // 返回 {，把命令处理这个分支的结果交还调用方。
  return {
    metadata: {
      username: process.env.SAFEUSER || process.env.USER || 'unknown',
      generated_at: new Date().toISOString(),
      claude_code_version: version,
      date_range: data.date_range,
      session_count: data.total_sessions,
      ...(remote_hosts_collected &&
        remote_hosts_collected.length > 0 && {
          remote_hosts_collected,
        }),
    },
    aggregated_data: data,
    insights,
    facets_summary,
  }
}

// ============================================================================
// Lite Session Scanning
// ============================================================================

// LiteSessionInfo 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type LiteSessionInfo = {
  sessionId: string
  path: string
  mtime: number
  size: number
}

/**
 * Scans all project directories using filesystem metadata only (no JSONL parsing).
 * Returns a list of session file info sorted by mtime descending.
 * Yields to the event loop between project directories to keep the UI responsive.
 */
// scanAllSessions 承担命令处理中的独立步骤，串起斜杠命令 insights需要的输入整理、状态更新和结果输出。
async function scanAllSessions(): Promise<LiteSessionInfo[]> {
  // projectsDir读取`getProjectsDir`，供命令处理后续处理使用。
  const projectsDir = getProjectsDir()

  // dirents 集合先声明占位，稍后的分支会根据实际输入补齐。
  let dirents: Awaited<ReturnType<typeof readdir>>
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // dirents 集合更新为 `await readdir(projectsDir, { withFileTypes: true })`，确保斜杠命令后续读取最新状态。
    dirents = await readdir(projectsDir, { withFileTypes: true })
  } catch {
    // 返回 []，把命令处理这个分支的结果交还调用方。
    return []
  }

  // projectDirs 集合保存`dirents`，供命令处理斜杠命令 insights后续步骤使用。
  const projectDirs = dirents
    // 链式调用 filter，继续加工上一行在命令处理中产生的数据。
    .filter(dirent => dirent.isDirectory())
    // 链式调用 map，继续加工上一行在命令处理中产生的数据。
    .map(dirent => join(projectsDir, dirent.name))

  // allSessions 集合从空数组开始收集，后续按处理顺序追加条目。
  const allSessions: LiteSessionInfo[] = []

  // 遍历 let i = 0; i < projectDirs.length; i++，让命令处理逐项完成同一类处理。
  for (let i = 0; i < projectDirs.length; i++) {
    // sessionFiles 文件数据读取`getSessionFilesWithMtime`，供命令处理后续处理使用。
    const sessionFiles = await getSessionFilesWithMtime(projectDirs[i]!)
    // 遍历 const [sessionId, fileInfo] of sessionFiles，让命令处理逐项完成同一类处理。
    for (const [sessionId, fileInfo] of sessionFiles) {
      // allSessions 集合追加新条目，保持收集顺序与输入顺序一致。
      allSessions.push({
        sessionId,
        path: fileInfo.path,
        mtime: fileInfo.mtime,
        size: fileInfo.size,
      })
    }
    // Yield to event loop every 10 project directories
    // 满足 `i % 10 === 9` 时，命令处理执行该分支。
    if (i % 10 === 9) {
      // 这个回调绑定到 await new Promise<void>(resolve => setImmediate(resolve))，负责命令处理在该局部场景下的响应。
      await new Promise<void>(resolve => setImmediate(resolve))
    }
  }

  // Sort by mtime descending (most recent first)
  // allSessions.sort执行命令处理在此处需要的副作用或外部交互。
  allSessions.sort((a, b) => b.mtime - a.mtime)
  // 返回 allSessions，把命令处理这个分支的结果交还调用方。
  return allSessions
}

// ============================================================================
// Main Function
// ============================================================================

// generateUsageReport 承担命令处理中的独立步骤，串起斜杠命令 insights需要的输入整理、状态更新和结果输出。
export async function generateUsageReport(options?: {
  collectRemote?: boolean
}): Promise<{
  insights: InsightResults
  htmlPath: string
  data: AggregatedData
  remoteStats?: { hosts: RemoteHostInfo[]; totalCopied: number }
  facets: Map<string, SessionFacets>
}> {
  // remoteStats 集合先声明占位，稍后的分支会根据实际输入补齐。
  let remoteStats: { hosts: RemoteHostInfo[]; totalCopied: number } | undefined

  // Optionally collect data from remote hosts first (ant-only)
  // 只有 `process.env.USER_TYPE === 'ant' && options?.colle` 满足时，命令处理才执行该分支。
  if (process.env.USER_TYPE === 'ant' && options?.collectRemote) {
    // destDir格式化`join`，供命令处理后续处理使用。
    const destDir = join(getClaudeConfigHomeDir(), 'projects')
    // 从 `await collectAllRemoteHostData(destDir)` 解构 hosts、totalCopied，减少斜杠命令 insights对同一对象的重复访问。
    const { hosts, totalCopied } = await collectAllRemoteHostData(destDir)
    // remoteStats 集合更新为 `{ hosts, totalCopied }`，确保斜杠命令后续读取最新状态。
    remoteStats = { hosts, totalCopied }
  }

  // Phase 1: Lite scan — filesystem metadata only (no JSONL parsing)
  // allScannedSessions 集合保存`scanAllSessions`，供命令处理后续处理使用。
  const allScannedSessions = await scanAllSessions()
  // totalSessionsScanned统计`allScannedSessions.length`，供命令处理斜杠命令 insights后续步骤使用。
  const totalSessionsScanned = allScannedSessions.length

  // Phase 2: Load SessionMeta — use cache where available, parse only uncached
  // Read cached metas in parallel batches to avoid blocking the event loop
  // META_BATCH_SIZE保存`50`，供命令处理斜杠命令 insights后续步骤使用。
  const META_BATCH_SIZE = 50
  // MAX_SESSIONS_TO_LOAD保存`200`，供命令处理斜杠命令 insights后续步骤使用。
  const MAX_SESSIONS_TO_LOAD = 200
  // allMetas 集合从空数组开始收集，后续按处理顺序追加条目。
  let allMetas: SessionMeta[] = []
  // uncachedSessions 缓存从空数组开始收集，后续按处理顺序追加条目。
  const uncachedSessions: LiteSessionInfo[] = []

  // 遍历 let i = 0; i < allScannedSessions.length; i += ME，让命令处理逐项完成同一类处理。
  for (let i = 0; i < allScannedSessions.length; i += META_BATCH_SIZE) {
    // batch格式化`allScannedSessions.slice`，供命令处理后续处理使用。
    const batch = allScannedSessions.slice(i, i + META_BATCH_SIZE)
    // results 集合保存`Promise.all`，供命令处理后续处理使用。
    const results = await Promise.all(
      // batch.map执行命令处理在此处需要的副作用或外部交互。
      batch.map(async sessionInfo => ({
        sessionInfo,
        cached: await loadCachedSessionMeta(sessionInfo.sessionId),
      })),
    )
    // 遍历 const { sessionInfo, cached } of results，让命令处理逐项完成同一类处理。
    for (const { sessionInfo, cached } of results) {
      // 满足 `cached` 时，命令处理执行该分支。
      if (cached) {
        // allMetas 集合追加新条目，保持收集顺序与输入顺序一致。
        allMetas.push(cached)
      // `uncachedSessions.length < MAX_SESSIONS_TO_LOAD` 成立时，斜杠命令 insights切换到这个 else-if 分支。
      } else if (uncachedSessions.length < MAX_SESSIONS_TO_LOAD) {
        // uncachedSessions 缓存追加新条目，保持收集顺序与输入顺序一致。
        uncachedSessions.push(sessionInfo)
      }
    }
  }

  // Load full message data only for uncached sessions and compute SessionMeta
  // logsForFacets 集合构建`new Map<string, LogOption>()`，供命令处理斜杠命令 insights后续步骤使用。
  const logsForFacets = new Map<string, LogOption>()

  // Filter out /insights meta-sessions (facet extraction API calls get logged as sessions)
  // isMetaSession记录当前扫描状态，命令处理斜杠命令 insights随后按该状态分支。
  const isMetaSession = (log: LogOption): boolean => {
    // 遍历 const msg of log.messages.slice(0, 5)，按顺序处理命令处理中的批量条目。
    for (const msg of log.messages.slice(0, 5)) {
      // 只有 `msg.type === 'user' && msg.message` 满足时，命令处理才执行该分支。
      if (msg.type === 'user' && msg.message) {
        // content保存`msg.message.content`，供命令处理斜杠命令 insights后续步骤使用。
        const content = msg.message.content
        // `typeof content` 命中特定值 `'string'` 时，进入命令处理对应处理。
        if (typeof content === 'string') {
          // 命令处理在这里按实际状态进入对应分支。
          if (
            content.includes('RESPOND WITH ONLY A VALID JSON OBJECT') ||
            content.includes('record_facets')
          ) {
            // 返回 true，把命令处理这个分支的结果交还调用方。
            return true
          }
        }
      }
    }
    // 返回 false，把命令处理这个分支的结果交还调用方。
    return false
  }

  // Load uncached sessions in batches to yield to event loop between batches
  // LOAD_BATCH_SIZE保存`10`，供命令处理斜杠命令 insights后续步骤使用。
  const LOAD_BATCH_SIZE = 10
  // 遍历 let i = 0; i < uncachedSessions.length; i += LOAD，让命令处理逐项完成同一类处理。
  for (let i = 0; i < uncachedSessions.length; i += LOAD_BATCH_SIZE) {
    // batch格式化`uncachedSessions.slice`，供命令处理后续处理使用。
    const batch = uncachedSessions.slice(i, i + LOAD_BATCH_SIZE)
    // batchResults 集合保存`Promise.all`，供命令处理后续处理使用。
    const batchResults = await Promise.all(
      // batch.map执行命令处理在此处需要的副作用或外部交互。
      batch.map(async sessionInfo => {
        // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
        try {
          // 返回 await loadAllLogsFromSessionFile(sessionInfo.path)，把命令处理这个分支的结果交还调用方。
          return await loadAllLogsFromSessionFile(sessionInfo.path)
        } catch {
          // 返回 []，把命令处理这个分支的结果交还调用方。
          return []
        }
      }),
    )
    // Collect metas synchronously, then save them in parallel (independent writes)
    // metasToSave从空数组开始收集，后续按处理顺序追加条目。
    const metasToSave: SessionMeta[] = []
    // 遍历 const logs of batchResults，让命令处理逐项完成同一类处理。
    for (const logs of batchResults) {
      // 遍历 const log of logs，让命令处理逐项完成同一类处理。
      for (const log of logs) {
        // 判断 isMetaSession(log) || !hasValidDates(log)，将命令处理分流到只适用于该条件的处理路径。
        if (isMetaSession(log) || !hasValidDates(log)) continue
        // meta保存`logToSessionMeta`，供命令处理后续处理使用。
        const meta = logToSessionMeta(log)
        // allMetas 集合追加新条目，保持收集顺序与输入顺序一致。
        allMetas.push(meta)
        // metasToSave追加新条目，保持收集顺序与输入顺序一致。
        metasToSave.push(meta)
        // Keep the log around for potential facet extraction
        // logsForFacets.set写入新的状态值，使命令处理后续读取保持一致。
        logsForFacets.set(meta.session_id, log)
      }
    }
    // 这个回调绑定到 await Promise.all(metasToSave.map(meta => saveSessionMeta(meta)))，负责命令处理在该局部场景下的响应。
    await Promise.all(metasToSave.map(meta => saveSessionMeta(meta)))
  }

  // Deduplicate session branches (keep the one with most user messages per session_id)
  // This prevents inflated totals when a session has multiple conversation branches
  // bestBySession构建`new Map<string, SessionMeta>()`，供命令处理斜杠命令 insights后续步骤使用。
  const bestBySession = new Map<string, SessionMeta>()
  // 遍历 const meta of allMetas，让命令处理逐项完成同一类处理。
  for (const meta of allMetas) {
    // existing读取`bestBySession.get`，供命令处理后续处理使用。
    const existing = bestBySession.get(meta.session_id)
    // 命令处理在这里按实际状态进入对应分支。
    if (
      !existing ||
      meta.user_message_count > existing.user_message_count ||
      (meta.user_message_count === existing.user_message_count &&
        meta.duration_minutes > existing.duration_minutes)
    ) {
      // bestBySession.set写入新的状态值，使命令处理后续读取保持一致。
      bestBySession.set(meta.session_id, meta)
    }
  }
  // Replace allMetas with deduplicated list and remove unused logs from logsForFacets
  // keptSessionIds 集合保存`Set`，供命令处理后续处理使用。
  const keptSessionIds = new Set(bestBySession.keys())
  // allMetas 集合更新为 `[...bestBySession.values()]`，确保斜杠命令后续读取最新状态。
  allMetas = [...bestBySession.values()]
  // 遍历 const sessionId of logsForFacets.keys()，按顺序处理命令处理中的批量条目。
  for (const sessionId of logsForFacets.keys()) {
    // 判断 !keptSessionIds.has(sessionId)，将命令处理分流到只适用于该条件的处理路径。
    if (!keptSessionIds.has(sessionId)) {
      // logsForFacets.delete执行命令处理在此处需要的副作用或外部交互。
      logsForFacets.delete(sessionId)
    }
  }

  // Sort all metas by start_time descending (most recent first)
  // allMetas.sort执行命令处理在此处需要的副作用或外部交互。
  allMetas.sort((a, b) => b.start_time.localeCompare(a.start_time))

  // Pre-filter obviously minimal sessions to save API calls
  // (matching Python's substantive filtering concept)
  // isSubstantiveSession记录当前扫描状态，命令处理斜杠命令 insights随后按该状态分支。
  const isSubstantiveSession = (meta: SessionMeta): boolean => {
    // Skip sessions with very few user messages
    // 判断 meta.user_message_count < 2，将命令处理分流到只适用于该条件的处理路径。
    if (meta.user_message_count < 2) return false
    // Skip very short sessions (< 1 minute)
    // 判断 meta.duration_minutes < 1，将命令处理分流到只适用于该条件的处理路径。
    if (meta.duration_minutes < 1) return false
    // 返回 true，把命令处理这个分支的结果交还调用方。
    return true
  }

  // substantiveMetas 集合筛选`allMetas.filter`，供命令处理后续处理使用。
  const substantiveMetas = allMetas.filter(isSubstantiveSession)

  // Phase 3: Facet extraction — only for sessions without cached facets
  // facets 集合构建`new Map<string, SessionFacets>()`，供命令处理斜杠命令 insights后续步骤使用。
  const facets = new Map<string, SessionFacets>()
  // toExtract从空数组开始收集，后续按处理顺序追加条目。
  const toExtract: Array<{ log: LogOption; sessionId: string }> = []
  // MAX_FACET_EXTRACTIONS 集合保存`50`，供命令处理斜杠命令 insights后续步骤使用。
  const MAX_FACET_EXTRACTIONS = 50

  // Load cached facets for all substantive sessions in parallel
  // cachedFacetResults 缓存保存`Promise.all`，供命令处理后续处理使用。
  const cachedFacetResults = await Promise.all(
    // substantiveMetas.map执行命令处理在此处需要的副作用或外部交互。
    substantiveMetas.map(async meta => ({
      sessionId: meta.session_id,
      cached: await loadCachedFacets(meta.session_id),
    })),
  )
  // 遍历 const { sessionId, cached } of cachedFacetResults，让命令处理逐项完成同一类处理。
  for (const { sessionId, cached } of cachedFacetResults) {
    // 满足 `cached` 时，命令处理执行该分支。
    if (cached) {
      // facets.set写入新的状态值，使命令处理后续读取保持一致。
      facets.set(sessionId, cached)
    } else {
      // log读取`logsForFacets.get`，供命令处理后续处理使用。
      const log = logsForFacets.get(sessionId)
      // 只有 `log && toExtract.length < MAX_FACET_EXTRACTIONS` 满足时，命令处理才执行该分支。
      if (log && toExtract.length < MAX_FACET_EXTRACTIONS) {
        // toExtract追加新条目，保持收集顺序与输入顺序一致。
        toExtract.push({ log, sessionId })
      }
    }
  }

  // Extract facets for sessions that need them (50 concurrent)
  // CONCURRENCY保存`50`，供命令处理斜杠命令 insights后续步骤使用。
  const CONCURRENCY = 50
  // 遍历 let i = 0; i < toExtract.length; i += CONCURRENCY，让命令处理逐项完成同一类处理。
  for (let i = 0; i < toExtract.length; i += CONCURRENCY) {
    // batch格式化`toExtract.slice`，供命令处理后续处理使用。
    const batch = toExtract.slice(i, i + CONCURRENCY)
    // results 集合保存`Promise.all`，供命令处理后续处理使用。
    const results = await Promise.all(
      // batch.map执行命令处理在此处需要的副作用或外部交互。
      batch.map(async ({ log, sessionId }) => {
        // newFacets 集合保存`extractFacetsFromAPI`，供命令处理后续处理使用。
        const newFacets = await extractFacetsFromAPI(log, sessionId)
        // 返回 { sessionId, newFacets }，把命令处理这个分支的结果交还调用方。
        return { sessionId, newFacets }
      }),
    )
    // Collect facets synchronously, save in parallel (independent writes)
    // facetsToSave从空数组开始收集，后续按处理顺序追加条目。
    const facetsToSave: SessionFacets[] = []
    // 遍历 const { sessionId, newFacets } of results，让命令处理逐项完成同一类处理。
    for (const { sessionId, newFacets } of results) {
      // 满足 `newFacets` 时，命令处理执行该分支。
      if (newFacets) {
        // facets.set写入新的状态值，使命令处理后续读取保持一致。
        facets.set(sessionId, newFacets)
        // facetsToSave追加新条目，保持收集顺序与输入顺序一致。
        facetsToSave.push(newFacets)
      }
    }
    // 这个回调绑定到 await Promise.all(facetsToSave.map(f => saveFacets(f)))，负责命令处理在该局部场景下的响应。
    await Promise.all(facetsToSave.map(f => saveFacets(f)))
  }

  // Filter out warmup/minimal sessions (matching Python's is_minimal)
  // A session is minimal if warmup_minimal is the ONLY goal category
  // isMinimalSession记录当前扫描状态，命令处理斜杠命令 insights随后按该状态分支。
  const isMinimalSession = (sessionId: string): boolean => {
    // sessionFacets 集合读取`facets.get`，供命令处理后续处理使用。
    const sessionFacets = facets.get(sessionId)
    // 判断 !sessionFacets，将命令处理分流到只适用于该条件的处理路径。
    if (!sessionFacets) return false
    // cats 集合保存`sessionFacets.goal_categories`，供命令处理斜杠命令 insights后续步骤使用。
    const cats = sessionFacets.goal_categories
    // catKeys 集合保存`safeKeys`，供命令处理后续处理使用。
    const catKeys = safeKeys(cats).filter(k => (cats[k] ?? 0) > 0)
    // 返回 catKeys.length === 1 && catKeys[0] === 'warmup_minimal'，把命令处理这个分支的结果交还调用方。
    return catKeys.length === 1 && catKeys[0] === 'warmup_minimal'
  }

  // substantiveSessions 集合筛选`substantiveMetas.filter`，供命令处理后续处理使用。
  const substantiveSessions = substantiveMetas.filter(
    // s 集合更新为 `> !isMinimalSession(s.session_id)`，确保斜杠命令后续读取最新状态。
    s => !isMinimalSession(s.session_id),
  )

  // substantiveFacets 集合构建`new Map<string, SessionFacets>()`，供命令处理斜杠命令 insights后续步骤使用。
  const substantiveFacets = new Map<string, SessionFacets>()
  // 遍历 const [sessionId, f] of facets，让命令处理逐项完成同一类处理。
  for (const [sessionId, f] of facets) {
    // 判断 !isMinimalSession(sessionId)，将命令处理分流到只适用于该条件的处理路径。
    if (!isMinimalSession(sessionId)) {
      // substantiveFacets.set写入新的状态值，使命令处理后续读取保持一致。
      substantiveFacets.set(sessionId, f)
    }
  }

  // aggregated保存`aggregateData`，供命令处理后续处理使用。
  const aggregated = aggregateData(substantiveSessions, substantiveFacets)
  // total_sessions_scanned更新为 `totalSessionsScanned`，确保斜杠命令后续读取最新状态。
  aggregated.total_sessions_scanned = totalSessionsScanned

  // Generate parallel insights from Claude (6 sections)
  // insights 集合保存`generateParallelInsights`，供命令处理后续处理使用。
  const insights = await generateParallelInsights(aggregated, facets)

  // Generate HTML report
  // htmlReport保存`generateHtmlReport`，供命令处理后续处理使用。
  const htmlReport = generateHtmlReport(aggregated, insights)

  // Save reports
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `mkdir(getDataDir(), { recursive: true })` 完成，再继续斜杠命令 insights的异步流程。
    await mkdir(getDataDir(), { recursive: true })
  } catch {
    // Directory may already exist
  }

  // htmlPath 文件数据格式化`join`，供命令处理后续处理使用。
  const htmlPath = join(getDataDir(), 'report.html')
  // 等待 `writeFile(htmlPath, htmlReport, {` 完成，再继续斜杠命令 insights的异步流程。
  await writeFile(htmlPath, htmlReport, {
    encoding: 'utf-8',
    mode: 0o600,
  })

  // 返回 {，把命令处理这个分支的结果交还调用方。
  return {
    insights,
    htmlPath,
    data: aggregated,
    remoteStats,
    facets: substantiveFacets,
  }
}

// safeEntries 承担命令处理中的独立步骤，串起斜杠命令 insights需要的输入整理、状态更新和结果输出。
function safeEntries<V>(
  obj: Record<string, V> | undefined | null,
): [string, V][] {
  // 返回 obj ? Object.entries(obj) : []，把命令处理这个分支的结果交还调用方。
  return obj ? Object.entries(obj) : []
}

// safeKeys 承担命令处理中的独立步骤，串起斜杠命令 insights需要的输入整理、状态更新和结果输出。
function safeKeys(obj: Record<string, unknown> | undefined | null): string[] {
  // 返回 obj ? Object.keys(obj) : []，把命令处理这个分支的结果交还调用方。
  return obj ? Object.keys(obj) : []
}

// ============================================================================
// Command Definition
// ============================================================================

// usageReport集中保存斜杠命令 insights要一起传递的字段。
const usageReport: Command = {
  type: 'prompt',
  name: 'insights',
  description: 'Generate a report analyzing your Claude Code sessions',
  contentLength: 0, // Dynamic content
  progressMessage: 'analyzing your sessions',
  source: 'builtin',
  // getPromptForCommand 根据 args 读取或计算命令处理需要的结果。
  async getPromptForCommand(args) {
    // collectRemote记录当前扫描状态，命令处理斜杠命令 insights随后按该状态分支。
    let collectRemote = false
    // remoteHosts 集合从空数组开始收集，后续按处理顺序追加条目。
    let remoteHosts: string[] = []
    // hasRemoteHosts 集合记录当前扫描状态，命令处理斜杠命令 insights随后按该状态分支。
    let hasRemoteHosts = false

    // `process.env.USER_TYPE` 命中特定值 `'ant'` 时，进入命令处理对应处理。
    if (process.env.USER_TYPE === 'ant') {
      // Parse --homespaces flag
      // collectRemote更新为 `args?.includes('--homespaces') ?? false`，确保斜杠命令后续读取最新状态。
      collectRemote = args?.includes('--homespaces') ?? false

      // Check for available remote hosts
      // remoteHosts 集合更新为 `await getRunningRemoteHosts()`，确保斜杠命令后续读取最新状态。
      remoteHosts = await getRunningRemoteHosts()
      // hasRemoteHosts 集合更新为 `remoteHosts.length > 0`，确保斜杠命令后续读取最新状态。
      hasRemoteHosts = remoteHosts.length > 0

      // Show collection message if collecting
      // 只有 `collectRemote && hasRemoteHosts` 满足时，命令处理才执行该分支。
      if (collectRemote && hasRemoteHosts) {
        // biome-ignore lint/suspicious/noConsole: intentional
        // console.error执行命令处理在此处需要的副作用或外部交互。
        console.error(
          `Collecting sessions from ${remoteHosts.length} homespace(s): ${remoteHosts.join(', ')}...`,
        )
      }
    }

    // 从 `await generateUsageReport(` 解构 insights、htmlPath、data、remoteStats，减少斜杠命令 insights对同一对象的重复访问。
    const { insights, htmlPath, data, remoteStats } = await generateUsageReport(
      { collectRemote },
    )

    // reportUrl保存``file://${htmlPath}``，供命令处理斜杠命令 insights后续步骤使用。
    let reportUrl = `file://${htmlPath}`
    // uploadHint固定为 `''`，作为命令处理斜杠命令 insights后续展示或比较的基准。
    let uploadHint = ''

    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，命令处理执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // Try to upload to S3
      // timestamp记录时间`Date`，供命令处理后续处理使用。
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .slice(0, 15)
      // username 来自环境变量默认值，运行参数仍可在入口处覆盖。
      const username = process.env.SAFEUSER || process.env.USER || 'unknown'
      // filename 文件数据保存``${username}_insights_${timestamp}.html``，作为后续固定文本处理的输入。
      const filename = `${username}_insights_${timestamp}.html`
      // s3Path 路径数据保存``s3://anthropic-serve/atamkin/cc-user-reports/${filename}``，作为后续固定文本处理的输入。
      const s3Path = `s3://anthropic-serve/atamkin/cc-user-reports/${filename}`
      // s3Url固定为 ``https://s3-frontend.infra.ant.dev/anthropic-serve/atamki...`，作为命令处理斜杠命令 insights后续展示或比较的基准。
      const s3Url = `https://s3-frontend.infra.ant.dev/anthropic-serve/atamkin/cc-user-reports/${filename}`

      // reportUrl更新为 `s3Url`，确保斜杠命令后续读取最新状态。
      reportUrl = s3Url
      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // 调用 execFileSync，触发命令处理此处需要的副作用。
        execFileSync('ff', ['cp', htmlPath, s3Path], {
          timeout: 60000,
          stdio: 'pipe', // Suppress output
        })
      } catch {
        // Upload failed - fall back to local file and show upload command
        // reportUrl更新为 ``file://${htmlPath}``，确保斜杠命令后续读取最新状态。
        reportUrl = `file://${htmlPath}`
        // uploadHint更新为 ``\nAutomatic upload failed. Are you on the boron namespac...`，确保斜杠命令后续读取最新状态。
        uploadHint = `\nAutomatic upload failed. Are you on the boron namespace? Try \`use-bo\` and ensure you've run \`sso\`.
To share, run: ff cp ${htmlPath} ${s3Path}
Then access at: ${s3Url}`
      }
    }

    // Build header with stats
    // sessionLabel 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const sessionLabel =
      data.total_sessions_scanned &&
      data.total_sessions_scanned > data.total_sessions
        ? `${data.total_sessions_scanned.toLocaleString()} sessions total · ${data.total_sessions} analyzed`
        : `${data.total_sessions} sessions`
    // stats 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const stats = [
      sessionLabel,
      `${data.total_messages.toLocaleString()} messages`,
      `${Math.round(data.total_duration_hours)}h`,
      `${data.git_commits} commits`,
    ].join(' · ')

    // Build remote host info (ant-only)
    // remoteInfo保存`''`，作为后续固定文本处理的输入。
    let remoteInfo = ''
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，命令处理执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 只有 `remoteStats && remoteStats.totalCopied > 0` 满足时，命令处理才执行该分支。
      if (remoteStats && remoteStats.totalCopied > 0) {
        // hsNames 集合保存`remoteStats.hosts`，供后续判断或组装使用。
        const hsNames = remoteStats.hosts
          // 链式调用 filter，继续加工上一行在命令处理中产生的数据。
          .filter(h => h.sessionCount > 0)
          // 链式调用 map，继续加工上一行在命令处理中产生的数据。
          .map(h => h.name)
          .join(', ')
        // remoteInfo更新为 ``\n_Collected ${remoteStats.totalCopied} new sessions fro...`，确保斜杠命令后续读取最新状态。
        remoteInfo = `\n_Collected ${remoteStats.totalCopied} new sessions from: ${hsNames}_\n`
      // 斜杠命令 insights在这里处理 `} else if (!collectRemote && hasRemoteHosts) {`，完成这一小步状态转换。
      } else if (!collectRemote && hasRemoteHosts) {
        // Suggest using --homespaces if they have remote hosts but didn't use the flag
        // remoteInfo更新为 ``\n_Tip: Run \`/insights --homespaces\` to include sessio...`，确保斜杠命令后续读取最新状态。
        remoteInfo = `\n_Tip: Run \`/insights --homespaces\` to include sessions from your ${remoteHosts.length} running homespace(s)_\n`
      }
    }

    // Build markdown summary from insights
    // atAGlance 命名 `insights.at_a_glance`，让后续代码直接表达这个值的用途。
    const atAGlance = insights.at_a_glance
    // summaryText保存`atAGlance`，供后续判断或组装使用。
    const summaryText = atAGlance
      ? `## At a Glance

${atAGlance.whats_working ? `**What's working:** ${atAGlance.whats_working} See _Impressive Things You Did_.` : ''}

${atAGlance.whats_hindering ? `**What's hindering you:** ${atAGlance.whats_hindering} See _Where Things Go Wrong_.` : ''}

${atAGlance.quick_wins ? `**Quick wins to try:** ${atAGlance.quick_wins} See _Features to Try_.` : ''}

${atAGlance.ambitious_workflows ? `**Ambitious workflows:** ${atAGlance.ambitious_workflows} See _On the Horizon_.` : ''}`
      : '_No insights generated_'

    const header = `# Claude Code Insights

${stats}
${data.date_range.start} to ${data.date_range.end}
${remoteInfo}
`

    // userSummary保存``${header}${summaryText}`，作为后续固定文本处理的输入。
    const userSummary = `${header}${summaryText}

Your full shareable insights report is ready: ${reportUrl}${uploadHint}`

    // Return prompt for Claude to respond to
    // 返回列表结果，保留命令处理已经排好的条目顺序。
    return [
      {
        type: 'text',
        text: `The user just ran /insights to generate a usage report analyzing their Claude Code sessions.

Here is the full insights data:
${jsonStringify(insights, null, 2)}

Report URL: ${reportUrl}
HTML file: ${htmlPath}
Facets directory: ${getFacetsDir()}

Here is what the user sees:
${userSummary}

Now output the following message exactly:

<message>
Your shareable insights report is ready:
${reportUrl}${uploadHint}

Want to dig into any section or try one of the suggestions?
</message>`,
      },
    ]
  },
}

// isValidSessionFacets 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isValidSessionFacets(obj: unknown): obj is SessionFacets {
  // `!obj || typeof obj` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!obj || typeof obj !== 'object') return false
  // o保存`obj as Record<string, unknown>`，供后续判断或组装使用。
  const o = obj as Record<string, unknown>
  // 返回 `(`，作为命令处理这次计算的结果。
  return (
    typeof o.underlying_goal === 'string' &&
    typeof o.outcome === 'string' &&
    typeof o.brief_summary === 'string' &&
    o.goal_categories !== null &&
    typeof o.goal_categories === 'object' &&
    o.user_satisfaction_counts !== null &&
    typeof o.user_satisfaction_counts === 'object' &&
    o.friction_counts !== null &&
    typeof o.friction_counts === 'object'
  )
}

export default usageReport
