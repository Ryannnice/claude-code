/**
 * Shared constants for PowerShell cmdlets that execute arbitrary code.
 *
 * These lists are consumed by both the permission-engine validators
 * (powershellSecurity.ts) and the UI suggestion gate (staticPrefix.ts).
 * Keeping them here avoids duplicating the lists and prevents sync drift
 * — add a cmdlet once, both consumers pick it up.
 */

// 引入 CROSS_PLATFORM_CODE_EXEC，将 ../permissions/dangerousPatterns.js 中已经封装好的能力接到本文件流程里。
import { CROSS_PLATFORM_CODE_EXEC } from '../permissions/dangerousPatterns.js'
// 引入 COMMON_ALIASES，将 ./parser.js 中已经封装好的能力接到本文件流程里。
import { COMMON_ALIASES } from './parser.js'

/**
 * Cmdlets that accept a -FilePath (or positional path) and execute the
 * file's contents as a script.
 */
// FILEPATH_EXECUTION_CMDLETS 命令数据保存`Set`，供共享工具后续处理使用。
export const FILEPATH_EXECUTION_CMDLETS = new Set([
  'invoke-command',
  'start-job',
  'start-threadjob',
  'register-scheduledjob',
])

/**
 * Cmdlets where a scriptblock argument executes arbitrary code (not just
 * filtering/transforming pipeline input like Where-Object).
 */
// DANGEROUS_SCRIPT_BLOCK_CMDLETS 命令数据保存`Set`，供共享工具后续处理使用。
export const DANGEROUS_SCRIPT_BLOCK_CMDLETS = new Set([
  'invoke-command',
  'invoke-expression',
  'start-job',
  'start-threadjob',
  'register-scheduledjob',
  'register-engineevent',
  'register-objectevent',
  'register-wmievent',
  'new-pssession',
  'enter-pssession',
])

/**
 * Cmdlets that load and execute module/script code. `.psm1` files run
 * their top-level body on import — same code-execution risk as iex.
 */
// MODULE_LOADING_CMDLETS 命令数据保存`Set`，供共享工具后续处理使用。
export const MODULE_LOADING_CMDLETS = new Set([
  'import-module',
  'ipmo',
  'install-module',
  'save-module',
  'update-module',
  'install-script',
  'save-script',
])

/**
 * Shells and process spawners. Small, stable — add here only for cmdlets
 * not covered by the validator lists above.
 */
// SHELLS_AND_SPAWNERS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SHELLS_AND_SPAWNERS = [
  'pwsh',
  'powershell',
  'cmd',
  'bash',
  'wsl',
  'sh',
  'start-process',
  'start',
  'add-type',
  'new-object',
] as const

// aliasesOf 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function aliasesOf(targets: ReadonlySet<string>): string[] {
  // 返回 `Object.entries(COMMON_ALIASES)`，作为共享工具这次计算的结果。
  return Object.entries(COMMON_ALIASES)
    .filter(([, target]) => targets.has(target.toLowerCase()))
    .map(([alias]) => alias)
}

/**
 * Network cmdlets — wildcard rules for these enable exfil/download without
 * prompt. No legitimate narrow prefix exists.
 */
// NETWORK_CMDLETS 命令数据保存`Set`，供共享工具后续处理使用。
export const NETWORK_CMDLETS = new Set([
  'invoke-webrequest',
  'invoke-restmethod',
])

/**
 * Alias/variable mutation cmdlets — Set-Alias rebinds command resolution,
 * Set-Variable can poison $PSDefaultParameterValues. checkRuntimeStateManipulation
 * validator in powershellSecurity.ts independently gates on the permission path.
 */
// ALIAS_HIJACK_CMDLETS 命令数据保存`Set`，供共享工具后续处理使用。
export const ALIAS_HIJACK_CMDLETS = new Set([
  'set-alias',
  'sal', // alias not in COMMON_ALIASES — list explicitly
  'new-alias',
  'nal', // alias not in COMMON_ALIASES — list explicitly
  'set-variable',
  'sv', // alias not in COMMON_ALIASES — list explicitly
  'new-variable',
  'nv', // alias not in COMMON_ALIASES — list explicitly
])

