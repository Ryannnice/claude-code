// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useState } from 'react';
// 类型依赖 { CommandResultDisplay } 来自 ../commands.js，用于校准终端渲染的数据契约。
import type { CommandResultDisplay } from '../commands.js';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- raw input for "any key" dismiss and y/n prompt
// 引入 Box、Text、useInput，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useInput } from '../ink.js';
// 复用 openBrowser 工具函数，把通用处理留在 ../utils/browser.js 中维护。
import { openBrowser } from '../utils/browser.js';
// 复用 getDesktopInstallStatus、openCurrentSessionInDesktop 工具函数，把通用处理留在 ../utils/desktopDeepLink.js 中维护。
import { getDesktopInstallStatus, openCurrentSessionInDesktop } from '../utils/desktopDeepLink.js';
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js';
// 复用 gracefulShutdown 工具函数，把通用处理留在 ../utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from '../utils/gracefulShutdown.js';
// 复用 flushSessionStorage 工具函数，把通用处理留在 ../utils/sessionStorage.js 中维护。
import { flushSessionStorage } from '../utils/sessionStorage.js';
// 引入 LoadingState，将 ./design-system/LoadingState.js 中已经封装好的能力接到本文件流程里。
import { LoadingState } from './design-system/LoadingState.js';
// DESKTOP_DOCS_URL 命名 `'https://clau.de/desktop'`，让后续代码直接表达这个值的用途。
const DESKTOP_DOCS_URL = 'https://clau.de/desktop';
// getDownloadUrl 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDownloadUrl(): string {
  // 按照 process.platform 的取值选择终端渲染的具体处理分支。
  switch (process.platform) {
    case 'win32':
      // 返回 `'https://claude.ai/api/desktop/win32/x64/exe/latest/redirect'`，作为终端渲染这次计算的结果。
      return 'https://claude.ai/api/desktop/win32/x64/exe/latest/redirect';
    default:
      // 返回 `'https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect'`，作为终端渲染这次计算的结果。
      return 'https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect';
  }
}
// DesktopHandoffState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DesktopHandoffState = 'checking' | 'prompt-download' | 'flushing' | 'opening' | 'success' | 'error';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onDone: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
};
// DesktopHandoff 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function DesktopHandoff(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(20);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // 状态 由 React state 持有，setState 会在用户操作或异步结果返回时触发刷新。
  const [state, setState] = useState("checking");
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
  // downloadMessage 消息数据 由 React state 持有，setDownloadMessage 会在用户操作或异步结果返回时触发刷新。
  const [downloadMessage, setDownloadMessage] = useState("");
  // t1 暂存 `input => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== error || $[1] !== onDone || $[2] !== state) {
    // t1 暂存 `input => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = input => {
      // 当 `state` 匹配 `"error"` 时，终端渲染执行对应分支。
      if (state === "error") {
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone(error ?? "Unknown error", {
          display: "system"
        });
        // 终端 UI 组件 Desktop Handoff在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 当 `state` 匹配 `"prompt-download"` 时，终端渲染执行对应分支。
      if (state === "prompt-download") {
        // 当 `input` 匹配 `"y" || input === "Y"` 时，终端渲染执行对应分支。
        if (input === "y" || input === "Y") {
          // 调用 openBrowser，触发终端渲染此处需要的副作用。
          openBrowser(getDownloadUrl()).catch(_temp);
          // 调用 onDone，触发终端渲染此处需要的副作用。
          onDone(`Starting download. Re-run /desktop once you\u2019ve installed the app.\nLearn more at ${DESKTOP_DOCS_URL}`, {
            display: "system"
          });
        } else {
          // 当 `input` 匹配 `"n" || input === "N"` 时，终端渲染执行对应分支。
          if (input === "n" || input === "N") {
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone(`The desktop app is required for /desktop. Learn more at ${DESKTOP_DOCS_URL}`, {
              display: "system"
            });
          }
        }
      }
    };
    // $[0] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = error;
    // $[1] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onDone;
    // $[2] 缓存 `state`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = state;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // 调用 useInput，触发终端渲染此处需要的副作用。
  useInput(t1);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== onDone) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // performHandoff保存`performHandoff`，供终端渲染后续处理使用。
      const performHandoff = async function performHandoff() {
        // setState 写入新的状态值，使终端渲染后续读取保持一致。
        setState("checking");
        // installStatus 集合读取`getDesktopInstallStatus`，供终端渲染后续处理使用。
        const installStatus = await getDesktopInstallStatus();
        // 当 `installStatus.status` 匹配 `"not-installed"` 时，终端渲染执行对应分支。
        if (installStatus.status === "not-installed") {
          // setDownloadMessage 写入新的状态值，使终端渲染后续读取保持一致。
          setDownloadMessage("Claude Desktop is not installed.");
          // setState 写入新的状态值，使终端渲染后续读取保持一致。
          setState("prompt-download");
          // 终端 UI 组件 Desktop Handoff在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // 当 `installStatus.status` 匹配 `"version-too-old"` 时，终端渲染执行对应分支。
        if (installStatus.status === "version-too-old") {
          // setDownloadMessage 写入新的状态值，使终端渲染后续读取保持一致。
          setDownloadMessage(`Claude Desktop needs to be updated (found v${installStatus.version}, need v1.1.2396+).`);
          // setState 写入新的状态值，使终端渲染后续读取保持一致。
          setState("prompt-download");
          // 终端 UI 组件 Desktop Handoff在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // setState 写入新的状态值，使终端渲染后续读取保持一致。
        setState("flushing");
        // 等待 `flushSessionStorage()` 完成，再继续终端 UI 组件 Desktop Handoff的异步流程。
        await flushSessionStorage();
        // setState 写入新的状态值，使终端渲染后续读取保持一致。
        setState("opening");
        // 结果保存`openCurrentSessionInDesktop`，供终端渲染后续处理使用。
        const result = await openCurrentSessionInDesktop();
        // result.success 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!result.success) {
          // setError 写入新的状态值，使终端渲染后续读取保持一致。
          setError(result.error ?? "Failed to open Claude Desktop");
          // setState 写入新的状态值，使终端渲染后续读取保持一致。
          setState("error");
          // 终端 UI 组件 Desktop Handoff在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // setState 写入新的状态值，使终端渲染后续读取保持一致。
        setState("success");
        // setTimeout 写入新的状态值，使终端渲染后续读取保持一致。
        setTimeout(_temp2, 500, onDone);
      };
      // 调用 performHandoff，触发终端渲染此处需要的副作用。
      performHandoff().catch(err => {
        // setError 写入新的状态值，使终端渲染后续读取保持一致。
        setError(errorMessage(err));
        // setState 写入新的状态值，使终端渲染后续读取保持一致。
        setState("error");
      });
    };
    // t3 暂存 `[onDone]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [onDone];
    // $[4] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onDone;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // 当 `state` 匹配 `"error"` 时，终端渲染执行对应分支。
  if (state === "error") {
    // t4 暂存 `<Text color="error">Error: {error}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[7] !== error) {
      // t4 暂存 `<Text color="error">Error: {error}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text color="error">Error: {error}</Text>;
      // $[7] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = error;
      // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[8];
    }
    // t5 暂存 `<Text dimColor={true}>Press any key to continue…</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<Text dimColor={true}>Press any key to continue…</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text dimColor={true}>Press any key to continue…</Text>;
      // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[9];
    }
    // t6 暂存 `<Box flexDirection="column" paddingX={2}>{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== t4) {
      // t6 暂存 `<Box flexDirection="column" paddingX={2}>{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Box flexDirection="column" paddingX={2}>{t4}{t5}</Box>;
      // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t4;
      // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[11];
    }
    // 返回 `t6`，作为终端渲染这次计算的结果。
    return t6;
  }
  // 当 `state` 匹配 `"prompt-download"` 时，终端渲染执行对应分支。
  if (state === "prompt-download") {
    // t4 暂存 `<Text>{downloadMessage}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[12] !== downloadMessage) {
      // t4 暂存 `<Text>{downloadMessage}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text>{downloadMessage}</Text>;
      // $[12] 缓存 `downloadMessage`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = downloadMessage;
      // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[13];
    }
    // t5 暂存 `<Text>Download now? (y/n)</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<Text>Download now? (y/n)</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text>Download now? (y/n)</Text>;
      // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[14];
    }
    // t6 暂存 `<Box flexDirection="column" paddingX={2}>{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[15] !== t4) {
      // t6 暂存 `<Box flexDirection="column" paddingX={2}>{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Box flexDirection="column" paddingX={2}>{t4}{t5}</Box>;
      // $[15] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t4;
      // $[16] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[16];
    }
    // 返回 `t6`，作为终端渲染这次计算的结果。
    return t6;
  }
  // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t4 = {
      checking: "Checking for Claude Desktop\u2026",
      flushing: "Saving session\u2026",
      opening: "Opening Claude Desktop\u2026",
      success: "Opening in Claude Desktop\u2026"
    };
    // $[17] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[17];
  }
  // 对话消息保存`t4`，作为后续临时缓存值处理的输入。
  const messages = t4;
  // t5读取 `messages[state]` 对应条目，后续围绕该成员继续处理。
  const t5 = messages[state];
  // t6 暂存 `<LoadingState message={t5} />` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== t5) {
    // t6 暂存 `<LoadingState message={t5} />` 生成的渲染片段，后续返回路径直接复用。
    t6 = <LoadingState message={t5} />;
    // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t5;
    // $[19] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[19];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function _temp2(onDone_0) {
  // 调用 onDone_0，触发终端渲染此处需要的副作用。
  onDone_0("Session transferred to Claude Desktop", {
    display: "system"
  });
  // 等待 `gracefulShutdown(0, "other")` 完成，再继续终端 UI 组件 Desktop Handoff的异步流程。
  await gracefulShutdown(0, "other");
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiQ29tbWFuZFJlc3VsdERpc3BsYXkiLCJCb3giLCJUZXh0IiwidXNlSW5wdXQiLCJvcGVuQnJvd3NlciIsImdldERlc2t0b3BJbnN0YWxsU3RhdHVzIiwib3BlbkN1cnJlbnRTZXNzaW9uSW5EZXNrdG9wIiwiZXJyb3JNZXNzYWdlIiwiZ3JhY2VmdWxTaHV0ZG93biIsImZsdXNoU2Vzc2lvblN0b3JhZ2UiLCJMb2FkaW5nU3RhdGUiLCJERVNLVE9QX0RPQ1NfVVJMIiwiZ2V0RG93bmxvYWRVcmwiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJEZXNrdG9wSGFuZG9mZlN0YXRlIiwiUHJvcHMiLCJvbkRvbmUiLCJyZXN1bHQiLCJvcHRpb25zIiwiZGlzcGxheSIsIkRlc2t0b3BIYW5kb2ZmIiwidDAiLCIkIiwiX2MiLCJzdGF0ZSIsInNldFN0YXRlIiwiZXJyb3IiLCJzZXRFcnJvciIsImRvd25sb2FkTWVzc2FnZSIsInNldERvd25sb2FkTWVzc2FnZSIsInQxIiwiaW5wdXQiLCJjYXRjaCIsIl90ZW1wIiwidDIiLCJ0MyIsInBlcmZvcm1IYW5kb2ZmIiwiaW5zdGFsbFN0YXR1cyIsInN0YXR1cyIsInZlcnNpb24iLCJzdWNjZXNzIiwic2V0VGltZW91dCIsIl90ZW1wMiIsImVyciIsInQ0IiwidDUiLCJTeW1ib2wiLCJmb3IiLCJ0NiIsImNoZWNraW5nIiwiZmx1c2hpbmciLCJvcGVuaW5nIiwibWVzc2FnZXMiLCJvbkRvbmVfMCJdLCJzb3VyY2VzIjpbIkRlc2t0b3BIYW5kb2ZmLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBDb21tYW5kUmVzdWx0RGlzcGxheSB9IGZyb20gJy4uL2NvbW1hbmRzLmpzJ1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGN1c3RvbS1ydWxlcy9wcmVmZXItdXNlLWtleWJpbmRpbmdzIC0tIHJhdyBpbnB1dCBmb3IgXCJhbnkga2V5XCIgZGlzbWlzcyBhbmQgeS9uIHByb21wdFxuaW1wb3J0IHsgQm94LCBUZXh0LCB1c2VJbnB1dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IG9wZW5Ccm93c2VyIH0gZnJvbSAnLi4vdXRpbHMvYnJvd3Nlci5qcydcbmltcG9ydCB7XG4gIGdldERlc2t0b3BJbnN0YWxsU3RhdHVzLFxuICBvcGVuQ3VycmVudFNlc3Npb25JbkRlc2t0b3AsXG59IGZyb20gJy4uL3V0aWxzL2Rlc2t0b3BEZWVwTGluay5qcydcbmltcG9ydCB7IGVycm9yTWVzc2FnZSB9IGZyb20gJy4uL3V0aWxzL2Vycm9ycy5qcydcbmltcG9ydCB7IGdyYWNlZnVsU2h1dGRvd24gfSBmcm9tICcuLi91dGlscy9ncmFjZWZ1bFNodXRkb3duLmpzJ1xuaW1wb3J0IHsgZmx1c2hTZXNzaW9uU3RvcmFnZSB9IGZyb20gJy4uL3V0aWxzL3Nlc3Npb25TdG9yYWdlLmpzJ1xuaW1wb3J0IHsgTG9hZGluZ1N0YXRlIH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0xvYWRpbmdTdGF0ZS5qcydcblxuY29uc3QgREVTS1RPUF9ET0NTX1VSTCA9ICdodHRwczovL2NsYXUuZGUvZGVza3RvcCdcblxuZXhwb3J0IGZ1bmN0aW9uIGdldERvd25sb2FkVXJsKCk6IHN0cmluZyB7XG4gIHN3aXRjaCAocHJvY2Vzcy5wbGF0Zm9ybSkge1xuICAgIGNhc2UgJ3dpbjMyJzpcbiAgICAgIHJldHVybiAnaHR0cHM6Ly9jbGF1ZGUuYWkvYXBpL2Rlc2t0b3Avd2luMzIveDY0L2V4ZS9sYXRlc3QvcmVkaXJlY3QnXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnaHR0cHM6Ly9jbGF1ZGUuYWkvYXBpL2Rlc2t0b3AvZGFyd2luL3VuaXZlcnNhbC9kbWcvbGF0ZXN0L3JlZGlyZWN0J1xuICB9XG59XG5cbnR5cGUgRGVza3RvcEhhbmRvZmZTdGF0ZSA9XG4gIHwgJ2NoZWNraW5nJ1xuICB8ICdwcm9tcHQtZG93bmxvYWQnXG4gIHwgJ2ZsdXNoaW5nJ1xuICB8ICdvcGVuaW5nJ1xuICB8ICdzdWNjZXNzJ1xuICB8ICdlcnJvcidcblxudHlwZSBQcm9wcyA9IHtcbiAgb25Eb25lOiAoXG4gICAgcmVzdWx0Pzogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiB7IGRpc3BsYXk/OiBDb21tYW5kUmVzdWx0RGlzcGxheSB9LFxuICApID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIERlc2t0b3BIYW5kb2ZmKHsgb25Eb25lIH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZTxEZXNrdG9wSGFuZG9mZlN0YXRlPignY2hlY2tpbmcnKVxuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtkb3dubG9hZE1lc3NhZ2UsIHNldERvd25sb2FkTWVzc2FnZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKVxuXG4gIC8vIEhhbmRsZSBrZXlib2FyZCBpbnB1dCBmb3IgZXJyb3IgYW5kIHByb21wdC1kb3dubG9hZCBzdGF0ZXNcbiAgdXNlSW5wdXQoaW5wdXQgPT4ge1xuICAgIGlmIChzdGF0ZSA9PT0gJ2Vycm9yJykge1xuICAgICAgb25Eb25lKGVycm9yID8/ICdVbmtub3duIGVycm9yJywgeyBkaXNwbGF5OiAnc3lzdGVtJyB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChzdGF0ZSA9PT0gJ3Byb21wdC1kb3dubG9hZCcpIHtcbiAgICAgIGlmIChpbnB1dCA9PT0gJ3knIHx8IGlucHV0ID09PSAnWScpIHtcbiAgICAgICAgb3BlbkJyb3dzZXIoZ2V0RG93bmxvYWRVcmwoKSkuY2F0Y2goKCkgPT4ge30pXG4gICAgICAgIG9uRG9uZShcbiAgICAgICAgICBgU3RhcnRpbmcgZG93bmxvYWQuIFJlLXJ1biAvZGVza3RvcCBvbmNlIHlvdVxcdTIwMTl2ZSBpbnN0YWxsZWQgdGhlIGFwcC5cXG5MZWFybiBtb3JlIGF0ICR7REVTS1RPUF9ET0NTX1VSTH1gLFxuICAgICAgICAgIHsgZGlzcGxheTogJ3N5c3RlbScgfSxcbiAgICAgICAgKVxuICAgICAgfSBlbHNlIGlmIChpbnB1dCA9PT0gJ24nIHx8IGlucHV0ID09PSAnTicpIHtcbiAgICAgICAgb25Eb25lKFxuICAgICAgICAgIGBUaGUgZGVza3RvcCBhcHAgaXMgcmVxdWlyZWQgZm9yIC9kZXNrdG9wLiBMZWFybiBtb3JlIGF0ICR7REVTS1RPUF9ET0NTX1VSTH1gLFxuICAgICAgICAgIHsgZGlzcGxheTogJ3N5c3RlbScgfSxcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGFzeW5jIGZ1bmN0aW9uIHBlcmZvcm1IYW5kb2ZmKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgLy8gQ2hlY2sgRGVza3RvcCBpbnN0YWxsIHN0YXR1c1xuICAgICAgc2V0U3RhdGUoJ2NoZWNraW5nJylcbiAgICAgIGNvbnN0IGluc3RhbGxTdGF0dXMgPSBhd2FpdCBnZXREZXNrdG9wSW5zdGFsbFN0YXR1cygpXG5cbiAgICAgIGlmIChpbnN0YWxsU3RhdHVzLnN0YXR1cyA9PT0gJ25vdC1pbnN0YWxsZWQnKSB7XG4gICAgICAgIHNldERvd25sb2FkTWVzc2FnZSgnQ2xhdWRlIERlc2t0b3AgaXMgbm90IGluc3RhbGxlZC4nKVxuICAgICAgICBzZXRTdGF0ZSgncHJvbXB0LWRvd25sb2FkJylcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmIChpbnN0YWxsU3RhdHVzLnN0YXR1cyA9PT0gJ3ZlcnNpb24tdG9vLW9sZCcpIHtcbiAgICAgICAgc2V0RG93bmxvYWRNZXNzYWdlKFxuICAgICAgICAgIGBDbGF1ZGUgRGVza3RvcCBuZWVkcyB0byBiZSB1cGRhdGVkIChmb3VuZCB2JHtpbnN0YWxsU3RhdHVzLnZlcnNpb259LCBuZWVkIHYxLjEuMjM5NispLmAsXG4gICAgICAgIClcbiAgICAgICAgc2V0U3RhdGUoJ3Byb21wdC1kb3dubG9hZCcpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyBGbHVzaCBzZXNzaW9uIHN0b3JhZ2UgdG8gZW5zdXJlIHRyYW5zY3JpcHQgaXMgZnVsbHkgd3JpdHRlblxuICAgICAgc2V0U3RhdGUoJ2ZsdXNoaW5nJylcbiAgICAgIGF3YWl0IGZsdXNoU2Vzc2lvblN0b3JhZ2UoKVxuXG4gICAgICAvLyBPcGVuIHRoZSBkZWVwIGxpbmsgKHVzZXMgY2xhdWRlLWRldjovLyBpbiBkZXYgbW9kZSlcbiAgICAgIHNldFN0YXRlKCdvcGVuaW5nJylcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wZW5DdXJyZW50U2Vzc2lvbkluRGVza3RvcCgpXG5cbiAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgc2V0RXJyb3IocmVzdWx0LmVycm9yID8/ICdGYWlsZWQgdG8gb3BlbiBDbGF1ZGUgRGVza3RvcCcpXG4gICAgICAgIHNldFN0YXRlKCdlcnJvcicpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyBTdWNjZXNzIC0gZXhpdCB0aGUgQ0xJXG4gICAgICBzZXRTdGF0ZSgnc3VjY2VzcycpXG5cbiAgICAgIC8vIEdpdmUgdGhlIHVzZXIgYSBtb21lbnQgdG8gc2VlIHRoZSBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgIHNldFRpbWVvdXQoXG4gICAgICAgIGFzeW5jIChvbkRvbmU6IFByb3BzWydvbkRvbmUnXSkgPT4ge1xuICAgICAgICAgIG9uRG9uZSgnU2Vzc2lvbiB0cmFuc2ZlcnJlZCB0byBDbGF1ZGUgRGVza3RvcCcsIHsgZGlzcGxheTogJ3N5c3RlbScgfSlcbiAgICAgICAgICBhd2FpdCBncmFjZWZ1bFNodXRkb3duKDAsICdvdGhlcicpXG4gICAgICAgIH0sXG4gICAgICAgIDUwMCxcbiAgICAgICAgb25Eb25lLFxuICAgICAgKVxuICAgIH1cblxuICAgIHBlcmZvcm1IYW5kb2ZmKCkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHNldEVycm9yKGVycm9yTWVzc2FnZShlcnIpKVxuICAgICAgc2V0U3RhdGUoJ2Vycm9yJylcbiAgICB9KVxuICB9LCBbb25Eb25lXSlcblxuICBpZiAoc3RhdGUgPT09ICdlcnJvcicpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgcGFkZGluZ1g9ezJ9PlxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+RXJyb3I6IHtlcnJvcn08L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlByZXNzIGFueSBrZXkgdG8gY29udGludWXigKY8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICBpZiAoc3RhdGUgPT09ICdwcm9tcHQtZG93bmxvYWQnKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdYPXsyfT5cbiAgICAgICAgPFRleHQ+e2Rvd25sb2FkTWVzc2FnZX08L1RleHQ+XG4gICAgICAgIDxUZXh0PkRvd25sb2FkIG5vdz8gKHkvbik8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICBjb25zdCBtZXNzYWdlczogUmVjb3JkPFxuICAgIEV4Y2x1ZGU8RGVza3RvcEhhbmRvZmZTdGF0ZSwgJ2Vycm9yJyB8ICdwcm9tcHQtZG93bmxvYWQnPixcbiAgICBzdHJpbmdcbiAgPiA9IHtcbiAgICBjaGVja2luZzogJ0NoZWNraW5nIGZvciBDbGF1ZGUgRGVza3RvcOKApicsXG4gICAgZmx1c2hpbmc6ICdTYXZpbmcgc2Vzc2lvbuKApicsXG4gICAgb3BlbmluZzogJ09wZW5pbmcgQ2xhdWRlIERlc2t0b3DigKYnLFxuICAgIHN1Y2Nlc3M6ICdPcGVuaW5nIGluIENsYXVkZSBEZXNrdG9w4oCmJyxcbiAgfVxuXG4gIHJldHVybiA8TG9hZGluZ1N0YXRlIG1lc3NhZ2U9e21lc3NhZ2VzW3N0YXRl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