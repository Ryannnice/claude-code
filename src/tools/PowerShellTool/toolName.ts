// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
// Here to break circular dependency from prompt.ts
// POWERSHELL_TOOL_NAME固定为 `'PowerShell' as const`，作为工具实现 tool Name后续展示或比较的基准。
export const POWERSHELL_TOOL_NAME = 'PowerShell' as const
