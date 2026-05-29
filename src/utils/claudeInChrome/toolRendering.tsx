// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 复用 supportsHyperlinks 终端界面组件，避免在这里重复拼装显示逻辑。
import { supportsHyperlinks } from '../../ink/supports-hyperlinks.js';
// 引入 Link、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Link, Text } from '../../ink.js';
// 接入 renderToolResultMessage as renderDefaultMCPToolResultMessage 工具实现，后续工具池会按权限和开关决定是否暴露。
import { renderToolResultMessage as renderDefaultMCPToolResultMessage } from '../../tools/MCPTool/UI.js';
// 类型依赖 { MCPToolResult } 来自 ../../utils/mcpValidation.js，用于校准共享工具的数据契约。
import type { MCPToolResult } from '../../utils/mcpValidation.js';
// 引入 truncateToWidth，将 ../format.js 中已经封装好的能力接到本文件流程里。
import { truncateToWidth } from '../format.js';
// 引入 trackClaudeInChromeTabId，将 ./common.js 中已经封装好的能力接到本文件流程里。
import { trackClaudeInChromeTabId } from './common.js';
// 导出类型定义，让其他模块沿用共享工具 tool Rendering的数据契约。
export type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * All tool names from BROWSER_TOOLS in @ant/claude-for-chrome-mcp.
 * Keep in sync with the package's BROWSER_TOOLS array.
 */
// ChromeToolName 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChromeToolName = 'javascript_tool' | 'read_page' | 'find' | 'form_input' | 'computer' | 'navigate' | 'resize_window' | 'gif_creator' | 'upload_image' | 'get_page_text' | 'tabs_context_mcp' | 'tabs_create_mcp' | 'update_plan' | 'read_console_messages' | 'read_network_requests' | 'shortcuts_list' | 'shortcuts_execute';
// CHROME_EXTENSION_FOCUS_TAB_URL_BASE 命名 `'https://clau.de/chrome/tab/'`，让后续代码直接表达这个值的用途。
const CHROME_EXTENSION_FOCUS_TAB_URL_BASE = 'https://clau.de/chrome/tab/';
// renderChromeToolUseMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderChromeToolUseMessage(input: Record<string, unknown>, toolName: ChromeToolName, verbose: boolean): React.ReactNode {
  // tabId保存`input.tabId`，供共享工具 tool Rendering后续判断或输出使用。
  const tabId = input.tabId;
  // 当 `typeof tabId` 匹配 `'number'` 时，共享工具执行对应分支。
  if (typeof tabId === 'number') {
    // 调用 trackClaudeInChromeTabId，触发共享工具此处需要的副作用。
    trackClaudeInChromeTabId(tabId);
  }

  // Build secondary info based on tool type and input
  // secondaryInfo 从空数组开始收集，后续循环会按处理顺序追加条目。
  const secondaryInfo: string[] = [];
  // 按照 toolName 的取值选择共享工具的具体处理分支。
  switch (toolName) {
    case 'navigate':
      // 当 `typeof input.url` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof input.url === 'string') {
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // URL保存`URL`，供共享工具后续处理使用。
          const url = new URL(input.url);
          // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
          secondaryInfo.push(url.hostname);
        } catch {
          // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
          secondaryInfo.push(truncateToWidth(input.url, 30));
        }
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'find':
      // 当 `typeof input.query` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof input.query === 'string') {
        // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
        secondaryInfo.push(`pattern: ${truncateToWidth(input.query, 30)}`);
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'computer':
      // 当 `typeof input.action` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof input.action === 'string') {
        // action 命名 `input.action`，让后续代码直接表达这个值的用途。
        const action = input.action;
        // 只有 `action === 'left_click' || action === 'right_clic` 满足时，共享工具才执行该分支。
        if (action === 'left_click' || action === 'right_click' || action === 'double_click' || action === 'middle_click') {
          // 当 `typeof input.ref` 匹配 `'string'` 时，共享工具执行对应分支。
          if (typeof input.ref === 'string') {
            // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
            secondaryInfo.push(`${action} on ${input.ref}`);
          // 共享工具 tool Rendering在这里处理 `} else if (Array.isArray(input.coordinate)) {`，完成这一小步状态转换。
          } else if (Array.isArray(input.coordinate)) {
            // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
            secondaryInfo.push(`${action} at (${input.coordinate.join(', ')})`);
          } else {
            // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
            secondaryInfo.push(action);
          }
        // 共享工具 tool Rendering在这里处理 `} else if (action === 'type' && typeof input.text === 'string') {`，完成这一小步状态转换。
        } else if (action === 'type' && typeof input.text === 'string') {
          // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
          secondaryInfo.push(`type "${truncateToWidth(input.text, 15)}"`);
        // 共享工具 tool Rendering在这里处理 `} else if (action === 'key' && typeof input.text === 'string') {`，完成这一小步状态转换。
        } else if (action === 'key' && typeof input.text === 'string') {
          // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
          secondaryInfo.push(`key ${input.text}`);
        // 共享工具 tool Rendering在这里处理 `} else if (action === 'scroll' && typeof input.scroll_direction === 'st...`，完成这一小步状态转换。
        } else if (action === 'scroll' && typeof input.scroll_direction === 'string') {
          // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
          secondaryInfo.push(`scroll ${input.scroll_direction}`);
        // 共享工具 tool Rendering在这里处理 `} else if (action === 'wait' && typeof input.duration === 'number') {`，完成这一小步状态转换。
        } else if (action === 'wait' && typeof input.duration === 'number') {
          // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
          secondaryInfo.push(`wait ${input.duration}s`);
        // 共享工具 tool Rendering在这里处理 `} else if (action === 'left_click_drag') {`，完成这一小步状态转换。
        } else if (action === 'left_click_drag') {
          // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
          secondaryInfo.push('drag');
        } else {
          // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
          secondaryInfo.push(action);
        }
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'gif_creator':
      // 当 `typeof input.action` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof input.action === 'string') {
        // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
        secondaryInfo.push(`${input.action}`);
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'resize_window':
      // 只有 `typeof input.width === 'number' && typeof input.h` 满足时，共享工具才执行该分支。
      if (typeof input.width === 'number' && typeof input.height === 'number') {
        // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
        secondaryInfo.push(`${input.width}x${input.height}`);
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'read_console_messages':
      // 当 `typeof input.pattern` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof input.pattern === 'string') {
        // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
        secondaryInfo.push(`pattern: ${truncateToWidth(input.pattern, 20)}`);
      }
      // 满足 `input.onlyErrors === true` 时，共享工具执行该分支。
      if (input.onlyErrors === true) {
        // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
        secondaryInfo.push('errors only');
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'read_network_requests':
      // 当 `typeof input.urlPattern` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof input.urlPattern === 'string') {
        // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
        secondaryInfo.push(`pattern: ${truncateToWidth(input.urlPattern, 20)}`);
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'shortcuts_execute':
      // 当 `typeof input.shortcutId` 匹配 `'string'` 时，共享工具执行对应分支。
      if (typeof input.shortcutId === 'string') {
        // secondaryInfo追加新条目，保持收集顺序与输入顺序一致。
        secondaryInfo.push(`shortcut_id: ${input.shortcutId}`);
      }
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'javascript_tool':
      // In verbose mode, show the full code
      // 当 `verbose && typeof input.text` 匹配 `'string'` 时，共享工具执行对应分支。
      if (verbose && typeof input.text === 'string') {
        // 返回 `input.text`，作为共享工具这次计算的结果。
        return input.text;
      }
      // In non-verbose mode, return empty string to preserve View Tab layout
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return '';
    case 'tabs_create_mcp':
    case 'tabs_context_mcp':
    case 'form_input':
    case 'shortcuts_list':
    case 'read_page':
    case 'upload_image':
    case 'get_page_text':
    case 'update_plan':
      // These tools don't have meaningful secondary info to show inline.
      // Return empty string (not null) to ensure tool header still renders.
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return '';
  }
  // 返回 `secondaryInfo.join(', ') || null`，作为共享工具这次计算的结果。
  return secondaryInfo.join(', ') || null;
}

