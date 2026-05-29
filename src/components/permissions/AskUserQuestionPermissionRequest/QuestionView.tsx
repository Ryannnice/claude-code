// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React、useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useState } from 'react';
// 类型依赖 { KeyboardEvent } 来自 ../../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../../ink/events/keyboard-event.js';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 引入 useAppState，将 ../../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../../state/AppState.js';
// 类型依赖 { Question, QuestionOption } 来自 ../../../tools/AskUserQuestionTool/AskUserQuestionTool.js，用于校准终端渲染的数据契约。
import type { Question, QuestionOption } from '../../../tools/AskUserQuestionTool/AskUserQuestionTool.js';
// 类型依赖 { PastedContent } 来自 ../../../utils/config.js，用于校准终端渲染的数据契约。
import type { PastedContent } from '../../../utils/config.js';
// 复用 getExternalEditor 工具函数，把通用处理留在 ../../../utils/editor.js 中维护。
import { getExternalEditor } from '../../../utils/editor.js';
// 复用 toIDEDisplayName 工具函数，把通用处理留在 ../../../utils/ide.js 中维护。
import { toIDEDisplayName } from '../../../utils/ide.js';
// 类型依赖 { ImageDimensions } 来自 ../../../utils/imageResizer.js，用于校准终端渲染的数据契约。
import type { ImageDimensions } from '../../../utils/imageResizer.js';
// 复用 editPromptInEditor 工具函数，把通用处理留在 ../../../utils/promptEditor.js 中维护。
import { editPromptInEditor } from '../../../utils/promptEditor.js';
// 引入 OptionWithDescription、Select、SelectMulti，将 ../../CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { type OptionWithDescription, Select, SelectMulti } from '../../CustomSelect/index.js';
// 引入 Divider，将 ../../design-system/Divider.js 中已经封装好的能力接到本文件流程里。
import { Divider } from '../../design-system/Divider.js';
// 引入 FilePathLink，将 ../../FilePathLink.js 中已经封装好的能力接到本文件流程里。
import { FilePathLink } from '../../FilePathLink.js';
// 引入 PermissionRequestTitle，将 ../PermissionRequestTitle.js 中已经封装好的能力接到本文件流程里。
import { PermissionRequestTitle } from '../PermissionRequestTitle.js';
// 引入 PreviewQuestionView，将 ./PreviewQuestionView.js 中已经封装好的能力接到本文件流程里。
import { PreviewQuestionView } from './PreviewQuestionView.js';
// 引入 QuestionNavigationBar，将 ./QuestionNavigationBar.js 中已经封装好的能力接到本文件流程里。
import { QuestionNavigationBar } from './QuestionNavigationBar.js';
// 类型依赖 { QuestionState } 来自 ./use-multiple-choice-state.js，用于校准终端渲染的数据契约。
import type { QuestionState } from './use-multiple-choice-state.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  question: Question;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  questionStates: Record<string, QuestionState>;
  hideSubmitTab?: boolean;
  planFilePath?: string;
  pastedContents?: Record<number, PastedContent>;
  minContentHeight?: number;
  minContentWidth?: number;
  // 这个回调绑定到 onUpdateQuestionState: (questionText: string, updates: Partial<QuestionState>, isMul…，负责终端渲染在该局部场景下的响应。
  onUpdateQuestionState: (questionText: string, updates: Partial<QuestionState>, isMultiSelect: boolean) => void;
  // 这个回调绑定到 onAnswer: (questionText: string, label: string | string[], textInput?: string, shoul…，负责终端渲染在该局部场景下的响应。
  onAnswer: (questionText: string, label: string | string[], textInput?: string, shouldAdvance?: boolean) => void;
  // 这个回调绑定到 onTextInputFocus: (isInInput: boolean) => void;，负责终端渲染在该局部场景下的响应。
  onTextInputFocus: (isInInput: boolean) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  // 这个回调绑定到 onSubmit: () => void;，负责终端渲染在该局部场景下的响应。
  onSubmit: () => void;
  onTabPrev?: () => void;
  onTabNext?: () => void;
  // 这个回调绑定到 onRespondToClaude: () => void;，负责终端渲染在该局部场景下的响应。
  onRespondToClaude: () => void;
  // 这个回调绑定到 onFinishPlanInterview: () => void;，负责终端渲染在该局部场景下的响应。
  onFinishPlanInterview: () => void;
  onImagePaste?: (base64Image: string, mediaType?: string, filename?: string, dimensions?: ImageDimensions, sourcePath?: string) => void;
  onRemoveImage?: (id: number) => void;
};
// QuestionView 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function QuestionView(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(114);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    question,
    questions,
    currentQuestionIndex,
    answers,
    questionStates,
    hideSubmitTab: t1,
    planFilePath,
    minContentHeight,
    minContentWidth,
    onUpdateQuestionState,
    onAnswer,
    onTextInputFocus,
    onCancel,
    onSubmit,
    onTabPrev,
    onTabNext,
    onRespondToClaude,
    onFinishPlanInterview,
    onImagePaste,
    pastedContents,
    onRemoveImage
  } = t0;
  // hideSubmitTab标记终端渲染权限确认界面 Question View是否启用对应路径。
  const hideSubmitTab = t1 === undefined ? false : t1;
  // isInPlanMode记录 `useAppState` 是否成立，终端渲染随后按该结果分支。
  const isInPlanMode = useAppState(_temp) === "plan";
  // isFooterFocused 由 React state 持有，setIsFooterFocused 会在用户操作或异步结果返回时触发刷新。
  const [isFooterFocused, setIsFooterFocused] = useState(false);
  // footerIndex 索引 由 React state 持有，setFooterIndex 会在用户操作或异步结果返回时触发刷新。
  const [footerIndex, setFooterIndex] = useState(0);
  // isOtherFocused 由 React state 持有，setIsOtherFocused 会在用户操作或异步结果返回时触发刷新。
  const [isOtherFocused, setIsOtherFocused] = useState(false);
  // t2 暂存 `editor ? toIDEDisplayName(editor) : null` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // editor读取`getExternalEditor`，供终端渲染后续处理使用。
    const editor = getExternalEditor();
    // t2 暂存 `editor ? toIDEDisplayName(editor) : null` 生成的渲染片段，后续返回路径直接复用。
    t2 = editor ? toIDEDisplayName(editor) : null;
    // $[0] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[0];
  }
  // editorName沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const editorName = t2;
  // t3 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onTextInputFocus) {
    // t3 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = value => {
      // isOther标记终端渲染权限确认界面 Question View是否启用对应路径。
      const isOther = value === "__other__";
      // setIsOtherFocused 写入新的状态值，使终端渲染后续读取保持一致。
      setIsOtherFocused(isOther);
      // 调用 onTextInputFocus，触发终端渲染此处需要的副作用。
      onTextInputFocus(isOther);
    };
    // $[1] 缓存 `onTextInputFocus`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onTextInputFocus;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // handleFocus 集合 命名 `t3`，让后续代码直接表达这个值的用途。
  const handleFocus = t3;
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // setIsFooterFocused 写入新的状态值，使终端渲染后续读取保持一致。
      setIsFooterFocused(true);
    };
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // handleDownFromLastItem保存`t4`，作为后续临时缓存值处理的输入。
  const handleDownFromLastItem = t4;
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // setIsFooterFocused 写入新的状态值，使终端渲染后续读取保持一致。
      setIsFooterFocused(false);
    };
    // $[4] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[4];
  }
  // handleUpFromFooter沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleUpFromFooter = t5;
  // t6 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== footerIndex || $[6] !== isFooterFocused || $[7] !== isInPlanMode || $[8] !== onCancel || $[9] !== onFinishPlanInterview || $[10] !== onRespondToClaude) {
    // t6 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = e => {
      // isFooterFocused缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!isFooterFocused) {
        // 权限确认界面 Question View在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 当 `e.key` 匹配 `"up" || e.ctrl && e.key ===...` 时，终端渲染执行对应分支。
      if (e.key === "up" || e.ctrl && e.key === "p") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // 满足 `footerIndex === 0` 时，终端渲染执行该分支。
        if (footerIndex === 0) {
          // 调用 handleUpFromFooter，触发终端渲染此处需要的副作用。
          handleUpFromFooter();
        } else {
          // setFooterIndex 写入新的状态值，使终端渲染后续读取保持一致。
          setFooterIndex(0);
        }
        // 权限确认界面 Question View在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 当 `e.key` 匹配 `"down" || e.ctrl && e.key =...` 时，终端渲染执行对应分支。
      if (e.key === "down" || e.ctrl && e.key === "n") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // 只有 `isInPlanMode && footerIndex === 0` 满足时，终端渲染才执行该分支。
        if (isInPlanMode && footerIndex === 0) {
          // setFooterIndex 写入新的状态值，使终端渲染后续读取保持一致。
          setFooterIndex(1);
        }
        // 权限确认界面 Question View在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 当 `e.key` 匹配 `"return"` 时，终端渲染执行对应分支。
      if (e.key === "return") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // 满足 `footerIndex === 0` 时，终端渲染执行该分支。
        if (footerIndex === 0) {
          // 调用 onRespondToClaude，触发终端渲染此处需要的副作用。
          onRespondToClaude();
        } else {
          // 调用 onFinishPlanInterview，触发终端渲染此处需要的副作用。
          onFinishPlanInterview();
        }
        // 权限确认界面 Question View在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 当 `e.key` 匹配 `"escape"` 时，终端渲染执行对应分支。
      if (e.key === "escape") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // 调用 onCancel，触发终端渲染此处需要的副作用。
        onCancel();
      }
    };
    // $[5] 缓存 `footerIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = footerIndex;
    // $[6] 缓存 `isFooterFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = isFooterFocused;
    // $[7] 缓存 `isInPlanMode`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = isInPlanMode;
    // $[8] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onCancel;
    // $[9] 缓存 `onFinishPlanInterview`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = onFinishPlanInterview;
    // $[10] 缓存 `onRespondToClaude`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onRespondToClaude;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // handleKeyDown沿用 `t6` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleKeyDown = t6;
  // handleOpenEditor 先占位，稍后的条件分支会根据实际输入补齐它。
  let handleOpenEditor;
  // questionText 先占位，稍后的条件分支会根据实际输入补齐它。
  let questionText;
  // t7 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== onUpdateQuestionState || $[13] !== question || $[14] !== questionStates) {
    // textOptions 集合派生`options.map`，供终端渲染后续处理使用。
    const textOptions = question.options.map(_temp2);
    // questionText更新为 `question.question`，确保权限确认界面后续读取最新状态。
    questionText = question.question;
    // questionState 状态保存`questionStates[questionText]`，供终端渲染权限确认界面 Question View后续判断或输出使用。
    const questionState = questionStates[questionText];
    // t8 暂存 `async (currentValue, setValue) => {` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[18] !== onUpdateQuestionState || $[19] !== question.multiSelect || $[20] !== questionText) {
      // t8 暂存 `async (currentValue, setValue) => {` 生成的渲染片段，后续返回路径直接复用。
      t8 = async (currentValue, setValue) => {
        // 结果保存`editPromptInEditor`，供终端渲染后续处理使用。
        const result = await editPromptInEditor(currentValue);
        // `result.content` 与 `null && result.content !== cur` 不一致时刷新派生状态，避免使用过期结果。
        if (result.content !== null && result.content !== currentValue) {
          // setValue 写入新的状态值，使终端渲染后续读取保持一致。
          setValue(result.content);
          // 调用 onUpdateQuestionState，触发终端渲染此处需要的副作用。
          onUpdateQuestionState(questionText, {
            textInputValue: result.content
          }, question.multiSelect ?? false);
        }
      };
      // $[18] 缓存 `onUpdateQuestionState`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = onUpdateQuestionState;
      // $[19] 缓存 `question.multiSelect`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = question.multiSelect;
      // $[20] 缓存 `questionText`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = questionText;
      // $[21] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[21];
    }
    // handleOpenEditor更新为 `t8`，确保权限确认界面后续读取最新状态。
    handleOpenEditor = t8;
    // 临时值 t9 命名 `question.multiSelect ? "Type something" : "Type something...`，让后续代码直接表达这个值的用途。
    const t9 = question.multiSelect ? "Type something" : "Type something.";
    // t10保存`questionState?.textInputValue ?? ""`，供终端渲染权限确认界面 Question View后续判断或输出使用。
    const t10 = questionState?.textInputValue ?? "";
    // t11 暂存 `value_0 => {` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[22] !== onUpdateQuestionState || $[23] !== question.multiSelect || $[24] !== questionText) {
      // t11 暂存 `value_0 => {` 生成的渲染片段，后续返回路径直接复用。
      t11 = value_0 => {
        // 调用 onUpdateQuestionState，触发终端渲染此处需要的副作用。
        onUpdateQuestionState(questionText, {
          textInputValue: value_0
        }, question.multiSelect ?? false);
      };
      // $[22] 缓存 `onUpdateQuestionState`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = onUpdateQuestionState;
      // $[23] 缓存 `question.multiSelect`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = question.multiSelect;
      // $[24] 缓存 `questionText`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = questionText;
      // $[25] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = t11;
    } else {
      // t11 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[25];
    }
    // t12 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t12;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[26] !== t10 || $[27] !== t11 || $[28] !== t9) {
      // t12 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t12 = {
        type: "input" as const,
        value: "__other__",
        label: "Other",
        placeholder: t9,
        initialValue: t10,
        onChange: t11
      };
      // $[26] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[26] = t10;
      // $[27] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[27] = t11;
      // $[28] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[28] = t9;
      // $[29] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[29] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[29];
    }
    // otherOption沿用 `t12` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
    const otherOption = t12;
    // t7 暂存 `[...textOptions, otherOption]` 生成的渲染片段，后续返回路径直接复用。
    t7 = [...textOptions, otherOption];
    // $[12] 缓存 `onUpdateQuestionState`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onUpdateQuestionState;
    // $[13] 缓存 `question`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = question;
    // $[14] 缓存 `questionStates`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = questionStates;
    // $[15] 缓存 `handleOpenEditor`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = handleOpenEditor;
    // $[16] 缓存 `questionText`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = questionText;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
  } else {
    // handleOpenEditor更新为 `$[15]`，确保权限确认界面后续读取最新状态。
    handleOpenEditor = $[15];
    // questionText更新为 `$[16]`，确保权限确认界面后续读取最新状态。
    questionText = $[16];
    // t7 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[17];
  }
  // 选项 命名 `t7`，让后续代码直接表达这个值的用途。
  const options = t7;
  // hasAnyPreview记录 `options.some` 是否成立，终端渲染随后按该结果分支。
  const hasAnyPreview = !question.multiSelect && question.options.some(_temp3);
  // 满足 `hasAnyPreview` 时，终端渲染执行该分支。
  if (hasAnyPreview) {
    // t8 暂存 `<PreviewQuestionView question={question} questions={quest...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[30] !== answers || $[31] !== currentQuestionIndex || $[32] !== hideSubmitTab || $[33] !== minContentHeight || $[34] !== minContentWidth || $[35] !== onAnswer || $[36] !== onCancel || $[37] !== onFinishPlanInterview || $[38] !== onRespondToClaude || $[39] !== onTabNext || $[40] !== onTabPrev || $[41] !== onTextInputFocus || $[42] !== onUpdateQuestionState || $[43] !== question || $[44] !== questionStates || $[45] !== questions) {
      // t8 暂存 `<PreviewQuestionView question={question} questions={quest...` 生成的渲染片段，后续返回路径直接复用。
      t8 = <PreviewQuestionView question={question} questions={questions} currentQuestionIndex={currentQuestionIndex} answers={answers} questionStates={questionStates} hideSubmitTab={hideSubmitTab} minContentHeight={minContentHeight} minContentWidth={minContentWidth} onUpdateQuestionState={onUpdateQuestionState} onAnswer={onAnswer} onTextInputFocus={onTextInputFocus} onCancel={onCancel} onTabPrev={onTabPrev} onTabNext={onTabNext} onRespondToClaude={onRespondToClaude} onFinishPlanInterview={onFinishPlanInterview} />;
      // $[30] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
      $[30] = answers;
      // $[31] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
      $[31] = currentQuestionIndex;
      // $[32] 缓存 `hideSubmitTab`，下次依赖未变时 React 编译产物可直接复用。
      $[32] = hideSubmitTab;
      // $[33] 缓存 `minContentHeight`，下次依赖未变时 React 编译产物可直接复用。
      $[33] = minContentHeight;
      // $[34] 缓存 `minContentWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[34] = minContentWidth;
      // $[35] 缓存 `onAnswer`，下次依赖未变时 React 编译产物可直接复用。
      $[35] = onAnswer;
      // $[36] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
      $[36] = onCancel;
      // $[37] 缓存 `onFinishPlanInterview`，下次依赖未变时 React 编译产物可直接复用。
      $[37] = onFinishPlanInterview;
      // $[38] 缓存 `onRespondToClaude`，下次依赖未变时 React 编译产物可直接复用。
      $[38] = onRespondToClaude;
      // $[39] 缓存 `onTabNext`，下次依赖未变时 React 编译产物可直接复用。
      $[39] = onTabNext;
      // $[40] 缓存 `onTabPrev`，下次依赖未变时 React 编译产物可直接复用。
      $[40] = onTabPrev;
      // $[41] 缓存 `onTextInputFocus`，下次依赖未变时 React 编译产物可直接复用。
      $[41] = onTextInputFocus;
      // $[42] 缓存 `onUpdateQuestionState`，下次依赖未变时 React 编译产物可直接复用。
      $[42] = onUpdateQuestionState;
      // $[43] 缓存 `question`，下次依赖未变时 React 编译产物可直接复用。
      $[43] = question;
      // $[44] 缓存 `questionStates`，下次依赖未变时 React 编译产物可直接复用。
      $[44] = questionStates;
      // $[45] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
      $[45] = questions;
      // $[46] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[46] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[46];
    }
    // 返回 `t8`，作为终端渲染这次计算的结果。
    return t8;
  }
  // t8 暂存 `isInPlanMode && planFilePath && <Box flexDirection="colum...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[47] !== isInPlanMode || $[48] !== planFilePath) {
    // t8 暂存 `isInPlanMode && planFilePath && <Box flexDirection="colum...` 生成的渲染片段，后续返回路径直接复用。
    t8 = isInPlanMode && planFilePath && <Box flexDirection="column" gap={0}><Divider color="inactive" /><Text color="inactive">Planning: <FilePathLink filePath={planFilePath} /></Text></Box>;
    // $[47] 缓存 `isInPlanMode`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = isInPlanMode;
    // $[48] 缓存 `planFilePath`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = planFilePath;
    // $[49] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[49] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[49];
  }
  // t9 暂存 `<Box marginTop={-1}><Divider color="inactive" /></Box>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[50] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `<Box marginTop={-1}><Divider color="inactive" /></Box>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box marginTop={-1}><Divider color="inactive" /></Box>;
    // $[50] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[50];
  }
  // t10 暂存 `<QuestionNavigationBar questions={questions} currentQuest...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[51] !== answers || $[52] !== currentQuestionIndex || $[53] !== hideSubmitTab || $[54] !== questions) {
    // t10 暂存 `<QuestionNavigationBar questions={questions} currentQuest...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <QuestionNavigationBar questions={questions} currentQuestionIndex={currentQuestionIndex} answers={answers} hideSubmitTab={hideSubmitTab} />;
    // $[51] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = answers;
    // $[52] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = currentQuestionIndex;
    // $[53] 缓存 `hideSubmitTab`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = hideSubmitTab;
    // $[54] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = questions;
    // $[55] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[55] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[55];
  }
  // t11 暂存 `<PermissionRequestTitle title={question.question} color="...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[56] !== question.question) {
    // t11 暂存 `<PermissionRequestTitle title={question.question} color="...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <PermissionRequestTitle title={question.question} color="text" />;
    // $[56] 缓存 `question.question`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = question.question;
    // $[57] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[57] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[57];
  }
  // t12 暂存 `<Box marginTop={1}>{question.multiSelect ? <SelectMulti k...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[58] !== currentQuestionIndex || $[59] !== handleFocus || $[60] !== handleOpenEditor || $[61] !== isFooterFocused || $[62] !== onAnswer || $[63] !== onCancel || $[64] !== onImagePaste || $[65] !== onRemoveImage || $[66] !== onSubmit || $[67] !== onUpdateQuestionState || $[68] !== options || $[69] !== pastedContents || $[70] !== question.multiSelect || $[71] !== question.question || $[72] !== questionStates || $[73] !== questionText || $[74] !== questions.length) {
    // t12 暂存 `<Box marginTop={1}>{question.multiSelect ? <SelectMulti k...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Box marginTop={1}>{question.multiSelect ? <SelectMulti key={question.question} options={options} defaultValue={questionStates[question.question]?.selectedValue as string[] | undefined} onChange={values => {
        // 调用 onUpdateQuestionState，触发终端渲染此处需要的副作用。
        onUpdateQuestionState(questionText, {
          selectedValue: values
        }, true);
        // textInput筛选`values.includes`，供终端渲染后续处理使用。
        const textInput = values.includes("__other__") ? questionStates[questionText]?.textInputValue : undefined;
        // finalValues 集合筛选`values.filter`，供终端渲染后续处理使用。
        const finalValues = values.filter(_temp4).concat(textInput ? [textInput] : []);
        // 调用 onAnswer，触发终端渲染此处需要的副作用。
        onAnswer(questionText, finalValues, undefined, false);
      // 这个回调绑定到 }} onFocus={handleFocus} onCancel={onCancel} submitButtonText={currentQuestionIndex …，负责终端渲染在该局部场景下的响应。
      }} onFocus={handleFocus} onCancel={onCancel} submitButtonText={currentQuestionIndex === questions.length - 1 ? "Submit" : "Next"} onSubmit={onSubmit} onDownFromLastItem={handleDownFromLastItem} isDisabled={isFooterFocused} onOpenEditor={handleOpenEditor} onImagePaste={onImagePaste} pastedContents={pastedContents} onRemoveImage={onRemoveImage} /> : <Select key={question.question} options={options} defaultValue={questionStates[question.question]?.selectedValue as string | undefined} onChange={value_1 => {
        // 调用 onUpdateQuestionState，触发终端渲染此处需要的副作用。
        onUpdateQuestionState(questionText, {
          selectedValue: value_1
        }, false);
        // textInput_0标记终端渲染权限确认界面 Question View是否启用对应路径。
        const textInput_0 = value_1 === "__other__" ? questionStates[questionText]?.textInputValue : undefined;
        // 调用 onAnswer，触发终端渲染此处需要的副作用。
        onAnswer(questionText, value_1, textInput_0);
      }} onFocus={handleFocus} onCancel={onCancel} onDownFromLastItem={handleDownFromLastItem} isDisabled={isFooterFocused} layout="compact-vertical" onOpenEditor={handleOpenEditor} onImagePaste={onImagePaste} pastedContents={pastedContents} onRemoveImage={onRemoveImage} />}</Box>;
    // $[58] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = currentQuestionIndex;
    // $[59] 缓存 `handleFocus`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = handleFocus;
    // $[60] 缓存 `handleOpenEditor`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = handleOpenEditor;
    // $[61] 缓存 `isFooterFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = isFooterFocused;
    // $[62] 缓存 `onAnswer`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = onAnswer;
    // $[63] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = onCancel;
    // $[64] 缓存 `onImagePaste`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = onImagePaste;
    // $[65] 缓存 `onRemoveImage`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = onRemoveImage;
    // $[66] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = onSubmit;
    // $[67] 缓存 `onUpdateQuestionState`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = onUpdateQuestionState;
    // $[68] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = options;
    // $[69] 缓存 `pastedContents`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = pastedContents;
    // $[70] 缓存 `question.multiSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[70] = question.multiSelect;
    // $[71] 缓存 `question.question`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = question.question;
    // $[72] 缓存 `questionStates`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = questionStates;
    // $[73] 缓存 `questionText`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = questionText;
    // $[74] 缓存 `questions.length`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = questions.length;
    // $[75] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[75] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[75] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[75];
  }
  // t13 暂存 `<Divider color="inactive" />` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[76] === Symbol.for("react.memo_cache_sentinel")) {
    // t13 暂存 `<Divider color="inactive" />` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Divider color="inactive" />;
    // $[76] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[76] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[76] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[76];
  }
  // t14 暂存 `isFooterFocused && footerIndex === 0 ? <Text color="sugge...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[77] !== footerIndex || $[78] !== isFooterFocused) {
    // t14 暂存 `isFooterFocused && footerIndex === 0 ? <Text color="sugge...` 生成的渲染片段，后续返回路径直接复用。
    t14 = isFooterFocused && footerIndex === 0 ? <Text color="suggestion">{figures.pointer}</Text> : <Text> </Text>;
    // $[77] 缓存 `footerIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[77] = footerIndex;
    // $[78] 缓存 `isFooterFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[78] = isFooterFocused;
    // $[79] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[79] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[79] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[79];
  }
  // t15标记终端渲染权限确认界面 Question View是否启用对应路径。
  const t15 = isFooterFocused && footerIndex === 0 ? "suggestion" : undefined;
  // t16记录 `options.length + 1` 是否成立，下一步按该结果分支。
  const t16 = options.length + 1;
  // t17 暂存 `<Text color={t15}>{t16}. Chat about this</Text>` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[80] !== t15 || $[81] !== t16) {
    // t17 暂存 `<Text color={t15}>{t16}. Chat about this</Text>` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Text color={t15}>{t16}. Chat about this</Text>;
    // $[80] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[80] = t15;
    // $[81] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[81] = t16;
    // $[82] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[82] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[82] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[82];
  }
  // t18 暂存 `<Box flexDirection="row" gap={1}>{t14}{t17}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[83] !== t14 || $[84] !== t17) {
    // t18 暂存 `<Box flexDirection="row" gap={1}>{t14}{t17}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Box flexDirection="row" gap={1}>{t14}{t17}</Box>;
    // $[83] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[83] = t14;
    // $[84] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[84] = t17;
    // $[85] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[85] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[85] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[85];
  }
  // t19 暂存 `isInPlanMode && <Box flexDirection="row" gap={1}>{isFoote...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[86] !== footerIndex || $[87] !== isFooterFocused || $[88] !== isInPlanMode || $[89] !== options.length) {
    // t19 暂存 `isInPlanMode && <Box flexDirection="row" gap={1}>{isFoote...` 生成的渲染片段，后续返回路径直接复用。
    t19 = isInPlanMode && <Box flexDirection="row" gap={1}>{isFooterFocused && footerIndex === 1 ? <Text color="suggestion">{figures.pointer}</Text> : <Text> </Text>}<Text color={isFooterFocused && footerIndex === 1 ? "suggestion" : undefined}>{options.length + 2}. Skip interview and plan immediately</Text></Box>;
    // $[86] 缓存 `footerIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[86] = footerIndex;
    // $[87] 缓存 `isFooterFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[87] = isFooterFocused;
    // $[88] 缓存 `isInPlanMode`，下次依赖未变时 React 编译产物可直接复用。
    $[88] = isInPlanMode;
    // $[89] 缓存 `options.length`，下次依赖未变时 React 编译产物可直接复用。
    $[89] = options.length;
    // $[90] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[90] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[90] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[90];
  }
  // t20 暂存 `<Box flexDirection="column">{t13}{t18}{t19}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[91] !== t18 || $[92] !== t19) {
    // t20 暂存 `<Box flexDirection="column">{t13}{t18}{t19}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t20 = <Box flexDirection="column">{t13}{t18}{t19}</Box>;
    // $[91] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[91] = t18;
    // $[92] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[92] = t19;
    // $[93] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[93] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[93] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[93];
  }
  // t21 暂存 `questions.length === 1 ? <>{figures.arrowUp}/{figures.arr...` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[94] !== questions.length) {
    // t21 暂存 `questions.length === 1 ? <>{figures.arrowUp}/{figures.arr...` 生成的渲染片段，后续返回路径直接复用。
    t21 = questions.length === 1 ? <>{figures.arrowUp}/{figures.arrowDown} to navigate</> : "Tab/Arrow keys to navigate";
    // $[94] 缓存 `questions.length`，下次依赖未变时 React 编译产物可直接复用。
    $[94] = questions.length;
    // $[95] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[95] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[95] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[95];
  }
  // t22 暂存 `isOtherFocused && editorName && <> · ctrl+g to edit in {e...` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[96] !== isOtherFocused) {
    // t22 暂存 `isOtherFocused && editorName && <> · ctrl+g to edit in {e...` 生成的渲染片段，后续返回路径直接复用。
    t22 = isOtherFocused && editorName && <> · ctrl+g to edit in {editorName}</>;
    // $[96] 缓存 `isOtherFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[96] = isOtherFocused;
    // $[97] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[97] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[97] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[97];
  }
  // t23 暂存 `<Box marginTop={1}><Text color="inactive" dimColor={true}...` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[98] !== t21 || $[99] !== t22) {
    // t23 暂存 `<Box marginTop={1}><Text color="inactive" dimColor={true}...` 生成的渲染片段，后续返回路径直接复用。
    t23 = <Box marginTop={1}><Text color="inactive" dimColor={true}>Enter to select ·{" "}{t21}{t22}{" "}· Esc to cancel</Text></Box>;
    // $[98] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[98] = t21;
    // $[99] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[99] = t22;
    // $[100] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[100] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[100] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[100];
  }
  // t24 暂存 `<Box flexDirection="column" minHeight={minContentHeight}>...` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[101] !== minContentHeight || $[102] !== t12 || $[103] !== t20 || $[104] !== t23) {
    // t24 暂存 `<Box flexDirection="column" minHeight={minContentHeight}>...` 生成的渲染片段，后续返回路径直接复用。
    t24 = <Box flexDirection="column" minHeight={minContentHeight}>{t12}{t20}{t23}</Box>;
    // $[101] 缓存 `minContentHeight`，下次依赖未变时 React 编译产物可直接复用。
    $[101] = minContentHeight;
    // $[102] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[102] = t12;
    // $[103] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[103] = t20;
    // $[104] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[104] = t23;
    // $[105] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[105] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[105] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[105];
  }
  // t25 暂存 `<Box flexDirection="column" paddingTop={0}>{t10}{t11}{t24...` 的派生结果，便于缓存命中时直接复用。
  let t25;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[106] !== t10 || $[107] !== t11 || $[108] !== t24) {
    // t25 暂存 `<Box flexDirection="column" paddingTop={0}>{t10}{t11}{t24...` 生成的渲染片段，后续返回路径直接复用。
    t25 = <Box flexDirection="column" paddingTop={0}>{t10}{t11}{t24}</Box>;
    // $[106] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[106] = t10;
    // $[107] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[107] = t11;
    // $[108] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[108] = t24;
    // $[109] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[109] = t25;
  } else {
    // t25 从 React 编译缓存槽 $[109] 取回渲染片段，避免依赖未变时重建 JSX。
    t25 = $[109];
  }
  // t26 暂存 `<Box flexDirection="column" marginTop={0} tabIndex={0} au...` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[110] !== handleKeyDown || $[111] !== t25 || $[112] !== t8) {
    // t26 暂存 `<Box flexDirection="column" marginTop={0} tabIndex={0} au...` 生成的渲染片段，后续返回路径直接复用。
    t26 = <Box flexDirection="column" marginTop={0} tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t8}{t9}{t25}</Box>;
    // $[110] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[110] = handleKeyDown;
    // $[111] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[111] = t25;
    // $[112] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[112] = t8;
    // $[113] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[113] = t26;
  } else {
    // t26 从 React 编译缓存槽 $[113] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[113];
  }
  // 返回 `t26`，作为终端渲染这次计算的结果。
  return t26;
}
// _temp4 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(v) {
  // 返回 `v !== "__other__"`，作为终端渲染这次计算的结果。
  return v !== "__other__";
}
// _temp3 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(opt_0) {
  // 返回 `opt_0.preview`，作为终端渲染这次计算的结果。
  return opt_0.preview;
}
// _temp2 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(opt) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    type: "text" as const,
    value: opt.label,
    label: opt.label,
    description: opt.description
  };
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.toolPermissionContext.mode`，作为终端渲染这次计算的结果。
  return s.toolPermissionContext.mode;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VDYWxsYmFjayIsInVzZVN0YXRlIiwiS2V5Ym9hcmRFdmVudCIsIkJveCIsIlRleHQiLCJ1c2VBcHBTdGF0ZSIsIlF1ZXN0aW9uIiwiUXVlc3Rpb25PcHRpb24iLCJQYXN0ZWRDb250ZW50IiwiZ2V0RXh0ZXJuYWxFZGl0b3IiLCJ0b0lERURpc3BsYXlOYW1lIiwiSW1hZ2VEaW1lbnNpb25zIiwiZWRpdFByb21wdEluRWRpdG9yIiwiT3B0aW9uV2l0aERlc2NyaXB0aW9uIiwiU2VsZWN0IiwiU2VsZWN0TXVsdGkiLCJEaXZpZGVyIiwiRmlsZVBhdGhMaW5rIiwiUGVybWlzc2lvblJlcXVlc3RUaXRsZSIsIlByZXZpZXdRdWVzdGlvblZpZXciLCJRdWVzdGlvbk5hdmlnYXRpb25CYXIiLCJRdWVzdGlvblN0YXRlIiwiUHJvcHMiLCJxdWVzdGlvbiIsInF1ZXN0aW9ucyIsImN1cnJlbnRRdWVzdGlvbkluZGV4IiwiYW5zd2VycyIsIlJlY29yZCIsInF1ZXN0aW9uU3RhdGVzIiwiaGlkZVN1Ym1pdFRhYiIsInBsYW5GaWxlUGF0aCIsInBhc3RlZENvbnRlbnRzIiwibWluQ29udGVudEhlaWdodCIsIm1pbkNvbnRlbnRXaWR0aCIsIm9uVXBkYXRlUXVlc3Rpb25TdGF0ZSIsInF1ZXN0aW9uVGV4dCIsInVwZGF0ZXMiLCJQYXJ0aWFsIiwiaXNNdWx0aVNlbGVjdCIsIm9uQW5zd2VyIiwibGFiZWwiLCJ0ZXh0SW5wdXQiLCJzaG91bGRBZHZhbmNlIiwib25UZXh0SW5wdXRGb2N1cyIsImlzSW5JbnB1dCIsIm9uQ2FuY2VsIiwib25TdWJtaXQiLCJvblRhYlByZXYiLCJvblRhYk5leHQiLCJvblJlc3BvbmRUb0NsYXVkZSIsIm9uRmluaXNoUGxhbkludGVydmlldyIsIm9uSW1hZ2VQYXN0ZSIsImJhc2U2NEltYWdlIiwibWVkaWFUeXBlIiwiZmlsZW5hbWUiLCJkaW1lbnNpb25zIiwic291cmNlUGF0aCIsIm9uUmVtb3ZlSW1hZ2UiLCJpZCIsIlF1ZXN0aW9uVmlldyIsInQwIiwiJCIsIl9jIiwidDEiLCJ1bmRlZmluZWQiLCJpc0luUGxhbk1vZGUiLCJfdGVtcCIsImlzRm9vdGVyRm9jdXNlZCIsInNldElzRm9vdGVyRm9jdXNlZCIsImZvb3RlckluZGV4Iiwic2V0Rm9vdGVySW5kZXgiLCJpc090aGVyRm9jdXNlZCIsInNldElzT3RoZXJGb2N1c2VkIiwidDIiLCJTeW1ib2wiLCJmb3IiLCJlZGl0b3IiLCJlZGl0b3JOYW1lIiwidDMiLCJ2YWx1ZSIsImlzT3RoZXIiLCJoYW5kbGVGb2N1cyIsInQ0IiwiaGFuZGxlRG93bkZyb21MYXN0SXRlbSIsInQ1IiwiaGFuZGxlVXBGcm9tRm9vdGVyIiwidDYiLCJlIiwia2V5IiwiY3RybCIsInByZXZlbnREZWZhdWx0IiwiaGFuZGxlS2V5RG93biIsImhhbmRsZU9wZW5FZGl0b3IiLCJ0NyIsInRleHRPcHRpb25zIiwib3B0aW9ucyIsIm1hcCIsIl90ZW1wMiIsInF1ZXN0aW9uU3RhdGUiLCJ0OCIsIm11bHRpU2VsZWN0IiwiY3VycmVudFZhbHVlIiwic2V0VmFsdWUiLCJyZXN1bHQiLCJjb250ZW50IiwidGV4dElucHV0VmFsdWUiLCJ0OSIsInQxMCIsInQxMSIsInZhbHVlXzAiLCJ0MTIiLCJ0eXBlIiwiY29uc3QiLCJwbGFjZWhvbGRlciIsImluaXRpYWxWYWx1ZSIsIm9uQ2hhbmdlIiwib3RoZXJPcHRpb24iLCJoYXNBbnlQcmV2aWV3Iiwic29tZSIsIl90ZW1wMyIsImxlbmd0aCIsInNlbGVjdGVkVmFsdWUiLCJ2YWx1ZXMiLCJpbmNsdWRlcyIsImZpbmFsVmFsdWVzIiwiZmlsdGVyIiwiX3RlbXA0IiwiY29uY2F0IiwidmFsdWVfMSIsInRleHRJbnB1dF8wIiwidDEzIiwidDE0IiwicG9pbnRlciIsInQxNSIsInQxNiIsInQxNyIsInQxOCIsInQxOSIsInQyMCIsInQyMSIsImFycm93VXAiLCJhcnJvd0Rvd24iLCJ0MjIiLCJ0MjMiLCJ0MjQiLCJ0MjUiLCJ0MjYiLCJ2Iiwib3B0XzAiLCJvcHQiLCJwcmV2aWV3IiwiZGVzY3JpcHRpb24iLCJzIiwidG9vbFBlcm1pc3Npb25Db250ZXh0IiwibW9kZSJdLCJzb3VyY2VzIjpbIlF1ZXN0aW9uVmlldy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgS2V5Ym9hcmRFdmVudCB9IGZyb20gJy4uLy4uLy4uL2luay9ldmVudHMva2V5Ym9hcmQtZXZlbnQuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSB9IGZyb20gJy4uLy4uLy4uL3N0YXRlL0FwcFN0YXRlLmpzJ1xuaW1wb3J0IHR5cGUge1xuICBRdWVzdGlvbixcbiAgUXVlc3Rpb25PcHRpb24sXG59IGZyb20gJy4uLy4uLy4uL3Rvb2xzL0Fza1VzZXJRdWVzdGlvblRvb2wvQXNrVXNlclF1ZXN0aW9uVG9vbC5qcydcbmltcG9ydCB0eXBlIHsgUGFzdGVkQ29udGVudCB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGdldEV4dGVybmFsRWRpdG9yIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvZWRpdG9yLmpzJ1xuaW1wb3J0IHsgdG9JREVEaXNwbGF5TmFtZSB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2lkZS5qcydcbmltcG9ydCB0eXBlIHsgSW1hZ2VEaW1lbnNpb25zIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvaW1hZ2VSZXNpemVyLmpzJ1xuaW1wb3J0IHsgZWRpdFByb21wdEluRWRpdG9yIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcHJvbXB0RWRpdG9yLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBPcHRpb25XaXRoRGVzY3JpcHRpb24sXG4gIFNlbGVjdCxcbiAgU2VsZWN0TXVsdGksXG59IGZyb20gJy4uLy4uL0N1c3RvbVNlbGVjdC9pbmRleC5qcydcbmltcG9ydCB7IERpdmlkZXIgfSBmcm9tICcuLi8uLi9kZXNpZ24tc3lzdGVtL0RpdmlkZXIuanMnXG5pbXBvcnQgeyBGaWxlUGF0aExpbmsgfSBmcm9tICcuLi8uLi9GaWxlUGF0aExpbmsuanMnXG5pbXBvcnQgeyBQZXJtaXNzaW9uUmVxdWVzdFRpdGxlIH0gZnJvbSAnLi4vUGVybWlzc2lvblJlcXVlc3RUaXRsZS5qcydcbmltcG9ydCB7IFByZXZpZXdRdWVzdGlvblZpZXcgfSBmcm9tICcuL1ByZXZpZXdRdWVzdGlvblZpZXcuanMnXG5pbXBvcnQgeyBRdWVzdGlvbk5hdmlnYXRpb25CYXIgfSBmcm9tICcuL1F1ZXN0aW9uTmF2aWdhdGlvbkJhci5qcydcbmltcG9ydCB0eXBlIHsgUXVlc3Rpb25TdGF0ZSB9IGZyb20gJy4vdXNlLW11bHRpcGxlLWNob2ljZS1zdGF0ZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgcXVlc3Rpb246IFF1ZXN0aW9uXG4gIHF1ZXN0aW9uczogUXVlc3Rpb25bXVxuICBjdXJyZW50UXVlc3Rpb25JbmRleDogbnVtYmVyXG4gIGFuc3dlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbiAgcXVlc3Rpb25TdGF0ZXM6IFJlY29yZDxzdHJpbmcsIFF1ZXN0aW9uU3RhdGU+XG4gIGhpZGVTdWJtaXRUYWI/OiBib29sZWFuXG4gIHBsYW5GaWxlUGF0aD86IHN0cmluZ1xuICBwYXN0ZWRDb250ZW50cz86IFJlY29yZDxudW1iZXIsIFBhc3RlZENvbnRlbnQ+XG4gIG1pbkNvbnRlbnRIZWlnaHQ/OiBudW1iZXJcbiAgbWluQ29udGVudFdpZHRoPzogbnVtYmVyXG4gIG9uVXBkYXRlUXVlc3Rpb25TdGF0ZTogKFxuICAgIHF1ZXN0aW9uVGV4dDogc3RyaW5nLFxuICAgIHVwZGF0ZXM6IFBhcnRpYWw8UXVlc3Rpb25TdGF0ZT4sXG4gICAgaXNNdWx0aVNlbGVjdDogYm9vbGVhbixcbiAgKSA9PiB2b2lkXG4gIG9uQW5zd2VyOiAoXG4gICAgcXVlc3Rpb25UZXh0OiBzdHJpbmcsXG4gICAgbGFiZWw6IHN0cmluZyB8IHN0cmluZ1tdLFxuICAgIHRleHRJbnB1dD86IHN0cmluZyxcbiAgICBzaG91bGRBZHZhbmNlPzogYm9vbGVhbixcbiAgKSA9PiB2b2lkXG4gIG9uVGV4dElucHV0Rm9jdXM6IChpc0luSW5wdXQ6IGJvb2xlYW4pID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbiAgb25TdWJtaXQ6ICgpID0+IHZvaWRcbiAgb25UYWJQcmV2PzogKCkgPT4gdm9pZFxuICBvblRhYk5leHQ/OiAoKSA9PiB2b2lkXG4gIG9uUmVzcG9uZFRvQ2xhdWRlOiAoKSA9PiB2b2lkXG4gIG9uRmluaXNoUGxhbkludGVydmlldzogKCkgPT4gdm9pZFxuICBvbkltYWdlUGFzdGU/OiAoXG4gICAgYmFzZTY0SW1hZ2U6IHN0cmluZyxcbiAgICBtZWRpYVR5cGU/OiBzdHJpbmcsXG4gICAgZmlsZW5hbWU/OiBzdHJpbmcsXG4gICAgZGltZW5zaW9ucz86IEltYWdlRGltZW5zaW9ucyxcbiAgICBzb3VyY2VQYXRoPzogc3RyaW5nLFxuICApID0+IHZvaWRcbiAgb25SZW1vdmVJbWFnZT86IChpZDogbnVtYmVyKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBRdWVzdGlvblZpZXcoe1xuICBxdWVzdGlvbixcbiAgcXVlc3Rpb25zLFxuICBjdXJyZW50UXVlc3Rpb25JbmRleCxcbiAgYW5zd2VycyxcbiAgcXVlc3Rpb25TdGF0ZXMsXG4gIGhpZGVTdWJtaXRUYWIgPSBmYWxzZSxcbiAgcGxhbkZpbGVQYXRoLFxuICBtaW5Db250ZW50SGVpZ2h0LFxuICBtaW5Db250ZW50V2lkdGgsXG4gIG9uVXBkYXRlUXVlc3Rpb25TdGF0ZSxcbiAgb25BbnN3ZXIsXG4gIG9uVGV4dElucHV0Rm9jdXMsXG4gIG9uQ2FuY2VsLFxuICBvblN1Ym1pdCxcbiAgb25UYWJQcmV2LFxuICBvblRhYk5leHQsXG4gIG9uUmVzcG9uZFRvQ2xhdWRlLFxuICBvbkZpbmlzaFBsYW5JbnRlcnZpZXcsXG4gIG9uSW1hZ2VQYXN0ZSxcbiAgcGFzdGVkQ29udGVudHMsXG4gIG9uUmVtb3ZlSW1hZ2UsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGlzSW5QbGFuTW9kZSA9IHVzZUFwcFN0YXRlKHMgPT4gcy50b29sUGVybWlzc2lvbkNvbnRleHQubW9kZSkgPT09ICdwbGFuJ1xuICBjb25zdCBbaXNGb290ZXJGb2N1c2VkLCBzZXRJc0Zvb3RlckZvY3VzZWRdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtmb290ZXJJbmRleCwgc2V0Rm9vdGVySW5kZXhdID0gdXNlU3RhdGUoMClcbiAgY29uc3QgW2lzT3RoZXJGb2N1c2VkLCBzZXRJc090aGVyRm9jdXNlZF0gPSB1c2VTdGF0ZShmYWxzZSlcblxuICBjb25zdCBlZGl0b3IgPSBnZXRFeHRlcm5hbEVkaXRvcigpXG4gIGNvbnN0IGVkaXRvck5hbWUgPSBlZGl0b3IgPyB0b0lERURpc3BsYXlOYW1lKGVkaXRvcikgOiBudWxsXG5cbiAgY29uc3QgaGFuZGxlRm9jdXMgPSB1c2VDYWxsYmFjayhcbiAgICAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgaXNPdGhlciA9IHZhbHVlID09PSAnX19vdGhlcl9fJ1xuICAgICAgc2V0SXNPdGhlckZvY3VzZWQoaXNPdGhlcilcbiAgICAgIG9uVGV4dElucHV0Rm9jdXMoaXNPdGhlcilcbiAgICB9LFxuICAgIFtvblRleHRJbnB1dEZvY3VzXSxcbiAgKVxuXG4gIGNvbnN0IGhhbmRsZURvd25Gcm9tTGFzdEl0ZW0gPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgc2V0SXNGb290ZXJGb2N1c2VkKHRydWUpXG4gIH0sIFtdKVxuXG4gIGNvbnN0IGhhbmRsZVVwRnJvbUZvb3RlciA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRJc0Zvb3RlckZvY3VzZWQoZmFsc2UpXG4gIH0sIFtdKVxuXG4gIC8vIEhhbmRsZSBrZXlib2FyZCBpbnB1dCB3aGVuIGZvb3RlciBpcyBmb2N1c2VkXG4gIGNvbnN0IGhhbmRsZUtleURvd24gPSB1c2VDYWxsYmFjayhcbiAgICAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgaWYgKCFpc0Zvb3RlckZvY3VzZWQpIHJldHVyblxuXG4gICAgICBpZiAoZS5rZXkgPT09ICd1cCcgfHwgKGUuY3RybCAmJiBlLmtleSA9PT0gJ3AnKSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgaWYgKGZvb3RlckluZGV4ID09PSAwKSB7XG4gICAgICAgICAgaGFuZGxlVXBGcm9tRm9vdGVyKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRGb290ZXJJbmRleCgwKVxuICAgICAgICB9XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAoZS5rZXkgPT09ICdkb3duJyB8fCAoZS5jdHJsICYmIGUua2V5ID09PSAnbicpKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBpZiAoaXNJblBsYW5Nb2RlICYmIGZvb3RlckluZGV4ID09PSAwKSB7XG4gICAgICAgICAgc2V0Rm9vdGVySW5kZXgoMSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKGUua2V5ID09PSAncmV0dXJuJykge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgaWYgKGZvb3RlckluZGV4ID09PSAwKSB7XG4gICAgICAgICAgb25SZXNwb25kVG9DbGF1ZGUoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9uRmluaXNoUGxhbkludGVydmlldygpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmIChlLmtleSA9PT0gJ2VzY2FwZScpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIG9uQ2FuY2VsKClcbiAgICAgIH1cbiAgICB9LFxuICAgIFtcbiAgICAgIGlzRm9vdGVyRm9jdXNlZCxcbiAgICAgIGZvb3RlckluZGV4LFxuICAgICAgaXNJblBsYW5Nb2RlLFxuICAgICAgaGFuZGxlVXBGcm9tRm9vdGVyLFxuICAgICAgb25SZXNwb25kVG9DbGF1ZGUsXG4gICAgICBvbkZpbmlzaFBsYW5JbnRlcnZpZXcsXG4gICAgICBvbkNhbmNlbCxcbiAgICBdLFxuICApXG5cbiAgY29uc3QgdGV4dE9wdGlvbnM6IE9wdGlvbldpdGhEZXNjcmlwdGlvbjxzdHJpbmc+W10gPSBxdWVzdGlvbi5vcHRpb25zLm1hcChcbiAgICAob3B0OiBRdWVzdGlvbk9wdGlvbikgPT4gKHtcbiAgICAgIHR5cGU6ICd0ZXh0JyBhcyBjb25zdCxcbiAgICAgIHZhbHVlOiBvcHQubGFiZWwsXG4gICAgICBsYWJlbDogb3B0LmxhYmVsLFxuICAgICAgZGVzY3JpcHRpb246IG9wdC5kZXNjcmlwdGlvbixcbiAgICB9KSxcbiAgKVxuXG4gIGNvbnN0IHF1ZXN0aW9uVGV4dCA9IHF1ZXN0aW9uLnF1ZXN0aW9uXG4gIGNvbnN0IHF1ZXN0aW9uU3RhdGUgPSBxdWVzdGlvblN0YXRlc1txdWVzdGlvblRleHRdXG5cbiAgY29uc3QgaGFuZGxlT3BlbkVkaXRvciA9IHVzZUNhbGxiYWNrKFxuICAgIGFzeW5jIChjdXJyZW50VmFsdWU6IHN0cmluZywgc2V0VmFsdWU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBlZGl0UHJvbXB0SW5FZGl0b3IoY3VycmVudFZhbHVlKVxuXG4gICAgICBpZiAocmVzdWx0LmNvbnRlbnQgIT09IG51bGwgJiYgcmVzdWx0LmNvbnRlbnQgIT09IGN1cnJlbnRWYWx1ZSkge1xuICAgICAgICAvLyBVcGRhdGUgdGhlIFNlbGVjdCdzIGludGVybmFsIHN0YXRlIGZvciBpbW1lZGlhdGUgVUkgdXBkYXRlXG4gICAgICAgIHNldFZhbHVlKHJlc3VsdC5jb250ZW50KVxuICAgICAgICAvLyBBbHNvIHVwZGF0ZSB0aGUgcXVlc3Rpb24gc3RhdGUgZm9yIHBlcnNpc3RlbmNlXG4gICAgICAgIG9uVXBkYXRlUXVlc3Rpb25TdGF0ZShcbiAgICAgICAgICBxdWVzdGlvblRleHQsXG4gICAgICAgICAgeyB0ZXh0SW5wdXRWYWx1ZTogcmVzdWx0LmNvbnRlbnQgfSxcbiAgICAgICAgICBxdWVzdGlvbi5tdWx0aVNlbGVjdCA/PyBmYWxzZSxcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH0sXG4gICAgW3F1ZXN0aW9uVGV4dCwgb25VcGRhdGVRdWVzdGlvblN0YXRlLCBxdWVzdGlvbi5tdWx0aVNlbGVjdF0sXG4gIClcblxuICBjb25zdCBvdGhlck9wdGlvbjogT3B0aW9uV2l0aERlc2NyaXB0aW9uPHN0cmluZz4gPSB7XG4gICAgdHlwZTogJ2lucHV0JyBhcyBjb25zdCxcbiAgICB2YWx1ZTogJ19fb3RoZXJfXycsXG4gICAgbGFiZWw6ICdPdGhlcicsXG4gICAgcGxhY2Vob2xkZXI6IHF1ZXN0aW9uLm11bHRpU2VsZWN0ID8gJ1R5cGUgc29tZXRoaW5nJyA6ICdUeXBlIHNvbWV0aGluZy4nLFxuICAgIGluaXRpYWxWYWx1ZTogcXVlc3Rpb25TdGF0ZT8udGV4dElucHV0VmFsdWUgPz8gJycsXG4gICAgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICBvblVwZGF0ZVF1ZXN0aW9uU3RhdGUoXG4gICAgICAgIHF1ZXN0aW9uVGV4dCxcbiAgICAgICAgeyB0ZXh0SW5wdXRWYWx1ZTogdmFsdWUgfSxcbiAgICAgICAgcXVlc3Rpb24ubXVsdGlTZWxlY3QgPz8gZmFsc2UsXG4gICAgICApXG4gICAgfSxcbiAgfVxuXG4gIGNvbnN0IG9wdGlvbnMgPSBbLi4udGV4dE9wdGlvbnMsIG90aGVyT3B0aW9uXVxuXG4gIC8vIENoZWNrIGlmIGFueSBvcHRpb24gaGFzIGEgcHJldmlldyBhbmQgaXQncyBub3QgbXVsdGktc2VsZWN0XG4gIC8vIFByZXZpZXdzIG9ubHkgc3VwcG9ydGVkIGZvciBzaW5nbGUtc2VsZWN0IHF1ZXN0aW9uc1xuICBjb25zdCBoYXNBbnlQcmV2aWV3ID1cbiAgICAhcXVlc3Rpb24ubXVsdGlTZWxlY3QgJiYgcXVlc3Rpb24ub3B0aW9ucy5zb21lKG9wdCA9PiBvcHQucHJldmlldylcblxuICAvLyBEZWxlZ2F0ZSB0byBQcmV2aWV3UXVlc3Rpb25WaWV3IGZvciBjYXJvdXNlbC1zdHlsZSBwcmV2aWV3IG1vZGVcbiAgaWYgKGhhc0FueVByZXZpZXcpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPFByZXZpZXdRdWVzdGlvblZpZXdcbiAgICAgICAgcXVlc3Rpb249e3F1ZXN0aW9ufVxuICAgICAgICBxdWVzdGlvbnM9e3F1ZXN0aW9uc31cbiAgICAgICAgY3VycmVudFF1ZXN0aW9uSW5kZXg9e2N1cnJlbnRRdWVzdGlvbkluZGV4fVxuICAgICAgICBhbnN3ZXJzPXthbnN3ZXJzfVxuICAgICAgICBxdWVzdGlvblN0YXRlcz17cXVlc3Rpb25TdGF0ZXN9XG4gICAgICAgIGhpZGVTdWJtaXRUYWI9e2hpZGVTdWJtaXRUYWJ9XG4gICAgICAgIG1pbkNvbnRlbnRIZWlnaHQ9e21pbkNvbnRlbnRIZWlnaHR9XG4gICAgICAgIG1pbkNvbnRlbnRXaWR0aD17bWluQ29udGVudFdpZHRofVxuICAgICAgICBvblVwZGF0ZVF1ZXN0aW9uU3RhdGU9e29uVXBkYXRlUXVlc3Rpb25TdGF0ZX1cbiAgICAgICAgb25BbnN3ZXI9e29uQW5zd2VyfVxuICAgICAgICBvblRleHRJbnB1dEZvY3VzPXtvblRleHRJbnB1dEZvY3VzfVxuICAgICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICAgIG9uVGFiUHJldj17b25UYWJQcmV2fVxuICAgICAgICBvblRhYk5leHQ9e29uVGFiTmV4dH1cbiAgICAgICAgb25SZXNwb25kVG9DbGF1ZGU9e29uUmVzcG9uZFRvQ2xhdWRlfVxuICAgICAgICBvbkZpbmlzaFBsYW5JbnRlcnZpZXc9e29uRmluaXNoUGxhbkludGVydmlld31cbiAgICAgIC8+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94XG4gICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgIG1hcmdpblRvcD17MH1cbiAgICAgIHRhYkluZGV4PXswfVxuICAgICAgYXV0b0ZvY3VzXG4gICAgICBvbktleURvd249e2hhbmRsZUtleURvd259XG4gICAgPlxuICAgICAge2lzSW5QbGFuTW9kZSAmJiBwbGFuRmlsZVBhdGggJiYgKFxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezB9PlxuICAgICAgICAgIDxEaXZpZGVyIGNvbG9yPVwiaW5hY3RpdmVcIiAvPlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiaW5hY3RpdmVcIj5cbiAgICAgICAgICAgIFBsYW5uaW5nOiA8RmlsZVBhdGhMaW5rIGZpbGVQYXRoPXtwbGFuRmlsZVBhdGh9IC8+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgICA8Qm94IG1hcmdpblRvcD17LTF9PlxuICAgICAgICA8RGl2aWRlciBjb2xvcj1cImluYWN0aXZlXCIgLz5cbiAgICAgIDwvQm94PlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgcGFkZGluZ1RvcD17MH0+XG4gICAgICAgIDxRdWVzdGlvbk5hdmlnYXRpb25CYXJcbiAgICAgICAgICBxdWVzdGlvbnM9e3F1ZXN0aW9uc31cbiAgICAgICAgICBjdXJyZW50UXVlc3Rpb25JbmRleD17Y3VycmVudFF1ZXN0aW9uSW5kZXh9XG4gICAgICAgICAgYW5zd2Vycz17YW5zd2Vyc31cbiAgICAgICAgICBoaWRlU3VibWl0VGFiPXtoaWRlU3VibWl0VGFifVxuICAgICAgICAvPlxuICAgICAgICA8UGVybWlzc2lvblJlcXVlc3RUaXRsZSB0aXRsZT17cXVlc3Rpb24ucXVlc3Rpb259IGNvbG9yPXsndGV4dCd9IC8+XG5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWluSGVpZ2h0PXttaW5Db250ZW50SGVpZ2h0fT5cbiAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICB7cXVlc3Rpb24ubXVsdGlTZWxlY3QgPyAoXG4gICAgICAgICAgICAgIDxTZWxlY3RNdWx0aVxuICAgICAgICAgICAgICAgIGtleT17cXVlc3Rpb24ucXVlc3Rpb259XG4gICAgICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU9e1xuICAgICAgICAgICAgICAgICAgcXVlc3Rpb25TdGF0ZXNbcXVlc3Rpb24ucXVlc3Rpb25dPy5zZWxlY3RlZFZhbHVlIGFzXG4gICAgICAgICAgICAgICAgICAgIHwgc3RyaW5nW11cbiAgICAgICAgICAgICAgICAgICAgfCB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyh2YWx1ZXM6IHN0cmluZ1tdKSA9PiB7XG4gICAgICAgICAgICAgICAgICBvblVwZGF0ZVF1ZXN0aW9uU3RhdGUoXG4gICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgeyBzZWxlY3RlZFZhbHVlOiB2YWx1ZXMgfSxcbiAgICAgICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHRJbnB1dCA9IHZhbHVlcy5pbmNsdWRlcygnX19vdGhlcl9fJylcbiAgICAgICAgICAgICAgICAgICAgPyBxdWVzdGlvblN0YXRlc1txdWVzdGlvblRleHRdPy50ZXh0SW5wdXRWYWx1ZVxuICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgY29uc3QgZmluYWxWYWx1ZXMgPSB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih2ID0+IHYgIT09ICdfX290aGVyX18nKVxuICAgICAgICAgICAgICAgICAgICAuY29uY2F0KHRleHRJbnB1dCA/IFt0ZXh0SW5wdXRdIDogW10pXG4gICAgICAgICAgICAgICAgICBvbkFuc3dlcihxdWVzdGlvblRleHQsIGZpbmFsVmFsdWVzLCB1bmRlZmluZWQsIGZhbHNlKVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgb25Gb2N1cz17aGFuZGxlRm9jdXN9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e29uQ2FuY2VsfVxuICAgICAgICAgICAgICAgIHN1Ym1pdEJ1dHRvblRleHQ9e1xuICAgICAgICAgICAgICAgICAgY3VycmVudFF1ZXN0aW9uSW5kZXggPT09IHF1ZXN0aW9ucy5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICAgICAgID8gJ1N1Ym1pdCdcbiAgICAgICAgICAgICAgICAgICAgOiAnTmV4dCdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb25TdWJtaXQ9e29uU3VibWl0fVxuICAgICAgICAgICAgICAgIG9uRG93bkZyb21MYXN0SXRlbT17aGFuZGxlRG93bkZyb21MYXN0SXRlbX1cbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkPXtpc0Zvb3RlckZvY3VzZWR9XG4gICAgICAgICAgICAgICAgb25PcGVuRWRpdG9yPXtoYW5kbGVPcGVuRWRpdG9yfVxuICAgICAgICAgICAgICAgIG9uSW1hZ2VQYXN0ZT17b25JbWFnZVBhc3RlfVxuICAgICAgICAgICAgICAgIHBhc3RlZENvbnRlbnRzPXtwYXN0ZWRDb250ZW50c31cbiAgICAgICAgICAgICAgICBvblJlbW92ZUltYWdlPXtvblJlbW92ZUltYWdlfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgICAgIGtleT17cXVlc3Rpb24ucXVlc3Rpb259XG4gICAgICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU9e1xuICAgICAgICAgICAgICAgICAgcXVlc3Rpb25TdGF0ZXNbcXVlc3Rpb24ucXVlc3Rpb25dPy5zZWxlY3RlZFZhbHVlIGFzXG4gICAgICAgICAgICAgICAgICAgIHwgc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIHwgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgb25VcGRhdGVRdWVzdGlvblN0YXRlKFxuICAgICAgICAgICAgICAgICAgICBxdWVzdGlvblRleHQsXG4gICAgICAgICAgICAgICAgICAgIHsgc2VsZWN0ZWRWYWx1ZTogdmFsdWUgfSxcbiAgICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0SW5wdXQgPVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9PT0gJ19fb3RoZXJfXydcbiAgICAgICAgICAgICAgICAgICAgICA/IHF1ZXN0aW9uU3RhdGVzW3F1ZXN0aW9uVGV4dF0/LnRleHRJbnB1dFZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgIG9uQW5zd2VyKHF1ZXN0aW9uVGV4dCwgdmFsdWUsIHRleHRJbnB1dClcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uRm9jdXM9e2hhbmRsZUZvY3VzfVxuICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXtvbkNhbmNlbH1cbiAgICAgICAgICAgICAgICBvbkRvd25Gcm9tTGFzdEl0ZW09e2hhbmRsZURvd25Gcm9tTGFzdEl0ZW19XG4gICAgICAgICAgICAgICAgaXNEaXNhYmxlZD17aXNGb290ZXJGb2N1c2VkfVxuICAgICAgICAgICAgICAgIGxheW91dD1cImNvbXBhY3QtdmVydGljYWxcIlxuICAgICAgICAgICAgICAgIG9uT3BlbkVkaXRvcj17aGFuZGxlT3BlbkVkaXRvcn1cbiAgICAgICAgICAgICAgICBvbkltYWdlUGFzdGU9e29uSW1hZ2VQYXN0ZX1cbiAgICAgICAgICAgICAgICBwYXN0ZWRDb250ZW50cz17cGFzdGVkQ29udGVudHN9XG4gICAgICAgICAgICAgICAgb25SZW1vdmVJbWFnZT17b25SZW1vdmVJbWFnZX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgey8qIEZvb3RlciBzZWN0aW9uIC0gYWx3YXlzIHZpc2libGUsIHNlcGFyYXRlIGZyb20gU2VsZWN0ICovfVxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgPERpdmlkZXIgY29sb3I9XCJpbmFjdGl2ZVwiIC8+XG4gICAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIiBnYXA9ezF9PlxuICAgICAgICAgICAgICB7aXNGb290ZXJGb2N1c2VkICYmIGZvb3RlckluZGV4ID09PSAwID8gKFxuICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VnZ2VzdGlvblwiPntmaWd1cmVzLnBvaW50ZXJ9PC9UZXh0PlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxUZXh0PiA8L1RleHQ+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDxUZXh0XG4gICAgICAgICAgICAgICAgY29sb3I9e1xuICAgICAgICAgICAgICAgICAgaXNGb290ZXJGb2N1c2VkICYmIGZvb3RlckluZGV4ID09PSAwXG4gICAgICAgICAgICAgICAgICAgID8gJ3N1Z2dlc3Rpb24nXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge29wdGlvbnMubGVuZ3RoICsgMX0uIENoYXQgYWJvdXQgdGhpc1xuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgIHtpc0luUGxhbk1vZGUgJiYgKFxuICAgICAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIiBnYXA9ezF9PlxuICAgICAgICAgICAgICAgIHtpc0Zvb3RlckZvY3VzZWQgJiYgZm9vdGVySW5kZXggPT09IDEgPyAoXG4gICAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cInN1Z2dlc3Rpb25cIj57ZmlndXJlcy5wb2ludGVyfTwvVGV4dD5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPFRleHQ+IDwvVGV4dD5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgIDxUZXh0XG4gICAgICAgICAgICAgICAgICBjb2xvcj17XG4gICAgICAgICAgICAgICAgICAgIGlzRm9vdGVyRm9jdXNlZCAmJiBmb290ZXJJbmRleCA9PT0gMVxuICAgICAgICAgICAgICAgICAgICAgID8gJ3N1Z2dlc3Rpb24nXG4gICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7b3B0aW9ucy5sZW5ndGggKyAyfS4gU2tpcCBpbnRlcnZpZXcgYW5kIHBsYW4gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImluYWN0aXZlXCIgZGltQ29sb3I+XG4gICAgICAgICAgICAgIEVudGVyIHRvIHNlbGVjdCDCt3snICd9XG4gICAgICAgICAgICAgIHtxdWVzdGlvbnMubGVuZ3RoID09PSAxID8gKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICB7ZmlndXJlcy5hcnJvd1VwfS97ZmlndXJlcy5hcnJvd0Rvd259IHRvIG5hdmlnYXRlXG4gICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgJ1RhYi9BcnJvdyBrZXlzIHRvIG5hdmlnYXRlJ1xuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICB7aXNPdGhlckZvY3VzZWQgJiYgZWRpdG9yTmFtZSAmJiAoXG4gICAgICAgICAgICAgICAgPD4gwrcgY3RybCtnIHRvIGVkaXQgaW4ge2VkaXRvck5hbWV9PC8+XG4gICAgICAgICAgICAgICl9eycgJ31cbiAgICAgICAgICAgICAgwrcgRXNjIHRvIGNhbmNlbFxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPQyxLQUFLLElBQUlDLFdBQVcsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDcEQsY0FBY0MsYUFBYSxRQUFRLHVDQUF1QztBQUMxRSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxpQkFBaUI7QUFDM0MsU0FBU0MsV0FBVyxRQUFRLDRCQUE0QjtBQUN4RCxjQUNFQyxRQUFRLEVBQ1JDLGNBQWMsUUFDVCwyREFBMkQ7QUFDbEUsY0FBY0MsYUFBYSxRQUFRLDBCQUEwQjtBQUM3RCxTQUFTQyxpQkFBaUIsUUFBUSwwQkFBMEI7QUFDNUQsU0FBU0MsZ0JBQWdCLFFBQVEsdUJBQXVCO0FBQ3hELGNBQWNDLGVBQWUsUUFBUSxnQ0FBZ0M7QUFDckUsU0FBU0Msa0JBQWtCLFFBQVEsZ0NBQWdDO0FBQ25FLFNBQ0UsS0FBS0MscUJBQXFCLEVBQzFCQyxNQUFNLEVBQ05DLFdBQVcsUUFDTiw2QkFBNkI7QUFDcEMsU0FBU0MsT0FBTyxRQUFRLGdDQUFnQztBQUN4RCxTQUFTQyxZQUFZLFFBQVEsdUJBQXVCO0FBQ3BELFNBQVNDLHNCQUFzQixRQUFRLDhCQUE4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