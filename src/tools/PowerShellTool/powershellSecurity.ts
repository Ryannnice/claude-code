/**
 * PowerShell-specific security analysis for command validation.
 *
 * Detects dangerous patterns: code injection, download cradles, privilege
 * escalation, dynamic command names, COM objects, etc.
 *
 * All checks are AST-based. If parsing failed (valid=false), none of the
 * individual checks match and powershellCommandIsSafe returns 'ask'.
 */

// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  DANGEROUS_SCRIPT_BLOCK_CMDLETS,
  FILEPATH_EXECUTION_CMDLETS,
  MODULE_LOADING_CMDLETS,
} from '../../utils/powershell/dangerousCmdlets.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  ParsedCommandElement,
  ParsedPowerShellCommand,
} from '../../utils/powershell/parser.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  COMMON_ALIASES,
  commandHasArgAbbreviation,
  deriveSecurityFlags,
  getAllCommands,
  getVariablesByScope,
  hasCommandNamed,
} from '../../utils/powershell/parser.js'
// 引入 isClmAllowedType，将 ./clmTypes.js 中已经封装好的能力接到本文件流程里。
import { isClmAllowedType } from './clmTypes.js'

// PowerShellSecurityResult 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type PowerShellSecurityResult = {
  behavior: 'passthrough' | 'ask' | 'allow'
  message?: string
}

// POWERSHELL_EXECUTABLES 集合保存`Set`，供工具调用后续处理使用。
const POWERSHELL_EXECUTABLES = new Set([
  'pwsh',
  'pwsh.exe',
  'powershell',
  'powershell.exe',
])

/**
 * Extracts the base executable name from a command, handling full paths
 * like /usr/bin/pwsh, C:\Windows\...\powershell.exe, or .\pwsh.
 */
