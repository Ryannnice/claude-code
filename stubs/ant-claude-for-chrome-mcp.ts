// PermissionMode 固化ant claude for chrome mcp里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionMode =
  | 'ask'
  | 'skip_all_permission_checks'
  | 'follow_a_plan';

// Logger 固化ant claude for chrome mcp里传递的数据形状，帮助调用方按同一结构读写字段。
export type Logger = {
  silly?: (...args: unknown[]) => void;
  debug?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  // 这个回调绑定到 error?: (...args: unknown[]) => void;，负责ant claude for chrome mcp在该局部场景下的响应。
  error?: (...args: unknown[]) => void;
};

// ClaudeForChromeContext 固化ant claude for chrome mcp里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClaudeForChromeContext = Record<string, unknown>;

// BROWSER_TOOLS 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
export const BROWSER_TOOLS: Array<{ name: string }> = [];

// createClaudeForChromeMcpServer 封装ant-claude-for-chrome-mcp的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createClaudeForChromeMcpServer(
  _context: ClaudeForChromeContext,
) {
  // 返回结构化结果，集中表达ant claude for chrome mcp已经整理出的状态。
  return {
    // connect 使用 _transport: unknown 完成ant claude for chrome mcp里的对应操作。
    async connect(_transport: unknown): Promise<void> {},
  };
}
