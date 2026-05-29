// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 类型依赖 { z } 来自 zod/v4，用于校准终端渲染的数据契约。
import type { z } from 'zod/v4';
// 引入 Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../../ink.js';
// 接入 NotebookEditTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { NotebookEditTool } from '../../../tools/NotebookEditTool/NotebookEditTool.js';
// 复用 logError 工具函数，把通用处理留在 ../../../utils/log.js 中维护。
import { logError } from '../../../utils/log.js';
// 引入 FilePermissionDialog，将 ../FilePermissionDialog/FilePermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { FilePermissionDialog } from '../FilePermissionDialog/FilePermissionDialog.js';
// 类型依赖 { PermissionRequestProps } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { PermissionRequestProps } from '../PermissionRequest.js';
// 引入 NotebookEditToolDiff，将 ./NotebookEditToolDiff.js 中已经封装好的能力接到本文件流程里。
import { NotebookEditToolDiff } from './NotebookEditToolDiff.js';
// NotebookEditInput 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type NotebookEditInput = z.infer<typeof NotebookEditTool.inputSchema>;
// NotebookEditPermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function NotebookEditPermissionRequest(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(52);
  // parseInput 命名 `_temp`，让后续代码直接表达这个值的用途。
  const parseInput = _temp;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
  // T2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T2;
  // language 先占位，稍后的条件分支会根据实际输入补齐它。
  let language;
  // notebook_path 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let notebook_path;
  // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsed;
  // t0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t0;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // t10 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t10;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // t6 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // t7 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t7;
  // t8 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t8;
  // t9 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== props.onDone || $[1] !== props.onReject || $[2] !== props.toolUseConfirm || $[3] !== props.toolUseContext || $[4] !== props.workerBadge) {
    // 解析结果更新为 `parseInput(props.toolUseConfirm.input)`，确保权限确认界面后续读取最新状态。
    parsed = parseInput(props.toolUseConfirm.input);
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      notebook_path: t11,
      edit_mode,
      cell_type
    } = parsed;
    // notebook_path 路径数据更新为 `t11`，确保权限确认界面后续读取最新状态。
    notebook_path = t11;
    // language更新为 `cell_type === "markdown" ? "markdown" : "python"`，确保权限确认界面后续读取最新状态。
    language = cell_type === "markdown" ? "markdown" : "python";
    // editTypeText标记终端渲染权限确认界面 Notebook Edit Permissi...是否启用对应路径。
    const editTypeText = edit_mode === "insert" ? "insert this cell into" : edit_mode === "delete" ? "delete this cell from" : "make this edit to";
    // T2 暂存 `FilePermissionDialog` 生成的渲染片段，后续返回路径直接复用。
    T2 = FilePermissionDialog;
    // t5 暂存 `props.toolUseConfirm` 生成的渲染片段，后续返回路径直接复用。
    t5 = props.toolUseConfirm;
    // t6 暂存 `props.toolUseContext` 生成的渲染片段，后续返回路径直接复用。
    t6 = props.toolUseContext;
    // t7 暂存 `props.onDone` 生成的渲染片段，后续返回路径直接复用。
    t7 = props.onDone;
    // t8 暂存 `props.onReject` 生成的渲染片段，后续返回路径直接复用。
    t8 = props.onReject;
    // t9 暂存 `props.workerBadge` 生成的渲染片段，后续返回路径直接复用。
    t9 = props.workerBadge;
    // t10 暂存 `"Edit notebook"` 生成的渲染片段，后续返回路径直接复用。
    t10 = "Edit notebook";
    // T1 暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
    T1 = Text;
    // t2 暂存 `"Do you want to "` 生成的渲染片段，后续返回路径直接复用。
    t2 = "Do you want to ";
    // t3 暂存 `editTypeText` 生成的渲染片段，后续返回路径直接复用。
    t3 = editTypeText;
    // t4 暂存 `" "` 生成的渲染片段，后续返回路径直接复用。
    t4 = " ";
    // T0 暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
    T0 = Text;
    // t0 暂存 `true` 生成的渲染片段，后续返回路径直接复用。
    t0 = true;
    // t1 暂存 `basename(notebook_path)` 生成的渲染片段，后续返回路径直接复用。
    t1 = basename(notebook_path);
    // $[0] 缓存 `props.onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = props.onDone;
    // $[1] 缓存 `props.onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = props.onReject;
    // $[2] 缓存 `props.toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = props.toolUseConfirm;
    // $[3] 缓存 `props.toolUseContext`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = props.toolUseContext;
    // $[4] 缓存 `props.workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = props.workerBadge;
    // $[5] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = T0;
    // $[6] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = T1;
    // $[7] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = T2;
    // $[8] 缓存 `language`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = language;
    // $[9] 缓存 `notebook_path`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = notebook_path;
    // $[10] 缓存 `parsed`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = parsed;
    // $[11] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t0;
    // $[12] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t1;
    // $[13] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t10;
    // $[14] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t2;
    // $[15] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t3;
    // $[16] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t4;
    // $[17] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t5;
    // $[18] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t6;
    // $[19] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t7;
    // $[20] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t8;
    // $[21] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t9;
  } else {
    // T0 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[5];
    // T1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[6];
    // T2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    T2 = $[7];
    // language更新为 `$[8]`，确保权限确认界面后续读取最新状态。
    language = $[8];
    // notebook_path 路径数据更新为 `$[9]`，确保权限确认界面后续读取最新状态。
    notebook_path = $[9];
    // 解析结果更新为 `$[10]`，确保权限确认界面后续读取最新状态。
    parsed = $[10];
    // t0 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[11];
    // t1 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[12];
    // t10 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[13];
    // t2 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[14];
    // t3 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[15];
    // t4 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[16];
    // t5 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[17];
    // t6 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[18];
    // t7 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[19];
    // t8 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[20];
    // t9 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[21];
  }
  // t11 暂存 `<T0 bold={t0}>{t1}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== T0 || $[23] !== t0 || $[24] !== t1) {
    // t11 暂存 `<T0 bold={t0}>{t1}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <T0 bold={t0}>{t1}</T0>;
    // $[22] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = T0;
    // $[23] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t0;
    // $[24] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t1;
    // $[25] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[25];
  }
  // t12 暂存 `<T1>{t2}{t3}{t4}{t11}?</T1>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== T1 || $[27] !== t11 || $[28] !== t2 || $[29] !== t3 || $[30] !== t4) {
    // t12 暂存 `<T1>{t2}{t3}{t4}{t11}?</T1>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <T1>{t2}{t3}{t4}{t11}?</T1>;
    // $[26] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = T1;
    // $[27] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t11;
    // $[28] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t2;
    // $[29] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t3;
    // $[30] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t4;
    // $[31] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[31];
  }
  // t13保存`props.verbose ? 120 : 80`，供终端渲染权限确认界面 Notebook Edit Permissi...后续判断或输出使用。
  const t13 = props.verbose ? 120 : 80;
  // t14 暂存 `<NotebookEditToolDiff notebook_path={parsed.notebook_path...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== parsed.cell_id || $[33] !== parsed.cell_type || $[34] !== parsed.edit_mode || $[35] !== parsed.new_source || $[36] !== parsed.notebook_path || $[37] !== props.verbose || $[38] !== t13) {
    // t14 暂存 `<NotebookEditToolDiff notebook_path={parsed.notebook_path...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <NotebookEditToolDiff notebook_path={parsed.notebook_path} cell_id={parsed.cell_id} new_source={parsed.new_source} cell_type={parsed.cell_type} edit_mode={parsed.edit_mode} verbose={props.verbose} width={t13} />;
    // $[32] 缓存 `parsed.cell_id`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = parsed.cell_id;
    // $[33] 缓存 `parsed.cell_type`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = parsed.cell_type;
    // $[34] 缓存 `parsed.edit_mode`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = parsed.edit_mode;
    // $[35] 缓存 `parsed.new_source`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = parsed.new_source;
    // $[36] 缓存 `parsed.notebook_path`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = parsed.notebook_path;
    // $[37] 缓存 `props.verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = props.verbose;
    // $[38] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t13;
    // $[39] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[39];
  }
  // t15 暂存 `<T2 toolUseConfirm={t5} toolUseContext={t6} onDone={t7} o...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[40] !== T2 || $[41] !== language || $[42] !== notebook_path || $[43] !== t10 || $[44] !== t12 || $[45] !== t14 || $[46] !== t5 || $[47] !== t6 || $[48] !== t7 || $[49] !== t8 || $[50] !== t9) {
    // t15 暂存 `<T2 toolUseConfirm={t5} toolUseContext={t6} onDone={t7} o...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <T2 toolUseConfirm={t5} toolUseContext={t6} onDone={t7} onReject={t8} workerBadge={t9} title={t10} question={t12} content={t14} path={notebook_path} completionType="tool_use_single" languageName={language} parseInput={parseInput} />;
    // $[40] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = T2;
    // $[41] 缓存 `language`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = language;
    // $[42] 缓存 `notebook_path`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = notebook_path;
    // $[43] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t10;
    // $[44] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t12;
    // $[45] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t14;
    // $[46] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t5;
    // $[47] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t6;
    // $[48] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t7;
    // $[49] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t8;
    // $[50] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t9;
    // $[51] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[51] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[51];
  }
  // 返回 `t15`，作为终端渲染这次计算的结果。
  return t15;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(input) {
  // 结果保存`inputSchema.safeParse`，供终端渲染后续处理使用。
  const result = NotebookEditTool.inputSchema.safeParse(input);
  // result.success 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!result.success) {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Failed to parse notebook edit input: ${result.error.message}`));
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      notebook_path: "",
      new_source: "",
      cell_id: ""
    } as NotebookEditInput;
  }
  // 返回 `result.data`，作为终端渲染这次计算的结果。
  return result.data;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJiYXNlbmFtZSIsIlJlYWN0IiwieiIsIlRleHQiLCJOb3RlYm9va0VkaXRUb29sIiwibG9nRXJyb3IiLCJGaWxlUGVybWlzc2lvbkRpYWxvZyIsIlBlcm1pc3Npb25SZXF1ZXN0UHJvcHMiLCJOb3RlYm9va0VkaXRUb29sRGlmZiIsIk5vdGVib29rRWRpdElucHV0IiwiaW5mZXIiLCJpbnB1dFNjaGVtYSIsIk5vdGVib29rRWRpdFBlcm1pc3Npb25SZXF1ZXN0IiwicHJvcHMiLCIkIiwiX2MiLCJwYXJzZUlucHV0IiwiX3RlbXAiLCJUMCIsIlQxIiwiVDIiLCJsYW5ndWFnZSIsIm5vdGVib29rX3BhdGgiLCJwYXJzZWQiLCJ0MCIsInQxIiwidDEwIiwidDIiLCJ0MyIsInQ0IiwidDUiLCJ0NiIsInQ3IiwidDgiLCJ0OSIsIm9uRG9uZSIsIm9uUmVqZWN0IiwidG9vbFVzZUNvbmZpcm0iLCJ0b29sVXNlQ29udGV4dCIsIndvcmtlckJhZGdlIiwiaW5wdXQiLCJ0MTEiLCJlZGl0X21vZGUiLCJjZWxsX3R5cGUiLCJlZGl0VHlwZVRleHQiLCJ0MTIiLCJ0MTMiLCJ2ZXJib3NlIiwidDE0IiwiY2VsbF9pZCIsIm5ld19zb3VyY2UiLCJ0MTUiLCJyZXN1bHQiLCJzYWZlUGFyc2UiLCJzdWNjZXNzIiwiRXJyb3IiLCJlcnJvciIsIm1lc3NhZ2UiLCJkYXRhIl0sInNvdXJjZXMiOlsiTm90ZWJvb2tFZGl0UGVybWlzc2lvblJlcXVlc3QudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJhc2VuYW1lIH0gZnJvbSAncGF0aCdcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgeiB9IGZyb20gJ3pvZC92NCdcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBOb3RlYm9va0VkaXRUb29sIH0gZnJvbSAnLi4vLi4vLi4vdG9vbHMvTm90ZWJvb2tFZGl0VG9vbC9Ob3RlYm9va0VkaXRUb29sLmpzJ1xuaW1wb3J0IHsgbG9nRXJyb3IgfSBmcm9tICcuLi8uLi8uLi91dGlscy9sb2cuanMnXG5pbXBvcnQgeyBGaWxlUGVybWlzc2lvbkRpYWxvZyB9IGZyb20gJy4uL0ZpbGVQZXJtaXNzaW9uRGlhbG9nL0ZpbGVQZXJtaXNzaW9uRGlhbG9nLmpzJ1xuaW1wb3J0IHR5cGUgeyBQZXJtaXNzaW9uUmVxdWVzdFByb3BzIH0gZnJvbSAnLi4vUGVybWlzc2lvblJlcXVlc3QuanMnXG5pbXBvcnQgeyBOb3RlYm9va0VkaXRUb29sRGlmZiB9IGZyb20gJy4vTm90ZWJvb2tFZGl0VG9vbERpZmYuanMnXG5cbnR5cGUgTm90ZWJvb2tFZGl0SW5wdXQgPSB6LmluZmVyPHR5cGVvZiBOb3RlYm9va0VkaXRUb29sLmlucHV0U2NoZW1hPlxuXG5leHBvcnQgZnVuY3Rpb24gTm90ZWJvb2tFZGl0UGVybWlzc2lvblJlcXVlc3QoXG4gIHByb3BzOiBQZXJtaXNzaW9uUmVxdWVzdFByb3BzLFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgcGFyc2VJbnB1dCA9IChpbnB1dDogdW5rbm93bik6IE5vdGVib29rRWRpdElucHV0ID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBOb3RlYm9va0VkaXRUb29sLmlucHV0U2NoZW1hLnNhZmVQYXJzZShpbnB1dClcbiAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICBsb2dFcnJvcihcbiAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgIGBGYWlsZWQgdG8gcGFyc2Ugbm90ZWJvb2sgZWRpdCBpbnB1dDogJHtyZXN1bHQuZXJyb3IubWVzc2FnZX1gLFxuICAgICAgICApLFxuICAgICAgKVxuICAgICAgLy8gUmV0dXJuIGEgZGVmYXVsdCB2YWx1ZSB0byBhdm9pZCBjcmFzaGluZ1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbm90ZWJvb2tfcGF0aDogJycsXG4gICAgICAgIG5ld19zb3VyY2U6ICcnLFxuICAgICAgICBjZWxsX2lkOiAnJyxcbiAgICAgIH0gYXMgTm90ZWJvb2tFZGl0SW5wdXRcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5kYXRhXG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZUlucHV0KHByb3BzLnRvb2xVc2VDb25maXJtLmlucHV0KVxuICBjb25zdCB7IG5vdGVib29rX3BhdGgsIGVkaXRfbW9kZSwgY2VsbF90eXBlIH0gPSBwYXJzZWRcblxuICBjb25zdCBsYW5ndWFnZSA9IGNlbGxfdHlwZSA9PT0gJ21hcmtkb3duJyA/ICdtYXJrZG93bicgOiAncHl0aG9uJ1xuXG4gIGNvbnN0IGVkaXRUeXBlVGV4dCA9XG4gICAgZWRpdF9tb2RlID09PSAnaW5zZXJ0J1xuICAgICAgPyAnaW5zZXJ0IHRoaXMgY2VsbCBpbnRvJ1xuICAgICAgOiBlZGl0X21vZGUgPT09ICdkZWxldGUnXG4gICAgICAgID8gJ2RlbGV0ZSB0aGlzIGNlbGwgZnJvbSdcbiAgICAgICAgOiAnbWFrZSB0aGlzIGVkaXQgdG8nXG5cbiAgcmV0dXJuIChcbiAgICA8RmlsZVBlcm1pc3Npb25EaWFsb2dcbiAgICAgIHRvb2xVc2VDb25maXJtPXtwcm9wcy50b29sVXNlQ29uZmlybX1cbiAgICAgIHRvb2xVc2VDb250ZXh0PXtwcm9wcy50b29sVXNlQ29udGV4dH1cbiAgICAgIG9uRG9uZT17cHJvcHMub25Eb25lfVxuICAgICAgb25SZWplY3Q9e3Byb3BzLm9uUmVqZWN0fVxuICAgICAgd29ya2VyQmFkZ2U9e3Byb3BzLndvcmtlckJhZGdlfVxuICAgICAgdGl0bGU9XCJFZGl0IG5vdGVib29rXCJcbiAgICAgIHF1ZXN0aW9uPXtcbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgRG8geW91IHdhbnQgdG8ge2VkaXRUeXBlVGV4dH17JyAnfVxuICAgICAgICAgIDxUZXh0IGJvbGQ+e2Jhc2VuYW1lKG5vdGVib29rX3BhdGgpfTwvVGV4dD4/XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIH1cbiAgICAgIGNvbnRlbnQ9e1xuICAgICAgICA8Tm90ZWJvb2tFZGl0VG9vbERpZmZcbiAgICAgICAgICBub3RlYm9va19wYXRoPXtwYXJzZWQubm90ZWJvb2tfcGF0aH1cbiAgICAgICAgICBjZWxsX2lkPXtwYXJzZWQuY2VsbF9pZH1cbiAgICAgICAgICBuZXdfc291cmNlPXtwYXJzZWQubmV3X3NvdXJjZX1cbiAgICAgICAgICBjZWxsX3R5cGU9e3BhcnNlZC5jZWxsX3R5cGV9XG4gICAgICAgICAgZWRpdF9tb2RlPXtwYXJzZWQuZWRpdF9tb2RlfVxuICAgICAgICAgIHZlcmJvc2U9e3Byb3BzLnZlcmJvc2V9XG4gICAgICAgICAgd2lkdGg9e3Byb3BzLnZlcmJvc2UgPyAxMjAgOiA4MH1cbiAgICAgICAgLz5cbiAgICAgIH1cbiAgICAgIHBhdGg9e25vdGVib29rX3BhdGh9XG4gICAgICBjb21wbGV0aW9uVHlwZT1cInRvb2xfdXNlX3NpbmdsZVwiXG4gICAgICBsYW5ndWFnZU5hbWU9e2xhbmd1YWdlfVxuICAgICAgcGFyc2VJbnB1dD17cGFyc2VJbnB1dH1cbiAgICAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxRQUFRLFFBQVEsTUFBTTtBQUMvQixPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixjQUFjQyxDQUFDLFFBQVEsUUFBUTtBQUMvQixTQUFTQyxJQUFJLFFBQVEsaUJBQWlCO0FBQ3RDLFNBQVNDLGdCQUFnQixRQUFRLHFEQUFxRDtBQUN0RixTQUFTQyxRQUFRLFFBQVEsdUJBQXVCO0FBQ2hELFNBQVNDLG9CQUFvQixRQUFRLGlEQUFpRDtBQUN0RixjQUFjQyxzQkFBc0IsUUFBUSx5QkFBeUI7QUFDckUsU0FBU0Msb0JBQW9CLFFBQVEsMkJBQTJCO0FBRWhFLEtBQUtDLGlCQUFpQixHQUFHUCxDQUFDLENBQUNRLEtBQUssQ0FBQyxPQUFPTixnQkFBZ0IsQ0FBQ08sV0FBVyxDQUFDO0FBRXJFLE9BQU8sU0FBQUMsOEJBQUFDLEtBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFHTCxNQUFBQyxVQUFBLEdBQW1CQyxLQWdCbEI7RUFBQSxJ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