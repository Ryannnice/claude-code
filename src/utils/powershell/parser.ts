// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 memoizeWithLRU，将 ../memoize.js 中已经封装好的能力接到本文件流程里。
import { memoizeWithLRU } from '../memoize.js'
// 引入 getCachedPowerShellPath，将 ../shell/powershellDetection.js 中已经封装好的能力接到本文件流程里。
import { getCachedPowerShellPath } from '../shell/powershellDetection.js'
// 引入 jsonParse，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from '../slowOperations.js'

// ---------------------------------------------------------------------------
// Public types describing the parsed output returned to callers.
// These map to System.Management.Automation.Language AST classes.
// Raw internal types (RawParsedOutput etc.) are defined further below.
// ---------------------------------------------------------------------------

/**
 * The PowerShell AST element type for pipeline elements.
 * Maps directly to CommandBaseAst derivatives in System.Management.Automation.Language.
 */
// PipelineElementType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type PipelineElementType =
  | 'CommandAst'
  | 'CommandExpressionAst'
  | 'ParenExpressionAst'

/**
 * The AST node type for individual command elements (arguments, expressions).
 * Used to classify each element during the AST walk so TypeScript can derive
 * security flags without extra Find-AstNodes calls in PowerShell.
 */
// CommandElementType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CommandElementType =
  | 'ScriptBlock'
  | 'SubExpression'
  | 'ExpandableString'
  | 'MemberInvocation'
  | 'Variable'
  | 'StringConstant'
  | 'Parameter'
  | 'Other'

/**
 * A child node of a command element (one level deep). Populated for
 * CommandParameterAst → .Argument (colon-bound parameters like
 * `-InputObject:$env:SECRET`). Consumers check `child.type` to classify
 * the bound value (Variable, StringConstant, Other) without parsing text.
 */
// CommandElementChild 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CommandElementChild = {
  type: CommandElementType
  text: string
}

/**
 * The PowerShell AST statement type.
 * Maps directly to StatementAst derivatives in System.Management.Automation.Language.
 */
// StatementType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type StatementType =
  | 'PipelineAst'
  | 'PipelineChainAst'
  | 'AssignmentStatementAst'
  | 'IfStatementAst'
  | 'ForStatementAst'
  | 'ForEachStatementAst'
  | 'WhileStatementAst'
  | 'DoWhileStatementAst'
  | 'DoUntilStatementAst'
  | 'SwitchStatementAst'
  | 'TryStatementAst'
  | 'TrapStatementAst'
  | 'FunctionDefinitionAst'
  | 'DataStatementAst'
  | 'UnknownStatementAst'

/**
 * A command invocation within a pipeline segment.
 */
// ParsedCommandElement 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedCommandElement = {
  /** The command/cmdlet name (e.g., "Get-ChildItem", "git") */
  name: string
  /** The command name type: cmdlet, application (exe), or unknown */
  nameType: 'cmdlet' | 'application' | 'unknown'
  /** The AST element type from PowerShell's parser */
  elementType: PipelineElementType
  /** All arguments as strings (includes flags like "-Recurse") */
  args: string[]
  /** The full text of this command element */
  text: string
  /** AST node types for each element in this command (arguments, expressions, etc.) */
  elementTypes?: CommandElementType[]
  /**
   * Child nodes of each argument, aligned with `args[]` (so
   * `children[i]` ↔ `args[i]` ↔ `elementTypes[i+1]`). Only populated for
   * Parameter elements with a colon-bound argument. Undefined for elements
   * with no children. Lets consumers check `children[i].some(c => c.type
   * !== 'StringConstant')` instead of parsing the arg text for `:` + `$`.
   */
  children?: (CommandElementChild[] | undefined)[]
  /** Redirections on this command element (from nested commands in && / || chains) */
  redirections?: ParsedRedirection[]
}

/**
 * A redirection found in the command.
 */
// ParsedRedirection 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ParsedRedirection = {
  /** The redirection operator */
  operator: '>' | '>>' | '2>' | '2>>' | '*>' | '*>>' | '2>&1'
  /** The target (file path or stream number) */
  target: string
  /** Whether this is a merging redirection like 2>&1 */
  isMerging: boolean
}

/**
 * A parsed statement from PowerShell.
 * Can be a pipeline, assignment, control flow statement, etc.
 */
// ParsedStatement 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ParsedStatement = {
  /** The AST statement type from PowerShell's parser */
  statementType: StatementType
  /** Individual commands in this statement (for pipelines) */
  commands: ParsedCommandElement[]
  /** Redirections on this statement */
  redirections: ParsedRedirection[]
  /** Full text of the statement */
  text: string
  /**
   * For control flow statements (if, for, foreach, while, try, etc.),
   * commands found recursively inside the body blocks.
   * Uses FindAll() to extract ALL nested CommandAst nodes at any depth.
   */
  nestedCommands?: ParsedCommandElement[]
  /**
   * Security-relevant AST patterns found via FindAll() on the entire statement,
   * regardless of statement type. This catches patterns that elementTypes may
   * miss (e.g. member invocations inside assignments, subexpressions in
   * non-pipeline statements). Computed in the PS1 script using instanceof
   * checks against the PowerShell AST type system.
   */
  securityPatterns?: {
    hasMemberInvocations?: boolean
    hasSubExpressions?: boolean
    hasExpandableStrings?: boolean
    hasScriptBlocks?: boolean
  }
}

/**
 * A variable reference found in the command.
 */
// ParsedVariable 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ParsedVariable = {
  /** The variable path (e.g., "HOME", "env:PATH", "global:x") */
  path: string
  /** Whether this variable uses splatting (@var instead of $var) */
  isSplatted: boolean
}

/**
 * A parse error from PowerShell's parser.
 */
// ParseError 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ParseError = {
  message: string
  errorId: string
}

/**
 * The complete parsed result from the PowerShell AST parser.
 */
// ParsedPowerShellCommand 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedPowerShellCommand = {
  /** Whether the command parsed successfully (no syntax errors) */
  valid: boolean
  /** Parse errors, if any */
  errors: ParseError[]
  /** Top-level statements, separated by ; or newlines */
  statements: ParsedStatement[]
  /** All variable references found */
  variables: ParsedVariable[]
  /** Whether the token stream contains a stop-parsing (--%) token */
  hasStopParsing: boolean
  /** The original command text */
  originalCommand: string
  /**
   * All .NET type literals found anywhere in the AST (TypeExpressionAst +
   * TypeConstraintAst). TypeName.FullName — the literal text as written, NOT
   * the resolved .NET type (e.g. [int] → "int", not "System.Int32").
   * Consumed by the CLM-allowlist check in powershellSecurity.ts.
   */
  typeLiterals?: string[]
  /**
   * Whether the command contains `using module` or `using assembly` statements.
   * These load external code (modules/assemblies) and execute their top-level
   * script body or module initializers. The using statement is a sibling of
   * the named blocks on ScriptBlockAst, not a child, so it is not visible
   * to Process-BlockStatements or any downstream command walker.
   */
  hasUsingStatements?: boolean
  /**
   * Whether the command contains `#Requires` directives (ScriptRequirements).
   * `#Requires -Modules <name>` triggers module loading from PSModulePath.
   */
  hasScriptRequirements?: boolean
}

// ---------------------------------------------------------------------------

// Default 5s is fine for interactive use (warm pwsh spawn is ~450ms). Windows
// CI under Defender/AMSI load can exceed 5s on consecutive spawns even after
// CAN_SPAWN_PARSE_SCRIPT() warms the JIT (run 23574701241 windows-shard-5:
// attackVectors F1 hit 2×5s timeout → valid:false → 'ask' instead of 'deny').
// Override via env for tests. Read inside parsePowerShellCommandImpl, not
// top-level, per CLAUDE.md (globalSettings.env ordering).
// DEFAULT_PARSE_TIMEOUT_MS 集合保存`5_000`，供后续判断或组装使用。
const DEFAULT_PARSE_TIMEOUT_MS = 5_000
// getParseTimeoutMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getParseTimeoutMs(): number {
  // env 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const env = process.env.CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS
  // 满足 `env` 时，共享工具执行该分支。
  if (env) {
    // 解析结果解析`parseInt`，供共享工具后续处理使用。
    const parsed = parseInt(env, 10)
    // 只有 `!isNaN(parsed) && parsed > 0` 满足时，共享工具才执行该分支。
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  // 返回 `DEFAULT_PARSE_TIMEOUT_MS`，作为共享工具这次计算的结果。
  return DEFAULT_PARSE_TIMEOUT_MS
}
// MAX_COMMAND_LENGTH is derived from PARSE_SCRIPT_BODY.length below (after the
// script body is defined) so it cannot go stale as the script grows.

/**
 * The PowerShell parse script inlined as a string constant.
 * This avoids needing to read from disk at runtime (the file may not exist
 * in bundled builds). The script uses the native PowerShell AST parser to
 * analyze a command and output structured JSON.
 */
// Raw types describing PS script JSON output (exported for testing)
// RawCommandElement 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type RawCommandElement = {
  type: string // .GetType().Name e.g. "StringConstantExpressionAst"
  text: string // .Extent.Text
  value?: string // .Value if available (resolves backtick escapes)
  expressionType?: string // .Expression.GetType().Name for CommandExpressionAst
  children?: { type: string; text: string }[] // CommandParameterAst.Argument, one level
}

// RawRedirection 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type RawRedirection = {
  type: string // "FileRedirectionAst" or "MergingRedirectionAst"
  append?: boolean // .Append (FileRedirectionAst only)
  fromStream?: string // .FromStream.ToString() e.g. "Output", "Error", "All"
  locationText?: string // .Location.Extent.Text (FileRedirectionAst only)
}

// RawPipelineElement 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type RawPipelineElement = {
  type: string // .GetType().Name e.g. "CommandAst", "CommandExpressionAst"
  text: string // .Extent.Text
  commandElements?: RawCommandElement[]
  redirections?: RawRedirection[]
  expressionType?: string // for CommandExpressionAst: .Expression.GetType().Name
}

// RawStatement 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type RawStatement = {
  type: string // .GetType().Name e.g. "PipelineAst", "IfStatementAst", "TrapStatementAst"
  text: string // .Extent.Text
  elements?: RawPipelineElement[] // for PipelineAst: the pipeline elements
  nestedCommands?: RawPipelineElement[] // commands found via FindAll (all statement types)
  redirections?: RawRedirection[] // FileRedirectionAst found via FindAll (non-PipelineAst only)
  securityPatterns?: {
    // Security-relevant AST node types found via FindAll on the statement
    hasMemberInvocations?: boolean
    hasSubExpressions?: boolean
    hasExpandableStrings?: boolean
    hasScriptBlocks?: boolean
  }
}

// RawParsedOutput 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type RawParsedOutput = {
  valid: boolean
  errors: { message: string; errorId: string }[]
  statements: RawStatement[]
  variables: { path: string; isSplatted: boolean }[]
  hasStopParsing: boolean
  originalCommand: string
  typeLiterals?: string[]
  hasUsingStatements?: boolean
  hasScriptRequirements?: boolean
}

