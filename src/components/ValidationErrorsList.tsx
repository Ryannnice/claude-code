// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 setWith，将 lodash-es/setWith.js 中已经封装好的能力接到本文件流程里。
import setWith from 'lodash-es/setWith.js';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text、useTheme，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useTheme } from '../ink.js';
// 类型依赖 { ValidationError } 来自 ../utils/settings/validation.js，用于校准终端渲染的数据契约。
import type { ValidationError } from '../utils/settings/validation.js';
// 复用 TreeNode、treeify 工具函数，把通用处理留在 ../utils/treeify.js 中维护。
import { type TreeNode, treeify } from '../utils/treeify.js';

/**
 * Builds a nested tree structure from dot-notation paths
 * Uses lodash setWith to avoid automatic array creation
 */
// buildNestedTree 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildNestedTree(errors: ValidationError[]): TreeNode {
  // tree 从空对象开始收集键值，后续按名称补齐内容。
  const tree: TreeNode = {};
  // 调用 errors.forEach，触发终端渲染此处需要的副作用。
  errors.forEach(error => {
    // error.path 路径数据缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!error.path) {
      // Root level error - use empty string as key
      // tree[''更新为 `error.message`，确保终端 UI 组件 Validation Errors List后续读取最新状态。
      tree[''] = error.message;
      // 终端 UI 组件 Validation Errors List在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }

    // Try to enhance the path with meaningful values
    // pathParts 路径数据格式化`path.split`，供终端渲染后续处理使用。
    const pathParts = error.path.split('.');
    // modifiedPath 路径数据 命名 `error.path`，让后续代码直接表达这个值的用途。
    let modifiedPath = error.path;

    // If we have an invalid value, try to make the path more readable
    // `error.invalidValue` 与 `null && error.invalidValue` 不一致时刷新派生状态，避免使用过期结果。
    if (error.invalidValue !== null && error.invalidValue !== undefined && pathParts.length > 0) {
      // newPathParts 路径数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const newPathParts: string[] = [];
      // 按索引扫描 `pathParts.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < pathParts.length; i++) {
        // part保存`pathParts[i]`，供终端 UI Validation Errors Li...后续判断或输出使用。
        const part = pathParts[i];
        // part缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!part) continue;
        // numericPart解析`parseInt`，供终端渲染后续处理使用。
        const numericPart = parseInt(part, 10);

        // If this is a numeric index and it's the last part where we have the invalid value
        // 只有 `!isNaN(numericPart) && i === pathParts.length - 1` 满足时，终端渲染才执行该分支。
        if (!isNaN(numericPart) && i === pathParts.length - 1) {
          // Format the value for display
          // displayValue 先占位，稍后的条件分支会根据实际输入补齐它。
          let displayValue: string;
          // 当 `typeof error.invalidValue` 匹配 `'string'` 时，终端渲染执行对应分支。
          if (typeof error.invalidValue === 'string') {
            // displayValue更新为 ``"${error.invalidValue}"``，确保终端 UI后续读取最新状态。
            displayValue = `"${error.invalidValue}"`;
          // 终端 UI 组件 Validation Errors List在这里处理 `} else if (error.invalidValue === null) {`，完成这一小步状态转换。
          } else if (error.invalidValue === null) {
            // displayValue更新为 `'null'`，确保终端 UI后续读取最新状态。
            displayValue = 'null';
          // 终端 UI 组件 Validation Errors List在这里处理 `} else if (error.invalidValue === undefined) {`，完成这一小步状态转换。
          } else if (error.invalidValue === undefined) {
            // displayValue更新为 `'undefined'`，确保终端 UI后续读取最新状态。
            displayValue = 'undefined';
          } else {
            // displayValue更新为 `String(error.invalidValue)`，确保终端 UI后续读取最新状态。
            displayValue = String(error.invalidValue);
          }
          // newPathParts 路径数据追加新条目，保持收集顺序与输入顺序一致。
          newPathParts.push(displayValue);
        } else {
          // Keep other parts as-is
          // newPathParts 路径数据追加新条目，保持收集顺序与输入顺序一致。
          newPathParts.push(part);
        }
      }
      // modifiedPath 路径数据更新为 `newPathParts.join('.')`，确保终端 UI后续读取最新状态。
      modifiedPath = newPathParts.join('.');
    }
    // setWith 写入新的状态值，使终端渲染后续读取保持一致。
    setWith(tree, modifiedPath, error.message, Object);
  });
  // 返回 `tree`，作为终端渲染这次计算的结果。
  return tree;
}

