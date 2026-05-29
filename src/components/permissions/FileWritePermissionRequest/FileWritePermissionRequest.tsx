// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, relative } from 'path';
// 引入 React、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useMemo } from 'react';
// 类型依赖 { z } 来自 zod/v4，用于校准终端渲染的数据契约。
import type { z } from 'zod/v4';
// 引入 Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../../ink.js';
// 接入 FileWriteTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FileWriteTool } from '../../../tools/FileWriteTool/FileWriteTool.js';
// 复用 getCwd 工具函数，把通用处理留在 ../../../utils/cwd.js 中维护。
import { getCwd } from '../../../utils/cwd.js';
// 复用 isENOENT 工具函数，把通用处理留在 ../../../utils/errors.js 中维护。
import { isENOENT } from '../../../utils/errors.js';
// 复用 readFileSync 工具函数，把通用处理留在 ../../../utils/fileRead.js 中维护。
import { readFileSync } from '../../../utils/fileRead.js';
// 引入 FilePermissionDialog，将 ../FilePermissionDialog/FilePermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { FilePermissionDialog } from '../FilePermissionDialog/FilePermissionDialog.js';
// 引入 createSingleEditDiffConfig、FileEdit、IDEDiffSupport，将 ../FilePermissionDialog/ideDiffConfig.js 中已经封装好的能力接到本文件流程里。
import { createSingleEditDiffConfig, type FileEdit, type IDEDiffSupport } from '../FilePermissionDialog/ideDiffConfig.js';
// 类型依赖 { PermissionRequestProps } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { PermissionRequestProps } from '../PermissionRequest.js';
// 引入 FileWriteToolDiff，将 ./FileWriteToolDiff.js 中已经封装好的能力接到本文件流程里。
import { FileWriteToolDiff } from './FileWriteToolDiff.js';
// FileWriteToolInput 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FileWriteToolInput = z.infer<typeof FileWriteTool.inputSchema>;
// ideDiffSupport 集中保存权限确认界面 File Write Permission Request要一起传递的字段。
const ideDiffSupport: IDEDiffSupport<FileWriteToolInput> = {
  // 这个回调绑定到 getConfig: (input: FileWriteToolInput) => {，负责终端渲染在该局部场景下的响应。
  getConfig: (input: FileWriteToolInput) => {
    // 原始内容 先占位，稍后的条件分支会根据实际输入补齐它。
    let oldContent: string;
    // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
    try {
      // 原始内容更新为 `readFileSync(input.file_path)`，确保权限确认界面后续读取最新状态。
      oldContent = readFileSync(input.file_path);
    } catch (e) {
      // 满足 `!isENOENT(e)` 时，终端渲染执行该分支。
      if (!isENOENT(e)) throw e;
      // 原始内容更新为 `''`，确保权限确认界面后续读取最新状态。
      oldContent = '';
    }
    // 返回 `createSingleEditDiffConfig(input.file_path, oldContent, input.content, ...`，作为终端渲染这次计算的结果。
    return createSingleEditDiffConfig(input.file_path, oldContent, input.content, false // For file writes, we replace the entire content
    );
  },
  // 这个回调绑定到 applyChanges: (input: FileWriteToolInput, modifiedEdits: FileEdit[]) => {，负责终端渲染在该局部场景下的响应。
  applyChanges: (input: FileWriteToolInput, modifiedEdits: FileEdit[]) => {
    // firstEdit读取 `modifiedEdits[0]` 对应条目，后续围绕该成员继续处理。
    const firstEdit = modifiedEdits[0];
    // 满足 `firstEdit` 时，终端渲染执行该分支。
    if (firstEdit) {
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...input,
        content: firstEdit.new_string
      };
    }
    // 返回 `input`，作为终端渲染这次计算的结果。
    return input;
  }
};
// FileWritePermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FileWritePermissionRequest(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(30);
  // parseInput保存`_temp`，供后续判断或组装使用。
  const parseInput = _temp;
  // t0 暂存 `parseInput(props.toolUseConfirm.input)` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== props.toolUseConfirm.input) {
    // t0 暂存 `parseInput(props.toolUseConfirm.input)` 生成的渲染片段，后续返回路径直接复用。
    t0 = parseInput(props.toolUseConfirm.input);
    // $[0] 缓存 `props.toolUseConfirm.input`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = props.toolUseConfirm.input;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // 解析结果沿用 `t0` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const parsed = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    file_path,
    content
  } = parsed;
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== file_path) {
    // 权限确认界面 File Write Permission Request在这里处理 ``，完成这一小步状态转换。
    ;
    // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
    try {
      // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t1 = {
        fileExists: true,
        oldContent: readFileSync(file_path)
      };
    } catch (t2) {
      // e沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
      const e = t2;
      // 满足 `!isENOENT(e)` 时，终端渲染执行该分支。
      if (!isENOENT(e)) {
        // 抛出 e;，阻止终端渲染在无效状态下继续运行。
        throw e;
      }
      // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t3;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t3 = {
          fileExists: false,
          oldContent: ""
        };
        // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[4] = t3;
      } else {
        // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
        t3 = $[4];
      }
      // t1 暂存 `t3` 生成的渲染片段，后续返回路径直接复用。
      t1 = t3;
    }
    // $[2] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = file_path;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    fileExists,
    oldContent
  } = t1;
  // actionText构建`fileExists ? "overwrite" : "create"` 整理出中间结果，供终端渲染权限确认界面 File Write Permission ...后续步骤使用。
  const actionText = fileExists ? "overwrite" : "create";
  // t2保存`props.toolUseConfirm`，供终端渲染权限确认界面 File Write Permission ...后续判断或输出使用。
  const t2 = props.toolUseConfirm;
  // t3保存`props.toolUseContext`，供后续判断或组装使用。
  const t3 = props.toolUseContext;
  // 临时值 t4 命名 `props.onDone`，让后续代码直接表达这个值的用途。
  const t4 = props.onDone;
  // 临时值 t5 命名 `props.onReject`，让后续代码直接表达这个值的用途。
  const t5 = props.onReject;
  // t6保存`props.workerBadge`，供终端渲染权限确认界面 File Write Permission ...后续判断或输出使用。
  const t6 = props.workerBadge;
  // t7保存`fileExists ? "Overwrite file" : "Create file"`，供终端渲染权限确认界面 File Write Permission ...后续判断或输出使用。
  const t7 = fileExists ? "Overwrite file" : "Create file";
  // t8 暂存 `relative(getCwd(), file_path)` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== file_path) {
    // t8 暂存 `relative(getCwd(), file_path)` 生成的渲染片段，后续返回路径直接复用。
    t8 = relative(getCwd(), file_path);
    // $[5] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = file_path;
    // $[6] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[6];
  }
  // t9 暂存 `basename(file_path)` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== file_path) {
    // t9 暂存 `basename(file_path)` 生成的渲染片段，后续返回路径直接复用。
    t9 = basename(file_path);
    // $[7] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = file_path;
    // $[8] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[8];
  }
  // t10 暂存 `<Text bold={true}>{t9}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== t9) {
    // t10 暂存 `<Text bold={true}>{t9}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text bold={true}>{t9}</Text>;
    // $[9] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t9;
    // $[10] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[10];
  }
  // t11 暂存 `<Text>Do you want to {actionText} {t10}?</Text>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== actionText || $[12] !== t10) {
    // t11 暂存 `<Text>Do you want to {actionText} {t10}?</Text>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text>Do you want to {actionText} {t10}?</Text>;
    // $[11] 缓存 `actionText`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = actionText;
    // $[12] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t10;
    // $[13] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[13];
  }
  // t12 暂存 `<FileWriteToolDiff file_path={file_path} content={content...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== content || $[15] !== fileExists || $[16] !== file_path || $[17] !== oldContent) {
    // t12 暂存 `<FileWriteToolDiff file_path={file_path} content={content...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <FileWriteToolDiff file_path={file_path} content={content} fileExists={fileExists} oldContent={oldContent} />;
    // $[14] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = content;
    // $[15] 缓存 `fileExists`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = fileExists;
    // $[16] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = file_path;
    // $[17] 缓存 `oldContent`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = oldContent;
    // $[18] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[18];
  }
  // t13 暂存 `<FilePermissionDialog toolUseConfirm={t2} toolUseContext=...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== file_path || $[20] !== props.onDone || $[21] !== props.onReject || $[22] !== props.toolUseConfirm || $[23] !== props.toolUseContext || $[24] !== props.workerBadge || $[25] !== t11 || $[26] !== t12 || $[27] !== t7 || $[28] !== t8) {
    // t13 暂存 `<FilePermissionDialog toolUseConfirm={t2} toolUseContext=...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <FilePermissionDialog toolUseConfirm={t2} toolUseContext={t3} onDone={t4} onReject={t5} workerBadge={t6} title={t7} subtitle={t8} question={t11} content={t12} path={file_path} completionType="write_file_single" parseInput={parseInput} ideDiffSupport={ideDiffSupport} />;
    // $[19] 缓存 `file_path`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = file_path;
    // $[20] 缓存 `props.onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = props.onDone;
    // $[21] 缓存 `props.onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = props.onReject;
    // $[22] 缓存 `props.toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = props.toolUseConfirm;
    // $[23] 缓存 `props.toolUseContext`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = props.toolUseContext;
    // $[24] 缓存 `props.workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = props.workerBadge;
    // $[25] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t11;
    // $[26] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t12;
    // $[27] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t7;
    // $[28] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t8;
    // $[29] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[29];
  }
  // 返回 `t13`，作为终端渲染这次计算的结果。
  return t13;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(input) {
  // 返回 `FileWriteTool.inputSchema.parse(input)`，作为终端渲染这次计算的结果。
  return FileWriteTool.inputSchema.parse(input);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJiYXNlbmFtZSIsInJlbGF0aXZlIiwiUmVhY3QiLCJ1c2VNZW1vIiwieiIsIlRleHQiLCJGaWxlV3JpdGVUb29sIiwiZ2V0Q3dkIiwiaXNFTk9FTlQiLCJyZWFkRmlsZVN5bmMiLCJGaWxlUGVybWlzc2lvbkRpYWxvZyIsImNyZWF0ZVNpbmdsZUVkaXREaWZmQ29uZmlnIiwiRmlsZUVkaXQiLCJJREVEaWZmU3VwcG9ydCIsIlBlcm1pc3Npb25SZXF1ZXN0UHJvcHMiLCJGaWxlV3JpdGVUb29sRGlmZiIsIkZpbGVXcml0ZVRvb2xJbnB1dCIsImluZmVyIiwiaW5wdXRTY2hlbWEiLCJpZGVEaWZmU3VwcG9ydCIsImdldENvbmZpZyIsImlucHV0Iiwib2xkQ29udGVudCIsImZpbGVfcGF0aCIsImUiLCJjb250ZW50IiwiYXBwbHlDaGFuZ2VzIiwibW9kaWZpZWRFZGl0cyIsImZpcnN0RWRpdCIsIm5ld19zdHJpbmciLCJGaWxlV3JpdGVQZXJtaXNzaW9uUmVxdWVzdCIsInByb3BzIiwiJCIsIl9jIiwicGFyc2VJbnB1dCIsIl90ZW1wIiwidDAiLCJ0b29sVXNlQ29uZmlybSIsInBhcnNlZCIsInQxIiwiZmlsZUV4aXN0cyIsInQyIiwidDMiLCJTeW1ib2wiLCJmb3IiLCJhY3Rpb25UZXh0IiwidG9vbFVzZUNvbnRleHQiLCJ0NCIsIm9uRG9uZSIsInQ1Iiwib25SZWplY3QiLCJ0NiIsIndvcmtlckJhZGdlIiwidDciLCJ0OCIsInQ5IiwidDEwIiwidDExIiwidDEyIiwidDEzIiwicGFyc2UiXSwic291cmNlcyI6WyJGaWxlV3JpdGVQZXJtaXNzaW9uUmVxdWVzdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmFzZW5hbWUsIHJlbGF0aXZlIH0gZnJvbSAncGF0aCdcbmltcG9ydCBSZWFjdCwgeyB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IHogfSBmcm9tICd6b2QvdjQnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgRmlsZVdyaXRlVG9vbCB9IGZyb20gJy4uLy4uLy4uL3Rvb2xzL0ZpbGVXcml0ZVRvb2wvRmlsZVdyaXRlVG9vbC5qcydcbmltcG9ydCB7IGdldEN3ZCB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL2N3ZC5qcydcbmltcG9ydCB7IGlzRU5PRU5UIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvZXJyb3JzLmpzJ1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvZmlsZVJlYWQuanMnXG5pbXBvcnQgeyBGaWxlUGVybWlzc2lvbkRpYWxvZyB9IGZyb20gJy4uL0ZpbGVQZXJtaXNzaW9uRGlhbG9nL0ZpbGVQZXJtaXNzaW9uRGlhbG9nLmpzJ1xuaW1wb3J0IHtcbiAgY3JlYXRlU2luZ2xlRWRpdERpZmZDb25maWcsXG4gIHR5cGUgRmlsZUVkaXQsXG4gIHR5cGUgSURFRGlmZlN1cHBvcnQsXG59IGZyb20gJy4uL0ZpbGVQZXJtaXNzaW9uRGlhbG9nL2lkZURpZmZDb25maWcuanMnXG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMgfSBmcm9tICcuLi9QZXJtaXNzaW9uUmVxdWVzdC5qcydcbmltcG9ydCB7IEZpbGVXcml0ZVRvb2xEaWZmIH0gZnJvbSAnLi9GaWxlV3JpdGVUb29sRGlmZi5qcydcblxudHlwZSBGaWxlV3JpdGVUb29sSW5wdXQgPSB6LmluZmVyPHR5cGVvZiBGaWxlV3JpdGVUb29sLmlucHV0U2NoZW1hPlxuXG5jb25zdCBpZGVEaWZmU3VwcG9ydDogSURFRGlmZlN1cHBvcnQ8RmlsZVdyaXRlVG9vbElucHV0PiA9IHtcbiAgZ2V0Q29uZmlnOiAoaW5wdXQ6IEZpbGVXcml0ZVRvb2xJbnB1dCkgPT4ge1xuICAgIGxldCBvbGRDb250ZW50OiBzdHJpbmdcbiAgICB0cnkge1xuICAgICAgb2xkQ29udGVudCA9IHJlYWRGaWxlU3luYyhpbnB1dC5maWxlX3BhdGgpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKCFpc0VOT0VOVChlKSkgdGhyb3cgZVxuICAgICAgb2xkQ29udGVudCA9ICcnXG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZVNpbmdsZUVkaXREaWZmQ29uZmlnKFxuICAgICAgaW5wdXQuZmlsZV9wYXRoLFxuICAgICAgb2xkQ29udGVudCxcbiAgICAgIGlucHV0LmNvbnRlbnQsXG4gICAgICBmYWxzZSwgLy8gRm9yIGZpbGUgd3JpdGVzLCB3ZSByZXBsYWNlIHRoZSBlbnRpcmUgY29udGVudFxuICAgIClcbiAgfSxcbiAgYXBwbHlDaGFuZ2VzOiAoaW5wdXQ6IEZpbGVXcml0ZVRvb2xJbnB1dCwgbW9kaWZpZWRFZGl0czogRmlsZUVkaXRbXSkgPT4ge1xuICAgIGNvbnN0IGZpcnN0RWRpdCA9IG1vZGlmaWVkRWRpdHNbMF1cbiAgICBpZiAoZmlyc3RFZGl0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5pbnB1dCxcbiAgICAgICAgY29udGVudDogZmlyc3RFZGl0Lm5ld19zdHJpbmcsXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbnB1dFxuICB9LFxufVxuXG5leHBvcnQgZnVuY3Rpb24gRmlsZVdyaXRlUGVybWlzc2lvblJlcXVlc3QoXG4gIHByb3BzOiBQZXJtaXNzaW9uUmVxdWVzdFByb3BzLFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgcGFyc2VJbnB1dCA9IChpbnB1dDogdW5rbm93bik6IEZpbGVXcml0ZVRvb2xJbnB1dCA9PiB7XG4gICAgcmV0dXJuIEZpbGVXcml0ZVRvb2wuaW5wdXRTY2hlbWEucGFyc2UoaW5wdXQpXG4gIH1cblxuICBjb25zdCBwYXJzZWQgPSBwYXJzZUlucHV0KHByb3BzLnRvb2xVc2VDb25maXJtLmlucHV0KVxuICBjb25zdCB7IGZpbGVfcGF0aCwgY29udGVudCB9ID0gcGFyc2VkXG5cbiAgLy8gU2luZ2xlIHJlYWQgZHJpdmVzIGJvdGggVUkgdGV4dCAoXCJDcmVhdGVcIiB2cyBcIk92ZXJ3cml0ZVwiKSBhbmQgdGhlIGRpZmZcbiAgLy8gc2hvd24gYnkgRmlsZVdyaXRlVG9vbERpZmYg4oCUIGF2b2lkcyBhIHJlZHVuZGFudCBleGlzdHNTeW5jIHN0YXQgdGhhdCB3b3VsZFxuICAvLyBibG9jayBmaXJzdC1tb3VudCBjb21taXQgb24gc2xvdy9uZXR3b3JrZWQgZmlsZXN5c3RlbXMuXG4gIGNvbnN0IHsgZmlsZUV4aXN0cywgb2xkQ29udGVudCB9ID0gdXNlTWVtbygoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB7IGZpbGVFeGlzdHM6IHRydWUsIG9sZENvbnRlbnQ6IHJlYWRGaWxlU3luYyhmaWxlX3BhdGgpIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoIWlzRU5PRU5UKGUpKSB0aHJvdyBlXG4gICAgICByZXR1cm4geyBmaWxlRXhpc3RzOiBmYWxzZSwgb2xkQ29udGVudDogJycgfVxuICAgIH1cbiAgfSwgW2ZpbGVfcGF0aF0pXG5cbiAgY29uc3QgYWN0aW9uVGV4dCA9IGZpbGVFeGlzdHMgPyAnb3ZlcndyaXRlJyA6ICdjcmVhdGUnXG5cbiAgcmV0dXJuIChcbiAgICA8RmlsZVBlcm1pc3Npb25EaWFsb2dcbiAgICAgIHRvb2xVc2VDb25maXJtPXtwcm9wcy50b29sVXNlQ29uZmlybX1cbiAgICAgIHRvb2xVc2VDb250ZXh0PXtwcm9wcy50b29sVXNlQ29udGV4dH1cbiAgICAgIG9uRG9uZT17cHJvcHMub25Eb25lfVxuICAgICAgb25SZWplY3Q9e3Byb3BzLm9uUmVqZWN0fVxuICAgICAgd29ya2VyQmFkZ2U9e3Byb3BzLndvcmtlckJhZGdlfVxuICAgICAgdGl0bGU9e2ZpbGVFeGlzdHMgPyAnT3ZlcndyaXRlIGZpbGUnIDogJ0NyZWF0ZSBmaWxlJ31cbiAgICAgIHN1YnRpdGxlPXtyZWxhdGl2ZShnZXRDd2QoKSwgZmlsZV9wYXRoKX1cbiAgICAgIHF1ZXN0aW9uPXtcbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgRG8geW91IHdhbnQgdG8ge2FjdGlvblRleHR9IDxUZXh0IGJvbGQ+e2Jhc2VuYW1lKGZpbGVfcGF0aCl9PC9UZXh0Pj9cbiAgICAgICAgPC9UZXh0PlxuICAgICAgfVxuICAgICAgY29udGVudD17XG4gICAgICAgIDxGaWxlV3JpdGVUb29sRGlmZlxuICAgICAgICAgIGZpbGVfcGF0aD17ZmlsZV9wYXRofVxuICAgICAgICAgIGNvbnRlbnQ9e2NvbnRlbnR9XG4gICAgICAgICAgZmlsZUV4aXN0cz17ZmlsZUV4aXN0c31cbiAgICAgICAgICBvbGRDb250ZW50PXtvbGRDb250ZW50fVxuICAgICAgICAvPlxuICAgICAgfVxuICAgICAgcGF0aD17ZmlsZV9wYXRofVxuICAgICAgY29tcGxldGlvblR5cGU9XCJ3cml0ZV9maWxlX3NpbmdsZVwiXG4gICAgICBwYXJzZUlucHV0PXtwYXJzZUlucHV0fVxuICAgICAgaWRlRGlmZlN1cHBvcnQ9e2lkZURpZmZTdXBwb3J0fVxuICAgIC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLFFBQVEsRUFBRUMsUUFBUSxRQUFRLE1BQU07QUFDekMsT0FBT0MsS0FBSyxJQUFJQyxPQUFPLFFBQVEsT0FBTztBQUN0QyxjQUFjQyxDQUFDLFFBQVEsUUFBUTtBQUMvQixTQUFTQyxJQUFJLFFBQVEsaUJBQWlCO0FBQ3RDLFNBQVNDLGFBQWEsUUFBUSwrQ0FBK0M7QUFDN0UsU0FBU0MsTUFBTSxRQUFRLHVCQUF1QjtBQUM5QyxTQUFTQyxRQUFRLFFBQVEsMEJBQTBCO0FBQ25ELFNBQVNDLFlBQVksUUFBUSw0QkFBNEI7QUFDekQsU0FBU0Msb0JBQW9CLFFBQVEsaURBQWlEO0FBQ3RGLFNBQ0VDLDBCQUEwQixFQUMxQixLQUFLQyxRQUFRLEVBQ2IsS0FBS0MsY0FBYyxRQUNkLDBDQUEwQztBQUNqRCxjQUFjQyxzQkFBc0IsUUFBUSx5QkFBeUI7QUFDckUsU0FBU0MsaUJBQWlCLFFBQVEsd0JBQXdCO0FBRTFELEtBQUtDLGtCQUFrQixHQUFHWixDQUFDLENBQUNhLEtBQUssQ0FBQyxPQUFPWCxhQUFhLENBQUNZLFdBQVcsQ0FB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