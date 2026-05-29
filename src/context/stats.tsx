// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、createContext、useCallback、useContext、useEffect、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
// 复用 saveCurrentProjectConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { saveCurrentProjectConfig } from '../utils/config.js';
// StatsStore 固化stats里传递的数据形状，帮助调用方按同一结构读写字段。
export type StatsStore = {
  increment(name: string, value?: number): void;
  set(name: string, value: number): void;
  observe(name: string, value: number): void;
  add(name: string, value: string): void;
  // getAll不依赖额外参数，直接计算stats需要的结果。
  getAll(): Record<string, number>;
};
// percentile 封装stats的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function percentile(sorted: number[], p: number): number {
  // index 索引 命名 `p / 100 * (sorted.length - 1)`，让后续代码直接表达这个值的用途。
  const index = p / 100 * (sorted.length - 1);
  // lower保存`Math.floor`，供stats后续处理使用。
  const lower = Math.floor(index);
  // upper保存`Math.ceil`，供stats后续处理使用。
  const upper = Math.ceil(index);
  // 满足 `lower === upper` 时，stats执行该分支。
  if (lower === upper) {
    // 返回 `sorted[lower]!`，作为stats这次计算的结果。
    return sorted[lower]!;
  }
  // 返回 `sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (index - lower)`，作为stats这次计算的结果。
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (index - lower);
}
// RESERVOIR_SIZE保存`1024`，供后续判断或组装使用。
const RESERVOIR_SIZE = 1024;
// Histogram 固化stats里传递的数据形状，帮助调用方按同一结构读写字段。
type Histogram = {
  reservoir: number[];
  count: number;
  sum: number;
  min: number;
  max: number;
};
// createStatsStore 封装stats的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createStatsStore(): StatsStore {
  // metrics 集合构建`new Map<string, number>()` 整理出中间结果，供stats后续步骤使用。
  const metrics = new Map<string, number>();
  // histograms 集合 命名 `new Map<string, Histogram>()`，让后续代码直接表达这个值的用途。
  const histograms = new Map<string, Histogram>();
  // sets 集合构建`new Map<string, Set<string>>()`，供后续判断或组装使用。
  const sets = new Map<string, Set<string>>();
  // 返回结构化结果，集中表达stats已经整理出的状态。
  return {
    // increment 使用 name: string, value = 1 完成stats里的对应操作。
    increment(name: string, value = 1) {
      // metrics.set 写入新的状态值，使stats后续读取保持一致。
      metrics.set(name, (metrics.get(name) ?? 0) + value);
    },
    // set 根据 name: string, value: number 更新stats的状态。
    set(name: string, value: number) {
      // metrics.set 写入新的状态值，使stats后续读取保持一致。
      metrics.set(name, value);
    },
    // observe 使用 name: string, value: number 完成stats里的对应操作。
    observe(name: string, value: number) {
      // h读取`histograms.get`，供stats后续处理使用。
      let h = histograms.get(name);
      // h缺失时提前走兜底路径，避免stats继续依赖无效输入。
      if (!h) {
        // h更新为 `{`，确保stats后续读取最新状态。
        h = {
          reservoir: [],
          count: 0,
          sum: 0,
          min: value,
          max: value
        };
        // histograms.set 写入新的状态值，使stats后续读取保持一致。
        histograms.set(name, h);
      }
      // stats在这里处理 `h.count++`，完成这一小步状态转换。
      h.count++;
      // stats在这里处理 `h.sum += value`，完成这一小步状态转换。
      h.sum += value;
      // 满足 `value < h.min` 时，stats执行该分支。
      if (value < h.min) {
        // min更新为 `value`，确保stats后续读取最新状态。
        h.min = value;
      }
      // 满足 `value > h.max` 时，stats执行该分支。
      if (value > h.max) {
        // max更新为 `value`，确保stats后续读取最新状态。
        h.max = value;
      }
      // Reservoir sampling (Algorithm R)
      // 满足 `h.reservoir.length < RESERVOIR_SIZE` 时，stats执行该分支。
      if (h.reservoir.length < RESERVOIR_SIZE) {
        // reservoir追加新条目，保持收集顺序与输入顺序一致。
        h.reservoir.push(value);
      } else {
        // j保存`Math.floor`，供stats后续处理使用。
        const j = Math.floor(Math.random() * h.count);
        // 满足 `j < RESERVOIR_SIZE` 时，stats执行该分支。
        if (j < RESERVOIR_SIZE) {
          // reservoir[j更新为 `value`，确保stats后续读取最新状态。
          h.reservoir[j] = value;
        }
      }
    },
    // add 使用 name: string, value: string 完成stats里的对应操作。
    add(name: string, value: string) {
      // s 集合读取`sets.get`，供stats后续处理使用。
      let s = sets.get(name);
      // s 集合缺失时提前走兜底路径，避免stats继续依赖无效输入。
      if (!s) {
        // s 集合更新为 `new Set()`，确保stats后续读取最新状态。
        s = new Set();
        // sets.set 写入新的状态值，使stats后续读取保持一致。
        sets.set(name, s);
      }
      // 调用 s.add，触发stats此处需要的副作用。
      s.add(value);
    },
    // getAll不依赖额外参数，直接计算stats需要的结果。
    getAll() {
      // 结果 命名 `Object.fromEntries(metrics)`，让后续代码直接表达这个值的用途。
      const result: Record<string, number> = Object.fromEntries(metrics);
      // 循环处理 `const [name, h] of histograms`，让stats逐项把同类条目按顺序走完。
      for (const [name, h] of histograms) {
        // 满足 `h.count === 0` 时，stats执行该分支。
        if (h.count === 0) {
          // 跳过当前项，继续处理stats中的下一轮循环。
          continue;
        }
        // result[`${name}_count` 数量更新为 `h.count`，确保stats后续读取最新状态。
        result[`${name}_count`] = h.count;
        // result[`${name}_min`更新为 `h.min`，确保stats后续读取最新状态。
        result[`${name}_min`] = h.min;
        // result[`${name}_max`更新为 `h.max`，确保stats后续读取最新状态。
        result[`${name}_max`] = h.max;
        // result[`${name}_avg`更新为 `h.sum / h.count`，确保stats后续读取最新状态。
        result[`${name}_avg`] = h.sum / h.count;
        // sorted保存`sort`，供stats后续处理使用。
        const sorted = [...h.reservoir].sort((a, b) => a - b);
        // result[`${name}_p50`更新为 `percentile(sorted, 50)`，确保stats后续读取最新状态。
        result[`${name}_p50`] = percentile(sorted, 50);
        // result[`${name}_p95`更新为 `percentile(sorted, 95)`，确保stats后续读取最新状态。
        result[`${name}_p95`] = percentile(sorted, 95);
        // result[`${name}_p99`更新为 `percentile(sorted, 99)`，确保stats后续读取最新状态。
        result[`${name}_p99`] = percentile(sorted, 99);
      }
      // 循环处理 `const [name, s] of sets`，让stats逐项把同类条目按顺序走完。
      for (const [name, s] of sets) {
        // result[name更新为 `s.size`，确保stats后续读取最新状态。
        result[name] = s.size;
      }
      // 返回 `result`，作为stats这次计算的结果。
      return result;
    }
  };
}
// StatsContext构建`createContext<StatsStore | null>(null)`，供后续判断或组装使用。
export const StatsContext = createContext<StatsStore | null>(null);
// Props 固化stats里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  store?: StatsStore;
  children: React.ReactNode;
};
// StatsProvider 封装stats的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function StatsProvider(t0) {
  // $保存`_c`，供stats后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    store: externalStore,
    children
  } = t0;
  // t1 暂存 `createStatsStore()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `createStatsStore()` 生成的渲染片段，后续返回路径直接复用。
    t1 = createStatsStore();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // internalStore 命名 `t1`，让后续代码直接表达这个值的用途。
  const internalStore = t1;
  // store 命名 `externalStore ?? internalStore`，让后续代码直接表达这个值的用途。
  const store = externalStore ?? internalStore;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== store) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // flush封装成回调，供stats在事件触发或异步步骤中调用。
      const flush = () => {
        // metrics 集合读取`store.getAll`，供stats后续处理使用。
        const metrics = store.getAll();
        // 满足 `Object.keys(metrics).length > 0` 时，stats执行该分支。
        if (Object.keys(metrics).length > 0) {
          // 调用 saveCurrentProjectConfig，触发stats此处需要的副作用。
          saveCurrentProjectConfig(current => ({
            ...current,
            lastSessionMetrics: metrics
          }));
        }
      };
      // 调用 process.on，触发stats此处需要的副作用。
      process.on("exit", flush);
      // 返回 `() => {`，作为stats这次计算的结果。
      return () => {
        // 调用 process.off，触发stats此处需要的副作用。
        process.off("exit", flush);
      };
    };
    // t3 暂存 `[store]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [store];
    // $[1] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = store;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 调用 useEffect，触发stats此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `<StatsContext.Provider value={store}>{children}</StatsCon...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== children || $[5] !== store) {
    // t4 暂存 `<StatsContext.Provider value={store}>{children}</StatsCon...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <StatsContext.Provider value={store}>{children}</StatsContext.Provider>;
    // $[4] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = children;
    // $[5] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = store;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // 返回 `t4`，作为stats这次计算的结果。
  return t4;
}
// useStats 封装stats的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useStats() {
  // store保存`useContext`，供stats后续处理使用。
  const store = useContext(StatsContext);
  // store缺失时提前走兜底路径，避免stats继续依赖无效输入。
  if (!store) {
    // 抛出 new Error("useStats must be used within a StatsProvider");，阻止stats在无效状态下继续运行。
    throw new Error("useStats must be used within a StatsProvider");
  }
  // 返回 `store`，作为stats这次计算的结果。
  return store;
}
// useCounter 封装stats的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useCounter(name) {
  // $保存`_c`，供stats后续处理使用。
  const $ = _c(3);
  // store保存`useStats`，供stats后续处理使用。
  const store = useStats();
  // t0 暂存 `value => store.increment(name, value)` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== name || $[1] !== store) {
    // t0 暂存 `value => store.increment(name, value)` 生成的渲染片段，后续返回路径直接复用。
    t0 = value => store.increment(name, value);
    // $[0] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = name;
    // $[1] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = store;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // 返回 `t0`，作为stats这次计算的结果。
  return t0;
}
// useGauge 封装stats的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useGauge(name) {
  // $保存`_c`，供stats后续处理使用。
  const $ = _c(3);
  // store保存`useStats`，供stats后续处理使用。
  const store = useStats();
  // t0 暂存 `value => store.set(name, value)` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== name || $[1] !== store) {
    // t0 暂存 `value => store.set(name, value)` 生成的渲染片段，后续返回路径直接复用。
    t0 = value => store.set(name, value);
    // $[0] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = name;
    // $[1] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = store;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // 返回 `t0`，作为stats这次计算的结果。
  return t0;
}
// useTimer 封装stats的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTimer(name) {
  // $保存`_c`，供stats后续处理使用。
  const $ = _c(3);
  // store保存`useStats`，供stats后续处理使用。
  const store = useStats();
  // t0 暂存 `value => store.observe(name, value)` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== name || $[1] !== store) {
    // t0 暂存 `value => store.observe(name, value)` 生成的渲染片段，后续返回路径直接复用。
    t0 = value => store.observe(name, value);
    // $[0] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = name;
    // $[1] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = store;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // 返回 `t0`，作为stats这次计算的结果。
  return t0;
}
// useSet 封装stats的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSet(name) {
  // $保存`_c`，供stats后续处理使用。
  const $ = _c(3);
  // store保存`useStats`，供stats后续处理使用。
  const store = useStats();
  // t0 暂存 `value => store.add(name, value)` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== name || $[1] !== store) {
    // t0 暂存 `value => store.add(name, value)` 生成的渲染片段，后续返回路径直接复用。
    t0 = value => store.add(name, value);
    // $[0] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = name;
    // $[1] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = store;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // 返回 `t0`，作为stats这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJ1c2VDYWxsYmFjayIsInVzZUNvbnRleHQiLCJ1c2VFZmZlY3QiLCJ1c2VNZW1vIiwic2F2ZUN1cnJlbnRQcm9qZWN0Q29uZmlnIiwiU3RhdHNTdG9yZSIsImluY3JlbWVudCIsIm5hbWUiLCJ2YWx1ZSIsInNldCIsIm9ic2VydmUiLCJhZGQiLCJnZXRBbGwiLCJSZWNvcmQiLCJwZXJjZW50aWxlIiwic29ydGVkIiwicCIsImluZGV4IiwibGVuZ3RoIiwibG93ZXIiLCJNYXRoIiwiZmxvb3IiLCJ1cHBlciIsImNlaWwiLCJSRVNFUlZPSVJfU0laRSIsIkhpc3RvZ3JhbSIsInJlc2Vydm9pciIsImNvdW50Iiwic3VtIiwibWluIiwibWF4IiwiY3JlYXRlU3RhdHNTdG9yZSIsIm1ldHJpY3MiLCJNYXAiLCJoaXN0b2dyYW1zIiwic2V0cyIsIlNldCIsImdldCIsImgiLCJwdXNoIiwiaiIsInJhbmRvbSIsInMiLCJyZXN1bHQiLCJPYmplY3QiLCJmcm9tRW50cmllcyIsInNvcnQiLCJhIiwiYiIsInNpemUiLCJTdGF0c0NvbnRleHQiLCJQcm9wcyIsInN0b3JlIiwiY2hpbGRyZW4iLCJSZWFjdE5vZGUiLCJTdGF0c1Byb3ZpZGVyIiwidDAiLCIkIiwiX2MiLCJleHRlcm5hbFN0b3JlIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJpbnRlcm5hbFN0b3JlIiwidDIiLCJ0MyIsImZsdXNoIiwia2V5cyIsImN1cnJlbnQiLCJsYXN0U2Vzc2lvbk1ldHJpY3MiLCJwcm9jZXNzIiwib24iLCJvZmYiLCJ0NCIsInVzZVN0YXRzIiwiRXJyb3IiLCJ1c2VDb3VudGVyIiwidXNlR2F1Z2UiLCJ1c2VUaW1lciIsInVzZVNldCJdLCJzb3VyY2VzIjpbInN0YXRzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHtcbiAgY3JlYXRlQ29udGV4dCxcbiAgdXNlQ2FsbGJhY2ssXG4gIHVzZUNvbnRleHQsXG4gIHVzZUVmZmVjdCxcbiAgdXNlTWVtbyxcbn0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBzYXZlQ3VycmVudFByb2plY3RDb25maWcgfSBmcm9tICcuLi91dGlscy9jb25maWcuanMnXG5cbmV4cG9ydCB0eXBlIFN0YXRzU3RvcmUgPSB7XG4gIGluY3JlbWVudChuYW1lOiBzdHJpbmcsIHZhbHVlPzogbnVtYmVyKTogdm9pZFxuICBzZXQobmFtZTogc3RyaW5nLCB2YWx1ZTogbnVtYmVyKTogdm9pZFxuICBvYnNlcnZlKG5hbWU6IHN0cmluZywgdmFsdWU6IG51bWJlcik6IHZvaWRcbiAgYWRkKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWRcbiAgZ2V0QWxsKCk6IFJlY29yZDxzdHJpbmcsIG51bWJlcj5cbn1cblxuZnVuY3Rpb24gcGVyY2VudGlsZShzb3J0ZWQ6IG51bWJlcltdLCBwOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBpbmRleCA9IChwIC8gMTAwKSAqIChzb3J0ZWQubGVuZ3RoIC0gMSlcbiAgY29uc3QgbG93ZXIgPSBNYXRoLmZsb29yKGluZGV4KVxuICBjb25zdCB1cHBlciA9IE1hdGguY2VpbChpbmRleClcbiAgaWYgKGxvd2VyID09PSB1cHBlcikge1xuICAgIHJldHVybiBzb3J0ZWRbbG93ZXJdIVxuICB9XG4gIHJldHVybiBzb3J0ZWRbbG93ZXJdISArIChzb3J0ZWRbdXBwZXJdISAtIHNvcnRlZFtsb3dlcl0hKSAqIChpbmRleCAtIGxvd2VyKVxufVxuXG5jb25zdCBSRVNFUlZPSVJfU0laRSA9IDEwMjRcblxudHlwZSBIaXN0b2dyYW0gPSB7XG4gIHJlc2Vydm9pcjogbnVtYmVyW11cbiAgY291bnQ6IG51bWJlclxuICBzdW06IG51bWJlclxuICBtaW46IG51bWJlclxuICBtYXg6IG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3RhdHNTdG9yZSgpOiBTdGF0c1N0b3JlIHtcbiAgY29uc3QgbWV0cmljcyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KClcbiAgY29uc3QgaGlzdG9ncmFtcyA9IG5ldyBNYXA8c3RyaW5nLCBIaXN0b2dyYW0+KClcbiAgY29uc3Qgc2V0cyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4oKVxuXG4gIHJldHVybiB7XG4gICAgaW5jcmVtZW50KG5hbWU6IHN0cmluZywgdmFsdWUgPSAxKSB7XG4gICAgICBtZXRyaWNzLnNldChuYW1lLCAobWV0cmljcy5nZXQobmFtZSkgPz8gMCkgKyB2YWx1ZSlcbiAgICB9LFxuICAgIHNldChuYW1lOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIpIHtcbiAgICAgIG1ldHJpY3Muc2V0KG5hbWUsIHZhbHVlKVxuICAgIH0sXG4gICAgb2JzZXJ2ZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIpIHtcbiAgICAgIGxldCBoID0gaGlzdG9ncmFtcy5nZXQobmFtZSlcbiAgICAgIGlmICghaCkge1xuICAgICAgICBoID0geyByZXNlcnZvaXI6IFtdLCBjb3VudDogMCwgc3VtOiAwLCBtaW46IHZhbHVlLCBtYXg6IHZhbHVlIH1cbiAgICAgICAgaGlzdG9ncmFtcy5zZXQobmFtZSwgaClcbiAgICAgIH1cbiAgICAgIGguY291bnQrK1xuICAgICAgaC5zdW0gKz0gdmFsdWVcbiAgICAgIGlmICh2YWx1ZSA8IGgubWluKSB7XG4gICAgICAgIGgubWluID0gdmFsdWVcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZSA+IGgubWF4KSB7XG4gICAgICAgIGgubWF4ID0gdmFsdWVcbiAgICAgIH1cbiAgICAgIC8vIFJlc2Vydm9pciBzYW1wbGluZyAoQWxnb3JpdGhtIFIpXG4gICAgICBpZiAoaC5yZXNlcnZvaXIubGVuZ3RoIDwgUkVTRVJWT0lSX1NJWkUpIHtcbiAgICAgICAgaC5yZXNlcnZvaXIucHVzaCh2YWx1ZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBoLmNvdW50KVxuICAgICAgICBpZiAoaiA8IFJFU0VSVk9JUl9TSVpFKSB7XG4gICAgICAgICAgaC5yZXNlcnZvaXJbal0gPSB2YWx1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBhZGQobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgICBsZXQgcyA9IHNldHMuZ2V0KG5hbWUpXG4gICAgICBpZiAoIXMpIHtcbiAgICAgICAgcyA9IG5ldyBTZXQoKVxuICAgICAgICBzZXRzLnNldChuYW1lLCBzKVxuICAgICAgfVxuICAgICAgcy5hZGQodmFsdWUpXG4gICAgfSxcbiAgICBnZXRBbGwoKSB7XG4gICAgICBjb25zdCByZXN1bHQ6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSBPYmplY3QuZnJvbUVudHJpZXMobWV0cmljcylcblxuICAgICAgZm9yIChjb25zdCBbbmFtZSwgaF0gb2YgaGlzdG9ncmFtcykge1xuICAgICAgICBpZiAoaC5jb3VudCA9PT0gMCkge1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W2Ake25hbWV9X2NvdW50YF0gPSBoLmNvdW50XG4gICAgICAgIHJlc3VsdFtgJHtuYW1lfV9taW5gXSA9IGgubWluXG4gICAgICAgIHJlc3VsdFtgJHtuYW1lfV9tYXhgXSA9IGgubWF4XG4gICAgICAgIHJlc3VsdFtgJHtuYW1lfV9hdmdgXSA9IGguc3VtIC8gaC5jb3VudFxuICAgICAgICBjb25zdCBzb3J0ZWQgPSBbLi4uaC5yZXNlcnZvaXJdLnNvcnQoKGEsIGIpID0+IGEgLSBiKVxuICAgICAgICByZXN1bHRbYCR7bmFtZX1fcDUwYF0gPSBwZXJjZW50aWxlKHNvcnRlZCwgNTApXG4gICAgICAgIHJlc3VsdFtgJHtuYW1lfV9wOTVgXSA9IHBlcmNlbnRpbGUoc29ydGVkLCA5NSlcbiAgICAgICAgcmVzdWx0W2Ake25hbWV9X3A5OWBdID0gcGVyY2VudGlsZShzb3J0ZWQsIDk5KVxuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IFtuYW1lLCBzXSBvZiBzZXRzKSB7XG4gICAgICAgIHJlc3VsdFtuYW1lXSA9IHMuc2l6ZVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSxcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgU3RhdHNDb250ZXh0ID0gY3JlYXRlQ29udGV4dDxTdGF0c1N0b3JlIHwgbnVsbD4obnVsbClcblxudHlwZSBQcm9wcyA9IHtcbiAgc3RvcmU/OiBTdGF0c1N0b3JlXG4gIGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFN0YXRzUHJvdmlkZXIoe1xuICBzdG9yZTogZXh0ZXJuYWxTdG9yZSxcbiAgY2hpbGRyZW4sXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGludGVybmFsU3RvcmUgPSB1c2VNZW1vKCgpID0+IGNyZWF0ZVN0YXRzU3RvcmUoKSwgW10pXG4gIGNvbnN0IHN0b3JlID0gZXh0ZXJuYWxTdG9yZSA/PyBpbnRlcm5hbFN0b3JlXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBmbHVzaCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IG1ldHJpY3MgPSBzdG9yZS5nZXRBbGwoKVxuICAgICAgaWYgKE9iamVjdC5rZXlzKG1ldHJpY3MpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2F2ZUN1cnJlbnRQcm9qZWN0Q29uZmlnKGN1cnJlbnQgPT4gKHtcbiAgICAgICAgICAuLi5jdXJyZW50LFxuICAgICAgICAgIGxhc3RTZXNzaW9uTWV0cmljczogbWV0cmljcyxcbiAgICAgICAgfSkpXG4gICAgICB9XG4gICAgfVxuICAgIHByb2Nlc3Mub24oJ2V4aXQnLCBmbHVzaClcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgcHJvY2Vzcy5vZmYoJ2V4aXQnLCBmbHVzaClcbiAgICB9XG4gIH0sIFtzdG9yZV0pXG5cbiAgcmV0dXJuIDxTdGF0c0NvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3N0b3JlfT57Y2hpbGRyZW59PC9TdGF0c0NvbnRleHQuUHJvdmlkZXI+XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VTdGF0cygpOiBTdGF0c1N0b3JlIHtcbiAgY29uc3Qgc3RvcmUgPSB1c2VDb250ZXh0KFN0YXRzQ29udGV4dClcbiAgaWYgKCFzdG9yZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigndXNlU3RhdHMgbXVzdCBiZSB1c2VkIHdpdGhpbiBhIFN0YXRzUHJvdmlkZXInKVxuICB9XG4gIHJldHVybiBzdG9yZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlQ291bnRlcihuYW1lOiBzdHJpbmcpOiAodmFsdWU/OiBudW1iZXIpID0+IHZvaWQge1xuICBjb25zdCBzdG9yZSA9IHVzZVN0YXRzKClcbiAgcmV0dXJuIHVzZUNhbGxiYWNrKFxuICAgICh2YWx1ZT86IG51bWJlcikgPT4gc3RvcmUuaW5jcmVtZW50KG5hbWUsIHZhbHVlKSxcbiAgICBbc3RvcmUsIG5hbWVdLFxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VHYXVnZShuYW1lOiBzdHJpbmcpOiAodmFsdWU6IG51bWJlcikgPT4gdm9pZCB7XG4gIGNvbnN0IHN0b3JlID0gdXNlU3RhdHMoKVxuICByZXR1cm4gdXNlQ2FsbGJhY2soKHZhbHVlOiBudW1iZXIpID0+IHN0b3JlLnNldChuYW1lLCB2YWx1ZSksIFtzdG9yZSwgbmFtZV0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VUaW1lcihuYW1lOiBzdHJpbmcpOiAodmFsdWU6IG51bWJlcikgPT4gdm9pZCB7XG4gIGNvbnN0IHN0b3JlID0gdXNlU3RhdHMoKVxuICByZXR1cm4gdXNlQ2FsbGJhY2soXG4gICAgKHZhbHVlOiBudW1iZXIpID0+IHN0b3JlLm9ic2VydmUobmFtZSwgdmFsdWUpLFxuICAgIFtzdG9yZSwgbmFtZV0sXG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVzZVNldChuYW1lOiBzdHJpbmcpOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCB7XG4gIGNvbnN0IHN0b3JlID0gdXNlU3RhdHMoKVxuICByZXR1cm4gdXNlQ2FsbGJhY2soKHZhbHVlOiBz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