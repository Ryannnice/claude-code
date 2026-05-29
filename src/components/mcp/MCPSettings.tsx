// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useEffect、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useMemo } from 'react';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准终端渲染的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 接入 ClaudeAuthProvider 服务层能力，把外部通信或共享状态交给 ../../services/mcp/auth.js 处理。
import { ClaudeAuthProvider } from '../../services/mcp/auth.js';
// 类型依赖 { McpClaudeAIProxyServerConfig, McpHTTPServerConfig, McpSSE… 来自 ../../services/mcp/types.js，用于校准终端渲染的数据契约。
import type { McpClaudeAIProxyServerConfig, McpHTTPServerConfig, McpSSEServerConfig, McpStdioServerConfig } from '../../services/mcp/types.js';
// 接入 extractAgentMcpServers、filterToolsByServer 服务层能力，把外部通信或共享状态交给 ../../services/mcp/utils.js 处理。
import { extractAgentMcpServers, filterToolsByServer } from '../../services/mcp/utils.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 复用 getSessionIngressAuthToken 工具函数，把通用处理留在 ../../utils/sessionIngressAuth.js 中维护。
import { getSessionIngressAuthToken } from '../../utils/sessionIngressAuth.js';
// 引入 MCPAgentServerMenu，将 ./MCPAgentServerMenu.js 中已经封装好的能力接到本文件流程里。
import { MCPAgentServerMenu } from './MCPAgentServerMenu.js';
// 引入 MCPListPanel，将 ./MCPListPanel.js 中已经封装好的能力接到本文件流程里。
import { MCPListPanel } from './MCPListPanel.js';
// 引入 MCPRemoteServerMenu，将 ./MCPRemoteServerMenu.js 中已经封装好的能力接到本文件流程里。
import { MCPRemoteServerMenu } from './MCPRemoteServerMenu.js';
// 引入 MCPStdioServerMenu，将 ./MCPStdioServerMenu.js 中已经封装好的能力接到本文件流程里。
import { MCPStdioServerMenu } from './MCPStdioServerMenu.js';
// 引入 MCPToolDetailView，将 ./MCPToolDetailView.js 中已经封装好的能力接到本文件流程里。
import { MCPToolDetailView } from './MCPToolDetailView.js';
// 引入 MCPToolListView，将 ./MCPToolListView.js 中已经封装好的能力接到本文件流程里。
import { MCPToolListView } from './MCPToolListView.js';
// 类型依赖 { AgentMcpServerInfo, MCPViewState, ServerInfo } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { AgentMcpServerInfo, MCPViewState, ServerInfo } from './types.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onComplete: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
};
// MCPSettings 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MCPSettings(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(66);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onComplete
  } = t0;
  // mcp保存`useAppState`，供终端渲染后续处理使用。
  const mcp = useAppState(_temp);
  // agentDefinitions 集合保存`useAppState`，供终端渲染后续处理使用。
  const agentDefinitions = useAppState(_temp2);
  // mcpClients 集合保存`mcp.clients`，供后续判断或组装使用。
  const mcpClients = mcp.clients;
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      type: "list"
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 从 `React.useState(t1)` 按位置拆出 viewState、setViewState，让MCP 界面组件 MCPSettings分别处理这些返回值。
  const [viewState, setViewState] = React.useState(t1);
  // t2 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // 从 `React.useState(t2)` 按位置拆出 servers、setServers，让MCP 界面组件 MCPSettings分别处理这些返回值。
  const [servers, setServers] = React.useState(t2);
  // t3 暂存 `extractAgentMcpServers(agentDefinitions.allAgents)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== agentDefinitions.allAgents) {
    // t3 暂存 `extractAgentMcpServers(agentDefinitions.allAgents)` 生成的渲染片段，后续返回路径直接复用。
    t3 = extractAgentMcpServers(agentDefinitions.allAgents);
    // $[2] 缓存 `agentDefinitions.allAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = agentDefinitions.allAgents;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // agentMcpServers 集合沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const agentMcpServers = t3;
  // t4 暂存 `mcpClients.filter(_temp3).sort(_temp4)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== mcpClients) {
    // t4 暂存 `mcpClients.filter(_temp3).sort(_temp4)` 生成的渲染片段，后续返回路径直接复用。
    t4 = mcpClients.filter(_temp3).sort(_temp4);
    // $[4] 缓存 `mcpClients`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = mcpClients;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // filteredClients 集合保存`t4`，作为后续临时缓存值处理的输入。
  const filteredClients = t4;
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== filteredClients || $[7] !== mcp.tools) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // cancelled标记终端渲染MCP 界面组件 MCPSettings是否启用对应路径。
      let cancelled = false;
      // prepareServers 集合保存`prepareServers`，供终端渲染后续处理使用。
      const prepareServers = async function prepareServers() {
        // serverInfos 集合保存`Promise.all`，供终端渲染后续处理使用。
        const serverInfos = await Promise.all(filteredClients.map(async client_0 => {
          // scope 命名 `client_0.config.scope`，让后续代码直接表达这个值的用途。
          const scope = client_0.config.scope;
          // isSSE标记终端渲染MCP 界面组件 MCPSettings是否启用对应路径。
          const isSSE = client_0.config.type === "sse";
          // isHTTP标记终端渲染MCP 界面组件 MCPSettings是否启用对应路径。
          const isHTTP = client_0.config.type === "http";
          // isClaudeAIProxy标记终端渲染MCP 界面组件 MCPSettings是否启用对应路径。
          const isClaudeAIProxy = client_0.config.type === "claudeai-proxy";
          // isAuthenticated标记终端渲染MCP 界面组件 MCPSettings是否启用对应路径。
          let isAuthenticated = undefined;
          // 只有 `isSSE || isHTTP` 满足时，终端渲染才执行该分支。
          if (isSSE || isHTTP) {
            // authProvider保存`ClaudeAuthProvider`，供终端渲染后续处理使用。
            const authProvider = new ClaudeAuthProvider(client_0.name, client_0.config as McpSSEServerConfig | McpHTTPServerConfig);
            // token 列表保存`authProvider.tokens`，供终端渲染后续处理使用。
            const tokens = await authProvider.tokens();
            // hasSessionAuth 会话数据记录 `getSessionIngressAuthToken` 是否成立，终端渲染随后按该结果分支。
            const hasSessionAuth = getSessionIngressAuthToken() !== null && client_0.type === "connected";
            // hasToolsAndConnected记录 `filterToolsByServer` 是否成立，终端渲染随后按该结果分支。
            const hasToolsAndConnected = client_0.type === "connected" && filterToolsByServer(mcp.tools, client_0.name).length > 0;
            // isAuthenticated更新为 `Boolean(tokens) || hasSessionAuth || hasToolsAndConnected`，确保MCP 界面后续读取最新状态。
            isAuthenticated = Boolean(tokens) || hasSessionAuth || hasToolsAndConnected;
          }
          // baseInfo 集中保存终端渲染MCP 界面组件 MCPSettings要一起传递的字段。
          const baseInfo = {
            name: client_0.name,
            client: client_0,
            scope
          };
          // 满足 `isClaudeAIProxy` 时，终端渲染执行该分支。
          if (isClaudeAIProxy) {
            // 返回结构化结果，集中表达终端渲染已经整理出的状态。
            return {
              ...baseInfo,
              transport: "claudeai-proxy" as const,
              isAuthenticated: false,
              config: client_0.config as McpClaudeAIProxyServerConfig
            };
          } else {
            // 满足 `isSSE` 时，终端渲染执行该分支。
            if (isSSE) {
              // 返回结构化结果，集中表达终端渲染已经整理出的状态。
              return {
                ...baseInfo,
                transport: "sse" as const,
                isAuthenticated,
                config: client_0.config as McpSSEServerConfig
              };
            } else {
              // 满足 `isHTTP` 时，终端渲染执行该分支。
              if (isHTTP) {
                // 返回结构化结果，集中表达终端渲染已经整理出的状态。
                return {
                  ...baseInfo,
                  transport: "http" as const,
                  isAuthenticated,
                  config: client_0.config as McpHTTPServerConfig
                };
              } else {
                // 返回结构化结果，集中表达终端渲染已经整理出的状态。
                return {
                  ...baseInfo,
                  transport: "stdio" as const,
                  config: client_0.config as McpStdioServerConfig
                };
              }
            }
          }
        }));
        // 满足 `cancelled` 时，终端渲染执行该分支。
        if (cancelled) {
          // MCP 界面组件 MCPSettings在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // setServers 写入新的状态值，使终端渲染后续读取保持一致。
        setServers(serverInfos);
      };
      // 调用 prepareServers，触发终端渲染此处需要的副作用。
      prepareServers();
      // 返回 `() => {`，作为终端渲染这次计算的结果。
      return () => {
        // cancelled更新为 `true`，确保MCP 界面后续读取最新状态。
        cancelled = true;
      };
    };
    // t6 暂存 `[filteredClients, mcp.tools]` 生成的渲染片段，后续返回路径直接复用。
    t6 = [filteredClients, mcp.tools];
    // $[6] 缓存 `filteredClients`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = filteredClients;
    // $[7] 缓存 `mcp.tools`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = mcp.tools;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(t5, t6);
  // t7 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // t8 暂存 `[servers.length, filteredClients.length, agentMcpServers....` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== agentMcpServers.length || $[11] !== filteredClients.length || $[12] !== onComplete || $[13] !== servers.length) {
    // t7 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => {
      // 只有 `servers.length === 0 && filteredClients.length > 0` 满足时，终端渲染才执行该分支。
      if (servers.length === 0 && filteredClients.length > 0) {
        // MCP 界面组件 MCPSettings在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 只有 `servers.length === 0 && agentMcpServers.length ==` 满足时，终端渲染才执行该分支。
      if (servers.length === 0 && agentMcpServers.length === 0) {
        // 调用 onComplete，触发终端渲染此处需要的副作用。
        onComplete("No MCP servers configured. Please run /doctor if this is unexpected. Otherwise, run `claude mcp --help` or visit https://code.claude.com/docs/en/mcp to learn more.");
      }
    };
    // t8 暂存 `[servers.length, filteredClients.length, agentMcpServers....` 生成的渲染片段，后续返回路径直接复用。
    t8 = [servers.length, filteredClients.length, agentMcpServers.length, onComplete];
    // $[10] 缓存 `agentMcpServers.length`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = agentMcpServers.length;
    // $[11] 缓存 `filteredClients.length`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = filteredClients.length;
    // $[12] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onComplete;
    // $[13] 缓存 `servers.length`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = servers.length;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
    // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t8;
  } else {
    // t7 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[14];
    // t8 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[15];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t7, t8);
  // 按照 viewState.type 的取值选择终端渲染的具体处理分支。
  switch (viewState.type) {
    case "list":
      {
        // t10 暂存 `agentServer => setViewState({` 的派生结果，便于缓存命中时直接复用。
        let t10;
        // t9 暂存 `server => setViewState({` 的派生结果，便于缓存命中时直接复用。
        let t9;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
          // t9 暂存 `server => setViewState({` 生成的渲染片段，后续返回路径直接复用。
          t9 = server => setViewState({
            type: "server-menu",
            server
          });
          // t10 暂存 `agentServer => setViewState({` 生成的渲染片段，后续返回路径直接复用。
          t10 = agentServer => setViewState({
            type: "agent-server-menu",
            agentServer
          });
          // $[16] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
          $[16] = t10;
          // $[17] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[17] = t9;
        } else {
          // t10 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
          t10 = $[16];
          // t9 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
          t9 = $[17];
        }
        // t11 暂存 `<MCPListPanel servers={servers} agentServers={agentMcpSer...` 的派生结果，便于缓存命中时直接复用。
        let t11;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[18] !== agentMcpServers || $[19] !== onComplete || $[20] !== servers || $[21] !== viewState.defaultTab) {
          // t11 暂存 `<MCPListPanel servers={servers} agentServers={agentMcpSer...` 生成的渲染片段，后续返回路径直接复用。
          t11 = <MCPListPanel servers={servers} agentServers={agentMcpServers} onSelectServer={t9} onSelectAgentServer={t10} onComplete={onComplete} defaultTab={viewState.defaultTab} />;
          // $[18] 缓存 `agentMcpServers`，下次依赖未变时 React 编译产物可直接复用。
          $[18] = agentMcpServers;
          // $[19] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
          $[19] = onComplete;
          // $[20] 缓存 `servers`，下次依赖未变时 React 编译产物可直接复用。
          $[20] = servers;
          // $[21] 缓存 `viewState.defaultTab`，下次依赖未变时 React 编译产物可直接复用。
          $[21] = viewState.defaultTab;
          // $[22] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
          $[22] = t11;
        } else {
          // t11 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
          t11 = $[22];
        }
        // 返回 `t11`，作为终端渲染这次计算的结果。
        return t11;
      }
    case "server-menu":
      {
        // t9 暂存 `filterToolsByServer(mcp.tools, viewState.server.name)` 的派生结果，便于缓存命中时直接复用。
        let t9;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[23] !== mcp.tools || $[24] !== viewState.server.name) {
          // t9 暂存 `filterToolsByServer(mcp.tools, viewState.server.name)` 生成的渲染片段，后续返回路径直接复用。
          t9 = filterToolsByServer(mcp.tools, viewState.server.name);
          // $[23] 缓存 `mcp.tools`，下次依赖未变时 React 编译产物可直接复用。
          $[23] = mcp.tools;
          // $[24] 缓存 `viewState.server.name`，下次依赖未变时 React 编译产物可直接复用。
          $[24] = viewState.server.name;
          // $[25] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[25] = t9;
        } else {
          // t9 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
          t9 = $[25];
        }
        // serverTools_0 命名 `t9`，让后续代码直接表达这个值的用途。
        const serverTools_0 = t9;
        // defaultTab标记终端渲染MCP 界面组件 MCPSettings是否启用对应路径。
        const defaultTab = viewState.server.transport === "claudeai-proxy" ? "claude.ai" : "Claude Code";
        // 当 `viewState.server.transport` 匹配 `"stdio"` 时，终端渲染执行对应分支。
        if (viewState.server.transport === "stdio") {
          // t10 暂存 `() => setViewState({` 的派生结果，便于缓存命中时直接复用。
          let t10;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[26] !== viewState.server) {
            // t10 暂存 `() => setViewState({` 生成的渲染片段，后续返回路径直接复用。
            t10 = () => setViewState({
              type: "server-tools",
              server: viewState.server
            });
            // $[26] 缓存 `viewState.server`，下次依赖未变时 React 编译产物可直接复用。
            $[26] = viewState.server;
            // $[27] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
            $[27] = t10;
          } else {
            // t10 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
            t10 = $[27];
          }
          // t11 暂存 `() => setViewState({` 的派生结果，便于缓存命中时直接复用。
          let t11;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[28] !== defaultTab) {
            // t11 暂存 `() => setViewState({` 生成的渲染片段，后续返回路径直接复用。
            t11 = () => setViewState({
              type: "list",
              defaultTab
            });
            // $[28] 缓存 `defaultTab`，下次依赖未变时 React 编译产物可直接复用。
            $[28] = defaultTab;
            // $[29] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
            $[29] = t11;
          } else {
            // t11 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
            t11 = $[29];
          }
          // t12 暂存 `<MCPStdioServerMenu server={viewState.server} serverTools...` 的派生结果，便于缓存命中时直接复用。
          let t12;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[30] !== onComplete || $[31] !== serverTools_0.length || $[32] !== t10 || $[33] !== t11 || $[34] !== viewState.server) {
            // t12 暂存 `<MCPStdioServerMenu server={viewState.server} serverTools...` 生成的渲染片段，后续返回路径直接复用。
            t12 = <MCPStdioServerMenu server={viewState.server} serverToolsCount={serverTools_0.length} onViewTools={t10} onCancel={t11} onComplete={onComplete} />;
            // $[30] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
            $[30] = onComplete;
            // $[31] 缓存 `serverTools_0.length`，下次依赖未变时 React 编译产物可直接复用。
            $[31] = serverTools_0.length;
            // $[32] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
            $[32] = t10;
            // $[33] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
            $[33] = t11;
            // $[34] 缓存 `viewState.server`，下次依赖未变时 React 编译产物可直接复用。
            $[34] = viewState.server;
            // $[35] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
            $[35] = t12;
          } else {
            // t12 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
            t12 = $[35];
          }
          // 返回 `t12`，作为终端渲染这次计算的结果。
          return t12;
        } else {
          // t10 暂存 `() => setViewState({` 的派生结果，便于缓存命中时直接复用。
          let t10;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[36] !== viewState.server) {
            // t10 暂存 `() => setViewState({` 生成的渲染片段，后续返回路径直接复用。
            t10 = () => setViewState({
              type: "server-tools",
              server: viewState.server
            });
            // $[36] 缓存 `viewState.server`，下次依赖未变时 React 编译产物可直接复用。
            $[36] = viewState.server;
            // $[37] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
            $[37] = t10;
          } else {
            // t10 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
            t10 = $[37];
          }
          // t11 暂存 `() => setViewState({` 的派生结果，便于缓存命中时直接复用。
          let t11;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[38] !== defaultTab) {
            // t11 暂存 `() => setViewState({` 生成的渲染片段，后续返回路径直接复用。
            t11 = () => setViewState({
              type: "list",
              defaultTab
            });
            // $[38] 缓存 `defaultTab`，下次依赖未变时 React 编译产物可直接复用。
            $[38] = defaultTab;
            // $[39] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
            $[39] = t11;
          } else {
            // t11 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
            t11 = $[39];
          }
          // t12 暂存 `<MCPRemoteServerMenu server={viewState.server} serverTool...` 的派生结果，便于缓存命中时直接复用。
          let t12;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[40] !== onComplete || $[41] !== serverTools_0.length || $[42] !== t10 || $[43] !== t11 || $[44] !== viewState.server) {
            // t12 暂存 `<MCPRemoteServerMenu server={viewState.server} serverTool...` 生成的渲染片段，后续返回路径直接复用。
            t12 = <MCPRemoteServerMenu server={viewState.server} serverToolsCount={serverTools_0.length} onViewTools={t10} onCancel={t11} onComplete={onComplete} />;
            // $[40] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
            $[40] = onComplete;
            // $[41] 缓存 `serverTools_0.length`，下次依赖未变时 React 编译产物可直接复用。
            $[41] = serverTools_0.length;
            // $[42] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
            $[42] = t10;
            // $[43] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
            $[43] = t11;
            // $[44] 缓存 `viewState.server`，下次依赖未变时 React 编译产物可直接复用。
            $[44] = viewState.server;
            // $[45] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
            $[45] = t12;
          } else {
            // t12 从 React 编译缓存槽 $[45] 取回渲染片段，避免依赖未变时重建 JSX。
            t12 = $[45];
          }
          // 返回 `t12`，作为终端渲染这次计算的结果。
          return t12;
        }
      }
    case "server-tools":
      {
        // t10 暂存 `() => setViewState({` 的派生结果，便于缓存命中时直接复用。
        let t10;
        // t9 暂存 `(_, index) => setViewState({` 的派生结果，便于缓存命中时直接复用。
        let t9;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[46] !== viewState.server) {
          // t9 暂存 `(_, index) => setViewState({` 生成的渲染片段，后续返回路径直接复用。
          t9 = (_, index) => setViewState({
            type: "server-tool-detail",
            server: viewState.server,
            toolIndex: index
          });
          // t10 暂存 `() => setViewState({` 生成的渲染片段，后续返回路径直接复用。
          t10 = () => setViewState({
            type: "server-menu",
            server: viewState.server
          });
          // $[46] 缓存 `viewState.server`，下次依赖未变时 React 编译产物可直接复用。
          $[46] = viewState.server;
          // $[47] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
          $[47] = t10;
          // $[48] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[48] = t9;
        } else {
          // t10 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
          t10 = $[47];
          // t9 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
          t9 = $[48];
        }
        // t11 暂存 `<MCPToolListView server={viewState.server} onSelectTool={...` 的派生结果，便于缓存命中时直接复用。
        let t11;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[49] !== t10 || $[50] !== t9 || $[51] !== viewState.server) {
          // t11 暂存 `<MCPToolListView server={viewState.server} onSelectTool={...` 生成的渲染片段，后续返回路径直接复用。
          t11 = <MCPToolListView server={viewState.server} onSelectTool={t9} onBack={t10} />;
          // $[49] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
          $[49] = t10;
          // $[50] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[50] = t9;
          // $[51] 缓存 `viewState.server`，下次依赖未变时 React 编译产物可直接复用。
          $[51] = viewState.server;
          // $[52] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
          $[52] = t11;
        } else {
          // t11 从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
          t11 = $[52];
        }
        // 返回 `t11`，作为终端渲染这次计算的结果。
        return t11;
      }
    case "server-tool-detail":
      {
        // t9 暂存 `filterToolsByServer(mcp.tools, viewState.server.name)` 的派生结果，便于缓存命中时直接复用。
        let t9;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[53] !== mcp.tools || $[54] !== viewState.server.name) {
          // t9 暂存 `filterToolsByServer(mcp.tools, viewState.server.name)` 生成的渲染片段，后续返回路径直接复用。
          t9 = filterToolsByServer(mcp.tools, viewState.server.name);
          // $[53] 缓存 `mcp.tools`，下次依赖未变时 React 编译产物可直接复用。
          $[53] = mcp.tools;
          // $[54] 缓存 `viewState.server.name`，下次依赖未变时 React 编译产物可直接复用。
          $[54] = viewState.server.name;
          // $[55] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[55] = t9;
        } else {
          // t9 从 React 编译缓存槽 $[55] 取回渲染片段，避免依赖未变时重建 JSX。
          t9 = $[55];
        }
        // serverTools 集合 命名 `t9`，让后续代码直接表达这个值的用途。
        const serverTools = t9;
        // 工具读取 `serverTools[viewState.toolIndex]` 对应条目，后续围绕该成员继续处理。
        const tool = serverTools[viewState.toolIndex];
        // 工具缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!tool) {
          // setViewState 写入新的状态值，使终端渲染后续读取保持一致。
          setViewState({
            type: "server-tools",
            server: viewState.server
          });
          // 返回 `null`，作为终端渲染这次计算的结果。
          return null;
        }
        // t10 暂存 `() => setViewState({` 的派生结果，便于缓存命中时直接复用。
        let t10;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[56] !== viewState.server) {
          // t10 暂存 `() => setViewState({` 生成的渲染片段，后续返回路径直接复用。
          t10 = () => setViewState({
            type: "server-tools",
            server: viewState.server
          });
          // $[56] 缓存 `viewState.server`，下次依赖未变时 React 编译产物可直接复用。
          $[56] = viewState.server;
          // $[57] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
          $[57] = t10;
        } else {
          // t10 从 React 编译缓存槽 $[57] 取回渲染片段，避免依赖未变时重建 JSX。
          t10 = $[57];
        }
        // t11 暂存 `<MCPToolDetailView tool={tool} server={viewState.server} ...` 的派生结果，便于缓存命中时直接复用。
        let t11;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[58] !== t10 || $[59] !== tool || $[60] !== viewState.server) {
          // t11 暂存 `<MCPToolDetailView tool={tool} server={viewState.server} ...` 生成的渲染片段，后续返回路径直接复用。
          t11 = <MCPToolDetailView tool={tool} server={viewState.server} onBack={t10} />;
          // $[58] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
          $[58] = t10;
          // $[59] 缓存 `tool`，下次依赖未变时 React 编译产物可直接复用。
          $[59] = tool;
          // $[60] 缓存 `viewState.server`，下次依赖未变时 React 编译产物可直接复用。
          $[60] = viewState.server;
          // $[61] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
          $[61] = t11;
        } else {
          // t11 从 React 编译缓存槽 $[61] 取回渲染片段，避免依赖未变时重建 JSX。
          t11 = $[61];
        }
        // 返回 `t11`，作为终端渲染这次计算的结果。
        return t11;
      }
    case "agent-server-menu":
      {
        // t9 暂存 `() => setViewState({` 的派生结果，便于缓存命中时直接复用。
        let t9;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[62] === Symbol.for("react.memo_cache_sentinel")) {
          // t9 暂存 `() => setViewState({` 生成的渲染片段，后续返回路径直接复用。
          t9 = () => setViewState({
            type: "list",
            defaultTab: "Agents"
          });
          // $[62] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[62] = t9;
        } else {
          // t9 从 React 编译缓存槽 $[62] 取回渲染片段，避免依赖未变时重建 JSX。
          t9 = $[62];
        }
        // t10 暂存 `<MCPAgentServerMenu agentServer={viewState.agentServer} o...` 的派生结果，便于缓存命中时直接复用。
        let t10;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[63] !== onComplete || $[64] !== viewState.agentServer) {
          // t10 暂存 `<MCPAgentServerMenu agentServer={viewState.agentServer} o...` 生成的渲染片段，后续返回路径直接复用。
          t10 = <MCPAgentServerMenu agentServer={viewState.agentServer} onCancel={t9} onComplete={onComplete} />;
          // $[63] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
          $[63] = onComplete;
          // $[64] 缓存 `viewState.agentServer`，下次依赖未变时 React 编译产物可直接复用。
          $[64] = viewState.agentServer;
          // $[65] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
          $[65] = t10;
        } else {
          // t10 从 React 编译缓存槽 $[65] 取回渲染片段，避免依赖未变时重建 JSX。
          t10 = $[65];
        }
        // 返回 `t10`，作为终端渲染这次计算的结果。
        return t10;
      }
  }
}
// _temp4 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(a, b) {
  // 返回 `a.name.localeCompare(b.name)`，作为终端渲染这次计算的结果。
  return a.name.localeCompare(b.name);
}
// _temp3 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(client) {
  // 返回 `client.name !== "ide"`，作为终端渲染这次计算的结果。
  return client.name !== "ide";
}
// _temp2 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s_0) {
  // 返回 `s_0.agentDefinitions`，作为终端渲染这次计算的结果。
  return s_0.agentDefinitions;
}
// _temp 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.mcp`，作为终端渲染这次计算的结果。
  return s.mcp;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJDb21tYW5kUmVzdWx0RGlzcGxheSIsIkNsYXVkZUF1dGhQcm92aWRlciIsIk1jcENsYXVkZUFJUHJveHlTZXJ2ZXJDb25maWciLCJNY3BIVFRQU2VydmVyQ29uZmlnIiwiTWNwU1NFU2VydmVyQ29uZmlnIiwiTWNwU3RkaW9TZXJ2ZXJDb25maWciLCJleHRyYWN0QWdlbnRNY3BTZXJ2ZXJzIiwiZmlsdGVyVG9vbHNCeVNlcnZlciIsInVzZUFwcFN0YXRlIiwiZ2V0U2Vzc2lvbkluZ3Jlc3NBdXRoVG9rZW4iLCJNQ1BBZ2VudFNlcnZlck1lbnUiLCJNQ1BMaXN0UGFuZWwiLCJNQ1BSZW1vdGVTZXJ2ZXJNZW51IiwiTUNQU3RkaW9TZXJ2ZXJNZW51IiwiTUNQVG9vbERldGFpbFZpZXciLCJNQ1BUb29sTGlzdFZpZXciLCJBZ2VudE1jcFNlcnZlckluZm8iLCJNQ1BWaWV3U3RhdGUiLCJTZXJ2ZXJJbmZvIiwiUHJvcHMiLCJvbkNvbXBsZXRlIiwicmVzdWx0Iiwib3B0aW9ucyIsImRpc3BsYXkiLCJNQ1BTZXR0aW5ncyIsInQwIiwiJCIsIl9jIiwibWNwIiwiX3RlbXAiLCJhZ2VudERlZmluaXRpb25zIiwiX3RlbXAyIiwibWNwQ2xpZW50cyIsImNsaWVudHMiLCJ0MSIsIlN5bWJvbCIsImZvciIsInR5cGUiLCJ2aWV3U3RhdGUiLCJzZXRWaWV3U3RhdGUiLCJ1c2VTdGF0ZSIsInQyIiwic2VydmVycyIsInNldFNlcnZlcnMiLCJ0MyIsImFsbEFnZW50cyIsImFnZW50TWNwU2VydmVycyIsInQ0IiwiZmlsdGVyIiwiX3RlbXAzIiwic29ydCIsIl90ZW1wNCIsImZpbHRlcmVkQ2xpZW50cyIsInQ1IiwidDYiLCJ0b29scyIsImNhbmNlbGxlZCIsInByZXBhcmVTZXJ2ZXJzIiwic2VydmVySW5mb3MiLCJQcm9taXNlIiwiYWxsIiwibWFwIiwiY2xpZW50XzAiLCJzY29wZSIsImNsaWVudCIsImNvbmZpZyIsImlzU1NFIiwiaXNIVFRQIiwiaXNDbGF1ZGVBSVByb3h5IiwiaXNBdXRoZW50aWNhdGVkIiwidW5kZWZpbmVkIiwiYXV0aFByb3ZpZGVyIiwibmFtZSIsInRva2VucyIsImhhc1Nlc3Npb25BdXRoIiwiaGFzVG9vbHNBbmRDb25uZWN0ZWQiLCJsZW5ndGgiLCJCb29sZWFuIiwiYmFzZUluZm8iLCJ0cmFuc3BvcnQiLCJjb25zdCIsInQ3IiwidDgiLCJ0MTAiLCJ0OSIsInNlcnZlciIsImFnZW50U2VydmVyIiwidDExIiwiZGVmYXVsdFRhYiIsInNlcnZlclRvb2xzXzAiLCJ0MTIiLCJzZXJ2ZXJUb29scyIsIl8iLCJpbmRleCIsInRvb2xJbmRleCIsInRvb2wiLCJhIiwiYiIsImxvY2FsZUNvbXBhcmUiLCJzXzAiLCJzIl0sInNvdXJjZXMiOlsiTUNQU2V0dGluZ3MudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZU1lbW8gfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgQ29tbWFuZFJlc3VsdERpc3BsYXkgfSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcbmltcG9ydCB7IENsYXVkZUF1dGhQcm92aWRlciB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL21jcC9hdXRoLmpzJ1xuaW1wb3J0IHR5cGUge1xuICBNY3BDbGF1ZGVBSVByb3h5U2VydmVyQ29uZmlnLFxuICBNY3BIVFRQU2VydmVyQ29uZmlnLFxuICBNY3BTU0VTZXJ2ZXJDb25maWcsXG4gIE1jcFN0ZGlvU2VydmVyQ29uZmlnLFxufSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tY3AvdHlwZXMuanMnXG5pbXBvcnQge1xuICBleHRyYWN0QWdlbnRNY3BTZXJ2ZXJzLFxuICBmaWx0ZXJUb29sc0J5U2VydmVyLFxufSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tY3AvdXRpbHMuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0YXRlLmpzJ1xuaW1wb3J0IHsgZ2V0U2Vzc2lvbkluZ3Jlc3NBdXRoVG9rZW4gfSBmcm9tICcuLi8uLi91dGlscy9zZXNzaW9uSW5ncmVzc0F1dGguanMnXG5pbXBvcnQgeyBNQ1BBZ2VudFNlcnZlck1lbnUgfSBmcm9tICcuL01DUEFnZW50U2VydmVyTWVudS5qcydcbmltcG9ydCB7IE1DUExpc3RQYW5lbCB9IGZyb20gJy4vTUNQTGlzdFBhbmVsLmpzJ1xuaW1wb3J0IHsgTUNQUmVtb3RlU2VydmVyTWVudSB9IGZyb20gJy4vTUNQUmVtb3RlU2VydmVyTWVudS5qcydcbmltcG9ydCB7IE1DUFN0ZGlvU2VydmVyTWVudSB9IGZyb20gJy4vTUNQU3RkaW9TZXJ2ZXJNZW51LmpzJ1xuaW1wb3J0IHsgTUNQVG9vbERldGFpbFZpZXcgfSBmcm9tICcuL01DUFRvb2xEZXRhaWxWaWV3LmpzJ1xuaW1wb3J0IHsgTUNQVG9vbExpc3RWaWV3IH0gZnJvbSAnLi9NQ1BUb29sTGlzdFZpZXcuanMnXG5pbXBvcnQgdHlwZSB7IEFnZW50TWNwU2VydmVySW5mbywgTUNQVmlld1N0YXRlLCBTZXJ2ZXJJbmZvIH0gZnJvbSAnLi90eXBlcy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgb25Db21wbGV0ZTogKFxuICAgIHJlc3VsdD86IHN0cmluZyxcbiAgICBvcHRpb25zPzogeyBkaXNwbGF5PzogQ29tbWFuZFJlc3VsdERpc3BsYXkgfSxcbiAgKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBNQ1BTZXR0aW5ncyh7IG9uQ29tcGxldGUgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBtY3AgPSB1c2VBcHBTdGF0ZShzID0+IHMubWNwKVxuICBjb25zdCBhZ2VudERlZmluaXRpb25zID0gdXNlQXBwU3RhdGUocyA9PiBzLmFnZW50RGVmaW5pdGlvbnMpXG4gIGNvbnN0IG1jcENsaWVudHMgPSBtY3AuY2xpZW50c1xuICBjb25zdCBbdmlld1N0YXRlLCBzZXRWaWV3U3RhdGVdID0gUmVhY3QudXNlU3RhdGU8TUNQVmlld1N0YXRlPih7XG4gICAgdHlwZTogJ2xpc3QnLFxuICB9KVxuICBjb25zdCBbc2VydmVycywgc2V0U2VydmVyc10gPSBSZWFjdC51c2VTdGF0ZTxTZXJ2ZXJJbmZvW10+KFtdKVxuXG4gIC8vIEV4dHJhY3QgYWdlbnQtc3BlY2lmaWMgTUNQIHNlcnZlcnMgZnJvbSBhZ2VudCBkZWZpbml0aW9uc1xuICBjb25zdCBhZ2VudE1jcFNlcnZlcnMgPSB1c2VNZW1vKFxuICAgICgpID0+IGV4dHJhY3RBZ2VudE1jcFNlcnZlcnMoYWdlbnREZWZpbml0aW9ucy5hbGxBZ2VudHMpLFxuICAgIFthZ2VudERlZmluaXRpb25zLmFsbEFnZW50c10sXG4gIClcblxuICBjb25zdCBmaWx0ZXJlZENsaWVudHMgPSBSZWFjdC51c2VNZW1vKFxuICAgICgpID0+XG4gICAgICBtY3BDbGllbnRzXG4gICAgICAgIC5maWx0ZXIoY2xpZW50ID0+IGNsaWVudC5uYW1lICE9PSAnaWRlJylcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSkpLFxuICAgIFttY3BDbGllbnRzXSxcbiAgKVxuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IGNhbmNlbGxlZCA9IGZhbHNlXG4gICAgYXN5bmMgZnVuY3Rpb24gcHJlcGFyZVNlcnZlcnMoKSB7XG4gICAgICBjb25zdCBzZXJ2ZXJJbmZvcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICBmaWx0ZXJlZENsaWVudHMubWFwKGFzeW5jIGNsaWVudCA9PiB7XG4gICAgICAgICAgY29uc3Qgc2NvcGUgPSBjbGllbnQuY29uZmlnLnNjb3BlXG4gICAgICAgICAgY29uc3QgaXNTU0UgPSBjbGllbnQuY29uZmlnLnR5cGUgPT09ICdzc2UnXG4gICAgICAgICAgY29uc3QgaXNIVFRQID0gY2xpZW50LmNvbmZpZy50eXBlID09PSAnaHR0cCdcbiAgICAgICAgICBjb25zdCBpc0NsYXVkZUFJUHJveHkgPSBjbGllbnQuY29uZmlnLnR5cGUgPT09ICdjbGF1ZGVhaS1wcm94eSdcbiAgICAgICAgICBsZXQgaXNBdXRoZW50aWNhdGVkOiBib29sZWFuIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICBpZiAoaXNTU0UgfHwgaXNIVFRQKSB7XG4gICAgICAgICAgICBjb25zdCBhdXRoUHJvdmlkZXIgPSBuZXcgQ2xhdWRlQXV0aFByb3ZpZGVyKFxuICAgICAgICAgICAgICBjbGllbnQubmFtZSxcbiAgICAgICAgICAgICAgY2xpZW50LmNvbmZpZyBhcyBNY3BTU0VTZXJ2ZXJDb25maWcgfCBNY3BIVFRQU2VydmVyQ29uZmlnLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgY29uc3QgdG9rZW5zID0gYXdhaXQgYXV0aFByb3ZpZGVyLnRva2VucygpXG4gICAgICAgICAgICAvLyBTZXJ2ZXIgaXMgYXV0aGVudGljYXRlZCBpZjpcbiAgICAgICAgICAgIC8vIDEuIEl0IGhhcyBPQXV0aCB0b2tlbnMsIE9SXG4gICAgICAgICAgICAvLyAyLiBJdCdzIGNvbm5lY3RlZCB2aWEgc2Vzc2lvbiBhdXRoIChoYXMgc2Vzc2lvbiB0b2tlbiBhbmQgaXMgY29ubmVjdGVkKSwgT1JcbiAgICAgICAgICAgIC8vIDMuIEl0J3MgY29ubmVjdGVkIGFuZCBoYXMgdG9vbHMgKG1lYW5pbmcgaXQncyB3b3JraW5nLCByZWdhcmRsZXNzIG9mIGF1dGggbWV0aG9kKVxuICAgICAgICAgICAgY29uc3QgaGFzU2Vzc2lvbkF1dGggPVxuICAgICAgICAgICAgICBnZXRTZXNzaW9uSW5ncmVzc0F1dGhUb2tlbigpICE9PSBudWxsICYmXG4gICAgICAgICAgICAgIGNsaWVudC50eXBlID09PSAnY29ubmVjdGVkJ1xuICAgICAgICAgICAgY29uc3QgaGFzVG9vbHNBbmRDb25uZWN0ZWQgPVxuICAgICAgICAgICAgICBjbGllbnQudHlwZSA9PT0gJ2Nvbm5lY3RlZCcgJiZcbiAgICAgICAgICAgICAgZmlsdGVyVG9vbHNCeVNlcnZlcihtY3AudG9vbHMsIGNsaWVudC5uYW1lKS5sZW5ndGggPiAwXG4gICAgICAgICAgICBpc0F1dGhlbnRpY2F0ZWQgPVxuICAgICAgICAgICAgICBCb29sZWFuKHRva2VucykgfHwgaGFzU2Vzc2lvbkF1dGggfHwgaGFzVG9vbHNBbmRDb25uZWN0ZWRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBiYXNlSW5mbyA9IHtcbiAgICAgICAgICAgIG5hbWU6IGNsaWVudC5uYW1lLFxuICAgICAgICAgICAgY2xpZW50LFxuICAgICAgICAgICAgc2NvcGUsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGlzQ2xhdWRlQUlQcm94eSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgLi4uYmFzZUluZm8sXG4gICAgICAgICAgICAgIHRyYW5zcG9ydDogJ2NsYXVkZWFpLXByb3h5JyBhcyBjb25zdCxcbiAgICAgICAgICAgICAgaXNBdXRoZW50aWNhdGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgY29uZmlnOiBjbGllbnQuY29uZmlnIGFzIE1jcENsYXVkZUFJUHJveHlTZXJ2ZXJDb25maWcsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChpc1NTRSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgLi4uYmFzZUluZm8sXG4gICAgICAgICAgICAgIHRyYW5zcG9ydDogJ3NzZScgYXMgY29uc3QsXG4gICAgICAgICAgICAgIGlzQXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgICAgY29uZmlnOiBjbGllbnQuY29uZmlnIGFzIE1jcFNTRVNlcnZlckNvbmZpZyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGlzSFRUUCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgLi4uYmFzZUluZm8sXG4gICAgICAgICAgICAgIHRyYW5zcG9ydDogJ2h0dHAnIGFzIGNvbnN0LFxuICAgICAgICAgICAgICBpc0F1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICAgIGNvbmZpZzogY2xpZW50LmNvbmZpZyBhcyBNY3BIVFRQU2VydmVyQ29uZmlnLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAuLi5iYXNlSW5mbyxcbiAgICAgICAgICAgICAgdHJhbnNwb3J0OiAnc3RkaW8nIGFzIGNvbnN0LFxuICAgICAgICAgICAgICBjb25maWc6IGNsaWVudC5jb25maWcgYXMgTWNwU3RkaW9TZXJ2ZXJDb25maWcsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgIClcblxuICAgICAgaWYgKGNhbmNlbGxlZCkgcmV0dXJuXG4gICAgICBzZXRTZXJ2ZXJzKHNlcnZlckluZm9zKVxuICAgIH1cblxuICAgIHZvaWQgcHJlcGFyZVNlcnZlcnMoKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBjYW5jZWxsZWQgPSB0cnVlXG4gICAgfVxuICB9LCBbZmlsdGVyZWRDbGllbnRzLCBtY3AudG9vbHNdKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHNlcnZlcnMubGVuZ3RoID09PSAwICYmIGZpbHRlcmVkQ2xpZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBTdGlsbCBsb2FkaW5nXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBPbmx5IHNob3cgXCJubyBzZXJ2ZXJzXCIgbWVzc2FnZSBpZiBubyByZWd1bGFyIHNlcnZlcnMgQU5EIG5vIGFnZW50IHNlcnZlcnNcbiAgICBpZiAoc2VydmVycy5sZW5ndGggPT09IDAgJiYgYWdlbnRNY3BTZXJ2ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgb25Db21wbGV0ZShcbiAgICAgICAgJ05vIE1DUCBzZXJ2ZXJzIGNvbmZpZ3VyZWQuIFBsZWFzZSBydW4gL2RvY3RvciBpZiB0aGlzIGlzIHVuZXhwZWN0ZWQuIE90aGVyd2lzZSwgcnVuIGBjbGF1ZGUgbWNwIC0taGVscGAgb3IgdmlzaXQgaHR0cHM6Ly9jb2RlLmNsYXVkZS5jb20vZG9jcy9lbi9tY3AgdG8gbGVhcm4gbW9yZS4nLFxuICAgICAgKVxuICAgIH1cbiAgfSwgW1xuICAgIHNlcnZlcnMubGVuZ3RoLFxuICAgIGZpbHRlcmVkQ2xpZW50cy5sZW5ndGgsXG4gICAgYWdlbnRNY3BTZXJ2ZXJzLmxlbmd0aCxcbiAgICBvbkNvbXBsZXRlLFxuICBdKVxuXG4gIHN3aXRjaCAodmlld1N0YXRlLnR5cGUpIHtcbiAgICBjYXNlICdsaXN0JzpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxNQ1BMaXN0UGFuZWxcbiAgICAgICAgICBzZXJ2ZXJzPXtzZXJ2ZXJzfVxuICAgICAgICAgIGFnZW50U2VydmVycz17YWdlbnRNY3BTZXJ2ZXJzfVxuICAgICAgICAgIG9uU2VsZWN0U2VydmVyPXtzZXJ2ZXIgPT5cbiAgICAgICAgICAgIHNldFZpZXdTdGF0ZSh7IHR5cGU6ICdzZXJ2ZXItbWVudScsIHNlcnZlciB9KVxuICAgICAgICAgIH1cbiAgICAgICAgICBvblNlbGVjdEFnZW50U2VydmVyPXsoYWdlbnRTZXJ2ZXI6IEFnZW50TWNwU2VydmVySW5mbykgPT5cbiAgICAgICAgICAgIHNldFZpZXdTdGF0ZSh7IHR5cGU6ICdhZ2VudC1zZXJ2ZXItbWVudScsIGFnZW50U2VydmVyIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIG9uQ29tcGxldGU9e29uQ29tcGxldGV9XG4gICAgICAgICAgZGVmYXVsdFRhYj17dmlld1N0YXRlLmRlZmF1bHRUYWJ9XG4gICAgICAgIC8+XG4gICAgICApXG5cbiAgICBjYXNlICdzZXJ2ZXItbWVudSc6IHtcbiAgICAgIGNvbnN0IHNlcnZlclRvb2xzID0gZmlsdGVyVG9vbHNCeVNlcnZlcihtY3AudG9vbHMsIHZpZXdTdGF0ZS5zZXJ2ZXIubmFtZSlcblxuICAgICAgY29uc3QgZGVmYXVsdFRhYiA9XG4gICAgICAgIHZpZXdTdGF0ZS5zZXJ2ZXIudHJhbnNwb3J0ID09PSAnY2xhdWRlYWktcHJveHknXG4gICAgICAgICAgPyAnY2xhdWRlLmFpJ1xuICAgICAgICAgIDogJ0NsYXVkZSBDb2RlJ1xuXG4gICAgICBpZiAodmlld1N0YXRlLnNlcnZlci50cmFuc3BvcnQgPT09ICdzdGRpbycpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8TUNQU3RkaW9TZXJ2ZXJNZW51XG4gICAgICAgICAgICBzZXJ2ZXI9e3ZpZXdTdGF0ZS5zZXJ2ZXJ9XG4gICAgICAgICAgICBzZXJ2ZXJUb29sc0NvdW50PXtzZXJ2ZXJUb29scy5sZW5ndGh9XG4gICAgICAgICAgICBvblZpZXdUb29scz17KCkgPT5cbiAgICAgICAgICAgICAgc2V0Vmlld1N0YXRlKHsgdHlwZTogJ3NlcnZlci10b29scycsIHNlcnZlcjogdmlld1N0YXRlLnNlcnZlciB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IHNldFZpZXdTdGF0ZSh7IHR5cGU6ICdsaXN0JywgZGVmYXVsdFRhYiB9KX1cbiAgICAgICAgICAgIG9uQ29tcGxldGU9e29uQ29tcGxldGV9XG4gICAgICAgICAgLz5cbiAgICAgICAgKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8TUNQUmVtb3RlU2VydmVyTWVudVxuICAgICAgICAgICAgc2VydmVyPXt2aWV3U3RhdGUuc2VydmVyfVxuICAgICAgICAgICAgc2VydmVyVG9vbHNDb3VudD17c2VydmVyVG9vbHMubGVuZ3RofVxuICAgICAgICAgICAgb25WaWV3VG9vbHM9eygpID0+XG4gICAgICAgICAgICAgIHNldFZpZXdTdGF0ZSh7IHR5cGU6ICdzZXJ2ZXItdG9vbHMnLCBzZXJ2ZXI6IHZpZXdTdGF0ZS5zZXJ2ZXIgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBzZXRWaWV3U3RhdGUoeyB0eXBlOiAnbGlzdCcsIGRlZmF1bHRUYWIgfSl9XG4gICAgICAgICAgICBvbkNvbXBsZXRlPXtvbkNvbXBsZXRlfVxuICAgICAgICAgIC8+XG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjYXNlICdzZXJ2ZXItdG9vbHMnOlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1DUFRvb2xMaXN0Vmlld1xuICAgICAgICAgIHNlcnZlcj17dmlld1N0YXRlLnNlcnZlcn1cbiAgICAgICAgICBvblNlbGVjdFRvb2w9eyhfLCBpbmRleCkgPT5cbiAgICAgICAgICAgIHNldFZpZXdTdGF0ZSh7XG4gICAgICAgICAgICAgIHR5cGU6ICdzZXJ2ZXItdG9vbC1kZXRhaWwnLFxuICAgICAgICAgICAgICBzZXJ2ZXI6IHZpZXdTdGF0ZS5zZXJ2ZXIsXG4gICAgICAgICAgICAgIHRvb2xJbmRleDogaW5kZXgsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgICBvbkJhY2s9eygpID0+XG4gICAgICAgICAgICBzZXRWaWV3U3RhdGUoeyB0eXBlOiAnc2VydmVyLW1lbnUnLCBzZXJ2ZXI6IHZpZXdTdGF0ZS5zZXJ2ZXIgfSlcbiAgICAgICAgICB9XG4gICAgICAgIC8+XG4gICAgICApXG5cbiAgICBjYXNlICdzZXJ2ZXItdG9vbC1kZXRhaWwnOiB7XG4gICAgICBjb25zdCBzZXJ2ZXJUb29scyA9IGZpbHRlclRvb2xzQnlTZXJ2ZXIobWNwLnRvb2xzLCB2aWV3U3RhdGUuc2VydmVyLm5hbWUpXG4gICAgICBjb25zdCB0b29sID0gc2VydmVyVG9vbHNbdmlld1N0YXRlLnRvb2xJbmRleF1cbiAgICAgIGlmICghdG9vbCkge1xuICAgICAgICBzZXRWaWV3U3RhdGUoeyB0eXBlOiAnc2VydmVyLXRvb2xzJywgc2VydmVyOiB2aWV3U3RhdGUuc2VydmVyIH0pXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TUNQVG9vbERldGFpbFZpZXdcbiAgICAgICAgICB0b29sPXt0b29sfVxuICAgICAgICAgIHNlcnZlcj17dmlld1N0YXRlLnNlcnZlcn1cbiAgICAgICAgICBvbkJhY2s9eygpID0+XG4gICAgICAgICAgICBzZXRWaWV3U3RhdGUoeyB0eXBlOiAnc2VydmVyLXRvb2xzJywgc2VydmVyOiB2aWV3U3RhdGUuc2VydmVyIH0pXG4gICAgICAgICAgfVxuICAgICAgICAvPlxuICAgICAgKVxuICAgIH1cblxuICAgIGNhc2UgJ2FnZW50LXNlcnZlci1tZW51JzpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxNQ1BBZ2VudFNlcnZlck1lbnVcbiAgICAgICAgICBhZ2VudFNlcnZlcj17dmlld1N0YXRlLmFnZW50U2VydmVyfVxuICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBzZXRWaWV3U3RhdGUoeyB0eXBlOiAnbGlzdCcsIGRlZmF1bHRUYWI6ICdBZ2VudHMnIH0pfVxuICAgICAgICAgIG9uQ29tcGxldGU9e29uQ29tcGxldGV9XG4gICAgICAgIC8+XG4gICAgICApXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSUMsU0FBUyxFQUFFQyxPQUFPLFFBQVEsT0FBTztBQUNqRCxjQUFjQyxvQkFBb0IsUUFBUSxtQkFBbUI7QUFDN0QsU0FBU0Msa0JBQWtCLFFBQVEsNEJBQTRCO0FBQy9ELGNBQ0VDLDRCQUE0QixFQUM1QkMsbUJBQW1CLEVBQ25CQyxrQkFBa0IsRUFDbEJDLG9CQUFvQixRQUNmLDZCQUE2QjtBQUNwQyxTQUNFQyxzQkFBc0IsRUFDdEJDLG1CQUFtQixRQUNkLDZCQUE2QjtBQUNwQyxTQUFTQyxXQUFXLFFBQVEseUJBQXlCO0FBQ3JELFNBQVNDLDBCQUEwQixRQUFRLG1DQUFtQztBQUM5RSxTQUFTQyxrQkFBa0IsUUFBUSx5QkFBeUI7QUFDNUQsU0FBU0MsWUFBWSxRQUFRLG1CQUFtQjtBQUNoRCxTQUFTQyxtQkFBbUIsUUFBUSwwQkFBMEI7QUFDOUQsU0FBU0Msa0JBQWtCLFFBQVEseUJBQXlCO0FBQzVELFNBQVNDLGlCQUFpQixRQUFRLHdCQUF3QjtBQUMxRCxTQUFTQyxlQUFlLFFB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