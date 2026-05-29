// ConnectorTextBlock 固化connector Text里传递的数据形状，帮助调用方按同一结构读写字段。
export type ConnectorTextBlock = {
  type: 'connector_text';
  text?: string;
};

// ConnectorTextDelta 固化connector Text里传递的数据形状，帮助调用方按同一结构读写字段。
export type ConnectorTextDelta = {
  type: 'connector_text_delta';
  text?: string;
};

// isConnectorTextBlock 封装connectorText的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isConnectorTextBlock(
  value: unknown,
): value is ConnectorTextBlock {
  // 返回 `(`，作为connector Text这次计算的结果。
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type?: unknown }).type === 'connector_text'
  );
}
