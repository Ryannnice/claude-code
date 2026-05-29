// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、createContext、ReactNode、useContext、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, type ReactNode, useContext, useMemo } from 'react';
// 类型依赖 { Command } 来自 ../../commands.js，用于校准MCP 服务的数据契约。
import type { Command } from '../../commands.js';
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准MCP 服务的数据契约。
import type { Tool } from '../../Tool.js';
// 类型依赖 { MCPServerConnection, ScopedMcpServerConfig, ServerResourc… 来自 ./types.js，用于校准MCP 服务的数据契约。
import type { MCPServerConnection, ScopedMcpServerConfig, ServerResource } from './types.js';
// 引入 useManageMCPConnections，将 ./useManageMCPConnections.js 中已经封装好的能力接到本文件流程里。
import { useManageMCPConnections } from './useManageMCPConnections.js';
// MCPConnectionContextValue 描述MCP 服务需要实现的字段和回调，避免跨模块交互时契约漂移。
interface MCPConnectionContextValue {
  // 这个回调绑定到 reconnectMcpServer: (serverName: string) => Promise<{，负责MCP 服务在该局部场景下的响应。
  reconnectMcpServer: (serverName: string) => Promise<{
    client: MCPServerConnection;
    tools: Tool[];
    commands: Command[];
    resources?: ServerResource[];
  }>;
  // 这个回调绑定到 toggleMcpServer: (serverName: string) => Promise<void>;，负责MCP 服务在该局部场景下的响应。
  toggleMcpServer: (serverName: string) => Promise<void>;
}
// MCPConnectionContext构建`createContext<MCPConnectionContextValue | null>(null)` 整理出中间结果，供MCP 服务MCP 服务 MCPConnection Manager后续步骤使用。
const MCPConnectionContext = createContext<MCPConnectionContextValue | null>(null);
// useMcpReconnect 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMcpReconnect() {
  // 上下文保存`useContext`，供MCP 服务后续处理使用。
  const context = useContext(MCPConnectionContext);
  // context缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!context) {
    // 抛出 new Error("useMcpReconnect must be used within MCPConnectionManager");，阻止MCP 服务在无效状态下继续运行。
    throw new Error("useMcpReconnect must be used within MCPConnectionManager");
  }
  // 返回 `context.reconnectMcpServer`，作为MCP 服务这次计算的结果。
  return context.reconnectMcpServer;
}
// useMcpToggleEnabled 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMcpToggleEnabled() {
  // 上下文保存`useContext`，供MCP 服务后续处理使用。
  const context = useContext(MCPConnectionContext);
  // context缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!context) {
    // 抛出 new Error("useMcpToggleEnabled must be used within MCPConnectionManager");，阻止MCP 服务在无效状态下继续运行。
    throw new Error("useMcpToggleEnabled must be used within MCPConnectionManager");
  }
  // 返回 `context.toggleMcpServer`，作为MCP 服务这次计算的结果。
  return context.toggleMcpServer;
}
// MCPConnectionManagerProps 描述MCP 服务需要实现的字段和回调，避免跨模块交互时契约漂移。
interface MCPConnectionManagerProps {
  children: ReactNode;
  dynamicMcpConfig: Record<string, ScopedMcpServerConfig> | undefined;
  isStrictMcpConfig: boolean;
}

