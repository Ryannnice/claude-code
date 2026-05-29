// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../../ink.js';
// 接入 BashTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BashTool } from '../../../tools/BashTool/BashTool.js';
// 类型依赖 { PermissionRuleValue } 来自 ../../../utils/permissions/PermissionRule.js，用于校准终端渲染的数据契约。
import type { PermissionRuleValue } from '../../../utils/permissions/PermissionRule.js';
// RuleSubtitleProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type RuleSubtitleProps = {
  ruleValue: PermissionRuleValue;
};
// PermissionRuleDescription 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionRuleDescription(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    ruleValue
  } = t0;
  // 按照 ruleValue.toolName 的取值选择终端渲染的具体处理分支。
  switch (ruleValue.toolName) {
    case BashTool.name:
      {
        // 满足 `ruleValue.ruleContent` 时，终端渲染执行该分支。
        if (ruleValue.ruleContent) {
          // 满足 `ruleValue.ruleContent.endsWith(":*")` 时，终端渲染执行该分支。
          if (ruleValue.ruleContent.endsWith(":*")) {
            // t1 暂存 `ruleValue.ruleContent.slice(0, -2)` 的派生结果，便于缓存命中时直接复用。
            let t1;
            // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
            if ($[0] !== ruleValue.ruleContent) {
              // t1 暂存 `ruleValue.ruleContent.slice(0, -2)` 生成的渲染片段，后续返回路径直接复用。
              t1 = ruleValue.ruleContent.slice(0, -2);
              // $[0] 缓存 `ruleValue.ruleContent`，下次依赖未变时 React 编译产物可直接复用。
              $[0] = ruleValue.ruleContent;
              // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
              $[1] = t1;
            } else {
              // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
              t1 = $[1];
            }
            // t2 暂存 `<Text dimColor={true}>Any Bash command starting with{" "}...` 的派生结果，便于缓存命中时直接复用。
            let t2;
            // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
            if ($[2] !== t1) {
              // t2 暂存 `<Text dimColor={true}>Any Bash command starting with{" "}...` 生成的渲染片段，后续返回路径直接复用。
              t2 = <Text dimColor={true}>Any Bash command starting with{" "}<Text bold={true}>{t1}</Text></Text>;
              // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
              $[2] = t1;
              // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
              $[3] = t2;
            } else {
              // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
              t2 = $[3];
            }
            // 返回 `t2`，作为终端渲染这次计算的结果。
            return t2;
          } else {
            // t1 暂存 `<Text dimColor={true}>The Bash command <Text bold={true}>...` 的派生结果，便于缓存命中时直接复用。
            let t1;
            // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
            if ($[4] !== ruleValue.ruleContent) {
              // t1 暂存 `<Text dimColor={true}>The Bash command <Text bold={true}>...` 生成的渲染片段，后续返回路径直接复用。
              t1 = <Text dimColor={true}>The Bash command <Text bold={true}>{ruleValue.ruleContent}</Text></Text>;
              // $[4] 缓存 `ruleValue.ruleContent`，下次依赖未变时 React 编译产物可直接复用。
              $[4] = ruleValue.ruleContent;
              // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
              $[5] = t1;
            } else {
              // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
              t1 = $[5];
            }
            // 返回 `t1`，作为终端渲染这次计算的结果。
            return t1;
          }
        } else {
          // t1 暂存 `<Text dimColor={true}>Any Bash command</Text>` 的派生结果，便于缓存命中时直接复用。
          let t1;
          // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
          if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
            // t1 暂存 `<Text dimColor={true}>Any Bash command</Text>` 生成的渲染片段，后续返回路径直接复用。
            t1 = <Text dimColor={true}>Any Bash command</Text>;
            // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
            $[6] = t1;
          } else {
            // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
            t1 = $[6];
          }
          // 返回 `t1`，作为终端渲染这次计算的结果。
          return t1;
        }
      }
    default:
      {
        // ruleValue.ruleContent缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!ruleValue.ruleContent) {
          // t1 暂存 `<Text dimColor={true}>Any use of the <Text bold={true}>{r...` 的派生结果，便于缓存命中时直接复用。
          let t1;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[7] !== ruleValue.toolName) {
            // t1 暂存 `<Text dimColor={true}>Any use of the <Text bold={true}>{r...` 生成的渲染片段，后续返回路径直接复用。
            t1 = <Text dimColor={true}>Any use of the <Text bold={true}>{ruleValue.toolName}</Text> tool</Text>;
            // $[7] 缓存 `ruleValue.toolName`，下次依赖未变时 React 编译产物可直接复用。
            $[7] = ruleValue.toolName;
            // $[8] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
            $[8] = t1;
          } else {
            // t1 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
            t1 = $[8];
          }
          // 返回 `t1`，作为终端渲染这次计算的结果。
          return t1;
        } else {
          // 返回 `null`，作为终端渲染这次计算的结果。
          return null;
        }
      }
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJCYXNoVG9vbCIsIlBlcm1pc3Npb25SdWxlVmFsdWUiLCJSdWxlU3VidGl0bGVQcm9wcyIsInJ1bGVWYWx1ZSIsIlBlcm1pc3Npb25SdWxlRGVzY3JpcHRpb24iLCJ0MCIsIiQiLCJfYyIsInRvb2xOYW1lIiwibmFtZSIsInJ1bGVDb250ZW50IiwiZW5kc1dpdGgiLCJ0MSIsInNsaWNlIiwidDIiLCJTeW1ib2wiLCJmb3IiXSwic291cmNlcyI6WyJQZXJtaXNzaW9uUnVsZURlc2NyaXB0aW9uLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBCYXNoVG9vbCB9IGZyb20gJy4uLy4uLy4uL3Rvb2xzL0Jhc2hUb29sL0Jhc2hUb29sLmpzJ1xuaW1wb3J0IHR5cGUgeyBQZXJtaXNzaW9uUnVsZVZhbHVlIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvUGVybWlzc2lvblJ1bGUuanMnXG5cbnR5cGUgUnVsZVN1YnRpdGxlUHJvcHMgPSB7XG4gIHJ1bGVWYWx1ZTogUGVybWlzc2lvblJ1bGVWYWx1ZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gUGVybWlzc2lvblJ1bGVEZXNjcmlwdGlvbih7XG4gIHJ1bGVWYWx1ZSxcbn06IFJ1bGVTdWJ0aXRsZVByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgc3dpdGNoIChydWxlVmFsdWUudG9vbE5hbWUpIHtcbiAgICBjYXNlIEJhc2hUb29sLm5hbWU6IHtcbiAgICAgIGlmIChydWxlVmFsdWUucnVsZUNvbnRlbnQpIHtcbiAgICAgICAgaWYgKHJ1bGVWYWx1ZS5ydWxlQ29udGVudC5lbmRzV2l0aCgnOionKSkge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgQW55IEJhc2ggY29tbWFuZCBzdGFydGluZyB3aXRoeycgJ31cbiAgICAgICAgICAgICAgPFRleHQgYm9sZD57cnVsZVZhbHVlLnJ1bGVDb250ZW50LnNsaWNlKDAsIC0yKX08L1RleHQ+XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgVGhlIEJhc2ggY29tbWFuZCA8VGV4dCBib2xkPntydWxlVmFsdWUucnVsZUNvbnRlbnR9PC9UZXh0PlxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIDxUZXh0IGRpbUNvbG9yPkFueSBCYXNoIGNvbW1hbmQ8L1RleHQ+XG4gICAgICB9XG4gICAgfVxuICAgIGRlZmF1bHQ6IHtcbiAgICAgIGlmICghcnVsZVZhbHVlLnJ1bGVDb250ZW50KSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICBBbnkgdXNlIG9mIHRoZSA8VGV4dCBib2xkPntydWxlVmFsdWUudG9vbE5hbWV9PC9UZXh0PiB0b29sXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxJQUFJLFFBQVEsaUJBQWlCO0FBQ3RDLFNBQVNDLFFBQVEsUUFBUSxxQ0FBcUM7QUFDOUQsY0FBY0MsbUJBQW1CLFFBQVEsOENBQThDO0FBRXZGLEtBQUtDLGlCQUFpQixHQUFHO0VBQ3ZCQyxTQUFTLEVBQUVGLG1CQUFtQjtBQUNoQyxDQUFDO0FBRUQsT0FBTyxTQUFBRywwQkFBQUMsRUFBQTtFQUFBLE1BQUFD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