// This is the canonical copy of the parse script. There is no separate .ps1 file.
/**
 * The core parse logic.
 * The command is passed via Base64-encoded $EncodedCommand variable
 * to avoid here-string injection attacks.
 *
 * SECURITY — top-level ParamBlock: ScriptBlockAst.ParamBlock is a SIBLING of
 * the named blocks (Begin/Process/End/Clean/DynamicParam), not nested inside
 * them, so Process-BlockStatements never reaches it. Commands inside param()
 * default-value expressions and attribute arguments (e.g. [ValidateScript({...})])
 * were invisible to every downstream check. PoC:
 *   param($x = (Remove-Item /)); Get-Process   → only Get-Process surfaced
 *   param([ValidateScript({rm /;$true})]$x='t') → rm invisible, runs on bind
 * Function-level param() IS covered: FindAll on the FunctionDefinitionAst
 * statement recurses into its descendants. The gap was only the script-level
 * ParamBlock. ParamBlockAst has .Parameters (not .Statements) so we FindAll
 * on it directly rather than reusing Process-BlockStatements. We only emit a
 * statement if there is something to report, to avoid noise for plain
 * param($x) declarations. (Kept compact in-script to preserve argv budget.)
 */
/**
 * PS1 parse script. Comments live here (not inline) — every char inside the
 * backticks eats into WINDOWS_MAX_COMMAND_LENGTH (argv budget).
 *
 * Structure:
 * - Get-RawCommandElements: extract CommandAst element data (type, text, value,
 *   expressionType, children for colon-bound param .Argument)
 * - Get-RawRedirections: extract FileRedirectionAst operator+target
 * - Get-SecurityPatterns: FindAll for security flags (hasSubExpressions via
 *   Sub/Array/ParenExpressionAst, hasScriptBlocks, etc.)
 * - Type literals: emit TypeExpressionAst names for CLM allowlist check
 * - --% token: PS7 MinusMinus, PS5.1 Generic kind
 * - CommandExpressionAst.Redirections: inherits from CommandBaseAst —
 *   `1 > /tmp/x` statement has FileRedirectionAst that element-iteration misses
 * - Nested commands: FindAll for ALL statement types (if/for/foreach/while/
 *   switch/try/function/assignment/PipelineChainAst) — skip direct pipeline
 *   elements already in the loop
 */
// exported for testing
// PARSE_SCRIPT_BODY固定为 ```，作为共享工具 parser后续展示或比较的基准。
export const PARSE_SCRIPT_BODY = `
if (-not $EncodedCommand) {
    Write-Output '{"valid":false,"errors":[{"message":"No command provided","errorId":"NoInput"}],"statements":[],"variables":[],"hasStopParsing":false,"originalCommand":""}'
    exit 0
}

$Command = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($EncodedCommand))

$tokens = $null
$parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseInput(
    $Command,
    [ref]$tokens,
    [ref]$parseErrors
)

$allVariables = [System.Collections.ArrayList]::new()

function Get-RawCommandElements {
    param([System.Management.Automation.Language.CommandAst]$CmdAst)
    $elems = [System.Collections.ArrayList]::new()
    foreach ($ce in $CmdAst.CommandElements) {
        $ceData = @{ type = $ce.GetType().Name; text = $ce.Extent.Text }
        if ($ce.PSObject.Properties['Value'] -and $null -ne $ce.Value -and $ce.Value -is [string]) {
            $ceData.value = $ce.Value
        }
        if ($ce -is [System.Management.Automation.Language.CommandExpressionAst]) {
            $ceData.expressionType = $ce.Expression.GetType().Name
        }
        $a=$ce.Argument;if($a){$ceData.children=@(@{type=$a.GetType().Name;text=$a.Extent.Text})}
        [void]$elems.Add($ceData)
    }
    return $elems
}

function Get-RawRedirections {
    param($Redirections)
    $result = [System.Collections.ArrayList]::new()
    foreach ($redir in $Redirections) {
        $redirData = @{ type = $redir.GetType().Name }
        if ($redir -is [System.Management.Automation.Language.FileRedirectionAst]) {
            $redirData.append = [bool]$redir.Append
            $redirData.fromStream = $redir.FromStream.ToString()
            $redirData.locationText = $redir.Location.Extent.Text
        }
        [void]$result.Add($redirData)
    }
    return $result
}

function Get-SecurityPatterns($A) {
    $p = @{}
    foreach ($n in $A.FindAll({ param($x)
        $x -is [System.Management.Automation.Language.MemberExpressionAst] -or
        $x -is [System.Management.Automation.Language.SubExpressionAst] -or
        $x -is [System.Management.Automation.Language.ArrayExpressionAst] -or
        $x -is [System.Management.Automation.Language.ExpandableStringExpressionAst] -or
        $x -is [System.Management.Automation.Language.ScriptBlockExpressionAst] -or
        $x -is [System.Management.Automation.Language.ParenExpressionAst]
    }, $true)) { switch ($n.GetType().Name) {
        'InvokeMemberExpressionAst' { $p.hasMemberInvocations = $true }
        'MemberExpressionAst' { $p.hasMemberInvocations = $true }
        'SubExpressionAst' { $p.hasSubExpressions = $true }
        'ArrayExpressionAst' { $p.hasSubExpressions = $true }
        'ParenExpressionAst' { $p.hasSubExpressions = $true }
        'ExpandableStringExpressionAst' { $p.hasExpandableStrings = $true }
        'ScriptBlockExpressionAst' { $p.hasScriptBlocks = $true }
    }}
    if ($p.Count -gt 0) { return $p }
    return $null
}

$varExprs = $ast.FindAll({ param($node) $node -is [System.Management.Automation.Language.VariableExpressionAst] }, $true)
foreach ($v in $varExprs) {
    [void]$allVariables.Add(@{
        path = $v.VariablePath.ToString()
        isSplatted = [bool]$v.Splatted
    })
}

$typeLiterals = [System.Collections.ArrayList]::new()
foreach ($t in $ast.FindAll({ param($n)
    $n -is [System.Management.Automation.Language.TypeExpressionAst] -or
    $n -is [System.Management.Automation.Language.TypeConstraintAst]
}, $true)) { [void]$typeLiterals.Add($t.TypeName.FullName) }

$hasStopParsing = $false
$tk = [System.Management.Automation.Language.TokenKind]
foreach ($tok in $tokens) {
    if ($tok.Kind -eq $tk::MinusMinus) { $hasStopParsing = $true; break }
    if ($tok.Kind -eq $tk::Generic -and ($tok.Text -replace '[\u2013\u2014\u2015]','-') -eq '--%') {
        $hasStopParsing = $true; break
    }
}

$statements = [System.Collections.ArrayList]::new()

function Process-BlockStatements {
    param($Block)
    if (-not $Block) { return }

    foreach ($stmt in $Block.Statements) {
        $statement = @{
            type = $stmt.GetType().Name
            text = $stmt.Extent.Text
        }

        if ($stmt -is [System.Management.Automation.Language.PipelineAst]) {
            $elements = [System.Collections.ArrayList]::new()
            foreach ($element in $stmt.PipelineElements) {
                $elemData = @{
                    type = $element.GetType().Name
                    text = $element.Extent.Text
                }

                if ($element -is [System.Management.Automation.Language.CommandAst]) {
                    $elemData.commandElements = @(Get-RawCommandElements -CmdAst $element)
                    $elemData.redirections = @(Get-RawRedirections -Redirections $element.Redirections)
                } elseif ($element -is [System.Management.Automation.Language.CommandExpressionAst]) {
                    $elemData.expressionType = $element.Expression.GetType().Name
                    $elemData.redirections = @(Get-RawRedirections -Redirections $element.Redirections)
                }

                [void]$elements.Add($elemData)
            }
            $statement.elements = @($elements)

            $allNestedCmds = $stmt.FindAll(
                { param($node) $node -is [System.Management.Automation.Language.CommandAst] },
                $true
            )
            $nestedCmds = [System.Collections.ArrayList]::new()
            foreach ($cmd in $allNestedCmds) {
                if ($cmd.Parent -eq $stmt) { continue }
                $nested = @{
                    type = $cmd.GetType().Name
                    text = $cmd.Extent.Text
                    commandElements = @(Get-RawCommandElements -CmdAst $cmd)
                    redirections = @(Get-RawRedirections -Redirections $cmd.Redirections)
                }
                [void]$nestedCmds.Add($nested)
            }
            if ($nestedCmds.Count -gt 0) {
                $statement.nestedCommands = @($nestedCmds)
            }
            $r = $stmt.FindAll({param($n) $n -is [System.Management.Automation.Language.FileRedirectionAst]}, $true)
            if ($r.Count -gt 0) {
                $rr = @(Get-RawRedirections -Redirections $r)
                $statement.redirections = if ($statement.redirections) { @($statement.redirections) + $rr } else { $rr }
            }
        } else {
            $nestedCmdAsts = $stmt.FindAll(
                { param($node) $node -is [System.Management.Automation.Language.CommandAst] },
                $true
            )
            $nested = [System.Collections.ArrayList]::new()
            foreach ($cmd in $nestedCmdAsts) {
                [void]$nested.Add(@{
                    type = 'CommandAst'
                    text = $cmd.Extent.Text
                    commandElements = @(Get-RawCommandElements -CmdAst $cmd)
                    redirections = @(Get-RawRedirections -Redirections $cmd.Redirections)
                })
            }
            if ($nested.Count -gt 0) {
                $statement.nestedCommands = @($nested)
            }
            $r = $stmt.FindAll({param($n) $n -is [System.Management.Automation.Language.FileRedirectionAst]}, $true)
            if ($r.Count -gt 0) { $statement.redirections = @(Get-RawRedirections -Redirections $r) }
        }

        $sp = Get-SecurityPatterns $stmt
        if ($sp) { $statement.securityPatterns = $sp }

        [void]$statements.Add($statement)
    }

    if ($Block.Traps) {
        foreach ($trap in $Block.Traps) {
            $statement = @{
                type = 'TrapStatementAst'
                text = $trap.Extent.Text
            }
            $nestedCmdAsts = $trap.FindAll(
                { param($node) $node -is [System.Management.Automation.Language.CommandAst] },
                $true
            )
            $nestedCmds = [System.Collections.ArrayList]::new()
            foreach ($cmd in $nestedCmdAsts) {
                $nested = @{
                    type = $cmd.GetType().Name
                    text = $cmd.Extent.Text
                    commandElements = @(Get-RawCommandElements -CmdAst $cmd)
                    redirections = @(Get-RawRedirections -Redirections $cmd.Redirections)
                }
                [void]$nestedCmds.Add($nested)
            }
            if ($nestedCmds.Count -gt 0) {
                $statement.nestedCommands = @($nestedCmds)
            }
            $r = $trap.FindAll({param($n) $n -is [System.Management.Automation.Language.FileRedirectionAst]}, $true)
            if ($r.Count -gt 0) { $statement.redirections = @(Get-RawRedirections -Redirections $r) }
            $sp = Get-SecurityPatterns $trap
            if ($sp) { $statement.securityPatterns = $sp }
            [void]$statements.Add($statement)
        }
    }
}

Process-BlockStatements -Block $ast.BeginBlock
Process-BlockStatements -Block $ast.ProcessBlock
Process-BlockStatements -Block $ast.EndBlock
Process-BlockStatements -Block $ast.CleanBlock
Process-BlockStatements -Block $ast.DynamicParamBlock

if ($ast.ParamBlock) {
  $pb = $ast.ParamBlock
  $pn = [System.Collections.ArrayList]::new()
  foreach ($c in $pb.FindAll({param($n) $n -is [System.Management.Automation.Language.CommandAst]}, $true)) {
    [void]$pn.Add(@{type='CommandAst';text=$c.Extent.Text;commandElements=@(Get-RawCommandElements -CmdAst $c);redirections=@(Get-RawRedirections -Redirections $c.Redirections)})
  }
  $pr = $pb.FindAll({param($n) $n -is [System.Management.Automation.Language.FileRedirectionAst]}, $true)
  $ps = Get-SecurityPatterns $pb
  if ($pn.Count -gt 0 -or $pr.Count -gt 0 -or $ps) {
    $st = @{type='ParamBlockAst';text=$pb.Extent.Text}
    if ($pn.Count -gt 0) { $st.nestedCommands = @($pn) }
    if ($pr.Count -gt 0) { $st.redirections = @(Get-RawRedirections -Redirections $pr) }
    if ($ps) { $st.securityPatterns = $ps }
    [void]$statements.Add($st)
  }
}

$hasUsingStatements = $ast.UsingStatements -and $ast.UsingStatements.Count -gt 0
$hasScriptRequirements = $ast.ScriptRequirements -ne $null

$output = @{
    valid = ($parseErrors.Count -eq 0)
    errors = @($parseErrors | ForEach-Object {
        @{
            message = $_.Message
            errorId = $_.ErrorId
        }
    })
    statements = @($statements)
    variables = @($allVariables)
    hasStopParsing = $hasStopParsing
    originalCommand = $Command
    typeLiterals = @($typeLiterals)
    hasUsingStatements = [bool]$hasUsingStatements
    hasScriptRequirements = [bool]$hasScriptRequirements
}

$output | ConvertTo-Json -Depth 10 -Compress
`