/**
 * Groups and displays validation errors using treeify with deduplication
 */
// ValidationErrorsList 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ValidationErrorsList(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    errors
  } = t0;
  // 从 `useTheme()` 按位置拆出 themeName，让终端 UI 组件 Validation Errors List分别处理这些返回值。
  const [themeName] = useTheme();
  // 错误列表为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (errors.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // T0 暂存 `Box` 的派生结果，便于缓存命中时直接复用。
  let T0;
  // t1 暂存 `"column"` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `sortedFiles.map(file_0 => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== errors || $[1] !== themeName) {
    // errorsByFile 文件数据派生`errors.reduce`，供终端渲染后续处理使用。
    const errorsByFile = errors.reduce(_temp, {});
    // sortedFiles 文件数据派生`Object.keys`，供终端渲染后续处理使用。
    const sortedFiles = Object.keys(errorsByFile).sort();
    // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T0 = Box;
    // t1 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t1 = "column";
    // t2 暂存 `sortedFiles.map(file_0 => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = sortedFiles.map(file_0 => {
      // fileErrors 文件数据标记终端 UI Validation Errors Li...是否启用对应路径。
      const fileErrors = errorsByFile[file_0] || [];
      // 调用 fileErrors.sort，触发终端渲染此处需要的副作用。
      fileErrors.sort(_temp2);
      // errorTree 错误信息构建`buildNestedTree`，供终端渲染后续处理使用。
      const errorTree = buildNestedTree(fileErrors);
      // suggestionPairs 集合保存`Map`，供终端渲染后续处理使用。
      const suggestionPairs = new Map();
      // 调用 fileErrors.forEach，触发终端渲染此处需要的副作用。
      fileErrors.forEach(error_0 => {
        // 只有 `error_0.suggestion || error_0.docLink` 满足时，终端渲染才执行该分支。
        if (error_0.suggestion || error_0.docLink) {
          // key标记终端 UI Validation Errors Li...是否启用对应路径。
          const key = `${error_0.suggestion || ""}|${error_0.docLink || ""}`;
          // 满足 `!suggestionPairs.has(key)` 时，终端渲染执行该分支。
          if (!suggestionPairs.has(key)) {
            // suggestionPairs.set 写入新的状态值，使终端渲染后续读取保持一致。
            suggestionPairs.set(key, {
              suggestion: error_0.suggestion,
              docLink: error_0.docLink
            });
          }
        }
      });
      // treeOutput保存`treeify`，供终端渲染后续处理使用。
      const treeOutput = treeify(errorTree, {
        showValues: true,
        themeName,
        treeCharColors: {
          treeChar: "inactive",
          key: "text",
          value: "inactive"
        }
      });
      // 返回 `<Box key={file_0} flexDirection="column"><Text>{file_0}</Text><Box marg...`，作为终端渲染这次计算的结果。
      return <Box key={file_0} flexDirection="column"><Text>{file_0}</Text><Box marginLeft={1}><Text dimColor={true}>{treeOutput}</Text></Box>{suggestionPairs.size > 0 && <Box flexDirection="column" marginTop={1}>{Array.from(suggestionPairs.values()).map(_temp3)}</Box>}</Box>;
    });
    // $[0] 缓存 `errors`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = errors;
    // $[1] 缓存 `themeName`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = themeName;
    // $[2] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = T0;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // T0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[2];
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<T0 flexDirection={t1}>{t2}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== T0 || $[6] !== t1 || $[7] !== t2) {
    // t3 暂存 `<T0 flexDirection={t1}>{t2}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <T0 flexDirection={t1}>{t2}</T0>;
    // $[5] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = T0;
    // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t1;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(pair, index) {
  // 返回 `<Box key={`suggestion-pair-${index}`} flexDirection="column" marginBott...`，作为终端渲染这次计算的结果。
  return <Box key={`suggestion-pair-${index}`} flexDirection="column" marginBottom={1}>{pair.suggestion && <Text dimColor={true} wrap="wrap">{pair.suggestion}</Text>}{pair.docLink && <Text dimColor={true} wrap="wrap">Learn more: {pair.docLink}</Text>}</Box>;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(a, b) {
  // 只有 `!a.path && b.path` 满足时，终端渲染才执行该分支。
  if (!a.path && b.path) {
    // 返回 `-1`，作为终端渲染这次计算的结果。
    return -1;
  }
  // 只有 `a.path && !b.path` 满足时，终端渲染才执行该分支。
  if (a.path && !b.path) {
    // 返回 `1`，作为终端渲染这次计算的结果。
    return 1;
  }
  // 返回 `(a.path || "").localeCompare(b.path || "")`，作为终端渲染这次计算的结果。
  return (a.path || "").localeCompare(b.path || "");
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(acc, error) {
  // file 文件数据标记终端 UI Validation Errors Li...是否启用对应路径。
  const file = error.file || "(file not specified)";
  // 满足 `!acc[file]` 时，终端渲染执行该分支。
  if (!acc[file]) {
    // acc[file 文件数据更新为 `[]`，确保终端 UI 组件 Validation Errors List后续读取最新状态。
    acc[file] = [];
  }
  // 终端 UI 组件 Validation Errors List在这里处理 `acc[file].push(error)`，完成这一小步状态转换。
  acc[file].push(error);
  // 返回 `acc`，作为终端渲染这次计算的结果。
  return acc;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzZXRXaXRoIiwiUmVhY3QiLCJCb3giLCJUZXh0IiwidXNlVGhlbWUiLCJWYWxpZGF0aW9uRXJyb3IiLCJUcmVlTm9kZSIsInRyZWVpZnkiLCJidWlsZE5lc3RlZFRyZWUiLCJlcnJvcnMiLCJ0cmVlIiwiZm9yRWFjaCIsImVycm9yIiwicGF0aCIsIm1lc3NhZ2UiLCJwYXRoUGFydHMiLCJzcGxpdCIsIm1vZGlmaWVkUGF0aCIsImludmFsaWRWYWx1ZSIsInVuZGVmaW5lZCIsImxlbmd0aCIsIm5ld1BhdGhQYXJ0cyIsImkiLCJwYXJ0IiwibnVtZXJpY1BhcnQiLCJwYXJzZUludCIsImlzTmFOIiwiZGlzcGxheVZhbHVlIiwiU3RyaW5nIiwicHVzaCIsImpvaW4iLCJPYmplY3QiLCJWYWxpZGF0aW9uRXJyb3JzTGlzdCIsInQwIiwiJCIsIl9jIiwidGhlbWVOYW1lIiwiVDAiLCJ0MSIsInQyIiwiZXJyb3JzQnlGaWxlIiwicmVkdWNlIiwiX3RlbXAiLCJzb3J0ZWRGaWxlcyIsImtleXMiLCJzb3J0IiwibWFwIiwiZmlsZV8wIiwiZmlsZUVycm9ycyIsImZpbGUiLCJfdGVtcDIiLCJlcnJvclRyZWUiLCJzdWdnZXN0aW9uUGFpcnMiLCJNYXAiLCJlcnJvcl8wIiwic3VnZ2VzdGlvbiIsImRvY0xpbmsiLCJrZXkiLCJoYXMiLCJzZXQiLCJ0cmVlT3V0cHV0Iiwic2hvd1ZhbHVlcyIsInRyZWVDaGFyQ29sb3JzIiwidHJlZUNoYXIiLCJ2YWx1ZSIsInNpemUiLCJBcnJheSIsImZyb20iLCJ2YWx1ZXMiLCJfdGVtcDMiLCJ0MyIsInBhaXIiLCJpbmRleCIsImEiLCJiIiwibG9jYWxlQ29tcGFyZSIsImFjYyJdLCJzb3VyY2VzIjpbIlZhbGlkYXRpb25FcnJvcnNMaXN0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc2V0V2l0aCBmcm9tICdsb2Rhc2gtZXMvc2V0V2l0aC5qcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0LCB1c2VUaGVtZSB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vdXRpbHMvc2V0dGluZ3MvdmFsaWRhdGlvbi5qcydcbmltcG9ydCB7IHR5cGUgVHJlZU5vZGUsIHRyZWVpZnkgfSBmcm9tICcuLi91dGlscy90cmVlaWZ5LmpzJ1xuXG4vKipcbiAqIEJ1aWxkcyBhIG5lc3RlZCB0cmVlIHN0cnVjdHVyZSBmcm9tIGRvdC1ub3RhdGlvbiBwYXRoc1xuICogVXNlcyBsb2Rhc2ggc2V0V2l0aCB0byBhdm9pZCBhdXRvbWF0aWMgYXJyYXkgY3JlYXRpb25cbiAqL1xuZnVuY3Rpb24gYnVpbGROZXN0ZWRUcmVlKGVycm9yczogVmFsaWRhdGlvbkVycm9yW10pOiBUcmVlTm9kZSB7XG4gIGNvbnN0IHRyZWU6IFRyZWVOb2RlID0ge31cblxuICBlcnJvcnMuZm9yRWFjaChlcnJvciA9PiB7XG4gICAgaWYgKCFlcnJvci5wYXRoKSB7XG4gICAgICAvLyBSb290IGxldmVsIGVycm9yIC0gdXNlIGVtcHR5IHN0cmluZyBhcyBrZXlcbiAgICAgIHRyZWVbJyddID0gZXJyb3IubWVzc2FnZVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gVHJ5IHRvIGVuaGFuY2UgdGhlIHBhdGggd2l0aCBtZWFuaW5nZnVsIHZhbHVlc1xuICAgIGNvbnN0IHBhdGhQYXJ0cyA9IGVycm9yLnBhdGguc3BsaXQoJy4nKVxuICAgIGxldCBtb2RpZmllZFBhdGggPSBlcnJvci5wYXRoXG5cbiAgICAvLyBJZiB3ZSBoYXZlIGFuIGludmFsaWQgdmFsdWUsIHRyeSB0byBtYWtlIHRoZSBwYXRoIG1vcmUgcmVhZGFibGVcbiAgICBpZiAoXG4gICAgICBlcnJvci5pbnZhbGlkVmFsdWUgIT09IG51bGwgJiZcbiAgICAgIGVycm9yLmludmFsaWRWYWx1ZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBwYXRoUGFydHMubGVuZ3RoID4gMFxuICAgICkge1xuICAgICAgY29uc3QgbmV3UGF0aFBhcnRzOiBzdHJpbmdbXSA9IFtdXG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aFBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBhcnQgPSBwYXRoUGFydHNbaV1cbiAgICAgICAgaWYgKCFwYXJ0KSBjb250aW51ZVxuXG4gICAgICAgIGNvbnN0IG51bWVyaWNQYXJ0ID0gcGFyc2VJbnQocGFydCwgMTApXG5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyBhIG51bWVyaWMgaW5kZXggYW5kIGl0J3MgdGhlIGxhc3QgcGFydCB3aGVyZSB3ZSBoYXZlIHRoZSBpbnZhbGlkIHZhbHVlXG4gICAgICAgIGlmICghaXNOYU4obnVtZXJpY1BhcnQpICYmIGkgPT09IHBhdGhQYXJ0cy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgLy8gRm9ybWF0IHRoZSB2YWx1ZSBmb3IgZGlzcGxheVxuICAgICAgICAgIGxldCBkaXNwbGF5VmFsdWU6IHN0cmluZ1xuICAgICAgICAgIGlmICh0eXBlb2YgZXJyb3IuaW52YWxpZFZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gYFwiJHtlcnJvci5pbnZhbGlkVmFsdWV9XCJgXG4gICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5pbnZhbGlkVmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRpc3BsYXlWYWx1ZSA9ICdudWxsJ1xuICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3IuaW52YWxpZFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRpc3BsYXlWYWx1ZSA9ICd1bmRlZmluZWQnXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpc3BsYXlWYWx1ZSA9IFN0cmluZyhlcnJvci5pbnZhbGlkVmFsdWUpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbmV3UGF0aFBhcnRzLnB1c2goZGlzcGxheVZhbHVlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEtlZXAgb3RoZXIgcGFydHMgYXMtaXNcbiAgICAgICAgICBuZXdQYXRoUGFydHMucHVzaChwYXJ0KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG1vZGlmaWVkUGF0aCA9IG5ld1BhdGhQYXJ0cy5qb2luKCcuJylcbiAgICB9XG5cbiAgICBzZXRXaXRoKHRyZWUsIG1vZGlmaWVkUGF0aCwgZXJyb3IubWVzc2FnZSwgT2JqZWN0KVxuICB9KVxuXG4gIHJldHVybiB0cmVlXG59XG5cbi8qKlxuICogR3JvdXBzIGFuZCBkaXNwbGF5cyB2YWxpZGF0aW9uIGVycm9ycyB1c2luZyB0cmVlaWZ5IHdpdGggZGVkdXBsaWNhdGlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gVmFsaWRhdGlvbkVycm9yc0xpc3Qoe1xuICBlcnJvcnMsXG59OiB7XG4gIGVycm9yczogVmFsaWRhdGlvbkVycm9yW11cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbdGhlbWVOYW1lXSA9IHVzZVRoZW1lKClcblxuICBpZiAoZXJyb3JzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBHcm91cCBlcnJvcnMgYnkgZmlsZVxuICBjb25zdCBlcnJvcnNCeUZpbGUgPSBlcnJvcnMucmVkdWNlPFJlY29yZDxzdHJpbmcsIFZhbGlkYXRpb25FcnJvcltdPj4oXG4gICAgKGFjYywgZXJyb3IpID0+IHtcbiAgICAgIGNvbnN0IGZpbGUgPSBlcnJvci5maWxlIHx8ICcoZmlsZSBub3Qgc3BlY2lmaWVkKSdcbiAgICAgIGlmICghYWNjW2ZpbGVdKSB7XG4gICAgICAgIGFjY1tmaWxlXSA9IFtdXG4gICAgICB9XG4gICAgICBhY2NbZmlsZV0hLnB1c2goZXJyb3IpXG4gICAgICByZXR1cm4gYWNjXG4gICAgfSxcbiAgICB7fSxcbiAgKVxuXG4gIC8vIFNvcnQgZmlsZXMgYWxwaGFiZXRpY2FsbHlcbiAgY29uc3Qgc29ydGVkRmlsZXMgPSBPYmplY3Qua2V5cyhlcnJvcnNCeUZpbGUpLnNvcnQoKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICB7c29ydGVkRmlsZXMubWFwKGZpbGUgPT4ge1xuICAgICAgICBjb25zdCBmaWxlRXJyb3JzID0gZXJyb3JzQnlGaWxlW2ZpbGVdIHx8IFtdXG5cbiAgICAgICAgLy8gU29ydCBlcnJvcnMgYnkgcGF0aFxuICAgICAgICBmaWxlRXJyb3JzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoIWEucGF0aCAmJiBiLnBhdGgpIHJldHVybiAtMVxuICAgICAgICAgIGlmIChhLnBhdGggJiYgIWIucGF0aCkgcmV0dXJuIDFcbiAgICAgICAgICByZXR1cm4gKGEucGF0aCB8fCAnJykubG9jYWxlQ29tcGFyZShiLnBhdGggfHwgJycpXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gQnVpbGQgbmVzdGVkIHRyZWUgc3RydWN0dXJlIGZyb20gZXJyb3IgcGF0aHNcbiAgICAgICAgY29uc3QgZXJyb3JUcmVlID0gYnVpbGROZXN0ZWRUcmVlKGZpbGVFcnJvcnMpXG5cbiAgICAgICAgLy8gQ29sbGVjdCB1bmlxdWUgc3VnZ2VzdGlvbitkb2NMaW5rIHBhaXJzXG4gICAgICAgIGNvbnN0IHN1Z2dlc3Rpb25QYWlycyA9IG5ldyBNYXA8XG4gICAgICAgICAgc3RyaW5nLFxuICAgICAgICAgIHsgc3VnZ2VzdGlvbj86IHN0cmluZzsgZG9jTGluaz86IHN0cmluZyB9XG4gICAgICAgID4oKVxuXG4gICAgICAgIGZpbGVFcnJvcnMuZm9yRWFjaChlcnJvciA9PiB7XG4gICAgICAgICAgaWYgKGVycm9yLnN1Z2dlc3Rpb24gfHwgZXJyb3IuZG9jTGluaykge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGEga2V5IGZyb20gc3VnZ2VzdGlvbitkb2NMaW5rIGNvbWJpbmF0aW9uXG4gICAgICAgICAgICBjb25zdCBrZXkgPSBgJHtlcnJvci5zdWdnZXN0aW9uIHx8ICcnfXwke2Vycm9yLmRvY0xpbmsgfHwgJyd9YFxuICAgICAgICAgICAgaWYgKCFzdWdnZXN0aW9uUGFpcnMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgc3VnZ2VzdGlvblBhaXJzLnNldChrZXksIHtcbiAgICAgICAgICAgICAgICBzdWdnZXN0aW9uOiBlcnJvci5zdWdnZXN0aW9uLFxuICAgICAgICAgICAgICAgIGRvY0xpbms6IGVycm9yLmRvY0xpbmssXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIFJlbmRlciB0aGUgdHJlZVxuICAgICAgICBjb25zdCB0cmVlT3V0cHV0ID0gdHJlZWlmeShlcnJvclRyZWUsIHtcbiAgICAgICAgICBzaG93VmFsdWVzOiB0cnVlLFxuICAgICAgICAgIHRoZW1lTmFtZSxcbiAgICAgICAgICB0cmVlQ2hhckNvbG9yczoge1xuICAgICAgICAgICAgdHJlZUNoYXI6ICdpbmFjdGl2ZScsXG4gICAgICAgICAgICBrZXk6ICd0ZXh0JyxcbiAgICAgICAgICAgIHZhbHVlOiAnaW5hY3RpdmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8Qm94IGtleT17ZmlsZX0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgPFRleHQ+e2ZpbGV9PC9UZXh0PlxuICAgICAgICAgICAgPEJveCBtYXJnaW5MZWZ0PXsxfT5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e3RyZWVPdXRwdXR9PC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICB7LyogRGlzcGxheSB1bmlxdWUgc3VnZ2VzdGlvbitkb2NMaW5rIHBhaXJzICovfVxuICAgICAgICAgICAge3N1Z2dlc3Rpb25QYWlycy5zaXplID4gMCAmJiAoXG4gICAgICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICAgICAge0FycmF5LmZyb20oc3VnZ2VzdGlvblBhaXJzLnZhbHVlcygpKS5tYXAoKHBhaXIsIGluZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8Qm94XG4gICAgICAgICAgICAgICAgICAgIGtleT17YHN1Z2dlc3Rpb24tcGFpci0ke2luZGV4fWB9XG4gICAgICAgICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgICAgICAgICAgICAgICBtYXJnaW5Cb3R0b209ezF9XG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtwYWlyLnN1Z2dlc3Rpb24gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yIHdyYXA9XCJ3cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7cGFpci5zdWdnZXN0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAge3BhaXIuZG9jTGluayAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3Igd3JhcD1cIndyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIExlYXJuIG1vcmU6IHtwYWlyLmRvY0xpbmt9XG4gICAgICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKVxuICAgICAgfSl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxzQkFBc0I7QUFDMUMsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxHQUFHLEVBQUVDLElBQUks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