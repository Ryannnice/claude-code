// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 引入 Box，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../../ink.js';
// 引入 OptionWithDescription、Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { type OptionWithDescription, Select } from '../CustomSelect/select.js';
// TreeNode 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TreeNode<T> = {
  id: string | number;
  value: T;
  label: string;
  description?: string;
  dimDescription?: boolean;
  children?: TreeNode<T>[];
  metadata?: Record<string, unknown>;
};
// FlattenedNode 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FlattenedNode<T> = {
  node: TreeNode<T>;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  parentId?: string | number;
};
// TreeSelectProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TreeSelectProps<T> = {
  /**
   * Tree nodes to display.
   */
  readonly nodes: TreeNode<T>[];

  /**
   * Callback when a node is selected.
   */
  // 这个回调绑定到 readonly onSelect: (node: TreeNode<T>) => void;，负责终端渲染在该局部场景下的响应。
  readonly onSelect: (node: TreeNode<T>) => void;

  /**
   * Callback when cancel is pressed.
   */
  // 这个回调绑定到 readonly onCancel?: () => void;，负责终端渲染在该局部场景下的响应。
  readonly onCancel?: () => void;

  /**
   * Callback when focused node changes.
   */
  // 这个回调绑定到 readonly onFocus?: (node: TreeNode<T>) => void;，负责终端渲染在该局部场景下的响应。
  readonly onFocus?: (node: TreeNode<T>) => void;

  /**
   * Node to focus by ID.
   */
  readonly focusNodeId?: string | number;

  /**
   * Number of visible options.
   */
  readonly visibleOptionCount?: number;

  /**
   * Layout of the options.
   */
  readonly layout?: 'compact' | 'expanded' | 'compact-vertical';

  /**
   * When disabled, user input is ignored.
   */
  readonly isDisabled?: boolean;

  /**
   * When true, hides the numeric indexes next to each option.
   */
  readonly hideIndexes?: boolean;

  /**
   * Function to determine if a node should be initially expanded.
   * If not provided, all nodes start collapsed.
   */
  // 这个回调绑定到 readonly isNodeExpanded?: (nodeId: string | number) => boolean;，负责终端渲染在该局部场景下的响应。
  readonly isNodeExpanded?: (nodeId: string | number) => boolean;

  /**
   * Callback when a node is expanded.
   */
  // 这个回调绑定到 readonly onExpand?: (nodeId: string | number) => void;，负责终端渲染在该局部场景下的响应。
  readonly onExpand?: (nodeId: string | number) => void;

  /**
   * Callback when a node is collapsed.
   */
  // 这个回调绑定到 readonly onCollapse?: (nodeId: string | number) => void;，负责终端渲染在该局部场景下的响应。
  readonly onCollapse?: (nodeId: string | number) => void;

  /**
   * Custom prefix function for parent nodes
   * @param isExpanded - Whether the parent node is currently expanded
   * @returns The prefix string to display (default: '▼ ' when expanded, '▶ ' when collapsed)
   */
  // 这个回调绑定到 readonly getParentPrefix?: (isExpanded: boolean) => string;，负责终端渲染在该局部场景下的响应。
  readonly getParentPrefix?: (isExpanded: boolean) => string;

  /**
   * Custom prefix function for child nodes
   * @param depth - The depth of the child node in the tree (0-indexed from parent)
   * @returns The prefix string to display (default: '  ▸ ')
   */
  // 这个回调绑定到 readonly getChildPrefix?: (depth: number) => string;，负责终端渲染在该局部场景下的响应。
  readonly getChildPrefix?: (depth: number) => string;

  /**
   * Callback when user presses up from the first item.
   * If provided, navigation will not wrap to the last item.
   */
  // 这个回调绑定到 readonly onUpFromFirstItem?: () => void;，负责终端渲染在该局部场景下的响应。
  readonly onUpFromFirstItem?: () => void;
};

/**
 * TreeSelect is a generic component for selecting items from a hierarchical tree structure.
 * It handles expand/collapse state, keyboard navigation, and renders the tree as a flat list
 * using the Select component.
 */