// ---------------------------------------------------------------------------
// Windows CreateProcess has a 32,767 char command-line limit. The encoding
// chain is:
//   command (N UTF-8 bytes) → Base64 (~4N/3 chars) → $EncodedCommand = '...'\n
//   → full script (wrapper + PARSE_SCRIPT_BODY) → UTF-16LE (2× bytes)
//   → Base64 (4/3× chars) → -EncodedCommand argv
// Final cmdline ≈ argv_overhead + (wrapper + 4N/3 + body) × 8/3
//
// Solving for N (UTF-8 bytes) with a 32,767 cap:
//   script_budget   = (32767 - argv_overhead) × 3/8
//   cmd_b64_budget  = script_budget - PARSE_SCRIPT_BODY.length - wrapper
//   N               = cmd_b64_budget × 3/4 - safety_margin
//
// SECURITY: N is a UTF-8 BYTE budget, not a UTF-16 code-unit budget. The
// length gate MUST measure Buffer.byteLength(command, 'utf8'), not
// command.length. A BMP character in U+0800–U+FFFF (CJK ideographs, most
// non-Latin scripts) is 1 UTF-16 code unit but 3 UTF-8 bytes. With
// PARSE_SCRIPT_BODY ≈ 10.6K, N ≈ 1,092 bytes. Comparing against .length
// permits a 1,092-code-unit pure-CJK command (≈3,276 UTF-8 bytes) → inner
// base64 ≈ 4,368 chars → final argv ≈ 40K chars, overflowing 32,767 by
// ~7.4K. CreateProcess fails → valid:false → parse-fail degradation (deny
// rules silently downgrade to ask). Finding #36.
//
// COMPUTED from PARSE_SCRIPT_BODY.length so it cannot drift. The prior
// hardcoded value (4,500) was derived from a ~6K body estimate; the body is
// actually ~11K chars, so the real ceiling was ~1,850. Commands in the
// 1,850–4,500 range passed this gate but then failed CreateProcess on
// Windows, returning valid=false and skipping all AST-based security checks.
//
// Unix argv limits are typically 2MB+ (ARG_MAX) with ~128KB per-argument
// limit (MAX_ARG_STRLEN on Linux; macOS has no per-arg limit below ARG_MAX).
// At MAX=4,500 the -EncodedCommand argument is ~45KB — well under either.
// Applying the Windows-derived limit on Unix would REGRESS: commands in the
// ~1K–4.5K range previously parsed successfully and reached the sub-command
// deny loop at powershellPermissions.ts; rejecting them pre-spawn degrades
// user-configured deny rules from deny→ask for compound commands with a
// denied cmdlet buried mid-script. So the Windows limit is platform-gated.
//
// If the Windows limit becomes too restrictive, switch to -File with a temp
// file for large inputs.
// ---------------------------------------------------------------------------
// WINDOWS_ARGV_CAP保存`32_767`，供共享工具 parser后续判断或输出使用。
const WINDOWS_ARGV_CAP = 32_767
// pwsh path + " -NoProfile -NonInteractive -NoLogo -EncodedCommand " +
// argv quoting. A long Windows pwsh path (C:\Program Files\PowerShell\7\
// pwsh.exe) + flags is ~95 chars; 200 leaves headroom for unusual installs.
// FIXED_ARGV_OVERHEAD保存`200`，供后续判断或组装使用。
const FIXED_ARGV_OVERHEAD = 200
// "$EncodedCommand = '" + "'\n" wrapper around the user command's base64
// ENCODED_CMD_WRAPPER 命令数据记录 ``$EncodedCommand = ''\n`.length` 的数量，后续用它判断是否需要继续处理。
const ENCODED_CMD_WRAPPER = `$EncodedCommand = ''\n`.length
// Margin for base64 padding rounding (≤4 chars at each of 2 levels) and minor
// estimation drift. Multibyte expansion is NOT absorbed here — the gate
// measures actual UTF-8 bytes (Buffer.byteLength), not code units.
// SAFETY_MARGIN 命名 `100`，让后续代码直接表达这个值的用途。
const SAFETY_MARGIN = 100
// SCRIPT_CHARS_BUDGET 命名 `((WINDOWS_ARGV_CAP - FIXED_ARGV_OVERHEAD) * 3) / 8`，让后续代码直接表达这个值的用途。
const SCRIPT_CHARS_BUDGET = ((WINDOWS_ARGV_CAP - FIXED_ARGV_OVERHEAD) * 3) / 8
// CMD_B64_BUDGET 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const CMD_B64_BUDGET =
  SCRIPT_CHARS_BUDGET - PARSE_SCRIPT_BODY.length - ENCODED_CMD_WRAPPER
// Exported for drift-guard tests (the drift-prone value is the Windows one).
// Unit: UTF-8 BYTES. Compare against Buffer.byteLength, not .length.
// WINDOWS_MAX_COMMAND_LENGTH 命令数据保存`Math.max`，供共享工具后续处理使用。
export const WINDOWS_MAX_COMMAND_LENGTH = Math.max(
  0,
  Math.floor((CMD_B64_BUDGET * 3) / 4) - SAFETY_MARGIN,
)
// Pre-existing value, known to work on Unix. See comment above re: why the
// Windows derivation must NOT be applied here. Unit: UTF-8 BYTES — for ASCII
// commands (the common case) bytes==chars so no regression; for multibyte
// commands this is slightly tighter but still far below Unix ARG_MAX (~128KB
// per-arg), so the argv spawn cannot overflow.
// UNIX_MAX_COMMAND_LENGTH 命令数据 命名 `4_500`，让后续代码直接表达这个值的用途。
const UNIX_MAX_COMMAND_LENGTH = 4_500
// Unit: UTF-8 BYTES (see SECURITY note above).
// MAX_COMMAND_LENGTH 命令数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const MAX_COMMAND_LENGTH =
  process.platform === 'win32'
    ? WINDOWS_MAX_COMMAND_LENGTH
    : UNIX_MAX_COMMAND_LENGTH

// INVALID_RESULT_BASE 先占位，稍后的条件分支会根据实际输入补齐它。
const INVALID_RESULT_BASE: Omit<
  ParsedPowerShellCommand,
  'errors' | 'originalCommand'
> = {
  valid: false,
  statements: [],
  variables: [],
  hasStopParsing: false,
}

// makeInvalidResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function makeInvalidResult(
  command: string,
  message: string,
  errorId: string,
): ParsedPowerShellCommand {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...INVALID_RESULT_BASE,
    errors: [{ message, errorId }],
    originalCommand: command,
  }
}

/**
 * Base64-encode a string as UTF-16LE, which is the encoding required by
 * PowerShell's -EncodedCommand parameter.
 */
// toUtf16LeBase64 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toUtf16LeBase64(text: string): string {
  // `typeof Buffer` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof Buffer !== 'undefined') {
    // 返回 `Buffer.from(text, 'utf16le').toString('base64')`，作为共享工具这次计算的结果。
    return Buffer.from(text, 'utf16le').toString('base64')
  }
  // Fallback for non-Node environments
  // bytes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const bytes: number[] = []
  // 按索引扫描 `text.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < text.length; i++) {
    // code保存`text.charCodeAt`，供共享工具后续处理使用。
    const code = text.charCodeAt(i)
    // bytes 集合追加新条目，保持收集顺序与输入顺序一致。
    bytes.push(code & 0xff, (code >> 8) & 0xff)
  }
  // 返回 `btoa(bytes.map(b => String.fromCharCode(b)).join(''))`，作为共享工具这次计算的结果。
  return btoa(bytes.map(b => String.fromCharCode(b)).join(''))
}

/**
 * Build the full PowerShell script that parses a command.
 * The user command is Base64-encoded (UTF-8) and embedded in a variable
 * to prevent injection attacks.
 */
// buildParseScript 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildParseScript(command: string): string {
  // encoded 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const encoded =
    typeof Buffer !== 'undefined'
      ? Buffer.from(command, 'utf8').toString('base64')
      : btoa(
          new TextEncoder()
            .encode(command)
            // 链式调用 reduce，继续加工上一行在共享工具中产生的数据。
            .reduce((s, b) => s + String.fromCharCode(b), ''),
        )
  // 返回 ``$EncodedCommand = '${encoded}'\n${PARSE_SCRIPT_BODY}``，作为共享工具这次计算的结果。
  return `$EncodedCommand = '${encoded}'\n${PARSE_SCRIPT_BODY}`
}

/**
 * Ensure a value is an array. PowerShell 5.1's ConvertTo-Json may unwrap
 * single-element arrays into plain objects.
 */
// ensureArray 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  // 只有 `value === undefined || value === null` 满足时，共享工具才执行该分支。
  if (value === undefined || value === null) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }
  // 返回 `Array.isArray(value) ? value : [value]`，作为共享工具这次计算的结果。
  return Array.isArray(value) ? value : [value]
}

