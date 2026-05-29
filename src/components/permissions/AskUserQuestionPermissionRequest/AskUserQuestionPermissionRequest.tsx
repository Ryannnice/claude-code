// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { Base64ImageSource, ImageBlockParam } 来自 @anthropic-ai/sdk/resources/messages.mjs，用于校准终端渲染的数据契约。
import type { Base64ImageSource, ImageBlockParam } from '@anthropic-ai/sdk/resources/messages.mjs';
// 引入 React、Suspense、use、useCallback、useMemo、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { Suspense, use, useCallback, useMemo, useRef, useState } from 'react';
// 引入 useSettings，将 ../../../hooks/useSettings.js 中已经封装好的能力接到本文件流程里。
import { useSettings } from '../../../hooks/useSettings.js';
// 引入 useTerminalSize，将 ../../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../../ink/stringWidth.js';
// 引入 useTheme，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { useTheme } from '../../../ink.js';
// 引入 useKeybindings，将 ../../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../../keybindings/useKeybinding.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 ../../../services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from '../../../services/analytics/index.js';
// 引入 useAppState，将 ../../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../../state/AppState.js';
// 类型依赖 { Question } 来自 ../../../tools/AskUserQuestionTool/AskUserQuestionTool.js，用于校准终端渲染的数据契约。
import type { Question } from '../../../tools/AskUserQuestionTool/AskUserQuestionTool.js';
// 接入 AskUserQuestionTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AskUserQuestionTool } from '../../../tools/AskUserQuestionTool/AskUserQuestionTool.js';
// 复用 CliHighlight、getCliHighlightPromise 工具函数，把通用处理留在 ../../../utils/cliHighlight.js 中维护。
import { type CliHighlight, getCliHighlightPromise } from '../../../utils/cliHighlight.js';
// 类型依赖 { PastedContent } 来自 ../../../utils/config.js，用于校准终端渲染的数据契约。
import type { PastedContent } from '../../../utils/config.js';
// 类型依赖 { ImageDimensions } 来自 ../../../utils/imageResizer.js，用于校准终端渲染的数据契约。
import type { ImageDimensions } from '../../../utils/imageResizer.js';
// 复用 maybeResizeAndDownsampleImageBlock 工具函数，把通用处理留在 ../../../utils/imageResizer.js 中维护。
import { maybeResizeAndDownsampleImageBlock } from '../../../utils/imageResizer.js';
// 复用 cacheImagePath、storeImage 工具函数，把通用处理留在 ../../../utils/imageStore.js 中维护。
import { cacheImagePath, storeImage } from '../../../utils/imageStore.js';
// 复用 logError 工具函数，把通用处理留在 ../../../utils/log.js 中维护。
import { logError } from '../../../utils/log.js';
// 复用 applyMarkdown 工具函数，把通用处理留在 ../../../utils/markdown.js 中维护。
import { applyMarkdown } from '../../../utils/markdown.js';
// 复用 isPlanModeInterviewPhaseEnabled 工具函数，把通用处理留在 ../../../utils/planModeV2.js 中维护。
import { isPlanModeInterviewPhaseEnabled } from '../../../utils/planModeV2.js';
// 复用 getPlanFilePath 工具函数，把通用处理留在 ../../../utils/plans.js 中维护。
import { getPlanFilePath } from '../../../utils/plans.js';
// 类型依赖 { PermissionRequestProps } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { PermissionRequestProps } from '../PermissionRequest.js';
// 引入 QuestionView，将 ./QuestionView.js 中已经封装好的能力接到本文件流程里。
import { QuestionView } from './QuestionView.js';
// 引入 SubmitQuestionsView，将 ./SubmitQuestionsView.js 中已经封装好的能力接到本文件流程里。
import { SubmitQuestionsView } from './SubmitQuestionsView.js';
// 引入 useMultipleChoiceState，将 ./use-multiple-choice-state.js 中已经封装好的能力接到本文件流程里。
import { useMultipleChoiceState } from './use-multiple-choice-state.js';
// MIN_CONTENT_HEIGHT保存`12`，供后续判断或组装使用。
const MIN_CONTENT_HEIGHT = 12;
// MIN_CONTENT_WIDTH保存`40`，供终端渲染权限确认界面 Ask User Question Perm...后续判断或输出使用。
const MIN_CONTENT_WIDTH = 40;
// Lines used by chrome around the content area (nav bar, title, footer, help text, etc.)
// CONTENT_CHROME_OVERHEAD 命名 `15`，让后续代码直接表达这个值的用途。
const CONTENT_CHROME_OVERHEAD = 15;
// AskUserQuestionPermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AskUserQuestionPermissionRequest(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // settings 集合保存`useSettings`，供终端渲染后续处理使用。
  const settings = useSettings();
  // 满足 `settings.syntaxHighlightingDisabled` 时，终端渲染执行该分支。
  if (settings.syntaxHighlightingDisabled) {
    // t0 暂存 `<AskUserQuestionPermissionRequestBody {...props} highligh...` 的派生结果，便于缓存命中时直接复用。
    let t0;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== props) {
      // t0 暂存 `<AskUserQuestionPermissionRequestBody {...props} highligh...` 生成的渲染片段，后续返回路径直接复用。
      t0 = <AskUserQuestionPermissionRequestBody {...props} highlight={null} />;
      // $[0] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = props;
      // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t0;
    } else {
      // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t0 = $[1];
    }
    // 返回 `t0`，作为终端渲染这次计算的结果。
    return t0;
  }
  // t0 暂存 `<Suspense fallback={<AskUserQuestionPermissionRequestBody...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== props) {
    // t0 暂存 `<Suspense fallback={<AskUserQuestionPermissionRequestBody...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Suspense fallback={<AskUserQuestionPermissionRequestBody {...props} highlight={null} />}><AskUserQuestionWithHighlight {...props} /></Suspense>;
    // $[2] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = props;
    // $[3] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[3];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// AskUserQuestionWithHighlight 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function AskUserQuestionWithHighlight(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // t0 暂存 `getCliHighlightPromise()` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `getCliHighlightPromise()` 生成的渲染片段，后续返回路径直接复用。
    t0 = getCliHighlightPromise();
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // highlight保存`use`，供终端渲染后续处理使用。
  const highlight = use(t0);
  // t1 暂存 `<AskUserQuestionPermissionRequestBody {...props} highligh...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== highlight || $[2] !== props) {
    // t1 暂存 `<AskUserQuestionPermissionRequestBody {...props} highligh...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <AskUserQuestionPermissionRequestBody {...props} highlight={highlight} />;
    // $[1] 缓存 `highlight`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = highlight;
    // $[2] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = props;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// AskUserQuestionPermissionRequestBody 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function AskUserQuestionPermissionRequestBody(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(115);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    toolUseConfirm,
    onDone,
    onReject,
    highlight
  } = t0;
  // t1 暂存 `AskUserQuestionTool.inputSchema.safeParse(toolUseConfirm....` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== toolUseConfirm.input) {
    // t1 暂存 `AskUserQuestionTool.inputSchema.safeParse(toolUseConfirm....` 生成的渲染片段，后续返回路径直接复用。
    t1 = AskUserQuestionTool.inputSchema.safeParse(toolUseConfirm.input);
    // $[0] 缓存 `toolUseConfirm.input`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = toolUseConfirm.input;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 结果 命名 `t1`，让后续代码直接表达这个值的用途。
  const result = t1;
  // t2 暂存 `result.success ? result.data.questions || [] : []` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== result.data || $[3] !== result.success) {
    // t2 暂存 `result.success ? result.data.questions || [] : []` 生成的渲染片段，后续返回路径直接复用。
    t2 = result.success ? result.data.questions || [] : [];
    // $[2] 缓存 `result.data`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = result.data;
    // $[3] 缓存 `result.success`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = result.success;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // questions 集合沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const questions = t2;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    rows: terminalRows
  } = useTerminalSize();
  // 从 `useTheme()` 按位置拆出 theme，让权限确认界面 Ask User Question Permission...分别处理这些返回值。
  const [theme] = useTheme();
  // maxHeight保存`0`，供后续判断或组装使用。
  let maxHeight = 0;
  // maxWidth 命名 `0`，让后续代码直接表达这个值的用途。
  let maxWidth = 0;
  // maxAllowedHeight保存`Math.max`，供终端渲染后续处理使用。
  const maxAllowedHeight = Math.max(MIN_CONTENT_HEIGHT, terminalRows - CONTENT_CHROME_OVERHEAD);
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== highlight || $[6] !== maxAllowedHeight || $[7] !== maxHeight || $[8] !== maxWidth || $[9] !== questions || $[10] !== theme) {
    // 按顺序遍历 `questions` 中的q，逐个交给终端渲染处理。
    for (const q of questions) {
      // hasPreview记录 `options.some` 是否成立，终端渲染随后按该结果分支。
      const hasPreview = q.options.some(_temp);
      // 满足 `hasPreview` 时，终端渲染执行该分支。
      if (hasPreview) {
        // maxPreviewContentLines 集合保存`Math.max`，供终端渲染后续处理使用。
        const maxPreviewContentLines = Math.max(1, maxAllowedHeight - 11);
        // maxPreviewBoxHeight 命名 `0`，让后续代码直接表达这个值的用途。
        let maxPreviewBoxHeight = 0;
        // 按顺序遍历 `q.options` 中的opt_0，逐个交给终端渲染处理。
        for (const opt_0 of q.options) {
          // 满足 `opt_0.preview` 时，终端渲染执行该分支。
          if (opt_0.preview) {
            // rendered保存`applyMarkdown`，供终端渲染后续处理使用。
            const rendered = applyMarkdown(opt_0.preview, theme, highlight);
            // previewLines 集合格式化`rendered.split`，供终端渲染后续处理使用。
            const previewLines = rendered.split("\n");
            // isTruncated标记终端渲染权限确认界面 Ask User Question Perm...是否启用对应路径。
            const isTruncated = previewLines.length > maxPreviewContentLines;
            // displayedLines 集合记录 `isTruncated ? maxPreviewContentLines : previewLines.length` 是否成立，下一步按该结果分支。
            const displayedLines = isTruncated ? maxPreviewContentLines : previewLines.length;
            // maxPreviewBoxHeight更新为 `Math.max(maxPreviewBoxHeight, displayedLines + (isTruncat...`，确保权限确认界面后续读取最新状态。
            maxPreviewBoxHeight = Math.max(maxPreviewBoxHeight, displayedLines + (isTruncated ? 1 : 0) + 2);
            // 按顺序遍历 `previewLines` 中的line，逐个交给终端渲染处理。
            for (const line of previewLines) {
              // maxWidth更新为 `Math.max(maxWidth, stringWidth(line))`，确保权限确认界面后续读取最新状态。
              maxWidth = Math.max(maxWidth, stringWidth(line));
            }
          }
        }
        // rightPanelHeight保存`maxPreviewBoxHeight + 2`，供终端渲染权限确认界面 Ask User Question Perm...后续判断或输出使用。
        const rightPanelHeight = maxPreviewBoxHeight + 2;
        // leftPanelHeight记录 `q.options.length + 2` 是否成立，下一步按该结果分支。
        const leftPanelHeight = q.options.length + 2;
        // sideByHeight保存`Math.max`，供终端渲染后续处理使用。
        const sideByHeight = Math.max(leftPanelHeight, rightPanelHeight);
        // maxHeight更新为 `Math.max(maxHeight, sideByHeight + 7)`，确保权限确认界面后续读取最新状态。
        maxHeight = Math.max(maxHeight, sideByHeight + 7);
      } else {
        // maxHeight更新为 `Math.max(maxHeight, q.options.length + 3 + 7)`，确保权限确认界面后续读取最新状态。
        maxHeight = Math.max(maxHeight, q.options.length + 3 + 7);
      }
    }
    // $[5] 缓存 `highlight`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = highlight;
    // $[6] 缓存 `maxAllowedHeight`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = maxAllowedHeight;
    // $[7] 缓存 `maxHeight`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = maxHeight;
    // $[8] 缓存 `maxWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = maxWidth;
    // $[9] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = questions;
    // $[10] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = theme;
    // $[11] 缓存 `maxHeight`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = maxHeight;
  } else {
    // maxHeight更新为 `$[11]`，确保权限确认界面后续读取最新状态。
    maxHeight = $[11];
  }
  // 临时值 t3保存`Math.min`，供终端渲染后续处理使用。
  const t3 = Math.min(Math.max(maxHeight, MIN_CONTENT_HEIGHT), maxAllowedHeight);
  // 临时值 t4保存`Math.max`，供终端渲染后续处理使用。
  const t4 = Math.max(maxWidth, MIN_CONTENT_WIDTH);
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== t3 || $[13] !== t4) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      globalContentHeight: t3,
      globalContentWidth: t4
    };
    // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t3;
    // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t4;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[14];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    globalContentHeight,
    globalContentWidth
  } = t5;
  // metadataSource 命名 `result.success ? result.data.metadata?.source : undefined`，让后续代码直接表达这个值的用途。
  const metadataSource = result.success ? result.data.metadata?.source : undefined;
  // t6 暂存 `{}` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `{}` 生成的渲染片段，后续返回路径直接复用。
    t6 = {};
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[15];
  }
  // pastedContentsByQuestion 由 React state 持有，setPastedContentsByQuestion 会在用户操作或异步结果返回时触发刷新。
  const [pastedContentsByQuestion, setPastedContentsByQuestion] = useState(t6);
  // nextPasteIdRef 引用保存`useRef`，供终端渲染后续处理使用。
  const nextPasteIdRef = useRef(0);
  // t7 暂存 `function onImagePaste(questionText, base64Image, mediaTyp...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `function onImagePaste(questionText, base64Image, mediaTyp...` 生成的渲染片段，后续返回路径直接复用。
    t7 = function onImagePaste(questionText, base64Image, mediaType, filename, dimensions, _sourcePath) {
      // current更新为 `nextPasteIdRef.current + 1`，确保权限确认界面后续读取最新状态。
      nextPasteIdRef.current = nextPasteIdRef.current + 1;
      // pasteId保存`nextPasteIdRef.current`，供后续判断或组装使用。
      const pasteId = nextPasteIdRef.current;
      // 新内容 集中保存终端渲染权限确认界面 Ask User Question Perm...要一起传递的字段。
      const newContent = {
        id: pasteId,
        type: "image",
        content: base64Image,
        mediaType: mediaType || "image/png",
        filename: filename || "Pasted image",
        dimensions
      };
      // 调用 cacheImagePath，触发终端渲染此处需要的副作用。
      cacheImagePath(newContent);
      // 调用 storeImage，触发终端渲染此处需要的副作用。
      storeImage(newContent);
      // setPastedContentsByQuestion 写入新的状态值，使终端渲染后续读取保持一致。
      setPastedContentsByQuestion(prev => ({
        ...prev,
        [questionText]: {
          ...(prev[questionText] ?? {}),
          [pasteId]: newContent
        }
      }));
    };
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // onImagePaste沿用 `t7` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const onImagePaste = t7;
  // t8 暂存 `(questionText_0, id) => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `(questionText_0, id) => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = (questionText_0, id) => {
      // setPastedContentsByQuestion 写入新的状态值，使终端渲染后续读取保持一致。
      setPastedContentsByQuestion(prev_0 => {
        // questionContents 集合 集中保存终端渲染权限确认界面 Ask User Question Perm...要一起传递的字段。
        const questionContents = {
          ...(prev_0[questionText_0] ?? {})
        };
        // 权限确认界面 Ask User Question Permission...在这里处理 `delete questionContents[id]`，完成这一小步状态转换。
        delete questionContents[id];
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...prev_0,
          [questionText_0]: questionContents
        };
      });
    };
    // $[17] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[17];
  }
  // onRemoveImage 命名 `t8`，让后续代码直接表达这个值的用途。
  const onRemoveImage = t8;
  // t9 暂存 `Object.values(pastedContentsByQuestion).flatMap(_temp2).f...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== pastedContentsByQuestion) {
    // t9 暂存 `Object.values(pastedContentsByQuestion).flatMap(_temp2).f...` 生成的渲染片段，后续返回路径直接复用。
    t9 = Object.values(pastedContentsByQuestion).flatMap(_temp2).filter(_temp3);
    // $[18] 缓存 `pastedContentsByQuestion`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = pastedContentsByQuestion;
    // $[19] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[19];
  }
  // allImageAttachments 集合 命名 `t9`，让后续代码直接表达这个值的用途。
  const allImageAttachments = t9;
  // toolPermissionContextMode 权限数据保存`useAppState`，供终端渲染后续处理使用。
  const toolPermissionContextMode = useAppState(_temp4);
  // isInPlanMode标记终端渲染权限确认界面 Ask User Question Perm...是否启用对应路径。
  const isInPlanMode = toolPermissionContextMode === "plan";
  // t10 暂存 `isInPlanMode ? getPlanFilePath() : undefined` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== isInPlanMode) {
    // t10 暂存 `isInPlanMode ? getPlanFilePath() : undefined` 生成的渲染片段，后续返回路径直接复用。
    t10 = isInPlanMode ? getPlanFilePath() : undefined;
    // $[20] 缓存 `isInPlanMode`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = isInPlanMode;
    // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[21];
  }
  // planFilePath 路径数据保存`t10`，作为后续临时缓存值处理的输入。
  const planFilePath = t10;
  // 状态保存`useMultipleChoiceState`，供终端渲染后续处理使用。
  const state = useMultipleChoiceState();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    currentQuestionIndex,
    answers,
    questionStates,
    isInTextInput,
    nextQuestion,
    prevQuestion,
    updateQuestionState,
    setAnswer,
    setTextInputMode
  } = state;
  // currentQuestion标记终端渲染权限确认界面 Ask User Question Perm...是否启用对应路径。
  const currentQuestion = currentQuestionIndex < (questions?.length || 0) ? questions?.[currentQuestionIndex] : null;
  // isInSubmitView标记终端渲染权限确认界面 Ask User Question Perm...是否启用对应路径。
  const isInSubmitView = currentQuestionIndex === (questions?.length || 0);
  // t11 暂存 `questions?.every(q_0 => q_0?.question && !!answers[q_0.qu...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== answers || $[23] !== questions) {
    // t11 暂存 `questions?.every(q_0 => q_0?.question && !!answers[q_0.qu...` 生成的渲染片段，后续返回路径直接复用。
    t11 = questions?.every(q_0 => q_0?.question && !!answers[q_0.question]) ?? false;
    // $[22] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = answers;
    // $[23] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = questions;
    // $[24] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[24];
  }
  // allQuestionsAnswered沿用 `t11` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const allQuestionsAnswered = t11;
  // hideSubmitTab标记终端渲染权限确认界面 Ask User Question Perm...是否启用对应路径。
  const hideSubmitTab = questions.length === 1 && !questions[0]?.multiSelect;
  // t12 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== isInPlanMode || $[26] !== metadataSource || $[27] !== onDone || $[28] !== onReject || $[29] !== questions.length || $[30] !== toolUseConfirm) {
    // t12 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t12 = () => {
      // 满足 `metadataSource` 时，终端渲染执行该分支。
      if (metadataSource) {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_ask_user_question_rejected", {
          source: metadataSource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          questionCount: questions.length,
          isInPlanMode,
          interviewPhaseEnabled: isInPlanMode && isPlanModeInterviewPhaseEnabled()
        });
      }
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
      // 调用 onReject，触发终端渲染此处需要的副作用。
      onReject();
      // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
      toolUseConfirm.onReject();
    };
    // $[25] 缓存 `isInPlanMode`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = isInPlanMode;
    // $[26] 缓存 `metadataSource`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = metadataSource;
    // $[27] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = onDone;
    // $[28] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = onReject;
    // $[29] 缓存 `questions.length`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = questions.length;
    // $[30] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = toolUseConfirm;
    // $[31] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[31];
  }
  // handleCancel沿用 `t12` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleCancel = t12;
  // t13 暂存 `async () => {` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== allImageAttachments || $[33] !== answers || $[34] !== isInPlanMode || $[35] !== metadataSource || $[36] !== onDone || $[37] !== questions || $[38] !== toolUseConfirm) {
    // t13 暂存 `async () => {` 生成的渲染片段，后续返回路径直接复用。
    t13 = async () => {
      // questionsWithAnswers 集合派生`questions.map`，供终端渲染后续处理使用。
      const questionsWithAnswers = questions.map(q_1 => {
        // answer保存`answers[q_1.question]`，供终端渲染权限确认界面 Ask User Question Perm...后续判断或输出使用。
        const answer = answers[q_1.question];
        // 满足 `answer` 时，终端渲染执行该分支。
        if (answer) {
          // 返回 ``- "${q_1.question}"\n Answer: ${answer}``，作为终端渲染这次计算的结果。
          return `- "${q_1.question}"\n  Answer: ${answer}`;
        }
        // 返回 ``- "${q_1.question}"\n (No answer provided)``，作为终端渲染这次计算的结果。
        return `- "${q_1.question}"\n  (No answer provided)`;
      }).join("\n");
      // feedback保存``The user wants to clarify these questions.`，作为后续固定文本处理的输入。
      const feedback = `The user wants to clarify these questions.
    This means they may have additional information, context or questions for you.
    Take their response into account and then reformulate the questions if appropriate.
    Start by asking them what they would like to clarify.

    Questions asked:\n${questionsWithAnswers}`;
      // 满足 `metadataSource` 时，终端渲染执行该分支。
      if (metadataSource) {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_ask_user_question_respond_to_claude", {
          source: metadataSource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          questionCount: questions.length,
          isInPlanMode,
          interviewPhaseEnabled: isInPlanMode && isPlanModeInterviewPhaseEnabled()
        });
      }
      // imageBlocks 集合保存`convertImagesToBlocks`，供终端渲染后续处理使用。
      const imageBlocks = await convertImagesToBlocks(allImageAttachments);
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
      // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
      toolUseConfirm.onReject(feedback, imageBlocks && imageBlocks.length > 0 ? imageBlocks : undefined);
    };
    // $[32] 缓存 `allImageAttachments`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = allImageAttachments;
    // $[33] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = answers;
    // $[34] 缓存 `isInPlanMode`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = isInPlanMode;
    // $[35] 缓存 `metadataSource`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = metadataSource;
    // $[36] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = onDone;
    // $[37] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = questions;
    // $[38] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = toolUseConfirm;
    // $[39] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[39];
  }
  // handleRespondToClaude 命名 `t13`，让后续代码直接表达这个值的用途。
  const handleRespondToClaude = t13;
  // t14 暂存 `async () => {` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[40] !== allImageAttachments || $[41] !== answers || $[42] !== isInPlanMode || $[43] !== metadataSource || $[44] !== onDone || $[45] !== questions || $[46] !== toolUseConfirm) {
    // t14 暂存 `async () => {` 生成的渲染片段，后续返回路径直接复用。
    t14 = async () => {
      // questionsWithAnswers_0派生`questions.map`，供终端渲染后续处理使用。
      const questionsWithAnswers_0 = questions.map(q_2 => {
        // answer_0读取 `answers[q_2.question]` 对应条目，后续围绕该成员继续处理。
        const answer_0 = answers[q_2.question];
        // 满足 `answer_0` 时，终端渲染执行该分支。
        if (answer_0) {
          // 返回 ``- "${q_2.question}"\n Answer: ${answer_0}``，作为终端渲染这次计算的结果。
          return `- "${q_2.question}"\n  Answer: ${answer_0}`;
        }
        // 返回 ``- "${q_2.question}"\n (No answer provided)``，作为终端渲染这次计算的结果。
        return `- "${q_2.question}"\n  (No answer provided)`;
      }).join("\n");
      // feedback_0 命名 ``The user has indicated they have provided enough answers...`，让后续代码直接表达这个值的用途。
      const feedback_0 = `The user has indicated they have provided enough answers for the plan interview.
Stop asking clarifying questions and proceed to finish the plan with the information you have.

Questions asked and answers provided:\n${questionsWithAnswers_0}`;
      // 满足 `metadataSource` 时，终端渲染执行该分支。
      if (metadataSource) {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_ask_user_question_finish_plan_interview", {
          source: metadataSource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          questionCount: questions.length,
          isInPlanMode,
          interviewPhaseEnabled: isInPlanMode && isPlanModeInterviewPhaseEnabled()
        });
      }
      // imageBlocks_0保存`convertImagesToBlocks`，供终端渲染后续处理使用。
      const imageBlocks_0 = await convertImagesToBlocks(allImageAttachments);
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
      // 调用 toolUseConfirm.onReject，触发终端渲染此处需要的副作用。
      toolUseConfirm.onReject(feedback_0, imageBlocks_0 && imageBlocks_0.length > 0 ? imageBlocks_0 : undefined);
    };
    // $[40] 缓存 `allImageAttachments`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = allImageAttachments;
    // $[41] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = answers;
    // $[42] 缓存 `isInPlanMode`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = isInPlanMode;
    // $[43] 缓存 `metadataSource`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = metadataSource;
    // $[44] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = onDone;
    // $[45] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = questions;
    // $[46] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = toolUseConfirm;
    // $[47] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[47];
  }
  // handleFinishPlanInterview保存`t14`，作为后续临时缓存值处理的输入。
  const handleFinishPlanInterview = t14;
  // t15 暂存 `async answersToSubmit => {` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[48] !== allImageAttachments || $[49] !== isInPlanMode || $[50] !== metadataSource || $[51] !== onDone || $[52] !== questionStates || $[53] !== questions || $[54] !== toolUseConfirm) {
    // t15 暂存 `async answersToSubmit => {` 生成的渲染片段，后续返回路径直接复用。
    t15 = async answersToSubmit => {
      // 满足 `metadataSource` 时，终端渲染执行该分支。
      if (metadataSource) {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_ask_user_question_accepted", {
          source: metadataSource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          questionCount: questions.length,
          answerCount: Object.keys(answersToSubmit).length,
          isInPlanMode,
          interviewPhaseEnabled: isInPlanMode && isPlanModeInterviewPhaseEnabled()
        });
      }
      // annotations 集合 从空对象开始收集键值，后续按名称补齐内容。
      const annotations = {};
      // 按顺序遍历 `questions` 中的q_3，逐个交给终端渲染处理。
      for (const q_3 of questions) {
        // answer_1读取 `answersToSubmit[q_3.question]` 对应条目，后续围绕该成员继续处理。
        const answer_1 = answersToSubmit[q_3.question];
        // notes 集合保存`questionStates[q_3.question]?.textInputValue`，供终端渲染权限确认界面 Ask User Question Perm...后续判断或输出使用。
        const notes = questionStates[q_3.question]?.textInputValue;
        // selectedOption筛选`options.find`，供终端渲染后续处理使用。
        const selectedOption = answer_1 ? q_3.options.find(opt_1 => opt_1.label === answer_1) : undefined;
        // preview保存`selectedOption?.preview`，供后续判断或组装使用。
        const preview = selectedOption?.preview;
        // 只有 `preview || notes?.trim()` 满足时，终端渲染才执行该分支。
        if (preview || notes?.trim()) {
          // question更新为 `{`，确保权限确认界面 Ask User Question Permission...后续读取最新状态。
          annotations[q_3.question] = {
            ...(preview && {
              preview
            }),
            ...(notes?.trim() && {
              notes: notes.trim()
            })
          };
        }
      }
      // updatedInput 集中保存终端渲染权限确认界面 Ask User Question Perm...要一起传递的字段。
      const updatedInput = {
        ...toolUseConfirm.input,
        answers: answersToSubmit,
        ...(Object.keys(annotations).length > 0 && {
          annotations
        })
      };
      // contentBlocks 集合保存`convertImagesToBlocks`，供终端渲染后续处理使用。
      const contentBlocks = await convertImagesToBlocks(allImageAttachments);
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
      // 调用 toolUseConfirm.onAllow，触发终端渲染此处需要的副作用。
      toolUseConfirm.onAllow(updatedInput, [], undefined, contentBlocks && contentBlocks.length > 0 ? contentBlocks : undefined);
    };
    // $[48] 缓存 `allImageAttachments`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = allImageAttachments;
    // $[49] 缓存 `isInPlanMode`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = isInPlanMode;
    // $[50] 缓存 `metadataSource`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = metadataSource;
    // $[51] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = onDone;
    // $[52] 缓存 `questionStates`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = questionStates;
    // $[53] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = questions;
    // $[54] 缓存 `toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = toolUseConfirm;
    // $[55] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[55] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[55];
  }
  // submitAnswers 集合保存`t15`，作为后续临时缓存值处理的输入。
  const submitAnswers = t15;
  // t16 暂存 `(questionText_1, label, textInput, t17) => {` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[56] !== answers || $[57] !== pastedContentsByQuestion || $[58] !== questions.length || $[59] !== setAnswer || $[60] !== submitAnswers) {
    // t16 暂存 `(questionText_1, label, textInput, t17) => {` 生成的渲染片段，后续返回路径直接复用。
    t16 = (questionText_1, label, textInput, t17) => {
      // shouldAdvance标记终端渲染权限确认界面 Ask User Question Perm...是否启用对应路径。
      const shouldAdvance = t17 === undefined ? true : t17;
      // answer_2 先占位，稍后的条件分支会根据实际输入补齐它。
      let answer_2;
      // isMultiSelect记录 `Array.isArray` 是否成立，终端渲染随后按该结果分支。
      const isMultiSelect = Array.isArray(label);
      // 满足 `isMultiSelect` 时，终端渲染执行该分支。
      if (isMultiSelect) {
        // answer_2更新为 `label.join(", ")`，确保权限确认界面后续读取最新状态。
        answer_2 = label.join(", ");
      } else {
        // 满足 `textInput` 时，终端渲染执行该分支。
        if (textInput) {
          // questionImages 集合派生`Object.values`，供终端渲染后续处理使用。
          const questionImages = Object.values(pastedContentsByQuestion[questionText_1] ?? {}).filter(_temp5);
          // answer_2更新为 `questionImages.length > 0 ? `${textInput} (Image attached...`，确保权限确认界面后续读取最新状态。
          answer_2 = questionImages.length > 0 ? `${textInput} (Image attached)` : textInput;
        } else {
          // 当 `label` 匹配 `"__other__"` 时，终端渲染执行对应分支。
          if (label === "__other__") {
            // questionImages_0派生`Object.values`，供终端渲染后续处理使用。
            const questionImages_0 = Object.values(pastedContentsByQuestion[questionText_1] ?? {}).filter(_temp6);
            // answer_2更新为 `questionImages_0.length > 0 ? "(Image attached)" : label`，确保权限确认界面后续读取最新状态。
            answer_2 = questionImages_0.length > 0 ? "(Image attached)" : label;
          } else {
            // answer_2更新为 `label`，确保权限确认界面后续读取最新状态。
            answer_2 = label;
          }
        }
      }
      // isSingleQuestion标记终端渲染权限确认界面 Ask User Question Perm...是否启用对应路径。
      const isSingleQuestion = questions.length === 1;
      // 只有 `!isMultiSelect && isSingleQuestion && shouldAdvan` 满足时，终端渲染才执行该分支。
      if (!isMultiSelect && isSingleQuestion && shouldAdvance) {
        // updatedAnswers 集合 集中保存终端渲染权限确认界面 Ask User Question Perm...要一起传递的字段。
        const updatedAnswers = {
          ...answers,
          [questionText_1]: answer_2
        };
        // 调用 submitAnswers，触发终端渲染此处需要的副作用。
        submitAnswers(updatedAnswers).catch(logError);
        // 权限确认界面 Ask User Question Permission...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setAnswer 写入新的状态值，使终端渲染后续读取保持一致。
      setAnswer(questionText_1, answer_2, shouldAdvance);
    };
    // $[56] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = answers;
    // $[57] 缓存 `pastedContentsByQuestion`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = pastedContentsByQuestion;
    // $[58] 缓存 `questions.length`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = questions.length;
    // $[59] 缓存 `setAnswer`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = setAnswer;
    // $[60] 缓存 `submitAnswers`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = submitAnswers;
    // $[61] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[61] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[61];
  }
  // handleQuestionAnswer保存`t16`，作为后续临时缓存值处理的输入。
  const handleQuestionAnswer = t16;
  // t17 暂存 `function handleFinalResponse(value) {` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[62] !== answers || $[63] !== handleCancel || $[64] !== submitAnswers) {
    // t17 暂存 `function handleFinalResponse(value) {` 生成的渲染片段，后续返回路径直接复用。
    t17 = function handleFinalResponse(value) {
      // 当 `value` 匹配 `"cancel"` 时，终端渲染执行对应分支。
      if (value === "cancel") {
        // 调用 handleCancel，触发终端渲染此处需要的副作用。
        handleCancel();
        // 权限确认界面 Ask User Question Permission...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 当 `value` 匹配 `"submit"` 时，终端渲染执行对应分支。
      if (value === "submit") {
        // 调用 submitAnswers，触发终端渲染此处需要的副作用。
        submitAnswers(answers).catch(logError);
      }
    };
    // $[62] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = answers;
    // $[63] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = handleCancel;
    // $[64] 缓存 `submitAnswers`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = submitAnswers;
    // $[65] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[65] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[65];
  }
  // handleFinalResponse 响应数据保存`t17`，作为后续临时缓存值处理的输入。
  const handleFinalResponse = t17;
  // maxIndex 索引标记终端渲染权限确认界面 Ask User Question Perm...是否启用对应路径。
  const maxIndex = hideSubmitTab ? (questions?.length || 1) - 1 : questions?.length || 0;
  // t18 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[66] !== currentQuestionIndex || $[67] !== prevQuestion) {
    // t18 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t18 = () => {
      // 满足 `currentQuestionIndex > 0` 时，终端渲染执行该分支。
      if (currentQuestionIndex > 0) {
        // 调用 prevQuestion，触发终端渲染此处需要的副作用。
        prevQuestion();
      }
    };
    // $[66] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = currentQuestionIndex;
    // $[67] 缓存 `prevQuestion`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = prevQuestion;
    // $[68] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[68] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[68];
  }
  // handleTabPrev保存`t18`，作为后续临时缓存值处理的输入。
  const handleTabPrev = t18;
  // t19 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[69] !== currentQuestionIndex || $[70] !== maxIndex || $[71] !== nextQuestion) {
    // t19 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t19 = () => {
      // 满足 `currentQuestionIndex < maxIndex` 时，终端渲染执行该分支。
      if (currentQuestionIndex < maxIndex) {
        // 调用 nextQuestion，触发终端渲染此处需要的副作用。
        nextQuestion();
      }
    };
    // $[69] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = currentQuestionIndex;
    // $[70] 缓存 `maxIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[70] = maxIndex;
    // $[71] 缓存 `nextQuestion`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = nextQuestion;
    // $[72] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[72] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[72];
  }
  // handleTabNext 命名 `t19`，让后续代码直接表达这个值的用途。
  const handleTabNext = t19;
  // t20 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[73] !== handleTabNext || $[74] !== handleTabPrev) {
    // t20 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t20 = {
      "tabs:previous": handleTabPrev,
      "tabs:next": handleTabNext
    };
    // $[73] 缓存 `handleTabNext`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = handleTabNext;
    // $[74] 缓存 `handleTabPrev`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = handleTabPrev;
    // $[75] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[75] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[75] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[75];
  }
  // t21标记终端渲染权限确认界面 Ask User Question Perm...是否启用对应路径。
  const t21 = !(isInTextInput && !isInSubmitView);
  // t22 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[76] !== t21) {
    // t22 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t22 = {
      context: "Tabs",
      isActive: t21
    };
    // $[76] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[76] = t21;
    // $[77] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[77] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[77] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[77];
  }
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(t20, t22);
  // 满足 `currentQuestion` 时，终端渲染执行该分支。
  if (currentQuestion) {
    // t23 暂存 `(base64, mediaType_0, filename_0, dims, path) => onImageP...` 的派生结果，便于缓存命中时直接复用。
    let t23;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[78] !== currentQuestion.question) {
      // t23 暂存 `(base64, mediaType_0, filename_0, dims, path) => onImageP...` 生成的渲染片段，后续返回路径直接复用。
      t23 = (base64, mediaType_0, filename_0, dims, path) => onImagePaste(currentQuestion.question, base64, mediaType_0, filename_0, dims, path);
      // $[78] 缓存 `currentQuestion.question`，下次依赖未变时 React 编译产物可直接复用。
      $[78] = currentQuestion.question;
      // $[79] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[79] = t23;
    } else {
      // t23 从 React 编译缓存槽 $[79] 取回渲染片段，避免依赖未变时重建 JSX。
      t23 = $[79];
    }
    // t24 暂存 `pastedContentsByQuestion[currentQuestion.question] ?? {}` 的派生结果，便于缓存命中时直接复用。
    let t24;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[80] !== currentQuestion.question || $[81] !== pastedContentsByQuestion) {
      // t24 暂存 `pastedContentsByQuestion[currentQuestion.question] ?? {}` 生成的渲染片段，后续返回路径直接复用。
      t24 = pastedContentsByQuestion[currentQuestion.question] ?? {};
      // $[80] 缓存 `currentQuestion.question`，下次依赖未变时 React 编译产物可直接复用。
      $[80] = currentQuestion.question;
      // $[81] 缓存 `pastedContentsByQuestion`，下次依赖未变时 React 编译产物可直接复用。
      $[81] = pastedContentsByQuestion;
      // $[82] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[82] = t24;
    } else {
      // t24 从 React 编译缓存槽 $[82] 取回渲染片段，避免依赖未变时重建 JSX。
      t24 = $[82];
    }
    // t25 暂存 `id_0 => onRemoveImage(currentQuestion.question, id_0)` 的派生结果，便于缓存命中时直接复用。
    let t25;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[83] !== currentQuestion.question) {
      // t25 暂存 `id_0 => onRemoveImage(currentQuestion.question, id_0)` 生成的渲染片段，后续返回路径直接复用。
      t25 = id_0 => onRemoveImage(currentQuestion.question, id_0);
      // $[83] 缓存 `currentQuestion.question`，下次依赖未变时 React 编译产物可直接复用。
      $[83] = currentQuestion.question;
      // $[84] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
      $[84] = t25;
    } else {
      // t25 从 React 编译缓存槽 $[84] 取回渲染片段，避免依赖未变时重建 JSX。
      t25 = $[84];
    }
    // t26 暂存 `<><QuestionView question={currentQuestion} questions={que...` 的派生结果，便于缓存命中时直接复用。
    let t26;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[85] !== answers || $[86] !== currentQuestion || $[87] !== currentQuestionIndex || $[88] !== globalContentHeight || $[89] !== globalContentWidth || $[90] !== handleCancel || $[91] !== handleFinishPlanInterview || $[92] !== handleQuestionAnswer || $[93] !== handleRespondToClaude || $[94] !== handleTabNext || $[95] !== handleTabPrev || $[96] !== hideSubmitTab || $[97] !== nextQuestion || $[98] !== planFilePath || $[99] !== questionStates || $[100] !== questions || $[101] !== setTextInputMode || $[102] !== t23 || $[103] !== t24 || $[104] !== t25 || $[105] !== updateQuestionState) {
      // t26 暂存 `<><QuestionView question={currentQuestion} questions={que...` 生成的渲染片段，后续返回路径直接复用。
      t26 = <><QuestionView question={currentQuestion} questions={questions} currentQuestionIndex={currentQuestionIndex} answers={answers} questionStates={questionStates} hideSubmitTab={hideSubmitTab} minContentHeight={globalContentHeight} minContentWidth={globalContentWidth} planFilePath={planFilePath} onUpdateQuestionState={updateQuestionState} onAnswer={handleQuestionAnswer} onTextInputFocus={setTextInputMode} onCancel={handleCancel} onSubmit={nextQuestion} onTabPrev={handleTabPrev} onTabNext={handleTabNext} onRespondToClaude={handleRespondToClaude} onFinishPlanInterview={handleFinishPlanInterview} onImagePaste={t23} pastedContents={t24} onRemoveImage={t25} /></>;
      // $[85] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
      $[85] = answers;
      // $[86] 缓存 `currentQuestion`，下次依赖未变时 React 编译产物可直接复用。
      $[86] = currentQuestion;
      // $[87] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
      $[87] = currentQuestionIndex;
      // $[88] 缓存 `globalContentHeight`，下次依赖未变时 React 编译产物可直接复用。
      $[88] = globalContentHeight;
      // $[89] 缓存 `globalContentWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[89] = globalContentWidth;
      // $[90] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
      $[90] = handleCancel;
      // $[91] 缓存 `handleFinishPlanInterview`，下次依赖未变时 React 编译产物可直接复用。
      $[91] = handleFinishPlanInterview;
      // $[92] 缓存 `handleQuestionAnswer`，下次依赖未变时 React 编译产物可直接复用。
      $[92] = handleQuestionAnswer;
      // $[93] 缓存 `handleRespondToClaude`，下次依赖未变时 React 编译产物可直接复用。
      $[93] = handleRespondToClaude;
      // $[94] 缓存 `handleTabNext`，下次依赖未变时 React 编译产物可直接复用。
      $[94] = handleTabNext;
      // $[95] 缓存 `handleTabPrev`，下次依赖未变时 React 编译产物可直接复用。
      $[95] = handleTabPrev;
      // $[96] 缓存 `hideSubmitTab`，下次依赖未变时 React 编译产物可直接复用。
      $[96] = hideSubmitTab;
      // $[97] 缓存 `nextQuestion`，下次依赖未变时 React 编译产物可直接复用。
      $[97] = nextQuestion;
      // $[98] 缓存 `planFilePath`，下次依赖未变时 React 编译产物可直接复用。
      $[98] = planFilePath;
      // $[99] 缓存 `questionStates`，下次依赖未变时 React 编译产物可直接复用。
      $[99] = questionStates;
      // $[100] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
      $[100] = questions;
      // $[101] 缓存 `setTextInputMode`，下次依赖未变时 React 编译产物可直接复用。
      $[101] = setTextInputMode;
      // $[102] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[102] = t23;
      // $[103] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[103] = t24;
      // $[104] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
      $[104] = t25;
      // $[105] 缓存 `updateQuestionState`，下次依赖未变时 React 编译产物可直接复用。
      $[105] = updateQuestionState;
      // $[106] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
      $[106] = t26;
    } else {
      // t26 从 React 编译缓存槽 $[106] 取回渲染片段，避免依赖未变时重建 JSX。
      t26 = $[106];
    }
    // 返回 `t26`，作为终端渲染这次计算的结果。
    return t26;
  }
  // 满足 `isInSubmitView` 时，终端渲染执行该分支。
  if (isInSubmitView) {
    // t23 暂存 `<><SubmitQuestionsView questions={questions} currentQuest...` 的派生结果，便于缓存命中时直接复用。
    let t23;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[107] !== allQuestionsAnswered || $[108] !== answers || $[109] !== currentQuestionIndex || $[110] !== globalContentHeight || $[111] !== handleFinalResponse || $[112] !== questions || $[113] !== toolUseConfirm.permissionResult) {
      // t23 暂存 `<><SubmitQuestionsView questions={questions} currentQuest...` 生成的渲染片段，后续返回路径直接复用。
      t23 = <><SubmitQuestionsView questions={questions} currentQuestionIndex={currentQuestionIndex} answers={answers} allQuestionsAnswered={allQuestionsAnswered} permissionResult={toolUseConfirm.permissionResult} minContentHeight={globalContentHeight} onFinalResponse={handleFinalResponse} /></>;
      // $[107] 缓存 `allQuestionsAnswered`，下次依赖未变时 React 编译产物可直接复用。
      $[107] = allQuestionsAnswered;
      // $[108] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
      $[108] = answers;
      // $[109] 缓存 `currentQuestionIndex`，下次依赖未变时 React 编译产物可直接复用。
      $[109] = currentQuestionIndex;
      // $[110] 缓存 `globalContentHeight`，下次依赖未变时 React 编译产物可直接复用。
      $[110] = globalContentHeight;
      // $[111] 缓存 `handleFinalResponse`，下次依赖未变时 React 编译产物可直接复用。
      $[111] = handleFinalResponse;
      // $[112] 缓存 `questions`，下次依赖未变时 React 编译产物可直接复用。
      $[112] = questions;
      // $[113] 缓存 `toolUseConfirm.permissionResult`，下次依赖未变时 React 编译产物可直接复用。
      $[113] = toolUseConfirm.permissionResult;
      // $[114] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[114] = t23;
    } else {
      // t23 从 React 编译缓存槽 $[114] 取回渲染片段，避免依赖未变时重建 JSX。
      t23 = $[114];
    }
    // 返回 `t23`，作为终端渲染这次计算的结果。
    return t23;
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}
// _temp6 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(c_1) {
  // 返回 `c_1.type === "image"`，作为终端渲染这次计算的结果。
  return c_1.type === "image";
}
// _temp5 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(c_0) {
  // 返回 `c_0.type === "image"`，作为终端渲染这次计算的结果。
  return c_0.type === "image";
}
// _temp4 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(s) {
  // 返回 `s.toolPermissionContext.mode`，作为终端渲染这次计算的结果。
  return s.toolPermissionContext.mode;
}
// _temp3 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(c) {
  // 返回 `c.type === "image"`，作为终端渲染这次计算的结果。
  return c.type === "image";
}
// _temp2 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(contents) {
  // 返回 `Object.values(contents)`，作为终端渲染这次计算的结果。
  return Object.values(contents);
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(opt) {
  // 返回 `opt.preview`，作为终端渲染这次计算的结果。
  return opt.preview;
}
// convertImagesToBlocks 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function convertImagesToBlocks(images: PastedContent[]): Promise<ImageBlockParam[] | undefined> {
  // images 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (images.length === 0) return undefined;
  // 返回 `Promise.all(images.map(async img => {`，作为终端渲染这次计算的结果。
  return Promise.all(images.map(async img => {
    // block 集中保存权限确认界面 Ask User Question Permission...要一起传递的字段。
    const block: ImageBlockParam = {
      type: 'image',
      source: {
        type: 'base64',
        media_type: (img.mediaType || 'image/png') as Base64ImageSource['media_type'],
        data: img.content
      }
    };
    // resized统计`maybeResizeAndDownsampleImageBlock`，供终端渲染后续处理使用。
    const resized = await maybeResizeAndDownsampleImageBlock(block);
    // 返回 `resized.block`，作为终端渲染这次计算的结果。
    return resized.block;
  }));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJCYXNlNjRJbWFnZVNvdXJjZSIsIkltYWdlQmxvY2tQYXJhbSIsIlJlYWN0IiwiU3VzcGVuc2UiLCJ1c2UiLCJ1c2VDYWxsYmFjayIsInVzZU1lbW8iLCJ1c2VSZWYiLCJ1c2VTdGF0ZSIsInVzZVNldHRpbmdzIiwidXNlVGVybWluYWxTaXplIiwic3RyaW5nV2lkdGgiLCJ1c2VUaGVtZSIsInVzZUtleWJpbmRpbmdzIiwiQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyIsImxvZ0V2ZW50IiwidXNlQXBwU3RhdGUiLCJRdWVzdGlvbiIsIkFza1VzZXJRdWVzdGlvblRvb2wiLCJDbGlIaWdobGlnaHQiLCJnZXRDbGlIaWdobGlnaHRQcm9taXNlIiwiUGFzdGVkQ29udGVudCIsIkltYWdlRGltZW5zaW9ucyIsIm1heWJlUmVzaXplQW5kRG93bnNhbXBsZUltYWdlQmxvY2siLCJjYWNoZUltYWdlUGF0aCIsInN0b3JlSW1hZ2UiLCJsb2dFcnJvciIsImFwcGx5TWFya2Rvd24iLCJpc1BsYW5Nb2RlSW50ZXJ2aWV3UGhhc2VFbmFibGVkIiwiZ2V0UGxhbkZpbGVQYXRoIiwiUGVybWlzc2lvblJlcXVlc3RQcm9wcyIsIlF1ZXN0aW9uVmlldyIsIlN1Ym1pdFF1ZXN0aW9uc1ZpZXciLCJ1c2VNdWx0aXBsZUNob2ljZVN0YXRlIiwiTUlOX0NPTlRFTlRfSEVJR0hUIiwiTUlOX0NPTlRFTlRfV0lEVEgiLCJDT05URU5UX0NIUk9NRV9PVkVSSEVBRCIsIkFza1VzZXJRdWVzdGlvblBlcm1pc3Npb25SZXF1ZXN0IiwicHJvcHMiLCIkIiwiX2MiLCJzZXR0aW5ncyIsInN5bnRheEhpZ2hsaWdodGluZ0Rpc2FibGVkIiwidDAiLCJBc2tVc2VyUXVlc3Rpb25XaXRoSGlnaGxpZ2h0IiwiU3ltYm9sIiwiZm9yIiwiaGlnaGxpZ2h0IiwidDEiLCJBc2tVc2VyUXVlc3Rpb25QZXJtaXNzaW9uUmVxdWVzdEJvZHkiLCJ0b29sVXNlQ29uZmlybSIsIm9uRG9uZSIsIm9uUmVqZWN0IiwiaW5wdXQiLCJpbnB1dFNjaGVtYSIsInNhZmVQYXJzZSIsInJlc3VsdCIsInQyIiwiZGF0YSIsInN1Y2Nlc3MiLCJxdWVzdGlvbnMiLCJyb3dzIiwidGVybWluYWxSb3dzIiwidGhlbWUiLCJtYXhIZWlnaHQiLCJtYXhXaWR0aCIsIm1heEFsbG93ZWRIZWlnaHQiLCJNYXRoIiwibWF4IiwicSIsImhhc1ByZXZpZXciLCJvcHRpb25zIiwic29tZSIsIl90ZW1wIiwibWF4UHJldmlld0NvbnRlbnRMaW5lcyIsIm1heFByZXZpZXdCb3hIZWlnaHQiLCJvcHRfMCIsIm9wdCIsInByZXZpZXciLCJyZW5kZXJlZCIsInByZXZpZXdMaW5lcyIsInNwbGl0IiwiaXNUcnVuY2F0ZWQiLCJsZW5ndGgiLCJkaXNwbGF5ZWRMaW5lcyIsImxpbmUiLCJyaWdodFBhbmVsSGVpZ2h0IiwibGVmdFBhbmVsSGVpZ2h0Iiwic2lkZUJ5SGVpZ2h0IiwidDMiLCJtaW4iLCJ0NCIsInQ1IiwiZ2xvYmFsQ29udGVudEhlaWdodCIsImdsb2JhbENvbnRlbnRXaWR0aCIsIm1ldGFkYXRhU291cmNlIiwibWV0YWRhdGEiLCJzb3VyY2UiLCJ1bmRlZmluZWQiLCJ0NiIsInBhc3RlZENvbnRlbnRzQnlRdWVzdGlvbiIsInNldFBhc3RlZENvbnRlbnRzQnlRdWVzdGlvbiIsIm5leHRQYXN0ZUlkUmVmIiwidDciLCJvbkltYWdlUGFzdGUiLCJxdWVzdGlvblRleHQiLCJiYXNlNjRJbWFnZSIsIm1lZGlhVHlwZSIsImZpbGVuYW1lIiwiZGltZW5zaW9ucyIsIl9zb3VyY2VQYXRoIiwiY3VycmVudCIsInBhc3RlSWQiLCJuZXdDb250ZW50IiwiaWQiLCJ0eXBlIiwiY29udGVudCIsInByZXYiLCJ0OCIsInF1ZXN0aW9uVGV4dF8wIiwicHJldl8wIiwicXVlc3Rpb25Db250ZW50cyIsIm9uUmVtb3ZlSW1hZ2UiLCJ0OSIsIk9iamVjdCIsInZhbHVlcyIsImZsYXRNYXAiLCJfdGVtcDIiLCJmaWx0ZXIiLCJfdGVtcDMiLCJhbGxJbWFnZUF0dGFjaG1lbnRzIiwidG9vbFBlcm1pc3Npb25Db250ZXh0TW9kZSIsIl90ZW1wNCIsImlzSW5QbGFuTW9kZSIsInQxMCIsInBsYW5GaWxlUGF0aCIsInN0YXRlIiwiY3VycmVudFF1ZXN0aW9uSW5kZXgiLCJhbnN3ZXJzIiwicXVlc3Rpb25TdGF0ZXMiLCJpc0luVGV4dElucHV0IiwibmV4dFF1ZXN0aW9uIiwicHJldlF1ZXN0aW9uIiwidXBkYXRlUXVlc3Rpb25TdGF0ZSIsInNldEFuc3dlciIsInNldFRleHRJbnB1dE1vZGUiLCJjdXJyZW50UXVlc3Rpb24iLCJpc0luU3VibWl0VmlldyIsInQxMSIsImV2ZXJ5IiwicV8wIiwicXVlc3Rpb24iLCJhbGxRdWVzdGlvbnNBbnN3ZXJlZCIsImhpZGVTdWJtaXRUYWIiLCJtdWx0aVNlbGVjdCIsInQxMiIsInF1ZXN0aW9uQ291bnQiLCJpbnRlcnZpZXdQaGFzZUVuYWJsZWQiLCJoYW5kbGVDYW5jZWwiLCJ0MTMiLCJxdWVzdGlvbnNXaXRoQW5zd2VycyIsIm1hcCIsInFfMSIsImFuc3dlciIsImpvaW4iLCJmZWVkYmFjayIsImltYWdlQmxvY2tzIiwiY29udmVydEltYWdlc1RvQmxvY2tzIiwiaGFuZGxlUmVzcG9uZFRvQ2xhdWRlIiwidDE0IiwicXVlc3Rpb25zV2l0aEFuc3dlcnNfMCIsInFfMiIsImFuc3dlcl8wIiwiZmVlZGJhY2tfMCIsImltYWdlQmxvY2tzXzAiLCJoYW5kbGVGaW5pc2hQbGFuSW50ZXJ2aWV3IiwidDE1IiwiYW5zd2Vyc1RvU3VibWl0IiwiYW5zd2VyQ291bnQiLCJrZXlzIiwiYW5ub3RhdGlvbnMiLCJxXzMiLCJhbnN3ZXJfMSIsIm5vdGVzIiwidGV4dElucHV0VmFsdWUiLCJzZWxlY3RlZE9wdGlvbiIsImZpbmQiLCJvcHRfMSIsImxhYmVsIiwidHJpbSIsInVwZGF0ZWRJbnB1dCIsImNvbnRlbnRCbG9ja3MiLCJvbkFsbG93Iiwic3VibWl0QW5zd2VycyIsInQxNiIsInF1ZXN0aW9uVGV4dF8xIiwidGV4dElucHV0IiwidDE3Iiwic2hvdWxkQWR2YW5jZSIsImlzTXVsdGlTZWxlY3QiLCJBcnJheSIsImlzQXJyYXkiLCJxdWVzdGlvbkltYWdlcyIsIl90ZW1wNSIsInF1ZXN0aW9uSW1hZ2VzXzAiLCJfdGVtcDYiLCJpc1NpbmdsZVF1ZXN0aW9uIiwidXBkYXRlZEFuc3dlcnMiLCJjYXRjaCIsImhhbmRsZVF1ZXN0aW9uQW5zd2VyIiwiaGFuZGxlRmluYWxSZXNwb25zZSIsInZhbHVlIiwibWF4SW5kZXgiLCJ0MTgiLCJoYW5kbGVUYWJQcmV2IiwidDE5IiwiaGFuZGxlVGFiTmV4dCIsInQyMCIsInQyMSIsInQyMiIsImNvbnRleHQiLCJpc0FjdGl2ZSIsInQyMyIsImJhc2U2NCIsIm1lZGlhVHlwZV8wIiwiZmlsZW5hbWVfMCIsImRpbXMiLCJwYXRoIiwidDI0IiwidDI1IiwiaWRfMCIsInQyNiIsInBlcm1pc3Npb25SZXN1bHQiLCJjXzEiLCJjIiwiY18wIiwicyIsInRvb2xQZXJtaXNzaW9uQ29udGV4dCIsIm1vZGUiLCJjb250ZW50cyIsImltYWdlcyIsIlByb21pc2UiLCJhbGwiLCJpbWciLCJibG9jayIsIm1lZGlhX3R5cGUiLCJyZXNpemVkIl0sInNvdXJjZXMiOlsiQXNrVXNlclF1ZXN0aW9uUGVybWlzc2lvblJlcXVlc3QudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQmFzZTY0SW1hZ2VTb3VyY2UsXG4gIEltYWdlQmxvY2tQYXJhbSxcbn0gZnJvbSAnQGFudGhyb3BpYy1haS9zZGsvcmVzb3VyY2VzL21lc3NhZ2VzLm1qcydcbmltcG9ydCBSZWFjdCwge1xuICBTdXNwZW5zZSxcbiAgdXNlLFxuICB1c2VDYWxsYmFjayxcbiAgdXNlTWVtbyxcbiAgdXNlUmVmLFxuICB1c2VTdGF0ZSxcbn0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VTZXR0aW5ncyB9IGZyb20gJy4uLy4uLy4uL2hvb2tzL3VzZVNldHRpbmdzLmpzJ1xuaW1wb3J0IHsgdXNlVGVybWluYWxTaXplIH0gZnJvbSAnLi4vLi4vLi4vaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi8uLi8uLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyB1c2VUaGVtZSB9IGZyb20gJy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmdzIH0gZnJvbSAnLi4vLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7XG4gIHR5cGUgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgbG9nRXZlbnQsXG59IGZyb20gJy4uLy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlIH0gZnJvbSAnLi4vLi4vLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgdHlwZSB7IFF1ZXN0aW9uIH0gZnJvbSAnLi4vLi4vLi4vdG9vbHMvQXNrVXNlclF1ZXN0aW9uVG9vbC9Bc2tVc2VyUXVlc3Rpb25Ub29sLmpzJ1xuaW1wb3J0IHsgQXNrVXNlclF1ZXN0aW9uVG9vbCB9IGZyb20gJy4uLy4uLy4uL3Rvb2xzL0Fza1VzZXJRdWVzdGlvblRvb2wvQXNrVXNlclF1ZXN0aW9uVG9vbC5qcydcbmltcG9ydCB7XG4gIHR5cGUgQ2xpSGlnaGxpZ2h0LFxuICBnZXRDbGlIaWdobGlnaHRQcm9taXNlLFxufSBmcm9tICcuLi8uLi8uLi91dGlscy9jbGlIaWdobGlnaHQuanMnXG5pbXBvcnQgdHlwZSB7IFBhc3RlZENvbnRlbnQgfSBmcm9tICcuLi8uLi8uLi91dGlscy9jb25maWcuanMnXG5pbXBvcnQgdHlwZSB7IEltYWdlRGltZW5zaW9ucyB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2ltYWdlUmVzaXplci5qcydcbmltcG9ydCB7IG1heWJlUmVzaXplQW5kRG93bnNhbXBsZUltYWdlQmxvY2sgfSBmcm9tICcuLi8uLi8uLi91dGlscy9pbWFnZVJlc2l6ZXIuanMnXG5pbXBvcnQgeyBjYWNoZUltYWdlUGF0aCwgc3RvcmVJbWFnZSB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2ltYWdlU3RvcmUuanMnXG5pbXBvcnQgeyBsb2dFcnJvciB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2xvZy5qcydcbmltcG9ydCB7IGFwcGx5TWFya2Rvd24gfSBmcm9tICcuLi8uLi8uLi91dGlscy9tYXJrZG93bi5qcydcbmltcG9ydCB7IGlzUGxhbk1vZGVJbnRlcnZpZXdQaGFzZUVuYWJsZWQgfSBmcm9tICcuLi8uLi8uLi91dGlscy9wbGFuTW9kZVYyLmpzJ1xuaW1wb3J0IHsgZ2V0UGxhbkZpbGVQYXRoIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGxhbnMuanMnXG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMgfSBmcm9tICcuLi9QZXJtaXNzaW9uUmVxdWVzdC5qcydcbmltcG9ydCB7IFF1ZXN0aW9uVmlldyB9IGZyb20gJy4vUXVlc3Rpb25WaWV3LmpzJ1xuaW1wb3J0IHsgU3VibWl0UXVlc3Rpb25zVmlldyB9IGZyb20gJy4vU3VibWl0UXVlc3Rpb25zVmlldy5qcydcbmltcG9ydCB7IHVzZU11bHRpcGxlQ2hvaWNlU3RhdGUgfSBmcm9tICcuL3VzZS1tdWx0aXBsZS1jaG9pY2Utc3RhdGUuanMnXG5cbmNvbnN0IE1JTl9DT05URU5UX0hFSUdIVCA9IDEyXG5jb25zdCBNSU5fQ09OVEVOVF9XSURUSCA9IDQwXG4vLyBMaW5lcyB1c2VkIGJ5IGNocm9tZSBhcm91bmQgdGhlIGNvbnRlbnQgYXJlYSAobmF2IGJhciwgdGl0bGUsIGZvb3RlciwgaGVscCB0ZXh0LCBldGMuKVxuY29uc3QgQ09OVEVOVF9DSFJPTUVfT1ZFUkhFQUQgPSAxNVxuXG5leHBvcnQgZnVuY3Rpb24gQXNrVXNlclF1ZXN0aW9uUGVybWlzc2lvblJlcXVlc3QoXG4gIHByb3BzOiBQZXJtaXNzaW9uUmVxdWVzdFByb3BzLFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgc2V0dGluZ3MgPSB1c2VTZXR0aW5ncygpXG4gIGlmIChzZXR0aW5ncy5zeW50YXhIaWdobGlnaHRpbmdEaXNhYmxlZCkge1xuICAgIHJldHVybiA8QXNrVXNlclF1ZXN0aW9uUGVybWlzc2lvblJlcXVlc3RCb2R5IHsuLi5wcm9wc30gaGlnaGxpZ2h0PXtudWxsfSAvPlxuICB9XG4gIHJldHVybiAoXG4gICAgPFN1c3BlbnNlXG4gICAgICBmYWxsYmFjaz17XG4gICAgICAgIDxBc2tVc2VyUXVlc3Rpb25QZXJtaXNzaW9uUmVxdWVzdEJvZHkgey4uLnByb3BzfSBoaWdobGlnaHQ9e251bGx9IC8+XG4gICAgICB9XG4gICAgPlxuICAgICAgPEFza1VzZXJRdWVzdGlvbldpdGhIaWdobGlnaHQgey4uLnByb3BzfSAvPlxuICAgIDwvU3VzcGVuc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gQXNrVXNlclF1ZXN0aW9uV2l0aEhpZ2hsaWdodChcbiAgcHJvcHM6IFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMsXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBoaWdobGlnaHQgPSB1c2UoZ2V0Q2xpSGlnaGxpZ2h0UHJvbWlzZSgpKVxuICByZXR1cm4gKFxuICAgIDxBc2tVc2VyUXVlc3Rpb25QZXJtaXNzaW9uUmVxdWVzdEJvZHkgey4uLnByb3BzfSBoaWdobGlnaHQ9e2hpZ2hsaWdodH0gLz5cbiAgKVxufVxuXG5mdW5jdGlvbiBBc2tVc2VyUXVlc3Rpb25QZXJtaXNzaW9uUmVxdWVzdEJvZHkoe1xuICB0b29sVXNlQ29uZmlybSxcbiAgb25Eb25lLFxuICBvblJlamVjdCxcbiAgaGlnaGxpZ2h0LFxufTogUGVybWlzc2lvblJlcXVlc3RQcm9wcyAmIHtcbiAgaGlnaGxpZ2h0OiBDbGlIaWdobGlnaHQgfCBudWxsXG59KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgLy8gTWVtb2l6ZSBwYXJzZSByZXN1bHQ6IHNhZmVQYXJzZSByZXR1cm5zIGEgbmV3IG9iamVjdCAoYW5kIG5ldyBgcXVlc3Rpb25zYFxuICAvLyBhcnJheSkgb24gZXZlcnkgY2FsbC4gV2l0aG91dCB0aGlzLCB0aGUgcmVuZGVyLWJvZHkgcmVmIHdyaXRlcyBiZWxvdyBtYWtlXG4gIC8vIFJlYWN0IENvbXBpbGVyIGJhaWwgb3V0IG9uIHRoaXMgY29tcG9uZW50LCBzbyBub3RoaW5nIGlzIGF1dG8tbWVtb2l6ZWQg4oCUXG4gIC8vIGBxdWVzdGlvbnNgIGNoYW5nZXMgaWRlbnRpdHkgZXZlcnkgcmVuZGVyLCBhbmQgdGhlIGBnbG9iYWxDb250ZW50SGVpZ2h0YFxuICAvLyB1c2VNZW1vICh3aGljaCBydW5zIGFwcGx5TWFya2Rvd24gb3ZlciBldmVyeSBwcmV2aWV3KSBuZXZlciBoaXRzIGl0cyBjYWNoZS5cbiAgLy8gYHRvb2xVc2VDb25maXJtLmlucHV0YCBpcyBzdGFibGUgZm9yIHRoZSBkaWFsb2cncyBsaWZldGltZSAodGhpcyB0b29sXG4gIC8vIHJldHVybnMgYGJlaGF2aW9yOiAnYXNrJ2AgZGlyZWN0bHkgYW5kIG5ldmVyIGdvZXMgdGhyb3VnaCB0aGUgY2xhc3NpZmllcikuXG4gIGNvbnN0IHJlc3VsdCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gQXNrVXNlclF1ZXN0aW9uVG9vbC5pbnB1dFNjaGVtYS5zYWZlUGFyc2UodG9vbFVzZUNvbmZpcm0uaW5wdXQpLFxuICAgIFt0b29sVXNlQ29uZmlybS5pbnB1dF0sXG4gIClcbiAgY29uc3QgcXVlc3Rpb25zID0gcmVzdWx0LnN1Y2Nlc3MgPyByZXN1bHQuZGF0YS5xdWVzdGlvbnMgfHwgW10gOiBbXVxuICBjb25zdCB7IHJvd3M6IHRlcm1pbmFsUm93cyB9ID0gdXNlVGVybWluYWxTaXplKClcbiAgY29uc3QgW3RoZW1lXSA9IHVzZVRoZW1lKClcblxuICAvLyBDYWxjdWxhdGUgY29uc2lzdGVudCBjb250ZW50IGRpbWVuc2lvbnMgYWNyb3NzIGFsbCBxdWVzdGlvbnMgdG8gcHJldmVudCBsYXlvdXQgc2hpZnRzLlxuICAvLyBnbG9iYWxDb250ZW50SGVpZ2h0IHJlcHJlc2VudHMgdGhlIHRvdGFsIGhlaWdodCBvZiB0aGUgY29udGVudCBhcmVhIGJlbG93IHRoZSBuYXYvdGl0bGUsXG4gIC8vIElOQ0xVRElORyBmb290ZXIgYW5kIGhlbHAgdGV4dCwgc28gYWxsIHZpZXdzIChxdWVzdGlvbnMsIHByZXZpZXdzLCBzdWJtaXQpIG1hdGNoLlxuICBjb25zdCB7IGdsb2JhbENvbnRlbnRIZWlnaHQsIGdsb2JhbENvbnRlbnRXaWR0aCB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgbGV0IG1heEhlaWdodCA9IDBcbiAgICBsZXQgbWF4V2lkdGggPSAwXG5cbiAgICAvLyBGb290ZXIgKGRpdmlkZXIgKyBcIkNoYXQgYWJvdXQgdGhpc1wiICsgb3B0aW9uYWwgcGxhbikgKyBoZWxwIHRleHQg4omIIDcgbGluZXNcbiAgICBjb25zdCBGT09URVJfSEVMUF9MSU5FUyA9IDdcblxuICAgIC8vIENhcCBhdCB0ZXJtaW5hbCBoZWlnaHQgbWludXMgY2hyb21lIG92ZXJoZWFkLCBidXQgZW5zdXJlIGF0IGxlYXN0IE1JTl9DT05URU5UX0hFSUdIVFxuICAgIGNvbnN0IG1heEFsbG93ZWRIZWlnaHQgPSBNYXRoLm1heChcbiAgICAgIE1JTl9DT05URU5UX0hFSUdIVCxcbiAgICAgIHRlcm1pbmFsUm93cyAtIENPTlRFTlRfQ0hST01FX09WRVJIRUFELFxuICAgIClcblxuICAgIC8vIFBSRVZJRVdfT1ZFUkhFQUQgbWF0Y2hlcyB0aGUgY29uc3RhbnQgaW4gUHJldmlld1F1ZXN0aW9uVmlldy50c3gg4oCUIGxpbmVzXG4gICAgLy8gdXNlZCBieSBub24tcHJldmlldyBlbGVtZW50cyB3aXRoaW4gdGhlIGNvbnRlbnQgYXJlYSAobWFyZ2lucywgYm9yZGVycyxcbiAgICAvLyBub3RlcywgZm9vdGVyLCBoZWxwIHRleHQpLiBVc2VkIGhlcmUgdG8gY2FwIHByZXZpZXcgY29udGVudCBzbyB0aGF0XG4gICAgLy8gZ2xvYmFsQ29udGVudEhlaWdodCByZWZsZWN0cyB0aGUgKnRydW5jYXRlZCogaGVpZ2h0LCBub3QgdGhlIHJhdyBoZWlnaHQuXG4gICAgY29uc3QgUFJFVklFV19PVkVSSEVBRCA9IDExXG5cbiAgICBmb3IgKGNvbnN0IHEgb2YgcXVlc3Rpb25zKSB7XG4gICAgICBjb25zdCBoYXNQcmV2aWV3ID0gcS5vcHRpb25zLnNvbWUob3B0ID0+IG9wdC5wcmV2aWV3KVxuXG4gICAgICBpZiAoaGFzUHJldmlldykge1xuICAgICAgICAvLyBDb21wdXRlIHRoZSBtYXggcHJldmlldyBjb250ZW50IGxpbmVzIHRoYXQgd291bGQgYWN0dWFsbHkgZGlzcGxheVxuICAgICAgICAvLyBhZnRlciB0cnVuY2F0aW9uLCBtYXRjaGluZyB0aGUgbG9naWMgaW4gUHJldmlld1F1ZXN0aW9uVmlldy5cbiAgICAgICAgY29uc3QgbWF4UHJldmlld0NvbnRlbnRMaW5lcyA9IE1hdGgubWF4KFxuICAgICAgICAgIDEsXG4gICAgICAgICAgbWF4QWxsb3dlZEhlaWdodCAtIFBSRVZJRVdfT1ZFUkhFQUQsXG4gICAgICAgIClcblxuICAgICAgICAvLyBGb3IgcHJldmlldyBxdWVzdGlvbnMsIHRvdGFsID0gc2lkZS1ieS1zaWRlIGhlaWdodCArIGZvb3Rlci9oZWxwXG4gICAgICAgIC8vIFNpZGUtYnktc2lkZSA9IG1heChsZWZ0IHBhbmVsLCByaWdodCBwYW5lbClcbiAgICAgICAgLy8gUmlnaHQgcGFuZWwgPSBwcmV2aWV3IGJveCAoY29udGVudCArIGJvcmRlcnMgKyB0cnVuY2F0aW9uIGluZGljYXRvcikgKyBub3Rlc1xuICAgICAgICBsZXQgbWF4UHJldmlld0JveEhlaWdodCA9IDBcbiAgICAgICAgZm9yIChjb25zdCBvcHQgb2YgcS5vcHRpb25zKSB7XG4gICAgICAgICAgaWYgKG9wdC5wcmV2aWV3KSB7XG4gICAgICAgICAgICAvLyBNZWFzdXJlIHRoZSAqcmVuZGVyZWQqIG1hcmtkb3duIChzYW1lIHRyYW5zZm9ybSBhcyBQcmV2aWV3Qm94KSBzb1xuICAgICAgICAgICAgLy8gdGhhdCBsaW5lIGNvdW50cyBhbmQgd2lkdGhzIG1hdGNoIHdoYXQgd2lsbCBhY3R1YWxseSBiZSBkaXNwbGF5ZWQuXG4gICAgICAgICAgICAvLyBhcHBseU1hcmtkb3duIHJlbW92ZXMgY29kZSBmZW5jZSBtYXJrZXJzLCBib2xkL2l0YWxpYyBzeW50YXgsIGV0Yy5cbiAgICAgICAgICAgIGNvbnN0IHJlbmRlcmVkID0gYXBwbHlNYXJrZG93bihvcHQucHJldmlldywgdGhlbWUsIGhpZ2hsaWdodClcbiAgICAgICAgICAgIGNvbnN0IHByZXZpZXdMaW5lcyA9IHJlbmRlcmVkLnNwbGl0KCdcXG4nKVxuICAgICAgICAgICAgY29uc3QgaXNUcnVuY2F0ZWQgPSBwcmV2aWV3TGluZXMubGVuZ3RoID4gbWF4UHJldmlld0NvbnRlbnRMaW5lc1xuICAgICAgICAgICAgY29uc3QgZGlzcGxheWVkTGluZXMgPSBpc1RydW5jYXRlZFxuICAgICAgICAgICAgICA/IG1heFByZXZpZXdDb250ZW50TGluZXNcbiAgICAgICAgICAgICAgOiBwcmV2aWV3TGluZXMubGVuZ3RoXG4gICAgICAgICAgICAvLyBQcmV2aWV3IGJveDogZGlzcGxheWVkIGNvbnRlbnQgKyB0cnVuY2F0aW9uIGluZGljYXRvciArIDIgYm9yZGVyc1xuICAgICAgICAgICAgbWF4UHJldmlld0JveEhlaWdodCA9IE1hdGgubWF4KFxuICAgICAgICAgICAgICBtYXhQcmV2aWV3Qm94SGVpZ2h0LFxuICAgICAgICAgICAgICBkaXNwbGF5ZWRMaW5lcyArIChpc1RydW5jYXRlZCA/IDEgOiAwKSArIDIsXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgcHJldmlld0xpbmVzKSB7XG4gICAgICAgICAgICAgIG1heFdpZHRoID0gTWF0aC5tYXgobWF4V2lkdGgsIHN0cmluZ1dpZHRoKGxpbmUpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBSaWdodCBwYW5lbDogcHJldmlldyBib3ggKyBub3RlcyAoMiBsaW5lcyB3aXRoIG1hcmdpbilcbiAgICAgICAgY29uc3QgcmlnaHRQYW5lbEhlaWdodCA9IG1heFByZXZpZXdCb3hIZWlnaHQgKyAyXG4gICAgICAgIC8vIExlZnQgcGFuZWw6IG9wdGlvbnMgKyBkZXNjcmlwdGlvblxuICAgICAgICBjb25zdCBsZWZ0UGFuZWxIZWlnaHQgPSBxLm9wdGlvbnMubGVuZ3RoICsgMlxuICAgICAgICBjb25zdCBzaWRlQnlIZWlnaHQgPSBNYXRoLm1heChsZWZ0UGFuZWxIZWlnaHQsIHJpZ2h0UGFuZWxIZWlnaHQpXG4gICAgICAgIG1heEhlaWdodCA9IE1hdGgubWF4KG1heEhlaWdodCwgc2lkZUJ5SGVpZ2h0ICsgRk9PVEVSX0hFTFBfTElORVMpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGb3IgcmVndWxhciBxdWVzdGlvbnM6IG9wdGlvbnMgKyBcIk90aGVyXCIgKyBmb290ZXIvaGVscFxuICAgICAgICBtYXhIZWlnaHQgPSBNYXRoLm1heChcbiAgICAgICAgICBtYXhIZWlnaHQsXG4gICAgICAgICAgcS5vcHRpb25zLmxlbmd0aCArIDMgKyBGT09URVJfSEVMUF9MSU5FUyxcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBnbG9iYWxDb250ZW50SGVpZ2h0OiBNYXRoLm1pbihcbiAgICAgICAgTWF0aC5tYXgobWF4SGVpZ2h0LCBNSU5fQ09OVEVOVF9IRUlHSFQpLFxuICAgICAgICBtYXhBbGxvd2VkSGVpZ2h0LFxuICAgICAgKSxcbiAgICAgIGdsb2JhbENvbnRlbnRXaWR0aDogTWF0aC5tYXgobWF4V2lkdGgsIE1JTl9DT05URU5UX1dJRFRIKSxcbiAgICB9XG4gIH0sIFtxdWVzdGlvbnMsIHRlcm1pbmFsUm93cywgdGhlbWUsIGhpZ2hsaWdodF0pXG4gIGNvbnN0IG1ldGFkYXRhU291cmNlID0gcmVzdWx0LnN1Y2Nlc3NcbiAgICA/IHJlc3VsdC5kYXRhLm1ldGFkYXRhPy5zb3VyY2VcbiAgICA6IHVuZGVmaW5lZFxuXG4gIGNvbnN0IFtwYXN0ZWRDb250ZW50c0J5UXVlc3Rpb24sIHNldFBhc3RlZENvbnRlbnRzQnlRdWVzdGlvbl0gPSB1c2VTdGF0ZTxcbiAgICBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8bnVtYmVyLCBQYXN0ZWRDb250ZW50Pj5cbiAgPih7fSlcbiAgY29uc3QgbmV4dFBhc3RlSWRSZWYgPSB1c2VSZWYoMClcblxuICBmdW5jdGlvbiBvbkltYWdlUGFzdGUoXG4gICAgcXVlc3Rpb25UZXh0OiBzdHJpbmcsXG4gICAgYmFzZTY0SW1hZ2U6IHN0cmluZyxcbiAgICBtZWRpYVR5cGU/OiBzdHJpbmcsXG4gICAgZmlsZW5hbWU/OiBzdHJpbmcsXG4gICAgZGltZW5zaW9ucz86IEltYWdlRGltZW5zaW9ucyxcbiAgICBfc291cmNlUGF0aD86IHN0cmluZyxcbiAgKSB7XG4gICAgY29uc3QgcGFzdGVJZCA9IG5leHRQYXN0ZUlkUmVmLmN1cnJlbnQrK1xuICAgIGNvbnN0IG5ld0NvbnRlbnQ6IFBhc3RlZENvbnRlbnQgPSB7XG4gICAgICBpZDogcGFzdGVJZCxcbiAgICAgIHR5cGU6ICdpbWFnZScsXG4gICAgICBjb250ZW50OiBiYXNlNjRJbWFnZSxcbiAgICAgIG1lZGlhVHlwZTogbWVkaWFUeXBlIHx8ICdpbWFnZS9wbmcnLFxuICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lIHx8ICdQYXN0ZWQgaW1hZ2UnLFxuICAgICAgZGltZW5zaW9ucyxcbiAgICB9XG4gICAgY2FjaGVJbWFnZVBhdGgobmV3Q29udGVudClcbiAgICB2b2lkIHN0b3JlSW1hZ2UobmV3Q29udGVudClcbiAgICBzZXRQYXN0ZWRDb250ZW50c0J5UXVlc3Rpb24ocHJldiA9PiAoe1xuICAgICAgLi4ucHJldixcbiAgICAgIFtxdWVzdGlvblRleHRdOiB7IC4uLihwcmV2W3F1ZXN0aW9uVGV4dF0gPz8ge30pLCBbcGFzdGVJZF06IG5ld0NvbnRlbnQgfSxcbiAgICB9KSlcbiAgfVxuXG4gIGNvbnN0IG9uUmVtb3ZlSW1hZ2UgPSB1c2VDYWxsYmFjaygocXVlc3Rpb25UZXh0OiBzdHJpbmcsIGlkOiBudW1iZXIpID0+IHtcbiAgICBzZXRQYXN0ZWRDb250ZW50c0J5UXVlc3Rpb24ocHJldiA9PiB7XG4gICAgICBjb25zdCBxdWVzdGlvbkNvbnRlbnRzID0geyAuLi4ocHJldltxdWVzdGlvblRleHRdID8/IHt9KSB9XG4gICAgICBkZWxldGUgcXVlc3Rpb25Db250ZW50c1tpZF1cbiAgICAgIHJldHVybiB7IC4uLnByZXYsIFtxdWVzdGlvblRleHRdOiBxdWVzdGlvbkNvbnRlbnRzIH1cbiAgICB9KVxuICB9LCBbXSlcblxuICBjb25zdCBhbGxJbWFnZUF0dGFjaG1lbnRzID0gT2JqZWN0LnZhbHVlcyhwYXN0ZWRDb250ZW50c0J5UXVlc3Rpb24pXG4gICAgLmZsYXRNYXAoY29udGVudHMgPT4gT2JqZWN0LnZhbHVlcyhjb250ZW50cykpXG4gICAgLmZpbHRlcihjID0+IGMudHlwZSA9PT0gJ2ltYWdlJylcblxuICBjb25zdCB0b29sUGVybWlzc2lvbkNvbnRleHRNb2RlID0gdXNlQXBwU3RhdGUoXG4gICAgcyA9PiBzLnRvb2xQZXJtaXNzaW9uQ29udGV4dC5tb2RlLFxuICApXG4gIGNvbnN0IGlzSW5QbGFuTW9kZSA9IHRvb2xQZXJtaXNzaW9uQ29udGV4dE1vZGUgPT09ICdwbGFuJ1xuICBjb25zdCBwbGFuRmlsZVBhdGggPSBpc0luUGxhbk1vZGUgPyBnZXRQbGFuRmlsZVBhdGgoKSA6IHVuZGVmaW5lZFxuXG4gIGNvbnN0IHN0YXRlID0gdXNlTXVsdGlwbGVDaG9pY2VTdGF0ZSgpXG4gIGNvbnN0IHtcbiAgICBjdXJyZW50UXVlc3Rpb25JbmRleCxcbiAgICBhbnN3ZXJzLFxuICAgIHF1ZXN0aW9uU3RhdGVzLFxuICAgIGlzSW5UZXh0SW5wdXQsXG4gICAgbmV4dFF1ZXN0aW9uLFxuICAgIHByZXZRdWVzdGlvbixcbiAgICB1cGRhdGVRdWVzdGlvblN0YXRlLFxuICAgIHNldEFuc3dlcixcbiAgICBzZXRUZXh0SW5wdXRNb2RlLFxuICB9ID0gc3RhdGVcblxuICBjb25zdCBjdXJyZW50UXVlc3Rpb24gPVxuICAgIGN1cnJlbnRRdWVzdGlvbkluZGV4IDwgKHF1ZXN0aW9ucz8ubGVuZ3RoIHx8IDApXG4gICAgICA/IHF1ZXN0aW9ucz8uW2N1cnJlbnRRdWVzdGlvbkluZGV4XVxuICAgICAgOiBudWxsXG5cbiAgY29uc3QgaXNJblN1Ym1pdFZpZXcgPSBjdXJyZW50UXVlc3Rpb25JbmRleCA9PT0gKHF1ZXN0aW9ucz8ubGVuZ3RoIHx8IDApXG4gIGNvbnN0IGFsbFF1ZXN0aW9uc0Fuc3dlcmVkID1cbiAgICBxdWVzdGlvbnM/LmV2ZXJ5KChxOiBRdWVzdGlvbikgPT4gcT8ucXVlc3Rpb24gJiYgISFhbnN3ZXJzW3EucXVlc3Rpb25dKSA/P1xuICAgIGZhbHNlXG5cbiAgLy8gSGlkZSBzdWJtaXQgdGFiIHdoZW4gdGhlcmUncyBvbmx5IG9uZSBxdWVzdGlvbiBhbmQgaXQncyBzaW5nbGUtc2VsZWN0IChhdXRvLXN1Ym1pdCBzY2VuYXJpbylcbiAgY29uc3QgaGlkZVN1Ym1pdFRhYiA9IHF1ZXN0aW9ucy5sZW5ndGggPT09IDEgJiYgIXF1ZXN0aW9uc1swXT8ubXVsdGlTZWxlY3RcblxuICBjb25zdCBoYW5kbGVDYW5jZWwgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgLy8gTG9nIHJlamVjdGlvbiB3aXRoIG1ldGFkYXRhIHNvdXJjZSBpZiBwcmVzZW50XG4gICAgaWYgKG1ldGFkYXRhU291cmNlKSB7XG4gICAgICBsb2dFdmVudCgndGVuZ3VfYXNrX3VzZXJfcXVlc3Rpb25fcmVqZWN0ZWQnLCB7XG4gICAgICAgIHNvdXJjZTpcbiAgICAgICAgICBtZXRhZGF0YVNvdXJjZSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBxdWVzdGlvbkNvdW50OiBxdWVzdGlvbnMubGVuZ3RoLFxuICAgICAgICBpc0luUGxhbk1vZGUsXG4gICAgICAgIGludGVydmlld1BoYXNlRW5hYmxlZDpcbiAgICAgICAgICBpc0luUGxhbk1vZGUgJiYgaXNQbGFuTW9kZUludGVydmlld1BoYXNlRW5hYmxlZCgpLFxuICAgICAgfSlcbiAgICB9XG4gICAgb25Eb25lKClcbiAgICBvblJlamVjdCgpXG4gICAgdG9vbFVzZUNvbmZpcm0ub25SZWplY3QoKVxuICB9LCBbXG4gICAgb25Eb25lLFxuICAgIG9uUmVqZWN0LFxuICAgIHRvb2xVc2VDb25maXJtLFxuICAgIG1ldGFkYXRhU291cmNlLFxuICAgIHF1ZXN0aW9ucy5sZW5ndGgsXG4gICAgaXNJblBsYW5Nb2RlLFxuICBdKVxuXG4gIGNvbnN0IGhhbmRsZVJlc3BvbmRUb0NsYXVkZSA9IHVzZUNhbGxiYWNrKGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBxdWVzdGlvbnNXaXRoQW5zd2VycyA9IHF1ZXN0aW9uc1xuICAgICAgLm1hcCgocTogUXVlc3Rpb24pID0+IHtcbiAgICAgICAgY29uc3QgYW5zd2VyID0gYW5zd2Vyc1txLnF1ZXN0aW9uXVxuICAgICAgICBpZiAoYW5zd2VyKSB7XG4gICAgICAgICAgcmV0dXJuIGAtIFwiJHtxLnF1ZXN0aW9ufVwiXFxuICBBbnN3ZXI6ICR7YW5zd2VyfWBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYC0gXCIke3EucXVlc3Rpb259XCJcXG4gIChObyBhbnN3ZXIgcHJvdmlkZWQpYFxuICAgICAgfSlcbiAgICAgIC5qb2luKCdcXG4nKVxuXG4gICAgY29uc3QgZmVlZGJhY2sgPSBgVGhlIHVzZXIgd2FudHMgdG8gY2xhcmlmeSB0aGVzZSBxdWVzdGlvbnMuXG4gICAgVGhpcyBtZWFucyB0aGV5IG1heSBoYXZlIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24sIGNvbnRleHQgb3IgcXVlc3Rpb25zIGZvciB5b3UuXG4gICAgVGFrZSB0aGVpciByZXNwb25zZSBpbnRvIGFjY291bnQgYW5kIHRoZW4gcmVmb3JtdWxhdGUgdGhlIHF1ZXN0aW9ucyBpZiBhcHByb3ByaWF0ZS5cbiAgICBTdGFydCBieSBhc2tpbmcgdGhlbSB3aGF0IHRoZXkgd291bGQgbGlrZSB0byBjbGFyaWZ5LlxuXG4gICAgUXVlc3Rpb25zIGFza2VkOlxcbiR7cXVlc3Rpb25zV2l0aEFuc3dlcnN9YFxuXG4gICAgaWYgKG1ldGFkYXRhU291cmNlKSB7XG4gICAgICBsb2dFdmVudCgndGVuZ3VfYXNrX3VzZXJfcXVlc3Rpb25fcmVzcG9uZF90b19jbGF1ZGUnLCB7XG4gICAgICAgIHNvdXJjZTpcbiAgICAgICAgICBtZXRhZGF0YVNvdXJjZSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBxdWVzdGlvbkNvdW50OiBxdWVzdGlvbnMubGVuZ3RoLFxuICAgICAgICBpc0luUGxhbk1vZGUsXG4gICAgICAgIGludGVydmlld1BoYXNlRW5hYmxlZDpcbiAgICAgICAgICBpc0luUGxhbk1vZGUgJiYgaXNQbGFuTW9kZUludGVydmlld1BoYXNlRW5hYmxlZCgpLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCBpbWFnZUJsb2NrcyA9IGF3YWl0IGNvbnZlcnRJbWFnZXNUb0Jsb2NrcyhhbGxJbWFnZUF0dGFjaG1lbnRzKVxuXG4gICAgb25Eb25lKClcbiAgICB0b29sVXNlQ29uZmlybS5vblJlamVjdChcbiAgICAgIGZlZWRiYWNrLFxuICAgICAgaW1hZ2VCbG9ja3MgJiYgaW1hZ2VCbG9ja3MubGVuZ3RoID4gMCA/IGltYWdlQmxvY2tzIDogdW5kZWZpbmVkLFxuICAgIClcbiAgfSwgW1xuICAgIHF1ZXN0aW9ucyxcbiAgICBhbnN3ZXJzLFxuICAgIG9uRG9uZSxcbiAgICB0b29sVXNlQ29uZmlybSxcbiAgICBtZXRhZGF0YVNvdXJjZSxcbiAgICBpc0luUGxhbk1vZGUsXG4gICAgYWxsSW1hZ2VBdHRhY2htZW50cyxcbiAgXSlcblxuICBjb25zdCBoYW5kbGVGaW5pc2hQbGFuSW50ZXJ2aWV3ID0gdXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHF1ZXN0aW9uc1dpdGhBbnN3ZXJzID0gcXVlc3Rpb25zXG4gICAgICAubWFwKChxOiBRdWVzdGlvbikgPT4ge1xuICAgICAgICBjb25zdCBhbnN3ZXIgPSBhbnN3ZXJzW3EucXVlc3Rpb25dXG4gICAgICAgIGlmIChhbnN3ZXIpIHtcbiAgICAgICAgICByZXR1cm4gYC0gXCIke3EucXVlc3Rpb259XCJcXG4gIEFuc3dlcjogJHthbnN3ZXJ9YFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBgLSBcIiR7cS5xdWVzdGlvbn1cIlxcbiAgKE5vIGFuc3dlciBwcm92aWRlZClgXG4gICAgICB9KVxuICAgICAgLmpvaW4oJ1xcbicpXG5cbiAgICBjb25zdCBmZWVkYmFjayA9IGBUaGUgdXNlciBoYXMgaW5kaWNhdGVkIHRoZXkgaGF2ZSBwcm92aWRlZCBlbm91Z2ggYW5zd2VycyBmb3IgdGhlIHBsYW4gaW50ZXJ2aWV3LlxuU3RvcCBhc2tpbmcgY2xhcmlmeWluZyBxdWVzdGlvbnMgYW5kIHByb2NlZWQgdG8gZmluaXNoIHRoZSBwbGFuIHdpdGggdGhlIGluZm9ybWF0aW9uIHlvdSBoYXZlLlxuXG5RdWVzdGlvbnMgYXNrZWQgYW5kIGFuc3dlcnMgcHJvdmlkZWQ6XFxuJHtxdWVzdGlvbnNXaXRoQW5zd2Vyc31gXG5cbiAgICBpZiAobWV0YWRhdGFTb3VyY2UpIHtcbiAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9hc2tfdXNlcl9xdWVzdGlvbl9maW5pc2hfcGxhbl9pbnRlcnZpZXcnLCB7XG4gICAgICAgIHNvdXJjZTpcbiAgICAgICAgICBtZXRhZGF0YVNvdXJjZSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBxdWVzdGlvbkNvdW50OiBxdWVzdGlvbnMubGVuZ3RoLFxuICAgICAgICBpc0luUGxhbk1vZGUsXG4gICAgICAgIGludGVydmlld1BoYXNlRW5hYmxlZDpcbiAgICAgICAgICBpc0luUGxhbk1vZGUgJiYgaXNQbGFuTW9kZUludGVydmlld1BoYXNlRW5hYmxlZCgpLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCBpbWFnZUJsb2NrcyA9IGF3YWl0IGNvbnZlcnRJbWFnZXNUb0Jsb2NrcyhhbGxJbWFnZUF0dGFjaG1lbnRzKVxuXG4gICAgb25Eb25lKClcbiAgICB0b29sVXNlQ29uZmlybS5vblJlamVjdChcbiAgICAgIGZlZWRiYWNrLFxuICAgICAgaW1hZ2VCbG9ja3MgJiYgaW1hZ2VCbG9ja3MubGVuZ3RoID4gMCA/IGltYWdlQmxvY2tzIDogdW5kZWZpbmVkLFxuICAgIClcbiAgfSwgW1xuICAgIHF1ZXN0aW9ucyxcbiAgICBhbnN3ZXJzLFxuICAgIG9uRG9uZSxcbiAgICB0b29sVXNlQ29uZmlybSxcbiAgICBtZXRhZGF0YVNvdXJjZSxcbiAgICBpc0luUGxhbk1vZGUsXG4gICAgYWxsSW1hZ2VBdHRhY2htZW50cyxcbiAgXSlcblxuICBjb25zdCBzdWJtaXRBbnN3ZXJzID0gdXNlQ2FsbGJhY2soXG4gICAgYXN5bmMgKGFuc3dlcnNUb1N1Ym1pdDogUmVjb3JkPHN0cmluZywgc3RyaW5nPikgPT4ge1xuICAgICAgLy8gTG9nIGFjY2VwdGFuY2Ugd2l0aCBtZXRhZGF0YSBzb3VyY2UgaWYgcHJlc2VudFxuICAgICAgaWYgKG1ldGFkYXRhU291cmNlKSB7XG4gICAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9hc2tfdXNlcl9xdWVzdGlvbl9hY2NlcHRlZCcsIHtcbiAgICAgICAgICBzb3VyY2U6XG4gICAgICAgICAgICBtZXRhZGF0YVNvdXJjZSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICAgIHF1ZXN0aW9uQ291bnQ6IHF1ZXN0aW9ucy5sZW5ndGgsXG4gICAgICAgICAgYW5zd2VyQ291bnQ6IE9iamVjdC5rZXlzKGFuc3dlcnNUb1N1Ym1pdCkubGVuZ3RoLFxuICAgICAgICAgIGlzSW5QbGFuTW9kZSxcbiAgICAgICAgICBpbnRlcnZpZXdQaGFzZUVuYWJsZWQ6XG4gICAgICAgICAgICBpc0luUGxhbk1vZGUgJiYgaXNQbGFuTW9kZUludGVydmlld1BoYXNlRW5hYmxlZCgpLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgLy8gQnVpbGQgYW5ub3RhdGlvbnMgZnJvbSBxdWVzdGlvblN0YXRlcyAoZS5nLiwgc2VsZWN0ZWQgcHJldmlldywgdXNlciBub3RlcylcbiAgICAgIGNvbnN0IGFubm90YXRpb25zOiBSZWNvcmQ8c3RyaW5nLCB7IHByZXZpZXc/OiBzdHJpbmc7IG5vdGVzPzogc3RyaW5nIH0+ID1cbiAgICAgICAge31cbiAgICAgIGZvciAoY29uc3QgcSBvZiBxdWVzdGlvbnMpIHtcbiAgICAgICAgY29uc3QgYW5zd2VyID0gYW5zd2Vyc1RvU3VibWl0W3EucXVlc3Rpb25dXG4gICAgICAgIGNvbnN0IG5vdGVzID0gcXVlc3Rpb25TdGF0ZXNbcS5xdWVzdGlvbl0/LnRleHRJbnB1dFZhbHVlXG4gICAgICAgIC8vIEZpbmQgdGhlIHNlbGVjdGVkIG9wdGlvbidzIHByZXZpZXcgY29udGVudFxuICAgICAgICBjb25zdCBzZWxlY3RlZE9wdGlvbiA9IGFuc3dlclxuICAgICAgICAgID8gcS5vcHRpb25zLmZpbmQob3B0ID0+IG9wdC5sYWJlbCA9PT0gYW5zd2VyKVxuICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgIGNvbnN0IHByZXZpZXcgPSBzZWxlY3RlZE9wdGlvbj8ucHJldmlld1xuICAgICAgICBpZiAocHJldmlldyB8fCBub3Rlcz8udHJpbSgpKSB7XG4gICAgICAgICAgYW5ub3RhdGlvbnNbcS5xdWVzdGlvbl0gPSB7XG4gICAgICAgICAgICAuLi4ocHJldmlldyAmJiB7IHByZXZpZXcgfSksXG4gICAgICAgICAgICAuLi4obm90ZXM/LnRyaW0oKSAmJiB7IG5vdGVzOiBub3Rlcy50cmltKCkgfSksXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVwZGF0ZWRJbnB1dCA9IHtcbiAgICAgICAgLi4udG9vbFVzZUNvbmZpcm0uaW5wdXQsXG4gICAgICAgIGFuc3dlcnM6IGFuc3dlcnNUb1N1Ym1pdCxcbiAgICAgICAgLi4uKE9iamVjdC5rZXlzKGFubm90YXRpb25zKS5sZW5ndGggPiAwICYmIHsgYW5ub3RhdGlvbnMgfSksXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRlbnRCbG9ja3MgPSBhd2FpdCBjb252ZXJ0SW1hZ2VzVG9CbG9ja3MoYWxsSW1hZ2VBdHRhY2htZW50cylcblxuICAgICAgb25Eb25lKClcbiAgICAgIHRvb2xVc2VDb25maXJtLm9uQWxsb3coXG4gICAgICAgIHVwZGF0ZWRJbnB1dCxcbiAgICAgICAgW10sXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgY29udGVudEJsb2NrcyAmJiBjb250ZW50QmxvY2tzLmxlbmd0aCA+IDAgPyBjb250ZW50QmxvY2tzIDogdW5kZWZpbmVkLFxuICAgICAgKVxuICAgIH0sXG4gICAgW1xuICAgICAgdG9vbFVzZUNvbmZpcm0sXG4gICAgICBvbkRvbmUsXG4gICAgICBtZXRhZGF0YVNvdXJjZSxcbiAgICAgIHF1ZXN0aW9ucyxcbiAgICAgIHF1ZXN0aW9uU3RhdGVzLFxuICAgICAgaXNJblBsYW5Nb2RlLFxuICAgICAgYWxsSW1hZ2VBdHRhY2htZW50cyxcbiAgICBdLFxuICApXG5cbiAgY29uc3QgaGFuZGxlUXVlc3Rpb25BbnN3ZXIgPSB1c2VDYWxsYmFjayhcbiAgICAoXG4gICAgICBxdWVzdGlvblRleHQ6IHN0cmluZyxcbiAgICAgIGxhYmVsOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICAgIHRleHRJbnB1dD86IHN0cmluZyxcbiAgICAgIHNob3VsZEFkdmFuY2U6IGJvb2xlYW4gPSB0cnVlLFxuICAgICkgPT4ge1xuICAgICAgbGV0IGFuc3dlcjogc3RyaW5nXG4gICAgICBjb25zdCBpc011bHRpU2VsZWN0ID0gQXJyYXkuaXNBcnJheShsYWJlbClcbiAgICAgIGlmIChpc011bHRpU2VsZWN0KSB7XG4gICAgICAgIGFuc3dlciA9IGxhYmVsLmpvaW4oJywgJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0ZXh0SW5wdXQpIHtcbiAgICAgICAgICBjb25zdCBxdWVzdGlvbkltYWdlcyA9IE9iamVjdC52YWx1ZXMoXG4gICAgICAgICAgICBwYXN0ZWRDb250ZW50c0J5UXVlc3Rpb25bcXVlc3Rpb25UZXh0XSA/PyB7fSxcbiAgICAgICAgICApLmZpbHRlcihjID0+IGMudHlwZSA9PT0gJ2ltYWdlJylcbiAgICAgICAgICBhbnN3ZXIgPVxuICAgICAgICAgICAgcXVlc3Rpb25JbWFnZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgICA/IGAke3RleHRJbnB1dH0gKEltYWdlIGF0dGFjaGVkKWBcbiAgICAgICAgICAgICAgOiB0ZXh0SW5wdXRcbiAgICAgICAgfSBlbHNlIGlmIChsYWJlbCA9PT0gJ19fb3RoZXJfXycpIHtcbiAgICAgICAgICAvLyBJbWFnZS1vbmx5IHN1Ym1pc3Npb24g4oCUIGNoZWNrIGlmIHRoaXMgcXVlc3Rpb24gaGFzIGltYWdlc1xuICAgICAgICAgIGNvbnN0IHF1ZXN0aW9uSW1hZ2VzID0gT2JqZWN0LnZhbHVlcyhcbiAgICAgICAgICAgIHBhc3RlZENvbnRlbnRzQnlRdWVzdGlvbltxdWVzdGlvblRleHRdID8/IHt9LFxuICAgICAgICAgICkuZmlsdGVyKGMgPT4gYy50eXBlID09PSAnaW1hZ2UnKVxuICAgICAgICAgIGFuc3dlciA9IHF1ZXN0aW9uSW1hZ2VzLmxlbmd0aCA+IDAgPyAnKEltYWdlIGF0dGFjaGVkKScgOiBsYWJlbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFuc3dlciA9IGxhYmVsXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRm9yIHNpbmdsZS1zZWxlY3Qgd2l0aCBvbmx5IG9uZSBxdWVzdGlvbiwgYXV0by1zdWJtaXQgaW5zdGVhZCBvZiBzaG93aW5nIHJldmlldyBzY3JlZW5cbiAgICAgIGNvbnN0IGlzU2luZ2xlUXVlc3Rpb24gPSBxdWVzdGlvbnMubGVuZ3RoID09PSAxXG4gICAgICBpZiAoIWlzTXVsdGlTZWxlY3QgJiYgaXNTaW5nbGVRdWVzdGlvbiAmJiBzaG91bGRBZHZhbmNlKSB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWRBbnN3ZXJzID0ge1xuICAgICAgICAgIC4uLmFuc3dlcnMsXG4gICAgICAgICAgW3F1ZXN0aW9uVGV4dF06IGFuc3dlcixcbiAgICAgICAgfVxuICAgICAgICB2b2lkIHN1Ym1pdEFuc3dlcnModXBkYXRlZEFuc3dlcnMpLmNhdGNoKGxvZ0Vycm9yKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgc2V0QW5zd2VyKHF1ZXN0aW9uVGV4dCwgYW5zd2VyLCBzaG91bGRBZHZhbmNlKVxuICAgIH0sXG4gICAgW1xuICAgICAgc2V0QW5zd2VyLFxuICAgICAgcXVlc3Rpb25zLmxlbmd0aCxcbiAgICAgIGFuc3dlcnMsXG4gICAgICBzdWJtaXRBbnN3ZXJzLFxuICAgICAgcGFzdGVkQ29udGVudHNCeVF1ZXN0aW9uLFxuICAgIF0sXG4gIClcblxuICBmdW5jdGlvbiBoYW5kbGVGaW5hbFJlc3BvbnNlKHZhbHVlOiAnc3VibWl0JyB8ICdjYW5jZWwnKTogdm9pZCB7XG4gICAgaWYgKHZhbHVlID09PSAnY2FuY2VsJykge1xuICAgICAgaGFuZGxlQ2FuY2VsKClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICh2YWx1ZSA9PT0gJ3N1Ym1pdCcpIHtcbiAgICAgIHZvaWQgc3VibWl0QW5zd2VycyhhbnN3ZXJzKS5jYXRjaChsb2dFcnJvcilcbiAgICB9XG4gIH1cblxuICAvLyBXaGVuIHN1Ym1pdCB0YWIgaXMgaGlkZGVuLCBkb24ndCBhbGxvdyBuYXZpZ2F0aW5nIHBhc3QgdGhlIGxhc3QgcXVlc3Rpb25cbiAgY29uc3QgbWF4SW5kZXggPSBoaWRlU3VibWl0VGFiXG4gICAgPyAocXVlc3Rpb25zPy5sZW5ndGggfHwgMSkgLSAxXG4gICAgOiBxdWVzdGlvbnM/Lmxlbmd0aCB8fCAwXG5cbiAgLy8gQm91bmRlZCBuYXZpZ2F0aW9uIGNhbGxiYWNrcyBmb3IgcXVlc3Rpb24gdGFic1xuICBjb25zdCBoYW5kbGVUYWJQcmV2ID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChjdXJyZW50UXVlc3Rpb25JbmRleCA+IDApIHtcbiAgICAgIHByZXZRdWVzdGlvbigpXG4gICAgfVxuICB9LCBbY3VycmVudFF1ZXN0aW9uSW5kZXgsIHByZXZRdWVzdGlvbl0pXG5cbiAgY29uc3QgaGFuZGxlVGFiTmV4dCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoY3VycmVudFF1ZXN0aW9uSW5kZXggPCBtYXhJbmRleCkge1xuICAgICAgbmV4dFF1ZXN0aW9uKClcbiAgICB9XG4gIH0sIFtjdXJyZW50UXVlc3Rpb25JbmRleCwgbWF4SW5kZXgsIG5leHRRdWVzdGlvbl0pXG5cbiAgLy8gVXNlIGtleWJpbmRpbmdzIHN5c3RlbSBmb3IgcXVlc3Rpb24gbmF2aWdhdGlvbiAobGVmdC9yaWdodCBhcnJvd3MsIHRhYi9zaGlmdCt0YWIpXG4gIC8vIFJhdyB1c2VJbnB1dCBkb2Vzbid0IHdvcmsgYmVjYXVzZSB0aGUga2V5YmluZGluZyBzeXN0ZW0gcmVzb2x2ZXMgbGVmdC9yaWdodCBhcnJvd3NcbiAgLy8gdG8gdGFiczpuZXh0L3RhYnM6cHJldmlvdXMgYW5kIG1heSBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gYmVmb3JlIHVzZUlucHV0IGZpcmVzLlxuICAvLyBDaGlsZCBjb21wb25lbnRzIChlLmcuLCBQcmV2aWV3UXVlc3Rpb25WaWV3KSBhbHNvIHJlZ2lzdGVyIHRoZWlyIG93biB0YWJzOm5leHQvdGFiczpwcmV2aW91c1xuICAvLyBrZXliaW5kaW5ncyB0byBlbnN1cmUgcmVsaWFibGUgaGFuZGxpbmcgcmVnYXJkbGVzcyBvZiBsaXN0ZW5lciBvcmRlcmluZy5cbiAgdXNlS2V5YmluZGluZ3MoXG4gICAge1xuICAgICAgJ3RhYnM6cHJldmlvdXMnOiBoYW5kbGVUYWJQcmV2LFxuICAgICAgJ3RhYnM6bmV4dCc6IGhhbmRsZVRhYk5leHQsXG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdUYWJzJywgaXNBY3RpdmU6ICEoaXNJblRleHRJbnB1dCAmJiAhaXNJblN1Ym1pdFZpZXcpIH0sXG4gIClcblxuICBpZiAoY3VycmVudFF1ZXN0aW9uKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDw+XG4gICAgICAgIDxRdWVzdGlvblZpZXdcbiAgICAgICAgICBxdWVzdGlvbj17Y3VycmVudFF1ZXN0aW9ufVxuICAgICAgICAgIHF1ZXN0aW9ucz17cXVlc3Rpb25zfVxuICAgICAgICAgIGN1cnJlbnRRdWVzdGlvbkluZGV4PXtjdXJyZW50UXVlc3Rpb25JbmRleH1cbiAgICAgICAgICBhbnN3ZXJzPXthbnN3ZXJzfVxuICAgICAgICAgIHF1ZXN0aW9uU3RhdGVzPXtxdWVzdGlvblN0YXRlc31cbiAgICAgICAgICBoaWRlU3VibWl0VGFiPXtoaWRlU3VibWl0VGFifVxuICAgICAgICAgIG1pbkNvbnRlbnRIZWlnaHQ9e2dsb2JhbENvbnRlbnRIZWlnaHR9XG4gICAgICAgICAgbWluQ29udGVudFdpZHRoPXtnbG9iYWxDb250ZW50V2lkdGh9XG4gICAgICAgICAgcGxhbkZpbGVQYXRoPXtwbGFuRmlsZVBhdGh9XG4gICAgICAgICAgb25VcGRhdGVRdWVzdGlvblN0YXRlPXt1cGRhdGVRdWVzdGlvblN0YXRlfVxuICAgICAgICAgIG9uQW5zd2VyPXtoYW5kbGVRdWVzdGlvbkFuc3dlcn1cbiAgICAgICAgICBvblRleHRJbnB1dEZvY3VzPXtzZXRUZXh0SW5wdXRNb2RlfVxuICAgICAgICAgIG9uQ2FuY2VsPXtoYW5kbGVDYW5jZWx9XG4gICAgICAgICAgb25TdWJtaXQ9e25leHRRdWVzdGlvbn1cbiAgICAgICAgICBvblRhYlByZXY9e2hhbmRsZVRhYlByZXZ9XG4gICAgICAgICAgb25UYWJOZXh0PXtoYW5kbGVUYWJOZXh0fVxuICAgICAgICAgIG9uUmVzcG9uZFRvQ2xhdWRlPXtoYW5kbGVSZXNwb25kVG9DbGF1ZGV9XG4gICAgICAgICAgb25GaW5pc2hQbGFuSW50ZXJ2aWV3PXtoYW5kbGVGaW5pc2hQbGFuSW50ZXJ2aWV3fVxuICAgICAgICAgIG9uSW1hZ2VQYXN0ZT17KGJhc2U2NCwgbWVkaWFUeXBlLCBmaWxlbmFtZSwgZGltcywgcGF0aCkgPT5cbiAgICAgICAgICAgIG9uSW1hZ2VQYXN0ZShcbiAgICAgICAgICAgICAgY3VycmVudFF1ZXN0aW9uLnF1ZXN0aW9uLFxuICAgICAgICAgICAgICBiYXNlNjQsXG4gICAgICAgICAgICAgIG1lZGlhVHlwZSxcbiAgICAgICAgICAgICAgZmlsZW5hbWUsXG4gICAgICAgICAgICAgIGRpbXMsXG4gICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuICAgICAgICAgIHBhc3RlZENvbnRlbnRzPXtcbiAgICAgICAgICAgIHBhc3RlZENvbnRlbnRzQnlRdWVzdGlvbltjdXJyZW50UXVlc3Rpb24ucXVlc3Rpb25dID8/IHt9XG4gICAgICAgICAgfVxuICAgICAgICAgIG9uUmVtb3ZlSW1hZ2U9e2lkID0+IG9uUmVtb3ZlSW1hZ2UoY3VycmVudFF1ZXN0aW9uLnF1ZXN0aW9uLCBpZCl9XG4gICAgICAgIC8+XG4gICAgICA8Lz5cbiAgICApXG4gIH1cblxuICBpZiAoaXNJblN1Ym1pdFZpZXcpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAgPFN1Ym1pdFF1ZXN0aW9uc1ZpZXdcbiAgICAgICAgICBxdWVzdGlvbnM9e3F1ZXN0aW9uc31cbiAgICAgICAgICBjdXJyZW50UXVlc3Rpb25JbmRleD17Y3VycmVudFF1ZXN0aW9uSW5kZXh9XG4gICAgICAgICAgYW5zd2Vycz17YW5zd2Vyc31cbiAgICAgICAgICBhbGxRdWVzdGlvbnNBbnN3ZXJlZD17YWxsUXVlc3Rpb25zQW5zd2VyZWR9XG4gICAgICAgICAgcGVybWlzc2lvblJlc3VsdD17dG9vbFVzZUNvbmZpcm0ucGVybWlzc2lvblJlc3VsdH1cbiAgICAgICAgICBtaW5Db250ZW50SGVpZ2h0PXtnbG9iYWxDb250ZW50SGVpZ2h0fVxuICAgICAgICAgIG9uRmluYWxSZXNwb25zZT17aGFuZGxlRmluYWxSZXNwb25zZX1cbiAgICAgICAgLz5cbiAgICAgIDwvPlxuICAgIClcbiAgfVxuXG4gIC8vIFRoaXMgc2hvdWxkIG5ldmVyIGJlIHJlYWNoZWRcbiAgcmV0dXJuIG51bGxcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29udmVydEltYWdlc1RvQmxvY2tzKFxuICBpbWFnZXM6IFBhc3RlZENvbnRlbnRbXSxcbik6IFByb21pc2U8SW1hZ2VCbG9ja1BhcmFtW10gfCB1bmRlZmluZWQ+IHtcbiAgaWYgKGltYWdlcy5sZW5ndGggPT09IDApIHJldHVybiB1bmRlZmluZWRcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgIGltYWdlcy5tYXAoYXN5bmMgaW1nID0+IHtcbiAgICAgIGNvbnN0IGJsb2NrOiBJbWFnZUJsb2NrUGFyYW0gPSB7XG4gICAgICAgIHR5cGU6ICdpbWFnZScsXG4gICAgICAgIHNvdXJjZToge1xuICAgICAgICAgIHR5cGU6ICdiYXNlNjQnLFxuICAgICAgICAgIG1lZGlhX3R5cGU6IChpbWcubWVkaWFUeXBlIHx8XG4gICAgICAgICAgICAnaW1hZ2UvcG5nJykgYXMgQmFzZTY0SW1hZ2VTb3VyY2VbJ21lZGlhX3R5cGUnXSxcbiAgICAgICAgICBkYXRhOiBpbWcuY29udGVudCxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlc2l6ZWQgPSBhd2FpdCBtYXliZVJlc2l6ZUFuZERvd25zYW1wbGVJbWFnZUJsb2NrKGJsb2NrKVxuICAgICAgcmV0dXJuIHJlc2l6ZWQuYmxvY2tcbiAgICB9KSxcbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsY0FDRUEsaUJBQWlCLEVBQ2pCQyxlQUFlLFFBQ1YsMENBQTBDO0FBQ2pELE9BQU9DLEtB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