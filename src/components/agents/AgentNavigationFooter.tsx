// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  instructions?: string;
};
// AgentNavigationFooter 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AgentNavigationFooter(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    instructions: t1
  } = t0;
  // instructions 集合标记终端 UI Agent Navigation Foo...是否启用对应路径。
  const instructions = t1 === undefined ? "Press \u2191\u2193 to navigate \xB7 Enter to select \xB7 Esc to go back" : t1;
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供终端渲染后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings();
  // t2保存`exitState.pending ? `Press ${exitState.keyName} again to ...`，供后续判断或组装使用。
  const t2 = exitState.pending ? `Press ${exitState.keyName} again to exit` : instructions;
  // t3 暂存 `<Box marginLeft={2}><Text dimColor={true}>{t2}</Text></Bo...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t2) {
    // t3 暂存 `<Box marginLeft={2}><Text dimColor={true}>{t2}</Text></Bo...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box marginLeft={2}><Text dimColor={true}>{t2}</Text></Box>;
    // $[0] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t2;
    // $[1] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[1];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyIsIkJveCIsIlRleHQiLCJQcm9wcyIsImluc3RydWN0aW9ucyIsIkFnZW50TmF2aWdhdGlvbkZvb3RlciIsInQwIiwiJCIsIl9jIiwidDEiLCJ1bmRlZmluZWQiLCJleGl0U3RhdGUiLCJ0MiIsInBlbmRpbmciLCJrZXlOYW1lIiwidDMiXSwic291cmNlcyI6WyJBZ2VudE5hdmlnYXRpb25Gb290ZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBpbnN0cnVjdGlvbnM/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEFnZW50TmF2aWdhdGlvbkZvb3Rlcih7XG4gIGluc3RydWN0aW9ucyA9ICdQcmVzcyDihpHihpMgdG8gbmF2aWdhdGUgwrcgRW50ZXIgdG8gc2VsZWN0IMK3IEVzYyB0byBnbyBiYWNrJyxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgZXhpdFN0YXRlID0gdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzKClcblxuICByZXR1cm4gKFxuICAgIDxCb3ggbWFyZ2luTGVmdD17Mn0+XG4gICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAge2V4aXRTdGF0ZS5wZW5kaW5nXG4gICAgICAgICAgPyBgUHJlc3MgJHtleGl0U3RhdGUua2V5TmFtZX0gYWdhaW4gdG8gZXhpdGBcbiAgICAgICAgICA6IGluc3RydWN0aW9uc31cbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyw4QkFBOEIsUUFBUSwrQ0FBK0M7QUFDOUYsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUV4QyxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsWUFBWSxDQUFDLEVBQUUsTUFBTTtBQUN2QixDQUFDO0FBRUQsT0FBTyxTQUFBQyxzQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUErQjtJQUFBSixZQUFBLEVBQUFLO0VBQUEsSUFBQUgsRUFFOUI7RUFETixNQUFBRixZQUFBLEdBQUFLLEVBQXdFLEtBQXhFQyxTQUF3RSxHQUF4RSx5RUFBd0UsR0FBeEVELEVBQXdFO0VBRXhFLE1BQUFFLFNBQUEsR0FBa0JYLDhCQUE4QixDQUFDLENBQUM7RUFLM0MsTUFBQVksRUFBQSxHQUFBRCxTQUFTLENBQUFFLE9BRU0sR0FGZixTQUNZRixTQUFTLENBQUFHLE9BQVEsZ0JBQ2QsR0FGZlYsWUFFZTtFQUFBLElBQUFXLEVBQUE7RUFBQSxJQUFBUixDQUFBLFFBQUFLLEVBQUE7SUFKcEJHLEVBQUEsSUFBQyxHQUFHLENBQWEsVUFBQyxDQUFELEdBQUMsQ0FDaEIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUNYLENBQUFILEVBRWMsQ0FDakIsRUFKQyxJQUFJLENBS1AsRUFOQyxHQUFHLENBTUU7SUFBQUwsQ0FBQSxNQUFBSyxFQUFBO0lBQUFMLENBQUEsTUFBQVEsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVIsQ0FBQTtFQUFBO0VBQUEsT0FOTlEsRUFNTTtBQUFBIiwiaWdub3JlTGlzdCI6W119