/**
 * Renders a clickable "View Tab" link for Claude in Chrome MCP tools.
 * Returns null if:
 * - The tool is not a Claude in Chrome MCP tool
 * - The input doesn't have a valid tabId
 * - Hyperlinks are not supported
 */
// renderChromeViewTabLink 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderChromeViewTabLink(input: unknown): React.ReactNode {
  // 满足 `!supportsHyperlinks()` 时，共享工具执行该分支。
  if (!supportsHyperlinks()) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null;
  }
  // `typeof input` 与 `'object' || input === null || !...` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof input !== 'object' || input === null || !('tabId' in input)) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null;
  }
  // tabId解析`parseInt`，供共享工具后续处理使用。
  const tabId = typeof input.tabId === 'number' ? input.tabId : typeof input.tabId === 'string' ? parseInt(input.tabId, 10) : NaN;
  // 满足 `isNaN(tabId)` 时，共享工具执行该分支。
  if (isNaN(tabId)) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null;
  }
  // linkUrl 命名 ``${CHROME_EXTENSION_FOCUS_TAB_URL_BASE}${tabId}``，让后续代码直接表达这个值的用途。
  const linkUrl = `${CHROME_EXTENSION_FOCUS_TAB_URL_BASE}${tabId}`;
  // 返回 `<Text>`，作为共享工具这次计算的结果。
  return <Text>
      {' '}
      <Link url={linkUrl}>
        <Text color="subtle">[View Tab]</Text>
      </Link>
    </Text>;
}

/**
 * Custom tool result message rendering for claude-in-chrome tools.
 * Shows a brief summary for successful results. Errors are handled by
 * the default renderToolUseErrorMessage when is_error is set.
 */
// renderChromeToolResultMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderChromeToolResultMessage(output: MCPToolResult, toolName: ChromeToolName, verbose: boolean): React.ReactNode {
  // 满足 `verbose` 时，共享工具执行该分支。
  if (verbose) {
    // 返回 `renderDefaultMCPToolResultMessage(output, [], {`，作为共享工具这次计算的结果。
    return renderDefaultMCPToolResultMessage(output, [], {
      verbose
    });
  }
  // summary保存`null`，作为后续空值处理的输入。
  let summary: string | null = null;
  // 按照 toolName 的取值选择共享工具的具体处理分支。
  switch (toolName) {
    case 'navigate':
      // summary更新为 `'Navigation completed'`，确保共享工具后续读取最新状态。
      summary = 'Navigation completed';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'tabs_create_mcp':
      // summary更新为 `'Tab created'`，确保共享工具后续读取最新状态。
      summary = 'Tab created';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'tabs_context_mcp':
      // summary更新为 `'Tabs read'`，确保共享工具后续读取最新状态。
      summary = 'Tabs read';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'form_input':
      // summary更新为 `'Input completed'`，确保共享工具后续读取最新状态。
      summary = 'Input completed';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'computer':
      // summary更新为 `'Action completed'`，确保共享工具后续读取最新状态。
      summary = 'Action completed';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'resize_window':
      // summary更新为 `'Window resized'`，确保共享工具后续读取最新状态。
      summary = 'Window resized';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'find':
      // summary更新为 `'Search completed'`，确保共享工具后续读取最新状态。
      summary = 'Search completed';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'gif_creator':
      // summary更新为 `'GIF action completed'`，确保共享工具后续读取最新状态。
      summary = 'GIF action completed';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'read_console_messages':
      // summary更新为 `'Console messages retrieved'`，确保共享工具后续读取最新状态。
      summary = 'Console messages retrieved';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'read_network_requests':
      // summary更新为 `'Network requests retrieved'`，确保共享工具后续读取最新状态。
      summary = 'Network requests retrieved';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'shortcuts_list':
      // summary更新为 `'Shortcuts retrieved'`，确保共享工具后续读取最新状态。
      summary = 'Shortcuts retrieved';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'shortcuts_execute':
      // summary更新为 `'Shortcut executed'`，确保共享工具后续读取最新状态。
      summary = 'Shortcut executed';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'javascript_tool':
      // summary更新为 `'Script executed'`，确保共享工具后续读取最新状态。
      summary = 'Script executed';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'read_page':
      // summary更新为 `'Page read'`，确保共享工具后续读取最新状态。
      summary = 'Page read';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'upload_image':
      // summary更新为 `'Image uploaded'`，确保共享工具后续读取最新状态。
      summary = 'Image uploaded';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'get_page_text':
      // summary更新为 `'Page text retrieved'`，确保共享工具后续读取最新状态。
      summary = 'Page text retrieved';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
    case 'update_plan':
      // summary更新为 `'Plan updated'`，确保共享工具后续读取最新状态。
      summary = 'Plan updated';
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break;
  }
  // 满足 `summary` 时，共享工具执行该分支。
  if (summary) {
    // 返回 `<MessageResponse height={1}>`，作为共享工具这次计算的结果。
    return <MessageResponse height={1}>
        <Text dimColor>{summary}</Text>
      </MessageResponse>;
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null;
}

/**
 * Returns tool method overrides for Claude in Chrome MCP tools. Use this to customize
 * rendering for chrome tools in a single spread operation.
 */
