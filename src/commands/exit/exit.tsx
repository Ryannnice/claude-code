// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { spawnSync } from 'child_process';
// 引入 sample，将 lodash-es/sample.js 中已经封装好的能力接到本文件流程里。
import sample from 'lodash-es/sample.js';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 ExitFlow 终端界面组件，避免在这里重复拼装显示逻辑。
import { ExitFlow } from '../../components/ExitFlow.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 复用 isBgSession 工具函数，把通用处理留在 ../../utils/concurrentSessions.js 中维护。
import { isBgSession } from '../../utils/concurrentSessions.js';
// 复用 gracefulShutdown 工具函数，把通用处理留在 ../../utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from '../../utils/gracefulShutdown.js';
// 复用 getCurrentWorktreeSession 工具函数，把通用处理留在 ../../utils/worktree.js 中维护。
import { getCurrentWorktreeSession } from '../../utils/worktree.js';
// GOODBYE_MESSAGES 消息数据 聚合成有序列表，保持后续遍历顺序稳定。
const GOODBYE_MESSAGES = ['Goodbye!', 'See ya!', 'Bye!', 'Catch you later!'];
// getRandomGoodbyeMessage 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRandomGoodbyeMessage(): string {
  // 返回 `sample(GOODBYE_MESSAGES) ?? 'Goodbye!'`，作为命令处理这次计算的结果。
  return sample(GOODBYE_MESSAGES) ?? 'Goodbye!';
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone): Promise<React.ReactNode> {
  // Inside a `claude --bg` tmux session: detach instead of kill. The REPL
  // keeps running; `claude attach` can reconnect. Covers /exit, /quit,
  // ctrl+c, ctrl+d — all funnel through here via REPL's handleExit.
  // 只有 `feature('BG_SESSIONS') && isBgSession()` 满足时，命令处理才执行该分支。
  if (feature('BG_SESSIONS') && isBgSession()) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone();
    // 调用 spawnSync，触发命令处理此处需要的副作用。
    spawnSync('tmux', ['detach-client'], {
      stdio: 'ignore'
    });
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // showWorktree读取`getCurrentWorktreeSession`，供命令处理后续处理使用。
  const showWorktree = getCurrentWorktreeSession() !== null;
  // 满足 `showWorktree` 时，命令处理执行该分支。
  if (showWorktree) {
    // 返回 `<ExitFlow showWorktree={showWorktree} onDone={onDone} onCancel={() => o...`，作为命令处理这次计算的结果。
    return <ExitFlow showWorktree={showWorktree} onDone={onDone} onCancel={() => onDone()} />;
  }
  // 调用 onDone，触发命令处理此处需要的副作用。
  onDone(getRandomGoodbyeMessage());
  // 等待 `gracefulShutdown(0, 'prompt_input_exit')` 完成，再继续斜杠命令 exit的异步流程。
  await gracefulShutdown(0, 'prompt_input_exit');
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwic3Bhd25TeW5jIiwic2FtcGxlIiwiUmVhY3QiLCJFeGl0RmxvdyIsIkxvY2FsSlNYQ29tbWFuZE9uRG9uZSIsImlzQmdTZXNzaW9uIiwiZ3JhY2VmdWxTaHV0ZG93biIsImdldEN1cnJlbnRXb3JrdHJlZVNlc3Npb24iLCJHT09EQllFX01FU1NBR0VTIiwiZ2V0UmFuZG9tR29vZGJ5ZU1lc3NhZ2UiLCJjYWxsIiwib25Eb25lIiwiUHJvbWlzZSIsIlJlYWN0Tm9kZSIsInN0ZGlvIiwic2hvd1dvcmt0cmVlIl0sInNvdXJjZXMiOlsiZXhpdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZmVhdHVyZSB9IGZyb20gJ2J1bjpidW5kbGUnXG5pbXBvcnQgeyBzcGF3blN5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJ1xuaW1wb3J0IHNhbXBsZSBmcm9tICdsb2Rhc2gtZXMvc2FtcGxlLmpzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBFeGl0RmxvdyB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvRXhpdEZsb3cuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZE9uRG9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5pbXBvcnQgeyBpc0JnU2Vzc2lvbiB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbmN1cnJlbnRTZXNzaW9ucy5qcydcbmltcG9ydCB7IGdyYWNlZnVsU2h1dGRvd24gfSBmcm9tICcuLi8uLi91dGlscy9ncmFjZWZ1bFNodXRkb3duLmpzJ1xuaW1wb3J0IHsgZ2V0Q3VycmVudFdvcmt0cmVlU2Vzc2lvbiB9IGZyb20gJy4uLy4uL3V0aWxzL3dvcmt0cmVlLmpzJ1xuXG5jb25zdCBHT09EQllFX01FU1NBR0VTID0gWydHb29kYnllIScsICdTZWUgeWEhJywgJ0J5ZSEnLCAnQ2F0Y2ggeW91IGxhdGVyISddXG5cbmZ1bmN0aW9uIGdldFJhbmRvbUdvb2RieWVNZXNzYWdlKCk6IHN0cmluZyB7XG4gIHJldHVybiBzYW1wbGUoR09PREJZRV9NRVNTQUdFUykgPz8gJ0dvb2RieWUhJ1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsbChcbiAgb25Eb25lOiBMb2NhbEpTWENvbW1hbmRPbkRvbmUsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZT4ge1xuICAvLyBJbnNpZGUgYSBgY2xhdWRlIC0tYmdgIHRtdXggc2Vzc2lvbjogZGV0YWNoIGluc3RlYWQgb2Yga2lsbC4gVGhlIFJFUExcbiAgLy8ga2VlcHMgcnVubmluZzsgYGNsYXVkZSBhdHRhY2hgIGNhbiByZWNvbm5lY3QuIENvdmVycyAvZXhpdCwgL3F1aXQsXG4gIC8vIGN0cmwrYywgY3RybCtkIOKAlCBhbGwgZnVubmVsIHRocm91Z2ggaGVyZSB2aWEgUkVQTCdzIGhhbmRsZUV4aXQuXG4gIGlmIChmZWF0dXJlKCdCR19TRVNTSU9OUycpICYmIGlzQmdTZXNzaW9uKCkpIHtcbiAgICBvbkRvbmUoKVxuICAgIHNwYXduU3luYygndG11eCcsIFsnZGV0YWNoLWNsaWVudCddLCB7IHN0ZGlvOiAnaWdub3JlJyB9KVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCBzaG93V29ya3RyZWUgPSBnZXRDdXJyZW50V29ya3RyZWVTZXNzaW9uKCkgIT09IG51bGxcblxuICBpZiAoc2hvd1dvcmt0cmVlKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxFeGl0Rmxvd1xuICAgICAgICBzaG93V29ya3RyZWU9e3Nob3dXb3JrdHJlZX1cbiAgICAgICAgb25Eb25lPXtvbkRvbmV9XG4gICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBvbkRvbmUoKX1cbiAgICAgIC8+XG4gICAgKVxuICB9XG5cbiAgb25Eb25lKGdldFJhbmRvbUdvb2RieWVNZXNzYWdlKCkpXG4gIGF3YWl0IGdyYWNlZnVsU2h1dGRvd24oMCwgJ3Byb21wdF9pbnB1dF9leGl0JylcbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBU0EsT0FBTyxRQUFRLFlBQVk7QUFDcEMsU0FBU0MsU0FBUyxRQUFRLGVBQWU7QUFDekMsT0FBT0MsTUFBTSxNQUFNLHFCQUFxQjtBQUN4QyxPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFFBQVEsUUFBUSw4QkFBOEI7QUFDdkQsY0FBY0MscUJBQXFCLFFBQVEsd0JBQXdCO0FBQ25FLFNBQVNDLFdBQVcsUUFBUSxtQ0FBbUM7QUFDL0QsU0FBU0MsZ0JBQWdCLFFBQVEsaUNBQWlDO0FBQ2xFLFNBQVNDLHlCQUF5QixRQUFRLHlCQUF5QjtBQUVuRSxNQUFNQyxnQkFBZ0IsR0FBRyxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixDQUFDO0FBRTVFLFNBQVNDLHVCQUF1QkEsQ0FBQSxDQUFFLEVBQUUsTUFBTSxDQUFDO0VBQ3pDLE9BQU9SLE1BQU0sQ0FBQ08sZ0JBQWdCLENBQUMsSUFBSSxVQUFVO0FBQy9DO0FBRUEsT0FBTyxlQUFlRSxJQUFJQSxDQUN4QkMsTUFBTSxFQUFFUCxxQkFBcUIsQ0FDOUIsRUFBRVEsT0FBTyxDQUFDVixLQUFLLENBQUNXLFNBQVMsQ0FBQyxDQUFDO0VBQzFCO0VBQ0E7RUFDQTtFQUNBLElBQUlkLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSU0sV0FBVyxDQUFDLENBQUMsRUFBRTtJQUMzQ00sTUFBTSxDQUFDLENBQUM7SUFDUlgsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLGVBQWUsQ0FBQyxFQUFFO01BQUVjLEtBQUssRUFBRTtJQUFTLENBQUMsQ0FBQztJQUN6RCxPQUFPLElBQUk7RUFDYjtFQUVBLE1BQU1DLFlBQVksR0FBR1IseUJBQXlCLENBQUMsQ0FBQyxLQUFLLElBQUk7RUFFekQsSUFBSVEsWUFBWSxFQUFFO0lBQ2hCLE9BQ0UsQ0FBQyxRQUFRLENBQ1AsWUFBWSxDQUFDLENBQUNBLFlBQVksQ0FBQyxDQUMzQixNQUFNLENBQUMsQ0FBQ0osTUFBTSxDQUFDLENBQ2YsUUFBUSxDQUFDLENBQUMsTUFBTUEsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUN6QjtFQUVOO0VBRUFBLE1BQU0sQ0FBQ0YsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO0VBQ2pDLE1BQU1ILGdCQUFnQixDQUFDLENBQUMsRUFBRSxtQkFBbUIsQ0FBQztFQUM5QyxPQUFPLElBQUk7QUFDYiIsImlnbm9yZUxpc3QiOltdfQ==