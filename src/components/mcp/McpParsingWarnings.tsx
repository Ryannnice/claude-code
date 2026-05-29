// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useMemo } from 'react';
// 接入 getMcpConfigsByScope 服务层能力，把外部通信或共享状态交给 src/services/mcp/config.js 处理。
import { getMcpConfigsByScope } from 'src/services/mcp/config.js';
// 类型依赖 { ConfigScope } 来自 src/services/mcp/types.js，用于校准终端渲染的数据契约。
import type { ConfigScope } from 'src/services/mcp/types.js';
// 接入 describeMcpConfigFilePath、getScopeLabel 服务层能力，把外部通信或共享状态交给 src/services/mcp/utils.js 处理。
import { describeMcpConfigFilePath, getScopeLabel } from 'src/services/mcp/utils.js';
// 类型依赖 { ValidationError } 来自 src/utils/settings/validation.js，用于校准终端渲染的数据契约。
import type { ValidationError } from 'src/utils/settings/validation.js';
// 引入 Box、Link、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../../ink.js';
// McpConfigErrorSection 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function McpConfigErrorSection(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(26);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    scope,
    parsingErrors,
    warnings
  } = t0;
  // hasErrors 错误信息标记终端渲染MCP 界面组件 Mcp Parsing Warnings是否启用对应路径。
  const hasErrors = parsingErrors.length > 0;
  // hasWarnings 警告信息标记终端渲染MCP 界面组件 Mcp Parsing Warnings是否启用对应路径。
  const hasWarnings = warnings.length > 0;
  // 只有 `!hasErrors && !hasWarnings` 满足时，终端渲染才执行该分支。
  if (!hasErrors && !hasWarnings) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `(hasErrors || hasWarnings) && <Text color={hasErrors ? "e...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== hasErrors || $[1] !== hasWarnings) {
    // t1 暂存 `(hasErrors || hasWarnings) && <Text color={hasErrors ? "e...` 生成的渲染片段，后续返回路径直接复用。
    t1 = (hasErrors || hasWarnings) && <Text color={hasErrors ? "error" : "warning"}>[{hasErrors ? "Failed to parse" : "Contains warnings"}]{" "}</Text>;
    // $[0] 缓存 `hasErrors`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = hasErrors;
    // $[1] 缓存 `hasWarnings`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = hasWarnings;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // t2 暂存 `getScopeLabel(scope)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== scope) {
    // t2 暂存 `getScopeLabel(scope)` 生成的渲染片段，后续返回路径直接复用。
    t2 = getScopeLabel(scope);
    // $[3] 缓存 `scope`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = scope;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Text>{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t2) {
    // t3 暂存 `<Text>{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>{t2}</Text>;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<Box>{t1}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t1 || $[8] !== t3) {
    // t4 暂存 `<Box>{t1}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box>{t1}{t3}</Box>;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `<Text dimColor={true}>Location: </Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Text dimColor={true}>Location: </Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text dimColor={true}>Location: </Text>;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `describeMcpConfigFilePath(scope)` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== scope) {
    // t6 暂存 `describeMcpConfigFilePath(scope)` 生成的渲染片段，后续返回路径直接复用。
    t6 = describeMcpConfigFilePath(scope);
    // $[11] 缓存 `scope`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = scope;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // t7 暂存 `<Box>{t5}<Text dimColor={true}>{t6}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t6) {
    // t7 暂存 `<Box>{t5}<Text dimColor={true}>{t6}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box>{t5}<Text dimColor={true}>{t6}</Text></Box>;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[14];
  }
  // t8 暂存 `parsingErrors.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== parsingErrors) {
    // t8 暂存 `parsingErrors.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t8 = parsingErrors.map(_temp);
    // $[15] 缓存 `parsingErrors`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = parsingErrors;
    // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[16];
  }
  // t9 暂存 `warnings.map(_temp2)` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== warnings) {
    // t9 暂存 `warnings.map(_temp2)` 生成的渲染片段，后续返回路径直接复用。
    t9 = warnings.map(_temp2);
    // $[17] 缓存 `warnings`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = warnings;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // t10 暂存 `<Box marginLeft={1} flexDirection="column">{t8}{t9}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== t8 || $[20] !== t9) {
    // t10 暂存 `<Box marginLeft={1} flexDirection="column">{t8}{t9}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box marginLeft={1} flexDirection="column">{t8}{t9}</Box>;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
    // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[21];
  }
  // t11 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t7}{t10}</...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== t10 || $[23] !== t4 || $[24] !== t7) {
    // t11 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t7}{t10}</...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box flexDirection="column" marginTop={1}>{t4}{t7}{t10}</Box>;
    // $[22] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t10;
    // $[23] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t4;
    // $[24] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t7;
    // $[25] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[25];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