// getClaudeInChromeMCPToolOverrides 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClaudeInChromeMCPToolOverrides(toolName: string): {
  // 这个回调绑定到 userFacingName: (input?: Record<string, unknown>) => string;，负责共享工具在该局部场景下的响应。
  userFacingName: (input?: Record<string, unknown>) => string;
  renderToolUseMessage: (input: Record<string, unknown>, options: {
    verbose: boolean;
  }) => React.ReactNode;
  // 这个回调绑定到 renderToolUseTag: (input: Partial<Record<string, unknown>>) => React.ReactNode;，负责共享工具在该局部场景下的响应。
  renderToolUseTag: (input: Partial<Record<string, unknown>>) => React.ReactNode;
  renderToolResultMessage: (output: string | MCPToolResult, progressMessagesForMessage: unknown[], options: {
    verbose: boolean;
  }) => React.ReactNode;
} {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // userFacingName 使用 _input?: Record<string, unknown> 完成共享工具里的对应操作。
    userFacingName(_input?: Record<string, unknown>) {
      // Trim the _mcp postfix that show up in some of the tool names
      // displayName格式化`toolName.replace`，供共享工具后续处理使用。
      const displayName = toolName.replace(/_mcp$/, '');
      // 返回 ``Claude in Chrome[${displayName}]``，作为共享工具这次计算的结果。
      return `Claude in Chrome[${displayName}]`;
    },
    // 调用 renderToolUseMessage，触发共享工具此处需要的副作用。
    renderToolUseMessage(input: Record<string, unknown>, {
      verbose
    }: {
      verbose: boolean;
    }): React.ReactNode {
      // 返回 `renderChromeToolUseMessage(input, toolName as ChromeToolName, verbose)`，作为共享工具这次计算的结果。
      return renderChromeToolUseMessage(input, toolName as ChromeToolName, verbose);
    },
    // renderToolUseTag 使用 input: Partial<Record<string, unknown>> 完成共享工具里的对应操作。
    renderToolUseTag(input: Partial<Record<string, unknown>>): React.ReactNode {
      // 返回 `renderChromeViewTabLink(input)`，作为共享工具这次计算的结果。
      return renderChromeViewTabLink(input);
    },
    renderToolResultMessage(output: string | MCPToolResult, _progressMessagesForMessage: unknown[], {
      verbose
    }: {
      verbose: boolean;
    }): React.ReactNode {
      // 满足 `!isMCPToolResult(output)` 时，共享工具执行该分支。
      if (!isMCPToolResult(output)) {
        // 返回 `null`，作为共享工具这次计算的结果。
        return null;
      }
      // 返回 `renderChromeToolResultMessage(output, toolName as ChromeToolName, verbo...`，作为共享工具这次计算的结果。
      return renderChromeToolResultMessage(output, toolName as ChromeToolName, verbose);
    }
  };
}
// isMCPToolResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMCPToolResult(output: string | MCPToolResult): output is MCPToolResult {
  // 返回 `typeof output === 'object' && output !== null`，作为共享工具这次计算的结果。
  return typeof output === 'object' && output !== null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1lc3NhZ2VSZXNwb25zZSIsInN1cHBvcnRzSHlwZXJsaW5rcyIsIkxpbmsiLCJUZXh0IiwicmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UiLCJyZW5kZXJEZWZhdWx0TUNQVG9vbFJlc3VsdE1lc3NhZ2UiLCJNQ1BUb29sUmVzdWx0IiwidHJ1bmNhdGVUb1dpZHRoIiwidHJhY2tDbGF1ZGVJbkNocm9tZVRhYklkIiwiVG9vbCIsIkNocm9tZVRvb2xOYW1lIiwiQ0hST01FX0VYVEVOU0lPTl9GT0NVU19UQUJfVVJMX0JBU0UiLCJyZW5kZXJDaHJvbWVUb29sVXNlTWVzc2FnZSIsImlucHV0IiwiUmVjb3JkIiwidG9vbE5hbWUiLCJ2ZXJib3NlIiwiUmVhY3ROb2RlIiwidGFiSWQiLCJzZWNvbmRhcnlJbmZvIiwidXJsIiwiVVJMIiwicHVzaCIsImhvc3RuYW1lIiwicXVlcnkiLCJhY3Rpb24iLCJyZWYiLCJBcnJheSIsImlzQXJyYXkiLCJjb29yZGluYXRlIiwiam9pbiIsInRleHQiLCJzY3JvbGxfZGlyZWN0aW9uIiwiZHVyYXRpb24iLCJ3aWR0aCIsImhlaWdodCIsInBhdHRlcm4iLCJvbmx5RXJyb3JzIiwidXJsUGF0dGVybiIsInNob3J0Y3V0SWQiLCJyZW5kZXJDaHJvbWVWaWV3VGFiTGluayIsInBhcnNlSW50IiwiTmFOIiwiaXNOYU4iLCJsaW5rVXJsIiwicmVuZGVyQ2hyb21lVG9vbFJlc3VsdE1lc3NhZ2UiLCJvdXRwdXQiLCJzdW1tYXJ5IiwiZ2V0Q2xhdWRlSW5DaHJvbWVNQ1BUb29sT3ZlcnJpZGVzIiwidXNlckZhY2luZ05hbWUiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsIm9wdGlvbnMiLCJyZW5kZXJUb29sVXNlVGFnIiwiUGFydGlhbCIsInByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlIiwiX2lucHV0IiwiZGlzcGxheU5hbWUiLCJyZXBsYWNlIiwiX3Byb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlIiwiaXNNQ1BUb29sUmVzdWx0Il0sInNvdXJjZXMiOlsidG9vbFJlbmRlcmluZy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL01lc3NhZ2VSZXNwb25zZS5qcydcbmltcG9ydCB7IHN1cHBvcnRzSHlwZXJsaW5rcyB9IGZyb20gJy4uLy4uL2luay9zdXBwb3J0cy1oeXBlcmxpbmtzLmpzJ1xuaW1wb3J0IHsgTGluaywgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHJlbmRlclRvb2xSZXN1bHRNZXNzYWdlIGFzIHJlbmRlckRlZmF1bHRNQ1BUb29sUmVzdWx0TWVzc2FnZSB9IGZyb20gJy4uLy4uL3Rvb2xzL01DUFRvb2wvVUkuanMnXG5pbXBvcnQgdHlwZSB7IE1DUFRvb2xSZXN1bHQgfSBmcm9tICcuLi8uLi91dGlscy9tY3BWYWxpZGF0aW9uLmpzJ1xuaW1wb3J0IHsgdHJ1bmNhdGVUb1dpZHRoIH0gZnJvbSAnLi4vZm9ybWF0LmpzJ1xuaW1wb3J0IHsgdHJhY2tDbGF1ZGVJbkNocm9tZVRhYklkIH0gZnJvbSAnLi9jb21tb24uanMnXG5cbmV4cG9ydCB0eXBlIHsgVG9vbCB9IGZyb20gJ0Btb2RlbGNvbnRleHRwcm90b2NvbC9zZGsvdHlwZXMuanMnXG5cbi8qKlxuICogQWxsIHRvb2wgbmFtZXMgZnJvbSBCUk9XU0VSX1RPT0xTIGluIEBhbnQvY2xhdWRlLWZvci1jaHJvbWUtbWNwLlxuICogS2VlcCBpbiBzeW5jIHdpdGggdGhlIHBhY2thZ2UncyBCUk9XU0VSX1RPT0xTIGFycmF5LlxuICovXG5leHBvcnQgdHlwZSBDaHJvbWVUb29sTmFtZSA9XG4gIHwgJ2phdmFzY3JpcHRfdG9vbCdcbiAgfCAncmVhZF9wYWdlJ1xuICB8ICdmaW5kJ1xuICB8ICdmb3JtX2lucHV0J1xuICB8ICdjb21wdXRlcidcbiAgfCAnbmF2aWdhdGUnXG4gIHwgJ3Jlc2l6ZV93aW5kb3cnXG4gIHwgJ2dpZl9jcmVhdG9yJ1xuICB8ICd1cGxvYWRfaW1hZ2UnXG4gIHwgJ2dldF9wYWdlX3RleHQnXG4gIHwgJ3RhYnNfY29udGV4dF9tY3AnXG4gIHwgJ3RhYnNfY3JlYXRlX21jcCdcbiAgfCAndXBkYXRlX3BsYW4nXG4gIHwgJ3JlYWRfY29uc29sZV9tZXNzYWdlcydcbiAgfCAncmVhZF9uZXR3b3JrX3JlcXVlc3RzJ1xuICB8ICdzaG9ydGN1dHNfbGlzdCdcbiAgfCAnc2hvcnRjdXRzX2V4ZWN1dGUnXG5cbmNvbnN0IENIUk9NRV9FWFRFTlNJT05fRk9DVVNfVEFCX1VSTF9CQVNFID0gJ2h0dHBzOi8vY2xhdS5kZS9jaHJvbWUvdGFiLydcblxuZnVuY3Rpb24gcmVuZGVyQ2hyb21lVG9vbFVzZU1lc3NhZ2UoXG4gIGlucHV0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgdG9vbE5hbWU6IENocm9tZVRvb2xOYW1lLFxuICB2ZXJib3NlOiBib29sZWFuLFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgdGFiSWQgPSBpbnB1dC50YWJJZFxuICBpZiAodHlwZW9mIHRhYklkID09PSAnbnVtYmVyJykge1xuICAgIHRyYWNrQ2xhdWRlSW5DaHJvbWVUYWJJZCh0YWJJZClcbiAgfVxuXG4gIC8vIEJ1aWxkIHNlY29uZGFyeSBpbmZvIGJhc2VkIG9uIHRvb2wgdHlwZSBhbmQgaW5wdXRcbiAgY29uc3Qgc2Vjb25kYXJ5SW5mbzogc3RyaW5nW10gPSBbXVxuXG4gIHN3aXRjaCAodG9vbE5hbWUpIHtcbiAgICBjYXNlICduYXZpZ2F0ZSc6XG4gICAgICBpZiAodHlwZW9mIGlucHV0LnVybCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGlucHV0LnVybClcbiAgICAgICAgICBzZWNvbmRhcnlJbmZvLnB1c2godXJsLmhvc3RuYW1lKVxuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICBzZWNvbmRhcnlJbmZvLnB1c2godHJ1bmNhdGVUb1dpZHRoKGlucHV0LnVybCwgMzApKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnZmluZCc6XG4gICAgICBpZiAodHlwZW9mIGlucHV0LnF1ZXJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgICBzZWNvbmRhcnlJbmZvLnB1c2goYHBhdHRlcm46ICR7dHJ1bmNhdGVUb1dpZHRoKGlucHV0LnF1ZXJ5LCAzMCl9YClcbiAgICAgIH1cbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICdjb21wdXRlcic6XG4gICAgICBpZiAodHlwZW9mIGlucHV0LmFjdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgYWN0aW9uID0gaW5wdXQuYWN0aW9uXG4gICAgICAgIGlmIChcbiAgICAgICAgICBhY3Rpb24gPT09ICdsZWZ0X2NsaWNrJyB8fFxuICAgICAgICAgIGFjdGlvbiA9PT0gJ3JpZ2h0X2NsaWNrJyB8fFxuICAgICAgICAgIGFjdGlvbiA9PT0gJ2RvdWJsZV9jbGljaycgfHxcbiAgICAgICAgICBhY3Rpb24gPT09ICdtaWRkbGVfY2xpY2snXG4gICAgICAgICkge1xuICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXQucmVmID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc2Vjb25kYXJ5SW5mby5wdXNoKGAke2FjdGlvbn0gb24gJHtpbnB1dC5yZWZ9YClcbiAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQuY29vcmRpbmF0ZSkpIHtcbiAgICAgICAgICAgIHNlY29uZGFyeUluZm8ucHVzaChgJHthY3Rpb259IGF0ICgke2lucHV0LmNvb3JkaW5hdGUuam9pbignLCAnKX0pYClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Vjb25kYXJ5SW5mby5wdXNoKGFjdGlvbilcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAndHlwZScgJiYgdHlwZW9mIGlucHV0LnRleHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgc2Vjb25kYXJ5SW5mby5wdXNoKGB0eXBlIFwiJHt0cnVuY2F0ZVRvV2lkdGgoaW5wdXQudGV4dCwgMTUpfVwiYClcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdrZXknICYmIHR5cGVvZiBpbnB1dC50ZXh0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHNlY29uZGFyeUluZm8ucHVzaChga2V5ICR7aW5wdXQudGV4dH1gKVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGFjdGlvbiA9PT0gJ3Njcm9sbCcgJiZcbiAgICAgICAgICB0eXBlb2YgaW5wdXQuc2Nyb2xsX2RpcmVjdGlvbiA9PT0gJ3N0cmluZydcbiAgICAgICAgKSB7XG4gICAgICAgICAgc2Vjb25kYXJ5SW5mby5wdXNoKGBzY3JvbGwgJHtpbnB1dC5zY3JvbGxfZGlyZWN0aW9ufWApXG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnd2FpdCcgJiYgdHlwZW9mIGlucHV0LmR1cmF0aW9uID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHNlY29uZGFyeUluZm8ucHVzaChgd2FpdCAke2lucHV0LmR1cmF0aW9ufXNgKVxuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2xlZnRfY2xpY2tfZHJhZycpIHtcbiAgICAgICAgICBzZWNvbmRhcnlJbmZvLnB1c2goJ2RyYWcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlY29uZGFyeUluZm8ucHVzaChhY3Rpb24pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICdnaWZfY3JlYXRvcic6XG4gICAgICBpZiAodHlwZW9mIGlucHV0LmFjdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgc2Vjb25kYXJ5SW5mby5wdXNoKGAke2lucHV0LmFjdGlvbn1gKVxuICAgICAgfVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ3Jlc2l6ZV93aW5kb3cnOlxuICAgICAgaWYgKHR5cGVvZiBpbnB1dC53aWR0aCA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGlucHV0LmhlaWdodCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgc2Vjb25kYXJ5SW5mby5wdXNoKGAke2lucHV0LndpZHRofXgke2lucHV0LmhlaWdodH1gKVxuICAgICAgfVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ3JlYWRfY29uc29sZV9tZXNzYWdlcyc6XG4gICAgICBpZiAodHlwZW9mIGlucHV0LnBhdHRlcm4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHNlY29uZGFyeUluZm8ucHVzaChgcGF0dGVybjogJHt0cnVuY2F0ZVRvV2lkdGgoaW5wdXQucGF0dGVybiwgMjApfWApXG4gICAgICB9XG4gICAgICBpZiAoaW5wdXQub25seUVycm9ycyA9PT0gdHJ1ZSkge1xuICAgICAgICBzZWNvbmRhcnlJbmZvLnB1c2goJ2Vycm9ycyBvbmx5JylcbiAgICAgIH1cbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICdyZWFkX25ldHdvcmtfcmVxdWVzdHMnOlxuICAgICAgaWYgKHR5cGVvZiBpbnB1dC51cmxQYXR0ZXJuID09PSAnc3RyaW5nJykge1xuICAgICAgICBzZWNvbmRhcnlJbmZvLnB1c2goYHBhdHRlcm46ICR7dHJ1bmNhdGVUb1dpZHRoKGlucHV0LnVybFBhdHRlcm4sIDIwKX1gKVxuICAgICAgfVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ3Nob3J0Y3V0c19leGVjdXRlJzpcbiAgICAgIGlmICh0eXBlb2YgaW5wdXQuc2hvcnRjdXRJZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgc2Vjb25kYXJ5SW5mby5wdXNoKGBzaG9ydGN1dF9pZDogJHtpbnB1dC5zaG9ydGN1dElkfWApXG4gICAgICB9XG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnamF2YXNjcmlwdF90b29sJzpcbiAgICAgIC8vIEluIHZlcmJvc2UgbW9kZSwgc2hvdyB0aGUgZnVsbCBjb2RlXG4gICAgICBpZiAodmVyYm9zZSAmJiB0eXBlb2YgaW5wdXQudGV4dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0LnRleHRcbiAgICAgIH1cbiAgICAgIC8vIEluIG5vbi12ZXJib3NlIG1vZGUsIHJldHVybiBlbXB0eSBzdHJpbmcgdG8gcHJlc2VydmUgVmlldyBUYWIgbGF5b3V0XG4gICAgICByZXR1cm4gJydcblxuICAgIGNhc2UgJ3RhYnNfY3JlYXRlX21jcCc6XG4gICAgY2FzZSAndGFic19jb250ZXh0X21jcCc6XG4gICAgY2FzZSAnZm9ybV9pbnB1dCc6XG4gICAgY2FzZSAnc2hvcnRjdXRzX2xpc3QnOlxuICAgIGNhc2UgJ3JlYWRfcGFnZSc6XG4gICAgY2FzZSAndXBsb2FkX2ltYWdlJzpcbiAgICBjYXNlICdnZXRfcGFnZV90ZXh0JzpcbiAgICBjYXNlICd1cGRhdGVfcGxhbic6XG4gICAgICAvLyBUaGVzZSB0b29scyBkb24ndCBoYXZlIG1lYW5pbmdmdWwgc2Vjb25kYXJ5IGluZm8gdG8gc2hvdyBpbmxpbmUuXG4gICAgICAvLyBSZXR1cm4gZW1wdHkgc3RyaW5nIChub3QgbnVsbCkgdG8gZW5zdXJlIHRvb2wgaGVhZGVyIHN0aWxsIHJlbmRlcnMuXG4gICAgICByZXR1cm4gJydcbiAgfVxuXG4gIHJldHVybiBzZWNvbmRhcnlJbmZvLmpvaW4oJywgJykgfHwgbnVsbFxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBjbGlja2FibGUgXCJWaWV3IFRhYlwiIGxpbmsgZm9yIENsYXVkZSBpbiBDaHJvbWUgTUNQIHRvb2xzLlxuICogUmV0dXJucyBudWxsIGlmOlxuICogLSBUaGUgdG9vbCBpcyBub3QgYSBDbGF1ZGUgaW4gQ2hyb21lIE1DUCB0b29sXG4gKiAtIFRoZSBpbnB1dCBkb2Vzbid0IGhhdmUgYSB2YWxpZCB0YWJJZFxuICogLSBIeXBlcmxpbmtzIGFyZSBub3Qgc3VwcG9ydGVkXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckNocm9tZVZpZXdUYWJMaW5rKGlucHV0OiB1bmtub3duKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCFzdXBwb3J0c0h5cGVybGlua3MoKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ29iamVjdCcgfHwgaW5wdXQgPT09IG51bGwgfHwgISgndGFiSWQnIGluIGlucHV0KSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgY29uc3QgdGFiSWQgPVxuICAgIHR5cGVvZiBpbnB1dC50YWJJZCA9PT0gJ251bWJlcidcbiAgICAgID8gaW5wdXQudGFiSWRcbiAgICAgIDogdHlwZW9mIGlucHV0LnRhYklkID09PSAnc3RyaW5nJ1xuICAgICAgICA/IHBhcnNlSW50KGlucHV0LnRhYklkLCAxMClcbiAgICAgICAgOiBOYU5cbiAgaWYgKGlzTmFOKHRhYklkKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgY29uc3QgbGlua1VybCA9IGAke0NIUk9NRV9FWFRFTlNJT05fRk9DVVNfVEFCX1VSTF9CQVNFfSR7dGFiSWR9YFxuICByZXR1cm4gKFxuICAgIDxUZXh0PlxuICAgICAgeycgJ31cbiAgICAgIDxMaW5rIHVybD17bGlua1VybH0+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwic3VidGxlXCI+W1ZpZXcgVGFiXTwvVGV4dD5cbiAgICAgIDwvTGluaz5cbiAgICA8L1RleHQ+XG4gIClcbn1cblxuLyoqXG4gKiBDdXN0b20gdG9vbCByZXN1bHQgbWVzc2FnZSByZW5kZXJpbmcgZm9yIGNsYXVkZS1pbi1jaHJvbWUgdG9vbHMuXG4gKiBTaG93cyBhIGJyaWVmIHN1bW1hcnkgZm9yIHN1Y2Nlc3NmdWwgcmVzdWx0cy4gRXJyb3JzIGFyZSBoYW5kbGVkIGJ5XG4gKiB0aGUgZGVmYXVsdCByZW5kZXJUb29sVXNlRXJyb3JNZXNzYWdlIHdoZW4gaXNfZXJyb3IgaXMgc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ2hyb21lVG9vbFJlc3VsdE1lc3NhZ2UoXG4gIG91dHB1dDogTUNQVG9vbFJlc3VsdCxcbiAgdG9vbE5hbWU6IENocm9tZVRvb2xOYW1lLFxuICB2ZXJib3NlOiBib29sZWFuLFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKHZlcmJvc2UpIHtcbiAgICByZXR1cm4gcmVuZGVyRGVmYXVsdE1DUFRvb2xSZXN1bHRNZXNzYWdlKG91dHB1dCwgW10sIHsgdmVyYm9zZSB9KVxuICB9XG5cbiAgbGV0IHN1bW1hcnk6IHN0cmluZyB8IG51bGwgPSBudWxsXG4gIHN3aXRjaCAodG9vbE5hbWUpIHtcbiAgICBjYXNlICduYXZpZ2F0ZSc6XG4gICAgICBzdW1tYXJ5ID0gJ05hdmlnYXRpb24gY29tcGxldGVkJ1xuICAgICAgYnJlYWtcbiAgICBjYXNlICd0YWJzX2NyZWF0ZV9tY3AnOlxuICAgICAgc3VtbWFyeSA9ICdUYWIgY3JlYXRlZCdcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndGFic19jb250ZXh0X21jcCc6XG4gICAgICBzdW1tYXJ5ID0gJ1RhYnMgcmVhZCdcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnZm9ybV9pbnB1dCc6XG4gICAgICBzdW1tYXJ5ID0gJ0lucHV0IGNvbXBsZXRlZCdcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnY29tcHV0ZXInOlxuICAgICAgc3VtbWFyeSA9ICdBY3Rpb24gY29tcGxldGVkJ1xuICAgICAgYnJlYWtcbiAgICBjYXNlICdyZXNpemVfd2luZG93JzpcbiAgICAgIHN1bW1hcnkgPSAnV2luZG93IHJlc2l6ZWQnXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2ZpbmQnOlxuICAgICAgc3VtbWFyeSA9ICdTZWFyY2ggY29tcGxldGVkJ1xuICAgICAgYnJlYWtcbiAgICBjYXNlICdnaWZfY3JlYXRvcic6XG4gICAgICBzdW1tYXJ5ID0gJ0dJRiBhY3Rpb24gY29tcGxldGVkJ1xuICAgICAgYnJlYWtcbiAgICBjYXNlICdyZWFkX2NvbnNvbGVfbWVzc2FnZXMnOlxuICAgICAgc3VtbWFyeSA9ICdDb25zb2xlIG1lc3NhZ2VzIHJldHJpZXZlZCdcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAncmVhZF9uZXR3b3JrX3JlcXVlc3RzJzpcbiAgICAgIHN1bW1hcnkgPSAnTmV0d29yayByZXF1ZXN0cyByZXRyaWV2ZWQnXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3Nob3J0Y3V0c19saXN0JzpcbiAgICAgIHN1bW1hcnkgPSAnU2hvcnRjdXRzIHJldHJpZXZlZCdcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnc2hvcnRjdXRzX2V4ZWN1dGUnOlxuICAgICAgc3VtbWFyeSA9ICdTaG9ydGN1dCBleGVjdXRlZCdcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnamF2YXNjcmlwdF90b29sJzpcbiAgICAgIHN1bW1hcnkgPSAnU2NyaXB0IGV4ZWN1dGVkJ1xuICAgICAgYnJlYWtcbiAgICBjYXNlICdyZWFkX3BhZ2UnOlxuICAgICAgc3VtbWFyeSA9ICdQYWdlIHJlYWQnXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VwbG9hZF9pbWFnZSc6XG4gICAgICBzdW1tYXJ5ID0gJ0ltYWdlIHVwbG9hZGVkJ1xuICAgICAgYnJlYWtcbiAgICBjYXNlICdnZXRfcGFnZV90ZXh0JzpcbiAgICAgIHN1bW1hcnkgPSAnUGFnZSB0ZXh0IHJldHJpZXZlZCdcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXBkYXRlX3BsYW4nOlxuICAgICAgc3VtbWFyeSA9ICdQbGFuIHVwZGF0ZWQnXG4gICAgICBicmVha1xuICB9XG5cbiAgaWYgKHN1bW1hcnkpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE1lc3NhZ2VSZXNwb25zZSBoZWlnaHQ9ezF9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj57c3VtbWFyeX08L1RleHQ+XG4gICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICApXG4gIH1cblxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIFJldHVybnMgdG9vbCBtZXRob2Qgb3ZlcnJpZGVzIGZvciBDbGF1ZGUgaW4gQ2hyb21lIE1DUCB0b29scy4gVXNlIHRoaXMgdG8gY3VzdG9taXplXG4gKiByZW5kZXJpbmcgZm9yIGNocm9tZSB0b29scyBpbiBhIHNpbmdsZSBzcHJlYWQgb3BlcmF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2xhdWRlSW5DaHJvbWVNQ1BUb29sT3ZlcnJpZGVzKHRvb2xOYW1lOiBzdHJpbmcpOiB7XG4gIHVzZXJGYWNpbmdOYW1lOiAoaW5wdXQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gc3RyaW5nXG4gIHJlbmRlclRvb2xVc2VNZXNzYWdlOiAoXG4gICAgaW5wdXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIG9wdGlvbnM6IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuICApID0+IFJlYWN0LlJlYWN0Tm9kZVxuICByZW5kZXJUb29sVXNlVGFnOiAoaW5wdXQ6IFBhcnRpYWw8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+KSA9PiBSZWFjdC5SZWFjdE5vZGVcbiAgcmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2U6IChcbiAgICBvdXRwdXQ6IHN0cmluZyB8IE1DUFRvb2xSZXN1bHQsXG4gICAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U6IHVua25vd25bXSxcbiAgICBvcHRpb25zOiB7IHZlcmJvc2U6IGJvb2xlYW4gfSxcbiAgKSA9PiBSZWFjdC5SZWFjdE5vZGVcbn0ge1xuICByZXR1cm4ge1xuICAgIHVzZXJGYWNpbmdOYW1lKF9pbnB1dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgICAvLyBUcmltIHRoZSBfbWNwIHBvc3RmaXggdGhhdCBzaG93IHVwIGluIHNvbWUgb2YgdGhlIHRvb2wgbmFtZXNcbiAgICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gdG9vbE5hbWUucmVwbGFjZSgvX21jcCQvLCAnJylcbiAgICAgIHJldHVybiBgQ2xhdWRlIGluIENocm9tZVske2Rpc3BsYXlOYW1lfV1gXG4gICAgfSxcbiAgICByZW5kZXJUb29sVXNlTWVzc2FnZShcbiAgICAgIGlucHV0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgIHsgdmVyYm9zZSB9OiB7IHZlcmJvc2U6IGJvb2xlYW4gfSxcbiAgICApOiBSZWFjdC5SZWFjdE5vZGUge1xuICAgICAgcmV0dXJuIHJlbmRlckNocm9tZVRvb2xVc2VNZXNzYWdlKFxuICAgICAgICBpbnB1dCxcbiAgICAgICAgdG9vbE5hbWUgYXMgQ2hyb21lVG9vbE5hbWUsXG4gICAgICAgIHZlcmJvc2UsXG4gICAgICApXG4gICAgfSxcbiAgICByZW5kZXJUb29sVXNlVGFnKGlucHV0OiBQYXJ0aWFsPFJlY29yZDxzdHJpbmcsIHVua25vd24+Pik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgICByZXR1cm4gcmVuZGVyQ2hyb21lVmlld1RhYkxpbmsoaW5wdXQpXG4gICAgfSxcbiAgICByZW5kZXJUb29sUmVzdWx0TWVzc2FnZShcbiAgICAgIG91dHB1dDogc3RyaW5nIHwgTUNQVG9vbFJlc3VsdCxcbiAgICAgIF9wcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZTogdW5rbm93bltdLFxuICAgICAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuICAgICk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gICAgICBpZiAoIWlzTUNQVG9vbFJlc3VsdChvdXRwdXQpKSB7XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG4gICAgICByZXR1cm4gcmVuZGVyQ2hyb21lVG9vbFJlc3VsdE1lc3NhZ2UoXG4gICAgICAgIG91dHB1dCxcbiAgICAgICAgdG9vbE5hbWUgYXMgQ2hyb21lVG9vbE5hbWUsXG4gICAgICAgIHZlcmJvc2UsXG4gICAgICApXG4gICAgfSxcbiAgfVxufVxuXG5mdW5jdGlvbiBpc01DUFRvb2xSZXN1bHQoXG4gIG91dHB1dDogc3RyaW5nIHwgTUNQVG9vbFJlc3VsdCxcbik6IG91dHB1dCBpcyBNQ1BUb29sUmVzdWx0IHtcbiAgcmV0dXJuIHR5cGVvZiBvdXRwdXQgPT09ICdvYmplY3QnICYmIG91dHB1dCAhPT0gbnVsbFxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFP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