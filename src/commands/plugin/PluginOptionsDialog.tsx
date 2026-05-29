// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React、useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useState } from 'react';
// 复用 Dialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { Dialog } from '../../components/design-system/Dialog.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- raw text input for config dialog
// 引入 Box、Text、useInput，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useInput } from '../../ink.js';
// 引入 useKeybinding、useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding, useKeybindings } from '../../keybindings/useKeybinding.js';
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js';
// 类型依赖 { PluginOptionSchema, PluginOptionValues } 来自 ../../utils/plugins/pluginOptionsStorage.js，用于校准命令处理的数据契约。
import type { PluginOptionSchema, PluginOptionValues } from '../../utils/plugins/pluginOptionsStorage.js';

/**
 * Build the onSave payload from collected string inputs.
 *
 * Sensitive fields are never prepopulated in the text buffer (security), so
 * by the time the user reaches the last field every sensitive field they
 * stepped through contains '' in collected. To avoid silently wiping saved
 * secrets on reconfigure: if a sensitive field is '' AND initialValues has
 * a value for it, OMIT the key entirely. savePluginOptions only writes keys
 * it receives, so omitting = keep existing.
 *
 * Exported for unit testing.
 */
// buildFinalValues 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildFinalValues(fields: string[], collected: Record<string, string>, configSchema: PluginOptionSchema, initialValues: PluginOptionValues | undefined): PluginOptionValues {
  // finalValues 集合 从空对象开始收集键值，后续按名称补齐内容。
  const finalValues: PluginOptionValues = {};
  // 按顺序遍历 `fields` 中的fieldKey，逐个交给命令处理处理。
  for (const fieldKey of fields) {
    // schema保存`configSchema[fieldKey]`，供插件命令界面 Plugin Options Dialog后续判断或输出使用。
    const schema = configSchema[fieldKey];
    // 取值保存`collected[fieldKey] ?? ''`，供插件命令界面 Plugin Options Dialog后续判断或输出使用。
    const value = collected[fieldKey] ?? '';
    // 只有 `schema?.sensitive === true && value === '' && ini` 满足时，命令处理才执行该分支。
    if (schema?.sensitive === true && value === '' && initialValues?.[fieldKey] !== undefined) {
      // 跳过当前项，继续处理命令处理中的下一轮循环。
      continue;
    }
    // 当 `schema?.type` 匹配 `'number'` 时，命令处理执行对应分支。
    if (schema?.type === 'number') {
      // Number('') returns 0, not NaN — omit blank number inputs so
      // validateUserConfig's required check actually catches them.
      // 满足 `value.trim() === ''` 时，命令处理执行该分支。
      if (value.trim() === '') continue;
      // num保存`Number`，供命令处理后续处理使用。
      const num = Number(value);
      // finalValues[fieldKey更新为 `Number.isNaN(num) ? value : num`，确保插件命令界面 Plugin Options Dialog后续读取最新状态。
      finalValues[fieldKey] = Number.isNaN(num) ? value : num;
    // 插件命令界面 Plugin Options Dialog在这里处理 `} else if (schema?.type === 'boolean') {`，完成这一小步状态转换。
    } else if (schema?.type === 'boolean') {
      // finalValues[fieldKey更新为 `isEnvTruthy(value)`，确保插件命令界面 Plugin Options Dialog后续读取最新状态。
      finalValues[fieldKey] = isEnvTruthy(value);
    } else {
      // finalValues[fieldKey更新为 `value`，确保插件命令界面 Plugin Options Dialog后续读取最新状态。
      finalValues[fieldKey] = value;
    }
  }
  // 返回 `finalValues`，作为命令处理这次计算的结果。
  return finalValues;
}
// Props 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  title: string;
  subtitle: string;
  configSchema: PluginOptionSchema;
  /** Pre-fill fields when reconfiguring. Sensitive fields are not prepopulated. */
  initialValues?: PluginOptionValues;
  // 这个回调绑定到 onSave: (config: PluginOptionValues) => void;，负责命令处理在该局部场景下的响应。
  onSave: (config: PluginOptionValues) => void;
  // 这个回调绑定到 onCancel: () => void;，负责命令处理在该局部场景下的响应。
  onCancel: () => void;
};
// PluginOptionsDialog 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PluginOptionsDialog(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(70);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    title,
    subtitle,
    configSchema,
    initialValues,
    onSave,
    onCancel
  } = t0;
  // t1 暂存 `Object.keys(configSchema)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== configSchema) {
    // t1 暂存 `Object.keys(configSchema)` 生成的渲染片段，后续返回路径直接复用。
    t1 = Object.keys(configSchema);
    // $[0] 缓存 `configSchema`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = configSchema;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // fields 集合沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const fields = t1;
  // t2 暂存 `key => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== configSchema || $[3] !== initialValues) {
    // t2 暂存 `key => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = key => {
      // 满足 `configSchema[key]?.sensitive === true` 时，命令处理执行该分支。
      if (configSchema[key]?.sensitive === true) {
        // 返回空字符串表示没有可用文本，调用方会按空输入处理。
        return "";
      }
      // v保存`initialValues?.[key]`，供插件命令界面 Plugin Options Dialog后续判断或输出使用。
      const v = initialValues?.[key];
      // 返回 `v === undefined ? "" : String(v)`，作为命令处理这次计算的结果。
      return v === undefined ? "" : String(v);
    };
    // $[2] 缓存 `configSchema`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = configSchema;
    // $[3] 缓存 `initialValues`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = initialValues;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // initialFor保存`t2`，作为后续临时缓存值处理的输入。
  const initialFor = t2;
  // currentFieldIndex 索引 由 React state 持有，setCurrentFieldIndex 会在用户操作或异步结果返回时触发刷新。
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  // t3 暂存 `{}` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `{}` 生成的渲染片段，后续返回路径直接复用。
    t3 = {};
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // values 集合 由 React state 持有，setValues 会在用户操作或异步结果返回时触发刷新。
  const [values, setValues] = useState(t3);
  // t4 暂存 `() => fields[0] ? initialFor(fields[0]) : ""` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== fields[0] || $[7] !== initialFor) {
    // t4 暂存 `() => fields[0] ? initialFor(fields[0]) : ""` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => fields[0] ? initialFor(fields[0]) : "";
    // $[6] 缓存 `fields[0]`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = fields[0];
    // $[7] 缓存 `initialFor`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = initialFor;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // currentInput 由 React state 持有，setCurrentInput 会在用户操作或异步结果返回时触发刷新。
  const [currentInput, setCurrentInput] = useState(t4);
  // currentField保存`fields[currentFieldIndex]`，供插件命令界面 Plugin Options Dialog后续判断或输出使用。
  const currentField = fields[currentFieldIndex];
  // fieldSchema 命名 `currentField ? configSchema[currentField] : null`，让后续代码直接表达这个值的用途。
  const fieldSchema = currentField ? configSchema[currentField] : null;
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      context: "Settings"
    };
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // 调用 useKeybinding，触发命令处理此处需要的副作用。
  useKeybinding("confirm:no", onCancel, t5);
  // t6 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== currentField || $[11] !== currentFieldIndex || $[12] !== currentInput || $[13] !== fields || $[14] !== initialFor) {
    // t6 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = () => {
      // 只有 `currentFieldIndex < fields.length - 1 && currentF` 满足时，命令处理才执行该分支。
      if (currentFieldIndex < fields.length - 1 && currentField) {
        // setValues 写入新的状态值，使命令处理后续读取保持一致。
        setValues(prev => ({
          ...prev,
          [currentField]: currentInput
        }));
        // setCurrentFieldIndex 写入新的状态值，使命令处理后续读取保持一致。
        setCurrentFieldIndex(_temp);
        // nextKey读取 `fields[currentFieldIndex + 1]` 对应条目，后续围绕该成员继续处理。
        const nextKey = fields[currentFieldIndex + 1];
        // setCurrentInput 根据 nextKey ? initialFor(nextKey 更新命令处理的状态。
        setCurrentInput(nextKey ? initialFor(nextKey) : "");
      }
    };
    // $[10] 缓存 `currentField`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = currentField;
    // $[11] 缓存 `currentFieldIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = currentFieldIndex;
    // $[12] 缓存 `currentInput`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = currentInput;
    // $[13] 缓存 `fields`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = fields;
    // $[14] 缓存 `initialFor`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = initialFor;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[15];
  }
  // handleNextField 命名 `t6`，让后续代码直接表达这个值的用途。
  const handleNextField = t6;
  // t7 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== configSchema || $[17] !== currentField || $[18] !== currentFieldIndex || $[19] !== currentInput || $[20] !== fields || $[21] !== initialFor || $[22] !== initialValues || $[23] !== onSave || $[24] !== values) {
    // t7 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => {
      // currentField缺失时直接走兜底路径，避免命令处理使用无效输入。
      if (!currentField) {
        // 插件命令界面 Plugin Options Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // newValues 集合集中保存插件命令界面 Plugin Options Dialog要一起传递的字段。
      const newValues = {
        ...values,
        [currentField]: currentInput
      };
      // 满足 `currentFieldIndex === fields.length - 1` 时，命令处理执行该分支。
      if (currentFieldIndex === fields.length - 1) {
        // 调用 onSave，触发命令处理此处需要的副作用。
        onSave(buildFinalValues(fields, newValues, configSchema, initialValues));
      } else {
        // setValues 写入新的状态值，使命令处理后续读取保持一致。
        setValues(newValues);
        // setCurrentFieldIndex 写入新的状态值，使命令处理后续读取保持一致。
        setCurrentFieldIndex(_temp2);
        // nextKey_0保存`fields[currentFieldIndex + 1]`，供插件命令界面 Plugin Options Dialog后续判断或输出使用。
        const nextKey_0 = fields[currentFieldIndex + 1];
        // setCurrentInput 根据 nextKey_0 ? initialFor(nextKey_0 更新命令处理的状态。
        setCurrentInput(nextKey_0 ? initialFor(nextKey_0) : "");
      }
    };
    // $[16] 缓存 `configSchema`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = configSchema;
    // $[17] 缓存 `currentField`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = currentField;
    // $[18] 缓存 `currentFieldIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = currentFieldIndex;
    // $[19] 缓存 `currentInput`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = currentInput;
    // $[20] 缓存 `fields`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = fields;
    // $[21] 缓存 `initialFor`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = initialFor;
    // $[22] 缓存 `initialValues`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = initialValues;
    // $[23] 缓存 `onSave`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = onSave;
    // $[24] 缓存 `values`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = values;
    // $[25] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[25];
  }
  // handleConfirm保存`t7`，作为后续临时缓存值处理的输入。
  const handleConfirm = t7;
  // t8 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== handleConfirm || $[27] !== handleNextField) {
    // t8 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t8 = {
      "confirm:nextField": handleNextField,
      "confirm:yes": handleConfirm
    };
    // $[26] 缓存 `handleConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = handleConfirm;
    // $[27] 缓存 `handleNextField`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = handleNextField;
    // $[28] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[28];
  }
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      context: "Confirmation"
    };
    // $[29] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[29];
  }
  // 调用 useKeybindings，触发命令处理此处需要的副作用。
  useKeybindings(t8, t9);
  // t10 暂存 `(char, key_0) => {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[30] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `(char, key_0) => {` 生成的渲染片段，后续返回路径直接复用。
    t10 = (char, key_0) => {
      // 只有 `key_0.backspace || key_0.delete` 满足时，命令处理才执行该分支。
      if (key_0.backspace || key_0.delete) {
        // setCurrentInput 写入新的状态值，使命令处理后续读取保持一致。
        setCurrentInput(_temp3);
        // 插件命令界面 Plugin Options Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 只有 `char && !key_0.ctrl && !key_0.meta && !key_0.tab` 满足时，命令处理才执行该分支。
      if (char && !key_0.ctrl && !key_0.meta && !key_0.tab && !key_0.return) {
        // setCurrentInput 写入新的状态值，使命令处理后续读取保持一致。
        setCurrentInput(prev_3 => prev_3 + char);
      }
    };
    // $[30] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[30];
  }
  // 调用 useInput，触发命令处理此处需要的副作用。
  useInput(t10);
  // 只有 `!fieldSchema || !currentField` 满足时，命令处理才执行该分支。
  if (!fieldSchema || !currentField) {
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // isSensitive标记插件命令界面 Plugin Options Dialog是否启用对应路径。
  const isSensitive = fieldSchema.sensitive === true;
  // isRequired标记插件命令界面 Plugin Options Dialog是否启用对应路径。
  const isRequired = fieldSchema.required === true;
  // t11 暂存 `isSensitive ? "*".repeat(stringWidth(currentInput)) : cur...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== currentInput || $[32] !== isSensitive) {
    // t11 暂存 `isSensitive ? "*".repeat(stringWidth(currentInput)) : cur...` 生成的渲染片段，后续返回路径直接复用。
    t11 = isSensitive ? "*".repeat(stringWidth(currentInput)) : currentInput;
    // $[31] 缓存 `currentInput`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = currentInput;
    // $[32] 缓存 `isSensitive`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = isSensitive;
    // $[33] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[33];
  }
  // displayValue保存`t11`，作为后续临时缓存值处理的输入。
  const displayValue = t11;
  // t12标记插件命令界面 Plugin Options Dialog是否启用对应路径。
  const t12 = fieldSchema.title || currentField;
  // t13 暂存 `isRequired && <Text color="error"> *</Text>` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== isRequired) {
    // t13 暂存 `isRequired && <Text color="error"> *</Text>` 生成的渲染片段，后续返回路径直接复用。
    t13 = isRequired && <Text color="error"> *</Text>;
    // $[34] 缓存 `isRequired`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = isRequired;
    // $[35] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[35];
  }
  // t14 暂存 `<Text bold={true}>{t12}{t13}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[36] !== t12 || $[37] !== t13) {
    // t14 暂存 `<Text bold={true}>{t12}{t13}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Text bold={true}>{t12}{t13}</Text>;
    // $[36] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t12;
    // $[37] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t13;
    // $[38] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[38];
  }
  // t15 暂存 `fieldSchema.description && <Text dimColor={true}>{fieldSc...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[39] !== fieldSchema.description) {
    // t15 暂存 `fieldSchema.description && <Text dimColor={true}>{fieldSc...` 生成的渲染片段，后续返回路径直接复用。
    t15 = fieldSchema.description && <Text dimColor={true}>{fieldSchema.description}</Text>;
    // $[39] 缓存 `fieldSchema.description`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = fieldSchema.description;
    // $[40] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[40];
  }
  // t16 暂存 `<Text>{figures.pointerSmall} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[41] === Symbol.for("react.memo_cache_sentinel")) {
    // t16 暂存 `<Text>{figures.pointerSmall} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Text>{figures.pointerSmall} </Text>;
    // $[41] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[41];
  }
  // t17 暂存 `<Text>{displayValue}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[42] !== displayValue) {
    // t17 暂存 `<Text>{displayValue}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Text>{displayValue}</Text>;
    // $[42] 缓存 `displayValue`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = displayValue;
    // $[43] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[43];
  }
  // t18 暂存 `<Text>█</Text>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[44] === Symbol.for("react.memo_cache_sentinel")) {
    // t18 暂存 `<Text>█</Text>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Text>█</Text>;
    // $[44] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[44];
  }
  // t19 暂存 `<Box marginTop={1}>{t16}{t17}{t18}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== t17) {
    // t19 暂存 `<Box marginTop={1}>{t16}{t17}{t18}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Box marginTop={1}>{t16}{t17}{t18}</Box>;
    // $[45] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t17;
    // $[46] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[46];
  }
  // t20 暂存 `<Box flexDirection="column">{t14}{t15}{t19}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[47] !== t14 || $[48] !== t15 || $[49] !== t19) {
    // t20 暂存 `<Box flexDirection="column">{t14}{t15}{t19}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t20 = <Box flexDirection="column">{t14}{t15}{t19}</Box>;
    // $[47] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t14;
    // $[48] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t15;
    // $[49] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t19;
    // $[50] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[50];
  }
  // 临时值 t21 命名 `currentFieldIndex + 1`，让后续代码直接表达这个值的用途。
  const t21 = currentFieldIndex + 1;
  // t22 暂存 `<Text dimColor={true}>Field {t21} of {fields.length}</Tex...` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[51] !== fields.length || $[52] !== t21) {
    // t22 暂存 `<Text dimColor={true}>Field {t21} of {fields.length}</Tex...` 生成的渲染片段，后续返回路径直接复用。
    t22 = <Text dimColor={true}>Field {t21} of {fields.length}</Text>;
    // $[51] 缓存 `fields.length`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = fields.length;
    // $[52] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t21;
    // $[53] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[53];
  }
  // t23 暂存 `currentFieldIndex < fields.length - 1 && <Text dimColor={...` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[54] !== currentFieldIndex || $[55] !== fields.length) {
    // t23 暂存 `currentFieldIndex < fields.length - 1 && <Text dimColor={...` 生成的渲染片段，后续返回路径直接复用。
    t23 = currentFieldIndex < fields.length - 1 && <Text dimColor={true}>Tab: Next field · Enter: Save and continue</Text>;
    // $[54] 缓存 `currentFieldIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = currentFieldIndex;
    // $[55] 缓存 `fields.length`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = fields.length;
    // $[56] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[56] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[56];
  }
  // t24 暂存 `currentFieldIndex === fields.length - 1 && <Text dimColor...` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[57] !== currentFieldIndex || $[58] !== fields.length) {
    // t24 暂存 `currentFieldIndex === fields.length - 1 && <Text dimColor...` 生成的渲染片段，后续返回路径直接复用。
    t24 = currentFieldIndex === fields.length - 1 && <Text dimColor={true}>Enter: Save configuration</Text>;
    // $[57] 缓存 `currentFieldIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = currentFieldIndex;
    // $[58] 缓存 `fields.length`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = fields.length;
    // $[59] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[59] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[59];
  }
  // t25 暂存 `<Box flexDirection="column">{t22}{t23}{t24}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t25;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[60] !== t22 || $[61] !== t23 || $[62] !== t24) {
    // t25 暂存 `<Box flexDirection="column">{t22}{t23}{t24}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t25 = <Box flexDirection="column">{t22}{t23}{t24}</Box>;
    // $[60] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = t22;
    // $[61] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = t23;
    // $[62] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = t24;
    // $[63] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = t25;
  } else {
    // t25 从 React 编译缓存槽 $[63] 取回渲染片段，避免依赖未变时重建 JSX。
    t25 = $[63];
  }
  // t26 暂存 `<Dialog title={title} subtitle={subtitle} onCancel={onCan...` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[64] !== onCancel || $[65] !== subtitle || $[66] !== t20 || $[67] !== t25 || $[68] !== title) {
    // t26 暂存 `<Dialog title={title} subtitle={subtitle} onCancel={onCan...` 生成的渲染片段，后续返回路径直接复用。
    t26 = <Dialog title={title} subtitle={subtitle} onCancel={onCancel} isCancelActive={false}>{t20}{t25}</Dialog>;
    // $[64] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = onCancel;
    // $[65] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = subtitle;
    // $[66] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = t20;
    // $[67] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = t25;
    // $[68] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = title;
    // $[69] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = t26;
  } else {
    // t26 从 React 编译缓存槽 $[69] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[69];
  }
  // 返回 `t26`，作为命令处理这次计算的结果。
  return t26;
}
// _temp3 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(prev_2) {
  // 返回 `prev_2.slice(0, -1)`，作为命令处理这次计算的结果。
  return prev_2.slice(0, -1);
}
// _temp2 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(prev_1) {
  // 返回 `prev_1 + 1`，作为命令处理这次计算的结果。
  return prev_1 + 1;
}
// _temp 封装插件命令界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(prev_0) {
  // 返回 `prev_0 + 1`，作为命令处理这次计算的结果。
  return prev_0 + 1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VDYWxsYmFjayIsInVzZVN0YXRlIiwiRGlhbG9nIiwic3RyaW5nV2lkdGgiLCJCb3giLCJUZXh0IiwidXNlSW5wdXQiLCJ1c2VLZXliaW5kaW5nIiwidXNlS2V5YmluZGluZ3MiLCJpc0VudlRydXRoeSIsIlBsdWdpbk9wdGlvblNjaGVtYSIsIlBsdWdpbk9wdGlvblZhbHVlcyIsImJ1aWxkRmluYWxWYWx1ZXMiLCJmaWVsZHMiLCJjb2xsZWN0ZWQiLCJSZWNvcmQiLCJjb25maWdTY2hlbWEiLCJpbml0aWFsVmFsdWVzIiwiZmluYWxWYWx1ZXMiLCJmaWVsZEtleSIsInNjaGVtYSIsInZhbHVlIiwic2Vuc2l0aXZlIiwidW5kZWZpbmVkIiwidHlwZSIsInRyaW0iLCJudW0iLCJOdW1iZXIiLCJpc05hTiIsIlByb3BzIiwidGl0bGUiLCJzdWJ0aXRsZSIsIm9uU2F2ZSIsImNvbmZpZyIsIm9uQ2FuY2VsIiwiUGx1Z2luT3B0aW9uc0RpYWxvZyIsInQwIiwiJCIsIl9jIiwidDEiLCJPYmplY3QiLCJrZXlzIiwidDIiLCJrZXkiLCJ2IiwiU3RyaW5nIiwiaW5pdGlhbEZvciIsImN1cnJlbnRGaWVsZEluZGV4Iiwic2V0Q3VycmVudEZpZWxkSW5kZXgiLCJ0MyIsIlN5bWJvbCIsImZvciIsInZhbHVlcyIsInNldFZhbHVlcyIsInQ0IiwiY3VycmVudElucHV0Iiwic2V0Q3VycmVudElucHV0IiwiY3VycmVudEZpZWxkIiwiZmllbGRTY2hlbWEiLCJ0NSIsImNvbnRleHQiLCJ0NiIsImxlbmd0aCIsInByZXYiLCJfdGVtcCIsIm5leHRLZXkiLCJoYW5kbGVOZXh0RmllbGQiLCJ0NyIsIm5ld1ZhbHVlcyIsIl90ZW1wMiIsIm5leHRLZXlfMCIsImhhbmRsZUNvbmZpcm0iLCJ0OCIsInQ5IiwidDEwIiwiY2hhciIsImtleV8wIiwiYmFja3NwYWNlIiwiZGVsZXRlIiwiX3RlbXAzIiwiY3RybCIsIm1ldGEiLCJ0YWIiLCJyZXR1cm4iLCJwcmV2XzMiLCJpc1NlbnNpdGl2ZSIsImlzUmVxdWlyZWQiLCJyZXF1aXJlZCIsInQxMSIsInJlcGVhdCIsImRpc3BsYXlWYWx1ZSIsInQxMiIsInQxMyIsInQxNCIsInQxNSIsImRlc2NyaXB0aW9uIiwidDE2IiwicG9pbnRlclNtYWxsIiwidDE3IiwidDE4IiwidDE5IiwidDIwIiwidDIxIiwidDIyIiwidDIzIiwidDI0IiwidDI1IiwidDI2IiwicHJldl8yIiwic2xpY2UiLCJwcmV2XzEiLCJwcmV2XzAiXSwic291cmNlcyI6WyJQbHVnaW5PcHRpb25zRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcbmltcG9ydCB7IHN0cmluZ1dpZHRoIH0gZnJvbSAnLi4vLi4vaW5rL3N0cmluZ1dpZHRoLmpzJ1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGN1c3RvbS1ydWxlcy9wcmVmZXItdXNlLWtleWJpbmRpbmdzIC0tIHJhdyB0ZXh0IGlucHV0IGZvciBjb25maWcgZGlhbG9nXG5pbXBvcnQgeyBCb3gsIFRleHQsIHVzZUlucHV0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgdXNlS2V5YmluZGluZyxcbiAgdXNlS2V5YmluZGluZ3MsXG59IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgeyBpc0VudlRydXRoeSB9IGZyb20gJy4uLy4uL3V0aWxzL2VudlV0aWxzLmpzJ1xuaW1wb3J0IHR5cGUge1xuICBQbHVnaW5PcHRpb25TY2hlbWEsXG4gIFBsdWdpbk9wdGlvblZhbHVlcyxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvcGx1Z2lucy9wbHVnaW5PcHRpb25zU3RvcmFnZS5qcydcblxuLyoqXG4gKiBCdWlsZCB0aGUgb25TYXZlIHBheWxvYWQgZnJvbSBjb2xsZWN0ZWQgc3RyaW5nIGlucHV0cy5cbiAqXG4gKiBTZW5zaXRpdmUgZmllbGRzIGFyZSBuZXZlciBwcmVwb3B1bGF0ZWQgaW4gdGhlIHRleHQgYnVmZmVyIChzZWN1cml0eSksIHNvXG4gKiBieSB0aGUgdGltZSB0aGUgdXNlciByZWFjaGVzIHRoZSBsYXN0IGZpZWxkIGV2ZXJ5IHNlbnNpdGl2ZSBmaWVsZCB0aGV5XG4gKiBzdGVwcGVkIHRocm91Z2ggY29udGFpbnMgJycgaW4gY29sbGVjdGVkLiBUbyBhdm9pZCBzaWxlbnRseSB3aXBpbmcgc2F2ZWRcbiAqIHNlY3JldHMgb24gcmVjb25maWd1cmU6IGlmIGEgc2Vuc2l0aXZlIGZpZWxkIGlzICcnIEFORCBpbml0aWFsVmFsdWVzIGhhc1xuICogYSB2YWx1ZSBmb3IgaXQsIE9NSVQgdGhlIGtleSBlbnRpcmVseS4gc2F2ZVBsdWdpbk9wdGlvbnMgb25seSB3cml0ZXMga2V5c1xuICogaXQgcmVjZWl2ZXMsIHNvIG9taXR0aW5nID0ga2VlcCBleGlzdGluZy5cbiAqXG4gKiBFeHBvcnRlZCBmb3IgdW5pdCB0ZXN0aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGaW5hbFZhbHVlcyhcbiAgZmllbGRzOiBzdHJpbmdbXSxcbiAgY29sbGVjdGVkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICBjb25maWdTY2hlbWE6IFBsdWdpbk9wdGlvblNjaGVtYSxcbiAgaW5pdGlhbFZhbHVlczogUGx1Z2luT3B0aW9uVmFsdWVzIHwgdW5kZWZpbmVkLFxuKTogUGx1Z2luT3B0aW9uVmFsdWVzIHtcbiAgY29uc3QgZmluYWxWYWx1ZXM6IFBsdWdpbk9wdGlvblZhbHVlcyA9IHt9XG4gIGZvciAoY29uc3QgZmllbGRLZXkgb2YgZmllbGRzKSB7XG4gICAgY29uc3Qgc2NoZW1hID0gY29uZmlnU2NoZW1hW2ZpZWxkS2V5XVxuICAgIGNvbnN0IHZhbHVlID0gY29sbGVjdGVkW2ZpZWxkS2V5XSA/PyAnJ1xuXG4gICAgaWYgKFxuICAgICAgc2NoZW1hPy5zZW5zaXRpdmUgPT09IHRydWUgJiZcbiAgICAgIHZhbHVlID09PSAnJyAmJlxuICAgICAgaW5pdGlhbFZhbHVlcz8uW2ZpZWxkS2V5XSAhPT0gdW5kZWZpbmVkXG4gICAgKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmIChzY2hlbWE/LnR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBOdW1iZXIoJycpIHJldHVybnMgMCwgbm90IE5hTiDigJQgb21pdCBibGFuayBudW1iZXIgaW5wdXRzIHNvXG4gICAgICAvLyB2YWxpZGF0ZVVzZXJDb25maWcncyByZXF1aXJlZCBjaGVjayBhY3R1YWxseSBjYXRjaGVzIHRoZW0uXG4gICAgICBpZiAodmFsdWUudHJpbSgpID09PSAnJykgY29udGludWVcbiAgICAgIGNvbnN0IG51bSA9IE51bWJlcih2YWx1ZSlcbiAgICAgIGZpbmFsVmFsdWVzW2ZpZWxkS2V5XSA9IE51bWJlci5pc05hTihudW0pID8gdmFsdWUgOiBudW1cbiAgICB9IGVsc2UgaWYgKHNjaGVtYT8udHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBmaW5hbFZhbHVlc1tmaWVsZEtleV0gPSBpc0VudlRydXRoeSh2YWx1ZSlcbiAgICB9IGVsc2Uge1xuICAgICAgZmluYWxWYWx1ZXNbZmllbGRLZXldID0gdmFsdWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZpbmFsVmFsdWVzXG59XG5cbnR5cGUgUHJvcHMgPSB7XG4gIHRpdGxlOiBzdHJpbmdcbiAgc3VidGl0bGU6IHN0cmluZ1xuICBjb25maWdTY2hlbWE6IFBsdWdpbk9wdGlvblNjaGVtYVxuICAvKiogUHJlLWZpbGwgZmllbGRzIHdoZW4gcmVjb25maWd1cmluZy4gU2Vuc2l0aXZlIGZpZWxkcyBhcmUgbm90IHByZXBvcHVsYXRlZC4gKi9cbiAgaW5pdGlhbFZhbHVlcz86IFBsdWdpbk9wdGlvblZhbHVlc1xuICBvblNhdmU6IChjb25maWc6IFBsdWdpbk9wdGlvblZhbHVlcykgPT4gdm9pZFxuICBvbkNhbmNlbDogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gUGx1Z2luT3B0aW9uc0RpYWxvZyh7XG4gIHRpdGxlLFxuICBzdWJ0aXRsZSxcbiAgY29uZmlnU2NoZW1hLFxuICBpbml0aWFsVmFsdWVzLFxuICBvblNhdmUsXG4gIG9uQ2FuY2VsLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBmaWVsZHMgPSBPYmplY3Qua2V5cyhjb25maWdTY2hlbWEpXG5cbiAgLy8gUHJlcG9wdWxhdGUgZnJvbSBpbml0aWFsVmFsdWVzIGJ1dCBza2lwIHNlbnNpdGl2ZSBmaWVsZHMg4oCUIHdlIGRvbid0XG4gIC8vIHdhbnQgdG8gZWNobyBzZWNyZXRzIGJhY2sgaW50byB0aGUgdGV4dCBidWZmZXIuXG4gIGNvbnN0IGluaXRpYWxGb3IgPSB1c2VDYWxsYmFjayhcbiAgICAoa2V5OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgaWYgKGNvbmZpZ1NjaGVtYVtrZXldPy5zZW5zaXRpdmUgPT09IHRydWUpIHJldHVybiAnJ1xuICAgICAgY29uc3QgdiA9IGluaXRpYWxWYWx1ZXM/LltrZXldXG4gICAgICByZXR1cm4gdiA9PT0gdW5kZWZpbmVkID8gJycgOiBTdHJpbmcodilcbiAgICB9LFxuICAgIFtjb25maWdTY2hlbWEsIGluaXRpYWxWYWx1ZXNdLFxuICApXG5cbiAgY29uc3QgW2N1cnJlbnRGaWVsZEluZGV4LCBzZXRDdXJyZW50RmllbGRJbmRleF0gPSB1c2VTdGF0ZSgwKVxuICBjb25zdCBbdmFsdWVzLCBzZXRWYWx1ZXNdID0gdXNlU3RhdGU8UmVjb3JkPHN0cmluZywgc3RyaW5nPj4oe30pXG4gIGNvbnN0IFtjdXJyZW50SW5wdXQsIHNldEN1cnJlbnRJbnB1dF0gPSB1c2VTdGF0ZSgoKSA9PlxuICAgIGZpZWxkc1swXSA/IGluaXRpYWxGb3IoZmllbGRzWzBdKSA6ICcnLFxuICApXG5cbiAgY29uc3QgY3VycmVudEZpZWxkID0gZmllbGRzW2N1cnJlbnRGaWVsZEluZGV4XVxuICBjb25zdCBmaWVsZFNjaGVtYSA9IGN1cnJlbnRGaWVsZCA/IGNvbmZpZ1NjaGVtYVtjdXJyZW50RmllbGRdIDogbnVsbFxuXG4gIC8vIFVzZSBTZXR0aW5ncyBjb250ZXh0IHNvICduJyBrZXkgZG9lc24ndCBjYW5jZWwgKGFsbG93cyB0eXBpbmcgJ24nIGluIGlucHV0KS5cbiAgLy8gaXNDYW5jZWxBY3RpdmU9e2ZhbHNlfSBvbiBEaWFsb2cga2VlcHMgaXRzIG93biBjb25maXJtOm5vIG91dCBvZiB0aGUgd2F5LlxuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOm5vJywgb25DYW5jZWwsIHsgY29udGV4dDogJ1NldHRpbmdzJyB9KVxuXG4gIC8vIFRhYiB0byBuZXh0IGZpZWxkXG4gIGNvbnN0IGhhbmRsZU5leHRGaWVsZCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoY3VycmVudEZpZWxkSW5kZXggPCBmaWVsZHMubGVuZ3RoIC0gMSAmJiBjdXJyZW50RmllbGQpIHtcbiAgICAgIHNldFZhbHVlcyhwcmV2ID0+ICh7IC4uLnByZXYsIFtjdXJyZW50RmllbGRdOiBjdXJyZW50SW5wdXQgfSkpXG4gICAgICBzZXRDdXJyZW50RmllbGRJbmRleChwcmV2ID0+IHByZXYgKyAxKVxuICAgICAgY29uc3QgbmV4dEtleSA9IGZpZWxkc1tjdXJyZW50RmllbGRJbmRleCArIDFdXG4gICAgICBzZXRDdXJyZW50SW5wdXQobmV4dEtleSA/IGluaXRpYWxGb3IobmV4dEtleSkgOiAnJylcbiAgICB9XG4gIH0sIFtjdXJyZW50RmllbGRJbmRleCwgZmllbGRzLCBjdXJyZW50RmllbGQsIGN1cnJlbnRJbnB1dCwgaW5pdGlhbEZvcl0pXG5cbiAgLy8gRW50ZXIgdG8gc2F2ZSBjdXJyZW50IGZpZWxkIGFuZCBtb3ZlIHRvIG5leHQsIG9yIHNhdmUgYWxsIGlmIGxhc3RcbiAgY29uc3QgaGFuZGxlQ29uZmlybSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoIWN1cnJlbnRGaWVsZCkgcmV0dXJuXG5cbiAgICBjb25zdCBuZXdWYWx1ZXMgPSB7IC4uLnZhbHVlcywgW2N1cnJlbnRGaWVsZF06IGN1cnJlbnRJbnB1dCB9XG5cbiAgICBpZiAoY3VycmVudEZpZWxkSW5kZXggPT09IGZpZWxkcy5sZW5ndGggLSAxKSB7XG4gICAgICBvblNhdmUoYnVpbGRGaW5hbFZhbHVlcyhmaWVsZHMsIG5ld1ZhbHVlcywgY29uZmlnU2NoZW1hLCBpbml0aWFsVmFsdWVzKSlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTW92ZSB0byBuZXh0IGZpZWxkXG4gICAgICBzZXRWYWx1ZXMobmV3VmFsdWVzKVxuICAgICAgc2V0Q3VycmVudEZpZWxkSW5kZXgocHJldiA9PiBwcmV2ICsgMSlcbiAgICAgIGNvbnN0IG5leHRLZXkgPSBmaWVsZHNbY3VycmVudEZpZWxkSW5kZXggKyAxXVxuICAgICAgc2V0Q3VycmVudElucHV0KG5leHRLZXkgPyBpbml0aWFsRm9yKG5leHRLZXkpIDogJycpXG4gICAgfVxuICB9LCBbXG4gICAgY3VycmVudEZpZWxkLFxuICAgIHZhbHVlcyxcbiAgICBjdXJyZW50SW5wdXQsXG4gICAgY3VycmVudEZpZWxkSW5kZXgsXG4gICAgZmllbGRzLFxuICAgIGNvbmZpZ1NjaGVtYSxcbiAgICBvblNhdmUsXG4gICAgaW5pdGlhbEZvcixcbiAgICBpbml0aWFsVmFsdWVzLFxuICBdKVxuXG4gIHVzZUtleWJpbmRpbmdzKFxuICAgIHtcbiAgICAgICdjb25maXJtOm5leHRGaWVsZCc6IGhhbmRsZU5leHRGaWVsZCxcbiAgICAgICdjb25maXJtOnllcyc6IGhhbmRsZUNvbmZpcm0sXG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0sXG4gIClcblxuICAvLyBDaGFyYWN0ZXIgaW5wdXQgaGFuZGxpbmcgKGJhY2tzcGFjZSwgdHlwaW5nKVxuICB1c2VJbnB1dCgoY2hhciwga2V5KSA9PiB7XG4gICAgLy8gQmFja3NwYWNlXG4gICAgaWYgKGtleS5iYWNrc3BhY2UgfHwga2V5LmRlbGV0ZSkge1xuICAgICAgc2V0Q3VycmVudElucHV0KHByZXYgPT4gcHJldi5zbGljZSgwLCAtMSkpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBSZWd1bGFyIGNoYXJhY3RlciBpbnB1dFxuICAgIGlmIChjaGFyICYmICFrZXkuY3RybCAmJiAha2V5Lm1ldGEgJiYgIWtleS50YWIgJiYgIWtleS5yZXR1cm4pIHtcbiAgICAgIHNldEN1cnJlbnRJbnB1dChwcmV2ID0+IHByZXYgKyBjaGFyKVxuICAgIH1cbiAgfSlcblxuICBpZiAoIWZpZWxkU2NoZW1hIHx8ICFjdXJyZW50RmllbGQpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3QgaXNTZW5zaXRpdmUgPSBmaWVsZFNjaGVtYS5zZW5zaXRpdmUgPT09IHRydWVcbiAgY29uc3QgaXNSZXF1aXJlZCA9IGZpZWxkU2NoZW1hLnJlcXVpcmVkID09PSB0cnVlXG4gIGNvbnN0IGRpc3BsYXlWYWx1ZSA9IGlzU2Vuc2l0aXZlXG4gICAgPyAnKicucmVwZWF0KHN0cmluZ1dpZHRoKGN1cnJlbnRJbnB1dCkpXG4gICAgOiBjdXJyZW50SW5wdXRcblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2dcbiAgICAgIHRpdGxlPXt0aXRsZX1cbiAgICAgIHN1YnRpdGxlPXtzdWJ0aXRsZX1cbiAgICAgIG9uQ2FuY2VsPXtvbkNhbmNlbH1cbiAgICAgIGlzQ2FuY2VsQWN0aXZlPXtmYWxzZX1cbiAgICA+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQgYm9sZD17dHJ1ZX0+XG4gICAgICAgICAge2ZpZWxkU2NoZW1hLnRpdGxlIHx8IGN1cnJlbnRGaWVsZH1cbiAgICAgICAgICB7aXNSZXF1aXJlZCAmJiA8VGV4dCBjb2xvcj1cImVycm9yXCI+ICo8L1RleHQ+fVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIHtmaWVsZFNjaGVtYS5kZXNjcmlwdGlvbiAmJiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e3RydWV9PntmaWVsZFNjaGVtYS5kZXNjcmlwdGlvbn08L1RleHQ+XG4gICAgICAgICl9XG5cbiAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgIDxUZXh0PntmaWd1cmVzLnBvaW50ZXJTbWFsbH0gPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PntkaXNwbGF5VmFsdWV9PC9UZXh0PlxuICAgICAgICAgIDxUZXh0PuKWiDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cblxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPXt0cnVlfT5cbiAgICAgICAgICBGaWVsZCB7Y3VycmVudEZpZWxkSW5kZXggKyAxfSBvZiB7ZmllbGRzLmxlbmd0aH1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICB7Y3VycmVudEZpZWxkSW5kZXggPCBmaWVsZHMubGVuZ3RoIC0gMSAmJiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e3RydWV9PlxuICAgICAgICAgICAgVGFiOiBOZXh0IGZpZWxkIMK3IEVudGVyOiBTYXZlIGFuZCBjb250aW51ZVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgICAge2N1cnJlbnRGaWVsZEluZGV4ID09PSBmaWVsZHMubGVuZ3RoIC0gMSAmJiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e3RydWV9PkVudGVyOiBTYXZlIGNvbmZpZ3VyYXRpb248L1RleHQ+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBT0MsS0FBSyxJQUFJQyxXQUFXLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3BELFNBQVNDLE1BQU0sUUFBUSww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