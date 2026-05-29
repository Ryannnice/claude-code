// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getAgentModelOptions 工具函数，把通用处理留在 ../../utils/model/agent.js 中维护。
import { getAgentModelOptions } from '../../utils/model/agent.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// ModelSelectorProps 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
interface ModelSelectorProps {
  initialModel?: string;
  // 这个回调绑定到 onComplete: (model?: string) => void;，负责终端渲染在该局部场景下的响应。
  onComplete: (model?: string) => void;
  onCancel?: () => void;
}
// ModelSelector 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ModelSelector(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    initialModel,
    onComplete,
    onCancel
  } = t0;
  // t1 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== initialModel) {
    // 终端 UI 组件 Model Selector在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // base读取`getAgentModelOptions`，供终端渲染后续处理使用。
      const base = getAgentModelOptions();
      // 只有 `initialModel && !base.some(o => o.value === initialModel)` 满足时，终端渲染才执行该分支。
      if (initialModel && !base.some(o => o.value === initialModel)) {
        // t1 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
        t1 = [{
          value: initialModel,
          label: initialModel,
          description: "Current model (custom ID)"
        }, ...base];
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // t1 暂存 `base` 生成的渲染片段，后续返回路径直接复用。
      t1 = base;
    }
    // $[0] 缓存 `initialModel`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = initialModel;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // modelOptions 集合沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const modelOptions = t1;
  // defaultModel 命名 `initialModel ?? "sonnet"`，让后续代码直接表达这个值的用途。
  const defaultModel = initialModel ?? "sonnet";
  // t2 暂存 `<Box marginBottom={1}><Text dimColor={true}>Model determi...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Box marginBottom={1}><Text dimColor={true}>Model determi...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box marginBottom={1}><Text dimColor={true}>Model determines the agent's reasoning capabilities and speed.</Text></Box>;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3暂存 `() => onCancel ? onCancel() : onComplete(undefined)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onCancel || $[4] !== onComplete) {
    // t3暂存 `() => onCancel ? onCancel() : onComplete(undefined)` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => onCancel ? onCancel() : onComplete(undefined);
    // $[3] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onCancel;
    // $[4] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onComplete;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4暂存 `<Box flexDirection="column">{t2}<Select options={modelOpt...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== defaultModel || $[7] !== modelOptions || $[8] !== onComplete || $[9] !== t3) {
    // t4暂存 `<Box flexDirection="column">{t2}<Select options={modelOpt...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column">{t2}<Select options={modelOptions} defaultValue={defaultModel} onChange={onComplete} onCancel={t3} /></Box>;
    // $[6] 缓存 `defaultModel`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = defaultModel;
    // $[7] 缓存 `modelOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = modelOptions;
    // $[8] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onComplete;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
  } else {
    // t4从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[10];
  }
  // 返回 t4，把终端渲染这个分支的结果交还调用方。
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJnZXRBZ2VudE1vZGVsT3B0aW9ucyIsIlNlbGVjdCIsIk1vZGVsU2VsZWN0b3JQcm9wcyIsImluaXRpYWxNb2RlbCIsIm9uQ29tcGxldGUiLCJtb2RlbCIsIm9uQ2FuY2VsIiwiTW9kZWxTZWxlY3RvciIsInQwIiwiJCIsIl9jIiwidDEiLCJiYjAiLCJiYXNlIiwic29tZSIsIm8iLCJ2YWx1ZSIsImxhYmVsIiwiZGVzY3JpcHRpb24iLCJtb2RlbE9wdGlvbnMiLCJkZWZhdWx0TW9kZWwiLCJ0MiIsIlN5bWJvbCIsImZvciIsInQzIiwidW5kZWZpbmVkIiwidDQiXSwic291cmNlcyI6WyJNb2RlbFNlbGVjdG9yLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGdldEFnZW50TW9kZWxPcHRpb25zIH0gZnJvbSAnLi4vLi4vdXRpbHMvbW9kZWwvYWdlbnQuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuLi9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuXG5pbnRlcmZhY2UgTW9kZWxTZWxlY3RvclByb3BzIHtcbiAgaW5pdGlhbE1vZGVsPzogc3RyaW5nXG4gIG9uQ29tcGxldGU6IChtb2RlbD86IHN0cmluZykgPT4gdm9pZFxuICBvbkNhbmNlbD86ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE1vZGVsU2VsZWN0b3Ioe1xuICBpbml0aWFsTW9kZWwsXG4gIG9uQ29tcGxldGUsXG4gIG9uQ2FuY2VsLFxufTogTW9kZWxTZWxlY3RvclByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgbW9kZWxPcHRpb25zID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgYmFzZSA9IGdldEFnZW50TW9kZWxPcHRpb25zKClcbiAgICAvLyBJZiB0aGUgYWdlbnQncyBjdXJyZW50IG1vZGVsIGlzIGEgZnVsbCBJRCAoZS5nLiAnY2xhdWRlLW9wdXMtNC01Jykgbm90XG4gICAgLy8gaW4gdGhlIGFsaWFzIGxpc3QsIGluamVjdCBpdCBhcyBhbiBvcHRpb24gc28gaXQgY2FuIHJvdW5kLXRyaXAgdGhyb3VnaFxuICAgIC8vIGNvbmZpcm0gd2l0aG91dCBiZWluZyBvdmVyd3JpdHRlbi5cbiAgICBpZiAoaW5pdGlhbE1vZGVsICYmICFiYXNlLnNvbWUobyA9PiBvLnZhbHVlID09PSBpbml0aWFsTW9kZWwpKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICB7XG4gICAgICAgICAgdmFsdWU6IGluaXRpYWxNb2RlbCxcbiAgICAgICAgICBsYWJlbDogaW5pdGlhbE1vZGVsLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBtb2RlbCAoY3VzdG9tIElEKScsXG4gICAgICAgIH0sXG4gICAgICAgIC4uLmJhc2UsXG4gICAgICBdXG4gICAgfVxuICAgIHJldHVybiBiYXNlXG4gIH0sIFtpbml0aWFsTW9kZWxdKVxuXG4gIGNvbnN0IGRlZmF1bHRNb2RlbCA9IGluaXRpYWxNb2RlbCA/PyAnc29ubmV0J1xuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIE1vZGVsIGRldGVybWluZXMgdGhlIGFnZW50JmFwb3M7cyByZWFzb25pbmcgY2FwYWJpbGl0aWVzIGFuZCBzcGVlZC5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8U2VsZWN0XG4gICAgICAgIG9wdGlvbnM9e21vZGVsT3B0aW9uc31cbiAgICAgICAgZGVmYXVsdFZhbHVlPXtkZWZhdWx0TW9kZWx9XG4gICAgICAgIG9uQ2hhbmdlPXtvbkNvbXBsZXRlfVxuICAgICAgICBvbkNhbmNlbD17KCkgPT4gKG9uQ2FuY2VsID8gb25DYW5jZWwoKSA6IG9uQ29tcGxldGUodW5kZWZpbmVkKSl9XG4gICAgICAvPlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0Msb0JBQW9CLFFBQVEsNEJBQTRCO0FBQ2pFLFNBQVNDLE1BQU0sUUFBUSwyQkFBMkI7QUFFbEQsVUFBVUMsa0JBQWtCLENBQUM7RUFDM0JDLFlBQVksQ0FBQyxFQUFFLE1BQU07RUFDckJDLFVBQVUsRUFBRSxDQUFDQyxLQUFjLENBQVIsRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJO0VBQ3BDQyxRQUFRLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSTtBQUN2QjtBQUVBLE9BQU8sU0FBQUMsY0FBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUF1QjtJQUFBUCxZQUFBO0lBQUFDLFVBQUE7SUFBQUU7RUFBQSxJQUFBRSxFQUlUO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQU4sWUFBQTtJQUFBUyxHQUFBO01BRWpCLE1BQUFDLElBQUEsR0FBYWIsb0JBQW9CLENBQUMsQ0FBQztNQUluQyxJQUFJRyxZQUF5RCxJQUF6RCxDQUFpQlUsSUFBSSxDQUFBQyxJQUFLLENBQUNDLENBQUEsSUFBS0EsQ0FBQyxDQUFBQyxLQUFNLEtBQUtiLFlBQVksQ0FBQztRQUMzRFEsRUFBQSxHQUFPLENBQ0w7VUFBQUssS0FBQSxFQUNTYixZQUFZO1VBQUFjLEtBQUEsRUFDWmQsWUFBWTtVQUFBZSxXQUFBLEVBQ047UUFDZixDQUFDLEtBQ0VMLElBQUksQ0FDUjtRQVBELE1BQUFELEdBQUE7TUFPQztNQUVIRCxFQUFBLEdBQU9FLElBQUk7SUFBQTtJQUFBSixDQUFBLE1BQUFOLFlBQUE7SUFBQU0sQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFmYixNQUFBVSxZQUFBLEdBQXFCUixFQWdCSDtFQUVsQixNQUFBUyxZQUFBLEdBQXFCakIsWUFBd0IsSUFBeEIsUUFBd0I7RUFBQSxJQUFBa0IsRUFBQTtFQUFBLElBQUFaLENBQUEsUUFBQWEsTUFBQSxDQUFBQyxHQUFBO0lBSXpDRixFQUFBLElBQUMsR0FBRyxDQUFlLFlBQUMsQ0FBRCxHQUFDLENBQ2xCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyw4REFFZixFQUZDLElBQUksQ0FHUCxFQUpDLEdBQUcsQ0FJRTtJQUFBWixDQUFBLE1BQUFZLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFaLENBQUE7RUFBQTtFQUFBLElBQUFlLEVBQUE7RUFBQSxJQUFBZixDQUFBLFFBQUFILFFBQUEsSUFBQUcsQ0FBQSxRQUFBTCxVQUFBO0lBS01vQixFQUFBLEdBQUFBLENBQUEsS0FBT2xCLFFBQVEsR0FBR0EsUUFBUSxDQUF5QixDQUFDLEdBQXJCRixVQUFVLENBQUNxQixTQUFTLENBQUU7SUFBQWhCLENBQUEsTUFBQUgsUUFBQTtJQUFBRyxDQUFBLE1BQUFMLFVBQUE7SUFBQUssQ0FBQSxNQUFBZSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBZixDQUFBO0VBQUE7RUFBQSxJQUFBaUIsRUFBQTtFQUFBLElBQUFqQixDQUFBLFFBQUFXLFlBQUEsSUFBQVgsQ0FBQSxRQUFBVSxZQUFBLElBQUFWLENBQUEsUUFBQUwsVUFBQSxJQUFBSyxDQUFBLFFBQUFlLEVBQUE7SUFWbkVFLEVBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FDekIsQ0FBQUwsRUFJSyxDQUNMLENBQUMsTUFBTSxDQUNJRixPQUFZLENBQVpBLGFBQVcsQ0FBQyxDQUNQQyxZQUFZLENBQVpBLGFBQVcsQ0FBQyxDQUNoQmhCLFFBQVUsQ0FBVkEsV0FBUyxDQUFDLENBQ1YsUUFBcUQsQ0FBckQsQ0FBQW9CLEVBQW9ELENBQUMsR0FFbkUsRUFaQyxHQUFHLENBWUU7SUFBQWYsQ0FBQSxNQUFBVyxZQUFBO0lBQUFYLENBQUEsTUFBQVUsWUFBQTtJQUFBVixDQUFBLE1BQUFMLFVBQUE7SUFBQUssQ0FBQSxNQUFBZSxFQUFBO0lBQUFmLENBQUEsT0FBQWlCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFqQixDQUFBO0VBQUE7RUFBQSxPQVpOaUIsRUFZTTtBQUFBIiwiaWdub3JlTGlzdCI6W119