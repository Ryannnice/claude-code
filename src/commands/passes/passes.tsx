// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 Passes 终端界面组件，避免在这里重复拼装显示逻辑。
import { Passes } from '../../components/Passes/Passes.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 接入 getCachedRemainingPasses 服务层能力，把外部通信或共享状态交给 ../../services/api/referral.js 处理。
import { getCachedRemainingPasses } from '../../services/api/referral.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone): Promise<React.ReactNode> {
  // Mark that user has visited /passes so we stop showing the upsell
  // 配置读取`getGlobalConfig`，供命令处理后续处理使用。
  const config = getGlobalConfig();
  // isFirstVisit标记命令处理斜杠命令 passes是否启用对应路径。
  const isFirstVisit = !config.hasVisitedPasses;
  // 满足 `isFirstVisit` 时，命令处理执行该分支。
  if (isFirstVisit) {
    // remaining读取`getCachedRemainingPasses`，供命令处理后续处理使用。
    const remaining = getCachedRemainingPasses();
    // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      hasVisitedPasses: true,
      passesLastSeenRemaining: remaining ?? current.passesLastSeenRemaining
    }));
  }
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_guest_passes_visited', {
    is_first_visit: isFirstVisit
  });
  // 返回 `<Passes onDone={onDone} />`，作为命令处理这次计算的结果。
  return <Passes onDone={onDone} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlBhc3NlcyIsImxvZ0V2ZW50IiwiZ2V0Q2FjaGVkUmVtYWluaW5nUGFzc2VzIiwiTG9jYWxKU1hDb21tYW5kT25Eb25lIiwiZ2V0R2xvYmFsQ29uZmlnIiwic2F2ZUdsb2JhbENvbmZpZyIsImNhbGwiLCJvbkRvbmUiLCJQcm9taXNlIiwiUmVhY3ROb2RlIiwiY29uZmlnIiwiaXNGaXJzdFZpc2l0IiwiaGFzVmlzaXRlZFBhc3NlcyIsInJlbWFpbmluZyIsImN1cnJlbnQiLCJwYXNzZXNMYXN0U2VlblJlbWFpbmluZyIsImlzX2ZpcnN0X3Zpc2l0Il0sInNvdXJjZXMiOlsicGFzc2VzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFBhc3NlcyB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvUGFzc2VzL1Bhc3Nlcy5qcydcbmltcG9ydCB7IGxvZ0V2ZW50IH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHsgZ2V0Q2FjaGVkUmVtYWluaW5nUGFzc2VzIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYXBpL3JlZmVycmFsLmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbEpTWENvbW1hbmRPbkRvbmUgfSBmcm9tICcuLi8uLi90eXBlcy9jb21tYW5kLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnLCBzYXZlR2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uZmlnLmpzJ1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsbChcbiAgb25Eb25lOiBMb2NhbEpTWENvbW1hbmRPbkRvbmUsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZT4ge1xuICAvLyBNYXJrIHRoYXQgdXNlciBoYXMgdmlzaXRlZCAvcGFzc2VzIHNvIHdlIHN0b3Agc2hvd2luZyB0aGUgdXBzZWxsXG4gIGNvbnN0IGNvbmZpZyA9IGdldEdsb2JhbENvbmZpZygpXG4gIGNvbnN0IGlzRmlyc3RWaXNpdCA9ICFjb25maWcuaGFzVmlzaXRlZFBhc3Nlc1xuICBpZiAoaXNGaXJzdFZpc2l0KSB7XG4gICAgY29uc3QgcmVtYWluaW5nID0gZ2V0Q2FjaGVkUmVtYWluaW5nUGFzc2VzKClcbiAgICBzYXZlR2xvYmFsQ29uZmlnKGN1cnJlbnQgPT4gKHtcbiAgICAgIC4uLmN1cnJlbnQsXG4gICAgICBoYXNWaXNpdGVkUGFzc2VzOiB0cnVlLFxuICAgICAgcGFzc2VzTGFzdFNlZW5SZW1haW5pbmc6IHJlbWFpbmluZyA/PyBjdXJyZW50LnBhc3Nlc0xhc3RTZWVuUmVtYWluaW5nLFxuICAgIH0pKVxuICB9XG4gIGxvZ0V2ZW50KCd0ZW5ndV9ndWVzdF9wYXNzZXNfdmlzaXRlZCcsIHsgaXNfZmlyc3RfdmlzaXQ6IGlzRmlyc3RWaXNpdCB9KVxuICByZXR1cm4gPFBhc3NlcyBvbkRvbmU9e29uRG9uZX0gLz5cbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxNQUFNLFFBQVEsbUNBQW1DO0FBQzFELFNBQVNDLFFBQVEsUUFBUSxtQ0FBbUM7QUFDNUQsU0FBU0Msd0JBQXdCLFFBQVEsZ0NBQWdDO0FBQ3pFLGNBQWNDLHFCQUFxQixRQUFRLHdCQUF3QjtBQUNuRSxTQUFTQyxlQUFlLEVBQUVDLGdCQUFnQixRQUFRLHVCQUF1QjtBQUV6RSxPQUFPLGVBQWVDLElBQUlBLENBQ3hCQyxNQUFNLEVBQUVKLHFCQUFxQixDQUM5QixFQUFFSyxPQUFPLENBQUNULEtBQUssQ0FBQ1UsU0FBUyxDQUFDLENBQUM7RUFDMUI7RUFDQSxNQUFNQyxNQUFNLEdBQUdOLGVBQWUsQ0FBQyxDQUFDO0VBQ2hDLE1BQU1PLFlBQVksR0FBRyxDQUFDRCxNQUFNLENBQUNFLGdCQUFnQjtFQUM3QyxJQUFJRCxZQUFZLEVBQUU7SUFDaEIsTUFBTUUsU0FBUyxHQUFHWCx3QkFBd0IsQ0FBQyxDQUFDO0lBQzVDRyxnQkFBZ0IsQ0FBQ1MsT0FBTyxLQUFLO01BQzNCLEdBQUdBLE9BQU87TUFDVkYsZ0JBQWdCLEVBQUUsSUFBSTtNQUN0QkcsdUJBQXVCLEVBQUVGLFNBQVMsSUFBSUMsT0FBTyxDQUFDQztJQUNoRCxDQUFDLENBQUMsQ0FBQztFQUNMO0VBQ0FkLFFBQVEsQ0FBQyw0QkFBNEIsRUFBRTtJQUFFZSxjQUFjLEVBQUVMO0VBQWEsQ0FBQyxDQUFDO0VBQ3hFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUNKLE1BQU0sQ0FBQyxHQUFHO0FBQ25DIiwiaWdub3JlTGlzdCI6W119