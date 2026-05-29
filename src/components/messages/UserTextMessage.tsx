// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 NO_CONTENT_MESSAGE，将 ../../constants/messages.js 中已经封装好的能力接到本文件流程里。
import { NO_CONTENT_MESSAGE } from '../../constants/messages.js';
// 引入 COMMAND_MESSAGE_TAG、LOCAL_COMMAND_CAVEAT_TAG、TASK_NOTIFICATION_TAG、TEAMMATE_MESSAGE_TAG、TICK_TAG，将 ../../constants/xml.js 中已经封装好的能力接到本文件流程里。
import { COMMAND_MESSAGE_TAG, LOCAL_COMMAND_CAVEAT_TAG, TASK_NOTIFICATION_TAG, TEAMMATE_MESSAGE_TAG, TICK_TAG } from '../../constants/xml.js';
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js';
// 复用 extractTag、INTERRUPT_MESSAGE、INTERRUPT_MESSAGE_FOR_TOOL_USE 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag, INTERRUPT_MESSAGE, INTERRUPT_MESSAGE_FOR_TOOL_USE } from '../../utils/messages.js';
// 引入 InterruptedByUser，将 ../InterruptedByUser.js 中已经封装好的能力接到本文件流程里。
import { InterruptedByUser } from '../InterruptedByUser.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// 引入 UserAgentNotificationMessage，将 ./UserAgentNotificationMessage.js 中已经封装好的能力接到本文件流程里。
import { UserAgentNotificationMessage } from './UserAgentNotificationMessage.js';
// 引入 UserBashInputMessage，将 ./UserBashInputMessage.js 中已经封装好的能力接到本文件流程里。
import { UserBashInputMessage } from './UserBashInputMessage.js';
// 引入 UserBashOutputMessage，将 ./UserBashOutputMessage.js 中已经封装好的能力接到本文件流程里。
import { UserBashOutputMessage } from './UserBashOutputMessage.js';
// 引入 UserCommandMessage，将 ./UserCommandMessage.js 中已经封装好的能力接到本文件流程里。
import { UserCommandMessage } from './UserCommandMessage.js';
// 引入 UserLocalCommandOutputMessage，将 ./UserLocalCommandOutputMessage.js 中已经封装好的能力接到本文件流程里。
import { UserLocalCommandOutputMessage } from './UserLocalCommandOutputMessage.js';
// 引入 UserMemoryInputMessage，将 ./UserMemoryInputMessage.js 中已经封装好的能力接到本文件流程里。
import { UserMemoryInputMessage } from './UserMemoryInputMessage.js';
// 引入 UserPlanMessage，将 ./UserPlanMessage.js 中已经封装好的能力接到本文件流程里。
import { UserPlanMessage } from './UserPlanMessage.js';
// 引入 UserPromptMessage，将 ./UserPromptMessage.js 中已经封装好的能力接到本文件流程里。
import { UserPromptMessage } from './UserPromptMessage.js';
// 引入 UserResourceUpdateMessage，将 ./UserResourceUpdateMessage.js 中已经封装好的能力接到本文件流程里。
import { UserResourceUpdateMessage } from './UserResourceUpdateMessage.js';
// 引入 UserTeammateMessage，将 ./UserTeammateMessage.js 中已经封装好的能力接到本文件流程里。
import { UserTeammateMessage } from './UserTeammateMessage.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  addMargin: boolean;
  param: TextBlockParam;
  verbose: boolean;
  planContent?: string;
  isTranscriptMode?: boolean;
  timestamp?: string;
};
// UserTextMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserTextMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(49);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addMargin,
    param,
    verbose,
    planContent,
    isTranscriptMode,
    timestamp
  } = t0;
  // 满足 `param.text.trim() === NO_CONTENT_MESSAGE` 时，终端渲染执行该分支。
  if (param.text.trim() === NO_CONTENT_MESSAGE) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 满足 `planContent` 时，终端渲染执行该分支。
  if (planContent) {
    // t1 暂存 `<UserPlanMessage addMargin={addMargin} planContent={planC...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== addMargin || $[1] !== planContent) {
      // t1 暂存 `<UserPlanMessage addMargin={addMargin} planContent={planC...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserPlanMessage addMargin={addMargin} planContent={planContent} />;
      // $[0] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = addMargin;
      // $[1] 缓存 `planContent`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = planContent;
      // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[2];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 满足 `extractTag(param.text, TICK_TAG)` 时，终端渲染执行该分支。
  if (extractTag(param.text, TICK_TAG)) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 满足 `param.text.includes(`<${LOCAL_COMMAND_CAVEAT_TAG}>`)` 时，终端渲染执行该分支。
  if (param.text.includes(`<${LOCAL_COMMAND_CAVEAT_TAG}>`)) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 只有 `param.text.startsWith("<bash-stdout") || param.text.startsWith("<bash-stder...` 满足时，终端渲染才执行该分支。
  if (param.text.startsWith("<bash-stdout") || param.text.startsWith("<bash-stderr")) {
    // t1 暂存 `<UserBashOutputMessage content={param.text} verbose={verb...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== param.text || $[4] !== verbose) {
      // t1 暂存 `<UserBashOutputMessage content={param.text} verbose={verb...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserBashOutputMessage content={param.text} verbose={verbose} />;
      // $[3] 缓存 `param.text`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = param.text;
      // $[4] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = verbose;
      // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[5];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 只有 `param.text.startsWith("<local-command-stdout") || param.text.startsWith("<l...` 满足时，终端渲染才执行该分支。
  if (param.text.startsWith("<local-command-stdout") || param.text.startsWith("<local-command-stderr")) {
    // t1 暂存 `<UserLocalCommandOutputMessage content={param.text} />` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[6] !== param.text) {
      // t1 暂存 `<UserLocalCommandOutputMessage content={param.text} />` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserLocalCommandOutputMessage content={param.text} />;
      // $[6] 缓存 `param.text`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = param.text;
      // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[7];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 只有 `param.text === INTERRUPT_MESSAGE || param.text ==` 满足时，终端渲染才执行该分支。
  if (param.text === INTERRUPT_MESSAGE || param.text === INTERRUPT_MESSAGE_FOR_TOOL_USE) {
    // t1 暂存 `<MessageResponse height={1}><InterruptedByUser /></Messag...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<MessageResponse height={1}><InterruptedByUser /></Messag...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <MessageResponse height={1}><InterruptedByUser /></MessageResponse>;
      // $[8] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[8];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 满足 `feature("KAIROS_GITHUB_WEBHOOKS")` 时，终端渲染执行该分支。
  if (feature("KAIROS_GITHUB_WEBHOOKS")) {
    // 满足 `param.text.startsWith("<github-webhook-activity>")` 时，终端渲染执行该分支。
    if (param.text.startsWith("<github-webhook-activity>")) {
      // t1 暂存 `require("./UserGitHubWebhookMessage.js")` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
        // t1 暂存 `require("./UserGitHubWebhookMessage.js")` 生成的渲染片段，后续返回路径直接复用。
        t1 = require("./UserGitHubWebhookMessage.js");
        // $[9] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[9] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[9];
      }
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        UserGitHubWebhookMessage
      } = t1 as typeof import('./UserGitHubWebhookMessage.js');
      // t2 暂存 `<UserGitHubWebhookMessage addMargin={addMargin} param={pa...` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[10] !== addMargin || $[11] !== param) {
        // t2 暂存 `<UserGitHubWebhookMessage addMargin={addMargin} param={pa...` 生成的渲染片段，后续返回路径直接复用。
        t2 = <UserGitHubWebhookMessage addMargin={addMargin} param={param} />;
        // $[10] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
        $[10] = addMargin;
        // $[11] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
        $[11] = param;
        // $[12] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[12] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[12];
      }
      // 返回 `t2`，作为终端渲染这次计算的结果。
      return t2;
    }
  }
  // 满足 `param.text.includes("<bash-input>")` 时，终端渲染执行该分支。
  if (param.text.includes("<bash-input>")) {
    // t1 暂存 `<UserBashInputMessage addMargin={addMargin} param={param}...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[13] !== addMargin || $[14] !== param) {
      // t1 暂存 `<UserBashInputMessage addMargin={addMargin} param={param}...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserBashInputMessage addMargin={addMargin} param={param} />;
      // $[13] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = addMargin;
      // $[14] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = param;
      // $[15] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[15];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 满足 `param.text.includes(`<${COMMAND_MESSAGE_TAG}>`)` 时，终端渲染执行该分支。
  if (param.text.includes(`<${COMMAND_MESSAGE_TAG}>`)) {
    // t1 暂存 `<UserCommandMessage addMargin={addMargin} param={param} />` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[16] !== addMargin || $[17] !== param) {
      // t1 暂存 `<UserCommandMessage addMargin={addMargin} param={param} />` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserCommandMessage addMargin={addMargin} param={param} />;
      // $[16] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = addMargin;
      // $[17] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = param;
      // $[18] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[18];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 满足 `param.text.includes("<user-memory-input>")` 时，终端渲染执行该分支。
  if (param.text.includes("<user-memory-input>")) {
    // t1 暂存 `<UserMemoryInputMessage addMargin={addMargin} text={param...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[19] !== addMargin || $[20] !== param.text) {
      // t1 暂存 `<UserMemoryInputMessage addMargin={addMargin} text={param...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserMemoryInputMessage addMargin={addMargin} text={param.text} />;
      // $[19] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = addMargin;
      // $[20] 缓存 `param.text`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = param.text;
      // $[21] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[21];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 只有 `isAgentSwarmsEnabled() && param.text.includes(`<${TEAMMATE_MESSAGE_TAG}`)` 满足时，终端渲染才执行该分支。
  if (isAgentSwarmsEnabled() && param.text.includes(`<${TEAMMATE_MESSAGE_TAG}`)) {
    // t1 暂存 `<UserTeammateMessage addMargin={addMargin} param={param} ...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[22] !== addMargin || $[23] !== isTranscriptMode || $[24] !== param) {
      // t1 暂存 `<UserTeammateMessage addMargin={addMargin} param={param} ...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserTeammateMessage addMargin={addMargin} param={param} isTranscriptMode={isTranscriptMode} />;
      // $[22] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = addMargin;
      // $[23] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = isTranscriptMode;
      // $[24] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = param;
      // $[25] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[25];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 满足 `param.text.includes(`<${TASK_NOTIFICATION_TAG}`)` 时，终端渲染执行该分支。
  if (param.text.includes(`<${TASK_NOTIFICATION_TAG}`)) {
    // t1 暂存 `<UserAgentNotificationMessage addMargin={addMargin} param...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[26] !== addMargin || $[27] !== param) {
      // t1 暂存 `<UserAgentNotificationMessage addMargin={addMargin} param...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserAgentNotificationMessage addMargin={addMargin} param={param} />;
      // $[26] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
      $[26] = addMargin;
      // $[27] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
      $[27] = param;
      // $[28] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[28] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[28];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 只有 `param.text.includes("<mcp-resource-update") || param.text.includes("<mcp-po...` 满足时，终端渲染才执行该分支。
  if (param.text.includes("<mcp-resource-update") || param.text.includes("<mcp-polling-update")) {
    // t1 暂存 `<UserResourceUpdateMessage addMargin={addMargin} param={p...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[29] !== addMargin || $[30] !== param) {
      // t1 暂存 `<UserResourceUpdateMessage addMargin={addMargin} param={p...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserResourceUpdateMessage addMargin={addMargin} param={param} />;
      // $[29] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
      $[29] = addMargin;
      // $[30] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
      $[30] = param;
      // $[31] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[31] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[31];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 满足 `feature("FORK_SUBAGENT")` 时，终端渲染执行该分支。
  if (feature("FORK_SUBAGENT")) {
    // 满足 `param.text.includes("<fork-boilerplate>")` 时，终端渲染执行该分支。
    if (param.text.includes("<fork-boilerplate>")) {
      // t1 暂存 `require("./UserForkBoilerplateMessage.js")` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[32] === Symbol.for("react.memo_cache_sentinel")) {
        // t1 暂存 `require("./UserForkBoilerplateMessage.js")` 生成的渲染片段，后续返回路径直接复用。
        t1 = require("./UserForkBoilerplateMessage.js");
        // $[32] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[32] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[32];
      }
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        UserForkBoilerplateMessage
      } = t1 as typeof import('./UserForkBoilerplateMessage.js');
      // t2 暂存 `<UserForkBoilerplateMessage addMargin={addMargin} param={...` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[33] !== addMargin || $[34] !== param) {
        // t2 暂存 `<UserForkBoilerplateMessage addMargin={addMargin} param={...` 生成的渲染片段，后续返回路径直接复用。
        t2 = <UserForkBoilerplateMessage addMargin={addMargin} param={param} />;
        // $[33] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
        $[33] = addMargin;
        // $[34] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
        $[34] = param;
        // $[35] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[35] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[35];
      }
      // 返回 `t2`，作为终端渲染这次计算的结果。
      return t2;
    }
  }
  // 满足 `feature("UDS_INBOX")` 时，终端渲染执行该分支。
  if (feature("UDS_INBOX")) {
    // 满足 `param.text.includes("<cross-session-message")` 时，终端渲染执行该分支。
    if (param.text.includes("<cross-session-message")) {
      // t1 暂存 `require("./UserCrossSessionMessage.js")` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[36] === Symbol.for("react.memo_cache_sentinel")) {
        // t1 暂存 `require("./UserCrossSessionMessage.js")` 生成的渲染片段，后续返回路径直接复用。
        t1 = require("./UserCrossSessionMessage.js");
        // $[36] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[36] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[36];
      }
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        UserCrossSessionMessage
      } = t1 as typeof import('./UserCrossSessionMessage.js');
      // t2 暂存 `<UserCrossSessionMessage addMargin={addMargin} param={par...` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[37] !== addMargin || $[38] !== param) {
        // t2 暂存 `<UserCrossSessionMessage addMargin={addMargin} param={par...` 生成的渲染片段，后续返回路径直接复用。
        t2 = <UserCrossSessionMessage addMargin={addMargin} param={param} />;
        // $[37] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
        $[37] = addMargin;
        // $[38] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
        $[38] = param;
        // $[39] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[39] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[39];
      }
      // 返回 `t2`，作为终端渲染这次计算的结果。
      return t2;
    }
  }
  // 只有 `feature("KAIROS") || feature("KAIROS_CHANNELS")` 满足时，终端渲染才执行该分支。
  if (feature("KAIROS") || feature("KAIROS_CHANNELS")) {
    // 满足 `param.text.includes("<channel source=\"")` 时，终端渲染执行该分支。
    if (param.text.includes("<channel source=\"")) {
      // t1 暂存 `require("./UserChannelMessage.js")` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[40] === Symbol.for("react.memo_cache_sentinel")) {
        // t1 暂存 `require("./UserChannelMessage.js")` 生成的渲染片段，后续返回路径直接复用。
        t1 = require("./UserChannelMessage.js");
        // $[40] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[40] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[40];
      }
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        UserChannelMessage
      } = t1 as typeof import('./UserChannelMessage.js');
      // t2 暂存 `<UserChannelMessage addMargin={addMargin} param={param} />` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[41] !== addMargin || $[42] !== param) {
        // t2 暂存 `<UserChannelMessage addMargin={addMargin} param={param} />` 生成的渲染片段，后续返回路径直接复用。
        t2 = <UserChannelMessage addMargin={addMargin} param={param} />;
        // $[41] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
        $[41] = addMargin;
        // $[42] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
        $[42] = param;
        // $[43] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[43] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[43];
      }
      // 返回 `t2`，作为终端渲染这次计算的结果。
      return t2;
    }
  }
  // t1 暂存 `<UserPromptMessage addMargin={addMargin} param={param} is...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[44] !== addMargin || $[45] !== isTranscriptMode || $[46] !== param || $[47] !== timestamp) {
    // t1 暂存 `<UserPromptMessage addMargin={addMargin} param={param} is...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <UserPromptMessage addMargin={addMargin} param={param} isTranscriptMode={isTranscriptMode} timestamp={timestamp} />;
    // $[44] 缓存 `addMargin`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = addMargin;
    // $[45] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = isTranscriptMode;
    // $[46] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = param;
    // $[47] 缓存 `timestamp`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = timestamp;
    // $[48] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[48];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiVGV4dEJsb2NrUGFyYW0iLCJSZWFjdCIsIk5PX0NPTlRFTlRfTUVTU0FHRSIsIkNPTU1BTkRfTUVTU0FHRV9UQUciLCJMT0NBTF9DT01NQU5EX0NBVkVBVF9UQUciLCJUQVNLX05PVElGSUNBVElPTl9UQUciLCJURUFNTUFURV9NRVNTQUdFX1RBRyIsIlRJQ0tfVEFHIiwiaXNBZ2VudFN3YXJtc0VuYWJsZWQiLCJleHRyYWN0VGFnIiwiSU5URVJSVVBUX01FU1NBR0UiLCJJTlRFUlJVUFRfTUVTU0FHRV9GT1JfVE9PTF9VU0UiLCJJbnRlcnJ1cHRlZEJ5VXNlciIsIk1lc3NhZ2VSZXNwb25zZSIsIlVzZXJBZ2VudE5vdGlmaWNhdGlvbk1lc3NhZ2UiLCJVc2VyQmFzaElucHV0TWVzc2FnZSIsIlVzZXJCYXNoT3V0cHV0TWVzc2FnZSIsIlVzZXJDb21tYW5kTWVzc2FnZSIsIlVzZXJMb2NhbENvbW1hbmRPdXRwdXRNZXNzYWdlIiwiVXNlck1lbW9yeUlucHV0TWVzc2FnZSIsIlVzZXJQbGFuTWVzc2FnZSIsIlVzZXJQcm9tcHRNZXNzYWdlIiwiVXNlclJlc291cmNlVXBkYXRlTWVzc2FnZSIsIlVzZXJUZWFtbWF0ZU1lc3NhZ2UiLCJQcm9wcyIsImFkZE1hcmdpbiIsInBhcmFtIiwidmVyYm9zZSIsInBsYW5Db250ZW50IiwiaXNUcmFuc2NyaXB0TW9kZSIsInRpbWVzdGFtcCIsIlVzZXJUZXh0TWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidGV4dCIsInRyaW0iLCJ0MSIsImluY2x1ZGVzIiwic3RhcnRzV2l0aCIsIlN5bWJvbCIsImZvciIsInJlcXVpcmUiLCJVc2VyR2l0SHViV2ViaG9va01lc3NhZ2UiLCJ0MiIsIlVzZXJGb3JrQm9pbGVycGxhdGVNZXNzYWdlIiwiVXNlckNyb3NzU2Vzc2lvbk1lc3NhZ2UiLCJVc2VyQ2hhbm5lbE1lc3NhZ2UiXSwic291cmNlcyI6WyJVc2VyVGV4dE1lc3NhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZlYXR1cmUgfSBmcm9tICdidW46YnVuZGxlJ1xuaW1wb3J0IHR5cGUgeyBUZXh0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IE5PX0NPTlRFTlRfTUVTU0FHRSB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy9tZXNzYWdlcy5qcydcbmltcG9ydCB7XG4gIENPTU1BTkRfTUVTU0FHRV9UQUcsXG4gIExPQ0FMX0NPTU1BTkRfQ0FWRUFUX1RBRyxcbiAgVEFTS19OT1RJRklDQVRJT05fVEFHLFxuICBURUFNTUFURV9NRVNTQUdFX1RBRyxcbiAgVElDS19UQUcsXG59IGZyb20gJy4uLy4uL2NvbnN0YW50cy94bWwuanMnXG5pbXBvcnQgeyBpc0FnZW50U3dhcm1zRW5hYmxlZCB9IGZyb20gJy4uLy4uL3V0aWxzL2FnZW50U3dhcm1zRW5hYmxlZC5qcydcbmltcG9ydCB7XG4gIGV4dHJhY3RUYWcsXG4gIElOVEVSUlVQVF9NRVNTQUdFLFxuICBJTlRFUlJVUFRfTUVTU0FHRV9GT1JfVE9PTF9VU0UsXG59IGZyb20gJy4uLy4uL3V0aWxzL21lc3NhZ2VzLmpzJ1xuaW1wb3J0IHsgSW50ZXJydXB0ZWRCeVVzZXIgfSBmcm9tICcuLi9JbnRlcnJ1cHRlZEJ5VXNlci5qcydcbmltcG9ydCB7IE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gJy4uL01lc3NhZ2VSZXNwb25zZS5qcydcbmltcG9ydCB7IFVzZXJBZ2VudE5vdGlmaWNhdGlvbk1lc3NhZ2UgfSBmcm9tICcuL1VzZXJBZ2VudE5vdGlmaWNhdGlvbk1lc3NhZ2UuanMnXG5pbXBvcnQgeyBVc2VyQmFzaElucHV0TWVzc2FnZSB9IGZyb20gJy4vVXNlckJhc2hJbnB1dE1lc3NhZ2UuanMnXG5pbXBvcnQgeyBVc2VyQmFzaE91dHB1dE1lc3NhZ2UgfSBmcm9tICcuL1VzZXJCYXNoT3V0cHV0TWVzc2FnZS5qcydcbmltcG9ydCB7IFVzZXJDb21tYW5kTWVzc2FnZSB9IGZyb20gJy4vVXNlckNvbW1hbmRNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgVXNlckxvY2FsQ29tbWFuZE91dHB1dE1lc3NhZ2UgfSBmcm9tICcuL1VzZXJMb2NhbENvbW1hbmRPdXRwdXRNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgVXNlck1lbW9yeUlucHV0TWVzc2FnZSB9IGZyb20gJy4vVXNlck1lbW9yeUlucHV0TWVzc2FnZS5qcydcbmltcG9ydCB7IFVzZXJQbGFuTWVzc2FnZSB9IGZyb20gJy4vVXNlclBsYW5NZXNzYWdlLmpzJ1xuaW1wb3J0IHsgVXNlclByb21wdE1lc3NhZ2UgfSBmcm9tICcuL1VzZXJQcm9tcHRNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgVXNlclJlc291cmNlVXBkYXRlTWVzc2FnZSB9IGZyb20gJy4vVXNlclJlc291cmNlVXBkYXRlTWVzc2FnZS5qcydcbmltcG9ydCB7IFVzZXJUZWFtbWF0ZU1lc3NhZ2UgfSBmcm9tICcuL1VzZXJUZWFtbWF0ZU1lc3NhZ2UuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGFkZE1hcmdpbjogYm9vbGVhblxuICBwYXJhbTogVGV4dEJsb2NrUGFyYW1cbiAgdmVyYm9zZTogYm9vbGVhblxuICBwbGFuQ29udGVudD86IHN0cmluZ1xuICBpc1RyYW5zY3JpcHRNb2RlPzogYm9vbGVhblxuICB0aW1lc3RhbXA/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFVzZXJUZXh0TWVzc2FnZSh7XG4gIGFkZE1hcmdpbixcbiAgcGFyYW0sXG4gIHZlcmJvc2UsXG4gIHBsYW5Db250ZW50LFxuICBpc1RyYW5zY3JpcHRNb2RlLFxuICB0aW1lc3RhbXAsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmIChwYXJhbS50ZXh0LnRyaW0oKSA9PT0gTk9fQ09OVEVOVF9NRVNTQUdFKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIFBsYW4gdG8gaW1wbGVtZW50IG1lc3NhZ2UgKGNsZWFyZWQgY29udGV4dCBmbG93KVxuICBpZiAocGxhbkNvbnRlbnQpIHtcbiAgICByZXR1cm4gPFVzZXJQbGFuTWVzc2FnZSBhZGRNYXJnaW49e2FkZE1hcmdpbn0gcGxhbkNvbnRlbnQ9e3BsYW5Db250ZW50fSAvPlxuICB9XG5cbiAgaWYgKGV4dHJhY3RUYWcocGFyYW0udGV4dCwgVElDS19UQUcpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIEhpZGUgc3ludGhldGljIGNhdmVhdCBtZXNzYWdlcyAoc2hvdWxkIGJlIGZpbHRlcmVkIGJ5IGlzTWV0YSwgdGhpcyBpcyBkZWZlbnNpdmUpXG4gIGlmIChwYXJhbS50ZXh0LmluY2x1ZGVzKGA8JHtMT0NBTF9DT01NQU5EX0NBVkVBVF9UQUd9PmApKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIFNob3cgYmFzaCBvdXRwdXRcbiAgaWYgKFxuICAgIHBhcmFtLnRleHQuc3RhcnRzV2l0aCgnPGJhc2gtc3Rkb3V0JykgfHxcbiAgICBwYXJhbS50ZXh0LnN0YXJ0c1dpdGgoJzxiYXNoLXN0ZGVycicpXG4gICkge1xuICAgIHJldHVybiA8VXNlckJhc2hPdXRwdXRNZXNzYWdlIGNvbnRlbnQ9e3BhcmFtLnRleHR9IHZlcmJvc2U9e3ZlcmJvc2V9IC8+XG4gIH1cblxuICAvLyBTaG93IGNvbW1hbmQgb3V0cHV0XG4gIGlmIChcbiAgICBwYXJhbS50ZXh0LnN0YXJ0c1dpdGgoJzxsb2NhbC1jb21tYW5kLXN0ZG91dCcpIHx8XG4gICAgcGFyYW0udGV4dC5zdGFydHNXaXRoKCc8bG9jYWwtY29tbWFuZC1zdGRlcnInKVxuICApIHtcbiAgICByZXR1cm4gPFVzZXJMb2NhbENvbW1hbmRPdXRwdXRNZXNzYWdlIGNvbnRlbnQ9e3BhcmFtLnRleHR9IC8+XG4gIH1cblxuICAvLyBIYW5kbGUgaW50ZXJydXB0aW9uIG1lc3NhZ2VzIHNwZWNpYWxseVxuICBpZiAoXG4gICAgcGFyYW0udGV4dCA9PT0gSU5URVJSVVBUX01FU1NBR0UgfHxcbiAgICBwYXJhbS50ZXh0ID09PSBJTlRFUlJVUFRfTUVTU0FHRV9GT1JfVE9PTF9VU0VcbiAgKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxNZXNzYWdlUmVzcG9uc2UgaGVpZ2h0PXsxfT5cbiAgICAgICAgPEludGVycnVwdGVkQnlVc2VyIC8+XG4gICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICApXG4gIH1cblxuICAvLyBHaXRIdWIgd2ViaG9vayBldmVudHMgKGNoZWNrX3J1biwgcmV2aWV3IGNvbW1lbnRzLCBwdXNoZXMpIGRlbGl2ZXJlZCB2aWFcbiAgLy8gYm91bmQtc2Vzc2lvbiByb3V0aW5nIGFmdGVyIC9zdWJzY3JpYmUtcHIuIFRoZSB0YWcgY29uc3RhbnQgaXMgc3RyaXBwZWRcbiAgLy8gZnJvbSBleHRlcm5hbCBidWlsZHMg4oCUIGlubGluZSB0aGUgbGl0ZXJhbCBzbyB0aGUgaW1wb3J0IGRvZXNuJ3QgZmFpbC5cbiAgLy8gVGhlIHJlcXVpcmUoKSBiZWxvdyBEQ0VzIHdoZW4gYm90aCBmbGFncyBhcmUgb2ZmLiBzdGFydHNXaXRoIChub3RcbiAgLy8gaW5jbHVkZXMpIGFuZCBiZWZvcmUgdGhlIGluY2x1ZGVzLWNoZWNrcyBiZWxvdzogZGVmZW5zZS1pbi1kZXB0aCBpZlxuICAvLyB0aGUgc2FuaXRpemVyIHdlcmUgZXZlciB3ZWFrZW5lZC5cbiAgaWYgKGZlYXR1cmUoJ0tBSVJPU19HSVRIVUJfV0VCSE9PS1MnKSkge1xuICAgIGlmIChwYXJhbS50ZXh0LnN0YXJ0c1dpdGgoJzxnaXRodWItd2ViaG9vay1hY3Rpdml0eT4nKSkge1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXJlcXVpcmUtaW1wb3J0cyAqL1xuICAgICAgY29uc3QgeyBVc2VyR2l0SHViV2ViaG9va01lc3NhZ2UgfSA9XG4gICAgICAgIHJlcXVpcmUoJy4vVXNlckdpdEh1YldlYmhvb2tNZXNzYWdlLmpzJykgYXMgdHlwZW9mIGltcG9ydCgnLi9Vc2VyR2l0SHViV2ViaG9va01lc3NhZ2UuanMnKVxuICAgICAgLyogZXNsaW50LWVuYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tcmVxdWlyZS1pbXBvcnRzICovXG4gICAgICByZXR1cm4gPFVzZXJHaXRIdWJXZWJob29rTWVzc2FnZSBhZGRNYXJnaW49e2FkZE1hcmdpbn0gcGFyYW09e3BhcmFtfSAvPlxuICAgIH1cbiAgfVxuXG4gIC8vIEJhc2ggaW5wdXRzIVxuICBpZiAocGFyYW0udGV4dC5pbmNsdWRlcygnPGJhc2gtaW5wdXQ+JykpIHtcbiAgICByZXR1cm4gPFVzZXJCYXNoSW5wdXRNZXNzYWdlIGFkZE1hcmdpbj17YWRkTWFyZ2lufSBwYXJhbT17cGFyYW19IC8+XG4gIH1cblxuICAvLyBTbGFzaCBjb21tYW5kcy9cbiAgaWYgKHBhcmFtLnRleHQuaW5jbHVkZXMoYDwke0NPTU1BTkRfTUVTU0FHRV9UQUd9PmApKSB7XG4gICAgcmV0dXJuIDxVc2VyQ29tbWFuZE1lc3NhZ2UgYWRkTWFyZ2luPXthZGRNYXJnaW59IHBhcmFtPXtwYXJhbX0gLz5cbiAgfVxuXG4gIGlmIChwYXJhbS50ZXh0LmluY2x1ZGVzKCc8dXNlci1tZW1vcnktaW5wdXQ+JykpIHtcbiAgICByZXR1cm4gPFVzZXJNZW1vcnlJbnB1dE1lc3NhZ2UgYWRkTWFyZ2luPXthZGRNYXJnaW59IHRleHQ9e3BhcmFtLnRleHR9IC8+XG4gIH1cblxuICAvLyBUZWFtbWF0ZSBtZXNzYWdlcyAtIG9ubHkgY2hlY2sgd2hlbiBzd2FybXMgZW5hYmxlZFxuICBpZiAoXG4gICAgaXNBZ2VudFN3YXJtc0VuYWJsZWQoKSAmJlxuICAgIHBhcmFtLnRleHQuaW5jbHVkZXMoYDwke1RFQU1NQVRFX01FU1NBR0VfVEFHfWApXG4gICkge1xuICAgIHJldHVybiAoXG4gICAgICA8VXNlclRlYW1tYXRlTWVzc2FnZVxuICAgICAgICBhZGRNYXJnaW49e2FkZE1hcmdpbn1cbiAgICAgICAgcGFyYW09e3BhcmFtfVxuICAgICAgICBpc1RyYW5zY3JpcHRNb2RlPXtpc1RyYW5zY3JpcHRNb2RlfVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICAvLyBUYXNrIG5vdGlmaWNhdGlvbnMgKGFnZW50IGNvbXBsZXRpb25zLCBiYXNoIGNvbXBsZXRpb25zLCBldGMuKVxuICBpZiAocGFyYW0udGV4dC5pbmNsdWRlcyhgPCR7VEFTS19OT1RJRklDQVRJT05fVEFHfWApKSB7XG4gICAgcmV0dXJuIDxVc2VyQWdlbnROb3RpZmljYXRpb25NZXNzYWdlIGFkZE1hcmdpbj17YWRkTWFyZ2lufSBwYXJhbT17cGFyYW19IC8+XG4gIH1cblxuICAvLyBNQ1AgcmVzb3VyY2UgYW5kIHBvbGxpbmcgdXBkYXRlIG5vdGlmaWNhdGlvbnNcbiAgaWYgKFxuICAgIHBhcmFtLnRleHQuaW5jbHVkZXMoJzxtY3AtcmVzb3VyY2UtdXBkYXRlJykgfHxcbiAgICBwYXJhbS50ZXh0LmluY2x1ZGVzKCc8bWNwLXBvbGxpbmctdXBkYXRlJylcbiAgKSB7XG4gICAgcmV0dXJuIDxVc2VyUmVzb3VyY2VVcGRhdGVNZXNzYWdlIGFkZE1hcmdpbj17YWRkTWFyZ2lufSBwYXJhbT17cGFyYW19IC8+XG4gIH1cblxuICAvLyBGb3JrIGNoaWxkJ3MgZmlyc3QgbWVzc2FnZTogY29sbGFwc2UgdGhlIHJ1bGVzL2Zvcm1hdCBib2lsZXJwbGF0ZSwgc2hvd1xuICAvLyBvbmx5IHRoZSBkaXJlY3RpdmUuIEZPUktfQk9JTEVSUExBVEVfVEFHIGlzIGlubGluZWQgc28gdGhlIGltcG9ydCBkb2Vzbid0XG4gIC8vIHNoaXAgaW4gZXh0ZXJuYWwgYnVpbGRzIHdoZXJlIGZlYXR1cmUoJ0ZPUktfU1VCQUdFTlQnKSBpcyBmYWxzZS5cbiAgaWYgKGZlYXR1cmUoJ0ZPUktfU1VCQUdFTlQnKSkge1xuICAgIGlmIChwYXJhbS50ZXh0LmluY2x1ZGVzKCc8Zm9yay1ib2lsZXJwbGF0ZT4nKSkge1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXJlcXVpcmUtaW1wb3J0cyAqL1xuICAgICAgY29uc3QgeyBVc2VyRm9ya0JvaWxlcnBsYXRlTWVzc2FnZSB9ID1cbiAgICAgICAgcmVxdWlyZSgnLi9Vc2VyRm9ya0JvaWxlcnBsYXRlTWVzc2FnZS5qcycpIGFzIHR5cGVvZiBpbXBvcnQoJy4vVXNlckZvcmtCb2lsZXJwbGF0ZU1lc3NhZ2UuanMnKVxuICAgICAgLyogZXNsaW50LWVuYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tcmVxdWlyZS1pbXBvcnRzICovXG4gICAgICByZXR1cm4gPFVzZXJGb3JrQm9pbGVycGxhdGVNZXNzYWdlIGFkZE1hcmdpbj17YWRkTWFyZ2lufSBwYXJhbT17cGFyYW19IC8+XG4gICAgfVxuICB9XG5cbiAgLy8gQ3Jvc3Mtc2Vzc2lvbiBVRFMgbWVzc2FnZSAoZnJvbSBhbm90aGVyIENsYXVkZSBzZXNzaW9uJ3MgU2VuZE1lc3NhZ2UpLlxuICAvLyBDUk9TU19TRVNTSU9OX01FU1NBR0VfVEFHIGlzIGlubGluZWQgc28gdGhlIGltcG9ydCBkb2Vzbid0IHNoaXAgaW5cbiAgLy8gZXh0ZXJuYWwgYnVpbGRzIHdoZXJlIGZlYXR1cmUoJ1VEU19JTkJPWCcpIGlzIGZhbHNlLlxuICBpZiAoZmVhdHVyZSgnVURTX0lOQk9YJykpIHtcbiAgICBpZiAocGFyYW0udGV4dC5pbmNsdWRlcygnPGNyb3NzLXNlc3Npb24tbWVzc2FnZScpKSB7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tcmVxdWlyZS1pbXBvcnRzICovXG4gICAgICBjb25zdCB7IFVzZXJDcm9zc1Nlc3Npb25NZXNzYWdlIH0gPVxuICAgICAgICByZXF1aXJlKCcuL1VzZXJDcm9zc1Nlc3Npb25NZXNzYWdlLmpzJykgYXMgdHlwZW9mIGltcG9ydCgnLi9Vc2VyQ3Jvc3NTZXNzaW9uTWVzc2FnZS5qcycpXG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHMgKi9cbiAgICAgIHJldHVybiA8VXNlckNyb3NzU2Vzc2lvbk1lc3NhZ2UgYWRkTWFyZ2luPXthZGRNYXJnaW59IHBhcmFtPXtwYXJhbX0gLz5cbiAgICB9XG4gIH1cblxuICAvLyBJbmJvdW5kIGNoYW5uZWwgbWVzc2FnZSAoTUNQIHNlcnZlciBwdXNoKS5cbiAgaWYgKGZlYXR1cmUoJ0tBSVJPUycpIHx8IGZlYXR1cmUoJ0tBSVJPU19DSEFOTkVMUycpKSB7XG4gICAgaWYgKHBhcmFtLnRleHQuaW5jbHVkZXMoJzxjaGFubmVsIHNvdXJjZT1cIicpKSB7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tcmVxdWlyZS1pbXBvcnRzICovXG4gICAgICBjb25zdCB7IFVzZXJDaGFubmVsTWVzc2FnZSB9ID1cbiAgICAgICAgcmVxdWlyZSgnLi9Vc2VyQ2hhbm5lbE1lc3NhZ2UuanMnKSBhcyB0eXBlb2YgaW1wb3J0KCcuL1VzZXJDaGFubmVsTWVzc2FnZS5qcycpXG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHMgKi9cbiAgICAgIHJldHVybiA8VXNlckNoYW5uZWxNZXNzYWdlIGFkZE1hcmdpbj17YWRkTWFyZ2lufSBwYXJhbT17cGFyYW19IC8+XG4gICAgfVxuICB9XG5cbiAgLy8gVXNlciBwcm9tcHRzPlxuICByZXR1cm4gKFxuICAgIDxVc2VyUHJvbXB0TWVzc2FnZVxuICAgICAgYWRkTWFyZ2luPXthZGRNYXJnaW59XG4gICAgICBwYXJhbT17cGFyYW19XG4gICAgICBpc1RyYW5zY3JpcHRNb2RlPXtpc1RyYW5zY3JpcHRNb2RlfVxuICAgICAgdGltZXN0YW1wPXt0aW1lc3RhbXB9XG4gICAgLz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsT0FBTyxRQUFRLFlBQVk7QUFDcEMsY0FBY0MsY0FBYyxRQUFRLHVDQUF1QztBQUMzRSxPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLGtCQUFrQixRQUFRLDZCQUE2QjtBQUNoRSxTQUNF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T0FBL0RXLEVBQStEO0lBQUE7RUFDdkU7RUFJSCxJQUFJN0MsT0FBTyxDQUFDLFFBQXNDLENBQUMsSUFBMUJBLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztJQUNqRCxJQUFJMkIsS0FBSyxDQUFBUyxJQUFLLENBQUFHLFFBQVMsQ0FBQyxvQkFBbUIsQ0FBQztNQUFBLElBQUFELEVBQUE7TUFBQSxJQUFBSixDQUFBLFNBQUFPLE1BQUEsQ0FBQUMsR0FBQTtRQUd4Q0osRUFBQSxHQUFBSyxPQUFPLENBQUMseUJBQXlCLENBQUM7UUFBQVQsQ0FBQSxPQUFBSSxFQUFBO01BQUE7UUFBQUEsRUFBQSxHQUFBSixDQUFBO01BQUE7TUFEcEM7UUFBQWM7TUFBQSxJQUNFVixFQUFrQyxJQUFJLE9BQU8sT0FBTyx5QkFBeUIsQ0FBQztNQUFBLElBQUFPLEVBQUE7TUFBQSxJQUFBWCxDQUFBLFNBQUFSLFNBQUEsSUFBQVEsQ0FBQSxTQUFBUCxLQUFBO1FBRXpFa0IsRUFBQSxJQUFDLGtCQUFrQixDQUFZbkIsU0FBUyxDQUFUQSxVQUFRLENBQUMsQ0FBU0MsS0FBSyxDQUFMQSxNQUFJLENBQUMsR0FBSTtRQUFBTyxDQUFBLE9BQUFSLFNBQUE7UUFBQVEsQ0FBQSxPQUFBUCxLQUFBO1FBQUFPLENBQUEsT0FBQVcsRUFBQTtNQUFBO1FBQUFBLEVBQUEsR0FBQVgsQ0FBQTtNQUFBO01BQUEsT0FBMURXLEVBQTBEO0lBQUE7RUFDbEU7RUFDRixJQUFBUCxFQUFBO0VBQUEsSUFBQUosQ0FBQSxTQUFBUixTQUFBLElBQUFRLENBQUEsU0FBQUosZ0JBQUEsSUFBQUksQ0FBQSxTQUFBUCxLQUFBLElBQUFPLENBQUEsU0FBQUgsU0FBQTtJQUlDTyxFQUFBLElBQUMsaUJBQWlCLENBQ0xaLFNBQVMsQ0FBVEEsVUFBUSxDQUFDLENBQ2JDLEtBQUssQ0FBTEEsTUFBSSxDQUFDLENBQ01HLGdCQUFnQixDQUFoQkEsaUJBQWUsQ0FBQyxDQUN2QkMsU0FBUyxDQUFUQSxVQUFRLENBQUMsR0FDcEI7SUFBQUcsQ0FBQSxPQUFBUixTQUFBO0lBQUFRLENBQUEsT0FBQUosZ0JBQUE7SUFBQUksQ0FBQSxPQUFBUCxLQUFBO0lBQUFPLENBQUEsT0FBQUgsU0FBQTtJQUFBRyxDQUFBLE9BQUFJLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQUFBLE9BTEZJLEVBS0U7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==