// isPowerShellExecutable 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isPowerShellExecutable(name: string): boolean {
  // lower保存`name.toLowerCase`，供工具调用后续处理使用。
  const lower = name.toLowerCase()
  // 满足 `POWERSHELL_EXECUTABLES.has(lower)` 时，工具调用执行该分支。
  if (POWERSHELL_EXECUTABLES.has(lower)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Extract basename from paths (both / and \ separators)
  // lastSep保存`Math.max`，供工具调用后续处理使用。
  const lastSep = Math.max(lower.lastIndexOf('/'), lower.lastIndexOf('\\'))
  // 满足 `lastSep >= 0` 时，工具调用执行该分支。
  if (lastSep >= 0) {
    // 返回 `POWERSHELL_EXECUTABLES.has(lower.slice(lastSep + 1))`，作为工具调用这次计算的结果。
    return POWERSHELL_EXECUTABLES.has(lower.slice(lastSep + 1))
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Alternative parameter-prefix characters that PowerShell accepts as equivalent
 * to ASCII hyphen-minus (U+002D). PowerShell's tokenizer (SpecialCharacters.IsDash)
 * and powershell.exe's CommandLineParameterParser both accept all four dash
 * characters plus Windows PowerShell 5.1's `/` parameter delimiter.
 * Extent.Text preserves the raw character; transformCommandAst uses ce.text for
 * CommandParameterAst elements, so these reach us unchanged.
 */
// PS_ALT_PARAM_PREFIXES 集合保存`Set`，供工具调用后续处理使用。
const PS_ALT_PARAM_PREFIXES = new Set([
  '/', // Windows PowerShell 5.1 (powershell.exe, not pwsh 7+)
  '\u2013', // en-dash
  '\u2014', // em-dash
  '\u2015', // horizontal bar
])

/**
 * Wrapper around commandHasArgAbbreviation that also matches alternative
 * parameter prefixes (`/`, en-dash, em-dash, horizontal-bar). PowerShell's
 * tokenizer (SpecialCharacters.IsDash) accepts these for both powershell.exe
 * args AND cmdlet parameters, so use this for ALL PS param checks — not just
 * pwsh.exe invocations. Previously checkComObject/checkStartProcess/
 * checkDangerousFilePathExecution/checkForEachMemberName used bare
 * commandHasArgAbbreviation, so `Start-Process foo –Verb RunAs` bypassed.
 */
// psExeHasParamAbbreviation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function psExeHasParamAbbreviation(
  cmd: ParsedCommandElement,
  fullParam: string,
  minPrefix: string,
): boolean {
  // 满足 `commandHasArgAbbreviation(cmd, fullParam, minPrefix)` 时，工具调用执行该分支。
  if (commandHasArgAbbreviation(cmd, fullParam, minPrefix)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Normalize alternative prefixes to `-` and re-check. Build a synthetic cmd
  // with normalized args; commandHasArgAbbreviation handles colon-value split.
  // normalized 集中保存工具实现 powershell Security要一起传递的字段。
  const normalized: ParsedCommandElement = {
    ...cmd,
    // 这个回调绑定到 args: cmd.args.map(a =>，负责工具调用在该局部场景下的响应。
    args: cmd.args.map(a =>
      a.length > 0 && PS_ALT_PARAM_PREFIXES.has(a[0]!) ? '-' + a.slice(1) : a,
    ),
  }
  // 返回 `commandHasArgAbbreviation(normalized, fullParam, minPrefix)`，作为工具调用这次计算的结果。
  return commandHasArgAbbreviation(normalized, fullParam, minPrefix)
}

/**
 * Checks if a PowerShell command uses Invoke-Expression or its alias (iex).
 * These are equivalent to eval and can execute arbitrary code.
 */
// checkInvokeExpression 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkInvokeExpression(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 满足 `hasCommandNamed(parsed, 'Invoke-Expression')` 时，工具调用执行该分支。
  if (hasCommandNamed(parsed, 'Invoke-Expression')) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command uses Invoke-Expression which can execute arbitrary code',
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for dynamic command invocation where the command name itself is an
 * expression that cannot be statically resolved.
 *
 * PoCs:
 *   & ${function:Invoke-Expression} 'payload'  — VariableExpressionAst
 *   & ('iex','x')[0] 'payload'                 — IndexExpressionAst → 'Other'
 *   & ('i'+'ex') 'payload'                     — BinaryExpressionAst → 'Other'
 *
 * In all cases cmd.name is the literal extent text (e.g. "('iex','x')[0]"),
 * which doesn't match hasCommandNamed('Invoke-Expression'). At runtime
 * PowerShell evaluates the expression to a command name and invokes it.
 *
 * Legitimate command names are ALWAYS StringConstantExpressionAst (mapped to
 * 'StringConstant'): `Get-Process`, `git`, `ls`. Any other element type in
 * name position is dynamic. Rather than denylisting dynamic types (fragile —
 * mapElementType's default case maps unknown AST types to 'Other', which a
 * `=== 'Variable'` check misses), we allowlist 'StringConstant'.
 *
 * elementTypes[0] is the command-name element (transformCommandAst pushes it
 * first, before arg elements). The `!== undefined` guard preserves fail-open
 * when elementTypes is absent (parse-detail unavailable — if parsing failed
 * entirely, valid=false already returns 'ask' earlier in the chain).
 */
// checkDynamicCommandName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkDynamicCommandName(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // `cmd.elementType` 与 `'CommandAst'` 不一致时刷新派生状态，避免使用过期结果。
    if (cmd.elementType !== 'CommandAst') {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // nameElementType 命名 `cmd.elementTypes?.[0]`，让后续代码直接表达这个值的用途。
    const nameElementType = cmd.elementTypes?.[0]
    // `nameElementType` 与 `undefined && nameElementType` 不一致时刷新派生状态，避免使用过期结果。
    if (nameElementType !== undefined && nameElementType !== 'StringConstant') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'Command name is a dynamic expression which cannot be statically validated',
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for encoded command parameters which obscure intent.
 * These are commonly used in malware to bypass security tools.
 */
// checkEncodedCommand 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkEncodedCommand(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // 满足 `isPowerShellExecutable(cmd.name)` 时，工具调用执行该分支。
    if (isPowerShellExecutable(cmd.name)) {
      // 满足 `psExeHasParamAbbreviation(cmd, '-encodedcommand', '-e')` 时，工具调用执行该分支。
      if (psExeHasParamAbbreviation(cmd, '-encodedcommand', '-e')) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'ask',
          message: 'Command uses encoded parameters which obscure intent',
        }
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for PowerShell re-invocation (nested pwsh/powershell process).
 *
 * Any PowerShell executable in command position is flagged — not just
 * -Command/-File. Bare `pwsh` receiving stdin (`Get-Content x | pwsh`) or
 * a positional script path executes arbitrary code with none of the explicit
 * flags present. Same unvalidatable-nested-process reasoning as
 * checkStartProcess vector 2: we cannot statically analyze what the child
 * process will run.
 */
// checkPwshCommandOrFile 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkPwshCommandOrFile(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // 满足 `isPowerShellExecutable(cmd.name)` 时，工具调用执行该分支。
    if (isPowerShellExecutable(cmd.name)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'Command spawns a nested PowerShell process which cannot be validated',
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for download cradle patterns - common malware techniques
 * that download and execute remote code.
 *
 * Per-statement: catches piped cradles (`IWR ... | IEX`).
 * Cross-statement: catches split cradles (`$r = IWR ...; IEX $r.Content`).
 * The cross-statement case is already blocked by checkInvokeExpression (which
 * scans all statements), but this check improves the warning message.
 */
// DOWNLOADER_NAMES 集合保存`Set`，供工具调用后续处理使用。
const DOWNLOADER_NAMES = new Set([
  'invoke-webrequest',
  'iwr',
  'invoke-restmethod',
  'irm',
  'new-object',
  'start-bitstransfer', // MITRE T1197
])

// isDownloader 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isDownloader(name: string): boolean {
  // 返回 `DOWNLOADER_NAMES.has(name.toLowerCase())`，作为工具调用这次计算的结果。
  return DOWNLOADER_NAMES.has(name.toLowerCase())
}

// isIex 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isIex(name: string): boolean {
  // lower保存`name.toLowerCase`，供工具调用后续处理使用。
  const lower = name.toLowerCase()
  // 返回 `lower === 'invoke-expression' || lower === 'iex'`，作为工具调用这次计算的结果。
  return lower === 'invoke-expression' || lower === 'iex'
}

// checkDownloadCradles 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkDownloadCradles(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // Per-statement: piped cradle (IWR ... | IEX)
  // 按顺序遍历 `parsed.statements` 中的statement 状态，逐个交给工具调用处理。
  for (const statement of parsed.statements) {
    // cmds 命令数据 命名 `statement.commands`，让后续代码直接表达这个值的用途。
    const cmds = statement.commands
    // 满足 `cmds.length < 2` 时，工具调用执行该分支。
    if (cmds.length < 2) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // hasDownloader记录 `cmds.some` 是否成立，工具调用随后按该结果分支。
    const hasDownloader = cmds.some(cmd => isDownloader(cmd.name))
    // hasIex记录 `cmds.some` 是否成立，工具调用随后按该结果分支。
    const hasIex = cmds.some(cmd => isIex(cmd.name))
    // 只有 `hasDownloader && hasIex` 满足时，工具调用才执行该分支。
    if (hasDownloader && hasIex) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: 'Command downloads and executes remote code',
      }
    }
  }

  // Cross-statement: split cradle ($r = IWR ...; IEX $r.Content).
  // No new false positives: if IEX is present, checkInvokeExpression already asks.
  // all读取`getAllCommands`，供工具调用后续处理使用。
  const all = getAllCommands(parsed)
  // 只有 `all.some(c => isDownloader(c.name)) && all.some(c => isIex(c.name))` 满足时，工具调用才执行该分支。
  if (all.some(c => isDownloader(c.name)) && all.some(c => isIex(c.name))) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command downloads and executes remote code',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for standalone download utilities — LOLBAS tools commonly used to
 * fetch payloads. Unlike checkDownloadCradles (which requires download + IEX
 * in-pipeline), this flags the download operation itself.
 *
 * Start-BitsTransfer: always a file transfer (MITRE T1197).
 * certutil -urlcache: classic LOLBAS download. Only flagged with -urlcache;
 * bare `certutil` has many legitimate cert-management uses.
 * bitsadmin /transfer: legacy BITS download (pre-PowerShell).
 */
