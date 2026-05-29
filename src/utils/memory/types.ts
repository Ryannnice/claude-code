// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'

// MEMORY_TYPE_VALUES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const MEMORY_TYPE_VALUES = [
  'User',
  'Project',
  'Local',
  'Managed',
  'AutoMem',
  ...(feature('TEAMMEM') ? (['TeamMem'] as const) : []),
] as const

// MemoryType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type MemoryType = (typeof MEMORY_TYPE_VALUES)[number]
