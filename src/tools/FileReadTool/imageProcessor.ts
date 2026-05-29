// 类型依赖 { Buffer } 来自 buffer，用于校准工具调用的数据契约。
import type { Buffer } from 'buffer'
// 复用 isInBundledMode 工具函数，把通用处理留在 ../../utils/bundledMode.js 中维护。
import { isInBundledMode } from '../../utils/bundledMode.js'

// SharpInstance 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type SharpInstance = {
  // metadata 使用 无 完成工具调用里的对应操作。
  metadata(): Promise<{ width: number; height: number; format: string }>
  resize(
    width: number,
    height: number,
    options?: { fit?: string; withoutEnlargement?: boolean },
  ): SharpInstance
  // jpeg 使用 options?: { quality?: number } 完成工具调用里的对应操作。
  jpeg(options?: { quality?: number }): SharpInstance
  // 调用 png，触发工具调用此处需要的副作用。
  png(options?: {
    compressionLevel?: number
    palette?: boolean
    colors?: number
  }): SharpInstance
  // webp 使用 options?: { quality?: number } 完成工具调用里的对应操作。
  webp(options?: { quality?: number }): SharpInstance
  // toBuffer 使用 无 完成工具调用里的对应操作。
  toBuffer(): Promise<Buffer>
}

// SharpFunction 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type SharpFunction = (input: Buffer) => SharpInstance

// SharpCreatorOptions 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type SharpCreatorOptions = {
  create: {
    width: number
    height: number
    channels: 3 | 4
    background: { r: number; g: number; b: number }
  }
}

// SharpCreator 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type SharpCreator = (options: SharpCreatorOptions) => SharpInstance

// imageProcessorModule保存`null`，作为后续空值处理的输入。
let imageProcessorModule: { default: SharpFunction } | null = null
// imageCreatorModule初始化为空值，后续分支会在有数据时补齐。
let imageCreatorModule: { default: SharpCreator } | null = null

// getImageProcessor 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getImageProcessor(): Promise<SharpFunction> {
  // 满足 `imageProcessorModule` 时，工具调用执行该分支。
  if (imageProcessorModule) {
    // 返回 `imageProcessorModule.default`，作为工具调用这次计算的结果。
    return imageProcessorModule.default
  }

  // 满足 `isInBundledMode()` 时，工具调用执行该分支。
  if (isInBundledMode()) {
    // Try to load the native image processor first
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // Use the native image processor module
      // imageProcessor保存`import`，供工具调用后续处理使用。
      const imageProcessor = await import('image-processor-napi')
      // sharp标记工具实现 image Processor是否启用对应路径。
      const sharp = imageProcessor.sharp || imageProcessor.default
      // imageProcessorModule更新为 `{ default: sharp }`，确保工具调用后续读取最新状态。
      imageProcessorModule = { default: sharp }
      // 返回 `sharp`，作为工具调用这次计算的结果。
      return sharp
    } catch {
      // Fall back to sharp if native module is not available
      // biome-ignore lint/suspicious/noConsole: intentional warning
      // 调用 console.warn，触发工具调用此处需要的副作用。
      console.warn(
        'Native image processor not available, falling back to sharp',
      )
    }
  }

  // Use sharp for non-bundled builds or as fallback.
  // Single structural cast: our SharpFunction is a subset of sharp's actual type surface.
  // imported保存`import`，供工具调用后续处理使用。
  const imported = (await import(
    'sharp'
  )) as unknown as MaybeDefault<SharpFunction>
  // sharp保存`unwrapDefault`，供工具调用后续处理使用。
  const sharp = unwrapDefault(imported)
  // imageProcessorModule更新为 `{ default: sharp }`，确保工具调用后续读取最新状态。
  imageProcessorModule = { default: sharp }
  // 返回 `sharp`，作为工具调用这次计算的结果。
  return sharp
}

/**
 * Get image creator for generating new images from scratch.
 * Note: image-processor-napi doesn't support image creation,
 * so this always uses sharp directly.
 */
// getImageCreator 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getImageCreator(): Promise<SharpCreator> {
  // 满足 `imageCreatorModule` 时，工具调用执行该分支。
  if (imageCreatorModule) {
    // 返回 `imageCreatorModule.default`，作为工具调用这次计算的结果。
    return imageCreatorModule.default
  }

  // imported保存`import`，供工具调用后续处理使用。
  const imported = (await import(
    'sharp'
  )) as unknown as MaybeDefault<SharpCreator>
  // sharp保存`unwrapDefault`，供工具调用后续处理使用。
  const sharp = unwrapDefault(imported)
  // imageCreatorModule更新为 `{ default: sharp }`，确保工具调用后续读取最新状态。
  imageCreatorModule = { default: sharp }
  // 返回 `sharp`，作为工具调用这次计算的结果。
  return sharp
}

// Dynamic import shape varies by module interop mode — ESM yields { default: fn }, CJS yields fn directly.
// MaybeDefault 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type MaybeDefault<T> = T | { default: T }

// unwrapDefault 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function unwrapDefault<T extends (...args: never[]) => unknown>(
  mod: MaybeDefault<T>,
): T {
  // 返回 `typeof mod === 'function' ? mod : mod.default`，作为工具调用这次计算的结果。
  return typeof mod === 'function' ? mod : mod.default
}
