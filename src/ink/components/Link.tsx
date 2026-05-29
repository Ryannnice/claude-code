// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ReactNode } 来自 react，用于校准终端渲染的数据契约。
import type { ReactNode } from 'react';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 supportsHyperlinks，将 ../supports-hyperlinks.js 中已经封装好的能力接到本文件流程里。
import { supportsHyperlinks } from '../supports-hyperlinks.js';
// 引入 Text，将 ./Text.js 中已经封装好的能力接到本文件流程里。
import Text from './Text.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = {
  readonly children?: ReactNode;
  readonly url: string;
  readonly fallback?: ReactNode;
};
// 终端 UI 组件 Link在这里处理 `export default function Link(t0) {`，完成这一小步状态转换。
export default function Link(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children,
    url,
    fallback
  } = t0;
  // 文本内容保存`children ?? url`，供后续判断或组装使用。
  const content = children ?? url;
  // 满足 `supportsHyperlinks()` 时，终端渲染执行该分支。
  if (supportsHyperlinks()) {
    // t1 暂存 `<Text><ink-link href={url}>{content}</ink-link></Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== content || $[1] !== url) {
      // t1 暂存 `<Text><ink-link href={url}>{content}</ink-link></Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text><ink-link href={url}>{content}</ink-link></Text>;
      // $[0] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = content;
      // $[1] 缓存 `url`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = url;
      // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[2];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1保存`fallback ?? content`，供终端 UI Link后续判断或输出使用。
  const t1 = fallback ?? content;
  // t2 暂存 `<Text>{t1}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== t1) {
    // t2 暂存 `<Text>{t1}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text>{t1}</Text>;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdE5vZGUiLCJSZWFjdCIsInN1cHBvcnRzSHlwZXJsaW5rcyIsIlRleHQiLCJQcm9wcyIsImNoaWxkcmVuIiwidXJsIiwiZmFsbGJhY2siLCJMaW5rIiwidDAiLCIkIiwiX2MiLCJjb250ZW50IiwidDEiLCJ0MiJdLCJzb3VyY2VzIjpbIkxpbmsudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgUmVhY3ROb2RlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBzdXBwb3J0c0h5cGVybGlua3MgfSBmcm9tICcuLi9zdXBwb3J0cy1oeXBlcmxpbmtzLmpzJ1xuaW1wb3J0IFRleHQgZnJvbSAnLi9UZXh0LmpzJ1xuXG5leHBvcnQgdHlwZSBQcm9wcyA9IHtcbiAgcmVhZG9ubHkgY2hpbGRyZW4/OiBSZWFjdE5vZGVcbiAgcmVhZG9ubHkgdXJsOiBzdHJpbmdcbiAgcmVhZG9ubHkgZmFsbGJhY2s/OiBSZWFjdE5vZGVcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gTGluayh7XG4gIGNoaWxkcmVuLFxuICB1cmwsXG4gIGZhbGxiYWNrLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBVc2UgY2hpbGRyZW4gaWYgcHJvdmlkZWQsIG90aGVyd2lzZSBkaXNwbGF5IHRoZSBVUkxcbiAgY29uc3QgY29udGVudCA9IGNoaWxkcmVuID8/IHVybFxuXG4gIGlmIChzdXBwb3J0c0h5cGVybGlua3MoKSkge1xuICAgIC8vIFdyYXAgaW4gVGV4dCB0byBlbnN1cmUgd2UncmUgaW4gYSB0ZXh0IGNvbnRleHRcbiAgICAvLyAoaW5rLWxpbmsgaXMgYSB0ZXh0IGVsZW1lbnQgbGlrZSBpbmstdGV4dClcbiAgICByZXR1cm4gKFxuICAgICAgPFRleHQ+XG4gICAgICAgIDxpbmstbGluayBocmVmPXt1cmx9Pntjb250ZW50fTwvaW5rLWxpbms+XG4gICAgICA8L1RleHQ+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIDxUZXh0PntmYWxsYmFjayA/PyBjb250ZW50fTwvVGV4dD5cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLFNBQVMsUUFBUSxPQUFPO0FBQ3RDLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLGtCQUFrQixRQUFRLDJCQUEyQjtBQUM5RCxPQUFPQyxJQUFJLE1BQU0sV0FBVztBQUU1QixPQUFPLEtBQUtDLEtBQUssR0FBRztFQUNsQixTQUFTQyxRQUFRLENBQUMsRUFBRUwsU0FBUztFQUM3QixTQUFTTSxHQUFHLEVBQUUsTUFBTTtFQUNwQixTQUFTQyxRQUFRLENBQUMsRUFBRVAsU0FBUztBQUMvQixDQUFDO0FBRUQsZUFBZSxTQUFBUSxLQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWM7SUFBQU4sUUFBQTtJQUFBQyxHQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFJckI7RUFFTixNQUFBRyxPQUFBLEdBQWdCUCxRQUFlLElBQWZDLEdBQWU7RUFFL0IsSUFBSUosa0JBQWtCLENBQUMsQ0FBQztJQUFBLElBQUFXLEVBQUE7SUFBQSxJQUFBSCxDQUFBLFFBQUFFLE9BQUEsSUFBQUYsQ0FBQSxRQUFBSixHQUFBO01BSXBCTyxFQUFBLElBQUMsSUFBSSxDQUNILFNBQXlDLENBQXpCUCxJQUFHLENBQUhBLElBQUUsQ0FBQyxDQUFHTSxRQUFNLENBQUUsRUFBOUIsUUFBeUMsQ0FDM0MsRUFGQyxJQUFJLENBRUU7TUFBQUYsQ0FBQSxNQUFBRSxPQUFBO01BQUFGLENBQUEsTUFBQUosR0FBQTtNQUFBSSxDQUFBLE1BQUFHLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFILENBQUE7SUFBQTtJQUFBLE9BRlBHLEVBRU87RUFBQTtFQUlHLE1BQUFBLEVBQUEsR0FBQU4sUUFBbUIsSUFBbkJLLE9BQW1CO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFKLENBQUEsUUFBQUcsRUFBQTtJQUExQkMsRUFBQSxJQUFDLElBQUksQ0FBRSxDQUFBRCxFQUFrQixDQUFFLEVBQTFCLElBQUksQ0FBNkI7SUFBQUgsQ0FBQSxNQUFBRyxFQUFBO0lBQUFILENBQUEsTUFBQUksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUosQ0FBQTtFQUFBO0VBQUEsT0FBbENJLEVBQWtDO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=