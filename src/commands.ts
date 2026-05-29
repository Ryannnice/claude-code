// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 注册 addDir 命令实现，后续会把它纳入斜杠命令集合。
import addDir from './commands/add-dir/index.js'
// 注册 autofixPr 命令实现，后续会把它纳入斜杠命令集合。
import autofixPr from './commands/autofix-pr/index.js'
// 注册 backfillSessions 命令实现，后续会把它纳入斜杠命令集合。
import backfillSessions from './commands/backfill-sessions/index.js'
// 注册 btw 命令实现，后续会把它纳入斜杠命令集合。
import btw from './commands/btw/index.js'
// 注册 goodClaude 命令实现，后续会把它纳入斜杠命令集合。
import goodClaude from './commands/good-claude/index.js'
// 注册 issue 命令实现，后续会把它纳入斜杠命令集合。
import issue from './commands/issue/index.js'
// 注册 feedback 命令实现，后续会把它纳入斜杠命令集合。
import feedback from './commands/feedback/index.js'
// 注册 clear 命令实现，后续会把它纳入斜杠命令集合。
import clear from './commands/clear/index.js'
// 注册 color 命令实现，后续会把它纳入斜杠命令集合。
import color from './commands/color/index.js'
// 注册 commit 命令实现，后续会把它纳入斜杠命令集合。
import commit from './commands/commit.js'
// 注册 copy 命令实现，后续会把它纳入斜杠命令集合。
import copy from './commands/copy/index.js'
// 注册 desktop 命令实现，后续会把它纳入斜杠命令集合。
import desktop from './commands/desktop/index.js'
// 注册 commitPushPr 命令实现，后续会把它纳入斜杠命令集合。
import commitPushPr from './commands/commit-push-pr.js'
// 注册 compact 命令实现，后续会把它纳入斜杠命令集合。
import compact from './commands/compact/index.js'
// 注册 config 命令实现，后续会把它纳入斜杠命令集合。
import config from './commands/config/index.js'
// 注册 context、contextNonInteractive 命令实现，后续会把它纳入斜杠命令集合。
import { context, contextNonInteractive } from './commands/context/index.js'
// 注册 cost 命令实现，后续会把它纳入斜杠命令集合。
import cost from './commands/cost/index.js'
// 注册 diff 命令实现，后续会把它纳入斜杠命令集合。
import diff from './commands/diff/index.js'
// 注册 ctx_viz 命令实现，后续会把它纳入斜杠命令集合。
import ctx_viz from './commands/ctx_viz/index.js'
// 注册 doctor 命令实现，后续会把它纳入斜杠命令集合。
import doctor from './commands/doctor/index.js'
// 注册 memory 命令实现，后续会把它纳入斜杠命令集合。
import memory from './commands/memory/index.js'
// 注册 help 命令实现，后续会把它纳入斜杠命令集合。
import help from './commands/help/index.js'
// 注册 ide 命令实现，后续会把它纳入斜杠命令集合。
import ide from './commands/ide/index.js'
// 注册 init 命令实现，后续会把它纳入斜杠命令集合。
import init from './commands/init.js'
// 注册 initVerifiers 命令实现，后续会把它纳入斜杠命令集合。
import initVerifiers from './commands/init-verifiers.js'
// 注册 keybindings 命令实现，后续会把它纳入斜杠命令集合。
import keybindings from './commands/keybindings/index.js'
// 注册 login 命令实现，后续会把它纳入斜杠命令集合。
import login from './commands/login/index.js'
// 注册 logout 命令实现，后续会把它纳入斜杠命令集合。
import logout from './commands/logout/index.js'
// 注册 installGitHubApp 命令实现，后续会把它纳入斜杠命令集合。
import installGitHubApp from './commands/install-github-app/index.js'
// 注册 installSlackApp 命令实现，后续会把它纳入斜杠命令集合。
import installSlackApp from './commands/install-slack-app/index.js'
// 注册 breakCache 命令实现，后续会把它纳入斜杠命令集合。
import breakCache from './commands/break-cache/index.js'
// 注册 mcp 命令实现，后续会把它纳入斜杠命令集合。
import mcp from './commands/mcp/index.js'
// 注册 mobile 命令实现，后续会把它纳入斜杠命令集合。
import mobile from './commands/mobile/index.js'
// 注册 onboarding 命令实现，后续会把它纳入斜杠命令集合。
import onboarding from './commands/onboarding/index.js'
// 注册 pr_comments 命令实现，后续会把它纳入斜杠命令集合。
import pr_comments from './commands/pr_comments/index.js'
// 注册 releaseNotes 命令实现，后续会把它纳入斜杠命令集合。
import releaseNotes from './commands/release-notes/index.js'
// 注册 rename 命令实现，后续会把它纳入斜杠命令集合。
import rename from './commands/rename/index.js'
// 注册 resume 命令实现，后续会把它纳入斜杠命令集合。
import resume from './commands/resume/index.js'
// 注册 review、ultrareview 命令实现，后续会把它纳入斜杠命令集合。
import review, { ultrareview } from './commands/review.js'
// 注册 session 命令实现，后续会把它纳入斜杠命令集合。
import session from './commands/session/index.js'
// 注册 share 命令实现，后续会把它纳入斜杠命令集合。
import share from './commands/share/index.js'
// 注册 skills 命令实现，后续会把它纳入斜杠命令集合。
import skills from './commands/skills/index.js'
// 注册 status 命令实现，后续会把它纳入斜杠命令集合。
import status from './commands/status/index.js'
// 注册 tasks 命令实现，后续会把它纳入斜杠命令集合。
import tasks from './commands/tasks/index.js'
// 注册 teleport 命令实现，后续会把它纳入斜杠命令集合。
import teleport from './commands/teleport/index.js'
/* eslint-disable @typescript-eslint/no-require-imports */
// agentsPlatform 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const agentsPlatform =
  process.env.USER_TYPE === 'ant'
    ? require('./commands/agents-platform/index.js').default
    : null
