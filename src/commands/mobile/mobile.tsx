// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 toString as qrToString，将 qrcode 中已经封装好的能力接到本文件流程里。
import { toString as qrToString } from 'qrcode';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useState } from 'react';
// 复用 Pane 终端界面组件，避免在这里重复拼装显示逻辑。
import { Pane } from '../../components/design-system/Pane.js';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准命令处理的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// Platform 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type Platform = 'ios' | 'android';
// Props 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: () => void;，负责命令处理在该局部场景下的响应。
  onDone: () => void;
};
// PLATFORMS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const PLATFORMS: Record<Platform, {
  url: string;
}> = {
  ios: {
    url: 'https://apps.apple.com/app/claude-by-anthropic/id6473753684'
  },
  android: {
    url: 'https://play.google.com/store/apps/details?id=com.anthropic.claude'
  }
};
// MobileQRCode 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function MobileQRCode(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(52);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // platform 由 React state 持有，setPlatform 会在用户操作或异步结果返回时触发刷新。
  const [platform, setPlatform] = useState("ios");
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      ios: "",
      android: ""
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // qrCodes 集合 由 React state 持有，setQrCodes 会在用户操作或异步结果返回时触发刷新。
  const [qrCodes, setQrCodes] = useState(t1);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    url
  } = PLATFORMS[platform];
  // qrCode读取 `qrCodes[platform]` 对应条目，后续围绕该成员继续处理。
  const qrCode = qrCodes[platform];
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // generateQRCodes 集合保存`generateQRCodes`，供命令处理后续处理使用。
      const generateQRCodes = async function generateQRCodes() {
        // 并行获取 ios、android，缩短斜杠命令 mobile等待多个独立异步任务的时间。
        const [ios, android] = await Promise.all([qrToString(PLATFORMS.ios.url, {
          type: "utf8",
          errorCorrectionLevel: "L"
        }), qrToString(PLATFORMS.android.url, {
          type: "utf8",
          errorCorrectionLevel: "L"
        })]);
        // setQrCodes 写入新的状态值，使命令处理后续读取保持一致。
        setQrCodes({
          ios,
          android
        });
      };
      // 调用 generateQRCodes，触发命令处理此处需要的副作用。
      generateQRCodes().catch(_temp);
    };
    // t3 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onDone) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone();
    };
    // $[3] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onDone;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // handleClose沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleClose = t4;
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      context: "Confirmation"
    };
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // 调用 useKeybinding，触发命令处理此处需要的副作用。
  useKeybinding("confirm:no", handleClose, t5);
  // t6 暂存 `function handleKeyDown(e) {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== onDone) {
    // t6 暂存 `function handleKeyDown(e) {` 生成的渲染片段，后续返回路径直接复用。
    t6 = function handleKeyDown(e) {
      // 当 `e.key` 匹配 `"q" || e.ctrl && e.key === ...` 时，命令处理执行对应分支。
      if (e.key === "q" || e.ctrl && e.key === "c") {
        // 调用 e.preventDefault，触发命令处理此处需要的副作用。
        e.preventDefault();
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone();
        // 斜杠命令 mobile在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 只有 `e.key === "tab" || e.key === "left" || e.key ===` 满足时，命令处理才执行该分支。
      if (e.key === "tab" || e.key === "left" || e.key === "right") {
        // 调用 e.preventDefault，触发命令处理此处需要的副作用。
        e.preventDefault();
        // setPlatform 写入新的状态值，使命令处理后续读取保持一致。
        setPlatform(_temp2);
      }
    };
    // $[6] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onDone;
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[7];
  }
  // handleKeyDown沿用 `t6` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleKeyDown = t6;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 暂存 `Pane` 的派生结果，便于缓存命中时直接复用。
  let T1;
  // t10 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t10;
  // t11 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t11;
  // t12 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t12;
  // t13 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t13;
  // t7 暂存 `"column"` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // t8 暂存 `0` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // t9 暂存 `true` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== handleKeyDown || $[9] !== qrCode) {
    // 文本行格式化`qrCode.split`，供命令处理后续处理使用。
    const lines = qrCode.split("\n").filter(_temp3);
    // T1 暂存 `Pane` 生成的渲染片段，后续返回路径直接复用。
    T1 = Pane;
    // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T0 = Box;
    // t7 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t7 = "column";
    // t8 暂存 `0` 生成的渲染片段，后续返回路径直接复用。
    t8 = 0;
    // t9 暂存 `true` 生成的渲染片段，后续返回路径直接复用。
    t9 = true;
    // t10 暂存 `handleKeyDown` 生成的渲染片段，后续返回路径直接复用。
    t10 = handleKeyDown;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
      // t11 暂存 `<Text> </Text>` 生成的渲染片段，后续返回路径直接复用。
      t11 = <Text> </Text>;
      // t12 暂存 `<Text> </Text>` 生成的渲染片段，后续返回路径直接复用。
      t12 = <Text> </Text>;
      // $[19] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t11;
      // $[20] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t12;
    } else {
      // t11 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[19];
      // t12 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[20];
    }
    // t13 暂存 `lines.map(_temp4)` 生成的渲染片段，后续返回路径直接复用。
    t13 = lines.map(_temp4);
    // $[8] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = handleKeyDown;
    // $[9] 缓存 `qrCode`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = qrCode;
    // $[10] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = T0;
    // $[11] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = T1;
    // $[12] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t10;
    // $[13] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t11;
    // $[14] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t12;
    // $[15] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t13;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
    // $[17] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t8;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // T0 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[10];
    // T1 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[11];
    // t10 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[12];
    // t11 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[13];
    // t12 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[14];
    // t13 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[15];
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
    // t8 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[17];
    // t9 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // t14 暂存 `<Text> </Text>` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // t15 暂存 `<Text> </Text>` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
    // t14 暂存 `<Text> </Text>` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Text> </Text>;
    // t15 暂存 `<Text> </Text>` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Text> </Text>;
    // $[21] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t14;
    // $[22] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t15;
  } else {
    // t14 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[21];
    // t15 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[22];
  }
  // t16标记命令处理斜杠命令 mobile是否启用对应路径。
  const t16 = platform === "ios";
  // t17标记命令处理斜杠命令 mobile是否启用对应路径。
  const t17 = platform === "ios";
  // t18 暂存 `<Text bold={t16} underline={t17}>iOS</Text>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== t16 || $[24] !== t17) {
    // t18 暂存 `<Text bold={t16} underline={t17}>iOS</Text>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Text bold={t16} underline={t17}>iOS</Text>;
    // $[23] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t16;
    // $[24] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t17;
    // $[25] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[25];
  }
  // t19 暂存 `<Text dimColor={true}>{" / "}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[26] === Symbol.for("react.memo_cache_sentinel")) {
    // t19 暂存 `<Text dimColor={true}>{" / "}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Text dimColor={true}>{" / "}</Text>;
    // $[26] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[26];
  }
  // t20标记命令处理斜杠命令 mobile是否启用对应路径。
  const t20 = platform === "android";
  // t21标记命令处理斜杠命令 mobile是否启用对应路径。
  const t21 = platform === "android";
  // t22 暂存 `<Text bold={t20} underline={t21}>Android</Text>` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== t20 || $[28] !== t21) {
    // t22 暂存 `<Text bold={t20} underline={t21}>Android</Text>` 生成的渲染片段，后续返回路径直接复用。
    t22 = <Text bold={t20} underline={t21}>Android</Text>;
    // $[27] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t20;
    // $[28] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t21;
    // $[29] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[29];
  }
  // t23 暂存 `<Text>{t18}{t19}{t22}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== t18 || $[31] !== t22) {
    // t23 暂存 `<Text>{t18}{t19}{t22}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t23 = <Text>{t18}{t19}{t22}</Text>;
    // $[30] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t18;
    // $[31] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t22;
    // $[32] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[32];
  }
  // t24 暂存 `<Text dimColor={true}>(tab to switch, esc to close)</Text>` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[33] === Symbol.for("react.memo_cache_sentinel")) {
    // t24 暂存 `<Text dimColor={true}>(tab to switch, esc to close)</Text>` 生成的渲染片段，后续返回路径直接复用。
    t24 = <Text dimColor={true}>(tab to switch, esc to close)</Text>;
    // $[33] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[33];
  }
  // t25 暂存 `<Box flexDirection="row" gap={2}>{t23}{t24}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t25;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== t23) {
    // t25 暂存 `<Box flexDirection="row" gap={2}>{t23}{t24}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t25 = <Box flexDirection="row" gap={2}>{t23}{t24}</Box>;
    // $[34] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t23;
    // $[35] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t25;
  } else {
    // t25 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t25 = $[35];
  }
  // t26 暂存 `<Text dimColor={true}>{url}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[36] !== url) {
    // t26 暂存 `<Text dimColor={true}>{url}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t26 = <Text dimColor={true}>{url}</Text>;
    // $[36] 缓存 `url`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = url;
    // $[37] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t26;
  } else {
    // t26 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[37];
  }
  // t27 暂存 `<T0 flexDirection={t7} tabIndex={t8} autoFocus={t9} onKey...` 的派生结果，便于缓存命中时直接复用。
  let t27;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[38] !== T0 || $[39] !== t10 || $[40] !== t11 || $[41] !== t12 || $[42] !== t13 || $[43] !== t25 || $[44] !== t26 || $[45] !== t7 || $[46] !== t8 || $[47] !== t9) {
    // t27 暂存 `<T0 flexDirection={t7} tabIndex={t8} autoFocus={t9} onKey...` 生成的渲染片段，后续返回路径直接复用。
    t27 = <T0 flexDirection={t7} tabIndex={t8} autoFocus={t9} onKeyDown={t10}>{t11}{t12}{t13}{t14}{t15}{t25}{t26}</T0>;
    // $[38] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = T0;
    // $[39] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t10;
    // $[40] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t11;
    // $[41] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t12;
    // $[42] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t13;
    // $[43] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t25;
    // $[44] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t26;
    // $[45] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t7;
    // $[46] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t8;
    // $[47] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t9;
    // $[48] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t27;
  } else {
    // t27 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
    t27 = $[48];
  }
  // t28 暂存 `<T1>{t27}</T1>` 的派生结果，便于缓存命中时直接复用。
  let t28;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[49] !== T1 || $[50] !== t27) {
    // t28 暂存 `<T1>{t27}</T1>` 生成的渲染片段，后续返回路径直接复用。
    t28 = <T1>{t27}</T1>;
    // $[49] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = T1;
    // $[50] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t27;
    // $[51] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t28;
  } else {
    // t28 从 React 编译缓存槽 $[51] 取回渲染片段，避免依赖未变时重建 JSX。
    t28 = $[51];
  }
  // 返回 `t28`，作为命令处理这次计算的结果。
  return t28;
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
function _temp2(prev) {
  // 返回 `prev === "ios" ? "android" : "ios"`，作为命令处理这次计算的结果。
  return prev === "ios" ? "android" : "ios";
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone): Promise<React.ReactNode> {
  // 返回 `<MobileQRCode onDone={onDone} />`，作为命令处理这次计算的结果。
  return <MobileQRCode onDone={onDone} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0b1N0cmluZyIsInFyVG9TdHJpbmciLCJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJQYW5lIiwiS2V5Ym9hcmRFdmVudCIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwiTG9jYWxKU1hDb21tYW5kT25Eb25lIiwiUGxhdGZvcm0iLCJQcm9wcyIsIm9uRG9uZSIsIlBMQVRGT1JNUyIsIlJlY29yZCIsInVybCIsImlvcyIsImFuZHJvaWQiLCJNb2JpbGVRUkNvZGUiLCJ0MCIsIiQiLCJfYyIsInBsYXRmb3JtIiwic2V0UGxhdGZvcm0iLCJ0MSIsIlN5bWJvbCIsImZvciIsInFyQ29kZXMiLCJzZXRRckNvZGVzIiwicXJDb2RlIiwidDIiLCJ0MyIsImdlbmVyYXRlUVJDb2RlcyIsIlByb21pc2UiLCJhbGwiLCJ0eXBlIiwiZXJyb3JDb3JyZWN0aW9uTGV2ZWwiLCJjYXRjaCIsIl90ZW1wIiwidDQiLCJoYW5kbGVDbG9zZSIsInQ1IiwiY29udGV4dCIsInQ2IiwiaGFuZGxlS2V5RG93biIsImUiLCJrZXkiLCJjdHJsIiwicHJldmVudERlZmF1bHQiLCJfdGVtcDIiLCJUMCIsIlQxIiwidDEwIiwidDExIiwidDEyIiwidDEzIiwidDciLCJ0OCIsInQ5IiwibGluZXMiLCJzcGxpdCIsImZpbHRlciIsIl90ZW1wMyIsIm1hcCIsIl90ZW1wNCIsInQxNCIsInQxNSIsInQxNiIsInQxNyIsInQxOCIsInQxOSIsInQyMCIsInQyMSIsInQyMiIsInQyMyIsInQyNCIsInQyNSIsInQyNiIsInQyNyIsInQyOCIsImxpbmVfMCIsImkiLCJsaW5lIiwibGVuZ3RoIiwicHJldiIsImNhbGwiLCJSZWFjdE5vZGUiXSwic291cmNlcyI6WyJtb2JpbGUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHRvU3RyaW5nIGFzIHFyVG9TdHJpbmcgfSBmcm9tICdxcmNvZGUnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBQYW5lIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9kZXNpZ24tc3lzdGVtL1BhbmUuanMnXG5pbXBvcnQgdHlwZSB7IEtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi8uLi9pbmsvZXZlbnRzL2tleWJvYXJkLWV2ZW50LmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZyB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZE9uRG9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5cbnR5cGUgUGxhdGZvcm0gPSAnaW9zJyB8ICdhbmRyb2lkJ1xuXG50eXBlIFByb3BzID0ge1xuICBvbkRvbmU6ICgpID0+IHZvaWRcbn1cblxuY29uc3QgUExBVEZPUk1TOiBSZWNvcmQ8UGxhdGZvcm0sIHsgdXJsOiBzdHJpbmcgfT4gPSB7XG4gIGlvczoge1xuICAgIHVybDogJ2h0dHBzOi8vYXBwcy5hcHBsZS5jb20vYXBwL2NsYXVkZS1ieS1hbnRocm9waWMvaWQ2NDczNzUzNjg0JyxcbiAgfSxcbiAgYW5kcm9pZDoge1xuICAgIHVybDogJ2h0dHBzOi8vcGxheS5nb29nbGUuY29tL3N0b3JlL2FwcHMvZGV0YWlscz9pZD1jb20uYW50aHJvcGljLmNsYXVkZScsXG4gIH0sXG59XG5cbmZ1bmN0aW9uIE1vYmlsZVFSQ29kZSh7IG9uRG9uZSB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtwbGF0Zm9ybSwgc2V0UGxhdGZvcm1dID0gdXNlU3RhdGU8UGxhdGZvcm0+KCdpb3MnKVxuICBjb25zdCBbcXJDb2Rlcywgc2V0UXJDb2Rlc10gPSB1c2VTdGF0ZTxSZWNvcmQ8UGxhdGZvcm0sIHN0cmluZz4+KHtcbiAgICBpb3M6ICcnLFxuICAgIGFuZHJvaWQ6ICcnLFxuICB9KVxuXG4gIGNvbnN0IHsgdXJsIH0gPSBQTEFURk9STVNbcGxhdGZvcm1dXG4gIGNvbnN0IHFyQ29kZSA9IHFyQ29kZXNbcGxhdGZvcm1dXG5cbiAgLy8gR2VuZXJhdGUgYm90aCBRUiBjb2RlcyB1cGZyb250IHRvIGF2b2lkIGZsaWNrZXIgd2hlbiBzd2l0Y2hpbmdcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVFSQ29kZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICBjb25zdCBbaW9zLCBhbmRyb2lkXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgcXJUb1N0cmluZyhQTEFURk9STVMuaW9zLnVybCwge1xuICAgICAgICAgIHR5cGU6ICd1dGY4JyxcbiAgICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbDogJ0wnLFxuICAgICAgICB9KSxcbiAgICAgICAgcXJUb1N0cmluZyhQTEFURk9STVMuYW5kcm9pZC51cmwsIHtcbiAgICAgICAgICB0eXBlOiAndXRmOCcsXG4gICAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6ICdMJyxcbiAgICAgICAgfSksXG4gICAgICBdKVxuICAgICAgc2V0UXJDb2Rlcyh7IGlvcywgYW5kcm9pZCB9KVxuICAgIH1cbiAgICBnZW5lcmF0ZVFSQ29kZXMoKS5jYXRjaCgoKSA9PiB7XG4gICAgICAvLyBRUiBnZW5lcmF0aW9uIGZhaWxlZCwgbGVhdmUgZW1wdHlcbiAgICB9KVxuICB9LCBbXSlcblxuICBjb25zdCBoYW5kbGVDbG9zZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBvbkRvbmUoKVxuICB9LCBbb25Eb25lXSlcblxuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOm5vJywgaGFuZGxlQ2xvc2UsIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSlcblxuICBmdW5jdGlvbiBoYW5kbGVLZXlEb3duKGU6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoZS5rZXkgPT09ICdxJyB8fCAoZS5jdHJsICYmIGUua2V5ID09PSAnYycpKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIG9uRG9uZSgpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKGUua2V5ID09PSAndGFiJyB8fCBlLmtleSA9PT0gJ2xlZnQnIHx8IGUua2V5ID09PSAncmlnaHQnKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHNldFBsYXRmb3JtKHByZXYgPT4gKHByZXYgPT09ICdpb3MnID8gJ2FuZHJvaWQnIDogJ2lvcycpKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGxpbmVzID0gcXJDb2RlLnNwbGl0KCdcXG4nKS5maWx0ZXIobGluZSA9PiBsaW5lLmxlbmd0aCA+IDApXG5cbiAgcmV0dXJuIChcbiAgICA8UGFuZT5cbiAgICAgIDxCb3hcbiAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgIHRhYkluZGV4PXswfVxuICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgb25LZXlEb3duPXtoYW5kbGVLZXlEb3dufVxuICAgICAgPlxuICAgICAgICA8VGV4dD4gPC9UZXh0PlxuICAgICAgICA8VGV4dD4gPC9UZXh0PlxuICAgICAgICB7bGluZXMubWFwKChsaW5lLCBpKSA9PiAoXG4gICAgICAgICAgPFRleHQga2V5PXtpfT57bGluZX08L1RleHQ+XG4gICAgICAgICkpfVxuICAgICAgICA8VGV4dD4gPC9UZXh0PlxuICAgICAgICA8VGV4dD4gPC9UZXh0PlxuXG4gICAgICAgIHsvKiBDb250cm9scyAqL31cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXsyfT5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGJvbGQ9e3BsYXRmb3JtID09PSAnaW9zJ30gdW5kZXJsaW5lPXtwbGF0Zm9ybSA9PT0gJ2lvcyd9PlxuICAgICAgICAgICAgICBpT1NcbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPnsnIC8gJ308L1RleHQ+XG4gICAgICAgICAgICA8VGV4dFxuICAgICAgICAgICAgICBib2xkPXtwbGF0Zm9ybSA9PT0gJ2FuZHJvaWQnfVxuICAgICAgICAgICAgICB1bmRlcmxpbmU9e3BsYXRmb3JtID09PSAnYW5kcm9pZCd9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIEFuZHJvaWRcbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+KHRhYiB0byBzd2l0Y2gsIGVzYyB0byBjbG9zZSk8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj57dXJsfTwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIDwvUGFuZT5cbiAgKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsbChcbiAgb25Eb25lOiBMb2NhbEpTWENvbW1hbmRPbkRvbmUsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZT4ge1xuICByZXR1cm4gPE1vYmlsZVFSQ29kZSBvbkRvbmU9e29uRG9uZX0gLz5cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLFFBQVEsSUFBSUMsVUFBVSxRQUFRLFFBQVE7QUFDL0MsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLEVBQUVDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDeEQsU0FBU0MsSUFBSSxRQUFRLHdDQUF3QztBQUM3RCxjQUFjQyxhQUFhLFFBQVEsb0NBQW9DO0FBQ3ZFLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0MsYUFBYSxRQUFRLG9DQUFvQztBQUNsRSxjQUFjQyxxQkFBcUIsUUFBUSx3QkFBd0I7QUFFbkUsS0FBS0MsUUFBUSxHQUFHLEtBQUssR0FBRyxTQUFTO0FBRWpDLEtBQUtDLEtBQUssR0FBRztFQUNYQyxNQUFN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