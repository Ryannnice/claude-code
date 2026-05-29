// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef, useState } from 'react';
// 引入 useInterval，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useInterval } from 'usehooks-ts';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 复用 Markdown 终端界面组件，避免在这里重复拼装显示逻辑。
import { Markdown } from '../../components/Markdown.js';
// 复用 SpinnerGlyph 终端界面组件，避免在这里重复拼装显示逻辑。
import { SpinnerGlyph } from '../../components/Spinner/SpinnerGlyph.js';
// 引入 DOWN_ARROW、UP_ARROW，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { DOWN_ARROW, UP_ARROW } from '../../constants/figures.js';
// 引入 getSystemPrompt，将 ../../constants/prompts.js 中已经封装好的能力接到本文件流程里。
import { getSystemPrompt } from '../../constants/prompts.js';
// 引入 useModalOrTerminalSize，将 ../../context/modalContext.js 中已经封装好的能力接到本文件流程里。
import { useModalOrTerminalSize } from '../../context/modalContext.js';
// 引入 getSystemContext、getUserContext，将 ../../context.js 中已经封装好的能力接到本文件流程里。
import { getSystemContext, getUserContext } from '../../context.js';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 复用 ScrollBox、ScrollBoxHandle 终端界面组件，避免在这里重复拼装显示逻辑。
import ScrollBox, { type ScrollBoxHandle } from '../../ink/components/ScrollBox.js';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准命令处理的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准命令处理的数据契约。
import type { Message } from '../../types/message.js';
// 复用 createAbortController 工具函数，把通用处理留在 ../../utils/abortController.js 中维护。
import { createAbortController } from '../../utils/abortController.js';
// 复用 saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { saveGlobalConfig } from '../../utils/config.js';
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js';
// 复用 CacheSafeParams、getLastCacheSafeParams 工具函数，把通用处理留在 ../../utils/forkedAgent.js 中维护。
import { type CacheSafeParams, getLastCacheSafeParams } from '../../utils/forkedAgent.js';
// 复用 getMessagesAfterCompactBoundary 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { getMessagesAfterCompactBoundary } from '../../utils/messages.js';
// 类型依赖 { ProcessUserInputContext } 来自 ../../utils/processUserInput/processUserInput.js，用于校准命令处理的数据契约。
import type { ProcessUserInputContext } from '../../utils/processUserInput/processUserInput.js';
// 复用 runSideQuestion 工具函数，把通用处理留在 ../../utils/sideQuestion.js 中维护。
import { runSideQuestion } from '../../utils/sideQuestion.js';
// 复用 asSystemPrompt 工具函数，把通用处理留在 ../../utils/systemPromptType.js 中维护。
import { asSystemPrompt } from '../../utils/systemPromptType.js';
// BtwComponentProps 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type BtwComponentProps = {
  question: string;
  context: ProcessUserInputContext;
  onDone: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
};
// CHROME_ROWS 集合保存`5`，供后续判断或组装使用。
const CHROME_ROWS = 5;
// OUTER_CHROME_ROWS 集合保存`6`，供后续判断或组装使用。
const OUTER_CHROME_ROWS = 6;
// SCROLL_LINES 集合保存`3`，供后续判断或组装使用。
const SCROLL_LINES = 3;
// BtwSideQuestion 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function BtwSideQuestion(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(25);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    question,
    context,
    onDone
  } = t0;
  // 接口响应 由 React state 持有，setResponse 会在用户操作或异步结果返回时触发刷新。
  const [response, setResponse] = useState(null);
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
  // frame 由 React state 持有，setFrame 会在用户操作或异步结果返回时触发刷新。
  const [frame, setFrame] = useState(0);
  // scrollRef 引用保存`useRef`，供命令处理后续处理使用。
  const scrollRef = useRef(null);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    rows
  } = useModalOrTerminalSize(useTerminalSize());
  // t1 暂存 `() => setFrame(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => setFrame(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => setFrame(_temp);
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 调用 useInterval，触发命令处理此处需要的副作用。
  useInterval(t1, response || error ? null : 80);
  // t2 暂存 `function handleKeyDown(e) {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onDone) {
    // t2 暂存 `function handleKeyDown(e) {` 生成的渲染片段，后续返回路径直接复用。
    t2 = function handleKeyDown(e) {
      // 只有 `e.key === "escape" || e.key === "return" || e.key === " " || e.ctrl && (e.k...` 满足时，命令处理才执行该分支。
      if (e.key === "escape" || e.key === "return" || e.key === " " || e.ctrl && (e.key === "c" || e.key === "d")) {
        // 调用 e.preventDefault，触发命令处理此处需要的副作用。
        e.preventDefault();
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone(undefined, {
          display: "skip"
        });
        // 斜杠命令 btw在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 当 `e.key` 匹配 `"up" || e.ctrl && e.key ===...` 时，命令处理执行对应分支。
      if (e.key === "up" || e.ctrl && e.key === "p") {
        // 调用 e.preventDefault，触发命令处理此处需要的副作用。
        e.preventDefault();
        // 调用 scrollRef.current?.scrollBy(-SCROLL_LINES);，完成这一处局部操作。
        scrollRef.current?.scrollBy(-SCROLL_LINES);
      }
      // 当 `e.key` 匹配 `"down" || e.ctrl && e.key =...` 时，命令处理执行对应分支。
      if (e.key === "down" || e.ctrl && e.key === "n") {
        // 调用 e.preventDefault，触发命令处理此处需要的副作用。
        e.preventDefault();
        // 调用 scrollRef.current?.scrollBy(SCROLL_LINES);，完成这一处局部操作。
        scrollRef.current?.scrollBy(SCROLL_LINES);
      }
    };
    // $[1] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onDone;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // handleKeyDown保存`t2`，作为后续临时缓存值处理的输入。
  const handleKeyDown = t2;
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== context || $[4] !== question) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // abortController构建`createAbortController`，供命令处理后续处理使用。
      const abortController = createAbortController();
      // fetchResponse 响应数据读取`fetchResponse`，供命令处理后续处理使用。
      const fetchResponse = async function fetchResponse() {
        // 斜杠命令 btw在这里处理 ``，完成这一小步状态转换。
        ;
        // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
        try {
          // cacheSafeParams 缓存构建`buildCacheSafeParams`，供命令处理后续处理使用。
          const cacheSafeParams = await buildCacheSafeParams(context);
          // 结果保存`runSideQuestion`，供命令处理后续处理使用。
          const result = await runSideQuestion({
            question,
            cacheSafeParams
          });
          // abortController.signal.aborted缺失时直接走兜底路径，避免命令处理使用无效输入。
          if (!abortController.signal.aborted) {
            // 满足 `result.response` 时，命令处理执行该分支。
            if (result.response) {
              // setResponse 写入新的状态值，使命令处理后续读取保持一致。
              setResponse(result.response);
            } else {
              // setError 写入新的状态值，使命令处理后续读取保持一致。
              setError("No response received");
            }
          }
        } catch (t5) {
          // err沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
          const err = t5;
          // abortController.signal.aborted缺失时直接走兜底路径，避免命令处理使用无效输入。
          if (!abortController.signal.aborted) {
            // setError 写入新的状态值，使命令处理后续读取保持一致。
            setError(errorMessage(err) || "Failed to get response");
          }
        }
      };
      // 调用 fetchResponse，触发命令处理此处需要的副作用。
      fetchResponse();
      // 返回 `() => {`，作为命令处理这次计算的结果。
      return () => {
        // 触发取消信号，通知命令处理中仍在等待的异步任务尽快停止。
        abortController.abort();
      };
    };
    // t4 暂存 `[question, context]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [question, context];
    // $[3] 缓存 `context`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = context;
    // $[4] 缓存 `question`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = question;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t3, t4);
  // maxContentHeight保存`Math.max`，供命令处理后续处理使用。
  const maxContentHeight = Math.max(5, rows - CHROME_ROWS - OUTER_CHROME_ROWS);
  // t5 暂存 `<Text color="warning" bold={true}>/btw{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Text color="warning" bold={true}>/btw{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color="warning" bold={true}>/btw{" "}</Text>;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // t6 暂存 `<Box>{t5}<Text dimColor={true}>{question}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== question) {
    // t6 暂存 `<Box>{t5}<Text dimColor={true}>{question}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box>{t5}<Text dimColor={true}>{question}</Text></Box>;
    // $[8] 缓存 `question`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = question;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // t7 暂存 `<ScrollBox ref={scrollRef} flexDirection="column" flexGro...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== error || $[11] !== frame || $[12] !== response) {
    // t7 暂存 `<ScrollBox ref={scrollRef} flexDirection="column" flexGro...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <ScrollBox ref={scrollRef} flexDirection="column" flexGrow={1}>{error ? <Text color="error">{error}</Text> : response ? <Markdown>{response}</Markdown> : <Box><SpinnerGlyph frame={frame} messageColor="warning" /><Text color="warning">Answering...</Text></Box>}</ScrollBox>;
    // $[10] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = error;
    // $[11] 缓存 `frame`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = frame;
    // $[12] 缓存 `response`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = response;
    // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[13];
  }
  // t8 暂存 `<Box marginTop={1} marginLeft={2} maxHeight={maxContentHe...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== maxContentHeight || $[15] !== t7) {
    // t8 暂存 `<Box marginTop={1} marginLeft={2} maxHeight={maxContentHe...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box marginTop={1} marginLeft={2} maxHeight={maxContentHeight}>{t7}</Box>;
    // $[14] 缓存 `maxContentHeight`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = maxContentHeight;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
    // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[16];
  }
  // t9 暂存 `(response || error) && <Box marginTop={1}><Text dimColor=...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== error || $[18] !== response) {
    // t9 暂存 `(response || error) && <Box marginTop={1}><Text dimColor=...` 生成的渲染片段，后续返回路径直接复用。
    t9 = (response || error) && <Box marginTop={1}><Text dimColor={true}>{UP_ARROW}/{DOWN_ARROW} to scroll · Space, Enter, or Escape to dismiss</Text></Box>;
    // $[17] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = error;
    // $[18] 缓存 `response`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = response;
    // $[19] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[19];
  }
  // t10 暂存 `<Box flexDirection="column" paddingLeft={2} marginTop={1}...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== handleKeyDown || $[21] !== t6 || $[22] !== t8 || $[23] !== t9) {
    // t10 暂存 `<Box flexDirection="column" paddingLeft={2} marginTop={1}...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box flexDirection="column" paddingLeft={2} marginTop={1} tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t6}{t8}{t9}</Box>;
    // $[20] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = handleKeyDown;
    // $[21] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t6;
    // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t8;
    // $[23] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t9;
    // $[24] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[24];
  }
  // 返回 `t10`，作为命令处理这次计算的结果。
  return t10;
}