/* eslint-enable @typescript-eslint/no-require-imports */
// 注册 securityReview 命令实现，后续会把它纳入斜杠命令集合。
import securityReview from './commands/security-review.js'
// 注册 bughunter 命令实现，后续会把它纳入斜杠命令集合。
import bughunter from './commands/bughunter/index.js'
// 注册 terminalSetup 命令实现，后续会把它纳入斜杠命令集合。
import terminalSetup from './commands/terminalSetup/index.js'
// 注册 usage 命令实现，后续会把它纳入斜杠命令集合。
import usage from './commands/usage/index.js'
// 注册 theme 命令实现，后续会把它纳入斜杠命令集合。
import theme from './commands/theme/index.js'
// 注册 vim 命令实现，后续会把它纳入斜杠命令集合。
import vim from './commands/vim/index.js'
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 isBuddyEnabled，将 ./buddy/availability.js 中已经封装好的能力接到本文件流程里。
import { isBuddyEnabled } from './buddy/availability.js'
// Dead code elimination: conditional imports
/* eslint-disable @typescript-eslint/no-require-imports */
// proactive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const proactive =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./commands/proactive.js').default
    : null
// briefCommand 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const briefCommand =
  feature('KAIROS') || feature('KAIROS_BRIEF')
    ? require('./commands/brief.js').default
    : null
// assistantCommand 命令数据保存`feature`，供斜杠命令注册表后续处理使用。
const assistantCommand = feature('KAIROS')
  ? require('./commands/assistant/index.js').default
  : null
// bridge保存`feature`，供斜杠命令注册表后续处理使用。
const bridge = feature('BRIDGE_MODE')
  ? require('./commands/bridge/index.js').default
  : null
// remoteControlServerCommand 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const remoteControlServerCommand =
  feature('DAEMON') && feature('BRIDGE_MODE')
    ? require('./commands/remoteControlServer/index.js').default
    : null
// voiceCommand 命令数据保存`feature`，供斜杠命令注册表后续处理使用。
const voiceCommand = feature('VOICE_MODE')
  ? require('./commands/voice/index.js').default
  : null
// forceSnip保存`feature`，供斜杠命令注册表后续处理使用。
const forceSnip = feature('HISTORY_SNIP')
  ? require('./commands/force-snip.js').default
  : null
// workflowsCmd 命令数据保存`feature`，供斜杠命令注册表后续处理使用。
const workflowsCmd = feature('WORKFLOW_SCRIPTS')
  ? (
      require('./commands/workflows/index.js') as typeof import('./commands/workflows/index.js')
    ).default
  : null
// webCmd 命令数据保存`feature`，供斜杠命令注册表后续处理使用。
const webCmd = feature('CCR_REMOTE_SETUP')
  ? (
      require('./commands/remote-setup/index.js') as typeof import('./commands/remote-setup/index.js')
    ).default
  : null
// clearSkillIndexCache 缓存保存`feature`，供斜杠命令注册表后续处理使用。
const clearSkillIndexCache = feature('EXPERIMENTAL_SKILL_SEARCH')
  ? (
      require('./services/skillSearch/localSearch.js') as typeof import('./services/skillSearch/localSearch.js')
    ).clearSkillIndexCache
  : null
// subscribePr保存`feature`，供斜杠命令注册表后续处理使用。
const subscribePr = feature('KAIROS_GITHUB_WEBHOOKS')
  ? require('./commands/subscribe-pr.js').default
  : null
// ultraplan保存`feature`，供斜杠命令注册表后续处理使用。
const ultraplan = feature('ULTRAPLAN')
  ? require('./commands/ultraplan.js').default
  : null
// torch保存`feature`，供斜杠命令注册表后续处理使用。
const torch = feature('TORCH') ? require('./commands/torch.js').default : null
// peersCmd 命令数据保存`feature`，供斜杠命令注册表后续处理使用。
const peersCmd = feature('UDS_INBOX')
  ? (
      require('./commands/peers/index.js') as typeof import('./commands/peers/index.js')
    ).default
  : null
// forkCmd 命令数据保存`feature`，供斜杠命令注册表后续处理使用。
const forkCmd = feature('FORK_SUBAGENT')
  ? (
      require('./commands/fork/index.js') as typeof import('./commands/fork/index.js')
    ).default
  : null
// buddy保存`isBuddyEnabled`，供斜杠命令注册表后续处理使用。
const buddy = isBuddyEnabled()
  ? (
      require('./commands/buddy/index.js') as typeof import('./commands/buddy/index.js')
    ).default
  : null
