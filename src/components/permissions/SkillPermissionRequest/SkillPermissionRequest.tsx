// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useMemo } from 'react';
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js';
// 引入 getOriginalCwd，将 ../../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../../../bootstrap/state.js';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 ../../../services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from '../../../services/analytics/metadata.js';
// 接入 SKILL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SKILL_TOOL_NAME } from '../../../tools/SkillTool/constants.js';
// 接入 SkillTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { SkillTool } from '../../../tools/SkillTool/SkillTool.js';
// 复用 env 工具函数，把通用处理留在 ../../../utils/env.js 中维护。
import { env } from '../../../utils/env.js';
// 复用 shouldShowAlwaysAllowOptions 工具函数，把通用处理留在 ../../../utils/permissions/permissionsLoader.js 中维护。
import { shouldShowAlwaysAllowOptions } from '../../../utils/permissions/permissionsLoader.js';
// 复用 logUnaryEvent 工具函数，把通用处理留在 ../../../utils/unaryLogging.js 中维护。
import { logUnaryEvent } from '../../../utils/unaryLogging.js';
// 引入 UnaryEvent、usePermissionRequestLogging，将 ../hooks.js 中已经封装好的能力接到本文件流程里。
import { type UnaryEvent, usePermissionRequestLogging } from '../hooks.js';
// 引入 PermissionDialog，将 ../PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from '../PermissionDialog.js';
// 引入 PermissionPrompt、PermissionPromptOption、ToolAnalyticsContext，将 ../PermissionPrompt.js 中已经封装好的能力接到本文件流程里。
import { PermissionPrompt, type PermissionPromptOption, type ToolAnalyticsContext } from '../PermissionPrompt.js';
// 类型依赖 { PermissionRequestProps } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { PermissionRequestProps } from '../PermissionRequest.js';
// 引入 PermissionRuleExplanation，将 ../PermissionRuleExplanation.js 中已经封装好的能力接到本文件流程里。
import { PermissionRuleExplanation } from '../PermissionRuleExplanation.js';
// SkillOptionValue 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type SkillOptionValue = 'yes' | 'yes-exact' | 'yes-prefix' | 'no';
// SkillPermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SkillPermissionRequest(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(51);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    toolUseConfirm,
    onDone,
    onReject,
    workerBadge
  } = props;
  // parseInput 命名 `_temp`，让后续代码直接表达这个值的用途。
  const parseInput = _temp;
  // t0 暂存 `parseInput(toolUseConfirm.input)` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== toolUseConfirm.input) {
    // t0 暂存 `parseInput(toolUseConfirm.input)` 生成的渲染片段，后续返回路径直接复用。
    t0 = parseInput(toolUseConfirm.input);
    // $[0] 缓存 `toolUseConfirm.input`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = toolUseConfirm.input;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // skill保存`t0`，作为后续临时缓存值处理的输入。
  const skill = t0;
  // commandObj 命令数据标记终端渲染权限确认界面 Skill Permission Reque...是否启用对应路径。
  const commandObj = toolUseConfirm.permissionResult.behavior === "ask" && toolUseConfirm.permissionResult.metadata && "command" in toolUseConfirm.permissionResult.metadata ? toolUseConfirm.permissionResult.metadata.command : undefined;
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      completion_type: "tool_use_single",
      language_name: "none"
    };
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // unaryEvent保存`t1`，作为后续临时缓存值处理的输入。
  const unaryEvent = t1;
  // 调用 usePermissionRequestLogging，触发终端渲染此处需要的副作用。
  usePermissionRequestLogging(toolUseConfirm, unaryEvent);
  // t2 暂存 `getOriginalCwd()` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `getOriginalCwd()` 生成的渲染片段，后续返回路径直接复用。
    t2 = getOriginalCwd();
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // originalCwd沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const originalCwd = t2;
  // t3 暂存 `shouldShowAlwaysAllowOptions()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `shouldShowAlwaysAllowOptions()` 生成的渲染片段，后续返回路径直接复用。
    t3 = shouldShowAlwaysAllowOptions();
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // showAlwaysAllowOptions 集合 命名 `t3`，让后续代码直接表达这个值的用途。
  const showAlwaysAllowOptions = t3;
  // t4 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t4 = [{
      label: "Yes",
      value: "yes",
      feedbackConfig: {
        type: "accept"
      }
    }];
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // baseOptions 集合沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const baseOptions = t4;
  // alwaysAllowOptions 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let alwaysAllowOptions;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== skill) {
    // alwaysAllowOptions 集合更新为 `[]`，确保权限确认界面后续读取最新状态。
    alwaysAllowOptions = [];
    // 满足 `showAlwaysAllowOptions` 时，终端渲染执行该分支。
    if (showAlwaysAllowOptions) {
      // t5保存`<Text bold={true}>{skill}</Text>`，供终端渲染权限确认界面 Skill Permission Reque...后续判断或输出使用。
      const t5 = <Text bold={true}>{skill}</Text>;
      // t6 暂存 `<Text bold={true}>{originalCwd}</Text>` 的派生结果，便于缓存命中时直接复用。
      let t6;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        // t6 暂存 `<Text bold={true}>{originalCwd}</Text>` 生成的渲染片段，后续返回路径直接复用。
        t6 = <Text bold={true}>{originalCwd}</Text>;
        // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
        $[8] = t6;
      } else {
        // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
        t6 = $[8];
      }
      // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t7;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[9] !== t5) {
        // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t7 = {
          label: <Text>Yes, and don't ask again for {t5} in{" "}{t6}</Text>,
          value: "yes-exact"
        };
        // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
        $[9] = t5;
        // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
        $[10] = t7;
      } else {
        // t7从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
        t7 = $[10];
      }
      // alwaysAllowOptions 集合追加新条目，保持收集顺序与输入顺序一致。
      alwaysAllowOptions.push(t7);
      // spaceIndex 索引保存`skill.indexOf`，供终端渲染后续处理使用。
      const spaceIndex = skill.indexOf(" ");
      // 满足 `spaceIndex > 0` 时，终端渲染执行该分支。
      if (spaceIndex > 0) {
        // commandPrefix 命令数据格式化`skill.substring`，供终端渲染后续处理使用。
        const commandPrefix = skill.substring(0, spaceIndex);
        // 临时值 t8保存`commandPrefix + ":*"`，供终端渲染权限确认界面 Skill Permission Req...后续步骤使用。
        const t8 = commandPrefix + ":*";
        // t9暂存 `<Text bold={true}>{t8}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t9;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[11] !== t8) {
          // t9暂存 `<Text bold={true}>{t8}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t9 = <Text bold={true}>{t8}</Text>;
          // $[11] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
          $[11] = t8;
          // $[12] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[12] = t9;
        } else {
          // t9从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
          t9 = $[12];
        }
        // t10暂存 `<Text bold={true}>{originalCwd}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t10;
        // 判断 $[13] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
        if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
          // t10暂存 `<Text bold={true}>{originalCwd}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t10 = <Text bold={true}>{originalCwd}</Text>;
          // $[13] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
          $[13] = t10;
        } else {
          // t10从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
          t10 = $[13];
        }
        // t11暂存 `{` 的派生结果，便于缓存命中时直接复用。
        let t11;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[14] !== t9) {
          // t11暂存 `{` 生成的渲染片段，后续返回路径直接复用。
          t11 = {
            label: <Text>Yes, and don't ask again for{" "}{t9} commands in{" "}{t10}</Text>,
            value: "yes-prefix"
          };
          // $[14] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
          $[14] = t9;
          // $[15] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
          $[15] = t11;
        } else {
          // t11 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
          t11 = $[15];
        }
        // alwaysAllowOptions 集合追加新条目，保持收集顺序与输入顺序一致。
        alwaysAllowOptions.push(t11);
      }
    }
    // $[6] 缓存 `skill`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = skill;
    // $[7] 缓存 `alwaysAllowOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = alwaysAllowOptions;
  } else {
    // alwaysAllowOptions 集合更新为 `$[7]`，确保权限确认界面后续读取最新状态。
    alwaysAllowOptions = $[7];
  }
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      label: "No",
      value: "no",
      feedbackConfig: {
        type: "reject"
      }
    };
    // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[16];
  }
  // noOption 命名 `t5`，让后续代码直接表达这个值的用途。
  const noOption = t5;
  // t6 暂存 `[...baseOptions, ...alwaysAllowOptions, noOption]` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== alwaysAllowOptions) {
    // t6 暂存 `[...baseOptions, ...alwaysAllowOptions, noOption]` 生成的渲染片段，后续返回路径直接复用。
    t6 = [...baseOptions, ...alwaysAllowOptions, noOption];
    // $[17] 缓存 `alwaysAllowOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = alwaysAllowOptions;
    // $[18] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[18];
  }
  // 选项沿用 `t6` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const options = t6;
  // t7 暂存 `sanitizeToolNameForAnalytics(toolUseConfirm.tool.name)` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== toolUseConfirm.tool.name) {
    // t7 暂存 `sanitizeToolNameForAnalytics(toolUseConfirm.tool.name)` 生成的渲染片段，后续返回路径直接复用。
    t7 = sanitizeToolNameForAnalytics(toolUseConfirm.tool.name);
    // $[19] 缓存 `toolUseConfirm.tool.name`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = toolUseConfirm.tool.name;
    // $[20] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[20];
  }
  // t8保存`toolUseConfirm.tool.isMcp ?? false`，供后续判断或组装使用。
  const t8 = toolUseConfirm.tool.isMcp ?? false;
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== t7 || $[22] !== t8) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      toolName: t7,
      isMcp: t8
    };
    // $[21] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t7;
    // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t8;
    // $[23] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[23];
  }
  // toolAnalyticsContext 命名 `t9`，让后续代码直接表达这个值的用途。
  const toolAnalyticsContext = t9;
  // t10 暂存 `(value, feedback) => {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== onDone || $[25] !== onReject || $[26] !== skill || $[27] !== toolUseConfirm) {
    // t10 暂存 `(value, feedback) => {` 生成的渲染片段，后续返回路径直接复用。
    t10 = (value, feedback) => {
      // 权限确认界面 Skill Permission Request在这里处理 `bb33: switch (value) {`，完成这一小步状态转换。
      bb33: switch (value) {
        case "yes":
          {
            // 调用 logUnaryEvent，触发终端渲染此处需要的副作用。
            logUnaryEvent({
              completion_type: "tool_use_single",
              event: "accept",
              metadata: {
                language_name: "none",
                message_id: toolUseConfirm.assistantMessage.message.id,
                platform: env.platform
              }
            });
            // 调用 toolUseConfirm.onAllow，触发终端渲染此处需要的副作用。
            toolUseConfirm.onAllow(toolUseConfirm.input, [], feedback);
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone();
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb33;
          }
        case "yes-exact":
          {
            // 调用 logUnaryEvent，触发终端渲染此处需要的副作用。
            logUnaryEvent({
              completion_type: "tool_use_single",
              event: "accept",
              metadata: {
                language_name: "none",
                message_id: toolUseConfirm.assistantMessage.message.id,
                platform: env.platform
              }
            });
            // 调用 toolUseConfirm.onAllow，触发终端渲染此处需要的副作用。
            toolUseConfirm.onAllow(toolUseConfirm.input, [{
              type: "addRules",
              rules: [{
                toolName: SKILL_TOOL_NAME,
                ruleContent: skill
              }],
              behavior: "allow",
              destination: "localSettings"
            }]);
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone();
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb33;
          }
        case "yes-prefix":
          {
            // 调用 logUnaryEvent，触发终端渲染此处需要的副作用。
            logUnaryEvent({
              completion_type: "tool_use_single",
              event: "accept",
              metadata: {
                language_name: "none",
                message_id: toolUseConfirm.assistantMessage.message.id,
                platform: env.platform
              }
            });
            // spaceIndex_0 索引保存`skill.indexOf`，供终端渲染后续处理使用。
            const spaceIndex_0 = skill.indexOf(" ");
            // commandPrefix_0 命令数据格式化`skill.substring`，供终端渲染后续处理使用。
            const commandPrefix_0 = spaceIndex_0 > 0 ? skill.substring(0, spaceIndex_0) : skill;
            // 调用 toolUseConfirm.onAllow，触发终端渲染此处需要的副作用。
            toolUseConfirm.onAllow(toolUseConfirm.input, [{
              type: "addRules",
              rules: [{
                toolName: SKILL_TOOL_NAME,
                ruleContent: `${commandPrefix_0}:*`
              }],
              behavior: "allow",
              destination: "localSettings"
            }]);
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone();
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb33;
          }
        case "no":
          {
            // 调用 logUnaryEvent，触发终端渲染此处需要的副作用。
            logUnaryEvent({
              completion_type: "tool_use_single",
              event: "reject",
              metadata: {
                language_name: "none",
                message_id: toolUseConfirm.assistantMessage.message.id,
                platform: env.platform
              }
            });
            // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
            toolUseConfirm.onReject(feedback);
            // 调用 onReject，触发终端渲染此处需要的副作用。
            onReject();
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone();
          }
      }
    };
    // $[24] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = onDone;
    // $[25] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = onReject;
    // $[26] 缓存 `skill`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = skill;
    // $[27] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = toolUseConfirm;
    // $[28] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[28];
  }
  // handleSelect 命名 `t10`，让后续代码直接表达这个值的用途。
  const handleSelect = t10;
  // t11 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== onDone || $[30] !== onReject || $[31] !== toolUseConfirm) {
    // t11 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t11 = () => {
      // 调用 logUnaryEvent，触发终端渲染此处需要的副作用。
      logUnaryEvent({
        completion_type: "tool_use_single",
        event: "reject",
        metadata: {
          language_name: "none",
          message_id: toolUseConfirm.assistantMessage.message.id,
          platform: env.platform
        }
      });
      // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
      toolUseConfirm.onReject();
      // 调用 onReject，触发终端渲染此处需要的副作用。
      onReject();
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    };
    // $[29] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = onDone;
    // $[30] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = onReject;
    // $[31] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = toolUseConfirm;
    // $[32] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[32];
  }
  // handleCancel沿用 `t11` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleCancel = t11;
  // t12保存``Use skill "${skill}"?``，作为后续固定文本处理的输入。
  const t12 = `Use skill "${skill}"?`;
  // t13 暂存 `<Text>Claude may use instructions, code, or files from th...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    // t13 暂存 `<Text>Claude may use instructions, code, or files from th...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Text>Claude may use instructions, code, or files from this Skill.</Text>;
    // $[33] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[33];
  }
  // t14保存`commandObj?.description`，供终端渲染权限确认界面 Skill Permission Reque...后续判断或输出使用。
  const t14 = commandObj?.description;
  // t15 暂存 `<Box flexDirection="column" paddingX={2} paddingY={1}><Te...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== t14) {
    // t15 暂存 `<Box flexDirection="column" paddingX={2} paddingY={1}><Te...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Box flexDirection="column" paddingX={2} paddingY={1}><Text dimColor={true}>{t14}</Text></Box>;
    // $[34] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t14;
    // $[35] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[35];
  }
  // t16 暂存 `<PermissionRuleExplanation permissionResult={toolUseConfi...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[36] !== toolUseConfirm.permissionResult) {
    // t16 暂存 `<PermissionRuleExplanation permissionResult={toolUseConfi...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <PermissionRuleExplanation permissionResult={toolUseConfirm.permissionResult} toolType="tool" />;
    // $[36] 缓存 `toolUseConfirm.permissionResult`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = toolUseConfirm.permissionResult;
    // $[37] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[37];
  }
  // t17 暂存 `<PermissionPrompt options={options} onSelect={handleSelec...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[38] !== handleCancel || $[39] !== handleSelect || $[40] !== options || $[41] !== toolAnalyticsContext) {
    // t17 暂存 `<PermissionPrompt options={options} onSelect={handleSelec...` 生成的渲染片段，后续返回路径直接复用。
    t17 = <PermissionPrompt options={options} onSelect={handleSelect} onCancel={handleCancel} toolAnalyticsContext={toolAnalyticsContext} />;
    // $[38] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = handleCancel;
    // $[39] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = handleSelect;
    // $[40] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = options;
    // $[41] 缓存 `toolAnalyticsContext`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = toolAnalyticsContext;
    // $[42] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[42];
  }
  // t18 暂存 `<Box flexDirection="column">{t16}{t17}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[43] !== t16 || $[44] !== t17) {
    // t18 暂存 `<Box flexDirection="column">{t16}{t17}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Box flexDirection="column">{t16}{t17}</Box>;
    // $[43] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t16;
    // $[44] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t17;
    // $[45] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[45] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[45];
  }
  // t19 暂存 `<PermissionDialog title={t12} workerBadge={workerBadge}>{...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[46] !== t12 || $[47] !== t15 || $[48] !== t18 || $[49] !== workerBadge) {
    // t19 暂存 `<PermissionDialog title={t12} workerBadge={workerBadge}>{...` 生成的渲染片段，后续返回路径直接复用。
    t19 = <PermissionDialog title={t12} workerBadge={workerBadge}>{t13}{t15}{t18}</PermissionDialog>;
    // $[46] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t12;
    // $[47] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t15;
    // $[48] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t18;
    // $[49] 缓存 `workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = workerBadge;
    // $[50] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[50];
  }
  // 返回 `t19`，作为终端渲染这次计算的结果。
  return t19;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(input) {
  // 结果保存`inputSchema.safeParse`，供终端渲染后续处理使用。
  const result = SkillTool.inputSchema.safeParse(input);
  // result.success 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!result.success) {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Failed to parse skill tool input: ${result.error.message}`));
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return "";
  }
  // 返回 `result.data.skill`，作为终端渲染这次计算的结果。
  return result.data.skill;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlTWVtbyIsImxvZ0Vycm9yIiwiZ2V0T3JpZ2luYWxDd2QiLCJCb3giLCJUZXh0Iiwic2FuaXRpemVUb29sTmFtZUZvckFuYWx5dGljcyIsIlNLSUxMX1RPT0xfTkFNRSIsIlNraWxsVG9vbCIsImVudiIsInNob3VsZFNob3dBbHdheXNBbGxvd09wdGlvbnMiLCJsb2dVbmFyeUV2ZW50IiwiVW5hcnlFdmVudCIsInVzZVBlcm1pc3Npb25SZXF1ZXN0TG9nZ2luZyIsIlBlcm1pc3Npb25EaWFsb2ciLCJQZXJtaXNzaW9uUHJvbXB0IiwiUGVybWlzc2lvblByb21wdE9wdGlvbiIsIlRvb2xBbmFseXRpY3NDb250ZXh0IiwiUGVybWlzc2lvblJlcXVlc3RQcm9wcyIsIlBlcm1pc3Npb25SdWxlRXhwbGFuYXRpb24iLCJTa2lsbE9wdGlvblZhbHVlIiwiU2tpbGxQZXJtaXNzaW9uUmVxdWVzdCIsInByb3BzIiwiJCIsIl9jIiwidG9vbFVzZUNvbmZpcm0iLCJvbkRvbmUiLCJvblJlamVjdCIsIndvcmtlckJhZGdlIiwicGFyc2VJbnB1dCIsIl90ZW1wIiwidDAiLCJpbnB1dCIsInNraWxsIiwiY29tbWFuZE9iaiIsInBlcm1pc3Npb25SZXN1bHQiLCJiZWhhdmlvciIsIm1ldGFkYXRhIiwiY29tbWFuZCIsInVuZGVmaW5lZCIsInQxIiwiU3ltYm9sIiwiZm9yIiwiY29tcGxldGlvbl90eXBlIiwibGFuZ3VhZ2VfbmFtZSIsInVuYXJ5RXZlbnQiLCJ0MiIsIm9yaWdpbmFsQ3dkIiwidDMiLCJzaG93QWx3YXlzQWxsb3dPcHRpb25zIiwidDQiLCJsYWJlbCIsInZhbHVlIiwiZmVlZGJhY2tDb25maWciLCJ0eXBlIiwiYmFzZU9wdGlvbnMiLCJhbHdheXNBbGxvd09wdGlvbnMiLCJ0NSIsInQ2IiwidDciLCJwdXNoIiwic3BhY2VJbmRleCIsImluZGV4T2YiLCJjb21tYW5kUHJlZml4Iiwic3Vic3RyaW5nIiwidDgiLCJ0OSIsInQxMCIsInQxMSIsIm5vT3B0aW9uIiwib3B0aW9ucyIsInRvb2wiLCJuYW1lIiwiaXNNY3AiLCJ0b29sTmFtZSIsInRvb2xBbmFseXRpY3NDb250ZXh0IiwiZmVlZGJhY2siLCJiYjMzIiwiZXZlbnQiLCJtZXNzYWdlX2lkIiwiYXNzaXN0YW50TWVzc2FnZSIsIm1lc3NhZ2UiLCJpZCIsInBsYXRmb3JtIiwib25BbGxvdyIsInJ1bGVzIiwicnVsZUNvbnRlbnQiLCJkZXN0aW5hdGlvbiIsInNwYWNlSW5kZXhfMCIsImNvbW1hbmRQcmVmaXhfMCIsImhhbmRsZVNlbGVjdCIsImhhbmRsZUNhbmNlbCIsInQxMiIsInQxMyIsInQxNCIsImRlc2NyaXB0aW9uIiwidDE1IiwidDE2IiwidDE3IiwidDE4IiwidDE5IiwicmVzdWx0IiwiaW5wdXRTY2hlbWEiLCJzYWZlUGFyc2UiLCJzdWNjZXNzIiwiRXJyb3IiLCJlcnJvciIsImRhdGEiXSwic291cmNlcyI6WyJTa2lsbFBlcm1pc3Npb25SZXF1ZXN0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2ssIHVzZU1lbW8gfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGxvZ0Vycm9yIH0gZnJvbSAnc3JjL3V0aWxzL2xvZy5qcydcbmltcG9ydCB7IGdldE9yaWdpbmFsQ3dkIH0gZnJvbSAnLi4vLi4vLi4vYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgc2FuaXRpemVUb29sTmFtZUZvckFuYWx5dGljcyB9IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9tZXRhZGF0YS5qcydcbmltcG9ydCB7IFNLSUxMX1RPT0xfTkFNRSB9IGZyb20gJy4uLy4uLy4uL3Rvb2xzL1NraWxsVG9vbC9jb25zdGFudHMuanMnXG5pbXBvcnQgeyBTa2lsbFRvb2wgfSBmcm9tICcuLi8uLi8uLi90b29scy9Ta2lsbFRvb2wvU2tpbGxUb29sLmpzJ1xuaW1wb3J0IHsgZW52IH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvZW52LmpzJ1xuaW1wb3J0IHsgc2hvdWxkU2hvd0Fsd2F5c0FsbG93T3B0aW9ucyB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL3Blcm1pc3Npb25zTG9hZGVyLmpzJ1xuaW1wb3J0IHsgbG9nVW5hcnlFdmVudCB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3VuYXJ5TG9nZ2luZy5qcydcbmltcG9ydCB7IHR5cGUgVW5hcnlFdmVudCwgdXNlUGVybWlzc2lvblJlcXVlc3RMb2dnaW5nIH0gZnJvbSAnLi4vaG9va3MuanMnXG5pbXBvcnQgeyBQZXJtaXNzaW9uRGlhbG9nIH0gZnJvbSAnLi4vUGVybWlzc2lvbkRpYWxvZy5qcydcbmltcG9ydCB7XG4gIFBlcm1pc3Npb25Qcm9tcHQsXG4gIHR5cGUgUGVybWlzc2lvblByb21wdE9wdGlvbixcbiAgdHlwZSBUb29sQW5hbHl0aWNzQ29udGV4dCxcbn0gZnJvbSAnLi4vUGVybWlzc2lvblByb21wdC5qcydcbmltcG9ydCB0eXBlIHsgUGVybWlzc2lvblJlcXVlc3RQcm9wcyB9IGZyb20gJy4uL1Blcm1pc3Npb25SZXF1ZXN0LmpzJ1xuaW1wb3J0IHsgUGVybWlzc2lvblJ1bGVFeHBsYW5hdGlvbiB9IGZyb20gJy4uL1Blcm1pc3Npb25SdWxlRXhwbGFuYXRpb24uanMnXG5cbnR5cGUgU2tpbGxPcHRpb25WYWx1ZSA9ICd5ZXMnIHwgJ3llcy1leGFjdCcgfCAneWVzLXByZWZpeCcgfCAnbm8nXG5cbmV4cG9ydCBmdW5jdGlvbiBTa2lsbFBlcm1pc3Npb25SZXF1ZXN0KFxuICBwcm9wczogUGVybWlzc2lvblJlcXVlc3RQcm9wcyxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHtcbiAgICB0b29sVXNlQ29uZmlybSxcbiAgICBvbkRvbmUsXG4gICAgb25SZWplY3QsXG4gICAgdmVyYm9zZTogX3ZlcmJvc2UsXG4gICAgd29ya2VyQmFkZ2UsXG4gIH0gPSBwcm9wc1xuICBjb25zdCBwYXJzZUlucHV0ID0gKGlucHV0OiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBTa2lsbFRvb2wuaW5wdXRTY2hlbWEuc2FmZVBhcnNlKGlucHV0KVxuICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgIGxvZ0Vycm9yKFxuICAgICAgICBuZXcgRXJyb3IoYEZhaWxlZCB0byBwYXJzZSBza2lsbCB0b29sIGlucHV0OiAke3Jlc3VsdC5lcnJvci5tZXNzYWdlfWApLFxuICAgICAgKVxuICAgICAgcmV0dXJuICcnXG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuZGF0YS5za2lsbFxuICB9XG5cbiAgY29uc3Qgc2tpbGwgPSBwYXJzZUlucHV0KHRvb2xVc2VDb25maXJtLmlucHV0KVxuXG4gIC8vIENoZWNrIGlmIHRoaXMgaXMgYSBjb21tYW5kIHVzaW5nIG1ldGFkYXRhIGZyb20gY2hlY2tQZXJtaXNzaW9uc1xuICBjb25zdCBjb21tYW5kT2JqID1cbiAgICB0b29sVXNlQ29uZmlybS5wZXJtaXNzaW9uUmVzdWx0LmJlaGF2aW9yID09PSAnYXNrJyAmJlxuICAgIHRvb2xVc2VDb25maXJtLnBlcm1pc3Npb25SZXN1bHQubWV0YWRhdGEgJiZcbiAgICAnY29tbWFuZCcgaW4gdG9vbFVzZUNvbmZpcm0ucGVybWlzc2lvblJlc3VsdC5tZXRhZGF0YVxuICAgICAgPyB0b29sVXNlQ29uZmlybS5wZXJtaXNzaW9uUmVzdWx0Lm1ldGFkYXRhLmNvbW1hbmRcbiAgICAgIDogdW5kZWZpbmVkXG5cbiAgY29uc3QgdW5hcnlFdmVudCA9IHVzZU1lbW88VW5hcnlFdmVudD4oXG4gICAgKCkgPT4gKHtcbiAgICAgIGNvbXBsZXRpb25fdHlwZTogJ3Rvb2xfdXNlX3NpbmdsZScsXG4gICAgICBsYW5ndWFnZV9uYW1lOiAnbm9uZScsXG4gICAgfSksXG4gICAgW10sXG4gIClcblxuICB1c2VQZXJtaXNzaW9uUmVxdWVzdExvZ2dpbmcodG9vbFVzZUNvbmZpcm0sIHVuYXJ5RXZlbnQpXG5cbiAgY29uc3Qgb3JpZ2luYWxDd2QgPSBnZXRPcmlnaW5hbEN3ZCgpXG4gIGNvbnN0IHNob3dBbHdheXNBbGxvd09wdGlvbnMgPSBzaG91bGRTaG93QWx3YXlzQWxsb3dPcHRpb25zKClcbiAgY29uc3Qgb3B0aW9ucyA9IHVzZU1lbW8oKCk6IFBlcm1pc3Npb25Qcm9tcHRPcHRpb248U2tpbGxPcHRpb25WYWx1ZT5bXSA9PiB7XG4gICAgY29uc3QgYmFzZU9wdGlvbnM6IFBlcm1pc3Npb25Qcm9tcHRPcHRpb248U2tpbGxPcHRpb25WYWx1ZT5bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdZZXMnLFxuICAgICAgICB2YWx1ZTogJ3llcycsXG4gICAgICAgIGZlZWRiYWNrQ29uZmlnOiB7IHR5cGU6ICdhY2NlcHQnIH0sXG4gICAgICB9LFxuICAgIF1cblxuICAgIC8vIE9ubHkgYWRkIFwiYWx3YXlzIGFsbG93XCIgb3B0aW9ucyB3aGVuIG5vdCByZXN0cmljdGVkIGJ5IGFsbG93TWFuYWdlZFBlcm1pc3Npb25SdWxlc09ubHlcbiAgICBjb25zdCBhbHdheXNBbGxvd09wdGlvbnM6IFBlcm1pc3Npb25Qcm9tcHRPcHRpb248U2tpbGxPcHRpb25WYWx1ZT5bXSA9IFtdXG4gICAgaWYgKHNob3dBbHdheXNBbGxvd09wdGlvbnMpIHtcbiAgICAgIC8vIEFkZCBleGFjdCBtYXRjaCBvcHRpb25cbiAgICAgIGFsd2F5c0FsbG93T3B0aW9ucy5wdXNoKHtcbiAgICAgICAgbGFiZWw6IChcbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIFllcywgYW5kIGRvbiZhcG9zO3QgYXNrIGFnYWluIGZvciA8VGV4dCBib2xkPntza2lsbH08L1RleHQ+IGlueycgJ31cbiAgICAgICAgICAgIDxUZXh0IGJvbGQ+e29yaWdpbmFsQ3dkfTwvVGV4dD5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICksXG4gICAgICAgIHZhbHVlOiAneWVzLWV4YWN0JyxcbiAgICAgIH0pXG5cbiAgICAgIC8vIEFkZCBwcmVmaXggb3B0aW9uIGlmIHRoZSBza2lsbCBoYXMgYXJndW1lbnRzXG4gICAgICBjb25zdCBzcGFjZUluZGV4ID0gc2tpbGwuaW5kZXhPZignICcpXG4gICAgICBpZiAoc3BhY2VJbmRleCA+IDApIHtcbiAgICAgICAgY29uc3QgY29tbWFuZFByZWZpeCA9IHNraWxsLnN1YnN0cmluZygwLCBzcGFjZUluZGV4KVxuICAgICAgICBhbHdheXNBbGxvd09wdGlvbnMucHVzaCh7XG4gICAgICAgICAgbGFiZWw6IChcbiAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICBZZXMsIGFuZCBkb24mYXBvczt0IGFzayBhZ2FpbiBmb3J7JyAnfVxuICAgICAgICAgICAgICA8VGV4dCBib2xkPntjb21tYW5kUHJlZml4ICsgJzoqJ308L1RleHQ+IGNvbW1hbmRzIGlueycgJ31cbiAgICAgICAgICAgICAgPFRleHQgYm9sZD57b3JpZ2luYWxDd2R9PC9UZXh0PlxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICksXG4gICAgICAgICAgdmFsdWU6ICd5ZXMtcHJlZml4JyxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBub09wdGlvbjogUGVybWlzc2lvblByb21wdE9wdGlvbjxTa2lsbE9wdGlvblZhbHVlPiA9IHtcbiAgICAgIGxhYmVsOiAnTm8nLFxuICAgICAgdmFsdWU6ICdubycsXG4gICAgICBmZWVkYmFja0NvbmZpZzogeyB0eXBlOiAncmVqZWN0JyB9LFxuICAgIH1cblxuICAgIHJldHVybiBbLi4uYmFzZU9wdGlvbnMsIC4uLmFsd2F5c0FsbG93T3B0aW9ucywgbm9PcHRpb25dXG4gIH0sIFtza2lsbCwgb3JpZ2luYWxDd2QsIHNob3dBbHdheXNBbGxvd09wdGlvbnNdKVxuXG4gIGNvbnN0IHRvb2xBbmFseXRpY3NDb250ZXh0ID0gdXNlTWVtbyhcbiAgICAoKTogVG9vbEFuYWx5dGljc0NvbnRleHQgPT4gKHtcbiAgICAgIHRvb2xOYW1lOiBzYW5pdGl6ZVRvb2xOYW1lRm9yQW5hbHl0aWNzKHRvb2xVc2VDb25maXJtLnRvb2wubmFtZSksXG4gICAgICBpc01jcDogdG9vbFVzZUNvbmZpcm0udG9vbC5pc01jcCA/PyBmYWxzZSxcbiAgICB9KSxcbiAgICBbdG9vbFVzZUNvbmZpcm0udG9vbC5uYW1lLCB0b29sVXNlQ29uZmlybS50b29sLmlzTWNwXSxcbiAgKVxuXG4gIGNvbnN0IGhhbmRsZVNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgICh2YWx1ZTogU2tpbGxPcHRpb25WYWx1ZSwgZmVlZGJhY2s/OiBzdHJpbmcpID0+IHtcbiAgICAgIHN3aXRjaCAodmFsdWUpIHtcbiAgICAgICAgY2FzZSAneWVzJzpcbiAgICAgICAgICB2b2lkIGxvZ1VuYXJ5RXZlbnQoe1xuICAgICAgICAgICAgY29tcGxldGlvbl90eXBlOiAndG9vbF91c2Vfc2luZ2xlJyxcbiAgICAgICAgICAgIGV2ZW50OiAnYWNjZXB0JyxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgIGxhbmd1YWdlX25hbWU6ICdub25lJyxcbiAgICAgICAgICAgICAgbWVzc2FnZV9pZDogdG9vbFVzZUNvbmZpcm0uYXNzaXN0YW50TWVzc2FnZS5tZXNzYWdlLmlkLFxuICAgICAgICAgICAgICBwbGF0Zm9ybTogZW52LnBsYXRmb3JtLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIHRvb2xVc2VDb25maXJtLm9uQWxsb3codG9vbFVzZUNvbmZpcm0uaW5wdXQsIFtdLCBmZWVkYmFjaylcbiAgICAgICAgICBvbkRvbmUoKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3llcy1leGFjdCc6IHtcbiAgICAgICAgICB2b2lkIGxvZ1VuYXJ5RXZlbnQoe1xuICAgICAgICAgICAgY29tcGxldGlvbl90eXBlOiAndG9vbF91c2Vfc2luZ2xlJyxcbiAgICAgICAgICAgIGV2ZW50OiAnYWNjZXB0JyxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgIGxhbmd1YWdlX25hbWU6ICdub25lJyxcbiAgICAgICAgICAgICAgbWVzc2FnZV9pZDogdG9vbFVzZUNvbmZpcm0uYXNzaXN0YW50TWVzc2FnZS5tZXNzYWdlLmlkLFxuICAgICAgICAgICAgICBwbGF0Zm9ybTogZW52LnBsYXRmb3JtLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgdG9vbFVzZUNvbmZpcm0ub25BbGxvdyh0b29sVXNlQ29uZmlybS5pbnB1dCwgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0eXBlOiAnYWRkUnVsZXMnLFxuICAgICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHRvb2xOYW1lOiBTS0lMTF9UT09MX05BTUUsXG4gICAgICAgICAgICAgICAgICBydWxlQ29udGVudDogc2tpbGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgYmVoYXZpb3I6ICdhbGxvdycsXG4gICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiAnbG9jYWxTZXR0aW5ncycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pXG4gICAgICAgICAgb25Eb25lKClcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ3llcy1wcmVmaXgnOiB7XG4gICAgICAgICAgdm9pZCBsb2dVbmFyeUV2ZW50KHtcbiAgICAgICAgICAgIGNvbXBsZXRpb25fdHlwZTogJ3Rvb2xfdXNlX3NpbmdsZScsXG4gICAgICAgICAgICBldmVudDogJ2FjY2VwdCcsXG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICBsYW5ndWFnZV9uYW1lOiAnbm9uZScsXG4gICAgICAgICAgICAgIG1lc3NhZ2VfaWQ6IHRvb2xVc2VDb25maXJtLmFzc2lzdGFudE1lc3NhZ2UubWVzc2FnZS5pZCxcbiAgICAgICAgICAgICAgcGxhdGZvcm06IGVudi5wbGF0Zm9ybSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC8vIEV4dHJhY3QgdGhlIHNraWxsIHByZWZpeCAoZXZlcnl0aGluZyBiZWZvcmUgdGhlIGZpcnN0IHNwYWNlKVxuICAgICAgICAgIGNvbnN0IHNwYWNlSW5kZXggPSBza2lsbC5pbmRleE9mKCcgJylcbiAgICAgICAgICBjb25zdCBjb21tYW5kUHJlZml4ID1cbiAgICAgICAgICAgIHNwYWNlSW5kZXggPiAwID8gc2tpbGwuc3Vic3RyaW5nKDAsIHNwYWNlSW5kZXgpIDogc2tpbGxcblxuICAgICAgICAgIHRvb2xVc2VDb25maXJtLm9uQWxsb3codG9vbFVzZUNvbmZpcm0uaW5wdXQsIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogJ2FkZFJ1bGVzJyxcbiAgICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICB0b29sTmFtZTogU0tJTExfVE9PTF9OQU1FLFxuICAgICAgICAgICAgICAgICAgcnVsZUNvbnRlbnQ6IGAke2NvbW1hbmRQcmVmaXh9OipgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIGJlaGF2aW9yOiAnYWxsb3cnLFxuICAgICAgICAgICAgICBkZXN0aW5hdGlvbjogJ2xvY2FsU2V0dGluZ3MnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdKVxuICAgICAgICAgIG9uRG9uZSgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgICBjYXNlICdubyc6XG4gICAgICAgICAgdm9pZCBsb2dVbmFyeUV2ZW50KHtcbiAgICAgICAgICAgIGNvbXBsZXRpb25fdHlwZTogJ3Rvb2xfdXNlX3NpbmdsZScsXG4gICAgICAgICAgICBldmVudDogJ3JlamVjdCcsXG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICBsYW5ndWFnZV9uYW1lOiAnbm9uZScsXG4gICAgICAgICAgICAgIG1lc3NhZ2VfaWQ6IHRvb2xVc2VDb25maXJtLmFzc2lzdGFudE1lc3NhZ2UubWVzc2FnZS5pZCxcbiAgICAgICAgICAgICAgcGxhdGZvcm06IGVudi5wbGF0Zm9ybSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgICB0b29sVXNlQ29uZmlybS5vblJlamVjdChmZWVkYmFjaylcbiAgICAgICAgICBvblJlamVjdCgpXG4gICAgICAgICAgb25Eb25lKClcbiAgICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH0sXG4gICAgW3Rvb2xVc2VDb25maXJtLCBvbkRvbmUsIG9uUmVqZWN0LCBza2lsbF0sXG4gIClcblxuICBjb25zdCBoYW5kbGVDYW5jZWwgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgdm9pZCBsb2dVbmFyeUV2ZW50KHtcbiAgICAgIGNvbXBsZXRpb25fdHlwZTogJ3Rvb2xfdXNlX3NpbmdsZScsXG4gICAgICBldmVudDogJ3JlamVjdCcsXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBsYW5ndWFnZV9uYW1lOiAnbm9uZScsXG4gICAgICAgIG1lc3NhZ2VfaWQ6IHRvb2xVc2VDb25maXJtLmFzc2lzdGFudE1lc3NhZ2UubWVzc2FnZS5pZCxcbiAgICAgICAgcGxhdGZvcm06IGVudi5wbGF0Zm9ybSxcbiAgICAgIH0sXG4gICAgfSlcbiAgICB0b29sVXNlQ29uZmlybS5vblJlamVjdCgpXG4gICAgb25SZWplY3QoKVxuICAgIG9uRG9uZSgpXG4gIH0sIFt0b29sVXNlQ29uZmlybSwgb25Eb25lLCBvblJlamVjdF0pXG5cbiAgcmV0dXJuIChcbiAgICA8UGVybWlzc2lvbkRpYWxvZyB0aXRsZT17YFVzZSBza2lsbCBcIiR7c2tpbGx9XCI/YH0gd29ya2VyQmFkZ2U9e3dvcmtlckJhZGdlfT5cbiAgICAgIDxUZXh0PkNsYXVkZSBtYXkgdXNlIGluc3RydWN0aW9ucywgY29kZSwgb3IgZmlsZXMgZnJvbSB0aGlzIFNraWxsLjwvVGV4dD5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdYPXsyfSBwYWRkaW5nWT17MX0+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPntjb21tYW5kT2JqPy5kZXNjcmlwdGlvbn08L1RleHQ+XG4gICAgICA8L0JveD5cblxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIDxQZXJtaXNzaW9uUnVsZUV4cGxhbmF0aW9uXG4gICAgICAgICAgcGVybWlzc2lvblJlc3VsdD17dG9vbFVzZUNvbmZpcm0ucGVybWlzc2lvblJlc3VsdH1cbiAgICAgICAgICB0b29sVHlwZT1cInRvb2xcIlxuICAgICAgICAvPlxuICAgICAgICA8UGVybWlzc2lvblByb21wdFxuICAgICAgICAgIG9wdGlvbnM9e29wdGlvbnN9XG4gICAgICAgICAgb25TZWxlY3Q9e2hhbmRsZVNlbGVjdH1cbiAgICAgICAgICBvbkNhbmNlbD17aGFuZGxlQ2FuY2VsfVxuICAgICAgICAgIHRvb2xBbmFseXRpY3NDb250ZXh0PXt0b29sQW5hbHl0aWNzQ29udGV4dH1cbiAgICAgICAgLz5cbiAgICAgIDwvQm94PlxuICAgIDwvUGVybWlzc2lvbkRpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxXQUFXLEVBQUVDLE9BQU8sUUFBUSxPQUFPO0FBQ25ELFNBQVNDLFFBQVEsUUFBUSxrQkFBa0I7QUFDM0MsU0FBU0MsY0FBYyxRQUFRLDZCQUE2QjtBQUM1RCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxpQkFBaUI7QUFDM0MsU0FBU0MsNEJBQTRCLFFBQVEseUNBQXlDO0FBQ3RGLFNBQVNDLGVBQWUsUUFBUSx1Q0FBdUM7QUFDdkUsU0FBU0MsU0FBUyxRQUFRLHVDQUF1QztBQUNqRSxTQUFTQyxHQUFHLFFBQVEsdUJBQXVCO0FBQzNDLFNBQVNDLDRCQUE0QixRQUFRLGlEQUFpRDtB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