/** Map raw .NET AST type name to our StatementType union */
// exported for testing
// mapStatementType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mapStatementType(rawType: string): StatementType {
  // 按照 rawType 的取值选择共享工具的具体处理分支。
  switch (rawType) {
    case 'PipelineAst':
      // 返回 `'PipelineAst'`，作为共享工具这次计算的结果。
      return 'PipelineAst'
    case 'PipelineChainAst':
      // 返回 `'PipelineChainAst'`，作为共享工具这次计算的结果。
      return 'PipelineChainAst'
    case 'AssignmentStatementAst':
      // 返回 `'AssignmentStatementAst'`，作为共享工具这次计算的结果。
      return 'AssignmentStatementAst'
    case 'IfStatementAst':
      // 返回 `'IfStatementAst'`，作为共享工具这次计算的结果。
      return 'IfStatementAst'
    case 'ForStatementAst':
      // 返回 `'ForStatementAst'`，作为共享工具这次计算的结果。
      return 'ForStatementAst'
    case 'ForEachStatementAst':
      // 返回 `'ForEachStatementAst'`，作为共享工具这次计算的结果。
      return 'ForEachStatementAst'
    case 'WhileStatementAst':
      // 返回 `'WhileStatementAst'`，作为共享工具这次计算的结果。
      return 'WhileStatementAst'
    case 'DoWhileStatementAst':
      // 返回 `'DoWhileStatementAst'`，作为共享工具这次计算的结果。
      return 'DoWhileStatementAst'
    case 'DoUntilStatementAst':
      // 返回 `'DoUntilStatementAst'`，作为共享工具这次计算的结果。
      return 'DoUntilStatementAst'
    case 'SwitchStatementAst':
      // 返回 `'SwitchStatementAst'`，作为共享工具这次计算的结果。
      return 'SwitchStatementAst'
    case 'TryStatementAst':
      // 返回 `'TryStatementAst'`，作为共享工具这次计算的结果。
      return 'TryStatementAst'
    case 'TrapStatementAst':
      // 返回 `'TrapStatementAst'`，作为共享工具这次计算的结果。
      return 'TrapStatementAst'
    case 'FunctionDefinitionAst':
      // 返回 `'FunctionDefinitionAst'`，作为共享工具这次计算的结果。
      return 'FunctionDefinitionAst'
    case 'DataStatementAst':
      // 返回 `'DataStatementAst'`，作为共享工具这次计算的结果。
      return 'DataStatementAst'
    default:
      // 返回 `'UnknownStatementAst'`，作为共享工具这次计算的结果。
      return 'UnknownStatementAst'
  }
}

/** Map raw .NET AST type name to our CommandElementType union */
// exported for testing
// mapElementType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mapElementType(
  rawType: string,
  expressionType?: string,
): CommandElementType {
  // 按照 rawType 的取值选择共享工具的具体处理分支。
  switch (rawType) {
    case 'ScriptBlockExpressionAst':
      // 返回 `'ScriptBlock'`，作为共享工具这次计算的结果。
      return 'ScriptBlock'
    case 'SubExpressionAst':
    case 'ArrayExpressionAst':
      // SECURITY: ArrayExpressionAst (@()) is a sibling of SubExpressionAst,
      // not a subclass. Both evaluate arbitrary pipelines with side effects:
      // Get-ChildItem @(Remove-Item ./data) runs Remove-Item inside @().
      // Map both to SubExpression so hasSubExpressions fires and isReadOnlyCommand
      // rejects (it doesn't check nestedCommands, only pipeline.commands[]).
      // 返回 `'SubExpression'`，作为共享工具这次计算的结果。
      return 'SubExpression'
    case 'ExpandableStringExpressionAst':
      // 返回 `'ExpandableString'`，作为共享工具这次计算的结果。
      return 'ExpandableString'
    case 'InvokeMemberExpressionAst':
    case 'MemberExpressionAst':
      // 返回 `'MemberInvocation'`，作为共享工具这次计算的结果。
      return 'MemberInvocation'
    case 'VariableExpressionAst':
      // 返回 `'Variable'`，作为共享工具这次计算的结果。
      return 'Variable'
    case 'StringConstantExpressionAst':
    case 'ConstantExpressionAst':
      // ConstantExpressionAst covers numeric literals (5, 3.14). For
      // permission purposes a numeric literal is as safe as a string
      // literal — it's an inert value, not code. Without this mapping,
      // `-Seconds:5` produced children[0].type='Other' and consumers
      // checking `children.some(c => c.type !== 'StringConstant')` would
      // false-positive ask on harmless numeric args.
      // 返回 `'StringConstant'`，作为共享工具这次计算的结果。
      return 'StringConstant'
    case 'CommandParameterAst':
      // 返回 `'Parameter'`，作为共享工具这次计算的结果。
      return 'Parameter'
    case 'ParenExpressionAst':
      // 返回 `'SubExpression'`，作为共享工具这次计算的结果。
      return 'SubExpression'
    case 'CommandExpressionAst':
      // Delegate to the wrapped expression type so we catch SubExpressionAst,
      // ExpandableStringExpressionAst, ScriptBlockExpressionAst, etc.
      // without maintaining a manual list. Falls through to 'Other' if the
      // inner type is unrecognised.
      // 满足 `expressionType` 时，共享工具执行该分支。
      if (expressionType) {
        // 返回 `mapElementType(expressionType)`，作为共享工具这次计算的结果。
        return mapElementType(expressionType)
      }
      // 返回 `'Other'`，作为共享工具这次计算的结果。
      return 'Other'
    default:
      // 返回 `'Other'`，作为共享工具这次计算的结果。
      return 'Other'
  }
}

/** Classify command name as cmdlet, application, or unknown */
// exported for testing
// classifyCommandName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function classifyCommandName(
  name: string,
): 'cmdlet' | 'application' | 'unknown' {
  // 满足 `/^[A-Za-z]+-[A-Za-z][A-Za-z0-9_]*$/.test(name)` 时，共享工具执行该分支。
  if (/^[A-Za-z]+-[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    // 返回 `'cmdlet'`，作为共享工具这次计算的结果。
    return 'cmdlet'
  }
  // 满足 `/[.\\/]/.test(name)` 时，共享工具执行该分支。
  if (/[.\\/]/.test(name)) {
    // 返回 `'application'`，作为共享工具这次计算的结果。
    return 'application'
  }
  // 返回 `'unknown'`，作为共享工具这次计算的结果。
  return 'unknown'
}

/** Strip module prefix from command name (e.g. "Microsoft.PowerShell.Utility\\Invoke-Expression" -> "Invoke-Expression") */
// exported for testing
// stripModulePrefix 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripModulePrefix(name: string): string {
  // idx保存`name.lastIndexOf`，供共享工具后续处理使用。
  const idx = name.lastIndexOf('\\')
  // 满足 `idx < 0` 时，共享工具执行该分支。
  if (idx < 0) return name
  // Don't strip file paths: drive letters (C:\...), UNC paths (\\server\...), or relative paths (.\, ..\)
  // 共享工具在这里按实际状态进入对应分支。
  if (
    /^[A-Za-z]:/.test(name) ||
    name.startsWith('\\\\') ||
    name.startsWith('.\\') ||
    name.startsWith('..\\')
  )
    // 返回 `name`，作为共享工具这次计算的结果。
    return name
  // 返回 `name.substring(idx + 1)`，作为共享工具这次计算的结果。
  return name.substring(idx + 1)
}

