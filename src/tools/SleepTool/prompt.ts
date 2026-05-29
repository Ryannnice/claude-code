// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import { TICK_TAG } from '../../constants/xml.js'

// SLEEP_TOOL_NAME 命名 `'Sleep'`，让后续代码直接表达这个值的用途。
export const SLEEP_TOOL_NAME = 'Sleep'

// DESCRIPTION保存`'Wait for a specified duration'`，作为后续固定文本处理的输入。
export const DESCRIPTION = 'Wait for a specified duration'

// SLEEP_TOOL_PROMPT 命名 ``Wait for a specified duration. The user can interrupt th...`，让后续代码直接表达这个值的用途。
export const SLEEP_TOOL_PROMPT = `Wait for a specified duration. The user can interrupt the sleep at any time.

Use this when the user tells you to sleep or rest, when you have nothing to do, or when you're waiting for something.

You may receive <${TICK_TAG}> prompts — these are periodic check-ins. Look for useful work to do before sleeping.

You can call this concurrently with other tools — it won't interfere with them.

Prefer this over \`Bash(sleep ...)\` — it doesn't hold a shell process.

Each wake-up costs an API call, but the prompt cache expires after 5 minutes of inactivity — balance accordingly.`
