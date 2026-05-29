// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 TextInput，将 ../TextInput.js 中已经封装好的能力接到本文件流程里。
import TextInput from '../TextInput.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  value: string;
  // 这个回调绑定到 onChange: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  onChange: (value: string) => void;
  historyFailedMatch: boolean;
};
// HistorySearchInput 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function HistorySearchInput(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    value,
    onChange,
    historyFailedMatch
  } = t0;
  // 临时值 t1 命名 `historyFailedMatch ? "no matching prompt:" : "search prom...`，让后续代码直接表达这个值的用途。
  const t1 = historyFailedMatch ? "no matching prompt:" : "search prompts:";
  // t2 暂存 `<Text dimColor={true}>{t1}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t1) {
    // t2 暂存 `<Text dimColor={true}>{t1}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text dimColor={true}>{t1}</Text>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // 临时值 t3保存`stringWidth`，供终端渲染后续处理使用。
  const t3 = stringWidth(value) + 1;
  // t4 暂存 `<TextInput value={value} onChange={onChange} cursorOffset...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== onChange || $[3] !== t3 || $[4] !== value) {
    // t4 暂存 `<TextInput value={value} onChange={onChange} cursorOffset...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <TextInput value={value} onChange={onChange} cursorOffset={value.length} onChangeCursorOffset={_temp} columns={t3} focus={true} showCursor={true} multiline={false} dimColor={true} />;
    // $[2] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onChange;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
    // $[4] 缓存 `value`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = value;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `<Box gap={1}>{t2}{t4}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t2 || $[7] !== t4) {
    // t5 暂存 `<Box gap={1}>{t2}{t4}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box gap={1}>{t2}{t4}</Box>;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// _temp 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {}
