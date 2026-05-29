// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'

// TodoStatusSchema保存`lazySchema`，供共享工具后续处理使用。
const TodoStatusSchema = lazySchema(() =>
  z.enum(['pending', 'in_progress', 'completed']),
)

// TodoItemSchema保存`lazySchema`，供共享工具后续处理使用。
export const TodoItemSchema = lazySchema(() =>
  z.object({
    content: z.string().min(1, 'Content cannot be empty'),
    status: TodoStatusSchema(),
    activeForm: z.string().min(1, 'Active form cannot be empty'),
  }),
)
// TodoItem 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TodoItem = z.infer<ReturnType<typeof TodoItemSchema>>

// TodoListSchema 集合保存`lazySchema`，供共享工具后续处理使用。
export const TodoListSchema = lazySchema(() => z.array(TodoItemSchema()))
// TodoList 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TodoList = z.infer<ReturnType<typeof TodoListSchema>>
