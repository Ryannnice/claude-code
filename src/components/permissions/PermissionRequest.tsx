// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 接入 EnterPlanModeTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { EnterPlanModeTool } from 'src/tools/EnterPlanModeTool/EnterPlanModeTool.js';
// 接入 ExitPlanModeV2Tool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { ExitPlanModeV2Tool } from 'src/tools/ExitPlanModeTool/ExitPlanModeV2Tool.js';
// 引入 useNotifyAfterTimeout，将 ../../hooks/useNotifyAfterTimeout.js 中已经封装好的能力接到本文件流程里。
import { useNotifyAfterTimeout } from '../../hooks/useNotifyAfterTimeout.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 类型依赖 { AnyObject, Tool, ToolUseContext } 来自 ../../Tool.js，用于校准终端渲染的数据契约。
import type { AnyObject, Tool, ToolUseContext } from '../../Tool.js';
// 接入 AskUserQuestionTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AskUserQuestionTool } from '../../tools/AskUserQuestionTool/AskUserQuestionTool.js';
// 接入 BashTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BashTool } from '../../tools/BashTool/BashTool.js';
// 接入 FileEditTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileEditTool } from '../../tools/FileEditTool/FileEditTool.js';
// 接入 FileReadTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileReadTool } from '../../tools/FileReadTool/FileReadTool.js';
// 接入 FileWriteTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileWriteTool } from '../../tools/FileWriteTool/FileWriteTool.js';
// 接入 GlobTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GlobTool } from '../../tools/GlobTool/GlobTool.js';
// 接入 GrepTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { GrepTool } from '../../tools/GrepTool/GrepTool.js';
// 接入 NotebookEditTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { NotebookEditTool } from '../../tools/NotebookEditTool/NotebookEditTool.js';
// 接入 PowerShellTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { PowerShellTool } from '../../tools/PowerShellTool/PowerShellTool.js';
// 接入 SkillTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SkillTool } from '../../tools/SkillTool/SkillTool.js';
// 接入 WebFetchTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WebFetchTool } from '../../tools/WebFetchTool/WebFetchTool.js';
// 类型依赖 { AssistantMessage } 来自 ../../types/message.js，用于校准终端渲染的数据契约。
import type { AssistantMessage } from '../../types/message.js';
// 类型依赖 { PermissionDecision } 来自 ../../utils/permissions/PermissionResult.js，用于校准终端渲染的数据契约。
import type { PermissionDecision } from '../../utils/permissions/PermissionResult.js';
// 引入 AskUserQuestionPermissionRequest，将 ./AskUserQuestionPermissionRequest/AskUserQuestionPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { AskUserQuestionPermissionRequest } from './AskUserQuestionPermissionRequest/AskUserQuestionPermissionRequest.js';
// 引入 BashPermissionRequest，将 ./BashPermissionRequest/BashPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { BashPermissionRequest } from './BashPermissionRequest/BashPermissionRequest.js';
// 引入 EnterPlanModePermissionRequest，将 ./EnterPlanModePermissionRequest/EnterPlanModePermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { EnterPlanModePermissionRequest } from './EnterPlanModePermissionRequest/EnterPlanModePermissionRequest.js';
// 引入 ExitPlanModePermissionRequest，将 ./ExitPlanModePermissionRequest/ExitPlanModePermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { ExitPlanModePermissionRequest } from './ExitPlanModePermissionRequest/ExitPlanModePermissionRequest.js';
// 引入 FallbackPermissionRequest，将 ./FallbackPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { FallbackPermissionRequest } from './FallbackPermissionRequest.js';
// 引入 FileEditPermissionRequest，将 ./FileEditPermissionRequest/FileEditPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { FileEditPermissionRequest } from './FileEditPermissionRequest/FileEditPermissionRequest.js';
// 引入 FilesystemPermissionRequest，将 ./FilesystemPermissionRequest/FilesystemPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { FilesystemPermissionRequest } from './FilesystemPermissionRequest/FilesystemPermissionRequest.js';
// 引入 FileWritePermissionRequest，将 ./FileWritePermissionRequest/FileWritePermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { FileWritePermissionRequest } from './FileWritePermissionRequest/FileWritePermissionRequest.js';
// 引入 NotebookEditPermissionRequest，将 ./NotebookEditPermissionRequest/NotebookEditPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { NotebookEditPermissionRequest } from './NotebookEditPermissionRequest/NotebookEditPermissionRequest.js';
// 引入 PowerShellPermissionRequest，将 ./PowerShellPermissionRequest/PowerShellPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { PowerShellPermissionRequest } from './PowerShellPermissionRequest/PowerShellPermissionRequest.js';
// 引入 SkillPermissionRequest，将 ./SkillPermissionRequest/SkillPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { SkillPermissionRequest } from './SkillPermissionRequest/SkillPermissionRequest.js';
// 引入 WebFetchPermissionRequest，将 ./WebFetchPermissionRequest/WebFetchPermissionRequest.js 中已经封装好的能力接到本文件流程里。
import { WebFetchPermissionRequest } from './WebFetchPermissionRequest/WebFetchPermissionRequest.js';