// checkDownloadUtilities 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkDownloadUtilities(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // Start-BitsTransfer is purpose-built for file transfer — no safe variant.
    // 当 `lower` 匹配 `'start-bitstransfer'` 时，工具调用执行对应分支。
    if (lower === 'start-bitstransfer') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: 'Command downloads files via BITS transfer',
      }
    }
    // certutil / certutil.exe — only when -urlcache is present. certutil has
    // many non-download uses (cert store queries, encoding, etc.).
    // certutil.exe accepts both -urlcache and /urlcache per standard Windows
    // utility convention — check both forms (bitsadmin below does the same).
    // 当 `lower` 匹配 `'certutil' || lower === 'ce...` 时，工具调用执行对应分支。
    if (lower === 'certutil' || lower === 'certutil.exe') {
      // hasUrlcache 缓存记录 `args.some` 是否成立，工具调用随后按该结果分支。
      const hasUrlcache = cmd.args.some(a => {
        // la保存`a.toLowerCase`，供工具调用后续处理使用。
        const la = a.toLowerCase()
        // 返回 `la === '-urlcache' || la === '/urlcache'`，作为工具调用这次计算的结果。
        return la === '-urlcache' || la === '/urlcache'
      })
      // 满足 `hasUrlcache` 时，工具调用执行该分支。
      if (hasUrlcache) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'ask',
          message: 'Command uses certutil to download from a URL',
        }
      }
    }
    // bitsadmin /transfer — legacy BITS CLI, same threat as Start-BitsTransfer.
    // 当 `lower` 匹配 `'bitsadmin' || lower === 'b...` 时，工具调用执行对应分支。
    if (lower === 'bitsadmin' || lower === 'bitsadmin.exe') {
      // 满足 `cmd.args.some(a => a.toLowerCase() === '/transfer')` 时，工具调用执行该分支。
      if (cmd.args.some(a => a.toLowerCase() === '/transfer')) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'ask',
          message: 'Command downloads files via BITS transfer',
        }
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for Add-Type usage which compiles and loads .NET code at runtime.
 * This can be used to execute arbitrary compiled code.
 */
// checkAddType 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkAddType(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 满足 `hasCommandNamed(parsed, 'Add-Type')` 时，工具调用执行该分支。
  if (hasCommandNamed(parsed, 'Add-Type')) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command compiles and loads .NET code',
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for New-Object -ComObject. COM objects like WScript.Shell,
 * Shell.Application, MMC20.Application, Schedule.Service, Msxml2.XMLHTTP
 * have their own execution/download capabilities — no IEX required.
 *
 * We can't enumerate all dangerous ProgIDs, so flag any -ComObject. Object
 * creation alone is inert, but the prompt should warn the user that COM
 * instantiation is an execution primitive. Method invocation on the result
 * (.Run(), .Exec()) is separately caught by checkMemberInvocations.
 */
