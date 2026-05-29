// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 类型依赖 { MCPServerConnection } 来自 ../../services/mcp/types.js，用于校准schedule Remote Agents的数据契约。
import type { MCPServerConnection } from '../../services/mcp/types.js'
// 接入 isPolicyAllowed 服务层能力，把外部通信或共享状态交给 ../../services/policyLimits/index.js 处理。
import { isPolicyAllowed } from '../../services/policyLimits/index.js'
// 类型依赖 { ToolUseContext } 来自 ../../Tool.js，用于校准schedule Remote Agents的数据契约。
import type { ToolUseContext } from '../../Tool.js'
// 接入 ASK_USER_QUESTION_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ASK_USER_QUESTION_TOOL_NAME } from '../../tools/AskUserQuestionTool/prompt.js'
// 接入 REMOTE_TRIGGER_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { REMOTE_TRIGGER_TOOL_NAME } from '../../tools/RemoteTriggerTool/prompt.js'
// 复用 getClaudeAIOAuthTokens 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getClaudeAIOAuthTokens } from '../../utils/auth.js'
// 复用 checkRepoForRemoteAccess 工具函数，把通用处理留在 ../../utils/background/remote/preconditions.js 中维护。
import { checkRepoForRemoteAccess } from '../../utils/background/remote/preconditions.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 整理这一组导入，让schedule Remote Agents后续逻辑可以直接复用这些外部能力。
import {
  detectCurrentRepositoryWithHost,
  parseGitRemote,
} from '../../utils/detectRepository.js'
// 复用 getRemoteUrl 工具函数，把通用处理留在 ../../utils/git.js 中维护。
import { getRemoteUrl } from '../../utils/git.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让schedule Remote Agents后续逻辑可以直接复用这些外部能力。
import {
  createDefaultCloudEnvironment,
  type EnvironmentResource,
  fetchEnvironments,
} from '../../utils/teleport/environments.js'
// 引入 registerBundledSkill，将 ../bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { registerBundledSkill } from '../bundledSkills.js'

// Base58 alphabet (Bitcoin-style) used by the tagged ID system
// BASE58保存`'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwx...`，作为后续固定文本处理的输入。
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

/**
 * Decode a mcpsrv_ tagged ID to a UUID string.
 * Tagged IDs have format: mcpsrv_01{base58(uuid.int)}
 * where 01 is the version prefix.
 *
 * TODO(public-ship): Before shipping publicly, the /v1/mcp_servers endpoint
 * should return the raw UUID directly so we don't need this client-side decoding.
 * The tagged ID format is an internal implementation detail that could change.
 */
// taggedIdToUUID 封装scheduleRemoteAgents的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function taggedIdToUUID(taggedId: string): string | null {
  // prefix 命名 `'mcpsrv_'`，让后续代码直接表达这个值的用途。
  const prefix = 'mcpsrv_'
  // 满足 `!taggedId.startsWith(prefix)` 时，schedule Remote Agents执行该分支。
  if (!taggedId.startsWith(prefix)) {
    // 返回 `null`，作为schedule Remote Agents这次计算的结果。
    return null
  }
  // rest格式化`taggedId.slice`，供schedule Remote Agents后续处理使用。
  const rest = taggedId.slice(prefix.length)
  // Skip version prefix (2 chars, always "01")
  // base58Data格式化`rest.slice`，供schedule Remote Agents后续处理使用。
  const base58Data = rest.slice(2)

  // Decode base58 to bigint
  // n 命名 `0n`，让后续代码直接表达这个值的用途。
  let n = 0n
  // 按顺序遍历 `base58Data` 中的c，逐个交给schedule Remote Agents处理。
  for (const c of base58Data) {
    // idx保存`BASE58.indexOf`，供schedule Remote Agents后续处理使用。
    const idx = BASE58.indexOf(c)
    // 满足 `idx === -1` 时，schedule Remote Agents执行该分支。
    if (idx === -1) {
      // 返回 `null`，作为schedule Remote Agents这次计算的结果。
      return null
    }
    // n更新为 `n * 58n + BigInt(idx)`，确保scheduleRemoteAgents后续读取最新状态。
    n = n * 58n + BigInt(idx)
  }

  // Convert to UUID hex string
  // hex格式化`n.toString`，供schedule Remote Agents后续处理使用。
  const hex = n.toString(16).padStart(32, '0')
  // 返回 ``${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slic...`，作为schedule Remote Agents这次计算的结果。
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