/* eslint-disable @typescript-eslint/no-require-imports */
// ReviewArtifactTool保存`feature`，供终端渲染后续处理使用。
const ReviewArtifactTool = feature('REVIEW_ARTIFACT') ? (require('../../tools/ReviewArtifactTool/ReviewArtifactTool.js') as typeof import('../../tools/ReviewArtifactTool/ReviewArtifactTool.js')).ReviewArtifactTool : null;
// ReviewArtifactPermissionRequest 权限数据保存`feature`，供终端渲染后续处理使用。
const ReviewArtifactPermissionRequest = feature('REVIEW_ARTIFACT') ? (require('./ReviewArtifactPermissionRequest/ReviewArtifactPermissionRequest.js') as typeof import('./ReviewArtifactPermissionRequest/ReviewArtifactPermissionRequest.js')).ReviewArtifactPermissionRequest : null;
// WorkflowTool保存`feature`，供终端渲染后续处理使用。
const WorkflowTool = feature('WORKFLOW_SCRIPTS') ? (require('../../tools/WorkflowTool/WorkflowTool.js') as typeof import('../../tools/WorkflowTool/WorkflowTool.js')).WorkflowTool : null;
// WorkflowPermissionRequest 权限数据保存`feature`，供终端渲染后续处理使用。
const WorkflowPermissionRequest = feature('WORKFLOW_SCRIPTS') ? (require('../../tools/WorkflowTool/WorkflowPermissionRequest.js') as typeof import('../../tools/WorkflowTool/WorkflowPermissionRequest.js')).WorkflowPermissionRequest : null;
// MonitorTool保存`feature`，供终端渲染后续处理使用。
const MonitorTool = feature('MONITOR_TOOL') ? (require('../../tools/MonitorTool/MonitorTool.js') as typeof import('../../tools/MonitorTool/MonitorTool.js')).MonitorTool : null;
// MonitorPermissionRequest 权限数据保存`feature`，供终端渲染后续处理使用。
const MonitorPermissionRequest = feature('MONITOR_TOOL') ? (require('./MonitorPermissionRequest/MonitorPermissionRequest.js') as typeof import('./MonitorPermissionRequest/MonitorPermissionRequest.js')).MonitorPermissionRequest : null;
// 类型依赖 { ContentBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准终端渲染的数据契约。
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs';
/* eslint-enable @typescript-eslint/no-require-imports */
// 类型依赖 { z } 来自 zod/v4，用于校准终端渲染的数据契约。
import type { z } from 'zod/v4';
// 类型依赖 { PermissionUpdate } 来自 ../../utils/permissions/PermissionUpdateSchema.js，用于校准终端渲染的数据契约。
import type { PermissionUpdate } from '../../utils/permissions/PermissionUpdateSchema.js';
// 类型依赖 { WorkerBadgeProps } 来自 ./WorkerBadge.js，用于校准终端渲染的数据契约。
import type { WorkerBadgeProps } from './WorkerBadge.js';
// permissionComponentForTool 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function permissionComponentForTool(tool: Tool): React.ComponentType<PermissionRequestProps> {
  // 按照 tool 的取值选择终端渲染的具体处理分支。
  switch (tool) {
    case FileEditTool:
      // 返回 `FileEditPermissionRequest`，作为终端渲染这次计算的结果。
      return FileEditPermissionRequest;
    case FileWriteTool:
      // 返回 `FileWritePermissionRequest`，作为终端渲染这次计算的结果。
      return FileWritePermissionRequest;
    case BashTool:
      // 返回 `BashPermissionRequest`，作为终端渲染这次计算的结果。
      return BashPermissionRequest;
    case PowerShellTool:
      // 返回 `PowerShellPermissionRequest`，作为终端渲染这次计算的结果。
      return PowerShellPermissionRequest;
    case ReviewArtifactTool:
      // 返回 `ReviewArtifactPermissionRequest ?? FallbackPermissionRequest`，作为终端渲染这次计算的结果。
      return ReviewArtifactPermissionRequest ?? FallbackPermissionRequest;
    case WebFetchTool:
      // 返回 `WebFetchPermissionRequest`，作为终端渲染这次计算的结果。
      return WebFetchPermissionRequest;
    case NotebookEditTool:
      // 返回 `NotebookEditPermissionRequest`，作为终端渲染这次计算的结果。
      return NotebookEditPermissionRequest;
    case ExitPlanModeV2Tool:
      // 返回 `ExitPlanModePermissionRequest`，作为终端渲染这次计算的结果。
      return ExitPlanModePermissionRequest;
    case EnterPlanModeTool:
      // 返回 `EnterPlanModePermissionRequest`，作为终端渲染这次计算的结果。
      return EnterPlanModePermissionRequest;
    case SkillTool:
      // 返回 `SkillPermissionRequest`，作为终端渲染这次计算的结果。
      return SkillPermissionRequest;
    case AskUserQuestionTool:
      // 返回 `AskUserQuestionPermissionRequest`，作为终端渲染这次计算的结果。
      return AskUserQuestionPermissionRequest;
    case WorkflowTool:
      // 返回 `WorkflowPermissionRequest ?? FallbackPermissionRequest`，作为终端渲染这次计算的结果。
      return WorkflowPermissionRequest ?? FallbackPermissionRequest;
    case MonitorTool:
      // 返回 `MonitorPermissionRequest ?? FallbackPermissionRequest`，作为终端渲染这次计算的结果。
      return MonitorPermissionRequest ?? FallbackPermissionRequest;
    case GlobTool:
    case GrepTool:
    case FileReadTool:
      // 返回 `FilesystemPermissionRequest`，作为终端渲染这次计算的结果。
      return FilesystemPermissionRequest;
    default:
      // 返回 `FallbackPermissionRequest`，作为终端渲染这次计算的结果。
      return FallbackPermissionRequest;
  }
}
// PermissionRequestProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRequestProps<Input extends AnyObject = AnyObject> = {
  toolUseConfirm: ToolUseConfirm<Input>;
  toolUseContext: ToolUseContext;
  onDone(): void;
  onReject(): void;
  verbose: boolean;
  workerBadge: WorkerBadgeProps | undefined;
  /**
   * Register JSX to render in a sticky footer below the scrollable area.
   * Fullscreen mode only (non-fullscreen has no sticky area — terminal
   * scrollback moves everything together). Call with null to clear.
   *
   * Used by ExitPlanModePermissionRequest to keep response options visible
   * while the user scrolls through a long plan. The callback is stable —
   * JSX passed should use refs for callbacks that close over component state
   * to avoid stale closures (React reconciles the JSX, preserving Select's
   * internal focus/input state).
   */
  // 这个回调绑定到 setStickyFooter?: (jsx: React.ReactNode | null) => void;，负责终端渲染在该局部场景下的响应。
  setStickyFooter?: (jsx: React.ReactNode | null) => void;
};
// ToolUseConfirm 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolUseConfirm<Input extends AnyObject = AnyObject> = {
  assistantMessage: AssistantMessage;
  tool: Tool<Input>;
  description: string;
  input: z.infer<Input>;
  toolUseContext: ToolUseContext;
  toolUseID: string;
  permissionResult: PermissionDecision;
  permissionPromptStartTimeMs: number;
  /**
   * Called when user interacts with the permission dialog (e.g., arrow keys, tab, typing).
   * This prevents async auto-approval mechanisms (like the bash classifier) from
   * dismissing the dialog while the user is actively engaging with it.
   */
  classifierCheckInProgress?: boolean;
  classifierAutoApproved?: boolean;
  classifierMatchedRule?: string;
  workerBadge?: WorkerBadgeProps;
  // onUserInteraction 使用 无 完成终端渲染里的对应操作。
  onUserInteraction(): void;
  // onAbort 使用 无 完成终端渲染里的对应操作。
  onAbort(): void;
  // 调用 onDismissCheckmark?(): void;，完成这一处局部操作。
  onDismissCheckmark?(): void;
  // onAllow 使用 updatedInput: z.infer<Input>, permissionUpdates: … 完成终端渲染里的对应操作。
  onAllow(updatedInput: z.infer<Input>, permissionUpdates: PermissionUpdate[], feedback?: string, contentBlocks?: ContentBlockParam[]): void;
  // onReject 使用 feedback?: string, contentBlocks?: ContentBlockPa… 完成终端渲染里的对应操作。
  onReject(feedback?: string, contentBlocks?: ContentBlockParam[]): void;
  // recheckPermission 使用 无 完成终端渲染里的对应操作。
  recheckPermission(): Promise<void>;
};
// getNotificationMessage 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getNotificationMessage(toolUseConfirm: ToolUseConfirm): string {
  // toolName保存`tool.userFacingName`，供终端渲染后续处理使用。
  const toolName = toolUseConfirm.tool.userFacingName(toolUseConfirm.input as never);
  // 满足 `toolUseConfirm.tool === ExitPlanModeV2Tool` 时，终端渲染执行该分支。
  if (toolUseConfirm.tool === ExitPlanModeV2Tool) {
    // 返回 `'Claude Code needs your approval for the plan'`，作为终端渲染这次计算的结果。
    return 'Claude Code needs your approval for the plan';
  }
  // 满足 `toolUseConfirm.tool === EnterPlanModeTool` 时，终端渲染执行该分支。
  if (toolUseConfirm.tool === EnterPlanModeTool) {
    // 返回 `'Claude Code wants to enter plan mode'`，作为终端渲染这次计算的结果。
    return 'Claude Code wants to enter plan mode';
  }
  // 只有 `feature('REVIEW_ARTIFACT') && toolUseConfirm.tool === ReviewArtifactTool` 满足时，终端渲染才执行该分支。
  if (feature('REVIEW_ARTIFACT') && toolUseConfirm.tool === ReviewArtifactTool) {
    // 返回 `'Claude needs your approval for a review artifact'`，作为终端渲染这次计算的结果。
    return 'Claude needs your approval for a review artifact';
  }
  // 只有 `!toolName || toolName.trim() === ''` 满足时，终端渲染才执行该分支。
  if (!toolName || toolName.trim() === '') {
    // 返回 `'Claude Code needs your attention'`，作为终端渲染这次计算的结果。
    return 'Claude Code needs your attention';
  }
  // 返回 ``Claude needs your permission to use ${toolName}``，作为终端渲染这次计算的结果。
  return `Claude needs your permission to use ${toolName}`;
}