// checkComObject 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkComObject(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // `cmd.name.toLowerCase()` 与 `'new-object'` 不一致时刷新派生状态，避免使用过期结果。
    if (cmd.name.toLowerCase() !== 'new-object') {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // -ComObject min abbrev is -com (New-Object params: -TypeName, -ComObject,
    // -ArgumentList, -Property, -Strict; -co is ambiguous in PS5.1 due to
    // common params like -Confirm, so use -com).
    // 满足 `psExeHasParamAbbreviation(cmd, '-comobject', '-com')` 时，工具调用执行该分支。
    if (psExeHasParamAbbreviation(cmd, '-comobject', '-com')) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'Command instantiates a COM object which may have execution capabilities',
      }
    }
    // SECURITY: checkTypeLiterals only sees [bracket] syntax from
    // parsed.typeLiterals. `New-Object System.Net.WebClient` passes the type
    // as a STRING ARG (StringConstantExpressionAst), not a TypeExpressionAst,
    // so CLM never fires. Extract -TypeName (named, colon-bound, or
    // positional-0) and run through isClmAllowedType. Closes attackVectors D4.
    // typeName 先占位，稍后的条件分支会根据实际输入补齐它。
    let typeName: string | undefined
    // 按索引扫描 `cmd.args.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < cmd.args.length; i++) {
      // a读取 `cmd.args[i]!` 对应条目，后续围绕该成员继续处理。
      const a = cmd.args[i]!
      // lower保存`a.toLowerCase`，供工具调用后续处理使用。
      const lower = a.toLowerCase()
      // -TypeName abbrev: -t is unambiguous (no other New-Object -t* params).
      // Handle colon-bound form first: -TypeName:Foo.Bar
      // 只有 `lower.startsWith('-t') && lower.includes(':')` 满足时，工具调用才执行该分支。
      if (lower.startsWith('-t') && lower.includes(':')) {
        // colonIdx保存`a.indexOf`，供工具调用后续处理使用。
        const colonIdx = a.indexOf(':')
        // paramPart格式化`lower.slice`，供工具调用后续处理使用。
        const paramPart = lower.slice(0, colonIdx)
        // 满足 `'-typename'.startsWith(paramPart)` 时，工具调用执行该分支。
        if ('-typename'.startsWith(paramPart)) {
          // typeName更新为 `a.slice(colonIdx + 1)`，确保工具调用后续读取最新状态。
          typeName = a.slice(colonIdx + 1)
          // 结束这个分支或循环，避免工具调用继续落入后续路径。
          break
        }
      }
      // Space-separated form: -TypeName Foo.Bar
      // 工具调用在这里按实际状态进入对应分支。
      if (
        lower.startsWith('-t') &&
        '-typename'.startsWith(lower) &&
        cmd.args[i + 1] !== undefined
      ) {
        // typeName更新为 `cmd.args[i + 1]`，确保工具调用后续读取最新状态。
        typeName = cmd.args[i + 1]
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      }
    }
    // Positional-0 binds to -TypeName (NetParameterSet default). Named params
    // (-Strict, -ArgumentList, -Property, -ComObject) may appear before the
    // positional TypeName, so scan past them to find the first non-consumed arg.
    // 满足 `typeName === undefined` 时，工具调用执行该分支。
    if (typeName === undefined) {
      // New-Object named params that consume a following value argument
      // VALUE_PARAMS 集合保存`Set`，供工具调用后续处理使用。
      const VALUE_PARAMS = new Set(['-argumentlist', '-comobject', '-property'])
      // Switch params (no value argument)
      // SWITCH_PARAMS 集合保存`Set`，供工具调用后续处理使用。
      const SWITCH_PARAMS = new Set(['-strict'])
      // 按索引扫描 `cmd.args.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < cmd.args.length; i++) {
        // a读取 `cmd.args[i]!` 对应条目，后续围绕该成员继续处理。
        const a = cmd.args[i]!
        // 满足 `a.startsWith('-')` 时，工具调用执行该分支。
        if (a.startsWith('-')) {
          // lower保存`a.toLowerCase`，供工具调用后续处理使用。
          const lower = a.toLowerCase()
          // Skip -TypeName variants (already handled by named-param loop above)
          // 只有 `lower.startsWith('-t') && '-typename'.startsWith(lower)` 满足时，工具调用才执行该分支。
          if (lower.startsWith('-t') && '-typename'.startsWith(lower)) {
            // 工具实现 powershell Security在这里处理 `i++ // skip value`，完成这一小步状态转换。
            i++ // skip value
            // 跳过当前项，继续处理工具调用中的下一轮循环。
            continue
          }
          // Colon-bound form: -Param:Value (single token, no skip needed)
          // 满足 `lower.includes(':')` 时，工具调用执行该分支。
          if (lower.includes(':')) continue
          // 满足 `SWITCH_PARAMS.has(lower)` 时，工具调用执行该分支。
          if (SWITCH_PARAMS.has(lower)) continue
          // 满足 `VALUE_PARAMS.has(lower)` 时，工具调用执行该分支。
          if (VALUE_PARAMS.has(lower)) {
            // 工具实现 powershell Security在这里处理 `i++ // skip value`，完成这一小步状态转换。
            i++ // skip value
            // 跳过当前项，继续处理工具调用中的下一轮循环。
            continue
          }
          // Unknown param — skip conservatively
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue
        }
        // First non-dash arg is the positional TypeName
        // typeName更新为 `a`，确保工具调用后续读取最新状态。
        typeName = a
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      }
    }
    // `typeName` 与 `undefined && !isClmAllowedType(...` 不一致时刷新派生状态，避免使用过期结果。
    if (typeName !== undefined && !isClmAllowedType(typeName)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: `New-Object instantiates .NET type '${typeName}' outside the ConstrainedLanguage allowlist`,
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for DANGEROUS_SCRIPT_BLOCK_CMDLETS invoked with -FilePath (or
 * -LiteralPath). These run a script file — arbitrary code execution with no
 * ScriptBlockAst in the tree.
 *
 * checkScriptBlockInjection only fires when hasScriptBlocks is true. With
 * -FilePath there is no ScriptBlockAst, so DANGEROUS_SCRIPT_BLOCK_CMDLETS is
 * never consulted. This check closes that gap for the -FilePath vector.
 *
 * Cmdlets in DANGEROUS_SCRIPT_BLOCK_CMDLETS that accept -FilePath:
 *   Invoke-Command   -FilePath             (icm alias via COMMON_ALIASES)
 *   Start-Job        -FilePath, -LiteralPath
 *   Start-ThreadJob  -FilePath
 *   Register-ScheduledJob -FilePath
 * The *-PSSession and Register-*Event entries do not accept -FilePath.
 *
 * -f is unambiguous for -FilePath on all four (no other -f* params).
 * -l is unambiguous for -LiteralPath on Start-Job; harmless no-op on the
 * others (no -l* params to collide with).
 */

// checkDangerousFilePathExecution 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkDangerousFilePathExecution(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // resolved保存`toLowerCase`，供工具调用后续处理使用。
    const resolved = COMMON_ALIASES[lower]?.toLowerCase() ?? lower
    // 满足 `!FILEPATH_EXECUTION_CMDLETS.has(resolved)` 时，工具调用执行该分支。
    if (!FILEPATH_EXECUTION_CMDLETS.has(resolved)) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 工具调用在这里按实际状态进入对应分支。
    if (
      psExeHasParamAbbreviation(cmd, '-filepath', '-f') ||
      psExeHasParamAbbreviation(cmd, '-literalpath', '-l')
    ) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: `${cmd.name} -FilePath executes an arbitrary script file`,
      }
    }
    // Positional binding: `Start-Job script.ps1` binds position-0 to
    // -FilePath via FilePathParameterSet resolution (ScriptBlock args select
    // ScriptBlockParameterSet instead). Same pattern as checkForEachMemberName:
    // any non-dash StringConstant is a potential -FilePath. Over-flagging
    // (e.g., `Start-Job -Name foo` where `foo` is StringConstant) is fail-safe.
    // 按索引扫描 `cmd.args.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < cmd.args.length; i++) {
      // argType保存`cmd.elementTypes?.[i + 1]`，供工具实现 powershell Security后续判断或输出使用。
      const argType = cmd.elementTypes?.[i + 1]
      // 当前参数 命名 `cmd.args[i]`，让后续代码直接表达这个值的用途。
      const arg = cmd.args[i]
      // 只有 `argType === 'StringConstant' && arg && !arg.startsWith('-')` 满足时，工具调用才执行该分支。
      if (argType === 'StringConstant' && arg && !arg.startsWith('-')) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'ask',
          message: `${cmd.name} with positional string argument binds to -FilePath and executes a script file`,
        }
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for ForEach-Object -MemberName. Invokes a method by string name on
 * every piped object — semantically equivalent to `| % { $_.Method() }` but
 * without any ScriptBlockAst or InvokeMemberExpressionAst in the tree.
 *
 * PoC: `Get-Process | ForEach-Object -MemberName Kill` → kills all processes.
 * checkScriptBlockInjection misses it (no script block); checkMemberInvocations
 * misses it (no .Method() syntax). Aliases `%` and `foreach` resolve via
 * COMMON_ALIASES.
 */