/* eslint-enable @typescript-eslint/no-require-imports */
// 注册 thinkback 命令实现，后续会把它纳入斜杠命令集合。
import thinkback from './commands/thinkback/index.js'
// 注册 thinkbackPlay 命令实现，后续会把它纳入斜杠命令集合。
import thinkbackPlay from './commands/thinkback-play/index.js'
// 注册 permissions 命令实现，后续会把它纳入斜杠命令集合。
import permissions from './commands/permissions/index.js'
// 注册 plan 命令实现，后续会把它纳入斜杠命令集合。
import plan from './commands/plan/index.js'
// 注册 fast 命令实现，后续会把它纳入斜杠命令集合。
import fast from './commands/fast/index.js'
// 注册 passes 命令实现，后续会把它纳入斜杠命令集合。
import passes from './commands/passes/index.js'
// 注册 privacySettings 命令实现，后续会把它纳入斜杠命令集合。
import privacySettings from './commands/privacy-settings/index.js'
// 注册 hooks 命令实现，后续会把它纳入斜杠命令集合。
import hooks from './commands/hooks/index.js'
// 注册 files 命令实现，后续会把它纳入斜杠命令集合。
import files from './commands/files/index.js'
// 注册 branch 命令实现，后续会把它纳入斜杠命令集合。
import branch from './commands/branch/index.js'
// 注册 agents 命令实现，后续会把它纳入斜杠命令集合。
import agents from './commands/agents/index.js'
// 注册 plugin 命令实现，后续会把它纳入斜杠命令集合。
import plugin from './commands/plugin/index.js'
// 注册 reloadPlugins 命令实现，后续会把它纳入斜杠命令集合。
import reloadPlugins from './commands/reload-plugins/index.js'
// 注册 rewind 命令实现，后续会把它纳入斜杠命令集合。
import rewind from './commands/rewind/index.js'
// 注册 heapDump 命令实现，后续会把它纳入斜杠命令集合。
import heapDump from './commands/heapdump/index.js'
// 注册 mockLimits 命令实现，后续会把它纳入斜杠命令集合。
import mockLimits from './commands/mock-limits/index.js'
// 注册 bridgeKick 命令实现，后续会把它纳入斜杠命令集合。
import bridgeKick from './commands/bridge-kick.js'
// 注册 version 命令实现，后续会把它纳入斜杠命令集合。
import version from './commands/version.js'
// 注册 summary 命令实现，后续会把它纳入斜杠命令集合。
import summary from './commands/summary/index.js'
// 整理这一组导入，让斜杠命令注册表后续逻辑可以直接复用这些外部能力。
import {
  resetLimits,
  resetLimitsNonInteractive,
} from './commands/reset-limits/index.js'
// 注册 antTrace 命令实现，后续会把它纳入斜杠命令集合。
import antTrace from './commands/ant-trace/index.js'
// 注册 perfIssue 命令实现，后续会把它纳入斜杠命令集合。
import perfIssue from './commands/perf-issue/index.js'
// 注册 sandboxToggle 命令实现，后续会把它纳入斜杠命令集合。
import sandboxToggle from './commands/sandbox-toggle/index.js'
// 注册 chrome 命令实现，后续会把它纳入斜杠命令集合。
import chrome from './commands/chrome/index.js'
// 注册 stickers 命令实现，后续会把它纳入斜杠命令集合。
import stickers from './commands/stickers/index.js'
// 注册 advisor 命令实现，后续会把它纳入斜杠命令集合。
import advisor from './commands/advisor.js'
// 复用 logError 工具函数，把通用处理留在 ./utils/log.js 中维护。
import { logError } from './utils/log.js'
// 复用 toError 工具函数，把通用处理留在 ./utils/errors.js 中维护。
import { toError } from './utils/errors.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ./utils/debug.js 中维护。
import { logForDebugging } from './utils/debug.js'
// 整理这一组导入，让斜杠命令注册表后续逻辑可以直接复用这些外部能力。
import {
  getSkillDirCommands,
  clearSkillCaches,
  getDynamicSkills,
} from './skills/loadSkillsDir.js'
// 引入 getBundledSkills，将 ./skills/bundledSkills.js 中已经封装好的能力接到本文件流程里。
import { getBundledSkills } from './skills/bundledSkills.js'
// 引入 getBuiltinPluginSkillCommands，将 ./plugins/builtinPlugins.js 中已经封装好的能力接到本文件流程里。
import { getBuiltinPluginSkillCommands } from './plugins/builtinPlugins.js'
// 整理这一组导入，让斜杠命令注册表后续逻辑可以直接复用这些外部能力。
import {
  getPluginCommands,
  clearPluginCommandCache,
  getPluginSkills,
  clearPluginSkillsCache,
} from './utils/plugins/loadPluginCommands.js'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 复用 isUsing3PServices、isClaudeAISubscriber 工具函数，把通用处理留在 ./utils/auth.js 中维护。
import { isUsing3PServices, isClaudeAISubscriber } from './utils/auth.js'
// 复用 isFirstPartyAnthropicBaseUrl 工具函数，把通用处理留在 ./utils/model/providers.js 中维护。
import { isFirstPartyAnthropicBaseUrl } from './utils/model/providers.js'
// 注册 env 命令实现，后续会把它纳入斜杠命令集合。
import env from './commands/env/index.js'
// 注册 exit 命令实现，后续会把它纳入斜杠命令集合。
import exit from './commands/exit/index.js'
// 注册 exportCommand 命令实现，后续会把它纳入斜杠命令集合。
import exportCommand from './commands/export/index.js'
// 注册 model 命令实现，后续会把它纳入斜杠命令集合。
import model from './commands/model/index.js'
// 注册 tag 命令实现，后续会把它纳入斜杠命令集合。
import tag from './commands/tag/index.js'
// 注册 outputStyle 命令实现，后续会把它纳入斜杠命令集合。
import outputStyle from './commands/output-style/index.js'
// 注册 remoteEnv 命令实现，后续会把它纳入斜杠命令集合。
import remoteEnv from './commands/remote-env/index.js'
// 注册 upgrade 命令实现，后续会把它纳入斜杠命令集合。
import upgrade from './commands/upgrade/index.js'
// 整理这一组导入，让斜杠命令注册表后续逻辑可以直接复用这些外部能力。
import {
  extraUsage,
  extraUsageNonInteractive,
} from './commands/extra-usage/index.js'
// 注册 rateLimitOptions 命令实现，后续会把它纳入斜杠命令集合。
import rateLimitOptions from './commands/rate-limit-options/index.js'
// 注册 statusline 命令实现，后续会把它纳入斜杠命令集合。
import statusline from './commands/statusline.js'
// 注册 effort 命令实现，后续会把它纳入斜杠命令集合。
import effort from './commands/effort/index.js'
// 注册 stats 命令实现，后续会把它纳入斜杠命令集合。
import stats from './commands/stats/index.js'
// insights.ts is 113KB (3200 lines, includes diffLines/html rendering). Lazy
// shim defers the heavy module until /insights is actually invoked.
// usageReport 集中保存斜杠命令注册表要一起传递的字段。
const usageReport: Command = {
  type: 'prompt',
  name: 'insights',
  description: 'Generate a report analyzing your Claude Code sessions',
  contentLength: 0,
  progressMessage: 'analyzing your sessions',
  source: 'builtin',
  // getPromptForCommand 根据 args, context 读取或计算斜杠命令注册表需要的结果。
  async getPromptForCommand(args, context) {
    // real保存`import`，供斜杠命令注册表后续处理使用。
    const real = (await import('./commands/insights.js')).default
    // `real.type` 与 `'prompt') throw new Error('unre...` 不一致时刷新派生状态，避免使用过期结果。
    if (real.type !== 'prompt') throw new Error('unreachable')
    // 返回 `real.getPromptForCommand(args, context)`，作为斜杠命令注册表这次计算的结果。
    return real.getPromptForCommand(args, context)
  },
}
// 注册 oauthRefresh 命令实现，后续会把它纳入斜杠命令集合。
import oauthRefresh from './commands/oauth-refresh/index.js'
// 注册 debugToolCall 命令实现，后续会把它纳入斜杠命令集合。
import debugToolCall from './commands/debug-tool-call/index.js'
// 复用 getSettingSourceName 工具函数，把通用处理留在 ./utils/settings/constants.js 中维护。
import { getSettingSourceName } from './utils/settings/constants.js'
// 整理这一组导入，让斜杠命令注册表后续逻辑可以直接复用这些外部能力。
import {
  type Command,
  getCommandName,
  isCommandEnabled,
} from './types/command.js'

