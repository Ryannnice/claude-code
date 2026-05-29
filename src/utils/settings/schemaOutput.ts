// 引入 toJSONSchema，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { toJSONSchema } from 'zod/v4'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 引入 SettingsSchema，将 ./types.js 中已经封装好的能力接到本文件流程里。
import { SettingsSchema } from './types.js'

// generateSettingsJSONSchema 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateSettingsJSONSchema(): string {
  // jsonSchema保存`toJSONSchema`，供共享工具后续处理使用。
  const jsonSchema = toJSONSchema(SettingsSchema(), { unrepresentable: 'any' })
  // 返回 `jsonStringify(jsonSchema, null, 2)`，作为共享工具这次计算的结果。
  return jsonStringify(jsonSchema, null, 2)
}