// ConnectorInfo 固化schedule Remote Agents里传递的数据形状，帮助调用方按同一结构读写字段。
type ConnectorInfo = {
  uuid: string
  name: string
  url: string
}

// getConnectedClaudeAIConnectors 封装scheduleRemoteAgents的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConnectedClaudeAIConnectors(
  mcpClients: MCPServerConnection[],
): ConnectorInfo[] {
  // connectors 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const connectors: ConnectorInfo[] = []
  // 按顺序遍历 `mcpClients` 中的API 客户端，逐个交给schedule Remote Agents处理。
  for (const client of mcpClients) {
    // `client.type` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (client.type !== 'connected') {
      // 跳过当前项，继续处理schedule Remote Agents中的下一轮循环。
      continue
    }
    // `client.config.type` 与 `'claudeai-proxy'` 不一致时刷新派生状态，避免使用过期结果。
    if (client.config.type !== 'claudeai-proxy') {
      // 跳过当前项，继续处理schedule Remote Agents中的下一轮循环。
      continue
    }
    // uuid保存`taggedIdToUUID`，供schedule Remote Agents后续处理使用。
    const uuid = taggedIdToUUID(client.config.id)
    // uuid缺失时提前走兜底路径，避免schedule Remote Agents继续依赖无效输入。
    if (!uuid) {
      // 跳过当前项，继续处理schedule Remote Agents中的下一轮循环。
      continue
    }
    // connectors 集合追加新条目，保持收集顺序与输入顺序一致。
    connectors.push({
      uuid,
      name: client.name,
      url: client.config.url,
    })
  }
  // 返回 `connectors`，作为schedule Remote Agents这次计算的结果。
  return connectors
}

// sanitizeConnectorName 封装scheduleRemoteAgents的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sanitizeConnectorName(name: string): string {
  // 返回 `name`，作为schedule Remote Agents这次计算的结果。
  return name
    .replace(/^claude[.\s-]ai[.\s-]/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// formatConnectorsInfo 封装scheduleRemoteAgents的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatConnectorsInfo(connectors: ConnectorInfo[]): string {
  // connectors 集合为空时立即返回或跳过，避免schedule Remote Agents把空集合当成可处理内容。
  if (connectors.length === 0) {
    // 返回 `'No connected MCP connectors found. The user may need to connect server...`，作为schedule Remote Agents这次计算的结果。
    return 'No connected MCP connectors found. The user may need to connect servers at https://claude.ai/settings/connectors'
  }
  // 文本行保存`connectors`，供schedule Remote Agents后续处理使用。
  const lines = ['Connected connectors (available for triggers):']
  // 按顺序遍历 `connectors` 中的c，逐个交给schedule Remote Agents处理。
  for (const c of connectors) {
    // safeName保存`sanitizeConnectorName`，供schedule Remote Agents后续处理使用。
    const safeName = sanitizeConnectorName(c.name)
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(
      `- ${c.name} (connector_uuid: ${c.uuid}, name: ${safeName}, url: ${c.url})`,
    )
  }
  // 返回 `lines.join('\n')`，作为schedule Remote Agents这次计算的结果。
  return lines.join('\n')
}

// BASE_QUESTION 命名 `'What would you like to do with scheduled remote agents?'`，让后续代码直接表达这个值的用途。
const BASE_QUESTION = 'What would you like to do with scheduled remote agents?'

/**
 * Formats setup notes as a bulleted Heads-up block. Shared between the
 * initial AskUserQuestion dialog text (no-args path) and the prompt-body
 * section (args path) so notes are never silently dropped.
 */
// formatSetupNotes 封装scheduleRemoteAgents的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatSetupNotes(notes: string[]): string {
  // items 集合派生`notes.map`，供schedule Remote Agents后续处理使用。
  const items = notes.map(n => `- ${n}`).join('\n')
  // 返回 ``⚠ Heads-up:\n${items}``，作为schedule Remote Agents这次计算的结果。
  return `⚠ Heads-up:\n${items}`
}

