// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto';
// 引入 useCallback、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useRef, useState } from 'react';
// 类型依赖 { TranscriptShareResponse } 来自 ./TranscriptSharePrompt.js，用于校准终端渲染的数据契约。
import type { TranscriptShareResponse } from './TranscriptSharePrompt.js';
// 类型依赖 { FeedbackSurveyResponse } 来自 ./utils.js，用于校准终端渲染的数据契约。
import type { FeedbackSurveyResponse } from './utils.js';
// SurveyState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type SurveyState = 'closed' | 'open' | 'thanks' | 'transcript_prompt' | 'submitting' | 'submitted';
// UseSurveyStateOptions 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type UseSurveyStateOptions = {
  hideThanksAfterMs: number;
  // 这个回调绑定到 onOpen: (appearanceId: string) => void | Promise<void>;，负责终端渲染在该局部场景下的响应。
  onOpen: (appearanceId: string) => void | Promise<void>;
  // 这个回调绑定到 onSelect: (appearanceId: string, selected: FeedbackSurveyResponse) => void | Promise…，负责终端渲染在该局部场景下的响应。
  onSelect: (appearanceId: string, selected: FeedbackSurveyResponse) => void | Promise<void>;
  shouldShowTranscriptPrompt?: (selected: FeedbackSurveyResponse) => boolean;
  onTranscriptPromptShown?: (appearanceId: string, surveyResponse: FeedbackSurveyResponse) => void;
  onTranscriptSelect?: (appearanceId: string, selected: TranscriptShareResponse, surveyResponse: FeedbackSurveyResponse | null) => boolean | Promise<boolean>;
};
// useSurveyState 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSurveyState({
  hideThanksAfterMs,
  onOpen,
  onSelect,
  shouldShowTranscriptPrompt,
  onTranscriptPromptShown,
  onTranscriptSelect
}: UseSurveyStateOptions): {
  state: SurveyState;
  lastResponse: FeedbackSurveyResponse | null;
  // 这个回调绑定到 open: () => void;，负责终端渲染在该局部场景下的响应。
  open: () => void;
  // 这个回调绑定到 handleSelect: (selected: FeedbackSurveyResponse) => boolean;，负责终端渲染在该局部场景下的响应。
  handleSelect: (selected: FeedbackSurveyResponse) => boolean;
  // 这个回调绑定到 handleTranscriptSelect: (selected: TranscriptShareResponse) => void;，负责终端渲染在该局部场景下的响应。
  handleTranscriptSelect: (selected: TranscriptShareResponse) => void;
} {
  // 状态 由 React state 持有，setState 会在用户操作或异步结果返回时触发刷新。
  const [state, setState] = useState<SurveyState>('closed');
  // lastResponse 响应数据 由 React state 持有，setLastResponse 会在用户操作或异步结果返回时触发刷新。
  const [lastResponse, setLastResponse] = useState<FeedbackSurveyResponse | null>(null);
  // appearanceId保存`useRef`，供终端渲染后续处理使用。
  const appearanceId = useRef(randomUUID());
  // lastResponseRef 引用保存 hook 状态，让终端 UI use Survey State跨渲染复用同一个容器。
  const lastResponseRef = useRef<FeedbackSurveyResponse | null>(null);
  // showThanksThenClose保存`useCallback`，供终端渲染后续处理使用。
  const showThanksThenClose = useCallback(() => {
    // setState 写入新的状态值，使终端渲染后续读取保持一致。
    setState('thanks');
    // setTimeout 写入新的状态值，使终端渲染后续读取保持一致。
    setTimeout((setState_0, setLastResponse_0) => {
      // setState_0 写入新的状态值，使终端渲染后续读取保持一致。
      setState_0('closed');
      // setLastResponse_0 写入新的状态值，使终端渲染后续读取保持一致。
      setLastResponse_0(null);
    }, hideThanksAfterMs, setState, setLastResponse);
  }, [hideThanksAfterMs]);
  // showSubmittedThenClose保存`useCallback`，供终端渲染后续处理使用。
  const showSubmittedThenClose = useCallback(() => {
    // setState 写入新的状态值，使终端渲染后续读取保持一致。
    setState('submitted');
    // setTimeout 写入新的状态值，使终端渲染后续读取保持一致。
    setTimeout(setState, hideThanksAfterMs, 'closed');
  }, [hideThanksAfterMs]);
  // open保存`useCallback`，供终端渲染后续处理使用。
  const open = useCallback(() => {
    // `state` 与 `'closed'` 不一致时刷新派生状态，避免使用过期结果。
    if (state !== 'closed') {
      // 终端 UI 组件 use Survey State在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // setState 写入新的状态值，使终端渲染后续读取保持一致。
    setState('open');
    // current更新为 `randomUUID()`，确保终端 UI后续读取最新状态。
    appearanceId.current = randomUUID();
    // 显式忽略 `onOpen(appearanceId.current)` 的返回值，只保留它触发的副作用。
    void onOpen(appearanceId.current);
  }, [state, onOpen]);
  // handleSelect保存`useCallback`，供终端渲染后续处理使用。
  const handleSelect = useCallback((selected: FeedbackSurveyResponse): boolean => {
    // setLastResponse 写入新的状态值，使终端渲染后续读取保持一致。
    setLastResponse(selected);
    // current更新为 `selected`，确保终端 UI后续读取最新状态。
    lastResponseRef.current = selected;
    // Always fire the survey response event first
    // 显式忽略 `onSelect(appearanceId.current, selected)` 的返回值，只保留它触发的副作用。
    void onSelect(appearanceId.current, selected);
    // 当 `selected` 匹配 `'dismissed'` 时，终端渲染执行对应分支。
    if (selected === 'dismissed') {
      // setState 写入新的状态值，使终端渲染后续读取保持一致。
      setState('closed');
      // setLastResponse 写入新的状态值，使终端渲染后续读取保持一致。
      setLastResponse(null);
    // 终端 UI 组件 use Survey State在这里处理 `} else if (shouldShowTranscriptPrompt?.(selected)) {`，完成这一小步状态转换。
    } else if (shouldShowTranscriptPrompt?.(selected)) {
      // setState 写入新的状态值，使终端渲染后续读取保持一致。
      setState('transcript_prompt');
      // 调用 onTranscriptPromptShown?.(appearanceId.current, selected);，完成这一处局部操作。
      onTranscriptPromptShown?.(appearanceId.current, selected);
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true;
    } else {
      // 调用 showThanksThenClose，触发终端渲染此处需要的副作用。
      showThanksThenClose();
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }, [showThanksThenClose, onSelect, shouldShowTranscriptPrompt, onTranscriptPromptShown]);
  // handleTranscriptSelect保存`useCallback`，供终端渲染后续处理使用。
  const handleTranscriptSelect = useCallback((selected_0: TranscriptShareResponse) => {
    // 按照 selected_0 的取值选择终端渲染的具体处理分支。
    switch (selected_0) {
      case 'yes':
        // setState 写入新的状态值，使终端渲染后续读取保持一致。
        setState('submitting');
        // 调用 void，触发终端渲染此处需要的副作用。
        void (async () => {
          // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
          try {
            // success 集合 等待 `onTranscriptSelect?.(appearanceId.current, selected_0, la...`，确保继续执行前已有结果。
            const success = await onTranscriptSelect?.(appearanceId.current, selected_0, lastResponseRef.current);
            // 满足 `success` 时，终端渲染执行该分支。
            if (success) {
              // 调用 showSubmittedThenClose，触发终端渲染此处需要的副作用。
              showSubmittedThenClose();
            } else {
              // 调用 showThanksThenClose，触发终端渲染此处需要的副作用。
              showThanksThenClose();
            }
          } catch {
            // 调用 showThanksThenClose，触发终端渲染此处需要的副作用。
            showThanksThenClose();
          }
        })();
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break;
      case 'no':
      case 'dont_ask_again':
        // 显式忽略 `onTranscriptSelect?.(appearanceId.current, selected_0, lastResp...` 的返回值，只保留它触发的副作用。
        void onTranscriptSelect?.(appearanceId.current, selected_0, lastResponseRef.current);
        // 调用 showThanksThenClose，触发终端渲染此处需要的副作用。
        showThanksThenClose();
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break;
    }
  }, [showThanksThenClose, showSubmittedThenClose, onTranscriptSelect]);
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    state,
    lastResponse,
    open,
    handleSelect,
    handleTranscriptSelect
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyYW5kb21VVUlEIiwidXNlQ2FsbGJhY2siLCJ1c2VSZWYiLCJ1c2VTdGF0ZSIsIlRyYW5zY3JpcHRTaGFyZVJlc3BvbnNlIiwiRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSIsIlN1cnZleVN0YXRlIiwiVXNlU3VydmV5U3RhdGVPcHRpb25zIiwiaGlkZVRoYW5rc0FmdGVyTXMiLCJvbk9wZW4iLCJhcHBlYXJhbmNlSWQiLCJQcm9taXNlIiwib25TZWxlY3QiLCJzZWxlY3RlZCIsInNob3VsZFNob3dUcmFuc2NyaXB0UHJvbXB0Iiwib25UcmFuc2NyaXB0UHJvbXB0U2hvd24iLCJzdXJ2ZXlSZXNwb25zZSIsIm9uVHJhbnNjcmlwdFNlbGVjdCIsInVzZVN1cnZleVN0YXRlIiwic3RhdGUiLCJsYXN0UmVzcG9uc2UiLCJvcGVuIiwiaGFuZGxlU2VsZWN0IiwiaGFuZGxlVHJhbnNjcmlwdFNlbGVjdCIsInNldFN0YXRlIiwic2V0TGFzdFJlc3BvbnNlIiwibGFzdFJlc3BvbnNlUmVmIiwic2hvd1RoYW5rc1RoZW5DbG9zZSIsInNldFRpbWVvdXQiLCJzaG93U3VibWl0dGVkVGhlbkNsb3NlIiwiY3VycmVudCIsInN1Y2Nlc3MiXSwic291cmNlcyI6WyJ1c2VTdXJ2ZXlTdGF0ZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gJ2NyeXB0bydcbmltcG9ydCB7IHVzZUNhbGxiYWNrLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IFRyYW5zY3JpcHRTaGFyZVJlc3BvbnNlIH0gZnJvbSAnLi9UcmFuc2NyaXB0U2hhcmVQcm9tcHQuanMnXG5pbXBvcnQgdHlwZSB7IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG50eXBlIFN1cnZleVN0YXRlID1cbiAgfCAnY2xvc2VkJ1xuICB8ICdvcGVuJ1xuICB8ICd0aGFua3MnXG4gIHwgJ3RyYW5zY3JpcHRfcHJvbXB0J1xuICB8ICdzdWJtaXR0aW5nJ1xuICB8ICdzdWJtaXR0ZWQnXG5cbnR5cGUgVXNlU3VydmV5U3RhdGVPcHRpb25zID0ge1xuICBoaWRlVGhhbmtzQWZ0ZXJNczogbnVtYmVyXG4gIG9uT3BlbjogKGFwcGVhcmFuY2VJZDogc3RyaW5nKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPlxuICBvblNlbGVjdDogKFxuICAgIGFwcGVhcmFuY2VJZDogc3RyaW5nLFxuICAgIHNlbGVjdGVkOiBGZWVkYmFja1N1cnZleVJlc3BvbnNlLFxuICApID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+XG4gIHNob3VsZFNob3dUcmFuc2NyaXB0UHJvbXB0PzogKHNlbGVjdGVkOiBGZWVkYmFja1N1cnZleVJlc3BvbnNlKSA9PiBib29sZWFuXG4gIG9uVHJhbnNjcmlwdFByb21wdFNob3duPzogKFxuICAgIGFwcGVhcmFuY2VJZDogc3RyaW5nLFxuICAgIHN1cnZleVJlc3BvbnNlOiBGZWVkYmFja1N1cnZleVJlc3BvbnNlLFxuICApID0+IHZvaWRcbiAgb25UcmFuc2NyaXB0U2VsZWN0PzogKFxuICAgIGFwcGVhcmFuY2VJZDogc3RyaW5nLFxuICAgIHNlbGVjdGVkOiBUcmFuc2NyaXB0U2hhcmVSZXNwb25zZSxcbiAgICBzdXJ2ZXlSZXNwb25zZTogRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSB8IG51bGwsXG4gICkgPT4gYm9vbGVhbiB8IFByb21pc2U8Ym9vbGVhbj5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVzZVN1cnZleVN0YXRlKHtcbiAgaGlkZVRoYW5rc0FmdGVyTXMsXG4gIG9uT3BlbixcbiAgb25TZWxlY3QsXG4gIHNob3VsZFNob3dUcmFuc2NyaXB0UHJvbXB0LFxuICBvblRyYW5zY3JpcHRQcm9tcHRTaG93bixcbiAgb25UcmFuc2NyaXB0U2VsZWN0LFxufTogVXNlU3VydmV5U3RhdGVPcHRpb25zKToge1xuICBzdGF0ZTogU3VydmV5U3RhdGVcbiAgbGFzdFJlc3BvbnNlOiBGZWVkYmFja1N1cnZleVJlc3BvbnNlIHwgbnVsbFxuICBvcGVuOiAoKSA9PiB2b2lkXG4gIGhhbmRsZVNlbGVjdDogKHNlbGVjdGVkOiBGZWVkYmFja1N1cnZleVJlc3BvbnNlKSA9PiBib29sZWFuXG4gIGhhbmRsZVRyYW5zY3JpcHRTZWxlY3Q6IChzZWxlY3RlZDogVHJhbnNjcmlwdFNoYXJlUmVzcG9uc2UpID0+IHZvaWRcbn0ge1xuICBjb25zdCBbc3RhdGUsIHNldFN0YXRlXSA9IHVzZVN0YXRlPFN1cnZleVN0YXRlPignY2xvc2VkJylcbiAgY29uc3QgW2xhc3RSZXNwb25zZSwgc2V0TGFzdFJlc3BvbnNlXSA9XG4gICAgdXNlU3RhdGU8RmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSB8IG51bGw+KG51bGwpXG4gIGNvbnN0IGFwcGVhcmFuY2VJZCA9IHVzZVJlZihyYW5kb21VVUlEKCkpXG4gIGNvbnN0IGxhc3RSZXNwb25zZVJlZiA9IHVzZVJlZjxGZWVkYmFja1N1cnZleVJlc3BvbnNlIHwgbnVsbD4obnVsbClcblxuICBjb25zdCBzaG93VGhhbmtzVGhlbkNsb3NlID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHNldFN0YXRlKCd0aGFua3MnKVxuICAgIHNldFRpbWVvdXQoXG4gICAgICAoc2V0U3RhdGUsIHNldExhc3RSZXNwb25zZSkgPT4ge1xuICAgICAgICBzZXRTdGF0ZSgnY2xvc2VkJylcbiAgICAgICAgc2V0TGFzdFJlc3BvbnNlKG51bGwpXG4gICAgICB9LFxuICAgICAgaGlkZVRoYW5rc0FmdGVyTXMsXG4gICAgICBzZXRTdGF0ZSxcbiAgICAgIHNldExhc3RSZXNwb25zZSxcbiAgICApXG4gIH0sIFtoaWRlVGhhbmtzQWZ0ZXJNc10pXG5cbiAgY29uc3Qgc2hvd1N1Ym1pdHRlZFRoZW5DbG9zZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRTdGF0ZSgnc3VibWl0dGVkJylcbiAgICBzZXRUaW1lb3V0KHNldFN0YXRlLCBoaWRlVGhhbmtzQWZ0ZXJNcywgJ2Nsb3NlZCcpXG4gIH0sIFtoaWRlVGhhbmtzQWZ0ZXJNc10pXG5cbiAgY29uc3Qgb3BlbiA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoc3RhdGUgIT09ICdjbG9zZWQnKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgc2V0U3RhdGUoJ29wZW4nKVxuICAgIGFwcGVhcmFuY2VJZC5jdXJyZW50ID0gcmFuZG9tVVVJRCgpXG4gICAgdm9pZCBvbk9wZW4oYXBwZWFyYW5jZUlkLmN1cnJlbnQpXG4gIH0sIFtzdGF0ZSwgb25PcGVuXSlcblxuICBjb25zdCBoYW5kbGVTZWxlY3QgPSB1c2VDYWxsYmFjayhcbiAgICAoc2VsZWN0ZWQ6IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UpOiBib29sZWFuID0+IHtcbiAgICAgIHNldExhc3RSZXNwb25zZShzZWxlY3RlZClcbiAgICAgIGxhc3RSZXNwb25zZVJlZi5jdXJyZW50ID0gc2VsZWN0ZWRcbiAgICAgIC8vIEFsd2F5cyBmaXJlIHRoZSBzdXJ2ZXkgcmVzcG9uc2UgZXZlbnQgZmlyc3RcbiAgICAgIHZvaWQgb25TZWxlY3QoYXBwZWFyYW5jZUlkLmN1cnJlbnQsIHNlbGVjdGVkKVxuXG4gICAgICBpZiAoc2VsZWN0ZWQgPT09ICdkaXNtaXNzZWQnKSB7XG4gICAgICAgIHNldFN0YXRlKCdjbG9zZWQnKVxuICAgICAgICBzZXRMYXN0UmVzcG9uc2UobnVsbClcbiAgICAgIH0gZWxzZSBpZiAoc2hvdWxkU2hvd1RyYW5zY3JpcHRQcm9tcHQ/LihzZWxlY3RlZCkpIHtcbiAgICAgICAgc2V0U3RhdGUoJ3RyYW5zY3JpcHRfcHJvbXB0JylcbiAgICAgICAgb25UcmFuc2NyaXB0UHJvbXB0U2hvd24/LihhcHBlYXJhbmNlSWQuY3VycmVudCwgc2VsZWN0ZWQpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaG93VGhhbmtzVGhlbkNsb3NlKClcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG4gICAgW1xuICAgICAgc2hvd1RoYW5rc1RoZW5DbG9zZSxcbiAgICAgIG9uU2VsZWN0LFxuICAgICAgc2hvdWxkU2hvd1RyYW5zY3JpcHRQcm9tcHQsXG4gICAgICBvblRyYW5zY3JpcHRQcm9tcHRTaG93bixcbiAgICBdLFxuICApXG5cbiAgY29uc3QgaGFuZGxlVHJhbnNjcmlwdFNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgIChzZWxlY3RlZDogVHJhbnNjcmlwdFNoYXJlUmVzcG9uc2UpID0+IHtcbiAgICAgIHN3aXRjaCAoc2VsZWN0ZWQpIHtcbiAgICAgICAgY2FzZSAneWVzJzpcbiAgICAgICAgICBzZXRTdGF0ZSgnc3VibWl0dGluZycpXG4gICAgICAgICAgdm9pZCAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IG9uVHJhbnNjcmlwdFNlbGVjdD8uKFxuICAgICAgICAgICAgICAgIGFwcGVhcmFuY2VJZC5jdXJyZW50LFxuICAgICAgICAgICAgICAgIHNlbGVjdGVkLFxuICAgICAgICAgICAgICAgIGxhc3RSZXNwb25zZVJlZi5jdXJyZW50LFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgc2hvd1N1Ym1pdHRlZFRoZW5DbG9zZSgpXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2hvd1RoYW5rc1RoZW5DbG9zZSgpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICBzaG93VGhhbmtzVGhlbkNsb3NlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnbm8nOlxuICAgICAgICBjYXNlICdkb250X2Fza19hZ2Fpbic6XG4gICAgICAgICAgdm9pZCBvblRyYW5zY3JpcHRTZWxlY3Q/LihcbiAgICAgICAgICAgIGFwcGVhcmFuY2VJZC5jdXJyZW50LFxuICAgICAgICAgICAgc2VsZWN0ZWQsXG4gICAgICAgICAgICBsYXN0UmVzcG9uc2VSZWYuY3VycmVudCxcbiAgICAgICAgICApXG4gICAgICAgICAgc2hvd1RoYW5rc1RoZW5DbG9zZSgpXG4gICAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9LFxuICAgIFtzaG93VGhhbmtzVGhlbkNsb3NlLCBzaG93U3VibWl0dGVkVGhlbkNsb3NlLCBvblRyYW5zY3JpcHRTZWxlY3RdLFxuICApXG5cbiAgcmV0dXJuIHsgc3RhdGUsIGxhc3RSZXNwb25zZSwgb3BlbiwgaGFuZGxlU2VsZWN0LCBoYW5kbGVUcmFuc2NyaXB0U2VsZWN0IH1cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBU0EsVUFBVSxRQUFRLFFBQVE7QUFDbkMsU0FBU0MsV0FBVyxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3JELGNBQWNDLHVCQUF1QixRQUFRLDRCQUE0QjtBQUN6RSxjQUFjQyxzQkFBc0IsUUFBUSxZQUFZO0FBRXhELEtBQUtDLFdBQVcsR0FDWixRQUFRLEdBQ1IsTUFBTSxHQUNOLFFBQVEsR0FDUixtQkFBbUIsR0FDbkIsWUFBWSxHQUNaLFdBQVc7QUFFZixLQUFLQyxxQkFBcUIsR0FBRztFQUMzQkMsaUJBQWlCLEVBQUUsTUFBTTtFQUN6QkMsTUFBTSxFQUFFLENBQUNDLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUdDLE9BQU8sQ0FBQyxJQUFJLENBQUM7RUFDdERDLFFBQVEsRUFBRSxDQUNSRixZQUFZLEVBQUUsTUFBTSxFQUNwQkcsUUFBUSxFQUFFUixzQkFBc0IsRUFDaEMsR0FBRyxJQUFJLEdBQUdNLE9BQU8sQ0FBQyxJQUFJLENBQUM7RUFDekJHLDBCQUEwQixDQUFDLEVBQUUsQ0FBQ0QsUUFBUSxFQUFFUixzQkFBc0IsRUFBRSxHQUFHLE9BQU87RUFDMUVVLHVCQUF1QixDQUFDLEVBQUUsQ0FDeEJMLFlBQVksRUFBRSxNQUFNLEVBQ3BCTSxjQUFjLEVBQUVYLHNCQUFzQixFQUN0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