// checkForEachMemberName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkForEachMemberName(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // resolved保存`toLowerCase`，供工具调用后续处理使用。
    const resolved = COMMON_ALIASES[lower]?.toLowerCase() ?? lower
    // `resolved` 与 `'foreach-object'` 不一致时刷新派生状态，避免使用过期结果。
    if (resolved !== 'foreach-object') {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // ForEach-Object params starting with -m: only -MemberName. -m is unambiguous.
    // 满足 `psExeHasParamAbbreviation(cmd, '-membername', '-m')` 时，工具调用执行该分支。
    if (psExeHasParamAbbreviation(cmd, '-membername', '-m')) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'ForEach-Object -MemberName invokes methods by string name which cannot be validated',
      }
    }
    // PS7+: `ForEach-Object Kill` binds a positional string arg to
    // -MemberName via MemberSet parameter-set resolution (ScriptBlock args
    // select ScriptBlockSet instead). Scan ALL args — `-Verbose Kill` or
    // `-ErrorAction Stop Kill` still binds Kill positionally. Any non-dash
    // StringConstant is a potential -MemberName; over-flagging is fail-safe.
    // 按索引扫描 `cmd.args.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < cmd.args.length; i++) {
      // argType保存`cmd.elementTypes?.[i + 1]`，供工具实现 powershell Security后续判断或输出使用。
      const argType = cmd.elementTypes?.[i + 1]
      // 当前参数 命名 `cmd.args[i]`，让后续代码直接表达这个值的用途。
      const arg = cmd.args[i]
      // 只有 `argType === 'StringConstant' && arg && !arg.startsWith('-')` 满足时，工具调用才执行该分支。
      if (argType === 'StringConstant' && arg && !arg.startsWith('-')) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'ask',
          message:
            'ForEach-Object with positional string argument binds to -MemberName and invokes methods by name',
        }
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Checks for dangerous Start-Process patterns.
 *
 * Two vectors:
 * 1. `-Verb RunAs` — privilege escalation (UAC prompt).
 * 2. Launching a PowerShell executable — nested invocation.
 * `Start-Process pwsh -ArgumentList "-e <b64>"` evades
 * checkEncodedCommand/checkPwshCommandOrFile because cmd.name is
 * `Start-Process`, not `pwsh`. The `-e` lives inside the -ArgumentList
 * string value and is never parsed as a param on the outer command.
 * Rather than parse -ArgumentList contents (fragile — it's an opaque
 * string or array), flag any Start-Process whose target is a PS
 * executable: the nested invocation is unvalidatable by construction.
 */
