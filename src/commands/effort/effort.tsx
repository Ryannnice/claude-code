// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useMainLoopModel，将 ../../hooks/useMainLoopModel.js 中已经封装好的能力接到本文件流程里。
import { useMainLoopModel } from '../../hooks/useMainLoopModel.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from '../../services/analytics/index.js';
// 引入 useAppState、useSetAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../../state/AppState.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 复用 EffortValue、getDisplayedEffortLevel、getEffortEnvOverride、getEffortValueDescription、isEffortLevel、toPersistableEffort 工具函数，把通用处理留在 ../../utils/effort.js 中维护。
import { type EffortValue, getDisplayedEffortLevel, getEffortEnvOverride, getEffortValueDescription, isEffortLevel, toPersistableEffort } from '../../utils/effort.js';
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../../utils/settings/settings.js';
// COMMON_HELP_ARGS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const COMMON_HELP_ARGS = ['help', '-h', '--help'];
// EffortCommandResult 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type EffortCommandResult = {
  message: string;
  effortUpdate?: {
    value: EffortValue | undefined;
  };
};
// setEffortValue 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function setEffortValue(effortValue: EffortValue): EffortCommandResult {
  // persistable保存`toPersistableEffort`，供命令处理后续处理使用。
  const persistable = toPersistableEffort(effortValue);
  // `persistable` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (persistable !== undefined) {
    // 结果保存`updateSettingsForSource`，供命令处理后续处理使用。
    const result = updateSettingsForSource('userSettings', {
      effortLevel: persistable
    });
    // 满足 `result.error` 时，命令处理执行该分支。
    if (result.error) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        message: `Failed to set effort level: ${result.error.message}`
      };
    }
  }
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_effort_command', {
    effort: effortValue as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  });

  // Env var wins at resolveAppliedEffort time. Only flag it when it actually
  // conflicts — if env matches what the user just asked for, the outcome is
  // the same, so "Set effort to X" is true and the note is noise.
  // envOverride读取`getEffortEnvOverride`，供命令处理后续处理使用。
  const envOverride = getEffortEnvOverride();
  // `envOverride` 与 `undefined && envOverride !== ef...` 不一致时刷新派生状态，避免使用过期结果。
  if (envOverride !== undefined && envOverride !== effortValue) {
    // envRaw 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const envRaw = process.env.CLAUDE_CODE_EFFORT_LEVEL;
    // 满足 `persistable === undefined` 时，命令处理执行该分支。
    if (persistable === undefined) {
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        message: `Not applied: CLAUDE_CODE_EFFORT_LEVEL=${envRaw} overrides effort this session, and ${effortValue} is session-only (nothing saved)`,
        effortUpdate: {
          value: effortValue
        }
      };
    }
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      message: `CLAUDE_CODE_EFFORT_LEVEL=${envRaw} overrides this session — clear it and ${effortValue} takes over`,
      effortUpdate: {
        value: effortValue
      }
    };
  }
  // description读取`getEffortValueDescription`，供命令处理后续处理使用。
  const description = getEffortValueDescription(effortValue);
  // suffix标记命令处理斜杠命令 effort是否启用对应路径。
  const suffix = persistable !== undefined ? '' : ' (this session only)';
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    message: `Set effort level to ${effortValue}${suffix}: ${description}`,
    effortUpdate: {
      value: effortValue
    }
  };
}
// showCurrentEffort 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function showCurrentEffort(appStateEffort: EffortValue | undefined, model: string): EffortCommandResult {
  // envOverride读取`getEffortEnvOverride`，供命令处理后续处理使用。
  const envOverride = getEffortEnvOverride();
  // effectiveValue标记命令处理斜杠命令 effort是否启用对应路径。
  const effectiveValue = envOverride === null ? undefined : envOverride ?? appStateEffort;
  // 满足 `effectiveValue === undefined` 时，命令处理执行该分支。
  if (effectiveValue === undefined) {
    // level读取`getDisplayedEffortLevel`，供命令处理后续处理使用。
    const level = getDisplayedEffortLevel(model, appStateEffort);
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      message: `Effort level: auto (currently ${level})`
    };
  }
  // description读取`getEffortValueDescription`，供命令处理后续处理使用。
  const description = getEffortValueDescription(effectiveValue);
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    message: `Current effort level: ${effectiveValue} (${description})`
  };
}
// unsetEffortLevel 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function unsetEffortLevel(): EffortCommandResult {
  // 结果保存`updateSettingsForSource`，供命令处理后续处理使用。
  const result = updateSettingsForSource('userSettings', {
    effortLevel: undefined
  });
  // 满足 `result.error` 时，命令处理执行该分支。
  if (result.error) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      message: `Failed to set effort level: ${result.error.message}`
    };
  }
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_effort_command', {
    effort: 'auto' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  });
  // env=auto/unset (null) matches what /effort auto asks for, so only warn
  // when env is pinning a specific level that will keep overriding.
  // envOverride读取`getEffortEnvOverride`，供命令处理后续处理使用。
  const envOverride = getEffortEnvOverride();
  // `envOverride` 与 `undefined && envOverride !== nu...` 不一致时刷新派生状态，避免使用过期结果。
  if (envOverride !== undefined && envOverride !== null) {
    // envRaw 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const envRaw = process.env.CLAUDE_CODE_EFFORT_LEVEL;
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      message: `Cleared effort from settings, but CLAUDE_CODE_EFFORT_LEVEL=${envRaw} still controls this session`,
      effortUpdate: {
        value: undefined
      }
    };
  }
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    message: 'Effort level set to auto',
    effortUpdate: {
      value: undefined
    }
  };
}
// executeEffort 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function executeEffort(args: string): EffortCommandResult {
  // normalized保存`args.toLowerCase`，供命令处理后续处理使用。
  const normalized = args.toLowerCase();
  // 当 `normalized` 匹配 `'auto' || normalized === 'u...` 时，命令处理执行对应分支。
  if (normalized === 'auto' || normalized === 'unset') {
    // 返回 `unsetEffortLevel()`，作为命令处理这次计算的结果。
    return unsetEffortLevel();
  }
  // 满足 `!isEffortLevel(normalized)` 时，命令处理执行该分支。
  if (!isEffortLevel(normalized)) {
    // 返回结构化结果，集中表达命令处理已经整理出的状态。
    return {
      message: `Invalid argument: ${args}. Valid options are: low, medium, high, max, auto`
    };
  }
  // 返回 `setEffortValue(normalized)`，作为命令处理这次计算的结果。
  return setEffortValue(normalized);
}
// ShowCurrentEffort 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ShowCurrentEffort(t0) {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // effortValue保存`useAppState`，供命令处理后续处理使用。
  const effortValue = useAppState(_temp);
  // 模型名称保存`useMainLoopModel`，供命令处理后续处理使用。
  const model = useMainLoopModel();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    message
  } = showCurrentEffort(effortValue, model);
  // 调用 onDone，触发命令处理此处需要的副作用。
  onDone(message);
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.effortValue`，作为命令处理这次计算的结果。
  return s.effortValue;
}
// ApplyEffortAndClose 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ApplyEffortAndClose(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    result,
    onDone
  } = t0;
  // setAppState 状态保存`useSetAppState`，供命令处理后续处理使用。
  const setAppState = useSetAppState();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    effortUpdate,
    message
  } = result;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[setAppState, effortUpdate, message, onDone]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== effortUpdate || $[1] !== message || $[2] !== onDone || $[3] !== setAppState) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 满足 `effortUpdate` 时，命令处理执行该分支。
      if (effortUpdate) {
        // setAppState 写入新的状态值，使命令处理后续读取保持一致。
        setAppState(prev => ({
          ...prev,
          effortValue: effortUpdate.value
        }));
      }
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(message);
    };
    // t2 暂存 `[setAppState, effortUpdate, message, onDone]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [setAppState, effortUpdate, message, onDone];
    // $[0] 缓存 `effortUpdate`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = effortUpdate;
    // $[1] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = message;
    // $[2] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onDone;
    // $[3] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = setAppState;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 调用 React.useEffect，触发命令处理此处需要的副作用。
  React.useEffect(t1, t2);
  // 返回 `null`，作为命令处理这次计算的结果。
  return null;
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, _context: unknown, args?: string): Promise<React.ReactNode> {
  // 参数列表更新为 `args?.trim() || ''`，确保斜杠命令后续读取最新状态。
  args = args?.trim() || '';
  // 满足 `COMMON_HELP_ARGS.includes(args)` 时，命令处理执行该分支。
  if (COMMON_HELP_ARGS.includes(args)) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('Usage: /effort [low|medium|high|max|auto]\n\nEffort levels:\n- low: Quick, straightforward implementation\n- medium: Balanced approach with standard testing\n- high: Comprehensive implementation with extensive testing\n- max: Maximum capability with deepest reasoning (Opus 4.6 only)\n- auto: Use the default effort level for your model');
    // 斜杠命令 effort在这里结束当前路径，避免继续执行不适用的后续分支。
    return;
  }
  // 当 `!args || args` 匹配 `'current' || args === 'stat...` 时，命令处理执行对应分支。
  if (!args || args === 'current' || args === 'status') {
    // 返回 `<ShowCurrentEffort onDone={onDone} />`，作为命令处理这次计算的结果。
    return <ShowCurrentEffort onDone={onDone} />;
  }
  // 结果保存`executeEffort`，供命令处理后续处理使用。
  const result = executeEffort(args);
  // 返回 `<ApplyEffortAndClose result={result} onDone={onDone} />`，作为命令处理这次计算的结果。
  return <ApplyEffortAndClose result={result} onDone={onDone} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZU1haW5Mb29wTW9kZWwiLCJBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTIiwibG9nRXZlbnQiLCJ1c2VBcHBTdGF0ZSIsInVzZVNldEFwcFN0YXRlIiwiTG9jYWxKU1hDb21tYW5kT25Eb25lIiwiRWZmb3J0VmFsdWUiLCJnZXREaXNwbGF5ZWRFZmZvcnRMZXZlbCIsImdldEVmZm9ydEVudk92ZXJyaWRlIiwiZ2V0RWZmb3J0VmFsdWVEZXNjcmlwdGlvbiIsImlzRWZmb3J0TGV2ZWwiLCJ0b1BlcnNpc3RhYmxlRWZmb3J0IiwidXBkYXRlU2V0dGluZ3NGb3JTb3VyY2UiLCJDT01NT05fSEVMUF9BUkdTIiwiRWZmb3J0Q29tbWFuZFJlc3VsdCIsIm1lc3NhZ2UiLCJlZmZvcnRVcGRhdGUiLCJ2YWx1ZSIsInNldEVmZm9ydFZhbHVlIiwiZWZmb3J0VmFsdWUiLCJwZXJzaXN0YWJsZSIsInVuZGVmaW5lZCIsInJlc3VsdCIsImVmZm9ydExldmVsIiwiZXJyb3IiLCJlZmZvcnQiLCJlbnZPdmVycmlkZSIsImVudlJhdyIsInByb2Nlc3MiLCJlbnYiLCJDTEFVREVfQ09ERV9FRkZPUlRfTEVWRUwiLCJkZXNjcmlwdGlvbiIsInN1ZmZpeCIsInNob3dDdXJyZW50RWZmb3J0IiwiYXBwU3RhdGVFZmZvcnQiLCJtb2RlbCIsImVmZmVjdGl2ZVZhbHVlIiwibGV2ZWwiLCJ1bnNldEVmZm9ydExldmVsIiwiZXhlY3V0ZUVmZm9ydCIsImFyZ3MiLCJub3JtYWxpemVkIiwidG9Mb3dlckNhc2UiLCJTaG93Q3VycmVudEVmZm9ydCIsInQwIiwib25Eb25lIiwiX3RlbXAiLCJzIiwiQXBwbHlFZmZvcnRBbmRDbG9zZSIsIiQiLCJfYyIsInNldEFwcFN0YXRlIiwidDEiLCJ0MiIsInByZXYiLCJ1c2VFZmZlY3QiLCJjYWxsIiwiX2NvbnRleHQiLCJQcm9taXNlIiwiUmVhY3ROb2RlIiwidHJpbSIsImluY2x1ZGVzIl0sInNvdXJjZXMiOlsiZWZmb3J0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZU1haW5Mb29wTW9kZWwgfSBmcm9tICcuLi8uLi9ob29rcy91c2VNYWluTG9vcE1vZGVsLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnLi4vLi4vc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHsgdXNlQXBwU3RhdGUsIHVzZVNldEFwcFN0YXRlIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZE9uRG9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5pbXBvcnQge1xuICB0eXBlIEVmZm9ydFZhbHVlLFxuICBnZXREaXNwbGF5ZWRFZmZvcnRMZXZlbCxcbiAgZ2V0RWZmb3J0RW52T3ZlcnJpZGUsXG4gIGdldEVmZm9ydFZhbHVlRGVzY3JpcHRpb24sXG4gIGlzRWZmb3J0TGV2ZWwsXG4gIHRvUGVyc2lzdGFibGVFZmZvcnQsXG59IGZyb20gJy4uLy4uL3V0aWxzL2VmZm9ydC5qcydcbmltcG9ydCB7IHVwZGF0ZVNldHRpbmdzRm9yU291cmNlIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2V0dGluZ3Mvc2V0dGluZ3MuanMnXG5cbmNvbnN0IENPTU1PTl9IRUxQX0FSR1MgPSBbJ2hlbHAnLCAnLWgnLCAnLS1oZWxwJ11cblxudHlwZSBFZmZvcnRDb21tYW5kUmVzdWx0ID0ge1xuICBtZXNzYWdlOiBzdHJpbmdcbiAgZWZmb3J0VXBkYXRlPzogeyB2YWx1ZTogRWZmb3J0VmFsdWUgfCB1bmRlZmluZWQgfVxufVxuXG5mdW5jdGlvbiBzZXRFZmZvcnRWYWx1ZShlZmZvcnRWYWx1ZTogRWZmb3J0VmFsdWUpOiBFZmZvcnRDb21tYW5kUmVzdWx0IHtcbiAgY29uc3QgcGVyc2lzdGFibGUgPSB0b1BlcnNpc3RhYmxlRWZmb3J0KGVmZm9ydFZhbHVlKVxuICBpZiAocGVyc2lzdGFibGUgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHVwZGF0ZVNldHRpbmdzRm9yU291cmNlKCd1c2VyU2V0dGluZ3MnLCB7XG4gICAgICBlZmZvcnRMZXZlbDogcGVyc2lzdGFibGUsXG4gICAgfSlcbiAgICBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBgRmFpbGVkIHRvIHNldCBlZmZvcnQgbGV2ZWw6ICR7cmVzdWx0LmVycm9yLm1lc3NhZ2V9YCxcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbG9nRXZlbnQoJ3Rlbmd1X2VmZm9ydF9jb21tYW5kJywge1xuICAgIGVmZm9ydDpcbiAgICAgIGVmZm9ydFZhbHVlIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gIH0pXG5cbiAgLy8gRW52IHZhciB3aW5zIGF0IHJlc29sdmVBcHBsaWVkRWZmb3J0IHRpbWUuIE9ubHkgZmxhZyBpdCB3aGVuIGl0IGFjdHVhbGx5XG4gIC8vIGNvbmZsaWN0cyDigJQgaWYgZW52IG1hdGNoZXMgd2hhdCB0aGUgdXNlciBqdXN0IGFza2VkIGZvciwgdGhlIG91dGNvbWUgaXNcbiAgLy8gdGhlIHNhbWUsIHNvIFwiU2V0IGVmZm9ydCB0byBYXCIgaXMgdHJ1ZSBhbmQgdGhlIG5vdGUgaXMgbm9pc2UuXG4gIGNvbnN0IGVudk92ZXJyaWRlID0gZ2V0RWZmb3J0RW52T3ZlcnJpZGUoKVxuICBpZiAoZW52T3ZlcnJpZGUgIT09IHVuZGVmaW5lZCAmJiBlbnZPdmVycmlkZSAhPT0gZWZmb3J0VmFsdWUpIHtcbiAgICBjb25zdCBlbnZSYXcgPSBwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9FRkZPUlRfTEVWRUxcbiAgICBpZiAocGVyc2lzdGFibGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWVzc2FnZTogYE5vdCBhcHBsaWVkOiBDTEFVREVfQ09ERV9FRkZPUlRfTEVWRUw9JHtlbnZSYXd9IG92ZXJyaWRlcyBlZmZvcnQgdGhpcyBzZXNzaW9uLCBhbmQgJHtlZmZvcnRWYWx1ZX0gaXMgc2Vzc2lvbi1vbmx5IChub3RoaW5nIHNhdmVkKWAsXG4gICAgICAgIGVmZm9ydFVwZGF0ZTogeyB2YWx1ZTogZWZmb3J0VmFsdWUgfSxcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBDTEFVREVfQ09ERV9FRkZPUlRfTEVWRUw9JHtlbnZSYXd9IG92ZXJyaWRlcyB0aGlzIHNlc3Npb24g4oCUIGNsZWFyIGl0IGFuZCAke2VmZm9ydFZhbHVlfSB0YWtlcyBvdmVyYCxcbiAgICAgIGVmZm9ydFVwZGF0ZTogeyB2YWx1ZTogZWZmb3J0VmFsdWUgfSxcbiAgICB9XG4gIH1cblxuICBjb25zdCBkZXNjcmlwdGlvbiA9IGdldEVmZm9ydFZhbHVlRGVzY3JpcHRpb24oZWZmb3J0VmFsdWUpXG4gIGNvbnN0IHN1ZmZpeCA9IHBlcnNpc3RhYmxlICE9PSB1bmRlZmluZWQgPyAnJyA6ICcgKHRoaXMgc2Vzc2lvbiBvbmx5KSdcbiAgcmV0dXJuIHtcbiAgICBtZXNzYWdlOiBgU2V0IGVmZm9ydCBsZXZlbCB0byAke2VmZm9ydFZhbHVlfSR7c3VmZml4fTogJHtkZXNjcmlwdGlvbn1gLFxuICAgIGVmZm9ydFVwZGF0ZTogeyB2YWx1ZTogZWZmb3J0VmFsdWUgfSxcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0N1cnJlbnRFZmZvcnQoXG4gIGFwcFN0YXRlRWZmb3J0OiBFZmZvcnRWYWx1ZSB8IHVuZGVmaW5lZCxcbiAgbW9kZWw6IHN0cmluZyxcbik6IEVmZm9ydENvbW1hbmRSZXN1bHQge1xuICBjb25zdCBlbnZPdmVycmlkZSA9IGdldEVmZm9ydEVudk92ZXJyaWRlKClcbiAgY29uc3QgZWZmZWN0aXZlVmFsdWUgPVxuICAgIGVudk92ZXJyaWRlID09PSBudWxsID8gdW5kZWZpbmVkIDogKGVudk92ZXJyaWRlID8/IGFwcFN0YXRlRWZmb3J0KVxuICBpZiAoZWZmZWN0aXZlVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGxldmVsID0gZ2V0RGlzcGxheWVkRWZmb3J0TGV2ZWwobW9kZWwsIGFwcFN0YXRlRWZmb3J0KVxuICAgIHJldHVybiB7IG1lc3NhZ2U6IGBFZmZvcnQgbGV2ZWw6IGF1dG8gKGN1cnJlbnRseSAke2xldmVsfSlgIH1cbiAgfVxuICBjb25zdCBkZXNjcmlwdGlvbiA9IGdldEVmZm9ydFZhbHVlRGVzY3JpcHRpb24oZWZmZWN0aXZlVmFsdWUpXG4gIHJldHVybiB7XG4gICAgbWVzc2FnZTogYEN1cnJlbnQgZWZmb3J0IGxldmVsOiAke2VmZmVjdGl2ZVZhbHVlfSAoJHtkZXNjcmlwdGlvbn0pYCxcbiAgfVxufVxuXG5mdW5jdGlvbiB1bnNldEVmZm9ydExldmVsKCk6IEVmZm9ydENvbW1hbmRSZXN1bHQge1xuICBjb25zdCByZXN1bHQgPSB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSgndXNlclNldHRpbmdzJywge1xuICAgIGVmZm9ydExldmVsOiB1bmRlZmluZWQsXG4gIH0pXG4gIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWVzc2FnZTogYEZhaWxlZCB0byBzZXQgZWZmb3J0IGxldmVsOiAke3Jlc3VsdC5lcnJvci5tZXNzYWdlfWAsXG4gICAgfVxuICB9XG4gIGxvZ0V2ZW50KCd0ZW5ndV9lZmZvcnRfY29tbWFuZCcsIHtcbiAgICBlZmZvcnQ6XG4gICAgICAnYXV0bycgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgfSlcbiAgLy8gZW52PWF1dG8vdW5zZXQgKG51bGwpIG1hdGNoZXMgd2hhdCAvZWZmb3J0IGF1dG8gYXNrcyBmb3IsIHNvIG9ubHkgd2FyblxuICAvLyB3aGVuIGVudiBpcyBwaW5uaW5nIGEgc3BlY2lmaWMgbGV2ZWwgdGhhdCB3aWxsIGtlZXAgb3ZlcnJpZGluZy5cbiAgY29uc3QgZW52T3ZlcnJpZGUgPSBnZXRFZmZvcnRFbnZPdmVycmlkZSgpXG4gIGlmIChlbnZPdmVycmlkZSAhPT0gdW5kZWZpbmVkICYmIGVudk92ZXJyaWRlICE9PSBudWxsKSB7XG4gICAgY29uc3QgZW52UmF3ID0gcHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfRUZGT1JUX0xFVkVMXG4gICAgcmV0dXJuIHtcbiAgICAgIG1lc3NhZ2U6IGBDbGVhcmVkIGVmZm9ydCBmcm9tIHNldHRpbmdzLCBidXQgQ0xBVURFX0NPREVfRUZGT1JUX0xFVkVMPSR7ZW52UmF3fSBzdGlsbCBjb250cm9scyB0aGlzIHNlc3Npb25gLFxuICAgICAgZWZmb3J0VXBkYXRlOiB7IHZhbHVlOiB1bmRlZmluZWQgfSxcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBtZXNzYWdlOiAnRWZmb3J0IGxldmVsIHNldCB0byBhdXRvJyxcbiAgICBlZmZvcnRVcGRhdGU6IHsgdmFsdWU6IHVuZGVmaW5lZCB9LFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlRWZmb3J0KGFyZ3M6IHN0cmluZyk6IEVmZm9ydENvbW1hbmRSZXN1bHQge1xuICBjb25zdCBub3JtYWxpemVkID0gYXJncy50b0xvd2VyQ2FzZSgpXG4gIGlmIChub3JtYWxpemVkID09PSAnYXV0bycgfHwgbm9ybWFsaXplZCA9PT0gJ3Vuc2V0Jykge1xuICAgIHJldHVybiB1bnNldEVmZm9ydExldmVsKClcbiAgfVxuXG4gIGlmICghaXNFZmZvcnRMZXZlbChub3JtYWxpemVkKSkge1xuICAgIHJldHVybiB7XG4gICAgICBtZXNzYWdlOiBgSW52YWxpZCBhcmd1bWVudDogJHthcmdzfS4gVmFsaWQgb3B0aW9ucyBhcmU6IGxvdywgbWVkaXVtLCBoaWdoLCBtYXgsIGF1dG9gLFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzZXRFZmZvcnRWYWx1ZShub3JtYWxpemVkKVxufVxuXG5mdW5jdGlvbiBTaG93Q3VycmVudEVmZm9ydCh7XG4gIG9uRG9uZSxcbn06IHtcbiAgb25Eb25lOiAocmVzdWx0OiBzdHJpbmcpID0+IHZvaWRcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBlZmZvcnRWYWx1ZSA9IHVzZUFwcFN0YXRlKHMgPT4gcy5lZmZvcnRWYWx1ZSlcbiAgY29uc3QgbW9kZWwgPSB1c2VNYWluTG9vcE1vZGVsKClcbiAgY29uc3QgeyBtZXNzYWdlIH0gPSBzaG93Q3VycmVudEVmZm9ydChlZmZvcnRWYWx1ZSwgbW9kZWwpXG4gIG9uRG9uZShtZXNzYWdlKVxuICByZXR1cm4gbnVsbFxufVxuXG5mdW5jdGlvbiBBcHBseUVmZm9ydEFuZENsb3NlKHtcbiAgcmVzdWx0LFxuICBvbkRvbmUsXG59OiB7XG4gIHJlc3VsdDogRWZmb3J0Q29tbWFuZFJlc3VsdFxuICBvbkRvbmU6IChyZXN1bHQ6IHN0cmluZykgPT4gdm9pZFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHNldEFwcFN0YXRlID0gdXNlU2V0QXBwU3RhdGUoKVxuICBjb25zdCB7IGVmZm9ydFVwZGF0ZSwgbWVzc2FnZSB9ID0gcmVzdWx0XG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGVmZm9ydFVwZGF0ZSkge1xuICAgICAgc2V0QXBwU3RhdGUocHJldiA9PiAoe1xuICAgICAgICAuLi5wcmV2LFxuICAgICAgICBlZmZvcnRWYWx1ZTogZWZmb3J0VXBkYXRlLnZhbHVlLFxuICAgICAgfSkpXG4gICAgfVxuICAgIG9uRG9uZShtZXNzYWdlKVxuICB9LCBbc2V0QXBwU3RhdGUsIGVmZm9ydFVwZGF0ZSwgbWVzc2FnZSwgb25Eb25lXSlcbiAgcmV0dXJuIG51bGxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGwoXG4gIG9uRG9uZTogTG9jYWxKU1hDb21tYW5kT25Eb25lLFxuICBfY29udGV4dDogdW5rbm93bixcbiAgYXJncz86IHN0cmluZyxcbik6IFByb21pc2U8UmVhY3QuUmVhY3ROb2RlPiB7XG4gIGFyZ3MgPSBhcmdzPy50cmltKCkgfHwgJydcblxuICBpZiAoQ09NTU9OX0hFTFBfQVJHUy5pbmNsdWRlcyhhcmdzKSkge1xuICAgIG9uRG9uZShcbiAgICAgICdVc2FnZTogL2VmZm9ydCBbbG93fG1lZGl1bXxoaWdofG1heHxhdXRvXVxcblxcbkVmZm9ydCBsZXZlbHM6XFxuLSBsb3c6IFF1aWNrLCBzdHJhaWdodGZvcndhcmQgaW1wbGVtZW50YXRpb25cXG4tIG1lZGl1bTogQmFsYW5jZWQgYXBwcm9hY2ggd2l0aCBzdGFuZGFyZCB0ZXN0aW5nXFxuLSBoaWdoOiBDb21wcmVoZW5zaXZlIGltcGxlbWVudGF0aW9uIHdpdGggZXh0ZW5zaXZlIHRlc3RpbmdcXG4tIG1heDogTWF4aW11bSBjYXBhYmlsaXR5IHdpdGggZGVlcGVzdCByZWFzb25pbmcgKE9wdXMgNC42IG9ubHkpXFxuLSBhdXRvOiBVc2UgdGhlIGRlZmF1bHQgZWZmb3J0IGxldmVsIGZvciB5b3VyIG1vZGVsJyxcbiAgICApXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAoIWFyZ3MgfHwgYXJncyA9PT0gJ2N1cnJlbnQnIHx8IGFyZ3MgPT09ICdzdGF0dXMnKSB7XG4gICAgcmV0dXJuIDxTaG93Q3VycmVudEVmZm9ydCBvbkRvbmU9e29uRG9uZX0gLz5cbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGV4ZWN1dGVFZmZvcnQoYXJncylcbiAgcmV0dXJuIDxBcHBseUVmZm9ydEFuZENsb3NlIHJlc3VsdD17cmVzdWx0fSBvbkRvbmU9e29uRG9uZX0gLz5cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsZ0JBQWdCLFFBQVEsaUNBQWlDO0FBQ2xFLFNBQ0UsS0FBS0MsMERBQTBELEVBQy9EQyxRQUFRLFFBQ0gsbUNBQW1DO0FBQzFDLFNBQVNDLFdBQVcs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