// getCurrentRepoHttpsUrl 封装scheduleRemoteAgents的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getCurrentRepoHttpsUrl(): Promise<string | null> {
  // remoteUrl读取`getRemoteUrl`，供schedule Remote Agents后续处理使用。
  const remoteUrl = await getRemoteUrl()
  // remoteUrl缺失时提前走兜底路径，避免schedule Remote Agents继续依赖无效输入。
  if (!remoteUrl) {
    // 返回 `null`，作为schedule Remote Agents这次计算的结果。
    return null
  }
  // 解析结果解析`parseGitRemote`，供schedule Remote Agents后续处理使用。
  const parsed = parseGitRemote(remoteUrl)
  // 解析结果缺失时提前走兜底路径，避免schedule Remote Agents继续依赖无效输入。
  if (!parsed) {
    // 返回 `null`，作为schedule Remote Agents这次计算的结果。
    return null
  }
  // 返回 ``https://${parsed.host}/${parsed.owner}/${parsed.name}``，作为schedule Remote Agents这次计算的结果。
  return `https://${parsed.host}/${parsed.owner}/${parsed.name}`
}

// buildPrompt 封装scheduleRemoteAgents的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildPrompt(opts: {
  userTimezone: string
  connectorsInfo: string
  gitRepoUrl: string | null
  environmentsInfo: string
  createdEnvironment: EnvironmentResource | null
  setupNotes: string[]
  needsGitHubAccessReminder: boolean
  userArgs: string
}): string {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    userTimezone,
    connectorsInfo,
    gitRepoUrl,
    environmentsInfo,
    createdEnvironment,
    setupNotes,
    needsGitHubAccessReminder,
    userArgs,
  } = opts
  // When the user passes args, the initial AskUserQuestion dialog is skipped.
  // Setup notes must surface in the prompt body instead, otherwise they're
  // computed and silently discarded (regression vs. the old hard-block).
  // setupNotesSection 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const setupNotesSection =
    userArgs && setupNotes.length > 0
      ? `\n## Setup Notes\n\n${formatSetupNotes(setupNotes)}\n`
      : ''
  // initialQuestion 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const initialQuestion =
    setupNotes.length > 0
      ? `${formatSetupNotes(setupNotes)}\n\n${BASE_QUESTION}`
      : BASE_QUESTION
  // firstStep 命名 `userArgs`，让后续代码直接表达这个值的用途。
  const firstStep = userArgs
    ? `The user has already told you what they want (see User Request at the bottom). Skip the initial question and go directly to the matching workflow.`
    : `Your FIRST action must be a single ${ASK_USER_QUESTION_TOOL_NAME} tool call (no preamble). Use this EXACT string for the \`question\` field — do not paraphrase or shorten it:

${jsonStringify(initialQuestion)}

Set \`header: "Action"\` and offer the four actions (create/list/update/run) as options. After the user picks, follow the matching workflow below.`

  // 返回 ``# Schedule Remote Agents`，作为schedule Remote Agents这次计算的结果。
  return `# Schedule Remote Agents

You are helping the user schedule, update, list, or run **remote** Claude Code agents. These are NOT local cron jobs — each trigger spawns a fully isolated remote session (CCR) in Anthropic's cloud infrastructure on a cron schedule. The agent runs in a sandboxed environment with its own git checkout, tools, and optional MCP connections.

## First Step

${firstStep}
${setupNotesSection}

## What You Can Do

Use the \`${REMOTE_TRIGGER_TOOL_NAME}\` tool (load it first with \`ToolSearch select:${REMOTE_TRIGGER_TOOL_NAME}\`; auth is handled in-process — do not use curl):

- \`{action: "list"}\` — list all triggers
- \`{action: "get", trigger_id: "..."}\` — fetch one trigger
- \`{action: "create", body: {...}}\` — create a trigger
- \`{action: "update", trigger_id: "...", body: {...}}\` — partial update
- \`{action: "run", trigger_id: "..."}\` — run a trigger now

You CANNOT delete triggers. If the user asks to delete, direct them to: https://claude.ai/code/scheduled

## Create body shape

\`\`\`json
{
  "name": "AGENT_NAME",
  "cron_expression": "CRON_EXPR",
  "enabled": true,
  "job_config": {
    "ccr": {
      "environment_id": "ENVIRONMENT_ID",
      "session_context": {
        "model": "claude-sonnet-4-6",
        "sources": [
          {"git_repository": {"url": "${gitRepoUrl || 'https://github.com/ORG/REPO'}"}}
        ],
        "allowed_tools": ["Bash", "Read", "Write", "Edit", "Glob", "Grep"]
      },
      "events": [
        {"data": {
          "uuid": "<lowercase v4 uuid>",
          "session_id": "",
          "type": "user",
          "parent_tool_use_id": null,
          "message": {"content": "PROMPT_HERE", "role": "user"}
        }}
      ]
    }
  }
}
\`\`\`

Generate a fresh lowercase UUID for \`events[].data.uuid\` yourself.

## Available MCP Connectors

These are the user's currently connected claude.ai MCP connectors:

${connectorsInfo}

When attaching connectors to a trigger, use the \`connector_uuid\` and \`name\` shown above (the name is already sanitized to only contain letters, numbers, hyphens, and underscores), and the connector's URL. The \`name\` field in \`mcp_connections\` must only contain \`[a-zA-Z0-9_-]\` — dots and spaces are NOT allowed.

**Important:** Infer what services the agent needs from the user's description. For example, if they say "check Datadog and Slack me errors," the agent needs both Datadog and Slack connectors. Cross-reference against the list above and warn if any required service isn't connected. If a needed connector is missing, direct the user to https://claude.ai/settings/connectors to connect it first.

## Environments

Every trigger requires an \`environment_id\` in the job config. This determines where the remote agent runs. Ask the user which environment to use.

${environmentsInfo}

Use the \`id\` value as the \`environment_id\` in \`job_config.ccr.environment_id\`.
${createdEnvironment ? `\n**Note:** A new environment \`${createdEnvironment.name}\` (id: \`${createdEnvironment.environment_id}\`) was just created for the user because they had none. Use this id for \`job_config.ccr.environment_id\` and mention the creation when you confirm the trigger config.\n` : ''}

