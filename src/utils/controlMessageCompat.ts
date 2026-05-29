/**
 * Normalize camelCase `requestId` → snake_case `request_id` on incoming
 * control messages (control_request, control_response).
 *
 * Older iOS app builds send `requestId` due to a missing Swift CodingKeys
 * mapping. Without this shim, `isSDKControlRequest` in replBridge.ts rejects
 * the message (it checks `'request_id' in value`), and structuredIO.ts reads
 * `message.response.request_id` as undefined — both silently drop the message.
 *
 * If both `request_id` and `requestId` are present, snake_case wins.
 * Mutates the object in place.
 */
// normalizeControlMessageKeys 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeControlMessageKeys(obj: unknown): unknown {
  // `obj === null || typeof obj` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (obj === null || typeof obj !== 'object') return obj
  // record保存`obj as Record<string, unknown>`，供后续判断或组装使用。
  const record = obj as Record<string, unknown>
  // 只有 `'requestId' in record && !('request_id' in record)` 满足时，共享工具才执行该分支。
  if ('requestId' in record && !('request_id' in record)) {
    // request_id 请求数据更新为 `record.requestId`，确保共享工具后续读取最新状态。
    record.request_id = record.requestId
    // 共享工具 control Message Compat在这里处理 `delete record.requestId`，完成这一小步状态转换。
    delete record.requestId
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    'response' in record &&
    record.response !== null &&
    typeof record.response === 'object'
  ) {
    // 接口响应保存`record.response as Record<string, unknown>`，供共享工具 control Message Compat后续判断或输出使用。
    const response = record.response as Record<string, unknown>
    // 只有 `'requestId' in response && !('request_id' in response)` 满足时，共享工具才执行该分支。
    if ('requestId' in response && !('request_id' in response)) {
      // request_id 请求数据更新为 `response.requestId`，确保共享工具后续读取最新状态。
      response.request_id = response.requestId
      // 共享工具 control Message Compat在这里处理 `delete response.requestId`，完成这一小步状态转换。
      delete response.requestId
    }
  }
  // 返回 `obj`，作为共享工具这次计算的结果。
  return obj
}
