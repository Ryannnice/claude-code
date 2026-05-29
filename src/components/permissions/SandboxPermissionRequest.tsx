// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from 'src/ink.js';
// 复用 NetworkHostPattern、shouldAllowManagedSandboxDomainsOnly 工具函数，把通用处理留在 src/utils/sandbox/sandbox-adapter.js 中维护。
import { type NetworkHostPattern, shouldAllowManagedSandboxDomainsOnly } from 'src/utils/sandbox/sandbox-adapter.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from '../../services/analytics/index.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// 引入 PermissionDialog，将 ./PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from './PermissionDialog.js';
// SandboxPermissionRequestProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type SandboxPermissionRequestProps = {
  hostPattern: NetworkHostPattern;
  onUserResponse: (response: {
    allow: boolean;
    persistToSettings: boolean;
  }) => void;
};
// SandboxPermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SandboxPermissionRequest(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(22);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    hostPattern: t1,
    onUserResponse
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    host
  } = t1;
  // t2 暂存 `function onSelect(value) {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onUserResponse) {
    // t2 暂存 `function onSelect(value) {` 生成的渲染片段，后续返回路径直接复用。
    t2 = function onSelect(value) {
      // 权限确认界面 Sandbox Permission Request在这里处理 `bb4: switch (value) {`，完成这一小步状态转换。
      bb4: switch (value) {
        case "yes":
          {
            // 调用 onUserResponse，触发终端渲染此处需要的副作用。
            onUserResponse({
              allow: true,
              persistToSettings: false
            });
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb4;
          }
        case "yes-dont-ask-again":
          {
            // 调用 onUserResponse，触发终端渲染此处需要的副作用。
            onUserResponse({
              allow: true,
              persistToSettings: true
            });
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb4;
          }
        case "no":
          {
            // 调用 onUserResponse，触发终端渲染此处需要的副作用。
            onUserResponse({
              allow: false,
              persistToSettings: false
            });
          }
      }
    };
    // $[0] 缓存 `onUserResponse`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onUserResponse;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // onSelect保存`t2`，作为后续临时缓存值处理的输入。
  const onSelect = t2;
  // t3 暂存 `shouldAllowManagedSandboxDomainsOnly()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `shouldAllowManagedSandboxDomainsOnly()` 生成的渲染片段，后续返回路径直接复用。
    t3 = shouldAllowManagedSandboxDomainsOnly();
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // managedDomainsOnly保存`t3`，作为后续临时缓存值处理的输入。
  const managedDomainsOnly = t3;
  // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t4 = {
      label: "Yes",
      value: "yes"
    };
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // t5 暂存 `!managedDomainsOnly ? [{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== host) {
    // t5 暂存 `!managedDomainsOnly ? [{` 生成的渲染片段，后续返回路径直接复用。
    t5 = !managedDomainsOnly ? [{
      label: <Text>Yes, and don't ask again for <Text bold={true}>{host}</Text></Text>,
      value: "yes-dont-ask-again"
    }] : [];
    // $[4] 缓存 `host`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = host;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // t6暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // 判断 $[6] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t6暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t6 = {
      label: <Text>No, and tell Claude what to do differently <Text bold={true}>(esc)</Text></Text>,
      value: "no"
    };
    // $[6] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t6;
  } else {
    // t6从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[6];
  }
  // t7暂存 `[t4, ...t5, t6]` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t5) {
    // t7暂存 `[t4, ...t5, t6]` 生成的渲染片段，后续返回路径直接复用。
    t7 = [t4, ...t5, t6];
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
    // $[8] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t7;
  } else {
    // t7从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[8];
  }
  // options 集合保存`t7`，供终端渲染权限确认界面 Sandbox Permission R...后续步骤使用。
  const options = t7;
  // t8暂存 `<Text dimColor={true}>Host:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // 判断 $[9] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t8暂存 `<Text dimColor={true}>Host:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text dimColor={true}>Host:</Text>;
    // $[9] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t8;
  } else {
    // t8从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[9];
  }
  // t9暂存 `<Box>{t8}<Text> {host}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== host) {
    // t9暂存 `<Box>{t8}<Text> {host}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box>{t8}<Text> {host}</Text></Box>;
    // $[10] 缓存 `host`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = host;
    // $[11] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t9;
  } else {
    // t9从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[11];
  }
  // t10暂存 `<Box marginTop={1}><Text>Do you want to allow this connec...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // 判断 $[12] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t10暂存 `<Box marginTop={1}><Text>Do you want to allow this connec...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box marginTop={1}><Text>Do you want to allow this connection?</Text></Box>;
    // $[12] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t10;
  } else {
    // t10从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[12];
  }
  // t11暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== onUserResponse) {
    // t11暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t11 = () => {
      // onUserResponse执行终端渲染在此处需要的副作用或外部交互。
      onUserResponse({
        allow: false,
        persistToSettings: false
      });
    };
    // $[13] 缓存 `onUserResponse`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = onUserResponse;
    // $[14] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t11;
  } else {
    // t11从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[14];
  }
  // t12暂存 `<Box><Select options={options} onChange={onSelect} onCanc...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== onSelect || $[16] !== options || $[17] !== t11) {
    // t12暂存 `<Box><Select options={options} onChange={onSelect} onCanc...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Box><Select options={options} onChange={onSelect} onCancel={t11} /></Box>;
    // $[15] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = onSelect;
    // $[16] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = options;
    // $[17] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t11;
    // $[18] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t12;
  } else {
    // t12从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[18];
  }
  // t13暂存 `<PermissionDialog title="Network request outside of sandb...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== t12 || $[20] !== t9) {
    // t13暂存 `<PermissionDialog title="Network request outside of sandb...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <PermissionDialog title="Network request outside of sandbox"><Box flexDirection="column" paddingX={2} paddingY={1}>{t9}{t10}{t12}</Box></PermissionDialog>;
    // $[19] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t12;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
    // $[21] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t13;
  } else {
    // t13从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[21];
  }
  // 返回 t13，把终端渲染这个分支的结果交还调用方。
  return t13;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJOZXR3b3JrSG9zdFBhdHRlcm4iLCJzaG91bGRBbGxvd01hbmFnZWRTYW5kYm94RG9tYWluc09ubHkiLCJBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTIiwibG9nRXZlbnQiLCJTZWxlY3QiLCJQZXJtaXNzaW9uRGlhbG9nIiwiU2FuZGJveFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMiLCJob3N0UGF0dGVybiIsIm9uVXNlclJlc3BvbnNlIiwicmVzcG9uc2UiLCJhbGxvdyIsInBlcnNpc3RUb1NldHRpbmdzIiwiU2FuZGJveFBlcm1pc3Npb25SZXF1ZXN0IiwidDAiLCIkIiwiX2MiLCJ0MSIsImhvc3QiLCJ0MiIsIm9uU2VsZWN0IiwidmFsdWUiLCJiYjQiLCJ0MyIsIlN5bWJvbCIsImZvciIsIm1hbmFnZWREb21haW5zT25seSIsInQ0IiwibGFiZWwiLCJ0NSIsInQ2IiwidDciLCJvcHRpb25zIiwidDgiLCJ0OSIsInQxMCIsInQxMSIsInQxMiIsInQxMyJdLCJzb3VyY2VzIjpbIlNhbmRib3hQZXJtaXNzaW9uUmVxdWVzdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICdzcmMvaW5rLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBOZXR3b3JrSG9zdFBhdHRlcm4sXG4gIHNob3VsZEFsbG93TWFuYWdlZFNhbmRib3hEb21haW5zT25seSxcbn0gZnJvbSAnc3JjL3V0aWxzL3NhbmRib3gvc2FuZGJveC1hZGFwdGVyLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnLi4vLi4vc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IFBlcm1pc3Npb25EaWFsb2cgfSBmcm9tICcuL1Blcm1pc3Npb25EaWFsb2cuanMnXG5cbmV4cG9ydCB0eXBlIFNhbmRib3hQZXJtaXNzaW9uUmVxdWVzdFByb3BzID0ge1xuICBob3N0UGF0dGVybjogTmV0d29ya0hvc3RQYXR0ZXJuXG4gIG9uVXNlclJlc3BvbnNlOiAocmVzcG9uc2U6IHtcbiAgICBhbGxvdzogYm9vbGVhblxuICAgIHBlcnNpc3RUb1NldHRpbmdzOiBib29sZWFuXG4gIH0pID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNhbmRib3hQZXJtaXNzaW9uUmVxdWVzdCh7XG4gIGhvc3RQYXR0ZXJuOiB7IGhvc3QgfSxcbiAgb25Vc2VyUmVzcG9uc2UsXG59OiBTYW5kYm94UGVybWlzc2lvblJlcXVlc3RQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGZ1bmN0aW9uIG9uU2VsZWN0KHZhbHVlOiBzdHJpbmcpIHtcbiAgICAvLyBXZSBtYXkgd2FudCB0byBiZXR0ZXIgdW5pZnkgdGhpcyBkaWFsb2cgd2l0aCBvdGhlciBwZXJtaXNzaW9uIGRpYWxvZ3NcbiAgICAvLyBhbmQgdXNlIHRoZWlyIGxvZ2dpbmcsIGJ1dCB0aGlzIGlzIHNsaWdodGx5IGRpZmZlcmVudCBhbmQgd2UgZG9uJ3QgaGF2ZVxuICAgIC8vIHRoZSB0b29sIGNvbnRleHQgaGVyZS4gRm9yIG5vdywganVzdCB1c2UgYmFzaWMgbG9nZ2luZyBmb3IgYmFzaWMgZGF0YS5cbiAgICBpZiAoXCJleHRlcm5hbFwiID09PSAnYW50Jykge1xuICAgICAgbG9nRXZlbnQoJ3Rlbmd1X3NhbmRib3hfbmV0d29ya19kaWFsb2dfcmVzdWx0Jywge1xuICAgICAgICBob3N0OiBob3N0IGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIHJlc3VsdDpcbiAgICAgICAgICB2YWx1ZSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHZhbHVlKSB7XG4gICAgICBjYXNlICd5ZXMnOlxuICAgICAgICBvblVzZXJSZXNwb25zZSh7IGFsbG93OiB0cnVlLCBwZXJzaXN0VG9TZXR0aW5nczogZmFsc2UgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3llcy1kb250LWFzay1hZ2Fpbic6XG4gICAgICAgIG9uVXNlclJlc3BvbnNlKHsgYWxsb3c6IHRydWUsIHBlcnNpc3RUb1NldHRpbmdzOiB0cnVlIH0pXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdubyc6XG4gICAgICAgIG9uVXNlclJlc3BvbnNlKHsgYWxsb3c6IGZhbHNlLCBwZXJzaXN0VG9TZXR0aW5nczogZmFsc2UgfSlcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBjb25zdCBtYW5hZ2VkRG9tYWluc09ubHkgPSBzaG91bGRBbGxvd01hbmFnZWRTYW5kYm94RG9tYWluc09ubHkoKVxuXG4gIGNvbnN0IG9wdGlvbnMgPSBbXG4gICAgeyBsYWJlbDogJ1llcycsIHZhbHVlOiAneWVzJyB9LFxuICAgIC4uLighbWFuYWdlZERvbWFpbnNPbmx5XG4gICAgICA/IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogKFxuICAgICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgICBZZXMsIGFuZCBkb24mYXBvczt0IGFzayBhZ2FpbiBmb3IgPFRleHQgYm9sZD57aG9zdH08L1RleHQ+XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICksXG4gICAgICAgICAgICB2YWx1ZTogJ3llcy1kb250LWFzay1hZ2FpbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXVxuICAgICAgOiBbXSksXG4gICAge1xuICAgICAgbGFiZWw6IChcbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgTm8sIGFuZCB0ZWxsIENsYXVkZSB3aGF0IHRvIGRvIGRpZmZlcmVudGx5IDxUZXh0IGJvbGQ+KGVzYyk8L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICksXG4gICAgICB2YWx1ZTogJ25vJyxcbiAgICB9LFxuICBdXG5cbiAgcmV0dXJuIChcbiAgICA8UGVybWlzc2lvbkRpYWxvZyB0aXRsZT1cIk5ldHdvcmsgcmVxdWVzdCBvdXRzaWRlIG9mIHNhbmRib3hcIj5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdYPXsyfSBwYWRkaW5nWT17MX0+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+SG9zdDo8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+IHtob3N0fTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dD5EbyB5b3Ugd2FudCB0byBhbGxvdyB0aGlzIGNvbm5lY3Rpb24/PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgICAgb25DaGFuZ2U9e29uU2VsZWN0fVxuICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKFwiZXh0ZXJuYWxcIiA9PT0gJ2FudCcpIHtcbiAgICAgICAgICAgICAgICBsb2dFdmVudCgndGVuZ3Vfc2FuZGJveF9uZXR3b3JrX2RpYWxvZ19yZXN1bHQnLCB7XG4gICAgICAgICAgICAgICAgICBob3N0OiBob3N0IGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgICAgICAgICAgICByZXN1bHQ6XG4gICAgICAgICAgICAgICAgICAgICdjYW5jZWwnIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBvblVzZXJSZXNwb25zZSh7IGFsbG93OiBmYWxzZSwgcGVyc2lzdFRvU2V0dGluZ3M6IGZhbHNlIH0pXG4gICAgICAgICAgICB9fVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC9QZXJtaXNzaW9uRGlhbG9nPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFlBQVk7QUFDdEMsU0FDRSxLQUFLQyxrQkFBa0IsRUFDdkJDLG9DQUFvQyxRQUMvQixzQ0FBc0M7QUFDN0MsU0FDRSxLQUFLQywwREFBMEQsRUFDL0RDLFFBQVEsUUFDSCxtQ0FBbUM7QUFDMUMsU0FBU0MsTUFBTSxRQUFRLDJCQUEyQjtBQUNsRCxTQUFTQyxnQkFBZ0IsUUFBUSx1QkFBdUI7QUFFeEQsT0FBTyxLQUFLQyw2QkFBNkIsR0FBRztFQUMxQ0MsV0FBVyxFQUFFUCxrQkFBa0I7RUFDL0JRLGNBQWMsRUFBRSxDQUFDQyxRQUFRLEVBQUU7SUFDekJDLEtBQUssRUFBRSxPQUFPO0lBQ2RDLGlCQUFpQixFQUFFLE9BQU87RUFDNUIsQ0FBQyxFQUFFLEdBQUcsSUFBSTtBQUNaLENBQUM7QUFFRCxPQUFPLFNBQUFDLHlCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWtDO0lBQUFSLFdBQUEsRUFBQVMsRUFBQTtJQUFBUjtFQUFBLElBQUFLLEVBR1Q7RUFGakI7SUFBQUk7RUFBQSxJQUFBRCxFQUFRO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFKLENBQUEsUUFBQU4sY0FBQTtJQUdyQlUsRUFBQSxZQUFBQyxTQUFBQyxLQUFBO01BQUFDLEdBQUEsRUFZ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