// Re-export types from the centralized location
// 导出类型定义，让其他模块沿用斜杠命令注册表的数据契约。
export type {
  Command,
  CommandBase,
  CommandResultDisplay,
  LocalCommandResult,
  LocalJSXCommandContext,
  PromptCommand,
  ResumeEntrypoint,
} from './types/command.js'
// 重新导出这一组成员，让斜杠命令注册表的公共 API 保持集中入口。
export { getCommandName, isCommandEnabled } from './types/command.js'

// Commands that get eliminated from the external build
// INTERNAL_ONLY_COMMANDS 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
export const INTERNAL_ONLY_COMMANDS = [
  backfillSessions,
  breakCache,
  bughunter,
  commit,
  commitPushPr,
  ctx_viz,
  goodClaude,
  issue,
  initVerifiers,
  ...(forceSnip ? [forceSnip] : []),
  mockLimits,
  bridgeKick,
  version,
  ...(ultraplan ? [ultraplan] : []),
  ...(subscribePr ? [subscribePr] : []),
  resetLimits,
  resetLimitsNonInteractive,
  onboarding,
  share,
  summary,
  teleport,
  antTrace,
  perfIssue,
  env,
  oauthRefresh,
  debugToolCall,
  agentsPlatform,
  autofixPr,
].filter(Boolean)

// Declared as a function so that we don't run this until getCommands is called,
// since underlying functions read from config, which can't be read at module initialization time
// COMMANDS 命令数据保存`memoize`，供斜杠命令注册表后续处理使用。
const COMMANDS = memoize((): Command[] => [
  addDir,
  advisor,
  agents,
  branch,
  btw,
  chrome,
  clear,
  color,
  compact,
  config,
  copy,
  desktop,
  context,
  contextNonInteractive,
  cost,
  diff,
  doctor,
  effort,
  exit,
  fast,
  files,
  heapDump,
  help,
  ide,
  init,
  keybindings,
  installGitHubApp,
  installSlackApp,
  mcp,
  memory,
  mobile,
  model,
  outputStyle,
  remoteEnv,
  plugin,
  pr_comments,
  releaseNotes,
  reloadPlugins,
  rename,
  resume,
  session,
  skills,
  stats,
  status,
  statusline,
  stickers,
  tag,
  theme,
  feedback,
  review,
  ultrareview,
  rewind,
  securityReview,
  terminalSetup,
  upgrade,
  extraUsage,
  extraUsageNonInteractive,
  rateLimitOptions,
  usage,
  usageReport,
  vim,
  ...(webCmd ? [webCmd] : []),
  ...(forkCmd ? [forkCmd] : []),
  ...(buddy ? [buddy] : []),
  ...(proactive ? [proactive] : []),
  ...(briefCommand ? [briefCommand] : []),
  ...(assistantCommand ? [assistantCommand] : []),
  ...(bridge ? [bridge] : []),
  ...(remoteControlServerCommand ? [remoteControlServerCommand] : []),
  ...(voiceCommand ? [voiceCommand] : []),
  thinkback,
  thinkbackPlay,
  permissions,
  plan,
  privacySettings,
  hooks,
  exportCommand,
  sandboxToggle,
  ...(!isUsing3PServices() ? [logout, login()] : []),
  passes,
  ...(peersCmd ? [peersCmd] : []),
  tasks,
  ...(workflowsCmd ? [workflowsCmd] : []),
  ...(torch ? [torch] : []),
  ...(process.env.USER_TYPE === 'ant' && !process.env.IS_DEMO
    ? INTERNAL_ONLY_COMMANDS
    : []),
])

// builtInCommandNames 命令数据保存`memoize`，供斜杠命令注册表后续处理使用。
export const builtInCommandNames = memoize(
  (): Set<string> =>
    new Set(COMMANDS().flatMap(_ => [_.name, ...(_.aliases ?? [])])),
)

