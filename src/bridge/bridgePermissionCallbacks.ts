// 类型依赖 { PermissionUpdate } 来自 ../utils/permissions/PermissionUpdateSchema.js，用于校准远程桥接会话的数据契约。
import type { PermissionUpdate } from '../utils/permissions/PermissionUpdateSchema.js'

// BridgePermissionResponse 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type BridgePermissionResponse = {
  behavior: 'allow' | 'deny'
  updatedInput?: Record<string, unknown>
  updatedPermissions?: PermissionUpdate[]
  message?: string
}

// BridgePermissionCallbacks 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type BridgePermissionCallbacks = {
  sendRequest(
    requestId: string,
    toolName: string,
    input: Record<string, unknown>,
    toolUseId: string,
    description: string,
    permissionSuggestions?: PermissionUpdate[],
    blockedPath?: string,
  ): void
  // sendResponse 使用 requestId: string, response: BridgePermissionResp… 完成远程桥接会话里的对应操作。
  sendResponse(requestId: string, response: BridgePermissionResponse): void
  /** Cancel a pending control_request so the web app can dismiss its prompt. */
  // cancelRequest 使用 requestId: string 完成远程桥接会话里的对应操作。
  cancelRequest(requestId: string): void
  // 调用 onResponse，触发远程桥接会话此处需要的副作用。
  onResponse(
    requestId: string,
    // 这个回调绑定到 handler: (response: BridgePermissionResponse) => void,，负责远程桥接会话在该局部场景下的响应。
    handler: (response: BridgePermissionResponse) => void,
  ): () => void // returns unsubscribe
}

/** Type predicate for validating a parsed control_response payload
 *  as a BridgePermissionResponse. Checks the required `behavior`
 *  discriminant rather than using an unsafe `as` cast. */
// isBridgePermissionResponse 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBridgePermissionResponse(
  value: unknown,
): value is BridgePermissionResponse {
  // `!value || typeof value` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!value || typeof value !== 'object') return false
  // 返回 `(`，作为远程桥接会话这次计算的结果。
  return (
    'behavior' in value &&
    (value.behavior === 'allow' || value.behavior === 'deny')
  )
}

// 重新导出这一组成员，让远程桥接会话的公共 API 保持集中入口。
export { isBridgePermissionResponse }
// 导出类型定义，让其他模块沿用远程桥接 bridge Permission Callbacks的数据契约。
export type { BridgePermissionCallbacks, BridgePermissionResponse }
