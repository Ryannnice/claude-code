// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
export const LIST_MCP_RESOURCES_TOOL_NAME = 'ListMcpResourcesTool'

// DESCRIPTION 命名 ```，让后续代码直接表达这个值的用途。
export const DESCRIPTION = `
Lists available resources from configured MCP servers.
Each resource object includes a 'server' field indicating which server it's from.

Usage examples:
- List all resources from all servers: \`listMcpResources\`
- List resources from a specific server: \`listMcpResources({ server: "myserver" })\`
`

// PROMPT 命名 ```，让后续代码直接表达这个值的用途。
export const PROMPT = `
List available resources from configured MCP servers.
Each returned resource will include all standard MCP resource fields plus a 'server' field 
indicating which server the resource belongs to.

Parameters:
- server (optional): The name of a specific MCP server to get resources from. If not provided,
  resources from all servers will be returned.
`
