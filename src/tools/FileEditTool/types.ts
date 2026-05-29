// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 semanticBoolean 工具函数，把通用处理留在 ../../utils/semanticBoolean.js 中维护。
import { semanticBoolean } from '../../utils/semanticBoolean.js'

// The input schema with optional replace_all
// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() =>
  z.strictObject({
    file_path: z.string().describe('The absolute path to the file to modify'),
    old_string: z.string().describe('The text to replace'),
    new_string: z
      .string()
      .describe(
        'The text to replace it with (must be different from old_string)',
      ),
    replace_all: semanticBoolean(
      z.boolean().default(false).optional(),
    ).describe('Replace all occurrences of old_string (default false)'),
  }),
)
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>

// Parsed output — what call() receives. z.output not z.input: with
// semanticBoolean the input side is unknown (preprocess accepts anything).
// FileEditInput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileEditInput = z.output<InputSchema>

// Individual edit without file_path
// EditInput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type EditInput = Omit<FileEditInput, 'file_path'>

// Runtime version where replace_all is always defined
// FileEdit 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileEdit = {
  old_string: string
  new_string: string
  replace_all: boolean
}

// hunkSchema保存`lazySchema`，供工具调用后续处理使用。
export const hunkSchema = lazySchema(() =>
  z.object({
    oldStart: z.number(),
    oldLines: z.number(),
    newStart: z.number(),
    newLines: z.number(),
    lines: z.array(z.string()),
  }),
)

// gitDiffSchema保存`lazySchema`，供工具调用后续处理使用。
export const gitDiffSchema = lazySchema(() =>
  z.object({
    filename: z.string(),
    status: z.enum(['modified', 'added']),
    additions: z.number(),
    deletions: z.number(),
    changes: z.number(),
    patch: z.string(),
    repository: z
      .string()
      .nullable()
      .optional()
      .describe('GitHub owner/repo when available'),
  }),
)

// Output schema for FileEditTool
// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() =>
  z.object({
    filePath: z.string().describe('The file path that was edited'),
    oldString: z.string().describe('The original string that was replaced'),
    newString: z.string().describe('The new string that replaced it'),
    originalFile: z
      .string()
      .describe('The original file contents before editing'),
    structuredPatch: z
      .array(hunkSchema())
      .describe('Diff patch showing the changes'),
    userModified: z
      .boolean()
      .describe('Whether the user modified the proposed changes'),
    replaceAll: z.boolean().describe('Whether all occurrences were replaced'),
    gitDiff: gitDiffSchema().optional(),
  }),
)
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>

// FileEditOutput 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type FileEditOutput = z.infer<OutputSchema>

// 重新导出这一组成员，让工具调用的公共 API 保持集中入口。
export { inputSchema, outputSchema }
