// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, relative } from 'path';
// 引入 React、Suspense、use、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { Suspense, use, useMemo } from 'react';
// 复用 FileEditToolDiff 终端界面组件，避免在这里重复拼装显示逻辑。
import { FileEditToolDiff } from 'src/components/FileEditToolDiff.js';
// 复用 getCwd 工具函数，把通用处理留在 src/utils/cwd.js 中维护。
import { getCwd } from 'src/utils/cwd.js';
// 复用 isENOENT 工具函数，把通用处理留在 src/utils/errors.js 中维护。
import { isENOENT } from 'src/utils/errors.js';
// 复用 detectEncodingForResolvedPath 工具函数，把通用处理留在 src/utils/fileRead.js 中维护。
import { detectEncodingForResolvedPath } from 'src/utils/fileRead.js';
// 复用 getFsImplementation 工具函数，把通用处理留在 src/utils/fsOperations.js 中维护。
import { getFsImplementation } from 'src/utils/fsOperations.js';
// 引入 Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../../ink.js';
// 接入 BashTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BashTool } from '../../../tools/BashTool/BashTool.js';
// 接入 applySedSubstitution、SedEditInfo 工具实现，后续工具池会按权限和开关决定是否暴露。
import { applySedSubstitution, type SedEditInfo } from '../../../tools/BashTool/sedEditParser.js';
// 引入 FilePermissionDialog，将 ../FilePermissionDialog/FilePermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { FilePermissionDialog } from '../FilePermissionDialog/FilePermissionDialog.js';
// 类型依赖 { PermissionRequestProps } 来自 ../PermissionRequest.js，用于校准终端渲染的数据契约。
import type { PermissionRequestProps } from '../PermissionRequest.js';
// SedEditPermissionRequestProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type SedEditPermissionRequestProps = PermissionRequestProps & {
  sedInfo: SedEditInfo;
};
// FileReadResult 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FileReadResult = {
  oldContent: string;
  fileExists: boolean;
};
// SedEditPermissionRequest 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SedEditPermissionRequest(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 组件属性 先占位，稍后的条件分支会根据实际输入补齐它。
  let props;
  // sed 替换信息 先占位，稍后的条件分支会根据实际输入补齐它。
  let sedInfo;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t0) {
    // 重新解构输入对象，把权限确认界面 Sed Edit Permission Request需要的字段同步到本地变量。
    ({
      sedInfo,
      ...props
    } = t0);
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = props;
    // $[2] 缓存 `sedInfo`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = sedInfo;
  } else {
    // 组件属性更新为 `$[1]`，确保权限确认界面后续读取最新状态。
    props = $[1];
    // sed 替换信息更新为 `$[2]`，确保权限确认界面后续读取最新状态。
    sedInfo = $[2];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    filePath
  } = sedInfo;
  // t1 暂存 `(async () => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== filePath) {
    // t1 暂存 `(async () => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = (async () => {
      // encoding读取`detectEncodingForResolvedPath`，供终端渲染后续处理使用。
      const encoding = detectEncodingForResolvedPath(filePath);
      // 原始文本读取`getFsImplementation`，供终端渲染后续处理使用。
      const raw = await getFsImplementation().readFile(filePath, {
        encoding
      });
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        oldContent: raw.replaceAll("\r\n", "\n"),
        fileExists: true
      };
    })().catch(_temp);
    // $[3] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = filePath;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // 内容读取任务沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const contentPromise = t1;
  // t2 暂存 `<Suspense fallback={null}><SedEditPermissionRequestInner ...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== contentPromise || $[6] !== props || $[7] !== sedInfo) {
    // t2 暂存 `<Suspense fallback={null}><SedEditPermissionRequestInner ...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Suspense fallback={null}><SedEditPermissionRequestInner sedInfo={sedInfo} contentPromise={contentPromise} {...props} /></Suspense>;
    // $[5] 缓存 `contentPromise`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = contentPromise;
    // $[6] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = props;
    // $[7] 缓存 `sedInfo`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = sedInfo;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[8];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(e) {
  // 满足 `!isENOENT(e)` 时，终端渲染执行该分支。
  if (!isENOENT(e)) {
    // 抛出 e;，阻止终端渲染在无效状态下继续运行。
    throw e;
  }
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    oldContent: "",
    fileExists: false
  };
}
// SedEditPermissionRequestInner 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SedEditPermissionRequestInner(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(35);
  // 内容读取任务 先占位，稍后的条件分支会根据实际输入补齐它。
  let contentPromise;
  // 组件属性 先占位，稍后的条件分支会根据实际输入补齐它。
  let props;
  // sed 替换信息 先占位，稍后的条件分支会根据实际输入补齐它。
  let sedInfo;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t0) {
    // 重新解构输入对象，把权限确认界面 Sed Edit Permission Request需要的字段同步到本地变量。
    ({
      sedInfo,
      contentPromise,
      ...props
    } = t0);
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `contentPromise`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = contentPromise;
    // $[2] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = props;
    // $[3] 缓存 `sedInfo`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = sedInfo;
  } else {
    // 内容读取任务更新为 `$[1]`，确保权限确认界面后续读取最新状态。
    contentPromise = $[1];
    // 组件属性更新为 `$[2]`，确保权限确认界面后续读取最新状态。
    props = $[2];
    // sed 替换信息更新为 `$[3]`，确保权限确认界面后续读取最新状态。
    sedInfo = $[3];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    filePath
  } = sedInfo;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    oldContent,
    fileExists
  } = use(contentPromise);
  // t1 暂存 `applySedSubstitution(oldContent, sedInfo)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== oldContent || $[5] !== sedInfo) {
    // t1 暂存 `applySedSubstitution(oldContent, sedInfo)` 生成的渲染片段，后续返回路径直接复用。
    t1 = applySedSubstitution(oldContent, sedInfo);
    // $[4] 缓存 `oldContent`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = oldContent;
    // $[5] 缓存 `sedInfo`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = sedInfo;
    // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[6];
  }
  // 新内容沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const newContent = t1;
  // t2 暂存 `t3` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // 权限确认界面 Sed Edit Permission Request在这里处理 `bb0: {`，完成这一小步状态转换。
  bb0: {
    // 满足 `oldContent === newContent` 时，终端渲染执行该分支。
    if (oldContent === newContent) {
      // t3 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
      let t3;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        // t3 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
        t3 = [];
        // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
        $[7] = t3;
      } else {
        // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
        t3 = $[7];
      }
      // t2 暂存 `t3` 生成的渲染片段，后续返回路径直接复用。
      t2 = t3;
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb0;
    }
    // t3 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[8] !== newContent || $[9] !== oldContent) {
      // t3 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
      t3 = [{
        old_string: oldContent,
        new_string: newContent,
        replace_all: false
      }];
      // $[8] 缓存 `newContent`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = newContent;
      // $[9] 缓存 `oldContent`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = oldContent;
      // $[10] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[10];
    }
    // t2 暂存 `t3` 生成的渲染片段，后续返回路径直接复用。
    t2 = t3;
  }
  // edits 集合保存`t2`，作为后续临时缓存值处理的输入。
  const edits = t2;
  // t3 暂存 `"File does not exist"` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // 权限确认界面 Sed Edit Permission Request在这里处理 `bb1: {`，完成这一小步状态转换。
  bb1: {
    // 文件存在标记缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!fileExists) {
      // t3 暂存 `"File does not exist"` 生成的渲染片段，后续返回路径直接复用。
      t3 = "File does not exist";
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb1;
    }
    // t3 暂存 `"Pattern did not match any content"` 生成的渲染片段，后续返回路径直接复用。
    t3 = "Pattern did not match any content";
  }
  // noChangesMessage 消息数据 命名 `t3`，让后续代码直接表达这个值的用途。
  const noChangesMessage = t3;
  // t4 暂存 `input => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== filePath || $[12] !== newContent) {
    // t4 暂存 `input => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = input => {
      // 解析结果解析`inputSchema.parse`，供终端渲染后续处理使用。
      const parsed = BashTool.inputSchema.parse(input);
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...parsed,
        _simulatedSedEdit: {
          filePath,
          newContent
        }
      };
    };
    // $[11] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = filePath;
    // $[12] 缓存 `newContent`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = newContent;
    // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[13];
  }
  // parseInput沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const parseInput = t4;
  // 临时值 t5 命名 `props.toolUseConfirm`，让后续代码直接表达这个值的用途。
  const t5 = props.toolUseConfirm;
  // 临时值 t6 命名 `props.toolUseContext`，让后续代码直接表达这个值的用途。
  const t6 = props.toolUseContext;
  // 临时值 t7 命名 `props.onDone`，让后续代码直接表达这个值的用途。
  const t7 = props.onDone;
  // t8保存`props.onReject`，供终端渲染权限确认界面 Sed Edit Permission Re...后续判断或输出使用。
  const t8 = props.onReject;
  // t9 暂存 `relative(getCwd(), filePath)` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== filePath) {
    // t9 暂存 `relative(getCwd(), filePath)` 生成的渲染片段，后续返回路径直接复用。
    t9 = relative(getCwd(), filePath);
    // $[14] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = filePath;
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // t10 暂存 `basename(filePath)` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== filePath) {
    // t10 暂存 `basename(filePath)` 生成的渲染片段，后续返回路径直接复用。
    t10 = basename(filePath);
    // $[16] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = filePath;
    // $[17] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[17];
  }
  // t11 暂存 `<Text>Do you want to make this edit to{" "}<Text bold={tr...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== t10) {
    // t11 暂存 `<Text>Do you want to make this edit to{" "}<Text bold={tr...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text>Do you want to make this edit to{" "}<Text bold={true}>{t10}</Text>?</Text>;
    // $[18] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t10;
    // $[19] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[19];
  }
  // t12 暂存 `edits.length > 0 ? <FileEditToolDiff file_path={filePath}...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== edits || $[21] !== filePath || $[22] !== noChangesMessage) {
    // t12 暂存 `edits.length > 0 ? <FileEditToolDiff file_path={filePath}...` 生成的渲染片段，后续返回路径直接复用。
    t12 = edits.length > 0 ? <FileEditToolDiff file_path={filePath} edits={edits} /> : <Text dimColor={true}>{noChangesMessage}</Text>;
    // $[20] 缓存 `edits`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = edits;
    // $[21] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = filePath;
    // $[22] 缓存 `noChangesMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = noChangesMessage;
    // $[23] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[23];
  }
  // t13 暂存 `<FilePermissionDialog toolUseConfirm={t5} toolUseContext=...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== filePath || $[25] !== parseInput || $[26] !== props.onDone || $[27] !== props.onReject || $[28] !== props.toolUseConfirm || $[29] !== props.toolUseContext || $[30] !== props.workerBadge || $[31] !== t11 || $[32] !== t12 || $[33] !== t9) {
    // t13 暂存 `<FilePermissionDialog toolUseConfirm={t5} toolUseContext=...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <FilePermissionDialog toolUseConfirm={t5} toolUseContext={t6} onDone={t7} onReject={t8} title="Edit file" subtitle={t9} question={t11} content={t12} path={filePath} completionType="str_replace_single" parseInput={parseInput} workerBadge={props.workerBadge} />;
    // $[24] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = filePath;
    // $[25] 缓存 `parseInput`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = parseInput;
    // $[26] 缓存 `props.onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = props.onDone;
    // $[27] 缓存 `props.onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = props.onReject;
    // $[28] 缓存 `props.toolUseConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = props.toolUseConfirm;
    // $[29] 缓存 `props.toolUseContext`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = props.toolUseContext;
    // $[30] 缓存 `props.workerBadge`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = props.workerBadge;
    // $[31] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t11;
    // $[32] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t12;
    // $[33] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t9;
    // $[34] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[34];
  }
  // 返回 `t13`，作为终端渲染这次计算的结果。
  return t13;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJiYXNlbmFtZSIsInJlbGF0aXZlIiwiUmVhY3QiLCJTdXNwZW5zZSIsInVzZSIsInVzZU1lbW8iLCJGaWxlRWRpdFRvb2xEaWZmIiwiZ2V0Q3dkIiwiaXNFTk9FTlQiLCJkZXRlY3RFbmNvZGluZ0ZvclJlc29sdmVkUGF0aCIsImdldEZzSW1wbGVtZW50YXRpb24iLCJUZXh0IiwiQmFzaFRvb2wiLCJhcHBseVNlZFN1YnN0aXR1dGlvbiIsIlNlZEVkaXRJbmZvIiwiRmlsZVBlcm1pc3Npb25EaWFsb2ciLCJQZXJtaXNzaW9uUmVxdWVzdFByb3BzIiwiU2VkRWRpdFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMiLCJzZWRJbmZvIiwiRmlsZVJlYWRSZXN1bHQiLCJvbGRDb250ZW50IiwiZmlsZUV4aXN0cyIsIlNlZEVkaXRQZXJtaXNzaW9uUmVxdWVzdCIsInQwIiwiJCIsIl9jIiwicHJvcHMiLCJmaWxlUGF0aCIsInQxIiwiZW5jb2RpbmciLCJyYXciLCJyZWFkRmlsZSIsInJlcGxhY2VBbGwiLCJjYXRjaCIsIl90ZW1wIiwiY29udGVudFByb21pc2UiLCJ0MiIsImUiLCJTZWRFZGl0UGVybWlzc2lvblJlcXVlc3RJbm5lciIsIm5ld0NvbnRlbnQiLCJiYjAiLCJ0MyIsIlN5bWJvbCIsImZvciIsIm9sZF9zdHJpbmciLCJuZXdfc3RyaW5nIiwicmVwbGFjZV9hbGwiLCJlZGl0cyIsImJiMSIsIm5vQ2hhbmdlc01lc3NhZ2UiLCJ0NCIsImlucHV0IiwicGFyc2VkIiwiaW5wdXRTY2hlbWEiLCJwYXJzZSIsIl9zaW11bGF0ZWRTZWRFZGl0IiwicGFyc2VJbnB1dCIsInQ1IiwidG9vbFVzZUNvbmZpcm0iLCJ0NiIsInRvb2xVc2VDb250ZXh0IiwidDciLCJvbkRvbmUiLCJ0OCIsIm9uUmVqZWN0IiwidDkiLCJ0MTAiLCJ0MTEiLCJ0MTIiLCJsZW5ndGgiLCJ0MTMiLCJ3b3JrZXJCYWRnZSJdLCJzb3VyY2VzIjpbIlNlZEVkaXRQZXJtaXNzaW9uUmVxdWVzdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmFzZW5hbWUsIHJlbGF0aXZlIH0gZnJvbSAncGF0aCdcbmltcG9ydCBSZWFjdCwgeyBTdXNwZW5zZSwgdXNlLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBGaWxlRWRpdFRvb2xEaWZmIH0gZnJvbSAnc3JjL2NvbXBvbmVudHMvRmlsZUVkaXRUb29sRGlmZi5qcydcbmltcG9ydCB7IGdldEN3ZCB9IGZyb20gJ3NyYy91dGlscy9jd2QuanMnXG5pbXBvcnQgeyBpc0VOT0VOVCB9IGZyb20gJ3NyYy91dGlscy9lcnJvcnMuanMnXG5pbXBvcnQgeyBkZXRlY3RFbmNvZGluZ0ZvclJlc29sdmVkUGF0aCB9IGZyb20gJ3NyYy91dGlscy9maWxlUmVhZC5qcydcbmltcG9ydCB7IGdldEZzSW1wbGVtZW50YXRpb24gfSBmcm9tICdzcmMvdXRpbHMvZnNPcGVyYXRpb25zLmpzJ1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB7IEJhc2hUb29sIH0gZnJvbSAnLi4vLi4vLi4vdG9vbHMvQmFzaFRvb2wvQmFzaFRvb2wuanMnXG5pbXBvcnQge1xuICBhcHBseVNlZFN1YnN0aXR1dGlvbixcbiAgdHlwZSBTZWRFZGl0SW5mbyxcbn0gZnJvbSAnLi4vLi4vLi4vdG9vbHMvQmFzaFRvb2wvc2VkRWRpdFBhcnNlci5qcydcbmltcG9ydCB7IEZpbGVQZXJtaXNzaW9uRGlhbG9nIH0gZnJvbSAnLi4vRmlsZVBlcm1pc3Npb25EaWFsb2cvRmlsZVBlcm1pc3Npb25EaWFsb2cuanMnXG5pbXBvcnQgdHlwZSB7IFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMgfSBmcm9tICcuLi9QZXJtaXNzaW9uUmVxdWVzdC5qcydcblxudHlwZSBTZWRFZGl0UGVybWlzc2lvblJlcXVlc3RQcm9wcyA9IFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMgJiB7XG4gIHNlZEluZm86IFNlZEVkaXRJbmZvXG59XG5cbnR5cGUgRmlsZVJlYWRSZXN1bHQgPSB7IG9sZENvbnRlbnQ6IHN0cmluZzsgZmlsZUV4aXN0czogYm9vbGVhbiB9XG5cbmV4cG9ydCBmdW5jdGlvbiBTZWRFZGl0UGVybWlzc2lvblJlcXVlc3Qoe1xuICBzZWRJbmZvLFxuICAuLi5wcm9wc1xufTogU2VkRWRpdFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IGZpbGVQYXRoIH0gPSBzZWRJbmZvXG5cbiAgLy8gUmVhZCBmaWxlIGNvbnRlbnQgYXN5bmMgc28gbW91bnQgZG9lc24ndCBibG9jayBSZWFjdCBjb21taXQgb24gZGlzayBJL08uXG4gIC8vIExhcmdlIGZpbGVzIHdvdWxkIG90aGVyd2lzZSBoYW5nIHRoZSBkaWFsb2cgYmVmb3JlIGl0IHJlbmRlcnMuXG4gIC8vIE1lbW9pemVkIG9uIGZpbGVQYXRoIHNvIHdlIGRvbid0IHJlLXJlYWQgb24gZXZlcnkgcmVuZGVyLlxuICBjb25zdCBjb250ZW50UHJvbWlzZSA9IHVzZU1lbW8oXG4gICAgKCkgPT5cbiAgICAgIChhc3luYyAoKTogUHJvbWlzZTxGaWxlUmVhZFJlc3VsdD4gPT4ge1xuICAgICAgICAvLyBEZXRlY3QgZW5jb2RpbmcgZmlyc3QgKHN5bmMgNEtCIHJlYWQg4oCUIG5lZ2xpZ2libGUpIHNvIFVURi0xNkxFIEJPTXNcbiAgICAgICAgLy8gcmVuZGVyIGNvcnJlY3RseS4gVGhpcyBtYXRjaGVzIHdoYXQgcmVhZEZpbGVTeW5jIGRpZCBiZWZvcmUgdGhlXG4gICAgICAgIC8vIGFzeW5jIGNvbnZlcnNpb24uXG4gICAgICAgIGNvbnN0IGVuY29kaW5nID0gZGV0ZWN0RW5jb2RpbmdGb3JSZXNvbHZlZFBhdGgoZmlsZVBhdGgpXG4gICAgICAgIGNvbnN0IHJhdyA9IGF3YWl0IGdldEZzSW1wbGVtZW50YXRpb24oKS5yZWFkRmlsZShmaWxlUGF0aCwgeyBlbmNvZGluZyB9KVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG9sZENvbnRlbnQ6IHJhdy5yZXBsYWNlQWxsKCdcXHJcXG4nLCAnXFxuJyksXG4gICAgICAgICAgZmlsZUV4aXN0czogdHJ1ZSxcbiAgICAgICAgfVxuICAgICAgfSkoKS5jYXRjaCgoZTogdW5rbm93bik6IEZpbGVSZWFkUmVzdWx0ID0+IHtcbiAgICAgICAgaWYgKCFpc0VOT0VOVChlKSkgdGhyb3cgZVxuICAgICAgICByZXR1cm4geyBvbGRDb250ZW50OiAnJywgZmlsZUV4aXN0czogZmFsc2UgfVxuICAgICAgfSksXG4gICAgW2ZpbGVQYXRoXSxcbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPFN1c3BlbnNlIGZhbGxiYWNrPXtudWxsfT5cbiAgICAgIDxTZWRFZGl0UGVybWlzc2lvblJlcXVlc3RJbm5lclxuICAgICAgICBzZWRJbmZvPXtzZWRJbmZvfVxuICAgICAgICBjb250ZW50UHJvbWlzZT17Y29udGVudFByb21pc2V9XG4gICAgICAgIHsuLi5wcm9wc31cbiAgICAgIC8+XG4gICAgPC9TdXNwZW5zZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWRFZGl0UGVybWlzc2lvblJlcXVlc3RJbm5lcih7XG4gIHNlZEluZm8sXG4gIGNvbnRlbnRQcm9taXNlLFxuICAuLi5wcm9wc1xufTogU2VkRWRpdFBlcm1pc3Npb25SZXF1ZXN0UHJvcHMgJiB7XG4gIGNvbnRlbnRQcm9taXNlOiBQcm9taXNlPEZpbGVSZWFkUmVzdWx0PlxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgZmlsZVBhdGggfSA9IHNlZEluZm9cbiAgY29uc3QgeyBvbGRDb250ZW50LCBmaWxlRXhpc3RzIH0gPSB1c2UoY29udGVudFByb21pc2UpXG5cbiAgLy8gQ29tcHV0ZSB0aGUgbmV3IGNvbnRlbnQgYnkgYXBwbHlpbmcgdGhlIHNlZCBzdWJzdGl0dXRpb25cbiAgY29uc3QgbmV3Q29udGVudCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBhcHBseVNlZFN1YnN0aXR1dGlvbihvbGRDb250ZW50LCBzZWRJbmZvKVxuICB9LCBbb2xkQ29udGVudCwgc2VkSW5mb10pXG5cbiAgLy8gQ3JlYXRlIHRoZSBlZGl0IHJlcHJlc2VudGF0aW9uIGZvciB0aGUgZGlmZlxuICBjb25zdCBlZGl0cyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmIChvbGRDb250ZW50ID09PSBuZXdDb250ZW50KSB7XG4gICAgICByZXR1cm4gW11cbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgb2xkX3N0cmluZzogb2xkQ29udGVudCxcbiAgICAgICAgbmV3X3N0cmluZzogbmV3Q29udGVudCxcbiAgICAgICAgcmVwbGFjZV9hbGw6IGZhbHNlLFxuICAgICAgfSxcbiAgICBdXG4gIH0sIFtvbGRDb250ZW50LCBuZXdDb250ZW50XSlcblxuICAvLyBEZXRlcm1pbmUgYXBwcm9wcmlhdGUgbWVzc2FnZSB3aGVuIG5vIGNoYW5nZXNcbiAgY29uc3Qgbm9DaGFuZ2VzTWVzc2FnZSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICghZmlsZUV4aXN0cykge1xuICAgICAgcmV0dXJuICdGaWxlIGRvZXMgbm90IGV4aXN0J1xuICAgIH1cbiAgICByZXR1cm4gJ1BhdHRlcm4gZGlkIG5vdCBtYXRjaCBhbnkgY29udGVudCdcbiAgfSwgW2ZpbGVFeGlzdHNdKVxuXG4gIC8vIFBhcnNlIGlucHV0IGFuZCBhZGQgX3NpbXVsYXRlZFNlZEVkaXQgdG8gZW5zdXJlIHdoYXQgdXNlciBwcmV2aWV3ZWRcbiAgLy8gaXMgZXhhY3RseSB3aGF0IGdldHMgd3JpdHRlbiAocHJldmVudHMgc2VkL0pTIHJlZ2V4IGRpZmZlcmVuY2VzKVxuICBjb25zdCBwYXJzZUlucHV0ID0gKGlucHV0OiB1bmtub3duKSA9PiB7XG4gICAgY29uc3QgcGFyc2VkID0gQmFzaFRvb2wuaW5wdXRTY2hlbWEucGFyc2UoaW5wdXQpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnBhcnNlZCxcbiAgICAgIF9zaW11bGF0ZWRTZWRFZGl0OiB7XG4gICAgICAgIGZpbGVQYXRoLFxuICAgICAgICBuZXdDb250ZW50LFxuICAgICAgfSxcbiAgICB9XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxGaWxlUGVybWlzc2lvbkRpYWxvZ1xuICAgICAgdG9vbFVzZUNvbmZpcm09e3Byb3BzLnRvb2xVc2VDb25maXJtfVxuICAgICAgdG9vbFVzZUNvbnRleHQ9e3Byb3BzLnRvb2xVc2VDb250ZXh0fVxuICAgICAgb25Eb25lPXtwcm9wcy5vbkRvbmV9XG4gICAgICBvblJlamVjdD17cHJvcHMub25SZWplY3R9XG4gICAgICB0aXRsZT1cIkVkaXQgZmlsZVwiXG4gICAgICBzdWJ0aXRsZT17cmVsYXRpdmUoZ2V0Q3dkKCksIGZpbGVQYXRoKX1cbiAgICAgIHF1ZXN0aW9uPXtcbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgRG8geW91IHdhbnQgdG8gbWFrZSB0aGlzIGVkaXQgdG97JyAnfVxuICAgICAgICAgIDxUZXh0IGJvbGQ+e2Jhc2VuYW1lKGZpbGVQYXRoKX08L1RleHQ+P1xuICAgICAgICA8L1RleHQ+XG4gICAgICB9XG4gICAgICBjb250ZW50PXtcbiAgICAgICAgZWRpdHMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICA8RmlsZUVkaXRUb29sRGlmZiBmaWxlX3BhdGg9e2ZpbGVQYXRofSBlZGl0cz17ZWRpdHN9IC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+e25vQ2hhbmdlc01lc3NhZ2V9PC9UZXh0PlxuICAgICAgICApXG4gICAgICB9XG4gICAgICBwYXRoPXtmaWxlUGF0aH1cbiAgICAgIGNvbXBsZXRpb25UeXBlPVwic3RyX3JlcGxhY2Vfc2luZ2xlXCJcbiAgICAgIHBhcnNlSW5wdXQ9e3BhcnNlSW5wdXR9XG4gICAgICB3b3JrZXJCYWRnZT17cHJvcHMud29ya2VyQmFkZ2V9XG4gICAgLz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsUUFBUSxFQUFFQyxRQUFRLFFBQVEsTUFBTTtBQUN6QyxPQUFPQyxLQUFLLElBQUlDLFFBQVEsRUFBRUMsR0FBRyxFQUFF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