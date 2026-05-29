// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode、useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- UP arrow exit not in Attachments bindings
// 引入 Box、Text、useInput，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useInput } from '../../ink.js';
// 引入 useKeybinding、useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding, useKeybindings } from '../../keybindings/useKeybinding.js';
// 类型依赖 { PastedContent } 来自 ../../utils/config.js，用于校准终端渲染的数据契约。
import type { PastedContent } from '../../utils/config.js';
// 复用 getImageFromClipboard 工具函数，把通用处理留在 ../../utils/imagePaste.js 中维护。
import { getImageFromClipboard } from '../../utils/imagePaste.js';
// 类型依赖 { ImageDimensions } 来自 ../../utils/imageResizer.js，用于校准终端渲染的数据契约。
import type { ImageDimensions } from '../../utils/imageResizer.js';
// 引入 ClickableImageRef，将 ../ClickableImageRef.js 中已经封装好的能力接到本文件流程里。
import { ClickableImageRef } from '../ClickableImageRef.js';
// 引入 ConfigurableShortcutHint，将 ../ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
// 引入 Byline，将 ../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../design-system/Byline.js';
// 引入 TextInput，将 ../TextInput.js 中已经封装好的能力接到本文件流程里。
import TextInput from '../TextInput.js';
// 类型依赖 { OptionWithDescription } 来自 ./select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from './select.js';
// 引入 SelectOption，将 ./select-option.js 中已经封装好的能力接到本文件流程里。
import { SelectOption } from './select-option.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props<T> = {
  option: Extract<OptionWithDescription<T>, {
    type: 'input';
  }>;
  isFocused: boolean;
  isSelected: boolean;
  shouldShowDownArrow: boolean;
  shouldShowUpArrow: boolean;
  maxIndexWidth: number;
  index: number;
  inputValue: string;
  // 这个回调绑定到 onInputChange: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  onInputChange: (value: string) => void;
  // 这个回调绑定到 onSubmit: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  onSubmit: (value: string) => void;
  onExit?: () => void;
  layout: 'compact' | 'expanded';
  children?: ReactNode;
  /**
   * When true, shows the label before the input field.
   * When false (default), uses the label as the placeholder.
   */
  showLabel?: boolean;
  /**
   * Callback to open external editor for editing the input value.
   * When provided, ctrl+g will trigger this callback with the current value
   * and a setter function to update the internal state.
   */
  // 这个回调绑定到 onOpenEditor?: (currentValue: string, setValue: (value: string) => void) => void;，负责终端渲染在该局部场景下的响应。
  onOpenEditor?: (currentValue: string, setValue: (value: string) => void) => void;
  /**
   * When true, automatically reset cursor to end of line when:
   * - Option becomes focused
   * - Input value changes
   * This prevents cursor position bugs when the input value updates asynchronously.
   */
  resetCursorOnUpdate?: boolean;
  /**
   * Optional callback when an image is pasted into the input.
   */
  // 这个回调绑定到 onImagePaste?: (base64Image: string, mediaType?: string, filename?: string, dimensio…，负责终端渲染在该局部场景下的响应。
  onImagePaste?: (base64Image: string, mediaType?: string, filename?: string, dimensions?: ImageDimensions, sourcePath?: string) => void;
  /**
   * Pasted content to display inline above the input when focused.
   */
  pastedContents?: Record<number, PastedContent>;
  /**
   * Callback to remove a pasted image by its ID.
   */
  // 这个回调绑定到 onRemoveImage?: (id: number) => void;，负责终端渲染在该局部场景下的响应。
  onRemoveImage?: (id: number) => void;
  /**
   * Whether image selection mode is active.
   */
  imagesSelected?: boolean;
  /**
   * Currently selected image index within the image attachments array.
   */
  selectedImageIndex?: number;
  /**
   * Callback to set image selection mode on/off.
   */
  // 这个回调绑定到 onImagesSelectedChange?: (selected: boolean) => void;，负责终端渲染在该局部场景下的响应。
  onImagesSelectedChange?: (selected: boolean) => void;
  /**
   * Callback to change the selected image index.
   */
  // 这个回调绑定到 onSelectedImageIndexChange?: (index: number) => void;，负责终端渲染在该局部场景下的响应。
  onSelectedImageIndexChange?: (index: number) => void;
};
// SelectInputOption 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SelectInputOption(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(100);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    option,
    isFocused,
    isSelected,
    shouldShowDownArrow,
    shouldShowUpArrow,
    maxIndexWidth,
    index,
    inputValue,
    onInputChange,
    onSubmit,
    onExit,
    layout,
    children,
    showLabel: t1,
    onOpenEditor,
    resetCursorOnUpdate: t2,
    onImagePaste,
    pastedContents,
    onRemoveImage,
    imagesSelected,
    selectedImageIndex: t3,
    onImagesSelectedChange,
    onSelectedImageIndexChange
  } = t0;
  // showLabelProp标记终端 UI select input option是否启用对应路径。
  const showLabelProp = t1 === undefined ? false : t1;
  // resetCursorOnUpdate标记终端 UI select input option是否启用对应路径。
  const resetCursorOnUpdate = t2 === undefined ? false : t2;
  // selectedImageIndex 索引标记终端 UI select input option是否启用对应路径。
  const selectedImageIndex = t3 === undefined ? 0 : t3;
  // t4 暂存 `pastedContents ? Object.values(pastedContents).filter(_te...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== pastedContents) {
    // t4 暂存 `pastedContents ? Object.values(pastedContents).filter(_te...` 生成的渲染片段，后续返回路径直接复用。
    t4 = pastedContents ? Object.values(pastedContents).filter(_temp) : [];
    // $[0] 缓存 `pastedContents`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = pastedContents;
    // $[1] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[1];
  }
  // imageAttachments 集合 命名 `t4`，让后续代码直接表达这个值的用途。
  const imageAttachments = t4;
  // showLabel标记终端 UI select input option是否启用对应路径。
  const showLabel = showLabelProp || option.showLabelWithValue === true;
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState(inputValue.length);
  // isUserEditing记录 `useRef` 是否成立，终端渲染随后按该结果分支。
  const isUserEditing = useRef(false);
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== inputValue.length || $[3] !== isFocused || $[4] !== resetCursorOnUpdate) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // 只有 `resetCursorOnUpdate && isFocused` 满足时，终端渲染才执行该分支。
      if (resetCursorOnUpdate && isFocused) {
        // 满足 `isUserEditing.current` 时，终端渲染执行该分支。
        if (isUserEditing.current) {
          // current更新为 `false`，确保终端 UI后续读取最新状态。
          isUserEditing.current = false;
        } else {
          // setCursorOffset 写入新的状态值，使终端渲染后续读取保持一致。
          setCursorOffset(inputValue.length);
        }
      }
    };
    // $[2] 缓存 `inputValue.length`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = inputValue.length;
    // $[3] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = isFocused;
    // $[4] 缓存 `resetCursorOnUpdate`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = resetCursorOnUpdate;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // t6 暂存 `[resetCursorOnUpdate, isFocused, inputValue]` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== inputValue || $[7] !== isFocused || $[8] !== resetCursorOnUpdate) {
    // t6 暂存 `[resetCursorOnUpdate, isFocused, inputValue]` 生成的渲染片段，后续返回路径直接复用。
    t6 = [resetCursorOnUpdate, isFocused, inputValue];
    // $[6] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = inputValue;
    // $[7] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = isFocused;
    // $[8] 缓存 `resetCursorOnUpdate`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = resetCursorOnUpdate;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t5, t6);
  // t7 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== inputValue || $[11] !== onInputChange || $[12] !== onOpenEditor) {
    // t7 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => {
      // 调用 onOpenEditor?.(inputValue, onInputChange);，完成这一处局部操作。
      onOpenEditor?.(inputValue, onInputChange);
    };
    // $[10] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = inputValue;
    // $[11] 缓存 `onInputChange`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onInputChange;
    // $[12] 缓存 `onOpenEditor`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onOpenEditor;
    // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[13];
  }
  // t8标记终端 UI select input option是否启用对应路径。
  const t8 = isFocused && !!onOpenEditor;
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== t8) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      context: "Chat",
      isActive: t8
    };
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("chat:externalEditor", t7, t9);
  // t10 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== onImagePaste) {
    // t10 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t10 = () => {
      // onImagePaste缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!onImagePaste) {
        // 终端 UI 组件 select input option在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 getImageFromClipboard，触发终端渲染此处需要的副作用。
      getImageFromClipboard().then(imageData => {
        // 满足 `imageData` 时，终端渲染执行该分支。
        if (imageData) {
          // 调用 onImagePaste，触发终端渲染此处需要的副作用。
          onImagePaste(imageData.base64, imageData.mediaType, undefined, imageData.dimensions);
        }
      });
    };
    // $[16] 缓存 `onImagePaste`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onImagePaste;
    // $[17] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[17];
  }
  // t11标记终端 UI select input option是否启用对应路径。
  const t11 = isFocused && !!onImagePaste;
  // t12 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== t11) {
    // t12 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t12 = {
      context: "Chat",
      isActive: t11
    };
    // $[18] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t11;
    // $[19] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[19];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("chat:imagePaste", t10, t12);
  // t13 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== imageAttachments || $[21] !== onRemoveImage) {
    // t13 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t13 = () => {
      // 只有 `imageAttachments.length > 0 && onRemoveImage` 满足时，终端渲染才执行该分支。
      if (imageAttachments.length > 0 && onRemoveImage) {
        // 调用 onRemoveImage，触发终端渲染此处需要的副作用。
        onRemoveImage(imageAttachments.at(-1).id);
      }
    };
    // $[20] 缓存 `imageAttachments`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = imageAttachments;
    // $[21] 缓存 `onRemoveImage`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = onRemoveImage;
    // $[22] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[22];
  }
  // t14标记终端 UI select input option是否启用对应路径。
  const t14 = isFocused && !imagesSelected && inputValue === "" && imageAttachments.length > 0 && !!onRemoveImage;
  // t15 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== t14) {
    // t15 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t15 = {
      context: "Attachments",
      isActive: t14
    };
    // $[23] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t14;
    // $[24] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[24];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("attachments:remove", t13, t15);
  // t16 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // t17 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== imageAttachments.length || $[26] !== onSelectedImageIndexChange || $[27] !== selectedImageIndex) {
    // t16 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t16 = () => {
      // 满足 `imageAttachments.length > 1` 时，终端渲染执行该分支。
      if (imageAttachments.length > 1) {
        // 调用 onSelectedImageIndexChange?.((selectedImageIndex + 1) % imageAttachments.length);，完成这一处局部操作。
        onSelectedImageIndexChange?.((selectedImageIndex + 1) % imageAttachments.length);
      }
    };
    // t17 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t17 = () => {
      // 满足 `imageAttachments.length > 1` 时，终端渲染执行该分支。
      if (imageAttachments.length > 1) {
        // 调用 onSelectedImageIndexChange?.((selectedImageIndex - 1 + imageAttachments.length) % imageAttachm…，完成这一处局部操作。
        onSelectedImageIndexChange?.((selectedImageIndex - 1 + imageAttachments.length) % imageAttachments.length);
      }
    };
    // $[25] 缓存 `imageAttachments.length`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = imageAttachments.length;
    // $[26] 缓存 `onSelectedImageIndexChange`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = onSelectedImageIndexChange;
    // $[27] 缓存 `selectedImageIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = selectedImageIndex;
    // $[28] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t16;
    // $[29] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t17;
  } else {
    // t16 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[28];
    // t17 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[29];
  }
  // t18 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== imageAttachments || $[31] !== onImagesSelectedChange || $[32] !== onRemoveImage || $[33] !== onSelectedImageIndexChange || $[34] !== selectedImageIndex) {
    // t18 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t18 = () => {
      // img 命名 `imageAttachments[selectedImageIndex]`，让后续代码直接表达这个值的用途。
      const img = imageAttachments[selectedImageIndex];
      // 只有 `img && onRemoveImage` 满足时，终端渲染才执行该分支。
      if (img && onRemoveImage) {
        // 调用 onRemoveImage，触发终端渲染此处需要的副作用。
        onRemoveImage(img.id);
        // 满足 `imageAttachments.length <= 1` 时，终端渲染执行该分支。
        if (imageAttachments.length <= 1) {
          // 调用 onImagesSelectedChange?.(false);，完成这一处局部操作。
          onImagesSelectedChange?.(false);
        } else {
          // 调用 onSelectedImageIndexChange?.(Math.min(selectedImageIndex, imageAttachments.length - 2));，完成这一处局部操作。
          onSelectedImageIndexChange?.(Math.min(selectedImageIndex, imageAttachments.length - 2));
        }
      }
    };
    // $[30] 缓存 `imageAttachments`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = imageAttachments;
    // $[31] 缓存 `onImagesSelectedChange`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = onImagesSelectedChange;
    // $[32] 缓存 `onRemoveImage`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = onRemoveImage;
    // $[33] 缓存 `onSelectedImageIndexChange`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = onSelectedImageIndexChange;
    // $[34] 缓存 `selectedImageIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = selectedImageIndex;
    // $[35] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[35];
  }
  // t19 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[36] !== onImagesSelectedChange) {
    // t19 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t19 = () => {
      // 调用 onImagesSelectedChange?.(false);，完成这一处局部操作。
      onImagesSelectedChange?.(false);
    };
    // $[36] 缓存 `onImagesSelectedChange`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = onImagesSelectedChange;
    // $[37] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[37];
  }
  // t20 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[38] !== t16 || $[39] !== t17 || $[40] !== t18 || $[41] !== t19) {
    // t20 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t20 = {
      "attachments:next": t16,
      "attachments:previous": t17,
      "attachments:remove": t18,
      "attachments:exit": t19
    };
    // $[38] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t16;
    // $[39] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t17;
    // $[40] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t18;
    // $[41] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t19;
    // $[42] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[42];
  }
  // t21标记终端 UI select input option是否启用对应路径。
  const t21 = isFocused && !!imagesSelected;
  // t22 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[43] !== t21) {
    // t22 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t22 = {
      context: "Attachments",
      isActive: t21
    };
    // $[43] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t21;
    // $[44] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[44];
  }
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(t20, t22);
  // t23 暂存 `(_input, key) => {` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== onImagesSelectedChange) {
    // t23 暂存 `(_input, key) => {` 生成的渲染片段，后续返回路径直接复用。
    t23 = (_input, key) => {
      // 满足 `key.upArrow` 时，终端渲染执行该分支。
      if (key.upArrow) {
        // 调用 onImagesSelectedChange?.(false);，完成这一处局部操作。
        onImagesSelectedChange?.(false);
      }
    };
    // $[45] 缓存 `onImagesSelectedChange`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = onImagesSelectedChange;
    // $[46] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[46];
  }
  // t24标记终端 UI select input option是否启用对应路径。
  const t24 = isFocused && !!imagesSelected;
  // t25 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t25;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[47] !== t24) {
    // t25 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t25 = {
      isActive: t24
    };
    // $[47] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t24;
    // $[48] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t25;
  } else {
    // t25 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
    t25 = $[48];
  }
  // 调用 useInput，触发终端渲染此处需要的副作用。
  useInput(t23, t25);
  // t26 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // t27 暂存 `[isFocused, imagesSelected, onImagesSelectedChange]` 的派生结果，便于缓存命中时直接复用。
  let t27;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[49] !== imagesSelected || $[50] !== isFocused || $[51] !== onImagesSelectedChange) {
    // t26 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t26 = () => {
      // 只有 `!isFocused && imagesSelected` 满足时，终端渲染才执行该分支。
      if (!isFocused && imagesSelected) {
        // 调用 onImagesSelectedChange?.(false);，完成这一处局部操作。
        onImagesSelectedChange?.(false);
      }
    };
    // t27 暂存 `[isFocused, imagesSelected, onImagesSelectedChange]` 生成的渲染片段，后续返回路径直接复用。
    t27 = [isFocused, imagesSelected, onImagesSelectedChange];
    // $[49] 缓存 `imagesSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = imagesSelected;
    // $[50] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = isFocused;
    // $[51] 缓存 `onImagesSelectedChange`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = onImagesSelectedChange;
    // $[52] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t26;
    // $[53] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t27;
  } else {
    // t26 从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[52];
    // t27 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
    t27 = $[53];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t26, t27);
  // descriptionPaddingLeft标记终端 UI select input option是否启用对应路径。
  const descriptionPaddingLeft = layout === "expanded" ? maxIndexWidth + 3 : maxIndexWidth + 4;
  // t28标记终端 UI select input option是否启用对应路径。
  const t28 = layout === "compact" ? 0 : undefined;
  // t29保存``${index}.``，作为后续固定文本处理的输入。
  const t29 = `${index}.`;
  // t30 暂存 `t29.padEnd(maxIndexWidth + 2)` 的派生结果，便于缓存命中时直接复用。
  let t30;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[54] !== maxIndexWidth || $[55] !== t29) {
    // t30 暂存 `t29.padEnd(maxIndexWidth + 2)` 生成的渲染片段，后续返回路径直接复用。
    t30 = t29.padEnd(maxIndexWidth + 2);
    // $[54] 缓存 `maxIndexWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = maxIndexWidth;
    // $[55] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t29;
    // $[56] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = t30;
  } else {
    // t30 从 React 编译缓存槽 $[56] 取回渲染片段，避免依赖未变时重建 JSX。
    t30 = $[56];
  }
  // t31 暂存 `<Text dimColor={true}>{t30}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t31;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[57] !== t30) {
    // t31 暂存 `<Text dimColor={true}>{t30}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t31 = <Text dimColor={true}>{t30}</Text>;
    // $[57] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = t30;
    // $[58] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = t31;
  } else {
    // t31 从 React 编译缓存槽 $[58] 取回渲染片段，避免依赖未变时重建 JSX。
    t31 = $[58];
  }
  // t32 暂存 `showLabel ? <><Text color={isFocused ? "suggestion" : und...` 的派生结果，便于缓存命中时直接复用。
  let t32;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[59] !== cursorOffset || $[60] !== imagesSelected || $[61] !== inputValue || $[62] !== isFocused || $[63] !== onExit || $[64] !== onImagePaste || $[65] !== onInputChange || $[66] !== onSubmit || $[67] !== option || $[68] !== showLabel) {
    // t32 暂存 `showLabel ? <><Text color={isFocused ? "suggestion" : und...` 生成的渲染片段，后续返回路径直接复用。
    t32 = showLabel ? <><Text color={isFocused ? "suggestion" : undefined}>{option.label}</Text>{isFocused ? <><Text color="suggestion">{option.labelValueSeparator ?? ", "}</Text><TextInput value={inputValue} onChange={value => {
          // current更新为 `true`，确保终端 UI后续读取最新状态。
          isUserEditing.current = true;
          // 调用 onInputChange，触发终端渲染此处需要的副作用。
          onInputChange(value);
          // 调用 option.onChange，触发终端渲染此处需要的副作用。
          option.onChange(value);
        }} onSubmit={onSubmit} onExit={onExit} placeholder={option.placeholder} focus={!imagesSelected} showCursor={true} multiline={true} cursorOffset={cursorOffset} onChangeCursorOffset={setCursorOffset} columns={80} onImagePaste={onImagePaste} onPaste={pastedText => {
          // current更新为 `true`，确保终端 UI后续读取最新状态。
          isUserEditing.current = true;
          // before格式化`inputValue.slice`，供终端渲染后续处理使用。
          const before = inputValue.slice(0, cursorOffset);
          // after格式化`inputValue.slice`，供终端渲染后续处理使用。
          const after = inputValue.slice(cursorOffset);
          // newValue 命名 `before + pastedText + after`，让后续代码直接表达这个值的用途。
          const newValue = before + pastedText + after;
          // 调用 onInputChange，触发终端渲染此处需要的副作用。
          onInputChange(newValue);
          // 调用 option.onChange，触发终端渲染此处需要的副作用。
          option.onChange(newValue);
          // setCursorOffset 写入新的状态值，使终端渲染后续读取保持一致。
          setCursorOffset(before.length + pastedText.length);
        // 这个回调绑定到 }} /></> : inputValue && <Text>{option.labelValueSeparator ?? ", "}{inputValue}</Tex…，负责终端渲染在该局部场景下的响应。
        }} /></> : inputValue && <Text>{option.labelValueSeparator ?? ", "}{inputValue}</Text>}</> : isFocused ? <TextInput value={inputValue} onChange={value_0 => {
      // current更新为 `true`，确保终端 UI后续读取最新状态。
      isUserEditing.current = true;
      // 调用 onInputChange，触发终端渲染此处需要的副作用。
      onInputChange(value_0);
      // 调用 option.onChange，触发终端渲染此处需要的副作用。
      option.onChange(value_0);
    }} onSubmit={onSubmit} onExit={onExit} placeholder={option.placeholder || (typeof option.label === "string" ? option.label : undefined)} focus={!imagesSelected} showCursor={true} multiline={true} cursorOffset={cursorOffset} onChangeCursorOffset={setCursorOffset} columns={80} onImagePaste={onImagePaste} onPaste={pastedText_0 => {
      // current更新为 `true`，确保终端 UI后续读取最新状态。
      isUserEditing.current = true;
      // before_0格式化`inputValue.slice`，供终端渲染后续处理使用。
      const before_0 = inputValue.slice(0, cursorOffset);
      // after_0格式化`inputValue.slice`，供终端渲染后续处理使用。
      const after_0 = inputValue.slice(cursorOffset);
      // newValue_0 命名 `before_0 + pastedText_0 + after_0`，让后续代码直接表达这个值的用途。
      const newValue_0 = before_0 + pastedText_0 + after_0;
      // 调用 onInputChange，触发终端渲染此处需要的副作用。
      onInputChange(newValue_0);
      // 调用 option.onChange，触发终端渲染此处需要的副作用。
      option.onChange(newValue_0);
      // setCursorOffset 写入新的状态值，使终端渲染后续读取保持一致。
      setCursorOffset(before_0.length + pastedText_0.length);
    }} /> : <Text color={inputValue ? undefined : "inactive"}>{inputValue || option.placeholder || option.label}</Text>;
    // $[59] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = cursorOffset;
    // $[60] 缓存 `imagesSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = imagesSelected;
    // $[61] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = inputValue;
    // $[62] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = isFocused;
    // $[63] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = onExit;
    // $[64] 缓存 `onImagePaste`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = onImagePaste;
    // $[65] 缓存 `onInputChange`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = onInputChange;
    // $[66] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = onSubmit;
    // $[67] 缓存 `option`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = option;
    // $[68] 缓存 `showLabel`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = showLabel;
    // $[69] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = t32;
  } else {
    // t32 从 React 编译缓存槽 $[69] 取回渲染片段，避免依赖未变时重建 JSX。
    t32 = $[69];
  }
  // t33 暂存 `<Box flexDirection="row" flexShrink={t28}>{t31}{children}...` 的派生结果，便于缓存命中时直接复用。
  let t33;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[70] !== children || $[71] !== t28 || $[72] !== t31 || $[73] !== t32) {
    // t33 暂存 `<Box flexDirection="row" flexShrink={t28}>{t31}{children}...` 生成的渲染片段，后续返回路径直接复用。
    t33 = <Box flexDirection="row" flexShrink={t28}>{t31}{children}{t32}</Box>;
    // $[70] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[70] = children;
    // $[71] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = t28;
    // $[72] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = t31;
    // $[73] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = t32;
    // $[74] 缓存 `t33`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = t33;
  } else {
    // t33 从 React 编译缓存槽 $[74] 取回渲染片段，避免依赖未变时重建 JSX。
    t33 = $[74];
  }
  // t34 暂存 `<SelectOption isFocused={isFocused} isSelected={isSelecte...` 的派生结果，便于缓存命中时直接复用。
  let t34;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[75] !== isFocused || $[76] !== isSelected || $[77] !== shouldShowDownArrow || $[78] !== shouldShowUpArrow || $[79] !== t33) {
    // t34 暂存 `<SelectOption isFocused={isFocused} isSelected={isSelecte...` 生成的渲染片段，后续返回路径直接复用。
    t34 = <SelectOption isFocused={isFocused} isSelected={isSelected} shouldShowDownArrow={shouldShowDownArrow} shouldShowUpArrow={shouldShowUpArrow} declareCursor={false}>{t33}</SelectOption>;
    // $[75] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[75] = isFocused;
    // $[76] 缓存 `isSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[76] = isSelected;
    // $[77] 缓存 `shouldShowDownArrow`，下次依赖未变时 React 编译产物可直接复用。
    $[77] = shouldShowDownArrow;
    // $[78] 缓存 `shouldShowUpArrow`，下次依赖未变时 React 编译产物可直接复用。
    $[78] = shouldShowUpArrow;
    // $[79] 缓存 `t33`，下次依赖未变时 React 编译产物可直接复用。
    $[79] = t33;
    // $[80] 缓存 `t34`，下次依赖未变时 React 编译产物可直接复用。
    $[80] = t34;
  } else {
    // t34 从 React 编译缓存槽 $[80] 取回渲染片段，避免依赖未变时重建 JSX。
    t34 = $[80];
  }
  // t35 暂存 `option.description && <Box paddingLeft={descriptionPaddin...` 的派生结果，便于缓存命中时直接复用。
  let t35;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[81] !== descriptionPaddingLeft || $[82] !== isFocused || $[83] !== isSelected || $[84] !== option.description || $[85] !== option.dimDescription) {
    // t35 暂存 `option.description && <Box paddingLeft={descriptionPaddin...` 生成的渲染片段，后续返回路径直接复用。
    t35 = option.description && <Box paddingLeft={descriptionPaddingLeft}><Text dimColor={option.dimDescription !== false} color={isSelected ? "success" : isFocused ? "suggestion" : undefined}>{option.description}</Text></Box>;
    // $[81] 缓存 `descriptionPaddingLeft`，下次依赖未变时 React 编译产物可直接复用。
    $[81] = descriptionPaddingLeft;
    // $[82] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[82] = isFocused;
    // $[83] 缓存 `isSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[83] = isSelected;
    // $[84] 缓存 `option.description`，下次依赖未变时 React 编译产物可直接复用。
    $[84] = option.description;
    // $[85] 缓存 `option.dimDescription`，下次依赖未变时 React 编译产物可直接复用。
    $[85] = option.dimDescription;
    // $[86] 缓存 `t35`，下次依赖未变时 React 编译产物可直接复用。
    $[86] = t35;
  } else {
    // t35 从 React 编译缓存槽 $[86] 取回渲染片段，避免依赖未变时重建 JSX。
    t35 = $[86];
  }
  // t36 暂存 `imageAttachments.length > 0 && <Box flexDirection="row" g...` 的派生结果，便于缓存命中时直接复用。
  let t36;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[87] !== descriptionPaddingLeft || $[88] !== imageAttachments || $[89] !== imagesSelected || $[90] !== isFocused || $[91] !== selectedImageIndex) {
    // t36 暂存 `imageAttachments.length > 0 && <Box flexDirection="row" g...` 生成的渲染片段，后续返回路径直接复用。
    t36 = imageAttachments.length > 0 && <Box flexDirection="row" gap={1} paddingLeft={descriptionPaddingLeft}>{imageAttachments.map((img_0, idx) => <ClickableImageRef key={img_0.id} imageId={img_0.id} isSelected={!!imagesSelected && idx === selectedImageIndex} />)}<Box flexGrow={1} justifyContent="flex-start" flexDirection="row"><Text dimColor={true}>{imagesSelected ? <Byline>{imageAttachments.length > 1 && <><ConfigurableShortcutHint action="attachments:next" context="Attachments" fallback={"\u2192"} description="next" /><ConfigurableShortcutHint action="attachments:previous" context="Attachments" fallback={"\u2190"} description="prev" /></>}<ConfigurableShortcutHint action="attachments:remove" context="Attachments" fallback="backspace" description="remove" /><ConfigurableShortcutHint action="attachments:exit" context="Attachments" fallback="esc" description="cancel" /></Byline> : isFocused ? "(\u2193 to select)" : null}</Text></Box></Box>;
    // $[87] 缓存 `descriptionPaddingLeft`，下次依赖未变时 React 编译产物可直接复用。
    $[87] = descriptionPaddingLeft;
    // $[88] 缓存 `imageAttachments`，下次依赖未变时 React 编译产物可直接复用。
    $[88] = imageAttachments;
    // $[89] 缓存 `imagesSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[89] = imagesSelected;
    // $[90] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[90] = isFocused;
    // $[91] 缓存 `selectedImageIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[91] = selectedImageIndex;
    // $[92] 缓存 `t36`，下次依赖未变时 React 编译产物可直接复用。
    $[92] = t36;
  } else {
    // t36 从 React 编译缓存槽 $[92] 取回渲染片段，避免依赖未变时重建 JSX。
    t36 = $[92];
  }
  // t37 暂存 `layout === "expanded" && <Text> </Text>` 的派生结果，便于缓存命中时直接复用。
  let t37;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[93] !== layout) {
    // t37 暂存 `layout === "expanded" && <Text> </Text>` 生成的渲染片段，后续返回路径直接复用。
    t37 = layout === "expanded" && <Text> </Text>;
    // $[93] 缓存 `layout`，下次依赖未变时 React 编译产物可直接复用。
    $[93] = layout;
    // $[94] 缓存 `t37`，下次依赖未变时 React 编译产物可直接复用。
    $[94] = t37;
  } else {
    // t37 从 React 编译缓存槽 $[94] 取回渲染片段，避免依赖未变时重建 JSX。
    t37 = $[94];
  }
  // t38 暂存 `<Box flexDirection="column" flexShrink={0}>{t34}{t35}{t36...` 的派生结果，便于缓存命中时直接复用。
  let t38;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[95] !== t34 || $[96] !== t35 || $[97] !== t36 || $[98] !== t37) {
    // t38 暂存 `<Box flexDirection="column" flexShrink={0}>{t34}{t35}{t36...` 生成的渲染片段，后续返回路径直接复用。
    t38 = <Box flexDirection="column" flexShrink={0}>{t34}{t35}{t36}{t37}</Box>;
    // $[95] 缓存 `t34`，下次依赖未变时 React 编译产物可直接复用。
    $[95] = t34;
    // $[96] 缓存 `t35`，下次依赖未变时 React 编译产物可直接复用。
    $[96] = t35;
    // $[97] 缓存 `t36`，下次依赖未变时 React 编译产物可直接复用。
    $[97] = t36;
    // $[98] 缓存 `t37`，下次依赖未变时 React 编译产物可直接复用。
    $[98] = t37;
    // $[99] 缓存 `t38`，下次依赖未变时 React 编译产物可直接复用。
    $[99] = t38;
  } else {
    // t38 从 React 编译缓存槽 $[99] 取回渲染片段，避免依赖未变时重建 JSX。
    t38 = $[99];
  }
  // 返回 `t38`，作为终端渲染这次计算的结果。
  return t38;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(c) {
  // 返回 `c.type === "image"`，作为终端渲染这次计算的结果。
  return c.type === "image";
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwiQm94IiwiVGV4dCIsInVzZUlucHV0IiwidXNlS2V5YmluZGluZyIsInVzZUtleWJpbmRpbmdzIiwiUGFzdGVkQ29udGVudCIsImdldEltYWdlRnJvbUNsaXBib2FyZCIsIkltYWdlRGltZW5zaW9ucyIsIkNsaWNrYWJsZUltYWdlUmVmIiwiQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IiwiQnlsaW5lIiwiVGV4dElucHV0IiwiT3B0aW9uV2l0aERlc2NyaXB0aW9uIiwiU2VsZWN0T3B0aW9uIiwiUHJvcHMiLCJvcHRpb24iLCJFeHRyYWN0IiwiVCIsInR5cGUiLCJpc0ZvY3VzZWQiLCJpc1NlbGVjdGVkIiwic2hvdWxkU2hvd0Rvd25BcnJvdyIsInNob3VsZFNob3dVcEFycm93IiwibWF4SW5kZXhXaWR0aCIsImluZGV4IiwiaW5wdXRWYWx1ZSIsIm9uSW5wdXRDaGFuZ2UiLCJ2YWx1ZSIsIm9uU3VibWl0Iiwib25FeGl0IiwibGF5b3V0IiwiY2hpbGRyZW4iLCJzaG93TGFiZWwiLCJvbk9wZW5FZGl0b3IiLCJjdXJyZW50VmFsdWUiLCJzZXRWYWx1ZSIsInJlc2V0Q3Vyc29yT25VcGRhdGUiLCJvbkltYWdlUGFzdGUiLCJiYXNlNjRJbWFnZSIsIm1lZGlhVHlwZSIsImZpbGVuYW1lIiwiZGltZW5zaW9ucyIsInNvdXJjZVBhdGgiLCJwYXN0ZWRDb250ZW50cyIsIlJlY29yZCIsIm9uUmVtb3ZlSW1hZ2UiLCJpZCIsImltYWdlc1NlbGVjdGVkIiwic2VsZWN0ZWRJbWFnZUluZGV4Iiwib25JbWFnZXNTZWxlY3RlZENoYW5nZSIsInNlbGVjdGVkIiwib25TZWxlY3RlZEltYWdlSW5kZXhDaGFuZ2UiLCJTZWxlY3RJbnB1dE9wdGlvbiIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsInQzIiwic2hvd0xhYmVsUHJvcCIsInVuZGVmaW5lZCIsInQ0IiwiT2JqZWN0IiwidmFsdWVzIiwiZmlsdGVyIiwiX3RlbXAiLCJpbWFnZUF0dGFjaG1lbnRzIiwic2hvd0xhYmVsV2l0aFZhbHVlIiwiY3Vyc29yT2Zmc2V0Iiwic2V0Q3Vyc29yT2Zmc2V0IiwibGVuZ3RoIiwiaXNVc2VyRWRpdGluZyIsInQ1IiwiY3VycmVudCIsInQ2IiwidDciLCJ0OCIsInQ5IiwiY29udGV4dCIsImlzQWN0aXZlIiwidDEwIiwidGhlbiIsImltYWdlRGF0YSIsImJhc2U2NCIsInQxMSIsInQxMiIsInQxMyIsImF0IiwidDE0IiwidDE1IiwidDE2IiwidDE3IiwidDE4IiwiaW1nIiwiTWF0aCIsIm1pbiIsInQxOSIsInQyMCIsInQyMSIsInQyMiIsInQyMyIsIl9pbnB1dCIsImtleSIsInVwQXJyb3ciLCJ0MjQiLCJ0MjUiLCJ0MjYiLCJ0MjciLCJkZXNjcmlwdGlvblBhZGRpbmdMZWZ0IiwidDI4IiwidDI5IiwidDMwIiwicGFkRW5kIiwidDMxIiwidDMyIiwibGFiZWwiLCJsYWJlbFZhbHVlU2VwYXJhdG9yIiwib25DaGFuZ2UiLCJwbGFjZWhvbGRlciIsInBhc3RlZFRleHQiLCJiZWZvcmUiLCJzbGljZSIsImFmdGVyIiwibmV3VmFsdWUiLCJ2YWx1ZV8wIiwicGFzdGVkVGV4dF8wIiwiYmVmb3JlXzAiLCJhZnRlcl8wIiwibmV3VmFsdWVfMCIsInQzMyIsInQzNCIsInQzNSIsImRlc2NyaXB0aW9uIiwiZGltRGVzY3JpcHRpb24iLCJ0MzYiLCJtYXAiLCJpbWdfMCIsImlkeCIsInQzNyIsInQzOCIsImMiXSwic291cmNlcyI6WyJzZWxlY3QtaW5wdXQtb3B0aW9uLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdHlwZSBSZWFjdE5vZGUsIHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGN1c3RvbS1ydWxlcy9wcmVmZXItdXNlLWtleWJpbmRpbmdzIC0tIFVQIGFycm93IGV4aXQgbm90IGluIEF0dGFjaG1lbnRzIGJpbmRpbmdzXG5pbXBvcnQgeyBCb3gsIFRleHQsIHVzZUlucHV0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgdXNlS2V5YmluZGluZyxcbiAgdXNlS2V5YmluZGluZ3MsXG59IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgdHlwZSB7IFBhc3RlZENvbnRlbnQgfSBmcm9tICcuLi8uLi91dGlscy9jb25maWcuanMnXG5pbXBvcnQgeyBnZXRJbWFnZUZyb21DbGlwYm9hcmQgfSBmcm9tICcuLi8uLi91dGlscy9pbWFnZVBhc3RlLmpzJ1xuaW1wb3J0IHR5cGUgeyBJbWFnZURpbWVuc2lvbnMgfSBmcm9tICcuLi8uLi91dGlscy9pbWFnZVJlc2l6ZXIuanMnXG5pbXBvcnQgeyBDbGlja2FibGVJbWFnZVJlZiB9IGZyb20gJy4uL0NsaWNrYWJsZUltYWdlUmVmLmpzJ1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgQnlsaW5lIH0gZnJvbSAnLi4vZGVzaWduLXN5c3RlbS9CeWxpbmUuanMnXG5pbXBvcnQgVGV4dElucHV0IGZyb20gJy4uL1RleHRJbnB1dC5qcydcbmltcG9ydCB0eXBlIHsgT3B0aW9uV2l0aERlc2NyaXB0aW9uIH0gZnJvbSAnLi9zZWxlY3QuanMnXG5pbXBvcnQgeyBTZWxlY3RPcHRpb24gfSBmcm9tICcuL3NlbGVjdC1vcHRpb24uanMnXG5cbnR5cGUgUHJvcHM8VD4gPSB7XG4gIG9wdGlvbjogRXh0cmFjdDxPcHRpb25XaXRoRGVzY3JpcHRpb248VD4sIHsgdHlwZTogJ2lucHV0JyB9PlxuICBpc0ZvY3VzZWQ6IGJvb2xlYW5cbiAgaXNTZWxlY3RlZDogYm9vbGVhblxuICBzaG91bGRTaG93RG93bkFycm93OiBib29sZWFuXG4gIHNob3VsZFNob3dVcEFycm93OiBib29sZWFuXG4gIG1heEluZGV4V2lkdGg6IG51bWJlclxuICBpbmRleDogbnVtYmVyXG4gIGlucHV0VmFsdWU6IHN0cmluZ1xuICBvbklucHV0Q2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxuICBvblN1Ym1pdDogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbiAgb25FeGl0PzogKCkgPT4gdm9pZFxuICBsYXlvdXQ6ICdjb21wYWN0JyB8ICdleHBhbmRlZCdcbiAgY2hpbGRyZW4/OiBSZWFjdE5vZGVcbiAgLyoqXG4gICAqIFdoZW4gdHJ1ZSwgc2hvd3MgdGhlIGxhYmVsIGJlZm9yZSB0aGUgaW5wdXQgZmllbGQuXG4gICAqIFdoZW4gZmFsc2UgKGRlZmF1bHQpLCB1c2VzIHRoZSBsYWJlbCBhcyB0aGUgcGxhY2Vob2xkZXIuXG4gICAqL1xuICBzaG93TGFiZWw/OiBib29sZWFuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byBvcGVuIGV4dGVybmFsIGVkaXRvciBmb3IgZWRpdGluZyB0aGUgaW5wdXQgdmFsdWUuXG4gICAqIFdoZW4gcHJvdmlkZWQsIGN0cmwrZyB3aWxsIHRyaWdnZXIgdGhpcyBjYWxsYmFjayB3aXRoIHRoZSBjdXJyZW50IHZhbHVlXG4gICAqIGFuZCBhIHNldHRlciBmdW5jdGlvbiB0byB1cGRhdGUgdGhlIGludGVybmFsIHN0YXRlLlxuICAgKi9cbiAgb25PcGVuRWRpdG9yPzogKFxuICAgIGN1cnJlbnRWYWx1ZTogc3RyaW5nLFxuICAgIHNldFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCxcbiAgKSA9PiB2b2lkXG4gIC8qKlxuICAgKiBXaGVuIHRydWUsIGF1dG9tYXRpY2FsbHkgcmVzZXQgY3Vyc29yIHRvIGVuZCBvZiBsaW5lIHdoZW46XG4gICAqIC0gT3B0aW9uIGJlY29tZXMgZm9jdXNlZFxuICAgKiAtIElucHV0IHZhbHVlIGNoYW5nZXNcbiAgICogVGhpcyBwcmV2ZW50cyBjdXJzb3IgcG9zaXRpb24gYnVncyB3aGVuIHRoZSBpbnB1dCB2YWx1ZSB1cGRhdGVzIGFzeW5jaHJvbm91c2x5LlxuICAgKi9cbiAgcmVzZXRDdXJzb3JPblVwZGF0ZT86IGJvb2xlYW5cbiAgLyoqXG4gICAqIE9wdGlvbmFsIGNhbGxiYWNrIHdoZW4gYW4gaW1hZ2UgaXMgcGFzdGVkIGludG8gdGhlIGlucHV0LlxuICAgKi9cbiAgb25JbWFnZVBhc3RlPzogKFxuICAgIGJhc2U2NEltYWdlOiBzdHJpbmcsXG4gICAgbWVkaWFUeXBlPzogc3RyaW5nLFxuICAgIGZpbGVuYW1lPzogc3RyaW5nLFxuICAgIGRpbWVuc2lvbnM/OiBJbWFnZURpbWVuc2lvbnMsXG4gICAgc291cmNlUGF0aD86IHN0cmluZyxcbiAgKSA9PiB2b2lkXG4gIC8qKlxuICAgKiBQYXN0ZWQgY29udGVudCB0byBkaXNwbGF5IGlubGluZSBhYm92ZSB0aGUgaW5wdXQgd2hlbiBmb2N1c2VkLlxuICAgKi9cbiAgcGFzdGVkQ29udGVudHM/OiBSZWNvcmQ8bnVtYmVyLCBQYXN0ZWRDb250ZW50PlxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gcmVtb3ZlIGEgcGFzdGVkIGltYWdlIGJ5IGl0cyBJRC5cbiAgICovXG4gIG9uUmVtb3ZlSW1hZ2U/OiAoaWQ6IG51bWJlcikgPT4gdm9pZFxuICAvKipcbiAgICogV2hldGhlciBpbWFnZSBzZWxlY3Rpb24gbW9kZSBpcyBhY3RpdmUuXG4gICAqL1xuICBpbWFnZXNTZWxlY3RlZD86IGJvb2xlYW5cbiAgLyoqXG4gICAqIEN1cnJlbnRseSBzZWxlY3RlZCBpbWFnZSBpbmRleCB3aXRoaW4gdGhlIGltYWdlIGF0dGFjaG1lbnRzIGFycmF5LlxuICAgKi9cbiAgc2VsZWN0ZWRJbWFnZUluZGV4PzogbnVtYmVyXG4gIC8qKlxuICAgKiBDYWxsYmFjayB0byBzZXQgaW1hZ2Ugc2VsZWN0aW9uIG1vZGUgb24vb2ZmLlxuICAgKi9cbiAgb25JbWFnZXNTZWxlY3RlZENoYW5nZT86IChzZWxlY3RlZDogYm9vbGVhbikgPT4gdm9pZFxuICAvKipcbiAgICogQ2FsbGJhY2sgdG8gY2hhbmdlIHRoZSBzZWxlY3RlZCBpbWFnZSBpbmRleC5cbiAgICovXG4gIG9uU2VsZWN0ZWRJbWFnZUluZGV4Q2hhbmdlPzogKGluZGV4OiBudW1iZXIpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNlbGVjdElucHV0T3B0aW9uPFQ+KHtcbiAgb3B0aW9uLFxuICBpc0ZvY3VzZWQsXG4gIGlzU2VsZWN0ZWQsXG4gIHNob3VsZFNob3dEb3duQXJyb3csXG4gIHNob3VsZFNob3dVcEFycm93LFxuICBtYXhJbmRleFdpZHRoLFxuICBpbmRleCxcbiAgaW5wdXRWYWx1ZSxcbiAgb25JbnB1dENoYW5nZSxcbiAgb25TdWJtaXQsXG4gIG9uRXhpdCxcbiAgbGF5b3V0LFxuICBjaGlsZHJlbixcbiAgc2hvd0xhYmVsOiBzaG93TGFiZWxQcm9wID0gZmFsc2UsXG4gIG9uT3BlbkVkaXRvcixcbiAgcmVzZXRDdXJzb3JPblVwZGF0ZSA9IGZhbHNlLFxuICBvbkltYWdlUGFzdGUsXG4gIHBhc3RlZENvbnRlbnRzLFxuICBvblJlbW92ZUltYWdlLFxuICBpbWFnZXNTZWxlY3RlZCxcbiAgc2VsZWN0ZWRJbWFnZUluZGV4ID0gMCxcbiAgb25JbWFnZXNTZWxlY3RlZENoYW5nZSxcbiAgb25TZWxlY3RlZEltYWdlSW5kZXhDaGFuZ2UsXG59OiBQcm9wczxUPik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGltYWdlQXR0YWNobWVudHMgPSBwYXN0ZWRDb250ZW50c1xuICAgID8gT2JqZWN0LnZhbHVlcyhwYXN0ZWRDb250ZW50cykuZmlsdGVyKGMgPT4gYy50eXBlID09PSAnaW1hZ2UnKVxuICAgIDogW11cblxuICAvLyBBbGxvdyBpbmRpdmlkdWFsIG9wdGlvbnMgdG8gZm9yY2Ugc2hvd2luZyB0aGUgbGFiZWwgdmlhIHNob3dMYWJlbFdpdGhWYWx1ZVxuICBjb25zdCBzaG93TGFiZWwgPSBzaG93TGFiZWxQcm9wIHx8IG9wdGlvbi5zaG93TGFiZWxXaXRoVmFsdWUgPT09IHRydWVcbiAgY29uc3QgW2N1cnNvck9mZnNldCwgc2V0Q3Vyc29yT2Zmc2V0XSA9IHVzZVN0YXRlKGlucHV0VmFsdWUubGVuZ3RoKVxuXG4gIC8vIFRyYWNrIHdoZXRoZXIgdGhlIGxhdGVzdCBpbnB1dFZhbHVlIGNoYW5nZSB3YXMgZnJvbSB1c2VyIHR5cGluZy9wYXN0aW5nLFxuICAvLyBzbyB3ZSBjYW4gc2tpcCByZXNldHRpbmcgY3Vyc29yIHRvIGVuZCBvbiB1c2VyLWluaXRpYXRlZCBjaGFuZ2VzLlxuICBjb25zdCBpc1VzZXJFZGl0aW5nID0gdXNlUmVmKGZhbHNlKVxuXG4gIC8vIFJlc2V0IGN1cnNvciB0byBlbmQgb2YgbGluZSB3aGVuOlxuICAvLyAxLiBPcHRpb24gYmVjb21lcyBmb2N1c2VkICh1c2VyIG5hdmlnYXRlcyB0byBpdClcbiAgLy8gMi4gSW5wdXQgdmFsdWUgY2hhbmdlcyBleHRlcm5hbGx5IChlLmcuLCBhc3luYyBjbGFzc2lmaWVyIGRlc2NyaXB0aW9uIHVwZGF0ZXMpXG4gIC8vIFNraXAgcmVzZXQgd2hlbiB0aGUgY2hhbmdlIHdhcyBmcm9tIHVzZXIgdHlwaW5nICh3aGljaCBzZXRzIGlzVXNlckVkaXRpbmcgcmVmKVxuICAvLyBPbmx5IGVuYWJsZWQgd2hlbiByZXNldEN1cnNvck9uVXBkYXRlIHByb3AgaXMgdHJ1ZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChyZXNldEN1cnNvck9uVXBkYXRlICYmIGlzRm9jdXNlZCkge1xuICAgICAgaWYgKGlzVXNlckVkaXRpbmcuY3VycmVudCkge1xuICAgICAgICBpc1VzZXJFZGl0aW5nLmN1cnJlbnQgPSBmYWxzZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0Q3Vyc29yT2Zmc2V0KGlucHV0VmFsdWUubGVuZ3RoKVxuICAgICAgfVxuICAgIH1cbiAgfSwgW3Jlc2V0Q3Vyc29yT25VcGRhdGUsIGlzRm9jdXNlZCwgaW5wdXRWYWx1ZV0pXG5cbiAgLy8gY3RybCtnIHRvIG9wZW4gZXh0ZXJuYWwgZWRpdG9yIChyZXVzZXMgY2hhdDpleHRlcm5hbEVkaXRvciBrZXliaW5kaW5nKVxuICB1c2VLZXliaW5kaW5nKFxuICAgICdjaGF0OmV4dGVybmFsRWRpdG9yJyxcbiAgICAoKSA9PiB7XG4gICAgICBvbk9wZW5FZGl0b3I/LihpbnB1dFZhbHVlLCBvbklucHV0Q2hhbmdlKVxuICAgIH0sXG4gICAgeyBjb250ZXh0OiAnQ2hhdCcsIGlzQWN0aXZlOiBpc0ZvY3VzZWQgJiYgISFvbk9wZW5FZGl0b3IgfSxcbiAgKVxuXG4gIC8vIGN0cmwrdiB0byBwYXN0ZSBpbWFnZSBmcm9tIGNsaXBib2FyZCAoc2FtZSBhcyBQcm9tcHRJbnB1dClcbiAgdXNlS2V5YmluZGluZyhcbiAgICAnY2hhdDppbWFnZVBhc3RlJyxcbiAgICAoKSA9PiB7XG4gICAgICBpZiAoIW9uSW1hZ2VQYXN0ZSkgcmV0dXJuXG4gICAgICB2b2lkIGdldEltYWdlRnJvbUNsaXBib2FyZCgpLnRoZW4oaW1hZ2VEYXRhID0+IHtcbiAgICAgICAgaWYgKGltYWdlRGF0YSkge1xuICAgICAgICAgIG9uSW1hZ2VQYXN0ZShcbiAgICAgICAgICAgIGltYWdlRGF0YS5iYXNlNjQsXG4gICAgICAgICAgICBpbWFnZURhdGEubWVkaWFUeXBlLFxuICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgaW1hZ2VEYXRhLmRpbWVuc2lvbnMsXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgeyBjb250ZXh0OiAnQ2hhdCcsIGlzQWN0aXZlOiBpc0ZvY3VzZWQgJiYgISFvbkltYWdlUGFzdGUgfSxcbiAgKVxuXG4gIC8vIEJhY2tzcGFjZSB3aXRoIGVtcHR5IGlucHV0IHJlbW92ZXMgdGhlIGxhc3QgcGFzdGVkIGltYWdlIChub24taW1hZ2Utc2VsZWN0aW9uIG1vZGUpXG4gIHVzZUtleWJpbmRpbmcoXG4gICAgJ2F0dGFjaG1lbnRzOnJlbW92ZScsXG4gICAgKCkgPT4ge1xuICAgICAgaWYgKGltYWdlQXR0YWNobWVudHMubGVuZ3RoID4gMCAmJiBvblJlbW92ZUltYWdlKSB7XG4gICAgICAgIG9uUmVtb3ZlSW1hZ2UoaW1hZ2VBdHRhY2htZW50cy5hdCgtMSkhLmlkKVxuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgY29udGV4dDogJ0F0dGFjaG1lbnRzJyxcbiAgICAgIGlzQWN0aXZlOlxuICAgICAgICBpc0ZvY3VzZWQgJiZcbiAgICAgICAgIWltYWdlc1NlbGVjdGVkICYmXG4gICAgICAgIGlucHV0VmFsdWUgPT09ICcnICYmXG4gICAgICAgIGltYWdlQXR0YWNobWVudHMubGVuZ3RoID4gMCAmJlxuICAgICAgICAhIW9uUmVtb3ZlSW1hZ2UsXG4gICAgfSxcbiAgKVxuXG4gIC8vIEltYWdlIHNlbGVjdGlvbiBtb2RlIGtleWJpbmRpbmdzIOKAlCByZXVzZXMgZXhpc3RpbmcgQXR0YWNobWVudHMgYWN0aW9uc1xuICB1c2VLZXliaW5kaW5ncyhcbiAgICB7XG4gICAgICAnYXR0YWNobWVudHM6bmV4dCc6ICgpID0+IHtcbiAgICAgICAgaWYgKGltYWdlQXR0YWNobWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgIG9uU2VsZWN0ZWRJbWFnZUluZGV4Q2hhbmdlPy4oXG4gICAgICAgICAgICAoc2VsZWN0ZWRJbWFnZUluZGV4ICsgMSkgJSBpbWFnZUF0dGFjaG1lbnRzLmxlbmd0aCxcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnYXR0YWNobWVudHM6cHJldmlvdXMnOiAoKSA9PiB7XG4gICAgICAgIGlmIChpbWFnZUF0dGFjaG1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBvblNlbGVjdGVkSW1hZ2VJbmRleENoYW5nZT8uKFxuICAgICAgICAgICAgKHNlbGVjdGVkSW1hZ2VJbmRleCAtIDEgKyBpbWFnZUF0dGFjaG1lbnRzLmxlbmd0aCkgJVxuICAgICAgICAgICAgICBpbWFnZUF0dGFjaG1lbnRzLmxlbmd0aCxcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnYXR0YWNobWVudHM6cmVtb3ZlJzogKCkgPT4ge1xuICAgICAgICBjb25zdCBpbWcgPSBpbWFnZUF0dGFjaG1lbnRzW3NlbGVjdGVkSW1hZ2VJbmRleF1cbiAgICAgICAgaWYgKGltZyAmJiBvblJlbW92ZUltYWdlKSB7XG4gICAgICAgICAgb25SZW1vdmVJbWFnZShpbWcuaWQpXG4gICAgICAgICAgLy8gSWYgbm8gaW1hZ2VzIGxlZnQgYWZ0ZXIgcmVtb3ZhbCwgZXhpdCBpbWFnZSBzZWxlY3Rpb25cbiAgICAgICAgICBpZiAoaW1hZ2VBdHRhY2htZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgb25JbWFnZXNTZWxlY3RlZENoYW5nZT8uKGZhbHNlKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBZGp1c3QgaW5kZXggaWYgd2UgZGVsZXRlZCB0aGUgbGFzdCBpbWFnZVxuICAgICAgICAgICAgb25TZWxlY3RlZEltYWdlSW5kZXhDaGFuZ2U/LihcbiAgICAgICAgICAgICAgTWF0aC5taW4oc2VsZWN0ZWRJbWFnZUluZGV4LCBpbWFnZUF0dGFjaG1lbnRzLmxlbmd0aCAtIDIpLFxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdhdHRhY2htZW50czpleGl0JzogKCkgPT4ge1xuICAgICAgICBvbkltYWdlc1NlbGVjdGVkQ2hhbmdlPy4oZmFsc2UpXG4gICAgICB9LFxuICAgIH0sXG4gICAgeyBjb250ZXh0OiAnQXR0YWNobWVudHMnLCBpc0FjdGl2ZTogaXNGb2N1c2VkICYmICEhaW1hZ2VzU2VsZWN0ZWQgfSxcbiAgKVxuXG4gIC8vIFVQIGFycm93IGV4aXRzIGltYWdlIHNlbGVjdGlvbiBtb2RlIChVUCBpc24ndCBib3VuZCB0byBhdHRhY2htZW50czpleGl0KVxuICB1c2VJbnB1dChcbiAgICAoX2lucHV0LCBrZXkpID0+IHtcbiAgICAgIGlmIChrZXkudXBBcnJvdykge1xuICAgICAgICBvbkltYWdlc1NlbGVjdGVkQ2hhbmdlPy4oZmFsc2UpXG4gICAgICB9XG4gICAgfSxcbiAgICB7IGlzQWN0aXZlOiBpc0ZvY3VzZWQgJiYgISFpbWFnZXNTZWxlY3RlZCB9LFxuICApXG5cbiAgLy8gRXhpdCBpbWFnZSBtb2RlIHdoZW4gb3B0aW9uIGxvc2VzIGZvY3VzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFpc0ZvY3VzZWQgJiYgaW1hZ2VzU2VsZWN0ZWQpIHtcbiAgICAgIG9uSW1hZ2VzU2VsZWN0ZWRDaGFuZ2U/LihmYWxzZSlcbiAgICB9XG4gIH0sIFtpc0ZvY3VzZWQsIGltYWdlc1NlbGVjdGVkLCBvbkltYWdlc1NlbGVjdGVkQ2hhbmdlXSlcblxuICBjb25zdCBkZXNjcmlwdGlvblBhZGRpbmdMZWZ0ID1cbiAgICBsYXlvdXQgPT09ICdleHBhbmRlZCcgPyBtYXhJbmRleFdpZHRoICsgMyA6IG1heEluZGV4V2lkdGggKyA0XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBmbGV4U2hyaW5rPXswfT5cbiAgICAgIDxTZWxlY3RPcHRpb25cbiAgICAgICAgaXNGb2N1c2VkPXtpc0ZvY3VzZWR9XG4gICAgICAgIGlzU2VsZWN0ZWQ9e2lzU2VsZWN0ZWR9XG4gICAgICAgIHNob3VsZFNob3dEb3duQXJyb3c9e3Nob3VsZFNob3dEb3duQXJyb3d9XG4gICAgICAgIHNob3VsZFNob3dVcEFycm93PXtzaG91bGRTaG93VXBBcnJvd31cbiAgICAgICAgZGVjbGFyZUN1cnNvcj17ZmFsc2V9XG4gICAgICA+XG4gICAgICAgIDxCb3hcbiAgICAgICAgICBmbGV4RGlyZWN0aW9uPVwicm93XCJcbiAgICAgICAgICBmbGV4U2hyaW5rPXtsYXlvdXQgPT09ICdjb21wYWN0JyA/IDAgOiB1bmRlZmluZWR9XG4gICAgICAgID5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57YCR7aW5kZXh9LmAucGFkRW5kKG1heEluZGV4V2lkdGggKyAyKX08L1RleHQ+XG4gICAgICAgICAge2NoaWxkcmVufVxuICAgICAgICAgIHtzaG93TGFiZWwgPyAoXG4gICAgICAgICAgICA8PlxuICAgICAgICAgICAgICA8VGV4dCBjb2xvcj17aXNGb2N1c2VkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfT5cbiAgICAgICAgICAgICAgICB7b3B0aW9uLmxhYmVsfVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIHtpc0ZvY3VzZWQgPyAoXG4gICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VnZ2VzdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICB7b3B0aW9uLmxhYmVsVmFsdWVTZXBhcmF0b3IgPz8gJywgJ31cbiAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICAgIDxUZXh0SW5wdXRcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2lucHV0VmFsdWV9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXt2YWx1ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaXNVc2VyRWRpdGluZy5jdXJyZW50ID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgIG9uSW5wdXRDaGFuZ2UodmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgb3B0aW9uLm9uQ2hhbmdlKHZhbHVlKVxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBvblN1Ym1pdD17b25TdWJtaXR9XG4gICAgICAgICAgICAgICAgICAgIG9uRXhpdD17b25FeGl0fVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17b3B0aW9uLnBsYWNlaG9sZGVyfVxuICAgICAgICAgICAgICAgICAgICBmb2N1cz17IWltYWdlc1NlbGVjdGVkfVxuICAgICAgICAgICAgICAgICAgICBzaG93Q3Vyc29yPXt0cnVlfVxuICAgICAgICAgICAgICAgICAgICBtdWx0aWxpbmU9e3RydWV9XG4gICAgICAgICAgICAgICAgICAgIGN1cnNvck9mZnNldD17Y3Vyc29yT2Zmc2V0fVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZUN1cnNvck9mZnNldD17c2V0Q3Vyc29yT2Zmc2V0fVxuICAgICAgICAgICAgICAgICAgICBjb2x1bW5zPXs4MH1cbiAgICAgICAgICAgICAgICAgICAgb25JbWFnZVBhc3RlPXtvbkltYWdlUGFzdGV9XG4gICAgICAgICAgICAgICAgICAgIG9uUGFzdGU9eyhwYXN0ZWRUZXh0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpc1VzZXJFZGl0aW5nLmN1cnJlbnQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmVmb3JlID0gaW5wdXRWYWx1ZS5zbGljZSgwLCBjdXJzb3JPZmZzZXQpXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWZ0ZXIgPSBpbnB1dFZhbHVlLnNsaWNlKGN1cnNvck9mZnNldClcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IGJlZm9yZSArIHBhc3RlZFRleHQgKyBhZnRlclxuICAgICAgICAgICAgICAgICAgICAgIG9uSW5wdXRDaGFuZ2UobmV3VmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgb3B0aW9uLm9uQ2hhbmdlKG5ld1ZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgIHNldEN1cnNvck9mZnNldChiZWZvcmUubGVuZ3RoICsgcGFzdGVkVGV4dC5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWUgJiYgKFxuICAgICAgICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgICAgICAgIHtvcHRpb24ubGFiZWxWYWx1ZVNlcGFyYXRvciA/PyAnLCAnfVxuICAgICAgICAgICAgICAgICAgICB7aW5wdXRWYWx1ZX1cbiAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8Lz5cbiAgICAgICAgICApIDogaXNGb2N1c2VkID8gKFxuICAgICAgICAgICAgPFRleHRJbnB1dFxuICAgICAgICAgICAgICB2YWx1ZT17aW5wdXRWYWx1ZX1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IHtcbiAgICAgICAgICAgICAgICBpc1VzZXJFZGl0aW5nLmN1cnJlbnQgPSB0cnVlXG4gICAgICAgICAgICAgICAgb25JbnB1dENoYW5nZSh2YWx1ZSlcbiAgICAgICAgICAgICAgICBvcHRpb24ub25DaGFuZ2UodmFsdWUpXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIG9uU3VibWl0PXtvblN1Ym1pdH1cbiAgICAgICAgICAgICAgb25FeGl0PXtvbkV4aXR9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtcbiAgICAgICAgICAgICAgICBvcHRpb24ucGxhY2Vob2xkZXIgfHxcbiAgICAgICAgICAgICAgICAodHlwZW9mIG9wdGlvbi5sYWJlbCA9PT0gJ3N0cmluZycgPyBvcHRpb24ubGFiZWwgOiB1bmRlZmluZWQpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZm9jdXM9eyFpbWFnZXNTZWxlY3RlZH1cbiAgICAgICAgICAgICAgc2hvd0N1cnNvcj17dHJ1ZX1cbiAgICAgICAgICAgICAgbXVsdGlsaW5lPXt0cnVlfVxuICAgICAgICAgICAgICBjdXJzb3JPZmZzZXQ9e2N1cnNvck9mZnNldH1cbiAgICAgICAgICAgICAgb25DaGFuZ2VDdXJzb3JPZmZzZXQ9e3NldEN1cnNvck9mZnNldH1cbiAgICAgICAgICAgICAgY29sdW1ucz17ODB9XG4gICAgICAgICAgICAgIG9uSW1hZ2VQYXN0ZT17b25JbWFnZVBhc3RlfVxuICAgICAgICAgICAgICBvblBhc3RlPXsocGFzdGVkVGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgaXNVc2VyRWRpdGluZy5jdXJyZW50ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGNvbnN0IGJlZm9yZSA9IGlucHV0VmFsdWUuc2xpY2UoMCwgY3Vyc29yT2Zmc2V0KVxuICAgICAgICAgICAgICAgIGNvbnN0IGFmdGVyID0gaW5wdXRWYWx1ZS5zbGljZShjdXJzb3JPZmZzZXQpXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3VmFsdWUgPSBiZWZvcmUgKyBwYXN0ZWRUZXh0ICsgYWZ0ZXJcbiAgICAgICAgICAgICAgICBvbklucHV0Q2hhbmdlKG5ld1ZhbHVlKVxuICAgICAgICAgICAgICAgIG9wdGlvbi5vbkNoYW5nZShuZXdWYWx1ZSlcbiAgICAgICAgICAgICAgICBzZXRDdXJzb3JPZmZzZXQoYmVmb3JlLmxlbmd0aCArIHBhc3RlZFRleHQubGVuZ3RoKVxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPFRleHQgY29sb3I9e2lucHV0VmFsdWUgPyB1bmRlZmluZWQgOiAnaW5hY3RpdmUnfT5cbiAgICAgICAgICAgICAge2lucHV0VmFsdWUgfHwgb3B0aW9uLnBsYWNlaG9sZGVyIHx8IG9wdGlvbi5sYWJlbH1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICApfVxuICAgICAgICA8L0JveD5cbiAgICAgIDwvU2VsZWN0T3B0aW9uPlxuICAgICAge29wdGlvbi5kZXNjcmlwdGlvbiAmJiAoXG4gICAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9e2Rlc2NyaXB0aW9uUGFkZGluZ0xlZnR9PlxuICAgICAgICAgIDxUZXh0XG4gICAgICAgICAgICBkaW1Db2xvcj17b3B0aW9uLmRpbURlc2NyaXB0aW9uICE9PSBmYWxzZX1cbiAgICAgICAgICAgIGNvbG9yPXtcbiAgICAgICAgICAgICAgaXNTZWxlY3RlZCA/ICdzdWNjZXNzJyA6IGlzRm9jdXNlZCA/ICdzdWdnZXN0aW9uJyA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHtvcHRpb24uZGVzY3JpcHRpb259XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgICB7aW1hZ2VBdHRhY2htZW50cy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXsxfSBwYWRkaW5nTGVmdD17ZGVzY3JpcHRpb25QYWRkaW5nTGVmdH0+XG4gICAgICAgICAge2ltYWdlQXR0YWNobWVudHMubWFwKChpbWcsIGlkeCkgPT4gKFxuICAgICAgICAgICAgPENsaWNrYWJsZUltYWdlUmVmXG4gICAgICAgICAgICAgIGtleT17aW1nLmlkfVxuICAgICAgICAgICAgICBpbWFnZUlkPXtpbWcuaWR9XG4gICAgICAgICAgICAgIGlzU2VsZWN0ZWQ9eyEhaW1hZ2VzU2VsZWN0ZWQgJiYgaWR4ID09PSBzZWxlY3RlZEltYWdlSW5kZXh9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICkpfVxuICAgICAgICAgIDxCb3ggZmxleEdyb3c9ezF9IGp1c3RpZnlDb250ZW50PVwiZmxleC1zdGFydFwiIGZsZXhEaXJlY3Rpb249XCJyb3dcIj5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICB7aW1hZ2VzU2VsZWN0ZWQgPyAoXG4gICAgICAgICAgICAgICAgPEJ5bGluZT5cbiAgICAgICAgICAgICAgICAgIHtpbWFnZUF0dGFjaG1lbnRzLmxlbmd0aCA+IDEgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbj1cImF0dGFjaG1lbnRzOm5leHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dD1cIkF0dGFjaG1lbnRzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrPVwi4oaSXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwibmV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb249XCJhdHRhY2htZW50czpwcmV2aW91c1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0PVwiQXR0YWNobWVudHNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZmFsbGJhY2s9XCLihpBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb249XCJwcmV2XCJcbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbj1cImF0dGFjaG1lbnRzOnJlbW92ZVwiXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ9XCJBdHRhY2htZW50c1wiXG4gICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrPVwiYmFja3NwYWNlXCJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb249XCJyZW1vdmVcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uPVwiYXR0YWNobWVudHM6ZXhpdFwiXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ9XCJBdHRhY2htZW50c1wiXG4gICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrPVwiZXNjXCJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb249XCJjYW5jZWxcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L0J5bGluZT5cbiAgICAgICAgICAgICAgKSA6IGlzRm9jdXNlZCA/IChcbiAgICAgICAgICAgICAgICAnKOKGkyB0byBzZWxlY3QpJ1xuICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgICAge2xheW91dCA9PT0gJ2V4cGFuZGVkJyAmJiA8VGV4dD4gPC9UZXh0Pn1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJLEtBQUtDLFNBQVMsRUFBRUMsU0FBUyxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQzFFO0FBQ0EsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLEVBQUVDLFFBQVEsUUFBUSxjQUFjO0FBQ2xELFNBQ0VDLGFBQWEsRUFDYkMsY0FBYyxRQUNULG9DQUFvQztBQUMzQyxjQUFjQyxhQUFhLFFBQVEsdUJBQXVCO0FBQzFELFNBQVNDLHFCQUFxQixRQUFRLDJCQUEyQjtBQUNqRSxjQUFjQyxlQUFlLFFBQVEsNkJBQTZCO0FBQ2xFLFNBQVNDLGlCQUFpQixRQUFRLHlCQUF5QjtBQUMzRCxTQUFTQyx3QkFBd0IsUUFBUSxnQ0FBZ0M7QUFDekUsU0FBU0MsTUFBTSxRQUFRLDRCQUE0QjtBQUNuRCxPQUFPQyxTQUFTLE1BQU0saUJBQWlCO0FBQ3ZDLGNBQWNDLHFCQUFxQixRQUFRLGFBQWE7QUFDeEQsU0FBU0MsWUFBWSxRQUFRLG9CQUFvQjtBQUVqRCxLQUFLQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDZEMsTUFBTSxFQUFFQyxPQUFPLENBQUNKLHFCQUFxQixDQUFDSyxDQUFDLENBQUMsRUFBRTtJQUFFQyxJQUFJLEVBQUUsT0FBTztFQUFDLENBQUMsQ0FBQztFQUM1REMsU0FBUyxFQUFFLE9BQU87RUFDbEJDLFVBQVUsRUFBRSxPQUFPO0VBQ25CQyxtQkFBbUIsRUFBRSxPQUFPO0VBQzVCQyxp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