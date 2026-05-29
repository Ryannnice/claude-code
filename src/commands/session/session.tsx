// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 toString as qrToString，将 qrcode 中已经封装好的能力接到本文件流程里。
import { toString as qrToString } from 'qrcode';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react';
// 复用 Pane 终端界面组件，避免在这里重复拼装显示逻辑。
import { Pane } from '../../components/design-system/Pane.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 类型依赖 { LocalJSXCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall } from '../../types/command.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js';
// Props 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: () => void;，负责命令处理在该局部场景下的响应。
  onDone: () => void;
};
// SessionInfo 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SessionInfo(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(19);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // remoteSessionUrl 会话数据保存`useAppState`，供命令处理后续处理使用。
  const remoteSessionUrl = useAppState(_temp);
  // qrCode 由 React state 持有，setQrCode 会在用户操作或异步结果返回时触发刷新。
  const [qrCode, setQrCode] = useState("");
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== remoteSessionUrl) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // remoteSessionUrl 会话数据缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!remoteSessionUrl) {
        // 斜杠命令 session在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // URL保存`remoteSessionUrl`，供后续判断或组装使用。
      const url = remoteSessionUrl;
      // generateQRCode保存`generateQRCode`，供命令处理后续处理使用。
      const generateQRCode = async function generateQRCode() {
        // qr保存`qrToString`，供命令处理后续处理使用。
        const qr = await qrToString(url, {
          type: "utf8",
          errorCorrectionLevel: "L"
        });
        // setQrCode 写入新的状态值，使命令处理后续读取保持一致。
        setQrCode(qr);
      };
      // 调用 generateQRCode，触发命令处理此处需要的副作用。
      generateQRCode().catch(_temp2);
    };
    // t2 暂存 `[remoteSessionUrl]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [remoteSessionUrl];
    // $[0] 缓存 `remoteSessionUrl`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = remoteSessionUrl;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t1, t2);
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      context: "Confirmation"
    };
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 调用 useKeybinding，触发命令处理此处需要的副作用。
  useKeybinding("confirm:no", onDone, t3);
  // remoteSessionUrl 会话数据缺失时直接走兜底路径，避免命令处理使用无效输入。
  if (!remoteSessionUrl) {
    // t4 暂存 `<Pane><Text color="warning">Not in remote mode. Start wit...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      // t4 暂存 `<Pane><Text color="warning">Not in remote mode. Start wit...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Pane><Text color="warning">Not in remote mode. Start with `claude --remote` to use this command.</Text><Text dimColor={true}>(press esc to close)</Text></Pane>;
      // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[4];
    }
    // 返回 `t4`，作为命令处理这次计算的结果。
    return t4;
  }
  // T0 暂存 `Pane` 的派生结果，便于缓存命中时直接复用。
  let T0;
  // t4 暂存 `<Box marginBottom={1}><Text bold={true}>Remote session</T...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 暂存 `isLoading ? <Text dimColor={true}>Generating QR code…</Te...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== qrCode) {
    // 文本行格式化`qrCode.split`，供命令处理后续处理使用。
    const lines = qrCode.split("\n").filter(_temp3);
    // isLoading标记命令处理斜杠命令 session是否启用对应路径。
    const isLoading = lines.length === 0;
    // T0 暂存 `Pane` 生成的渲染片段，后续返回路径直接复用。
    T0 = Pane;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      // t4 暂存 `<Box marginBottom={1}><Text bold={true}>Remote session</T...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Box marginBottom={1}><Text bold={true}>Remote session</Text></Box>;
      // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[9];
    }
    // t5 暂存 `isLoading ? <Text dimColor={true}>Generating QR code…</Te...` 生成的渲染片段，后续返回路径直接复用。
    t5 = isLoading ? <Text dimColor={true}>Generating QR code…</Text> : lines.map(_temp4);
    // $[5] 缓存 `qrCode`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = qrCode;
    // $[6] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = T0;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // T0 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[6];
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `<Text dimColor={true}>Open in browser: </Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Text dimColor={true}>Open in browser: </Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text dimColor={true}>Open in browser: </Text>;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[10];
  }
  // t7 暂存 `<Box marginTop={1}>{t6}<Text color="ide">{remoteSessionUr...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== remoteSessionUrl) {
    // t7 暂存 `<Box marginTop={1}>{t6}<Text color="ide">{remoteSessionUr...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box marginTop={1}>{t6}<Text color="ide">{remoteSessionUrl}</Text></Box>;
    // $[11] 缓存 `remoteSessionUrl`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = remoteSessionUrl;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[12];
  }
  // t8 暂存 `<Box marginTop={1}><Text dimColor={true}>(press esc to cl...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Box marginTop={1}><Text dimColor={true}>(press esc to cl...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box marginTop={1}><Text dimColor={true}>(press esc to close)</Text></Box>;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[13];
  }
  // t9 暂存 `<T0>{t4}{t5}{t7}{t8}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== T0 || $[15] !== t4 || $[16] !== t5 || $[17] !== t7) {
    // t9 暂存 `<T0>{t4}{t5}{t7}{t8}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <T0>{t4}{t5}{t7}{t8}</T0>;
    // $[14] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = T0;
    // $[15] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t4;
    // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t5;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // 返回 `t9`，作为命令处理这次计算的结果。
  return t9;
}
// _temp4 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(line_0, i) {
  // 返回 `<Text key={i}>{line_0}</Text>`，作为命令处理这次计算的结果。
  return <Text key={i}>{line_0}</Text>;
}
// _temp3 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(line) {
  // 返回 `line.length > 0`，作为命令处理这次计算的结果。
  return line.length > 0;
}
// _temp2 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(e) {
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logForDebugging("QR code generation failed", e);
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.remoteSessionUrl`，作为命令处理这次计算的结果。
  return s.remoteSessionUrl;
}
// 这个回调绑定到 export const call: LocalJSXCommandCall = async onDone => {，负责命令处理在该局部场景下的响应。
export const call: LocalJSXCommandCall = async onDone => {
  // 返回 `<SessionInfo onDone={onDone} />`，作为命令处理这次计算的结果。
  return <SessionInfo onDone={onDone} />;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0b1N0cmluZyIsInFyVG9TdHJpbmciLCJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiUGFuZSIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwidXNlQXBwU3RhdGUiLCJMb2NhbEpTWENvbW1hbmRDYWxsIiwibG9nRm9yRGVidWdnaW5nIiwiUHJvcHMiLCJvbkRvbmUiLCJTZXNzaW9uSW5mbyIsInQwIiwiJCIsIl9jIiwicmVtb3RlU2Vzc2lvblVybCIsIl90ZW1wIiwicXJDb2RlIiwic2V0UXJDb2RlIiwidDEiLCJ0MiIsInVybCIsImdlbmVyYXRlUVJDb2RlIiwicXIiLCJ0eXBlIiwiZXJyb3JDb3JyZWN0aW9uTGV2ZWwiLCJjYXRjaCIsIl90ZW1wMiIsInQzIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsInQ0IiwiVDAiLCJ0NSIsImxpbmVzIiwic3BsaXQiLCJmaWx0ZXIiLCJfdGVtcDMiLCJpc0xvYWRpbmciLCJsZW5ndGgiLCJtYXAiLCJfdGVtcDQiLCJ0NiIsInQ3IiwidDgiLCJ0OSIsImxpbmVfMCIsImkiLCJsaW5lIiwiZSIsInMiLCJjYWxsIl0sInNvdXJjZXMiOlsic2Vzc2lvbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdG9TdHJpbmcgYXMgcXJUb1N0cmluZyB9IGZyb20gJ3FyY29kZSdcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgUGFuZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvZGVzaWduLXN5c3RlbS9QYW5lLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZyB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0YXRlLmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbEpTWENvbW1hbmRDYWxsIH0gZnJvbSAnLi4vLi4vdHlwZXMvY29tbWFuZC5qcydcbmltcG9ydCB7IGxvZ0ZvckRlYnVnZ2luZyB9IGZyb20gJy4uLy4uL3V0aWxzL2RlYnVnLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBvbkRvbmU6ICgpID0+IHZvaWRcbn1cblxuZnVuY3Rpb24gU2Vzc2lvbkluZm8oeyBvbkRvbmUgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCByZW1vdGVTZXNzaW9uVXJsID0gdXNlQXBwU3RhdGUocyA9PiBzLnJlbW90ZVNlc3Npb25VcmwpXG4gIGNvbnN0IFtxckNvZGUsIHNldFFyQ29kZV0gPSB1c2VTdGF0ZTxzdHJpbmc+KCcnKVxuXG4gIC8vIEdlbmVyYXRlIFFSIGNvZGUgd2hlbiBVUkwgaXMgYXZhaWxhYmxlXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFyZW1vdGVTZXNzaW9uVXJsKSByZXR1cm5cblxuICAgIGNvbnN0IHVybCA9IHJlbW90ZVNlc3Npb25VcmxcbiAgICBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVFSQ29kZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgIGNvbnN0IHFyID0gYXdhaXQgcXJUb1N0cmluZyh1cmwsIHtcbiAgICAgICAgdHlwZTogJ3V0ZjgnLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbDogJ0wnLFxuICAgICAgfSlcbiAgICAgIHNldFFyQ29kZShxcilcbiAgICB9XG4gICAgLy8gSW50ZW50aW9uYWxseSBzaWxlbnQgZmFpbCAtIFVSTCBpcyBzdGlsbCBzaG93biBzbyBRUiBpcyBub24tY3JpdGljYWxcbiAgICBnZW5lcmF0ZVFSQ29kZSgpLmNhdGNoKGUgPT4ge1xuICAgICAgbG9nRm9yRGVidWdnaW5nKCdRUiBjb2RlIGdlbmVyYXRpb24gZmFpbGVkJywgZSlcbiAgICB9KVxuICB9LCBbcmVtb3RlU2Vzc2lvblVybF0pXG5cbiAgLy8gSGFuZGxlIEVTQyB0byBkaXNtaXNzXG4gIHVzZUtleWJpbmRpbmcoJ2NvbmZpcm06bm8nLCBvbkRvbmUsIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSlcblxuICAvLyBOb3QgaW4gcmVtb3RlIG1vZGVcbiAgaWYgKCFyZW1vdGVTZXNzaW9uVXJsKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxQYW5lPlxuICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICBOb3QgaW4gcmVtb3RlIG1vZGUuIFN0YXJ0IHdpdGggYGNsYXVkZSAtLXJlbW90ZWAgdG8gdXNlIHRoaXMgY29tbWFuZC5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj4ocHJlc3MgZXNjIHRvIGNsb3NlKTwvVGV4dD5cbiAgICAgIDwvUGFuZT5cbiAgICApXG4gIH1cblxuICBjb25zdCBsaW5lcyA9IHFyQ29kZS5zcGxpdCgnXFxuJykuZmlsdGVyKGxpbmUgPT4gbGluZS5sZW5ndGggPiAwKVxuICBjb25zdCBpc0xvYWRpbmcgPSBsaW5lcy5sZW5ndGggPT09IDBcblxuICByZXR1cm4gKFxuICAgIDxQYW5lPlxuICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICA8VGV4dCBib2xkPlJlbW90ZSBzZXNzaW9uPC9UZXh0PlxuICAgICAgPC9Cb3g+XG5cbiAgICAgIHsvKiBRUiBDb2RlIC0gc2lsZW50bHkgZmFpbHMgaWYgZ2VuZXJhdGlvbiBlcnJvcnMsIFVSTCBpcyBzdGlsbCBzaG93biAqL31cbiAgICAgIHtpc0xvYWRpbmcgPyAoXG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPkdlbmVyYXRpbmcgUVIgY29kZeKApjwvVGV4dD5cbiAgICAgICkgOiAoXG4gICAgICAgIGxpbmVzLm1hcCgobGluZSwgaSkgPT4gPFRleHQga2V5PXtpfT57bGluZX08L1RleHQ+KVxuICAgICAgKX1cblxuICAgICAgey8qIFVSTCAqL31cbiAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+T3BlbiBpbiBicm93c2VyOiA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiaWRlXCI+e3JlbW90ZVNlc3Npb25Vcmx9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG5cbiAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+KHByZXNzIGVzYyB0byBjbG9zZSk8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L1BhbmU+XG4gIClcbn1cblxuZXhwb3J0IGNvbnN0IGNhbGw6IExvY2FsSlNYQ29tbWFuZENhbGwgPSBhc3luYyBvbkRvbmUgPT4ge1xuICByZXR1cm4gPFNlc3Npb25JbmZvIG9uRG9uZT17b25Eb25lfSAvPlxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsUUFBUSxJQUFJQyxVQUFVLFFBQVEsUUFBUTtBQUMvQyxPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDM0MsU0FBU0MsSUFBSSxRQUFRLHdDQUF3QztBQUM3RCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGFBQWEsUUFBUSxvQ0FBb0M7QUFDbEUsU0FBU0MsV0FBVyxRQUFRLHlCQUF5QjtBQUNyRCxjQUFjQyxtQkFBbUIsUUFBUSx3QkFBd0I7QUFDakUsU0FBU0MsZUFBZSxRQUFRLHNCQUFzQjtBQUV0RCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsTUFBTSxFQUFFLEdBQUcsR0FBRyxJQUFJO0FBQ3BCLENBQUM7QUFFRCxTQUFBQyxZQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXFCO0lBQUFKO0VBQUEsSUFBQUUsRUFBaUI7RUFDcEMsTUFBQUcsZ0JBQUEsR0FBeUJULFdBQVcsQ0FBQ1UsS0FBdUIsQ0FBQztFQUM3RCxPQUFBQyxNQUFBLEVBQUFDLFNBQUEsSUFBNEJqQixRQUFRLENBQVMsRUFBRSxDQUFDO0VBQUEsSUFB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