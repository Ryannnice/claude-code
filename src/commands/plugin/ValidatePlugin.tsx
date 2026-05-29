// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js';
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js';
// 复用 validateManifest 工具函数，把通用处理留在 ../../utils/plugins/validatePlugin.js 中维护。
import { validateManifest } from '../../utils/plugins/validatePlugin.js';
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js';
// Props 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onComplete: (result?: string) => void;，负责命令处理在该局部场景下的响应。
  onComplete: (result?: string) => void;
  path?: string;
};
// ValidatePlugin 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ValidatePlugin(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onComplete,
    path
  } = t0;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onComplete || $[1] !== path) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // runValidation保存`runValidation`，供命令处理后续处理使用。
      const runValidation = async function runValidation() {
        // 路径缺失时直接走兜底路径，避免命令处理使用无效输入。
        if (!path) {
          // 调用 onComplete，触发命令处理此处需要的副作用。
          onComplete("Usage: /plugin validate <path>\n\nValidate a plugin or marketplace manifest file or directory.\n\nExamples:\n  /plugin validate .claude-plugin/plugin.json\n  /plugin validate /path/to/plugin-directory\n  /plugin validate .\n\nWhen given a directory, automatically validates .claude-plugin/marketplace.json\nor .claude-plugin/plugin.json (prefers marketplace if both exist).\n\nOr from the command line:\n  claude plugin validate <path>");
          // 插件命令界面 Validate Plugin在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // 插件命令界面 Validate Plugin在这里处理 ``，完成这一小步状态转换。
        ;
        // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
        try {
          // 结果读取`validateManifest`，供命令处理后续处理使用。
          const result = await validateManifest(path);
          // output固定为 `""`，作为插件命令界面 Validate Plugin后续展示或比较的基准。
          let output = "";
          // output更新为 `output + `Validating ${result.fileType} manifest: ${resul...`，确保插件命令界面后续读取最新状态。
          output = output + `Validating ${result.fileType} manifest: ${result.filePath}\n\n`;
          // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
          output;
          // 满足 `result.errors.length > 0` 时，命令处理执行该分支。
          if (result.errors.length > 0) {
            // output更新为 `output + `${figures.cross} Found ${result.errors.length} ...`，确保插件命令界面后续读取最新状态。
            output = output + `${figures.cross} Found ${result.errors.length} ${plural(result.errors.length, "error")}:\n\n`;
            // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
            output;
            // 调用 result.errors.forEach，触发命令处理此处需要的副作用。
            result.errors.forEach(error_0 => {
              // output更新为 `output + ` ${figures.pointer} ${error_0.path}: ${error_0....`，确保插件命令界面后续读取最新状态。
              output = output + `  ${figures.pointer} ${error_0.path}: ${error_0.message}\n`;
              // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
              output;
            });
            // output更新为 `output + "\n"`，确保插件命令界面后续读取最新状态。
            output = output + "\n";
            // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
            output;
          }
          // 满足 `result.warnings.length > 0` 时，命令处理执行该分支。
          if (result.warnings.length > 0) {
            // output更新为 `output + `${figures.warning} Found ${result.warnings.leng...`，确保插件命令界面后续读取最新状态。
            output = output + `${figures.warning} Found ${result.warnings.length} ${plural(result.warnings.length, "warning")}:\n\n`;
            // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
            output;
            // 调用 result.warnings.forEach，触发命令处理此处需要的副作用。
            result.warnings.forEach(warning => {
              // output更新为 `output + ` ${figures.pointer} ${warning.path}: ${warning....`，确保插件命令界面后续读取最新状态。
              output = output + `  ${figures.pointer} ${warning.path}: ${warning.message}\n`;
              // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
              output;
            });
            // output更新为 `output + "\n"`，确保插件命令界面后续读取最新状态。
            output = output + "\n";
            // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
            output;
          }
          // 满足 `result.success` 时，命令处理执行该分支。
          if (result.success) {
            // 满足 `result.warnings.length > 0` 时，命令处理执行该分支。
            if (result.warnings.length > 0) {
              // output更新为 `output + `${figures.tick} Validation passed with warnings...`，确保插件命令界面后续读取最新状态。
              output = output + `${figures.tick} Validation passed with warnings\n`;
              // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
              output;
            } else {
              // output更新为 `output + `${figures.tick} Validation passed\n``，确保插件命令界面后续读取最新状态。
              output = output + `${figures.tick} Validation passed\n`;
              // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
              output;
            }
            // 设置进程退出码为 `0`，让外层 shell 感知插件命令界面运行失败。
            process.exitCode = 0;
          } else {
            // output更新为 `output + `${figures.cross} Validation failed\n``，确保插件命令界面后续读取最新状态。
            output = output + `${figures.cross} Validation failed\n`;
            // 插件命令界面 Validate Plugin在这里处理 `output`，完成这一小步状态转换。
            output;
            // 设置进程退出码为 `1`，让外层 shell 感知插件命令界面运行失败。
            process.exitCode = 1;
          }
          // 调用 onComplete，触发命令处理此处需要的副作用。
          onComplete(output);
        } catch (t3) {
          // 错误保存`t3`，作为后续临时缓存值处理的输入。
          const error = t3;
          // 设置进程退出码为 `2`，让外层 shell 感知插件命令界面运行失败。
          process.exitCode = 2;
          // 记录命令处理运行诊断，方便排查异常路径或性能问题。
          logError(error);
          // 调用 onComplete，触发命令处理此处需要的副作用。
          onComplete(`${figures.cross} Unexpected error during validation: ${errorMessage(error)}`);
        }
      };
      // 调用 runValidation，触发命令处理此处需要的副作用。
      runValidation();
    };
    // t2 暂存 `[onComplete, path]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [onComplete, path];
    // $[0] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onComplete;
    // $[1] 缓存 `path`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = path;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // 调用 useEffect，触发命令处理此处需要的副作用。
  useEffect(t1, t2);
  // t3 暂存 `<Box flexDirection="column"><Text>Running validation...</...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Box flexDirection="column"><Text>Running validation...</...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column"><Text>Running validation...</Text></Box>;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 返回 `t3`，作为命令处理这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VFZmZlY3QiLCJCb3giLCJUZXh0IiwiZXJyb3JNZXNzYWdlIiwibG9nRXJyb3IiLCJ2YWxpZGF0ZU1hbmlmZXN0IiwicGx1cmFsIiwiUHJvcHMiLCJvbkNvbXBsZXRlIiwicmVzdWx0IiwicGF0aCIsIlZhbGlkYXRlUGx1Z2luIiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwicnVuVmFsaWRhdGlvbiIsIm91dHB1dCIsImZpbGVUeXBlIiwiZmlsZVBhdGgiLCJlcnJvcnMiLCJsZW5ndGgiLCJjcm9zcyIsImZvckVhY2giLCJlcnJvcl8wIiwicG9pbnRlciIsImVycm9yIiwibWVzc2FnZSIsIndhcm5pbmdzIiwid2FybmluZyIsInN1Y2Nlc3MiLCJ0aWNrIiwicHJvY2VzcyIsImV4aXRDb2RlIiwidDMiLCJTeW1ib2wiLCJmb3IiXSwic291cmNlcyI6WyJWYWxpZGF0ZVBsdWdpbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBlcnJvck1lc3NhZ2UgfSBmcm9tICcuLi8uLi91dGlscy9lcnJvcnMuanMnXG5pbXBvcnQgeyBsb2dFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2xvZy5qcydcbmltcG9ydCB7IHZhbGlkYXRlTWFuaWZlc3QgfSBmcm9tICcuLi8uLi91dGlscy9wbHVnaW5zL3ZhbGlkYXRlUGx1Z2luLmpzJ1xuaW1wb3J0IHsgcGx1cmFsIH0gZnJvbSAnLi4vLi4vdXRpbHMvc3RyaW5nVXRpbHMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uQ29tcGxldGU6IChyZXN1bHQ/OiBzdHJpbmcpID0+IHZvaWRcbiAgcGF0aD86IHN0cmluZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gVmFsaWRhdGVQbHVnaW4oeyBvbkNvbXBsZXRlLCBwYXRoIH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBhc3luYyBmdW5jdGlvbiBydW5WYWxpZGF0aW9uKCkge1xuICAgICAgLy8gSWYgbm8gcGF0aCBwcm92aWRlZCwgc2hvdyB1c2FnZVxuICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgIG9uQ29tcGxldGUoXG4gICAgICAgICAgJ1VzYWdlOiAvcGx1Z2luIHZhbGlkYXRlIDxwYXRoPlxcblxcbicgK1xuICAgICAgICAgICAgJ1ZhbGlkYXRlIGEgcGx1Z2luIG9yIG1hcmtldHBsYWNlIG1hbmlmZXN0IGZpbGUgb3IgZGlyZWN0b3J5LlxcblxcbicgK1xuICAgICAgICAgICAgJ0V4YW1wbGVzOlxcbicgK1xuICAgICAgICAgICAgJyAgL3BsdWdpbiB2YWxpZGF0ZSAuY2xhdWRlLXBsdWdpbi9wbHVnaW4uanNvblxcbicgK1xuICAgICAgICAgICAgJyAgL3BsdWdpbiB2YWxpZGF0ZSAvcGF0aC90by9wbHVnaW4tZGlyZWN0b3J5XFxuJyArXG4gICAgICAgICAgICAnICAvcGx1Z2luIHZhbGlkYXRlIC5cXG5cXG4nICtcbiAgICAgICAgICAgICdXaGVuIGdpdmVuIGEgZGlyZWN0b3J5LCBhdXRvbWF0aWNhbGx5IHZhbGlkYXRlcyAuY2xhdWRlLXBsdWdpbi9tYXJrZXRwbGFjZS5qc29uXFxuJyArXG4gICAgICAgICAgICAnb3IgLmNsYXVkZS1wbHVnaW4vcGx1Z2luLmpzb24gKHByZWZlcnMgbWFya2V0cGxhY2UgaWYgYm90aCBleGlzdCkuXFxuXFxuJyArXG4gICAgICAgICAgICAnT3IgZnJvbSB0aGUgY29tbWFuZCBsaW5lOlxcbicgK1xuICAgICAgICAgICAgJyAgY2xhdWRlIHBsdWdpbiB2YWxpZGF0ZSA8cGF0aD4nLFxuICAgICAgICApXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB2YWxpZGF0ZU1hbmlmZXN0KHBhdGgpXG5cbiAgICAgICAgbGV0IG91dHB1dCA9ICcnXG5cbiAgICAgICAgLy8gQWRkIGhlYWRlclxuICAgICAgICBvdXRwdXQgKz0gYFZhbGlkYXRpbmcgJHtyZXN1bHQuZmlsZVR5cGV9IG1hbmlmZXN0OiAke3Jlc3VsdC5maWxlUGF0aH1cXG5cXG5gXG5cbiAgICAgICAgLy8gU2hvdyBlcnJvcnNcbiAgICAgICAgaWYgKHJlc3VsdC5lcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIG91dHB1dCArPSBgJHtmaWd1cmVzLmNyb3NzfSBGb3VuZCAke3Jlc3VsdC5lcnJvcnMubGVuZ3RofSAke3BsdXJhbChyZXN1bHQuZXJyb3JzLmxlbmd0aCwgJ2Vycm9yJyl9OlxcblxcbmBcblxuICAgICAgICAgIHJlc3VsdC5lcnJvcnMuZm9yRWFjaChlcnJvciA9PiB7XG4gICAgICAgICAgICBvdXRwdXQgKz0gYCAgJHtmaWd1cmVzLnBvaW50ZXJ9ICR7ZXJyb3IucGF0aH06ICR7ZXJyb3IubWVzc2FnZX1cXG5gXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIG91dHB1dCArPSAnXFxuJ1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyB3YXJuaW5nc1xuICAgICAgICBpZiAocmVzdWx0Lndhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBvdXRwdXQgKz0gYCR7ZmlndXJlcy53YXJuaW5nfSBGb3VuZCAke3Jlc3VsdC53YXJuaW5ncy5sZW5ndGh9ICR7cGx1cmFsKHJlc3VsdC53YXJuaW5ncy5sZW5ndGgsICd3YXJuaW5nJyl9OlxcblxcbmBcblxuICAgICAgICAgIHJlc3VsdC53YXJuaW5ncy5mb3JFYWNoKHdhcm5pbmcgPT4ge1xuICAgICAgICAgICAgb3V0cHV0ICs9IGAgICR7ZmlndXJlcy5wb2ludGVyfSAke3dhcm5pbmcucGF0aH06ICR7d2FybmluZy5tZXNzYWdlfVxcbmBcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgb3V0cHV0ICs9ICdcXG4nXG4gICAgICAgIH1cblxuICAgICAgICAvLyBTaG93IHN1Y2Nlc3Mgb3IgZmFpbHVyZVxuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICBpZiAocmVzdWx0Lndhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG91dHB1dCArPSBgJHtmaWd1cmVzLnRpY2t9IFZhbGlkYXRpb24gcGFzc2VkIHdpdGggd2FybmluZ3NcXG5gXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dCArPSBgJHtmaWd1cmVzLnRpY2t9IFZhbGlkYXRpb24gcGFzc2VkXFxuYFxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEV4aXQgd2l0aCBjb2RlIDAgKHN1Y2Nlc3MpXG4gICAgICAgICAgcHJvY2Vzcy5leGl0Q29kZSA9IDBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvdXRwdXQgKz0gYCR7ZmlndXJlcy5jcm9zc30gVmFsaWRhdGlvbiBmYWlsZWRcXG5gXG5cbiAgICAgICAgICAvLyBFeGl0IHdpdGggY29kZSAxICh2YWxpZGF0aW9uIGZhaWx1cmUpXG4gICAgICAgICAgcHJvY2Vzcy5leGl0Q29kZSA9IDFcbiAgICAgICAgfVxuXG4gICAgICAgIG9uQ29tcGxldGUob3V0cHV0KVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gRXhpdCB3aXRoIGNvZGUgMiAodW5leHBlY3RlZCBlcnJvcilcbiAgICAgICAgcHJvY2Vzcy5leGl0Q29kZSA9IDJcblxuICAgICAgICBsb2dFcnJvcihlcnJvcilcblxuICAgICAgICBvbkNvbXBsZXRlKFxuICAgICAgICAgIGAke2ZpZ3VyZXMuY3Jvc3N9IFVuZXhwZWN0ZWQgZXJyb3IgZHVyaW5nIHZhbGlkYXRpb246ICR7ZXJyb3JNZXNzYWdlKGVycm9yKX1gLFxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuXG4gICAgdm9pZCBydW5WYWxpZGF0aW9uKClcbiAgfSwgW29uQ29tcGxldGUsIHBhdGhdKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8VGV4dD5SdW5uaW5nIHZhbGlkYXRpb24uLi48L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsU0FBUyxRQUFRLE9BQU87QUFDakMsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxZQUFZLFFBQVEsdUJBQXVCO0FBQ3BELFNBQVNDLFFBQVEsUUFBUSxvQkFBb0I7QUFDN0MsU0FBU0MsZ0JBQWdCLFFBQVEsdUNBQXVDO0FBQ3hFLFNBQVNDLE1BQU0sUUFBUSw0QkFBNEI7QUFFbkQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFVBQVUsRUFBRSxDQUFDQyxNQUFlLENBQVIsRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJO0VBQ3JDQyxJQUFJLENBQUMsRUFBRSxNQUFNO0FBQ2YsQ0FBQztBQUVELE9BQU8sU0FBQUMsZUFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUF3QjtJQUFBTixVQUFBO0lBQUFFO0VBQUEsSUFBQUUsRUFBMkI7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQUwsVUFBQSxJQUFBSyxDQUFBLFFBQUFILElBQUE7SUFDOUNLLEVBQUEsR0FBQUEsQ0FBQTtNQUNSLE1BQUFFLGFBQUEsa0JBQUFBLGNBQUE7UUFFRSxJQUFJLENBQUNQLElBQUk7VUFDUEYsVUFBVSxDQUNSLHFiQVVGLENBQUM7VUFBQTtRQUFBO1FBRUY7UUFFRDtVQUNFLE1BQUFDLE1BQUEsR0FBZSxNQUFNSixnQkFBZ0IsQ0FBQ0ssSUFBSSxDQUFDO1VBRTNDLElBQUFRLE1BQUEsR0FBYSxFQUFFO1VBR2ZBLE1BQUEsR0FBQUEsTUFBTSxHQUFJLGNBQWNULE1BQU0sQ0FBQVUsUUFBUyxjQUFjVixNQUFNLENBQUFXLFFBQVMsTUFBTTtVQUExRUYsTUFBMEU7VUFHMUUsSUFBSVQsTUFBTSxDQUFBWSxNQUFPLENBQUFDLE1BQU8sR0FBRyxDQUFDO1lBQzFCSixNQUFBLEdBQUFBLE1BQU0sR0FBSSxHQUFHcEIsT0FBTyxDQUFBeUIsS0FBTSxVQUFVZCxNQUFNLENBQUFZLE1BQU8sQ0FBQUMsTUFBTyxJQUFJaEIsTUFBTSxDQUFDRyxNQUFNLENBQUFZLE1BQU8sQ0FBQUMsTUFBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO1lBQXhHSixNQUF3RztZQUV4R1QsTUFBTSxDQUFBWSxNQUFPLENBQUFHLE9BQVEsQ0FBQ0MsT0FBQTtjQUNwQlAsTUFBQSxHQUFBQSxNQUFNLEdBQUksS0FBS3BCLE9BQU8sQ0FBQTRCLE9BQVEsSUFBSUMsT0FBSyxDQUFBakIsSUFBSyxLQUFLaUIsT0FBSyxDQUFBQyxPQUFRLElBQUk7Y0FBbEVWLE1BQWtFO1lBQUEsQ0FDbkUsQ0FBQztZQUVGQSxNQUFBLEdBQUFBLE1BQU0sR0FBSSxJQUFJO1lBQWRBLE1BQWM7VUFBQTtVQUloQixJQUFJVCxNQUFNLENBQUFvQixRQUFTLENBQUFQLE1BQU8sR0FBRyxDQUFDO1lBQzVCSixNQUFBLEdBQUFBLE1BQU0sR0FBSSxHQUFHcEIsT0FBTyxDQUFBZ0MsT0FBUSxVQUFVckIsTUFBTSxDQUFBb0IsUUFBUyxDQUFBUCxNQUFPLElBQUloQixNQUFNLENBQUNHLE1BQU0sQ0FBQW9CLFFBQVMsQ0FBQVAsTUFBTyxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQWhISixNQUFnSDtZQUVoSFQsTUFBTSxDQUFBb0IsUUFBUyxDQUFBTCxPQUFRLENBQUNNLE9BQUE7Y0FDdEJaLE1BQUEsR0FBQUEsTUFBTSxHQUFJLEtBQUtwQixPQUFPLENBQUE0QixPQUFRLElBQUlJLE9BQU8sQ0FBQXBCLElBQUssS0FBS29CLE9BQU8sQ0FBQUYsT0FBUSxJQUFJO2NBQXRFVixNQUFzRTtZQUFBLENBQ3ZFLENBQUM7WUFFRkEsTUFBQSxHQUFBQSxNQUFNLEdBQUksSUFBSTtZQUFkQSxNQUFjO1VBQUE7VUFJaEIsSUFBSVQsTUFBTSxDQUFBc0IsT0FBUTtZQUNoQixJQUFJdEIsTUFBTSxDQUFBb0IsUUFBUyxDQUFBUCxNQUFPLEdBQUcsQ0FBQztjQUM1QkosTUFBQSxHQUFBQSxNQUFNLEdBQUksR0FBR3BCLE9BQU8sQ0FBQWtDLElBQUssb0NBQW9DO2NBQTdEZCxNQUE2RDtZQUFBO2NBRTdEQSxNQUFBLEdBQUFBLE1BQU0sR0FBSSxHQUFHcEIsT0FBTyxDQUFBa0MsSUFBSyxzQkFBc0I7Y0FBL0NkLE1BQStDO1lBQUE7WUFJakRlLE9BQU8sQ0FBQUMsUUFBQSxHQUFZLENBQUg7VUFBQTtZQUVoQmhCLE1BQUEsR0FBQUEsTUFBTSxHQUFJLEdBQUdwQixPQUFPLENBQUF5QixLQUFNLHNCQUFzQjtZQUFoREwsTUFBZ0Q7WUFHaERlLE9BQU8sQ0FBQUMsUUFBQSxHQUFZLENBQUg7VUFBQTtVQUdsQjFCLFVBQVUsQ0FBQ1UsTUFBTSxDQUFDO1FBQUEsU0FBQWlCLEVBQUE7VUFDWFIsS0FBQSxDQUFBQSxLQUFBLENBQUFBLENBQUEsQ0FBQUEsRUFBSztVQUVaTSxPQUFPLENBQUFDLFFBQUEsR0FBWSxDQUFIO1VBRWhCOUIsUUFBUSxDQUFDdUIsS0FBSyxDQUFDO1VBRWZuQixVQUFVLENBQ1IsR0FBR1YsT0FBTyxDQUFBeUIsS0FBTSx3Q0FBd0NwQixZQUFZLENBQUN3QixLQUFLLENBQUMsRUFDN0UsQ0FBQztRQUFBO01BQ0YsQ0FDRjtNQUVJVixhQUFhLENBQUMsQ0FBQztJQUFBLENBQ3JCO0lBQUVELEVBQUEsSUFBQ1IsVUFBVSxFQUFFRSxJQUFJLENBQUM7SUFBQUcsQ0FBQSxNQUFBTCxVQUFBO0lBQUFLLENBQUEsTUFBQUgsSUFBQTtJQUFBRyxDQUFBLE1BQUFFLEVBQUE7SUFBQUYsQ0FBQSxNQUFBRyxFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBRixDQUFBO0lBQUFHLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBaEZyQmIsU0FBUyxDQUFDZSxFQWdGVCxFQUFFQyxFQUFrQixDQUFDO0VBQUEsSUFBQW1CLEVBQUE7RUFBQSxJQUFBdEIsQ0FBQSxRQUFBdUIsTUFBQSxDQUFBQyxHQUFBO0lBR3BCRixFQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQ3pCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUExQixJQUFJLENBQ1AsRUFGQyxHQUFHLENBRUU7SUFBQXRCLENBQUEsTUFBQXNCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUF0QixDQUFBO0VBQUE7RUFBQSxPQUZOc0IsRUFFTTtBQUFBIiwiaWdub3JlTGlzdCI6W119