// getSkills 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getSkills(cwd: string): Promise<{
  skillDirCommands: Command[]
  pluginSkills: Command[]
  bundledSkills: Command[]
  builtinPluginSkills: Command[]
}> {
  // 保护这一段可能失败的斜杠命令注册表操作，确保异常能进入相邻错误处理。
  try {
    // 并行获取 skillDirCommands、pluginSkills，缩短斜杠命令注册表等待多个独立异步任务的时间。
    const [skillDirCommands, pluginSkills] = await Promise.all([
      // 调用 getSkillDirCommands，触发斜杠命令注册表此处需要的副作用。
      getSkillDirCommands(cwd).catch(err => {
        // 记录斜杠命令注册表运行诊断，方便排查异常路径或性能问题。
        logError(toError(err))
        // 记录斜杠命令注册表运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'Skill directory commands failed to load, continuing without them',
        )
        // 返回列表结果，保留斜杠命令注册表已经排好的条目顺序。
        return []
      }),
      // 调用 getPluginSkills，触发斜杠命令注册表此处需要的副作用。
      getPluginSkills().catch(err => {
        // 记录斜杠命令注册表运行诊断，方便排查异常路径或性能问题。
        logError(toError(err))
        // 记录斜杠命令注册表运行诊断，方便排查异常路径或性能问题。
        logForDebugging('Plugin skills failed to load, continuing without them')
        // 返回列表结果，保留斜杠命令注册表已经排好的条目顺序。
        return []
      }),
    ])
    // Bundled skills are registered synchronously at startup
    // bundledSkills 集合读取`getBundledSkills`，供斜杠命令注册表后续处理使用。
    const bundledSkills = getBundledSkills()
    // Built-in plugin skills come from enabled built-in plugins
    // builtinPluginSkills 插件数据读取`getBuiltinPluginSkillCommands`，供斜杠命令注册表后续处理使用。
    const builtinPluginSkills = getBuiltinPluginSkillCommands()
    // 记录斜杠命令注册表运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `getSkills returning: ${skillDirCommands.length} skill dir commands, ${pluginSkills.length} plugin skills, ${bundledSkills.length} bundled skills, ${builtinPluginSkills.length} builtin plugin skills`,
    )
    // 返回结构化结果，集中表达斜杠命令注册表已经整理出的状态。
    return {
      skillDirCommands,
      pluginSkills,
      bundledSkills,
      builtinPluginSkills,
    }
  } catch (err) {
    // This should never happen since we catch at the Promise level, but defensive
    // 记录斜杠命令注册表运行诊断，方便排查异常路径或性能问题。
    logError(toError(err))
    // 记录斜杠命令注册表运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Unexpected error in getSkills, returning empty')
    // 返回结构化结果，集中表达斜杠命令注册表已经整理出的状态。
    return {
      skillDirCommands: [],
      pluginSkills: [],
      bundledSkills: [],
      builtinPluginSkills: [],
    }
  }
}

/* eslint-disable @typescript-eslint/no-require-imports */
// getWorkflowCommands 命令数据保存`feature`，供斜杠命令注册表后续处理使用。
const getWorkflowCommands = feature('WORKFLOW_SCRIPTS')
  ? (
      require('./tools/WorkflowTool/createWorkflowCommand.js') as typeof import('./tools/WorkflowTool/createWorkflowCommand.js')
    ).getWorkflowCommands
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Filters commands by their declared `availability` (auth/provider requirement).
 * Commands without `availability` are treated as universal.
 * This runs before `isEnabled()` so that provider-gated commands are hidden
 * regardless of feature-flag state.
 *
 * Not memoized — auth state can change mid-session (e.g. after /login),
 * so this must be re-evaluated on every getCommands() call.
 */