/** Transform a raw CommandAst pipeline element into ParsedCommandElement */
// exported for testing
// transformCommandAst 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function transformCommandAst(
  raw: RawPipelineElement,
): ParsedCommandElement {
  // cmdElements 命令数据保存`ensureArray`，供共享工具后续处理使用。
  const cmdElements = ensureArray(raw.commandElements)
  // 名称保存`''`，作为后续固定文本处理的输入。
  let name = ''
  // 参数列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const args: string[] = []
  // elementTypes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const elementTypes: CommandElementType[] = []
  // 子节点 从空数组开始收集，后续循环会按处理顺序追加条目。
  const children: (CommandElementChild[] | undefined)[] = []
  // hasChildren标记共享工具 parser是否启用对应路径。
  let hasChildren = false

  // SECURITY: nameType MUST be computed from the raw name (before
  // stripModulePrefix). classifyCommandName('scripts\\Get-Process') returns
  // 'application' (contains \\) — the correct answer, since PowerShell resolves
  // this as a file path. After stripping it becomes 'Get-Process' which
  // classifies as 'cmdlet' — wrong, and allowlist checks would trust it.
  // Auto-allow paths gate on nameType !== 'application' to catch this.
  // name (stripped) is still used for deny-rule matching symmetry, which is
  // fail-safe: deny rules over-match (Module\\Remove-Item still hits a
  // Remove-Item deny), allow rules are separately gated by nameType.
  // nameType 命名 `'unknown'`，让后续代码直接表达这个值的用途。
  let nameType: 'cmdlet' | 'application' | 'unknown' = 'unknown'
  // 满足 `cmdElements.length > 0` 时，共享工具执行该分支。
  if (cmdElements.length > 0) {
    // first 命名 `cmdElements[0]!`，让后续代码直接表达这个值的用途。
    const first = cmdElements[0]!
    // SECURITY: only trust .value for string-literal element types with a
    // string-typed value. Numeric ConstantExpressionAst (e.g. `& 1`) emits an
    // integer .value that crashes stripModulePrefix() → parser falls through
    // to passthrough. For non-string-literal or non-string .value, use .text.
    // isFirstStringLiteral 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isFirstStringLiteral =
      first.type === 'StringConstantExpressionAst' ||
      first.type === 'ExpandableStringExpressionAst'
    // rawNameUnstripped 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const rawNameUnstripped =
      isFirstStringLiteral && typeof first.value === 'string'
        ? first.value
        : first.text
    // SECURITY: strip surrounding quotes from the command name. When .value is
    // unavailable (no StaticType on the raw node), .text preserves quotes —
    // `& 'Invoke-Expression' 'x'` yields "'Invoke-Expression'". Stripping here
    // at the source means every downstream reader of element.name (deny-rule
    // matching, GIT_SAFETY_WRITE_CMDLETS lookup, resolveToCanonical, etc.)
    // sees the bare cmdlet name. No-op when .value already stripped.
    // rawName格式化`rawNameUnstripped.replace`，供共享工具后续处理使用。
    const rawName = rawNameUnstripped.replace(/^['"]|['"]$/g, '')
    // SECURITY: PowerShell built-in cmdlet names are ASCII-only. Non-ASCII
    // characters in cmdlet position are inherently suspicious — .NET
    // OrdinalIgnoreCase folds U+017F (ſ) → S and U+0131 (ı) → I per
    // UnicodeData.txt SimpleUppercaseMapping, so PowerShell resolves
    // `ſtart-proceſſ` → Start-Process at runtime. JS .toLowerCase() does NOT
    // fold these (ſ is already lowercase), so every downstream name
    // comparison (NEVER_SUGGEST, deny-rule strEquals, resolveToCanonical,
    // security validators) misses. Force 'application' to gate auto-allow
    // (blocks at the nameType !== 'application' checks). Finding #31.
    // Verified on Windows (pwsh 7.x, 2026-03): ſtart-proceſſ does NOT resolve.
    // Retained as defense-in-depth against future .NET/PS behavior changes
    // or module-provided command resolution hooks.
    // 判断 /[\u0080-\uFFFF]/.test(rawName)，将共享工具分流到只适用于该条件的处理路径。
    if (/[\u0080-\uFFFF]/.test(rawName)) {
      // nameType更新为 `'application'`，确保共享工具后续读取最新状态。
      nameType = 'application'
    } else {
      // nameType更新为 `classifyCommandName(rawName)`，确保共享工具后续读取最新状态。
      nameType = classifyCommandName(rawName)
    }
    // name更新为 `stripModulePrefix(rawName)`，确保共享工具后续读取最新状态。
    name = stripModulePrefix(rawName)
    // elementTypes 集合追加新条目，保持收集顺序与输入顺序一致。
    elementTypes.push(mapElementType(first.type, first.expressionType))

    // 遍历 let i = 1; i < cmdElements.length; i++，让共享工具逐项完成同一类处理。
    for (let i = 1; i < cmdElements.length; i++) {
      // ce保存`cmdElements[i]!`，供共享工具 parser后续步骤使用。
      const ce = cmdElements[i]!
      // Use resolved .value for string constants (strips quotes, resolves
      // backtick escapes like `n -> newline) but keep raw .text for parameters
      // (where .value loses the dash prefix, e.g. '-Path' -> 'Path'),
      // variables, and other non-string types.
      // isStringLiteral 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isStringLiteral =
        ce.type === 'StringConstantExpressionAst' ||
        ce.type === 'ExpandableStringExpressionAst'
      // args 集合追加新条目，保持收集顺序与输入顺序一致。
      args.push(isStringLiteral && ce.value != null ? ce.value : ce.text)
      // elementTypes 集合追加新条目，保持收集顺序与输入顺序一致。
      elementTypes.push(mapElementType(ce.type, ce.expressionType))
      // Map raw children (CommandParameterAst.Argument) through
      // mapElementType so consumers see 'Variable', 'StringConstant', etc.
      // rawChildren保存`ensureArray`，供共享工具后续处理使用。
      const rawChildren = ensureArray(ce.children)
      // 满足 `rawChildren.length > 0` 时，共享工具执行该分支。
      if (rawChildren.length > 0) {
        // hasChildren更新为 `true`，确保共享工具后续读取最新状态。
        hasChildren = true
        // children追加新条目，保持收集顺序与输入顺序一致。
        children.push(
          // rawChildren.map执行共享工具在此处需要的副作用或外部交互。
          rawChildren.map(c => ({
            type: mapElementType(c.type),
            text: c.text,
          })),
        )
      } else {
        // children追加新条目，保持收集顺序与输入顺序一致。
        children.push(undefined)
      }
    }
  }

  // 结果集中保存共享工具 parser要一起传递的字段。
  const result: ParsedCommandElement = {
    name,
    nameType,
    elementType: 'CommandAst',
    args,
    text: raw.text,
    elementTypes,
    ...(hasChildren ? { children } : {}),
  }

  // Preserve redirections from nested commands (e.g., in && / || chains)
  // rawRedirs 集合保存`ensureArray`，供共享工具后续处理使用。
  const rawRedirs = ensureArray(raw.redirections)
  // 满足 `rawRedirs.length > 0` 时，共享工具执行该分支。
  if (rawRedirs.length > 0) {
    // redirections 集合更新为 `rawRedirs.map(transformRedirection)`，确保共享工具后续读取最新状态。
    result.redirections = rawRedirs.map(transformRedirection)
  }

  // 返回 result，把共享工具这个分支的结果交还调用方。
  return result
}

/** Transform a non-CommandAst pipeline element into ParsedCommandElement */
// exported for testing
// transformExpressionElement 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function transformExpressionElement(
  raw: RawPipelineElement,
): ParsedCommandElement {
  // elementType先声明占位，稍后的分支会根据实际输入补齐。
  const elementType: PipelineElementType =
    raw.type === 'ParenExpressionAst'
      ? 'ParenExpressionAst'
      : 'CommandExpressionAst'
  // elementTypes 集合聚合成有序列表，保持后续遍历顺序稳定。
  const elementTypes: CommandElementType[] = [
    mapElementType(raw.type, raw.expressionType),
  ]

  // 返回 {，把共享工具这个分支的结果交还调用方。
  return {
    name: raw.text,
    nameType: 'unknown',
    elementType,
    args: [],
    text: raw.text,
    elementTypes,
  }
}

/** Map raw redirection to ParsedRedirection */
// exported for testing
// transformRedirection 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function transformRedirection(raw: RawRedirection): ParsedRedirection {
  // `raw.type` 命中特定值 `'MergingRedirectionAst'` 时，进入共享工具对应处理。
  if (raw.type === 'MergingRedirectionAst') {
    // 返回 { operator: '2>&1', target: '', isMerging: true }，把共享工具这个分支的结果交还调用方。
    return { operator: '2>&1', target: '', isMerging: true }
  }

  // append保存`raw.append ?? false`，供共享工具 parser后续步骤使用。
  const append = raw.append ?? false
  // fromStream保存`raw.fromStream ?? 'Output'`，供共享工具 parser后续步骤使用。
  const fromStream = raw.fromStream ?? 'Output'

  // operator先声明占位，稍后的分支会根据实际输入补齐。
  let operator: ParsedRedirection['operator']
  // 满足 `append` 时，共享工具执行该分支。
  if (append) {
    // 按照 fromStream 的取值选择共享工具的具体处理分支。
    switch (fromStream) {
      case 'Error':
        // operator更新为 `'2>>'`，确保共享工具后续读取最新状态。
        operator = '2>>'
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'All':
        // operator更新为 `'*>>'`，确保共享工具后续读取最新状态。
        operator = '*>>'
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      default:
        // operator更新为 `'>>'`，确保共享工具后续读取最新状态。
        operator = '>>'
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }
  } else {
    // 按照 fromStream 的取值选择共享工具的具体处理分支。
    switch (fromStream) {
      case 'Error':
        // operator更新为 `'2>'`，确保共享工具后续读取最新状态。
        operator = '2>'
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'All':
        // operator更新为 `'*>'`，确保共享工具后续读取最新状态。
        operator = '*>'
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      default:
        // operator更新为 `'>'`，确保共享工具后续读取最新状态。
        operator = '>'
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
    }
  }

  // 返回 { operator, target: raw.locationText ?? '', isMerging: false }，把共享工具这个分支的结果交还调用方。
  return { operator, target: raw.locationText ?? '', isMerging: false }
}

/** Transform a raw statement into ParsedStatement */
// exported for testing
// transformStatement 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function transformStatement(raw: RawStatement): ParsedStatement {
  // statementType 状态派生`mapStatementType`，供共享工具后续处理使用。
  const statementType = mapStatementType(raw.type)
  // commands 命令数据从空数组开始收集，后续按处理顺序追加条目。
  const commands: ParsedCommandElement[] = []
  // redirections 集合从空数组开始收集，后续按处理顺序追加条目。
  const redirections: ParsedRedirection[] = []

  // 满足 `raw.elements` 时，共享工具执行该分支。
  if (raw.elements) {
    // PipelineAst: walk pipeline elements
    // 遍历 const elem of ensureArray(raw.elements)，按顺序处理共享工具中的批量条目。
    for (const elem of ensureArray(raw.elements)) {
      // `elem.type` 命中特定值 `'CommandAst'` 时，进入共享工具对应处理。
      if (elem.type === 'CommandAst') {
        // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
        commands.push(transformCommandAst(elem))
        // 遍历 const redir of ensureArray(elem.redirections)，按顺序处理共享工具中的批量条目。
        for (const redir of ensureArray(elem.redirections)) {
          // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
          redirections.push(transformRedirection(redir))
        }
      } else {
        // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
        commands.push(transformExpressionElement(elem))
        // SECURITY: CommandExpressionAst also carries .Redirections (inherited
        // from CommandBaseAst). `1 > /tmp/evil.txt` is a CommandExpressionAst
        // with a FileRedirectionAst. Must extract here or getFileRedirections()
        // misses it and compound commands like `Get-ChildItem; 1 > /tmp/x`
        // auto-allow at step 5 (only Get-ChildItem is checked).
        // 遍历 const redir of ensureArray(elem.redirections)，按顺序处理共享工具中的批量条目。
        for (const redir of ensureArray(elem.redirections)) {
          // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
          redirections.push(transformRedirection(redir))
        }
      }
    }
    // SECURITY: The PS1 PipelineAst branch does a deep FindAll for
    // FileRedirectionAst to catch redirections hidden inside:
    //  - colon-bound ParenExpressionAst args: -Name:('payload' > file)
    //  - hashtable value statements: @{k='payload' > ~/.bashrc}
    // Both are invisible at the element level — the redirection's parent
    // is a child of CommandParameterAst / CommandExpressionAst, not a
    // separate pipeline element. Merge into statement-level redirections.
    //
    // The FindAll ALSO re-discovers direct-element redirections already
    // captured in the per-element loop above. Dedupe by (operator, target)
    // so tests and consumers see the real count.
    // 已见集合保存`Set`，供共享工具后续处理使用。
    const seen = new Set(redirections.map(r => `${r.operator}\0${r.target}`))
    // 遍历 const redir of ensureArray(raw.redirections)，按顺序处理共享工具中的批量条目。
    for (const redir of ensureArray(raw.redirections)) {
      // r保存`transformRedirection`，供共享工具后续处理使用。
      const r = transformRedirection(redir)
      // 按键读取``${r.operator}\0${r.target}``，供共享工具 parser后续步骤使用。
      const key = `${r.operator}\0${r.target}`
      // 判断 !seen.has(key)，将共享工具分流到只适用于该条件的处理路径。
      if (!seen.has(key)) {
        // seen.add执行共享工具在此处需要的副作用或外部交互。
        seen.add(key)
        // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
        redirections.push(r)
      }
    }
  } else {
    // Non-pipeline statement: add synthetic command entry with full text
    // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
    commands.push({
      name: raw.text,
      nameType: 'unknown',
      elementType: 'CommandExpressionAst',
      args: [],
      text: raw.text,
    })
    // SECURITY: The PS1 else-branch does a direct recursive FindAll on
    // FileRedirectionAst to catch expression redirections inside control flow
    // (if/for/foreach/while/switch/try/trap/&& and ||). The CommandAst FindAll
    // above CANNOT see these: in if ($x) { 1 > /tmp/evil }, the literal 1 with
    // its attached redirection is a CommandExpressionAst — a SIBLING of
    // CommandAst in the type hierarchy, not a subclass. So nestedCommands never
    // contains it, and without this hoist the redirection is invisible to
    // getFileRedirections → step 4.6 misses it → compound commands like
    // `Get-Process && 1 > /tmp/evil` auto-allow at step 5 (only Get-Process
    // is checked, allowlisted).
    //
    // Finding FileRedirectionAst DIRECTLY (rather than finding CommandExpressionAst
    // and extracting .Redirections) is both simpler and more robust: it catches
    // redirections on any node type, including ones we don't know about yet.
    //
    // Double-counts redirections already on nested CommandAst commands (those are
    // extracted at line ~395 into nestedCommands[i].redirections AND found again
    // here). Harmless: step 4.6 only checks fileRedirections.length > 0, not
    // the exact count. No code does arithmetic on redirection counts.
    //
    // PS1 SIZE NOTE: The full rationale lives here (TS), not in the PS1 script,
    // because PS1 comments bloat the -EncodedCommand payload and push the
    // Windows CreateProcess 32K limit. Keep PS1 comments terse; point them here.
    // 遍历 const redir of ensureArray(raw.redirections)，按顺序处理共享工具中的批量条目。
    for (const redir of ensureArray(raw.redirections)) {
      // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
      redirections.push(transformRedirection(redir))
    }
  }

  // nestedCommands 命令数据先声明占位，稍后的分支会根据实际输入补齐。
  let nestedCommands: ParsedCommandElement[] | undefined
  // rawNested保存`ensureArray`，供共享工具后续处理使用。
  const rawNested = ensureArray(raw.nestedCommands)
  // 满足 `rawNested.length > 0` 时，共享工具执行该分支。
  if (rawNested.length > 0) {
    // nestedCommands 命令数据更新为 `rawNested.map(transformCommandAst)`，确保共享工具后续读取最新状态。
    nestedCommands = rawNested.map(transformCommandAst)
  }

  // 结果集中保存共享工具 parser要一起传递的字段。
  const result: ParsedStatement = {
    statementType,
    commands,
    redirections,
    text: raw.text,
    nestedCommands,
  }

  // 满足 `raw.securityPatterns` 时，共享工具执行该分支。
  if (raw.securityPatterns) {
    // securityPatterns 集合更新为 `raw.securityPatterns`，确保共享工具后续读取最新状态。
    result.securityPatterns = raw.securityPatterns
  }

  // 返回 result，把共享工具这个分支的结果交还调用方。
  return result
}

