// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'

/**
 * Discriminated union of all LSP operations
 * Uses 'operation' as the discriminator field
 */
// lspToolInputSchema保存`lazySchema`，供工具调用后续处理使用。
export const lspToolInputSchema = lazySchema(() => {
  /**
   * Go to Definition operation
   * Finds the definition location of a symbol at the given position
   */
  // goToDefinitionSchema保存`z.strictObject`，供工具调用后续处理使用。
  const goToDefinitionSchema = z.strictObject({
    operation: z.literal('goToDefinition'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  })

  /**
   * Find References operation
   * Finds all references to a symbol at the given position
   */
  // findReferencesSchema保存`z.strictObject`，供工具调用后续处理使用。
  const findReferencesSchema = z.strictObject({
    operation: z.literal('findReferences'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  })

  /**
   * Hover operation
   * Gets hover information (documentation, type info) for a symbol at the given position
   */
  // hoverSchema保存`z.strictObject`，供工具调用后续处理使用。
  const hoverSchema = z.strictObject({
    operation: z.literal('hover'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  })

  /**
   * Document Symbol operation
   * Gets all symbols (functions, classes, variables) in a document
   */
  // documentSymbolSchema保存`z.strictObject`，供工具调用后续处理使用。
  const documentSymbolSchema = z.strictObject({
    operation: z.literal('documentSymbol'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  })

  /**
   * Workspace Symbol operation
   * Searches for symbols across the entire workspace
   */
  // workspaceSymbolSchema保存`z.strictObject`，供工具调用后续处理使用。
  const workspaceSymbolSchema = z.strictObject({
    operation: z.literal('workspaceSymbol'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  })

  /**
   * Go to Implementation operation
   * Finds the implementation locations of an interface or abstract method
   */
  // goToImplementationSchema保存`z.strictObject`，供工具调用后续处理使用。
  const goToImplementationSchema = z.strictObject({
    operation: z.literal('goToImplementation'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  })

  /**
   * Prepare Call Hierarchy operation
   * Prepares a call hierarchy item at the given position (first step for call hierarchy)
   */
  // prepareCallHierarchySchema保存`z.strictObject`，供工具调用后续处理使用。
  const prepareCallHierarchySchema = z.strictObject({
    operation: z.literal('prepareCallHierarchy'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  })

  /**
   * Incoming Calls operation
   * Finds all functions/methods that call the function at the given position
   */
  // incomingCallsSchema保存`z.strictObject`，供工具调用后续处理使用。
  const incomingCallsSchema = z.strictObject({
    operation: z.literal('incomingCalls'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  })

  /**
   * Outgoing Calls operation
   * Finds all functions/methods called by the function at the given position
   */
  // outgoingCallsSchema保存`z.strictObject`，供工具调用后续处理使用。
  const outgoingCallsSchema = z.strictObject({
    operation: z.literal('outgoingCalls'),
    filePath: z.string().describe('The absolute or relative path to the file'),
    line: z
      .number()
      .int()
      .positive()
      .describe('The line number (1-based, as shown in editors)'),
    character: z
      .number()
      .int()
      .positive()
      .describe('The character offset (1-based, as shown in editors)'),
  })

  // 返回 `z.discriminatedUnion('operation', [`，作为工具调用这次计算的结果。
  return z.discriminatedUnion('operation', [
    goToDefinitionSchema,
    findReferencesSchema,
    hoverSchema,
    documentSymbolSchema,
    workspaceSymbolSchema,
    goToImplementationSchema,
    prepareCallHierarchySchema,
    incomingCallsSchema,
    outgoingCallsSchema,
  ])
})

/**
 * TypeScript type for LSPTool input
 */
// LSPToolInput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type LSPToolInput = z.infer<ReturnType<typeof lspToolInputSchema>>

/**
 * Type guard to check if an operation is a valid LSP operation
 */
// isValidLSPOperation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isValidLSPOperation(
  operation: string,
): operation is LSPToolInput['operation'] {
  // 返回列表结果，保留工具调用已经排好的条目顺序。
  return [
    'goToDefinition',
    'findReferences',
    'hover',
    'documentSymbol',
    'workspaceSymbol',
    'goToImplementation',
    'prepareCallHierarchy',
    'incomingCalls',
    'outgoingCalls',
  ].includes(operation)
}