// meetsAvailabilityRequirement 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function meetsAvailabilityRequirement(cmd: Command): boolean {
  // cmd.availability 命令数据缺失时提前走兜底路径，避免斜杠命令注册表继续依赖无效输入。
  if (!cmd.availability) return true
  // 按顺序遍历 `cmd.availability` 中的a，逐个交给斜杠命令注册表处理。
  for (const a of cmd.availability) {
    // 按照 a 的取值选择斜杠命令注册表的具体处理分支。
    switch (a) {
      case 'claude-ai':
        // 满足 `isClaudeAISubscriber()` 时，斜杠命令注册表执行该分支。
        if (isClaudeAISubscriber()) return true
        // 结束这个分支或循环，避免斜杠命令注册表继续落入后续路径。
        break
      case 'console':
        // Console API key user = direct 1P API customer (not 3P, not claude.ai).
        // Excludes 3P (Bedrock/Vertex/Foundry) who don't set ANTHROPIC_BASE_URL
        // and gateway users who proxy through a custom base URL.
        // 斜杠命令注册表在这里进入条件判断，后续代码按实际状态分流。
        if (
          !isClaudeAISubscriber() &&
          !isUsing3PServices() &&
          isFirstPartyAnthropicBaseUrl()
        )
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        // 结束这个分支或循环，避免斜杠命令注册表继续落入后续路径。
        break
      default: {
        // _exhaustive保存`a`，供斜杠命令注册表后续判断或输出使用。
        const _exhaustive: never = a
        // 显式忽略 `_exhaustive` 的返回值，只保留它触发的副作用。
        void _exhaustive
        // 结束这个分支或循环，避免斜杠命令注册表继续落入后续路径。
        break
      }
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Loads all command sources (skills, plugins, workflows). Memoized by cwd
 * because loading is expensive (disk I/O, dynamic imports).
 */
// loadAllCommands 命令数据保存`memoize`，供斜杠命令注册表后续处理使用。
const loadAllCommands = memoize(async (cwd: string): Promise<Command[]> => {
  // 斜杠命令注册表先整理这一处局部数据，后续分支可以直接读取。
  const [
    { skillDirCommands, pluginSkills, bundledSkills, builtinPluginSkills },
    pluginCommands,
    workflowCommands,
  ] = await Promise.all([
    getSkills(cwd),
    getPluginCommands(),
    getWorkflowCommands ? getWorkflowCommands(cwd) : Promise.resolve([]),
  ])

  // 返回列表结果，保留斜杠命令注册表已经排好的条目顺序。
  return [
    ...bundledSkills,
    ...builtinPluginSkills,
    ...skillDirCommands,
    ...workflowCommands,
    ...pluginCommands,
    ...pluginSkills,
    ...COMMANDS(),
  ]
})

/**
 * Returns commands available to the current user. The expensive loading is
 * memoized, but availability and isEnabled checks run fresh every call so
 * auth changes (e.g. /login) take effect immediately.
 */
// getCommands 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getCommands(cwd: string): Promise<Command[]> {
  // allCommands 命令数据读取`loadAllCommands`，供斜杠命令注册表后续处理使用。
  const allCommands = await loadAllCommands(cwd)

  // Get dynamic skills discovered during file operations
  // dynamicSkills 集合读取`getDynamicSkills`，供斜杠命令注册表后续处理使用。
  const dynamicSkills = getDynamicSkills()

  // Build base commands without dynamic skills
  // baseCommands 命令数据筛选`allCommands.filter`，供斜杠命令注册表后续处理使用。
  const baseCommands = allCommands.filter(
    // _更新为 `> meetsAvailabilityRequirement(_) && isCommandEnabled(_)`，确保commands后续读取最新状态。
    _ => meetsAvailabilityRequirement(_) && isCommandEnabled(_),
  )

  // dynamicSkills 集合为空时立即返回或跳过，避免斜杠命令注册表把空集合当成可处理内容。
  if (dynamicSkills.length === 0) {
    // 返回 `baseCommands`，作为斜杠命令注册表这次计算的结果。
    return baseCommands
  }

  // Dedupe dynamic skills - only add if not already present
  // baseCommandNames 命令数据保存`Set`，供斜杠命令注册表后续处理使用。
  const baseCommandNames = new Set(baseCommands.map(c => c.name))
  // uniqueDynamicSkills 集合筛选`dynamicSkills.filter`，供斜杠命令注册表后续处理使用。
  const uniqueDynamicSkills = dynamicSkills.filter(
    // s 集合更新为 `>`，确保commands后续读取最新状态。
    s =>
      !baseCommandNames.has(s.name) &&
      meetsAvailabilityRequirement(s) &&
      isCommandEnabled(s),
  )

  // uniqueDynamicSkills 集合为空时立即返回或跳过，避免斜杠命令注册表把空集合当成可处理内容。
  if (uniqueDynamicSkills.length === 0) {
    // 返回 `baseCommands`，作为斜杠命令注册表这次计算的结果。
    return baseCommands
  }

  // Insert dynamic skills after plugin skills but before built-in commands
  // builtInNames 集合保存`Set`，供斜杠命令注册表后续处理使用。
  const builtInNames = new Set(COMMANDS().map(c => c.name))
  // insertIndex 索引筛选`baseCommands.findIndex`，供斜杠命令注册表后续处理使用。
  const insertIndex = baseCommands.findIndex(c => builtInNames.has(c.name))

  // 满足 `insertIndex === -1` 时，斜杠命令注册表执行该分支。
  if (insertIndex === -1) {
    // 返回列表结果，保留斜杠命令注册表已经排好的条目顺序。
    return [...baseCommands, ...uniqueDynamicSkills]
  }

  // 返回列表结果，保留斜杠命令注册表已经排好的条目顺序。
  return [
    ...baseCommands.slice(0, insertIndex),
    ...uniqueDynamicSkills,
    ...baseCommands.slice(insertIndex),
  ]
}

/**
 * Clears only the memoization caches for commands, WITHOUT clearing skill caches.
 * Use this when dynamic skills are added to invalidate cached command lists.
 */
// clearCommandMemoizationCaches 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearCommandMemoizationCaches(): void {
  // 调用 loadAllCommands.cache?.clear?.()，完成这一处局部操作。
  loadAllCommands.cache?.clear?.()
  // 调用 getSkillToolCommands.cache?.clear?.()，完成这一处局部操作。
  getSkillToolCommands.cache?.clear?.()
  // 调用 getSlashCommandToolSkills.cache?.clear?.()，完成这一处局部操作。
  getSlashCommandToolSkills.cache?.clear?.()
  // getSkillIndex in skillSearch/localSearch.ts is a separate memoization layer
  // built ON TOP of getSkillToolCommands/getCommands. Clearing only the inner
  // caches is a no-op for the outer — lodash memoize returns the cached result
  // without ever reaching the cleared inners. Must clear it explicitly.
  // 调用 clearSkillIndexCache?.()，完成这一处局部操作。
  clearSkillIndexCache?.()
}

// clearCommandsCache 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearCommandsCache(): void {
  // 清理相关缓存，确保斜杠命令注册表下一次读取时重新加载最新数据。
  clearCommandMemoizationCaches()
  // 清理相关缓存，确保斜杠命令注册表下一次读取时重新加载最新数据。
  clearPluginCommandCache()
  // 清理相关缓存，确保斜杠命令注册表下一次读取时重新加载最新数据。
  clearPluginSkillsCache()
  // 清理相关缓存，确保斜杠命令注册表下一次读取时重新加载最新数据。
  clearSkillCaches()
}

/**
 * Filter AppState.mcp.commands to MCP-provided skills (prompt-type,
 * model-invocable, loaded from MCP). These live outside getCommands() so
 * callers that need MCP skills in their skill index thread them through
 * separately.
 */