// TODO (ollie): We may be able to get rid of this context by putting these function on app state
// MCPConnectionManager 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MCPConnectionManager(t0) {
  // $保存`_c`，供MCP 服务后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children,
    dynamicMcpConfig,
    isStrictMcpConfig
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    reconnectMcpServer,
    toggleMcpServer
  } = useManageMCPConnections(dynamicMcpConfig, isStrictMcpConfig);
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== reconnectMcpServer || $[1] !== toggleMcpServer) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      reconnectMcpServer,
      toggleMcpServer
    };
    // $[0] 缓存 `reconnectMcpServer`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = reconnectMcpServer;
    // $[1] 缓存 `toggleMcpServer`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = toggleMcpServer;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // 取值 命名 `t1`，让后续代码直接表达这个值的用途。
  const value = t1;
  // t2 暂存 `<MCPConnectionContext.Provider value={value}>{children}</...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== children || $[4] !== value) {
    // t2 暂存 `<MCPConnectionContext.Provider value={value}>{children}</...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <MCPConnectionContext.Provider value={value}>{children}</MCPConnectionContext.Provider>;
    // $[3] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = children;
    // $[4] 缓存 `value`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = value;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 返回 `t2`，作为MCP 服务这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJSZWFjdE5vZGUiLCJ1c2VDb250ZXh0IiwidXNlTWVtbyIsIkNvbW1hbmQiLCJUb29sIiwiTUNQU2VydmVyQ29ubmVjdGlvbiIsIlNjb3BlZE1jcFNlcnZlckNvbmZpZyIsIlNlcnZlclJlc291cmNlIiwidXNlTWFuYWdlTUNQQ29ubmVjdGlvbnMiLCJNQ1BDb25uZWN0aW9uQ29udGV4dFZhbHVlIiwicmVjb25uZWN0TWNwU2VydmVyIiwic2VydmVyTmFtZSIsIlByb21pc2UiLCJjbGllbnQiLCJ0b29scyIsImNvbW1hbmRzIiwicmVzb3VyY2VzIiwidG9nZ2xlTWNwU2VydmVyIiwiTUNQQ29ubmVjdGlvbkNvbnRleHQiLCJ1c2VNY3BSZWNvbm5lY3QiLCJjb250ZXh0IiwiRXJyb3IiLCJ1c2VNY3BUb2dnbGVFbmFibGVkIiwiTUNQQ29ubmVjdGlvbk1hbmFnZXJQcm9wcyIsImNoaWxkcmVuIiwiZHluYW1pY01jcENvbmZpZyIsIlJlY29yZCIsImlzU3RyaWN0TWNwQ29uZmlnIiwiTUNQQ29ubmVjdGlvbk1hbmFnZXIiLCJ0MCIsIiQiLCJfYyIsInQxIiwidmFsdWUiLCJ0MiJdLCJzb3VyY2VzIjpbIk1DUENvbm5lY3Rpb25NYW5hZ2VyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHtcbiAgY3JlYXRlQ29udGV4dCxcbiAgdHlwZSBSZWFjdE5vZGUsXG4gIHVzZUNvbnRleHQsXG4gIHVzZU1lbW8sXG59IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBDb21tYW5kIH0gZnJvbSAnLi4vLi4vY29tbWFuZHMuanMnXG5pbXBvcnQgdHlwZSB7IFRvb2wgfSBmcm9tICcuLi8uLi9Ub29sLmpzJ1xuaW1wb3J0IHR5cGUge1xuICBNQ1BTZXJ2ZXJDb25uZWN0aW9uLFxuICBTY29wZWRNY3BTZXJ2ZXJDb25maWcsXG4gIFNlcnZlclJlc291cmNlLFxufSBmcm9tICcuL3R5cGVzLmpzJ1xuaW1wb3J0IHsgdXNlTWFuYWdlTUNQQ29ubmVjdGlvbnMgfSBmcm9tICcuL3VzZU1hbmFnZU1DUENvbm5lY3Rpb25zLmpzJ1xuXG5pbnRlcmZhY2UgTUNQQ29ubmVjdGlvbkNvbnRleHRWYWx1ZSB7XG4gIHJlY29ubmVjdE1jcFNlcnZlcjogKHNlcnZlck5hbWU6IHN0cmluZykgPT4gUHJvbWlzZTx7XG4gICAgY2xpZW50OiBNQ1BTZXJ2ZXJDb25uZWN0aW9uXG4gICAgdG9vbHM6IFRvb2xbXVxuICAgIGNvbW1hbmRzOiBDb21tYW5kW11cbiAgICByZXNvdXJjZXM/OiBTZXJ2ZXJSZXNvdXJjZVtdXG4gIH0+XG4gIHRvZ2dsZU1jcFNlcnZlcjogKHNlcnZlck5hbWU6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPlxufVxuXG5jb25zdCBNQ1BDb25uZWN0aW9uQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQ8TUNQQ29ubmVjdGlvbkNvbnRleHRWYWx1ZSB8IG51bGw+KFxuICBudWxsLFxuKVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlTWNwUmVjb25uZWN0KCkge1xuICBjb25zdCBjb250ZXh0ID0gdXNlQ29udGV4dChNQ1BDb25uZWN0aW9uQ29udGV4dClcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1c2VNY3BSZWNvbm5lY3QgbXVzdCBiZSB1c2VkIHdpdGhpbiBNQ1BDb25uZWN0aW9uTWFuYWdlcicpXG4gIH1cbiAgcmV0dXJuIGNvbnRleHQucmVjb25uZWN0TWNwU2VydmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VNY3BUb2dnbGVFbmFibGVkKCkge1xuICBjb25zdCBjb250ZXh0ID0gdXNlQ29udGV4dChNQ1BDb25uZWN0aW9uQ29udGV4dClcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ3VzZU1jcFRvZ2dsZUVuYWJsZWQgbXVzdCBiZSB1c2VkIHdpdGhpbiBNQ1BDb25uZWN0aW9uTWFuYWdlcicsXG4gICAgKVxuICB9XG4gIHJldHVybiBjb250ZXh0LnRvZ2dsZU1jcFNlcnZlclxufVxuXG5pbnRlcmZhY2UgTUNQQ29ubmVjdGlvbk1hbmFnZXJQcm9wcyB7XG4gIGNoaWxkcmVuOiBSZWFjdE5vZGVcbiAgZHluYW1pY01jcENvbmZpZzogUmVjb3JkPHN0cmluZywgU2NvcGVkTWNwU2VydmVyQ29uZmlnPiB8IHVuZGVmaW5lZFxuICBpc1N0cmljdE1jcENvbmZpZzogYm9vbGVhblxufVxuXG4vLyBUT0RPIChvbGxpZSk6IFdlIG1heSBiZSBhYmxlIHRvIGdldCByaWQgb2YgdGhpcyBjb250ZXh0IGJ5IHB1dHRpbmcgdGhlc2UgZnVuY3Rpb24gb24gYXBwIHN0YXRlXG5leHBvcnQgZnVuY3Rpb24gTUNQQ29ubmVjdGlvbk1hbmFnZXIoe1xuICBjaGlsZHJlbixcbiAgZHluYW1pY01jcENvbmZpZyxcbiAgaXNTdHJpY3RNY3BDb25maWcsXG59OiBNQ1BDb25uZWN0aW9uTWFuYWdlclByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyByZWNvbm5lY3RNY3BTZXJ2ZXIsIHRvZ2dsZU1jcFNlcnZlciB9ID0gdXNlTWFuYWdlTUNQQ29ubmVjdGlvbnMoXG4gICAgZHluYW1pY01jcENvbmZpZyxcbiAgICBpc1N0cmljdE1jcENvbmZpZyxcbiAgKVxuICBjb25zdCB2YWx1ZSA9IHVzZU1lbW8oXG4gICAgKCkgPT4gKHsgcmVjb25uZWN0TWNwU2VydmVyLCB0b2dnbGVNY3BTZXJ2ZXIgfSksXG4gICAgW3JlY29ubmVjdE1jcFNlcnZlciwgdG9nZ2xlTWNwU2VydmVyXSxcbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPE1DUENvbm5lY3Rpb25Db250ZXh0LlByb3ZpZGVyIHZhbHVlPXt2YWx1ZX0+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9NQ1BDb25uZWN0aW9uQ29udGV4dC5Qcm92aWRlcj5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUNWQyxhQUFhLEVBQ2IsS0FBS0MsU0FBUyxFQUNkQyxVQUFVLEVBQ1ZDLE9BQU8sUUFDRixPQUFPO0FBQ2QsY0FBY0MsT0FBTyxRQUFRLG1CQUFtQjtBQUNoRCxjQUFjQyxJQUFJLFFBQVEsZUFBZTtBQUN6QyxjQUNFQyxtQkFBbUIsRUFDbkJDLHFCQUFxQixFQUNyQkMsY0FBYyxRQUNULFlBQVk7QUFDbkIsU0FBU0MsdUJBQXVCLFFBQVEsOEJBQThCO0FBRXRFLFVBQVVDLHlCQUF5QixDQUFDO0VBQ2xDQyxrQkFBa0IsRUFBRSxDQUFDQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUdDLE9BQU8sQ0FBQztJQUNsREMsTUFBTSxFQUFFUixtQkFBbUI7SUFDM0JTLEtBQUssRUFBRVYsSUFBSSxFQUFFO0lBQ2JXLFFBQVEsRUFBRVosT0FBTyxFQUFFO0lBQ25CYSxTQUFTLENBQUMsRUFBRVQsY0FBYyxFQUFFO0VBQzlCLENBQUMsQ0FBQztFQUNGVSxlQUFlLEVBQUUsQ0FBQ04sVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ3hEO0FBRUEsTUFBTU0sb0JBQW9CLEdBQUduQixhQUFhLENBQUNVLHlCQUF5QixHQUFHLElBQUksQ0FBQyxDQUMxRSxJQUNGLENBQUM7QUFFRCxPQUFPLFNBQUFVLGdCQUFBO0VBQ0wsTUFBQUMsT0FBQSxHQUFnQm5CLFVBQVUsQ0FBQ2lCLG9CQUFvQixDQUFDO0VBQ2hELElBQUksQ0FBQ0UsT0FBTztJQUNWLE1BQU0sSUFBSUMsS0FBSyxDQUFDLDBEQUEwRCxDQUFDO0VBQUE7RUFDNUUsT0FDTUQsT0FBTyxDQUFBVixrQkFBbUI7QUFBQTtBQUduQyxPQUFPLFNBQUFZLG9CQUFBO0VBQ0wsTUFBQUYsT0FBQSxHQUFnQm5CLFVBQVUsQ0FBQ2lCLG9CQUFvQixDQUFDO0VBQ2hELElBQUksQ0FBQ0UsT0FBTztJQUNWLE1BQU0sSUFBSUMsS0FBSyxDQUNiLDhEQUNGLENBQUM7RUFBQTtFQUNGLE9BQ01ELE9BQU8sQ0FBQUgsZUFBZ0I7QUFBQTtBQUdoQyxVQUFVTSx5QkFBeUIsQ0FBQztFQUNsQ0MsUUFBUSxFQUFFeEIsU0FBUztFQUNuQnlCLGdCQUFnQixFQUFFQyxNQUFNLENBQUMsTUFBTSxFQUFFcEIscUJBQXFCLENBQUMsR0FBRyxTQUFTO0VBQ25FcUIsaUJBQWlCLEVBQUUsT0FBTztBQUM1Qjs7QUFFQTtBQUNBLE9BQU8sU0FBQUMscUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBOEI7SUFBQVAsUUFBQTtJQUFBQyxnQkFBQTtJQUFBRTtFQUFBLElBQUFFLEVBSVQ7RUFDMUI7SUFBQW5CLGtCQUFBO0lBQUFPO0VBQUEsSUFBZ0RULHVCQUF1QixDQUNyRWlCLGdCQUFnQixFQUNoQkUsaUJBQ0YsQ0FBQztFQUFBLElBQUFLLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFwQixrQkFBQSxJQUFBb0IsQ0FBQSxRQUFBYixlQUFBO0lBRVFlLEVBQUE7TUFBQXRCLGtCQUFBO01BQUFPO0lBQXNDLENBQUM7SUFBQWEsQ0FBQSxNQUFBcEIsa0JBQUE7SUFBQW9CLENBQUEsTUFBQWIsZUFBQTtJQUFBYSxDQUFBLE1BQUFFLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFGLENBQUE7RUFBQTtFQURoRCxNQUFBRyxLQUFBLEdBQ1NELEVBQXVDO0VBRS9DLElBQUFFLEVBQUE7RUFBQSxJQUFBSixDQUFBLFFBQUFOLFFBQUEsSUFBQU0sQ0FBQSxRQUFBRyxLQUFBO0lBR0NDLEVBQUEsa0NBQXNDRCxLQUFLLENBQUxBLE1BQUksQ0FBQyxDQUN4Q1QsU0FBTyxDQUNWLGdDQUFnQztJQUFBTSxDQUFBLE1BQUFOLFFBQUE7SUFBQU0sQ0FBQSxNQUFBRyxLQUFBO0lBQUFILENBQUEsTUFBQUksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUosQ0FBQTtFQUFBO0VBQUEsT0FGaENJLEVBRWdDO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=