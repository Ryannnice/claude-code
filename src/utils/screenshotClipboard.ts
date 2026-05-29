// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, unlink, writeFile } from 'fs/promises'
// 引入 tmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { tmpdir } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 AnsiToPngOptions、ansiToPng，将 ./ansiToPng.js 中已经封装好的能力接到本文件流程里。
import { type AnsiToPngOptions, ansiToPng } from './ansiToPng.js'
// 引入 execFileNoThrowWithCwd，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 getPlatform，将 ./platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from './platform.js'

/**
 * Copies an image (from ANSI text) to the system clipboard.
 * Supports macOS, Linux (with xclip/xsel), and Windows.
 *
 * Pure-TS pipeline: ANSI text → bitmap-font render → PNG encode. No WASM,
 * no system fonts, so this works in every build (native and JS).
 */
// copyAnsiToClipboard 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function copyAnsiToClipboard(
  ansiText: string,
  options?: AnsiToPngOptions,
): Promise<{ success: boolean; message: string }> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // tempDir格式化`join`，供共享工具后续处理使用。
    const tempDir = join(tmpdir(), 'claude-code-screenshots')
    // 等待 `mkdir(tempDir, { recursive: true })` 完成，再继续共享工具 screenshot Clipboard的异步流程。
    await mkdir(tempDir, { recursive: true })

    // pngPath 路径数据格式化`join`，供共享工具后续处理使用。
    const pngPath = join(tempDir, `screenshot-${Date.now()}.png`)
    // pngBuffer保存`ansiToPng`，供共享工具后续处理使用。
    const pngBuffer = ansiToPng(ansiText, options)
    // 等待 `writeFile(pngPath, pngBuffer)` 完成，再继续共享工具 screenshot Clipboard的异步流程。
    await writeFile(pngPath, pngBuffer)

    // 结果保存`copyPngToClipboard`，供共享工具后续处理使用。
    const result = await copyPngToClipboard(pngPath)

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(pngPath)` 完成，再继续共享工具 screenshot Clipboard的异步流程。
      await unlink(pngPath)
    } catch {
      // Ignore cleanup errors
    }

    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      message: `Failed to copy screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// copyPngToClipboard 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function copyPngToClipboard(
  pngPath: string,
): Promise<{ success: boolean; message: string }> {
  // platform读取`getPlatform`，供共享工具后续处理使用。
  const platform = getPlatform()

  // 当 `platform` 匹配 `'macos'` 时，共享工具执行对应分支。
  if (platform === 'macos') {
    // macOS: Use osascript to copy PNG to clipboard
    // Escape backslashes and double quotes for AppleScript string
    // escapedPath 路径数据格式化`pngPath.replace`，供共享工具后续处理使用。
    const escapedPath = pngPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    // script保存`to`，供共享工具后续处理使用。
    const script = `set the clipboard to (read (POSIX file "${escapedPath}") as «class PNGf»)`
    // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const result = await execFileNoThrowWithCwd('osascript', ['-e', script], {
      timeout: 5000,
    })

    // 满足 `result.code === 0` 时，共享工具执行该分支。
    if (result.code === 0) {
      // 返回 { success: true, message: 'Screenshot copied to clipboard' }，把共享工具这个分支的结果交还调用方。
      return { success: true, message: 'Screenshot copied to clipboard' }
    }
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      success: false,
      message: `Failed to copy to clipboard: ${result.stderr}`,
    }
  }

  // `platform` 命中特定值 `'linux'` 时，进入共享工具对应处理。
  if (platform === 'linux') {
    // Linux: Try xclip first, then xsel
    // xclipResult保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const xclipResult = await execFileNoThrowWithCwd(
      'xclip',
      ['-selection', 'clipboard', '-t', 'image/png', '-i', pngPath],
      { timeout: 5000 },
    )

    // 满足 `xclipResult.code === 0` 时，共享工具执行该分支。
    if (xclipResult.code === 0) {
      // 返回 { success: true, message: 'Screenshot copied to clipboard' }，把共享工具这个分支的结果交还调用方。
      return { success: true, message: 'Screenshot copied to clipboard' }
    }

    // Try xsel as fallback
    // xselResult保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const xselResult = await execFileNoThrowWithCwd(
      'xsel',
      ['--clipboard', '--input', '--type', 'image/png'],
      { timeout: 5000 },
    )

    // 满足 `xselResult.code === 0` 时，共享工具执行该分支。
    if (xselResult.code === 0) {
      // 返回 { success: true, message: 'Screenshot copied to clipboard' }，把共享工具这个分支的结果交还调用方。
      return { success: true, message: 'Screenshot copied to clipboard' }
    }

    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      success: false,
      message:
        'Failed to copy to clipboard. Please install xclip or xsel: sudo apt install xclip',
    }
  }

  // `platform` 命中特定值 `'windows'` 时，进入共享工具对应处理。
  if (platform === 'windows') {
    // Windows: Use PowerShell to copy image to clipboard
    // psScript保存`SetImage`，供共享工具后续处理使用。
    const psScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${pngPath.replace(/'/g, "''")}'))`
    // 结果保存`execFileNoThrowWithCwd`，供共享工具后续处理使用。
    const result = await execFileNoThrowWithCwd(
      'powershell',
      ['-NoProfile', '-Command', psScript],
      { timeout: 5000 },
    )

    // 满足 `result.code === 0` 时，共享工具执行该分支。
    if (result.code === 0) {
      // 返回 { success: true, message: 'Screenshot copied to clipboard' }，把共享工具这个分支的结果交还调用方。
      return { success: true, message: 'Screenshot copied to clipboard' }
    }
    // 返回 {，把共享工具这个分支的结果交还调用方。
    return {
      success: false,
      message: `Failed to copy to clipboard: ${result.stderr}`,
    }
  }

  // 返回 {，把共享工具这个分支的结果交还调用方。
  return {
    success: false,
    message: `Screenshot to clipboard is not supported on ${platform}`,
  }
}