// getMcpSkillCommands 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpSkillCommands(
  mcpCommands: readonly Command[],
): readonly Command[] {
  // 满足 `feature('MCP_SKILLS')` 时，斜杠命令注册表执行该分支。
  if (feature('MCP_SKILLS')) {
    // 返回 `mcpCommands.filter(`，作为斜杠命令注册表这次计算的结果。
    return mcpCommands.filter(
      // cmd 命令数据更新为 `>`，确保commands后续读取最新状态。
      cmd =>
        cmd.type === 'prompt' &&
        cmd.loadedFrom === 'mcp' &&
        !cmd.disableModelInvocation,
    )
  }
  // 返回列表结果，保留斜杠命令注册表已经排好的条目顺序。
  return []
}

// SkillTool shows ALL prompt-based commands that the model can invoke
// This includes both skills (from /skills/) and commands (from /commands/)
// getSkillToolCommands 命令数据保存`memoize`，供斜杠命令注册表后续处理使用。
export const getSkillToolCommands = memoize(
  async (cwd: string): Promise<Command[]> => {
    // allCommands 命令数据读取`getCommands`，供斜杠命令注册表后续处理使用。
    const allCommands = await getCommands(cwd)
    // 返回 `allCommands.filter(`，作为斜杠命令注册表这次计算的结果。
    return allCommands.filter(
      cmd =>
        cmd.type === 'prompt' &&
        !cmd.disableModelInvocation &&
        cmd.source !== 'builtin' &&
        // Always include skills from /skills/ dirs, bundled skills, and legacy /commands/ entries
        // (they all get an auto-derived description from the first line if frontmatter is missing).
        // Plugin/MCP commands still require an explicit description to appear in the listing.
        (cmd.loadedFrom === 'bundled' ||
          cmd.loadedFrom === 'skills' ||
          cmd.loadedFrom === 'commands_DEPRECATED' ||
          cmd.hasUserSpecifiedDescription ||
          cmd.whenToUse),
    )
  },
)

// Filters commands to include only skills. Skills are commands that provide
// specialized capabilities for the model to use. They are identified by
// loadedFrom being 'skills', 'plugin', or 'bundled', or having disableModelInvocation set.
// getSlashCommandToolSkills 命令数据保存`memoize`，供斜杠命令注册表后续处理使用。
export const getSlashCommandToolSkills = memoize(
  async (cwd: string): Promise<Command[]> => {
    // 保护这一段可能失败的斜杠命令注册表操作，确保异常能进入相邻错误处理。
    try {
      // allCommands 命令数据读取`getCommands`，供斜杠命令注册表后续处理使用。
      const allCommands = await getCommands(cwd)
      // 返回 `allCommands.filter(`，作为斜杠命令注册表这次计算的结果。
      return allCommands.filter(
        // cmd 命令数据更新为 `>`，确保commands后续读取最新状态。
        cmd =>
          cmd.type === 'prompt' &&
          cmd.source !== 'builtin' &&
          (cmd.hasUserSpecifiedDescription || cmd.whenToUse) &&
          (cmd.loadedFrom === 'skills' ||
            cmd.loadedFrom === 'plugin' ||
            cmd.loadedFrom === 'bundled' ||
            cmd.disableModelInvocation),
      )
    } catch (error) {
      // 记录斜杠命令注册表运行诊断，方便排查异常路径或性能问题。
      logError(toError(error))
      // Return empty array rather than throwing - skills are non-critical
      // This prevents skill loading failures from breaking the entire system
      // 记录斜杠命令注册表运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Returning empty skills array due to load failure')
      // 返回列表结果，保留斜杠命令注册表已经排好的条目顺序。
      return []
    }
  },
)

/**
 * Commands that are safe to use in remote mode (--remote).
 * These only affect local TUI state and don't depend on local filesystem,
 * git, shell, IDE, MCP, or other local execution context.
 *
 * Used in two places:
 * 1. Pre-filtering commands in main.tsx before REPL renders (prevents race with CCR init)
 * 2. Preserving local-only commands in REPL's handleRemoteInit after CCR filters
 */
// REMOTE_SAFE_COMMANDS 命令数据 用 Set 去重，后续只需判断成员是否存在。
export const REMOTE_SAFE_COMMANDS: Set<Command> = new Set([
  session, // Shows QR code / URL for remote session
  exit, // Exit the TUI
  clear, // Clear screen
  help, // Show help
  theme, // Change terminal theme
  color, // Change agent color
  vim, // Toggle vim mode
  cost, // Show session cost (local cost tracking)
  usage, // Show usage info
  copy, // Copy last message
  btw, // Quick note
  feedback, // Send feedback
  plan, // Plan mode toggle
  keybindings, // Keybinding management
  statusline, // Status line toggle
  stickers, // Stickers
  mobile, // Mobile QR code
])

/**
 * Builtin commands of type 'local' that ARE safe to execute when received
 * over the Remote Control bridge. These produce text output that streams
 * back to the mobile/web client and have no terminal-only side effects.
 *
 * 'local-jsx' commands are blocked by type (they render Ink UI) and
 * 'prompt' commands are allowed by type (they expand to text sent to the
 * model) — this set only gates 'local' commands.
 *
 * When adding a new 'local' command that should work from mobile, add it
 * here. Default is blocked.
 */
// BRIDGE_SAFE_COMMANDS 命令数据 用 Set 去重，后续只需判断成员是否存在。
export const BRIDGE_SAFE_COMMANDS: Set<Command> = new Set(
  [
    compact, // Shrink context — useful mid-session from a phone
    clear, // Wipe transcript
    cost, // Show session cost
    summary, // Summarize conversation
    releaseNotes, // Show changelog
    files, // List tracked files
  // 这个回调绑定到 ].filter((c): c is Command => c !== null),，负责斜杠命令注册表在该局部场景下的响应。
  ].filter((c): c is Command => c !== null),
)