// checkStartProcess 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkStartProcess(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // `lower` 与 `'start-process' && lower !== 's...` 不一致时刷新派生状态，避免使用过期结果。
    if (lower !== 'start-process' && lower !== 'saps' && lower !== 'start') {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // Vector 1: -Verb RunAs (space or colon syntax).
    // Space syntax: psExeHasParamAbbreviation finds -Verb/-v, then scan args
    // for a bare 'runas' token.
    // 工具调用在这里按实际状态进入对应分支。
    if (
      psExeHasParamAbbreviation(cmd, '-Verb', '-v') &&
      // 调用 cmd.args.some，触发工具调用此处需要的副作用。
      cmd.args.some(a => a.toLowerCase() === 'runas')
    ) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: 'Command requests elevated privileges',
      }
    }
    // Colon syntax — two layers:
    // (a) Structural: PR #23554 added children[] for colon-bound param args.
    //     children[i] = [{type, text}] for the bound value. Check if any
    //     -v*-prefixed param has a child whose text normalizes (strip
    //     quotes/backtick/whitespace) to 'runas'. Robust against arbitrary
    //     quoting the regex can't anticipate.
    // (b) Regex fallback: for parsed output without children[] or as
    //     defense-in-depth. -Verb:'RunAs', -Verb:"RunAs", -Verb:`runas all
    //     bypassed the old /...:runas$/ pattern because the quote/tick broke
    //     the match.
    // 满足 `cmd.children` 时，工具调用执行该分支。
    if (cmd.children) {
      // 按索引扫描 `cmd.args.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < cmd.args.length; i++) {
        // Strip backticks before matching param name (bug #14): -V`erb:RunAs
        // argClean格式化`replace`，供工具调用后续处理使用。
        const argClean = cmd.args[i]!.replace(/`/g, '')
        if (!/^[-\u2013\u2014\u2015/]v[a-z]*:/i.test(argClean)) continue
        const kids = cmd.children[i]
        if (!kids) continue
        for (const child of kids) {
          if (child.text.replace(/['"`\s]/g, '').toLowerCase() === 'runas') {
            // 返回结构化结果，集中表达工具调用已经整理出的状态。
            return {
              behavior: 'ask',
              message: 'Command requests elevated privileges',
            }
          }
        }
      }
    }
    // 工具调用在这里按实际状态进入对应分支。
    if (
      // 调用 cmd.args.some，触发工具调用此处需要的副作用。
      cmd.args.some(a => {
        // Strip backticks before matching (bug #14 / review nit #2)
        // clean格式化`a.replace`，供工具调用后续处理使用。
        const clean = a.replace(/`/g, '')
        return /^[-\u2013\u2014\u2015/]v[a-z]*:['"` ]*runas['"` ]*$/i.test(
          clean,
        )
      })
    ) {
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        message: 'Command requests elevated privileges',
      }
    }
    // Vector 2: Start-Process targeting a PowerShell executable.
    // Target is either the first positional arg or the value after -FilePath.
    // Scan all args — any PS-executable token present is treated as the launch
    // target. Known false-positive: path-valued params (-WorkingDirectory,
    // -RedirectStandard*) whose basename is pwsh/powershell —
    // isPowerShellExecutable extracts basenames from paths, so
    // `-WorkingDirectory C:\projects\pwsh` triggers. Accepted trade-off:
    // Start-Process is not in CMDLET_ALLOWLIST (always prompts regardless),
    // result is ask not reject, and correctly parsing Start-Process parameter
    // binding is fragile. Strip quotes the parser may have preserved.
    // 遍历 const arg of cmd.args，让工具调用逐项完成同一类处理。
    for (const arg of cmd.args) {
      // stripped格式化`arg.replace`，供工具调用后续处理使用。
      const stripped = arg.replace(/^['"]|['"]$/g, '')
      // 满足 `isPowerShellExecutable(stripped)` 时，工具调用执行该分支。
      if (isPowerShellExecutable(stripped)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'ask',
          message:
            'Start-Process launches a nested PowerShell process which cannot be validated',
        }
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Cmdlets where script blocks are safe (filtering/output cmdlets).
 * Script blocks piped to these are just predicates or projections, not arbitrary execution.
 */
// SAFE_SCRIPT_BLOCK_CMDLETS 命令数据保存`Set`，供工具调用后续处理使用。
const SAFE_SCRIPT_BLOCK_CMDLETS = new Set([
  'where-object',
  'sort-object',
  'select-object',
  'group-object',
  'format-table',
  'format-list',
  'format-wide',
  'format-custom',
  // NOT foreach-object — its block is arbitrary script, not a predicate.
  // getAllCommands recurses so commands inside the block ARE checked, but
  // non-command AST nodes (AssignmentStatementAst etc.) are invisible to it.
  // See powershellPermissions.ts step-5 hasScriptBlocks guard.
])

/**
 * Checks for script block injection patterns where script blocks
 * appear in suspicious contexts that could execute arbitrary code.
 *
 * Script blocks used with safe filtering/output cmdlets (Where-Object,
 * Sort-Object, Select-Object, Group-Object) are allowed.
 * Script blocks used with dangerous cmdlets (Invoke-Command, Invoke-Expression,
 * Start-Job, etc.) are flagged.
 */
// checkScriptBlockInjection 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkScriptBlockInjection(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // security保存`deriveSecurityFlags`，供工具调用后续处理使用。
  const security = deriveSecurityFlags(parsed)
  // security.hasScriptBlocks 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!security.hasScriptBlocks) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'passthrough' }
  }

  // Check all commands in the parsed result. If any command is in the
  // dangerous set, flag it. If all commands with script blocks are in
  // the safe set (or the allowlist), allow it.
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // 满足 `DANGEROUS_SCRIPT_BLOCK_CMDLETS.has(lower)` 时，工具调用执行该分支。
    if (DANGEROUS_SCRIPT_BLOCK_CMDLETS.has(lower)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'Command contains script block with dangerous cmdlet that may execute arbitrary code',
      }
    }
  }

  // Check if all commands are either safe script block consumers or don't use script blocks
  // allCommandsSafe 命令数据读取`getAllCommands`，供工具调用后续处理使用。
  const allCommandsSafe = getAllCommands(parsed).every(cmd => {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // Safe filtering/output cmdlets
    // 满足 `SAFE_SCRIPT_BLOCK_CMDLETS.has(lower)` 时，工具调用执行该分支。
    if (SAFE_SCRIPT_BLOCK_CMDLETS.has(lower)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // Resolve aliases
    // alias 集合保存`COMMON_ALIASES[lower]`，供工具实现 powershell Security后续判断或输出使用。
    const alias = COMMON_ALIASES[lower]
    // 只有 `alias && SAFE_SCRIPT_BLOCK_CMDLETS.has(alias.toLowerCase())` 满足时，工具调用才执行该分支。
    if (alias && SAFE_SCRIPT_BLOCK_CMDLETS.has(alias.toLowerCase())) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // Unknown command with script blocks present — flag as potentially dangerous
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  })

  // 满足 `allCommandsSafe` 时，工具调用执行该分支。
  if (allCommandsSafe) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'passthrough' }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'ask',
    message: 'Command contains script block that may execute arbitrary code',
  }
}

/**
 * AST-only check: Detects subexpressions $() which can hide command execution.
 */
// checkSubExpressions 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkSubExpressions(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 满足 `deriveSecurityFlags(parsed).hasSubExpressions` 时，工具调用执行该分支。
  if (deriveSecurityFlags(parsed).hasSubExpressions) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command contains subexpressions $()',
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * AST-only check: Detects expandable strings (double-quoted) with embedded
 * expressions like "$env:PATH" or "$(dangerous-command)". These can hide
 * command execution or variable interpolation inside string literals.
 */
// checkExpandableStrings 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkExpandableStrings(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 满足 `deriveSecurityFlags(parsed).hasExpandableStrings` 时，工具调用执行该分支。
  if (deriveSecurityFlags(parsed).hasExpandableStrings) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command contains expandable strings with embedded expressions',
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * AST-only check: Detects splatting (@variable) which can obscure arguments.
 */
