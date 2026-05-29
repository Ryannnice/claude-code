// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react';
// 引入 useNotifications，将 src/context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from 'src/context/notifications.js';
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 接入 hasClaudeAiMcpEverConnected 服务层能力，把外部通信或共享状态交给 ../../services/mcp/claudeai.js 处理。
import { hasClaudeAiMcpEverConnected } from '../../services/mcp/claudeai.js';
// 类型依赖 { MCPServerConnection } 来自 ../../services/mcp/types.js，用于校准React hook 状态流的数据契约。
import type { MCPServerConnection } from '../../services/mcp/types.js';
// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  mcpClients?: MCPServerConnection[];
};
// EMPTY_MCP_CLIENTS 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
const EMPTY_MCP_CLIENTS: MCPServerConnection[] = [];
// useMcpConnectivityStatus 封装useMcpConnectivityStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMcpConnectivityStatus(t0) {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    mcpClients: t1
  } = t0;
  // mcpClients 集合标记React hook use Mcp Co...是否启用对应路径。
  const mcpClients = t1 === undefined ? EMPTY_MCP_CLIENTS : t1;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification
  } = useNotifications();
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== addNotification || $[1] !== mcpClients) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Mcp Connectivity Sta...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // failedLocalClients 集合筛选`mcpClients.filter`，供React hook后续处理使用。
      const failedLocalClients = mcpClients.filter(_temp);
      // failedClaudeAiClients 集合筛选`mcpClients.filter`，供React hook后续处理使用。
      const failedClaudeAiClients = mcpClients.filter(_temp2);
      // needsAuthLocalServers 集合记录 `mcpClients.filter` 是否成立，React hook随后按该结果分支。
      const needsAuthLocalServers = mcpClients.filter(_temp3);
      // needsAuthClaudeAiServers 集合记录 `mcpClients.filter` 是否成立，React hook随后按该结果分支。
      const needsAuthClaudeAiServers = mcpClients.filter(_temp4);
      // 组合条件 `failedLocalClients.length === 0 && failedClaudeAi` 成立时，React hook 状态流才启用这条专门路径。
      if (failedLocalClients.length === 0 && failedClaudeAiClients.length === 0 && needsAuthLocalServers.length === 0 && needsAuthClaudeAiServers.length === 0) {
        // React hook use Mcp Connectivity Sta...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `failedLocalClients.length > 0` 时，React hook执行该分支。
      if (failedLocalClients.length > 0) {
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: "mcp-failed",
          jsx: <><Text color="error">{failedLocalClients.length} MCP{" "}{failedLocalClients.length === 1 ? "server" : "servers"} failed</Text><Text dimColor={true}> · /mcp</Text></>,
          priority: "medium"
        });
      }
      // 满足 `failedClaudeAiClients.length > 0` 时，React hook执行该分支。
      if (failedClaudeAiClients.length > 0) {
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: "mcp-claudeai-failed",
          jsx: <><Text color="error">{failedClaudeAiClients.length} claude.ai{" "}{failedClaudeAiClients.length === 1 ? "connector" : "connectors"}{" "}unavailable</Text><Text dimColor={true}> · /mcp</Text></>,
          priority: "medium"
        });
      }
      // 满足 `needsAuthLocalServers.length > 0` 时，React hook执行该分支。
      if (needsAuthLocalServers.length > 0) {
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: "mcp-needs-auth",
          jsx: <><Text color="warning">{needsAuthLocalServers.length} MCP{" "}{needsAuthLocalServers.length === 1 ? "server needs" : "servers need"}{" "}auth</Text><Text dimColor={true}> · /mcp</Text></>,
          priority: "medium"
        });
      }
      // 满足 `needsAuthClaudeAiServers.length > 0` 时，React hook执行该分支。
      if (needsAuthClaudeAiServers.length > 0) {
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: "mcp-claudeai-needs-auth",
          jsx: <><Text color="warning">{needsAuthClaudeAiServers.length} claude.ai{" "}{needsAuthClaudeAiServers.length === 1 ? "connector needs" : "connectors need"}{" "}auth</Text><Text dimColor={true}> · /mcp</Text></>,
          priority: "medium"
        });
      }
    };
    // t3 暂存 `[addNotification, mcpClients]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [addNotification, mcpClients];
    // $[0] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = addNotification;
    // $[1] 缓存 `mcpClients`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = mcpClients;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t2, t3);
}
// _temp4 封装useMcpConnectivityStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(client_2) {
  // 返回 `client_2.type === "needs-auth" && client_2.config.type === "claudeai-pr...`，作为React hook 状态流这次计算的结果。
  return client_2.type === "needs-auth" && client_2.config.type === "claudeai-proxy" && hasClaudeAiMcpEverConnected(client_2.name);
}
// _temp3 封装useMcpConnectivityStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(client_1) {
  // 返回 `client_1.type === "needs-auth" && client_1.config.type !== "claudeai-pr...`，作为React hook 状态流这次计算的结果。
  return client_1.type === "needs-auth" && client_1.config.type !== "claudeai-proxy";
}
// _temp2 封装useMcpConnectivityStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(client_0) {
  // 返回 `client_0.type === "failed" && client_0.config.type === "claudeai-proxy"...`，作为React hook 状态流这次计算的结果。
  return client_0.type === "failed" && client_0.config.type === "claudeai-proxy" && hasClaudeAiMcpEverConnected(client_0.name);
}
// _temp 封装useMcpConnectivityStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(client) {
  // 返回 `client.type === "failed" && client.config.type !== "sse-ide" && client....`，作为React hook 状态流这次计算的结果。
  return client.type === "failed" && client.config.type !== "sse-ide" && client.config.type !== "ws-ide" && client.config.type !== "claudeai-proxy";
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZU5vdGlmaWNhdGlvbnMiLCJnZXRJc1JlbW90ZU1vZGUiLCJUZXh0IiwiaGFzQ2xhdWRlQWlNY3BFdmVyQ29ubmVjdGVkIiwiTUNQU2VydmVyQ29ubmVjdGlvbiIsIlByb3BzIiwibWNwQ2xpZW50cyIsIkVNUFRZX01DUF9DTElFTlRTIiwidXNlTWNwQ29ubmVjdGl2aXR5U3RhdHVzIiwidDAiLCIkIiwiX2MiLCJ0MSIsInVuZGVmaW5lZCIsImFkZE5vdGlmaWNhdGlvbiIsInQyIiwidDMiLCJmYWlsZWRMb2NhbENsaWVudHMiLCJmaWx0ZXIiLCJfdGVtcCIsImZhaWxlZENsYXVkZUFpQ2xpZW50cyIsIl90ZW1wMiIsIm5lZWRzQXV0aExvY2FsU2VydmVycyIsIl90ZW1wMyIsIm5lZWRzQXV0aENsYXVkZUFpU2VydmVycyIsIl90ZW1wNCIsImxlbmd0aCIsImtleSIsImpzeCIsInByaW9yaXR5IiwiY2xpZW50XzIiLCJjbGllbnQiLCJ0eXBlIiwiY29uZmlnIiwibmFtZSIsImNsaWVudF8xIiwiY2xpZW50XzAiXSwic291cmNlcyI6WyJ1c2VNY3BDb25uZWN0aXZpdHlTdGF0dXMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VOb3RpZmljYXRpb25zIH0gZnJvbSAnc3JjL2NvbnRleHQvbm90aWZpY2F0aW9ucy5qcydcbmltcG9ydCB7IGdldElzUmVtb3RlTW9kZSB9IGZyb20gJy4uLy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBoYXNDbGF1ZGVBaU1jcEV2ZXJDb25uZWN0ZWQgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tY3AvY2xhdWRlYWkuanMnXG5pbXBvcnQgdHlwZSB7IE1DUFNlcnZlckNvbm5lY3Rpb24gfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tY3AvdHlwZXMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG1jcENsaWVudHM/OiBNQ1BTZXJ2ZXJDb25uZWN0aW9uW11cbn1cblxuY29uc3QgRU1QVFlfTUNQX0NMSUVOVFM6IE1DUFNlcnZlckNvbm5lY3Rpb25bXSA9IFtdXG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VNY3BDb25uZWN0aXZpdHlTdGF0dXMoe1xuICBtY3BDbGllbnRzID0gRU1QVFlfTUNQX0NMSUVOVFMsXG59OiBQcm9wcyk6IHZvaWQge1xuICBjb25zdCB7IGFkZE5vdGlmaWNhdGlvbiB9ID0gdXNlTm90aWZpY2F0aW9ucygpXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGdldElzUmVtb3RlTW9kZSgpKSByZXR1cm5cbiAgICBjb25zdCBmYWlsZWRMb2NhbENsaWVudHMgPSBtY3BDbGllbnRzLmZpbHRlcihcbiAgICAgIGNsaWVudCA9PlxuICAgICAgICBjbGllbnQudHlwZSA9PT0gJ2ZhaWxlZCcgJiZcbiAgICAgICAgY2xpZW50LmNvbmZpZy50eXBlICE9PSAnc3NlLWlkZScgJiZcbiAgICAgICAgY2xpZW50LmNvbmZpZy50eXBlICE9PSAnd3MtaWRlJyAmJlxuICAgICAgICBjbGllbnQuY29uZmlnLnR5cGUgIT09ICdjbGF1ZGVhaS1wcm94eScsXG4gICAgKVxuICAgIC8vIGNsYXVkZS5haSBmYWlsdXJlcyBnZXQgYSBzZXBhcmF0ZSBub3RpZmljYXRpb246IHRoZXkgYWxtb3N0IGFsd2F5cyBpbmRpY2F0ZVxuICAgIC8vIGEgdG9vbGJveC1zZXJ2aWNlIG91dGFnZSAoc2hhcmVkIGF1dGggYmFja2VuZCksIG5vdCBhIGxvY2FsIGNvbmZpZyBpc3N1ZS5cbiAgICAvLyBPbmx5IGZsYWcgY29ubmVjdG9ycyB0aGF0IGhhdmUgcHJldmlvdXNseSBjb25uZWN0ZWQgc3VjY2Vzc2Z1bGx5IOKAlCBhblxuICAgIC8vIG9yZy1jb25maWd1cmVkIGNvbm5lY3RvciB0aGF0J3MgYmVlbiBuZWVkcy1hdXRoIHNpbmNlIGl0IGFwcGVhcmVkIGlzIG9uZVxuICAgIC8vIHRoZSB1c2VyIGhhcyBpZ25vcmVkIGFuZCBzaG91bGRuJ3QgbmFnIGFib3V0OyBvbmUgdGhhdCB3YXMgd29ya2luZ1xuICAgIC8vIHllc3RlcmRheSBhbmQgaXMgbm93IGZhaWxlZCBpcyBhIHN0YXRlIGNoYW5nZSB3b3J0aCBzdXJmYWNpbmcuXG4gICAgY29uc3QgZmFpbGVkQ2xhdWRlQWlDbGllbnRzID0gbWNwQ2xpZW50cy5maWx0ZXIoXG4gICAgICBjbGllbnQgPT5cbiAgICAgICAgY2xpZW50LnR5cGUgPT09ICdmYWlsZWQnICYmXG4gICAgICAgIGNsaWVudC5jb25maWcudHlwZSA9PT0gJ2NsYXVkZWFpLXByb3h5JyAmJlxuICAgICAgICBoYXNDbGF1ZGVBaU1jcEV2ZXJDb25uZWN0ZWQoY2xpZW50Lm5hbWUpLFxuICAgIClcbiAgICBjb25zdCBuZWVkc0F1dGhMb2NhbFNlcnZlcnMgPSBtY3BDbGllbnRzLmZpbHRlcihcbiAgICAgIGNsaWVudCA9PlxuICAgICAgICBjbGllbnQudHlwZSA9PT0gJ25lZWRzLWF1dGgnICYmIGNsaWVudC5jb25maWcudHlwZSAhPT0gJ2NsYXVkZWFpLXByb3h5JyxcbiAgICApXG4gICAgY29uc3QgbmVlZHNBdXRoQ2xhdWRlQWlTZXJ2ZXJzID0gbWNwQ2xpZW50cy5maWx0ZXIoXG4gICAgICBjbGllbnQgPT5cbiAgICAgICAgY2xpZW50LnR5cGUgPT09ICduZWVkcy1hdXRoJyAmJlxuICAgICAgICBjbGllbnQuY29uZmlnLnR5cGUgPT09ICdjbGF1ZGVhaS1wcm94eScgJiZcbiAgICAgICAgaGFzQ2xhdWRlQWlNY3BFdmVyQ29ubmVjdGVkKGNsaWVudC5uYW1lKSxcbiAgICApXG4gICAgaWYgKFxuICAgICAgZmFpbGVkTG9jYWxDbGllbnRzLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgZmFpbGVkQ2xhdWRlQWlDbGllbnRzLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgbmVlZHNBdXRoTG9jYWxTZXJ2ZXJzLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgbmVlZHNBdXRoQ2xhdWRlQWlTZXJ2ZXJzLmxlbmd0aCA9PT0gMFxuICAgICkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChmYWlsZWRMb2NhbENsaWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgYWRkTm90aWZpY2F0aW9uKHtcbiAgICAgICAga2V5OiAnbWNwLWZhaWxlZCcsXG4gICAgICAgIGpzeDogKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAgICAgIHtmYWlsZWRMb2NhbENsaWVudHMubGVuZ3RofSBNQ1B7JyAnfVxuICAgICAgICAgICAgICB7ZmFpbGVkTG9jYWxDbGllbnRzLmxlbmd0aCA9PT0gMSA/ICdzZXJ2ZXInIDogJ3NlcnZlcnMnfSBmYWlsZWRcbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiDCtyAvbWNwPC9UZXh0PlxuICAgICAgICAgIDwvPlxuICAgICAgICApLFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICB9KVxuICAgIH1cbiAgICBpZiAoZmFpbGVkQ2xhdWRlQWlDbGllbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIGtleTogJ21jcC1jbGF1ZGVhaS1mYWlsZWQnLFxuICAgICAgICBqc3g6IChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPlxuICAgICAgICAgICAgICB7ZmFpbGVkQ2xhdWRlQWlDbGllbnRzLmxlbmd0aH0gY2xhdWRlLmFpeycgJ31cbiAgICAgICAgICAgICAge2ZhaWxlZENsYXVkZUFpQ2xpZW50cy5sZW5ndGggPT09IDEgPyAnY29ubmVjdG9yJyA6ICdjb25uZWN0b3JzJ317JyAnfVxuICAgICAgICAgICAgICB1bmF2YWlsYWJsZVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+IMK3IC9tY3A8L1RleHQ+XG4gICAgICAgICAgPC8+XG4gICAgICAgICksXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgIH0pXG4gICAgfVxuICAgIGlmIChuZWVkc0F1dGhMb2NhbFNlcnZlcnMubGVuZ3RoID4gMCkge1xuICAgICAgYWRkTm90aWZpY2F0aW9uKHtcbiAgICAgICAga2V5OiAnbWNwLW5lZWRzLWF1dGgnLFxuICAgICAgICBqc3g6IChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJ3YXJuaW5nXCI+XG4gICAgICAgICAgICAgIHtuZWVkc0F1dGhMb2NhbFNlcnZlcnMubGVuZ3RofSBNQ1B7JyAnfVxuICAgICAgICAgICAgICB7bmVlZHNBdXRoTG9jYWxTZXJ2ZXJzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgICAgID8gJ3NlcnZlciBuZWVkcydcbiAgICAgICAgICAgICAgICA6ICdzZXJ2ZXJzIG5lZWQnfXsnICd9XG4gICAgICAgICAgICAgIGF1dGhcbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiDCtyAvbWNwPC9UZXh0PlxuICAgICAgICAgIDwvPlxuICAgICAgICApLFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICB9KVxuICAgIH1cbiAgICBpZiAobmVlZHNBdXRoQ2xhdWRlQWlTZXJ2ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIGtleTogJ21jcC1jbGF1ZGVhaS1uZWVkcy1hdXRoJyxcbiAgICAgICAganN4OiAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICB7bmVlZHNBdXRoQ2xhdWRlQWlTZXJ2ZXJzLmxlbmd0aH0gY2xhdWRlLmFpeycgJ31cbiAgICAgICAgICAgICAge25lZWRzQXV0aENsYXVkZUFpU2VydmVycy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgICAgICA/ICdjb25uZWN0b3IgbmVlZHMnXG4gICAgICAgICAgICAgICAgOiAnY29ubmVjdG9ycyBuZWVkJ317JyAnfVxuICAgICAgICAgICAgICBhdXRoXG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gwrcgL21jcDwvVGV4dD5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgfSlcbiAgICB9XG4gIH0sIFthZGROb3RpZmljYXRpb24sIG1jcENsaWVudHNdKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxTQUFTLFFBQVEsT0FBTztBQUNqQyxTQUFTQyxnQkFBZ0IsUUFBUSw4QkFBOEI7QUFDL0QsU0FBU0MsZUFBZSxRQUFRLDBCQUEwQjtBQUMxRCxTQUFTQyxJQUFJLFFBQVEsY0FBYztBQUNuQyxTQUFTQywyQkFBMkIsUUFBUSxnQ0FBZ0M7QUFDNUUsY0FBY0MsbUJBQW1CLFFBQVEsNkJBQTZCO0FBRXRFLEtBQUtDLEtBQUssR0FBRztFQUNYQyxVQUFVLENBQUMsRUFBRUYsbUJBQW1CLEVBQUU7QUFDcEMsQ0FBQztBQUVELE1BQU1HLGlCQUFpQixFQUFFSCxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7QUFFbkQsT0FBTyxTQUFBSSx5QkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFrQztJQUFBTCxVQUFBLEVBQUFNO0VBQUEsSUFBQUgsRUFFakM7RUFETixNQUFBSCxVQUFBLEdBQUFNLEVBQThCLEtBQTlCQyxTQUE4QixHQUE5Qk4saUJBQThCLEdBQTlCSyxFQUE4QjtFQUU5QjtJQUFBRTtFQUFBLElBQTRCZCxnQkFBZ0IsQ0FBQyxDQUFDO0VBQUEsSUFBQWUsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBTixDQUFBLFFB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QixDQUFBRSxNQUFPLEtBQUssQ0FFaEIsR0FGcEIsaUJBRW9CLEdBRnBCLGlCQUVtQixDQUFHLElBQUUsQ0FBRSxJQUU3QixFQU5DLElBQUksQ0FPTCxDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsT0FBTyxFQUFyQixJQUFJLENBQXdCLEdBQzVCO1VBQUFHLFFBQUEsRUFFSztRQUNaLENBQUMsQ0FBQztNQUFBO0lBQ0gsQ0FDRjtJQUFFYixFQUFBLElBQUNGLGVBQWUsRUFBRVIsVUFBVSxDQUFDO0lBQUFJLENBQUEsTUFBQUksZUFBQTtJQUFBSixDQUFBLE1BQUFKLFVBQUE7SUFBQUksQ0FBQSxNQUFBSyxFQUFBO0lBQUFMLENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFELEVBQUEsR0FBQUwsQ0FBQTtJQUFBTSxFQUFBLEdBQUFOLENBQUE7RUFBQTtFQTFHaENYLFNBQVMsQ0FBQ2dCLEVBMEdULEVBQUVDLEVBQTZCLENBQUM7QUFBQTtBQTlHNUIsU0FBQVMsT0FBQUssUUFBQTtFQUFBLE9BK0JDQyxRQUFNLENBQUFDLElBQUssS0FBSyxZQUN1QixJQUF2Q0QsUUFBTSxDQUFBRSxNQUFPLENBQUFELElBQUssS0FBSyxnQkFDaUIsSUFBeEM3QiwyQkFBMkIsQ0FBQzRCLFFBQU0sQ0FBQUcsSUFBSyxDQUFDO0FBQUE7QUFqQ3pDLFNBQUFYLE9BQUFZLFFBQUE7RUFBQSxPQTJCQ0osUUFBTSxDQUFBQyxJQUFLLEtBQUssWUFBdUQsSUFBdkNELFFBQU0sQ0FBQUUsTUFBTyxDQUFBRCxJQUFLLEtBQUssZ0JBQWdCO0FBQUE7QUEzQnhFLFNBQUFYLE9BQUFlLFFBQUE7RUFBQSxPQXFCQ0wsUUFBTSxDQUFBQyxJQUFLLEtBQUssUUFDdUIsSUFBdkNELFFBQU0sQ0FBQUUsTUFBTyxDQUFBRCxJQUFLLEtBQUssZ0JBQ2lCLElBQXhDN0IsMkJBQTJCLENBQUM0QixRQUFNLENBQUFHLElBQUssQ0FBQztBQUFBO0FBdkJ6QyxTQUFBZixNQUFBWSxNQUFBO0VBQUEsT0FRQ0EsTUFBTSxDQUFBQyxJQUFLLEtBQUssUUFDZ0IsSUFBaENELE1BQU0sQ0FBQUUsTUFBTyxDQUFBRCxJQUFLLEtBQUssU0FDUSxJQUEvQkQsTUFBTSxDQUFBRSxNQUFPLENBQUFELElBQUssS0FBSyxRQUNnQixJQUF2Q0QsTUFBTSxDQUFBRSxNQUFPLENBQUFELElBQUssS0FBSyxnQkFBZ0I7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==