export default HistorySearchInput;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInN0cmluZ1dpZHRoIiwiQm94IiwiVGV4dCIsIlRleHRJbnB1dCIsIlByb3BzIiwidmFsdWUiLCJvbkNoYW5nZSIsImhpc3RvcnlGYWlsZWRNYXRjaCIsIkhpc3RvcnlTZWFyY2hJbnB1dCIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsInQzIiwidDQiLCJsZW5ndGgiLCJfdGVtcCIsInQ1Il0sInNvdXJjZXMiOlsiSGlzdG9yeVNlYXJjaElucHV0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHN0cmluZ1dpZHRoIH0gZnJvbSAnLi4vLi4vaW5rL3N0cmluZ1dpZHRoLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IFRleHRJbnB1dCBmcm9tICcuLi9UZXh0SW5wdXQuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIHZhbHVlOiBzdHJpbmdcbiAgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkXG4gIGhpc3RvcnlGYWlsZWRNYXRjaDogYm9vbGVhblxufVxuXG5mdW5jdGlvbiBIaXN0b3J5U2VhcmNoSW5wdXQoe1xuICB2YWx1ZSxcbiAgb25DaGFuZ2UsXG4gIGhpc3RvcnlGYWlsZWRNYXRjaCxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8Qm94IGdhcD17MX0+XG4gICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAge2hpc3RvcnlGYWlsZWRNYXRjaCA/ICdubyBtYXRjaGluZyBwcm9tcHQ6JyA6ICdzZWFyY2ggcHJvbXB0czonfVxuICAgICAgPC9UZXh0PlxuICAgICAgPFRleHRJbnB1dFxuICAgICAgICB2YWx1ZT17dmFsdWV9XG4gICAgICAgIG9uQ2hhbmdlPXtvbkNoYW5nZX1cbiAgICAgICAgLy8gRm9yY2UgY3Vyc29yIHRvIGVuZCBvZiBzZWFyY2ggaW5wdXQgc2luY2UgbmF2aWdhdGlvbiBzaG91bGQgY2FuY2VsIHNlYXJjaFxuICAgICAgICBjdXJzb3JPZmZzZXQ9e3ZhbHVlLmxlbmd0aH1cbiAgICAgICAgb25DaGFuZ2VDdXJzb3JPZmZzZXQ9eygpID0+IHt9fVxuICAgICAgICBjb2x1bW5zPXtzdHJpbmdXaWR0aCh2YWx1ZSkgKyAxfVxuICAgICAgICBmb2N1cz17dHJ1ZX1cbiAgICAgICAgc2hvd0N1cnNvcj17dHJ1ZX1cbiAgICAgICAgbXVsdGlsaW5lPXtmYWxzZX1cbiAgICAgICAgZGltQ29sb3I9e3RydWV9XG4gICAgICAvPlxuICAgIDwvQm94PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEhpc3RvcnlTZWFyY2hJbnB1dFxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLFFBQVEsMEJBQTBCO0FBQ3RELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsT0FBT0MsU0FBUyxNQUFNLGlCQUFpQjtBQUV2QyxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsS0FBSyxFQUFFLE1BQU07RUFDYkMsUUFBUSxFQUFFLENBQUNELEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJO0VBQ2pDRSxrQkFBa0IsRUFBRSxPQUFPO0FBQzdCLENBQUM7QUFFRCxTQUFBQyxtQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUE0QjtJQUFBTixLQUFBO0lBQUFDLFFBQUE7SUFBQUM7RUFBQSxJQUFBRSxFQUlwQjtFQUlDLE1BQUFHLEVBQUEsR0FBQUwsa0JBQWtCLEdBQWxCLHFCQUE4RCxHQUE5RCxpQkFBOEQ7RUFBQSxJQUFBTSxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBRSxFQUFBO0lBRGpFQyxFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWCxDQUFBRCxFQUE2RCxDQUNoRSxFQUZDLElBQUksQ0FFRTtJQUFBRixDQUFBLE1BQUFFLEVBQUE7SUFBQUYsQ0FBQSxNQUFBRyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSCxDQUFBO0VBQUE7RUFPSSxNQUFBSSxFQUFBLEdBQUFkLFdBQVcsQ0FBQ0ssS0FBSyxDQUFDLEdBQUcsQ0FBQztFQUFBLElBQUFVLEVBQUE7RUFBQSxJQUFBTCxDQUFBLFFBQUFKLFFBQUEsSUFBQUksQ0FBQSxRQUFBSSxFQUFBLElBQUFKLENBQUEsUUFBQUwsS0FBQTtJQU5qQ1UsRUFBQSxJQUFDLFNBQVMsQ0FDRFYsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDRkMsUUFBUSxDQUFSQSxTQUFPLENBQUMsQ0FFSixZQUFZLENBQVosQ0FBQUQsS0FBSyxDQUFBVyxNQUFNLENBQUMsQ0FDSixvQkFBUSxDQUFSLENBQUFDLEtBQU8sQ0FBQyxDQUNyQixPQUFzQixDQUF0QixDQUFBSCxFQUFxQixDQUFDLENBQ3hCLEtBQUksQ0FBSixLQUFHLENBQUMsQ0FDQyxVQUFJLENBQUosS0FBRyxDQUFDLENBQ0wsU0FBSyxDQUFMLE1BQUksQ0FBQyxDQUNOLFFBQUksQ0FBSixLQUFHLENBQUMsR0FDZDtJQUFBSixDQUFBLE1BQUFKLFFBQUE7SUFBQUksQ0FBQSxNQUFBSSxFQUFBO0lBQUFKLENBQUEsTUFBQUwsS0FBQTtJQUFBSyxDQUFBLE1BQUFLLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFMLENBQUE7RUFBQTtFQUFBLElBQUFRLEVBQUE7RUFBQSxJQUFBUixDQUFBLFFBQUFHLEVBQUEsSUFBQUgsQ0FBQSxRQUFBSyxFQUFBO0lBZkpHLEVBQUEsSUFBQyxHQUFHLENBQU0sR0FBQyxDQUFELEdBQUMsQ0FDVCxDQUFBTCxFQUVNLENBQ04sQ0FBQUUsRUFXQyxDQUNILEVBaEJDLEdBQUcsQ0FnQkU7SUFBQUwsQ0FBQSxNQUFBRyxFQUFBO0lBQUFILENBQUEsTUFBQUssRUFBQTtJQUFBTCxDQUFBLE1BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUFBLE9BaEJOUSxFQWdCTTtBQUFBO0FBdEJWLFNBQUFELE1BQUE7QUEwQkEsZUFBZVQsa0JBQWtCIiwiaWdub3JlTGlzdCI6W119