/** Transform the complete raw PS output into ParsedPowerShellCommand */
// transformRawOutput 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
function transformRawOutput(raw: RawParsedOutput): ParsedPowerShellCommand {
  // 结果集中保存共享工具 parser要一起传递的字段。
  const result: ParsedPowerShellCommand = {
    valid: raw.valid,
    errors: ensureArray(raw.errors),
    statements: ensureArray(raw.statements).map(transformStatement),
    variables: ensureArray(raw.variables),
    hasStopParsing: raw.hasStopParsing,
    originalCommand: raw.originalCommand,
  }
  // tl保存`ensureArray`，供共享工具后续处理使用。
  const tl = ensureArray(raw.typeLiterals)
  // 满足 `tl.length > 0` 时，共享工具执行该分支。
  if (tl.length > 0) {
    // typeLiterals 集合更新为 `tl`，确保共享工具后续读取最新状态。
    result.typeLiterals = tl
  }
  // 满足 `raw.hasUsingStatements` 时，共享工具执行该分支。
  if (raw.hasUsingStatements) {
    // hasUsingStatements 状态更新为 `true`，确保共享工具后续读取最新状态。
    result.hasUsingStatements = true
  }
  // 满足 `raw.hasScriptRequirements` 时，共享工具执行该分支。
  if (raw.hasScriptRequirements) {
    // hasScriptRequirements 集合更新为 `true`，确保共享工具后续读取最新状态。
    result.hasScriptRequirements = true
  }
  // 返回 result，把共享工具这个分支的结果交还调用方。
  return result
}

/**
 * Parse a PowerShell command using the native AST parser.
 * Spawns pwsh to parse the command and returns structured results.
 * Results are memoized by command string.
 *
 * @param command - The PowerShell command to parse
 * @returns Parsed command structure, or a result with valid=false on failure
 */
// parsePowerShellCommandImpl 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
async function parsePowerShellCommandImpl(
  command: string,
): Promise<ParsedPowerShellCommand> {
  // SECURITY: MAX_COMMAND_LENGTH is a UTF-8 BYTE budget (see derivation at the
  // constant definition). command.length counts UTF-16 code units; a CJK
  // character is 1 code unit but 3 UTF-8 bytes, so .length under-reports by
  // up to 3× and allows argv overflow on Windows → CreateProcess fails →
  // valid:false → deny rules degrade to ask. Finding #36.
  // commandBytes 命令数据保存`Buffer.byteLength`，供共享工具后续处理使用。
  const commandBytes = Buffer.byteLength(command, 'utf8')
  // 满足 `commandBytes > MAX_COMMAND_LENGTH` 时，共享工具执行该分支。
  if (commandBytes > MAX_COMMAND_LENGTH) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `PowerShell parser: command too long (${commandBytes} bytes, max ${MAX_COMMAND_LENGTH})`,
    )
    // 返回 makeInvalidResult(，把共享工具这个分支的结果交还调用方。
    return makeInvalidResult(
      command,
      `Command too long for parsing (${commandBytes} bytes). Maximum supported length is ${MAX_COMMAND_LENGTH} bytes.`,
      'CommandTooLong',
    )
  }

  // pwshPath 文件数据读取`getCachedPowerShellPath`，供共享工具后续处理使用。
  const pwshPath = await getCachedPowerShellPath()
  // pwshPath 文件数据缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
  if (!pwshPath) {
    // 返回 makeInvalidResult(，把共享工具这个分支的结果交还调用方。
    return makeInvalidResult(
      command,
      'PowerShell is not available',
      'NoPowerShell',
    )
  }

  // script构建`buildParseScript`，供共享工具后续处理使用。
  const script = buildParseScript(command)

  // Pass the script to PowerShell via -EncodedCommand.
  // -EncodedCommand takes a Base64-encoded UTF-16LE string and executes it,
  // which avoids: (1) stdin interactive-mode issues where -File - produces
  // PS prompts and ANSI escapes in stdout, (2) command-line escaping issues,
  // (3) temp files. The script itself is large but well within OS arg limits
  // (Windows: 32K chars, Unix: typically 2MB+).
  // encodedScript保存`toUtf16LeBase64`，供共享工具后续处理使用。
  const encodedScript = toUtf16LeBase64(script)
  // args 集合聚合成有序列表，保持后续遍历顺序稳定。
  const args = [
    '-NoProfile',
    '-NonInteractive',
    '-NoLogo',
    '-EncodedCommand',
    encodedScript,
  ]

  // Spawn pwsh with one retry on timeout. On loaded CI runners (Windows
  // especially), pwsh spawn + .NET JIT + ParseInput occasionally exceeds 5s
  // even after CAN_SPAWN_PARSE_SCRIPT() warms the JIT. execa kills the process
  // but exitCode is undefined, which the old code reported as the misleading
  // "pwsh exited with code 1:" with empty stderr. A single retry absorbs
  // transient load spikes; a double timeout is reported as PwshTimeout.
  // parseTimeoutMs 集合读取`getParseTimeoutMs`，供共享工具后续处理使用。
  const parseTimeoutMs = getParseTimeoutMs()
  // stdout保存`''`，供共享工具 parser后续步骤使用。
  let stdout = ''
  // stderr保存`''`，供共享工具 parser后续步骤使用。
  let stderr = ''
  // code保存`null`，供共享工具 parser后续步骤使用。
  let code: number | null = null
  // timedOut记录当前扫描状态，共享工具 parser随后按该状态分支。
  let timedOut = false
  // 遍历 let attempt = 0; attempt < 2; attempt++，让共享工具逐项完成同一类处理。
  for (let attempt = 0; attempt < 2; attempt++) {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 结果保存`execa`，供共享工具后续处理使用。
      const result = await execa(pwshPath, args, {
        timeout: parseTimeoutMs,
        reject: false,
      })
      // stdout更新为 `result.stdout`，确保共享工具后续读取最新状态。
      stdout = result.stdout
      // stderr更新为 `result.stderr`，确保共享工具后续读取最新状态。
      stderr = result.stderr
      // timedOut更新为 `result.timedOut`，确保共享工具后续读取最新状态。
      timedOut = result.timedOut
      // code更新为 `result.failed ? (result.exitCode ?? 1) : 0`，确保共享工具后续读取最新状态。
      code = result.failed ? (result.exitCode ?? 1) : 0
    } catch (e: unknown) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `PowerShell parser: failed to spawn pwsh: ${e instanceof Error ? e.message : e}`,
      )
      // 返回 makeInvalidResult(，把共享工具这个分支的结果交还调用方。
      return makeInvalidResult(
        command,
        `Failed to spawn PowerShell: ${e instanceof Error ? e.message : e}`,
        'PwshSpawnError',
      )
    }
    // 判断 !timedOut，将共享工具分流到只适用于该条件的处理路径。
    if (!timedOut) break
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `PowerShell parser: pwsh timed out after ${parseTimeoutMs}ms (attempt ${attempt + 1})`,
    )
  }

  // 满足 `timedOut` 时，共享工具执行该分支。
  if (timedOut) {
    // 返回 makeInvalidResult(，把共享工具这个分支的结果交还调用方。
    return makeInvalidResult(
      command,
      `pwsh timed out after ${parseTimeoutMs}ms (2 attempts)`,
      'PwshTimeout',
    )
  }

  // `code` 与 `0` 不一致时刷新派生状态。
  if (code !== 0) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `PowerShell parser: pwsh exited with code ${code}, stderr: ${stderr}`,
    )
    // 返回 makeInvalidResult(，把共享工具这个分支的结果交还调用方。
    return makeInvalidResult(
      command,
      `pwsh exited with code ${code}: ${stderr}`,
      'PwshError',
    )
  }

  // trimmed格式化`stdout.trim`，供共享工具后续处理使用。
  const trimmed = stdout.trim()
  // trimmed缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
  if (!trimmed) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('PowerShell parser: empty stdout from pwsh')
    // 返回 makeInvalidResult(，把共享工具这个分支的结果交还调用方。
    return makeInvalidResult(
      command,
      'No output from PowerShell parser',
      'EmptyOutput',
    )
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // raw解析`jsonParse`，供共享工具后续处理使用。
    const raw = jsonParse(trimmed) as RawParsedOutput
    // 返回 transformRawOutput(raw)，把共享工具这个分支的结果交还调用方。
    return transformRawOutput(raw)
  } catch {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `PowerShell parser: invalid JSON output: ${trimmed.slice(0, 200)}`,
    )
    // 返回 makeInvalidResult(，把共享工具这个分支的结果交还调用方。
    return makeInvalidResult(
      command,
      'Invalid JSON from PowerShell parser',
      'InvalidJson',
    )
  }
}

// Error IDs from makeInvalidResult that represent transient process failures.
// These should be evicted from the cache so subsequent calls can retry.
// Deterministic failures (CommandTooLong, syntax errors from successful parses)
// should stay cached since retrying would produce the same result.
// TRANSIENT_ERROR_IDS 错误信息保存`Set`，供共享工具后续处理使用。
const TRANSIENT_ERROR_IDS = new Set([
  'PwshSpawnError',
  'PwshError',
  'PwshTimeout',
  'EmptyOutput',
  'InvalidJson',
])

// parsePowerShellCommandCached 命令数据保存`memoizeWithLRU`，供共享工具后续处理使用。
const parsePowerShellCommandCached = memoizeWithLRU(
  // 这个回调绑定到 (command: string) => {，负责共享工具在该局部场景下的响应。
  (command: string) => {
    // promise解析`parsePowerShellCommandImpl`，供共享工具后续处理使用。
    const promise = parsePowerShellCommandImpl(command)
    // Evict transient failures after resolution so they can be retried.
    // The current caller still receives the cached promise for this call,
    // ensuring concurrent callers share the same result.
    // 这个回调绑定到 void promise.then(result => {，负责共享工具在该局部场景下的响应。
    void promise.then(result => {
      // 共享工具在这里进入条件判断，后续代码按实际状态分流。
      if (
        !result.valid &&
        TRANSIENT_ERROR_IDS.has(result.errors[0]?.errorId ?? '')
      ) {
        // parsePowerShellCommandCached.cache.delete执行共享工具在此处需要的副作用或外部交互。
        parsePowerShellCommandCached.cache.delete(command)
      }
    })
    // 返回 promise，把共享工具这个分支的结果交还调用方。
    return promise
  },
  // 这个回调绑定到 (command: string) => command,，负责共享工具在该局部场景下的响应。
  (command: string) => command,
  256,
)
// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export { parsePowerShellCommandCached as parsePowerShellCommand }

// ---------------------------------------------------------------------------
// Analysis helpers — derived from the parsed AST structure.
// ---------------------------------------------------------------------------

/**
 * Security-relevant flags derived from the parsed AST.
 */
