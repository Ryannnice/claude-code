// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, relative } from 'path';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 FileEditToolDiff 终端界面组件，避免在这里重复拼装显示逻辑。
import { FileEditToolDiff } from 'src/components/FileEditToolDiff.js';
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js';
// 类型依赖 { z } 来自 zod/v4，用于校准终端渲染的数据契约。
import type { z } from 'zod/v4';
// 引入 Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../../ink.js';
// 接入 FileEditTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileEditTool } from '../../../tools/FileEditTool/FileEditTool.js';
// 引入 FilePermissionDialog，将 ../FilePermissionDialog/FilePermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { FilePermissionDialog } from '../FilePermissionDialog/FilePermissionDialog.js';
// 引入 createSingleEditDiffConfig、FileEdit、IDEDiffSupport，将 ../FilePermissionDialog/ideDiffConfig.js 中已经封装好的能力接到本文件流程里。
import { createSingleEditDiffConfig, type FileEdit, type IDEDiffSupport } from '../FilePermissionDialog/ideDiffConfig.js';
// 类型依赖 { PermissionRequestProps } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { PermissionRequestProps } from '../PermissionRequest.js';
// FileEditInput 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FileEditInput = z.infer<typeof FileEditTool.inputSchema>;
// ideDiffSupport 集中保存权限确认界面 File Edit Permission Request要一起传递的字段。
const ideDiffSupport: IDEDiffSupport<FileEditInput> = {
  // 这个回调绑定到 getConfig: (input: FileEditInput) => createSingleEditDiffConfig(input.file_path, inp…，负责终端渲染在该局部场景下的响应。
  getConfig: (input: FileEditInput) => createSingleEditDiffConfig(input.file_path, input.old_string, input.new_string, input.replace_all),
  // 这个回调绑定到 applyChanges: (input: FileEditInput, modifiedEdits: FileEdit[]) => {，负责终端渲染在该局部场景下的响应。
  applyChanges: (input: FileEditInput, modifiedEdits: FileEdit[]) => {
    // firstEdit保存`modifiedEdits[0]`，供终端渲染权限确认界面 File Edit Permission R...后续判断或输出使用。
    const firstEdit = modifiedEdits[0];
    // 满足 `firstEdit` 时，终端渲染执行该分支。
    if (firstEdit) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...input,
        old_string: firstEdit.old_string,
        new_string: firstEdit.new_string,
        replace_all: firstEdit.replace_all
      };
    }
    // 返回 `input`，作为终端渲染这次计算的结果。
    return input;
  }
};
// FileEditPermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FileEditPermissionRequest(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(51);
  // parseInput保存`_temp`，供终端渲染权限确认界面 File Edit Permission R...后续判断或输出使用。
  const parseInput = _temp;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
  // T2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T2;
  // file_path 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let file_path;
  // new_string 先占位，稍后的条件分支会根据实际输入补齐它。
  let new_string;
  // old_string 先占位，稍后的条件分支会根据实际输入补齐它。
  let old_string;
  // replace_all 先占位，稍后的条件分支会根据实际输入补齐它。
  let replace_all;
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
    // 解析结果解析`parseInput`，供终端渲染后续处理使用。
    const parsed = parseInput(props.toolUseConfirm.input);
    // 重新解构输入对象，把权限确认界面 File Edit Permission Request需要的字段同步到本地变量。
    ({
      file_path,
      old_string,
      new_string,
      replace_all
    } = parsed);
    // T2 暂存 `FilePermissionDialog` 生成的渲染片段，后续返回路径直接复用。
    T2 = FilePermissionDialog;
    // t4 暂存 `props.toolUseConfirm` 生成的渲染片段，后续返回路径直接复用。
    t4 = props.toolUseConfirm;
    // t5 暂存 `props.toolUseContext` 生成的渲染片段，后续返回路径直接复用。
    t5 = props.toolUseContext;
    // t6 暂存 `props.onDone` 生成的渲染片段，后续返回路径直接复用。
    t6 = props.onDone;
    // t7 暂存 `props.onReject` 生成的渲染片段，后续返回路径直接复用。
    t7 = props.onReject;
    // t8 暂存 `props.workerBadge` 生成的渲染片段，后续返回路径直接复用。
    t8 = props.workerBadge;
    // t9 暂存 `"Edit file"` 生成的渲染片段，后续返回路径直接复用。
    t9 = "Edit file";
    // t10 暂存 `relative(getCwd(), file_path)` 生成的渲染片段，后续返回路径直接复用。
    t10 = relative(getCwd(), file_path);
    // T1 暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
    T1 = Text;
    // t2 暂存 `"Do you want to make this edit to"` 生成的渲染片段，后续返回路径直接复用。
    t2 = "Do you want to make this edit to";
    // t3 暂存 `" "` 生成的渲染片段，后续返回路径直接复用。
    t3 = " ";
    // T0 暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
    T0 = Text;
    // t0 暂存 `true` 生成的渲染片段，后续返回路径直接复用。
    t0 = true;
    // t1 暂存 `basename(file_path)` 生成的渲染片段，后续返回路径直接复用。
    t1 = basename(file_path);
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
    // $[8] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = file_path;
    // $[9] 缓存 `new_string`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = new_string;
    // $[10] 缓存 `old_string`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = old_string;
    // $[11] 缓存 `replace_all`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = replace_all;
    // $[12] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t0;
    // $[13] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t1;
    // $[14] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t10;
    // $[15] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t2;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
    // $[17] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t4;
    // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t5;
    // $[19] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t6;
    // $[20] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t7;
    // $[21] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t8;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
  } else {
    // T0 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[5];
    // T1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[6];
    // T2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    T2 = $[7];
    // file_path 路径数据更新为 `$[8]`，确保权限确认界面后续读取最新状态。
    file_path = $[8];
    // new_string更新为 `$[9]`，确保权限确认界面后续读取最新状态。
    new_string = $[9];
    // old_string更新为 `$[10]`，确保权限确认界面后续读取最新状态。
    old_string = $[10];
    // replace_all更新为 `$[11]`，确保权限确认界面后续读取最新状态。
    replace_all = $[11];
    // t0 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[12];
    // t1 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[13];
    // t10 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[14];
    // t2 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[15];
    // t3 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[16];
    // t4 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[17];
    // t5 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[18];
    // t6 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[19];
    // t7 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[20];
    // t8 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[21];
    // t9 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[22];
  }
  // t11 暂存 `<T0 bold={t0}>{t1}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== T0 || $[24] !== t0 || $[25] !== t1) {
    // t11 暂存 `<T0 bold={t0}>{t1}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <T0 bold={t0}>{t1}</T0>;
    // $[23] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = T0;
    // $[24] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t0;
    // $[25] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t1;
    // $[26] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[26];
  }
  // t12 暂存 `<T1>{t2}{t3}{t11}?</T1>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== T1 || $[28] !== t11 || $[29] !== t2 || $[30] !== t3) {
    // t12 暂存 `<T1>{t2}{t3}{t11}?</T1>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <T1>{t2}{t3}{t11}?</T1>;
    // $[27] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = T1;
    // $[28] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t11;
    // $[29] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t2;
    // $[30] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t3;
    // $[31] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[31];
  }
  // t13标记终端渲染权限确认界面 File Edit Permission R...是否启用对应路径。
  const t13 = replace_all || false;
  // t14 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== new_string || $[33] !== old_string || $[34] !== t13) {
    // t14 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t14 = [{
      old_string,
      new_string,
      replace_all: t13
    }];
    // $[32] 缓存 `new_string`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = new_string;
    // $[33] 缓存 `old_string`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = old_string;
    // $[34] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t13;
    // $[35] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[35];
  }
  // t15 暂存 `<FileEditToolDiff file_path={file_path} edits={t14} />` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[36] !== file_path || $[37] !== t14) {
    // t15 暂存 `<FileEditToolDiff file_path={file_path} edits={t14} />` 生成的渲染片段，后续返回路径直接复用。
    t15 = <FileEditToolDiff file_path={file_path} edits={t14} />;
    // $[36] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = file_path;
    // $[37] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t14;
    // $[38] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[38];
  }
  // t16 暂存 `<T2 toolUseConfirm={t4} toolUseContext={t5} onDone={t6} o...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[39] !== T2 || $[40] !== file_path || $[41] !== t10 || $[42] !== t12 || $[43] !== t15 || $[44] !== t4 || $[45] !== t5 || $[46] !== t6 || $[47] !== t7 || $[48] !== t8 || $[49] !== t9) {
    // t16 暂存 `<T2 toolUseConfirm={t4} toolUseContext={t5} onDone={t6} o...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <T2 toolUseConfirm={t4} toolUseContext={t5} onDone={t6} onReject={t7} workerBadge={t8} title={t9} subtitle={t10} question={t12} content={t15} path={file_path} completionType="str_replace_single" parseInput={parseInput} ideDiffSupport={ideDiffSupport} />;
    // $[39] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = T2;
    // $[40] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = file_path;
    // $[41] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t10;
    // $[42] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t12;
    // $[43] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t15;
    // $[44] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t4;
    // $[45] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t5;
    // $[46] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t6;
    // $[47] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t7;
    // $[48] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t8;
    // $[49] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t9;
    // $[50] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[50];
  }
  // 返回 `t16`，作为终端渲染这次计算的结果。
  return t16;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(input) {
  // 返回 `FileEditTool.inputSchema.parse(input)`，作为终端渲染这次计算的结果。
  return FileEditTool.inputSchema.parse(input);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJiYXNlbmFtZSIsInJlbGF0aXZlIiwiUmVhY3QiLCJGaWxlRWRpdFRvb2xEaWZmIiwiZ2V0Q3dkIiwieiIsIlRleHQiLCJGaWxlRWRpdFRvb2wiLCJGaWxlUGVybWlzc2lvbkRpYWxvZyIsImNyZWF0ZVNpbmdsZUVkaXREaWZmQ29uZmlnIiwiRmlsZUVkaXQiLCJJREVEaWZmU3VwcG9ydCIsIlBlcm1pc3Npb25SZXF1ZXN0UHJvcHMiLCJGaWxlRWRpdElucHV0IiwiaW5mZXIiLCJpbnB1dFNjaGVtYSIsImlkZURpZmZTdXBwb3J0IiwiZ2V0Q29uZmlnIiwiaW5wdXQiLCJmaWxlX3BhdGgiLCJvbGRfc3RyaW5nIiwibmV3X3N0cmluZyIsInJlcGxhY2VfYWxsIiwiYXBwbHlDaGFuZ2VzIiwibW9kaWZpZWRFZGl0cyIsImZpcnN0RWRpdCIsIkZpbGVFZGl0UGVybWlzc2lvblJlcXVlc3QiLCJwcm9wcyIsIiQiLCJfYyIsInBhcnNlSW5wdXQiLCJfdGVtcCIsIlQwIiwiVDEiLCJUMiIsInQwIiwidDEiLCJ0MTAiLCJ0MiIsInQzIiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0OCIsInQ5Iiwib25Eb25lIiwib25SZWplY3QiLCJ0b29sVXNlQ29uZmlybSIsInRvb2xVc2VDb250ZXh0Iiwid29ya2VyQmFkZ2UiLCJwYXJzZWQiLCJ0MTEiLCJ0MTIiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJ0MTYiLCJwYXJzZSJdLCJzb3VyY2VzIjpbIkZpbGVFZGl0UGVybWlzc2lvblJlcXVlc3QudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJhc2VuYW1lLCByZWxhdGl2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBGaWxlRWRpdFRvb2xEaWZmIH0gZnJvbSAnc3JjL2NvbXBvbmVudHMvRmlsZUVkaXRUb29sRGlmZi5qcydcbmltcG9ydCB7IGdldEN3ZCB9IGZyb20gJ3NyYy91dGlscy9jd2QuanMnXG5pbXBvcnQgdHlwZSB7IHogfSBmcm9tICd6b2QvdjQnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgRmlsZUVkaXRUb29sIH0gZnJvbSAnLi4vLi4vLi4vdG9vbHMvRmlsZUVkaXRUb29sL0ZpbGVFZGl0VG9vbC5qcydcbmltcG9ydCB7IEZpbGVQZXJtaXNzaW9uRGlhbG9nIH0gZnJvbSAnLi4vRmlsZVBlcm1pc3Npb25EaWFsb2cvRmlsZVBlcm1pc3Npb25EaWFsb2cuanMnXG5pbXBvcnQge1xuICBjcmVhdGVTaW5nbGVFZGl0RGlmZkNvbmZpZyxcbiAgdHlwZSBGaWxlRWRpdCxcbiAgdHlwZSBJREVEaWZmU3VwcG9ydCxcbn0gZnJvbSAnLi4vRmlsZVBlcm1pc3Npb25EaWFsb2cvaWRlRGlmZkNvbmZpZy5qcydcbmltcG9ydCB0eXBlIHsgUGVybWlzc2lvblJlcXVlc3RQcm9wcyB9IGZyb20gJy4uL1Blcm1pc3Npb25SZXF1ZXN0LmpzJ1xuXG50eXBlIEZpbGVFZGl0SW5wdXQgPSB6LmluZmVyPHR5cGVvZiBGaWxlRWRpdFRvb2wuaW5wdXRTY2hlbWE+XG5cbmNvbnN0IGlkZURpZmZTdXBwb3J0OiBJREVEaWZmU3VwcG9ydDxGaWxlRWRpdElucHV0PiA9IHtcbiAgZ2V0Q29uZmlnOiAoaW5wdXQ6IEZpbGVFZGl0SW5wdXQpID0+XG4gICAgY3JlYXRlU2luZ2xlRWRpdERpZmZDb25maWcoXG4gICAgICBpbnB1dC5maWxlX3BhdGgsXG4gICAgICBpbnB1dC5vbGRfc3RyaW5nLFxuICAgICAgaW5wdXQubmV3X3N0cmluZyxcbiAgICAgIGlucHV0LnJlcGxhY2VfYWxsLFxuICAgICksXG4gIGFwcGx5Q2hhbmdlczogKGlucHV0OiBGaWxlRWRpdElucHV0LCBtb2RpZmllZEVkaXRzOiBGaWxlRWRpdFtdKSA9PiB7XG4gICAgY29uc3QgZmlyc3RFZGl0ID0gbW9kaWZpZWRFZGl0c1swXVxuICAgIGlmIChmaXJzdEVkaXQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmlucHV0LFxuICAgICAgICBvbGRfc3RyaW5nOiBmaXJzdEVkaXQub2xkX3N0cmluZyxcbiAgICAgICAgbmV3X3N0cmluZzogZmlyc3RFZGl0Lm5ld19zdHJpbmcsXG4gICAgICAgIHJlcGxhY2VfYWxsOiBmaXJzdEVkaXQucmVwbGFjZV9hbGwsXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbnB1dFxuICB9LFxufVxuXG5leHBvcnQgZnVuY3Rpb24gRmlsZUVkaXRQZXJtaXNzaW9uUmVxdWVzdChcbiAgcHJvcHM6IFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMsXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBwYXJzZUlucHV0ID0gKGlucHV0OiB1bmtub3duKTogRmlsZUVkaXRJbnB1dCA9PiB7XG4gICAgcmV0dXJuIEZpbGVFZGl0VG9vbC5pbnB1dFNjaGVtYS5wYXJzZShpbnB1dClcbiAgfVxuXG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlSW5wdXQocHJvcHMudG9vbFVzZUNvbmZpcm0uaW5wdXQpXG4gIGNvbnN0IHsgZmlsZV9wYXRoLCBvbGRfc3RyaW5nLCBuZXdfc3RyaW5nLCByZXBsYWNlX2FsbCB9ID0gcGFyc2VkXG5cbiAgcmV0dXJuIChcbiAgICA8RmlsZVBlcm1pc3Npb25EaWFsb2dcbiAgICAgIHRvb2xVc2VDb25maXJtPXtwcm9wcy50b29sVXNlQ29uZmlybX1cbiAgICAgIHRvb2xVc2VDb250ZXh0PXtwcm9wcy50b29sVXNlQ29udGV4dH1cbiAgICAgIG9uRG9uZT17cHJvcHMub25Eb25lfVxuICAgICAgb25SZWplY3Q9e3Byb3BzLm9uUmVqZWN0fVxuICAgICAgd29ya2VyQmFkZ2U9e3Byb3BzLndvcmtlckJhZGdlfVxuICAgICAgdGl0bGU9XCJFZGl0IGZpbGVcIlxuICAgICAgc3VidGl0bGU9e3JlbGF0aXZlKGdldEN3ZCgpLCBmaWxlX3BhdGgpfVxuICAgICAgcXVlc3Rpb249e1xuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBEbyB5b3Ugd2FudCB0byBtYWtlIHRoaXMgZWRpdCB0b3snICd9XG4gICAgICAgICAgPFRleHQgYm9sZD57YmFzZW5hbWUoZmlsZV9wYXRoKX08L1RleHQ+P1xuICAgICAgICA8L1RleHQ+XG4gICAgICB9XG4gICAgICBjb250ZW50PXtcbiAgICAgICAgPEZpbGVFZGl0VG9vbERpZmZcbiAgICAgICAgICBmaWxlX3BhdGg9e2ZpbGVfcGF0aH1cbiAgICAgICAgICBlZGl0cz17W1xuICAgICAgICAgICAgeyBvbGRfc3RyaW5nLCBuZXdfc3RyaW5nLCByZXBsYWNlX2FsbDogcmVwbGFjZV9hbGwgfHwgZmFsc2UgfSxcbiAgICAgICAgICBdfVxuICAgICAgICAvPlxuICAgICAgfVxuICAgICAgcGF0aD17ZmlsZV9wYXRofVxuICAgICAgY29tcGxldGlvblR5cGU9XCJzdHJfcmVwbGFjZV9zaW5nbGVcIlxuICAgICAgcGFyc2VJbnB1dD17cGFyc2VJbnB1dH1cbiAgICAgIGlkZURpZmZTdXBwb3J0PXtpZGVEaWZmU3VwcG9ydH1cbiAgICAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxRQUFRLEVBQUVDLFFBQVEsUUFBUSxNQUFNO0FBQ3pDLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLGdCQUFnQixRQUFRLG9DQUFvQztBQUNyRSxTQUFTQyxNQUFNLFFBQVEsa0JBQWtCO0FBQ3pDLGNBQWNDLENBQUMsUUFBUSxRQUFRO0FBQy9CLFNBQVNDLElBQUksUUFBUSxpQkFBaUI7QUFDdEMsU0FBU0MsWUFBWSxRQUFRLDZDQUE2QztBQUMxRSxTQUFTQyxvQkFBb0IsUUFBUSxpREFBaUQ7QUFDdEYsU0FDRUMsMEJBQTBCLEVBQzFCLEtBQUtDLFFBQVEsRUFDYixLQUFLQyxjQUFjLFFBQ2QsMENBQTBDO0FBQ2pELGNBQWNDLHNCQUFzQixRQUFRLHlCQUF5QjtBQUVyRSxLQUFLQyxhQUFhLEdBQUdSLENBQUMsQ0FBQ1MsS0FBSyxDQUFDLE9BQU9QLFlBQVksQ0FBQ1EsV0FBVyxDQUFDO0FBRTdELE1BQU1DLGNBQWMsRUFBRUwsY0FB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