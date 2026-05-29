// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React、useEffect，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect } from 'react';
// 引入 getAdditionalDirectoriesForClaudeMd、setAdditionalDirectoriesForClaudeMd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getAdditionalDirectoriesForClaudeMd, setAdditionalDirectoriesForClaudeMd } from '../../bootstrap/state.js';
// 类型依赖 { LocalJSXCommandContext } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandContext } from '../../commands.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 复用 AddWorkspaceDirectory 终端界面组件，避免在这里重复拼装显示逻辑。
import { AddWorkspaceDirectory } from '../../components/permissions/rules/AddWorkspaceDirectory.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 复用 applyPermissionUpdate、persistPermissionUpdate 工具函数，把通用处理留在 ../../utils/permissions/PermissionUpdate.js 中维护。
import { applyPermissionUpdate, persistPermissionUpdate } from '../../utils/permissions/PermissionUpdate.js';
// 类型依赖 { PermissionUpdateDestination } 来自 ../../utils/permissions/PermissionUpdateSchema.js，用于校准命令处理的数据契约。
import type { PermissionUpdateDestination } from '../../utils/permissions/PermissionUpdateSchema.js';
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js';
// 引入 addDirHelpMessage、validateDirectoryForWorkspace，将 ./validation.js 中已经封装好的能力接到本文件流程里。
import { addDirHelpMessage, validateDirectoryForWorkspace } from './validation.js';
// AddDirError 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function AddDirError(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    message,
    args,
    onDone
  } = t0;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[onDone]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // timer保存`setTimeout`，供命令处理后续处理使用。
      const timer = setTimeout(onDone, 0);
      // 返回 `() => clearTimeout(timer)`，作为命令处理这次计算的结果。
      return () => clearTimeout(timer);
    };
    // t2 暂存 `[onDone]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [onDone];
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t1, t2);
  // t3 暂存 `<Text dimColor={true}>{figures.pointer} /add-dir {args}</...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== args) {
    // t3 暂存 `<Text dimColor={true}>{figures.pointer} /add-dir {args}</...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text dimColor={true}>{figures.pointer} /add-dir {args}</Text>;
    // $[3] 缓存 `args`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = args;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<MessageResponse><Text>{message}</Text></MessageResponse>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== message) {
    // t4 暂存 `<MessageResponse><Text>{message}</Text></MessageResponse>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <MessageResponse><Text>{message}</Text></MessageResponse>;
    // $[5] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = message;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Box flexDirection="column">{t3}{t4}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t3 || $[8] !== t4) {
    // t5 暂存 `<Box flexDirection="column">{t3}{t4}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column">{t3}{t4}</Box>;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // 返回 `t5`，作为命令处理这次计算的结果。
  return t5;
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, context: LocalJSXCommandContext, args?: string): Promise<React.ReactNode> {
  // directoryPath 路径数据格式化`trim`，供命令处理后续处理使用。
  const directoryPath = (args ?? '').trim();
  // appState 状态读取`context.getAppState`，供命令处理后续处理使用。
  const appState = context.getAppState();

  // Helper to handle adding a directory (shared by both with-path and no-path cases)
  // handleAddDirectory保存`async`，供命令处理后续处理使用。
  const handleAddDirectory = async (path: string, remember = false) => {
    // destination保存`remember ? 'localSettings' : 'session'`，供后续判断或组装使用。
    const destination: PermissionUpdateDestination = remember ? 'localSettings' : 'session';
    // permissionUpdate 权限数据 集中保存命令处理斜杠命令 add dir要一起传递的字段。
    const permissionUpdate = {
      type: 'addDirectories' as const,
      directories: [path],
      destination
    };

    // Apply to session context
    // latestAppState 状态读取`context.getAppState`，供命令处理后续处理使用。
    const latestAppState = context.getAppState();
    // updatedContext保存`applyPermissionUpdate`，供命令处理后续处理使用。
    const updatedContext = applyPermissionUpdate(latestAppState.toolPermissionContext, permissionUpdate);
    // context.setAppState 写入新的状态值，使命令处理后续读取保持一致。
    context.setAppState(prev => ({
      ...prev,
      toolPermissionContext: updatedContext
    }));

    // Update sandbox config so Bash commands can access the new directory.
    // Bootstrap state is the source of truth for session-only dirs; persisted
    // dirs are picked up via the settings subscription, but we refresh
    // eagerly here to avoid a race when the user acts immediately.
    // currentDirs 集合读取`getAdditionalDirectoriesForClaudeMd`，供命令处理后续处理使用。
    const currentDirs = getAdditionalDirectoriesForClaudeMd();
    // 满足 `!currentDirs.includes(path)` 时，命令处理执行该分支。
    if (!currentDirs.includes(path)) {
      // setAdditionalDirectoriesForClaudeMd 写入新的状态值，使命令处理后续读取保持一致。
      setAdditionalDirectoriesForClaudeMd([...currentDirs, path]);
    }
    // 调用 SandboxManager.refreshConfig，触发命令处理此处需要的副作用。
    SandboxManager.refreshConfig();
    // 消息 先占位，稍后的条件分支会根据实际输入补齐它。
    let message: string;
    // 满足 `remember` 时，命令处理执行该分支。
    if (remember) {
      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // 调用 persistPermissionUpdate，触发命令处理此处需要的副作用。
        persistPermissionUpdate(permissionUpdate);
        // 消息更新为 ``Added ${chalk.bold(path)} as a working directory and sav...`，确保斜杠命令后续读取最新状态。
        message = `Added ${chalk.bold(path)} as a working directory and saved to local settings`;
      } catch (error) {
        // 消息更新为 ``Added ${chalk.bold(path)} as a working directory. Failed...`，确保斜杠命令后续读取最新状态。
        message = `Added ${chalk.bold(path)} as a working directory. Failed to save to local settings: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else {
      // 消息更新为 ``Added ${chalk.bold(path)} as a working directory for thi...`，确保斜杠命令后续读取最新状态。
      message = `Added ${chalk.bold(path)} as a working directory for this session`;
    }
    // messageWithHint 消息数据保存`chalk.dim`，供命令处理后续处理使用。
    const messageWithHint = `${message} ${chalk.dim('· /permissions to manage')}`;
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(messageWithHint);
  };

  // When no path is provided, show AddWorkspaceDirectory input form directly
  // and return to REPL after confirmation
  // directoryPath 路径数据缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!directoryPath) {
    // 返回 `<AddWorkspaceDirectory permissionContext={appState.toolPermissionContex...`，作为命令处理这次计算的结果。
    return <AddWorkspaceDirectory permissionContext={appState.toolPermissionContext} onAddDirectory={handleAddDirectory} onCancel={() => {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('Did not add a working directory.');
    }} />;
  }
  // 结果读取`validateDirectoryForWorkspace`，供命令处理后续处理使用。
  const result = await validateDirectoryForWorkspace(directoryPath, appState.toolPermissionContext);
  // `result.resultType` 与 `'success'` 不一致时刷新派生状态，避免使用过期结果。
  if (result.resultType !== 'success') {
    // 消息保存`addDirHelpMessage`，供命令处理后续处理使用。
    const message = addDirHelpMessage(result);
    // 返回 `<AddDirError message={message} args={args ?? ''} onDone={() => onDone(m...`，作为命令处理这次计算的结果。
    return <AddDirError message={message} args={args ?? ''} onDone={() => onDone(message)} />;
  }
  // 返回 `<AddWorkspaceDirectory directoryPath={result.absolutePath} permissionCo...`，作为命令处理这次计算的结果。
  return <AddWorkspaceDirectory directoryPath={result.absolutePath} permissionContext={appState.toolPermissionContext} onAddDirectory={handleAddDirectory} onCancel={() => {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(`Did not add ${chalk.bold(result.absolutePath)} as a working directory.`);
  }} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsImZpZ3VyZXMiLCJSZWFjdCIsInVzZUVmZmVjdCIsImdldEFkZGl0aW9uYWxEaXJlY3Rvcmllc0ZvckNsYXVkZU1kIiwic2V0QWRkaXRpb25hbERpcmVjdG9yaWVzRm9yQ2xhdWRlTWQiLCJMb2NhbEpTWENvbW1hbmRDb250ZXh0IiwiTWVzc2FnZVJlc3BvbnNlIiwiQWRkV29ya3NwYWNlRGlyZWN0b3J5IiwiQm94IiwiVGV4dCIsIkxvY2FsSlNYQ29tbWFuZE9uRG9uZSIsImFwcGx5UGVybWlzc2lvblVwZGF0ZSIsInBlcnNpc3RQZXJtaXNzaW9uVXBkYXRlIiwiUGVybWlzc2lvblVwZGF0ZURlc3RpbmF0aW9uIiwiU2FuZGJveE1hbmFnZXIiLCJhZGREaXJIZWxwTWVzc2FnZSIsInZhbGlkYXRlRGlyZWN0b3J5Rm9yV29ya3NwYWNlIiwiQWRkRGlyRXJyb3IiLCJ0MCIsIiQiLCJfYyIsIm1lc3NhZ2UiLCJhcmdzIiwib25Eb25lIiwidDEiLCJ0MiIsInRpbWVyIiwic2V0VGltZW91dCIsImNsZWFyVGltZW91dCIsInQzIiwicG9pbnRlciIsInQ0IiwidDUiLCJjYWxsIiwiY29udGV4dCIsIlByb21pc2UiLCJSZWFjdE5vZGUiLCJkaXJlY3RvcnlQYXRoIiwidHJpbSIsImFwcFN0YXRlIiwiZ2V0QXBwU3RhdGUiLCJoYW5kbGVBZGREaXJlY3RvcnkiLCJwYXRoIiwicmVtZW1iZXIiLCJkZXN0aW5hdGlvbiIsInBlcm1pc3Npb25VcGRhdGUiLCJ0eXBlIiwiY29uc3QiLCJkaXJlY3RvcmllcyIsImxhdGVzdEFwcFN0YXRlIiwidXBkYXRlZENvbnRleHQiLCJ0b29sUGVybWlzc2lvbkNvbnRleHQiLCJzZXRBcHBTdGF0ZSIsInByZXYiLCJjdXJyZW50RGlycyIsImluY2x1ZGVzIiwicmVmcmVzaENvbmZpZyIsImJvbGQiLCJlcnJvciIsIkVycm9yIiwibWVzc2FnZVdpdGhIaW50IiwiZGltIiwicmVzdWx0IiwicmVzdWx0VHlwZSIsImFic29sdXRlUGF0aCJdLCJzb3VyY2VzIjpbImFkZC1kaXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmltcG9ydCBmaWd1cmVzIGZyb20gJ2ZpZ3VyZXMnXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQge1xuICBnZXRBZGRpdGlvbmFsRGlyZWN0b3JpZXNGb3JDbGF1ZGVNZCxcbiAgc2V0QWRkaXRpb25hbERpcmVjdG9yaWVzRm9yQ2xhdWRlTWQsXG59IGZyb20gJy4uLy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgTG9jYWxKU1hDb21tYW5kQ29udGV4dCB9IGZyb20gJy4uLy4uL2NvbW1hbmRzLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBBZGRXb3Jrc3BhY2VEaXJlY3RvcnkgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL3Blcm1pc3Npb25zL3J1bGVzL0FkZFdvcmtzcGFjZURpcmVjdG9yeS5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgTG9jYWxKU1hDb21tYW5kT25Eb25lIH0gZnJvbSAnLi4vLi4vdHlwZXMvY29tbWFuZC5qcydcbmltcG9ydCB7XG4gIGFwcGx5UGVybWlzc2lvblVwZGF0ZSxcbiAgcGVyc2lzdFBlcm1pc3Npb25VcGRhdGUsXG59IGZyb20gJy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25VcGRhdGUuanMnXG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25VcGRhdGVEZXN0aW5hdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25VcGRhdGVTY2hlbWEuanMnXG5pbXBvcnQgeyBTYW5kYm94TWFuYWdlciB9IGZyb20gJy4uLy4uL3V0aWxzL3NhbmRib3gvc2FuZGJveC1hZGFwdGVyLmpzJ1xuaW1wb3J0IHtcbiAgYWRkRGlySGVscE1lc3NhZ2UsXG4gIHZhbGlkYXRlRGlyZWN0b3J5Rm9yV29ya3NwYWNlLFxufSBmcm9tICcuL3ZhbGlkYXRpb24uanMnXG5cbmZ1bmN0aW9uIEFkZERpckVycm9yKHtcbiAgbWVzc2FnZSxcbiAgYXJncyxcbiAgb25Eb25lLFxufToge1xuICBtZXNzYWdlOiBzdHJpbmdcbiAgYXJnczogc3RyaW5nXG4gIG9uRG9uZTogKCkgPT4gdm9pZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgLy8gV2UgbmVlZCB0byBkZWZlciBjYWxsaW5nIG9uRG9uZSB0byBhdm9pZCB0aGUgXCJyZXR1cm4gbnVsbFwiIGJ1ZyB3aGVyZVxuICAgIC8vIHRoZSBjb21wb25lbnQgdW5tb3VudHMgYmVmb3JlIFJlYWN0IGNhbiByZW5kZXIgdGhlIGVycm9yIG1lc3NhZ2UuXG4gICAgLy8gVXNpbmcgc2V0VGltZW91dCBlbnN1cmVzIHRoZSBlcnJvciBkaXNwbGF5cyBiZWZvcmUgdGhlIGNvbW1hbmQgZXhpdHMuXG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KG9uRG9uZSwgMClcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVyKVxuICB9LCBbb25Eb25lXSlcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgIHtmaWd1cmVzLnBvaW50ZXJ9IC9hZGQtZGlyIHthcmdzfVxuICAgICAgPC9UZXh0PlxuICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgPFRleHQ+e21lc3NhZ2V9PC9UZXh0PlxuICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGwoXG4gIG9uRG9uZTogTG9jYWxKU1hDb21tYW5kT25Eb25lLFxuICBjb250ZXh0OiBMb2NhbEpTWENvbW1hbmRDb250ZXh0LFxuICBhcmdzPzogc3RyaW5nLFxuKTogUHJvbWlzZTxSZWFjdC5SZWFjdE5vZGU+IHtcbiAgY29uc3QgZGlyZWN0b3J5UGF0aCA9IChhcmdzID8/ICcnKS50cmltKClcbiAgY29uc3QgYXBwU3RhdGUgPSBjb250ZXh0LmdldEFwcFN0YXRlKClcblxuICAvLyBIZWxwZXIgdG8gaGFuZGxlIGFkZGluZyBhIGRpcmVjdG9yeSAoc2hhcmVkIGJ5IGJvdGggd2l0aC1wYXRoIGFuZCBuby1wYXRoIGNhc2VzKVxuICBjb25zdCBoYW5kbGVBZGREaXJlY3RvcnkgPSBhc3luYyAocGF0aDogc3RyaW5nLCByZW1lbWJlciA9IGZhbHNlKSA9PiB7XG4gICAgY29uc3QgZGVzdGluYXRpb246IFBlcm1pc3Npb25VcGRhdGVEZXN0aW5hdGlvbiA9IHJlbWVtYmVyXG4gICAgICA/ICdsb2NhbFNldHRpbmdzJ1xuICAgICAgOiAnc2Vzc2lvbidcblxuICAgIGNvbnN0IHBlcm1pc3Npb25VcGRhdGUgPSB7XG4gICAgICB0eXBlOiAnYWRkRGlyZWN0b3JpZXMnIGFzIGNvbnN0LFxuICAgICAgZGlyZWN0b3JpZXM6IFtwYXRoXSxcbiAgICAgIGRlc3RpbmF0aW9uLFxuICAgIH1cblxuICAgIC8vIEFwcGx5IHRvIHNlc3Npb24gY29udGV4dFxuICAgIGNvbnN0IGxhdGVzdEFwcFN0YXRlID0gY29udGV4dC5nZXRBcHBTdGF0ZSgpXG4gICAgY29uc3QgdXBkYXRlZENvbnRleHQgPSBhcHBseVBlcm1pc3Npb25VcGRhdGUoXG4gICAgICBsYXRlc3RBcHBTdGF0ZS50b29sUGVybWlzc2lvbkNvbnRleHQsXG4gICAgICBwZXJtaXNzaW9uVXBkYXRlLFxuICAgIClcbiAgICBjb250ZXh0LnNldEFwcFN0YXRlKHByZXYgPT4gKHtcbiAgICAgIC4uLnByZXYsXG4gICAgICB0b29sUGVybWlzc2lvbkNvbnRleHQ6IHVwZGF0ZWRDb250ZXh0LFxuICAgIH0pKVxuXG4gICAgLy8gVXBkYXRlIHNhbmRib3ggY29uZmlnIHNvIEJhc2ggY29tbWFuZHMgY2FuIGFjY2VzcyB0aGUgbmV3IGRpcmVjdG9yeS5cbiAgICAvLyBCb290c3RyYXAgc3RhdGUgaXMgdGhlIHNvdXJjZSBvZiB0cnV0aCBmb3Igc2Vzc2lvbi1vbmx5IGRpcnM7IHBlcnNpc3RlZFxuICAgIC8vIGRpcnMgYXJlIHBpY2tlZCB1cCB2aWEgdGhlIHNldHRpbmdzIHN1YnNjcmlwdGlvbiwgYnV0IHdlIHJlZnJlc2hcbiAgICAvLyBlYWdlcmx5IGhlcmUgdG8gYXZvaWQgYSByYWNlIHdoZW4gdGhlIHVzZXIgYWN0cyBpbW1lZGlhdGVseS5cbiAgICBjb25zdCBjdXJyZW50RGlycyA9IGdldEFkZGl0aW9uYWxEaXJlY3Rvcmllc0ZvckNsYXVkZU1kKClcbiAgICBpZiAoIWN1cnJlbnREaXJzLmluY2x1ZGVzKHBhdGgpKSB7XG4gICAgICBzZXRBZGRpdGlvbmFsRGlyZWN0b3JpZXNGb3JDbGF1ZGVNZChbLi4uY3VycmVudERpcnMsIHBhdGhdKVxuICAgIH1cbiAgICBTYW5kYm94TWFuYWdlci5yZWZyZXNoQ29uZmlnKClcblxuICAgIGxldCBtZXNzYWdlOiBzdHJpbmdcblxuICAgIGlmIChyZW1lbWJlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGVyc2lzdFBlcm1pc3Npb25VcGRhdGUocGVybWlzc2lvblVwZGF0ZSlcbiAgICAgICAgbWVzc2FnZSA9IGBBZGRlZCAke2NoYWxrLmJvbGQocGF0aCl9IGFzIGEgd29ya2luZyBkaXJlY3RvcnkgYW5kIHNhdmVkIHRvIGxvY2FsIHNldHRpbmdzYFxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbWVzc2FnZSA9IGBBZGRlZCAke2NoYWxrLmJvbGQocGF0aCl9IGFzIGEgd29ya2luZyBkaXJlY3RvcnkuIEZhaWxlZCB0byBzYXZlIHRvIGxvY2FsIHNldHRpbmdzOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWBcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbWVzc2FnZSA9IGBBZGRlZCAke2NoYWxrLmJvbGQocGF0aCl9IGFzIGEgd29ya2luZyBkaXJlY3RvcnkgZm9yIHRoaXMgc2Vzc2lvbmBcbiAgICB9XG5cbiAgICBjb25zdCBtZXNzYWdlV2l0aEhpbnQgPSBgJHttZXNzYWdlfSAke2NoYWxrLmRpbSgnwrcgL3Blcm1pc3Npb25zIHRvIG1hbmFnZScpfWBcbiAgICBvbkRvbmUobWVzc2FnZVdpdGhIaW50KVxuICB9XG5cbiAgLy8gV2hlbiBubyBwYXRoIGlzIHByb3ZpZGVkLCBzaG93IEFkZFdvcmtzcGFjZURpcmVjdG9yeSBpbnB1dCBmb3JtIGRpcmVjdGx5XG4gIC8vIGFuZCByZXR1cm4gdG8gUkVQTCBhZnRlciBjb25maXJtYXRpb25cbiAgaWYgKCFkaXJlY3RvcnlQYXRoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxBZGRXb3Jrc3BhY2VEaXJlY3RvcnlcbiAgICAgICAgcGVybWlzc2lvbkNvbnRleHQ9e2FwcFN0YXRlLnRvb2xQZXJtaXNzaW9uQ29udGV4dH1cbiAgICAgICAgb25BZGREaXJlY3Rvcnk9e2hhbmRsZUFkZERpcmVjdG9yeX1cbiAgICAgICAgb25DYW5jZWw9eygpID0+IHtcbiAgICAgICAgICBvbkRvbmUoJ0RpZCBub3QgYWRkIGEgd29ya2luZyBkaXJlY3RvcnkuJylcbiAgICAgICAgfX1cbiAgICAgIC8+XG4gICAgKVxuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdmFsaWRhdGVEaXJlY3RvcnlGb3JXb3Jrc3BhY2UoXG4gICAgZGlyZWN0b3J5UGF0aCxcbiAgICBhcHBTdGF0ZS50b29sUGVybWlzc2lvbkNvbnRleHQsXG4gIClcblxuICBpZiAocmVzdWx0LnJlc3VsdFR5cGUgIT09ICdzdWNjZXNzJykge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBhZGREaXJIZWxwTWVzc2FnZShyZXN1bHQpXG5cbiAgICByZXR1cm4gKFxuICAgICAgPEFkZERpckVycm9yXG4gICAgICAgIG1lc3NhZ2U9e21lc3NhZ2V9XG4gICAgICAgIGFyZ3M9e2FyZ3MgPz8gJyd9XG4gICAgICAgIG9uRG9uZT17KCkgPT4gb25Eb25lKG1lc3NhZ2UpfVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxBZGRXb3Jrc3BhY2VEaXJlY3RvcnlcbiAgICAgIGRpcmVjdG9yeVBhdGg9e3Jlc3VsdC5hYnNvbHV0ZVBhdGh9XG4gICAgICBwZXJtaXNzaW9uQ29udGV4dD17YXBwU3RhdGUudG9vbFBlcm1pc3Npb25Db250ZXh0fVxuICAgICAgb25BZGREaXJlY3Rvcnk9e2hhbmRsZUFkZERpcmVjdG9yeX1cbiAgICAgIG9uQ2FuY2VsPXsoKSA9PiB7XG4gICAgICAgIG9uRG9uZShcbiAgICAgICAgICBgRGlkIG5vdCBhZGQgJHtjaGFsay5ib2xkKHJlc3VsdC5hYnNvbHV0ZVBhdGgpfSBhcyBhIHdvcmtpbmcgZGlyZWN0b3J5LmAsXG4gICAgICAgIClcbiAgICAgIH19XG4gICAgLz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsT0FBT0MsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBT0MsS0FBSyxJQUFJQyxTQUFTLFFBQVEsT0FBTztBQUN4QyxTQUNFQyxtQ0FBbUMsRUFDbkNDLG1DQUFtQyxRQUM5QiwwQkFBMEI7QUFDakMsY0FBY0Msc0JBQXNCLFFBQVEsbUJBQW1CO0FBQy9ELFNBQVNDLGVBQWUsUUFBUSxxQ0FBcUM7QUFDckUsU0FBU0MscUJBQXFCLFFBQVEsNkRBQTZEO0FBQ25HLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsY0FBY0MscUJBQXFCLFFBQVEsd0JBQXdCO0FBQ25FLFNBQ0VDLHFCQUFxQixFQUNyQkMsdUJBQXVCLFFBQ2xCLDZDQUE2QztBQUNwRCxjQUFjQywyQkFBMkIsUUFBUSxtREFBbUQ7QUFDcEcsU0FBU0MsY0FBYyxRQUFRLHdDQUF3QztBQUN2RSxTQUNFQyxp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