// SecurityFlags 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SecurityFlags = {
  /** Contains $(...) subexpression */
  hasSubExpressions: boolean
  /** Contains { ... } script block expressions */
  hasScriptBlocks: boolean
  /** Contains @variable splatting */
  hasSplatting: boolean
  /** Contains expandable strings with embedded expressions ("...$()...") */
  hasExpandableStrings: boolean
  /** Contains .NET method invocations ([Type]::Method or $obj.Method()) */
  hasMemberInvocations: boolean
  /** Contains variable assignments ($x = ...) */
  hasAssignments: boolean
  /** Uses stop-parsing token (--%) */
  hasStopParsing: boolean
}

/**
 * Common PowerShell aliases mapped to their canonical cmdlet names.
 * Uses Object.create(null) to prevent prototype-chain pollution — attacker-controlled
 * command names like 'constructor' or '__proto__' must return undefined, not inherited
 * Object.prototype properties.
 */
// COMMON_ALIASES 集合保存`Object.assign(`，供共享工具 parser后续步骤使用。
export const COMMON_ALIASES: Record<string, string> = Object.assign(
  Object.create(null) as Record<string, string>,
  {
    // Directory listing
    ls: 'Get-ChildItem',
    dir: 'Get-ChildItem',
    gci: 'Get-ChildItem',
    // Content
    cat: 'Get-Content',
    type: 'Get-Content',
    gc: 'Get-Content',
    // Navigation
    cd: 'Set-Location',
    sl: 'Set-Location',
    chdir: 'Set-Location',
    pushd: 'Push-Location',
    popd: 'Pop-Location',
    pwd: 'Get-Location',
    gl: 'Get-Location',
    // Items
    gi: 'Get-Item',
    gp: 'Get-ItemProperty',
    ni: 'New-Item',
    mkdir: 'New-Item',
    // `md` is PowerShell's built-in alias for `mkdir`. resolveToCanonical is
    // single-hop (no md→mkdir→New-Item chaining), so it needs its own entry
    // or `md /etc/x` falls through while `mkdir /etc/x` is caught.
    md: 'New-Item',
    ri: 'Remove-Item',
    del: 'Remove-Item',
    rd: 'Remove-Item',
    rmdir: 'Remove-Item',
    rm: 'Remove-Item',
    erase: 'Remove-Item',
    mi: 'Move-Item',
    mv: 'Move-Item',
    move: 'Move-Item',
    ci: 'Copy-Item',
    cp: 'Copy-Item',
    copy: 'Copy-Item',
    cpi: 'Copy-Item',
    si: 'Set-Item',
    rni: 'Rename-Item',
    ren: 'Rename-Item',
    // Process
    ps: 'Get-Process',
    gps: 'Get-Process',
    kill: 'Stop-Process',
    spps: 'Stop-Process',
    start: 'Start-Process',
    saps: 'Start-Process',
    sajb: 'Start-Job',
    ipmo: 'Import-Module',
    // Output
    echo: 'Write-Output',
    write: 'Write-Output',
    sleep: 'Start-Sleep',
    // Help
    help: 'Get-Help',
    man: 'Get-Help',
    gcm: 'Get-Command',
    // Service
    gsv: 'Get-Service',
    // Variables
    gv: 'Get-Variable',
    sv: 'Set-Variable',
    // History
    h: 'Get-History',
    history: 'Get-History',
    // Invoke
    iex: 'Invoke-Expression',
    iwr: 'Invoke-WebRequest',
    irm: 'Invoke-RestMethod',
    icm: 'Invoke-Command',
    ii: 'Invoke-Item',
    // PSSession — remote code execution surface
    nsn: 'New-PSSession',
    etsn: 'Enter-PSSession',
    exsn: 'Exit-PSSession',
    gsn: 'Get-PSSession',
    rsn: 'Remove-PSSession',
    // Misc
    cls: 'Clear-Host',
    clear: 'Clear-Host',
    select: 'Select-Object',
    where: 'Where-Object',
    foreach: 'ForEach-Object',
    '%': 'ForEach-Object',
    '?': 'Where-Object',
    measure: 'Measure-Object',
    ft: 'Format-Table',
    fl: 'Format-List',
    fw: 'Format-Wide',
    oh: 'Out-Host',
    ogv: 'Out-GridView',
    // SECURITY: The following aliases are deliberately omitted because PS Core 6+
    // removed them (they collide with native executables). Our allowlist logic
    // resolves aliases BEFORE checking safety — if we map 'sort' → 'Sort-Object'
    // but PowerShell 7/Windows actually runs sort.exe, we'd auto-allow the wrong
    // program.
    //   'sc'   → sc.exe (Service Controller) — e.g. `sc config Svc binpath= ...`
    //   'sort' → sort.exe — e.g. `sort /O C:\evil.txt` (arbitrary file write)
    //   'curl' → curl.exe (shipped with Windows 10 1803+)
    //   'wget' → wget.exe (if installed)
    // Prefer to leave ambiguous aliases unmapped — users can write the full name.
    // If adding aliases that resolve to SAFE_OUTPUT_CMDLETS or
    // ACCEPT_EDITS_ALLOWED_CMDLETS, verify no native .exe collision on PS Core.
    ac: 'Add-Content',
    clc: 'Clear-Content',
    // Write/export: tee-object/export-csv are in
    // CMDLET_PATH_CONFIG so path-level Edit denies fire on the full cmdlet name,
    // but PowerShell's built-in aliases fell through to ask-then-approve because
    // resolveToCanonical couldn't resolve them). Neither tee-object nor
    // export-csv is in SAFE_OUTPUT_CMDLETS or ACCEPT_EDITS_ALLOWED_CMDLETS, so
    // the native-exe collision warning above doesn't apply — on Linux PS Core
    // where `tee` runs /usr/bin/tee, that binary also writes to its positional
    // file arg and we correctly extract+check it.
    tee: 'Tee-Object',
    epcsv: 'Export-Csv',
    sp: 'Set-ItemProperty',
    rp: 'Remove-ItemProperty',
    cli: 'Clear-Item',
    epal: 'Export-Alias',
    // Text search
    sls: 'Select-String',
  },
)

// DIRECTORY_CHANGE_CMDLETS 命令数据保存`Set`，供共享工具后续处理使用。
const DIRECTORY_CHANGE_CMDLETS = new Set([
  'set-location',
  'push-location',
  'pop-location',
])

// DIRECTORY_CHANGE_ALIASES 集合保存`Set`，供共享工具后续处理使用。
const DIRECTORY_CHANGE_ALIASES = new Set(['cd', 'sl', 'chdir', 'pushd', 'popd'])

/**
 * Get all command names across all statements, pipeline segments, and nested commands.
 * Returns lowercased names for case-insensitive comparison.
 */
// exported for testing
// getAllCommandNames 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function getAllCommandNames(parsed: ParsedPowerShellCommand): string[] {
  // names 集合从空数组开始收集，后续按处理顺序追加条目。
  const names: string[] = []
  // 遍历 const statement of parsed.statements，让共享工具逐项完成同一类处理。
  for (const statement of parsed.statements) {
    // 遍历 const cmd of statement.commands，让共享工具逐项完成同一类处理。
    for (const cmd of statement.commands) {
      // names 集合追加新条目，保持收集顺序与输入顺序一致。
      names.push(cmd.name.toLowerCase())
    }
    // 满足 `statement.nestedCommands` 时，共享工具执行该分支。
    if (statement.nestedCommands) {
      // 遍历 const cmd of statement.nestedCommands，让共享工具逐项完成同一类处理。
      for (const cmd of statement.nestedCommands) {
        // names 集合追加新条目，保持收集顺序与输入顺序一致。
        names.push(cmd.name.toLowerCase())
      }
    }
  }
  // 返回 names，把共享工具这个分支的结果交还调用方。
  return names
}

/**
 * Get all pipeline segments as flat list of commands.
 * Useful for checking each command independently.
 */
// getAllCommands 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function getAllCommands(
  parsed: ParsedPowerShellCommand,
): ParsedCommandElement[] {
  // commands 命令数据从空数组开始收集，后续按处理顺序追加条目。
  const commands: ParsedCommandElement[] = []
  // 遍历 const statement of parsed.statements，让共享工具逐项完成同一类处理。
  for (const statement of parsed.statements) {
    // 遍历 const cmd of statement.commands，让共享工具逐项完成同一类处理。
    for (const cmd of statement.commands) {
      // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
      commands.push(cmd)
    }
    // 满足 `statement.nestedCommands` 时，共享工具执行该分支。
    if (statement.nestedCommands) {
      // 遍历 const cmd of statement.nestedCommands，让共享工具逐项完成同一类处理。
      for (const cmd of statement.nestedCommands) {
        // commands 命令数据追加新条目，保持收集顺序与输入顺序一致。
        commands.push(cmd)
      }
    }
  }
  // 返回 commands，把共享工具这个分支的结果交还调用方。
  return commands
}

/**
 * Get all redirections across all statements.
 */
// exported for testing
// getAllRedirections 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function getAllRedirections(
  parsed: ParsedPowerShellCommand,
): ParsedRedirection[] {
  // redirections 集合从空数组开始收集，后续按处理顺序追加条目。
  const redirections: ParsedRedirection[] = []
  // 遍历 const statement of parsed.statements，让共享工具逐项完成同一类处理。
  for (const statement of parsed.statements) {
    // 遍历 const redir of statement.redirections，让共享工具逐项完成同一类处理。
    for (const redir of statement.redirections) {
      // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
      redirections.push(redir)
    }
    // Include redirections from nested commands (e.g., from && / || chains)
    // 满足 `statement.nestedCommands` 时，共享工具执行该分支。
    if (statement.nestedCommands) {
      // 遍历 const cmd of statement.nestedCommands，让共享工具逐项完成同一类处理。
      for (const cmd of statement.nestedCommands) {
        // 满足 `cmd.redirections` 时，共享工具执行该分支。
        if (cmd.redirections) {
          // 遍历 const redir of cmd.redirections，让共享工具逐项完成同一类处理。
          for (const redir of cmd.redirections) {
            // redirections 集合追加新条目，保持收集顺序与输入顺序一致。
            redirections.push(redir)
          }
        }
      }
    }
  }
  // 返回 redirections，把共享工具这个分支的结果交还调用方。
  return redirections
}

/**
 * Get all variables, optionally filtered by scope (e.g., 'env').
 * Variable paths in PowerShell can have scopes like "env:PATH", "global:x".
 */
// getVariablesByScope 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function getVariablesByScope(
  parsed: ParsedPowerShellCommand,
  scope: string,
): ParsedVariable[] {
  // prefix保存`scope.toLowerCase`，供共享工具后续处理使用。
  const prefix = scope.toLowerCase() + ':'
  // 返回 parsed.variables.filter(v => v.path.toLowerCase().startsWith(prefix))，把共享工具这个分支的结果交还调用方。
  return parsed.variables.filter(v => v.path.toLowerCase().startsWith(prefix))
}

/**
 * Check if any command in the parsed result matches a given name (case-insensitive).
 * Handles common aliases too.
 */
