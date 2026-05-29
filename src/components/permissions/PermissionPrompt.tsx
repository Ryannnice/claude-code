// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode、useCallback、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode, useCallback, useMemo, useState } from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { KeybindingAction } 来自 ../../keybindings/types.js，用于校准终端渲染的数据契约。
import type { KeybindingAction } from '../../keybindings/types.js';
// 引入 useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../keybindings/useKeybinding.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from '../../services/analytics/index.js';
// 引入 useSetAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useSetAppState } from '../../state/AppState.js';
// 引入 OptionWithDescription、Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { type OptionWithDescription, Select } from '../CustomSelect/select.js';
// FeedbackType 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type FeedbackType = 'accept' | 'reject';
export type PermissionPromptOption<T extends string> = {
  value: T;
  label: ReactNode;
  feedbackConfig?: {
    type: FeedbackType;
    placeholder?: string;
  };
  keybinding?: KeybindingAction;
};
// ToolAnalyticsContext 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolAnalyticsContext = {
  toolName: string;
  isMcp: boolean;
};
export type PermissionPromptProps<T extends string> = {
  options: PermissionPromptOption<T>[];
  // 这个回调绑定到 onSelect: (value: T, feedback?: string) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (value: T, feedback?: string) => void;
  onCancel?: () => void;
  question?: string | ReactNode;
  toolAnalyticsContext?: ToolAnalyticsContext;
};
// DEFAULT_PLACEHOLDERS 集合 集中保存权限确认界面 Permission Prompt要一起传递的字段。
const DEFAULT_PLACEHOLDERS: Record<FeedbackType, string> = {
  accept: 'tell Claude what to do next',
  reject: 'tell Claude what to do differently'
};

/**
 * Shared component for permission prompts with optional feedback input.
 *
 * Handles:
 * - "Do you want to proceed?" question with optional Tab hint
 * - Feature flag check for feedback capability
 * - Input mode toggling (Tab to expand feedback input)
 * - Analytics events for feedback interactions
 * - Transforming options to Select-compatible format
 */