/**
 * Build CacheSafeParams for the side question fork.
 *
 * The preferred source is getLastCacheSafeParams — the exact
 * systemPrompt/userContext/systemContext bytes the main thread sent on its
 * last request (captured in stopHooks). Reusing them guarantees a byte-
 * identical prefix and thus a prompt cache hit. We pair these with the
 * current toolUseContext (for thinkingConfig/tools) and current messages
 * (for up-to-date context).
 *
 * Fallback (first turn before stop hooks fire, or prompt-suggestion
 * disabled): rebuild from scratch. This may miss the cache if the main loop
 * applied buildEffectiveSystemPrompt extras (--agent, --system-prompt,
 * --append-system-prompt, coordinator mode).
 */
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(f) {
  // 返回 `f + 1`，作为命令处理这次计算的结果。
  return f + 1;
}
// stripInProgressAssistantMessage 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stripInProgressAssistantMessage(messages: Message[]): Message[] {
  // last保存`messages.at`，供命令处理后续处理使用。
  const last = messages.at(-1);
  // 只有 `last?.type === 'assistant' && last.message.stop_r` 满足时，命令处理才执行该分支。
  if (last?.type === 'assistant' && last.message.stop_reason === null) {
    // 返回 `messages.slice(0, -1)`，作为命令处理这次计算的结果。
    return messages.slice(0, -1);
  }
  // 返回 `messages`，作为命令处理这次计算的结果。
  return messages;
}
// buildCacheSafeParams 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function buildCacheSafeParams(context: ProcessUserInputContext): Promise<CacheSafeParams> {
  // forkContextMessages 消息数据读取`getMessagesAfterCompactBoundary`，供命令处理后续处理使用。
  const forkContextMessages = getMessagesAfterCompactBoundary(stripInProgressAssistantMessage(context.messages));
  // saved读取`getLastCacheSafeParams`，供命令处理后续处理使用。
  const saved = getLastCacheSafeParams();
  // 满足 `saved` 时，命令处理执行该分支。
  if (saved) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      systemPrompt: saved.systemPrompt,
      userContext: saved.userContext,
      systemContext: saved.systemContext,
      toolUseContext: context,
      forkContextMessages
    };
  }
  // 并行获取 rawSystemPrompt、userContext、systemContext，缩短斜杠命令 btw等待多个独立异步任务的时间。
  const [rawSystemPrompt, userContext, systemContext] = await Promise.all([getSystemPrompt(context.options.tools, context.options.mainLoopModel, [], context.options.mcpClients), getUserContext(), getSystemContext()]);
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    systemPrompt: asSystemPrompt(rawSystemPrompt),
    userContext,
    systemContext,
    toolUseContext: context,
    forkContextMessages
  };
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, context: ProcessUserInputContext, args: string): Promise<React.ReactNode> {
  // question格式化`trim`，供命令处理后续处理使用。
  const question = args?.trim();
  // question缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!question) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('Usage: /btw <your question>', {
      display: 'system'
    });
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    btwUseCount: current.btwUseCount + 1
  }));
  // 返回 `<BtwSideQuestion question={question} context={context} onDone={onDone} ...`，作为命令处理这次计算的结果。
  return <BtwSideQuestion question={question} context={context} onDone={onDone} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwidXNlSW50ZXJ2YWwiLCJDb21tYW5kUmVzdWx0RGlzcGxheSIsIk1hcmtkb3duIiwiU3Bpbm5lckdseXBoIiwiRE9XTl9BUlJPVyIsIlVQX0FSUk9XIiwiZ2V0U3lzdGVtUHJvbXB0IiwidXNlTW9kYWxPclRlcm1pbmFsU2l6ZSIsImdldFN5c3RlbUNvbnRleHQiLCJnZXRVc2VyQ29udGV4dCIsInVzZVRlcm1pbmFsU2l6ZSIsIlNjcm9sbEJveCIsIlNjcm9sbEJveEhhbmRsZSIsIktleWJvYXJkRXZlbnQiLCJCb3giLCJUZXh0IiwiTG9jYWxKU1hDb21tYW5kT25Eb25lIiwiTWVzc2FnZSIsImNyZWF0ZUFib3J0Q29udHJvbGxlciIsInNhdmVHbG9iYWxDb25maWciLCJlcnJvck1lc3NhZ2UiLCJDYWNoZVNhZmVQYXJhbXMiLCJnZXRMYXN0Q2FjaGVTYWZlUGFyYW1zIiwiZ2V0TWVzc2FnZXNBZnRlckNvbXBhY3RCb3VuZGFyeSIsIlByb2Nlc3NVc2VySW5wdXRDb250ZXh0IiwicnVuU2lkZVF1ZXN0aW9uIiwiYXNTeXN0ZW1Qcm9tcHQiLCJCdHdDb21wb25lbnRQcm9wcyIsInF1ZXN0aW9uIiwiY29udGV4dCIsIm9uRG9uZSIsInJlc3VsdCIsIm9wdGlvbnMiLCJkaXNwbGF5IiwiQ0hST01FX1JPV1MiLCJPVVRFUl9DSFJPTUVfUk9XUyIsIlNDUk9MTF9MSU5FUyIsIkJ0d1NpZGVRdWVzdGlvbiIsInQwIiwiJCIsIl9jIiwicmVzcG9uc2UiLCJzZXRSZXNwb25zZSIsImVycm9yIiwic2V0RXJyb3IiLCJmcmFtZSIsInNldEZyYW1lIiwic2Nyb2xsUmVmIiwicm93cyIsInQxIiwiU3ltYm9sIiwiZm9yIiwiX3RlbXAiLCJ0MiIsImhhbmRsZUtleURvd24iLCJlIiwia2V5IiwiY3RybCIsInByZXZlbnREZWZhdWx0IiwidW5kZWZpbmVkIiwiY3VycmVudCIsInNjcm9sbEJ5IiwidDMiLCJ0NCIsImFib3J0Q29udHJvbGxlciIsImZldGNoUmVzcG9uc2UiLCJjYWNoZVNhZmVQYXJhbXMiLCJidWlsZENhY2hlU2FmZVBhcmFtcyIsInNpZ25hbCIsImFib3J0ZWQiLCJ0NSIsImVyciIsImFib3J0IiwibWF4Q29udGVudEhlaWdodCIsIk1hdGgiLCJtYXgiLCJ0NiIsInQ3IiwidDgiLCJ0OSIsInQxMCIsImYiLCJzdHJpcEluUHJvZ3Jlc3NBc3Npc3RhbnRNZXNzYWdlIiwibWVzc2FnZXMiLCJsYXN0IiwiYXQiLCJ0eXBlIiwibWVzc2FnZSIsInN0b3BfcmVhc29uIiwic2xpY2UiLCJQcm9taXNlIiwiZm9ya0NvbnRleHRNZXNzYWdlcyIsInNhdmVkIiwic3lzdGVtUHJvbXB0IiwidXNlckNvbnRleHQiLCJzeXN0ZW1Db250ZXh0IiwidG9vbFVzZUNvbnRleHQiLCJyYXdTeXN0ZW1Qcm9tcHQiLCJhbGwiLCJ0b29scyIsIm1haW5Mb29wTW9kZWwiLCJtY3BDbGllbnRzIiwiY2FsbCIsImFyZ3MiLCJSZWFjdE5vZGUiLCJ0cmltIiwiYnR3VXNlQ291bnQiXSwic291cmNlcyI6WyJidHcudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VJbnRlcnZhbCB9IGZyb20gJ3VzZWhvb2tzLXRzJ1xuaW1wb3J0IHR5cGUgeyBDb21tYW5kUmVzdWx0RGlzcGxheSB9IGZyb20gJy4uLy4uL2NvbW1hbmRzLmpzJ1xuaW1wb3J0IHsgTWFya2Rvd24gfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL01hcmtkb3duLmpzJ1xuaW1wb3J0IHsgU3Bpbm5lckdseXBoIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9TcGlubmVyL1NwaW5uZXJHbHlwaC5qcydcbmltcG9ydCB7IERPV05fQVJST1csIFVQX0FSUk9XIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL2ZpZ3VyZXMuanMnXG5pbXBvcnQgeyBnZXRTeXN0ZW1Qcm9tcHQgfSBmcm9tICcuLi8uLi9jb25zdGFudHMvcHJvbXB0cy5qcydcbmltcG9ydCB7IHVzZU1vZGFsT3JUZXJtaW5hbFNpemUgfSBmcm9tICcuLi8uLi9jb250ZXh0L21vZGFsQ29udGV4dC5qcydcbmltcG9ydCB7IGdldFN5c3RlbUNvbnRleHQsIGdldFVzZXJDb250ZXh0IH0gZnJvbSAnLi4vLi4vY29udGV4dC5qcydcbmltcG9ydCB7IHVzZVRlcm1pbmFsU2l6ZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZVRlcm1pbmFsU2l6ZS5qcydcbmltcG9ydCBTY3JvbGxCb3gsIHtcbiAgdHlwZSBTY3JvbGxCb3hIYW5kbGUsXG59IGZyb20gJy4uLy4uL2luay9jb21wb25lbnRzL1Njcm9sbEJveC5qcydcbmltcG9ydCB0eXBlIHsgS2V5Ym9hcmRFdmVudCB9IGZyb20gJy4uLy4uL2luay9ldmVudHMva2V5Ym9hcmQtZXZlbnQuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZE9uRG9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2UgfSBmcm9tICcuLi8uLi90eXBlcy9tZXNzYWdlLmpzJ1xuaW1wb3J0IHsgY3JlYXRlQWJvcnRDb250cm9sbGVyIH0gZnJvbSAnLi4vLi4vdXRpbHMvYWJvcnRDb250cm9sbGVyLmpzJ1xuaW1wb3J0IHsgc2F2ZUdsb2JhbENvbmZpZyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGVycm9yTWVzc2FnZSB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9ycy5qcydcbmltcG9ydCB7XG4gIHR5cGUgQ2FjaGVTYWZlUGFyYW1zLFxuICBnZXRMYXN0Q2FjaGVTYWZlUGFyYW1zLFxufSBmcm9tICcuLi8uLi91dGlscy9mb3JrZWRBZ2VudC5qcydcbmltcG9ydCB7IGdldE1lc3NhZ2VzQWZ0ZXJDb21wYWN0Qm91bmRhcnkgfSBmcm9tICcuLi8uLi91dGlscy9tZXNzYWdlcy5qcydcbmltcG9ydCB0eXBlIHsgUHJvY2Vzc1VzZXJJbnB1dENvbnRleHQgfSBmcm9tICcuLi8uLi91dGlscy9wcm9jZXNzVXNlcklucHV0L3Byb2Nlc3NVc2VySW5wdXQuanMnXG5pbXBvcnQgeyBydW5TaWRlUXVlc3Rpb24gfSBmcm9tICcuLi8uLi91dGlscy9zaWRlUXVlc3Rpb24uanMnXG5pbXBvcnQgeyBhc1N5c3RlbVByb21wdCB9IGZyb20gJy4uLy4uL3V0aWxzL3N5c3RlbVByb21wdFR5cGUuanMnXG5cbnR5cGUgQnR3Q29tcG9uZW50UHJvcHMgPSB7XG4gIHF1ZXN0aW9uOiBzdHJpbmdcbiAgY29udGV4dDogUHJvY2Vzc1VzZXJJbnB1dENvbnRleHRcbiAgb25Eb25lOiAoXG4gICAgcmVzdWx0Pzogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiB7IGRpc3BsYXk/OiBDb21tYW5kUmVzdWx0RGlzcGxheSB9LFxuICApID0+IHZvaWRcbn1cblxuY29uc3QgQ0hST01FX1JPV1MgPSA1XG5jb25zdCBPVVRFUl9DSFJPTUVfUk9XUyA9IDZcbmNvbnN0IFNDUk9MTF9MSU5FUyA9IDNcblxuZnVuY3Rpb24gQnR3U2lkZVF1ZXN0aW9uKHtcbiAgcXVlc3Rpb24sXG4gIGNvbnRleHQsXG4gIG9uRG9uZSxcbn06IEJ0d0NvbXBvbmVudFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3Jlc3BvbnNlLCBzZXRSZXNwb25zZV0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtmcmFtZSwgc2V0RnJhbWVdID0gdXNlU3RhdGUoMClcbiAgY29uc3Qgc2Nyb2xsUmVmID0gdXNlUmVmPFNjcm9sbEJveEhhbmRsZT4obnVsbClcbiAgY29uc3QgeyByb3dzIH0gPSB1c2VNb2RhbE9yVGVybWluYWxTaXplKHVzZVRlcm1pbmFsU2l6ZSgpKVxuXG4gIC8vIEFuaW1hdGUgc3Bpbm5lciB3aGlsZSBsb2FkaW5nXG4gIHVzZUludGVydmFsKCgpID0+IHNldEZyYW1lKGYgPT4gZiArIDEpLCByZXNwb25zZSB8fCBlcnJvciA/IG51bGwgOiA4MClcblxuICBmdW5jdGlvbiBoYW5kbGVLZXlEb3duKGU6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICBlLmtleSA9PT0gJ2VzY2FwZScgfHxcbiAgICAgIGUua2V5ID09PSAncmV0dXJuJyB8fFxuICAgICAgZS5rZXkgPT09ICcgJyB8fFxuICAgICAgKGUuY3RybCAmJiAoZS5rZXkgPT09ICdjJyB8fCBlLmtleSA9PT0gJ2QnKSlcbiAgICApIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgb25Eb25lKHVuZGVmaW5lZCwgeyBkaXNwbGF5OiAnc2tpcCcgfSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoZS5rZXkgPT09ICd1cCcgfHwgKGUuY3RybCAmJiBlLmtleSA9PT0gJ3AnKSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBzY3JvbGxSZWYuY3VycmVudD8uc2Nyb2xsQnkoLVNDUk9MTF9MSU5FUylcbiAgICB9XG4gICAgaWYgKGUua2V5ID09PSAnZG93bicgfHwgKGUuY3RybCAmJiBlLmtleSA9PT0gJ24nKSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBzY3JvbGxSZWYuY3VycmVudD8uc2Nyb2xsQnkoU0NST0xMX0xJTkVTKVxuICAgIH1cbiAgfVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYWJvcnRDb250cm9sbGVyID0gY3JlYXRlQWJvcnRDb250cm9sbGVyKClcblxuICAgIGFzeW5jIGZ1bmN0aW9uIGZldGNoUmVzcG9uc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjYWNoZVNhZmVQYXJhbXMgPSBhd2FpdCBidWlsZENhY2hlU2FmZVBhcmFtcyhjb250ZXh0KVxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBydW5TaWRlUXVlc3Rpb24oeyBxdWVzdGlvbiwgY2FjaGVTYWZlUGFyYW1zIH0pXG5cbiAgICAgICAgaWYgKCFhYm9ydENvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlKSB7XG4gICAgICAgICAgICBzZXRSZXNwb25zZShyZXN1bHQucmVzcG9uc2UpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldEVycm9yKCdObyByZXNwb25zZSByZWNlaXZlZCcpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKCFhYm9ydENvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgICAgICBzZXRFcnJvcihlcnJvck1lc3NhZ2UoZXJyKSB8fCAnRmFpbGVkIHRvIGdldCByZXNwb25zZScpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB2b2lkIGZldGNoUmVzcG9uc2UoKVxuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGFib3J0Q29udHJvbGxlci5hYm9ydCgpXG4gICAgfVxuICB9LCBbcXVlc3Rpb24sIGNvbnRleHRdKVxuXG4gIGNvbnN0IG1heENvbnRlbnRIZWlnaHQgPSBNYXRoLm1heCg1LCByb3dzIC0gQ0hST01FX1JPV1MgLSBPVVRFUl9DSFJPTUVfUk9XUylcblxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgcGFkZGluZ0xlZnQ9ezJ9XG4gICAgICBtYXJnaW5Ub3A9ezF9XG4gICAgICB0YWJJbmRleD17MH1cbiAgICAgIGF1dG9Gb2N1c1xuICAgICAgb25LZXlEb3duPXtoYW5kbGVLZXlEb3dufVxuICAgID5cbiAgICAgIDxCb3g+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiIGJvbGQ+XG4gICAgICAgICAgL2J0d3snICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+e3F1ZXN0aW9ufTwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9IG1hcmdpbkxlZnQ9ezJ9IG1heEhlaWdodD17bWF4Q29udGVudEhlaWdodH0+XG4gICAgICAgIDxTY3JvbGxCb3ggcmVmPXtzY3JvbGxSZWZ9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBmbGV4R3Jvdz17MX0+XG4gICAgICAgICAge2Vycm9yID8gKFxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPntlcnJvcn08L1RleHQ+XG4gICAgICAgICAgKSA6IHJlc3BvbnNlID8gKFxuICAgICAgICAgICAgPE1hcmtkb3duPntyZXNwb25zZX08L01hcmtkb3duPlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8Qm94PlxuICAgICAgICAgICAgICA8U3Bpbm5lckdseXBoIGZyYW1lPXtmcmFtZX0gbWVzc2FnZUNvbG9yPVwid2FybmluZ1wiIC8+XG4gICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPkFuc3dlcmluZy4uLjwvVGV4dD5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICl9XG4gICAgICAgIDwvU2Nyb2xsQm94PlxuICAgICAgPC9Cb3g+XG4gICAgICB7KHJlc3BvbnNlIHx8IGVycm9yKSAmJiAoXG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIHtVUF9BUlJPV30ve0RPV05fQVJST1d9IHRvIHNjcm9sbCDCtyBTcGFjZSwgRW50ZXIsIG9yIEVzY2FwZSB0b1xuICAgICAgICAgICAgZGlzbWlzc1xuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgIDwvQm94PlxuICApXG59XG5cbi8qKlxuICogQnVpbGQgQ2FjaGVTYWZlUGFyYW1zIGZvciB0aGUgc2lkZSBxdWVzdGlvbiBmb3JrLlxuICpcbiAqIFRoZSBwcmVmZXJyZWQgc291cmNlIGlzIGdldExhc3RDYWNoZVNhZmVQYXJhbXMg4oCUIHRoZSBleGFjdFxuICogc3lzdGVtUHJvbXB0L3VzZXJDb250ZXh0L3N5c3RlbUNvbnRleHQgYnl0ZXMgdGhlIG1haW4gdGhyZWFkIHNlbnQgb24gaXRzXG4gKiBsYXN0IHJlcXVlc3QgKGNhcHR1cmVkIGluIHN0b3BIb29rcykuIFJldXNpbmcgdGhlbSBndWFyYW50ZWVzIGEgYnl0ZS1cbiAqIGlkZW50aWNhbCBwcmVmaXggYW5kIHRodXMgYSBwcm9tcHQgY2FjaGUgaGl0LiBXZSBwYWlyIHRoZXNlIHdpdGggdGhlXG4gKiBjdXJyZW50IHRvb2xVc2VDb250ZXh0IChmb3IgdGhpbmtpbmdDb25maWcvdG9vbHMpIGFuZCBjdXJyZW50IG1lc3NhZ2VzXG4gKiAoZm9yIHVwLXRvLWRhdGUgY29udGV4dCkuXG4gKlxuICogRmFsbGJhY2sgKGZpcnN0IHR1cm4gYmVmb3JlIHN0b3AgaG9va3MgZmlyZSwgb3IgcHJvbXB0LXN1Z2dlc3Rpb25cbiAqIGRpc2FibGVkKTogcmVidWlsZCBmcm9tIHNjcmF0Y2guIFRoaXMgbWF5IG1pc3MgdGhlIGNhY2hlIGlmIHRoZSBtYWluIGxvb3BcbiAqIGFwcGxpZWQgYnVpbGRFZmZlY3RpdmVTeXN0ZW1Qcm9tcHQgZXh0cmFzICgtLWFnZW50LCAtLXN5c3RlbS1wcm9tcHQsXG4gKiAtLWFwcGVuZC1zeXN0ZW0tcHJvbXB0LCBjb29yZGluYXRvciBtb2RlKS5cbiAqL1xuZnVuY3Rpb24gc3RyaXBJblByb2dyZXNzQXNzaXN0YW50TWVzc2FnZShtZXNzYWdlczogTWVzc2FnZVtdKTogTWVzc2FnZVtdIHtcbiAgY29uc3QgbGFzdCA9IG1lc3NhZ2VzLmF0KC0xKVxuICBpZiAobGFzdD8udHlwZSA9PT0gJ2Fzc2lzdGFudCcgJiYgbGFzdC5tZXNzYWdlLnN0b3BfcmVhc29uID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG1lc3NhZ2VzLnNsaWNlKDAsIC0xKVxuICB9XG4gIHJldHVybiBtZXNzYWdlc1xufVxuXG5hc3luYyBmdW5jdGlvbiBidWlsZENhY2hlU2FmZVBhcmFtcyhcbiAgY29udGV4dDogUHJvY2Vzc1VzZXJJbnB1dENvbnRleHQsXG4pOiBQcm9taXNlPENhY2hlU2FmZVBhcmFtcz4ge1xuICBjb25zdCBmb3JrQ29udGV4dE1lc3NhZ2VzID0gZ2V0TWVzc2FnZXNBZnRlckNvbXBhY3RCb3VuZGFyeShcbiAgICBzdHJpcEluUHJvZ3Jlc3NBc3Npc3RhbnRNZXNzYWdlKGNvbnRleHQubWVzc2FnZXMpLFxuICApXG4gIGNvbnN0IHNhdmVkID0gZ2V0TGFzdENhY2hlU2FmZVBhcmFtcygpXG4gIGlmIChzYXZlZCkge1xuICAgIHJldHVybiB7XG4gICAgICBzeXN0ZW1Qcm9tcHQ6IHNhdmVkLnN5c3RlbVByb21wdCxcbiAgICAgIHVzZXJDb250ZXh0OiBzYXZlZC51c2VyQ29udGV4dCxcbiAgICAgIHN5c3RlbUNvbnRleHQ6IHNhdmVkLnN5c3RlbUNvbnRleHQsXG4gICAgICB0b29sVXNlQ29udGV4dDogY29udGV4dCxcbiAgICAgIGZvcmtDb250ZXh0TWVzc2FnZXMsXG4gICAgfVxuICB9XG4gIGNvbnN0IFtyYXdTeXN0ZW1Qcm9tcHQsIHVzZXJDb250ZXh0LCBzeXN0ZW1Db250ZXh0XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICBnZXRTeXN0ZW1Qcm9tcHQoXG4gICAgICBjb250ZXh0Lm9wdGlvbnMudG9vbHMsXG4gICAgICBjb250ZXh0Lm9wdGlvbnMubWFpbkxvb3BNb2RlbCxcbiAgICAgIFtdLFxuICAgICAgY29udGV4dC5vcHRpb25zLm1jcENsaWVudHMsXG4gICAgKSxcbiAgICBnZXRVc2VyQ29udGV4dCgpLFxuICAgIGdldFN5c3RlbUNvbnRleHQoKSxcbiAgXSlcbiAgcmV0dXJuIHtcbiAgICBzeXN0ZW1Qcm9tcHQ6IGFzU3lzdGVtUHJvbXB0KHJhd1N5c3RlbVByb21wdCksXG4gICAgdXNlckNvbnRleHQsXG4gICAgc3lzdGVtQ29udGV4dCxcbiAgICB0b29sVXNlQ29udGV4dDogY29udGV4dCxcbiAgICBmb3JrQ29udGV4dE1lc3NhZ2VzLFxuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsKFxuICBvbkRvbmU6IExvY2FsSlNYQ29tbWFuZE9uRG9uZSxcbiAgY29udGV4dDogUHJvY2Vzc1VzZXJJbnB1dENvbnRleHQsXG4gIGFyZ3M6IHN0cmluZyxcbik6IFByb21pc2U8UmVhY3QuUmVhY3ROb2RlPiB7XG4gIGNvbnN0IHF1ZXN0aW9uID0gYXJncz8udHJpbSgpXG5cbiAgaWYgKCFxdWVzdGlvbikge1xuICAgIG9uRG9uZSgnVXNhZ2U6IC9idHcgPHlvdXIgcXVlc3Rpb24+JywgeyBkaXNwbGF5OiAnc3lzdGVtJyB9KVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBzYXZlR2xvYmFsQ29uZmlnKGN1cnJlbnQgPT4gKHtcbiAgICAuLi5jdXJyZW50LFxuICAgIGJ0d1VzZUNvdW50OiBjdXJyZW50LmJ0d1VzZUNvdW50ICsgMSxcbiAgfSkpXG5cbiAgcmV0dXJuIChcbiAgICA8QnR3U2lkZVF1ZXN0aW9uIHF1ZXN0aW9uPXtxdWVzdGlvbn0gY29udGV4dD17Y29udGV4dH0gb25Eb25lPXtvbkRvbmV9IC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsU0FBUyxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ25ELFNBQVNDLFdBQVcsUUFBUSxhQUFhO0FBQ3pDLGNBQWNDLG9CQUFvQixRQUFRLG1CQUFtQjtBQUM3RCxTQUFTQyxRQUFRLFFBQVEsOEJBQThCO0FBQ3ZELFNBQVNDLFlBQVksUUFBUSwwQ0FBMEM7QUFDdkUsU0FBU0MsVUFBVSxFQUFFQyxRQUFRLFFBQVEsNEJBQTRCO0FBQ2pFLFNBQVNDLGVBQWUs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QUFLLEVBQUU7SUFDVCxPQUFPO01BQ0xDLFlBQVksRUFBRUQsS0FBSyxDQUFDQyxZQUFZO01BQ2hDQyxXQUFXLEVBQUVGLEtBQUssQ0FBQ0UsV0FBVztNQUM5QkMsYUFBYSxFQUFFSCxLQUFLLENBQUNHLGFBQWE7TUFDbENDLGNBQWMsRUFBRW5FLE9BQU87TUFDdkI4RDtJQUNGLENBQUM7RUFDSDtFQUNBLE1BQU0sQ0FBQ00sZUFBZSxFQUFFSCxXQUFXLEVBQUVDLGFBQWEsQ0FBQyxHQUFHLE1BQU1MLE9BQU8sQ0FBQ1EsR0FBRyxDQUFDLENBQ3RFNUYsZUFBZSxDQUNidUIsT0FBTyxDQUFDRyxPQUFPLENBQUNtRSxLQUFLLEVBQ3JCdEUsT0FBTyxDQUFDRyxPQUFPLENBQUNvRSxhQUFhLEVBQzdCLEVBQUUsRUFDRnZFLE9BQU8sQ0FBQ0csT0FBTyxDQUFDcUUsVUFDbEIsQ0FBQyxFQUNENUYsY0FBYyxDQUFDLENBQUMsRUFDaEJELGdCQUFnQixDQUFDLENBQUMsQ0FDbkIsQ0FBQztFQUNGLE9BQU87SUFDTHFGLFlBQVksRUFBRW5FLGNBQWMsQ0FBQ3VFLGVBQWUsQ0FBQztJQUM3Q0gsV0FBVztJQUNYQyxhQUFhO0lBQ2JDLGNBQWMsRUFBRW5FLE9BQU87SUFDdkI4RDtFQUNGLENBQUM7QUFDSDtBQUVBLE9BQU8sZUFBZVcsSUFBSUEsQ0FDeEJ4RSxNQUFNLEVBQUVkLHFCQUFxQixFQUM3QmEsT0FBTyxFQUFFTCx1QkFBdUIsRUFDaEMrRSxJQUFJLEVBQUUsTUFBTSxDQUNiLEVBQUViLE9BQU8sQ0FBQzlGLEtBQUssQ0FBQzRHLFNBQVMsQ0FBQyxDQUFDO0VBQzFCLE1BQU01RSxRQUFRLEdBQUcyRSxJQUFJLEVBQUVFLElBQUksQ0FBQyxDQUFDO0VBRTdCLElBQUksQ0FBQzdFLFFBQVEsRUFBRTtJQUNiRSxNQUFNLENBQUMsNkJBQTZCLEVBQUU7TUFBRUcsT0FBTyxFQUFFO0lBQVMsQ0FBQyxDQUFDO0lBQzVELE9BQU8sSUFBSTtFQUNiO0VBRUFkLGdCQUFnQixDQUFDeUMsT0FBTyxLQUFLO0lBQzNCLEdBQUdBLE9BQU87SUFDVjhDLFdBQVcsRUFBRTlDLE9BQU8sQ0FBQzhDLFdBQVcsR0FBRztFQUNyQyxDQUFDLENBQUMsQ0FBQztFQUVILE9BQ0UsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM5RSxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQ0MsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUNDLE1BQU0sQ0FBQyxHQUFHO0FBRTdFIiwiaWdub3JlTGlzdCI6W119