// hasCommandNamed 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function hasCommandNamed(
  parsed: ParsedPowerShellCommand,
  name: string,
): boolean {
  // lowerName保存`name.toLowerCase`，供共享工具后续处理使用。
  const lowerName = name.toLowerCase()
  // canonicalFromAlias 集合保存`toLowerCase`，供共享工具后续处理使用。
  const canonicalFromAlias = COMMON_ALIASES[lowerName]?.toLowerCase()

  // 遍历 const cmdName of getAllCommandNames(parsed)，按顺序处理共享工具中的批量条目。
  for (const cmdName of getAllCommandNames(parsed)) {
    // 满足 `cmdName === lowerName` 时，共享工具执行该分支。
    if (cmdName === lowerName) {
      // 返回 true，把共享工具这个分支的结果交还调用方。
      return true
    }
    // Check if the command is an alias that resolves to the requested name
    // canonical保存`toLowerCase`，供共享工具后续处理使用。
    const canonical = COMMON_ALIASES[cmdName]?.toLowerCase()
    // 满足 `canonical === lowerName` 时，共享工具执行该分支。
    if (canonical === lowerName) {
      // 返回 true，把共享工具这个分支的结果交还调用方。
      return true
    }
    // Check if the requested name is an alias and the command is its canonical form
    // 组合条件 `canonicalFromAlias && cmdName === canonicalFromAl` 成立时，共享工具才启用这条专门路径。
    if (canonicalFromAlias && cmdName === canonicalFromAlias) {
      // 返回 true，把共享工具这个分支的结果交还调用方。
      return true
    }
    // Check if both resolve to the same canonical cmdlet (alias-to-alias match)
    // 组合条件 `canonical && canonicalFromAlias && canonical ===` 成立时，共享工具才启用这条专门路径。
    if (canonical && canonicalFromAlias && canonical === canonicalFromAlias) {
      // 返回 true，把共享工具这个分支的结果交还调用方。
      return true
    }
  }
  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

/**
 * Check if the command contains any directory-changing commands.
 * (Set-Location, cd, sl, chdir, Push-Location, pushd, Pop-Location, popd)
 */
// exported for testing
// hasDirectoryChange 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function hasDirectoryChange(parsed: ParsedPowerShellCommand): boolean {
  // 遍历 const cmdName of getAllCommandNames(parsed)，按顺序处理共享工具中的批量条目。
  for (const cmdName of getAllCommandNames(parsed)) {
    // 共享工具在这里进入条件判断，后续代码按实际状态分流。
    if (
      DIRECTORY_CHANGE_CMDLETS.has(cmdName) ||
      DIRECTORY_CHANGE_ALIASES.has(cmdName)
    ) {
      // 返回 true，把共享工具这个分支的结果交还调用方。
      return true
    }
  }
  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

/**
 * Check if the command is a single simple command (no pipes, no semicolons, no operators).
 */
// exported for testing
// isSingleCommand 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function isSingleCommand(parsed: ParsedPowerShellCommand): boolean {
  // stmt解析`parsed.statements[0]`，供共享工具 parser后续步骤使用。
  const stmt = parsed.statements[0]
  // 返回 (，把共享工具这个分支的结果交还调用方。
  return (
    parsed.statements.length === 1 &&
    stmt !== undefined &&
    stmt.commands.length === 1 &&
    (!stmt.nestedCommands || stmt.nestedCommands.length === 0)
  )
}

/**
 * Check if a specific command has a given argument/flag (case-insensitive).
 * Useful for checking "-EncodedCommand", "-Recurse", etc.
 */
// commandHasArg 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function commandHasArg(
  command: ParsedCommandElement,
  arg: string,
): boolean {
  // lowerArg保存`arg.toLowerCase`，供共享工具后续处理使用。
  const lowerArg = arg.toLowerCase()
  // 返回 command.args.some(a => a.toLowerCase() === lowerArg)，把共享工具这个分支的结果交还调用方。
  return command.args.some(a => a.toLowerCase() === lowerArg)
}

/**
 * Tokenizer-level dash characters that PowerShell's parser accepts as
 * parameter prefixes. SpecialCharacters.IsDash (CharTraits.cs) accepts exactly
 * these four: ASCII hyphen-minus, en-dash, em-dash, horizontal bar. These are
 * tokenizer-level — they apply to ALL cmdlet parameters, not just argv to
 * powershell.exe (contrast with `/` which is an argv-parser quirk of
 * powershell.exe 5.1 only; see PS_ALT_PARAM_PREFIXES in powershellSecurity.ts).
 *
 * Extent.Text preserves the raw character; transformCommandAst uses ce.text
 * for CommandParameterAst elements, so these reach callers unchanged.
 */
// PS_TOKENIZER_DASH_CHARS 集合保存`Set`，供共享工具后续处理使用。
export const PS_TOKENIZER_DASH_CHARS = new Set([
  '-', // U+002D hyphen-minus (ASCII)
  '\u2013', // en-dash
  '\u2014', // em-dash
  '\u2015', // horizontal bar
])

/**
 * Determines if an argument is a PowerShell parameter (flag), using the AST
 * element type as ground truth when available.
 *
 * The parser maps CommandParameterAst → 'Parameter' regardless of which dash
 * character the user typed — PowerShell's tokenizer handles that. So when
 * elementType is available, it's authoritative:
 *   - 'Parameter' → true (covers `-Path`, `–Path`, `—Path`, `―Path`)
 *   - anything else → false (a quoted "-Path" is StringConstant, not a param)
 *
 * When elementType is unavailable (backward compat / no AST detail), fall back
 * to a char check against PS_TOKENIZER_DASH_CHARS.
 */
// isPowerShellParameter 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function isPowerShellParameter(
  arg: string,
  elementType?: CommandElementType,
): boolean {
  // `elementType` 与 `undefined` 不一致时刷新派生状态。
  if (elementType !== undefined) {
    // 返回 elementType === 'Parameter'，把共享工具这个分支的结果交还调用方。
    return elementType === 'Parameter'
  }
  // 返回 arg.length > 0 && PS_TOKENIZER_DASH_CHARS.has(arg[0]!)，把共享工具这个分支的结果交还调用方。
  return arg.length > 0 && PS_TOKENIZER_DASH_CHARS.has(arg[0]!)
}

/**
 * Check if any argument on a command is an unambiguous abbreviation of a PowerShell parameter.
 * PowerShell allows parameter abbreviation as long as the prefix is unambiguous.
 * The minPrefix is the shortest unambiguous prefix for the parameter.
 * For example, minPrefix '-en' for fullParam '-encodedcommand' matches '-en', '-enc', '-enco', etc.
 */
// commandHasArgAbbreviation 承担共享工具中的独立步骤，串起共享工具 parser需要的输入整理、状态更新和结果输出。
export function commandHasArgAbbreviation(
  command: ParsedCommandElement,
  fullParam: string,
  minPrefix: string,
): boolean {
  // lowerFull保存`fullParam.toLowerCase`，供共享工具后续处理使用。
  const lowerFull = fullParam.toLowerCase()
  // lowerMin保存`minPrefix.toLowerCase`，供共享工具后续处理使用。
  const lowerMin = minPrefix.toLowerCase()
  // 返回 command.args.some(a => {，把共享工具这个分支的结果交还调用方。
  return command.args.some(a => {
    // Strip colon-bound value (e.g., -en:base64value -> -en)
    // colonIndex 索引保存`a.indexOf`，供共享工具后续处理使用。
    const colonIndex = a.indexOf(':', 1)
    // paramPart格式化`a.slice`，供共享工具后续处理使用。
    const paramPart = colonIndex > 0 ? a.slice(0, colonIndex) : a
    // Strip backtick escapes — PowerShell resolves `-Member`Name` to
    // `-MemberName` but Extent.Text preserves the backtick, causing
    // prefix-comparison misses on the raw text.
    // lower格式化`paramPart.replace`，供共享工具后续处理使用。
    const lower = paramPart.replace(/`/g, '').toLowerCase()
    return (
      lower.startsWith(lowerMin) &&
      lowerFull.startsWith(lower) &&
      lower.length <= lowerFull.length
    )
  })
}

/**
 * Split a parsed command into its pipeline segments for per-segment permission checking.
 * Returns each pipeline's commands separately.
 */
export function getPipelineSegments(
  parsed: ParsedPowerShellCommand,
): ParsedStatement[] {
  return parsed.statements
}

/**
 * True if a redirection target is PowerShell's `$null` automatic variable.
 * `> $null` discards output (like /dev/null) — not a filesystem write.
 * `$null` cannot be reassigned, so this is safe to treat as a no-op sink.
 * `${null}` is the same automatic variable via curly-brace syntax. Spaces
 * inside the braces (`${ null }`) name a different variable, so no regex.
 */
export function isNullRedirectionTarget(target: string): boolean {
  const t = target.trim().toLowerCase()
  return t === '$null' || t === '${null}'
}

/**
 * Get output redirections (file redirections, not merging redirections).
 * Returns only redirections that write to files.
 */
// exported for testing
export function getFileRedirections(
  parsed: ParsedPowerShellCommand,
): ParsedRedirection[] {
  return getAllRedirections(parsed).filter(
    r => !r.isMerging && !isNullRedirectionTarget(r.target),
  )
}

/**
 * Derive security-relevant flags from the parsed command structure.
 * This replaces the previous approach of computing flags in PowerShell via
 * separate Find-AstNodes calls. Instead, the PS1 script tags each element
 * with its AST node type, and this function walks those types.
 */
// exported for testing
export function deriveSecurityFlags(
  parsed: ParsedPowerShellCommand,
): SecurityFlags {
  const flags: SecurityFlags = {
    hasSubExpressions: false,
    hasScriptBlocks: false,
    hasSplatting: false,
    hasExpandableStrings: false,
    hasMemberInvocations: false,
    hasAssignments: false,
    hasStopParsing: parsed.hasStopParsing,
  }

  function checkElements(cmd: ParsedCommandElement): void {
    if (!cmd.elementTypes) {
      return
    }
    for (const et of cmd.elementTypes) {
      switch (et) {
        case 'ScriptBlock':
          flags.hasScriptBlocks = true
          break
        case 'SubExpression':
          flags.hasSubExpressions = true
          break
        case 'ExpandableString':
          flags.hasExpandableStrings = true
          break
        case 'MemberInvocation':
          flags.hasMemberInvocations = true
          break
      }
    }
  }

  for (const stmt of parsed.statements) {
    if (stmt.statementType === 'AssignmentStatementAst') {
      flags.hasAssignments = true
    }
    for (const cmd of stmt.commands) {
      checkElements(cmd)
    }
    if (stmt.nestedCommands) {
      for (const cmd of stmt.nestedCommands) {
        checkElements(cmd)
      }
    }
    // securityPatterns provides a belt-and-suspenders check that catches
    // patterns elementTypes may miss (e.g. member invocations inside
    // assignments, subexpressions in non-pipeline statements).
    if (stmt.securityPatterns) {
      if (stmt.securityPatterns.hasMemberInvocations) {
        flags.hasMemberInvocations = true
      }
      if (stmt.securityPatterns.hasSubExpressions) {
        flags.hasSubExpressions = true
      }
      if (stmt.securityPatterns.hasExpandableStrings) {
        flags.hasExpandableStrings = true
      }
      if (stmt.securityPatterns.hasScriptBlocks) {
        flags.hasScriptBlocks = true
      }
    }
  }

  for (const v of parsed.variables) {
    if (v.isSplatted) {
      flags.hasSplatting = true
      break
    }
  }

  return flags
}

// Raw types exported for testing (function exports are inline above)
