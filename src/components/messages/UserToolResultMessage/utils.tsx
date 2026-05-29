// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ToolUseBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { ToolUseBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react';
// 引入 findToolByName、Tool、Tools，将 ../../../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName, type Tool, type Tools } from '../../../Tool.js';
// 类型依赖 { buildMessageLookups } 来自 ../../../utils/messages.js，用于校准终端渲染的数据契约。
import type { buildMessageLookups } from '../../../utils/messages.js';
// useGetToolFromMessages 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useGetToolFromMessages(toolUseID, tools, lookups) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // t0 暂存 `null` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== lookups.toolUseByToolUseID || $[1] !== toolUseID || $[2] !== tools) {
    // 终端 UI 组件 utils在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // toolUse读取`toolUseByToolUseID.get`，供终端渲染后续处理使用。
      const toolUse = lookups.toolUseByToolUseID.get(toolUseID);
      // toolUse缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!toolUse) {
        // t0 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t0 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 工具筛选`findToolByName`，供终端渲染后续处理使用。
      const tool = findToolByName(tools, toolUse.name);
      // 工具缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!tool) {
        // t0 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t0 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[4] !== tool || $[5] !== toolUse) {
        // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t1 = {
          tool,
          toolUse
        };
        // $[4] 缓存 `tool`，下次依赖未变时 React 编译产物可直接复用。
        $[4] = tool;
        // $[5] 缓存 `toolUse`，下次依赖未变时 React 编译产物可直接复用。
        $[5] = toolUse;
        // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[6] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[6];
      }
      // t0 暂存 `t1` 生成的渲染片段，后续返回路径直接复用。
      t0 = t1;
    }
    // $[0] 缓存 `lookups.toolUseByToolUseID`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = lookups.toolUseByToolUseID;
    // $[1] 缓存 `toolUseID`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = toolUseID;
    // $[2] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = tools;
    // $[3] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[3];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sVXNlQmxvY2tQYXJhbSIsInVzZU1lbW8iLCJmaW5kVG9vbEJ5TmFtZSIsIlRvb2wiLCJUb29scyIsImJ1aWxkTWVzc2FnZUxvb2t1cHMiLCJ1c2VHZXRUb29sRnJvbU1lc3NhZ2VzIiwidG9vbFVzZUlEIiwidG9vbHMiLCJsb29rdXBzIiwiJCIsIl9jIiwidDAiLCJ0b29sVXNlQnlUb29sVXNlSUQiLCJiYjAiLCJ0b29sVXNlIiwiZ2V0IiwidG9vbCIsIm5hbWUiLCJ0MSJdLCJzb3VyY2VzIjpbInV0aWxzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRvb2xVc2VCbG9ja1BhcmFtIH0gZnJvbSAnQGFudGhyb3BpYy1haS9zZGsvcmVzb3VyY2VzL2luZGV4Lm1qcydcbmltcG9ydCB7IHVzZU1lbW8gfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGZpbmRUb29sQnlOYW1lLCB0eXBlIFRvb2wsIHR5cGUgVG9vbHMgfSBmcm9tICcuLi8uLi8uLi9Ub29sLmpzJ1xuaW1wb3J0IHR5cGUgeyBidWlsZE1lc3NhZ2VMb29rdXBzIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VHZXRUb29sRnJvbU1lc3NhZ2VzKFxuICB0b29sVXNlSUQ6IHN0cmluZyxcbiAgdG9vbHM6IFRvb2xzLFxuICBsb29rdXBzOiBSZXR1cm5UeXBlPHR5cGVvZiBidWlsZE1lc3NhZ2VMb29rdXBzPixcbik6IHsgdG9vbDogVG9vbDsgdG9vbFVzZTogVG9vbFVzZUJsb2NrUGFyYW0gfSB8IG51bGwge1xuICByZXR1cm4gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgdG9vbFVzZSA9IGxvb2t1cHMudG9vbFVzZUJ5VG9vbFVzZUlELmdldCh0b29sVXNlSUQpXG4gICAgaWYgKCF0b29sVXNlKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICBjb25zdCB0b29sID0gZmluZFRvb2xCeU5hbWUodG9vbHMsIHRvb2xVc2UubmFtZSlcbiAgICBpZiAoIXRvb2wpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICAgIHJldHVybiB7IHRvb2wsIHRvb2xVc2UgfVxuICB9LCBbdG9vbFVzZUlELCBsb29rdXBzLCB0b29sc10pXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUFjQSxpQkFBaUIsUUFBUSx1Q0FBdUM7QUFDOUUsU0FBU0MsT0FBTyxRQUFRLE9BQU87QUFDL0IsU0FBU0MsY0FBYyxFQUFFLEtBQUtDLElBQUksRUFBRSxLQUFLQyxLQUFLLFFBQVEsa0JBQWtCO0FBQ3hFLGNBQWNDLG1CQUFtQixRQUFRLDRCQUE0QjtBQUVyRSxPQUFPLFNBQUFDLHVCQUFBQyxTQUFBLEVBQUFDLEtBQUEsRUFBQUMsT0FBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFELE9BQUEsQ0FBQUksa0JBQUEsSUFBQUgsQ0FBQSxRQUFBSCxTQUFBLElBQUFHLENBQUEsUUFBQUYsS0FBQTtJQUFBTSxHQUFBO01BTUgsTUFBQUMsT0FBQSxHQUFnQk4sT0FBTyxDQUFBSSxrQkFBbUIsQ0FBQUcsR0FBSSxDQUFDVCxTQUFTLENBQUM7TUFDekQsSUFBSSxDQUFDUSxPQUFPO1FBQ1ZILEVBQUEsR0FBTyxJQUFJO1FBQVgsTUFBQUUsR0FBQTtNQUFXO01BRWIsTUFBQUcsSUFBQSxHQUFhZixjQUFjLENBQUNNLEtBQUssRUFBRU8sT0FBTyxDQUFBRyxJQUFLLENBQUM7TUFDaEQsSUFBSSxDQUFDRCxJQUFJO1FBQ1BMLEVBQUEsR0FBTyxJQUFJO1FBQVgsTUFBQUUsR0FBQTtNQUFXO01BQ1osSUFBQUssRUFBQTtNQUFBLElBQUFULENBQUEsUUFBQU8sSUFBQSxJQUFBUCxDQUFBLFFBQUFLLE9BQUE7UUFDTUksRUFBQTtVQUFBRixJQUFBO1VBQUFGO1FBQWdCLENBQUM7UUFBQUwsQ0FBQSxNQUFBTyxJQUFBO1FBQUFQLENBQUEsTUFBQUssT0FBQTtRQUFBTCxDQUFBLE1BQUFTLEVBQUE7TUFBQTtRQUFBQSxFQUFBLEdBQUFULENBQUE7TUFBQTtNQUF4QkUsRUFBQSxHQUFPTyxFQUFpQjtJQUFBO0lBQUFULENBQUEsTUFBQUQsT0FBQSxDQUFBSSxrQkFBQTtJQUFBSCxDQUFBLE1BQUFILFNBQUE7SUFBQUcsQ0FBQSxNQUFBRixLQUFBO0lBQUFFLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQUEsT0FUbkJFLEVBVXdCO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=