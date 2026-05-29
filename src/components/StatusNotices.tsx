// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 use，将 react 中已经封装好的能力接到本文件流程里。
import { use } from 'react';
// 引入 Box，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../ink.js';
// 类型依赖 { AgentDefinitionsResult } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准终端渲染的数据契约。
import type { AgentDefinitionsResult } from '../tools/AgentTool/loadAgentsDir.js';
// 复用 getMemoryFiles 工具函数，把通用处理留在 ../utils/claudemd.js 中维护。
import { getMemoryFiles } from '../utils/claudemd.js';
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js';
// 复用 getActiveNotices、StatusNoticeContext 工具函数，把通用处理留在 ../utils/statusNoticeDefinitions.js 中维护。
import { getActiveNotices, type StatusNoticeContext } from '../utils/statusNoticeDefinitions.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  agentDefinitions?: AgentDefinitionsResult;
};

/**
 * StatusNotices contains the information displayed to users at startup. We have
 * moved neutral or positive status to src/components/Status.tsx instead, which
 * users can access through /status.
 */
// StatusNotices 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function StatusNotices(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    agentDefinitions
  } = t0 === undefined ? {} : t0;
  // 临时值 t1读取`getGlobalConfig`，供终端渲染后续处理使用。
  const t1 = getGlobalConfig();
  // t2 暂存 `getMemoryFiles()` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `getMemoryFiles()` 生成的渲染片段，后续返回路径直接复用。
    t2 = getMemoryFiles();
    // $[0] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[0];
  }
  // context集中保存终端 UI Status Notices要一起传递的字段。
  const context = {
    config: t1,
    agentDefinitions,
    memoryFiles: use(t2)
  };
  // activeNotices 集合读取`getActiveNotices`，供终端渲染后续处理使用。
  const activeNotices = getActiveNotices(context);
  // activeNotices 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (activeNotices.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 临时值 T0保存`Box`，供终端 UI Status Notices后续判断或输出使用。
  const T0 = Box;
  // t3固定为 `"column"`，作为终端 UI Status Notices后续展示或比较的基准。
  const t3 = "column";
  // 临时值 t4 命名 `1`，让后续代码直接表达这个值的用途。
  const t4 = 1;
  // 临时值 t5派生`activeNotices.map`，供终端渲染后续处理使用。
  const t5 = activeNotices.map(notice => <React.Fragment key={notice.id}>{notice.render(context)}</React.Fragment>);
  // t6 暂存 `<T0 flexDirection={t3} paddingLeft={t4}>{t5}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== T0 || $[2] !== t5) {
    // t6 暂存 `<T0 flexDirection={t3} paddingLeft={t4}>{t5}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <T0 flexDirection={t3} paddingLeft={t4}>{t5}</T0>;
    // $[1] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = T0;
    // $[2] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t5;
    // $[3] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[3];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZSIsIkJveCIsIkFnZW50RGVmaW5pdGlvbnNSZXN1bHQiLCJnZXRNZW1vcnlGaWxlcyIsImdldEdsb2JhbENvbmZpZyIsImdldEFjdGl2ZU5vdGljZXMiLCJTdGF0dXNOb3RpY2VDb250ZXh0IiwiUHJvcHMiLCJhZ2VudERlZmluaXRpb25zIiwiU3RhdHVzTm90aWNlcyIsInQwIiwiJCIsIl9jIiwidW5kZWZpbmVkIiwidDEiLCJ0MiIsIlN5bWJvbCIsImZvciIsImNvbnRleHQiLCJjb25maWciLCJtZW1vcnlGaWxlcyIsImFjdGl2ZU5vdGljZXMiLCJsZW5ndGgiLCJUMCIsInQzIiwidDQiLCJ0NSIsIm1hcCIsIm5vdGljZSIsImlkIiwicmVuZGVyIiwidDYiXSwic291cmNlcyI6WyJTdGF0dXNOb3RpY2VzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBBZ2VudERlZmluaXRpb25zUmVzdWx0IH0gZnJvbSAnLi4vdG9vbHMvQWdlbnRUb29sL2xvYWRBZ2VudHNEaXIuanMnXG5pbXBvcnQgeyBnZXRNZW1vcnlGaWxlcyB9IGZyb20gJy4uL3V0aWxzL2NsYXVkZW1kLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHtcbiAgZ2V0QWN0aXZlTm90aWNlcyxcbiAgdHlwZSBTdGF0dXNOb3RpY2VDb250ZXh0LFxufSBmcm9tICcuLi91dGlscy9zdGF0dXNOb3RpY2VEZWZpbml0aW9ucy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgYWdlbnREZWZpbml0aW9ucz86IEFnZW50RGVmaW5pdGlvbnNSZXN1bHRcbn1cblxuLyoqXG4gKiBTdGF0dXNOb3RpY2VzIGNvbnRhaW5zIHRoZSBpbmZvcm1hdGlvbiBkaXNwbGF5ZWQgdG8gdXNlcnMgYXQgc3RhcnR1cC4gV2UgaGF2ZVxuICogbW92ZWQgbmV1dHJhbCBvciBwb3NpdGl2ZSBzdGF0dXMgdG8gc3JjL2NvbXBvbmVudHMvU3RhdHVzLnRzeCBpbnN0ZWFkLCB3aGljaFxuICogdXNlcnMgY2FuIGFjY2VzcyB0aHJvdWdoIC9zdGF0dXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBTdGF0dXNOb3RpY2VzKHtcbiAgYWdlbnREZWZpbml0aW9ucyxcbn06IFByb3BzID0ge30pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBjb250ZXh0OiBTdGF0dXNOb3RpY2VDb250ZXh0ID0ge1xuICAgIGNvbmZpZzogZ2V0R2xvYmFsQ29uZmlnKCksXG4gICAgYWdlbnREZWZpbml0aW9ucyxcbiAgICBtZW1vcnlGaWxlczogdXNlKGdldE1lbW9yeUZpbGVzKCkpLFxuICB9XG4gIGNvbnN0IGFjdGl2ZU5vdGljZXMgPSBnZXRBY3RpdmVOb3RpY2VzKGNvbnRleHQpXG4gIGlmIChhY3RpdmVOb3RpY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdMZWZ0PXsxfT5cbiAgICAgIHthY3RpdmVOb3RpY2VzLm1hcChub3RpY2UgPT4gKFxuICAgICAgICA8UmVhY3QuRnJhZ21lbnQga2V5PXtub3RpY2UuaWR9PlxuICAgICAgICAgIHtub3RpY2UucmVuZGVyKGNvbnRleHQpfVxuICAgICAgICA8L1JlYWN0LkZyYWdtZW50PlxuICAgICAgKSl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsR0FBRyxRQUFRLE9BQU87QUFDM0IsU0FBU0MsR0FBRyxRQUFRLFdBQVc7QUFDL0IsY0FBY0Msc0JBQXNCLFFBQVEscUNBQXFDO0FBQ2pGLFNBQVNDLGNBQWMsUUFBUSxzQkFBc0I7QUFDckQsU0FBU0MsZUFBZSxRQUFRLG9CQUFvQjtBQUNwRCxTQUNFQyxnQkFBZ0IsRUFDaEIsS0FBS0MsbUJBQW1CLFFBQ25CLHFDQUFxQztBQUU1QyxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsZ0JBQWdCLENBQUMsRUFBRU4sc0JBQXNCO0FBQzNDLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sU0FBQU8sY0FBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUF1QjtJQUFBSjtFQUFBLElBQUFFLEVBRWpCLEtBRmlCRyxTQUVqQixHQUZpQixDQUVsQixDQUFDLEdBRmlCSCxFQUVqQjtFQUVELE1BQUFJLEVBQUEsR0FBQVYsZUFBZSxDQUFDLENBQUM7RUFBQSxJQUFBVyxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBSyxNQUFBLENBQUFDLEdBQUE7SUFFUkYsRUFBQSxHQUFBWixjQUFjLENBQUMsQ0FBQztJQUFBUSxDQUFBLE1BQUFJLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQUhuQyxNQUFBTyxPQUFBLEdBQXFDO0lBQUFDLE1BQUEsRUFDM0JMLEVBQWlCO0lBQUFOLGdCQUFBO0lBQUFZLFdBQUEsRUFFWnBCLEdBQUcsQ0FBQ2UsRUFBZ0I7RUFDbkMsQ0FBQztFQUNELE1BQUFNLGFBQUEsR0FBc0JoQixnQkFBZ0IsQ0FBQ2EsT0FBTyxDQUFDO0VBQy9DLElBQUlHLGFBQWEsQ0FBQUMsTUFBTyxLQUFLLENBQUM7SUFBQSxPQUNyQixJQUFJO0VBQUE7RUFJVixNQUFBQyxFQUFBLEdBQUF0QixHQUFHO0VBQWUsTUFBQXVCLEVBQUEsV0FBUTtFQUFjLE1BQUFDLEVBQUEsSUFBQztFQUN2QyxNQUFBQyxFQUFBLEdBQUFMLGFBQWEsQ0FBQU0sR0FBSSxDQUFDQyxNQUFBLElBQ2pCLGdCQUFxQixHQUFTLENBQVQsQ0FBQUEsTUFBTSxDQUFBQyxFQUFFLENBQUMsQ0FDM0IsQ0FBQUQsTUFBTSxDQUFBRSxNQUFPLENBQUNaLE9BQU8sRUFDeEIsaUJBQ0QsQ0FBQztFQUFBLElBQUFhLEVBQUE7RUFBQSxJQUFBcEIsQ0FBQSxRQUFBWSxFQUFBLElBQUFaLENBQUEsUUFBQWUsRUFBQTtJQUxKSyxFQUFBLElBQUMsRUFBRyxDQUFlLGFBQVEsQ0FBUixDQUFBUCxFQUFPLENBQUMsQ0FBYyxXQUFDLENBQUQsQ0FBQUMsRUFBQSxDQUFDLENBQ3ZDLENBQUFDLEVBSUEsQ0FDSCxFQU5DLEVBQUcsQ0FNRTtJQUFBZixDQUFBLE1BQUFZLEVBQUE7SUFBQVosQ0FBQSxNQUFBZSxFQUFBO0lBQUFmLENBQUEsTUFBQW9CLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFwQixDQUFBO0VBQUE7RUFBQSxPQU5Ob0IsRUFNTTtBQUFBIiwiaWdub3JlTGlzdCI6W119