// TODO: Move this to Tool.renderPermissionRequest
// PermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionRequest(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    toolUseConfirm,
    toolUseContext,
    onDone,
    onReject,
    verbose,
    workerBadge,
    setStickyFooter
  } = t0;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone || $[1] !== onReject || $[2] !== toolUseConfirm) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
      // 调用 onReject，触发终端渲染此处需要的副作用。
      onReject();
      // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
      toolUseConfirm.onReject();
    };
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onReject;
    // $[2] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = toolUseConfirm;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      context: "Confirmation"
    };
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("app:interrupt", t1, t2);
  // t3 暂存 `getNotificationMessage(toolUseConfirm)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== toolUseConfirm) {
    // t3 暂存 `getNotificationMessage(toolUseConfirm)` 生成的渲染片段，后续返回路径直接复用。
    t3 = getNotificationMessage(toolUseConfirm);
    // $[5] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = toolUseConfirm;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // notificationMessage 消息数据沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const notificationMessage = t3;
  // 调用 useNotifyAfterTimeout，触发终端渲染此处需要的副作用。
  useNotifyAfterTimeout(notificationMessage, "permission_prompt");
  // t4 暂存 `permissionComponentForTool(toolUseConfirm.tool)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== toolUseConfirm.tool) {
    // t4 暂存 `permissionComponentForTool(toolUseConfirm.tool)` 生成的渲染片段，后续返回路径直接复用。
    t4 = permissionComponentForTool(toolUseConfirm.tool);
    // $[7] 缓存 `toolUseConfirm.tool`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = toolUseConfirm.tool;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // PermissionComponent 权限数据沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const PermissionComponent = t4;
  // t5 暂存 `<PermissionComponent toolUseContext={toolUseContext} tool...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== PermissionComponent || $[10] !== onDone || $[11] !== onReject || $[12] !== setStickyFooter || $[13] !== toolUseConfirm || $[14] !== toolUseContext || $[15] !== verbose || $[16] !== workerBadge) {
    // t5 暂存 `<PermissionComponent toolUseContext={toolUseContext} tool...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <PermissionComponent toolUseContext={toolUseContext} toolUseConfirm={toolUseConfirm} onDone={onDone} onReject={onReject} verbose={verbose} workerBadge={workerBadge} setStickyFooter={setStickyFooter} />;
    // $[9] 缓存 `PermissionComponent`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = PermissionComponent;
    // $[10] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onDone;
    // $[11] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onReject;
    // $[12] 缓存 `setStickyFooter`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = setStickyFooter;
    // $[13] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = toolUseConfirm;
    // $[14] 缓存 `toolUseContext`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = toolUseContext;
    // $[15] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = verbose;
    // $[16] 缓存 `workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = workerBadge;
    // $[17] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[17];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiUmVhY3QiLCJFbnRlclBsYW5Nb2RlVG9vbCIsIkV4aXRQbGFuTW9kZVYyVG9vbCIsInVzZU5vdGlmeUFmdGVyVGltZW91dCIsInVzZUtleWJpbmRpbmciLCJBbnlPYmplY3QiLCJUb29sIiwiVG9vbFVzZUNvbnRleHQiLCJBc2tVc2VyUXVlc3Rpb25Ub29sIiwiQmFzaFRvb2wiLCJGaWxlRWRpdFRvb2wiLCJGaWxlUmVhZFRvb2wiLCJGaWxlV3JpdGVUb29sIiwiR2xvYlRvb2wiLCJHcmVwVG9vbCIsIk5vdGVib29rRWRpdFRvb2wiLCJQb3dlclNoZWxsVG9vbCIsIlNraWxsVG9vbCIsIldlYkZldGNoVG9vbCIsIkFzc2lzdGFudE1lc3NhZ2UiLCJQZXJtaXNzaW9uRGVjaXNpb24iLCJBc2tVc2VyUXVlc3Rpb25QZXJtaXNzaW9uUmVxdWVzdCIsIkJhc2hQZXJtaXNzaW9uUmVxdWVzdCIsIkVudGVyUGxhbk1vZGVQZXJtaXNzaW9uUmVxdWVzdCIsIkV4aXRQbGFuTW9kZVBlcm1pc3Npb25SZXF1ZXN0IiwiRmFsbGJhY2tQZXJtaXNzaW9uUmVxdWVzdCIsIkZpbGVFZGl0UGVybWlzc2lvblJlcXVlc3QiLCJGaWxlc3lzdGVtUGVybWlzc2lvblJlcXVlc3QiLCJGaWxlV3JpdGVQZXJtaXNzaW9uUmVxdWVzdCIsIk5vdGVib29rRWRpdFBlcm1pc3Npb25SZXF1ZXN0IiwiUG93ZXJTaGVsbFBlcm1pc3Npb25SZXF1ZXN0IiwiU2tpbGxQZXJtaXNzaW9uUmVxdWVzdCIsIldlYkZldGNoUGVybWlzc2lvblJlcXVlc3QiLCJSZXZpZXdBcnRpZmFjdFRvb2wiLCJyZXF1aXJlIiwiUmV2aWV3QXJ0aWZhY3RQZXJtaXNzaW9uUmVxdWVzdCIsIldvcmtmbG93VG9vbCIsIldvcmtmbG93UGVybWlzc2lvblJlcXVlc3QiLCJNb25pdG9yVG9vbCIsIk1vbml0b3JQZXJtaXNzaW9uUmVxdWVzdCIsIkNvbnRlbnRCbG9ja1BhcmFtIiwieiIsIlBlcm1pc3Npb25VcGRhdGUiLCJXb3JrZXJCYWRnZVByb3BzIiwicGVybWlzc2lvbkNvbXBvbmVudEZvclRvb2wiLCJ0b29sIiwiQ29tcG9uZW50VHlwZSIsIlBlcm1pc3Npb25SZXF1ZXN0UHJvcHMiLCJ0b29sVXNlQ29uZmlybSIsIlRvb2xVc2VDb25maXJtIiwiSW5wdXQiLCJ0b29sVXNlQ29udGV4dCIsIm9uRG9uZSIsIm9uUmVqZWN0IiwidmVyYm9zZSIsIndvcmtlckJhZGdlIiwic2V0U3RpY2t5Rm9vdGVyIiwianN4IiwiUmVhY3ROb2RlIiwiYXNzaXN0YW50TWVzc2FnZSIsImRlc2NyaXB0aW9uIiwiaW5wdXQiLCJpbmZlciIsInRvb2xVc2VJRCIsInBlcm1pc3Npb25SZXN1bHQiLCJwZXJtaXNzaW9uUHJvbXB0U3RhcnRUaW1lTXMiLCJjbGFzc2lmaWVyQ2hlY2tJblByb2dyZXNzIiwiY2xhc3NpZmllckF1dG9BcHByb3ZlZCIsImNsYXNzaWZpZXJNYXRjaGVkUnVsZSIsIm9uVXNlckludGVyYWN0aW9uIiwib25BYm9ydCIsIm9uRGlzbWlzc0NoZWNrbWFyayIsIm9uQWxsb3ciLCJ1cGRhdGVkSW5wdXQiLCJwZXJtaXNzaW9uVXBkYXRlcyIsImZlZWRiYWNrIiwiY29udGVudEJsb2NrcyIsInJlY2hlY2tQZXJtaXNzaW9uIiwiUHJvbWlzZSIsImdldE5vdGlmaWNhdGlvbk1lc3NhZ2UiLCJ0b29sTmFtZSIsInVzZXJGYWNpbmdOYW1lIiwidHJpbSIsIlBlcm1pc3Npb25SZXF1ZXN0IiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsInQzIiwibm90aWZpY2F0aW9uTWVzc2FnZSIsInQ0IiwiUGVybWlzc2lvbkNvbXBvbmVudCIsInQ1Il0sInNvdXJjZXMiOlsiUGVybWlzc2lvblJlcXVlc3QudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZlYXR1cmUgfSBmcm9tICdidW46YnVuZGxlJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBFbnRlclBsYW5Nb2RlVG9vbCB9IGZyb20gJ3NyYy90b29scy9FbnRlclBsYW5Nb2RlVG9vbC9FbnRlclBsYW5Nb2RlVG9vbC5qcydcbmltcG9ydCB7IEV4aXRQbGFuTW9kZVYyVG9vbCB9IGZyb20gJ3NyYy90b29scy9FeGl0UGxhbk1vZGVUb29sL0V4aXRQbGFuTW9kZVYyVG9vbC5qcydcbmltcG9ydCB7IHVzZU5vdGlmeUFmdGVyVGltZW91dCB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZU5vdGlmeUFmdGVyVGltZW91dC5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHR5cGUgeyBBbnlPYmplY3QsIFRvb2wsIFRvb2xVc2VDb250ZXh0IH0gZnJvbSAnLi4vLi4vVG9vbC5qcydcbmltcG9ydCB7IEFza1VzZXJRdWVzdGlvblRvb2wgfSBmcm9tICcuLi8uLi90b29scy9Bc2tVc2VyUXVlc3Rpb25Ub29sL0Fza1VzZXJRdWVzdGlvblRvb2wuanMnXG5pbXBvcnQgeyBCYXNoVG9vbCB9IGZyb20gJy4uLy4uL3Rvb2xzL0Jhc2hUb29sL0Jhc2hUb29sLmpzJ1xuaW1wb3J0IHsgRmlsZUVkaXRUb29sIH0gZnJvbSAnLi4vLi4vdG9vbHMvRmlsZUVkaXRUb29sL0ZpbGVFZGl0VG9vbC5qcydcbmltcG9ydCB7IEZpbGVSZWFkVG9vbCB9IGZyb20gJy4uLy4uL3Rvb2xzL0ZpbGVSZWFkVG9vbC9GaWxlUmVhZFRvb2wuanMnXG5pbXBvcnQgeyBGaWxlV3JpdGVUb29sIH0gZnJvbSAnLi4vLi4vdG9vbHMvRmlsZVdyaXRlVG9vbC9GaWxlV3JpdGVUb29sLmpzJ1xuaW1wb3J0IHsgR2xvYlRvb2wgfSBmcm9tICcuLi8uLi90b29scy9HbG9iVG9vbC9HbG9iVG9vbC5qcydcbmltcG9ydCB7IEdyZXBUb29sIH0gZnJvbSAnLi4vLi4vdG9vbHMvR3JlcFRvb2wvR3JlcFRvb2wuanMnXG5pbXBvcnQgeyBOb3RlYm9va0VkaXRUb29sIH0gZnJvbSAnLi4vLi4vdG9vbHMvTm90ZWJvb2tFZGl0VG9vbC9Ob3RlYm9va0VkaXRUb29sLmpzJ1xuaW1wb3J0IHsgUG93ZXJTaGVsbFRvb2wgfSBmcm9tICcuLi8uLi90b29scy9Qb3dlclNoZWxsVG9vbC9Qb3dlclNoZWxsVG9vbC5qcydcbmltcG9ydCB7IFNraWxsVG9vbCB9IGZyb20gJy4uLy4uL3Rvb2xzL1NraWxsVG9vbC9Ta2lsbFRvb2wuanMnXG5pbXBvcnQgeyBXZWJGZXRjaFRvb2wgfSBmcm9tICcuLi8uLi90b29scy9XZWJGZXRjaFRvb2wvV2ViRmV0Y2hUb29sLmpzJ1xuaW1wb3J0IHR5cGUgeyBBc3Npc3RhbnRNZXNzYWdlIH0gZnJvbSAnLi4vLi4vdHlwZXMvbWVzc2FnZS5qcydcbmltcG9ydCB0eXBlIHsgUGVybWlzc2lvbkRlY2lzaW9uIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvUGVybWlzc2lvblJlc3VsdC5qcydcbmltcG9ydCB7IEFza1VzZXJRdWVzdGlvblBlcm1pc3Npb25SZXF1ZXN0IH0gZnJvbSAnLi9Bc2tVc2VyUXVlc3Rpb25QZXJtaXNzaW9uUmVxdWVzdC9Bc2tVc2VyUXVlc3Rpb25QZXJtaXNzaW9uUmVxdWVzdC5qcydcbmltcG9ydCB7IEJhc2hQZXJtaXNzaW9uUmVxdWVzdCB9IGZyb20gJy4vQmFzaFBlcm1pc3Npb25SZXF1ZXN0L0Jhc2hQZXJtaXNzaW9uUmVxdWVzdC5qcydcbmltcG9ydCB7IEVudGVyUGxhbk1vZGVQZXJtaXNzaW9uUmVxdWVzdCB9IGZyb20gJy4vRW50ZXJQbGFuTW9kZVBlcm1pc3Npb25SZXF1ZXN0L0VudGVyUGxhbk1vZGVQZXJtaXNzaW9uUmVxdWVzdC5qcydcbmltcG9ydCB7IEV4aXRQbGFuTW9kZVBlcm1pc3Npb25SZXF1ZXN0IH0gZnJvbSAnLi9FeGl0UGxhbk1vZGVQZXJtaXNzaW9uUmVxdWVzdC9FeGl0UGxhbk1vZGVQZXJtaXNzaW9uUmVxdWVzdC5qcydcbmltcG9ydCB7IEZhbGxiYWNrUGVybWlzc2lvblJlcXVlc3QgfSBmcm9tICcuL0ZhbGxiYWNrUGVybWlzc2lvblJlcXVlc3QuanMnXG5pbXBvcnQgeyBGaWxlRWRpdFBlcm1pc3Npb25SZXF1ZXN0IH0gZnJvbSAnLi9GaWxlRWRpdFBlcm1pc3Npb25SZXF1ZXN0L0ZpbGVFZGl0UGVybWlzc2lvblJlcXVlc3QuanMnXG5pbXBvcnQgeyBGaWxlc3lzdGVtUGVybWlzc2lvblJlcXVlc3QgfSBmcm9tICcuL0ZpbGVzeXN0ZW1QZXJtaXNzaW9uUmVxdWVzdC9GaWxlc3lzdGVtUGVybWlzc2lvblJlcXVlc3QuanMnXG5pbXBvcnQgeyBGaWxlV3JpdGVQZXJtaXNzaW9uUmVxdWVzdCB9IGZyb20gJy4vRmlsZVdyaXRlUGVybWlzc2lvblJlcXVlc3QvRmlsZVdyaXRlUGVybWlzc2lvblJlcXVlc3QuanMnXG5pbXBvcnQgeyBOb3RlYm9va0VkaXRQZXJtaXNzaW9uUmVxdWVzdCB9IGZyb20gJy4vTm90ZWJvb2tFZGl0UGVybWlzc2lvblJlcXVlc3QvTm90ZWJvb2tFZGl0UGVybWlzc2lvblJlcXVlc3QuanMnXG5pbXBvcnQgeyBQb3dlclNoZWxsUGVybWlzc2lvblJlcXVlc3QgfSBmcm9tICcuL1Bvd2VyU2hlbGxQZXJtaXNzaW9uUmVxdWVzdC9Qb3dlclNoZWxsUGVybWlzc2lvblJlcXVlc3QuanMnXG5pbXBvcnQgeyBTa2lsbFBlcm1pc3Npb25SZXF1ZXN0IH0gZnJvbSAnLi9Ta2lsbFBlcm1pc3Npb25SZXF1ZXN0L1NraWxsUGVybWlzc2lvblJlcXVlc3QuanMnXG5pbXBvcnQgeyBXZWJGZXRjaFBlcm1pc3Npb25SZXF1ZXN0IH0gZnJvbSAnLi9XZWJGZXRjaFBlcm1pc3Npb25SZXF1ZXN0L1dlYkZldGNoUGVybWlzc2lvblJlcXVlc3QuanMnXG5cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHMgKi9cbmNvbnN0IFJldmlld0FydGlmYWN0VG9vbCA9IGZlYXR1cmUoJ1JFVklFV19BUlRJRkFDVCcpXG4gID8gKFxuICAgICAgcmVxdWlyZSgnLi4vLi4vdG9vbHMvUmV2aWV3QXJ0aWZhY3RUb29sL1Jldmlld0FydGlmYWN0VG9vbC5qcycpIGFzIHR5cGVvZiBpbXBvcnQoJy4uLy4uL3Rvb2xzL1Jldmlld0FydGlmYWN0VG9vbC9SZXZpZXdBcnRpZmFjdFRvb2wuanMnKVxuICAgICkuUmV2aWV3QXJ0aWZhY3RUb29sXG4gIDogbnVsbFxuXG5jb25zdCBSZXZpZXdBcnRpZmFjdFBlcm1pc3Npb25SZXF1ZXN0ID0gZmVhdHVyZSgnUkVWSUVXX0FSVElGQUNUJylcbiAgPyAoXG4gICAgICByZXF1aXJlKCcuL1Jldmlld0FydGlmYWN0UGVybWlzc2lvblJlcXVlc3QvUmV2aWV3QXJ0aWZhY3RQZXJtaXNzaW9uUmVxdWVzdC5qcycpIGFzIHR5cGVvZiBpbXBvcnQoJy4vUmV2aWV3QXJ0aWZhY3RQZXJtaXNzaW9uUmVxdWVzdC9SZXZpZXdBcnRpZmFjdFBlcm1pc3Npb25SZXF1ZXN0LmpzJylcbiAgICApLlJldmlld0FydGlmYWN0UGVybWlzc2lvblJlcXVlc3RcbiAgOiBudWxsXG5cbmNvbnN0IFdvcmtmbG93VG9vbCA9IGZlYXR1cmUoJ1dPUktGTE9XX1NDUklQVFMnKVxuICA/IChcbiAgICAgIHJlcXVpcmUoJy4uLy4uL3Rvb2xzL1dvcmtmbG93VG9vbC9Xb3JrZmxvd1Rvb2wuanMnKSBhcyB0eXBlb2YgaW1wb3J0KCcuLi8uLi90b29scy9Xb3JrZmxvd1Rvb2wvV29ya2Zsb3dUb29sLmpzJylcbiAgICApLldvcmtmbG93VG9vbFxuICA6IG51bGxcblxuY29uc3QgV29ya2Zsb3dQZXJtaXNzaW9uUmVxdWVzdCA9IGZlYXR1cmUoJ1dPUktGTE9XX1NDUklQVFMnKVxuICA/IChcbiAgICAgIHJlcXVpcmUoJy4uLy4uL3Rvb2xzL1dvcmtmbG93VG9vbC9Xb3JrZmxvd1Blcm1pc3Npb25SZXF1ZXN0LmpzJykgYXMgdHlwZW9mIGltcG9ydCgnLi4vLi4vdG9vbHMvV29ya2Zsb3dUb29sL1dvcmtmbG93UGVybWlzc2lvblJlcXVlc3QuanMnKVxuICAgICkuV29ya2Zsb3dQZXJtaXNzaW9uUmVxdWVzdFxuICA6IG51bGxcblxuY29uc3QgTW9uaXRvclRvb2wgPSBmZWF0dXJlKCdNT05JVE9SX1RPT0wnKVxuICA/IChcbiAgICAgIHJlcXVpcmUoJy4uLy4uL3Rvb2xzL01vbml0b3JUb29sL01vbml0b3JUb29sLmpzJykgYXMgdHlwZW9mIGltcG9ydCgnLi4vLi4vdG9vbHMvTW9uaXRvclRvb2wvTW9uaXRvclRvb2wuanMnKVxuICAgICkuTW9uaXRvclRvb2xcbiAgOiBudWxsXG5cbmNvbnN0IE1vbml0b3JQZXJtaXNzaW9uUmVxdWVzdCA9IGZlYXR1cmUoJ01PTklUT1JfVE9PTCcpXG4gID8gKFxuICAgICAgcmVxdWlyZSgnLi9Nb25pdG9yUGVybWlzc2lvblJlcXVlc3QvTW9uaXRvclBlcm1pc3Npb25SZXF1ZXN0LmpzJykgYXMgdHlwZW9mIGltcG9ydCgnLi9Nb25pdG9yUGVybWlzc2lvblJlcXVlc3QvTW9uaXRvclBlcm1pc3Npb25SZXF1ZXN0LmpzJylcbiAgICApLk1vbml0b3JQZXJtaXNzaW9uUmVxdWVzdFxuICA6IG51bGxcblxuaW1wb3J0IHR5cGUgeyBDb250ZW50QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9tZXNzYWdlcy5tanMnXG4vKiBlc2xpbnQtZW5hYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHMgKi9cbmltcG9ydCB0eXBlIHsgeiB9IGZyb20gJ3pvZC92NCdcbmltcG9ydCB0eXBlIHsgUGVybWlzc2lvblVwZGF0ZSB9IGZyb20gJy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25VcGRhdGVTY2hlbWEuanMnXG5pbXBvcnQgdHlwZSB7IFdvcmtlckJhZGdlUHJvcHMgfSBmcm9tICcuL1dvcmtlckJhZGdlLmpzJ1xuXG5mdW5jdGlvbiBwZXJtaXNzaW9uQ29tcG9uZW50Rm9yVG9vbChcbiAgdG9vbDogVG9vbCxcbik6IFJlYWN0LkNvbXBvbmVudFR5cGU8UGVybWlzc2lvblJlcXVlc3RQcm9wcz4ge1xuICBzd2l0Y2ggKHRvb2wpIHtcbiAgICBjYXNlIEZpbGVFZGl0VG9vbDpcbiAgICAgIHJldHVybiBGaWxlRWRpdFBlcm1pc3Npb25SZXF1ZXN0XG4gICAgY2FzZSBGaWxlV3JpdGVUb29sOlxuICAgICAgcmV0dXJuIEZpbGVXcml0ZVBlcm1pc3Npb25SZXF1ZXN0XG4gICAgY2FzZSBCYXNoVG9vbDpcbiAgICAgIHJldHVybiBCYXNoUGVybWlzc2lvblJlcXVlc3RcbiAgICBjYXNlIFBvd2VyU2hlbGxUb29sOlxuICAgICAgcmV0dXJuIFBvd2VyU2hlbGxQZXJtaXNzaW9uUmVxdWVzdFxuICAgIGNhc2UgUmV2aWV3QXJ0aWZhY3RUb29sOlxuICAgICAgcmV0dXJuIFJldmlld0FydGlmYWN0UGVybWlzc2lvblJlcXVlc3QgPz8gRmFsbGJhY2tQZXJtaXNzaW9uUmVxdWVzdFxuICAgIGNhc2UgV2ViRmV0Y2hUb29sOlxuICAgICAgcmV0dXJuIFdlYkZldGNoUGVybWlzc2lvblJlcXVlc3RcbiAgICBjYXNlIE5vdGVib29rRWRpdFRvb2w6XG4gICAgICByZXR1cm4gTm90ZWJvb2tFZGl0UGVybWlzc2lvblJlcXVlc3RcbiAgICBjYXNlIEV4aXRQbGFuTW9kZVYyVG9vbDpcbiAgICAgIHJldHVybiBFeGl0UGxhbk1vZGVQZXJtaXNzaW9uUmVxdWVzdFxuICAgIGNhc2UgRW50ZXJQbGFuTW9kZVRvb2w6XG4gICAgICByZXR1cm4gRW50ZXJQbGFuTW9kZVBlcm1pc3Npb25SZXF1ZXN0XG4gICAgY2FzZSBTa2lsbFRvb2w6XG4gICAgICByZXR1cm4gU2tpbGxQZXJtaXNzaW9uUmVxdWVzdFxuICAgIGNhc2UgQXNrVXNlclF1ZXN0aW9uVG9vbDpcbiAgICAgIHJldHVybiBBc2tVc2VyUXVlc3Rpb25QZXJtaXNzaW9uUmVxdWVzdFxuICAgIGNhc2UgV29ya2Zsb3dUb29sOlxuICAgICAgcmV0dXJuIFdvcmtmbG93UGVybWlzc2lvblJlcXVlc3QgPz8gRmFsbGJhY2tQZXJtaXNzaW9uUmVxdWVzdFxuICAgIGNhc2UgTW9uaXRvclRvb2w6XG4gICAgICByZXR1cm4gTW9uaXRvclBlcm1pc3Npb25SZXF1ZXN0ID8/IEZhbGxiYWNrUGVybWlzc2lvblJlcXVlc3RcbiAgICBjYXNlIEdsb2JUb29sOlxuICAgIGNhc2UgR3JlcFRvb2w6XG4gICAgY2FzZSBGaWxlUmVhZFRvb2w6XG4gICAgICByZXR1cm4gRmlsZXN5c3RlbVBlcm1pc3Npb25SZXF1ZXN0XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBGYWxsYmFja1Blcm1pc3Npb25SZXF1ZXN0XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgUGVybWlzc2lvblJlcXVlc3RQcm9wczxJbnB1dCBleHRlbmRzIEFueU9iamVjdCA9IEFueU9iamVjdD4gPSB7XG4gIHRvb2xVc2VDb25maXJtOiBUb29sVXNlQ29uZmlybTxJbnB1dD5cbiAgdG9vbFVzZUNvbnRleHQ6IFRvb2xVc2VDb250ZXh0XG4gIG9uRG9uZSgpOiB2b2lkXG4gIG9uUmVqZWN0KCk6IHZvaWRcbiAgdmVyYm9zZTogYm9vbGVhblxuICB3b3JrZXJCYWRnZTogV29ya2VyQmFkZ2VQcm9wcyB8IHVuZGVmaW5lZFxuICAvKipcbiAgICogUmVnaXN0ZXIgSlNYIHRvIHJlbmRlciBpbiBhIHN0aWNreSBmb290ZXIgYmVsb3cgdGhlIHNjcm9sbGFibGUgYXJlYS5cbiAgICogRnVsbHNjcmVlbiBtb2RlIG9ubHkgKG5vbi1mdWxsc2NyZWVuIGhhcyBubyBzdGlja3kgYXJlYSDigJQgdGVybWluYWxcbiAgICogc2Nyb2xsYmFjayBtb3ZlcyBldmVyeXRoaW5nIHRvZ2V0aGVyKS4gQ2FsbCB3aXRoIG51bGwgdG8gY2xlYXIuXG4gICAqXG4gICAqIFVzZWQgYnkgRXhpdFBsYW5Nb2RlUGVybWlzc2lvblJlcXVlc3QgdG8ga2VlcCByZXNwb25zZSBvcHRpb25zIHZpc2libGVcbiAgICogd2hpbGUgdGhlIHVzZXIgc2Nyb2xscyB0aHJvdWdoIGEgbG9uZyBwbGFuLiBUaGUgY2FsbGJhY2sgaXMgc3RhYmxlIOKAlFxuICAgKiBKU1ggcGFzc2VkIHNob3VsZCB1c2UgcmVmcyBmb3IgY2FsbGJhY2tzIHRoYXQgY2xvc2Ugb3ZlciBjb21wb25lbnQgc3RhdGVcbiAgICogdG8gYXZvaWQgc3RhbGUgY2xvc3VyZXMgKFJlYWN0IHJlY29uY2lsZXMgdGhlIEpTWCwgcHJlc2VydmluZyBTZWxlY3Qnc1xuICAgKiBpbnRlcm5hbCBmb2N1cy9pbnB1dCBzdGF0ZSkuXG4gICAqL1xuICBzZXRTdGlja3lGb290ZXI/OiAoanN4OiBSZWFjdC5SZWFjdE5vZGUgfCBudWxsKSA9PiB2b2lkXG59XG5cbmV4cG9ydCB0eXBlIFRvb2xVc2VDb25maXJtPElucHV0IGV4dGVuZHMgQW55T2JqZWN0ID0gQW55T2JqZWN0PiA9IHtcbiAgYXNzaXN0YW50TWVzc2FnZTogQXNzaXN0YW50TWVzc2FnZVxuICB0b29sOiBUb29sPElucHV0PlxuICBkZXNjcmlwdGlvbjogc3RyaW5nXG4gIGlucHV0OiB6LmluZmVyPElucHV0PlxuICB0b29sVXNlQ29udGV4dDogVG9vbFVzZUNvbnRleHRcbiAgdG9vbFVzZUlEOiBzdHJpbmdcbiAgcGVybWlzc2lvblJlc3VsdDogUGVybWlzc2lvbkRlY2lzaW9uXG4gIHBlcm1pc3Npb25Qcm9tcHRTdGFydFRpbWVNczogbnVtYmVyXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB1c2VyIGludGVyYWN0cyB3aXRoIHRoZSBwZXJtaXNzaW9uIGRpYWxvZyAoZS5nLiwgYXJyb3cga2V5cywgdGFiLCB0eXBpbmcpLlxuICAgKiBUaGlzIHByZXZlbnRzIGFzeW5jIGF1dG8tYXBwcm92YWwgbWVjaGFuaXNtcyAobGlrZSB0aGUgYmFzaCBjbGFzc2lmaWVyKSBmcm9tXG4gICAqIGRpc21pc3NpbmcgdGhlIGRpYWxvZyB3aGlsZSB0aGUgdXNlciBpcyBhY3RpdmVseSBlbmdhZ2luZyB3aXRoIGl0LlxuICAgKi9cbiAgY2xhc3NpZmllckNoZWNrSW5Qcm9ncmVzcz86IGJvb2xlYW5cbiAgY2xhc3NpZmllckF1dG9BcHByb3ZlZD86IGJvb2xlYW5cbiAgY2xhc3NpZmllck1hdGNoZWRSdWxlPzogc3RyaW5nXG4gIHdvcmtlckJhZGdlPzogV29ya2VyQmFkZ2VQcm9wc1xuICBvblVzZXJJbnRlcmFjdGlvbigpOiB2b2lkXG4gIG9uQWJvcnQoKTogdm9pZFxuICBvbkRpc21pc3NDaGVja21hcms/KCk6IHZvaWRcbiAgb25BbGxvdyhcbiAgICB1cGRhdGVkSW5wdXQ6IHouaW5mZXI8SW5wdXQ+LFxuICAgIHBlcm1pc3Npb25VcGRhdGVzOiBQZXJtaXNzaW9uVXBkYXRlW10sXG4gICAgZmVlZGJhY2s/OiBzdHJpbmcsXG4gICAgY29udGVudEJsb2Nrcz86IENvbnRlbnRCbG9ja1BhcmFtW10sXG4gICk6IHZvaWRcbiAgb25SZWplY3QoZmVlZGJhY2s/OiBzdHJpbmcsIGNvbnRlbnRCbG9ja3M/OiBDb250ZW50QmxvY2tQYXJhbVtdKTogdm9pZFxuICByZWNoZWNrUGVybWlzc2lvbigpOiBQcm9taXNlPHZvaWQ+XG59XG5cbmZ1bmN0aW9uIGdldE5vdGlmaWNhdGlvbk1lc3NhZ2UodG9vbFVzZUNvbmZpcm06IFRvb2xVc2VDb25maXJtKTogc3RyaW5nIHtcbiAgY29uc3QgdG9vbE5hbWUgPSB0b29sVXNlQ29uZmlybS50b29sLnVzZXJGYWNpbmdOYW1lKFxuICAgIHRvb2xVc2VDb25maXJtLmlucHV0IGFzIG5ldmVyLFxuICApXG5cbiAgaWYgKHRvb2xVc2VDb25maXJtLnRvb2wgPT09IEV4aXRQbGFuTW9kZVYyVG9vbCkge1xuICAgIHJldHVybiAnQ2xhdWRlIENvZGUgbmVlZHMgeW91ciBhcHByb3ZhbCBmb3IgdGhlIHBsYW4nXG4gIH1cblxuICBpZiAodG9vbFVzZUNvbmZpcm0udG9vbCA9PT0gRW50ZXJQbGFuTW9kZVRvb2wpIHtcbiAgICByZXR1cm4gJ0NsYXVkZSBDb2RlIHdhbnRzIHRvIGVudGVyIHBsYW4gbW9kZSdcbiAgfVxuXG4gIGlmIChcbiAgICBmZWF0dXJlKCdSRVZJRVdfQVJUSUZBQ1QnKSAmJlxuICAgIHRvb2xVc2VDb25maXJtLnRvb2wgPT09IFJldmlld0FydGlmYWN0VG9vbFxuICApIHtcbiAgICByZXR1cm4gJ0NsYXVkZSBuZWVkcyB5b3VyIGFwcHJvdmFsIGZvciBhIHJldmlldyBhcnRpZmFjdCdcbiAgfVxuXG4gIGlmICghdG9vbE5hbWUgfHwgdG9vbE5hbWUudHJpbSgpID09PSAnJykge1xuICAgIHJldHVybiAnQ2xhdWRlIENvZGUgbmVlZHMgeW91ciBhdHRlbnRpb24nXG4gIH1cblxuICByZXR1cm4gYENsYXVkZSBuZWVkcyB5b3VyIHBlcm1pc3Npb24gdG8gdXNlICR7dG9vbE5hbWV9YFxufVxuXG4vLyBUT0RPOiBNb3ZlIHRoaXMgdG8gVG9vbC5yZW5kZXJQZXJtaXNzaW9uUmVxdWVzdFxuZXhwb3J0IGZ1bmN0aW9uIFBlcm1pc3Npb25SZXF1ZXN0KHtcbiAgdG9vbFVzZUNvbmZpcm0sXG4gIHRvb2xVc2VDb250ZXh0LFxuICBvbkRvbmUsXG4gIG9uUmVqZWN0LFxuICB2ZXJib3NlLFxuICB3b3JrZXJCYWRnZSxcbiAgc2V0U3RpY2t5Rm9vdGVyLFxufTogUGVybWlzc2lvblJlcXVlc3RQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIC8vIEhhbmRsZSBDdHJsK0MgKGFwcDppbnRlcnJ1cHQpIHRvIHJlamVjdFxuICB1c2VLZXliaW5kaW5nKFxuICAgICdhcHA6aW50ZXJydXB0JyxcbiAgICAoKSA9PiB7XG4gICAgICBvbkRvbmUoKVxuICAgICAgb25SZWplY3QoKVxuICAgICAgdG9vbFVzZUNvbmZpcm0ub25SZWplY3QoKVxuICAgIH0sXG4gICAgeyBjb250ZXh0OiAnQ29uZmlybWF0aW9uJyB9LFxuICApXG5cbiAgY29uc3Qgbm90aWZpY2F0aW9uTWVzc2FnZSA9IGdldE5vdGlmaWNhdGlvbk1lc3NhZ2UodG9vbFVzZUNvbmZpcm0pXG4gIHVzZU5vdGlmeUFmdGVyVGltZW91dChub3RpZmljYXRpb25NZXNzYWdlLCAncGVybWlzc2lvbl9wcm9tcHQnKVxuXG4gIGNvbnN0IFBlcm1pc3Npb25Db21wb25lbnQgPSBwZXJtaXNzaW9uQ29tcG9uZW50Rm9yVG9vbCh0b29sVXNlQ29uZmlybS50b29sKVxuXG4gIHJldHVybiAoXG4gICAgPFBlcm1pc3Npb25Db21wb25lbnRcbiAgICAgIHRvb2xVc2VDb250ZXh0PXt0b29sVXNlQ29udGV4dH1cbiAgICAgIHRvb2xVc2VDb25maXJtPXt0b29sVXNlQ29uZmlybX1cbiAgICAgIG9uRG9uZT17b25Eb25lfVxuICAgICAgb25SZWplY3Q9e29uUmVqZWN0fVxuICAgICAgdmVyYm9zZT17dmVyYm9zZX1cbiAgICAgIHdvcmtlckJhZGdlPXt3b3JrZXJCYWRnZX1cbiAgICAgIHNldFN0aWNreUZvb3Rlcj17c2V0U3RpY2t5Rm9vdGVyfVxuICAgIC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLE9BQU8sUUFBUSxZQUFZO0FBQ3BDLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsaUJBQWlCLFFBQVEsa0RBQWtEO0FBQ3BGLFNBQVNDLGtCQUFrQixRQUFRLGtEQUFrRDtBQUNyRixTQUFTQyxxQkFBcUIsUUFBUSxzQ0FBc0M7QUFDNUUsU0FBU0MsYUFBYSxRQUFRLG9DQUFvQztBQUNsRSxjQUFjQyxTQUFTLEVBQUVDLElBQUksRUFBRUMsY0FBYyxRQUFRLGVBQWU7QUFDcEUsU0FBU0MsbUJBQW1CLFFBQVEsd0RBQXdEO0FBQzVGLFNBQVNDLFFBQVEsUUFBUSxrQ0FBa0M7QUFDM0QsU0FBU0MsWUFBWSxRQUFRLDBDQUEwQztBQUN2RSxTQUFTQyxZQUFZLFFBQVEsMENBQTBDO0FBQ3ZFLFNBQVNDLGFBQWEsUUFBUSw0Q0FBNEM7QUFDMUUsU0FBU0MsUUFBUSxRQUFRLGtDQUFrQztBQUMzRCxTQUFTQyxRQUFRLFFBQVEsa0NBQWtDO0FBQzNELFNBQVNDLGdCQUFnQixRQUFRLGtEQUFrRDtBQUNuRixTQUFTQyxjQUFjLFFBQVEsOENBQThDO0FBQzdF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