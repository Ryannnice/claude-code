// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { StructuredPatchHunk } 来自 diff，用于校准终端渲染的数据契约。
import type { StructuredPatchHunk } from 'diff';
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { resolve } from 'path';
// 引入 React、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useMemo } from 'react';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js';
// 复用 readFileSafe 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { readFileSafe } from '../../utils/file.js';
// 引入 Divider，将 ../design-system/Divider.js 中已经封装好的能力接到本文件流程里。
import { Divider } from '../design-system/Divider.js';
// 引入 StructuredDiff，将 ../StructuredDiff.js 中已经封装好的能力接到本文件流程里。
import { StructuredDiff } from '../StructuredDiff.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  filePath: string;
  hunks: StructuredPatchHunk[];
  isLargeFile?: boolean;
  isBinary?: boolean;
  isTruncated?: boolean;
  isUntracked?: boolean;
};

/**
 * Displays the diff content for a single file.
 * Uses StructuredDiff for word-level diffing and syntax highlighting.
 * No scrolling - renders all lines (max 400 due to parsing limits).
 */
// DiffDetailView 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function DiffDetailView(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(53);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    filePath,
    hunks,
    isLargeFile,
    isBinary,
    isTruncated,
    isUntracked
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // 终端 UI 组件 Diff Detail View在这里处理 `bb0: {`，完成这一小步状态转换。
  bb0: {
    // 文件路径缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!filePath) {
      // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t2 = {
          firstLine: null,
          fileContent: undefined
        };
        // $[0] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[0] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[0];
      }
      // t1 暂存 `t2` 生成的渲染片段，后续返回路径直接复用。
      t1 = t2;
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb0;
    }
    // 文本内容 先占位，稍后的条件分支会根据实际输入补齐它。
    let content;
    // t2 暂存 `content?.split("\n")[0] ?? null` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== filePath) {
      // fullPath 路径数据读取`resolve`，供终端渲染后续处理使用。
      const fullPath = resolve(getCwd(), filePath);
      // 文本内容更新为 `readFileSafe(fullPath)`，确保终端 UI后续读取最新状态。
      content = readFileSafe(fullPath);
      // t2 暂存 `content?.split("\n")[0] ?? null` 生成的渲染片段，后续返回路径直接复用。
      t2 = content?.split("\n")[0] ?? null;
      // $[1] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = filePath;
      // $[2] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = content;
      // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t2;
    } else {
      // 文本内容更新为 `$[2]`，确保终端 UI后续读取最新状态。
      content = $[2];
      // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[3];
    }
    // 临时值 t3 命名 `content ?? undefined`，让后续代码直接表达这个值的用途。
    const t3 = content ?? undefined;
    // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== t2 || $[5] !== t3) {
      // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t4 = {
        firstLine: t2,
        fileContent: t3
      };
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
      // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t3;
      // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[6];
    }
    // t1 暂存 `t4` 生成的渲染片段，后续返回路径直接复用。
    t1 = t4;
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    firstLine,
    fileContent
  } = t1;
  // 满足 `isUntracked` 时，终端渲染执行该分支。
  if (isUntracked) {
    // t2 暂存 `<Text bold={true}>{filePath}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[7] !== filePath) {
      // t2 暂存 `<Text bold={true}>{filePath}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text bold={true}>{filePath}</Text>;
      // $[7] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = filePath;
      // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[8];
    }
    // t3 暂存 `<Text dimColor={true}> (untracked)</Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      // t3 暂存 `<Text dimColor={true}> (untracked)</Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text dimColor={true}> (untracked)</Text>;
      // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[9];
    }
    // t4 暂存 `<Box>{t2}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== t2) {
      // t4 暂存 `<Box>{t2}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Box>{t2}{t3}</Box>;
      // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t2;
      // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[11];
    }
    // t5 暂存 `<Divider padding={4} />` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<Divider padding={4} />` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Divider padding={4} />;
      // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[12];
    }
    // t6 暂存 `<Text dimColor={true} italic={true}>New file not yet stag...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
      // t6 暂存 `<Text dimColor={true} italic={true}>New file not yet stag...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Text dimColor={true} italic={true}>New file not yet staged.</Text>;
      // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[13];
    }
    // t7 暂存 `<Box flexDirection="column">{t6}<Text dimColor={true} ita...` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[14] !== filePath) {
      // t7 暂存 `<Box flexDirection="column">{t6}<Text dimColor={true} ita...` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Box flexDirection="column">{t6}<Text dimColor={true} italic={true}>Run `git add {filePath}` to see line counts.</Text></Box>;
      // $[14] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = filePath;
      // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[15];
    }
    // t8 暂存 `<Box flexDirection="column" width="100%">{t4}{t5}{t7}</Bo...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[16] !== t4 || $[17] !== t7) {
      // t8 暂存 `<Box flexDirection="column" width="100%">{t4}{t5}{t7}</Bo...` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Box flexDirection="column" width="100%">{t4}{t5}{t7}</Box>;
      // $[16] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t4;
      // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t7;
      // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[18];
    }
    // 返回 `t8`，作为终端渲染这次计算的结果。
    return t8;
  }
  // 满足 `isBinary` 时，终端渲染执行该分支。
  if (isBinary) {
    // t2 暂存 `<Box><Text bold={true}>{filePath}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[19] !== filePath) {
      // t2 暂存 `<Box><Text bold={true}>{filePath}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Box><Text bold={true}>{filePath}</Text></Box>;
      // $[19] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = filePath;
      // $[20] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[20];
    }
    // t3 暂存 `<Divider padding={4} />` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
      // t3 暂存 `<Divider padding={4} />` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Divider padding={4} />;
      // $[21] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[21];
    }
    // t4 暂存 `<Box flexDirection="column"><Text dimColor={true} italic=...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
      // t4 暂存 `<Box flexDirection="column"><Text dimColor={true} italic=...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Box flexDirection="column"><Text dimColor={true} italic={true}>Binary file - cannot display diff</Text></Box>;
      // $[22] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[22];
    }
    // t5 暂存 `<Box flexDirection="column" width="100%">{t2}{t3}{t4}</Bo...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[23] !== t2) {
      // t5 暂存 `<Box flexDirection="column" width="100%">{t2}{t3}{t4}</Bo...` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Box flexDirection="column" width="100%">{t2}{t3}{t4}</Box>;
      // $[23] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = t2;
      // $[24] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[24];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // 满足 `isLargeFile` 时，终端渲染执行该分支。
  if (isLargeFile) {
    // t2 暂存 `<Box><Text bold={true}>{filePath}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[25] !== filePath) {
      // t2 暂存 `<Box><Text bold={true}>{filePath}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Box><Text bold={true}>{filePath}</Text></Box>;
      // $[25] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = filePath;
      // $[26] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[26] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[26];
    }
    // t3 暂存 `<Divider padding={4} />` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
      // t3 暂存 `<Divider padding={4} />` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Divider padding={4} />;
      // $[27] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[27] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[27];
    }
    // t4 暂存 `<Box flexDirection="column"><Text dimColor={true} italic=...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
      // t4 暂存 `<Box flexDirection="column"><Text dimColor={true} italic=...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Box flexDirection="column"><Text dimColor={true} italic={true}>Large file - diff exceeds 1 MB limit</Text></Box>;
      // $[28] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[28] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[28];
    }
    // t5 暂存 `<Box flexDirection="column" width="100%">{t2}{t3}{t4}</Bo...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[29] !== t2) {
      // t5 暂存 `<Box flexDirection="column" width="100%">{t2}{t3}{t4}</Bo...` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Box flexDirection="column" width="100%">{t2}{t3}{t4}</Box>;
      // $[29] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[29] = t2;
      // $[30] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[30] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[30];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // t2 暂存 `<Text bold={true}>{filePath}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== filePath) {
    // t2 暂存 `<Text bold={true}>{filePath}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text bold={true}>{filePath}</Text>;
    // $[31] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = filePath;
    // $[32] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[32];
  }
  // t3 暂存 `isTruncated && <Text dimColor={true}> (truncated)</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[33] !== isTruncated) {
    // t3 暂存 `isTruncated && <Text dimColor={true}> (truncated)</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = isTruncated && <Text dimColor={true}> (truncated)</Text>;
    // $[33] 缓存 `isTruncated`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = isTruncated;
    // $[34] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[34];
  }
  // t4 暂存 `<Box>{t2}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== t2 || $[36] !== t3) {
    // t4 暂存 `<Box>{t2}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box>{t2}{t3}</Box>;
    // $[35] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t2;
    // $[36] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t3;
    // $[37] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[37];
  }
  // t5 暂存 `<Divider padding={4} />` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[38] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Divider padding={4} />` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Divider padding={4} />;
    // $[38] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[38];
  }
  // t6 暂存 `hunks.length === 0 ? <Text dimColor={true}>No diff conten...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[39] !== columns || $[40] !== fileContent || $[41] !== filePath || $[42] !== firstLine || $[43] !== hunks) {
    // t6 暂存 `hunks.length === 0 ? <Text dimColor={true}>No diff conten...` 生成的渲染片段，后续返回路径直接复用。
    t6 = hunks.length === 0 ? <Text dimColor={true}>No diff content</Text> : hunks.map((hunk, index) => <StructuredDiff key={index} patch={hunk} filePath={filePath} firstLine={firstLine} fileContent={fileContent} dim={false} width={columns - 2 - 2} />);
    // $[39] 缓存 `columns`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = columns;
    // $[40] 缓存 `fileContent`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = fileContent;
    // $[41] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = filePath;
    // $[42] 缓存 `firstLine`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = firstLine;
    // $[43] 缓存 `hunks`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = hunks;
    // $[44] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[44];
  }
  // t7 暂存 `<Box flexDirection="column">{t6}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== t6) {
    // t7 暂存 `<Box flexDirection="column">{t6}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column">{t6}</Box>;
    // $[45] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t6;
    // $[46] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[46];
  }
  // t8 暂存 `isTruncated && <Text dimColor={true} italic={true}>… diff...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[47] !== isTruncated) {
    // t8 暂存 `isTruncated && <Text dimColor={true} italic={true}>… diff...` 生成的渲染片段，后续返回路径直接复用。
    t8 = isTruncated && <Text dimColor={true} italic={true}>… diff truncated (exceeded 400 line limit)</Text>;
    // $[47] 缓存 `isTruncated`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = isTruncated;
    // $[48] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[48];
  }
  // t9 暂存 `<Box flexDirection="column" width="100%">{t4}{t5}{t7}{t8}...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[49] !== t4 || $[50] !== t7 || $[51] !== t8) {
    // t9 暂存 `<Box flexDirection="column" width="100%">{t4}{t5}{t7}{t8}...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column" width="100%">{t4}{t5}{t7}{t8}</Box>;
    // $[49] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t4;
    // $[50] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t7;
    // $[51] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t8;
    // $[52] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[52];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTdHJ1Y3R1cmVkUGF0Y2hIdW5rIiwicmVzb2x2ZSIsIlJlYWN0IiwidXNlTWVtbyIsInVzZVRlcm1pbmFsU2l6ZSIsIkJveCIsIlRleHQiLCJnZXRDd2QiLCJyZWFkRmlsZVNhZmUiLCJEaXZpZGVyIiwiU3RydWN0dXJlZERpZmYiLCJQcm9wcyIsImZpbGVQYXRoIiwiaHVua3MiLCJpc0xhcmdlRmlsZSIsImlzQmluYXJ5IiwiaXNUcnVuY2F0ZWQiLCJpc1VudHJhY2tlZCIsIkRpZmZEZXRhaWxWaWV3IiwidDAiLCIkIiwiX2MiLCJjb2x1bW5zIiwidDEiLCJiYjAiLCJ0MiIsIlN5bWJvbCIsImZvciIsImZpcnN0TGluZSIsImZpbGVDb250ZW50IiwidW5kZWZpbmVkIiwiY29udGVudCIsImZ1bGxQYXRoIiwic3BsaXQiLCJ0MyIsInQ0IiwidDUiLCJ0NiIsInQ3IiwidDgiLCJsZW5ndGgiLCJtYXAiLCJodW5rIiwiaW5kZXgiLCJ0OSJdLCJzb3VyY2VzIjpbIkRpZmZEZXRhaWxWaWV3LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFN0cnVjdHVyZWRQYXRjaEh1bmsgfSBmcm9tICdkaWZmJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgUmVhY3QsIHsgdXNlTWVtbyB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlVGVybWluYWxTaXplIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0Q3dkIH0gZnJvbSAnLi4vLi4vdXRpbHMvY3dkLmpzJ1xuaW1wb3J0IHsgcmVhZEZpbGVTYWZlIH0gZnJvbSAnLi4vLi4vdXRpbHMvZmlsZS5qcydcbmltcG9ydCB7IERpdmlkZXIgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0RpdmlkZXIuanMnXG5pbXBvcnQgeyBTdHJ1Y3R1cmVkRGlmZiB9IGZyb20gJy4uL1N0cnVjdHVyZWREaWZmLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBmaWxlUGF0aDogc3RyaW5nXG4gIGh1bmtzOiBTdHJ1Y3R1cmVkUGF0Y2hIdW5rW11cbiAgaXNMYXJnZUZpbGU/OiBib29sZWFuXG4gIGlzQmluYXJ5PzogYm9vbGVhblxuICBpc1RydW5jYXRlZD86IGJvb2xlYW5cbiAgaXNVbnRyYWNrZWQ/OiBib29sZWFuXG59XG5cbi8qKlxuICogRGlzcGxheXMgdGhlIGRpZmYgY29udGVudCBmb3IgYSBzaW5nbGUgZmlsZS5cbiAqIFVzZXMgU3RydWN0dXJlZERpZmYgZm9yIHdvcmQtbGV2ZWwgZGlmZmluZyBhbmQgc3ludGF4IGhpZ2hsaWdodGluZy5cbiAqIE5vIHNjcm9sbGluZyAtIHJlbmRlcnMgYWxsIGxpbmVzIChtYXggNDAwIGR1ZSB0byBwYXJzaW5nIGxpbWl0cykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBEaWZmRGV0YWlsVmlldyh7XG4gIGZpbGVQYXRoLFxuICBodW5rcyxcbiAgaXNMYXJnZUZpbGUsXG4gIGlzQmluYXJ5LFxuICBpc1RydW5jYXRlZCxcbiAgaXNVbnRyYWNrZWQsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgY29sdW1ucyB9ID0gdXNlVGVybWluYWxTaXplKClcblxuICAvLyBSZWFkIGZpbGUgY29udGVudCBmb3Igc3ludGF4IGRldGVjdGlvbiBhbmQgbXVsdGlsaW5lIGNvbnN0cnVjdCBoYW5kbGluZy5cbiAgLy8gT25seSBjb21wdXRlZCB3aGVuIHRoaXMgY29tcG9uZW50IGlzIHJlbmRlcmVkIChkZXRhaWwgdmlldyBtb2RlKS5cbiAgY29uc3QgeyBmaXJzdExpbmUsIGZpbGVDb250ZW50IH0gPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIWZpbGVQYXRoKSB7XG4gICAgICByZXR1cm4geyBmaXJzdExpbmU6IG51bGwsIGZpbGVDb250ZW50OiB1bmRlZmluZWQgfVxuICAgIH1cbiAgICBjb25zdCBmdWxsUGF0aCA9IHJlc29sdmUoZ2V0Q3dkKCksIGZpbGVQYXRoKVxuICAgIGNvbnN0IGNvbnRlbnQgPSByZWFkRmlsZVNhZmUoZnVsbFBhdGgpXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpcnN0TGluZTogY29udGVudD8uc3BsaXQoJ1xcbicpWzBdID8/IG51bGwsXG4gICAgICBmaWxlQ29udGVudDogY29udGVudCA/PyB1bmRlZmluZWQsXG4gICAgfVxuICB9LCBbZmlsZVBhdGhdKVxuXG4gIC8vIEhhbmRsZSB1bnRyYWNrZWQgZmlsZXNcbiAgaWYgKGlzVW50cmFja2VkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHdpZHRoPVwiMTAwJVwiPlxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGJvbGQ+e2ZpbGVQYXRofTwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gKHVudHJhY2tlZCk8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8RGl2aWRlciBwYWRkaW5nPXs0fSAvPlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvciBpdGFsaWM+XG4gICAgICAgICAgICBOZXcgZmlsZSBub3QgeWV0IHN0YWdlZC5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICAgICAgUnVuIGBnaXQgYWRkIHtmaWxlUGF0aH1gIHRvIHNlZSBsaW5lIGNvdW50cy5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgLy8gSGFuZGxlIGJpbmFyeSBmaWxlc1xuICBpZiAoaXNCaW5hcnkpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgd2lkdGg9XCIxMDAlXCI+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgYm9sZD57ZmlsZVBhdGh9PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPERpdmlkZXIgcGFkZGluZz17NH0gLz5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICAgICAgQmluYXJ5IGZpbGUgLSBjYW5ub3QgZGlzcGxheSBkaWZmXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIC8vIEhhbmRsZSBsYXJnZSBmaWxlc1xuICBpZiAoaXNMYXJnZUZpbGUpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgd2lkdGg9XCIxMDAlXCI+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgYm9sZD57ZmlsZVBhdGh9PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPERpdmlkZXIgcGFkZGluZz17NH0gLz5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICAgICAgTGFyZ2UgZmlsZSAtIGRpZmYgZXhjZWVkcyAxIE1CIGxpbWl0XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGNvbnN0IG91dGVyUGFkZGluZ1ggPSAxXG4gIGNvbnN0IG91dGVyQm9yZGVyV2lkdGggPSAxXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiB3aWR0aD1cIjEwMCVcIj5cbiAgICAgIDxCb3g+XG4gICAgICAgIDxUZXh0IGJvbGQ+e2ZpbGVQYXRofTwvVGV4dD5cbiAgICAgICAge2lzVHJ1bmNhdGVkICYmIDxUZXh0IGRpbUNvbG9yPiAodHJ1bmNhdGVkKTwvVGV4dD59XG4gICAgICA8L0JveD5cblxuICAgICAgPERpdmlkZXIgcGFkZGluZz17NH0gLz5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICB7aHVua3MubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPk5vIGRpZmYgY29udGVudDwvVGV4dD5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICBodW5rcy5tYXAoKGh1bmssIGluZGV4KSA9PiAoXG4gICAgICAgICAgICA8U3RydWN0dXJlZERpZmZcbiAgICAgICAgICAgICAga2V5PXtpbmRleH1cbiAgICAgICAgICAgICAgcGF0Y2g9e2h1bmt9XG4gICAgICAgICAgICAgIGZpbGVQYXRoPXtmaWxlUGF0aH1cbiAgICAgICAgICAgICAgZmlyc3RMaW5lPXtmaXJzdExpbmV9XG4gICAgICAgICAgICAgIGZpbGVDb250ZW50PXtmaWxlQ29udGVudH1cbiAgICAgICAgICAgICAgZGltPXtmYWxzZX1cbiAgICAgICAgICAgICAgd2lkdGg9e2NvbHVtbnMgLSAyICogb3V0ZXJQYWRkaW5nWCAtIDIgKiBvdXRlckJvcmRlcldpZHRofVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApKVxuICAgICAgICApfVxuICAgICAgPC9Cb3g+XG5cbiAgICAgIHtpc1RydW5jYXRlZCAmJiAoXG4gICAgICAgIDxUZXh0IGRpbUNvbG9yIGl0YWxpYz5cbiAgICAgICAgICDigKYgZGlmZiB0cnVuY2F0ZWQgKGV4Y2VlZGVkIDQwMCBsaW5lIGxpbWl0KVxuICAgICAgICA8L1RleHQ+XG4gICAgICApfVxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUFjQSxtQkFBbUIsUUFBUSxNQUFNO0FBQy9DLFNBQVNDLE9BQU8sUUFBUSxNQUFNO0FBQzlCLE9BQU9DLEtBQUssSUFBSUMsT0FBTyxRQUFRLE9BQU87QUFDdEMsU0FBU0MsZUFBZSxRQUFRLGdDQUFnQztBQUNoRSxTQUFTQyxHQUFHLEVB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