/**
 * Whether a slash command is safe to execute when its input arrived over the
 * Remote Control bridge (mobile/web client).
 *
 * PR #19134 blanket-blocked all slash commands from bridge inbound because
 * `/model` from iOS was popping the local Ink picker. This predicate relaxes
 * that with an explicit allowlist: 'prompt' commands (skills) expand to text
 * and are safe by construction; 'local' commands need an explicit opt-in via
 * BRIDGE_SAFE_COMMANDS; 'local-jsx' commands render Ink UI and stay blocked.
 */
// isBridgeSafeCommand 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBridgeSafeCommand(cmd: Command): boolean {
  // 当 `cmd.type` 匹配 `'local-jsx'` 时，斜杠命令注册表执行对应分支。
  if (cmd.type === 'local-jsx') return false
  // 当 `cmd.type` 匹配 `'prompt'` 时，斜杠命令注册表执行对应分支。
  if (cmd.type === 'prompt') return true
  // 返回 `BRIDGE_SAFE_COMMANDS.has(cmd)`，作为斜杠命令注册表这次计算的结果。
  return BRIDGE_SAFE_COMMANDS.has(cmd)
}

/**
 * Filter commands to only include those safe for remote mode.
 * Used to pre-filter commands when rendering the REPL in --remote mode,
 * preventing local-only commands from being briefly available before
 * the CCR init message arrives.
 */
// filterCommandsForRemoteMode 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterCommandsForRemoteMode(commands: Command[]): Command[] {
  // 返回 `commands.filter(cmd => REMOTE_SAFE_COMMANDS.has(cmd))`，作为斜杠命令注册表这次计算的结果。
  return commands.filter(cmd => REMOTE_SAFE_COMMANDS.has(cmd))
}

// findCommand 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findCommand(
  commandName: string,
  commands: Command[],
): Command | undefined {
  // 返回 `commands.find(`，作为斜杠命令注册表这次计算的结果。
  return commands.find(
    // _更新为 `>`，确保commands后续读取最新状态。
    _ =>
      _.name === commandName ||
      getCommandName(_) === commandName ||
      _.aliases?.includes(commandName),
  )
}

// hasCommand 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasCommand(commandName: string, commands: Command[]): boolean {
  // 返回 `findCommand(commandName, commands) !== undefined`，作为斜杠命令注册表这次计算的结果。
  return findCommand(commandName, commands) !== undefined
}

// getCommand 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCommand(commandName: string, commands: Command[]): Command {
  // 命令筛选`findCommand`，供斜杠命令注册表后续处理使用。
  const command = findCommand(commandName, commands)
  // 命令缺失时提前走兜底路径，避免斜杠命令注册表继续依赖无效输入。
  if (!command) {
    // 抛出 ReferenceError(，阻止斜杠命令注册表在无效状态下继续运行。
    throw ReferenceError(
      `Command ${commandName} not found. Available commands: ${commands
        .map(_ => {
          const name = getCommandName(_)
          return _.aliases ? `${name} (aliases: ${_.aliases.join(', ')})` : name
        })
        .sort((a, b) => a.localeCompare(b))
        .join(', ')}`,
    )
  }

  // 返回 `command`，作为斜杠命令注册表这次计算的结果。
  return command
}

/**
 * Formats a command's description with its source annotation for user-facing UI.
 * Use this in typeahead, help screens, and other places where users need to see
 * where a command comes from.
 *
 * For model-facing prompts (like SkillTool), use cmd.description directly.
 */
// formatDescriptionWithSource 封装commands的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatDescriptionWithSource(cmd: Command): string {
  // `cmd.type` 与 `'prompt'` 不一致时刷新派生状态，避免使用过期结果。
  if (cmd.type !== 'prompt') {
    // 返回 `cmd.description`，作为斜杠命令注册表这次计算的结果。
    return cmd.description
  }

  // 当 `cmd.kind` 匹配 `'workflow'` 时，斜杠命令注册表执行对应分支。
  if (cmd.kind === 'workflow') {
    // 返回 ``${cmd.description} (workflow)``，作为斜杠命令注册表这次计算的结果。
    return `${cmd.description} (workflow)`
  }

  // 当 `cmd.source` 匹配 `'plugin'` 时，斜杠命令注册表执行对应分支。
  if (cmd.source === 'plugin') {
    // pluginName 插件数据 命名 `cmd.pluginInfo?.pluginManifest.name`，让后续代码直接表达这个值的用途。
    const pluginName = cmd.pluginInfo?.pluginManifest.name
    // 满足 `pluginName` 时，斜杠命令注册表执行该分支。
    if (pluginName) {
      // 返回 ``(${pluginName}) ${cmd.description}``，作为斜杠命令注册表这次计算的结果。
      return `(${pluginName}) ${cmd.description}`
    }
    // 返回 ``${cmd.description} (plugin)``，作为斜杠命令注册表这次计算的结果。
    return `${cmd.description} (plugin)`
  }

  // 当 `cmd.source` 匹配 `'builtin' || cmd.source ===...` 时，斜杠命令注册表执行对应分支。
  if (cmd.source === 'builtin' || cmd.source === 'mcp') {
    // 返回 `cmd.description`，作为斜杠命令注册表这次计算的结果。
    return cmd.description
  }

  // 当 `cmd.source` 匹配 `'bundled'` 时，斜杠命令注册表执行对应分支。
  if (cmd.source === 'bundled') {
    // 返回 ``${cmd.description} (bundled)``，作为斜杠命令注册表这次计算的结果。
    return `${cmd.description} (bundled)`
  }

  // 返回 ``${cmd.description} (${getSettingSourceName(cmd.source)})``，作为斜杠命令注册表这次计算的结果。
  return `${cmd.description} (${getSettingSourceName(cmd.source)})`
}
