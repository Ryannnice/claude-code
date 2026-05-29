// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useMemo } from 'react';
// 引入 Box、Text、useTheme，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useTheme } from '../../../ink.js';
// 接入 WebFetchTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WebFetchTool } from '../../../tools/WebFetchTool/WebFetchTool.js';
// 复用 shouldShowAlwaysAllowOptions 工具函数，把通用处理留在 ../../../utils/permissions/permissionsLoader.js 中维护。
import { shouldShowAlwaysAllowOptions } from '../../../utils/permissions/permissionsLoader.js';
// 引入 OptionWithDescription、Select，将 ../../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { type OptionWithDescription, Select } from '../../CustomSelect/select.js';
// 引入 UnaryEvent、usePermissionRequestLogging，将 ../hooks.js 中已经封装好的能力接到本文件流程里。
import { type UnaryEvent, usePermissionRequestLogging } from '../hooks.js';
// 引入 PermissionDialog，将 ../PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from '../PermissionDialog.js';
// 类型依赖 { PermissionRequestProps } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { PermissionRequestProps } from '../PermissionRequest.js';
// 引入 PermissionRuleExplanation，将 ../PermissionRuleExplanation.js 中已经封装好的能力接到本文件流程里。
import { PermissionRuleExplanation } from '../PermissionRuleExplanation.js';
// 引入 logUnaryPermissionEvent，将 ../utils.js 中已经封装好的能力接到本文件流程里。
import { logUnaryPermissionEvent } from '../utils.js';
// inputToPermissionRuleContent 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function inputToPermissionRuleContent(input: {
  [k: string]: unknown;
}): string {
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // parsedInput保存`inputSchema.safeParse`，供终端渲染后续处理使用。
    const parsedInput = WebFetchTool.inputSchema.safeParse(input);
    // parsedInput.success 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!parsedInput.success) {
      // 返回 ``input:${input.toString()}``，作为终端渲染这次计算的结果。
      return `input:${input.toString()}`;
    }
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      url
    } = parsedInput.data;
    // hostname保存`URL`，供终端渲染后续处理使用。
    const hostname = new URL(url).hostname;
    // 返回 ``domain:${hostname}``，作为终端渲染这次计算的结果。
    return `domain:${hostname}`;
  } catch {
    // 返回 ``input:${input.toString()}``，作为终端渲染这次计算的结果。
    return `input:${input.toString()}`;
  }
}
// WebFetchPermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function WebFetchPermissionRequest(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(41);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    toolUseConfirm,
    onDone,
    onReject,
    verbose,
    workerBadge
  } = t0;
  // 从 `useTheme()` 按位置拆出 theme，让权限确认界面 Web Fetch Permission Request分别处理这些返回值。
  const [theme] = useTheme();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    url
  } = toolUseConfirm.input as {
    url: string;
  };
  // t1 暂存 `new URL(url)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== url) {
    // t1 暂存 `new URL(url)` 生成的渲染片段，后续返回路径直接复用。
    t1 = new URL(url);
    // $[0] 缓存 `url`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = url;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // hostname保存`t1.hostname`，供终端渲染权限确认界面 Web Fetch Permission R...后续判断或输出使用。
  const hostname = t1.hostname;
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      completion_type: "tool_use_single",
      language_name: "none"
    };
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // unaryEvent保存`t2`，作为后续临时缓存值处理的输入。
  const unaryEvent = t2;
  // 调用 usePermissionRequestLogging，触发终端渲染此处需要的副作用。
  usePermissionRequestLogging(toolUseConfirm, unaryEvent);
  // t3 暂存 `shouldShowAlwaysAllowOptions()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `shouldShowAlwaysAllowOptions()` 生成的渲染片段，后续返回路径直接复用。
    t3 = shouldShowAlwaysAllowOptions();
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // showAlwaysAllowOptions 集合沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const showAlwaysAllowOptions = t3;
  // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t4 = {
      label: "Yes",
      value: "yes"
    };
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let result;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== hostname) {
    // 结果更新为 `[t4]`，确保权限确认界面后续读取最新状态。
    result = [t4];
    // 满足 `showAlwaysAllowOptions` 时，终端渲染执行该分支。
    if (showAlwaysAllowOptions) {
      // 临时值 t5 命名 `<Text bold={true}>{hostname}</Text>`，让后续代码直接表达这个值的用途。
      const t5 = <Text bold={true}>{hostname}</Text>;
      // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t6;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[7] !== t5) {
        // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t6 = {
          label: <Text>Yes, and don't ask again for {t5}</Text>,
          value: "yes-dont-ask-again-domain"
        };
        // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
        $[7] = t5;
        // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
        $[8] = t6;
      } else {
        // t6从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
        t6 = $[8];
      }
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(t6);
    }
    // t5暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // 判断 $[9] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      // t5暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t5 = {
        label: <Text>No, and tell Claude what to do differently <Text bold={true}>(esc)</Text></Text>,
        value: "no"
      };
      // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t5;
    } else {
      // t5从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[9];
    }
    // 结果追加新条目，保持收集顺序与输入顺序一致。
    result.push(t5);
    // $[5] 缓存 `hostname`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = hostname;
    // $[6] 缓存 `result`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = result;
  } else {
    // 结果更新为 `$[6]`，确保终端 UI后续读取最新状态。
    result = $[6];
  }
  // options 集合保存`result`，供终端渲染权限确认界面 Web Fetch Permission...后续步骤使用。
  const options = result;
  // t5暂存 `function onChange(newValue) {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== onDone || $[11] !== onReject || $[12] !== toolUseConfirm) {
    // t5暂存 `function onChange(newValue) {` 生成的渲染片段，后续返回路径直接复用。
    t5 = function onChange(newValue) {
      // 权限确认界面 Web Fetch Permission Reque...处理 `bb8: switch (newValue) {`，完成这一小步状态转换。
      bb8: switch (newValue) {
        case "yes":
          {
            // logUnaryPermissionEvent执行终端渲染在此处需要的副作用或外部交互。
            logUnaryPermissionEvent("tool_use_single", toolUseConfirm, "accept");
            // toolUseConfirm.onAllow执行终端渲染在此处需要的副作用或外部交互。
            toolUseConfirm.onAllow(toolUseConfirm.input, []);
            // onDone执行终端渲染在此处需要的副作用或外部交互。
            onDone();
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb8;
          }
        case "yes-dont-ask-again-domain":
          {
            // logUnaryPermissionEvent执行终端渲染在此处需要的副作用或外部交互。
            logUnaryPermissionEvent("tool_use_single", toolUseConfirm, "accept");
            // ruleContent保存`inputToPermissionRuleContent`，供终端渲染后续处理使用。
            const ruleContent = inputToPermissionRuleContent(toolUseConfirm.input);
            // ruleValue集中保存终端渲染权限确认界面 Web Fetch Permission...要一起传递的字段。
            const ruleValue = {
              toolName: toolUseConfirm.tool.name,
              ruleContent
            };
            // toolUseConfirm.onAllow执行终端渲染在此处需要的副作用或外部交互。
            toolUseConfirm.onAllow(toolUseConfirm.input, [{
              type: "addRules",
              rules: [ruleValue],
              behavior: "allow",
              destination: "localSettings"
            }]);
            // onDone执行终端渲染在此处需要的副作用或外部交互。
            onDone();
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb8;
          }
        case "no":
          {
            // logUnaryPermissionEvent执行终端渲染在此处需要的副作用或外部交互。
            logUnaryPermissionEvent("tool_use_single", toolUseConfirm, "reject");
            // toolUseConfirm.onReject执行终端渲染在此处需要的副作用或外部交互。
            toolUseConfirm.onReject();
            // onReject执行终端渲染在此处需要的副作用或外部交互。
            onReject();
            // onDone执行终端渲染在此处需要的副作用或外部交互。
            onDone();
          }
      }
    };
    // $[10] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onDone;
    // $[11] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onReject;
    // $[12] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = toolUseConfirm;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
  } else {
    // t5从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[13];
  }
  // onChange保存`t5`，供终端渲染权限确认界面 Web Fetch Permission...后续步骤使用。
  const onChange = t5;
  // t6暂存 `WebFetchTool.renderToolUseMessage(toolUseConfirm.input as...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== theme || $[15] !== toolUseConfirm.input || $[16] !== verbose) {
    // t6暂存 `WebFetchTool.renderToolUseMessage(toolUseConfirm.input as...` 生成的渲染片段，后续返回路径直接复用。
    t6 = WebFetchTool.renderToolUseMessage(toolUseConfirm.input as {
      url: string;
      prompt: string;
    }, {
      theme,
      verbose
    });
    // $[14] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = theme;
    // $[15] 缓存 `toolUseConfirm.input`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = toolUseConfirm.input;
    // $[16] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = verbose;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
  } else {
    // t6从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[17];
  }
  // t7暂存 `<Text>{t6}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== t6) {
    // t7暂存 `<Text>{t6}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text>{t6}</Text>;
    // $[18] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t6;
    // $[19] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t7;
  } else {
    // t7从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[19];
  }
  // t8暂存 `<Text dimColor={true}>{toolUseConfirm.description}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== toolUseConfirm.description) {
    // t8暂存 `<Text dimColor={true}>{toolUseConfirm.description}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text dimColor={true}>{toolUseConfirm.description}</Text>;
    // $[20] 缓存 `toolUseConfirm.description`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = toolUseConfirm.description;
    // $[21] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t8;
  } else {
    // t8从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[21];
  }
  // t9暂存 `<Box flexDirection="column" paddingX={2} paddingY={1}>{t7...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== t7 || $[23] !== t8) {
    // t9暂存 `<Box flexDirection="column" paddingX={2} paddingY={1}>{t7...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column" paddingX={2} paddingY={1}>{t7}{t8}</Box>;
    // $[22] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t7;
    // $[23] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t8;
    // $[24] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t9;
  } else {
    // t9从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[24];
  }
  // t10暂存 `<PermissionRuleExplanation permissionResult={toolUseConfi...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== toolUseConfirm.permissionResult) {
    // t10暂存 `<PermissionRuleExplanation permissionResult={toolUseConfi...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <PermissionRuleExplanation permissionResult={toolUseConfirm.permissionResult} toolType="tool" />;
    // $[25] 缓存 `toolUseConfirm.permissionResult`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = toolUseConfirm.permissionResult;
    // $[26] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t10;
  } else {
    // t10从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[26];
  }
  // t11暂存 `<Text>Do you want to allow Claude to fetch this content?<...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // 判断 $[27] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    // t11暂存 `<Text>Do you want to allow Claude to fetch this content?<...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text>Do you want to allow Claude to fetch this content?</Text>;
    // $[27] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t11;
  } else {
    // t11从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[27];
  }
  // t12暂存 `() => onChange("no")` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== onChange) {
    // t12暂存 `() => onChange("no")` 生成的渲染片段，后续返回路径直接复用。
    t12 = () => onChange("no");
    // $[28] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = onChange;
    // $[29] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t12;
  } else {
    // t12从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[29];
  }
  // t13暂存 `<Select options={options} onChange={onChange} onCancel={t...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== onChange || $[31] !== options || $[32] !== t12) {
    // t13暂存 `<Select options={options} onChange={onChange} onCancel={t...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Select options={options} onChange={onChange} onCancel={t12} />;
    // $[30] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = onChange;
    // $[31] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = options;
    // $[32] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t12;
    // $[33] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t13;
  } else {
    // t13从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[33];
  }
  // t14暂存 `<Box flexDirection="column">{t10}{t11}{t13}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== t10 || $[35] !== t13) {
    // t14暂存 `<Box flexDirection="column">{t10}{t11}{t13}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Box flexDirection="column">{t10}{t11}{t13}</Box>;
    // $[34] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t10;
    // $[35] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t13;
    // $[36] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t14;
  } else {
    // t14从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[36];
  }
  // t15暂存 `<PermissionDialog title="Fetch" workerBadge={workerBadge}...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[37] !== t14 || $[38] !== t9 || $[39] !== workerBadge) {
    // t15暂存 `<PermissionDialog title="Fetch" workerBadge={workerBadge}...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <PermissionDialog title="Fetch" workerBadge={workerBadge}>{t9}{t14}</PermissionDialog>;
    // $[37] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t14;
    // $[38] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t9;
    // $[39] 缓存 `workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = workerBadge;
    // $[40] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t15;
  } else {
    // t15从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[40];
  }
  // 返回 t15，把终端渲染这个分支的结果交还调用方。
  return t15;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZU1lbW8iLCJCb3giLCJUZXh0IiwidXNlVGhlbWUiLCJXZWJGZXRjaFRvb2wiLCJzaG91bGRTaG93QWx3YXlzQWxsb3dPcHRpb25zIiwiT3B0aW9uV2l0aERlc2NyaXB0aW9uIiwiU2VsZWN0IiwiVW5hcnlFdmVudCIsInVzZVBlcm1pc3Npb25SZXF1ZXN0TG9nZ2luZyIsIlBlcm1pc3Npb25EaWFsb2ciLCJQZXJtaXNzaW9uUmVxdWVzdFByb3BzIiwiUGVybWlzc2lvblJ1bGVFeHBsYW5hdGlvbiIsImxvZ1VuYXJ5UGVybWlzc2lvbkV2ZW50IiwiaW5wdXRUb1Blcm1pc3Npb25SdWxlQ29udGVudCIsImlucHV0IiwiayIsInBhcnNlZElucHV0IiwiaW5wdXRTY2hlbWEiLCJzYWZlUGFyc2UiLCJzdWNjZXNzIiwidG9TdHJpbmciLCJ1cmwiLCJkYXRhIiwiaG9zdG5hbWUiLCJVUkwiLCJXZWJGZXRjaFBlcm1pc3Npb25SZXF1ZXN0IiwidDAiLCIkIiwiX2MiLCJ0b29sVXNlQ29uZmlybSIsIm9uRG9uZSIsIm9uUmVqZWN0IiwidmVyYm9zZSIsIndvcmtlckJhZGdlIiwidGhlbWUiLCJ0MSIsInQyIiwiU3ltYm9sIiwiZm9yIiwiY29tcGxldGlvbl90eXBlIiwibGFuZ3VhZ2VfbmFtZSIsInVuYXJ5RXZlbnQiLCJ0MyIsInNob3dBbHdheXNBbGxvd09wdGlvbnMiLCJ0NCIsImxhYmVsIiwidmFsdWUiLCJyZXN1bHQiLCJ0NSIsInQ2IiwicHVzaCIsIm9wdGlvbnMiLCJvbkNoYW5nZSIsIm5ld1ZhbHVlIiwiYmI4Iiwib25BbGxvdyIsInJ1bGVDb250ZW50IiwicnVsZVZhbHVlIiwidG9vbE5hbWUiLCJ0b29sIiwibmFtZSIsInR5cGUiLCJydWxlcyIsImJlaGF2aW9yIiwiZGVzdGluYXRpb24iLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsInByb21wdCIsInQ3IiwidDgiLCJkZXNjcmlwdGlvbiIsInQ5IiwidDEwIiwicGVybWlzc2lvblJlc3VsdCIsInQxMSIsInQxMiIsInQxMyIsInQxNCIsInQxNSJdLCJzb3VyY2VzIjpbIldlYkZldGNoUGVybWlzc2lvblJlcXVlc3QudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQsIHVzZVRoZW1lIH0gZnJvbSAnLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgV2ViRmV0Y2hUb29sIH0gZnJvbSAnLi4vLi4vLi4vdG9vbHMvV2ViRmV0Y2hUb29sL1dlYkZldGNoVG9vbC5qcydcbmltcG9ydCB7IHNob3VsZFNob3dBbHdheXNBbGxvd09wdGlvbnMgfSBmcm9tICcuLi8uLi8uLi91dGlscy9wZXJtaXNzaW9ucy9wZXJtaXNzaW9uc0xvYWRlci5qcydcbmltcG9ydCB7XG4gIHR5cGUgT3B0aW9uV2l0aERlc2NyaXB0aW9uLFxuICBTZWxlY3QsXG59IGZyb20gJy4uLy4uL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyB0eXBlIFVuYXJ5RXZlbnQsIHVzZVBlcm1pc3Npb25SZXF1ZXN0TG9nZ2luZyB9IGZyb20gJy4uL2hvb2tzLmpzJ1xuaW1wb3J0IHsgUGVybWlzc2lvbkRpYWxvZyB9IGZyb20gJy4uL1Blcm1pc3Npb25EaWFsb2cuanMnXG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMgfSBmcm9tICcuLi9QZXJtaXNzaW9uUmVxdWVzdC5qcydcbmltcG9ydCB7IFBlcm1pc3Npb25SdWxlRXhwbGFuYXRpb24gfSBmcm9tICcuLi9QZXJtaXNzaW9uUnVsZUV4cGxhbmF0aW9uLmpzJ1xuaW1wb3J0IHsgbG9nVW5hcnlQZXJtaXNzaW9uRXZlbnQgfSBmcm9tICcuLi91dGlscy5qcydcblxuZnVuY3Rpb24gaW5wdXRUb1Blcm1pc3Npb25SdWxlQ29udGVudChpbnB1dDogeyBbazogc3RyaW5nXTogdW5rbm93biB9KTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJzZWRJbnB1dCA9IFdlYkZldGNoVG9vbC5pbnB1dFNjaGVtYS5zYWZlUGFyc2UoaW5wdXQpXG4gICAgaWYgKCFwYXJzZWRJbnB1dC5zdWNjZXNzKSB7XG4gICAgICByZXR1cm4gYGlucHV0OiR7aW5wdXQudG9TdHJpbmcoKX1gXG4gICAgfVxuICAgIGNvbnN0IHsgdXJsIH0gPSBwYXJzZWRJbnB1dC5kYXRhXG4gICAgY29uc3QgaG9zdG5hbWUgPSBuZXcgVVJMKHVybCkuaG9zdG5hbWVcbiAgICByZXR1cm4gYGRvbWFpbjoke2hvc3RuYW1lfWBcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGBpbnB1dDoke2lucHV0LnRvU3RyaW5nKCl9YFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBXZWJGZXRjaFBlcm1pc3Npb25SZXF1ZXN0KHtcbiAgdG9vbFVzZUNvbmZpcm0sXG4gIG9uRG9uZSxcbiAgb25SZWplY3QsXG4gIHZlcmJvc2UsXG4gIHdvcmtlckJhZGdlLFxufTogUGVybWlzc2lvblJlcXVlc3RQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZV0gPSB1c2VUaGVtZSgpXG4gIC8vIHVybCBpcyBhbHJlYWR5IHZhbGlkYXRlZCBieSB0aGUgaW5wdXQgc2NoZW1hXG4gIGNvbnN0IHsgdXJsIH0gPSB0b29sVXNlQ29uZmlybS5pbnB1dCBhcyB7IHVybDogc3RyaW5nIH1cblxuICAvLyBFeHRyYWN0IGhvc3RuYW1lIGZyb20gVVJMXG4gIGNvbnN0IGhvc3RuYW1lID0gbmV3IFVSTCh1cmwpLmhvc3RuYW1lXG5cbiAgY29uc3QgdW5hcnlFdmVudCA9IHVzZU1lbW88VW5hcnlFdmVudD4oXG4gICAgKCkgPT4gKHsgY29tcGxldGlvbl90eXBlOiAndG9vbF91c2Vfc2luZ2xlJywgbGFuZ3VhZ2VfbmFtZTogJ25vbmUnIH0pLFxuICAgIFtdLFxuICApXG5cbiAgdXNlUGVybWlzc2lvblJlcXVlc3RMb2dnaW5nKHRvb2xVc2VDb25maXJtLCB1bmFyeUV2ZW50KVxuXG4gIC8vIEdlbmVyYXRlIHBlcm1pc3Npb24gb3B0aW9ucyBzcGVjaWZpYyB0byBkb21haW5zXG4gIGNvbnN0IHNob3dBbHdheXNBbGxvd09wdGlvbnMgPSBzaG91bGRTaG93QWx3YXlzQWxsb3dPcHRpb25zKClcbiAgY29uc3Qgb3B0aW9ucyA9IHVzZU1lbW8oKCk6IE9wdGlvbldpdGhEZXNjcmlwdGlvbjxzdHJpbmc+W10gPT4ge1xuICAgIGNvbnN0IHJlc3VsdDogT3B0aW9uV2l0aERlc2NyaXB0aW9uPHN0cmluZz5bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdZZXMnLFxuICAgICAgICB2YWx1ZTogJ3llcycsXG4gICAgICB9LFxuICAgIF1cblxuICAgIGlmIChzaG93QWx3YXlzQWxsb3dPcHRpb25zKSB7XG4gICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgIGxhYmVsOiAoXG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICBZZXMsIGFuZCBkb24mYXBvczt0IGFzayBhZ2FpbiBmb3IgPFRleHQgYm9sZD57aG9zdG5hbWV9PC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKSxcbiAgICAgICAgdmFsdWU6ICd5ZXMtZG9udC1hc2stYWdhaW4tZG9tYWluJyxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmVzdWx0LnB1c2goe1xuICAgICAgbGFiZWw6IChcbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgTm8sIGFuZCB0ZWxsIENsYXVkZSB3aGF0IHRvIGRvIGRpZmZlcmVudGx5IDxUZXh0IGJvbGQ+KGVzYyk8L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICksXG4gICAgICB2YWx1ZTogJ25vJyxcbiAgICB9KVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LCBbaG9zdG5hbWUsIHNob3dBbHdheXNBbGxvd09wdGlvbnNdKVxuXG4gIGZ1bmN0aW9uIG9uQ2hhbmdlKG5ld1ZhbHVlOiBzdHJpbmcpIHtcbiAgICBzd2l0Y2ggKG5ld1ZhbHVlKSB7XG4gICAgICBjYXNlICd5ZXMnOlxuICAgICAgICBsb2dVbmFyeVBlcm1pc3Npb25FdmVudCgndG9vbF91c2Vfc2luZ2xlJywgdG9vbFVzZUNvbmZpcm0sICdhY2NlcHQnKVxuICAgICAgICB0b29sVXNlQ29uZmlybS5vbkFsbG93KHRvb2xVc2VDb25maXJtLmlucHV0LCBbXSlcbiAgICAgICAgb25Eb25lKClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3llcy1kb250LWFzay1hZ2Fpbi1kb21haW4nOiB7XG4gICAgICAgIGxvZ1VuYXJ5UGVybWlzc2lvbkV2ZW50KCd0b29sX3VzZV9zaW5nbGUnLCB0b29sVXNlQ29uZmlybSwgJ2FjY2VwdCcpXG4gICAgICAgIGNvbnN0IHJ1bGVDb250ZW50ID0gaW5wdXRUb1Blcm1pc3Npb25SdWxlQ29udGVudCh0b29sVXNlQ29uZmlybS5pbnB1dClcbiAgICAgICAgY29uc3QgcnVsZVZhbHVlID0ge1xuICAgICAgICAgIHRvb2xOYW1lOiB0b29sVXNlQ29uZmlybS50b29sLm5hbWUsXG4gICAgICAgICAgcnVsZUNvbnRlbnQsXG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYXNzIHBlcm1pc3Npb24gdXBkYXRlIGRpcmVjdGx5IHRvIG9uQWxsb3dcbiAgICAgICAgdG9vbFVzZUNvbmZpcm0ub25BbGxvdyh0b29sVXNlQ29uZmlybS5pbnB1dCwgW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICdhZGRSdWxlcycsXG4gICAgICAgICAgICBydWxlczogW3J1bGVWYWx1ZV0sXG4gICAgICAgICAgICBiZWhhdmlvcjogJ2FsbG93JyxcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uOiAnbG9jYWxTZXR0aW5ncycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSlcbiAgICAgICAgb25Eb25lKClcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIGNhc2UgJ25vJzpcbiAgICAgICAgbG9nVW5hcnlQZXJtaXNzaW9uRXZlbnQoJ3Rvb2xfdXNlX3NpbmdsZScsIHRvb2xVc2VDb25maXJtLCAncmVqZWN0JylcbiAgICAgICAgdG9vbFVzZUNvbmZpcm0ub25SZWplY3QoKVxuICAgICAgICBvblJlamVjdCgpXG4gICAgICAgIG9uRG9uZSgpXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8UGVybWlzc2lvbkRpYWxvZyB0aXRsZT1cIkZldGNoXCIgd29ya2VyQmFkZ2U9e3dvcmtlckJhZGdlfT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdYPXsyfSBwYWRkaW5nWT17MX0+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHtXZWJGZXRjaFRvb2wucmVuZGVyVG9vbFVzZU1lc3NhZ2UoXG4gICAgICAgICAgICB0b29sVXNlQ29uZmlybS5pbnB1dCBhcyB7IHVybDogc3RyaW5nOyBwcm9tcHQ6IHN0cmluZyB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0aGVtZSxcbiAgICAgICAgICAgICAgdmVyYm9zZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj57dG9vbFVzZUNvbmZpcm0uZGVzY3JpcHRpb259PC9UZXh0PlxuICAgICAgPC9Cb3g+XG5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8UGVybWlzc2lvblJ1bGVFeHBsYW5hdGlvblxuICAgICAgICAgIHBlcm1pc3Npb25SZXN1bHQ9e3Rvb2xVc2VDb25maXJtLnBlcm1pc3Npb25SZXN1bHR9XG4gICAgICAgICAgdG9vbFR5cGU9XCJ0b29sXCJcbiAgICAgICAgLz5cbiAgICAgICAgPFRleHQ+RG8geW91IHdhbnQgdG8gYWxsb3cgQ2xhdWRlIHRvIGZldGNoIHRoaXMgY29udGVudD88L1RleHQ+XG4gICAgICAgIDxTZWxlY3RcbiAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgIG9uQ2hhbmdlPXtvbkNoYW5nZX1cbiAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gb25DaGFuZ2UoJ25vJyl9XG4gICAgICAgIC8+XG4gICAgICA8L0JveD5cbiAgICA8L1Blcm1pc3Npb25EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSUMsT0FBTyxRQUFRLE9BQU87QUFDdEMsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLEVBQUVDLFFBQVEsUUFBUSxpQkFBaUI7QUFDckQsU0FBU0MsWUFBWSxRQUFRLDZDQUE2QztBQUMxRSxTQUFTQyw0QkFBNEIsUUFBUSxpREFBaUQ7QUFDOUYsU0FDRSxLQUFLQyxxQkFBcUIsRUFDMUJDLE1BQU0sUUFDRCw4QkFBOEI7QUFDckMsU0FBUyxLQUFLQyxVQUFVLEVBQUVDLDJCQUEyQixRQUFRLGFBQWE7QUFDMUUsU0FBU0MsZ0JBQWdCLFFBQVEsd0JBQXdCO0FBQ3pELGNBQWNDLHNCQUFzQixRQUFRLHlCQUF5QjtBQUNyRSxTQUFTQyx5QkFBeUIsUUFBUSxpQ0FBaUM7QUFDM0UsU0FBU0MsdUJBQXVCLFFBQVEsYUFBYTtBQUVyRCxTQUFTQyw0QkFBNEJBLENBQUNDLEtBQUssRUFBRTtFQUFFLENBQUNDLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxPQUFPO0FBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDO0VBQzdFLElBQUk7SUFDRixNQUFNQyxXQUFXLEdBQUdiLFlBQVksQ0FBQ2MsV0FBVyxDQUFDQyxTQUFTLENBQUNKLEtBQUssQ0FBQztJQUM3RCxJQUFJLENBQUNFLFdBQVcsQ0FBQ0csT0FBTyxFQUFFO01BQ3hCLE9BQU8sU0FBU0wsS0FBSyxDQUFDTSxRQUFRLENBQUMsQ0FBQyxFQUFFO0lBQ3BDO0lBQ0EsTUFBTTtNQUFFQztJQUFJLENBQUMsR0FBR0wsV0FBVyxDQUFDTSxJQUFJO0lBQ2hDLE1BQU1DLFFBQVEsR0FBRyxJQUFJQyxHQUFHLENBQUNILEdBQUcsQ0FBQyxDQUFDRSxRQUFRO0lBQ3RDLE9BQU8sVUFBVUEsUUFBUSxFQUFFO0VBQzdCLENB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