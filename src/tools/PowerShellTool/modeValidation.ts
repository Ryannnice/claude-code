/**
 * PowerShell permission mode validation.
 *
 * Checks if commands should be auto-allowed based on the current permission mode.
 * In acceptEdits mode, filesystem-modifying PowerShell cmdlets are auto-allowed.
 * Follows the same patterns as BashTool/modeValidation.ts.
 */

// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'
// 类型依赖 { PermissionResult } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js'
// 类型依赖 { ParsedPowerShellCommand } 来自 ../../utils/powershell/parser.js，用于校准工具调用的数据契约。
import type { ParsedPowerShellCommand } from '../../utils/powershell/parser.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  deriveSecurityFlags,
  getPipelineSegments,
  PS_TOKENIZER_DASH_CHARS,
} from '../../utils/powershell/parser.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  argLeaksValue,
  isAllowlistedPipelineTail,
  isCwdChangingCmdlet,
  isSafeOutputCommand,
  resolveToCanonical,
} from './readOnlyValidation.js'

/**
 * Filesystem-modifying cmdlets that are auto-allowed in acceptEdits mode.
 * Stored as canonical (lowercase) cmdlet names.
 *
 * Tier 3 cmdlets with complex parameter binding removed — they fall through to
 * 'ask'. Only simple write cmdlets (first positional = -Path) are auto-allowed
 * here, and they get path validation via CMDLET_PATH_CONFIG in pathValidation.ts.
 */
// ACCEPT_EDITS_ALLOWED_CMDLETS 命令数据保存`Set`，供工具调用后续处理使用。
const ACCEPT_EDITS_ALLOWED_CMDLETS = new Set([
  'set-content',
  'add-content',
  'remove-item',
  'clear-content',
])

// isAcceptEditsAllowedCmdlet 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAcceptEditsAllowedCmdlet(name: string): boolean {
  // resolveToCanonical handles aliases via COMMON_ALIASES, so e.g. 'rm' → 'remove-item',
  // 'ac' → 'add-content'. Any alias that resolves to an allowed cmdlet is automatically
  // allowed. Tier 3 cmdlets (new-item, copy-item, move-item, etc.) and their aliases
  // (mkdir, ni, cp, mv, etc.) resolve to cmdlets NOT in the set and fall through to 'ask'.
  // canonical读取`resolveToCanonical`，供工具调用后续处理使用。
  const canonical = resolveToCanonical(name)
  // 返回 `ACCEPT_EDITS_ALLOWED_CMDLETS.has(canonical)`，作为工具调用这次计算的结果。
  return ACCEPT_EDITS_ALLOWED_CMDLETS.has(canonical)
}

/**
 * New-Item -ItemType values that create filesystem links (reparse points or
 * hard links). All three redirect path resolution at runtime — symbolic links
 * and junctions are directory/file reparse points; hard links alias a file's
 * inode. Any of these let a later relative-path write land outside the
 * validator's view.
 */
// LINK_ITEM_TYPES 集合保存`Set`，供工具调用后续处理使用。
const LINK_ITEM_TYPES = new Set(['symboliclink', 'junction', 'hardlink'])

/**
 * Check if a lowered, dash-normalized arg (colon-value stripped) is an
 * unambiguous PowerShell abbreviation of New-Item's -ItemType or -Type param.
 * Min prefixes: `-it` (avoids ambiguity with other New-Item params), `-ty`
 * (avoids `-t` colliding with `-Target`).
 */
// isItemTypeParamAbbrev 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isItemTypeParamAbbrev(p: string): boolean {
  // 返回 `(`，作为工具调用这次计算的结果。
  return (
    (p.length >= 3 && '-itemtype'.startsWith(p)) ||
    (p.length >= 3 && '-type'.startsWith(p))
  )
}

/**
 * Detects New-Item creating a filesystem link (-ItemType SymbolicLink /
 * Junction / HardLink, or the -Type alias). Links poison subsequent path
 * resolution the same way Set-Location/New-PSDrive do: a relative path
 * through the link resolves to the link target, not the validator's view.
 * Finding #18.
 *
 * Handles PS parameter abbreviation (`-it`, `-ite`, ... `-itemtype`; `-ty`,
 * `-typ`, `-type`), unicode dash prefixes (en-dash/em-dash/horizontal-bar),
 * and colon-bound values (`-it:Junction`).
 */
