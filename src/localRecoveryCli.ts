// 引入 Anthropic，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import Anthropic from '@anthropic-ai/sdk'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { readFileSync } from 'fs'
// 使用 Node/Bun 的 readline 能力处理本地运行时资源。
import { createInterface } from 'readline'

// OutputFormat 固化恢复模式 CLI里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputFormat = 'text' | 'json'

// printHelp 封装localRecoveryCli的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function printHelp(): void {
  // 向标准输出写入恢复模式 CLI要展示给用户的文本。
  process.stdout.write(
    [
      'Usage: claude-haha [options] [prompt]',
      '',
      'Local recovery mode for this leaked source tree.',
      '',
      'Options:',
      '  -h, --help                    Show help',
      '  -v, --version                 Show version',
      '  (no args)                     Start local interactive mode',
      '  -p, --print                   Send a single prompt and print the result',
      '  --model <model>               Override model',
      '  --system-prompt <text>        Override system prompt',
      '  --system-prompt-file <file>   Read system prompt from file',
      '  --append-system-prompt <text> Append to the system prompt',
      '  --output-format <format>      text (default) or json',
      '',
      'Environment:',
      '  ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN',
      '  ANTHROPIC_BASE_URL',
      '  ANTHROPIC_MODEL',
      '  API_TIMEOUT_MS',
      '',
    ].join('\n'),
  )
}

// printVersion 封装localRecoveryCli的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function printVersion(): void {
  // 向标准输出写入恢复模式 CLI要展示给用户的文本。
  process.stdout.write('999.0.0-local (Claude Code local recovery)\n')
}