/**
 * WMI/CIM process spawn — Invoke-WmiMethod -Class Win32_Process -Name Create
 * is a Start-Process equivalent that bypasses checkStartProcess. No legitimate
 * narrow prefix exists; any invocation can spawn arbitrary processes.
 * checkWmiProcessSpawn validator gates on the permission path.
 * (security finding #34)
 */
// WMI_CIM_CMDLETS 命令数据保存`Set`，供共享工具后续处理使用。
export const WMI_CIM_CMDLETS = new Set([
  'invoke-wmimethod',
  'iwmi', // alias not in COMMON_ALIASES — list explicitly
  'invoke-cimmethod',
])

/**
 * Cmdlets in CMDLET_ALLOWLIST with additionalCommandIsDangerousCallback.
 *
 * The allowlist auto-allows these for safe args (StringConstant identifiers).
 * The permission dialog only fires when the callback rejected — i.e. the args
 * contain a scriptblock, variable, subexpression, etc. Accepting a
 * `Cmdlet:*` wildcard at that point would match ALL future invocations via
 * prefix-startsWith, bypassing the callback forever.
 * `ForEach-Object:*` → `ForEach-Object { Remove-Item -Recurse / }` auto-allows.
 *
 * Sync with readOnlyValidation.ts — test/utils/powershell/dangerousCmdlets.test.ts
 * asserts this set covers every additionalCommandIsDangerousCallback entry.
 */
// ARG_GATED_CMDLETS 命令数据保存`Set`，供共享工具后续处理使用。
export const ARG_GATED_CMDLETS = new Set([
  'select-object',
  'sort-object',
  'group-object',
  'where-object',
  'measure-object',
  'write-output',
  'write-host',
  'start-sleep',
  'format-table',
  'format-list',
  'format-wide',
  'format-custom',
  'out-string',
  'out-host',
  // Native executables with callback-gated args (e.g. ipconfig /flushdns
  // is rejected, ipconfig /all is allowed). Same bypass risk.
  'ipconfig',
  'hostname',
  'route',
])

/**
 * Commands to never suggest as a wildcard prefix in the permission dialog.
 *
 * Derived from the validator lists above plus the small static shells list.
 * Add a cmdlet to the appropriate validator list and it automatically
 * appears here — no separate maintenance.
 */
// 这个回调绑定到 export const NEVER_SUGGEST: ReadonlySet<string> = (() => {，负责共享工具在该局部场景下的响应。
export const NEVER_SUGGEST: ReadonlySet<string> = (() => {
  // core 命名 `new Set<string>([`，让后续代码直接表达这个值的用途。
  const core = new Set<string>([
    ...SHELLS_AND_SPAWNERS,
    ...FILEPATH_EXECUTION_CMDLETS,
    ...DANGEROUS_SCRIPT_BLOCK_CMDLETS,
    ...MODULE_LOADING_CMDLETS,
    ...NETWORK_CMDLETS,
    ...ALIAS_HIJACK_CMDLETS,
    ...WMI_CIM_CMDLETS,
    ...ARG_GATED_CMDLETS,
    // ForEach-Object's -MemberName (positional: `% Delete`) resolves against
    // the runtime pipeline object — `Get-ChildItem | % Delete` invokes
    // FileInfo.Delete(). StaticParameterBinder identifies the
    // PropertyAndMethodSet parameter set, but the set handles both; the arg
    // is a plain StringConstantExpressionAst with no property/method signal.
    // Pipeline type inference (upstream OutputType → GetMember) misses ETS
    // AliasProperty members and has no answer for `$var | %` or external
    // upstream. Not in ARG_GATED (no allowlist entry to sync with).
    'foreach-object',
    // Interpreters/runners — `node script.js` stops at the file arg and
    // suggests bare `node:*`, auto-allowing arbitrary code via -e/-p. The
    // auto-mode classifier strips these rules (isDangerousPowerShellPermission)
    // but the suggestion gate didn't. Multi-word entries ('npm run') are
    // filtered out — NEVER_SUGGEST is a single-name lookup on cmd.name.
    // 链式调用 链式方法，继续加工上一行在共享工具中产生的数据。
    ...CROSS_PLATFORM_CODE_EXEC.filter(p => !p.includes(' ')),
  ])
  // 返回 `new Set([...core, ...aliasesOf(core)])`，作为共享工具这次计算的结果。
  return new Set([...core, ...aliasesOf(core)])
})()
