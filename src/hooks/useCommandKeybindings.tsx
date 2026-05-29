// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * Component that registers keybinding handlers for command bindings.
 *
 * Must be rendered inside KeybindingSetup to have access to the keybinding context.
 * Reads "command:*" actions from the current keybinding configuration and registers
 * handlers that invoke the corresponding slash command via onSubmit.
 *
 * Commands triggered via keybinding are treated as "immediate" - they execute right
 * away and preserve the user's existing input text (the prompt is not cleared).
 */
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react';
// 引入 useIsModalOverlayActive，将 ../context/overlayContext.js 中已经封装好的能力接到本文件流程里。
import { useIsModalOverlayActive } from '../context/overlayContext.js';
// 引入 useOptionalKeybindingContext，将 ../keybindings/KeybindingContext.js 中已经封装好的能力接到本文件流程里。
import { useOptionalKeybindingContext } from '../keybindings/KeybindingContext.js';
// 引入 useKeybindings，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../keybindings/useKeybinding.js';
// 类型依赖 { PromptInputHelpers } 来自 ../utils/handlePromptSubmit.js，用于校准React hook 状态流的数据契约。
import type { PromptInputHelpers } from '../utils/handlePromptSubmit.js';
// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // onSubmit accepts additional parameters beyond what we pass here,
  // so we use a rest parameter to allow any additional args
  onSubmit: (input: string, helpers: PromptInputHelpers, ...rest: [speculationAccept?: undefined, options?: {
    fromKeybinding?: boolean;
  }]) => void;
  /** Set to false to disable command keybindings (e.g., when a dialog is open) */
  isActive?: boolean;
};
// NOOP_HELPERS 集合 集中保存React hook use Command Keybindings要一起传递的字段。
const NOOP_HELPERS: PromptInputHelpers = {
  // 这个回调绑定到 setCursorOffset: () => {},，负责React hook 状态流在该局部场景下的响应。
  setCursorOffset: () => {},
  // 这个回调绑定到 clearBuffer: () => {},，负责React hook 状态流在该局部场景下的响应。
  clearBuffer: () => {},
  // 这个回调绑定到 resetHistory: () => {}，负责React hook 状态流在该局部场景下的响应。
  resetHistory: () => {}
};

/**
 * Registers keybinding handlers for all "command:*" actions found in the
 * user's keybinding configuration. When triggered, each handler submits
 * the corresponding slash command (e.g., "command:commit" submits "/commit").
 */