// checkSplatting 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkSplatting(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 满足 `deriveSecurityFlags(parsed).hasSplatting` 时，工具调用执行该分支。
  if (deriveSecurityFlags(parsed).hasSplatting) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command uses splatting (@variable)',
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * AST-only check: Detects stop-parsing token (--%) which prevents further parsing.
 */
// checkStopParsing 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkStopParsing(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 满足 `deriveSecurityFlags(parsed).hasStopParsing` 时，工具调用执行该分支。
  if (deriveSecurityFlags(parsed).hasStopParsing) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command uses stop-parsing token (--%)',
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * AST-only check: Detects .NET method invocations which can access system APIs.
 */
// checkMemberInvocations 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkMemberInvocations(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 满足 `deriveSecurityFlags(parsed).hasMemberInvocations` 时，工具调用执行该分支。
  if (deriveSecurityFlags(parsed).hasMemberInvocations) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command invokes .NET methods',
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * AST-only check: type literals outside Microsoft's ConstrainedLanguage
 * allowlist. CLM blocks all .NET type access except ~90 primitives/attributes
 * Microsoft considers safe for untrusted code. We trust that list as the
 * "safe" boundary — anything outside it (Reflection.Assembly, IO.Pipes,
 * Diagnostics.Process, InteropServices.Marshal, etc.) can access system APIs
 * that compromise the permission model.
 *
 * Runs AFTER checkMemberInvocations: that broadly flags any ::Method / .Method()
 * call; this check is the more specific "which types" signal. Both fire on
 * [Reflection.Assembly]::Load; CLM gives the precise message. Pure type casts
 * like [int]$x have no member invocation and only hit this check.
 */
// checkTypeLiterals 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkTypeLiterals(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 按顺序遍历 `parsed.typeLiterals ?? []` 中的t，逐个交给工具调用处理。
  for (const t of parsed.typeLiterals ?? []) {
    // 满足 `!isClmAllowedType(t)` 时，工具调用执行该分支。
    if (!isClmAllowedType(t)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: `Command uses .NET type [${t}] outside the ConstrainedLanguage allowlist`,
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Invoke-Item (alias ii) opens a file with its default handler (ShellExecute
 * on Windows, open/xdg-open on Unix). On an .exe/.ps1/.bat/.cmd this is RCE.
 * Bug 008: ii is in no blocklist; passthrough prompt doesn't explain the
 * exec hazard. Always ask — there is no safe variant (even opening .txt may
 * invoke a user-configured handler that accepts arguments).
 */
// checkInvokeItem 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkInvokeItem(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // 当 `lower` 匹配 `'invoke-item' || lower === ...` 时，工具调用执行对应分支。
    if (lower === 'invoke-item' || lower === 'ii') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'Invoke-Item opens files with the default handler (ShellExecute). On executable files this runs arbitrary code.',
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Scheduled-task persistence primitives. Register-ScheduledJob was blocked
 * (DANGEROUS_SCRIPT_BLOCK_CMDLETS); the newer Register-ScheduledTask cmdlet
 * and legacy schtasks.exe /create were not. Persistence that survives the
 * session with no explanatory prompt.
 */
// SCHEDULED_TASK_CMDLETS 命令数据保存`Set`，供工具调用后续处理使用。
const SCHEDULED_TASK_CMDLETS = new Set([
  'register-scheduledtask',
  'new-scheduledtask',
  'new-scheduledtaskaction',
  'set-scheduledtask',
])

// checkScheduledTask 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkScheduledTask(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // 满足 `SCHEDULED_TASK_CMDLETS.has(lower)` 时，工具调用执行该分支。
    if (SCHEDULED_TASK_CMDLETS.has(lower)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: `${cmd.name} creates or modifies a scheduled task (persistence primitive)`,
      }
    }
    // 当 `lower` 匹配 `'schtasks' || lower === 'sc...` 时，工具调用执行对应分支。
    if (lower === 'schtasks' || lower === 'schtasks.exe') {
      // 工具调用在这里按实际状态进入对应分支。
      if (
        // 调用 cmd.args.some，触发工具调用此处需要的副作用。
        cmd.args.some(a => {
          // la保存`a.toLowerCase`，供工具调用后续处理使用。
          const la = a.toLowerCase()
          // 返回 `(`，作为工具调用这次计算的结果。
          return (
            la === '/create' ||
            la === '/change' ||
            la === '-create' ||
            la === '-change'
          )
        })
      ) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'ask',
          message:
            'schtasks with create/change modifies scheduled tasks (persistence primitive)',
        }
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * AST-only check: Detects environment variable manipulation via Set-Item/New-Item on env: scope.
 */
// ENV_WRITE_CMDLETS 命令数据保存`Set`，供工具调用后续处理使用。
const ENV_WRITE_CMDLETS = new Set([
  'set-item',
  'si',
  'new-item',
  'ni',
  'remove-item',
  'ri',
  'del',
  'rm',
  'rd',
  'rmdir',
  'erase',
  'clear-item',
  'cli',
  'set-content',
  // 'sc' omitted — collides with sc.exe on PS Core 7+, see COMMON_ALIASES note
  'add-content',
  'ac',
])

// checkEnvVarManipulation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkEnvVarManipulation(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // envVars 集合读取`getVariablesByScope`，供工具调用后续处理使用。
  const envVars = getVariablesByScope(parsed, 'env')
  // envVars 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (envVars.length === 0) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'passthrough' }
  }
  // Check if any command is a write cmdlet
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // 满足 `ENV_WRITE_CMDLETS.has(cmd.name.toLowerCase())` 时，工具调用执行该分支。
    if (ENV_WRITE_CMDLETS.has(cmd.name.toLowerCase())) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: 'Command modifies environment variables',
      }
    }
  }
  // Also flag if there are assignments involving env vars
  // 只有 `deriveSecurityFlags(parsed).hasAssignments && envVars.length > 0` 满足时，工具调用才执行该分支。
  if (deriveSecurityFlags(parsed).hasAssignments && envVars.length > 0) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command modifies environment variables',
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Module-loading cmdlets execute a .psm1's top-level script body (Import-Module)
 * or download from arbitrary repositories (Install-Module, Save-Module). A
 * wildcard allow rule like `Import-Module:*` would let an attacker-supplied
 * .psm1 execute with the user's privileges — same risk as Invoke-Expression.
 *
 * NEVER_SUGGEST (dangerousCmdlets.ts) derives from this list so the UI
 * never offers these as wildcard suggestions, but users can still manually
 * write allow rules. This check ensures the permission engine independently
 * gates these cmdlets.
 */

