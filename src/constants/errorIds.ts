// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
/**
 * Error IDs for tracking error sources in production.
 * These IDs are obfuscated identifiers that help us trace
 * which logError() call generated an error.
 *
 * These errors are represented as individual const exports for optimal
 * dead code elimination (external build will only see the numbers).
 *
 * ADDING A NEW ERROR TYPE:
 * 1. Add a const based on Next ID.
 * 2. Increment Next ID.
 * Next ID: 346
 */

// E_TOOL_USE_SUMMARY_GENERATION_FAILED 命名 `344`，让后续代码直接表达这个值的用途。
export const E_TOOL_USE_SUMMARY_GENERATION_FAILED = 344
