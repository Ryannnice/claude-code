// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 类型依赖 { UUID } 来自 crypto，用于校准命令处理的数据契约。
import type { UUID } from 'crypto';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 复用 Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { Select } from '../../components/CustomSelect/select.js';
// 复用 Dialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { Dialog } from '../../components/design-system/Dialog.js';
// 引入 COMMON_HELP_ARGS、COMMON_INFO_ARGS，将 ../../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { COMMON_HELP_ARGS, COMMON_INFO_ARGS } from '../../constants/xml.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 复用 recursivelySanitizeUnicode 工具函数，把通用处理留在 ../../utils/sanitization.js 中维护。
import { recursivelySanitizeUnicode } from '../../utils/sanitization.js';
// 复用 getCurrentSessionTag、getTranscriptPath、saveTag 工具函数，把通用处理留在 ../../utils/sessionStorage.js 中维护。
import { getCurrentSessionTag, getTranscriptPath, saveTag } from '../../utils/sessionStorage.js';
// ConfirmRemoveTag 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ConfirmRemoveTag(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    tagName,
    onConfirm,
    onCancel
  } = t0;
  // 临时值 t1 命名 ``Current tag: #${tagName}``，让后续代码直接表达这个值的用途。
  const t1 = `Current tag: #${tagName}`;
  // t2 暂存 `<Text>This will remove the tag from the current session.<...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Text>This will remove the tag from the current session.<...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text>This will remove the tag from the current session.</Text>;
    // $[0] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[0];
  }
  // t3 暂存 `value => value === "yes" ? onConfirm() : onCancel()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onCancel || $[2] !== onConfirm) {
    // t3 暂存 `value => value === "yes" ? onConfirm() : onCancel()` 生成的渲染片段，后续返回路径直接复用。
    t3 = value => value === "yes" ? onConfirm() : onCancel();
    // $[1] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onCancel;
    // $[2] 缓存 `onConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onConfirm;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // t4 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t4 = [{
      label: "Yes, remove tag",
      value: "yes"
    }, {
      label: "No, keep tag",
      value: "no"
    }];
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // t5 暂存 `<Box flexDirection="column" gap={1}>{t2}<Select onChange=...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t3) {
    // t5 暂存 `<Box flexDirection="column" gap={1}>{t2}<Select onChange=...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column" gap={1}>{t2}<Select onChange={t3} options={t4} /></Box>;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // t6 暂存 `<Dialog title="Remove tag?" subtitle={t1} onCancel={onCan...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== onCancel || $[8] !== t1 || $[9] !== t5) {
    // t6 暂存 `<Dialog title="Remove tag?" subtitle={t1} onCancel={onCan...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Dialog title="Remove tag?" subtitle={t1} onCancel={onCancel} color="warning">{t5}</Dialog>;
    // $[7] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onCancel;
    // $[8] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t1;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[10];
  }
  // 返回 `t6`，作为命令处理这次计算的结果。
  return t6;
}
// ToggleTagAndClose 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ToggleTagAndClose(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(17);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    tagName,
    onDone
  } = t0;
  // 从 `React.useState(false)` 按位置拆出 showConfirm、setShowConfirm，让斜杠命令 tag分别处理这些返回值。
  const [showConfirm, setShowConfirm] = React.useState(false);
  // 从 `React.useState(null)` 按位置拆出 sessionId、setSessionId，让斜杠命令 tag分别处理这些返回值。
  const [sessionId, setSessionId] = React.useState(null);
  // t1 暂存 `recursivelySanitizeUnicode(tagName).trim()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== tagName) {
    // t1 暂存 `recursivelySanitizeUnicode(tagName).trim()` 生成的渲染片段，后续返回路径直接复用。
    t1 = recursivelySanitizeUnicode(tagName).trim();
    // $[0] 缓存 `tagName`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = tagName;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // normalizedTag保存`t1`，作为后续临时缓存值处理的输入。
  const normalizedTag = t1;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== normalizedTag || $[3] !== onDone) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 标识符读取`getSessionId`，供命令处理后续处理使用。
      const id = getSessionId() as UUID;
      // 标识符缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!id) {
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone("No active session to tag", {
          display: "system"
        });
        // 斜杠命令 tag在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // normalizedTag缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!normalizedTag) {
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone("Tag name cannot be empty", {
          display: "system"
        });
        // 斜杠命令 tag在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setSessionId 写入新的状态值，使命令处理后续读取保持一致。
      setSessionId(id);
      // currentTag读取`getCurrentSessionTag`，供命令处理后续处理使用。
      const currentTag = getCurrentSessionTag(id);
      // 满足 `currentTag === normalizedTag` 时，命令处理执行该分支。
      if (currentTag === normalizedTag) {
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_tag_command_remove_prompt", {});
        // setShowConfirm 写入新的状态值，使命令处理后续读取保持一致。
        setShowConfirm(true);
      } else {
        // isReplacing标记命令处理斜杠命令 tag是否启用对应路径。
        const isReplacing = !!currentTag;
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_tag_command_add", {
          is_replacing: isReplacing
        });
        // 这个回调绑定到 (async () => {，负责命令处理在该局部场景下的响应。
        (async () => {
          // fullPath 路径数据读取`getTranscriptPath`，供命令处理后续处理使用。
          const fullPath = getTranscriptPath();
          // 等待 `saveTag(id, normalizedTag, fullPath)` 完成，再继续斜杠命令 tag的异步流程。
          await saveTag(id, normalizedTag, fullPath);
          // 调用 onDone，触发命令处理此处需要的副作用。
          onDone(`Tagged session with ${chalk.cyan(`#${normalizedTag}`)}`, {
            display: "system"
          });
        })();
      }
    };
    // t3 暂存 `[normalizedTag, onDone]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [normalizedTag, onDone];
    // $[2] 缓存 `normalizedTag`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = normalizedTag;
    // $[3] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onDone;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // 调用 React.useEffect，触发命令处理此处需要的副作用。
  React.useEffect(t2, t3);
  // 只有 `showConfirm && sessionId` 满足时，命令处理才执行该分支。
  if (showConfirm && sessionId) {
    // t4 暂存 `async () => {` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[6] !== normalizedTag || $[7] !== onDone || $[8] !== sessionId) {
      // t4 暂存 `async () => {` 生成的渲染片段，后续返回路径直接复用。
      t4 = async () => {
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_tag_command_remove_confirmed", {});
        // fullPath_0 路径数据读取`getTranscriptPath`，供命令处理后续处理使用。
        const fullPath_0 = getTranscriptPath();
        // 等待 `saveTag(sessionId, "", fullPath_0)` 完成，再继续斜杠命令 tag的异步流程。
        await saveTag(sessionId, "", fullPath_0);
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone(`Removed tag ${chalk.cyan(`#${normalizedTag}`)}`, {
          display: "system"
        });
      };
      // $[6] 缓存 `normalizedTag`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = normalizedTag;
      // $[7] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = onDone;
      // $[8] 缓存 `sessionId`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = sessionId;
      // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[9];
    }
    // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== normalizedTag || $[11] !== onDone) {
      // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
      t5 = () => {
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_tag_command_remove_cancelled", {});
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone(`Kept tag ${chalk.cyan(`#${normalizedTag}`)}`, {
          display: "system"
        });
      };
      // $[10] 缓存 `normalizedTag`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = normalizedTag;
      // $[11] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = onDone;
      // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[12];
    }
    // t6 暂存 `<ConfirmRemoveTag tagName={normalizedTag} onConfirm={t4} ...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[13] !== normalizedTag || $[14] !== t4 || $[15] !== t5) {
      // t6 暂存 `<ConfirmRemoveTag tagName={normalizedTag} onConfirm={t4} ...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <ConfirmRemoveTag tagName={normalizedTag} onConfirm={t4} onCancel={t5} />;
      // $[13] 缓存 `normalizedTag`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = normalizedTag;
      // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t4;
      // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t5;
      // $[16] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[16];
    }
    // 返回 `t6`，作为命令处理这次计算的结果。
    return t6;
  }
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
}
// ShowHelp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ShowHelp(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
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
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone("Usage: /tag <tag-name>\n\nToggle a searchable tag on the current session.\nRun the same command again to remove the tag.\nTags are displayed after the branch name in /resume and can be searched with /.\n\nExamples:\n  /tag bugfix        # Add tag\n  /tag bugfix        # Remove tag (toggle)\n  /tag feature-auth\n  /tag wip", {
        display: "system"
      });
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
  // 调用 React.useEffect，触发命令处理此处需要的副作用。
  React.useEffect(t1, t2);
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, _context: unknown, args?: string): Promise<React.ReactNode> {
  // 参数列表更新为 `args?.trim() || ''`，确保斜杠命令后续读取最新状态。
  args = args?.trim() || '';
  // 只有 `COMMON_INFO_ARGS.includes(args) || COMMON_HELP_ARGS.includes(args)` 满足时，命令处理才执行该分支。
  if (COMMON_INFO_ARGS.includes(args) || COMMON_HELP_ARGS.includes(args)) {
    // 返回 `<ShowHelp onDone={onDone} />`，作为命令处理这次计算的结果。
    return <ShowHelp onDone={onDone} />;
  }
  // 参数列表缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!args) {
    // 返回 `<ShowHelp onDone={onDone} />`，作为命令处理这次计算的结果。
    return <ShowHelp onDone={onDone} />;
  }
  // 返回 `<ToggleTagAndClose tagName={args} onDone={onDone} />`，作为命令处理这次计算的结果。
  return <ToggleTagAndClose tagName={args} onDone={onDone} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsIlVVSUQiLCJSZWFjdCIsImdldFNlc3Npb25JZCIsIkNvbW1hbmRSZXN1bHREaXNwbGF5IiwiU2VsZWN0IiwiRGlhbG9nIiwiQ09NTU9OX0hFTFBfQVJHUyIsIkNPTU1PTl9JTkZPX0FSR1MiLCJCb3giLCJUZXh0IiwibG9nRXZlbnQiLCJMb2NhbEpTWENvbW1hbmRPbkRvbmUiLCJyZWN1cnNpdmVseVNhbml0aXplVW5pY29kZSIsImdldEN1cnJlbnRTZXNzaW9uVGFnIiwiZ2V0VHJhbnNjcmlwdFBhdGgiLCJzYXZlVGFnIiwiQ29uZmlybVJlbW92ZVRhZyIsInQwIiwiJCIsIl9jIiwidGFnTmFtZSIsIm9uQ29uZmlybSIsIm9uQ2FuY2VsIiwidDEiLCJ0MiIsIlN5bWJvbCIsImZvciIsInQzIiwidmFsdWUiLCJ0NCIsImxhYmVsIiwidDUiLCJ0NiIsIlRvZ2dsZVRhZ0FuZENsb3NlIiwib25Eb25lIiwic2hvd0NvbmZpcm0iLCJzZXRTaG93Q29uZmlybSIsInVzZVN0YXRlIiwic2Vzc2lvbklkIiwic2V0U2Vzc2lvbklkIiwidHJpbSIsIm5vcm1hbGl6ZWRUYWciLCJpZCIsImRpc3BsYXkiLCJjdXJyZW50VGFnIiwiaXNSZXBsYWNpbmciLCJpc19yZXBsYWNpbmciLCJmdWxsUGF0aCIsImN5YW4iLCJ1c2VFZmZlY3QiLCJmdWxsUGF0aF8wIiwiU2hvd0hlbHAiLCJjYWxsIiwiX2NvbnRleHQiLCJhcmdzIiwiUHJvbWlzZSIsIlJlYWN0Tm9kZSIsImluY2x1ZGVzIl0sInNvdXJjZXMiOlsidGFnLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgdHlwZSB7IFVVSUQgfSBmcm9tICdjcnlwdG8nXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGdldFNlc3Npb25JZCB9IGZyb20gJy4uLy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgQ29tbWFuZFJlc3VsdERpc3BsYXkgfSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyBDT01NT05fSEVMUF9BUkdTLCBDT01NT05fSU5GT19BUkdTIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL3htbC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGxvZ0V2ZW50IH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbEpTWENvbW1hbmRPbkRvbmUgfSBmcm9tICcuLi8uLi90eXBlcy9jb21tYW5kLmpzJ1xuaW1wb3J0IHsgcmVjdXJzaXZlbHlTYW5pdGl6ZVVuaWNvZGUgfSBmcm9tICcuLi8uLi91dGlscy9zYW5pdGl6YXRpb24uanMnXG5pbXBvcnQge1xuICBnZXRDdXJyZW50U2Vzc2lvblRhZyxcbiAgZ2V0VHJhbnNjcmlwdFBhdGgsXG4gIHNhdmVUYWcsXG59IGZyb20gJy4uLy4uL3V0aWxzL3Nlc3Npb25TdG9yYWdlLmpzJ1xuXG5mdW5jdGlvbiBDb25maXJtUmVtb3ZlVGFnKHtcbiAgdGFnTmFtZSxcbiAgb25Db25maXJtLFxuICBvbkNhbmNlbCxcbn06IHtcbiAgdGFnTmFtZTogc3RyaW5nXG4gIG9uQ29uZmlybTogKCkgPT4gdm9pZFxuICBvbkNhbmNlbDogKCkgPT4gdm9pZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1xuICAgICAgdGl0bGU9XCJSZW1vdmUgdGFnP1wiXG4gICAgICBzdWJ0aXRsZT17YEN1cnJlbnQgdGFnOiAjJHt0YWdOYW1lfWB9XG4gICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICBjb2xvcj1cIndhcm5pbmdcIlxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgIDxUZXh0PlRoaXMgd2lsbCByZW1vdmUgdGhlIHRhZyBmcm9tIHRoZSBjdXJyZW50IHNlc3Npb24uPC9UZXh0PlxuICAgICAgICA8U2VsZWN0PCd5ZXMnIHwgJ25vJz5cbiAgICAgICAgICBvbkNoYW5nZT17dmFsdWUgPT4gKHZhbHVlID09PSAneWVzJyA/IG9uQ29uZmlybSgpIDogb25DYW5jZWwoKSl9XG4gICAgICAgICAgb3B0aW9ucz17W1xuICAgICAgICAgICAgeyBsYWJlbDogJ1llcywgcmVtb3ZlIHRhZycsIHZhbHVlOiAneWVzJyB9LFxuICAgICAgICAgICAgeyBsYWJlbDogJ05vLCBrZWVwIHRhZycsIHZhbHVlOiAnbm8nIH0sXG4gICAgICAgICAgXX1cbiAgICAgICAgLz5cbiAgICAgIDwvQm94PlxuICAgIDwvRGlhbG9nPlxuICApXG59XG5cbmZ1bmN0aW9uIFRvZ2dsZVRhZ0FuZENsb3NlKHtcbiAgdGFnTmFtZSxcbiAgb25Eb25lLFxufToge1xuICB0YWdOYW1lOiBzdHJpbmdcbiAgb25Eb25lOiAoXG4gICAgcmVzdWx0Pzogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiB7IGRpc3BsYXk/OiBDb21tYW5kUmVzdWx0RGlzcGxheSB9LFxuICApID0+IHZvaWRcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbc2hvd0NvbmZpcm0sIHNldFNob3dDb25maXJtXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbc2Vzc2lvbklkLCBzZXRTZXNzaW9uSWRdID0gUmVhY3QudXNlU3RhdGU8VVVJRCB8IG51bGw+KG51bGwpXG4gIC8vIFNhbml0aXplIHVuaWNvZGUgdG8gcHJldmVudCBoaWRkZW4gY2hhcmFjdGVyIGF0dGFja3MgYW5kIG5vcm1hbGl6ZVxuICBjb25zdCBub3JtYWxpemVkVGFnID0gcmVjdXJzaXZlbHlTYW5pdGl6ZVVuaWNvZGUodGFnTmFtZSkudHJpbSgpXG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBpZCA9IGdldFNlc3Npb25JZCgpIGFzIFVVSURcblxuICAgIGlmICghaWQpIHtcbiAgICAgIG9uRG9uZSgnTm8gYWN0aXZlIHNlc3Npb24gdG8gdGFnJywgeyBkaXNwbGF5OiAnc3lzdGVtJyB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKCFub3JtYWxpemVkVGFnKSB7XG4gICAgICBvbkRvbmUoJ1RhZyBuYW1lIGNhbm5vdCBiZSBlbXB0eScsIHsgZGlzcGxheTogJ3N5c3RlbScgfSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHNldFNlc3Npb25JZChpZClcbiAgICBjb25zdCBjdXJyZW50VGFnID0gZ2V0Q3VycmVudFNlc3Npb25UYWcoaWQpXG5cbiAgICAvLyBJZiBzYW1lIHRhZyBleGlzdHMsIHNob3cgY29uZmlybWF0aW9uIGRpYWxvZ1xuICAgIGlmIChjdXJyZW50VGFnID09PSBub3JtYWxpemVkVGFnKSB7XG4gICAgICBsb2dFdmVudCgndGVuZ3VfdGFnX2NvbW1hbmRfcmVtb3ZlX3Byb21wdCcsIHt9KVxuICAgICAgc2V0U2hvd0NvbmZpcm0odHJ1ZSlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQWRkIHRoZSBuZXcgdGFnIGRpcmVjdGx5XG4gICAgICBjb25zdCBpc1JlcGxhY2luZyA9ICEhY3VycmVudFRhZ1xuICAgICAgbG9nRXZlbnQoJ3Rlbmd1X3RhZ19jb21tYW5kX2FkZCcsIHsgaXNfcmVwbGFjaW5nOiBpc1JlcGxhY2luZyB9KVxuICAgICAgdm9pZCAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IGdldFRyYW5zY3JpcHRQYXRoKClcbiAgICAgICAgYXdhaXQgc2F2ZVRhZyhpZCwgbm9ybWFsaXplZFRhZywgZnVsbFBhdGgpXG4gICAgICAgIG9uRG9uZShgVGFnZ2VkIHNlc3Npb24gd2l0aCAke2NoYWxrLmN5YW4oYCMke25vcm1hbGl6ZWRUYWd9YCl9YCwge1xuICAgICAgICAgIGRpc3BsYXk6ICdzeXN0ZW0nLFxuICAgICAgICB9KVxuICAgICAgfSkoKVxuICAgIH1cbiAgfSwgW25vcm1hbGl6ZWRUYWcsIG9uRG9uZV0pXG5cbiAgaWYgKHNob3dDb25maXJtICYmIHNlc3Npb25JZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Q29uZmlybVJlbW92ZVRhZ1xuICAgICAgICB0YWdOYW1lPXtub3JtYWxpemVkVGFnfVxuICAgICAgICBvbkNvbmZpcm09e2FzeW5jICgpID0+IHtcbiAgICAgICAgICBsb2dFdmVudCgndGVuZ3VfdGFnX2NvbW1hbmRfcmVtb3ZlX2NvbmZpcm1lZCcsIHt9KVxuICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gZ2V0VHJhbnNjcmlwdFBhdGgoKVxuICAgICAgICAgIGF3YWl0IHNhdmVUYWcoc2Vzc2lvbklkLCAnJywgZnVsbFBhdGgpXG4gICAgICAgICAgb25Eb25lKGBSZW1vdmVkIHRhZyAke2NoYWxrLmN5YW4oYCMke25vcm1hbGl6ZWRUYWd9YCl9YCwge1xuICAgICAgICAgICAgZGlzcGxheTogJ3N5c3RlbScsXG4gICAgICAgICAgfSlcbiAgICAgICAgfX1cbiAgICAgICAgb25DYW5jZWw9eygpID0+IHtcbiAgICAgICAgICBsb2dFdmVudCgndGVuZ3VfdGFnX2NvbW1hbmRfcmVtb3ZlX2NhbmNlbGxlZCcsIHt9KVxuICAgICAgICAgIG9uRG9uZShgS2VwdCB0YWcgJHtjaGFsay5jeWFuKGAjJHtub3JtYWxpemVkVGFnfWApfWAsIHtcbiAgICAgICAgICAgIGRpc3BsYXk6ICdzeXN0ZW0nLFxuICAgICAgICAgIH0pXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIHJldHVybiBudWxsXG59XG5cbmZ1bmN0aW9uIFNob3dIZWxwKHtcbiAgb25Eb25lLFxufToge1xuICBvbkRvbmU6IChcbiAgICByZXN1bHQ/OiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IHsgZGlzcGxheT86IENvbW1hbmRSZXN1bHREaXNwbGF5IH0sXG4gICkgPT4gdm9pZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgb25Eb25lKFxuICAgICAgYFVzYWdlOiAvdGFnIDx0YWctbmFtZT5cblxuVG9nZ2xlIGEgc2VhcmNoYWJsZSB0YWcgb24gdGhlIGN1cnJlbnQgc2Vzc2lvbi5cblJ1biB0aGUgc2FtZSBjb21tYW5kIGFnYWluIHRvIHJlbW92ZSB0aGUgdGFnLlxuVGFncyBhcmUgZGlzcGxheWVkIGFmdGVyIHRoZSBicmFuY2ggbmFtZSBpbiAvcmVzdW1lIGFuZCBjYW4gYmUgc2VhcmNoZWQgd2l0aCAvLlxuXG5FeGFtcGxlczpcbiAgL3RhZyBidWdmaXggICAgICAgICMgQWRkIHRhZ1xuICAvdGFnIGJ1Z2ZpeCAgICAgICAgIyBSZW1vdmUgdGFnICh0b2dnbGUpXG4gIC90YWcgZmVhdHVyZS1hdXRoXG4gIC90YWcgd2lwYCxcbiAgICAgIHsgZGlzcGxheTogJ3N5c3RlbScgfSxcbiAgICApXG4gIH0sIFtvbkRvbmVdKVxuXG4gIHJldHVybiBudWxsXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsKFxuICBvbkRvbmU6IExvY2FsSlNYQ29tbWFuZE9uRG9uZSxcbiAgX2NvbnRleHQ6IHVua25vd24sXG4gIGFyZ3M/OiBzdHJpbmcsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZT4ge1xuICBhcmdzID0gYXJncz8udHJpbSgpIHx8ICcnXG5cbiAgaWYgKENPTU1PTl9JTkZPX0FSR1MuaW5jbHVkZXMoYXJncykgfHwgQ09NTU9OX0hFTFBfQVJHUy5pbmNsdWRlcyhhcmdzKSkge1xuICAgIHJldHVybiA8U2hvd0hlbHAgb25Eb25lPXtvbkRvbmV9IC8+XG4gIH1cblxuICBpZiAoIWFyZ3MpIHtcbiAgICByZXR1cm4gPFNob3dIZWxwIG9uRG9uZT17b25Eb25lfSAvPlxuICB9XG5cbiAgcmV0dXJuIDxUb2dnbGVUYWdBbmRDbG9zZSB0YWdOYW1lPXthcmdzfSBvbkRvbmU9e29uRG9uZX0gLz5cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLGNBQWNDLElBQUksUUFBUSxRQUFRO0FBQ2xDLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsWUFBWSxRQUFRLDBCQUEwQjtBQUN2RCxjQUFjQyxvQkFBb0IsUUFBUSxtQkFBbUI7QUFDN0QsU0FBU0MsTUFBTSxRQUFRLHlDQUF5QztBQUNoRSxTQUFTQyxNQUFNLFFBQVEsMENBQTBDO0FBQ2pFLFNBQVNDLGdCQUFnQixFQUFFQyxnQkFBZ0IsUUFBUSx3QkFBd0I7QUFDM0UsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxRQUFRLFFBQVEsbUNBQW1DO0FBQzVELGNBQWNDLHFCQUFxQixRQUFRLHdCQUF3QjtBQUNuRSxTQUFTQywwQkFBMEIsUUFBUSw2QkFBNkI7QUFDeEUsU0FDRUMsb0JBQW9CLEVBQ3BCQyxpQkFBaUIsRUFDakJDLE9BQU8sUUFDRiwrQkFBK0I7QUFFdEMsU0FBQUMsaUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBMEI7SUFBQUMsT0FBQTtJQUFBQyxTQUFBO0lBQUFDO0VBQUEsSUFBQUwsRUFRekI7RUFJZSxNQUFBTSxFQUFBLG9CQUFpQkgsT0FBTyxFQUFFO0VBQUEsSUFBQUksRUFBQTtFQUFBLElBQUFOLENBQUEsUUFBQU8sTUFBQSxDQUFBQyxHQUFBO0lBS2xDRixFQUFBLElBQUMsSUFBSSxDQUFDLGtEQUFrRCxFQUF2RCxJQUFJLENBQTBEO0lBQUFOLENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBQUEsSUFBQVMsRUFBQTtFQUFBLElBQUFULENBQUEsUUFBQUksUUFBQSxJQUFBSixDQUFBLFFBQUFHLFNBQUE7SUFFbkRNLEVBQUEsR0FBQUMsS0FBQSxJQUFVQSxLQUFLLEtBQUssS0FBZ0MsR0FBeEJQLFNBQVMsQ0FBYyxDQUFDLEdBQVZDLFFBQVEsQ0FBQyxDQUFFO0lBQUFKLENBQUEsTUFBQUksUUFBQTtJQUFBSixDQUFBLE1BQUFHLFNBQUE7SUFBQUgsQ0FBQSxNQUFBUyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBVCxDQUFBO0VBQUE7RUFBQSxJQUFBVyxFQUFBO0VBQUEsSUFBQVgsQ0FBQSxRQUFBTyxNQUFBLENBQUFDLEdBQUE7SUFDdERHLEVBQUEsSUFDUDtNQUFBQyxLQUFBLEVBQVMsaUJBQWlCO01BQUFGLEtBQUEsRUFBUztJQUFNLENBQUMsRUFDMUM7TUFBQUUsS0FBQSxFQUFTLGNBQWM7TUFBQUYsS0FBQSxFQUFTO0lBQUssQ0FBQyxDQUN2QztJQUFBVixDQUFBLE1BQUFXLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFYLENBQUE7RUFBQTtFQUFBLElBQUFhLEVBQUE7RUFBQSxJQUFBYixDQUFBLFFBQUFTLEVBQUE7SUFQTEksRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFNLEdBQUMsQ0FBRCxHQUFDLENBQ2hDLENBQUFQLEVBQThELENBQzlELENBQUMsTUFBTSxDQUNLLFFBQXFELENBQXJELENBQUFHLEVBQW9ELENBQUMsQ0FDdEQsT0FHUixDQUhRLENBQUFFLEVBR1QsQ0FBQyxHQUVMLEVBVEMsR0FBRyxDQVNFO0lBQUFYLENBQUEsTUFBQVMsRUFBQTtJQUFBVCxDQUFBLE1BQUFhLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFiLENBQUE7RUFBQTtFQUFBLElBQUFjLEVBQUE7RUFBQSxJQUFBZCxDQUFBLFFBQUFJLFFBQUEsSUFBQUosQ0FBQSxRQUFBSyxFQUFBLElBQUFMLENBQUEsUUFBQWEsRUFBQTtJQWZSQyxFQUFBLElBQUMsTUFBTSxDQUNDLEtBQWEsQ0FBYixhQUFhLENBQ1QsUUFBMEIsQ0FBMUIsQ0FBQVQsRUFBeUIsQ0FBQyxDQUMxQkQsUUFBUSxDQUFSQSxTQUFPLENBQUMsQ0FDWixLQUFTLENBQVQsU0FBUyxDQUVmLENBQUFTLEVBU0ssQ0FDUCxFQWhCQyxNQUFNLENBZ0JFO0lBQUFiLENBQUEsTUFBQUksUUFBQTtJQUFBSixDQUFBLE1BQUFLLEVBQUE7SUFBQUwsQ0FBQSxNQUFBYSxFQUFBO0lBQUFiLENBQUEsT0FBQWMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWQsQ0FBQTtFQUFBO0VBQUEsT0FoQlRjLEVBZ0JTO0FBQUE7QUFJYixTQUFBQyxrQkFBQWhCLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBMkI7SUFBQUMsT0FBQTtJQUFBYztFQUFBLElBQUFqQixFQVMxQjtFQUNDLE9BQUFrQixXQUFBLEVBQUFDLGNBQUEsSUFBc0NuQyxLQUFLLENBQUFvQyxRQUFTLENBQUMsS0FBSyxDQUFDO0VBQzNELE9BQUFDLFNBQUEsRUFBQUMsWUFBQSxJQUFrQ3RDLEtBQUssQ0FBQW9DLFFBQVMsQ0FBYyxJQUFJLENBQUM7RUFBQSxJQUFBZCxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBRSxPQUFBO0lBRTdDRyxFQUFBLEdBQUFYLDBCQUEwQixDQUFDUSxPQUFPLENBQUMsQ0FBQW9CLElBQUssQ0FBQyxDQUFDO0lBQUF0QixDQUFBLE1BQUFFLE9BQUE7SUFBQUYsQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBTCxDQUFBO0VBQUE7RUFBaEUsTUFBQXVCLGFBQUEsR0FBc0JsQixFQUEwQztFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQVQsQ0FBQSxRQUFBdUIsYUFBQSxJQUFBdkIsQ0FBQSxRQUFBZ0IsTUFBQTtJQUVoRFYsRUFBQSxHQUFBQSxDQUFBO01BQ2QsTUFBQWtCLEVBQUEsR0FBV3hDLFlBQVksQ0FBQyxDQUFDLElBQUlGLElBQUk7TUFFakMsSUFBSSxDQUFDMEMsRUFBRTtRQUNMUixNQUFNLENBQUMsMEJBQTBCLEVBQUU7VUFBQVMsT0FBQSxFQUFXO1FBQVMsQ0FBQyxDQUFDO1FBQUE7TUFBQTtNQUkzRCxJQUFJLENBQUNGLGFBQWE7UUFDaEJQLE1BQU0sQ0FBQywwQkFBMEIsRUFBRTtVQUFBUyxPQUFBLEVBQVc7UUFBUyxDQUFDLENBQUM7UUFBQTtNQUFBO01BSTNESixZQUFZLENBQUNHLEVBQUUsQ0FBQztNQUNoQixNQUFBRSxVQUFBLEdBQW1CL0Isb0JBQW9CLENBQUM2QixFQUFFLENBQUM7TUFHM0MsSUFBSUUsVUFBVSxLQUFLSCxhQUFhO1FBQzlCL0IsUUFBUSxDQUFDLGlDQUFpQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9DMEIsY0FBYyxDQUFDLElBQUksQ0FBQztNQUFBO1FBR3BCLE1BQUFTLFdBQUEsR0FBb0IsQ0FBQyxDQUFDRCxVQUFVO1FBQ2hDbEMsUUFBUSxDQUFDLHVCQUF1QixFQUFFO1VBQUFvQyxZQUFBLEVBQWdCRDtRQUFZLENBQUMsQ0FBQztRQUMzRCxDQUFDO1VBQ0osTUFBQUUsUUFBQSxHQUFpQmpDLGlCQUFpQixDQUFDLENBQUM7VUFDcEMsTUFBTUMsT0FBTyxDQUFDMkIsRUFBRSxFQUFFRCxhQUFhLEVBQUVNLFFBQVEsQ0FBQztVQUMxQ2IsTUFBTSxDQUFDLHVCQUF1Qm5DLEtBQUssQ0FBQWlELElBQUssQ0FBQyxJQUFJUCxhQUFhLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFBQUUsT0FBQSxFQUN0RDtVQUNYLENBQUMsQ0FBQztRQUFBLENBQ0gsRUFBRSxDQUFDO01BQUE7SUFDTCxDQUNGO0lBQUVoQixFQUFBLElBQUNjLGFBQWEsRUFBRVAsTUFBTSxDQUFDO0lBQUFoQixDQUFBLE1BQUF1QixhQUFBO0lBQUF2QixDQUFBLE1BQUFnQixNQUFBO0lBQUFoQixDQUFBLE1BQUFNLEVBQUE7SUFBQU4sQ0FBQSxNQUFBUyxFQUFBO0VBQUE7SUFBQUgsRUFBQSxHQUFBTixDQUFBO0lBQUFTLEVBQUEsR0FBQVQsQ0FBQTtFQUFBO0VBaEMxQmpCLEtBQUssQ0FBQWdELFNBQVUsQ0FBQ3pCLEVBZ0NmLEVBQUVHLEVBQXVCLENBQUM7RUFFM0IsSUFBSVEsV0FBd0IsSUFBeEJHLFNBQXdCO0lBQUEsSUFBQVQsRUFBQTtJQUFBLElBQUFYLENBQUEsUUFBQXVCLGFBQUEsSUFBQXZCLENBQUEsUUFBQWdCLE1BQUEsSUFBQWhCLENBQUEsUUFBQW9CLFNBQUE7TUFJWFQsRUFBQSxTQUFBQSxDQUFBO1FBQ1RuQixRQUFRLENBQUMsb0NBQW9DLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEQsTUFBQXdDLFVBQUEsR0FBaUJwQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BDLE1BQU1DLE9BQU8sQ0FBQ3VCLFNBQVMsRUFBRSxFQUFFLEVBQUVTLFVBQVEsQ0FBQztRQUN0Q2IsTUFBTSxDQUFDLGVBQWVuQyxLQUFLLENBQUFpRCxJQUFLLENBQUMsSUFBSVAsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUFFO1VBQUFFLE9BQUEsRUFDOUM7UUFDWCxDQUFDLENBQUM7TUFBQSxDQUNIO01BQUF6QixDQUFBLE1BQUF1QixhQUFBO01BQUF2QixDQUFBLE1BQUFnQixNQUFBO01BQUFoQixDQUFBLE1BQUFvQixTQUFBO01BQUFwQixDQUFBLE1BQUFXLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFYLENBQUE7SUFBQTtJQUFBLElBQUFhLEVBQUE7SUFBQSxJQUFBYixDQUFBLFNBQUF1QixhQUFBLElBQUF2QixDQUFBLFNBQUFnQixNQUFBO01BQ1NILEVBQUEsR0FBQUEsQ0FBQTtRQUNSckIsUUFBUSxDQUFDLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xEd0IsTUFBTSxDQUFDLFlBQVluQyxLQUFLLENBQUFpRCxJQUFLLENBQUMsSUFBSVAsYUFBYSxFQUFFLENBQUMsRUFBRSxFQUFFO1VBQUFFLE9BQUEsRUFDM0M7UUFDWCxDQUFDLENBQUM7TUFBQSxDQUNIO01BQUF6QixDQUFBLE9BQUF1QixhQUFBO01BQUF2QixDQUFBLE9BQUFnQixNQUFBO01BQUFoQixDQUFBLE9BQUFhLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFiLENBQUE7SUFBQTtJQUFBLElBQUFjLEVBQUE7SUFBQSxJQUFBZCxDQUFBLFNBQUF1QixhQUFBLElBQUF2QixDQUFBLFNBQUFXLEVBQUEsSUFBQVgsQ0FBQSxTQUFBYSxFQUFBO01BZkhDLEVBQUEsSUFBQyxnQkFBZ0IsQ0FDTlMsT0FBYSxDQUFiQSxjQUFZLENBQUMsQ0FDWCxTQU9WLENBUFUsQ0FBQVosRUFPWCxDQUFDLENBQ1MsUUFLVCxDQUxTLENBQUFFLEVBS1YsQ0FBQyxHQUNEO01BQUFiLENBQUEsT0FBQXVCLGFBQUE7TUFBQXZCLENBQUEsT0FBQVcsRUFBQTtNQUFBWCxDQUFBLE9BQUFhLEVBQUE7TUFBQWIsQ0FBQSxPQUFBYyxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBZCxDQUFBO0lBQUE7SUFBQSxPQWhCRmMsRUFnQkU7RUFBQTtFQUVMLE9BRU0sSUFBSTtBQUFBO0FBR2IsU0FBQW1CLFNBQUFsQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWtCO0lBQUFlO0VBQUEsSUFBQWpCLEVBT2pCO0VBQUEsSUFBQU0sRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBTixDQUFBLFFBQUFnQixNQUFBO0lBQ2lCWCxFQUFBLEdBQUFBLENBQUE7TUFDZFcsTUFBTSxDQUNKLHFVQVVLLEVBQ0w7UUFBQVMsT0FBQSxFQUFXO01BQVMsQ0FDdEIsQ0FBQztJQUFBLENBQ0Y7SUFBRW5CLEVBQUEsSUFBQ1UsTUFBTSxDQUFDO0lBQUFoQixDQUFBLE1BQUFnQixNQUFBO0lBQUFoQixDQUFBLE1BQUFLLEVBQUE7SUFBQUwsQ0FBQSxNQUFBTSxFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBTCxDQUFBO0lBQUFNLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBZlhqQixLQUFLLENBQUFnRCxTQUFVLENBQUMxQixFQWVmLEVBQUVDLEVBQVEsQ0FBQztFQUFBLE9BRUwsSUFBSTtBQUFBO0FBR2IsT0FBTyxlQUFlNEIsSUFBSUEsQ0FDeEJsQixNQUFNLEVBQUV2QixxQkFBcUIsRUFDN0IwQyxRQUFRLEVBQUUsT0FBTyxFQUNqQkMsSUFBYSxDQUFSLEVBQUUsTUFBTSxDQUNkLEVBQUVDLE9BQU8sQ0FBQ3RELEtBQUssQ0FBQ3VELFNBQVMsQ0FBQyxDQUFDO0VBQzFCRixJQUFJLEdBQUdBLElBQUksRUFBRWQsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFO0VBRXpCLElBQUlqQyxnQkFBZ0IsQ0FBQ2tELFFBQVEsQ0FBQ0gsSUFBSSxDQUFDLElBQUloRCxnQkFBZ0IsQ0FBQ21ELFFBQVEsQ0FBQ0gsSUFBSSxDQUFDLEVBQUU7SUFDdEUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQ3BCLE1BQU0sQ0FBQyxHQUFHO0VBQ3JDO0VBRUEsSUFBSSxDQUFDb0IsSUFBSSxFQUFFO0lBQ1QsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQ3BCLE1BQU0sQ0FBQyxHQUFHO0VBQ3JDO0VBRUEsT0FBTyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDb0IsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUNwQixNQUFNLENBQUMsR0FBRztBQUM3RCIsImlnbm9yZUxpc3QiOltdfQ==