// parseArgs 封装localRecoveryCli的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseArgs(argv: string[]) {
  // print标记恢复模式 CLI是否启用对应路径。
  let print = false
  // 模型名称 来自环境变量默认值，运行参数仍可在入口处覆盖。
  let model = process.env.ANTHROPIC_MODEL
  // 系统提示词 先占位，稍后的条件分支会根据实际输入补齐它。
  let systemPrompt: string | undefined
  // 追加系统提示词 先占位，稍后的条件分支会根据实际输入补齐它。
  let appendSystemPrompt: string | undefined
  // 输出格式保存`'text'`，作为后续固定文本处理的输入。
  let outputFormat: OutputFormat = 'text'
  // 位置参数 从空数组开始收集，后续循环会按处理顺序追加条目。
  const positional: string[] = []

  // 按索引扫描 `argv.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < argv.length; i++) {
    // 当前参数 命名 `argv[i]`，让后续代码直接表达这个值的用途。
    const arg = argv[i]
    // 当前参数缺失时提前走兜底路径，避免恢复模式 CLI继续依赖无效输入。
    if (!arg) continue

    // 当 `arg` 匹配 `'-h' || arg === '--help'` 时，恢复模式 CLI执行对应分支。
    if (arg === '-h' || arg === '--help') {
      // 返回结构化结果，集中表达恢复模式 CLI已经整理出的状态。
      return { command: 'help' as const }
    }
    // 组合条件 `arg === '-v' || arg === '--version' || arg === '-` 成立时，恢复模式 CLI才启用这条专门路径。
    if (arg === '-v' || arg === '--version' || arg === '-V') {
      // 返回结构化结果，集中表达恢复模式 CLI已经整理出的状态。
      return { command: 'version' as const }
    }
    // 当 `arg` 匹配 `'-p' || arg === '--print'` 时，恢复模式 CLI执行对应分支。
    if (arg === '-p' || arg === '--print') {
      // print更新为 `true`，确保localRecoveryCli后续读取最新状态。
      print = true
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 当 `arg` 匹配 `'--bare'` 时，恢复模式 CLI执行对应分支。
    if (arg === '--bare') {
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 当 `arg` 匹配 `'--dangerously-skip-permiss...` 时，恢复模式 CLI执行对应分支。
    if (arg === '--dangerously-skip-permissions') {
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 当 `arg` 匹配 `'--model'` 时，恢复模式 CLI执行对应分支。
    if (arg === '--model') {
      // 模型名称更新为 `argv[++i]`，确保localRecoveryCli后续读取最新状态。
      model = argv[++i]
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 当 `arg` 匹配 `'--system-prompt'` 时，恢复模式 CLI执行对应分支。
    if (arg === '--system-prompt') {
      // 系统提示词更新为 `argv[++i]`，确保localRecoveryCli后续读取最新状态。
      systemPrompt = argv[++i]
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 当 `arg` 匹配 `'--system-prompt-file'` 时，恢复模式 CLI执行对应分支。
    if (arg === '--system-prompt-file') {
      // file 文件数据保存`argv[++i]`，供恢复模式 CLI后续判断或输出使用。
      const file = argv[++i]
      // 系统提示词更新为 `readFileSync(file!, 'utf8')`，确保localRecoveryCli后续读取最新状态。
      systemPrompt = readFileSync(file!, 'utf8')
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 当 `arg` 匹配 `'--append-system-prompt'` 时，恢复模式 CLI执行对应分支。
    if (arg === '--append-system-prompt') {
      // 追加系统提示词更新为 `argv[++i]`，确保localRecoveryCli后续读取最新状态。
      appendSystemPrompt = argv[++i]
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 当 `arg` 匹配 `'--output-format'` 时，恢复模式 CLI执行对应分支。
    if (arg === '--output-format') {
      // 取值保存`argv[++i]`，供恢复模式 CLI后续判断或输出使用。
      const value = argv[++i]
      // 当 `value` 匹配 `'json' || value === 'text'` 时，恢复模式 CLI执行对应分支。
      if (value === 'json' || value === 'text') {
        // 输出格式更新为 `value`，确保localRecoveryCli后续读取最新状态。
        outputFormat = value
      }
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 满足 `arg.startsWith('-')` 时，恢复模式 CLI执行该分支。
    if (arg.startsWith('-')) {
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 位置参数追加新条目，保持收集顺序与输入顺序一致。
    positional.push(arg)
  }

  // 返回结构化结果，集中表达恢复模式 CLI已经整理出的状态。
  return {
    command: 'run' as const,
    print,
    model,
    systemPrompt,
    appendSystemPrompt,
    outputFormat,
    prompt: positional.join(' ').trim(),
  }
}

// readPromptFromStdin 封装localRecoveryCli的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readPromptFromStdin(): Promise<string> {
  // 满足 `process.stdin.isTTY` 时，恢复模式 CLI执行该分支。
  if (process.stdin.isTTY) return ''
  // 输入块 从空数组开始收集，后续循环会按处理顺序追加条目。
  const chunks: Buffer[] = []
  // 逐项读取 `process.stdin` 中的chunk，按输入顺序推进恢复模式 CLI。
  for await (const chunk of process.stdin) {
    // 输入块追加新条目，保持收集顺序与输入顺序一致。
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
  }
  // 返回 `Buffer.concat(chunks).toString('utf8').trim()`，作为恢复模式 CLI这次计算的结果。
  return Buffer.concat(chunks).toString('utf8').trim()
}

// getSystemPrompt 封装localRecoveryCli的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSystemPrompt(
  systemPrompt: string | undefined,
  appendSystemPrompt: string | undefined,
): string | undefined {
  // 组合条件 `systemPrompt && appendSystemPrompt` 成立时，恢复模式 CLI才启用这条专门路径。
  if (systemPrompt && appendSystemPrompt) {
    // 返回 ``${systemPrompt}\n\n${appendSystemPrompt}``，作为恢复模式 CLI这次计算的结果。
    return `${systemPrompt}\n\n${appendSystemPrompt}`
  }
  // 返回 `systemPrompt ?? appendSystemPrompt`，作为恢复模式 CLI这次计算的结果。
  return systemPrompt ?? appendSystemPrompt
}

// run 封装localRecoveryCli的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function run(): Promise<void> {
  // 解析结果解析`parseArgs`，供恢复模式 CLI后续处理使用。
  const parsed = parseArgs(process.argv.slice(2))

  // 当 `parsed.command` 匹配 `'help'` 时，恢复模式 CLI执行对应分支。
  if (parsed.command === 'help') {
    // 调用 printHelp，触发恢复模式 CLI此处需要的副作用。
    printHelp()
    // 恢复模式 CLI在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 当 `parsed.command` 匹配 `'version'` 时，恢复模式 CLI执行对应分支。
  if (parsed.command === 'version') {
    // 调用 printVersion，触发恢复模式 CLI此处需要的副作用。
    printVersion()
    // 恢复模式 CLI在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // parsed.print缺失时提前走兜底路径，避免恢复模式 CLI继续依赖无效输入。
  if (!parsed.print) {
    // 等待 `runInteractive(parsed)` 完成，再继续恢复模式 CLI的异步流程。
    await runInteractive(parsed)
    // 恢复模式 CLI在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 提示词读取`readPromptFromStdin`，供恢复模式 CLI后续处理使用。
  const prompt = parsed.prompt || (await readPromptFromStdin())
  // 提示词缺失时提前走兜底路径，避免恢复模式 CLI继续依赖无效输入。
  if (!prompt) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('Error: prompt is required\n')
    // 设置进程退出码为 `1`，让外层 shell 感知localRecoveryCli运行失败。
    process.exitCode = 1
    // 恢复模式 CLI在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // API key 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const apiKey = process.env.ANTHROPIC_API_KEY
  // 认证令牌 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN
  // 组合条件 `!apiKey && !authToken` 成立时，恢复模式 CLI才启用这条专门路径。
  if (!apiKey && !authToken) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      'Error: set ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN\n',
    )
    // 设置进程退出码为 `1`，让外层 shell 感知localRecoveryCli运行失败。
    process.exitCode = 1
    // 恢复模式 CLI在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // model 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const model =
    parsed.model ||
    process.env.ANTHROPIC_DEFAULT_SONNET_MODEL ||
    process.env.ANTHROPIC_MODEL

  // 模型名称缺失时提前走兜底路径，避免恢复模式 CLI继续依赖无效输入。
  if (!model) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('Error: model is required\n')
    // 设置进程退出码为 `1`，让外层 shell 感知localRecoveryCli运行失败。
    process.exitCode = 1
    // 恢复模式 CLI在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // API 客户端保存`Anthropic`，供恢复模式 CLI后续处理使用。
  const client = new Anthropic({
    apiKey: apiKey ?? undefined,
    authToken: authToken ?? undefined,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    timeout: parseInt(process.env.API_TIMEOUT_MS || String(600_000), 10),
    maxRetries: 0,
  })

  // 接口响应构建`messages.create`，供恢复模式 CLI后续处理使用。
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: getSystemPrompt(parsed.systemPrompt, parsed.appendSystemPrompt),
    messages: [{ role: 'user', content: prompt }],
  })

  // 当 `parsed.outputFormat` 匹配 `'json'` 时，恢复模式 CLI执行对应分支。
  if (parsed.outputFormat === 'json') {
    // 向标准输出写入恢复模式 CLI要展示给用户的文本。
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`)
    // 恢复模式 CLI在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 文本内容保存`response.content`，供恢复模式 CLI后续判断或输出使用。
  const text = response.content
    // 链式调用 filter，继续加工上一行在恢复模式 CLI中产生的数据。
    .filter(block => block.type === 'text')
    // 链式调用 map，继续加工上一行在恢复模式 CLI中产生的数据。
    .map(block => block.text)
    .join('\n')

  // 向标准输出写入恢复模式 CLI要展示给用户的文本。
  process.stdout.write(`${text}\n`)
}

// runInteractive 封装localRecoveryCli的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function runInteractive(parsed: {
  model?: string
  systemPrompt?: string
  appendSystemPrompt?: string
}): Promise<void> {
  // API key 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const apiKey = process.env.ANTHROPIC_API_KEY
  // 认证令牌 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN
  // 组合条件 `!apiKey && !authToken` 成立时，恢复模式 CLI才启用这条专门路径。
  if (!apiKey && !authToken) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      'Error: set ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN\n',
    )
    // 设置进程退出码为 `1`，让外层 shell 感知localRecoveryCli运行失败。
    process.exitCode = 1
    // 恢复模式 CLI在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // model 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const model =
    parsed.model ||
    process.env.ANTHROPIC_DEFAULT_SONNET_MODEL ||
    process.env.ANTHROPIC_MODEL

  // 模型名称缺失时提前走兜底路径，避免恢复模式 CLI继续依赖无效输入。
  if (!model) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('Error: model is required\n')
    // 设置进程退出码为 `1`，让外层 shell 感知localRecoveryCli运行失败。
    process.exitCode = 1
    // 恢复模式 CLI在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // API 客户端保存`Anthropic`，供恢复模式 CLI后续处理使用。
  const client = new Anthropic({
    apiKey: apiKey ?? undefined,
    authToken: authToken ?? undefined,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    timeout: parseInt(process.env.API_TIMEOUT_MS || String(600_000), 10),
    maxRetries: 0,
  })

  // system读取`getSystemPrompt`，供恢复模式 CLI后续处理使用。
  const system = getSystemPrompt(parsed.systemPrompt, parsed.appendSystemPrompt)
  // 对话消息 从空数组开始收集，后续循环会按处理顺序追加条目。
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  // rl构建`createInterface`，供恢复模式 CLI后续处理使用。
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'you> ',
  })

  // 向标准输出写入恢复模式 CLI要展示给用户的文本。
  process.stdout.write(
    `Claude Haha local interactive mode\nmodel: ${model}\ncommands: /exit, /clear\n\n`,
  )
  // readline 显示下一轮提示符，让交互式输入继续。
  rl.prompt()

  // 逐项读取 `rl` 中的line，按输入顺序推进恢复模式 CLI。
  for await (const line of rl) {
    // 用户输入格式化`line.trim`，供恢复模式 CLI后续处理使用。
    const input = line.trim()
    // 用户输入缺失时提前走兜底路径，避免恢复模式 CLI继续依赖无效输入。
    if (!input) {
      // readline 显示下一轮提示符，让交互式输入继续。
      rl.prompt()
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }
    // 当 `input` 匹配 `'/exit' || input === '/quit'` 时，恢复模式 CLI执行对应分支。
    if (input === '/exit' || input === '/quit') {
      // 关闭 readline 会话，结束本地交互循环。
      rl.close()
      // 结束这个分支或循环，避免恢复模式 CLI继续落入后续路径。
      break
    }
    // 当 `input` 匹配 `'/clear'` 时，恢复模式 CLI执行对应分支。
    if (input === '/clear') {
      // 对话消息被清空，localRecoveryCli从干净状态继续。
      messages.length = 0
      // 向标准输出写入恢复模式 CLI要展示给用户的文本。
      process.stdout.write('history cleared\n')
      // readline 显示下一轮提示符，让交互式输入继续。
      rl.prompt()
      // 跳过当前项，继续处理恢复模式 CLI中的下一轮循环。
      continue
    }

    // 对话消息追加新条目，保持收集顺序与输入顺序一致。
    messages.push({ role: 'user', content: input })
    // 保护这一段可能失败的恢复模式 CLI操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应构建`messages.create`，供恢复模式 CLI后续处理使用。
      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system,
        messages,
      })
      // 文本内容保存`response.content`，供恢复模式 CLI后续判断或输出使用。
      const text = response.content
        // 链式调用 filter，继续加工上一行在恢复模式 CLI中产生的数据。
        .filter(block => block.type === 'text')
        // 链式调用 map，继续加工上一行在恢复模式 CLI中产生的数据。
        .map(block => block.text)
        .join('\n')
      // 向标准输出写入恢复模式 CLI要展示给用户的文本。
      process.stdout.write(`claude> ${text}\n\n`)
      // 对话消息追加新条目，保持收集顺序与输入顺序一致。
      messages.push({ role: 'assistant', content: text })
    } catch (error) {
      // message 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const message =
        error instanceof Error ? error.message : String(error)
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(`error: ${message}\n`)
    }
    // readline 显示下一轮提示符，让交互式输入继续。
    rl.prompt()
  }
}

// 这个回调绑定到 void run().catch(error => {，负责恢复模式 CLI在该局部场景下的响应。
void run().catch(error => {
  // 消息保存`String`，供恢复模式 CLI后续处理使用。
  const message = error instanceof Error ? error.stack || error.message : String(error)
  // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
  process.stderr.write(`${message}\n`)
  // 设置进程退出码为 `1`，让外层 shell 感知localRecoveryCli运行失败。
  process.exitCode = 1
})
