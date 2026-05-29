// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * Miscellaneous subcommand handlers — extracted from main.tsx for lazy loading.
 * setup-token, doctor, install
 */
/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handlers intentionally exit */

// 引入 cwd，将 process 中已经封装好的能力接到本文件流程里。
import { cwd } from 'process';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 WelcomeV2 终端界面组件，避免在这里重复拼装显示逻辑。
import { WelcomeV2 } from '../../components/LogoV2/WelcomeV2.js';
// 引入 useManagePlugins，将 ../../hooks/useManagePlugins.js 中已经封装好的能力接到本文件流程里。
import { useManagePlugins } from '../../hooks/useManagePlugins.js';
// 类型依赖 { Root } 来自 ../../ink.js，用于校准util的数据契约。
import type { Root } from '../../ink.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 KeybindingSetup，将 ../../keybindings/KeybindingProviderSetup.js 中已经封装好的能力接到本文件流程里。
import { KeybindingSetup } from '../../keybindings/KeybindingProviderSetup.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 接入 MCPConnectionManager 服务层能力，把外部通信或共享状态交给 ../../services/mcp/MCPConnectionManager.js 处理。
import { MCPConnectionManager } from '../../services/mcp/MCPConnectionManager.js';
// 引入 AppStateProvider，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { AppStateProvider } from '../../state/AppState.js';
// 引入 onChangeAppState，将 ../../state/onChangeAppState.js 中已经封装好的能力接到本文件流程里。
import { onChangeAppState } from '../../state/onChangeAppState.js';
// 复用 isAnthropicAuthEnabled 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isAnthropicAuthEnabled } from '../../utils/auth.js';
// setupTokenHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function setupTokenHandler(root: Root): Promise<void> {
  // 记录util运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_setup_token_command', {});
  // showAuthWarning 警告信息保存`isAnthropicAuthEnabled`，供util后续处理使用。
  const showAuthWarning = !isAnthropicAuthEnabled();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    ConsoleOAuthFlow
  } = await import('../../components/ConsoleOAuthFlow.js');
  // 这个回调绑定到 await new Promise<void>(resolve => {，负责util在该局部场景下的响应。
  await new Promise<void>(resolve => {
    // 调用 root.render，触发util此处需要的副作用。
    root.render(<AppStateProvider onChangeAppState={onChangeAppState}>
        <KeybindingSetup>
          <Box flexDirection="column" gap={1}>
            <WelcomeV2 />
            {showAuthWarning && <Box flexDirection="column">
                <Text color="warning">
                  Warning: You already have authentication configured via
                  environment variable or API key helper.
                </Text>
                <Text color="warning">
                  The setup-token command will create a new OAuth token which
                  you can use instead.
                </Text>
              </Box>}
            {/* 这个回调绑定到 <ConsoleOAuthFlow onDone={() => {，负责util在该局部场景下的响应。 */}
            <ConsoleOAuthFlow onDone={() => {
            // 显式忽略 `resolve()` 的返回值，只保留它触发的副作用。
            void resolve();
          }} mode="setup-token" startingMessage="This will guide you through long-lived (1-year) auth token setup for your Claude account. Claude subscription required." />
          </Box>
        </KeybindingSetup>
      </AppStateProvider>);
  });
  // 调用 root.unmount，触发util此处需要的副作用。
  root.unmount();
  // 调用 process.exit，触发util此处需要的副作用。
  process.exit(0);
}