// CommandKeybindingHandlers 封装useCommandKeybindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CommandKeybindingHandlers(t0) {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onSubmit,
    isActive: t1
  } = t0;
  // isActive标记React hook use Comman...是否启用对应路径。
  const isActive = t1 === undefined ? true : t1;
  // keybindingContext保存`useOptionalKeybindingContext`，供React hook后续处理使用。
  const keybindingContext = useOptionalKeybindingContext();
  // isModalOverlayActive记录 `useIsModalOverlayActive` 是否成立，React hook随后按该结果分支。
  const isModalOverlayActive = useIsModalOverlayActive();
  // t2 暂存 `t3` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React hook use Command Keybindings在这里处理 `bb0: {`，完成这一小步状态转换。
  bb0: {
    // keybindingContext缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!keybindingContext) {
      // t3 暂存 `new Set()` 的派生结果，便于缓存命中时直接复用。
      let t3;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        // t3 暂存 `new Set()` 生成的渲染片段，后续返回路径直接复用。
        t3 = new Set();
        // $[0] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[0] = t3;
      } else {
        // t3 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
        t3 = $[0];
      }
      // t2 暂存 `t3` 生成的渲染片段，后续返回路径直接复用。
      t2 = t3;
      // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
      break bb0;
    }
    // actions 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let actions;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== keybindingContext.bindings) {
      // actions 集合更新为 `new Set()`，确保useCommandKeybindings后续读取最新状态。
      actions = new Set();
      // 按顺序遍历 `keybindingContext.bindings` 中的binding，逐个交给React hook处理。
      for (const binding of keybindingContext.bindings) {
        // 满足 `binding.action?.startsWith("command:")` 时，React hook执行该分支。
        if (binding.action?.startsWith("command:")) {
          // 调用 actions.add，触发React hook此处需要的副作用。
          actions.add(binding.action);
        }
      }
      // $[1] 缓存 `keybindingContext.bindings`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = keybindingContext.bindings;
      // $[2] 缓存 `actions`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = actions;
    } else {
      // actions 集合更新为 `$[2]`，确保useCommandKeybindings后续读取最新状态。
      actions = $[2];
    }
    // t2 暂存 `actions` 生成的渲染片段，后续返回路径直接复用。
    t2 = actions;
  }
  // commandActions 命令数据沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const commandActions = t2;
  // map 先占位，稍后的条件分支会根据实际输入补齐它。
  let map;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== commandActions || $[4] !== onSubmit) {
    // map更新为 `{}`，确保useCommandKeybindings后续读取最新状态。
    map = {};
    // 按顺序遍历 `commandActions` 中的action，逐个交给React hook处理。
    for (const action of commandActions) {
      // commandName 命令数据格式化`action.slice`，供React hook后续处理使用。
      const commandName = action.slice(8);
      // 这个回调绑定到 map[action] = () => {，负责React hook 状态流在该局部场景下的响应。
      map[action] = () => {
        // 调用 onSubmit，触发React hook此处需要的副作用。
        onSubmit(`/${commandName}`, NOOP_HELPERS, undefined, {
          fromKeybinding: true
        });
      };
    }
    // $[3] 缓存 `commandActions`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = commandActions;
    // $[4] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onSubmit;
    // $[5] 缓存 `map`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = map;
  } else {
    // map更新为 `$[5]`，确保useCommandKeybindings后续读取最新状态。
    map = $[5];
  }
  // handlers 集合派生`map`，供后续判断或组装使用。
  const handlers = map;
  // t3标记React hook use Comman...是否启用对应路径。
  const t3 = isActive && !isModalOverlayActive;
  // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t3) {
    // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t4 = {
      context: "Chat",
      isActive: t3
    };
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // 调用 useKeybindings，触发React hook此处需要的副作用。
  useKeybindings(handlers, t4);
  // 返回 `null`，作为React hook 状态流这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ1c2VNZW1vIiwidXNlSXNNb2RhbE92ZXJsYXlBY3RpdmUiLCJ1c2VPcHRpb25hbEtleWJpbmRpbmdDb250ZXh0IiwidXNlS2V5YmluZGluZ3MiLCJQcm9tcHRJbnB1dEhlbHBlcnMiLCJQcm9wcyIsIm9uU3VibWl0IiwiaW5wdXQiLCJoZWxwZXJzIiwicmVzdCIsInNwZWN1bGF0aW9uQWNjZXB0Iiwib3B0aW9ucyIsImZyb21LZXliaW5kaW5nIiwiaXNBY3RpdmUiLCJOT09QX0hFTFBFUlMiLCJzZXRDdXJzb3JPZmZzZXQiLCJjbGVhckJ1ZmZlciIsInJlc2V0SGlzdG9yeSIsIkNvbW1hbmRLZXliaW5kaW5nSGFuZGxlcnMiLCJ0MCIsIiQiLCJfYyIsInQxIiwidW5kZWZpbmVkIiwia2V5YmluZGluZ0NvbnRleHQiLCJpc01vZGFsT3ZlcmxheUFjdGl2ZSIsInQyIiwiYmIwIiwidDMiLCJTeW1ib2wiLCJmb3IiLCJTZXQiLCJhY3Rpb25zIiwiYmluZGluZ3MiLCJiaW5kaW5nIiwiYWN0aW9uIiwic3RhcnRzV2l0aCIsImFkZCIsImNvbW1hbmRBY3Rpb25zIiwibWFwIiwiY29tbWFuZE5hbWUiLCJzbGljZSIsImhhbmRsZXJzIiwidDQiLCJjb250ZXh0Il0sInNvdXJjZXMiOlsidXNlQ29tbWFuZEtleWJpbmRpbmdzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbXBvbmVudCB0aGF0IHJlZ2lzdGVycyBrZXliaW5kaW5nIGhhbmRsZXJzIGZvciBjb21tYW5kIGJpbmRpbmdzLlxuICpcbiAqIE11c3QgYmUgcmVuZGVyZWQgaW5zaWRlIEtleWJpbmRpbmdTZXR1cCB0byBoYXZlIGFjY2VzcyB0byB0aGUga2V5YmluZGluZyBjb250ZXh0LlxuICogUmVhZHMgXCJjb21tYW5kOipcIiBhY3Rpb25zIGZyb20gdGhlIGN1cnJlbnQga2V5YmluZGluZyBjb25maWd1cmF0aW9uIGFuZCByZWdpc3RlcnNcbiAqIGhhbmRsZXJzIHRoYXQgaW52b2tlIHRoZSBjb3JyZXNwb25kaW5nIHNsYXNoIGNvbW1hbmQgdmlhIG9uU3VibWl0LlxuICpcbiAqIENvbW1hbmRzIHRyaWdnZXJlZCB2aWEga2V5YmluZGluZyBhcmUgdHJlYXRlZCBhcyBcImltbWVkaWF0ZVwiIC0gdGhleSBleGVjdXRlIHJpZ2h0XG4gKiBhd2F5IGFuZCBwcmVzZXJ2ZSB0aGUgdXNlcidzIGV4aXN0aW5nIGlucHV0IHRleHQgKHRoZSBwcm9tcHQgaXMgbm90IGNsZWFyZWQpLlxuICovXG5pbXBvcnQgeyB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VJc01vZGFsT3ZlcmxheUFjdGl2ZSB9IGZyb20gJy4uL2NvbnRleHQvb3ZlcmxheUNvbnRleHQuanMnXG5pbXBvcnQgeyB1c2VPcHRpb25hbEtleWJpbmRpbmdDb250ZXh0IH0gZnJvbSAnLi4va2V5YmluZGluZ3MvS2V5YmluZGluZ0NvbnRleHQuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5ncyB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgdHlwZSB7IFByb21wdElucHV0SGVscGVycyB9IGZyb20gJy4uL3V0aWxzL2hhbmRsZVByb21wdFN1Ym1pdC5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgLy8gb25TdWJtaXQgYWNjZXB0cyBhZGRpdGlvbmFsIHBhcmFtZXRlcnMgYmV5b25kIHdoYXQgd2UgcGFzcyBoZXJlLFxuICAvLyBzbyB3ZSB1c2UgYSByZXN0IHBhcmFtZXRlciB0byBhbGxvdyBhbnkgYWRkaXRpb25hbCBhcmdzXG4gIG9uU3VibWl0OiAoXG4gICAgaW5wdXQ6IHN0cmluZyxcbiAgICBoZWxwZXJzOiBQcm9tcHRJbnB1dEhlbHBlcnMsXG4gICAgLi4ucmVzdDogW1xuICAgICAgc3BlY3VsYXRpb25BY2NlcHQ/OiB1bmRlZmluZWQsXG4gICAgICBvcHRpb25zPzogeyBmcm9tS2V5YmluZGluZz86IGJvb2xlYW4gfSxcbiAgICBdXG4gICkgPT4gdm9pZFxuICAvKiogU2V0IHRvIGZhbHNlIHRvIGRpc2FibGUgY29tbWFuZCBrZXliaW5kaW5ncyAoZS5nLiwgd2hlbiBhIGRpYWxvZyBpcyBvcGVuKSAqL1xuICBpc0FjdGl2ZT86IGJvb2xlYW5cbn1cblxuY29uc3QgTk9PUF9IRUxQRVJTOiBQcm9tcHRJbnB1dEhlbHBlcnMgPSB7XG4gIHNldEN1cnNvck9mZnNldDogKCkgPT4ge30sXG4gIGNsZWFyQnVmZmVyOiAoKSA9PiB7fSxcbiAgcmVzZXRIaXN0b3J5OiAoKSA9PiB7fSxcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMga2V5YmluZGluZyBoYW5kbGVycyBmb3IgYWxsIFwiY29tbWFuZDoqXCIgYWN0aW9ucyBmb3VuZCBpbiB0aGVcbiAqIHVzZXIncyBrZXliaW5kaW5nIGNvbmZpZ3VyYXRpb24uIFdoZW4gdHJpZ2dlcmVkLCBlYWNoIGhhbmRsZXIgc3VibWl0c1xuICogdGhlIGNvcnJlc3BvbmRpbmcgc2xhc2ggY29tbWFuZCAoZS5nLiwgXCJjb21tYW5kOmNvbW1pdFwiIHN1Ym1pdHMgXCIvY29tbWl0XCIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gQ29tbWFuZEtleWJpbmRpbmdIYW5kbGVycyh7XG4gIG9uU3VibWl0LFxuICBpc0FjdGl2ZSA9IHRydWUsXG59OiBQcm9wcyk6IG51bGwge1xuICBjb25zdCBrZXliaW5kaW5nQ29udGV4dCA9IHVzZU9wdGlvbmFsS2V5YmluZGluZ0NvbnRleHQoKVxuICBjb25zdCBpc01vZGFsT3ZlcmxheUFjdGl2ZSA9IHVzZUlzTW9kYWxPdmVybGF5QWN0aXZlKClcblxuICAvLyBFeHRyYWN0IGNvbW1hbmQgYWN0aW9ucyBmcm9tIHBhcnNlZCBiaW5kaW5nc1xuICBjb25zdCBjb21tYW5kQWN0aW9ucyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICgha2V5YmluZGluZ0NvbnRleHQpIHJldHVybiBuZXcgU2V0PHN0cmluZz4oKVxuICAgIGNvbnN0IGFjdGlvbnMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICAgIGZvciAoY29uc3QgYmluZGluZyBvZiBrZXliaW5kaW5nQ29udGV4dC5iaW5kaW5ncykge1xuICAgICAgaWYgKGJpbmRpbmcuYWN0aW9uPy5zdGFydHNXaXRoKCdjb21tYW5kOicpKSB7XG4gICAgICAgIGFjdGlvbnMuYWRkKGJpbmRpbmcuYWN0aW9uKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWN0aW9uc1xuICB9LCBba2V5YmluZGluZ0NvbnRleHRdKVxuXG4gIC8vIEJ1aWxkIGhhbmRsZXIgbWFwIGZvciBhbGwgY29tbWFuZCBhY3Rpb25zXG4gIGNvbnN0IGhhbmRsZXJzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgbWFwOiBSZWNvcmQ8c3RyaW5nLCAoKSA9PiB2b2lkPiA9IHt9XG4gICAgZm9yIChjb25zdCBhY3Rpb24gb2YgY29tbWFuZEFjdGlvbnMpIHtcbiAgICAgIGNvbnN0IGNvbW1hbmROYW1lID0gYWN0aW9uLnNsaWNlKCdjb21tYW5kOicubGVuZ3RoKVxuICAgICAgbWFwW2FjdGlvbl0gPSAoKSA9PiB7XG4gICAgICAgIG9uU3VibWl0KGAvJHtjb21tYW5kTmFtZX1gLCBOT09QX0hFTFBFUlMsIHVuZGVmaW5lZCwge1xuICAgICAgICAgIGZyb21LZXliaW5kaW5nOiB0cnVlLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWFwXG4gIH0sIFtjb21tYW5kQWN0aW9ucywgb25TdWJtaXRdKVxuXG4gIHVzZUtleWJpbmRpbmdzKGhhbmRsZXJzLCB7XG4gICAgY29udGV4dDogJ0NoYXQnLFxuICAgIGlzQWN0aXZlOiBpc0FjdGl2ZSAmJiAhaXNNb2RhbE92ZXJsYXlBY3RpdmUsXG4gIH0pXG5cbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU0EsT0FBTyxRQUFRLE9BQU87QUFDL0IsU0FBU0MsdUJBQXVCLFFBQVEsOEJBQThCO0FBQ3RFLFNBQVND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