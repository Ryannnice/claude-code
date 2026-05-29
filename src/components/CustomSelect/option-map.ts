// 类型依赖 { ReactNode } 来自 react，用于校准终端渲染的数据契约。
import type { ReactNode } from 'react'
// 类型依赖 { OptionWithDescription } 来自 ./select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from './select.js'

// OptionMapItem 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type OptionMapItem<T> = {
  label: ReactNode
  value: T
  description?: string
  previous: OptionMapItem<T> | undefined
  next: OptionMapItem<T> | undefined
  index: number
}

// 终端 UI 组件 option map在这里处理 `export default class OptionMap<T> extends Map<T, OptionMapItem<T>> {`，完成这一小步状态转换。
export default class OptionMap<T> extends Map<T, OptionMapItem<T>> {
  readonly first: OptionMapItem<T> | undefined
  readonly last: OptionMapItem<T> | undefined

  // 构造函数接收 options: OptionWithDescription<T>[]，把外部输入整理成实例可复用的内部状态。
  constructor(options: OptionWithDescription<T>[]) {
    // items 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const items: Array<[T, OptionMapItem<T>]> = []
    // firstItem 先占位，稍后的条件分支会根据实际输入补齐它。
    let firstItem: OptionMapItem<T> | undefined
    // lastItem 先占位，稍后的条件分支会根据实际输入补齐它。
    let lastItem: OptionMapItem<T> | undefined
    // previous 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let previous: OptionMapItem<T> | undefined
    // index 索引保存`0`，供后续判断或组装使用。
    let index = 0

    // 按顺序遍历 `options` 中的option，逐个交给终端渲染处理。
    for (const option of options) {
      // item集中保存终端 UI option map要一起传递的字段。
      const item = {
        label: option.label,
        value: option.value,
        description: option.description,
        previous,
        next: undefined,
        index,
      }

      // 满足 `previous` 时，终端渲染执行该分支。
      if (previous) {
        // next更新为 `item`，确保终端 UI后续读取最新状态。
        previous.next = item
      }

      // 终端 UI 组件 option map在这里处理 `firstItem ||= item`，完成这一小步状态转换。
      firstItem ||= item
      // lastItem更新为 `item`，确保终端 UI后续读取最新状态。
      lastItem = item

      // items 集合追加新条目，保持收集顺序与输入顺序一致。
      items.push([option.value, item])
      // 终端 UI 组件 option map在这里处理 `index++`，完成这一小步状态转换。
      index++
      // previous 集合更新为 `item`，确保终端 UI后续读取最新状态。
      previous = item
    }

    // 调用 super，触发终端渲染此处需要的副作用。
    super(items)
    // 更新实例字段 first 为 firstItem，同步终端渲染的内部状态。
    this.first = firstItem
    // 更新实例字段 last 为 lastItem，同步终端渲染的内部状态。
    this.last = lastItem
  }
}
