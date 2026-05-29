// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useRef } from 'react';
// 复用 MCPSettings 终端界面组件，避免在这里重复拼装显示逻辑。
import { MCPSettings } from '../../components/mcp/index.js';
// 复用 MCPReconnect 终端界面组件，避免在这里重复拼装显示逻辑。
import { MCPReconnect } from '../../components/mcp/MCPReconnect.js';
// 接入 useMcpToggleEnabled 服务层能力，把外部通信或共享状态交给 ../../services/mcp/MCPConnectionManager.js 处理。
import { useMcpToggleEnabled } from '../../services/mcp/MCPConnectionManager.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 引入 PluginSettings，将 ../plugin/PluginSettings.js 中已经封装好的能力接到本文件流程里。
import { PluginSettings } from '../plugin/PluginSettings.js';

// TODO: This is a hack to get the context value from toggleMcpServer (useContext only works in a component)
// Ideally, all MCP state and functions would be in global state.
// MCPToggle 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function MCPToggle(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    action,
    target,
    onComplete
  } = t0;
  // mcpClients 集合保存`useAppState`，供命令处理后续处理使用。
  const mcpClients = useAppState(_temp);
  // toggleMcpServer保存`useMcpToggleEnabled`，供命令处理后续处理使用。
  const toggleMcpServer = useMcpToggleEnabled();
  // didRun记录 `useRef` 是否成立，命令处理随后按该结果分支。
  const didRun = useRef(false);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== action || $[1] !== mcpClients || $[2] !== onComplete || $[3] !== target || $[4] !== toggleMcpServer) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 满足 `didRun.current` 时，命令处理执行该分支。
      if (didRun.current) {
        // 斜杠命令 mcp在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // current更新为 `true`，确保斜杠命令后续读取最新状态。
      didRun.current = true;
      // isEnabling标记命令处理斜杠命令 mcp是否启用对应路径。
      const isEnabling = action === "enable";
      // clients 集合筛选`mcpClients.filter`，供命令处理后续处理使用。
      const clients = mcpClients.filter(_temp2);
      // toToggle筛选`clients.filter`，供命令处理后续处理使用。
      const toToggle = target === "all" ? clients.filter(c_0 => isEnabling ? c_0.type === "disabled" : c_0.type !== "disabled") : clients.filter(c_1 => c_1.name === target);
      // toToggle为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
      if (toToggle.length === 0) {
        // 调用 onComplete，触发命令处理此处需要的副作用。
        onComplete(target === "all" ? `All MCP servers are already ${isEnabling ? "enabled" : "disabled"}` : `MCP server "${target}" not found`);
        // 斜杠命令 mcp在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 按顺序遍历 `toToggle` 中的s_0，逐个交给命令处理处理。
      for (const s_0 of toToggle) {
        // 调用 toggleMcpServer，触发命令处理此处需要的副作用。
        toggleMcpServer(s_0.name);
      }
      // 调用 onComplete，触发命令处理此处需要的副作用。
      onComplete(target === "all" ? `${isEnabling ? "Enabled" : "Disabled"} ${toToggle.length} MCP server(s)` : `MCP server "${target}" ${isEnabling ? "enabled" : "disabled"}`);
    };
    // t2 暂存 `[action, target, mcpClients, toggleMcpServer, onComplete]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [action, target, mcpClients, toggleMcpServer, onComplete];
    // $[0] 缓存 `action`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = action;
    // $[1] 缓存 `mcpClients`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = mcpClients;
    // $[2] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onComplete;
    // $[3] 缓存 `target`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = target;
    // $[4] 缓存 `toggleMcpServer`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = toggleMcpServer;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[5];
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t1, t2);
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
}
// _temp2 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(c) {
  // 返回 `c.name !== "ide"`，作为命令处理这次计算的结果。
  return c.name !== "ide";
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.mcp.clients`，作为命令处理这次计算的结果。
  return s.mcp.clients;
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, _context: unknown, args?: string): Promise<React.ReactNode> {
  // 满足 `args` 时，命令处理执行该分支。
  if (args) {
    // 片段列表格式化`args.trim`，供命令处理后续处理使用。
    const parts = args.trim().split(/\s+/);

    // Allow /mcp no-redirect to bypass the redirect for testing
    // 当 `parts[0]` 匹配 `'no-redirect'` 时，命令处理执行对应分支。
    if (parts[0] === 'no-redirect') {
      // 返回 `<MCPSettings onComplete={onDone} />`，作为命令处理这次计算的结果。
      return <MCPSettings onComplete={onDone} />;
    }
    // 只有 `parts[0] === 'reconnect' && parts[1]` 满足时，命令处理才执行该分支。
    if (parts[0] === 'reconnect' && parts[1]) {
      // 返回 `<MCPReconnect serverName={parts.slice(1).join(' ')} onComplete={onDone}...`，作为命令处理这次计算的结果。
      return <MCPReconnect serverName={parts.slice(1).join(' ')} onComplete={onDone} />;
    }
    // 当 `parts[0]` 匹配 `'enable' || parts[0] === 'd...` 时，命令处理执行对应分支。
    if (parts[0] === 'enable' || parts[0] === 'disable') {
      // 返回 `<MCPToggle action={parts[0]} target={parts.length > 1 ? parts.slice(1)....`，作为命令处理这次计算的结果。
      return <MCPToggle action={parts[0]} target={parts.length > 1 ? parts.slice(1).join(' ') : 'all'} onComplete={onDone} />;
    }
  }

  // Redirect base /mcp command to /plugins installed tab for ant users
  // 当 `"external"` 匹配 `'ant'` 时，命令处理执行对应分支。
  if ("external" === 'ant') {
    // 返回 `<PluginSettings onComplete={onDone} args="manage" showMcpRedirectMessag...`，作为命令处理这次计算的结果。
    return <PluginSettings onComplete={onDone} args="manage" showMcpRedirectMessage />;
  }
  // 返回 `<MCPSettings onComplete={onDone} />`，作为命令处理这次计算的结果。
  return <MCPSettings onComplete={onDone} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVJlZiIsIk1DUFNldHRpbmdzIiwiTUNQUmVjb25uZWN0IiwidXNlTWNwVG9nZ2xlRW5hYmxlZCIsInVzZUFwcFN0YXRlIiwiTG9jYWxKU1hDb21tYW5kT25Eb25lIiwiUGx1Z2luU2V0dGluZ3MiLCJNQ1BUb2dnbGUiLCJ0MCIsIiQiLCJfYyIsImFjdGlvbiIsInRhcmdldCIsIm9uQ29tcGxldGUiLCJtY3BDbGllbnRzIiwiX3RlbXAiLCJ0b2dnbGVNY3BTZXJ2ZXIiLCJkaWRSdW4iLCJ0MSIsInQyIiwiY3VycmVudCIsImlzRW5hYmxpbmciLCJjbGllbnRzIiwiZmlsdGVyIiwiX3RlbXAyIiwidG9Ub2dnbGUiLCJjXzAiLCJjIiwidHlwZSIsImNfMSIsIm5hbWUiLCJsZW5ndGgiLCJzXzAiLCJzIiwibWNwIiwiY2FsbCIsIm9uRG9uZSIsIl9jb250ZXh0IiwiYXJncyIsIlByb21pc2UiLCJSZWFjdE5vZGUiLCJwYXJ0cyIsInRyaW0iLCJzcGxpdCIsInNsaWNlIiwiam9pbiJdLCJzb3VyY2VzIjpbIm1jcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlUmVmIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBNQ1BTZXR0aW5ncyB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvbWNwL2luZGV4LmpzJ1xuaW1wb3J0IHsgTUNQUmVjb25uZWN0IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9tY3AvTUNQUmVjb25uZWN0LmpzJ1xuaW1wb3J0IHsgdXNlTWNwVG9nZ2xlRW5hYmxlZCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL21jcC9NQ1BDb25uZWN0aW9uTWFuYWdlci5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZE9uRG9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5pbXBvcnQgeyBQbHVnaW5TZXR0aW5ncyB9IGZyb20gJy4uL3BsdWdpbi9QbHVnaW5TZXR0aW5ncy5qcydcblxuLy8gVE9ETzogVGhpcyBpcyBhIGhhY2sgdG8gZ2V0IHRoZSBjb250ZXh0IHZhbHVlIGZyb20gdG9nZ2xlTWNwU2VydmVyICh1c2VDb250ZXh0IG9ubHkgd29ya3MgaW4gYSBjb21wb25lbnQpXG4vLyBJZGVhbGx5LCBhbGwgTUNQIHN0YXRlIGFuZCBmdW5jdGlvbnMgd291bGQgYmUgaW4gZ2xvYmFsIHN0YXRlLlxuZnVuY3Rpb24gTUNQVG9nZ2xlKHtcbiAgYWN0aW9uLFxuICB0YXJnZXQsXG4gIG9uQ29tcGxldGUsXG59OiB7XG4gIGFjdGlvbjogJ2VuYWJsZScgfCAnZGlzYWJsZSdcbiAgdGFyZ2V0OiBzdHJpbmdcbiAgb25Db21wbGV0ZTogKHJlc3VsdDogc3RyaW5nKSA9PiB2b2lkXG59KTogbnVsbCB7XG4gIGNvbnN0IG1jcENsaWVudHMgPSB1c2VBcHBTdGF0ZShzID0+IHMubWNwLmNsaWVudHMpXG4gIGNvbnN0IHRvZ2dsZU1jcFNlcnZlciA9IHVzZU1jcFRvZ2dsZUVuYWJsZWQoKVxuICBjb25zdCBkaWRSdW4gPSB1c2VSZWYoZmFsc2UpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZGlkUnVuLmN1cnJlbnQpIHJldHVyblxuICAgIGRpZFJ1bi5jdXJyZW50ID0gdHJ1ZVxuXG4gICAgY29uc3QgaXNFbmFibGluZyA9IGFjdGlvbiA9PT0gJ2VuYWJsZSdcbiAgICBjb25zdCBjbGllbnRzID0gbWNwQ2xpZW50cy5maWx0ZXIoYyA9PiBjLm5hbWUgIT09ICdpZGUnKVxuICAgIGNvbnN0IHRvVG9nZ2xlID1cbiAgICAgIHRhcmdldCA9PT0gJ2FsbCdcbiAgICAgICAgPyBjbGllbnRzLmZpbHRlcihjID0+XG4gICAgICAgICAgICBpc0VuYWJsaW5nID8gYy50eXBlID09PSAnZGlzYWJsZWQnIDogYy50eXBlICE9PSAnZGlzYWJsZWQnLFxuICAgICAgICAgIClcbiAgICAgICAgOiBjbGllbnRzLmZpbHRlcihjID0+IGMubmFtZSA9PT0gdGFyZ2V0KVxuXG4gICAgaWYgKHRvVG9nZ2xlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgb25Db21wbGV0ZShcbiAgICAgICAgdGFyZ2V0ID09PSAnYWxsJ1xuICAgICAgICAgID8gYEFsbCBNQ1Agc2VydmVycyBhcmUgYWxyZWFkeSAke2lzRW5hYmxpbmcgPyAnZW5hYmxlZCcgOiAnZGlzYWJsZWQnfWBcbiAgICAgICAgICA6IGBNQ1Agc2VydmVyIFwiJHt0YXJnZXR9XCIgbm90IGZvdW5kYCxcbiAgICAgIClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGZvciAoY29uc3QgcyBvZiB0b1RvZ2dsZSkge1xuICAgICAgdm9pZCB0b2dnbGVNY3BTZXJ2ZXIocy5uYW1lKVxuICAgIH1cblxuICAgIG9uQ29tcGxldGUoXG4gICAgICB0YXJnZXQgPT09ICdhbGwnXG4gICAgICAgID8gYCR7aXNFbmFibGluZyA/ICdFbmFibGVkJyA6ICdEaXNhYmxlZCd9ICR7dG9Ub2dnbGUubGVuZ3RofSBNQ1Agc2VydmVyKHMpYFxuICAgICAgICA6IGBNQ1Agc2VydmVyIFwiJHt0YXJnZXR9XCIgJHtpc0VuYWJsaW5nID8gJ2VuYWJsZWQnIDogJ2Rpc2FibGVkJ31gLFxuICAgIClcbiAgfSwgW2FjdGlvbiwgdGFyZ2V0LCBtY3BDbGllbnRzLCB0b2dnbGVNY3BTZXJ2ZXIsIG9uQ29tcGxldGVdKVxuXG4gIHJldHVybiBudWxsXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsKFxuICBvbkRvbmU6IExvY2FsSlNYQ29tbWFuZE9uRG9uZSxcbiAgX2NvbnRleHQ6IHVua25vd24sXG4gIGFyZ3M/OiBzdHJpbmcsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZT4ge1xuICBpZiAoYXJncykge1xuICAgIGNvbnN0IHBhcnRzID0gYXJncy50cmltKCkuc3BsaXQoL1xccysvKVxuXG4gICAgLy8gQWxsb3cgL21jcCBuby1yZWRpcmVjdCB0byBieXBhc3MgdGhlIHJlZGlyZWN0IGZvciB0ZXN0aW5nXG4gICAgaWYgKHBhcnRzWzBdID09PSAnbm8tcmVkaXJlY3QnKSB7XG4gICAgICByZXR1cm4gPE1DUFNldHRpbmdzIG9uQ29tcGxldGU9e29uRG9uZX0gLz5cbiAgICB9XG5cbiAgICBpZiAocGFydHNbMF0gPT09ICdyZWNvbm5lY3QnICYmIHBhcnRzWzFdKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TUNQUmVjb25uZWN0XG4gICAgICAgICAgc2VydmVyTmFtZT17cGFydHMuc2xpY2UoMSkuam9pbignICcpfVxuICAgICAgICAgIG9uQ29tcGxldGU9e29uRG9uZX1cbiAgICAgICAgLz5cbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAocGFydHNbMF0gPT09ICdlbmFibGUnIHx8IHBhcnRzWzBdID09PSAnZGlzYWJsZScpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxNQ1BUb2dnbGVcbiAgICAgICAgICBhY3Rpb249e3BhcnRzWzBdfVxuICAgICAgICAgIHRhcmdldD17cGFydHMubGVuZ3RoID4gMSA/IHBhcnRzLnNsaWNlKDEpLmpvaW4oJyAnKSA6ICdhbGwnfVxuICAgICAgICAgIG9uQ29tcGxldGU9e29uRG9uZX1cbiAgICAgICAgLz5cbiAgICAgIClcbiAgICB9XG4gIH1cblxuICAvLyBSZWRpcmVjdCBiYXNlIC9tY3AgY29tbWFuZCB0byAvcGx1Z2lucyBpbnN0YWxsZWQgdGFiIGZvciBhbnQgdXNlcnNcbiAgaWYgKFwiZXh0ZXJuYWxcIiA9PT0gJ2FudCcpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPFBsdWdpblNldHRpbmdzXG4gICAgICAgIG9uQ29tcGxldGU9e29uRG9uZX1cbiAgICAgICAgYXJncz1cIm1hbmFnZVwiXG4gICAgICAgIHNob3dNY3BSZWRpcmVjdE1lc3NhZ2VcbiAgICAgIC8+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIDxNQ1BTZXR0aW5ncyBvbkNvbXBsZXRlPXtvbkRvbmV9IC8+XG59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