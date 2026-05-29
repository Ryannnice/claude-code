// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
/**
 * PowerShell Common Parameters (available on all cmdlets via [CmdletBinding()]).
 * Source: about_CommonParameters (PowerShell docs) + Get-Command output.
 *
 * Shared between pathValidation.ts (merges into per-cmdlet known-param sets)
 * and readOnlyValidation.ts (merges into safeFlags check). Split out to break
 * what would otherwise be an import cycle between those two files.
 *
 * Stored lowercase with leading dash — callers `.toLowerCase()` their input.
 */

// COMMON_SWITCHES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const COMMON_SWITCHES = ['-verbose', '-debug']

// COMMON_VALUE_PARAMS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const COMMON_VALUE_PARAMS = [
  '-erroraction',
  '-warningaction',
  '-informationaction',
  '-progressaction',
  '-errorvariable',
  '-warningvariable',
  '-informationvariable',
  '-outvariable',
  '-outbuffer',
  '-pipelinevariable',
]

// COMMON_PARAMETERS 集合 用 Set 去重，后续只需判断成员是否存在。
export const COMMON_PARAMETERS: ReadonlySet<string> = new Set([
  ...COMMON_SWITCHES,
  ...COMMON_VALUE_PARAMS,
])
