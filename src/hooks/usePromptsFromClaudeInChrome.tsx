// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准React hook 状态流的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs';
// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react';
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js';
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4';
// 接入 callIdeRpc 服务层能力，把外部通信或共享状态交给 ../services/mcp/client.js 处理。
import { callIdeRpc } from '../services/mcp/client.js';
// 类型依赖 { ConnectedMCPServer, MCPServerConnection } 来自 ../services/mcp/types.js，用于校准React hook 状态流的数据契约。
import type { ConnectedMCPServer, MCPServerConnection } from '../services/mcp/types.js';
// 类型依赖 { PermissionMode } 来自 ../types/permissions.js，用于校准React hook 状态流的数据契约。
import type { PermissionMode } from '../types/permissions.js';
// 复用 CLAUDE_IN_CHROME_MCP_SERVER_NAME、isTrackedClaudeInChromeTabId 工具函数，把通用处理留在 ../utils/claudeInChrome/common.js 中维护。
import { CLAUDE_IN_CHROME_MCP_SERVER_NAME, isTrackedClaudeInChromeTabId } from '../utils/claudeInChrome/common.js';
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js';
// 复用 enqueuePendingNotification 工具函数，把通用处理留在 ../utils/messageQueueManager.js 中维护。
import { enqueuePendingNotification } from '../utils/messageQueueManager.js';

// Schema for the prompt notification from Chrome extension (JSON-RPC 2.0 format)
// ClaudeInChromePromptNotificationSchema保存`lazySchema`，供React hook后续处理使用。
const ClaudeInChromePromptNotificationSchema = lazySchema(() => z.object({
  method: z.literal('notifications/message'),
  params: z.object({
    prompt: z.string(),
    image: z.object({
      type: z.literal('base64'),
      media_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
      data: z.string()
    }).optional(),
    tabId: z.number().optional()
  })
}));

/**
 * A hook that listens for prompt notifications from the Claude for Chrome extension,
 * enqueues them as user prompts, and syncs permission mode changes to the extension.
 */
