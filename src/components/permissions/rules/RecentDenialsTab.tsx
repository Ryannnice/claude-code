// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useState } from 'react';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- 'r' is a view-specific key, not a global keybinding
// 引入 Box、Text、useInput，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useInput } from '../../../ink.js';
// 复用 AutoModeDenial、getAutoModeDenials 工具函数，把通用处理留在 ../../../utils/autoModeDenials.js 中维护。
import { type AutoModeDenial, getAutoModeDenials } from '../../../utils/autoModeDenials.js';
// 引入 Select，将 ../../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../../CustomSelect/select.js';
// 引入 StatusIcon，将 ../../design-system/StatusIcon.js 中已经封装好的能力接到本文件流程里。
import { StatusIcon } from '../../design-system/StatusIcon.js';
// 引入 useTabHeaderFocus，将 ../../design-system/Tabs.js 中已经封装好的能力接到本文件流程里。
import { useTabHeaderFocus } from '../../design-system/Tabs.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onHeaderFocusChange?: (focused: boolean) => void;
  /** Called when approved/retry state changes so parent can act on exit */
  onStateChange: (state: {
    approved: Set<number>;
    retry: Set<number>;
    denials: readonly AutoModeDenial[];
  }) => void;
};
// RecentDenialsTab 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function RecentDenialsTab(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(30);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onHeaderFocusChange,
    onStateChange
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    headerFocused,
    focusHeader
  } = useTabHeaderFocus();
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[headerFocused, onHeaderFocusChange]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== headerFocused || $[1] !== onHeaderFocusChange) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 调用 onHeaderFocusChange?.(headerFocused);，完成这一处局部操作。
      onHeaderFocusChange?.(headerFocused);
    };
    // t2 暂存 `[headerFocused, onHeaderFocusChange]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [headerFocused, onHeaderFocusChange];
    // $[0] 缓存 `headerFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = headerFocused;
    // $[1] 缓存 `onHeaderFocusChange`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onHeaderFocusChange;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t1, t2);
  // denials 集合 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [denials] = useState(_temp);
  // approved 由 React state 持有，setApproved 会在用户操作或异步结果返回时触发刷新。
  const [approved, setApproved] = useState(_temp2);
  // retry 由 React state 持有，setRetry 会在用户操作或异步结果返回时触发刷新。
  const [retry, setRetry] = useState(_temp3);
  // focusedIdx 由 React state 持有，setFocusedIdx 会在用户操作或异步结果返回时触发刷新。
  const [focusedIdx, setFocusedIdx] = useState(0);
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 暂存 `[approved, retry, denials, onStateChange]` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== approved || $[5] !== denials || $[6] !== onStateChange || $[7] !== retry) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 调用 onStateChange，触发终端渲染此处需要的副作用。
      onStateChange({
        approved,
        retry,
        denials
      });
    };
    // t4 暂存 `[approved, retry, denials, onStateChange]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [approved, retry, denials, onStateChange];
    // $[4] 缓存 `approved`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = approved;
    // $[5] 缓存 `denials`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = denials;
    // $[6] 缓存 `onStateChange`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onStateChange;
    // $[7] 缓存 `retry`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = retry;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t3, t4);
  // t5 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = value => {
      // idx保存`Number`，供终端渲染后续处理使用。
      const idx = Number(value);
      // setApproved 写入新的状态值，使终端渲染后续读取保持一致。
      setApproved(prev => {
        // next保存`Set`，供终端渲染后续处理使用。
        const next = new Set(prev);
        // 满足 `next.has(idx)` 时，终端渲染执行该分支。
        if (next.has(idx)) {
          // 调用 next.delete，触发终端渲染此处需要的副作用。
          next.delete(idx);
        } else {
          // 调用 next.add，触发终端渲染此处需要的副作用。
          next.add(idx);
        }
        // 返回 `next`，作为终端渲染这次计算的结果。
        return next;
      });
    };
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // handleSelect沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSelect = t5;
  // t6 暂存 `value_0 => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `value_0 => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = value_0 => {
      // setFocusedIdx 写入新的状态值，使终端渲染后续读取保持一致。
      setFocusedIdx(Number(value_0));
    };
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // handleFocus 集合保存`t6`，作为后续临时缓存值处理的输入。
  const handleFocus = t6;
  // t7 暂存 `(input, _key) => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== focusedIdx) {
    // t7 暂存 `(input, _key) => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = (input, _key) => {
      // 当 `input` 匹配 `"r"` 时，终端渲染执行对应分支。
      if (input === "r") {
        // setRetry 写入新的状态值，使终端渲染后续读取保持一致。
        setRetry(prev_0 => {
          // next_0保存`Set`，供终端渲染后续处理使用。
          const next_0 = new Set(prev_0);
          // 满足 `next_0.has(focusedIdx)` 时，终端渲染执行该分支。
          if (next_0.has(focusedIdx)) {
            // 调用 next_0.delete，触发终端渲染此处需要的副作用。
            next_0.delete(focusedIdx);
          } else {
            // 调用 next_0.add，触发终端渲染此处需要的副作用。
            next_0.add(focusedIdx);
          }
          // 返回 `next_0`，作为终端渲染这次计算的结果。
          return next_0;
        });
        // setApproved 写入新的状态值，使终端渲染后续读取保持一致。
        setApproved(prev_1 => {
          // 满足 `prev_1.has(focusedIdx)` 时，终端渲染执行该分支。
          if (prev_1.has(focusedIdx)) {
            // 返回 `prev_1`，作为终端渲染这次计算的结果。
            return prev_1;
          }
          // next_1保存`Set`，供终端渲染后续处理使用。
          const next_1 = new Set(prev_1);
          // 调用 next_1.add，触发终端渲染此处需要的副作用。
          next_1.add(focusedIdx);
          // 返回 `next_1`，作为终端渲染这次计算的结果。
          return next_1;
        });
      }
    };
    // $[12] 缓存 `focusedIdx`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = focusedIdx;
    // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[13];
  }
  // t8记录 `denials.length > 0` 是否成立，下一步按该结果分支。
  const t8 = denials.length > 0;
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== t8) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      isActive: t8
    };
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // 调用 useInput，触发终端渲染此处需要的副作用。
  useInput(t7, t9);
  // denials 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (denials.length === 0) {
    // t10 暂存 `<Text dimColor={true}>No recent denials. Commands denied ...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      // t10 暂存 `<Text dimColor={true}>No recent denials. Commands denied ...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Text dimColor={true}>No recent denials. Commands denied by the auto mode classifier will appear here.</Text>;
      // $[16] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[16];
    }
    // 返回 `t10`，作为终端渲染这次计算的结果。
    return t10;
  }
  // t10 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== approved || $[18] !== denials || $[19] !== retry) {
    // t11 暂存 `(d, idx_0) => {` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[21] !== approved || $[22] !== retry) {
      // t11 暂存 `(d, idx_0) => {` 生成的渲染片段，后续返回路径直接复用。
      t11 = (d, idx_0) => {
        // isApproved记录 `approved.has` 是否成立，终端渲染随后按该结果分支。
        const isApproved = approved.has(idx_0);
        // suffix保存`retry.has`，供终端渲染后续处理使用。
        const suffix = retry.has(idx_0) ? " (retry)" : "";
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          label: <Text><StatusIcon status={isApproved ? "success" : "error"} withSpace={true} />{d.display}<Text dimColor={true}>{suffix}</Text></Text>,
          value: String(idx_0)
        };
      };
      // $[21] 缓存 `approved`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = approved;
      // $[22] 缓存 `retry`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = retry;
      // $[23] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = t11;
    } else {
      // t11 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[23];
    }
    // t10 暂存 `denials.map(t11)` 生成的渲染片段，后续返回路径直接复用。
    t10 = denials.map(t11);
    // $[17] 缓存 `approved`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = approved;
    // $[18] 缓存 `denials`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = denials;
    // $[19] 缓存 `retry`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = retry;
    // $[20] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[20];
  }
  // 选项沿用 `t10` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const options = t10;
  // t11 暂存 `<Text>Commands recently denied by the auto mode classifie...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `<Text>Commands recently denied by the auto mode classifie...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text>Commands recently denied by the auto mode classifier.</Text>;
    // $[24] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[24];
  }
  // 临时值 t12保存`Math.min`，供终端渲染后续处理使用。
  const t12 = Math.min(10, options.length);
  // t13 暂存 `<Box flexDirection="column">{t11}<Box marginTop={1}><Sele...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== focusHeader || $[26] !== headerFocused || $[27] !== options || $[28] !== t12) {
    // t13 暂存 `<Box flexDirection="column">{t11}<Box marginTop={1}><Sele...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Box flexDirection="column">{t11}<Box marginTop={1}><Select options={options} onChange={handleSelect} onFocus={handleFocus} visibleOptionCount={t12} isDisabled={headerFocused} onUpFromFirstItem={focusHeader} /></Box></Box>;
    // $[25] 缓存 `focusHeader`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = focusHeader;
    // $[26] 缓存 `headerFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = headerFocused;
    // $[27] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = options;
    // $[28] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t12;
    // $[29] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[29];
  }
  // 返回 `t13`，作为终端渲染这次计算的结果。
  return t13;
}
// _temp3 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3() {
  // 返回 `new Set()`，作为终端渲染这次计算的结果。
  return new Set();
}
// _temp2 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2() {
  // 返回 `new Set()`，作为终端渲染这次计算的结果。
  return new Set();
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 返回 `getAutoModeDenials()`，作为终端渲染这次计算的结果。
  return getAutoModeDenials();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJCb3giLCJUZXh0IiwidXNlSW5wdXQiLCJBdXRvTW9kZURlbmlhbCIsImdldEF1dG9Nb2RlRGVuaWFscyIsIlNlbGVjdCIsIlN0YXR1c0ljb24iLCJ1c2VUYWJIZWFkZXJGb2N1cyIsIlByb3BzIiwib25IZWFkZXJGb2N1c0NoYW5nZSIsImZvY3VzZWQiLCJvblN0YXRlQ2hhbmdlIiwic3RhdGUiLCJhcHByb3ZlZCIsIlNldCIsInJldHJ5IiwiZGVuaWFscyIsIlJlY2VudERlbmlhbHNUYWIiLCJ0MCIsIiQiLCJfYyIsImhlYWRlckZvY3VzZWQiLCJmb2N1c0hlYWRlciIsInQxIiwidDIiLCJfdGVtcCIsInNldEFwcHJvdmVkIiwiX3RlbXAyIiwic2V0UmV0cnkiLCJfdGVtcDMiLCJmb2N1c2VkSWR4Iiwic2V0Rm9jdXNlZElkeCIsInQzIiwidDQiLCJ0NSIsIlN5bWJvbCIsImZvciIsInZhbHVlIiwiaWR4IiwiTnVtYmVyIiwicHJldiIsIm5leHQiLCJoYXMiLCJkZWxldGUiLCJhZGQiLCJoYW5kbGVTZWxlY3QiLCJ0NiIsInZhbHVlXzAiLCJoYW5kbGVGb2N1cyIsInQ3IiwiaW5wdXQiLCJfa2V5IiwicHJldl8wIiwibmV4dF8wIiwicHJldl8xIiwibmV4dF8xIiwidDgiLCJsZW5ndGgiLCJ0OSIsImlzQWN0aXZlIiwidDEwIiwidDExIiwiZCIsImlkeF8wIiwiaXNBcHByb3ZlZCIsInN1ZmZpeCIsImxhYmVsIiwiZGlzcGxheSIsIlN0cmluZyIsIm1hcCIsIm9wdGlvbnMiLCJ0MTIiLCJNYXRoIiwibWluIiwidDEzIl0sInNvdXJjZXMiOlsiUmVjZW50RGVuaWFsc1RhYi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGN1c3RvbS1ydWxlcy9wcmVmZXItdXNlLWtleWJpbmRpbmdzIC0tICdyJyBpcyBhIHZpZXctc3BlY2lmaWMga2V5LCBub3QgYSBnbG9iYWwga2V5YmluZGluZ1xuaW1wb3J0IHsgQm94LCBUZXh0LCB1c2VJbnB1dCB9IGZyb20gJy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB7XG4gIHR5cGUgQXV0b01vZGVEZW5pYWwsXG4gIGdldEF1dG9Nb2RlRGVuaWFscyxcbn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvYXV0b01vZGVEZW5pYWxzLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IFN0YXR1c0ljb24gfSBmcm9tICcuLi8uLi9kZXNpZ24tc3lzdGVtL1N0YXR1c0ljb24uanMnXG5pbXBvcnQgeyB1c2VUYWJIZWFkZXJGb2N1cyB9IGZyb20gJy4uLy4uL2Rlc2lnbi1zeXN0ZW0vVGFicy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgb25IZWFkZXJGb2N1c0NoYW5nZT86IChmb2N1c2VkOiBib29sZWFuKSA9PiB2b2lkXG4gIC8qKiBDYWxsZWQgd2hlbiBhcHByb3ZlZC9yZXRyeSBzdGF0ZSBjaGFuZ2VzIHNvIHBhcmVudCBjYW4gYWN0IG9uIGV4aXQgKi9cbiAgb25TdGF0ZUNoYW5nZTogKHN0YXRlOiB7XG4gICAgYXBwcm92ZWQ6IFNldDxudW1iZXI+XG4gICAgcmV0cnk6IFNldDxudW1iZXI+XG4gICAgZGVuaWFsczogcmVhZG9ubHkgQXV0b01vZGVEZW5pYWxbXVxuICB9KSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBSZWNlbnREZW5pYWxzVGFiKHtcbiAgb25IZWFkZXJGb2N1c0NoYW5nZSxcbiAgb25TdGF0ZUNoYW5nZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBoZWFkZXJGb2N1c2VkLCBmb2N1c0hlYWRlciB9ID0gdXNlVGFiSGVhZGVyRm9jdXMoKVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG9uSGVhZGVyRm9jdXNDaGFuZ2U/LihoZWFkZXJGb2N1c2VkKVxuICB9LCBbaGVhZGVyRm9jdXNlZCwgb25IZWFkZXJGb2N1c0NoYW5nZV0pXG5cbiAgLy8gU25hcHNob3Qgb24gbW91bnQg4oCUIGFwcHJvdmVkL3JldHJ5IFNldHMga2V5IGJ5IGluZGV4LCBhbmQgdGhlIGxpdmUgc3RvcmVcbiAgLy8gcHJlcGVuZHMuIEEgY29uY3VycmVudCBkZW5pYWwgd291bGQgc2hpZnQgYWxsIGluZGljZXMgbWlkLWVkaXQuXG4gIGNvbnN0IFtkZW5pYWxzXSA9IHVzZVN0YXRlKCgpID0+IGdldEF1dG9Nb2RlRGVuaWFscygpKVxuXG4gIGNvbnN0IFthcHByb3ZlZCwgc2V0QXBwcm92ZWRdID0gdXNlU3RhdGU8U2V0PG51bWJlcj4+KCgpID0+IG5ldyBTZXQoKSlcbiAgY29uc3QgW3JldHJ5LCBzZXRSZXRyeV0gPSB1c2VTdGF0ZTxTZXQ8bnVtYmVyPj4oKCkgPT4gbmV3IFNldCgpKVxuICBjb25zdCBbZm9jdXNlZElkeCwgc2V0Rm9jdXNlZElkeF0gPSB1c2VTdGF0ZSgwKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgb25TdGF0ZUNoYW5nZSh7IGFwcHJvdmVkLCByZXRyeSwgZGVuaWFscyB9KVxuICB9LCBbYXBwcm92ZWQsIHJldHJ5LCBkZW5pYWxzLCBvblN0YXRlQ2hhbmdlXSlcblxuICBjb25zdCBoYW5kbGVTZWxlY3QgPSB1c2VDYWxsYmFjaygodmFsdWU6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGlkeCA9IE51bWJlcih2YWx1ZSlcbiAgICBzZXRBcHByb3ZlZChwcmV2ID0+IHtcbiAgICAgIGNvbnN0IG5leHQgPSBuZXcgU2V0KHByZXYpXG4gICAgICBpZiAobmV4dC5oYXMoaWR4KSkgbmV4dC5kZWxldGUoaWR4KVxuICAgICAgZWxzZSBuZXh0LmFkZChpZHgpXG4gICAgICByZXR1cm4gbmV4dFxuICAgIH0pXG4gIH0sIFtdKVxuXG4gIGNvbnN0IGhhbmRsZUZvY3VzID0gdXNlQ2FsbGJhY2soKHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXRGb2N1c2VkSWR4KE51bWJlcih2YWx1ZSkpXG4gIH0sIFtdKVxuXG4gIHVzZUlucHV0KFxuICAgIChpbnB1dCwgX2tleSkgPT4ge1xuICAgICAgaWYgKGlucHV0ID09PSAncicpIHtcbiAgICAgICAgc2V0UmV0cnkocHJldiA9PiB7XG4gICAgICAgICAgY29uc3QgbmV4dCA9IG5ldyBTZXQocHJldilcbiAgICAgICAgICBpZiAobmV4dC5oYXMoZm9jdXNlZElkeCkpIG5leHQuZGVsZXRlKGZvY3VzZWRJZHgpXG4gICAgICAgICAgZWxzZSBuZXh0LmFkZChmb2N1c2VkSWR4KVxuICAgICAgICAgIHJldHVybiBuZXh0XG4gICAgICAgIH0pXG4gICAgICAgIC8vIFJldHJ5IGltcGxpZXMgYXBwcm92ZVxuICAgICAgICBzZXRBcHByb3ZlZChwcmV2ID0+IHtcbiAgICAgICAgICBpZiAocHJldi5oYXMoZm9jdXNlZElkeCkpIHJldHVybiBwcmV2XG4gICAgICAgICAgY29uc3QgbmV4dCA9IG5ldyBTZXQocHJldilcbiAgICAgICAgICBuZXh0LmFkZChmb2N1c2VkSWR4KVxuICAgICAgICAgIHJldHVybiBuZXh0XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSxcbiAgICB7IGlzQWN0aXZlOiBkZW5pYWxzLmxlbmd0aCA+IDAgfSxcbiAgKVxuXG4gIGlmIChkZW5pYWxzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgTm8gcmVjZW50IGRlbmlhbHMuIENvbW1hbmRzIGRlbmllZCBieSB0aGUgYXV0byBtb2RlIGNsYXNzaWZpZXIgd2lsbFxuICAgICAgICBhcHBlYXIgaGVyZS5cbiAgICAgIDwvVGV4dD5cbiAgICApXG4gIH1cblxuICBjb25zdCBvcHRpb25zID0gZGVuaWFscy5tYXAoKGQsIGlkeCkgPT4ge1xuICAgIGNvbnN0IGlzQXBwcm92ZWQgPSBhcHByb3ZlZC5oYXMoaWR4KVxuICAgIGNvbnN0IHN1ZmZpeCA9IHJldHJ5LmhhcyhpZHgpID8gJyAocmV0cnkpJyA6ICcnXG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiAoXG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIDxTdGF0dXNJY29uIHN0YXR1cz17aXNBcHByb3ZlZCA/ICdzdWNjZXNzJyA6ICdlcnJvcid9IHdpdGhTcGFjZSAvPlxuICAgICAgICAgIHtkLmRpc3BsYXl9XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+e3N1ZmZpeH08L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICksXG4gICAgICB2YWx1ZTogU3RyaW5nKGlkeCksXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8VGV4dD5Db21tYW5kcyByZWNlbnRseSBkZW5pZWQgYnkgdGhlIGF1dG8gbW9kZSBjbGFzc2lmaWVyLjwvVGV4dD5cbiAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgPFNlbGVjdFxuICAgICAgICAgIG9wdGlvbnM9e29wdGlvbnN9XG4gICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVNlbGVjdH1cbiAgICAgICAgICBvbkZvY3VzPXtoYW5kbGVGb2N1c31cbiAgICAgICAgICB2aXNpYmxlT3B0aW9uQ291bnQ9e01hdGgubWluKDEwLCBvcHRpb25zLmxlbmd0aCl9XG4gICAgICAgICAgaXNEaXNhYmxlZD17aGVhZGVyRm9jdXNlZH1cbiAgICAgICAgICBvblVwRnJvbUZpcnN0SXRlbT17Zm9jdXNIZWFkZXJ9XG4gICAgICAgIC8+XG4gICAgICA8L0JveD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLEVBQUVDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFD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