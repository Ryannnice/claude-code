// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useState } from 'react';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准终端渲染的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 引入 Box、color、Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, color, Text, useTheme } from '../../ink.js';
// 接入 useMcpReconnect 服务层能力，把外部通信或共享状态交给 ../../services/mcp/MCPConnectionManager.js 处理。
import { useMcpReconnect } from '../../services/mcp/MCPConnectionManager.js';
// 引入 useAppStateStore，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppStateStore } from '../../state/AppState.js';
// 引入 Spinner，将 ../Spinner.js 中已经封装好的能力接到本文件流程里。
import { Spinner } from '../Spinner.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  serverName: string;
  onComplete: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
};
// MCPReconnect 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MCPReconnect(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(25);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    serverName,
    onComplete
  } = t0;
  // 从 `useTheme()` 按位置拆出 theme，让MCP 界面组件 MCPReconnect分别处理这些返回值。
  const [theme] = useTheme();
  // store保存`useAppStateStore`，供终端渲染后续处理使用。
  const store = useAppStateStore();
  // reconnectMcpServer保存`useMcpReconnect`，供终端渲染后续处理使用。
  const reconnectMcpServer = useMcpReconnect();
  // isReconnecting 由 React state 持有，setIsReconnecting 会在用户操作或异步结果返回时触发刷新。
  const [isReconnecting, setIsReconnecting] = useState(true);
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onComplete || $[1] !== reconnectMcpServer || $[2] !== serverName || $[3] !== store) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // attemptReconnect保存`attemptReconnect`，供终端渲染后续处理使用。
      const attemptReconnect = async function attemptReconnect() {
        // MCP 界面组件 MCPReconnect在这里处理 ``，完成这一小步状态转换。
        ;
        // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
        try {
          // server读取`store.getState`，供终端渲染后续处理使用。
          const server = store.getState().mcp.clients.find(c => c.name === serverName);
          // server缺失时直接走兜底路径，避免终端渲染使用无效输入。
          if (!server) {
            // setError 写入新的状态值，使终端渲染后续读取保持一致。
            setError(`MCP server "${serverName}" not found`);
            // setIsReconnecting 写入新的状态值，使终端渲染后续读取保持一致。
            setIsReconnecting(false);
            // 调用 onComplete，触发终端渲染此处需要的副作用。
            onComplete(`MCP server "${serverName}" not found`);
            // MCP 界面组件 MCPReconnect在这里结束当前路径，避免继续执行不适用的后续分支。
            return;
          }
          // 结果保存`reconnectMcpServer`，供终端渲染后续处理使用。
          const result = await reconnectMcpServer(serverName);
          // MCP 界面组件 MCPReconnect在这里处理 `bb43: switch (result.client.type) {`，完成这一小步状态转换。
          bb43: switch (result.client.type) {
            case "connected":
              {
                // setIsReconnecting 写入新的状态值，使终端渲染后续读取保持一致。
                setIsReconnecting(false);
                // 调用 onComplete，触发终端渲染此处需要的副作用。
                onComplete(`Successfully reconnected to ${serverName}`);
                // 结束这个分支或循环，避免终端渲染继续落入后续路径。
                break bb43;
              }
            case "needs-auth":
              {
                // setError 写入新的状态值，使终端渲染后续读取保持一致。
                setError(`${serverName} requires authentication`);
                // setIsReconnecting 写入新的状态值，使终端渲染后续读取保持一致。
                setIsReconnecting(false);
                // 调用 onComplete，触发终端渲染此处需要的副作用。
                onComplete(`${serverName} requires authentication. Use /mcp to authenticate.`);
                // 结束这个分支或循环，避免终端渲染继续落入后续路径。
                break bb43;
              }
            case "pending":
            case "failed":
            case "disabled":
              {
                // setError 写入新的状态值，使终端渲染后续读取保持一致。
                setError(`Failed to reconnect to ${serverName}`);
                // setIsReconnecting 写入新的状态值，使终端渲染后续读取保持一致。
                setIsReconnecting(false);
                // 调用 onComplete，触发终端渲染此处需要的副作用。
                onComplete(`Failed to reconnect to ${serverName}`);
              }
          }
        } catch (t3) {
          // err保存`t3`，作为后续临时缓存值处理的输入。
          const err = t3;
          // errorMessage 消息数据保存`String`，供终端渲染后续处理使用。
          const errorMessage = err instanceof Error ? err.message : String(err);
          // setError 写入新的状态值，使终端渲染后续读取保持一致。
          setError(errorMessage);
          // setIsReconnecting 写入新的状态值，使终端渲染后续读取保持一致。
          setIsReconnecting(false);
          // 调用 onComplete，触发终端渲染此处需要的副作用。
          onComplete(`Error: ${errorMessage}`);
        }
      };
      // 调用 attemptReconnect，触发终端渲染此处需要的副作用。
      attemptReconnect();
    };
    // t2 暂存 `[serverName, reconnectMcpServer, store, onComplete]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [serverName, reconnectMcpServer, store, onComplete];
    // $[0] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onComplete;
    // $[1] 缓存 `reconnectMcpServer`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = reconnectMcpServer;
    // $[2] 缓存 `serverName`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = serverName;
    // $[3] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = store;
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
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t1, t2);
  // 满足 `isReconnecting` 时，终端渲染执行该分支。
  if (isReconnecting) {
    // t3 暂存 `<Text color="text">Reconnecting to <Text bold={true}>{ser...` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[6] !== serverName) {
      // t3 暂存 `<Text color="text">Reconnecting to <Text bold={true}>{ser...` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text color="text">Reconnecting to <Text bold={true}>{serverName}</Text></Text>;
      // $[6] 缓存 `serverName`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = serverName;
      // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[7];
    }
    // t4 暂存 `<Box><Spinner /><Text> Establishing connection to MCP ser...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      // t4 暂存 `<Box><Spinner /><Text> Establishing connection to MCP ser...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Box><Spinner /><Text> Establishing connection to MCP server</Text></Box>;
      // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[8];
    }
    // t5 暂存 `<Box flexDirection="column" gap={1} padding={1}>{t3}{t4}<...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[9] !== t3) {
      // t5 暂存 `<Box flexDirection="column" gap={1} padding={1}>{t3}{t4}<...` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Box flexDirection="column" gap={1} padding={1}>{t3}{t4}</Box>;
      // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t3;
      // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[10];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // 满足 `error` 时，终端渲染执行该分支。
  if (error) {
    // t3 暂存 `color("error", theme)(figures.cross)` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[11] !== theme) {
      // t3 暂存 `color("error", theme)(figures.cross)` 生成的渲染片段，后续返回路径直接复用。
      t3 = color("error", theme)(figures.cross);
      // $[11] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = theme;
      // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[12];
    }
    // t4 暂存 `<Text>{t3} </Text>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[13] !== t3) {
      // t4 暂存 `<Text>{t3} </Text>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text>{t3} </Text>;
      // $[13] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t3;
      // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[14];
    }
    // t5 暂存 `<Text color="error">Failed to reconnect to {serverName}</...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[15] !== serverName) {
      // t5 暂存 `<Text color="error">Failed to reconnect to {serverName}</...` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text color="error">Failed to reconnect to {serverName}</Text>;
      // $[15] 缓存 `serverName`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = serverName;
      // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[16];
    }
    // t6 暂存 `<Box>{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[17] !== t4 || $[18] !== t5) {
      // t6 暂存 `<Box>{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Box>{t4}{t5}</Box>;
      // $[17] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t4;
      // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t5;
      // $[19] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[19];
    }
    // t7 暂存 `<Text dimColor={true}>Error: {error}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[20] !== error) {
      // t7 暂存 `<Text dimColor={true}>Error: {error}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Text dimColor={true}>Error: {error}</Text>;
      // $[20] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = error;
      // $[21] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[21];
    }
    // t8 暂存 `<Box flexDirection="column" gap={1} padding={1}>{t6}{t7}<...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[22] !== t6 || $[23] !== t7) {
      // t8 暂存 `<Box flexDirection="column" gap={1} padding={1}>{t6}{t7}<...` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Box flexDirection="column" gap={1} padding={1}>{t6}{t7}</Box>;
      // $[22] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t6;
      // $[23] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = t7;
      // $[24] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[24];
    }
    // 返回 `t8`，作为终端渲染这次计算的结果。
    return t8;
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VFZmZlY3QiLCJ1c2VTdGF0ZSIsIkNvbW1hbmRSZXN1bHREaXNwbGF5IiwiQm94IiwiY29sb3IiLCJUZXh0IiwidXNlVGhlbWUiLCJ1c2VNY3BSZWNvbm5lY3QiLCJ1c2VBcHBTdGF0ZVN0b3JlIiwiU3Bpbm5lciIsIlByb3BzIiwic2VydmVyTmFtZSIsIm9uQ29tcGxldGUiLCJyZXN1bHQiLCJvcHRpb25zIiwiZGlzcGxheSIsIk1DUFJlY29ubmVjdCIsInQwIiwiJCIsIl9jIiwidGhlbWUiLCJzdG9yZSIsInJlY29ubmVjdE1jcFNlcnZlciIsImlzUmVjb25uZWN0aW5nIiwic2V0SXNSZWNvbm5lY3RpbmciLCJlcnJvciIsInNldEVycm9yIiwidDEiLCJ0MiIsImF0dGVtcHRSZWNvbm5lY3QiLCJzZXJ2ZXIiLCJnZXRTdGF0ZSIsIm1jcCIsImNsaWVudHMiLCJmaW5kIiwiYyIsIm5hbWUiLCJiYjQzIiwiY2xpZW50IiwidHlwZSIsInQzIiwiZXJyIiwiZXJyb3JNZXNzYWdlIiwiRXJyb3IiLCJtZXNzYWdlIiwiU3RyaW5nIiwidDQiLCJTeW1ib2wiLCJmb3IiLCJ0NSIsImNyb3NzIiwidDYiLCJ0NyIsInQ4Il0sInNvdXJjZXMiOlsiTUNQUmVjb25uZWN0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgQ29tbWFuZFJlc3VsdERpc3BsYXkgfSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcbmltcG9ydCB7IEJveCwgY29sb3IsIFRleHQsIHVzZVRoZW1lIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlTWNwUmVjb25uZWN0IH0gZnJvbSAnLi4vLi4vc2VydmljZXMvbWNwL01DUENvbm5lY3Rpb25NYW5hZ2VyLmpzJ1xuaW1wb3J0IHsgdXNlQXBwU3RhdGVTdG9yZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0YXRlLmpzJ1xuaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gJy4uL1NwaW5uZXIuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIHNlcnZlck5hbWU6IHN0cmluZ1xuICBvbkNvbXBsZXRlOiAoXG4gICAgcmVzdWx0Pzogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiB7IGRpc3BsYXk/OiBDb21tYW5kUmVzdWx0RGlzcGxheSB9LFxuICApID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE1DUFJlY29ubmVjdCh7XG4gIHNlcnZlck5hbWUsXG4gIG9uQ29tcGxldGUsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZV0gPSB1c2VUaGVtZSgpXG4gIGNvbnN0IHN0b3JlID0gdXNlQXBwU3RhdGVTdG9yZSgpXG4gIGNvbnN0IHJlY29ubmVjdE1jcFNlcnZlciA9IHVzZU1jcFJlY29ubmVjdCgpXG4gIGNvbnN0IFtpc1JlY29ubmVjdGluZywgc2V0SXNSZWNvbm5lY3RpbmddID0gdXNlU3RhdGUodHJ1ZSlcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYXN5bmMgZnVuY3Rpb24gYXR0ZW1wdFJlY29ubmVjdCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIENoZWNrIGlmIHNlcnZlciBleGlzdHMuIFJlYWQgdmlhIHN0b3JlLmdldFN0YXRlKCkgaW5zdGVhZCBvZiBhXG4gICAgICAgIC8vIHJlYWN0aXZlIHNlbGVjdG9yIHNvIHRoaXMgZWZmZWN0IGRvZXMgbm90IHJlLWZpcmUgd2hlblxuICAgICAgICAvLyByZWNvbm5lY3RNY3BTZXJ2ZXIgdXBkYXRlcyBtY3AuY2xpZW50cyB2aWEgb25Db25uZWN0aW9uQXR0ZW1wdC5cbiAgICAgICAgY29uc3Qgc2VydmVyID0gc3RvcmVcbiAgICAgICAgICAuZ2V0U3RhdGUoKVxuICAgICAgICAgIC5tY3AuY2xpZW50cy5maW5kKGMgPT4gYy5uYW1lID09PSBzZXJ2ZXJOYW1lKVxuICAgICAgICBpZiAoIXNlcnZlcikge1xuICAgICAgICAgIHNldEVycm9yKGBNQ1Agc2VydmVyIFwiJHtzZXJ2ZXJOYW1lfVwiIG5vdCBmb3VuZGApXG4gICAgICAgICAgc2V0SXNSZWNvbm5lY3RpbmcoZmFsc2UpXG4gICAgICAgICAgb25Db21wbGV0ZShgTUNQIHNlcnZlciBcIiR7c2VydmVyTmFtZX1cIiBub3QgZm91bmRgKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXR0ZW1wdCByZWNvbm5lY3Rpb25cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVjb25uZWN0TWNwU2VydmVyKHNlcnZlck5hbWUpXG5cbiAgICAgICAgc3dpdGNoIChyZXN1bHQuY2xpZW50LnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdjb25uZWN0ZWQnOlxuICAgICAgICAgICAgc2V0SXNSZWNvbm5lY3RpbmcoZmFsc2UpXG4gICAgICAgICAgICBvbkNvbXBsZXRlKGBTdWNjZXNzZnVsbHkgcmVjb25uZWN0ZWQgdG8gJHtzZXJ2ZXJOYW1lfWApXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ25lZWRzLWF1dGgnOlxuICAgICAgICAgICAgc2V0RXJyb3IoYCR7c2VydmVyTmFtZX0gcmVxdWlyZXMgYXV0aGVudGljYXRpb25gKVxuICAgICAgICAgICAgc2V0SXNSZWNvbm5lY3RpbmcoZmFsc2UpXG4gICAgICAgICAgICBvbkNvbXBsZXRlKFxuICAgICAgICAgICAgICBgJHtzZXJ2ZXJOYW1lfSByZXF1aXJlcyBhdXRoZW50aWNhdGlvbi4gVXNlIC9tY3AgdG8gYXV0aGVudGljYXRlLmAsXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ3BlbmRpbmcnOlxuICAgICAgICAgIGNhc2UgJ2ZhaWxlZCc6XG4gICAgICAgICAgY2FzZSAnZGlzYWJsZWQnOlxuICAgICAgICAgICAgc2V0RXJyb3IoYEZhaWxlZCB0byByZWNvbm5lY3QgdG8gJHtzZXJ2ZXJOYW1lfWApXG4gICAgICAgICAgICBzZXRJc1JlY29ubmVjdGluZyhmYWxzZSlcbiAgICAgICAgICAgIG9uQ29tcGxldGUoYEZhaWxlZCB0byByZWNvbm5lY3QgdG8gJHtzZXJ2ZXJOYW1lfWApXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gT25seSBjYXRjaCBhY3R1YWwgZXJyb3JzIChsaWtlIHNlcnZlciBub3QgZm91bmQpXG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKVxuICAgICAgICBzZXRFcnJvcihlcnJvck1lc3NhZ2UpXG4gICAgICAgIHNldElzUmVjb25uZWN0aW5nKGZhbHNlKVxuICAgICAgICBvbkNvbXBsZXRlKGBFcnJvcjogJHtlcnJvck1lc3NhZ2V9YClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2b2lkIGF0dGVtcHRSZWNvbm5lY3QoKVxuICB9LCBbc2VydmVyTmFtZSwgcmVjb25uZWN0TWNwU2VydmVyLCBzdG9yZSwgb25Db21wbGV0ZV0pXG5cbiAgaWYgKGlzUmVjb25uZWN0aW5nKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0gcGFkZGluZz17MX0+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwidGV4dFwiPlxuICAgICAgICAgIFJlY29ubmVjdGluZyB0byA8VGV4dCBib2xkPntzZXJ2ZXJOYW1lfTwvVGV4dD5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgICAgPFRleHQ+IEVzdGFibGlzaGluZyBjb25uZWN0aW9uIHRvIE1DUCBzZXJ2ZXI8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgaWYgKGVycm9yKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0gcGFkZGluZz17MX0+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQ+e2NvbG9yKCdlcnJvcicsIHRoZW1lKShmaWd1cmVzLmNyb3NzKX0gPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5GYWlsZWQgdG8gcmVjb25uZWN0IHRvIHtzZXJ2ZXJOYW1lfTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPkVycm9yOiB7ZXJyb3J9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU9DLEtBQUssSUFBSUMsU0FBUyxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUNsRCxjQUFjQyxvQkFBb0IsUUFBUSxtQkFBbUI7QUFDN0QsU0FBU0MsR0FBRyxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsUUFBUSxRQUFRLGNBQWM7QUFDekQsU0FBU0MsZUFBZSxRQUFRLDRDQUE0QztBQUM1RSxTQUFTQyxnQkFBZ0IsUUFBUSx5QkFBeUI7QUFDMUQsU0FBU0MsT0FBTyxRQUFRLGVBQWU7QUFFdkMsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFVBQVUsRUFBRSxNQUFNO0VBQ2xCQyxVQUFVLEVBQUUsQ0FDVkMsTUFBZSxDQUFSLEVBQUUsTUFBTSxFQUNmQyxPQUE0QyxDQUFwQyxFQUFFO0lBQUVDLE9BQU8sQ0FBQyxFQUFFYixvQkFBb0I7RUFBQyxDQUFDLEVBQzVDLEdBQUcsSUFBSTtBQUNYLENBQUM7QUFFRCxPQUFPLFNBQUFjLGFBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFD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