// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 类型依赖 { StatsStore } 来自 ./context/stats.js，用于校准repl Launcher的数据契约。
import type { StatsStore } from './context/stats.js';
// 类型依赖 { Root } 来自 ./ink.js，用于校准repl Launcher的数据契约。
import type { Root } from './ink.js';
// 类型依赖 { Props as REPLProps } 来自 ./screens/REPL.js，用于校准repl Launcher的数据契约。
import type { Props as REPLProps } from './screens/REPL.js';
// 类型依赖 { AppState } 来自 ./state/AppStateStore.js，用于校准repl Launcher的数据契约。
import type { AppState } from './state/AppStateStore.js';
// 类型依赖 { FpsMetrics } 来自 ./utils/fpsTracker.js，用于校准repl Launcher的数据契约。
import type { FpsMetrics } from './utils/fpsTracker.js';
// AppWrapperProps 固化repl Launcher里传递的数据形状，帮助调用方按同一结构读写字段。
type AppWrapperProps = {
  // 这个回调绑定到 getFpsMetrics: () => FpsMetrics | undefined;，负责repl Launcher在该局部场景下的响应。
  getFpsMetrics: () => FpsMetrics | undefined;
  stats?: StatsStore;
  initialState: AppState;
};
// launchRepl 封装replLauncher的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function launchRepl(root: Root, appProps: AppWrapperProps, replProps: REPLProps, renderAndRun: (root: Root, element: React.ReactNode) => Promise<void>): Promise<void> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    App
  } = await import('./components/App.js');
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    REPL
  } = await import('./screens/REPL.js');
  // 等待 `renderAndRun(root, <App {...appProps}>` 完成，再继续repl Launcher的异步流程。
  await renderAndRun(root, <App {...appProps}>
      <REPL {...replProps} />
    </App>);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlN0YXRzU3RvcmUiLCJSb290IiwiUHJvcHMiLCJSRVBMUHJvcHMiLCJBcHBTdGF0ZSIsIkZwc01ldHJpY3MiLCJBcHBXcmFwcGVyUHJvcHMiLCJnZXRGcHNNZXRyaWNzIiwic3RhdHMiLCJpbml0aWFsU3RhdGUiLCJsYXVuY2hSZXBsIiwicm9vdCIsImFwcFByb3BzIiwicmVwbFByb3BzIiwicmVuZGVyQW5kUnVuIiwiZWxlbWVudCIsIlJlYWN0Tm9kZSIsIlByb21pc2UiLCJBcHAiLCJSRVBMIl0sInNvdXJjZXMiOlsicmVwbExhdW5jaGVyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IFN0YXRzU3RvcmUgfSBmcm9tICcuL2NvbnRleHQvc3RhdHMuanMnXG5pbXBvcnQgdHlwZSB7IFJvb3QgfSBmcm9tICcuL2luay5qcydcbmltcG9ydCB0eXBlIHsgUHJvcHMgYXMgUkVQTFByb3BzIH0gZnJvbSAnLi9zY3JlZW5zL1JFUEwuanMnXG5pbXBvcnQgdHlwZSB7IEFwcFN0YXRlIH0gZnJvbSAnLi9zdGF0ZS9BcHBTdGF0ZVN0b3JlLmpzJ1xuaW1wb3J0IHR5cGUgeyBGcHNNZXRyaWNzIH0gZnJvbSAnLi91dGlscy9mcHNUcmFja2VyLmpzJ1xuXG50eXBlIEFwcFdyYXBwZXJQcm9wcyA9IHtcbiAgZ2V0RnBzTWV0cmljczogKCkgPT4gRnBzTWV0cmljcyB8IHVuZGVmaW5lZFxuICBzdGF0cz86IFN0YXRzU3RvcmVcbiAgaW5pdGlhbFN0YXRlOiBBcHBTdGF0ZVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGF1bmNoUmVwbChcbiAgcm9vdDogUm9vdCxcbiAgYXBwUHJvcHM6IEFwcFdyYXBwZXJQcm9wcyxcbiAgcmVwbFByb3BzOiBSRVBMUHJvcHMsXG4gIHJlbmRlckFuZFJ1bjogKHJvb3Q6IFJvb3QsIGVsZW1lbnQ6IFJlYWN0LlJlYWN0Tm9kZSkgPT4gUHJvbWlzZTx2b2lkPixcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB7IEFwcCB9ID0gYXdhaXQgaW1wb3J0KCcuL2NvbXBvbmVudHMvQXBwLmpzJylcbiAgY29uc3QgeyBSRVBMIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2NyZWVucy9SRVBMLmpzJylcbiAgYXdhaXQgcmVuZGVyQW5kUnVuKFxuICAgIHJvb3QsXG4gICAgPEFwcCB7Li4uYXBwUHJvcHN9PlxuICAgICAgPFJFUEwgey4uLnJlcGxQcm9wc30gLz5cbiAgICA8L0FwcD4sXG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsY0FBY0MsVUFBVSxRQUFRLG9CQUFvQjtBQUNwRCxjQUFjQyxJQUFJLFFBQVEsVUFBVTtBQUNwQyxjQUFjQyxLQUFLLElBQUlDLFNBQVMsUUFBUSxtQkFBbUI7QUFDM0QsY0FBY0MsUUFBUSxRQUFRLDBCQUEwQjtBQUN4RCxjQUFjQyxVQUFVLFFBQVEsdUJBQXVCO0FBRXZELEtBQUtDLGVBQWUsR0FBRztFQUNyQkMsYUFBYSxFQUFFLEdBQUcsR0FBR0YsVUFBVSxHQUFHLFNBQVM7RUFDM0NHLEtBQUssQ0FBQyxFQUFFUixVQUFVO0VBQ2xCUyxZQUFZLEVBQUVMLFFBQVE7QUFDeEIsQ0FBQztBQUVELE9BQU8sZUFBZU0sVUFBVUEsQ0FDOUJDLElBQUksRUFBRVYsSUFBSSxFQUNWVyxRQUFRLEVBQUVOLGVBQWUsRUFDekJPLFNBQVMsRUFBRVYsU0FBUyxFQUNwQlcsWUFBWSxFQUFFLENBQUNILElBQUksRUFBRVYsSUFBSSxFQUFFYyxPQUFPLEVBQUVoQixLQUFLLENBQUNpQixTQUFTLEVBQUUsR0FBR0MsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUN0RSxFQUFFQSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDZixNQUFNO0lBQUVDO0VBQUksQ0FBQyxHQUFHLE1BQU0sTUFBTSxDQUFDLHFCQUFxQixDQUFDO0VBQ25ELE1BQU07SUFBRUM7RUFBSyxDQUFDLEdBQUcsTUFBTSxNQUFNLENBQUMsbUJBQW1CLENBQUM7RUFDbEQsTUFBTUwsWUFBWSxDQUNoQkgsSUFBSSxFQUNKLENBQUMsR0FBRyxDQUFDLElBQUlDLFFBQVEsQ0FBQztBQUN0QixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUlDLFNBQVMsQ0FBQztBQUMxQixJQUFJLEVBQUUsR0FBRyxDQUNQLENBQUM7QUFDSCIsImlnbm9yZUxpc3QiOltdfQ==