// isSymlinkCreatingCommand 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSymlinkCreatingCommand(cmd: {
  name: string
  args: string[]
}): boolean {
  // canonical读取`resolveToCanonical`，供工具调用后续处理使用。
  const canonical = resolveToCanonical(cmd.name)
  // `canonical` 与 `'new-item'` 不一致时刷新派生状态，避免使用过期结果。
  if (canonical !== 'new-item') return false
  // 按索引扫描 `cmd.args.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < cmd.args.length; i++) {
    // 原始文本保存`cmd.args[i] ?? ''`，供工具实现 mode Validation后续判断或输出使用。
    const raw = cmd.args[i] ?? ''
    // 原始文本为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (raw.length === 0) continue
    // Normalize unicode dash prefixes (–, —, ―) and forward-slash (PS 5.1
    // parameter prefix) → ASCII `-` so prefix comparison works. PS tokenizer
    // treats all four dash chars plus `/` as parameter markers. (bug #26)
    // normalized 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const normalized =
      PS_TOKENIZER_DASH_CHARS.has(raw[0]!) || raw[0] === '/'
        ? '-' + raw.slice(1)
        : raw
    // lower保存`normalized.toLowerCase`，供工具调用后续处理使用。
    const lower = normalized.toLowerCase()
    // Split colon-bound value: -it:SymbolicLink → param='-it', val='symboliclink'
    // colonIdx保存`lower.indexOf`，供工具调用后续处理使用。
    const colonIdx = lower.indexOf(':', 1)
    // paramRaw格式化`lower.slice`，供工具调用后续处理使用。
    const paramRaw = colonIdx > 0 ? lower.slice(0, colonIdx) : lower
    // Strip backtick escapes: -Item`Type → -ItemType (bug #22)
    // param格式化`paramRaw.replace`，供工具调用后续处理使用。
    const param = paramRaw.replace(/`/g, '')
    if (!isItemTypeParamAbbrev(param)) continue
    const rawVal =
      colonIdx > 0
        ? lower.slice(colonIdx + 1)
        : (cmd.args[i + 1]?.toLowerCase() ?? '')
    // Strip backtick escapes from colon-bound value: -it:Sym`bolicLink → symboliclink
    // Mirrors the param-name strip at L103. Space-separated args use .value
    // (backtick-resolved by .NET parser), but colon-bound uses .text (raw source).
    // Strip surrounding quotes: -it:'SymbolicLink' or -it:"Junction" (bug #6)
    // val格式化`rawVal.replace`，供工具调用后续处理使用。
    const val = rawVal.replace(/`/g, '').replace(/^['"]|['"]$/g, '')
    if (LINK_ITEM_TYPES.has(val)) return true
  }
  return false
}

/**
 * Checks if commands should be handled differently based on the current permission mode.
 *
 * In acceptEdits mode, auto-allows filesystem-modifying PowerShell cmdlets.
 * Uses the AST to resolve aliases before checking the allowlist.
 *
 * @param input - The PowerShell command input
 * @param parsed - The parsed AST of the command
 * @param toolPermissionContext - Context containing mode and permissions
 * @returns
 * - 'allow' if the current mode permits auto-approval
 * - 'passthrough' if no mode-specific handling applies
 */
export function checkPermissionMode(
  input: { command: string },
  parsed: ParsedPowerShellCommand,
  toolPermissionContext: ToolPermissionContext,
): PermissionResult {
  // Skip bypass and dontAsk modes (handled elsewhere)
  if (
    toolPermissionContext.mode === 'bypassPermissions' ||
    toolPermissionContext.mode === 'dontAsk'
  ) {
    return {
      behavior: 'passthrough',
      message: 'Mode is handled in main permission flow',
    }
  }

  if (toolPermissionContext.mode !== 'acceptEdits') {
    return {
      behavior: 'passthrough',
      message: 'No mode-specific validation required',
    }
  }

  // acceptEdits mode: check if all commands are filesystem-modifying cmdlets
  if (!parsed.valid) {
    return {
      behavior: 'passthrough',
      message: 'Cannot validate mode for unparsed command',
    }
  }

  // SECURITY: Check for subexpressions, script blocks, or member invocations
  // that could be used to smuggle arbitrary code through acceptEdits mode.
  const securityFlags = deriveSecurityFlags(parsed)
  if (
    securityFlags.hasSubExpressions ||
    securityFlags.hasScriptBlocks ||
    securityFlags.hasMemberInvocations ||
    securityFlags.hasSplatting ||
    securityFlags.hasAssignments ||
    securityFlags.hasStopParsing ||
    securityFlags.hasExpandableStrings
  ) {
    return {
      behavior: 'passthrough',
      message:
        'Command contains subexpressions, script blocks, or member invocations that require approval',
    }
  }

  const segments = getPipelineSegments(parsed)

  // SECURITY: Empty segments with valid parse = no commands to check, don't auto-allow
  if (segments.length === 0) {
    return {
      behavior: 'passthrough',
      message: 'No commands found to validate for acceptEdits mode',
    }
  }

  // SECURITY: Compound cwd desync guard — BashTool parity.
  // When any statement in a compound contains Set-Location/Push-Location/Pop-Location
  // (or aliases like cd, sl, chdir, pushd, popd), the cwd changes between statements.
  // Path validation resolves relative paths against the stale process cwd, so a write
  // cmdlet in a later statement targets a different directory than the validator checked.
  // Example: `Set-Location ./.claude; Set-Content ./settings.json '...'` — the validator
  // sees ./settings.json as /project/settings.json, but PowerShell writes to
  // /project/.claude/settings.json. Refuse to auto-allow any write operation in a
  // compound that contains a cwd-changing command. This matches BashTool's
  // compoundCommandHasCd guard (BashTool/pathValidation.ts:630-655).
  const totalCommands = segments.reduce(
    (sum, seg) => sum + seg.commands.length,
    0,
  )
  if (totalCommands > 1) {
    let hasCdCommand = false
    let hasSymlinkCreate = false
    let hasWriteCommand = false
    for (const seg of segments) {
      for (const cmd of seg.commands) {
        if (cmd.elementType !== 'CommandAst') continue
        if (isCwdChangingCmdlet(cmd.name)) hasCdCommand = true
        if (isSymlinkCreatingCommand(cmd)) hasSymlinkCreate = true
        if (isAcceptEditsAllowedCmdlet(cmd.name)) hasWriteCommand = true
      }
    }
    if (hasCdCommand && hasWriteCommand) {
      return {
        behavior: 'passthrough',
        message:
          'Compound command contains a directory-changing command (Set-Location/Push-Location/Pop-Location) with a write operation — cannot auto-allow because path validation uses stale cwd',
      }
    }
    // SECURITY: Link-create compound guard (finding #18). Mirrors the cd
    // guard above. `New-Item -ItemType SymbolicLink -Path ./link -Value /etc;
    // Get-Content ./link/passwd` — path validation resolves ./link/passwd
    // against cwd (no link there at validation time), but runtime follows
    // the just-created link to /etc/passwd. Same TOCTOU shape as cwd desync.
    // Applies to SymbolicLink, Junction, and HardLink — all three redirect
    // path resolution at runtime.
    // No `hasWriteCommand` requirement: read-through-symlink is equally
    // dangerous (exfil via Get-Content ./link/etc/shadow), and any other
    // command using paths after a just-created link is unvalidatable.
    // 满足 `hasSymlinkCreate` 时，工具调用执行该分支。
    if (hasSymlinkCreate) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'passthrough',
        message:
          'Compound command creates a filesystem link (New-Item -ItemType SymbolicLink/Junction/HardLink) — cannot auto-allow because path validation cannot follow just-created links',
      }
    }
  }

  // 按顺序遍历 `segments` 中的segment，逐个交给工具调用处理。
  for (const segment of segments) {
    // 按顺序遍历 `segment.commands` 中的cmd 命令数据，逐个交给工具调用处理。
    for (const cmd of segment.commands) {
      // `cmd.elementType` 与 `'CommandAst'` 不一致时刷新派生状态，避免使用过期结果。
      if (cmd.elementType !== 'CommandAst') {
        // SECURITY: This guard is load-bearing for THREE cases. Do not narrow it.
        //
        // 1. Expression pipeline sources (designed): '/etc/passwd' | Remove-Item
        //    — the string literal is CommandExpressionAst, piped value binds to
        //    -Path. We cannot statically know what path it represents.
        //
        // 2. Control-flow statements (accidental but relied upon):
        //    foreach ($x in ...) { Remove-Item $x }. Non-PipelineAst statements
        //    produce a synthetic CommandExpressionAst entry in segment.commands
        //    (parser.ts transformStatement). Without this guard, Remove-Item $x
        //    in nestedCommands would be checked below and auto-allowed — but $x
        //    is a loop-bound variable we cannot validate.
        //
        // 3. Non-PipelineAst redirection coverage (accidental): cmd && cmd2 > /tmp
        //    also produces a synthetic element here. isReadOnlyCommand relies on
        //    the same accident (its allowlist rejects the synthetic element's
        //    full-text name), so both paths fail safe together.
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'passthrough',
          message: `Pipeline contains expression source (${cmd.elementType}) that cannot be statically validated`,
        }
      }
      // SECURITY: nameType is computed from the raw name before stripModulePrefix.
      // 'application' = raw name had path chars (. \\ /). scripts\\Remove-Item
      // strips to Remove-Item and would match ACCEPT_EDITS_ALLOWED_CMDLETS below,
      // but PowerShell runs scripts\\Remove-Item.ps1. Same gate as isAllowlistedCommand.
      // 当 `cmd.nameType` 匹配 `'application'` 时，工具调用执行对应分支。
      if (cmd.nameType === 'application') {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'passthrough',
          message: `Command '${cmd.name}' resolved from a path-like name and requires approval`,
        }
      }
      // SECURITY: elementTypes whitelist — same as isAllowlistedCommand.
      // deriveSecurityFlags above checks hasSubExpressions/etc. but does NOT
      // flag bare Variable/Other elementTypes. `Remove-Item $env:PATH`:
      //   elementTypes = ['StringConstant', 'Variable']
      //   deriveSecurityFlags: no subexpression → passes
      //   checkPathConstraints: resolves literal text '$env:PATH' as relative
      //     path → cwd/$env:PATH → inside cwd → allow
      //   RUNTIME: PowerShell expands $env:PATH → deletes actual env value path
      // isAllowlistedCommand rejects non-StringConstant/Parameter; this is the
      // acceptEdits parity gate.
      //
      // Also check colon-bound expression metachars (same as isAllowlistedCommand's
      // colon-bound check). `Remove-Item -Path:(1 > /tmp/x)`:
      //   elementTypes = ['StringConstant', 'Parameter'] — passes whitelist above
      //   deriveSecurityFlags: ParenExpressionAst in .Argument not detected by
      //     Get-SecurityPatterns (ParenExpressionAst not in FindAll filter)
      //   checkPathConstraints: literal text '-Path:(1 > /tmp/x)' not a path
      //   RUNTIME: paren evaluates, redirection writes /tmp/x → arbitrary write
      // 满足 `cmd.elementTypes` 时，工具调用执行该分支。
      if (cmd.elementTypes) {
        // 循环处理 `let i = 1; i < cmd.elementTypes.length; i++`，让工具调用逐项把同类条目按顺序走完。
        for (let i = 1; i < cmd.elementTypes.length; i++) {
          // t 命名 `cmd.elementTypes[i]`，让后续代码直接表达这个值的用途。
          const t = cmd.elementTypes[i]
          // `t` 与 `'StringConstant' && t !== 'Para...` 不一致时刷新派生状态，避免使用过期结果。
          if (t !== 'StringConstant' && t !== 'Parameter') {
            // 返回结构化结果，集中表达工具调用已经整理出的状态。
            return {
              behavior: 'passthrough',
              message: `Command argument has unvalidatable type (${t}) — variable paths cannot be statically resolved`,
            }
          }
          // 当 `t` 匹配 `'Parameter'` 时，工具调用执行对应分支。
          if (t === 'Parameter') {
            // elementTypes[i] ↔ args[i-1] (elementTypes[0] is the command name).
            // 当前参数保存`cmd.args[i - 1] ?? ''`，供工具实现 mode Validation后续判断或输出使用。
            const arg = cmd.args[i - 1] ?? ''
            // colonIdx保存`arg.indexOf`，供工具调用后续处理使用。
            const colonIdx = arg.indexOf(':')
            // 只有 `colonIdx > 0 && /[$(@{[]/.test(arg.slice(colonIdx + 1))` 满足时，工具调用才执行该分支。
            if (colonIdx > 0 && /[$(@{[]/.test(arg.slice(colonIdx + 1))) {
              // 返回结构化结果，集中表达工具调用已经整理出的状态。
              return {
                behavior: 'passthrough',
                message:
                  'Colon-bound parameter contains an expression that cannot be statically validated',
              }
            }
          }
        }
      }
      // Safe output cmdlets (Out-Null, etc.) and allowlisted pipeline-tail
      // transformers (Format-*, Measure-Object, Select-Object, etc.) don't
      // affect the semantics of the preceding command. Skip them so
      // `Remove-Item ./foo | Out-Null` or `Set-Content ./foo hi | Format-Table`
      // auto-allows the same as the bare write cmdlet. isAllowlistedPipelineTail
      // is the narrow fallback for cmdlets moved from SAFE_OUTPUT_CMDLETS to
      // CMDLET_ALLOWLIST (argLeaksValue validates their args).
      // 工具调用在这里按实际状态进入对应分支。
      if (
        isSafeOutputCommand(cmd.name) ||
        isAllowlistedPipelineTail(cmd, input.command)
      ) {
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
      // 满足 `!isAcceptEditsAllowedCmdlet(cmd.name)` 时，工具调用执行该分支。
      if (!isAcceptEditsAllowedCmdlet(cmd.name)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'passthrough',
          message: `No mode-specific handling for '${cmd.name}' in acceptEdits mode`,
        }
      }
      // SECURITY: Reject commands with unclassifiable argument types. 'Other'
      // covers HashtableAst, ConvertExpressionAst, BinaryExpressionAst — all
      // can contain nested redirections or code that the parser cannot fully
      // decompose. isAllowlistedCommand (readOnlyValidation.ts) already
      // enforces this whitelist via argLeaksValue; this closes the same gap
      // in acceptEdits mode. Without this, @{k='payload' > ~/.bashrc} as a
      // -Value argument passes because HashtableAst maps to 'Other'.
      // argLeaksValue also catches colon-bound variables (-Flag:$env:SECRET).
      // 满足 `argLeaksValue(cmd.name, cmd)` 时，工具调用执行该分支。
      if (argLeaksValue(cmd.name, cmd)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'passthrough',
          message: `Arguments in '${cmd.name}' cannot be statically validated in acceptEdits mode`,
        }
      }
    }

    // Also check nested commands from control flow statements
    // 满足 `segment.nestedCommands` 时，工具调用执行该分支。
    if (segment.nestedCommands) {
      // 按顺序遍历 `segment.nestedCommands` 中的cmd 命令数据，逐个交给工具调用处理。
      for (const cmd of segment.nestedCommands) {
        // `cmd.elementType` 与 `'CommandAst'` 不一致时刷新派生状态，避免使用过期结果。
        if (cmd.elementType !== 'CommandAst') {
          // SECURITY: Same as above — non-CommandAst element in nested commands
          // (control flow bodies) cannot be statically validated as a path source.
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            behavior: 'passthrough',
            message: `Nested expression element (${cmd.elementType}) cannot be statically validated`,
          }
        }
        // 当 `cmd.nameType` 匹配 `'application'` 时，工具调用执行对应分支。
        if (cmd.nameType === 'application') {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            behavior: 'passthrough',
            message: `Nested command '${cmd.name}' resolved from a path-like name and requires approval`,
          }
        }
        // 工具调用在这里按实际状态进入对应分支。
        if (
          isSafeOutputCommand(cmd.name) ||
          isAllowlistedPipelineTail(cmd, input.command)
        ) {
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue
        }
        // 满足 `!isAcceptEditsAllowedCmdlet(cmd.name)` 时，工具调用执行该分支。
        if (!isAcceptEditsAllowedCmdlet(cmd.name)) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            behavior: 'passthrough',
            message: `No mode-specific handling for '${cmd.name}' in acceptEdits mode`,
          }
        }
        // SECURITY: Same argLeaksValue check as the main command loop above.
        // 满足 `argLeaksValue(cmd.name, cmd)` 时，工具调用执行该分支。
        if (argLeaksValue(cmd.name, cmd)) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            behavior: 'passthrough',
            message: `Arguments in nested '${cmd.name}' cannot be statically validated in acceptEdits mode`,
          }
        }
      }
    }
  }

  // All commands are filesystem-modifying cmdlets -- auto-allow
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'allow',
    updatedInput: input,
    decisionReason: {
      type: 'mode',
      mode: 'acceptEdits',
    },
  }
}