// DoctorWithPlugins wrapper + doctor handler
// DoctorLazy保存`React.lazy`，供util后续处理使用。
const DoctorLazy = React.lazy(() => import('../../screens/Doctor.js').then(m => ({
  default: m.Doctor
})));
// DoctorWithPlugins 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function DoctorWithPlugins(t0) {
  // $保存`_c`，供util后续处理使用。
  const $ = _c(2);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // 调用 useManagePlugins，触发util此处需要的副作用。
  useManagePlugins();
  // t1 暂存 `<React.Suspense fallback={null}><DoctorLazy onDone={onDon...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone) {
    // t1 暂存 `<React.Suspense fallback={null}><DoctorLazy onDone={onDon...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <React.Suspense fallback={null}><DoctorLazy onDone={onDone} /></React.Suspense>;
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 返回 `t1`，作为util这次计算的结果。
  return t1;
}
// doctorHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function doctorHandler(root: Root): Promise<void> {
  // 记录util运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_doctor_command', {});
  // 这个回调绑定到 await new Promise<void>(resolve => {，负责util在该局部场景下的响应。
  await new Promise<void>(resolve => {
    // 调用 root.render，触发util此处需要的副作用。
    root.render(<AppStateProvider>
        <KeybindingSetup>
          <MCPConnectionManager dynamicMcpConfig={undefined} isStrictMcpConfig={false}>
            {/* 这个回调绑定到 <DoctorWithPlugins onDone={() => {，负责util在该局部场景下的响应。 */}
            <DoctorWithPlugins onDone={() => {
            // 显式忽略 `resolve()` 的返回值，只保留它触发的副作用。
            void resolve();
          }} />
          </MCPConnectionManager>
        </KeybindingSetup>
      </AppStateProvider>);
  });
  // 调用 root.unmount，触发util此处需要的副作用。
  root.unmount();
  // 调用 process.exit，触发util此处需要的副作用。
  process.exit(0);
}