// checkModuleLoading 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkModuleLoading(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // 满足 `MODULE_LOADING_CMDLETS.has(lower)` 时，工具调用执行该分支。
    if (MODULE_LOADING_CMDLETS.has(lower)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'Command loads, installs, or downloads a PowerShell module or script, which can execute arbitrary code',
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Set-Alias/New-Alias can hijack future command resolution: after
 * `Set-Alias Get-Content Invoke-Expression`, any later `Get-Content $x`
 * executes arbitrary code. Set-Variable/New-Variable can poison
 * `$PSDefaultParameterValues` (e.g., `Set-Variable PSDefaultParameterValues
 * @{'*:Path'='/etc/passwd'}`) which alters every subsequent cmdlet's behavior.
 * Neither effect can be validated statically — we'd need to track all future
 * command resolutions in the session. Always ask.
 */
// RUNTIME_STATE_CMDLETS 命令数据保存`Set`，供工具调用后续处理使用。
const RUNTIME_STATE_CMDLETS = new Set([
  'set-alias',
  'sal',
  'new-alias',
  'nal',
  'set-variable',
  'sv',
  'new-variable',
  'nv',
])

// checkRuntimeStateManipulation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkRuntimeStateManipulation(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // Strip module qualifier: `Microsoft.PowerShell.Utility\Set-Alias` → `set-alias`
    // 原始文本保存`name.toLowerCase`，供工具调用后续处理使用。
    const raw = cmd.name.toLowerCase()
    // lower筛选`raw.includes`，供工具调用后续处理使用。
    const lower = raw.includes('\\')
      ? raw.slice(raw.lastIndexOf('\\') + 1)
      : raw
    // 满足 `RUNTIME_STATE_CMDLETS.has(lower)` 时，工具调用执行该分支。
    if (RUNTIME_STATE_CMDLETS.has(lower)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'Command creates or modifies an alias or variable that can affect future command resolution',
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Invoke-WmiMethod / Invoke-CimMethod are Start-Process equivalents via WMI.
 * `Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList "cmd /c ..."`
 * spawns an arbitrary process, bypassing checkStartProcess entirely. No narrow
 * safe usage exists — -Class and -MethodName accept arbitrary strings, so
 * gating on Win32_Process specifically would miss -Class $x or other process-
 * spawning WMI classes. Returns ask on any invocation. (security finding #34)
 */
// WMI_SPAWN_CMDLETS 命令数据保存`Set`，供工具调用后续处理使用。
const WMI_SPAWN_CMDLETS = new Set([
  'invoke-wmimethod',
  'iwmi',
  'invoke-cimmethod',
])

// checkWmiProcessSpawn 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function checkWmiProcessSpawn(
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // 逐项读取 `getAllCommands(parsed)` 中的cmd 命令数据，按输入顺序推进工具调用。
  for (const cmd of getAllCommands(parsed)) {
    // lower保存`name.toLowerCase`，供工具调用后续处理使用。
    const lower = cmd.name.toLowerCase()
    // 满足 `WMI_SPAWN_CMDLETS.has(lower)` 时，工具调用执行该分支。
    if (WMI_SPAWN_CMDLETS.has(lower)) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: `${cmd.name} can spawn arbitrary processes via WMI/CIM (Win32_Process Create)`,
      }
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}

/**
 * Main entry point for PowerShell security validation.
 * Checks a PowerShell command against known dangerous patterns.
 *
 * All checks are AST-based. If the AST parse failed (parsed.valid === false),
 * none of the individual checks will match and we return 'ask' as a safe default.
 *
 * @param command - The PowerShell command to validate (unused, kept for API compat)
 * @param parsed - Parsed AST from PowerShell's native parser (required)
 * @returns Security result indicating whether the command is safe
 */
// powershellCommandIsSafe 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function powershellCommandIsSafe(
  _command: string,
  parsed: ParsedPowerShellCommand,
): PowerShellSecurityResult {
  // If the AST parse failed, we cannot determine safety -- ask the user
  // parsed.valid缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parsed.valid) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Could not parse command for security analysis',
    }
  }

  // validators 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const validators = [
    checkInvokeExpression,
    checkDynamicCommandName,
    checkEncodedCommand,
    checkPwshCommandOrFile,
    checkDownloadCradles,
    checkDownloadUtilities,
    checkAddType,
    checkComObject,
    checkDangerousFilePathExecution,
    checkInvokeItem,
    checkScheduledTask,
    checkForEachMemberName,
    checkStartProcess,
    checkScriptBlockInjection,
    checkSubExpressions,
    checkExpandableStrings,
    checkSplatting,
    checkStopParsing,
    checkMemberInvocations,
    checkTypeLiterals,
    checkEnvVarManipulation,
    checkModuleLoading,
    checkRuntimeStateManipulation,
    checkWmiProcessSpawn,
  ]

  // 按顺序遍历 `validators` 中的validator，逐个交给工具调用处理。
  for (const validator of validators) {
    // 结果保存`validator`，供工具调用后续处理使用。
    const result = validator(parsed)
    // 当 `result.behavior` 匹配 `'ask'` 时，工具调用执行对应分支。
    if (result.behavior === 'ask') {
      // 返回 `result`，作为工具调用这次计算的结果。
      return result
    }
  }

  // All checks passed
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough' }
}