// PermissionPrompt 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionPrompt(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(54);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    options,
    onSelect,
    onCancel,
    question: t1,
    toolAnalyticsContext
  } = t0;
  // question标记终端渲染权限确认界面 Permission Prompt是否启用对应路径。
  const question = t1 === undefined ? "Do you want to proceed?" : t1;
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState();
  // acceptFeedback 由 React state 持有，setAcceptFeedback 会在用户操作或异步结果返回时触发刷新。
  const [acceptFeedback, setAcceptFeedback] = useState("");
  // rejectFeedback 由 React state 持有，setRejectFeedback 会在用户操作或异步结果返回时触发刷新。
  const [rejectFeedback, setRejectFeedback] = useState("");
  // acceptInputMode 由 React state 持有，setAcceptInputMode 会在用户操作或异步结果返回时触发刷新。
  const [acceptInputMode, setAcceptInputMode] = useState(false);
  // rejectInputMode 由 React state 持有，setRejectInputMode 会在用户操作或异步结果返回时触发刷新。
  const [rejectInputMode, setRejectInputMode] = useState(false);
  // focusedValue 由 React state 持有，setFocusedValue 会在用户操作或异步结果返回时触发刷新。
  const [focusedValue, setFocusedValue] = useState(null);
  // acceptFeedbackModeEntered 由 React state 持有，setAcceptFeedbackModeEntered 会在用户操作或异步结果返回时触发刷新。
  const [acceptFeedbackModeEntered, setAcceptFeedbackModeEntered] = useState(false);
  // rejectFeedbackModeEntered 由 React state 持有，setRejectFeedbackModeEntered 会在用户操作或异步结果返回时触发刷新。
  const [rejectFeedbackModeEntered, setRejectFeedbackModeEntered] = useState(false);
  // t2 暂存 `options.find(t3)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== focusedValue || $[1] !== options) {
    // t3 暂存 `opt => opt.value === focusedValue` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== focusedValue) {
      // t3 暂存 `opt => opt.value === focusedValue` 生成的渲染片段，后续返回路径直接复用。
      t3 = opt => opt.value === focusedValue;
      // $[3] 缓存 `focusedValue`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = focusedValue;
      // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[4];
    }
    // t2 暂存 `options.find(t3)` 生成的渲染片段，后续返回路径直接复用。
    t2 = options.find(t3);
    // $[0] 缓存 `focusedValue`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = focusedValue;
    // $[1] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = options;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // focusedOption 命名 `t2`，让后续代码直接表达这个值的用途。
  const focusedOption = t2;
  // focusedFeedbackType 命名 `focusedOption?.feedbackConfig?.type`，让后续代码直接表达这个值的用途。
  const focusedFeedbackType = focusedOption?.feedbackConfig?.type;
  // showTabHint标记终端渲染权限确认界面 Permission Prompt是否启用对应路径。
  const showTabHint = focusedFeedbackType === "accept" && !acceptInputMode || focusedFeedbackType === "reject" && !rejectInputMode;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== acceptInputMode || $[6] !== options || $[7] !== rejectInputMode) {
    // t4 暂存 `opt_0 => {` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[9] !== acceptInputMode || $[10] !== rejectInputMode) {
      // t4 暂存 `opt_0 => {` 生成的渲染片段，后续返回路径直接复用。
      t4 = opt_0 => {
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          value,
          label,
          feedbackConfig
        } = opt_0;
        // feedbackConfig 配置缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!feedbackConfig) {
          // 返回结构化结果，集中表达终端渲染已经整理出的状态。
          return {
            label,
            value
          };
        }
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          type,
          placeholder
        } = feedbackConfig;
        // isInputMode标记终端渲染权限确认界面 Permission Prompt是否启用对应路径。
        const isInputMode = type === "accept" ? acceptInputMode : rejectInputMode;
        // onChange标记终端渲染权限确认界面 Permission Prompt是否启用对应路径。
        const onChange = type === "accept" ? setAcceptFeedback : setRejectFeedback;
        // defaultPlaceholder读取 `DEFAULT_PLACEHOLDERS[type]` 对应条目，后续围绕该成员继续处理。
        const defaultPlaceholder = DEFAULT_PLACEHOLDERS[type];
        // 满足 `isInputMode` 时，终端渲染执行该分支。
        if (isInputMode) {
          // 返回结构化结果，集中表达终端渲染已经整理出的状态。
          return {
            type: "input" as const,
            label,
            value,
            placeholder: placeholder ?? defaultPlaceholder,
            onChange,
            allowEmptySubmitToCancel: true
          };
        }
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          label,
          value
        };
      };
      // $[9] 缓存 `acceptInputMode`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = acceptInputMode;
      // $[10] 缓存 `rejectInputMode`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = rejectInputMode;
      // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[11];
    }
    // t3 暂存 `options.map(t4)` 生成的渲染片段，后续返回路径直接复用。
    t3 = options.map(t4);
    // $[5] 缓存 `acceptInputMode`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = acceptInputMode;
    // $[6] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = options;
    // $[7] 缓存 `rejectInputMode`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = rejectInputMode;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // selectOptions 集合沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const selectOptions = t3;
  // t4 暂存 `value_0 => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== acceptInputMode || $[13] !== options || $[14] !== rejectInputMode || $[15] !== toolAnalyticsContext?.isMcp || $[16] !== toolAnalyticsContext?.toolName) {
    // t4 暂存 `value_0 => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = value_0 => {
      // option筛选`options.find`，供终端渲染后续处理使用。
      const option = options.find(opt_1 => opt_1.value === value_0);
      // 满足 `!option?.feedbackConfig` 时，终端渲染执行该分支。
      if (!option?.feedbackConfig) {
        // 权限确认界面 Permission Prompt在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        type: type_0
      } = option.feedbackConfig;
      // analyticsProps 集合 集中保存终端渲染权限确认界面 Permission Prompt要一起传递的字段。
      const analyticsProps = {
        toolName: toolAnalyticsContext?.toolName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        isMcp: toolAnalyticsContext?.isMcp ?? false
      };
      // 当 `type_0` 匹配 `"accept"` 时，终端渲染执行对应分支。
      if (type_0 === "accept") {
        // 满足 `acceptInputMode` 时，终端渲染执行该分支。
        if (acceptInputMode) {
          // setAcceptInputMode 写入新的状态值，使终端渲染后续读取保持一致。
          setAcceptInputMode(false);
          // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
          logEvent("tengu_accept_feedback_mode_collapsed", analyticsProps);
        } else {
          // setAcceptInputMode 写入新的状态值，使终端渲染后续读取保持一致。
          setAcceptInputMode(true);
          // setAcceptFeedbackModeEntered 写入新的状态值，使终端渲染后续读取保持一致。
          setAcceptFeedbackModeEntered(true);
          // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
          logEvent("tengu_accept_feedback_mode_entered", analyticsProps);
        }
      } else {
        // 当 `type_0` 匹配 `"reject"` 时，终端渲染执行对应分支。
        if (type_0 === "reject") {
          // 满足 `rejectInputMode` 时，终端渲染执行该分支。
          if (rejectInputMode) {
            // setRejectInputMode 写入新的状态值，使终端渲染后续读取保持一致。
            setRejectInputMode(false);
            // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
            logEvent("tengu_reject_feedback_mode_collapsed", analyticsProps);
          } else {
            // setRejectInputMode 写入新的状态值，使终端渲染后续读取保持一致。
            setRejectInputMode(true);
            // setRejectFeedbackModeEntered 写入新的状态值，使终端渲染后续读取保持一致。
            setRejectFeedbackModeEntered(true);
            // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
            logEvent("tengu_reject_feedback_mode_entered", analyticsProps);
          }
        }
      }
    };
    // $[12] 缓存 `acceptInputMode`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = acceptInputMode;
    // $[13] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = options;
    // $[14] 缓存 `rejectInputMode`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = rejectInputMode;
    // $[15] 缓存 `toolAnalyticsContext?.isMcp`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = toolAnalyticsContext?.isMcp;
    // $[16] 缓存 `toolAnalyticsContext?.toolName`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = toolAnalyticsContext?.toolName;
    // $[17] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[17];
  }
  // handleInputModeToggle沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleInputModeToggle = t4;
  // t5 暂存 `value_1 => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== acceptFeedback || $[19] !== acceptFeedbackModeEntered || $[20] !== onSelect || $[21] !== options || $[22] !== rejectFeedback || $[23] !== rejectFeedbackModeEntered || $[24] !== toolAnalyticsContext?.isMcp || $[25] !== toolAnalyticsContext?.toolName) {
    // t5 暂存 `value_1 => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = value_1 => {
      // option_0筛选`options.find`，供终端渲染后续处理使用。
      const option_0 = options.find(opt_2 => opt_2.value === value_1);
      // option_0缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!option_0) {
        // 权限确认界面 Permission Prompt在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // feedback 先占位，稍后的条件分支会根据实际输入补齐它。
      let feedback;
      // 满足 `option_0.feedbackConfig` 时，终端渲染执行该分支。
      if (option_0.feedbackConfig) {
        // rawFeedback标记终端渲染权限确认界面 Permission Prompt是否启用对应路径。
        const rawFeedback = option_0.feedbackConfig.type === "accept" ? acceptFeedback : rejectFeedback;
        // trimmedFeedback格式化`rawFeedback.trim`，供终端渲染后续处理使用。
        const trimmedFeedback = rawFeedback.trim();
        // 满足 `trimmedFeedback` 时，终端渲染执行该分支。
        if (trimmedFeedback) {
          // feedback更新为 `trimmedFeedback`，确保权限确认界面后续读取最新状态。
          feedback = trimmedFeedback;
        }
        // analyticsProps_0 集中保存终端渲染权限确认界面 Permission Prompt要一起传递的字段。
        const analyticsProps_0 = {
          toolName: toolAnalyticsContext?.toolName as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          isMcp: toolAnalyticsContext?.isMcp ?? false,
          has_instructions: !!trimmedFeedback,
          instructions_length: trimmedFeedback?.length ?? 0,
          entered_feedback_mode: option_0.feedbackConfig.type === "accept" ? acceptFeedbackModeEntered : rejectFeedbackModeEntered
        };
        // 当 `option_0.feedbackConfig.type` 匹配 `"accept"` 时，终端渲染执行对应分支。
        if (option_0.feedbackConfig.type === "accept") {
          // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
          logEvent("tengu_accept_submitted", analyticsProps_0);
        } else {
          // 当 `option_0.feedbackConfig.type` 匹配 `"reject"` 时，终端渲染执行对应分支。
          if (option_0.feedbackConfig.type === "reject") {
            // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
            logEvent("tengu_reject_submitted", analyticsProps_0);
          }
        }
      }
      // 调用 onSelect，触发终端渲染此处需要的副作用。
      onSelect(value_1, feedback);
    };
    // $[18] 缓存 `acceptFeedback`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = acceptFeedback;
    // $[19] 缓存 `acceptFeedbackModeEntered`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = acceptFeedbackModeEntered;
    // $[20] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = onSelect;
    // $[21] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = options;
    // $[22] 缓存 `rejectFeedback`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = rejectFeedback;
    // $[23] 缓存 `rejectFeedbackModeEntered`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = rejectFeedbackModeEntered;
    // $[24] 缓存 `toolAnalyticsContext?.isMcp`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = toolAnalyticsContext?.isMcp;
    // $[25] 缓存 `toolAnalyticsContext?.toolName`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = toolAnalyticsContext?.toolName;
    // $[26] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[26];
  }
  // handleSelect沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSelect = t5;
  // handlers 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let handlers;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== handleSelect || $[28] !== options) {
    // handlers 集合更新为 `{}`，确保权限确认界面后续读取最新状态。
    handlers = {};
    // 按顺序遍历 `options` 中的opt_3，逐个交给终端渲染处理。
    for (const opt_3 of options) {
      // 满足 `opt_3.keybinding` 时，终端渲染执行该分支。
      if (opt_3.keybinding) {
        // 这个回调绑定到 handlers[opt_3.keybinding] = () => handleSelect(opt_3.value);，负责终端渲染在该局部场景下的响应。
        handlers[opt_3.keybinding] = () => handleSelect(opt_3.value);
      }
    }
    // $[27] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = handleSelect;
    // $[28] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = options;
    // $[29] 缓存 `handlers`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = handlers;
  } else {
    // handlers 集合更新为 `$[29]`，确保权限确认界面后续读取最新状态。
    handlers = $[29];
  }
  // keybindingHandlers 集合保存`handlers`，供后续判断或组装使用。
  const keybindingHandlers = handlers;
  // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[30] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t6 = {
      context: "Confirmation"
    };
    // $[30] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[30];
  }
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(keybindingHandlers, t6);
  // t7 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== onCancel || $[32] !== setAppState) {
    // t7 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_permission_request_escape", {});
      // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
      setAppState(_temp);
      // 调用 onCancel?.();，完成这一处局部操作。
      onCancel?.();
    };
    // $[31] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = onCancel;
    // $[32] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = setAppState;
    // $[33] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[33];
  }
  // handleCancel 命名 `t7`，让后续代码直接表达这个值的用途。
  const handleCancel = t7;
  // t8 暂存 `typeof question === "string" ? <Text>{question}</Text> : ...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== question) {
    // t8 暂存 `typeof question === "string" ? <Text>{question}</Text> : ...` 生成的渲染片段，后续返回路径直接复用。
    t8 = typeof question === "string" ? <Text>{question}</Text> : question;
    // $[34] 缓存 `question`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = question;
    // $[35] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[35];
  }
  // t9 暂存 `value_2 => {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[36] !== acceptFeedback || $[37] !== acceptInputMode || $[38] !== options || $[39] !== rejectFeedback || $[40] !== rejectInputMode) {
    // t9 暂存 `value_2 => {` 生成的渲染片段，后续返回路径直接复用。
    t9 = value_2 => {
      // newOption筛选`options.find`，供终端渲染后续处理使用。
      const newOption = options.find(opt_4 => opt_4.value === value_2);
      // `newOption?.feedbackConfig?.type` 与 `"accept" && acceptInputMode && ...` 不一致时刷新派生状态，避免使用过期结果。
      if (newOption?.feedbackConfig?.type !== "accept" && acceptInputMode && !acceptFeedback.trim()) {
        // setAcceptInputMode 写入新的状态值，使终端渲染后续读取保持一致。
        setAcceptInputMode(false);
      }
      // `newOption?.feedbackConfig?.type` 与 `"reject" && rejectInputMode && ...` 不一致时刷新派生状态，避免使用过期结果。
      if (newOption?.feedbackConfig?.type !== "reject" && rejectInputMode && !rejectFeedback.trim()) {
        // setRejectInputMode 写入新的状态值，使终端渲染后续读取保持一致。
        setRejectInputMode(false);
      }
      // setFocusedValue 写入新的状态值，使终端渲染后续读取保持一致。
      setFocusedValue(value_2);
    };
    // $[36] 缓存 `acceptFeedback`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = acceptFeedback;
    // $[37] 缓存 `acceptInputMode`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = acceptInputMode;
    // $[38] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = options;
    // $[39] 缓存 `rejectFeedback`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = rejectFeedback;
    // $[40] 缓存 `rejectInputMode`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = rejectInputMode;
    // $[41] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[41];
  }
  // t10 暂存 `<Select options={selectOptions} inlineDescriptions={true}...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[42] !== handleCancel || $[43] !== handleInputModeToggle || $[44] !== handleSelect || $[45] !== selectOptions || $[46] !== t9) {
    // t10 暂存 `<Select options={selectOptions} inlineDescriptions={true}...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Select options={selectOptions} inlineDescriptions={true} onChange={handleSelect} onCancel={handleCancel} onFocus={t9} onInputModeToggle={handleInputModeToggle} />;
    // $[42] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = handleCancel;
    // $[43] 缓存 `handleInputModeToggle`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = handleInputModeToggle;
    // $[44] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = handleSelect;
    // $[45] 缓存 `selectOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = selectOptions;
    // $[46] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t9;
    // $[47] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[47];
  }
  // t11标记终端渲染权限确认界面 Permission Prompt是否启用对应路径。
  const t11 = showTabHint && " \xB7 Tab to amend";
  // t12 暂存 `<Box marginTop={1}><Text dimColor={true}>Esc to cancel{t1...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[48] !== t11) {
    // t12 暂存 `<Box marginTop={1}><Text dimColor={true}>Esc to cancel{t1...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Box marginTop={1}><Text dimColor={true}>Esc to cancel{t11}</Text></Box>;
    // $[48] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t11;
    // $[49] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[49] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[49];
  }
  // t13 暂存 `<Box flexDirection="column">{t8}{t10}{t12}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[50] !== t10 || $[51] !== t12 || $[52] !== t8) {
    // t13 暂存 `<Box flexDirection="column">{t8}{t10}{t12}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Box flexDirection="column">{t8}{t10}{t12}</Box>;
    // $[50] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t10;
    // $[51] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t12;
    // $[52] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t8;
    // $[53] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[53];
  }
  // 返回 `t13`，作为终端渲染这次计算的结果。
  return t13;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(prev) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...prev,
    attribution: {
      ...prev.attribution,
      escapeCount: prev.attribution.escapeCount + 1
    }
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsInVzZUNhbGxiYWNrIiwidXNlTWVtbyIsInVzZVN0YXRlIiwiQm94IiwiVGV4dCIsIktleWJpbmRpbmdBY3Rpb24iLCJ1c2VLZXliaW5kaW5ncyIsIkFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMiLCJsb2dFdmVudCIsInVzZVNldEFwcFN0YXRlIiwiT3B0aW9uV2l0aERlc2NyaXB0aW9uIiwiU2VsZWN0IiwiRmVlZGJhY2tUeXBlIiwiUGVybWlzc2lvblByb21wdE9wdGlvbiIsInZhbHVlIiwiVCIsImxhYmVsIiwiZmVlZGJhY2tDb25maWciLCJ0eXBlIiwicGxhY2Vob2xkZXIiLCJrZXliaW5kaW5nIiwiVG9vbEFuYWx5dGljc0NvbnRleHQiLCJ0b29sTmFtZSIsImlzTWNwIiwiUGVybWlzc2lvblByb21wdFByb3BzIiwib3B0aW9ucyIsIm9uU2VsZWN0IiwiZmVlZGJhY2siLCJvbkNhbmNlbCIsInF1ZXN0aW9uIiwidG9vbEFuYWx5dGljc0NvbnRleHQiLCJERUZBVUxUX1BMQUNFSE9MREVSUyIsIlJlY29yZCIsImFjY2VwdCIsInJlamVjdCIsIlBlcm1pc3Npb25Qcm9tcHQiLCJ0MCIsIiQiLCJfYyIsInQxIiwidW5kZWZpbmVkIiwic2V0QXBwU3RhdGUiLCJhY2NlcHRGZWVkYmFjayIsInNldEFjY2VwdEZlZWRiYWNrIiwicmVqZWN0RmVlZGJhY2siLCJzZXRSZWplY3RGZWVkYmFjayIsImFjY2VwdElucHV0TW9kZSIsInNldEFjY2VwdElucHV0TW9kZSIsInJlamVjdElucHV0TW9kZSIsInNldFJlamVjdElucHV0TW9kZSIsImZvY3VzZWRWYWx1ZSIsInNldEZvY3VzZWRWYWx1ZSIsImFjY2VwdEZlZWRiYWNrTW9kZUVudGVyZWQiLCJzZXRBY2NlcHRGZWVkYmFja01vZGVFbnRlcmVkIiwicmVqZWN0RmVlZGJhY2tNb2RlRW50ZXJlZCIsInNldFJlamVjdEZlZWRiYWNrTW9kZUVudGVyZWQiLCJ0MiIsInQzIiwib3B0IiwiZmluZCIsImZvY3VzZWRPcHRpb24iLCJmb2N1c2VkRmVlZGJhY2tUeXBlIiwic2hvd1RhYkhpbnQiLCJ0NCIsIm9wdF8wIiwiaXNJbnB1dE1vZGUiLCJvbkNoYW5nZSIsImRlZmF1bHRQbGFjZWhvbGRlciIsImNvbnN0IiwiYWxsb3dFbXB0eVN1Ym1pdFRvQ2FuY2VsIiwibWFwIiwic2VsZWN0T3B0aW9ucyIsInZhbHVlXzAiLCJvcHRpb24iLCJvcHRfMSIsInR5cGVfMCIsImFuYWx5dGljc1Byb3BzIiwiaGFuZGxlSW5wdXRNb2RlVG9nZ2xlIiwidDUiLCJ2YWx1ZV8xIiwib3B0aW9uXzAiLCJvcHRfMiIsInJhd0ZlZWRiYWNrIiwidHJpbW1lZEZlZWRiYWNrIiwidHJpbSIsImFuYWx5dGljc1Byb3BzXzAiLCJoYXNfaW5zdHJ1Y3Rpb25zIiwiaW5zdHJ1Y3Rpb25zX2xlbmd0aCIsImxlbmd0aCIsImVudGVyZWRfZmVlZGJhY2tfbW9kZSIsImhhbmRsZVNlbGVjdCIsImhhbmRsZXJzIiwib3B0XzMiLCJrZXliaW5kaW5nSGFuZGxlcnMiLCJ0NiIsIlN5bWJvbCIsImZvciIsImNvbnRleHQiLCJ0NyIsIl90ZW1wIiwiaGFuZGxlQ2FuY2VsIiwidDgiLCJ0OSIsInZhbHVlXzIiLCJuZXdPcHRpb24iLCJvcHRfNCIsInQxMCIsInQxMSIsInQxMiIsInQxMyIsInByZXYiLCJhdHRyaWJ1dGlvbiIsImVzY2FwZUNvdW50Il0sInNvdXJjZXMiOlsiUGVybWlzc2lvblByb21wdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHR5cGUgUmVhY3ROb2RlLCB1c2VDYWxsYmFjaywgdXNlTWVtbywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgS2V5YmluZGluZ0FjdGlvbiB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3R5cGVzLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZ3MgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnLi4vLi4vc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHsgdXNlU2V0QXBwU3RhdGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IHR5cGUgT3B0aW9uV2l0aERlc2NyaXB0aW9uLCBTZWxlY3QgfSBmcm9tICcuLi9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuXG5leHBvcnQgdHlwZSBGZWVkYmFja1R5cGUgPSAnYWNjZXB0JyB8ICdyZWplY3QnXG5cbmV4cG9ydCB0eXBlIFBlcm1pc3Npb25Qcm9tcHRPcHRpb248VCBleHRlbmRzIHN0cmluZz4gPSB7XG4gIHZhbHVlOiBUXG4gIGxhYmVsOiBSZWFjdE5vZGVcbiAgZmVlZGJhY2tDb25maWc/OiB7XG4gICAgdHlwZTogRmVlZGJhY2tUeXBlXG4gICAgcGxhY2Vob2xkZXI/OiBzdHJpbmdcbiAgfVxuICBrZXliaW5kaW5nPzogS2V5YmluZGluZ0FjdGlvblxufVxuXG5leHBvcnQgdHlwZSBUb29sQW5hbHl0aWNzQ29udGV4dCA9IHtcbiAgdG9vbE5hbWU6IHN0cmluZ1xuICBpc01jcDogYm9vbGVhblxufVxuXG5leHBvcnQgdHlwZSBQZXJtaXNzaW9uUHJvbXB0UHJvcHM8VCBleHRlbmRzIHN0cmluZz4gPSB7XG4gIG9wdGlvbnM6IFBlcm1pc3Npb25Qcm9tcHRPcHRpb248VD5bXVxuICBvblNlbGVjdDogKHZhbHVlOiBULCBmZWVkYmFjaz86IHN0cmluZykgPT4gdm9pZFxuICBvbkNhbmNlbD86ICgpID0+IHZvaWRcbiAgcXVlc3Rpb24/OiBzdHJpbmcgfCBSZWFjdE5vZGVcbiAgdG9vbEFuYWx5dGljc0NvbnRleHQ/OiBUb29sQW5hbHl0aWNzQ29udGV4dFxufVxuXG5jb25zdCBERUZBVUxUX1BMQUNFSE9MREVSUzogUmVjb3JkPEZlZWRiYWNrVHlwZSwgc3RyaW5nPiA9IHtcbiAgYWNjZXB0OiAndGVsbCBDbGF1ZGUgd2hhdCB0byBkbyBuZXh0JyxcbiAgcmVqZWN0OiAndGVsbCBDbGF1ZGUgd2hhdCB0byBkbyBkaWZmZXJlbnRseScsXG59XG5cbi8qKlxuICogU2hhcmVkIGNvbXBvbmVudCBmb3IgcGVybWlzc2lvbiBwcm9tcHRzIHdpdGggb3B0aW9uYWwgZmVlZGJhY2sgaW5wdXQuXG4gKlxuICogSGFuZGxlczpcbiAqIC0gXCJEbyB5b3Ugd2FudCB0byBwcm9jZWVkP1wiIHF1ZXN0aW9uIHdpdGggb3B0aW9uYWwgVGFiIGhpbnRcbiAqIC0gRmVhdHVyZSBmbGFnIGNoZWNrIGZvciBmZWVkYmFjayBjYXBhYmlsaXR5XG4gKiAtIElucHV0IG1vZGUgdG9nZ2xpbmcgKFRhYiB0byBleHBhbmQgZmVlZGJhY2sgaW5wdXQpXG4gKiAtIEFuYWx5dGljcyBldmVudHMgZm9yIGZlZWRiYWNrIGludGVyYWN0aW9uc1xuICogLSBUcmFuc2Zvcm1pbmcgb3B0aW9ucyB0byBTZWxlY3QtY29tcGF0aWJsZSBmb3JtYXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFBlcm1pc3Npb25Qcm9tcHQ8VCBleHRlbmRzIHN0cmluZz4oe1xuICBvcHRpb25zLFxuICBvblNlbGVjdCxcbiAgb25DYW5jZWwsXG4gIHF1ZXN0aW9uID0gJ0RvIHlvdSB3YW50IHRvIHByb2NlZWQ/JyxcbiAgdG9vbEFuYWx5dGljc0NvbnRleHQsXG59OiBQZXJtaXNzaW9uUHJvbXB0UHJvcHM8VD4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBzZXRBcHBTdGF0ZSA9IHVzZVNldEFwcFN0YXRlKClcbiAgY29uc3QgW2FjY2VwdEZlZWRiYWNrLCBzZXRBY2NlcHRGZWVkYmFja10gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW3JlamVjdEZlZWRiYWNrLCBzZXRSZWplY3RGZWVkYmFja10gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW2FjY2VwdElucHV0TW9kZSwgc2V0QWNjZXB0SW5wdXRNb2RlXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbcmVqZWN0SW5wdXRNb2RlLCBzZXRSZWplY3RJbnB1dE1vZGVdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtmb2N1c2VkVmFsdWUsIHNldEZvY3VzZWRWYWx1ZV0gPSB1c2VTdGF0ZTxUIHwgbnVsbD4obnVsbClcbiAgLy8gVHJhY2sgd2hldGhlciB1c2VyIGV2ZXIgZW50ZXJlZCBmZWVkYmFjayBtb2RlIChwZXJzaXN0cyBhZnRlciBjb2xsYXBzZSlcbiAgY29uc3QgW2FjY2VwdEZlZWRiYWNrTW9kZUVudGVyZWQsIHNldEFjY2VwdEZlZWRiYWNrTW9kZUVudGVyZWRdID1cbiAgICB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW3JlamVjdEZlZWRiYWNrTW9kZUVudGVyZWQsIHNldFJlamVjdEZlZWRiYWNrTW9kZUVudGVyZWRdID1cbiAgICB1c2VTdGF0ZShmYWxzZSlcblxuICAvLyBGaW5kIHdoaWNoIG9wdGlvbiBpcyBmb2N1c2VkIGFuZCB3aGV0aGVyIGl0IGhhcyBmZWVkYmFjayBjb25maWdcbiAgY29uc3QgZm9jdXNlZE9wdGlvbiA9IG9wdGlvbnMuZmluZChvcHQgPT4gb3B0LnZhbHVlID09PSBmb2N1c2VkVmFsdWUpXG4gIGNvbnN0IGZvY3VzZWRGZWVkYmFja1R5cGUgPSBmb2N1c2VkT3B0aW9uPy5mZWVkYmFja0NvbmZpZz8udHlwZVxuXG4gIC8vIFNob3cgVGFiIGhpbnQgd2hlbiBmb2N1c2VkIG9uIGEgZmVlZGJhY2stZW5hYmxlZCBvcHRpb24gdGhhdCdzIG5vdCBhbHJlYWR5IGluIGlucHV0IG1vZGVcbiAgY29uc3Qgc2hvd1RhYkhpbnQgPVxuICAgIChmb2N1c2VkRmVlZGJhY2tUeXBlID09PSAnYWNjZXB0JyAmJiAhYWNjZXB0SW5wdXRNb2RlKSB8fFxuICAgIChmb2N1c2VkRmVlZGJhY2tUeXBlID09PSAncmVqZWN0JyAmJiAhcmVqZWN0SW5wdXRNb2RlKVxuXG4gIC8vIFRyYW5zZm9ybSBvcHRpb25zIHRvIFNlbGVjdC1jb21wYXRpYmxlIGZvcm1hdFxuICBjb25zdCBzZWxlY3RPcHRpb25zID0gdXNlTWVtbygoKTogT3B0aW9uV2l0aERlc2NyaXB0aW9uPFQ+W10gPT4ge1xuICAgIHJldHVybiBvcHRpb25zLm1hcChvcHQgPT4ge1xuICAgICAgY29uc3QgeyB2YWx1ZSwgbGFiZWwsIGZlZWRiYWNrQ29uZmlnIH0gPSBvcHRcblxuICAgICAgLy8gTm8gZmVlZGJhY2sgY29uZmlnID0gc2ltcGxlIG9wdGlvblxuICAgICAgaWYgKCFmZWVkYmFja0NvbmZpZykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgdHlwZSwgcGxhY2Vob2xkZXIgfSA9IGZlZWRiYWNrQ29uZmlnXG4gICAgICBjb25zdCBpc0lucHV0TW9kZSA9IHR5cGUgPT09ICdhY2NlcHQnID8gYWNjZXB0SW5wdXRNb2RlIDogcmVqZWN0SW5wdXRNb2RlXG4gICAgICBjb25zdCBvbkNoYW5nZSA9IHR5cGUgPT09ICdhY2NlcHQnID8gc2V0QWNjZXB0RmVlZGJhY2sgOiBzZXRSZWplY3RGZWVkYmFja1xuICAgICAgY29uc3QgZGVmYXVsdFBsYWNlaG9sZGVyID0gREVGQVVMVF9QTEFDRUhPTERFUlNbdHlwZV1cblxuICAgICAgLy8gV2hlbiBpbiBpbnB1dCBtb2RlLCBzaG93IGlucHV0IGZpZWxkXG4gICAgICBpZiAoaXNJbnB1dE1vZGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnaW5wdXQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsLFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgIHBsYWNlaG9sZGVyOiBwbGFjZWhvbGRlciA/PyBkZWZhdWx0UGxhY2Vob2xkZXIsXG4gICAgICAgICAgb25DaGFuZ2UsXG4gICAgICAgICAgYWxsb3dFbXB0eVN1Ym1pdFRvQ2FuY2VsOiB0cnVlLFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE5vdCBpbiBpbnB1dCBtb2RlIC0gc2hvdyBzaW1wbGUgb3B0aW9uXG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbCxcbiAgICAgICAgdmFsdWUsXG4gICAgICB9XG4gICAgfSlcbiAgfSwgW29wdGlvbnMsIGFjY2VwdElucHV0TW9kZSwgcmVqZWN0SW5wdXRNb2RlXSlcblxuICAvLyBIYW5kbGUgVGFiIGtleSB0byB0b2dnbGUgaW5wdXQgbW9kZVxuICBjb25zdCBoYW5kbGVJbnB1dE1vZGVUb2dnbGUgPSB1c2VDYWxsYmFjayhcbiAgICAodmFsdWU6IFQpID0+IHtcbiAgICAgIGNvbnN0IG9wdGlvbiA9IG9wdGlvbnMuZmluZChvcHQgPT4gb3B0LnZhbHVlID09PSB2YWx1ZSlcbiAgICAgIGlmICghb3B0aW9uPy5mZWVkYmFja0NvbmZpZykgcmV0dXJuXG5cbiAgICAgIGNvbnN0IHsgdHlwZSB9ID0gb3B0aW9uLmZlZWRiYWNrQ29uZmlnXG4gICAgICBjb25zdCBhbmFseXRpY3NQcm9wcyA9IHtcbiAgICAgICAgdG9vbE5hbWU6XG4gICAgICAgICAgdG9vbEFuYWx5dGljc0NvbnRleHQ/LnRvb2xOYW1lIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIGlzTWNwOiB0b29sQW5hbHl0aWNzQ29udGV4dD8uaXNNY3AgPz8gZmFsc2UsXG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlID09PSAnYWNjZXB0Jykge1xuICAgICAgICBpZiAoYWNjZXB0SW5wdXRNb2RlKSB7XG4gICAgICAgICAgc2V0QWNjZXB0SW5wdXRNb2RlKGZhbHNlKVxuICAgICAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9hY2NlcHRfZmVlZGJhY2tfbW9kZV9jb2xsYXBzZWQnLCBhbmFseXRpY3NQcm9wcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRBY2NlcHRJbnB1dE1vZGUodHJ1ZSlcbiAgICAgICAgICBzZXRBY2NlcHRGZWVkYmFja01vZGVFbnRlcmVkKHRydWUpXG4gICAgICAgICAgbG9nRXZlbnQoJ3Rlbmd1X2FjY2VwdF9mZWVkYmFja19tb2RlX2VudGVyZWQnLCBhbmFseXRpY3NQcm9wcylcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAncmVqZWN0Jykge1xuICAgICAgICBpZiAocmVqZWN0SW5wdXRNb2RlKSB7XG4gICAgICAgICAgc2V0UmVqZWN0SW5wdXRNb2RlKGZhbHNlKVxuICAgICAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9yZWplY3RfZmVlZGJhY2tfbW9kZV9jb2xsYXBzZWQnLCBhbmFseXRpY3NQcm9wcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRSZWplY3RJbnB1dE1vZGUodHJ1ZSlcbiAgICAgICAgICBzZXRSZWplY3RGZWVkYmFja01vZGVFbnRlcmVkKHRydWUpXG4gICAgICAgICAgbG9nRXZlbnQoJ3Rlbmd1X3JlamVjdF9mZWVkYmFja19tb2RlX2VudGVyZWQnLCBhbmFseXRpY3NQcm9wcylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgW29wdGlvbnMsIGFjY2VwdElucHV0TW9kZSwgcmVqZWN0SW5wdXRNb2RlLCB0b29sQW5hbHl0aWNzQ29udGV4dF0sXG4gIClcblxuICAvLyBIYW5kbGUgc2VsZWN0aW9uXG4gIGNvbnN0IGhhbmRsZVNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgICh2YWx1ZTogVCkgPT4ge1xuICAgICAgY29uc3Qgb3B0aW9uID0gb3B0aW9ucy5maW5kKG9wdCA9PiBvcHQudmFsdWUgPT09IHZhbHVlKVxuICAgICAgaWYgKCFvcHRpb24pIHJldHVyblxuXG4gICAgICAvLyBHZXQgZmVlZGJhY2sgaWYgYXBwbGljYWJsZVxuICAgICAgbGV0IGZlZWRiYWNrOiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICAgIGlmIChvcHRpb24uZmVlZGJhY2tDb25maWcpIHtcbiAgICAgICAgY29uc3QgcmF3RmVlZGJhY2sgPVxuICAgICAgICAgIG9wdGlvbi5mZWVkYmFja0NvbmZpZy50eXBlID09PSAnYWNjZXB0J1xuICAgICAgICAgICAgPyBhY2NlcHRGZWVkYmFja1xuICAgICAgICAgICAgOiByZWplY3RGZWVkYmFja1xuICAgICAgICBjb25zdCB0cmltbWVkRmVlZGJhY2sgPSByYXdGZWVkYmFjay50cmltKClcblxuICAgICAgICBpZiAodHJpbW1lZEZlZWRiYWNrKSB7XG4gICAgICAgICAgZmVlZGJhY2sgPSB0cmltbWVkRmVlZGJhY2tcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExvZyBhY2NlcHQvcmVqZWN0IHN1Ym1pc3Npb24gd2l0aCBmZWVkYmFjayBjb250ZXh0XG4gICAgICAgIGNvbnN0IGFuYWx5dGljc1Byb3BzID0ge1xuICAgICAgICAgIHRvb2xOYW1lOlxuICAgICAgICAgICAgdG9vbEFuYWx5dGljc0NvbnRleHQ/LnRvb2xOYW1lIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgICAgaXNNY3A6IHRvb2xBbmFseXRpY3NDb250ZXh0Py5pc01jcCA/PyBmYWxzZSxcbiAgICAgICAgICBoYXNfaW5zdHJ1Y3Rpb25zOiAhIXRyaW1tZWRGZWVkYmFjayxcbiAgICAgICAgICBpbnN0cnVjdGlvbnNfbGVuZ3RoOiB0cmltbWVkRmVlZGJhY2s/Lmxlbmd0aCA/PyAwLFxuICAgICAgICAgIGVudGVyZWRfZmVlZGJhY2tfbW9kZTpcbiAgICAgICAgICAgIG9wdGlvbi5mZWVkYmFja0NvbmZpZy50eXBlID09PSAnYWNjZXB0J1xuICAgICAgICAgICAgICA/IGFjY2VwdEZlZWRiYWNrTW9kZUVudGVyZWRcbiAgICAgICAgICAgICAgOiByZWplY3RGZWVkYmFja01vZGVFbnRlcmVkLFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbi5mZWVkYmFja0NvbmZpZy50eXBlID09PSAnYWNjZXB0Jykge1xuICAgICAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9hY2NlcHRfc3VibWl0dGVkJywgYW5hbHl0aWNzUHJvcHMpXG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9uLmZlZWRiYWNrQ29uZmlnLnR5cGUgPT09ICdyZWplY3QnKSB7XG4gICAgICAgICAgbG9nRXZlbnQoJ3Rlbmd1X3JlamVjdF9zdWJtaXR0ZWQnLCBhbmFseXRpY3NQcm9wcylcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBvblNlbGVjdCh2YWx1ZSwgZmVlZGJhY2spXG4gICAgfSxcbiAgICBbXG4gICAgICBvcHRpb25zLFxuICAgICAgYWNjZXB0RmVlZGJhY2ssXG4gICAgICByZWplY3RGZWVkYmFjayxcbiAgICAgIG9uU2VsZWN0LFxuICAgICAgdG9vbEFuYWx5dGljc0NvbnRleHQsXG4gICAgICBhY2NlcHRGZWVkYmFja01vZGVFbnRlcmVkLFxuICAgICAgcmVqZWN0RmVlZGJhY2tNb2RlRW50ZXJlZCxcbiAgICBdLFxuICApXG5cbiAgLy8gUmVnaXN0ZXIga2V5YmluZGluZyBoYW5kbGVycyBmb3Igb3B0aW9ucyB0aGF0IGhhdmUgYSBrZXliaW5kaW5nIHNldFxuICBjb25zdCBrZXliaW5kaW5nSGFuZGxlcnMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVyczogUmVjb3JkPHN0cmluZywgKCkgPT4gdm9pZD4gPSB7fVxuICAgIGZvciAoY29uc3Qgb3B0IG9mIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHQua2V5YmluZGluZykge1xuICAgICAgICBoYW5kbGVyc1tvcHQua2V5YmluZGluZ10gPSAoKSA9PiBoYW5kbGVTZWxlY3Qob3B0LnZhbHVlKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaGFuZGxlcnNcbiAgfSwgW29wdGlvbnMsIGhhbmRsZVNlbGVjdF0pXG5cbiAgdXNlS2V5YmluZGluZ3Moa2V5YmluZGluZ0hhbmRsZXJzLCB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0pXG5cbiAgLy8gSGFuZGxlIGNhbmNlbCAoRXNjKVxuICBjb25zdCBoYW5kbGVDYW5jZWwgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgbG9nRXZlbnQoJ3Rlbmd1X3Blcm1pc3Npb25fcmVxdWVzdF9lc2NhcGUnLCB7fSlcbiAgICAvLyBJbmNyZW1lbnQgZXNjYXBlIGNvdW50IGZvciBhdHRyaWJ1dGlvbiB0cmFja2luZ1xuICAgIHNldEFwcFN0YXRlKHByZXYgPT4gKHtcbiAgICAgIC4uLnByZXYsXG4gICAgICBhdHRyaWJ1dGlvbjoge1xuICAgICAgICAuLi5wcmV2LmF0dHJpYnV0aW9uLFxuICAgICAgICBlc2NhcGVDb3VudDogcHJldi5hdHRyaWJ1dGlvbi5lc2NhcGVDb3VudCArIDEsXG4gICAgICB9LFxuICAgIH0pKVxuICAgIG9uQ2FuY2VsPy4oKVxuICB9LCBbb25DYW5jZWwsIHNldEFwcFN0YXRlXSlcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAge3R5cGVvZiBxdWVzdGlvbiA9PT0gJ3N0cmluZycgPyA8VGV4dD57cXVlc3Rpb259PC9UZXh0PiA6IHF1ZXN0aW9ufVxuICAgICAgPFNlbGVjdFxuICAgICAgICBvcHRpb25zPXtzZWxlY3RPcHRpb25zfVxuICAgICAgICBpbmxpbmVEZXNjcmlwdGlvbnNcbiAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVNlbGVjdH1cbiAgICAgICAgb25DYW5jZWw9e2hhbmRsZUNhbmNlbH1cbiAgICAgICAgb25Gb2N1cz17dmFsdWUgPT4ge1xuICAgICAgICAgIC8vIFJlc2V0IGlucHV0IG1vZGUgd2hlbiBuYXZpZ2F0aW5nIGF3YXksIGJ1dCBvbmx5IGlmIG5vIHRleHQgdHlwZWRcbiAgICAgICAgICBjb25zdCBuZXdPcHRpb24gPSBvcHRpb25zLmZpbmQob3B0ID0+IG9wdC52YWx1ZSA9PT0gdmFsdWUpXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbmV3T3B0aW9uPy5mZWVkYmFja0NvbmZpZz8udHlwZSAhPT0gJ2FjY2VwdCcgJiZcbiAgICAgICAgICAgIGFjY2VwdElucHV0TW9kZSAmJlxuICAgICAgICAgICAgIWFjY2VwdEZlZWRiYWNrLnRyaW0oKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgc2V0QWNjZXB0SW5wdXRNb2RlKGZhbHNlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBuZXdPcHRpb24/LmZlZWRiYWNrQ29uZmlnPy50eXBlICE9PSAncmVqZWN0JyAmJlxuICAgICAgICAgICAgcmVqZWN0SW5wdXRNb2RlICYmXG4gICAgICAgICAgICAhcmVqZWN0RmVlZGJhY2sudHJpbSgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBzZXRSZWplY3RJbnB1dE1vZGUoZmFsc2UpXG4gICAgICAgICAgfVxuICAgICAgICAgIHNldEZvY3VzZWRWYWx1ZSh2YWx1ZSlcbiAgICAgICAgfX1cbiAgICAgICAgb25JbnB1dE1vZGVUb2dnbGU9e2hhbmRsZUlucHV0TW9kZVRvZ2dsZX1cbiAgICAgIC8+XG4gICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPkVzYyB0byBjYW5jZWx7c2hvd1RhYkhpbnQgJiYgJyDCtyBUYWIgdG8gYW1lbmQnfTwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUksS0FBS0MsU0FBUyxFQUFFQyxXQUFXLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDN0UsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxjQUFjQyxnQkFBZ0IsUUFBUSw0QkFBNEI7QUFDbEUsU0FBU0MsY0FBYyxRQUFRLG9DQUFvQztBQUNuRSxTQUNFLEtBQUtDLDBEQUEwRCxF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