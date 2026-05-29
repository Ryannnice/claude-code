// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
export * from './SelectMulti.js'
// 导出类型定义，让其他模块沿用终端 UI 组件 index的数据契约。
export type { OptionWithDescription } from './select.js'
// 终端 UI 组件 index在这里处理 `export * from './select.js'`，完成这一小步状态转换。
export * from './select.js'
