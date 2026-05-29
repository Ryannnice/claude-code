// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、color、Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, color, Text, useTheme } from '../../ink.js';
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js';
// 类型依赖 { UnifiedInstalledItem } 来自 ./unifiedTypes.js，用于校准命令处理的数据契约。
import type { UnifiedInstalledItem } from './unifiedTypes.js';
// Props 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  item: UnifiedInstalledItem;
  isSelected: boolean;
};
// UnifiedInstalledCell 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UnifiedInstalledCell(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(142);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    item,
    isSelected
  } = t0;
  // 从 `useTheme()` 按位置拆出 theme，让插件命令界面 Unified Installed Cell分别处理这些返回值。
  const [theme] = useTheme();
  // 当 `item.type` 匹配 `"plugin"` 时，命令处理执行对应分支。
  if (item.type === "plugin") {
    // statusIcon 先占位，稍后的条件分支会根据实际输入补齐它。
    let statusIcon;
    // statusText 先占位，稍后的条件分支会根据实际输入补齐它。
    let statusText;
    // 满足 `item.pendingToggle` 时，命令处理执行该分支。
    if (item.pendingToggle) {
      // t1 暂存 `color("suggestion", theme)(figures.arrowRight)` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[0] !== theme) {
        // t1 暂存 `color("suggestion", theme)(figures.arrowRight)` 生成的渲染片段，后续返回路径直接复用。
        t1 = color("suggestion", theme)(figures.arrowRight);
        // $[0] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
        $[0] = theme;
        // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[1] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[1];
      }
      // statusIcon更新为 `t1`，确保插件命令界面后续读取最新状态。
      statusIcon = t1;
      // statusText更新为 `item.pendingToggle === "will-enable" ? "will enable" : "w...`，确保插件命令界面后续读取最新状态。
      statusText = item.pendingToggle === "will-enable" ? "will enable" : "will disable";
    } else {
      // 满足 `item.errorCount > 0` 时，命令处理执行该分支。
      if (item.errorCount > 0) {
        // t1 暂存 `color("error", theme)(figures.cross)` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[2] !== theme) {
          // t1 暂存 `color("error", theme)(figures.cross)` 生成的渲染片段，后续返回路径直接复用。
          t1 = color("error", theme)(figures.cross);
          // $[2] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
          $[2] = theme;
          // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[3] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[3];
        }
        // statusIcon更新为 `t1`，确保插件命令界面后续读取最新状态。
        statusIcon = t1;
        // t2保存`item.errorCount`，供插件命令界面 Unified Installed Cell后续判断或输出使用。
        const t2 = item.errorCount;
        // t3 暂存 `plural(item.errorCount, "error")` 的派生结果，便于缓存命中时直接复用。
        let t3;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[4] !== item.errorCount) {
          // t3 暂存 `plural(item.errorCount, "error")` 生成的渲染片段，后续返回路径直接复用。
          t3 = plural(item.errorCount, "error");
          // $[4] 缓存 `item.errorCount`，下次依赖未变时 React 编译产物可直接复用。
          $[4] = item.errorCount;
          // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[5] = t3;
        } else {
          // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[5];
        }
        // statusText更新为 ``${t2} ${t3}``，确保插件命令界面后续读取最新状态。
        statusText = `${t2} ${t3}`;
      } else {
        // item.isEnabled缺失时直接走兜底路径，避免命令处理使用无效输入。
        if (!item.isEnabled) {
          // t1 暂存 `color("inactive", theme)(figures.radioOff)` 的派生结果，便于缓存命中时直接复用。
          let t1;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[6] !== theme) {
            // t1 暂存 `color("inactive", theme)(figures.radioOff)` 生成的渲染片段，后续返回路径直接复用。
            t1 = color("inactive", theme)(figures.radioOff);
            // $[6] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
            $[6] = theme;
            // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
            $[7] = t1;
          } else {
            // t1 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
            t1 = $[7];
          }
          // statusIcon更新为 `t1`，确保插件命令界面后续读取最新状态。
          statusIcon = t1;
          // statusText更新为 `"disabled"`，确保插件命令界面后续读取最新状态。
          statusText = "disabled";
        } else {
          // t1 暂存 `color("success", theme)(figures.tick)` 的派生结果，便于缓存命中时直接复用。
          let t1;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[8] !== theme) {
            // t1 暂存 `color("success", theme)(figures.tick)` 生成的渲染片段，后续返回路径直接复用。
            t1 = color("success", theme)(figures.tick);
            // $[8] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
            $[8] = theme;
            // $[9] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
            $[9] = t1;
          } else {
            // t1 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
            t1 = $[9];
          }
          // statusIcon更新为 `t1`，确保插件命令界面后续读取最新状态。
          statusIcon = t1;
          // statusText更新为 `"enabled"`，确保插件命令界面后续读取最新状态。
          statusText = "enabled";
        }
      }
    }
    // t1保存`isSelected ? "suggestion" : undefined`，供后续判断或组装使用。
    const t1 = isSelected ? "suggestion" : undefined;
    // 临时值 t2 命名 `isSelected ? `${figures.pointer} ` : " "`，让后续代码直接表达这个值的用途。
    const t2 = isSelected ? `${figures.pointer} ` : "  ";
    // t3 暂存 `<Text color={t1}>{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== t1 || $[11] !== t2) {
      // t3 暂存 `<Text color={t1}>{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text color={t1}>{t2}</Text>;
      // $[10] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t1;
      // $[11] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t2;
      // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[12];
    }
    // t4保存`isSelected ? "suggestion" : undefined`，供后续判断或组装使用。
    const t4 = isSelected ? "suggestion" : undefined;
    // t5 暂存 `<Text color={t4}>{item.name}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[13] !== item.name || $[14] !== t4) {
      // t5 暂存 `<Text color={t4}>{item.name}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text color={t4}>{item.name}</Text>;
      // $[13] 缓存 `item.name`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = item.name;
      // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t4;
      // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[15];
    }
    // t6标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t6 = !isSelected;
    // t7 暂存 `<Text backgroundColor="userMessageBackground">Plugin</Tex...` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      // t7 暂存 `<Text backgroundColor="userMessageBackground">Plugin</Tex...` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Text backgroundColor="userMessageBackground">Plugin</Text>;
      // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[16];
    }
    // t8 暂存 `<Text dimColor={t6}>{" "}{t7}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[17] !== t6) {
      // t8 暂存 `<Text dimColor={t6}>{" "}{t7}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Text dimColor={t6}>{" "}{t7}</Text>;
      // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t6;
      // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[18];
    }
    // t9 暂存 `<Text dimColor={true}> · {item.marketplace}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[19] !== item.marketplace) {
      // t9 暂存 `<Text dimColor={true}> · {item.marketplace}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Text dimColor={true}> · {item.marketplace}</Text>;
      // $[19] 缓存 `item.marketplace`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = item.marketplace;
      // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[20];
    }
    // t10标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t10 = !isSelected;
    // t11 暂存 `<Text dimColor={t10}> · {statusIcon} </Text>` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[21] !== statusIcon || $[22] !== t10) {
      // t11 暂存 `<Text dimColor={t10}> · {statusIcon} </Text>` 生成的渲染片段，后续返回路径直接复用。
      t11 = <Text dimColor={t10}> · {statusIcon} </Text>;
      // $[21] 缓存 `statusIcon`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = statusIcon;
      // $[22] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t10;
      // $[23] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = t11;
    } else {
      // t11 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[23];
    }
    // t12标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t12 = !isSelected;
    // t13 暂存 `<Text dimColor={t12}>{statusText}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t13;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[24] !== statusText || $[25] !== t12) {
      // t13 暂存 `<Text dimColor={t12}>{statusText}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t13 = <Text dimColor={t12}>{statusText}</Text>;
      // $[24] 缓存 `statusText`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = statusText;
      // $[25] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = t12;
      // $[26] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[26] = t13;
    } else {
      // t13 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
      t13 = $[26];
    }
    // t14 暂存 `<Box>{t3}{t5}{t8}{t9}{t11}{t13}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[27] !== t11 || $[28] !== t13 || $[29] !== t3 || $[30] !== t5 || $[31] !== t8 || $[32] !== t9) {
      // t14 暂存 `<Box>{t3}{t5}{t8}{t9}{t11}{t13}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t14 = <Box>{t3}{t5}{t8}{t9}{t11}{t13}</Box>;
      // $[27] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[27] = t11;
      // $[28] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[28] = t13;
      // $[29] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[29] = t3;
      // $[30] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[30] = t5;
      // $[31] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[31] = t8;
      // $[32] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[32] = t9;
      // $[33] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[33] = t14;
    } else {
      // t14 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[33];
    }
    // 返回 `t14`，作为命令处理这次计算的结果。
    return t14;
  }
  // 当 `item.type` 匹配 `"flagged-plugin"` 时，命令处理执行对应分支。
  if (item.type === "flagged-plugin") {
    // t1 暂存 `color("warning", theme)(figures.warning)` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[34] !== theme) {
      // t1 暂存 `color("warning", theme)(figures.warning)` 生成的渲染片段，后续返回路径直接复用。
      t1 = color("warning", theme)(figures.warning);
      // $[34] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
      $[34] = theme;
      // $[35] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[35] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[35];
    }
    // statusIcon_0 命名 `t1`，让后续代码直接表达这个值的用途。
    const statusIcon_0 = t1;
    // 临时值 t2 命名 `isSelected ? "suggestion" : undefined`，让后续代码直接表达这个值的用途。
    const t2 = isSelected ? "suggestion" : undefined;
    // t3保存`isSelected ? `${figures.pointer} ` : " "`，供后续判断或组装使用。
    const t3 = isSelected ? `${figures.pointer} ` : "  ";
    // t4 暂存 `<Text color={t2}>{t3}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[36] !== t2 || $[37] !== t3) {
      // t4 暂存 `<Text color={t2}>{t3}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text color={t2}>{t3}</Text>;
      // $[36] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[36] = t2;
      // $[37] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[37] = t3;
      // $[38] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[38] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[38];
    }
    // t5保存`isSelected ? "suggestion" : undefined`，供插件命令界面 Unified Installed Cell后续判断或输出使用。
    const t5 = isSelected ? "suggestion" : undefined;
    // t6 暂存 `<Text color={t5}>{item.name}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[39] !== item.name || $[40] !== t5) {
      // t6 暂存 `<Text color={t5}>{item.name}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Text color={t5}>{item.name}</Text>;
      // $[39] 缓存 `item.name`，下次依赖未变时 React 编译产物可直接复用。
      $[39] = item.name;
      // $[40] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[40] = t5;
      // $[41] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[41] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[41];
    }
    // t7标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t7 = !isSelected;
    // t8 暂存 `<Text backgroundColor="userMessageBackground">Plugin</Tex...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[42] === Symbol.for("react.memo_cache_sentinel")) {
      // t8 暂存 `<Text backgroundColor="userMessageBackground">Plugin</Tex...` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Text backgroundColor="userMessageBackground">Plugin</Text>;
      // $[42] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[42] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[42];
    }
    // t9 暂存 `<Text dimColor={t7}>{" "}{t8}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[43] !== t7) {
      // t9 暂存 `<Text dimColor={t7}>{" "}{t8}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Text dimColor={t7}>{" "}{t8}</Text>;
      // $[43] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[43] = t7;
      // $[44] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[44] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[44];
    }
    // t10 暂存 `<Text dimColor={true}> · {item.marketplace}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[45] !== item.marketplace) {
      // t10 暂存 `<Text dimColor={true}> · {item.marketplace}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Text dimColor={true}> · {item.marketplace}</Text>;
      // $[45] 缓存 `item.marketplace`，下次依赖未变时 React 编译产物可直接复用。
      $[45] = item.marketplace;
      // $[46] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[46] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[46];
    }
    // t11标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t11 = !isSelected;
    // t12 暂存 `<Text dimColor={t11}> · {statusIcon_0} </Text>` 的派生结果，便于缓存命中时直接复用。
    let t12;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[47] !== statusIcon_0 || $[48] !== t11) {
      // t12 暂存 `<Text dimColor={t11}> · {statusIcon_0} </Text>` 生成的渲染片段，后续返回路径直接复用。
      t12 = <Text dimColor={t11}> · {statusIcon_0} </Text>;
      // $[47] 缓存 `statusIcon_0`，下次依赖未变时 React 编译产物可直接复用。
      $[47] = statusIcon_0;
      // $[48] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[48] = t11;
      // $[49] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[49] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[49] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[49];
    }
    // t13标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t13 = !isSelected;
    // t14 暂存 `<Text dimColor={t13}>removed</Text>` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[50] !== t13) {
      // t14 暂存 `<Text dimColor={t13}>removed</Text>` 生成的渲染片段，后续返回路径直接复用。
      t14 = <Text dimColor={t13}>removed</Text>;
      // $[50] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[50] = t13;
      // $[51] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[51] = t14;
    } else {
      // t14 从 React 编译缓存槽 $[51] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[51];
    }
    // t15 暂存 `<Box>{t4}{t6}{t9}{t10}{t12}{t14}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t15;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[52] !== t10 || $[53] !== t12 || $[54] !== t14 || $[55] !== t4 || $[56] !== t6 || $[57] !== t9) {
      // t15 暂存 `<Box>{t4}{t6}{t9}{t10}{t12}{t14}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t15 = <Box>{t4}{t6}{t9}{t10}{t12}{t14}</Box>;
      // $[52] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[52] = t10;
      // $[53] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[53] = t12;
      // $[54] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[54] = t14;
      // $[55] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[55] = t4;
      // $[56] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[56] = t6;
      // $[57] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[57] = t9;
      // $[58] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
      $[58] = t15;
    } else {
      // t15 从 React 编译缓存槽 $[58] 取回渲染片段，避免依赖未变时重建 JSX。
      t15 = $[58];
    }
    // 返回 `t15`，作为命令处理这次计算的结果。
    return t15;
  }
  // 当 `item.type` 匹配 `"failed-plugin"` 时，命令处理执行对应分支。
  if (item.type === "failed-plugin") {
    // t1 暂存 `color("error", theme)(figures.cross)` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[59] !== theme) {
      // t1 暂存 `color("error", theme)(figures.cross)` 生成的渲染片段，后续返回路径直接复用。
      t1 = color("error", theme)(figures.cross);
      // $[59] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
      $[59] = theme;
      // $[60] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[60] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[60] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[60];
    }
    // statusIcon_1 命名 `t1`，让后续代码直接表达这个值的用途。
    const statusIcon_1 = t1;
    // t2保存`item.errorCount`，供插件命令界面 Unified Installed Cell后续判断或输出使用。
    const t2 = item.errorCount;
    // t3 暂存 `plural(item.errorCount, "error")` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[61] !== item.errorCount) {
      // t3 暂存 `plural(item.errorCount, "error")` 生成的渲染片段，后续返回路径直接复用。
      t3 = plural(item.errorCount, "error");
      // $[61] 缓存 `item.errorCount`，下次依赖未变时 React 编译产物可直接复用。
      $[61] = item.errorCount;
      // $[62] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[62] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[62] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[62];
    }
    // statusText_0读取``failed to load · ${t2} ${t3}``，作为后续固定文本处理的输入。
    const statusText_0 = `failed to load · ${t2} ${t3}`;
    // t4保存`isSelected ? "suggestion" : undefined`，供后续判断或组装使用。
    const t4 = isSelected ? "suggestion" : undefined;
    // t5保存`isSelected ? `${figures.pointer} ` : " "`，供插件命令界面 Unified Installed Cell后续判断或输出使用。
    const t5 = isSelected ? `${figures.pointer} ` : "  ";
    // t6 暂存 `<Text color={t4}>{t5}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[63] !== t4 || $[64] !== t5) {
      // t6 暂存 `<Text color={t4}>{t5}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Text color={t4}>{t5}</Text>;
      // $[63] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[63] = t4;
      // $[64] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[64] = t5;
      // $[65] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[65] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[65] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[65];
    }
    // t7保存`isSelected ? "suggestion" : undefined`，供插件命令界面 Unified Installed Cell后续判断或输出使用。
    const t7 = isSelected ? "suggestion" : undefined;
    // t8 暂存 `<Text color={t7}>{item.name}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[66] !== item.name || $[67] !== t7) {
      // t8 暂存 `<Text color={t7}>{item.name}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Text color={t7}>{item.name}</Text>;
      // $[66] 缓存 `item.name`，下次依赖未变时 React 编译产物可直接复用。
      $[66] = item.name;
      // $[67] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[67] = t7;
      // $[68] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[68] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[68] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[68];
    }
    // t9标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t9 = !isSelected;
    // t10 暂存 `<Text backgroundColor="userMessageBackground">Plugin</Tex...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[69] === Symbol.for("react.memo_cache_sentinel")) {
      // t10 暂存 `<Text backgroundColor="userMessageBackground">Plugin</Tex...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Text backgroundColor="userMessageBackground">Plugin</Text>;
      // $[69] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[69] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[69] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[69];
    }
    // t11 暂存 `<Text dimColor={t9}>{" "}{t10}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[70] !== t9) {
      // t11 暂存 `<Text dimColor={t9}>{" "}{t10}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t11 = <Text dimColor={t9}>{" "}{t10}</Text>;
      // $[70] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[70] = t9;
      // $[71] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[71] = t11;
    } else {
      // t11 从 React 编译缓存槽 $[71] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[71];
    }
    // t12 暂存 `<Text dimColor={true}> · {item.marketplace}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t12;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[72] !== item.marketplace) {
      // t12 暂存 `<Text dimColor={true}> · {item.marketplace}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t12 = <Text dimColor={true}> · {item.marketplace}</Text>;
      // $[72] 缓存 `item.marketplace`，下次依赖未变时 React 编译产物可直接复用。
      $[72] = item.marketplace;
      // $[73] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[73] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[73] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[73];
    }
    // t13标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t13 = !isSelected;
    // t14 暂存 `<Text dimColor={t13}> · {statusIcon_1} </Text>` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[74] !== statusIcon_1 || $[75] !== t13) {
      // t14 暂存 `<Text dimColor={t13}> · {statusIcon_1} </Text>` 生成的渲染片段，后续返回路径直接复用。
      t14 = <Text dimColor={t13}> · {statusIcon_1} </Text>;
      // $[74] 缓存 `statusIcon_1`，下次依赖未变时 React 编译产物可直接复用。
      $[74] = statusIcon_1;
      // $[75] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[75] = t13;
      // $[76] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[76] = t14;
    } else {
      // t14 从 React 编译缓存槽 $[76] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[76];
    }
    // t15标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t15 = !isSelected;
    // t16 暂存 `<Text dimColor={t15}>{statusText_0}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t16;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[77] !== statusText_0 || $[78] !== t15) {
      // t16 暂存 `<Text dimColor={t15}>{statusText_0}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t16 = <Text dimColor={t15}>{statusText_0}</Text>;
      // $[77] 缓存 `statusText_0`，下次依赖未变时 React 编译产物可直接复用。
      $[77] = statusText_0;
      // $[78] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
      $[78] = t15;
      // $[79] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[79] = t16;
    } else {
      // t16 从 React 编译缓存槽 $[79] 取回渲染片段，避免依赖未变时重建 JSX。
      t16 = $[79];
    }
    // t17 暂存 `<Box>{t6}{t8}{t11}{t12}{t14}{t16}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t17;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[80] !== t11 || $[81] !== t12 || $[82] !== t14 || $[83] !== t16 || $[84] !== t6 || $[85] !== t8) {
      // t17 暂存 `<Box>{t6}{t8}{t11}{t12}{t14}{t16}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t17 = <Box>{t6}{t8}{t11}{t12}{t14}{t16}</Box>;
      // $[80] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[80] = t11;
      // $[81] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[81] = t12;
      // $[82] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[82] = t14;
      // $[83] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[83] = t16;
      // $[84] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[84] = t6;
      // $[85] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[85] = t8;
      // $[86] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
      $[86] = t17;
    } else {
      // t17 从 React 编译缓存槽 $[86] 取回渲染片段，避免依赖未变时重建 JSX。
      t17 = $[86];
    }
    // 返回 `t17`，作为命令处理这次计算的结果。
    return t17;
  }
  // statusIcon_2 先占位，稍后的条件分支会根据实际输入补齐它。
  let statusIcon_2;
  // statusText_1 先占位，稍后的条件分支会根据实际输入补齐它。
  let statusText_1;
  // 当 `item.status` 匹配 `"connected"` 时，命令处理执行对应分支。
  if (item.status === "connected") {
    // t1 暂存 `color("success", theme)(figures.tick)` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[87] !== theme) {
      // t1 暂存 `color("success", theme)(figures.tick)` 生成的渲染片段，后续返回路径直接复用。
      t1 = color("success", theme)(figures.tick);
      // $[87] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
      $[87] = theme;
      // $[88] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[88] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[88] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[88];
    }
    // statusIcon_2更新为 `t1`，确保插件命令界面后续读取最新状态。
    statusIcon_2 = t1;
    // statusText_1更新为 `"connected"`，确保插件命令界面后续读取最新状态。
    statusText_1 = "connected";
  } else {
    // 当 `item.status` 匹配 `"disabled"` 时，命令处理执行对应分支。
    if (item.status === "disabled") {
      // t1 暂存 `color("inactive", theme)(figures.radioOff)` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[89] !== theme) {
        // t1 暂存 `color("inactive", theme)(figures.radioOff)` 生成的渲染片段，后续返回路径直接复用。
        t1 = color("inactive", theme)(figures.radioOff);
        // $[89] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
        $[89] = theme;
        // $[90] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[90] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[90] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[90];
      }
      // statusIcon_2更新为 `t1`，确保插件命令界面后续读取最新状态。
      statusIcon_2 = t1;
      // statusText_1更新为 `"disabled"`，确保插件命令界面后续读取最新状态。
      statusText_1 = "disabled";
    } else {
      // 当 `item.status` 匹配 `"pending"` 时，命令处理执行对应分支。
      if (item.status === "pending") {
        // t1 暂存 `color("inactive", theme)(figures.radioOff)` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[91] !== theme) {
          // t1 暂存 `color("inactive", theme)(figures.radioOff)` 生成的渲染片段，后续返回路径直接复用。
          t1 = color("inactive", theme)(figures.radioOff);
          // $[91] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
          $[91] = theme;
          // $[92] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[92] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[92] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[92];
        }
        // statusIcon_2更新为 `t1`，确保插件命令界面后续读取最新状态。
        statusIcon_2 = t1;
        // statusText_1更新为 `"connecting\u2026"`，确保插件命令界面后续读取最新状态。
        statusText_1 = "connecting\u2026";
      } else {
        // 当 `item.status` 匹配 `"needs-auth"` 时，命令处理执行对应分支。
        if (item.status === "needs-auth") {
          // t1 暂存 `color("warning", theme)(figures.triangleUpOutline)` 的派生结果，便于缓存命中时直接复用。
          let t1;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[93] !== theme) {
            // t1 暂存 `color("warning", theme)(figures.triangleUpOutline)` 生成的渲染片段，后续返回路径直接复用。
            t1 = color("warning", theme)(figures.triangleUpOutline);
            // $[93] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
            $[93] = theme;
            // $[94] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
            $[94] = t1;
          } else {
            // t1 从 React 编译缓存槽 $[94] 取回渲染片段，避免依赖未变时重建 JSX。
            t1 = $[94];
          }
          // statusIcon_2更新为 `t1`，确保插件命令界面后续读取最新状态。
          statusIcon_2 = t1;
          // statusText_1更新为 `"Enter to auth"`，确保插件命令界面后续读取最新状态。
          statusText_1 = "Enter to auth";
        } else {
          // t1 暂存 `color("error", theme)(figures.cross)` 的派生结果，便于缓存命中时直接复用。
          let t1;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[95] !== theme) {
            // t1 暂存 `color("error", theme)(figures.cross)` 生成的渲染片段，后续返回路径直接复用。
            t1 = color("error", theme)(figures.cross);
            // $[95] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
            $[95] = theme;
            // $[96] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
            $[96] = t1;
          } else {
            // t1 从 React 编译缓存槽 $[96] 取回渲染片段，避免依赖未变时重建 JSX。
            t1 = $[96];
          }
          // statusIcon_2更新为 `t1`，确保插件命令界面后续读取最新状态。
          statusIcon_2 = t1;
          // statusText_1更新为 `"failed"`，确保插件命令界面后续读取最新状态。
          statusText_1 = "failed";
        }
      }
    }
  }
  // 满足 `item.indented` 时，命令处理执行该分支。
  if (item.indented) {
    // t1保存`isSelected ? "suggestion" : undefined`，供后续判断或组装使用。
    const t1 = isSelected ? "suggestion" : undefined;
    // 临时值 t2 命名 `isSelected ? `${figures.pointer} ` : " "`，让后续代码直接表达这个值的用途。
    const t2 = isSelected ? `${figures.pointer} ` : "  ";
    // t3 暂存 `<Text color={t1}>{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[97] !== t1 || $[98] !== t2) {
      // t3 暂存 `<Text color={t1}>{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Text color={t1}>{t2}</Text>;
      // $[97] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[97] = t1;
      // $[98] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[98] = t2;
      // $[99] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[99] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[99] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[99];
    }
    // t4标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t4 = !isSelected;
    // t5 暂存 `<Text dimColor={t4}>└ </Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[100] !== t4) {
      // t5 暂存 `<Text dimColor={t4}>└ </Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text dimColor={t4}>└ </Text>;
      // $[100] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[100] = t4;
      // $[101] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[101] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[101] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[101];
    }
    // t6保存`isSelected ? "suggestion" : undefined`，供后续判断或组装使用。
    const t6 = isSelected ? "suggestion" : undefined;
    // t7 暂存 `<Text color={t6}>{item.name}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[102] !== item.name || $[103] !== t6) {
      // t7 暂存 `<Text color={t6}>{item.name}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Text color={t6}>{item.name}</Text>;
      // $[102] 缓存 `item.name`，下次依赖未变时 React 编译产物可直接复用。
      $[102] = item.name;
      // $[103] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[103] = t6;
      // $[104] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[104] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[104] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[104];
    }
    // t8标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t8 = !isSelected;
    // t9 暂存 `<Text backgroundColor="userMessageBackground">MCP</Text>` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[105] === Symbol.for("react.memo_cache_sentinel")) {
      // t9 暂存 `<Text backgroundColor="userMessageBackground">MCP</Text>` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Text backgroundColor="userMessageBackground">MCP</Text>;
      // $[105] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[105] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[105] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[105];
    }
    // t10 暂存 `<Text dimColor={t8}>{" "}{t9}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[106] !== t8) {
      // t10 暂存 `<Text dimColor={t8}>{" "}{t9}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Text dimColor={t8}>{" "}{t9}</Text>;
      // $[106] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[106] = t8;
      // $[107] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[107] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[107] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[107];
    }
    // t11标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t11 = !isSelected;
    // t12 暂存 `<Text dimColor={t11}> · {statusIcon_2} </Text>` 的派生结果，便于缓存命中时直接复用。
    let t12;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[108] !== statusIcon_2 || $[109] !== t11) {
      // t12 暂存 `<Text dimColor={t11}> · {statusIcon_2} </Text>` 生成的渲染片段，后续返回路径直接复用。
      t12 = <Text dimColor={t11}> · {statusIcon_2} </Text>;
      // $[108] 缓存 `statusIcon_2`，下次依赖未变时 React 编译产物可直接复用。
      $[108] = statusIcon_2;
      // $[109] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[109] = t11;
      // $[110] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[110] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[110] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[110];
    }
    // t13标记插件命令界面 Unified Installed Cell是否启用对应路径。
    const t13 = !isSelected;
    // t14 暂存 `<Text dimColor={t13}>{statusText_1}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[111] !== statusText_1 || $[112] !== t13) {
      // t14 暂存 `<Text dimColor={t13}>{statusText_1}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t14 = <Text dimColor={t13}>{statusText_1}</Text>;
      // $[111] 缓存 `statusText_1`，下次依赖未变时 React 编译产物可直接复用。
      $[111] = statusText_1;
      // $[112] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[112] = t13;
      // $[113] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[113] = t14;
    } else {
      // t14 从 React 编译缓存槽 $[113] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[113];
    }
    // t15 暂存 `<Box>{t3}{t5}{t7}{t10}{t12}{t14}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t15;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[114] !== t10 || $[115] !== t12 || $[116] !== t14 || $[117] !== t3 || $[118] !== t5 || $[119] !== t7) {
      // t15 暂存 `<Box>{t3}{t5}{t7}{t10}{t12}{t14}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t15 = <Box>{t3}{t5}{t7}{t10}{t12}{t14}</Box>;
      // $[114] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[114] = t10;
      // $[115] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[115] = t12;
      // $[116] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[116] = t14;
      // $[117] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[117] = t3;
      // $[118] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[118] = t5;
      // $[119] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[119] = t7;
      // $[120] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
      $[120] = t15;
    } else {
      // t15 从 React 编译缓存槽 $[120] 取回渲染片段，避免依赖未变时重建 JSX。
      t15 = $[120];
    }
    // 返回 `t15`，作为命令处理这次计算的结果。
    return t15;
  }
  // t1保存`isSelected ? "suggestion" : undefined`，供后续判断或组装使用。
  const t1 = isSelected ? "suggestion" : undefined;
  // 临时值 t2 命名 `isSelected ? `${figures.pointer} ` : " "`，让后续代码直接表达这个值的用途。
  const t2 = isSelected ? `${figures.pointer} ` : "  ";
  // t3 暂存 `<Text color={t1}>{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[121] !== t1 || $[122] !== t2) {
    // t3 暂存 `<Text color={t1}>{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text color={t1}>{t2}</Text>;
    // $[121] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[121] = t1;
    // $[122] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[122] = t2;
    // $[123] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[123] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[123] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[123];
  }
  // t4保存`isSelected ? "suggestion" : undefined`，供后续判断或组装使用。
  const t4 = isSelected ? "suggestion" : undefined;
  // t5 暂存 `<Text color={t4}>{item.name}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[124] !== item.name || $[125] !== t4) {
    // t5 暂存 `<Text color={t4}>{item.name}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color={t4}>{item.name}</Text>;
    // $[124] 缓存 `item.name`，下次依赖未变时 React 编译产物可直接复用。
    $[124] = item.name;
    // $[125] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[125] = t4;
    // $[126] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[126] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[126] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[126];
  }
  // t6标记插件命令界面 Unified Installed Cell是否启用对应路径。
  const t6 = !isSelected;
  // t7 暂存 `<Text backgroundColor="userMessageBackground">MCP</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[127] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Text backgroundColor="userMessageBackground">MCP</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text backgroundColor="userMessageBackground">MCP</Text>;
    // $[127] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[127] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[127] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[127];
  }
  // t8 暂存 `<Text dimColor={t6}>{" "}{t7}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[128] !== t6) {
    // t8 暂存 `<Text dimColor={t6}>{" "}{t7}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text dimColor={t6}>{" "}{t7}</Text>;
    // $[128] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[128] = t6;
    // $[129] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[129] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[129] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[129];
  }
  // t9标记插件命令界面 Unified Installed Cell是否启用对应路径。
  const t9 = !isSelected;
  // t10 暂存 `<Text dimColor={t9}> · {statusIcon_2} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[130] !== statusIcon_2 || $[131] !== t9) {
    // t10 暂存 `<Text dimColor={t9}> · {statusIcon_2} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text dimColor={t9}> · {statusIcon_2} </Text>;
    // $[130] 缓存 `statusIcon_2`，下次依赖未变时 React 编译产物可直接复用。
    $[130] = statusIcon_2;
    // $[131] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[131] = t9;
    // $[132] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[132] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[132] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[132];
  }
  // t11标记插件命令界面 Unified Installed Cell是否启用对应路径。
  const t11 = !isSelected;
  // t12 暂存 `<Text dimColor={t11}>{statusText_1}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[133] !== statusText_1 || $[134] !== t11) {
    // t12 暂存 `<Text dimColor={t11}>{statusText_1}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Text dimColor={t11}>{statusText_1}</Text>;
    // $[133] 缓存 `statusText_1`，下次依赖未变时 React 编译产物可直接复用。
    $[133] = statusText_1;
    // $[134] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[134] = t11;
    // $[135] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[135] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[135] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[135];
  }
  // t13 暂存 `<Box>{t3}{t5}{t8}{t10}{t12}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[136] !== t10 || $[137] !== t12 || $[138] !== t3 || $[139] !== t5 || $[140] !== t8) {
    // t13 暂存 `<Box>{t3}{t5}{t8}{t10}{t12}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Box>{t3}{t5}{t8}{t10}{t12}</Box>;
    // $[136] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[136] = t10;
    // $[137] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[137] = t12;
    // $[138] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[138] = t3;
    // $[139] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[139] = t5;
    // $[140] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[140] = t8;
    // $[141] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[141] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[141] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[141];
  }
  // 返回 `t13`，作为命令处理这次计算的结果。
  return t13;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJCb3giLCJjb2xvciIsIlRleHQiLCJ1c2VUaGVtZSIsInBsdXJhbCIsIlVuaWZpZWRJbnN0YWxsZWRJdGVtIiwiUHJvcHMiLCJpdGVtIiwiaXNTZWxlY3RlZCIsIlVuaWZpZWRJbnN0YWxsZWRDZWxsIiwidDAiLCIkIiwiX2MiLCJ0aGVtZSIsInR5cGUiLCJzdGF0dXNJY29uIiwic3RhdHVzVGV4dCIsInBlbmRpbmdUb2dnbGUiLCJ0MSIsImFycm93UmlnaHQiLCJlcnJvckNvdW50IiwiY3Jvc3MiLCJ0MiIsInQzIiwiaXNFbmFibGVkIiwicmFkaW9PZmYiLCJ0aWNrIiwidW5kZWZpbmVkIiwicG9pbnRlciIsInQ0IiwidDUiLCJuYW1lIiwidDYiLCJ0NyIsIlN5bWJvbCIsImZvciIsInQ4IiwidDkiLCJtYXJrZXRwbGFjZSIsInQxMCIsInQxMSIsInQxMiIsInQxMyIsInQxNCIsIndhcm5pbmciLCJzdGF0dXNJY29uXzAiLCJ0MTUiLCJzdGF0dXNJY29uXzEiLCJzdGF0dXNUZXh0XzAiLCJ0MTYiLCJ0MTciLCJzdGF0dXMiLCJ0cmlhbmdsZVVwT3V0bGluZSIsImluZGVudGVkIiwic3RhdHVzSWNvbl8yIiwic3RhdHVzVGV4dF8xIl0sInNvdXJjZXMiOlsiVW5pZmllZEluc3RhbGxlZENlbGwudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmaWd1cmVzIGZyb20gJ2ZpZ3VyZXMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgY29sb3IsIFRleHQsIHVzZVRoZW1lIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgcGx1cmFsIH0gZnJvbSAnLi4vLi4vdXRpbHMvc3RyaW5nVXRpbHMuanMnXG5pbXBvcnQgdHlwZSB7IFVuaWZpZWRJbnN0YWxsZWRJdGVtIH0gZnJvbSAnLi91bmlmaWVkVHlwZXMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGl0ZW06IFVuaWZpZWRJbnN0YWxsZWRJdGVtXG4gIGlzU2VsZWN0ZWQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFVuaWZpZWRJbnN0YWxsZWRDZWxsKHtcbiAgaXRlbSxcbiAgaXNTZWxlY3RlZCxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3RoZW1lXSA9IHVzZVRoZW1lKClcblxuICBpZiAoaXRlbS50eXBlID09PSAncGx1Z2luJykge1xuICAgIC8vIFN0YXR1cyBpY29uIGFuZCB0ZXh0XG4gICAgbGV0IHN0YXR1c0ljb246IHN0cmluZ1xuICAgIGxldCBzdGF0dXNUZXh0OiBzdHJpbmdcblxuICAgIC8vIFNob3cgcGVuZGluZyB0b2dnbGUgc3RhdHVzIGlmIHNldCwgb3RoZXJ3aXNlIHNob3cgY3VycmVudCBzdGF0dXNcbiAgICBpZiAoaXRlbS5wZW5kaW5nVG9nZ2xlKSB7XG4gICAgICBzdGF0dXNJY29uID0gY29sb3IoJ3N1Z2dlc3Rpb24nLCB0aGVtZSkoZmlndXJlcy5hcnJvd1JpZ2h0KVxuICAgICAgc3RhdHVzVGV4dCA9XG4gICAgICAgIGl0ZW0ucGVuZGluZ1RvZ2dsZSA9PT0gJ3dpbGwtZW5hYmxlJyA/ICd3aWxsIGVuYWJsZScgOiAnd2lsbCBkaXNhYmxlJ1xuICAgIH0gZWxzZSBpZiAoaXRlbS5lcnJvckNvdW50ID4gMCkge1xuICAgICAgc3RhdHVzSWNvbiA9IGNvbG9yKCdlcnJvcicsIHRoZW1lKShmaWd1cmVzLmNyb3NzKVxuICAgICAgc3RhdHVzVGV4dCA9IGAke2l0ZW0uZXJyb3JDb3VudH0gJHtwbHVyYWwoaXRlbS5lcnJvckNvdW50LCAnZXJyb3InKX1gXG4gICAgfSBlbHNlIGlmICghaXRlbS5pc0VuYWJsZWQpIHtcbiAgICAgIHN0YXR1c0ljb24gPSBjb2xvcignaW5hY3RpdmUnLCB0aGVtZSkoZmlndXJlcy5yYWRpb09mZilcbiAgICAgIHN0YXR1c1RleHQgPSAnZGlzYWJsZWQnXG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXR1c0ljb24gPSBjb2xvcignc3VjY2VzcycsIHRoZW1lKShmaWd1cmVzLnRpY2spXG4gICAgICBzdGF0dXNUZXh0ID0gJ2VuYWJsZWQnXG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3g+XG4gICAgICAgIDxUZXh0IGNvbG9yPXtpc1NlbGVjdGVkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfT5cbiAgICAgICAgICB7aXNTZWxlY3RlZCA/IGAke2ZpZ3VyZXMucG9pbnRlcn0gYCA6ICcgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgY29sb3I9e2lzU2VsZWN0ZWQgPyAnc3VnZ2VzdGlvbicgOiB1bmRlZmluZWR9PntpdGVtLm5hbWV9PC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj17IWlzU2VsZWN0ZWR9PlxuICAgICAgICAgIHsnICd9XG4gICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwidXNlck1lc3NhZ2VCYWNrZ3JvdW5kXCI+UGx1Z2luPC9UZXh0PlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPiDCtyB7aXRlbS5tYXJrZXRwbGFjZX08L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNTZWxlY3RlZH0+IMK3IHtzdGF0dXNJY29ufSA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNTZWxlY3RlZH0+e3N0YXR1c1RleHR9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgaWYgKGl0ZW0udHlwZSA9PT0gJ2ZsYWdnZWQtcGx1Z2luJykge1xuICAgIGNvbnN0IHN0YXR1c0ljb24gPSBjb2xvcignd2FybmluZycsIHRoZW1lKShmaWd1cmVzLndhcm5pbmcpXG5cbiAgICByZXR1cm4gKFxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQgY29sb3I9e2lzU2VsZWN0ZWQgPyAnc3VnZ2VzdGlvbicgOiB1bmRlZmluZWR9PlxuICAgICAgICAgIHtpc1NlbGVjdGVkID8gYCR7ZmlndXJlcy5wb2ludGVyfSBgIDogJyAgJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj17aXNTZWxlY3RlZCA/ICdzdWdnZXN0aW9uJyA6IHVuZGVmaW5lZH0+e2l0ZW0ubmFtZX08L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNTZWxlY3RlZH0+XG4gICAgICAgICAgeycgJ31cbiAgICAgICAgICA8VGV4dCBiYWNrZ3JvdW5kQ29sb3I9XCJ1c2VyTWVzc2FnZUJhY2tncm91bmRcIj5QbHVnaW48L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+IMK3IHtpdGVtLm1hcmtldHBsYWNlfTwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I9eyFpc1NlbGVjdGVkfT4gwrcge3N0YXR1c0ljb259IDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I9eyFpc1NlbGVjdGVkfT5yZW1vdmVkPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgaWYgKGl0ZW0udHlwZSA9PT0gJ2ZhaWxlZC1wbHVnaW4nKSB7XG4gICAgY29uc3Qgc3RhdHVzSWNvbiA9IGNvbG9yKCdlcnJvcicsIHRoZW1lKShmaWd1cmVzLmNyb3NzKVxuICAgIGNvbnN0IHN0YXR1c1RleHQgPSBgZmFpbGVkIHRvIGxvYWQgwrcgJHtpdGVtLmVycm9yQ291bnR9ICR7cGx1cmFsKGl0ZW0uZXJyb3JDb3VudCwgJ2Vycm9yJyl9YFxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3g+XG4gICAgICAgIDxUZXh0IGNvbG9yPXtpc1NlbGVjdGVkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfT5cbiAgICAgICAgICB7aXNTZWxlY3RlZCA/IGAke2ZpZ3VyZXMucG9pbnRlcn0gYCA6ICcgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgY29sb3I9e2lzU2VsZWN0ZWQgPyAnc3VnZ2VzdGlvbicgOiB1bmRlZmluZWR9PntpdGVtLm5hbWV9PC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj17IWlzU2VsZWN0ZWR9PlxuICAgICAgICAgIHsnICd9XG4gICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPVwidXNlck1lc3NhZ2VCYWNrZ3JvdW5kXCI+UGx1Z2luPC9UZXh0PlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPiDCtyB7aXRlbS5tYXJrZXRwbGFjZX08L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNTZWxlY3RlZH0+IMK3IHtzdGF0dXNJY29ufSA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNTZWxlY3RlZH0+e3N0YXR1c1RleHR9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgLy8gTUNQIHNlcnZlclxuICBsZXQgc3RhdHVzSWNvbjogc3RyaW5nXG4gIGxldCBzdGF0dXNUZXh0OiBzdHJpbmdcblxuICBpZiAoaXRlbS5zdGF0dXMgPT09ICdjb25uZWN0ZWQnKSB7XG4gICAgc3RhdHVzSWNvbiA9IGNvbG9yKCdzdWNjZXNzJywgdGhlbWUpKGZpZ3VyZXMudGljaylcbiAgICBzdGF0dXNUZXh0ID0gJ2Nvbm5lY3RlZCdcbiAgfSBlbHNlIGlmIChpdGVtLnN0YXR1cyA9PT0gJ2Rpc2FibGVkJykge1xuICAgIHN0YXR1c0ljb24gPSBjb2xvcignaW5hY3RpdmUnLCB0aGVtZSkoZmlndXJlcy5yYWRpb09mZilcbiAgICBzdGF0dXNUZXh0ID0gJ2Rpc2FibGVkJ1xuICB9IGVsc2UgaWYgKGl0ZW0uc3RhdHVzID09PSAncGVuZGluZycpIHtcbiAgICBzdGF0dXNJY29uID0gY29sb3IoJ2luYWN0aXZlJywgdGhlbWUpKGZpZ3VyZXMucmFkaW9PZmYpXG4gICAgc3RhdHVzVGV4dCA9ICdjb25uZWN0aW5n4oCmJ1xuICB9IGVsc2UgaWYgKGl0ZW0uc3RhdHVzID09PSAnbmVlZHMtYXV0aCcpIHtcbiAgICBzdGF0dXNJY29uID0gY29sb3IoJ3dhcm5pbmcnLCB0aGVtZSkoZmlndXJlcy50cmlhbmdsZVVwT3V0bGluZSlcbiAgICBzdGF0dXNUZXh0ID0gJ0VudGVyIHRvIGF1dGgnXG4gIH0gZWxzZSB7XG4gICAgc3RhdHVzSWNvbiA9IGNvbG9yKCdlcnJvcicsIHRoZW1lKShmaWd1cmVzLmNyb3NzKVxuICAgIHN0YXR1c1RleHQgPSAnZmFpbGVkJ1xuICB9XG5cbiAgLy8gSW5kZW50ZWQgTUNQcyAoY2hpbGQgb2YgYSBwbHVnaW4pXG4gIGlmIChpdGVtLmluZGVudGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3g+XG4gICAgICAgIDxUZXh0IGNvbG9yPXtpc1NlbGVjdGVkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfT5cbiAgICAgICAgICB7aXNTZWxlY3RlZCA/IGAke2ZpZ3VyZXMucG9pbnRlcn0gYCA6ICcgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I9eyFpc1NlbGVjdGVkfT7ilJQgPC9UZXh0PlxuICAgICAgICA8VGV4dCBjb2xvcj17aXNTZWxlY3RlZCA/ICdzdWdnZXN0aW9uJyA6IHVuZGVmaW5lZH0+e2l0ZW0ubmFtZX08L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNTZWxlY3RlZH0+XG4gICAgICAgICAgeycgJ31cbiAgICAgICAgICA8VGV4dCBiYWNrZ3JvdW5kQ29sb3I9XCJ1c2VyTWVzc2FnZUJhY2tncm91bmRcIj5NQ1A8L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I9eyFpc1NlbGVjdGVkfT4gwrcge3N0YXR1c0ljb259IDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I9eyFpc1NlbGVjdGVkfT57c3RhdHVzVGV4dH08L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3g+XG4gICAgICA8VGV4dCBjb2xvcj17aXNTZWxlY3RlZCA/ICdzdWdnZXN0aW9uJyA6IHVuZGVmaW5lZH0+XG4gICAgICAgIHtpc1NlbGVjdGVkID8gYCR7ZmlndXJlcy5wb2ludGVyfSBgIDogJyAgJ31cbiAgICAgIDwvVGV4dD5cbiAgICAgIDxUZXh0IGNvbG9yPXtpc1NlbGVjdGVkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfT57aXRlbS5uYW1lfTwvVGV4dD5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNTZWxlY3RlZH0+XG4gICAgICAgIHsnICd9XG4gICAgICAgIDxUZXh0IGJhY2tncm91bmRDb2xvcj1cInVzZXJNZXNzYWdlQmFja2dyb3VuZFwiPk1DUDwvVGV4dD5cbiAgICAgIDwvVGV4dD5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPXshaXNTZWxlY3RlZH0+IMK3IHtzdGF0dXNJY29ufSA8L1RleHQ+XG4gICAgICA8VGV4dCBkaW1Db2xvcj17IWlzU2VsZWN0ZWR9PntzdGF0dXNUZXh0fTwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxHQUFHLEVBQUVDLEtBQUssRUFBRUMsSUFBSSxFQUFFQyxRQUFRLFFBQVEsY0FBYztBQUN6RCxTQUFTQyxNQUFNLFFBQVEsNEJBQTRCO0FBQ25ELGNBQWNDLG9CQUFvQixRQUFRLG1CQUFtQjtBQUU3RCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsSUFBSSxFQUFFRixvQkFBb0I7RUFDMUJHLFVBQVUsRUFBRSxPQUFPO0FBQ3JCLENBQUM7QUFFRCxPQUFPLFNBQUFDLHFCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQThCO0lBQUFMLElBQUE7SUFBQUM7RUFBQSxJQUFBRSxFQUc3QjtFQUNOLE9BQUFHLEtBQUEsSUFBZ0JWLFFBQVEsQ0FBQyxDQUFDO0VBRTFCLElBQUlJLElBQUksQ0FBQU8sSUFBSyxLQUFLLFFBQVE7SUFFcEJDLEdBQUEsQ0FBQUEsVUFBQTtJQUNBQyxHQUFBLENBQUFBLFVBQUE7SUFHSixJQUFJVCxJQUFJLENBQUFVLGFBQWM7TUFBQSxJQUFBQyxFQUFBO01BQUEsSUFBQVAsQ0FBQSxRQUFBRSxLQUFBO1FBQ1BLLEVBQUEsR0FBQWpCLEtBQUssQ0FBQyxZQUFZLEVBQUVZLEtBQUssQ0FBQyxDQUFDZixPQUFPLENBQUFxQixVQUFXLENBQUM7UUFBQVIsQ0FBQSxNQUFBRSxLQUFBO1FBQUFGLENBQUEsTUFBQU8sRUFBQTtNQUFBO1FBQUFBLEVBQUEsR0FBQVAsQ0FBQTtNQUFBO01BQTNESSxVQUFBLENBQUFBLENBQUEsQ0FBYUEsRUFBOEM7TUFDM0RDLFVBQUEsQ0FBQUEsQ0FBQSxDQUNFVCxJQUFJLENBQUFVLGFBQWMsS0FBSyxhQUE4QyxHQUFyRSxhQUFxRSxHQUFyRSxjQUFxRTtJQUQ3RDtNQUVMLElBQUlWLElBQUksQ0FBQWEsVUFBVyxHQUFHLENBQUM7UUFBQSxJQUFBRixFQUFBO1FBQUEsSUFBQVAsQ0FBQSxRQUFBRSxLQUFBO1VBQ2ZLLEVBQUEsR0FBQWpCLEtBQUssQ0FBQyxPQUFPLEVBQUVZLEtBQUssQ0FBQyxDQUFDZixPQUFPLENBQUF1QixLQUFNLENBQUM7VUFBQVYsQ0FBQSxNQUFBRSxLQUFBO1VBQUFGLENBQUEsTUFBQU8sRUFBQTtRQUFBO1VBQUFBLEVBQUEsR0FBQVAsQ0FBQTtRQUFBO1FBQWpESSxVQUFBLENBQUFBLENBQUEsQ0FBYUEsRUFBb0M7UUFDakMsTUFBQU8sRUFBQSxHQUFBZixJQUFJLENBQUFhLFVBQVc7UUFBQSxJQUFBRyxFQUFBO1FBQUEsSUFBQVosQ0FBQSxRQUFBSixJQUFBLENBQUFhLFVBQUE7VUFBSUcsRUFBQSxHQUFBbkIsTUFBTSxDQUFDRyxJQUFJLENBQUFhLFVBQVcsRUFBRSxPQUFPLENBQUM7VUFBQVQsQ0FBQSxNQUFBSixJQUFBLENBQUFhLFVBQUE7VUFBQVQsQ0FBQSxNQUFBWSxFQUFBO1FBQUE7VUFBQUEsRUFBQSxHQUFBWixDQUFBO1FBQUE7UUFBbkVLLFVBQUEsQ0FBQUEsQ0FBQSxDQUFhQSxHQUFHQSxFQUFlQSxJQUFJQSxFQUFnQ0EsRUFBRTtNQUEzRDtRQUNMLElBQUksQ0FBQ1QsSUFBSSxDQUFBaUIsU0FBVTtVQUFBLElBQUFOLEVBQUE7VUFBQSxJQUFBUCxDQUFBLFFBQUFFLEtBQUE7WUFDWEssRUFBQSxHQUFBakIsS0FBSyxDQUFDLFVBQVUsRUFBRVksS0FBSyxDQUFDLENBQUNmLE9BQU8sQ0FBQTJCLFFBQVMsQ0FBQztZQUFBZCxDQUFBLE1BQUFFLEtBQUE7WUFBQUYsQ0FBQSxNQUFBTyxFQUFBO1VBQUE7WUFBQUEsRUFBQSxHQUFBUCxDQUFBO1VBQUE7VUFBdkRJLFVBQUEsQ0FBQUEsQ0FBQSxDQUFhQSxFQUEwQztVQUN2REMsVUFBQSxDQUFBQSxDQUFBLENBQWFBLFVBQVU7UUFBYjtVQUFBLElBQUFFLEVBQUE7VUFBQSxJQUFBUCxDQUFBLFFBQUFFLEtBQUE7WUFFR0ssRUFBQSxHQUFBakIsS0FBSyxDQUFDLFNBQVMsRUFBRVksS0FBSyxDQUFDLENBQUNmLE9BQU8sQ0FBQTRCLElBQUssQ0FBQztZQUFBZixDQUFBLE1BQUFFLEtBQUE7WUFBQUYsQ0FBQSxNQUFBTyxFQUFBO1VBQUE7WUFBQUEsRUFBQSxHQUFBUCxDQUFBO1VBQUE7VUFBbERJLFVBQUEsQ0FBQUEsQ0FBQSxDQUFhQSxFQUFxQztVQUNsREMsVUFBQSxDQUFBQSxDQUFBLENBQWFBLFNBQVM7UUFBWjtNQUNYO0lBQUE7SUFJZ0IsTUFBQUUsRUFBQSxHQUFBVixVQUFVLEdBQVYsWUFBcUMsR0FBckNtQixTQUFxQztJQUMvQyxNQUFBTCxFQUFBLEdBQUFkLFVBQVUsR0FBVixHQUFnQlYsT0FBTyxDQUFBOEIsT0FBUSxHQUFVLEdBQXpDLElBQXlDO0lBQUEsSUFBQUwsRUFBQTtJQUFBLElBQUFaLENBQUEsU0FBQU8sRUFBQSxJQUFBUCxDQUFBLFNBQUFXLEVBQUE7TUFENUNDLEVBQUEsSUFBQyxJQUFJLENBQVEsS0FBcUMsQ0FBckMsQ0FBQUwsRUFBb0MsQ0FBQyxDQUMvQyxDQUFBSSxFQUF3QyxDQUMzQyxFQUZDLElBQUksQ0FFRTtNQUFBWCxDQUFBLE9BQUFPLEVBQUE7TUFBQVAsQ0FBQSxPQUFBVyxFQUFBO01BQUFYLENBQUEsT0FBQVksRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQVosQ0FBQTtJQUFBO0lBQ00sTUFBQWtCLEVBQUEsR0FBQXJCLFVBQVUsR0FBVixZQUFxQyxHQUFyQ21CLFNBQXFDO0lBQUEsSUFBQUcsRUFBQTtJQUFBLElBQUFuQixDQUFBLFNBQUFKLElBQUEsQ0FBQXdCLElBQUEsSUFBQXBCLENBQUEsU0FBQWtCLEVBQUE7TUFBbERDLEVBQUEsSUFBQyxJQUFJLENBQVEsS0FBcUMsQ0FBckMsQ0FBQUQsRUFBb0MsQ0FBQyxDQUFHLENBQUF0QixJQUFJLENBQUF3QixJQUFJLENBQUUsRUFBOUQsSUFBSSxDQUFpRTtNQUFBcEIsQ0FBQSxPQUFBSixJQUFBLENBQUF3QixJQUFBO01BQUFwQixDQUFBLE9BQUFrQixFQUFBO01BQUFsQixDQUFBLE9BQUFtQixFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBbkIsQ0FBQTtJQUFBO0lBQ3RELE1BQUFxQixFQUFBLElBQUN4QixVQUFVO0lBQUEsSUFBQXlCLEVBQUE7SUFBQSxJQUFBdEIsQ0FBQSxTQUFBdUIsTUFBQSxDQUFBQyxHQUFBO01BRXpCRixFQUFBLElBQUMsSUFBSSxDQUFpQixlQUF1QixDQUF2Qix1QkFBdUIsQ0FBQyxNQUFNLEVBQW5ELElBQUksQ0FBc0Q7TUFBQXRCLENBQUEsT0FBQXNCLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUF0QixDQUFBO0lBQUE7SUFBQSxJQUFBeUIsRUFBQTtJQUFBLElBQUF6QixDQUFBLFNBQUFxQixFQUFBO01BRjdESSxFQUFBLElBQUMsSUFBSSxDQUFXLFFBQVcsQ0FBWCxDQUFBSixFQUFVLENBQUMsQ0FDeEIsSUFBRSxDQUNILENBQUFDLEVBQTBELENBQzVELEVBSEMsSUFBSSxDQUdFO01BQUF0QixDQUFBLE9BQUFxQixFQUFBO01BQUFyQixDQUFBLE9BQUF5QixFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBekIsQ0FBQTtJQUFBO0lBQUEsSUFBQTBCLEVBQUE7SUFBQSxJQUFBMUIsQ0FBQSxTQUFBSixJQUFBLENBQUErQixXQUFBO01BQ1BELEVBQUEsSUFBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLEdBQUksQ0FBQTlCLElBQUksQ0FBQStCLFdBQVcsQ0FBRSxFQUFuQyxJQUFJLENBQXNDO01BQUEzQixDQUFBLE9BQUFKLElBQUEsQ0FBQStCLFdBQUE7TUFBQTNCLENBQUEsT0FBQTBCLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUExQixDQUFBO0lBQUE7SUFDM0IsTUFBQTRCLEdBQUEsSUFBQy9CLFVBQVU7SUFBQSxJQUFBZ0MsR0FBQTtJQUFBLElBQUE3QixDQUFBLFNBQUFJLFVBQUEsSUFBQUosQ0FBQSxTQUFBNEIsR0FBQTtNQUEzQkMsR0FBQSxJQUFDLElBQUksQ0FBVyxRQUFXLENBQVgsQ0FBQUQsR0FBVSxDQUFDLENBQUUsR0FBSXhCLFdBQVMsQ0FBRSxDQUFDLEVBQTVDLElBQUksQ0FBK0M7TUFBQUosQ0FBQSxPQUFBSSxVQUFBO01BQUFKLENBQUEsT0FBQTRCLEdBQUE7TUFBQTVCLENBQUEsT0FBQTZCLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUE3QixDQUFBO0lBQUE7SUFDcEMsTUFBQThCLEdBQUEsSUFBQ2pDLFVBQVU7SUFBQSxJQUFBa0MsR0FBQTtJQUFBLElBQUEvQixDQUFBLFNBQUFLLFVBQUEsSUFBQUwsQ0FBQSxTQUFBOEIsR0FBQTtNQUEzQkMsR0FBQSxJQUFDLElBQUksQ0FBVyxRQUFXLENBQVgsQ0FBQUQsR0FBVSxDQUFDLENBQUd6QixXQUFTLENBQUUsRUFBeEMsSUFBSSxDQUEyQztNQUFBTCxDQUFBLE9BQUFLLFVBQUE7TUFBQUwsQ0FBQSxPQUFBOEIsR0FBQTtNQUFBOUIsQ0FBQSxPQUFBK0IsR0FBQTtJQUFBO01BQUFBLEdBQUEsR0FBQS9CLENBQUE7SUFBQTtJQUFBLElBQUFnQyxHQUFBO0lBQUEsSUFBQWhDLENBQUEsU0FBQTZCLEdBQUEsSUFBQTdCLENBQUEsU0FBQStCLEdBQUEsSUFBQS9CLENBQUEsU0FBQVksRUFBQSxJQUFBWixDQUFBLFNBQUFtQixFQUFBLElBQUFuQixDQUFBLFNBQUF5QixFQUFBLElBQUF6QixDQUFBLFNBQUEwQixFQUFBO01BWGxETSxHQUFBLElBQUMsR0FBRyxDQUNGLENBQUFwQixFQUVNLENBQ04sQ0FBQU8sRUFBcUUsQ0FDckUsQ0FBQU0sRUFHTSxDQUNOLENBQUFDLEVBQTBDLENBQzFDLENBQUFHLEdBQW1ELENBQ25ELENBQUFFLEdBQStDLENBQ2pELEVBWkMsR0FBRyxDQVlFO01BQUEvQixDQUFBLE9BQUE2QixHQUFBO01BQUE3QixDQUFBLE9BQUErQixHQUFBO01BQUEvQixDQUFBLE9BQUFZLEVBQUE7TUFBQVosQ0FBQSxPQUFBbUIsRUFBQTtNQUFBbkIsQ0FBQSxPQUFBeUIsRUFBQTtNQUFBekIsQ0FBQSxPQUFBMEIsRUFBQTtNQUFBMUIsQ0FBQSxPQUFBZ0MsR0FBQTtJQUFBO01BQUFBLEdBQUEsR0FBQWhDLENBQUE7SUFBQTtJQUFBLE9BWk5nQyxHQVlNO0VBQUE7RUFJVixJQUFJcEMsSUFBSSxDQUFBTyxJQUFLLEtBQUssZ0JBQWdCO0lBQUEsSUFBQUksRUFBQTtJQUFBLElBQUFQLENBQUEsU0FBQUUsS0FBQTtNQUNiSyxFQUFBLEdBQUFqQixLQUFLLENBQUMsU0FBUyxFQUFFWSxLQUFLLENBQUMsQ0FBQ2YsT0FBTyxDQUFBOEMsT0FBUSxDQUFDO01BQUFqQyxDQUFBLE9BQUFFLEtBQUE7TUFBQUYsQ0FBQSxPQUFBTyxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBUCxDQUFBO0lBQUE7SUFBM0QsTUFBQWtDLFlBQUEsR0FBbUIzQixFQUF3QztJQUkxQyxNQUFBSSxFQUFBLEdBQUFkLFVBQVUsR0FBVixZQUFxQyxHQUFyQ21CLFNBQXFDO0lBQy9DLE1BQUFKLEVBQUEsR0FBQWYsVUFBVSxHQUFWLEdBQWdCVixPQUFPLENBQUE4QixPQUFRLEdBQVUsR0FBekMsSUFBeUM7SUFBQSxJQUFBQyxFQUFBO0lBQUEsSUFBQWxCLENBQUEsU0FBQVcsRUFBQSxJQUFBWCxDQUFBLFNBQUFZLEVBQUE7TUFENUNNLEVBQUEsSUFBQyxJQUFJLENBQVEsS0FBcUMsQ0FBckMsQ0FBQVAsRUFBb0MsQ0FBQyxDQUMvQyxDQUFBQyxFQUF3QyxDQUMzQyxFQUZDLElBQUksQ0FFRTtNQUFBWixDQUFBLE9BQUFXLEVBQUE7TUFBQVgsQ0FBQSxPQUFBWSxFQUFBO01BQUFaLENBQUEsT0FBQWtCLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFsQixDQUFBO0lBQUE7SUFDTSxNQUFBbUIsRUFBQSxHQUFBdEIsVUFBVSxHQUFWLFlBQXFDLEdBQXJDbUIsU0FBcUM7SUFBQSxJQUFBSyxFQUFBO0lBQUEsSUFBQXJCLENBQUEsU0FBQUosSUFBQSxDQUFBd0IsSUFBQSxJQUFBcEIsQ0FBQSxTQUFBbUIsRUFBQTtNQUFsREUsRUFBQSxJQUFDLElBQUksQ0FBUSxLQUFxQyxDQUFyQyxDQUFBRixFQUFvQyxDQUFDLENBQUcsQ0FBQXZCLElBQUksQ0FBQXdCLElBQUksQ0FBRSxFQUE5RCxJQUFJLENBQWlFO01BQUFwQixDQUFBLE9BQUFKLElBQUEsQ0FBQXdCLElBQUE7TUFBQXBCLENBQUEsT0FBQW1CLEVBQUE7TUFBQW5CLENBQUEsT0FBQXFCLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFyQixDQUFBO0lBQUE7SUFDdEQsTUFBQXNCLEVBQUEsSUFBQ3pCLFVBQVU7SUFBQSxJQUFBNEIsRUFBQTtJQUFBLElBQUF6QixDQUFBLFNBQUF1QixNQUFBLENBQUFDLEdBQUE7TUFFekJDLEVBQUEsSUFBQyxJQUFJLENBQWlCLGVBQXVCLENBQXZCLHVCQUF1QixDQUFDLE1BQU0sRUFBbkQsSUFBSSxDQUFzRDtNQUFBekIsQ0FBQSxPQUFBeUIsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQXpCLENBQUE7SUFBQTtJQUFBLElBQUEwQixFQUFBO0lBQUEsSUFBQTFCLENBQUEsU0FBQXNCLEVBQUE7TUFGN0RJLEVBQUEsSUFBQyxJQUFJLENBQVcsUUFBVyxDQUFYLENBQUFKLEVBQVUsQ0FBQyxDQUN4QixJQUFFLENBQ0gsQ0FBQUcsRUFBMEQsQ0FDNUQsRUFIQyxJQUFJLENBR0U7TUFBQXpCLENBQUEsT0FBQXNCLEVBQUE7TUFBQXRCLENBQUEsT0FBQTBCLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUExQixDQUFBO0lBQUE7SUFBQSxJQUFBNEIsR0FBQTtJQUFBLElBQUE1QixDQUFBLFNBQUFKLElBQUEsQ0FBQStCLFdBQUE7TUFDUEMsR0FBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsR0FBSSxDQUFBaEMsSUFBSSxDQUFBK0IsV0FBVyxDQUFFLEVBQW5DLElBQUksQ0FBc0M7TUFBQTNCLENBQUEsT0FBQUosSUFBQSxDQUFBK0IsV0FBQTtNQUFBM0IsQ0FBQSxPQUFBNEIsR0FBQTtJQUFBO01BQUFBLEdBQUEsR0FBQTVCLENBQUE7SUFBQTtJQUMzQixNQUFBNkIsR0FBQSxJQUFDaEMsVUFBVTtJQUFBLElBQUFpQyxHQUFBO0lBQUEsSUFBQTlCLENBQUEsU0FBQWtDLFlBQUEsSUFBQWxDLENBQUEsU0FBQTZCLEdBQUE7TUFBM0JDLEdBQUEsSUFBQyxJQUFJLENBQVcsUUFBVyxDQUFYLENBQUFELEdBQVUsQ0FBQyxDQUFFLEdBQUl6QixhQUFTLENBQUUsQ0FBQyxFQUE1QyxJQUFJLENBQStDO01BQUFKLENBQUEsT0FBQWtDLFlBQUE7TUFBQWxDLENBQUEsT0FBQTZCLEdBQUE7TUFBQTdCLENBQUEsT0FBQThCLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUE5QixDQUFBO0lBQUE7SUFDcEMsTUFBQStCLEdBQUEsSUFBQ2xDLFVBQVU7SUFBQSxJQUFBbUMsR0FBQTtJQUFBLElBQUFoQyxDQUFBLFNBQUErQixHQUFBO01BQTNCQyxHQUFBLElBQUMsSUFBSSxDQUFXLFFBQVcsQ0FBWCxDQUFBRCxHQUFVLENBQUMsQ0FBRSxPQUFPLEVBQW5DLElBQUksQ0FBc0M7TUFBQS9CLENBQUEsT0FBQStCLEdBQUE7TUFBQS9CLENBQUEsT0FBQWdDLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUFoQyxDQUFBO0lBQUE7SUFBQSxJQUFBbUMsR0FBQTtJQUFBLElBQUFuQyxDQUFBLFNBQUE0QixHQUFBLElBQUE1QixDQUFBLFNBQUE4QixHQUFBLElBQUE5QixDQUFBLFNBQUFnQyxHQUFBLElBQUFoQyxDQUFBLFNBQUFrQixFQUFBLElBQUFsQixDQUFBLFNBQUFxQixFQUFBLElBQUFyQixDQUFBLFNBQUEwQixFQUFBO01BWDdDUyxHQUFBLElBQUMsR0FBRyxDQUNGLENBQUFqQixFQUVNLENBQ04sQ0FBQUcsRUFBcUUsQ0FDckUsQ0FBQUssRUFHTSxDQUNOLENBQUFFLEdBQTBDLENBQzFDLENBQUFFLEdBQW1ELENBQ25ELENBQUFFLEdBQTBDLENBQzVDLEVBWkMsR0FBRyxDQVlFO01BQUFoQyxDQUFBLE9BQUE0QixHQUFBO01BQUE1QixDQUFBLE9BQUE4QixHQUFBO01BQUE5QixDQUFBLE9BQUFnQyxHQUFBO01BQUFoQyxDQUFBLE9BQUFrQixFQUFBO01BQUFsQixDQUFBLE9BQUFxQixFQUFBO01BQUFyQixDQUFBLE9BQUEwQixFQUFBO01BQUExQixDQUFBLE9BQUFtQyxHQUFBO0lBQUE7TUFBQUEsR0FBQSxHQUFBbkMsQ0FBQTtJQUFBO0lBQUEsT0FaTm1DLEdBWU07RUFBQTtFQUlWLElBQUl2QyxJQUFJLENBQUFPLElBQUssS0FBSyxlQUFlO0lBQUEsSUFBQUksRUFBQTtJQUFBLElBQUFQLENBQUEsU0FBQUUsS0FBQTtNQUNaSyxFQUFBLEdBQUFqQixLQUFLLENBQUMsT0FBTyxFQUFFWSxLQUFLLENBQUMsQ0FBQ2YsT0FBTyxDQUFBdUIsS0FBTSxDQUFDO01BQUFWLENBQUEsT0FBQUUsS0FBQTtNQUFBRixDQUFBLE9BQUFPLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFQLENBQUE7SUFBQTtJQUF2RCxNQUFBb0MsWUFBQSxHQUFtQjdCLEVBQW9DO0lBQ2hCLE1BQUFJLEVBQUEsR0FBQWYsSUFBSSxDQUFBYSxVQUFXO0lBQUEsSUFBQUcsRUFBQTtJQUFBLElBQUFaLENBQUEsU0FBQUosSUFBQSxDQUFBYSxVQUFBO01BQUlHLEVBQUEsR0FBQW5CLE1BQU0sQ0FBQ0csSUFBSSxDQUFBYSxVQUFXLEVBQUUsT0FBTyxDQUFDO01BQUFULENBQUEsT0FBQUosSUFBQSxDQUFBYSxVQUFBO01BQUFULENBQUEsT0FBQVksRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQVosQ0FBQTtJQUFBO0lBQTFGLE1BQUFxQyxZQUFBLEdBQW1CLG9CQUFvQjFCLEVBQWUsSUFBSUMsRUFBZ0MsRUFBRTtJQUkzRSxNQUFBTSxFQUFBLEdBQUFyQixVQUFVLEdBQVYsWUFBcUMsR0FBckNtQixTQUFxQztJQUMvQyxNQUFBRyxFQUFBLEdBQUF0QixVQUFVLEdBQVYsR0FBZ0JWLE9BQU8sQ0FBQThCLE9BQVEsR0FBVSxHQUF6QyxJQUF5QztJQUFBLElBQUFJLEVBQUE7SUFBQSxJQUFBckIsQ0FBQSxTQUFBa0IsRUFBQSxJQUFBbEIsQ0FBQSxTQUFBbUIsRUFBQTtNQUQ1Q0UsRUFBQSxJQUFDLElBQUksQ0FBUSxLQUFxQyxDQUFyQyxDQUFBSCxFQUFvQyxDQUFDLENBQy9DLENBQUFDLEVBQXdDLENBQzNDLEVBRkMsSUFBSSxDQUVFO01BQUFuQixDQUFBLE9BQUFrQixFQUFBO01BQUFsQixDQUFBLE9BQUFtQixFQUFBO01BQUFuQixDQUFBLE9BQUFxQixFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBckIsQ0FBQTtJQUFBO0lBQ00sTUFBQXNCLEVBQUEsR0FBQXpCLFVBQVUsR0FBVixZQUFxQyxHQUFyQ21CLFNBQXFDO0lBQUEsSUFBQVMsRUFBQTtJQUFBLElBQUF6QixDQUFBLFNBQUFKLElBQUEsQ0FBQXdCLElBQUEsSUFBQXBCLENBQUEsU0FBQXNCLEVBQUE7TUFBbERHLEVBQUEsSUFBQyxJQUFJLENBQVEsS0FBcUMsQ0FBckMsQ0FBQUgsRUFBb0MsQ0FBQyxDQUFHLENBQUExQixJQUFJLENBQUF3QixJQUFJLENBQUUsRUFBOUQsSUFBSSxDQUFpRTtNQUFBcEIsQ0FBQSxPQUFBSixJQUFBLENBQUF3QixJQUFBO01BQUFwQixDQUFBLE9BQUFzQixFQUFBO01BQUF0QixDQUFBLE9BQUF5QixFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBekIsQ0FBQTtJQUFBO0lBQ3RELE1BQUEwQixFQUFBLElBQUM3QixVQUFVO0lBQUEsSUFBQStCLEdBQUE7SUFBQSxJQUFBNUIsQ0FBQSxTQUFBdUIsTUFBQSxDQUFBQyxHQUFBO01BRXpCSSxHQUFBLElBQUMsSUFBSSxDQUFpQixlQUF1QixDQUF2Qix1QkFBdUIsQ0FBQyxNQUFNLEVBQW5ELElBQUksQ0FBc0Q7TUFBQTVCLENBQUEsT0FBQTRCLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUE1QixDQUFBO0lBQUE7SUFBQSxJQUFBNkIsR0FBQTtJQUFBLElBQUE3QixDQUFBLFNBQUEwQixFQUFBO01BRjdERyxHQUFBLElBQUMsSUFBSSxDQUFXLFFBQVcsQ0FBWCxDQUFBSCxFQUFVLENBQUMsQ0FDeEIsSUFBRSxDQUNILENBQUFFLEdBQTBELENBQzVELEVBSEMsSUFBSSxDQUdFO01BQUE1QixDQUFBLE9BQUEwQixFQUFBO01BQUExQixDQUFBLE9BQUE2QixHQUFBO0lBQUE7TUFBQUEsR0FBQSxHQUFBN0IsQ0FBQTtJQUFBO0lBQUEsSUFBQThCLEdBQUE7SUFBQSxJQUFBOUIsQ0FBQSxTQUFBSixJQUFBLENBQUErQixXQUFBO01BQ1BHLEdBQUEsSUFBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLEdBQUksQ0FBQWxDLElBQUksQ0FBQStCLFdBQVcsQ0FBRSxFQUFuQyxJQUFJLENBQXNDO01BQUEzQixDQUFBLE9BQUFKLElBQUEsQ0FBQStCLFdBQUE7TUFBQTNCLENBQUEsT0FBQThCLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUE5QixDQUFBO0lBQUE7SUFDM0IsTUFBQStCLEdBQUEsSUFBQ2xDLFVBQVU7SUFBQSxJQUFBbUMsR0FBQTtJQUFBLElBQUFoQyxDQUFBLFNBQUFvQyxZQUFBLElBQUFwQyxDQUFBLFNBQUErQixHQUFBO01BQTNCQyxHQUFBLElBQUMsSUFBSSxDQUFXLFFBQVcsQ0FBWCxDQUFBRCxHQUFVLENBQUMsQ0FBRSxHQUFJM0IsYUFBUyxDQUFFLENBQUMsRUFBNUMsSUFBSSxDQUErQztNQUFBSixDQUFBLE9BQUFvQyxZQUFBO01BQUFwQyxDQUFBLE9BQUErQixHQUFBO01BQUEvQixDQUFBLE9BQUFnQyxHQUFBO0lBQUE7TUFBQUEsR0FBQSxHQUFBaEMsQ0FBQTtJQUFBO0lBQ3BDLE1BQUFtQyxHQUFBLElBQUN0QyxVQUFVO0lBQUEsSUFBQXlDLEdBQUE7SUFBQSxJQUFBdEMsQ0FBQSxTQUFBcUMsWUFBQSxJQUFBckMsQ0FBQSxTQUFBbUMsR0FBQTtNQUEzQkcsR0FBQSxJQUFDLElBQUksQ0FBVyxRQUFXLENBQVgsQ0FBQUgsR0FBVSxDQUFDLENBQUc5QixhQUFTLENBQUUsRUFBeEMsSUFBSSxDQUEyQztNQUFBTCxDQUFBLE9BQUFxQyxZQUFBO01BQUFyQyxDQUFBLE9BQUFtQyxHQUFBO01BQUFuQyxDQUFBLE9BQUFzQyxHQUFBO0lBQUE7TUFBQUEsR0FBQSxHQUFBdEMsQ0FBQTtJQUFBO0lBQUEsSUFBQXVDLEdBQUE7SUFBQSxJQUFBdkMsQ0FBQSxTQUFBNkIsR0FBQSxJQUFBN0IsQ0FBQSxTQUFBOEIsR0FBQSxJQUFBOUIsQ0FBQSxTQUFBZ0MsR0FBQSxJQUFBaEMsQ0FBQSxTQUFBc0MsR0FBQSxJQUFBdEMsQ0FBQSxTQUFBcUIsRUFBQSxJQUFBckIsQ0FBQSxTQUFBeUIsRUFBQTtNQVhsRGMsR0FBQSxJQUFDLEdBQUcsQ0FDRixDQUFBbEIsRUFFTSxDQUNOLENBQUFJLEVBQXFFLENBQ3JFLENBQUFJLEdBR00sQ0FDTixDQUFBQyxHQUEwQyxDQUMxQyxDQUFBRSxHQUFtRCxDQUNuRCxDQUFBTSxHQUErQyxDQUNqRCxFQVpDLEdBQUcsQ0FZRTtNQUFBdEMsQ0FBQSxPQUFBNkIsR0FBQTtNQUFBN0IsQ0FBQSxPQUFBOEIsR0FBQTtNQUFBOUIsQ0FBQSxPQUFBZ0MsR0FBQTtNQUFBaEMsQ0FBQSxPQUFBc0MsR0FBQTtNQUFBdEMsQ0FBQSxPQUFBcUIsRUFBQTtNQUFBckIsQ0FBQSxPQUFBeUIsRUFBQTtNQUFBekIsQ0FBQSxPQUFBdUMsR0FBQTtJQUFBO01BQUFBLEdBQUEsR0FBQXZDLENBQUE7SUFBQTtJQUFBLE9BWk51QyxHQVlNO0VBQUE7RUFLTm5DLEdBQUEsQ0FBQUEsWUFBQTtFQUNBQyxHQUFBLENBQUFBLFlBQUE7RUFFSixJQUFJVCxJQUFJLENBQUE0QyxNQUFPLEtBQUssV0FBVztJQUFBLElBQUFqQyxFQUFBO0lBQUEsSUFBQVAsQ0FBQSxTQUFBRSxLQUFBO01BQ2hCSyxFQUFBLEdBQUFqQixLQUFLLENBQUMsU0FBUyxFQUFFWSxLQUFLLENBQUMsQ0FBQ2YsT0FBTyxDQUFBNEIsSUFBSyxDQUFDO01BQUFmLENBQUEsT0FBQUUsS0FBQTtNQUFBRixDQUFBLE9BQUFPLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFQLENBQUE7SUFBQTtJQUFsREksWUFBQSxDQUFBQSxDQUFBLENBQWFBLEVBQXFDO0lBQ2xEQyxZQUFBLENBQUFBLENBQUEsQ0FBYUEsV0FBVztFQUFkO0lBQ0wsSUFBSVQsSUFBSSxDQUFBNEMsTUFBTyxLQUFLLFVBQVU7TUFBQSxJQUFBakMsRUFBQTtNQUFBLElBQUFQLENBQUEsU0FBQUUsS0FBQTtRQUN0QkssRUFBQSxHQUFBakIsS0FBSyxDQUFDLFVBQVUsRUFBRVksS0FBSyxDQUFDLENBQUNmLE9BQU8sQ0FBQTJCLFFBQVMsQ0FBQztRQUFBZCxDQUFBLE9BQUFFLEtBQUE7UUFBQUYsQ0FBQSxPQUFBTyxFQUFBO01BQUE7UUFBQUEsRUFBQSxHQUFBUCxDQUFBO01BQUE7TUFBdkRJLFlBQUEsQ0FBQUEsQ0FBQSxDQUFhQSxFQUEwQztNQUN2REMsWUFBQSxDQUFBQSxDQUFBLENBQWFBLFVBQVU7SUFBYjtNQUNMLElBQUlULElBQUksQ0FBQTRDLE1BQU8sS0FBSyxTQUFTO1FBQUEsSUFBQWpDLEVBQUE7UUFBQSxJQUFBUCxDQUFBLFNBQUFFLEtBQUE7VUFDckJLLEVBQUEsR0FBQWpCLEtBQUssQ0FBQyxVQUFVLEVBQUVZLEtBQUssQ0FBQyxDQUFDZixPQUFPLENBQUEyQixRQUFTLENBQUM7VUFBQWQsQ0FBQSxPQUFBRSxLQUFBO1VBQUFGLENBQUEsT0FBQU8sRUFBQTtRQUFBO1VBQUFBLEVBQUEsR0FBQVAsQ0FBQTtRQUFBO1FBQXZESSxZQUFBLENBQUFBLENBQUEsQ0FBYUEsRUFBMEM7UUFDdkRDLFlBQUEsQ0FBQUEsQ0FBQSxDQUFhQSxrQkFBYTtNQUFoQjtRQUNMLElBQUlULElBQUksQ0FBQTRDLE1BQU8sS0FBSyxZQUFZO1VBQUEsSUFBQWpDLEVBQUE7VUFBQSxJQUFBUCxDQUFBLFNBQUFFLEtBQUE7WUFDeEJLLEVBQUEsR0FBQWpCLEtBQUssQ0FBQyxTQUFTLEVBQUVZLEtBQUssQ0FBQyxDQUFDZixPQUFPLENBQUFzRCxpQkFBa0IsQ0FBQztZQUFBekMsQ0FBQSxPQUFBRSxLQUFBO1lBQUFGLENBQUEsT0FBQU8sRUFBQTtVQUFBO1lBQUFBLEVBQUEsR0FBQVAsQ0FBQTtVQUFBO1VBQS9ESSxZQUFBLENBQUFBLENBQUEsQ0FBYUEsRUFBa0Q7VUFDL0RDLFlBQUEsQ0FBQUEsQ0FBQSxDQUFhQSxlQUFlO1FBQWxCO1VBQUEsSUFBQUUsRUFBQTtVQUFBLElBQUFQLENBQUEsU0FBQUUsS0FBQTtZQUVHSyxFQUFBLEdBQUFqQixLQUFLLENBQUMsT0FBTyxFQUFFWSxLQUFLLENBQUMsQ0FBQ2YsT0FBTyxDQUFBdUIsS0FBTSxDQUFDO1lBQUFWLENBQUEsT0FBQUUsS0FBQTtZQUFBRixDQUFBLE9BQUFPLEVBQUE7VUFBQTtZQUFBQSxFQUFBLEdBQUFQLENBQUE7VUFBQTtVQUFqREksWUFBQSxDQUFBQSxDQUFBLENBQWFBLEVBQW9DO1VBQ2pEQyxZQUFBLENBQUFBLENBQUEsQ0FBYUEsUUFBUTtRQUFYO01BQ1g7SUFBQTtFQUFBO0VBR0QsSUFBSVQsSUFBSSxDQUFBOEMsUUFBUztJQUdFLE1BQUFuQyxFQUFBLEdBQUFWLFVBQVUsR0FBVixZQUFxQyxHQUFyQ21CLFNBQXFDO0lBQy9DLE1BQUFMLEVBQUEsR0FBQWQsVUFBVSxHQUFWLEdBQWdCVixPQUFPLENBQUE4QixPQUFRLEdBQVUsR0FBekMsSUFBeUM7SUFBQSxJQUFBTCxFQUFBO0lBQUEsSUFBQVosQ0FBQSxTQUFBTyxFQUFBLElBQUFQLENBQUEsU0FBQVcsRUFBQTtNQUQ1Q0MsRUFBQSxJQUFDLElBQUksQ0FBUSxLQUFxQyxDQUFyQyxDQUFBTCxFQUFvQyxDQUFDLENBQy9DLENBQUFJLEVBQXdDLENBQzNDLEVBRkMsSUFBSSxDQUVFO01BQUFYLENBQUEsT0FBQU8sRUFBQTtNQUFBUCxDQUFBLE9BQUFXLEVBQUE7TUFBQVgsQ0FBQSxPQUFBWSxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBWixDQUFBO0lBQUE7SUFDUyxNQUFBa0IsRUFBQSxJQUFDckIsVUFBVTtJQUFBLElBQUFzQixFQUFBO0lBQUEsSUFBQW5CLENBQUEsVUFBQWtCLEVBQUE7TUFBM0JDLEVBQUEsSUFBQyxJQUFJLENBQVcsUUFBVyxDQUFYLENBQUFELEVBQVUsQ0FBQyxDQUFFLEVBQUUsRUFBOUIsSUFBSSxDQUFpQztNQUFBbEIsQ0FBQSxRQUFBa0IsRUFBQTtNQUFBbEIsQ0FBQSxRQUFBbUIsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQW5CLENBQUE7SUFBQTtJQUN6QixNQUFBcUIsRUFBQSxHQUFBeEIsVUFBVSxHQUFWLFlBQXFDLEdBQXJDbUIsU0FBcUM7SUFBQSxJQUFBTSxFQUFBO0lBQUEsSUFBQXRCLENBQUEsVUFBQUosSUFBQSxDQUFBd0IsSUFBQSxJQUFBcEIsQ0FBQSxVQUFBcUIsRUFBQTtNQUFsREMsRUFBQSxJQUFDLElBQUksQ0FBUSxLQUFxQyxDQUFyQyxDQUFBRCxFQUFvQyxDQUFDLENBQUcsQ0FBQXpCLElBQUksQ0FBQXdCLElBQUksQ0FBRSxFQUE5RCxJQUFJLENBQWlFO01BQUFwQixDQUFBLFFBQUFKLElBQUEsQ0FBQXdCLElBQUE7TUFBQXBCLENBQUEsUUFBQXFCLEVBQUE7TUFBQXJCLENBQUEsUUFBQXNCLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUF0QixDQUFBO0lBQUE7SUFDdEQsTUFBQXlCLEVBQUEsSUFBQzVCLFVBQVU7SUFBQSxJQUFBNkIsRUFBQTtJQUFBLElBQUExQixDQUFBLFVBQUF1QixNQUFBLENBQUFDLEdBQUE7TUFFekJFLEVBQUEsSUFBQyxJQUFJLENBQWlCLGVBQXVCLENBQXZCLHVCQUF1QixDQUFDLEdBQUcsRUFBaEQsSUFBSSxDQUFtRDtNQUFBMUIsQ0FBQSxRQUFBMEIsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQTFCLENBQUE7SUFBQTtJQUFBLElBQUE0QixHQUFBO0lBQUEsSUFBQTVCLENBQUEsVUFBQXlCLEVBQUE7TUFGMURHLEdBQUEsSUFBQyxJQUFJLENBQVcsUUFBVyxDQUFYLENBQUFILEVBQVUsQ0FBQyxDQUN4QixJQUFFLENBQ0gsQ0FBQUMsRUFBdUQsQ0FDekQsRUFIQyxJQUFJLENBR0U7TUFBQTFCLENBQUEsUUFBQXlCLEVBQUE7TUFBQXpCLENBQUEsUUFBQTRCLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUE1QixDQUFBO0lBQUE7SUFDUyxNQUFBNkIsR0FBQSxJQUFDaEMsVUFBVTtJQUFBLElBQUFpQyxHQUFBO0lBQUEsSUFBQTlCLENBQUEsVUFBQTJDLFlBQUEsSUFBQTNDLENBQUEsVUFBQTZCLEdBQUE7TUFBM0JDLEdBQUEsSUFBQyxJQUFJLENBQVcsUUFBVyxDQUFYLENBQUFELEdBQVUsQ0FBQyxDQUFFLEdBQUl6QixhQUFTLENBQUUsQ0FBQyxFQUE1QyxJQUFJLENBQStDO01BQUFKLENBQUEsUUFBQTJDLFlBQUE7TUFBQTNDLENBQUEsUUFBQTZCLEdBQUE7TUFBQTdCLENBQUEsUUFBQThCLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUE5QixDQUFBO0lBQUE7SUFDcEMsTUFBQStCLEdBQUEsSUFBQ2xDLFVBQVU7SUFBQSxJQUFBbUMsR0FBQTtJQUFBLElBQUFoQyxDQUFBLFVBQUE0QyxZQUFBLElBQUE1QyxDQUFBLFVBQUErQixHQUFBO01BQTNCQyxHQUFBLElBQUMsSUFBSSxDQUFXLFFBQVcsQ0FBWCxDQUFBRCxHQUFVLENBQUMsQ0FBRzFCLGFBQVMsQ0FBRSxFQUF4QyxJQUFJLENBQTJDO01BQUFMLENBQUEsUUFBQTRDLFlBQUE7TUFBQTVDLENBQUEsUUFBQStCLEdBQUE7TUFBQS9CLENBQUEsUUFBQWdDLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUFoQyxDQUFBO0lBQUE7SUFBQSxJQUFBbUMsR0FBQTtJQUFBLElBQUFuQyxDQUFBLFVBQUE0QixHQUFBLElBQUE1QixDQUFBLFVBQUE4QixHQUFBLElBQUE5QixDQUFBLFVBQUFnQyxHQUFBLElBQUFoQyxDQUFBLFVBQUFZLEVBQUEsSUFBQVosQ0FBQSxVQUFBbUIsRUFBQSxJQUFBbkIsQ0FBQSxVQUFBc0IsRUFBQTtNQVhsRGEsR0FBQSxJQUFDLEdBQUcsQ0FDRixDQUFBdkIsRUFFTSxDQUNOLENBQUFPLEVBQXFDLENBQ3JDLENBQUFHLEVBQXFFLENBQ3JFLENBQUFNLEdBR00sQ0FDTixDQUFBRSxHQUFtRCxDQUNuRCxDQUFBRSxHQUErQyxDQUNqRCxFQVpDLEdBQUcsQ0FZRTtNQUFBaEMsQ0FBQSxRQUFBNEIsR0FBQTtNQUFBNUIsQ0FBQSxRQUFBOEIsR0FBQTtNQUFBOUIsQ0FBQSxRQUFBZ0MsR0FBQTtNQUFBaEMsQ0FBQSxRQUFBWSxFQUFBO01BQUFaLENBQUEsUUFBQW1CLEVBQUE7TUFBQW5CLENBQUEsUUFBQXNCLEVBQUE7TUFBQXRCLENBQUEsUUFBQW1DLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUFuQyxDQUFBO0lBQUE7SUFBQSxPQVpObUMsR0FZTTtFQUFBO0VBTU8sTUFBQTVCLEVBQUEsR0FBQVYsVUFBVSxHQUFWLFlBQXFDLEdBQXJDbUIsU0FBcUM7RUFDL0MsTUFBQUwsRUFBQSxHQUFBZCxVQUFVLEdBQVYsR0FBZ0JWLE9BQU8sQ0FBQThCLE9BQVEsR0FBVSxHQUF6QyxJQUF5QztFQUFBLElBQUFMLEVBQUE7RUFBQSxJQUFBWixDQUFBLFVBQUFPLEVBQUEsSUFBQVAsQ0FBQSxVQUFBVyxFQUFBO0lBRDVDQyxFQUFBLElBQUMsSUFBSSxDQUFRLEtBQXFDLENBQXJDLENBQUFMLEVBQW9DLENBQUMsQ0FDL0MsQ0FBQUksRUFBd0MsQ0FDM0MsRUFGQyxJQUFJLENBRUU7SUFBQVgsQ0FBQSxRQUFBTyxFQUFBO0lBQUFQLENBQUEsUUFBQVcsRUFBQTtJQUFBWCxDQUFBLFFBQUFZLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFaLENBQUE7RUFBQTtFQUNNLE1BQUFrQixFQUFBLEdBQUFyQixVQUFVLEdBQVYsWUFBcUMsR0FBckNtQixTQUFxQztFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBbkIsQ0FBQSxVQUFBSixJQUFBLENBQUF3QixJQUFBLElBQUFwQixDQUFBLFVBQUFrQixFQUFBO0lBQWxEQyxFQUFBLElBQUMsSUFBSSxDQUFRLEtBQXFDLENBQXJDLENBQUFELEVBQW9DLENBQUMsQ0FBRyxDQUFBdEIsSUFBSSxDQUFBd0IsSUFBSSxDQUFFLEVBQTlELElBQUksQ0FBaUU7SUFBQXBCLENBQUEsUUFBQUosSUFBQSxDQUFBd0IsSUFBQTtJQUFBcEIsQ0FBQSxRQUFBa0IsRUFBQTtJQUFBbEIsQ0FBQSxRQUFBbUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQW5CLENBQUE7RUFBQTtFQUN0RCxNQUFBcUIsRUFBQSxJQUFDeEIsVUFBVTtFQUFBLElBQUF5QixFQUFBO0VBQUEsSUFBQXRCLENBQUEsVUFBQXVCLE1BQUEsQ0FBQUMsR0FBQTtJQUV6QkYsRUFBQSxJQUFDLElBQUksQ0FBaUIsZUFBdUIsQ0FBdkIsdUJBQXVCLENBQUMsR0FBRyxFQUFoRCxJQUFJLENBQW1EO0lBQUF0QixDQUFBLFFBQUFzQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBdEIsQ0FBQTtFQUFBO0VBQUEsSUFBQXlCLEVBQUE7RUFBQSxJQUFBekIsQ0FBQSxVQUFBcUIsRUFBQTtJQUYxREksRUFBQSxJQUFDLElBQUksQ0FBVyxRQUFXLENBQVgsQ0FBQUosRUFBVSxDQUFDLENBQ3hCLElBQUUsQ0FDSCxDQUFBQyxFQUF1RCxDQUN6RCxFQUhDLElBQUksQ0FHRTtJQUFBdEIsQ0FBQSxRQUFBcUIsRUFBQTtJQUFBckIsQ0FBQSxRQUFBeUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXpCLENBQUE7RUFBQTtFQUNTLE1BQUEwQixFQUFBLElBQUM3QixVQUFVO0VBQUEsSUFBQStCLEdBQUE7RUFBQSxJQUFBNUIsQ0FBQSxVQUFBMkMsWUFBQSxJQUFBM0MsQ0FBQSxVQUFBMEIsRUFBQTtJQUEzQkUsR0FBQSxJQUFDLElBQUksQ0FBVyxRQUFXLENBQVgsQ0FBQUYsRUFBVSxDQUFDLENBQUUsR0FBSXRCLGFBQVMsQ0FBRSxDQUFDLEVBQTVDLElBQUksQ0FBK0M7SUFBQUosQ0FBQSxRQUFBMkMsWUFBQTtJQUFBM0MsQ0FBQSxRQUFBMEIsRUFBQTtJQUFBMUIsQ0FBQSxRQUFBNEIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTVCLENBQUE7RUFBQTtFQUNwQyxNQUFBNkIsR0FBQSxJQUFDaEMsVUFBVTtFQUFBLElBQUFpQyxHQUFBO0VBQUEsSUFBQTlCLENBQUEsVUFBQTRDLFlBQUEsSUFBQTVDLENBQUEsVUFBQTZCLEdBQUE7SUFBM0JDLEdBQUEsSUFBQyxJQUFJLENBQVcsUUFBVyxDQUFYLENBQUFELEdBQVUsQ0FBQyxDQUFHeEIsYUFBUyxDQUFFLEVBQXhDLElBQUksQ0FBMkM7SUFBQUwsQ0FBQSxRQUFBNEMsWUFBQTtJQUFBNUMsQ0FBQSxRQUFBNkIsR0FBQTtJQUFBN0IsQ0FBQSxRQUFBOEIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTlCLENBQUE7RUFBQTtFQUFBLElBQUErQixHQUFBO0VBQUEsSUFBQS9CLENBQUEsVUFBQTRCLEdBQUEsSUFBQTVCLENBQUEsVUFBQThCLEdBQUEsSUFBQTlCLENBQUEsVUFBQVksRUFBQSxJQUFBWixDQUFBLFVBQUFtQixFQUFBLElBQUFuQixDQUFBLFVBQUF5QixFQUFBO0lBVmxETSxHQUFBLElBQUMsR0FBRyxDQUNGLENBQUFuQixFQUVNLENBQ04sQ0FBQU8sRUFBcUUsQ0FDckUsQ0FBQU0sRUFHTSxDQUNOLENBQUFHLEdBQW1ELENBQ25ELENBQUFFLEdBQStDLENBQ2pELEVBWEMsR0FBRyxDQVdFO0lBQUE5QixDQUFBLFFBQUE0QixHQUFBO0lBQUE1QixDQUFBLFFBQUE4QixHQUFBO0lBQUE5QixDQUFBLFFBQUFZLEVBQUE7SUFBQVosQ0FBQSxRQUFBbUIsRUFBQTtJQUFBbkIsQ0FBQSxRQUFBeUIsRUFBQTtJQUFBekIsQ0FBQSxRQUFBK0IsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQS9CLENBQUE7RUFBQTtFQUFBLE9BWE4rQixHQVdNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=