// _temp2 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(warning, i_0) {
  // serverName_0 命名 `warning.mcpErrorMetadata?.serverName`，让后续代码直接表达这个值的用途。
  const serverName_0 = warning.mcpErrorMetadata?.serverName;
  // 返回 `<Box key={`warning-${i_0}`}><Text><Text dimColor={true}>└ </Text><Text ...`，作为终端渲染这次计算的结果。
  return <Box key={`warning-${i_0}`}><Text><Text dimColor={true}>└ </Text><Text color="warning">[Warning]</Text><Text dimColor={true}>{" "}{serverName_0 && `[${serverName_0}] `}{warning.path && warning.path !== "" ? `${warning.path}: ` : ""}{warning.message}</Text></Text></Box>;
}
// _temp 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(error, i) {
  // serverName 命名 `error.mcpErrorMetadata?.serverName`，让后续代码直接表达这个值的用途。
  const serverName = error.mcpErrorMetadata?.serverName;
  // 返回 `<Box key={`error-${i}`}><Text><Text dimColor={true}>└ </Text><Text colo...`，作为终端渲染这次计算的结果。
  return <Box key={`error-${i}`}><Text><Text dimColor={true}>└ </Text><Text color="error">[Error]</Text><Text dimColor={true}>{" "}{serverName && `[${serverName}] `}{error.path && error.path !== "" ? `${error.path}: ` : ""}{error.message}</Text></Text></Box>;
}
// McpParsingWarnings 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function McpParsingWarnings() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(6);
  // t0 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t0 = {
      scope: "user",
      config: getMcpConfigsByScope("user")
    };
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      scope: "project",
      config: getMcpConfigsByScope("project")
    };
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      scope: "local",
      config: getMcpConfigsByScope("local")
    };
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `[t0, t1, t2, {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `[t0, t1, t2, {` 生成的渲染片段，后续返回路径直接复用。
    t3 = [t0, t1, t2, {
      scope: "enterprise",
      config: getMcpConfigsByScope("enterprise")
    }];
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // scopes 集合保存`t3 satisfies Array<{`，供终端渲染MCP 界面组件 Mcp Parsing Warnings后续判断或输出使用。
  const scopes = t3 satisfies Array<{
    scope: ConfigScope;
    config: {
      errors: ValidationError[];
    };
  }>;
  // hasParsingErrors 错误信息记录 `scopes.some` 是否成立，终端渲染随后按该结果分支。
  const hasParsingErrors = scopes.some(_temp3);
  // hasWarnings 警告信息记录 `scopes.some` 是否成立，终端渲染随后按该结果分支。
  const hasWarnings = scopes.some(_temp4);
  // 只有 `!hasParsingErrors && !hasWarnings` 满足时，终端渲染才执行该分支。
  if (!hasParsingErrors && !hasWarnings) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t4 暂存 `<Text bold={true}>MCP Config Diagnostics</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text bold={true}>MCP Config Diagnostics</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text bold={true}>MCP Config Diagnostics</Text>;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // t5 暂存 `<Box flexDirection="column" marginTop={1} marginBottom={1...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Box flexDirection="column" marginTop={1} marginBottom={1...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column" marginTop={1} marginBottom={1}>{t4}<Box marginTop={1}><Text dimColor={true}>For help configuring MCP servers, see:{" "}<Link url="https://code.claude.com/docs/en/mcp">https://code.claude.com/docs/en/mcp</Link></Text></Box>{scopes.map(_temp5)}</Box>;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// _temp5 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(t0) {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    scope,
    config: config_1
  } = t0;
  // 返回 `<McpConfigErrorSection key={scope} scope={scope} parsingErrors={filterE...`，作为终端渲染这次计算的结果。
  return <McpConfigErrorSection key={scope} scope={scope} parsingErrors={filterErrors(config_1.errors, "fatal")} warnings={filterErrors(config_1.errors, "warning")} />;
}
// _temp4 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(t0) {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    config: config_0
  } = t0;
  // 返回 `filterErrors(config_0.errors, "warning").length > 0`，作为终端渲染这次计算的结果。
  return filterErrors(config_0.errors, "warning").length > 0;
}
// _temp3 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(t0) {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    config
  } = t0;
  // 返回 `filterErrors(config.errors, "fatal").length > 0`，作为终端渲染这次计算的结果。
  return filterErrors(config.errors, "fatal").length > 0;
}
// filterErrors 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function filterErrors(errors: ValidationError[], severity: 'fatal' | 'warning'): ValidationError[] {
  // 返回 `errors.filter(e => e.mcpErrorMetadata?.severity === severity)`，作为终端渲染这次计算的结果。
  return errors.filter(e => e.mcpErrorMetadata?.severity === severity);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZU1lbW8iLCJnZXRNY3BDb25maWdzQnlTY29wZSIsIkNvbmZpZ1Njb3BlIiwiZGVzY3JpYmVNY3BDb25maWdGaWxlUGF0aCIsImdldFNjb3BlTGFiZWwiLCJWYWxpZGF0aW9uRXJyb3IiLCJCb3giLCJMaW5rIiwiVGV4dCIsIk1jcENvbmZpZ0Vycm9yU2VjdGlvbiIsInQwIiwiJCIsIl9jIiwic2NvcGUiLCJwYXJzaW5nRXJyb3JzIiwid2FybmluZ3MiLCJoYXNFcnJvcnMiLCJsZW5ndGgiLCJoYXNXYXJuaW5ncyIsInQxIiwidDIiLCJ0MyIsInQ0IiwidDUiLCJTeW1ib2wiLCJmb3IiLCJ0NiIsInQ3IiwidDgiLCJtYXAiLCJfdGVtcCIsInQ5IiwiX3RlbXAyIiwidDEwIiwidDExIiwid2FybmluZyIsImlfMCIsInNlcnZlck5hbWVfMCIsIm1jcEVycm9yTWV0YWRhdGEiLCJzZXJ2ZXJOYW1lIiwiaSIsInBhdGgiLCJtZXNzYWdlIiwiZXJyb3IiLCJNY3BQYXJzaW5nV2FybmluZ3MiLCJjb25maWciLCJzY29wZXMiLCJBcnJheSIsImVycm9ycyIsImhhc1BhcnNpbmdFcnJvcnMiLCJzb21lIiwiX3RlbXAzIiwiX3RlbXA0IiwiX3RlbXA1IiwiY29uZmlnXzEiLCJmaWx0ZXJFcnJvcnMiLCJjb25maWdfMCIsInNldmVyaXR5IiwiZmlsdGVyIiwiZSJdLCJzb3VyY2VzIjpbIk1jcFBhcnNpbmdXYXJuaW5ncy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZU1lbW8gfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGdldE1jcENvbmZpZ3NCeVNjb3BlIH0gZnJvbSAnc3JjL3NlcnZpY2VzL21jcC9jb25maWcuanMnXG5pbXBvcnQgdHlwZSB7IENvbmZpZ1Njb3BlIH0gZnJvbSAnc3JjL3NlcnZpY2VzL21jcC90eXBlcy5qcydcbmltcG9ydCB7XG4gIGRlc2NyaWJlTWNwQ29uZmlnRmlsZVBhdGgsXG4gIGdldFNjb3BlTGFiZWwsXG59IGZyb20gJ3NyYy9zZXJ2aWNlcy9tY3AvdXRpbHMuanMnXG5pbXBvcnQgdHlwZSB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJ3NyYy91dGlscy9zZXR0aW5ncy92YWxpZGF0aW9uLmpzJ1xuaW1wb3J0IHsgQm94LCBMaW5rLCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuXG5mdW5jdGlvbiBNY3BDb25maWdFcnJvclNlY3Rpb24oe1xuICBzY29wZSxcbiAgcGFyc2luZ0Vycm9ycyxcbiAgd2FybmluZ3MsXG59OiB7XG4gIHNjb3BlOiBDb25maWdTY29wZVxuICBwYXJzaW5nRXJyb3JzOiBWYWxpZGF0aW9uRXJyb3JbXVxuICB3YXJuaW5nczogVmFsaWRhdGlvbkVycm9yW11cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBoYXNFcnJvcnMgPSBwYXJzaW5nRXJyb3JzLmxlbmd0aCA+IDBcbiAgY29uc3QgaGFzV2FybmluZ3MgPSB3YXJuaW5ncy5sZW5ndGggPiAwXG5cbiAgaWYgKCFoYXNFcnJvcnMgJiYgIWhhc1dhcm5pbmdzKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgIDxCb3g+XG4gICAgICAgIHsoaGFzRXJyb3JzIHx8IGhhc1dhcm5pbmdzKSAmJiAoXG4gICAgICAgICAgPFRleHQgY29sb3I9e2hhc0Vycm9ycyA/ICdlcnJvcicgOiAnd2FybmluZyd9PlxuICAgICAgICAgICAgW3toYXNFcnJvcnMgPyAnRmFpbGVkIHRvIHBhcnNlJyA6ICdDb250YWlucyB3YXJuaW5ncyd9XXsnICd9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApfVxuICAgICAgICA8VGV4dD57Z2V0U2NvcGVMYWJlbChzY29wZSl9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5Mb2NhdGlvbjogPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj57ZGVzY3JpYmVNY3BDb25maWdGaWxlUGF0aChzY29wZSl9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94IG1hcmdpbkxlZnQ9ezF9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAge3BhcnNpbmdFcnJvcnMubWFwKChlcnJvciwgaSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHNlcnZlck5hbWUgPSBlcnJvci5tY3BFcnJvck1ldGFkYXRhPy5zZXJ2ZXJOYW1lXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxCb3gga2V5PXtgZXJyb3ItJHtpfWB9PlxuICAgICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj7ilJQgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5bRXJyb3JdPC9UZXh0PlxuICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgICAgeycgJ31cbiAgICAgICAgICAgICAgICAgIHtzZXJ2ZXJOYW1lICYmIGBbJHtzZXJ2ZXJOYW1lfV0gYH1cbiAgICAgICAgICAgICAgICAgIHtlcnJvci5wYXRoICYmIGVycm9yLnBhdGggIT09ICcnID8gYCR7ZXJyb3IucGF0aH06IGAgOiAnJ31cbiAgICAgICAgICAgICAgICAgIHtlcnJvci5tZXNzYWdlfVxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgKVxuICAgICAgICB9KX1cbiAgICAgICAge3dhcm5pbmdzLm1hcCgod2FybmluZywgaSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHNlcnZlck5hbWUgPSB3YXJuaW5nLm1jcEVycm9yTWV0YWRhdGE/LnNlcnZlck5hbWVcblxuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8Qm94IGtleT17YHdhcm5pbmctJHtpfWB9PlxuICAgICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj7ilJQgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPltXYXJuaW5nXTwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgIHsnICd9XG4gICAgICAgICAgICAgICAgICB7c2VydmVyTmFtZSAmJiBgWyR7c2VydmVyTmFtZX1dIGB9XG4gICAgICAgICAgICAgICAgICB7d2FybmluZy5wYXRoICYmIHdhcm5pbmcucGF0aCAhPT0gJydcbiAgICAgICAgICAgICAgICAgICAgPyBgJHt3YXJuaW5nLnBhdGh9OiBgXG4gICAgICAgICAgICAgICAgICAgIDogJyd9XG4gICAgICAgICAgICAgICAgICB7d2FybmluZy5tZXNzYWdlfVxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgKVxuICAgICAgICB9KX1cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBNY3BQYXJzaW5nV2FybmluZ3MoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgLy8gQ29uZmlnIGZpbGVzIGRvbid0IGNoYW5nZSBkdXJpbmcgZGlhbG9nIGxpZmV0aW1lOyByZWFkIG9uY2Ugb24gbW91bnRcbiAgLy8gdG8gYXZvaWQgYmxvY2tpbmcgZmlsZSBJTyBvbiBldmVyeSByZS1yZW5kZXIuXG4gIGNvbnN0IHNjb3BlcyA9IHVzZU1lbW8oXG4gICAgKCkgPT5cbiAgICAgIFtcbiAgICAgICAgeyBzY29wZTogJ3VzZXInLCBjb25maWc6IGdldE1jcENvbmZpZ3NCeVNjb3BlKCd1c2VyJykgfSxcbiAgICAgICAgeyBzY29wZTogJ3Byb2plY3QnLCBjb25maWc6IGdldE1jcENvbmZpZ3NCeVNjb3BlKCdwcm9qZWN0JykgfSxcbiAgICAgICAgeyBzY29wZTogJ2xvY2FsJywgY29uZmlnOiBnZXRNY3BDb25maWdzQnlTY29wZSgnbG9jYWwnKSB9LFxuICAgICAgICB7IHNjb3BlOiAnZW50ZXJwcmlzZScsIGNvbmZpZzogZ2V0TWNwQ29uZmlnc0J5U2NvcGUoJ2VudGVycHJpc2UnKSB9LFxuICAgICAgXSBzYXRpc2ZpZXMgQXJyYXk8e1xuICAgICAgICBzY29wZTogQ29uZmlnU2NvcGVcbiAgICAgICAgY29uZmlnOiB7IGVycm9yczogVmFsaWRhdGlvbkVycm9yW10gfVxuICAgICAgfT4sXG4gICAgW10sXG4gIClcblxuICBjb25zdCBoYXNQYXJzaW5nRXJyb3JzID0gc2NvcGVzLnNvbWUoXG4gICAgKHsgY29uZmlnIH0pID0+IGZpbHRlckVycm9ycyhjb25maWcuZXJyb3JzLCAnZmF0YWwnKS5sZW5ndGggPiAwLFxuICApXG4gIGNvbnN0IGhhc1dhcm5pbmdzID0gc2NvcGVzLnNvbWUoXG4gICAgKHsgY29uZmlnIH0pID0+IGZpbHRlckVycm9ycyhjb25maWcuZXJyb3JzLCAnd2FybmluZycpLmxlbmd0aCA+IDAsXG4gIClcblxuICBpZiAoIWhhc1BhcnNpbmdFcnJvcnMgJiYgIWhhc1dhcm5pbmdzKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfSBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgPFRleHQgYm9sZD5NQ1AgQ29uZmlnIERpYWdub3N0aWNzPC9UZXh0PlxuICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICBGb3IgaGVscCBjb25maWd1cmluZyBNQ1Agc2VydmVycywgc2VlOnsnICd9XG4gICAgICAgICAgPExpbmsgdXJsPVwiaHR0cHM6Ly9jb2RlLmNsYXVkZS5jb20vZG9jcy9lbi9tY3BcIj5cbiAgICAgICAgICAgIGh0dHBzOi8vY29kZS5jbGF1ZGUuY29tL2RvY3MvZW4vbWNwXG4gICAgICAgICAgPC9MaW5rPlxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICAgIHtzY29wZXMubWFwKCh7IHNjb3BlLCBjb25maWcgfSkgPT4gKFxuICAgICAgICA8TWNwQ29uZmlnRXJyb3JTZWN0aW9uXG4gICAgICAgICAga2V5PXtzY29wZX1cbiAgICAgICAgICBzY29wZT17c2NvcGV9XG4gICAgICAgICAgcGFyc2luZ0Vycm9ycz17ZmlsdGVyRXJyb3JzKGNvbmZpZy5lcnJvcnMsICdmYXRhbCcpfVxuICAgICAgICAgIHdhcm5pbmdzPXtmaWx0ZXJFcnJvcnMoY29uZmlnLmVycm9ycywgJ3dhcm5pbmcnKX1cbiAgICAgICAgLz5cbiAgICAgICkpfVxuICAgICAgey8qIFRPRE86IEFkZCBhZGRpdGlvbmFsIGRpYWdub3N0aWMgc2VjdGlvbnM6XG4gICAgICAgKiAtIER1cGxpY2F0ZSBTZXJ2ZXIgTmFtZXMgKGNoZWNrIGZvciBzZXJ2ZXJzIHdpdGggc2FtZSBuYW1lIGFjcm9zcyBzY29wZXMpXG4gICAgICAgKiBUaGlzIHNlY3Rpb24gc2hvdWxkIGluY2x1ZGU6XG4gICAgICAgKiAtIEZpbGUgcGF0aHMgd2hlcmUgZWFjaCBzZXJ2ZXIgaXMgZGVmaW5lZFxuICAgICAgICogLSBNb3JlIGRldGFpbGVkIGxvY2F0aW9uIGluZm8gZm9yIHVzZXIvbG9jYWwgc2NvcGVzXG4gICAgICAgKiAtIEFwcHJvdmVkIC8gZGlzYWJsZWQgc3RhdHVzIG9mIHNlcnZlcnNcbiAgICAgICAqL31cbiAgICA8L0JveD5cbiAgKVxufVxuXG5mdW5jdGlvbiBmaWx0ZXJFcnJvcnMoXG4gIGVycm9yczogVmFsaWRhdGlvbkVycm9yW10sXG4gIHNldmVyaXR5OiAnZmF0YWwnIHwgJ3dhcm5pbmcnLFxuKTogVmFsaWRhdGlvbkVycm9yW10ge1xuICByZXR1cm4gZXJyb3JzLmZpbHRlcihlID0+IGUubWNwRXJyb3JNZXRhZGF0YT8uc2V2ZXJpdHkgPT09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