// usePromptsFromClaudeInChrome 封装usePromptsFromClaudeInChrome的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePromptsFromClaudeInChrome(mcpClients, toolPermissionMode) {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(6);
  // 调用 useRef，触发React hook此处需要的副作用。
  useRef(undefined);
  // t0 暂存 `[mcpClients]` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== mcpClients) {
    // t0 暂存 `[mcpClients]` 生成的渲染片段，后续返回路径直接复用。
    t0 = [mcpClients];
    // $[0] 缓存 `mcpClients`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = mcpClients;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(_temp, t0);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== mcpClients || $[3] !== toolPermissionMode) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // chromeClient筛选`findChromeClient`，供React hook后续处理使用。
      const chromeClient = findChromeClient(mcpClients);
      // chromeClient缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!chromeClient) {
        // React hook use Prompts From Claude ...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // chromeMode标记React hook use Prompt...是否启用对应路径。
      const chromeMode = toolPermissionMode === "bypassPermissions" ? "skip_all_permission_checks" : "ask";
      // 调用 callIdeRpc，触发React hook此处需要的副作用。
      callIdeRpc("set_permission_mode", {
        mode: chromeMode
      }, chromeClient);
    };
    // t2 暂存 `[mcpClients, toolPermissionMode]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [mcpClients, toolPermissionMode];
    // $[2] 缓存 `mcpClients`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = mcpClients;
    // $[3] 缓存 `toolPermissionMode`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = toolPermissionMode;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t1, t2);
}
// _temp 封装usePromptsFromClaudeInChrome的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {}
// findChromeClient 封装usePromptsFromClaudeInChrome的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findChromeClient(clients: MCPServerConnection[]): ConnectedMCPServer | undefined {
  // 返回 `clients.find((client): client is ConnectedMCPServer => client.type === ...`，作为React hook 状态流这次计算的结果。
  return clients.find((client): client is ConnectedMCPServer => client.type === 'connected' && client.name === CLAUDE_IN_CHROME_MCP_SERVER_NAME);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJDb250ZW50QmxvY2tQYXJhbSIsInVzZUVmZmVjdCIsInVzZVJlZiIsImxvZ0Vycm9yIiwieiIsImNhbGxJZGVScGMiLCJDb25uZWN0ZWRNQ1BTZXJ2ZXIiLCJNQ1BTZXJ2ZXJDb25uZWN0aW9uIiwiUGVybWlzc2lvbk1vZGUiLCJDTEFVREVfSU5fQ0hST01FX01DUF9TRVJWRVJfTkFNRSIsImlzVHJhY2tlZENsYXVkZUluQ2hyb21lVGFiSWQiLCJsYXp5U2NoZW1hIiwiZW5xdWV1ZVBlbmRpbmdOb3RpZmljYXRpb24iLCJDbGF1ZGVJbkNocm9tZVByb21wdE5vdGlmaWNhdGlvblNjaGVtYSIsIm9iamVjdCIsIm1ldGhvZCIsImxpdGVyYWwiLCJwYXJhbXMiLCJwcm9tcHQiLCJzdHJpbmciLCJpbWFnZSIsInR5cGUiLCJtZWRpYV90eXBlIiwiZW51bSIsImRhdGEiLCJvcHRpb25hbCIsInRhYklkIiwibnVtYmVyIiwidXNlUHJvbXB0c0Zyb21DbGF1ZGVJbkNocm9tZSIsIm1jcENsaWVudHMiLCJ0b29sUGVybWlzc2lvbk1vZGUiLCIkIiwiX2MiLCJ1bmRlZmluZWQiLCJ0MCIsIl90ZW1wIiwidDEiLCJ0MiIsImNocm9tZUNsaWVudCIsImZpbmRDaHJvbWVDbGllbnQiLCJjaHJvbWVNb2RlIiwibW9kZSIsImNsaWVudHMiLCJmaW5kIiwiY2xpZW50IiwibmFtZSJdLCJzb3VyY2VzIjpbInVzZVByb21wdHNGcm9tQ2xhdWRlSW5DaHJvbWUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgQ29udGVudEJsb2NrUGFyYW0gfSBmcm9tICdAYW50aHJvcGljLWFpL3Nkay9yZXNvdXJjZXMvbWVzc2FnZXMubWpzJ1xuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGxvZ0Vycm9yIH0gZnJvbSAnc3JjL3V0aWxzL2xvZy5qcydcbmltcG9ydCB7IHogfSBmcm9tICd6b2QvdjQnXG5pbXBvcnQgeyBjYWxsSWRlUnBjIH0gZnJvbSAnLi4vc2VydmljZXMvbWNwL2NsaWVudC5qcydcbmltcG9ydCB0eXBlIHtcbiAgQ29ubmVjdGVkTUNQU2VydmVyLFxuICBNQ1BTZXJ2ZXJDb25uZWN0aW9uLFxufSBmcm9tICcuLi9zZXJ2aWNlcy9tY3AvdHlwZXMuanMnXG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25Nb2RlIH0gZnJvbSAnLi4vdHlwZXMvcGVybWlzc2lvbnMuanMnXG5pbXBvcnQge1xuICBDTEFVREVfSU5fQ0hST01FX01DUF9TRVJWRVJfTkFNRSxcbiAgaXNUcmFja2VkQ2xhdWRlSW5DaHJvbWVUYWJJZCxcbn0gZnJvbSAnLi4vdXRpbHMvY2xhdWRlSW5DaHJvbWUvY29tbW9uLmpzJ1xuaW1wb3J0IHsgbGF6eVNjaGVtYSB9IGZyb20gJy4uL3V0aWxzL2xhenlTY2hlbWEuanMnXG5pbXBvcnQgeyBlbnF1ZXVlUGVuZGluZ05vdGlmaWNhdGlvbiB9IGZyb20gJy4uL3V0aWxzL21lc3NhZ2VRdWV1ZU1hbmFnZXIuanMnXG5cbi8vIFNjaGVtYSBmb3IgdGhlIHByb21wdCBub3RpZmljYXRpb24gZnJvbSBDaHJvbWUgZXh0ZW5zaW9uIChKU09OLVJQQyAyLjAgZm9ybWF0KVxuY29uc3QgQ2xhdWRlSW5DaHJvbWVQcm9tcHROb3RpZmljYXRpb25TY2hlbWEgPSBsYXp5U2NoZW1hKCgpID0+XG4gIHoub2JqZWN0KHtcbiAgICBtZXRob2Q6IHoubGl0ZXJhbCgnbm90aWZpY2F0aW9ucy9tZXNzYWdlJyksXG4gICAgcGFyYW1zOiB6Lm9iamVjdCh7XG4gICAgICBwcm9tcHQ6IHouc3RyaW5nKCksXG4gICAgICBpbWFnZTogelxuICAgICAgICAub2JqZWN0KHtcbiAgICAgICAgICB0eXBlOiB6LmxpdGVyYWwoJ2Jhc2U2NCcpLFxuICAgICAgICAgIG1lZGlhX3R5cGU6IHouZW51bShbXG4gICAgICAgICAgICAnaW1hZ2UvanBlZycsXG4gICAgICAgICAgICAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgICdpbWFnZS9naWYnLFxuICAgICAgICAgICAgJ2ltYWdlL3dlYnAnLFxuICAgICAgICAgIF0pLFxuICAgICAgICAgIGRhdGE6IHouc3RyaW5nKCksXG4gICAgICAgIH0pXG4gICAgICAgIC5vcHRpb25hbCgpLFxuICAgICAgdGFiSWQ6IHoubnVtYmVyKCkub3B0aW9uYWwoKSxcbiAgICB9KSxcbiAgfSksXG4pXG5cbi8qKlxuICogQSBob29rIHRoYXQgbGlzdGVucyBmb3IgcHJvbXB0IG5vdGlmaWNhdGlvbnMgZnJvbSB0aGUgQ2xhdWRlIGZvciBDaHJvbWUgZXh0ZW5zaW9uLFxuICogZW5xdWV1ZXMgdGhlbSBhcyB1c2VyIHByb21wdHMsIGFuZCBzeW5jcyBwZXJtaXNzaW9uIG1vZGUgY2hhbmdlcyB0byB0aGUgZXh0ZW5zaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlUHJvbXB0c0Zyb21DbGF1ZGVJbkNocm9tZShcbiAgbWNwQ2xpZW50czogTUNQU2VydmVyQ29ubmVjdGlvbltdLFxuICB0b29sUGVybWlzc2lvbk1vZGU6IFBlcm1pc3Npb25Nb2RlLFxuKTogdm9pZCB7XG4gIGNvbnN0IG1jcENsaWVudFJlZiA9IHVzZVJlZjxDb25uZWN0ZWRNQ1BTZXJ2ZXIgfCB1bmRlZmluZWQ+KHVuZGVmaW5lZClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChcImV4dGVybmFsXCIgIT09ICdhbnQnKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBtY3BDbGllbnQgPSBmaW5kQ2hyb21lQ2xpZW50KG1jcENsaWVudHMpXG4gICAgaWYgKG1jcENsaWVudFJlZi5jdXJyZW50ICE9PSBtY3BDbGllbnQpIHtcbiAgICAgIG1jcENsaWVudFJlZi5jdXJyZW50ID0gbWNwQ2xpZW50XG4gICAgfVxuXG4gICAgaWYgKG1jcENsaWVudCkge1xuICAgICAgbWNwQ2xpZW50LmNsaWVudC5zZXROb3RpZmljYXRpb25IYW5kbGVyKFxuICAgICAgICBDbGF1ZGVJbkNocm9tZVByb21wdE5vdGlmaWNhdGlvblNjaGVtYSgpLFxuICAgICAgICBub3RpZmljYXRpb24gPT4ge1xuICAgICAgICAgIGlmIChtY3BDbGllbnRSZWYuY3VycmVudCAhPT0gbWNwQ2xpZW50KSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgeyB0YWJJZCwgcHJvbXB0LCBpbWFnZSB9ID0gbm90aWZpY2F0aW9uLnBhcmFtc1xuXG4gICAgICAgICAgLy8gUHJvY2VzcyBub3RpZmljYXRpb25zIGZyb20gdGFicyB3ZSdyZSB0cmFja2luZyBzaW5jZSBub3RpZmljYXRpb25zIGFyZSBicm9hZGNhc3RlZFxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiB0YWJJZCAhPT0gJ251bWJlcicgfHxcbiAgICAgICAgICAgICFpc1RyYWNrZWRDbGF1ZGVJbkNocm9tZVRhYklkKHRhYklkKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEJ1aWxkIGNvbnRlbnQgYmxvY2tzIGlmIHRoZXJlJ3MgYW4gaW1hZ2UsIG90aGVyd2lzZSBqdXN0IHVzZSB0aGUgcHJvbXB0IHN0cmluZ1xuICAgICAgICAgICAgaWYgKGltYWdlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRCbG9ja3M6IENvbnRlbnRCbG9ja1BhcmFtW10gPSBbXG4gICAgICAgICAgICAgICAgeyB0eXBlOiAndGV4dCcsIHRleHQ6IHByb21wdCB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZScsXG4gICAgICAgICAgICAgICAgICBzb3VyY2U6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogaW1hZ2UudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgbWVkaWFfdHlwZTogaW1hZ2UubWVkaWFfdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW1hZ2UuZGF0YSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBlbnF1ZXVlUGVuZGluZ05vdGlmaWNhdGlvbih7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGNvbnRlbnRCbG9ja3MsXG4gICAgICAgICAgICAgICAgbW9kZTogJ3Byb21wdCcsXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlbnF1ZXVlUGVuZGluZ05vdGlmaWNhdGlvbih7IHZhbHVlOiBwcm9tcHQsIG1vZGU6ICdwcm9tcHQnIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGxvZ0Vycm9yKGVycm9yIGFzIEVycm9yKVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIClcbiAgICB9XG4gIH0sIFttY3BDbGllbnRzXSlcblxuICAvLyBTeW5jIHBlcm1pc3Npb24gbW9kZSB3aXRoIENocm9tZSBleHRlbnNpb24gd2hlbmV2ZXIgaXQgY2hhbmdlc1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGNocm9tZUNsaWVudCA9IGZpbmRDaHJvbWVDbGllbnQobWNwQ2xpZW50cylcbiAgICBpZiAoIWNocm9tZUNsaWVudCkgcmV0dXJuXG5cbiAgICBjb25zdCBjaHJvbWVNb2RlID1cbiAgICAgIHRvb2xQZXJtaXNzaW9uTW9kZSA9PT0gJ2J5cGFzc1Blcm1pc3Npb25zJ1xuICAgICAgICA/ICdza2lwX2FsbF9wZXJtaXNzaW9uX2NoZWNrcydcbiAgICAgICAgOiAnYXNrJ1xuXG4gICAgdm9pZCBjYWxsSWRlUnBjKCdzZXRfcGVybWlzc2lvbl9tb2RlJywgeyBtb2RlOiBjaHJvbWVNb2RlIH0sIGNocm9tZUNsaWVudClcbiAgfSwgW21jcENsaWVudHMsIHRvb2xQZXJtaXNzaW9uTW9kZV0pXG59XG5cbmZ1bmN0aW9uIGZpbmRDaHJvbWVDbGllbnQoXG4gIGNsaWVudHM6IE1DUFNlcnZlckNvbm5lY3Rpb25bXSxcbik6IENvbm5lY3RlZE1DUFNlcnZlciB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBjbGllbnRzLmZpbmQoXG4gICAgKGNsaWVudCk6IGNsaWVudCBpcyBDb25uZWN0ZWRNQ1BTZXJ2ZXIgPT5cbiAgICAgIGNsaWVudC50eXBlID09PSAnY29ubmVjdGVkJyAmJlxuICAgICAgY2xpZW50Lm5hbWUgPT09IENMQVVERV9JTl9DSFJPTUVfTUNQX1NFUlZFUl9OQU1FLFxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUFjQSxpQkFBaUIsUUFBUSwwQ0FBMEM7QUFDakYsU0FBU0MsU0FBUyxFQUFFQyxNQUFNLFFBQVEsT0FBTztBQUN6QyxTQUFTQyxRQUFRLFFBQVEsa0JBQWtCO0FBQzNDLFNBQVNDLENBQUMsUUFBUSxRQUFRO0FBQzFCLFNBQVNDLFVBQVUsUUFBUSwyQkFBMkI7QUFDdEQsY0FDRUMsa0JBQWtCLEVBQ2xCQyxtQkFBbUIsUUFDZCwwQkFBMEI7QUFDakMsY0FBY0MsY0FBYyxRQUFRLHlCQUF5QjtBQUM3RCxTQUNFQyxnQ0FBZ0MsRUFDaENDLDRCQUE0QixRQUN2QixtQ0FBbUM7QUFDMUMsU0FBU0MsVUFBVSxRQUFRLHdCQUF3QjtBQUNuRCxTQUFTQywwQkFBMEIsUUFBUSxpQ0FBaUM7O0FBRTVFO0FBQ0EsTUFBTUMsc0NBQXNDLEdBQUdGLFVBQVUsQ0FBQyxNQUN4RFAsQ0FBQyxDQUFDVSxNQUFNLENBQUM7RUFDUEMsTUFBTSxFQUFFWCxDQUFDLENBQUNZLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQztFQUMxQ0MsTUFBTSxFQUFFYixDQUFDLENBQUNVLE1BQU0sQ0FBQztJQUNmSSxNQUFNLEVBQUVkLENBQUMsQ0FBQ2UsTUFBTSxDQUFDLENBQUM7SUFDbEJDLEtBQUssRUFBRWhCLENBQUMsQ0FDTFUsTUFBTSxDQUFDO01BQ05PLElBQUksRUFBRWpCLENBQUMsQ0FBQ1ksT0FBTyxDQUFDLFFBQVEsQ0FBQztNQUN6Qk0sVUFBVSxFQUFFbEIsQ0FBQyxDQUFDbUIsSUFBSSxDQUFDLENBQ2pCLFlBQVksRUFDWixXQUFXLEVBQ1gsV0FBVyxFQUNYLFlBQVksQ0FDYixDQUFDO01BQ0ZDLElBQUksRUFBRXBCLENBQUMsQ0FBQ2UsTUFBTSxDQUFDO0lBQ2pCLENBQUMsQ0FBQyxDQUNETSxRQUFRLENBQUMsQ0FBQztJQUNiQyxLQUFLLEVBQUV0QixDQUFDLENBQUN1QixNQUFNLENBQUMsQ0FBQyxDQUFDRixRQUFRLENBQUM7RUFDN0IsQ0FBQztBQUNILENBQUMsQ0FDSCxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBRyw2QkFBQUMsVUFBQSxFQUFBQyxrQkFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUlnQjlCLE1BQU0sQ0FBaUMrQixTQUFTLENBQUM7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBRixVQUFBO0lBd0RuRUssRUFBQSxJQUFDTCxVQUFVLENBQUM7SUFBQUUsQ0FBQSxNQUFBRixVQUFBO0lBQUFFLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBdERmOUIsU0FBUyxDQUFDa0MsS0FzRFQsRUFBRUQsRUFBWSxDQUFDO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBTixDQUFBLFFBQUFGLFVBQUEsSUFBQUUsQ0FBQSxRQUFBRCxrQkFBQTtJQUdOTSxFQUFBLEdBQUFBLENBQUE7TUFDUixNQUFBRSxZQUFBLEdBQXFCQyxnQkFBZ0IsQ0FBQ1YsVUFBVSxDQUFDO01BQ2pELElBQUksQ0FBQ1MsWUFBWTtRQUFBO01BQUE7TUFFakIsTUFBQUUsVUFBQSxHQUNFVixrQkFBa0IsS0FBSyxtQkFFZCxHQUZULDRCQUVTLEdBRlQsS0FFUztNQUVOekIsVUFBVSxDQUFDLHFCQUFxQixFQUFFO1FBQUFvQyxJQUFBLEVBQVFEO01BQVcsQ0FBQyxFQUFFRixZQUFZLENBQUM7SUFBQSxDQUMzRTtJQUFFRCxFQUFBLElBQUNSLFVBQVUsRUFBRUMsa0JBQWtCLENBQUM7SUFBQUMsQ0FBQSxNQUFBRixVQUFBO0lBQUFFLENBQUEsTUFBQUQsa0JBQUE7SUFBQUMsQ0FBQSxNQUFBSyxFQUFBO0lBQUFMLENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFELEVBQUEsR0FBQUwsQ0FBQTtJQUFBTSxFQUFBLEdBQUFOLENBQUE7RUFBQTtFQVZuQzlCLFNBQVMsQ0FBQ21DLEVBVVQsRUFBRUMsRUFBZ0MsQ0FBQztBQUFBO0FBekUvQixTQUFBRixNQUFBO0FBNEVQLFNBQVNJLGdCQUFnQkEsQ0FDdkJHLE9BQU8sRUFBRW5DLG1CQUFtQixFQUFFLENBQy9CLEVBQUVELGtCQUFrQixHQUFHLFNBQVMsQ0FBQztFQUNoQyxPQUFPb0MsT0FBTyxDQUFDQyxJQUFJLENBQ2pCLENBQUNDLE1BQU0sQ0FBQyxFQUFFQSxNQUFNLElBQUl0QyxrQkFBa0IsSUFDcENzQyxNQUFNLENBQUN2QixJQUFJLEtBQUssV0FBVyxJQUMzQnVCLE1BQU0sQ0FBQ0MsSUFBSSxLQUFLcEMsZ0NBQ3BCLENBQUM7QUFDSCIsImlnbm9yZUxpc3QiOltdfQ==