// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 handlePlanModeTransition，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { handlePlanModeTransition } from '../../bootstrap/state.js';
// 类型依赖 { LocalJSXCommandContext } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandContext } from '../../commands.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 复用 getExternalEditor 工具函数，把通用处理留在 ../../utils/editor.js 中维护。
import { getExternalEditor } from '../../utils/editor.js';
// 复用 toIDEDisplayName 工具函数，把通用处理留在 ../../utils/ide.js 中维护。
import { toIDEDisplayName } from '../../utils/ide.js';
// 复用 applyPermissionUpdate 工具函数，把通用处理留在 ../../utils/permissions/PermissionUpdate.js 中维护。
import { applyPermissionUpdate } from '../../utils/permissions/PermissionUpdate.js';
// 复用 prepareContextForPlanMode 工具函数，把通用处理留在 ../../utils/permissions/permissionSetup.js 中维护。
import { prepareContextForPlanMode } from '../../utils/permissions/permissionSetup.js';
// 复用 getPlan、getPlanFilePath 工具函数，把通用处理留在 ../../utils/plans.js 中维护。
import { getPlan, getPlanFilePath } from '../../utils/plans.js';
// 复用 editFileInEditor 工具函数，把通用处理留在 ../../utils/promptEditor.js 中维护。
import { editFileInEditor } from '../../utils/promptEditor.js';
// 复用 renderToString 工具函数，把通用处理留在 ../../utils/staticRender.js 中维护。
import { renderToString } from '../../utils/staticRender.js';
// PlanDisplay 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function PlanDisplay(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    planContent,
    planPath,
    editorName
  } = t0;
  // t1 暂存 `<Text bold={true}>Current Plan</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text bold={true}>Current Plan</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text bold={true}>Current Plan</Text>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `<Text dimColor={true}>{planPath}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== planPath) {
    // t2 暂存 `<Text dimColor={true}>{planPath}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text dimColor={true}>{planPath}</Text>;
    // $[1] 缓存 `planPath`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = planPath;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `<Box marginTop={1}><Text>{planContent}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== planContent) {
    // t3 暂存 `<Box marginTop={1}><Text>{planContent}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box marginTop={1}><Text>{planContent}</Text></Box>;
    // $[3] 缓存 `planContent`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = planContent;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `editorName && <Box marginTop={1}><Text dimColor={true}>"/...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== editorName) {
    // t4 暂存 `editorName && <Box marginTop={1}><Text dimColor={true}>"/...` 生成的渲染片段，后续返回路径直接复用。
    t4 = editorName && <Box marginTop={1}><Text dimColor={true}>"/plan open"</Text><Text dimColor={true}> to edit this plan in </Text><Text bold={true} dimColor={true}>{editorName}</Text></Box>;
    // $[5] 缓存 `editorName`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = editorName;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Box flexDirection="column">{t1}{t2}{t3}{t4}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t2 || $[8] !== t3 || $[9] !== t4) {
    // t5 暂存 `<Box flexDirection="column">{t1}{t2}{t3}{t4}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column">{t1}{t2}{t3}{t4}</Box>;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // 返回 `t5`，作为命令处理这次计算的结果。
  return t5;
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, context: LocalJSXCommandContext, args: string): Promise<React.ReactNode> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    getAppState,
    setAppState
  } = context;
  // appState 状态读取`getAppState`，供命令处理后续处理使用。
  const appState = getAppState();
  // currentMode保存`appState.toolPermissionContext.mode`，供命令处理斜杠命令 plan后续判断或输出使用。
  const currentMode = appState.toolPermissionContext.mode;

  // If not in plan mode, enable it
  // `currentMode` 与 `'plan'` 不一致时刷新派生状态，避免使用过期结果。
  if (currentMode !== 'plan') {
    // 调用 handlePlanModeTransition，触发命令处理此处需要的副作用。
    handlePlanModeTransition(currentMode, 'plan');
    // setAppState 写入新的状态值，使命令处理后续读取保持一致。
    setAppState(prev => ({
      ...prev,
      toolPermissionContext: applyPermissionUpdate(prepareContextForPlanMode(prev.toolPermissionContext), {
        type: 'setMode',
        mode: 'plan',
        destination: 'session'
      })
    }));
    // description格式化`args.trim`，供命令处理后续处理使用。
    const description = args.trim();
    // `description && description` 与 `'open'` 不一致时刷新派生状态，避免使用过期结果。
    if (description && description !== 'open') {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('Enabled plan mode', {
        shouldQuery: true
      });
    } else {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone('Enabled plan mode');
    }
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }

  // Already in plan mode - show the current plan
  // planContent读取`getPlan`，供命令处理后续处理使用。
  const planContent = getPlan();
  // planPath 路径数据读取`getPlanFilePath`，供命令处理后续处理使用。
  const planPath = getPlanFilePath();
  // planContent缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!planContent) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('Already in plan mode. No plan written yet.');
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }

  // If user typed "/plan open", open in editor
  // argList 集合格式化`args.trim`，供命令处理后续处理使用。
  const argList = args.trim().split(/\s+/);
  // 当 `argList[0]` 匹配 `'open'` 时，命令处理执行对应分支。
  if (argList[0] === 'open') {
    // 结果保存`editFileInEditor`，供命令处理后续处理使用。
    const result = await editFileInEditor(planPath);
    // 满足 `result.error` 时，命令处理执行该分支。
    if (result.error) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Failed to open plan in editor: ${result.error}`);
    } else {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Opened plan in editor: ${planPath}`);
    }
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // editor读取`getExternalEditor`，供命令处理后续处理使用。
  const editor = getExternalEditor();
  // editorName保存`toIDEDisplayName`，供命令处理后续处理使用。
  const editorName = editor ? toIDEDisplayName(editor) : undefined;
  // display 命名 `<PlanDisplay planContent={planContent} planPath={planPath...`，让后续代码直接表达这个值的用途。
  const display = <PlanDisplay planContent={planContent} planPath={planPath} editorName={editorName} />;

  // Render to string and pass to onDone like local commands do
  // output保存`renderToString`，供命令处理后续处理使用。
  const output = await renderToString(display);
  // 调用 onDone，触发命令处理此处需要的副作用。
  onDone(output);
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImhhbmRsZVBsYW5Nb2RlVHJhbnNpdGlvbiIsIkxvY2FsSlNYQ29tbWFuZENvbnRleHQiLCJCb3giLCJUZXh0IiwiTG9jYWxKU1hDb21tYW5kT25Eb25lIiwiZ2V0RXh0ZXJuYWxFZGl0b3IiLCJ0b0lERURpc3BsYXlOYW1lIiwiYXBwbHlQZXJtaXNzaW9uVXBkYXRlIiwicHJlcGFyZUNvbnRleHRGb3JQbGFuTW9kZSIsImdldFBsYW4iLCJnZXRQbGFuRmlsZVBhdGgiLCJlZGl0RmlsZUluRWRpdG9yIiwicmVuZGVyVG9TdHJpbmciLCJQbGFuRGlzcGxheSIsInQwIiwiJCIsIl9jIiwicGxhbkNvbnRlbnQiLCJwbGFuUGF0aCIsImVkaXRvck5hbWUiLCJ0MSIsIlN5bWJvbCIsImZvciIsInQyIiwidDMiLCJ0NCIsInQ1IiwiY2FsbCIsIm9uRG9uZSIsImNvbnRleHQiLCJhcmdzIiwiUHJvbWlzZSIsIlJlYWN0Tm9kZSIsImdldEFwcFN0YXRlIiwic2V0QXBwU3RhdGUiLCJhcHBTdGF0ZSIsImN1cnJlbnRNb2RlIiwidG9vbFBlcm1pc3Npb25Db250ZXh0IiwibW9kZSIsInByZXYiLCJ0eXBlIiwiZGVzdGluYXRpb24iLCJkZXNjcmlwdGlvbiIsInRyaW0iLCJzaG91bGRRdWVyeSIsImFyZ0xpc3QiLCJzcGxpdCIsInJlc3VsdCIsImVycm9yIiwiZWRpdG9yIiwidW5kZWZpbmVkIiwiZGlzcGxheSIsIm91dHB1dCJdLCJzb3VyY2VzIjpbInBsYW4udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgaGFuZGxlUGxhbk1vZGVUcmFuc2l0aW9uIH0gZnJvbSAnLi4vLi4vYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbEpTWENvbW1hbmRDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29tbWFuZHMuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZE9uRG9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5pbXBvcnQgeyBnZXRFeHRlcm5hbEVkaXRvciB9IGZyb20gJy4uLy4uL3V0aWxzL2VkaXRvci5qcydcbmltcG9ydCB7IHRvSURFRGlzcGxheU5hbWUgfSBmcm9tICcuLi8uLi91dGlscy9pZGUuanMnXG5pbXBvcnQgeyBhcHBseVBlcm1pc3Npb25VcGRhdGUgfSBmcm9tICcuLi8uLi91dGlscy9wZXJtaXNzaW9ucy9QZXJtaXNzaW9uVXBkYXRlLmpzJ1xuaW1wb3J0IHsgcHJlcGFyZUNvbnRleHRGb3JQbGFuTW9kZSB9IGZyb20gJy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL3Blcm1pc3Npb25TZXR1cC5qcydcbmltcG9ydCB7IGdldFBsYW4sIGdldFBsYW5GaWxlUGF0aCB9IGZyb20gJy4uLy4uL3V0aWxzL3BsYW5zLmpzJ1xuaW1wb3J0IHsgZWRpdEZpbGVJbkVkaXRvciB9IGZyb20gJy4uLy4uL3V0aWxzL3Byb21wdEVkaXRvci5qcydcbmltcG9ydCB7IHJlbmRlclRvU3RyaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc3RhdGljUmVuZGVyLmpzJ1xuXG5mdW5jdGlvbiBQbGFuRGlzcGxheSh7XG4gIHBsYW5Db250ZW50LFxuICBwbGFuUGF0aCxcbiAgZWRpdG9yTmFtZSxcbn06IHtcbiAgcGxhbkNvbnRlbnQ6IHN0cmluZ1xuICBwbGFuUGF0aDogc3RyaW5nXG4gIGVkaXRvck5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8VGV4dCBib2xkPkN1cnJlbnQgUGxhbjwvVGV4dD5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPntwbGFuUGF0aH08L1RleHQ+XG4gICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgIDxUZXh0PntwbGFuQ29udGVudH08L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICAgIHtlZGl0b3JOYW1lICYmIChcbiAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiZxdW90Oy9wbGFuIG9wZW4mcXVvdDs8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+IHRvIGVkaXQgdGhpcyBwbGFuIGluIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBib2xkIGRpbUNvbG9yPlxuICAgICAgICAgICAge2VkaXRvck5hbWV9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGwoXG4gIG9uRG9uZTogTG9jYWxKU1hDb21tYW5kT25Eb25lLFxuICBjb250ZXh0OiBMb2NhbEpTWENvbW1hbmRDb250ZXh0LFxuICBhcmdzOiBzdHJpbmcsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZT4ge1xuICBjb25zdCB7IGdldEFwcFN0YXRlLCBzZXRBcHBTdGF0ZSB9ID0gY29udGV4dFxuICBjb25zdCBhcHBTdGF0ZSA9IGdldEFwcFN0YXRlKClcbiAgY29uc3QgY3VycmVudE1vZGUgPSBhcHBTdGF0ZS50b29sUGVybWlzc2lvbkNvbnRleHQubW9kZVxuXG4gIC8vIElmIG5vdCBpbiBwbGFuIG1vZGUsIGVuYWJsZSBpdFxuICBpZiAoY3VycmVudE1vZGUgIT09ICdwbGFuJykge1xuICAgIGhhbmRsZVBsYW5Nb2RlVHJhbnNpdGlvbihjdXJyZW50TW9kZSwgJ3BsYW4nKVxuICAgIHNldEFwcFN0YXRlKHByZXYgPT4gKHtcbiAgICAgIC4uLnByZXYsXG4gICAgICB0b29sUGVybWlzc2lvbkNvbnRleHQ6IGFwcGx5UGVybWlzc2lvblVwZGF0ZShcbiAgICAgICAgcHJlcGFyZUNvbnRleHRGb3JQbGFuTW9kZShwcmV2LnRvb2xQZXJtaXNzaW9uQ29udGV4dCksXG4gICAgICAgIHsgdHlwZTogJ3NldE1vZGUnLCBtb2RlOiAncGxhbicsIGRlc3RpbmF0aW9uOiAnc2Vzc2lvbicgfSxcbiAgICAgICksXG4gICAgfSkpXG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSBhcmdzLnRyaW0oKVxuICAgIGlmIChkZXNjcmlwdGlvbiAmJiBkZXNjcmlwdGlvbiAhPT0gJ29wZW4nKSB7XG4gICAgICBvbkRvbmUoJ0VuYWJsZWQgcGxhbiBtb2RlJywgeyBzaG91bGRRdWVyeTogdHJ1ZSB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBvbkRvbmUoJ0VuYWJsZWQgcGxhbiBtb2RlJylcbiAgICB9XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIEFscmVhZHkgaW4gcGxhbiBtb2RlIC0gc2hvdyB0aGUgY3VycmVudCBwbGFuXG4gIGNvbnN0IHBsYW5Db250ZW50ID0gZ2V0UGxhbigpXG4gIGNvbnN0IHBsYW5QYXRoID0gZ2V0UGxhbkZpbGVQYXRoKClcblxuICBpZiAoIXBsYW5Db250ZW50KSB7XG4gICAgb25Eb25lKCdBbHJlYWR5IGluIHBsYW4gbW9kZS4gTm8gcGxhbiB3cml0dGVuIHlldC4nKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBJZiB1c2VyIHR5cGVkIFwiL3BsYW4gb3BlblwiLCBvcGVuIGluIGVkaXRvclxuICBjb25zdCBhcmdMaXN0ID0gYXJncy50cmltKCkuc3BsaXQoL1xccysvKVxuICBpZiAoYXJnTGlzdFswXSA9PT0gJ29wZW4nKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZWRpdEZpbGVJbkVkaXRvcihwbGFuUGF0aClcbiAgICBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgICBvbkRvbmUoYEZhaWxlZCB0byBvcGVuIHBsYW4gaW4gZWRpdG9yOiAke3Jlc3VsdC5lcnJvcn1gKVxuICAgIH0gZWxzZSB7XG4gICAgICBvbkRvbmUoYE9wZW5lZCBwbGFuIGluIGVkaXRvcjogJHtwbGFuUGF0aH1gKVxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3QgZWRpdG9yID0gZ2V0RXh0ZXJuYWxFZGl0b3IoKVxuICBjb25zdCBlZGl0b3JOYW1lID0gZWRpdG9yID8gdG9JREVEaXNwbGF5TmFtZShlZGl0b3IpIDogdW5kZWZpbmVkXG5cbiAgY29uc3QgZGlzcGxheSA9IChcbiAgICA8UGxhbkRpc3BsYXlcbiAgICAgIHBsYW5Db250ZW50PXtwbGFuQ29udGVudH1cbiAgICAgIHBsYW5QYXRoPXtwbGFuUGF0aH1cbiAgICAgIGVkaXRvck5hbWU9e2VkaXRvck5hbWV9XG4gICAgLz5cbiAgKVxuXG4gIC8vIFJlbmRlciB0byBzdHJpbmcgYW5kIHBhc3MgdG8gb25Eb25lIGxpa2UgbG9jYWwgY29tbWFuZHMgZG9cbiAgY29uc3Qgb3V0cHV0ID0gYXdhaXQgcmVuZGVyVG9TdHJpbmcoZGlzcGxheSlcbiAgb25Eb25lKG91dHB1dClcbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0Msd0JBQXdCLFFBQVEsMEJBQTBCO0FBQ25FLGNBQWNDLHNCQUFzQixRQUFRLG1CQUFtQjtBQUMvRCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLGNBQWNDLHFCQUFxQixRQUFRLHdCQUF3QjtBQUNuRSxTQUFTQyxpQkFBaUIsUUFBUSx1QkFBdUI7QUFDekQsU0FBU0MsZ0JBQWdCLFFBQVEsb0JBQW9CO0FBQ3JELFNBQVNDLHFCQUFxQixRQUFRLDZDQUE2QztBQUNuRixTQUFTQyx5QkFBeUIsUUFBUSw0Q0FBNEM7QUFDdEYsU0FBU0MsT0FBTyxFQUFFQyxlQUFlLFFBQVEsc0JBQXNCO0FBQy9ELFNBQVNDLGdCQUFnQixRQUFRLDZCQUE2QjtBQUM5RCxTQUFTQyxjQUFjLFFBQVEsNkJBQTZCO0FBRTVELFNBQUFDLFlBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBcUI7SUFBQUMsV0FBQTtJQUFBQyxRQUFBO0lBQUFDO0VBQUEsSUFB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