## API Field Reference

### Create Trigger — Required Fields
- \`name\` (string) — A descriptive name
- \`cron_expression\` (string) — 5-field cron. **Minimum interval is 1 hour.**
- \`job_config\` (object) — Session configuration (see structure above)

### Create Trigger — Optional Fields
- \`enabled\` (boolean, default: true)
- \`mcp_connections\` (array) — MCP servers to attach:
  \`\`\`json
  [{"connector_uuid": "uuid", "name": "server-name", "url": "https://..."}]
  \`\`\`

### Update Trigger — Optional Fields
All fields optional (partial update):
- \`name\`, \`cron_expression\`, \`enabled\`, \`job_config\`
- \`mcp_connections\` — Replace MCP connections
- \`clear_mcp_connections\` (boolean) — Remove all MCP connections

### Cron Expression Examples

The user's local timezone is **${userTimezone}**. Cron expressions are always in UTC. When the user says a local time, convert it to UTC for the cron expression but confirm with them: "9am ${userTimezone} = Xam UTC, so the cron would be \`0 X * * 1-5\`."

- \`0 9 * * 1-5\` — Every weekday at 9am **UTC**
- \`0 */2 * * *\` — Every 2 hours
- \`0 0 * * *\` — Daily at midnight **UTC**
- \`30 14 * * 1\` — Every Monday at 2:30pm **UTC**
- \`0 8 1 * *\` — First of every month at 8am **UTC**

Minimum interval is 1 hour. \`*/30 * * * *\` will be rejected.

## Workflow

### CREATE a new trigger:

1. **Understand the goal** — Ask what they want the remote agent to do. What repo(s)? What task? Remind them that the agent runs remotely — it won't have access to their local machine, local files, or local environment variables.
2. **Craft the prompt** — Help them write an effective agent prompt. Good prompts are:
   - Specific about what to do and what success looks like
   - Clear about which files/areas to focus on
   - Explicit about what actions to take (open PRs, commit, just analyze, etc.)
3. **Set the schedule** — Ask when and how often. The user's timezone is ${userTimezone}. When they say a time (e.g., "every morning at 9am"), assume they mean their local time and convert to UTC for the cron expression. Always confirm the conversion: "9am ${userTimezone} = Xam UTC."
4. **Choose the model** — Default to \`claude-sonnet-4-6\`. Tell the user which model you're defaulting to and ask if they want a different one.
5. **Validate connections** — Infer what services the agent will need from the user's description. For example, if they say "check Datadog and Slack me errors," the agent needs both Datadog and Slack MCP connectors. Cross-reference with the connectors list above. If any are missing, warn the user and link them to https://claude.ai/settings/connectors to connect first.${gitRepoUrl ? ` The default git repo is already set to \`${gitRepoUrl}\`. Ask the user if this is the right repo or if they need a different one.` : ' Ask which git repos the remote agent needs cloned into its environment.'}
6. **Review and confirm** — Show the full configuration before creating. Let them adjust.
7. **Create it** \u2014 Call \`${REMOTE_TRIGGER_TOOL_NAME}\` with \`action: "create"\` and show the result. The response includes the trigger ID. Always output a link at the end: \`https://claude.ai/code/scheduled/{TRIGGER_ID}\`

### UPDATE a trigger:

1. List triggers first so they can pick one
2. Ask what they want to change
3. Show current vs proposed value
4. Confirm and update

### LIST triggers:

1. Fetch and display in a readable format
2. Show: name, schedule (human-readable), enabled/disabled, next run, repo(s)

### RUN NOW:

1. List triggers if they haven't specified which one
2. Confirm which trigger
3. Execute and confirm

## Important Notes

- These are REMOTE agents — they run in Anthropic's cloud, not on the user's machine. They cannot access local files, local services, or local environment variables.
- Always convert cron to human-readable when displaying
- Default to \`enabled: true\` unless user says otherwise
- Accept GitHub URLs in any format (https://github.com/org/repo, org/repo, etc.) and normalize to the full HTTPS URL (without .git suffix)
- The prompt is the most important part — spend time getting it right. The remote agent starts with zero context, so the prompt must be self-contained.
- To delete a trigger, direct users to https://claude.ai/code/scheduled
${needsGitHubAccessReminder ? `- If the user's request seems to require GitHub repo access (e.g. cloning a repo, opening PRs, reading code), remind them that ${getFeatureValue_CACHED_MAY_BE_STALE('tengu_cobalt_lantern', false) ? "they should run /web-setup to connect their GitHub account (or install the Claude GitHub App on the repo as an alternative) — otherwise the remote agent won't be able to access it" : "they need the Claude GitHub App installed on the repo — otherwise the remote agent won't be able to access it"}.` : ''}
${userArgs ? `\n## User Request\n\nThe user said: "${userArgs}"\n\nStart by understanding their intent and working through the appropriate workflow above.` : ''}`
}

export function registerScheduleRemoteAgentsSkill(): void {
  registerBundledSkill({
    name: 'schedule',
    description:
      'Create, update, list, or run scheduled remote agents (triggers) that execute on a cron schedule.',
    whenToUse:
      'When the user wants to schedule a recurring remote agent, set up automated tasks, create a cron job for Claude Code, or manage their scheduled agents/triggers.',
    userInvocable: true,
    isEnabled: () =>
      getFeatureValue_CACHED_MAY_BE_STALE('tengu_surreal_dali', false) &&
      isPolicyAllowed('allow_remote_sessions'),
    allowedTools: [REMOTE_TRIGGER_TOOL_NAME, ASK_USER_QUESTION_TOOL_NAME],
    async getPromptForCommand(args: string, context: ToolUseContext) {
      if (!getClaudeAIOAuthTokens()?.accessToken) {
        return [
          {
            type: 'text',
            text: 'You need to authenticate with a claude.ai account first. API accounts are not supported. Run /login, then try /schedule again.',
          },
        ]
      }

      let environments: EnvironmentResource[]
      try {
        environments = await fetchEnvironments()
      } catch (err) {
        logForDebugging(`[schedule] Failed to fetch environments: ${err}`, {
          level: 'warn',
        })
        return [
          {
            type: 'text',
            text: "We're having trouble connecting with your remote claude.ai account to set up a scheduled task. Please try /schedule again in a few minutes.",
          },
        ]
      }

      let createdEnvironment: EnvironmentResource | null = null
      if (environments.length === 0) {
        try {
          createdEnvironment = await createDefaultCloudEnvironment(
            'claude-code-default',
          )
          environments = [createdEnvironment]
        } catch (err) {
          logForDebugging(`[schedule] Failed to create environment: ${err}`, {
            level: 'warn',
          })
          return [
            {
              type: 'text',
              text: 'No remote environments found, and we could not create one automatically. Visit https://claude.ai/code to set one up, then run /schedule again.',
            },
          ]
        }
      }

      // Soft setup checks — collected as upfront notes embedded in the initial
      // AskUserQuestion dialog. Never block — triggers don't require a git
      // source (e.g., Slack-only polls), and the trigger's sources may point
      // at a different repo than cwd anyway.
      const setupNotes: string[] = []
      let needsGitHubAccessReminder = false

      const repo = await detectCurrentRepositoryWithHost()
      if (repo === null) {
        setupNotes.push(
          `Not in a git repo — you'll need to specify a repo URL manually (or skip repos entirely).`,
        )
      // `repo.host === 'github.com'` 成立时，schedule Remote Agents切换到这个 else-if 分支。
      } else if (repo.host === 'github.com') {
        // 从 `await checkRepoForRemoteAccess(` 解构 hasAccess，减少schedule Remote Agents对同一对象的重复访问。
        const { hasAccess } = await checkRepoForRemoteAccess(
          repo.owner,
          repo.name,
        )
        // 访问权限标记缺失时提前走兜底路径，避免schedule Remote Agents继续依赖无效输入。
        if (!hasAccess) {
          // GitHub 权限提醒标记更新为 `true`，确保技能调度后续读取最新状态。
          needsGitHubAccessReminder = true
          // Web setup 开关读取`getFeatureValue_CACHED_MAY_BE_STALE`，供schedule Remote Agents后续处理使用。
          const webSetupEnabled = getFeatureValue_CACHED_MAY_BE_STALE(
            'tengu_cobalt_lantern',
            false,
          )
          // 提示消息保存`webSetupEnabled`，供schedule Remote Agents后续步骤使用。
          const msg = webSetupEnabled
            ? `GitHub not connected for ${repo.owner}/${repo.name} \u2014 run /web-setup to sync your GitHub credentials, or install the Claude GitHub App at https://claude.ai/code/onboarding?magic=github-app-setup.`
            : `Claude GitHub App not installed on ${repo.owner}/${repo.name} \u2014 install at https://claude.ai/code/onboarding?magic=github-app-setup if your trigger needs this repo.`
          // 设置提示列表追加新条目，保持收集顺序与输入顺序一致。
          setupNotes.push(msg)
        }
      }
      // Non-github.com hosts (GHE/GitLab/etc.): silently skip. The GitHub
      // App check is github.com-specific, and the "not in a git repo" note
      // would be factually wrong — getCurrentRepoHttpsUrl() below will
      // still populate gitRepoUrl with the GHE URL.

      // 连接器列表读取`getConnectedClaudeAIConnectors`，供schedule Remote Agents后续处理使用。
      const connectors = getConnectedClaudeAIConnectors(
        context.options.mcpClients,
      )
      // 连接器列表为空时立即返回或跳过，避免schedule Remote Agents把空集合当成可处理内容。
      if (connectors.length === 0) {
        // 设置提示列表追加新条目，保持收集顺序与输入顺序一致。
        setupNotes.push(
          `No MCP connectors — connect at https://claude.ai/settings/connectors if needed.`,
        )
      }

      // 用户时区记录时间`Intl.DateTimeFormat`，供schedule Remote Agents后续处理使用。
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      // 连接器说明格式化`formatConnectorsInfo`，供schedule Remote Agents后续处理使用。
      const connectorsInfo = formatConnectorsInfo(connectors)
      // 仓库 URL读取`getCurrentRepoHttpsUrl`，供schedule Remote Agents后续处理使用。
      const gitRepoUrl = await getCurrentRepoHttpsUrl()
      // 文本行聚合成有序列表，保持后续遍历顺序稳定。
      const lines = ['Available environments:']
      // 遍历 const env of environments，让schedule Remote Agents逐项完成同一类处理。
      for (const env of environments) {
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(
          `- ${env.name} (id: ${env.environment_id}, kind: ${env.kind})`,
        )
      }
      // 环境说明格式化`lines.join`，供schedule Remote Agents后续处理使用。
      const environmentsInfo = lines.join('\n')
      // 提示词构建`buildPrompt`，供schedule Remote Agents后续处理使用。
      const prompt = buildPrompt({
        userTimezone,
        connectorsInfo,
        gitRepoUrl,
        environmentsInfo,
        createdEnvironment,
        setupNotes,
        needsGitHubAccessReminder,
        userArgs: args,
      })
      // 返回 [{ type: 'text', text: prompt }]，把schedule Remote Agents这个分支的结果交还调用方。
      return [{ type: 'text', text: prompt }]
    },
  })
}