// install handler
// installHandler 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installHandler(target: string | undefined, options: {
  force?: boolean;
}): Promise<void> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    setup
  } = await import('../../setup.js');
  // 等待 `setup(cwd(), 'default', false, false, undefined, false)` 完成，再继续util的异步流程。
  await setup(cwd(), 'default', false, false, undefined, false);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    install
  } = await import('../../commands/install.js');
  // 这个回调绑定到 await new Promise<void>(resolve => {，负责util在该局部场景下的响应。
  await new Promise<void>(resolve => {
    // 参数列表 从空数组开始收集，后续循环会按处理顺序追加条目。
    const args: string[] = [];
    // 满足 `target) args.push(target` 时，util执行该分支。
    if (target) args.push(target);
    // 满足 `options.force) args.push('--force'` 时，util执行该分支。
    if (options.force) args.push('--force');
    // 这个回调绑定到 void install.call(result => {，负责util在该局部场景下的响应。
    void install.call(result => {
      // 显式忽略 `resolve()` 的返回值，只保留它触发的副作用。
      void resolve();
      // 调用 process.exit，触发util此处需要的副作用。
      process.exit(result.includes('failed') ? 1 : 0);
    }, {}, args);
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjd2QiLCJSZWFjdCIsIldlbGNvbWVWMiIsInVzZU1hbmFnZVBsdWdpbnMiLCJSb290IiwiQm94IiwiVGV4dCIsIktleWJpbmRpbmdTZXR1cCIsImxvZ0V2ZW50IiwiTUNQQ29ubmVjdGlvbk1hbmFnZXIiLCJBcHBTdGF0ZVByb3ZpZGVyIiwib25DaGFuZ2VBcHBTdGF0ZSIsImlzQW50aHJvcGljQXV0aEVuYWJsZWQiLCJzZXR1cFRva2VuSGFuZGxlciIsInJvb3QiLCJQcm9taXNlIiwic2hvd0F1dGhXYXJuaW5nIiwiQ29uc29sZU9BdXRoRmxvdyIsInJlc29sdmUiLCJyZW5kZXIiLCJ1bm1vdW50IiwicHJvY2VzcyIsImV4aXQiLCJEb2N0b3JMYXp5IiwibGF6eSIsInRoZW4iLCJtIiwiZGVmYXVsdCIsIkRvY3RvciIsIkRvY3RvcldpdGhQbHVnaW5zIiwidDAiLCIkIiwiX2MiLCJvbkRvbmUiLCJ0MSIsImRvY3RvckhhbmRsZXIiLCJ1bmRlZmluZWQiLCJpbnN0YWxsSGFuZGxlciIsInRhcmdldCIsIm9wdGlvbnMiLCJmb3JjZSIsInNldHVwIiwiaW5zdGFsbCIsImFyZ3MiLCJwdXNoIiwiY2FsbCIsInJlc3VsdCIsImluY2x1ZGVzIl0sInNvdXJjZXMiOlsidXRpbC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNaXNjZWxsYW5lb3VzIHN1YmNvbW1hbmQgaGFuZGxlcnMg4oCUIGV4dHJhY3RlZCBmcm9tIG1haW4udHN4IGZvciBsYXp5IGxvYWRpbmcuXG4gKiBzZXR1cC10b2tlbiwgZG9jdG9yLCBpbnN0YWxsXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIGN1c3RvbS1ydWxlcy9uby1wcm9jZXNzLWV4aXQgLS0gQ0xJIHN1YmNvbW1hbmQgaGFuZGxlcnMgaW50ZW50aW9uYWxseSBleGl0ICovXG5cbmltcG9ydCB7IGN3ZCB9IGZyb20gJ3Byb2Nlc3MnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBXZWxjb21lVjIgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0xvZ29WMi9XZWxjb21lVjIuanMnXG5pbXBvcnQgeyB1c2VNYW5hZ2VQbHVnaW5zIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlTWFuYWdlUGx1Z2lucy5qcydcbmltcG9ydCB0eXBlIHsgUm9vdCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IEtleWJpbmRpbmdTZXR1cCB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL0tleWJpbmRpbmdQcm92aWRlclNldHVwLmpzJ1xuaW1wb3J0IHsgbG9nRXZlbnQgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQgeyBNQ1BDb25uZWN0aW9uTWFuYWdlciB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL21jcC9NQ1BDb25uZWN0aW9uTWFuYWdlci5qcydcbmltcG9ydCB7IEFwcFN0YXRlUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IG9uQ2hhbmdlQXBwU3RhdGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9vbkNoYW5nZUFwcFN0YXRlLmpzJ1xuaW1wb3J0IHsgaXNBbnRocm9waWNBdXRoRW5hYmxlZCB9IGZyb20gJy4uLy4uL3V0aWxzL2F1dGguanMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cFRva2VuSGFuZGxlcihyb290OiBSb290KTogUHJvbWlzZTx2b2lkPiB7XG4gIGxvZ0V2ZW50KCd0ZW5ndV9zZXR1cF90b2tlbl9jb21tYW5kJywge30pXG5cbiAgY29uc3Qgc2hvd0F1dGhXYXJuaW5nID0gIWlzQW50aHJvcGljQXV0aEVuYWJsZWQoKVxuICBjb25zdCB7IENvbnNvbGVPQXV0aEZsb3cgfSA9IGF3YWl0IGltcG9ydChcbiAgICAnLi4vLi4vY29tcG9uZW50cy9Db25zb2xlT0F1dGhGbG93LmpzJ1xuICApXG4gIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xuICAgIHJvb3QucmVuZGVyKFxuICAgICAgPEFwcFN0YXRlUHJvdmlkZXIgb25DaGFuZ2VBcHBTdGF0ZT17b25DaGFuZ2VBcHBTdGF0ZX0+XG4gICAgICAgIDxLZXliaW5kaW5nU2V0dXA+XG4gICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgICAgIDxXZWxjb21lVjIgLz5cbiAgICAgICAgICAgIHtzaG93QXV0aFdhcm5pbmcgJiYgKFxuICAgICAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICAgICAgICAgIFdhcm5pbmc6IFlvdSBhbHJlYWR5IGhhdmUgYXV0aGVudGljYXRpb24gY29uZmlndXJlZCB2aWFcbiAgICAgICAgICAgICAgICAgIGVudmlyb25tZW50IHZhcmlhYmxlIG9yIEFQSSBrZXkgaGVscGVyLlxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICAgICAgICAgIFRoZSBzZXR1cC10b2tlbiBjb21tYW5kIHdpbGwgY3JlYXRlIGEgbmV3IE9BdXRoIHRva2VuIHdoaWNoXG4gICAgICAgICAgICAgICAgICB5b3UgY2FuIHVzZSBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPENvbnNvbGVPQXV0aEZsb3dcbiAgICAgICAgICAgICAgb25Eb25lPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgdm9pZCByZXNvbHZlKClcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgbW9kZT1cInNldHVwLXRva2VuXCJcbiAgICAgICAgICAgICAgc3RhcnRpbmdNZXNzYWdlPVwiVGhpcyB3aWxsIGd1aWRlIHlvdSB0aHJvdWdoIGxvbmctbGl2ZWQgKDEteWVhcikgYXV0aCB0b2tlbiBzZXR1cCBmb3IgeW91ciBDbGF1ZGUgYWNjb3VudC4gQ2xhdWRlIHN1YnNjcmlwdGlvbiByZXF1aXJlZC5cIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgPC9LZXliaW5kaW5nU2V0dXA+XG4gICAgICA8L0FwcFN0YXRlUHJvdmlkZXI+LFxuICAgIClcbiAgfSlcbiAgcm9vdC51bm1vdW50KClcbiAgcHJvY2Vzcy5leGl0KDApXG59XG5cbi8vIERvY3RvcldpdGhQbHVnaW5zIHdyYXBwZXIgKyBkb2N0b3IgaGFuZGxlclxuY29uc3QgRG9jdG9yTGF6eSA9IFJlYWN0LmxhenkoKCkgPT5cbiAgaW1wb3J0KCcuLi8uLi9zY3JlZW5zL0RvY3Rvci5qcycpLnRoZW4obSA9PiAoeyBkZWZhdWx0OiBtLkRvY3RvciB9KSksXG4pXG5cbmZ1bmN0aW9uIERvY3RvcldpdGhQbHVnaW5zKHtcbiAgb25Eb25lLFxufToge1xuICBvbkRvbmU6ICgpID0+IHZvaWRcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICB1c2VNYW5hZ2VQbHVnaW5zKClcbiAgcmV0dXJuIChcbiAgICA8UmVhY3QuU3VzcGVuc2UgZmFsbGJhY2s9e251bGx9PlxuICAgICAgPERvY3Rvckxhenkgb25Eb25lPXtvbkRvbmV9IC8+XG4gICAgPC9SZWFjdC5TdXNwZW5zZT5cbiAgKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG9jdG9ySGFuZGxlcihyb290OiBSb290KTogUHJvbWlzZTx2b2lkPiB7XG4gIGxvZ0V2ZW50KCd0ZW5ndV9kb2N0b3JfY29tbWFuZCcsIHt9KVxuXG4gIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4ge1xuICAgIHJvb3QucmVuZGVyKFxuICAgICAgPEFwcFN0YXRlUHJvdmlkZXI+XG4gICAgICAgIDxLZXliaW5kaW5nU2V0dXA+XG4gICAgICAgICAgPE1DUENvbm5lY3Rpb25NYW5hZ2VyXG4gICAgICAgICAgICBkeW5hbWljTWNwQ29uZmlnPXt1bmRlZmluZWR9XG4gICAgICAgICAgICBpc1N0cmljdE1jcENvbmZpZz17ZmFsc2V9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPERvY3RvcldpdGhQbHVnaW5zXG4gICAgICAgICAgICAgIG9uRG9uZT17KCkgPT4ge1xuICAgICAgICAgICAgICAgIHZvaWQgcmVzb2x2ZSgpXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvTUNQQ29ubmVjdGlvbk1hbmFnZXI+XG4gICAgICAgIDwvS2V5YmluZGluZ1NldHVwPlxuICAgICAgPC9BcHBTdGF0ZVByb3ZpZGVyPixcbiAgICApXG4gIH0pXG4gIHJvb3QudW5tb3VudCgpXG4gIHByb2Nlc3MuZXhpdCgwKVxufVxuXG4vLyBpbnN0YWxsIGhhbmRsZXJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsSGFuZGxlcihcbiAgdGFyZ2V0OiBzdHJpbmcgfCB1bmRlZmluZWQsXG4gIG9wdGlvbnM6IHsgZm9yY2U/OiBib29sZWFuIH0sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgeyBzZXR1cCB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9zZXR1cC5qcycpXG4gIGF3YWl0IHNldHVwKGN3ZCgpLCAnZGVmYXVsdCcsIGZhbHNlLCBmYWxzZSwgdW5kZWZpbmVkLCBmYWxzZSlcbiAgY29uc3QgeyBpbnN0YWxsIH0gPSBhd2FpdCBpbXBvcnQoJy4uLy4uL2NvbW1hbmRzL2luc3RhbGwuanMnKVxuICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPihyZXNvbHZlID0+IHtcbiAgICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IFtdXG4gICAgaWYgKHRhcmdldCkgYXJncy5wdXNoKHRhcmdldClcbiAgICBpZiAob3B0aW9ucy5mb3JjZSkgYXJncy5wdXNoKCctLWZvcmNlJylcblxuICAgIHZvaWQgaW5zdGFsbC5jYWxsKFxuICAgICAgcmVzdWx0ID0+IHtcbiAgICAgICAgdm9pZCByZXNvbHZlKClcbiAgICAgICAgcHJvY2Vzcy5leGl0KHJlc3VsdC5pbmNsdWRlcygnZmFpbGVkJykgPyAxIDogMClcbiAgICAgIH0sXG4gICAgICB7fSxcbiAgICAgIGFyZ3MsXG4gICAgKVxuICB9KVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFTQSxHQUFHLFFBQVEsU0FBUztBQUM3QixPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxTQUFTLFFBQVEsc0NBQXNDO0FBQ2hFLFNBQVNDLGdCQUFnQixRQUFRLGlDQUFpQztBQUNsRSxjQUFjQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGVBQWUsUUFBUSw4Q0FBOEM7QUFDOUUsU0FBU0MsUUFBUSxRQUFRLG1DQUFtQztBQUM1RCxTQUFTQyxvQkFBb0IsUUFBUSw0Q0FBNEM7QUFDakYsU0FBU0MsZ0JBQWdCLFFBQVEseUJBQXlCO0FBQzFELFNBQVNDLGdCQUFnQixRQUFRLGlDQUFpQztBQUNsRSxTQUFTQyxzQkFBc0IsUUFBUSxxQkFBcUI7QUFFNUQsT0FBTyxlQUFlQyxpQkFBaUJBLENBQUNDLElBQUksRUFBRVYsSUFBSSxDQUFDLEVBQUVXLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUNqRVAsUUFBUSxDQUFDLDJCQUEyQixFQUFFLENBQUMsQ0FBQyxDQUFDO0VBRXpDLE1BQU1RLGVBQWUsR0FBRyxDQUFDSixzQkFBc0IsQ0FBQyxDQUFDO0VBQ2pELE1BQU07SUFBRUs7RUFBaUIsQ0FBQyxHQUFHLE1BQU0sTUFBTSxDQUN2QyxzQ0FDRixDQUFDO0VBQ0QsTUFBTSxJQUFJRixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUNHLE9BQU8sSUFBSTtJQUNqQ0osSUFBSSxDQUFDSyxNQUFNLENBQ1QsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDUixnQkFBZ0IsQ0FBQztBQUMzRCxRQUFRLENB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