// TreeSelect 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TreeSelect(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(48);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    nodes,
    onSelect,
    onCancel,
    onFocus,
    focusNodeId,
    visibleOptionCount,
    layout: t1,
    isDisabled: t2,
    hideIndexes: t3,
    isNodeExpanded,
    onExpand,
    onCollapse,
    getParentPrefix,
    getChildPrefix,
    onUpFromFirstItem
  } = t0;
  // layout标记终端 UI Tree Select是否启用对应路径。
  const layout = t1 === undefined ? "expanded" : t1;
  // isDisabled标记终端 UI Tree Select是否启用对应路径。
  const isDisabled = t2 === undefined ? false : t2;
  // hideIndexes 索引标记终端 UI Tree Select是否启用对应路径。
  const hideIndexes = t3 === undefined ? false : t3;
  // t4 暂存 `new Set()` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `new Set()` 生成的渲染片段，后续返回路径直接复用。
    t4 = new Set();
    // $[0] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[0];
  }
  // 从 `React.useState(t4)` 按位置拆出 internalExpandedIds、setInternalExpandedIds，让终端 UI 组件 Tree Select分别处理这些返回值。
  const [internalExpandedIds, setInternalExpandedIds] = React.useState(t4);
  // isProgrammaticFocusRef 引用记录 `React.useRef` 是否成立，终端渲染随后按该结果分支。
  const isProgrammaticFocusRef = React.useRef(false);
  // lastFocusedIdRef 引用保存`React.useRef`，供终端渲染后续处理使用。
  const lastFocusedIdRef = React.useRef(null);
  // t5 暂存 `nodeId => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== internalExpandedIds || $[2] !== isNodeExpanded) {
    // t5 暂存 `nodeId => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = nodeId => {
      // 满足 `isNodeExpanded` 时，终端渲染执行该分支。
      if (isNodeExpanded) {
        // 返回 `isNodeExpanded(nodeId)`，作为终端渲染这次计算的结果。
        return isNodeExpanded(nodeId);
      }
      // 返回 `internalExpandedIds.has(nodeId)`，作为终端渲染这次计算的结果。
      return internalExpandedIds.has(nodeId);
    };
    // $[1] 缓存 `internalExpandedIds`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = internalExpandedIds;
    // $[2] 缓存 `isNodeExpanded`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = isNodeExpanded;
    // $[3] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[3];
  }
  // isExpanded标记终端 UI Tree Select是否启用对应路径。
  const isExpanded = t5;
  // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let result;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== isExpanded || $[5] !== nodes) {
    // 结果更新为 `[]`，确保终端 UI后续读取最新状态。
    result = [];
    // traverse 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function traverse(node, depth, parentId) {
      // hasChildren标记终端 UI Tree Select是否启用对应路径。
      const hasChildren = !!node.children && node.children.length > 0;
      // nodeIsExpanded保存`isExpanded`，供终端渲染后续处理使用。
      const nodeIsExpanded = isExpanded(node.id);
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push({
        node,
        depth,
        isExpanded: nodeIsExpanded,
        hasChildren,
        parentId
      });
      // 只有 `hasChildren && nodeIsExpanded && node.children` 满足时，终端渲染才执行该分支。
      if (hasChildren && nodeIsExpanded && node.children) {
        // 按顺序遍历 `node.children` 中的child，逐个交给终端渲染处理。
        for (const child of node.children) {
          // 调用 traverse，触发终端渲染此处需要的副作用。
          traverse(child, depth + 1, node.id);
        }
      }
    }
    // 按顺序遍历 `nodes` 中的node_0，逐个交给终端渲染处理。
    for (const node_0 of nodes) {
      // 调用 traverse，触发终端渲染此处需要的副作用。
      traverse(node_0, 0);
    }
    // $[4] 缓存 `isExpanded`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = isExpanded;
    // $[5] 缓存 `nodes`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = nodes;
    // $[6] 缓存 `result`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = result;
  } else {
    // 结果更新为 `$[6]`，确保终端 UI后续读取最新状态。
    result = $[6];
  }
  // flattenedNodes 集合保存`result`，供后续判断或组装使用。
  const flattenedNodes = result;
  // defaultGetParentPrefix保存`_temp`，供后续判断或组装使用。
  const defaultGetParentPrefix = _temp;
  // defaultGetChildPrefix保存`_temp2`，供终端 UI Tree Select后续判断或输出使用。
  const defaultGetChildPrefix = _temp2;
  // parentPrefixFn读取`getParentPrefix ?? defaultGetParentPrefix` 整理出中间结果，供终端 UI Tree Select后续步骤使用。
  const parentPrefixFn = getParentPrefix ?? defaultGetParentPrefix;
  // childPrefixFn读取`getChildPrefix ?? defaultGetChildPrefix` 整理出中间结果，供终端 UI Tree Select后续步骤使用。
  const childPrefixFn = getChildPrefix ?? defaultGetChildPrefix;
  // t6 暂存 `flatNode => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== childPrefixFn || $[8] !== parentPrefixFn) {
    // t6 暂存 `flatNode => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = flatNode => {
      // prefix保存`""`，作为后续固定文本处理的输入。
      let prefix = "";
      // 满足 `flatNode.hasChildren` 时，终端渲染执行该分支。
      if (flatNode.hasChildren) {
        // prefix更新为 `parentPrefixFn(flatNode.isExpanded)`，确保终端 UI后续读取最新状态。
        prefix = parentPrefixFn(flatNode.isExpanded);
      } else {
        // 满足 `flatNode.depth > 0` 时，终端渲染执行该分支。
        if (flatNode.depth > 0) {
          // prefix更新为 `childPrefixFn(flatNode.depth)`，确保终端 UI后续读取最新状态。
          prefix = childPrefixFn(flatNode.depth);
        }
      }
      // 返回 `prefix + flatNode.node.label`，作为终端渲染这次计算的结果。
      return prefix + flatNode.node.label;
    };
    // $[7] 缓存 `childPrefixFn`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = childPrefixFn;
    // $[8] 缓存 `parentPrefixFn`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = parentPrefixFn;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // buildLabel保存`t6`，作为后续临时缓存值处理的输入。
  const buildLabel = t6;
  // t7 暂存 `flattenedNodes.map(flatNode_0 => ({` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== buildLabel || $[11] !== flattenedNodes) {
    // t7 暂存 `flattenedNodes.map(flatNode_0 => ({` 生成的渲染片段，后续返回路径直接复用。
    t7 = flattenedNodes.map(flatNode_0 => ({
      label: buildLabel(flatNode_0),
      description: flatNode_0.node.description,
      dimDescription: flatNode_0.node.dimDescription ?? true,
      value: flatNode_0.node.id
    }));
    // $[10] 缓存 `buildLabel`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = buildLabel;
    // $[11] 缓存 `flattenedNodes`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = flattenedNodes;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[12];
  }
  // 选项保存`t7`，作为后续临时缓存值处理的输入。
  const options = t7;
  // map 先占位，稍后的条件分支会根据实际输入补齐它。
  let map;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== flattenedNodes) {
    // map更新为 `new Map()`，确保终端 UI后续读取最新状态。
    map = new Map();
    // 调用 flattenedNodes.forEach，触发终端渲染此处需要的副作用。
    flattenedNodes.forEach(fn => map.set(fn.node.id, fn.node));
    // $[13] 缓存 `flattenedNodes`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = flattenedNodes;
    // $[14] 缓存 `map`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = map;
  } else {
    // map更新为 `$[14]`，确保终端 UI后续读取最新状态。
    map = $[14];
  }
  // nodeMap派生`map` 整理出中间结果，供终端 UI Tree Select后续步骤使用。
  const nodeMap = map;
  // t8 暂存 `nodeId_0 => flattenedNodes.find(fn_0 => fn_0.node.id === ...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== flattenedNodes) {
    // t8 暂存 `nodeId_0 => flattenedNodes.find(fn_0 => fn_0.node.id === ...` 生成的渲染片段，后续返回路径直接复用。
    t8 = nodeId_0 => flattenedNodes.find(fn_0 => fn_0.node.id === nodeId_0);
    // $[15] 缓存 `flattenedNodes`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = flattenedNodes;
    // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[16];
  }
  // findFlattenedNode 命名 `t8`，让后续代码直接表达这个值的用途。
  const findFlattenedNode = t8;
  // t9 暂存 `(nodeId_1, shouldExpand) => {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== findFlattenedNode || $[18] !== onCollapse || $[19] !== onExpand) {
    // t9 暂存 `(nodeId_1, shouldExpand) => {` 生成的渲染片段，后续返回路径直接复用。
    t9 = (nodeId_1, shouldExpand) => {
      // flatNode_1筛选`findFlattenedNode`，供终端渲染后续处理使用。
      const flatNode_1 = findFlattenedNode(nodeId_1);
      // 只有 `!flatNode_1 || !flatNode_1.hasChildren` 满足时，终端渲染才执行该分支。
      if (!flatNode_1 || !flatNode_1.hasChildren) {
        // 终端 UI 组件 Tree Select在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `shouldExpand` 时，终端渲染执行该分支。
      if (shouldExpand) {
        // 满足 `onExpand` 时，终端渲染执行该分支。
        if (onExpand) {
          // 调用 onExpand，触发终端渲染此处需要的副作用。
          onExpand(nodeId_1);
        } else {
          // setInternalExpandedIds 写入新的状态值，使终端渲染后续读取保持一致。
          setInternalExpandedIds(prev => new Set(prev).add(nodeId_1));
        }
      } else {
        // 满足 `onCollapse` 时，终端渲染执行该分支。
        if (onCollapse) {
          // 调用 onCollapse，触发终端渲染此处需要的副作用。
          onCollapse(nodeId_1);
        } else {
          // setInternalExpandedIds 写入新的状态值，使终端渲染后续读取保持一致。
          setInternalExpandedIds(prev_0 => {
            // newSet保存`Set`，供终端渲染后续处理使用。
            const newSet = new Set(prev_0);
            // 调用 newSet.delete，触发终端渲染此处需要的副作用。
            newSet.delete(nodeId_1);
            // 返回 `newSet`，作为终端渲染这次计算的结果。
            return newSet;
          });
        }
      }
    };
    // $[17] 缓存 `findFlattenedNode`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = findFlattenedNode;
    // $[18] 缓存 `onCollapse`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = onCollapse;
    // $[19] 缓存 `onExpand`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = onExpand;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[20];
  }
  // toggleExpand沿用 `t9` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const toggleExpand = t9;
  // t10 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== findFlattenedNode || $[22] !== focusNodeId || $[23] !== isDisabled || $[24] !== nodeMap || $[25] !== onFocus || $[26] !== toggleExpand) {
    // t10 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t10 = e => {
      // 只有 `!focusNodeId || isDisabled` 满足时，终端渲染才执行该分支。
      if (!focusNodeId || isDisabled) {
        // 终端 UI 组件 Tree Select在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // flatNode_2筛选`findFlattenedNode`，供终端渲染后续处理使用。
      const flatNode_2 = findFlattenedNode(focusNodeId);
      // flatNode_2缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!flatNode_2) {
        // 终端 UI 组件 Tree Select在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 只有 `e.key === "right" && flatNode_2.hasChildren` 满足时，终端渲染才执行该分支。
      if (e.key === "right" && flatNode_2.hasChildren) {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // 调用 toggleExpand，触发终端渲染此处需要的副作用。
        toggleExpand(focusNodeId, true);
      } else {
        // 当 `e.key` 匹配 `"left"` 时，终端渲染执行对应分支。
        if (e.key === "left") {
          // 只有 `flatNode_2.hasChildren && flatNode_2.isExpanded` 满足时，终端渲染才执行该分支。
          if (flatNode_2.hasChildren && flatNode_2.isExpanded) {
            // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
            e.preventDefault();
            // 调用 toggleExpand，触发终端渲染此处需要的副作用。
            toggleExpand(focusNodeId, false);
          } else {
            // `flatNode_2.parentId` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
            if (flatNode_2.parentId !== undefined) {
              // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
              e.preventDefault();
              // current更新为 `true`，确保终端 UI后续读取最新状态。
              isProgrammaticFocusRef.current = true;
              // 调用 toggleExpand，触发终端渲染此处需要的副作用。
              toggleExpand(flatNode_2.parentId, false);
              // 满足 `onFocus` 时，终端渲染执行该分支。
              if (onFocus) {
                // parentNode读取`nodeMap.get`，供终端渲染后续处理使用。
                const parentNode = nodeMap.get(flatNode_2.parentId);
                // 满足 `parentNode` 时，终端渲染执行该分支。
                if (parentNode) {
                  // 调用 onFocus，触发终端渲染此处需要的副作用。
                  onFocus(parentNode);
                }
              }
            }
          }
        }
      }
    };
    // $[21] 缓存 `findFlattenedNode`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = findFlattenedNode;
    // $[22] 缓存 `focusNodeId`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = focusNodeId;
    // $[23] 缓存 `isDisabled`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = isDisabled;
    // $[24] 缓存 `nodeMap`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = nodeMap;
    // $[25] 缓存 `onFocus`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = onFocus;
    // $[26] 缓存 `toggleExpand`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = toggleExpand;
    // $[27] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[27];
  }
  // handleKeyDown保存`t10`，作为后续临时缓存值处理的输入。
  const handleKeyDown = t10;
  // t11 暂存 `nodeId_2 => {` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== nodeMap || $[29] !== onSelect) {
    // t11 暂存 `nodeId_2 => {` 生成的渲染片段，后续返回路径直接复用。
    t11 = nodeId_2 => {
      // node_1读取`nodeMap.get`，供终端渲染后续处理使用。
      const node_1 = nodeMap.get(nodeId_2);
      // node_1缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!node_1) {
        // 终端 UI 组件 Tree Select在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 onSelect，触发终端渲染此处需要的副作用。
      onSelect(node_1);
    };
    // $[28] 缓存 `nodeMap`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = nodeMap;
    // $[29] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = onSelect;
    // $[30] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[30];
  }
  // handleChange保存`t11`，作为后续临时缓存值处理的输入。
  const handleChange = t11;
  // t12 暂存 `nodeId_3 => {` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== nodeMap || $[32] !== onFocus) {
    // t12 暂存 `nodeId_3 => {` 生成的渲染片段，后续返回路径直接复用。
    t12 = nodeId_3 => {
      // 满足 `isProgrammaticFocusRef.current` 时，终端渲染执行该分支。
      if (isProgrammaticFocusRef.current) {
        // current更新为 `false`，确保终端 UI后续读取最新状态。
        isProgrammaticFocusRef.current = false;
        // 终端 UI 组件 Tree Select在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `lastFocusedIdRef.current === nodeId_3` 时，终端渲染执行该分支。
      if (lastFocusedIdRef.current === nodeId_3) {
        // 终端 UI 组件 Tree Select在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // current更新为 `nodeId_3`，确保终端 UI后续读取最新状态。
      lastFocusedIdRef.current = nodeId_3;
      // 满足 `onFocus` 时，终端渲染执行该分支。
      if (onFocus) {
        // node_2读取`nodeMap.get`，供终端渲染后续处理使用。
        const node_2 = nodeMap.get(nodeId_3);
        // 满足 `node_2` 时，终端渲染执行该分支。
        if (node_2) {
          // 调用 onFocus，触发终端渲染此处需要的副作用。
          onFocus(node_2);
        }
      }
    };
    // $[31] 缓存 `nodeMap`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = nodeMap;
    // $[32] 缓存 `onFocus`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = onFocus;
    // $[33] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[33];
  }
  // handleFocus 集合保存`t12`，作为后续临时缓存值处理的输入。
  const handleFocus = t12;
  // t13 暂存 `<Select options={options} onChange={handleChange} onFocus...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== focusNodeId || $[35] !== handleChange || $[36] !== handleFocus || $[37] !== hideIndexes || $[38] !== isDisabled || $[39] !== layout || $[40] !== onCancel || $[41] !== onUpFromFirstItem || $[42] !== options || $[43] !== visibleOptionCount) {
    // t13 暂存 `<Select options={options} onChange={handleChange} onFocus...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Select options={options} onChange={handleChange} onFocus={handleFocus} onCancel={onCancel} defaultFocusValue={focusNodeId} visibleOptionCount={visibleOptionCount} layout={layout} isDisabled={isDisabled} hideIndexes={hideIndexes} onUpFromFirstItem={onUpFromFirstItem} />;
    // $[34] 缓存 `focusNodeId`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = focusNodeId;
    // $[35] 缓存 `handleChange`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = handleChange;
    // $[36] 缓存 `handleFocus`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = handleFocus;
    // $[37] 缓存 `hideIndexes`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = hideIndexes;
    // $[38] 缓存 `isDisabled`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = isDisabled;
    // $[39] 缓存 `layout`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = layout;
    // $[40] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = onCancel;
    // $[41] 缓存 `onUpFromFirstItem`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = onUpFromFirstItem;
    // $[42] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = options;
    // $[43] 缓存 `visibleOptionCount`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = visibleOptionCount;
    // $[44] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[44];
  }
  // t14 暂存 `<Box tabIndex={0} autoFocus={true} onKeyDown={handleKeyDo...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== handleKeyDown || $[46] !== t13) {
    // t14 暂存 `<Box tabIndex={0} autoFocus={true} onKeyDown={handleKeyDo...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Box tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t13}</Box>;
    // $[45] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = handleKeyDown;
    // $[46] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t13;
    // $[47] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[47];
  }
  // 返回 `t14`，作为终端渲染这次计算的结果。
  return t14;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(_depth) {
  // 返回 `" \u25B8 "`，作为终端渲染这次计算的结果。
  return "  \u25B8 ";
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(isExpanded_0) {
  // 返回 `isExpanded_0 ? "\u25BC " : "\u25B6 "`，作为终端渲染这次计算的结果。
  return isExpanded_0 ? "\u25BC " : "\u25B6 ";
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIktleWJvYXJkRXZlbnQiLCJCb3giLCJPcHRpb25XaXRoRGVzY3JpcHRpb24iLCJTZWxlY3QiLCJUcmVlTm9kZSIsImlkIiwidmFsdWUiLCJUIiwibGFiZWwiLCJkZXNjcmlwdGlvbiIsImRpbURlc2NyaXB0aW9uIiwiY2hpbGRyZW4iLCJtZXRhZGF0YSIsIlJlY29yZCIsIkZsYXR0ZW5lZE5vZGUiLCJub2RlIiwiZGVwdGgiLCJpc0V4cGFuZGVkIiwiaGFzQ2hpbGRyZW4iLCJwYXJlbnRJZCIsIlRyZWVTZWxlY3RQcm9wcyIsIm5vZGVzIiwib25TZWxlY3QiLCJvbkNhbmNlbCIsIm9uRm9jdXMiLCJmb2N1c05vZGVJZCIsInZpc2libGVPcHRpb25Db3VudCIsImxheW91dCIsImlzRGlzYWJsZWQiLCJoaWRlSW5kZXhlcyIsImlzTm9kZUV4cGFuZGVkIiwibm9kZUlkIiwib25FeHBhbmQiLCJvbkNvbGxhcHNlIiwiZ2V0UGFyZW50UHJlZml4IiwiZ2V0Q2hpbGRQcmVmaXgiLCJvblVwRnJvbUZpcnN0SXRlbSIsIlRyZWVTZWxlY3QiLCJ0MCIsIiQiLCJfYyIsInQxIiwidDIiLCJ0MyIsInVuZGVmaW5lZCIsInQ0IiwiU3ltYm9sIiwiZm9yIiwiU2V0IiwiaW50ZXJuYWxFeHBhbmRlZElkcyIsInNldEludGVybmFsRXhwYW5kZWRJZHMiLCJ1c2VTdGF0ZSIsImlzUHJvZ3JhbW1hdGljRm9jdXNSZWYiLCJ1c2VSZWYiLCJsYXN0Rm9jdXNlZElkUmVmIiwidDUiLCJoYXMiLCJyZXN1bHQiLCJ0cmF2ZXJzZSIsImxlbmd0aCIsIm5vZGVJc0V4cGFuZGVkIiwicHVzaCIsImNoaWxkIiwibm9kZV8wIiwiZmxhdHRlbmVkTm9kZXMiLCJkZWZhdWx0R2V0UGFyZW50UHJlZml4IiwiX3RlbXAiLCJkZWZhdWx0R2V0Q2hpbGRQcmVmaXgiLCJfdGVtcDIiLCJwYXJlbnRQcmVmaXhGbiIsImNoaWxkUHJlZml4Rm4iLCJ0NiIsImZsYXROb2RlIiwicHJlZml4IiwiYnVpbGRMYWJlbCIsInQ3IiwibWFwIiwiZmxhdE5vZGVfMCIsIm9wdGlvbnMiLCJNYXAiLCJmb3JFYWNoIiwiZm4iLCJzZXQiLCJub2RlTWFwIiwidDgiLCJub2RlSWRfMCIsImZpbmQiLCJmbl8wIiwiZmluZEZsYXR0ZW5lZE5vZGUiLCJ0OSIsIm5vZGVJZF8xIiwic2hvdWxkRXhwYW5kIiwiZmxhdE5vZGVfMSIsInByZXYiLCJhZGQiLCJwcmV2XzAiLCJuZXdTZXQiLCJkZWxldGUiLCJ0b2dnbGVFeHBhbmQiLCJ0MTAiLCJlIiwiZmxhdE5vZGVfMiIsImtleSIsInByZXZlbnREZWZhdWx0IiwiY3VycmVudCIsInBhcmVudE5vZGUiLCJnZXQiLCJoYW5kbGVLZXlEb3duIiwidDExIiwibm9kZUlkXzIiLCJub2RlXzEiLCJoYW5kbGVDaGFuZ2UiLCJ0MTIiLCJub2RlSWRfMyIsIm5vZGVfMiIsImhhbmRsZUZvY3VzIiwidDEzIiwidDE0IiwiX2RlcHRoIiwiaXNFeHBhbmRlZF8wIl0sInNvdXJjZXMiOlsiVHJlZVNlbGVjdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBLZXlib2FyZEV2ZW50IH0gZnJvbSAnLi4vLi4vaW5rL2V2ZW50cy9rZXlib2FyZC1ldmVudC5qcydcbmltcG9ydCB7IEJveCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHR5cGUgT3B0aW9uV2l0aERlc2NyaXB0aW9uLCBTZWxlY3QgfSBmcm9tICcuLi9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuXG5leHBvcnQgdHlwZSBUcmVlTm9kZTxUPiA9IHtcbiAgaWQ6IHN0cmluZyB8IG51bWJlclxuICB2YWx1ZTogVFxuICBsYWJlbDogc3RyaW5nXG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nXG4gIGRpbURlc2NyaXB0aW9uPzogYm9vbGVhblxuICBjaGlsZHJlbj86IFRyZWVOb2RlPFQ+W11cbiAgbWV0YWRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxufVxuXG50eXBlIEZsYXR0ZW5lZE5vZGU8VD4gPSB7XG4gIG5vZGU6IFRyZWVOb2RlPFQ+XG4gIGRlcHRoOiBudW1iZXJcbiAgaXNFeHBhbmRlZDogYm9vbGVhblxuICBoYXNDaGlsZHJlbjogYm9vbGVhblxuICBwYXJlbnRJZD86IHN0cmluZyB8IG51bWJlclxufVxuXG5leHBvcnQgdHlwZSBUcmVlU2VsZWN0UHJvcHM8VD4gPSB7XG4gIC8qKlxuICAgKiBUcmVlIG5vZGVzIHRvIGRpc3BsYXkuXG4gICAqL1xuICByZWFkb25seSBub2RlczogVHJlZU5vZGU8VD5bXVxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB3aGVuIGEgbm9kZSBpcyBzZWxlY3RlZC5cbiAgICovXG4gIHJlYWRvbmx5IG9uU2VsZWN0OiAobm9kZTogVHJlZU5vZGU8VD4pID0+IHZvaWRcblxuICAvKipcbiAgICogQ2FsbGJhY2sgd2hlbiBjYW5jZWwgaXMgcHJlc3NlZC5cbiAgICovXG4gIHJlYWRvbmx5IG9uQ2FuY2VsPzogKCkgPT4gdm9pZFxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB3aGVuIGZvY3VzZWQgbm9kZSBjaGFuZ2VzLlxuICAgKi9cbiAgcmVhZG9ubHkgb25Gb2N1cz86IChub2RlOiBUcmVlTm9kZTxUPikgPT4gdm9pZFxuXG4gIC8qKlxuICAgKiBOb2RlIHRvIGZvY3VzIGJ5IElELlxuICAgKi9cbiAgcmVhZG9ubHkgZm9jdXNOb2RlSWQ/OiBzdHJpbmcgfCBudW1iZXJcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHZpc2libGUgb3B0aW9ucy5cbiAgICovXG4gIHJlYWRvbmx5IHZpc2libGVPcHRpb25Db3VudD86IG51bWJlclxuXG4gIC8qKlxuICAgKiBMYXlvdXQgb2YgdGhlIG9wdGlvbnMuXG4gICAqL1xuICByZWFkb25seSBsYXlvdXQ/OiAnY29tcGFjdCcgfCAnZXhwYW5kZWQnIHwgJ2NvbXBhY3QtdmVydGljYWwnXG5cbiAgLyoqXG4gICAqIFdoZW4gZGlzYWJsZWQsIHVzZXIgaW5wdXQgaXMgaWdub3JlZC5cbiAgICovXG4gIHJlYWRvbmx5IGlzRGlzYWJsZWQ/OiBib29sZWFuXG5cbiAgLyoqXG4gICAqIFdoZW4gdHJ1ZSwgaGlkZXMgdGhlIG51bWVyaWMgaW5kZXhlcyBuZXh0IHRvIGVhY2ggb3B0aW9uLlxuICAgKi9cbiAgcmVhZG9ubHkgaGlkZUluZGV4ZXM/OiBib29sZWFuXG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRvIGRldGVybWluZSBpZiBhIG5vZGUgc2hvdWxkIGJlIGluaXRpYWxseSBleHBhbmRlZC5cbiAgICogSWYgbm90IHByb3ZpZGVkLCBhbGwgbm9kZXMgc3RhcnQgY29sbGFwc2VkLlxuICAgKi9cbiAgcmVhZG9ubHkgaXNOb2RlRXhwYW5kZWQ/OiAobm9kZUlkOiBzdHJpbmcgfCBudW1iZXIpID0+IGJvb2xlYW5cblxuICAvKipcbiAgICogQ2FsbGJhY2sgd2hlbiBhIG5vZGUgaXMgZXhwYW5kZWQuXG4gICAqL1xuICByZWFkb25seSBvbkV4cGFuZD86IChub2RlSWQ6IHN0cmluZyB8IG51bWJlcikgPT4gdm9pZFxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayB3aGVuIGEgbm9kZSBpcyBjb2xsYXBzZWQuXG4gICAqL1xuICByZWFkb25seSBvbkNvbGxhcHNlPzogKG5vZGVJZDogc3RyaW5nIHwgbnVtYmVyKSA9PiB2b2lkXG5cbiAgLyoqXG4gICAqIEN1c3RvbSBwcmVmaXggZnVuY3Rpb24gZm9yIHBhcmVudCBub2Rlc1xuICAgKiBAcGFyYW0gaXNFeHBhbmRlZCAtIFdoZXRoZXIgdGhlIHBhcmVudCBub2RlIGlzIGN1cnJlbnRseSBleHBhbmRlZFxuICAgKiBAcmV0dXJucyBUaGUgcHJlZml4IHN0cmluZyB0byBkaXNwbGF5IChkZWZhdWx0OiAn4pa8ICcgd2hlbiBleHBhbmRlZCwgJ+KWtiAnIHdoZW4gY29sbGFwc2VkKVxuICAgKi9cbiAgcmVhZG9ubHkgZ2V0UGFyZW50UHJlZml4PzogKGlzRXhwYW5kZWQ6IGJvb2xlYW4pID0+IHN0cmluZ1xuXG4gIC8qKlxuICAgKiBDdXN0b20gcHJlZml4IGZ1bmN0aW9uIGZvciBjaGlsZCBub2Rlc1xuICAgKiBAcGFyYW0gZGVwdGggLSBUaGUgZGVwdGggb2YgdGhlIGNoaWxkIG5vZGUgaW4gdGhlIHRyZWUgKDAtaW5kZXhlZCBmcm9tIHBhcmVudClcbiAgICogQHJldHVybnMgVGhlIHByZWZpeCBzdHJpbmcgdG8gZGlzcGxheSAoZGVmYXVsdDogJyAg4pa4ICcpXG4gICAqL1xuICByZWFkb25seSBnZXRDaGlsZFByZWZpeD86IChkZXB0aDogbnVtYmVyKSA9PiBzdHJpbmdcblxuICAvKipcbiAgICogQ2FsbGJhY2sgd2hlbiB1c2VyIHByZXNzZXMgdXAgZnJvbSB0aGUgZmlyc3QgaXRlbS5cbiAgICogSWYgcHJvdmlkZWQsIG5hdmlnYXRpb24gd2lsbCBub3Qgd3JhcCB0byB0aGUgbGFzdCBpdGVtLlxuICAgKi9cbiAgcmVhZG9ubHkgb25VcEZyb21GaXJzdEl0ZW0/OiAoKSA9PiB2b2lkXG59XG5cbi8qKlxuICogVHJlZVNlbGVjdCBpcyBhIGdlbmVyaWMgY29tcG9uZW50IGZvciBzZWxlY3RpbmcgaXRlbXMgZnJvbSBhIGhpZXJhcmNoaWNhbCB0cmVlIHN0cnVjdHVyZS5cbiAqIEl0IGhhbmRsZXMgZXhwYW5kL2NvbGxhcHNlIHN0YXRlLCBrZXlib2FyZCBuYXZpZ2F0aW9uLCBhbmQgcmVuZGVycyB0aGUgdHJlZSBhcyBhIGZsYXQgbGlzdFxuICogdXNpbmcgdGhlIFNlbGVjdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBUcmVlU2VsZWN0PFQ+KHtcbiAgbm9kZXMsXG4gIG9uU2VsZWN0LFxuICBvbkNhbmNlbCxcbiAgb25Gb2N1cyxcbiAgZm9jdXNOb2RlSWQsXG4gIHZpc2libGVPcHRpb25Db3VudCxcbiAgbGF5b3V0ID0gJ2V4cGFuZGVkJyxcbiAgaXNEaXNhYmxlZCA9IGZhbHNlLFxuICBoaWRlSW5kZXhlcyA9IGZhbHNlLFxuICBpc05vZGVFeHBhbmRlZCxcbiAgb25FeHBhbmQsXG4gIG9uQ29sbGFwc2UsXG4gIGdldFBhcmVudFByZWZpeCxcbiAgZ2V0Q2hpbGRQcmVmaXgsXG4gIG9uVXBGcm9tRmlyc3RJdGVtLFxufTogVHJlZVNlbGVjdFByb3BzPFQ+KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgLy8gVHJhY2sgd2hpY2ggbm9kZXMgYXJlIGV4cGFuZGVkIChpbnRlcm5hbCBzdGF0ZSBpZiBub3QgY29udHJvbGxlZCBleHRlcm5hbGx5KVxuICBjb25zdCBbaW50ZXJuYWxFeHBhbmRlZElkcywgc2V0SW50ZXJuYWxFeHBhbmRlZElkc10gPSBSZWFjdC51c2VTdGF0ZTxcbiAgICBTZXQ8c3RyaW5nIHwgbnVtYmVyPlxuICA+KG5ldyBTZXQoKSlcblxuICAvLyBUcmFjayBpZiB3ZSdyZSBwcm9ncmFtbWF0aWNhbGx5IHNldHRpbmcgZm9jdXMgdG8gYXZvaWQgaW5maW5pdGUgbG9vcHNcbiAgY29uc3QgaXNQcm9ncmFtbWF0aWNGb2N1c1JlZiA9IFJlYWN0LnVzZVJlZihmYWxzZSlcblxuICAvLyBUcmFjayBsYXN0IGZvY3VzZWQgSUQgdG8gcHJldmVudCBkdXBsaWNhdGUgZm9jdXMgY2FsbHNcbiAgY29uc3QgbGFzdEZvY3VzZWRJZFJlZiA9IFJlYWN0LnVzZVJlZjxzdHJpbmcgfCBudW1iZXIgfCBudWxsPihudWxsKVxuXG4gIC8vIERldGVybWluZSBpZiBhIG5vZGUgaXMgZXhwYW5kZWQgKHVzZSBleHRlcm5hbCBmdW5jdGlvbiBpZiBwcm92aWRlZCwgb3RoZXJ3aXNlIHVzZSBpbnRlcm5hbCBzdGF0ZSlcbiAgY29uc3QgaXNFeHBhbmRlZCA9IFJlYWN0LnVzZUNhbGxiYWNrKFxuICAgIChub2RlSWQ6IHN0cmluZyB8IG51bWJlcik6IGJvb2xlYW4gPT4ge1xuICAgICAgaWYgKGlzTm9kZUV4cGFuZGVkKSB7XG4gICAgICAgIHJldHVybiBpc05vZGVFeHBhbmRlZChub2RlSWQpXG4gICAgICB9XG4gICAgICByZXR1cm4gaW50ZXJuYWxFeHBhbmRlZElkcy5oYXMobm9kZUlkKVxuICAgIH0sXG4gICAgW2lzTm9kZUV4cGFuZGVkLCBpbnRlcm5hbEV4cGFuZGVkSWRzXSxcbiAgKVxuXG4gIC8vIEZsYXR0ZW4gdGhlIHRyZWUgaW50byBhIGxpbmVhciBsaXN0IGZvciB0aGUgU2VsZWN0IGNvbXBvbmVudFxuICBjb25zdCBmbGF0dGVuZWROb2RlcyA9IFJlYWN0LnVzZU1lbW8oKCk6IEZsYXR0ZW5lZE5vZGU8VD5bXSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OiBGbGF0dGVuZWROb2RlPFQ+W10gPSBbXVxuXG4gICAgZnVuY3Rpb24gdHJhdmVyc2UoXG4gICAgICBub2RlOiBUcmVlTm9kZTxUPixcbiAgICAgIGRlcHRoOiBudW1iZXIsXG4gICAgICBwYXJlbnRJZD86IHN0cmluZyB8IG51bWJlcixcbiAgICApOiB2b2lkIHtcbiAgICAgIGNvbnN0IGhhc0NoaWxkcmVuID0gISFub2RlLmNoaWxkcmVuICYmIG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgY29uc3Qgbm9kZUlzRXhwYW5kZWQgPSBpc0V4cGFuZGVkKG5vZGUuaWQpXG5cbiAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgbm9kZSxcbiAgICAgICAgZGVwdGgsXG4gICAgICAgIGlzRXhwYW5kZWQ6IG5vZGVJc0V4cGFuZGVkLFxuICAgICAgICBoYXNDaGlsZHJlbixcbiAgICAgICAgcGFyZW50SWQsXG4gICAgICB9KVxuXG4gICAgICAvLyBPbmx5IHRyYXZlcnNlIGNoaWxkcmVuIGlmIHRoaXMgbm9kZSBpcyBleHBhbmRlZFxuICAgICAgaWYgKGhhc0NoaWxkcmVuICYmIG5vZGVJc0V4cGFuZGVkICYmIG5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgdHJhdmVyc2UoY2hpbGQsIGRlcHRoICsgMSwgbm9kZS5pZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgdHJhdmVyc2Uobm9kZSwgMClcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH0sIFtub2RlcywgaXNFeHBhbmRlZF0pXG5cbiAgLy8gRGVmYXVsdCBwcmVmaXggZnVuY3Rpb25zXG4gIGNvbnN0IGRlZmF1bHRHZXRQYXJlbnRQcmVmaXggPSBSZWFjdC51c2VDYWxsYmFjayhcbiAgICAoaXNFeHBhbmRlZDogYm9vbGVhbik6IHN0cmluZyA9PiAoaXNFeHBhbmRlZCA/ICfilrwgJyA6ICfilrYgJyksXG4gICAgW10sXG4gIClcbiAgY29uc3QgZGVmYXVsdEdldENoaWxkUHJlZml4ID0gUmVhY3QudXNlQ2FsbGJhY2soXG4gICAgKF9kZXB0aDogbnVtYmVyKTogc3RyaW5nID0+ICcgIOKWuCAnLFxuICAgIFtdLFxuICApXG5cbiAgY29uc3QgcGFyZW50UHJlZml4Rm4gPSBnZXRQYXJlbnRQcmVmaXggPz8gZGVmYXVsdEdldFBhcmVudFByZWZpeFxuICBjb25zdCBjaGlsZFByZWZpeEZuID0gZ2V0Q2hpbGRQcmVmaXggPz8gZGVmYXVsdEdldENoaWxkUHJlZml4XG5cbiAgLy8gQnVpbGQgdGhlIGxhYmVsIHdpdGggYXBwcm9wcmlhdGUgcHJlZml4ZXMgYmFzZWQgb24gdHJlZSBwb3NpdGlvblxuICBjb25zdCBidWlsZExhYmVsID0gUmVhY3QudXNlQ2FsbGJhY2soXG4gICAgKGZsYXROb2RlOiBGbGF0dGVuZWROb2RlPFQ+KTogc3RyaW5nID0+IHtcbiAgICAgIGxldCBwcmVmaXggPSAnJ1xuXG4gICAgICBpZiAoZmxhdE5vZGUuaGFzQ2hpbGRyZW4pIHtcbiAgICAgICAgLy8gUGFyZW50IG5vZGUgd2l0aCBjaGlsZHJlblxuICAgICAgICBwcmVmaXggPSBwYXJlbnRQcmVmaXhGbihmbGF0Tm9kZS5pc0V4cGFuZGVkKVxuICAgICAgfSBlbHNlIGlmIChmbGF0Tm9kZS5kZXB0aCA+IDApIHtcbiAgICAgICAgLy8gQ2hpbGQgbm9kZVxuICAgICAgICBwcmVmaXggPSBjaGlsZFByZWZpeEZuKGZsYXROb2RlLmRlcHRoKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJlZml4ICsgZmxhdE5vZGUubm9kZS5sYWJlbFxuICAgIH0sXG4gICAgW3BhcmVudFByZWZpeEZuLCBjaGlsZFByZWZpeEZuXSxcbiAgKVxuXG4gIC8vIENvbnZlcnQgZmxhdHRlbmVkIG5vZGVzIHRvIFNlbGVjdCBvcHRpb25zXG4gIGNvbnN0IG9wdGlvbnMgPSBSZWFjdC51c2VNZW1vKCgpOiBPcHRpb25XaXRoRGVzY3JpcHRpb248XG4gICAgc3RyaW5nIHwgbnVtYmVyXG4gID5bXSA9PiB7XG4gICAgcmV0dXJuIGZsYXR0ZW5lZE5vZGVzLm1hcChmbGF0Tm9kZSA9PiAoe1xuICAgICAgbGFiZWw6IGJ1aWxkTGFiZWwoZmxhdE5vZGUpLFxuICAgICAgZGVzY3JpcHRpb246IGZsYXROb2RlLm5vZGUuZGVzY3JpcHRpb24sXG4gICAgICBkaW1EZXNjcmlwdGlvbjogZmxhdE5vZGUubm9kZS5kaW1EZXNjcmlwdGlvbiA/PyB0cnVlLFxuICAgICAgdmFsdWU6IGZsYXROb2RlLm5vZGUuaWQsXG4gICAgfSkpXG4gIH0sIFtmbGF0dGVuZWROb2RlcywgYnVpbGRMYWJlbF0pXG5cbiAgLy8gTWFwIGZyb20gbm9kZSBJRCB0byB0aGUgYWN0dWFsIG5vZGUgZm9yIHF1aWNrIGxvb2t1cFxuICBjb25zdCBub2RlTWFwID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcgfCBudW1iZXIsIFRyZWVOb2RlPFQ+PigpXG4gICAgZmxhdHRlbmVkTm9kZXMuZm9yRWFjaChmbiA9PiBtYXAuc2V0KGZuLm5vZGUuaWQsIGZuLm5vZGUpKVxuICAgIHJldHVybiBtYXBcbiAgfSwgW2ZsYXR0ZW5lZE5vZGVzXSlcblxuICAvLyBGaW5kIHRoZSBmbGF0dGVuZWQgbm9kZSBieSBJRFxuICBjb25zdCBmaW5kRmxhdHRlbmVkTm9kZSA9IFJlYWN0LnVzZUNhbGxiYWNrKFxuICAgIChub2RlSWQ6IHN0cmluZyB8IG51bWJlcik6IEZsYXR0ZW5lZE5vZGU8VD4gfCB1bmRlZmluZWQgPT4ge1xuICAgICAgcmV0dXJuIGZsYXR0ZW5lZE5vZGVzLmZpbmQoZm4gPT4gZm4ubm9kZS5pZCA9PT0gbm9kZUlkKVxuICAgIH0sXG4gICAgW2ZsYXR0ZW5lZE5vZGVzXSxcbiAgKVxuXG4gIC8vIEhhbmRsZSBleHBhbmQvY29sbGFwc2VcbiAgY29uc3QgdG9nZ2xlRXhwYW5kID0gUmVhY3QudXNlQ2FsbGJhY2soXG4gICAgKG5vZGVJZDogc3RyaW5nIHwgbnVtYmVyLCBzaG91bGRFeHBhbmQ6IGJvb2xlYW4pID0+IHtcbiAgICAgIGNvbnN0IGZsYXROb2RlID0gZmluZEZsYXR0ZW5lZE5vZGUobm9kZUlkKVxuICAgICAgaWYgKCFmbGF0Tm9kZSB8fCAhZmxhdE5vZGUuaGFzQ2hpbGRyZW4pIHJldHVyblxuXG4gICAgICBpZiAoc2hvdWxkRXhwYW5kKSB7XG4gICAgICAgIGlmIChvbkV4cGFuZCkge1xuICAgICAgICAgIG9uRXhwYW5kKG5vZGVJZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRJbnRlcm5hbEV4cGFuZGVkSWRzKHByZXYgPT4gbmV3IFNldChwcmV2KS5hZGQobm9kZUlkKSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG9uQ29sbGFwc2UpIHtcbiAgICAgICAgICBvbkNvbGxhcHNlKG5vZGVJZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZXRJbnRlcm5hbEV4cGFuZGVkSWRzKHByZXYgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3U2V0ID0gbmV3IFNldChwcmV2KVxuICAgICAgICAgICAgbmV3U2V0LmRlbGV0ZShub2RlSWQpXG4gICAgICAgICAgICByZXR1cm4gbmV3U2V0XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgW2ZpbmRGbGF0dGVuZWROb2RlLCBvbkV4cGFuZCwgb25Db2xsYXBzZV0sXG4gIClcblxuICAvLyBIYW5kbGUgbGVmdC9yaWdodCBhcnJvdyBrZXlzIGZvciBleHBhbmQvY29sbGFwc2VcbiAgY29uc3QgaGFuZGxlS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKCFmb2N1c05vZGVJZCB8fCBpc0Rpc2FibGVkKSByZXR1cm5cblxuICAgIGNvbnN0IGZsYXROb2RlID0gZmluZEZsYXR0ZW5lZE5vZGUoZm9jdXNOb2RlSWQpXG4gICAgaWYgKCFmbGF0Tm9kZSkgcmV0dXJuXG5cbiAgICBpZiAoZS5rZXkgPT09ICdyaWdodCcgJiYgZmxhdE5vZGUuaGFzQ2hpbGRyZW4pIHtcbiAgICAgIC8vIEV4cGFuZCB0aGUgZm9jdXNlZCBub2RlIChvbmx5IGlmIGl0IGhhcyBjaGlsZHJlbilcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgdG9nZ2xlRXhwYW5kKGZvY3VzTm9kZUlkLCB0cnVlKVxuICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09ICdsZWZ0Jykge1xuICAgICAgaWYgKGZsYXROb2RlLmhhc0NoaWxkcmVuICYmIGZsYXROb2RlLmlzRXhwYW5kZWQpIHtcbiAgICAgICAgLy8gQ29sbGFwc2UgdGhlIGZvY3VzZWQgcGFyZW50IG5vZGVcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIHRvZ2dsZUV4cGFuZChmb2N1c05vZGVJZCwgZmFsc2UpXG4gICAgICB9IGVsc2UgaWYgKGZsYXROb2RlLnBhcmVudElkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGNoaWxkIG5vZGUgT1IgYSBjb2xsYXBzZWQgcGFyZW50IHdpdGggYSBwYXJlbnQsXG4gICAgICAgIC8vIGNvbGxhcHNlIHRoZSBwYXJlbnQgYW5kIGZvY3VzIGl0XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBpc1Byb2dyYW1tYXRpY0ZvY3VzUmVmLmN1cnJlbnQgPSB0cnVlXG4gICAgICAgIHRvZ2dsZUV4cGFuZChmbGF0Tm9kZS5wYXJlbnRJZCwgZmFsc2UpXG4gICAgICAgIGlmIChvbkZvY3VzKSB7XG4gICAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IG5vZGVNYXAuZ2V0KGZsYXROb2RlLnBhcmVudElkKVxuICAgICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBvbkZvY3VzKHBhcmVudE5vZGUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSGFuZGxlIHNlbGVjdGlvblxuICBjb25zdCBoYW5kbGVDaGFuZ2UgPSBSZWFjdC51c2VDYWxsYmFjayhcbiAgICAobm9kZUlkOiBzdHJpbmcgfCBudW1iZXIpID0+IHtcbiAgICAgIGNvbnN0IG5vZGUgPSBub2RlTWFwLmdldChub2RlSWQpXG4gICAgICBpZiAoIW5vZGUpIHJldHVyblxuXG4gICAgICAvLyBBbHdheXMgc2VsZWN0IHRoZSBub2RlIC0gZXhwYW5kL2NvbGxhcHNlIGlzIGhhbmRsZWQgYnkgYXJyb3cga2V5c1xuICAgICAgb25TZWxlY3Qobm9kZSlcbiAgICB9LFxuICAgIFtub2RlTWFwLCBvblNlbGVjdF0sXG4gIClcblxuICAvLyBIYW5kbGUgZm9jdXMgY2hhbmdlc1xuICBjb25zdCBoYW5kbGVGb2N1cyA9IFJlYWN0LnVzZUNhbGxiYWNrKFxuICAgIChub2RlSWQ6IHN0cmluZyB8IG51bWJlcikgPT4ge1xuICAgICAgLy8gU2tpcCBpZiB0aGlzIGlzIGEgcHJvZ3JhbW1hdGljIGZvY3VzIGNoYW5nZVxuICAgICAgaWYgKGlzUHJvZ3JhbW1hdGljRm9jdXNSZWYuY3VycmVudCkge1xuICAgICAgICBpc1Byb2dyYW1tYXRpY0ZvY3VzUmVmLmN1cnJlbnQgPSBmYWxzZVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgLy8gU2tpcCBpZiBzYW1lIG5vZGUgYWxyZWFkeSBmb2N1c2VkXG4gICAgICBpZiAobGFzdEZvY3VzZWRJZFJlZi5jdXJyZW50ID09PSBub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBsYXN0Rm9jdXNlZElkUmVmLmN1cnJlbnQgPSBub2RlSWRcblxuICAgICAgaWYgKG9uRm9jdXMpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVNYXAuZ2V0KG5vZGVJZClcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICBvbkZvY3VzKG5vZGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIFtvbkZvY3VzLCBub2RlTWFwXSxcbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCB0YWJJbmRleD17MH0gYXV0b0ZvY3VzIG9uS2V5RG93bj17aGFuZGxlS2V5RG93bn0+XG4gICAgICA8U2VsZWN0XG4gICAgICAgIG9wdGlvbnM9e29wdGlvbnN9XG4gICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVDaGFuZ2V9XG4gICAgICAgIG9uRm9jdXM9e2hhbmRsZUZvY3VzfVxuICAgICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICAgIGRlZmF1bHRGb2N1c1ZhbHVlPXtmb2N1c05vZGVJZH1cbiAgICAgICAgdmlzaWJsZU9wdGlvbkNvdW50PXt2aXNpYmxlT3B0aW9uQ291bnR9XG4gICAgICAgIGxheW91dD17bGF5b3V0fVxuICAgICAgICBpc0Rpc2FibGVkPXtpc0Rpc2FibGVkfVxuICAgICAgICBoaWRlSW5kZXhlcz17aGlkZUluZGV4ZXN9XG4gICAgICAgIG9uVXBGcm9tRmlyc3RJdGVtPXtvblVwRnJvbUZpcnN0SXRlbX1cbiAgICAgIC8+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLGNBQWNDLGFBQWEsUUFBUSxvQ0FBb0M7QUFDdkUsU0FBU0MsR0FBRyxRQUFRLGNBQWM7QUFDbEMsU0FBUyxLQUFLQyxxQkFBcUIsRUFBRUMsTUFBTSxRQUFRLDJCQUEyQjtBQUU5RSxPQUFPLEtBQUtDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRztFQUN4QkMsRUFBRSxFQUFFLE1BQU0sR0FBRyxNQUFN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