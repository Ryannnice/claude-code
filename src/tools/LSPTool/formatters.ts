// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { relative } from 'path'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  CallHierarchyIncomingCall,
  CallHierarchyItem,
  CallHierarchyOutgoingCall,
  DocumentSymbol,
  Hover,
  Location,
  LocationLink,
  MarkedString,
  MarkupContent,
  SymbolInformation,
  SymbolKind,
} from 'vscode-languageserver-types'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js'

/**
 * Formats a URI by converting it to a relative path if possible.
 * Handles URI decoding and gracefully falls back to un-decoded path if malformed.
 * Only uses relative paths when shorter and not starting with ../../
 */
// formatUri 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatUri(uri: string | undefined, cwd?: string): string {
  // Handle undefined/null URIs - this indicates malformed LSP data
  // uri缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!uri) {
    // NOTE: This should ideally be caught earlier with proper error logging
    // This is a defensive backstop in the formatting layer
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'formatUri called with undefined URI - indicates malformed LSP server response',
      { level: 'warn' },
    )
    // 返回 `'<unknown location>'`，作为工具调用这次计算的结果。
    return '<unknown location>'
  }

  // Remove file:// protocol if present
  // On Windows, file:///C:/path becomes /C:/path after replacing file://
  // We need to strip the leading slash for Windows drive-letter paths
  // 文件路径格式化`uri.replace`，供工具调用后续处理使用。
  let filePath = uri.replace(/^file:\/\//, '')
  // 满足 `/^\/[A-Za-z]:/.test(filePath)` 时，工具调用执行该分支。
  if (/^\/[A-Za-z]:/.test(filePath)) {
    // 文件路径更新为 `filePath.slice(1)`，确保工具调用后续读取最新状态。
    filePath = filePath.slice(1)
  }

  // Decode URI encoding - handle malformed URIs gracefully
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // 文件路径更新为 `decodeURIComponent(filePath)`，确保工具调用后续读取最新状态。
    filePath = decodeURIComponent(filePath)
  } catch (error) {
    // Log for debugging but continue with un-decoded path
    // errorMsg 错误信息保存`errorMessage`，供工具调用后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to decode LSP URI '${uri}': ${errorMsg}. Using un-decoded path: ${filePath}`,
      { level: 'warn' },
    )
    // filePath already contains the un-decoded path, which is still usable
  }

  // Convert to relative path if cwd is provided
  // 满足 `cwd` 时，工具调用执行该分支。
  if (cwd) {
    // Normalize separators to forward slashes for consistent display output
    // relativePath 路径数据保存`relative`，供工具调用后续处理使用。
    const relativePath = relative(cwd, filePath).replaceAll('\\', '/')
    // Only use relative path if it's shorter and doesn't start with ../..
    // 工具调用在这里按实际状态进入对应分支。
    if (
      relativePath.length < filePath.length &&
      !relativePath.startsWith('../../')
    ) {
      // 返回 `relativePath`，作为工具调用这次计算的结果。
      return relativePath
    }
  }

  // Normalize separators to forward slashes for consistent display output
  // 返回 `filePath.replaceAll('\\', '/')`，作为工具调用这次计算的结果。
  return filePath.replaceAll('\\', '/')
}

/**
 * Groups items by their file URI.
 * Generic helper that works with both Location[] and SymbolInformation[]
 */
// groupByFile 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function groupByFile<T extends { uri: string } | { location: { uri: string } }>(
  items: T[],
  cwd?: string,
): Map<string, T[]> {
  // byFile 文件数据构建`new Map<string, T[]>()` 整理出中间结果，供工具实现 formatters后续步骤使用。
  const byFile = new Map<string, T[]>()
  // 按顺序遍历 `items` 中的item，逐个交给工具调用处理。
  for (const item of items) {
    // uri 命名 `'uri' in item ? item.uri : item.location.uri`，让后续代码直接表达这个值的用途。
    const uri = 'uri' in item ? item.uri : item.location.uri
    // 文件路径格式化`formatUri`，供工具调用后续处理使用。
    const filePath = formatUri(uri, cwd)
    // existingItems 集合读取`byFile.get`，供工具调用后续处理使用。
    const existingItems = byFile.get(filePath)
    // 满足 `existingItems` 时，工具调用执行该分支。
    if (existingItems) {
      // existingItems 集合追加新条目，保持收集顺序与输入顺序一致。
      existingItems.push(item)
    } else {
      // byFile.set 写入新的状态值，使工具调用后续读取保持一致。
      byFile.set(filePath, [item])
    }
  }
  // 返回 `byFile`，作为工具调用这次计算的结果。
  return byFile
}

/**
 * Formats a Location with file path and line/character position
 */
// formatLocation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatLocation(location: Location, cwd?: string): string {
  // 文件路径格式化`formatUri`，供工具调用后续处理使用。
  const filePath = formatUri(location.uri, cwd)
  // line保存`location.range.start.line + 1 // Convert to 1-based`，供后续判断或组装使用。
  const line = location.range.start.line + 1 // Convert to 1-based
  // character保存`location.range.start.character + 1 // Convert to 1-based`，供工具实现 formatters后续判断或输出使用。
  const character = location.range.start.character + 1 // Convert to 1-based
  // 返回 ``${filePath}:${line}:${character}``，作为工具调用这次计算的结果。
  return `${filePath}:${line}:${character}`
}

/**
 * Converts LocationLink to Location format for consistent handling
 */
// locationLinkToLocation 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function locationLinkToLocation(link: LocationLink): Location {
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    uri: link.targetUri,
    range: link.targetSelectionRange || link.targetRange,
  }
}

/**
 * Checks if an object is a LocationLink (has targetUri) vs Location (has uri)
 */
// isLocationLink 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLocationLink(item: Location | LocationLink): item is LocationLink {
  // 返回 `'targetUri' in item`，作为工具调用这次计算的结果。
  return 'targetUri' in item
}

/**
 * Formats goToDefinition result
 * Can return Location, LocationLink, or arrays of either
 */
// formatGoToDefinitionResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatGoToDefinitionResult(
  result: Location | Location[] | LocationLink | LocationLink[] | null,
  cwd?: string,
): string {
  // 结果缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!result) {
    // 返回 `'No definition found. This may occur if the cursor is not on a symbol, ...`，作为工具调用这次计算的结果。
    return 'No definition found. This may occur if the cursor is not on a symbol, or if the definition is in an external library not indexed by the LSP server.'
  }

  // 满足 `Array.isArray(result)` 时，工具调用执行该分支。
  if (Array.isArray(result)) {
    // Convert LocationLinks to Locations for uniform handling
    // 这个回调绑定到 const locations: Location[] = result.map(item =>，负责工具调用在该局部场景下的响应。
    const locations: Location[] = result.map(item =>
      isLocationLink(item) ? locationLinkToLocation(item) : item,
    )

    // Log and filter out any locations with undefined uris
    // invalidLocations 集合筛选`locations.filter`，供工具调用后续处理使用。
    const invalidLocations = locations.filter(loc => !loc || !loc.uri)
    // 满足 `invalidLocations.length > 0` 时，工具调用执行该分支。
    if (invalidLocations.length > 0) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `formatGoToDefinitionResult: Filtering out ${invalidLocations.length} invalid location(s) - this should have been caught earlier`,
        { level: 'warn' },
      )
    }

    // validLocations 集合筛选`locations.filter`，供工具调用后续处理使用。
    const validLocations = locations.filter(loc => loc && loc.uri)

    // validLocations 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
    if (validLocations.length === 0) {
      // 返回 `'No definition found. This may occur if the cursor is not on a symbol, ...`，作为工具调用这次计算的结果。
      return 'No definition found. This may occur if the cursor is not on a symbol, or if the definition is in an external library not indexed by the LSP server.'
    }
    // 满足 `validLocations.length === 1` 时，工具调用执行该分支。
    if (validLocations.length === 1) {
      // 返回 ``Defined in ${formatLocation(validLocations[0]!, cwd)}``，作为工具调用这次计算的结果。
      return `Defined in ${formatLocation(validLocations[0]!, cwd)}`
    }
    // locationList 集合保存`validLocations`，供工具实现 formatters后续判断或输出使用。
    const locationList = validLocations
      // 链式调用 map，继续加工上一行在工具调用中产生的数据。
      .map(loc => `  ${formatLocation(loc, cwd)}`)
      .join('\n')
    // 返回 ``Found ${validLocations.length} definitions:\n${locationList}``，作为工具调用这次计算的结果。
    return `Found ${validLocations.length} definitions:\n${locationList}`
  }

  // Single result - convert LocationLink if needed
  // location保存`isLocationLink`，供工具调用后续处理使用。
  const location = isLocationLink(result)
    ? locationLinkToLocation(result)
    : result
  // 返回 ``Defined in ${formatLocation(location, cwd)}``，作为工具调用这次计算的结果。
  return `Defined in ${formatLocation(location, cwd)}`
}

/**
 * Formats findReferences result
 */
// formatFindReferencesResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatFindReferencesResult(
  result: Location[] | null,
  cwd?: string,
): string {
  // !result || result为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (!result || result.length === 0) {
    // 返回 `'No references found. This may occur if the symbol has no usages, or if...`，作为工具调用这次计算的结果。
    return 'No references found. This may occur if the symbol has no usages, or if the LSP server has not fully indexed the workspace.'
  }

  // Log and filter out any locations with undefined uris
  // invalidLocations 集合筛选`result.filter`，供工具调用后续处理使用。
  const invalidLocations = result.filter(loc => !loc || !loc.uri)
  // 满足 `invalidLocations.length > 0` 时，工具调用执行该分支。
  if (invalidLocations.length > 0) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `formatFindReferencesResult: Filtering out ${invalidLocations.length} invalid location(s) - this should have been caught earlier`,
      { level: 'warn' },
    )
  }

  // validLocations 集合筛选`result.filter`，供工具调用后续处理使用。
  const validLocations = result.filter(loc => loc && loc.uri)

  // validLocations 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (validLocations.length === 0) {
    // 返回 `'No references found. This may occur if the symbol has no usages, or if...`，作为工具调用这次计算的结果。
    return 'No references found. This may occur if the symbol has no usages, or if the LSP server has not fully indexed the workspace.'
  }

  // 满足 `validLocations.length === 1` 时，工具调用执行该分支。
  if (validLocations.length === 1) {
    // 返回 ``Found 1 reference:\n ${formatLocation(validLocations[0]!, cwd)}``，作为工具调用这次计算的结果。
    return `Found 1 reference:\n  ${formatLocation(validLocations[0]!, cwd)}`
  }

  // Group references by file
  // byFile 文件数据保存`groupByFile`，供工具调用后续处理使用。
  const byFile = groupByFile(validLocations, cwd)

  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines: string[] = [
    `Found ${validLocations.length} references across ${byFile.size} files:`,
  ]

  // 循环处理 `const [filePath, locations] of byFile`，让工具调用逐项把同类条目按顺序走完。
  for (const [filePath, locations] of byFile) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`\n${filePath}:`)
    // 按顺序遍历 `locations` 中的loc，逐个交给工具调用处理。
    for (const loc of locations) {
      // line 命名 `loc.range.start.line + 1`，让后续代码直接表达这个值的用途。
      const line = loc.range.start.line + 1
      // character保存`loc.range.start.character + 1`，供后续判断或组装使用。
      const character = loc.range.start.character + 1
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(`  Line ${line}:${character}`)
    }
  }

  // 返回 `lines.join('\n')`，作为工具调用这次计算的结果。
  return lines.join('\n')
}

/**
 * Extracts text content from MarkupContent or MarkedString
 */
// extractMarkupText 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractMarkupText(
  contents: MarkupContent | MarkedString | MarkedString[],
): string {
  // 满足 `Array.isArray(contents)` 时，工具调用执行该分支。
  if (Array.isArray(contents)) {
    // 返回 `contents`，作为工具调用这次计算的结果。
    return contents
      // 链式调用 map，继续加工上一行在工具调用中产生的数据。
      .map(item => {
        // 当 `typeof item` 匹配 `'string'` 时，工具调用执行对应分支。
        if (typeof item === 'string') {
          // 返回 `item`，作为工具调用这次计算的结果。
          return item
        }
        // 返回 `item.value`，作为工具调用这次计算的结果。
        return item.value
      })
      .join('\n\n')
  }

  // 当 `typeof contents` 匹配 `'string'` 时，工具调用执行对应分支。
  if (typeof contents === 'string') {
    // 返回 `contents`，作为工具调用这次计算的结果。
    return contents
  }

  // 满足 `'kind' in contents` 时，工具调用执行该分支。
  if ('kind' in contents) {
    // MarkupContent
    // 返回 `contents.value`，作为工具调用这次计算的结果。
    return contents.value
  }

  // MarkedString object
  // 返回 `contents.value`，作为工具调用这次计算的结果。
  return contents.value
}

/**
 * Formats hover result
 */
// formatHoverResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatHoverResult(result: Hover | null, _cwd?: string): string {
  // 结果缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!result) {
    // 返回 `'No hover information available. This may occur if the cursor is not on...`，作为工具调用这次计算的结果。
    return 'No hover information available. This may occur if the cursor is not on a symbol, or if the LSP server has not fully indexed the file.'
  }

  // 文本内容保存`extractMarkupText`，供工具调用后续处理使用。
  const content = extractMarkupText(result.contents)

  // 满足 `result.range` 时，工具调用执行该分支。
  if (result.range) {
    // line 命名 `result.range.start.line + 1`，让后续代码直接表达这个值的用途。
    const line = result.range.start.line + 1
    // character保存`result.range.start.character + 1`，供后续判断或组装使用。
    const character = result.range.start.character + 1
    // 返回 ``Hover info at ${line}:${character}:\n\n${content}``，作为工具调用这次计算的结果。
    return `Hover info at ${line}:${character}:\n\n${content}`
  }

  // 返回 `content`，作为工具调用这次计算的结果。
  return content
}

/**
 * Maps SymbolKind enum to readable string
 */
// symbolKindToString 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function symbolKindToString(kind: SymbolKind): string {
  // kinds 集合 集中保存工具实现 formatters要一起传递的字段。
  const kinds: Record<SymbolKind, string> = {
    [1]: 'File',
    [2]: 'Module',
    [3]: 'Namespace',
    [4]: 'Package',
    [5]: 'Class',
    [6]: 'Method',
    [7]: 'Property',
    [8]: 'Field',
    [9]: 'Constructor',
    [10]: 'Enum',
    [11]: 'Interface',
    [12]: 'Function',
    [13]: 'Variable',
    [14]: 'Constant',
    [15]: 'String',
    [16]: 'Number',
    [17]: 'Boolean',
    [18]: 'Array',
    [19]: 'Object',
    [20]: 'Key',
    [21]: 'Null',
    [22]: 'EnumMember',
    [23]: 'Struct',
    [24]: 'Event',
    [25]: 'Operator',
    [26]: 'TypeParameter',
  }
  // 返回 `kinds[kind] || 'Unknown'`，作为工具调用这次计算的结果。
  return kinds[kind] || 'Unknown'
}

/**
 * Formats a single DocumentSymbol with indentation
 */
// formatDocumentSymbolNode 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatDocumentSymbolNode(
  symbol: DocumentSymbol,
  indent: number = 0,
): string[] {
  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // prefix保存`repeat`，供工具调用后续处理使用。
  const prefix = '  '.repeat(indent)
  // kind保存`symbolKindToString`，供工具调用后续处理使用。
  const kind = symbolKindToString(symbol.kind)

  // line 命名 ``${prefix}${symbol.name} (${kind})``，让后续代码直接表达这个值的用途。
  let line = `${prefix}${symbol.name} (${kind})`
  // 满足 `symbol.detail` 时，工具调用执行该分支。
  if (symbol.detail) {
    // 工具实现 formatters在这里处理 `line += ` ${symbol.detail}``，完成这一小步状态转换。
    line += ` ${symbol.detail}`
  }

  // symbolLine保存`symbol.range.start.line + 1`，供后续判断或组装使用。
  const symbolLine = symbol.range.start.line + 1
  // 工具实现 formatters在这里处理 `line += ` - Line ${symbolLine}``，完成这一小步状态转换。
  line += ` - Line ${symbolLine}`

  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push(line)

  // Recursively format children
  // 只有 `symbol.children && symbol.children.length > 0` 满足时，工具调用才执行该分支。
  if (symbol.children && symbol.children.length > 0) {
    // 按顺序遍历 `symbol.children` 中的child，逐个交给工具调用处理。
    for (const child of symbol.children) {
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(...formatDocumentSymbolNode(child, indent + 1))
    }
  }

  // 返回 `lines`，作为工具调用这次计算的结果。
  return lines
}

/**
 * Formats documentSymbol result (hierarchical outline)
 * Handles both DocumentSymbol[] (hierarchical, with range) and SymbolInformation[] (flat, with location.range)
 * per LSP spec which allows textDocument/documentSymbol to return either format
 */
// formatDocumentSymbolResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatDocumentSymbolResult(
  result: DocumentSymbol[] | SymbolInformation[] | null,
  cwd?: string,
): string {
  // !result || result为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (!result || result.length === 0) {
    // 返回 `'No symbols found in document. This may occur if the file is empty, not...`，作为工具调用这次计算的结果。
    return 'No symbols found in document. This may occur if the file is empty, not supported by the LSP server, or if the server has not fully indexed the file.'
  }

  // Detect format: DocumentSymbol has 'range' directly, SymbolInformation has 'location.range'
  // Check the first valid element to determine format
  // firstSymbol读取 `result[0]` 对应条目，后续围绕该成员继续处理。
  const firstSymbol = result[0]
  // isSymbolInformation标记工具实现 formatters是否启用对应路径。
  const isSymbolInformation = firstSymbol && 'location' in firstSymbol

  // 满足 `isSymbolInformation` 时，工具调用执行该分支。
  if (isSymbolInformation) {
    // Delegate to workspace symbol formatter which handles SymbolInformation[]
    // 返回 `formatWorkspaceSymbolResult(result as SymbolInformation[], cwd)`，作为工具调用这次计算的结果。
    return formatWorkspaceSymbolResult(result as SymbolInformation[], cwd)
  }

  // Handle DocumentSymbol[] format (hierarchical)
  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines: string[] = ['Document symbols:']

  // 按顺序遍历 `result as DocumentSymbol[]` 中的symbol，逐个交给工具调用处理。
  for (const symbol of result as DocumentSymbol[]) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(...formatDocumentSymbolNode(symbol))
  }

  // 返回 `lines.join('\n')`，作为工具调用这次计算的结果。
  return lines.join('\n')
}

/**
 * Formats workspaceSymbol result (flat list of symbols)
 */
// formatWorkspaceSymbolResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatWorkspaceSymbolResult(
  result: SymbolInformation[] | null,
  cwd?: string,
): string {
  // !result || result为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (!result || result.length === 0) {
    // 返回 `'No symbols found in workspace. This may occur if the workspace is empt...`，作为工具调用这次计算的结果。
    return 'No symbols found in workspace. This may occur if the workspace is empty, or if the LSP server has not finished indexing the project.'
  }

  // Log and filter out any symbols with undefined location.uri
  // invalidSymbols 集合筛选`result.filter`，供工具调用后续处理使用。
  const invalidSymbols = result.filter(
    // sym更新为 `> !sym || !sym.location || !sym.location.uri`，确保工具调用后续读取最新状态。
    sym => !sym || !sym.location || !sym.location.uri,
  )
  // 满足 `invalidSymbols.length > 0` 时，工具调用执行该分支。
  if (invalidSymbols.length > 0) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `formatWorkspaceSymbolResult: Filtering out ${invalidSymbols.length} invalid symbol(s) - this should have been caught earlier`,
      { level: 'warn' },
    )
  }

  // validSymbols 集合筛选`result.filter`，供工具调用后续处理使用。
  const validSymbols = result.filter(
    // sym更新为 `> sym && sym.location && sym.location.uri`，确保工具调用后续读取最新状态。
    sym => sym && sym.location && sym.location.uri,
  )

  // validSymbols 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (validSymbols.length === 0) {
    // 返回 `'No symbols found in workspace. This may occur if the workspace is empt...`，作为工具调用这次计算的结果。
    return 'No symbols found in workspace. This may occur if the workspace is empty, or if the LSP server has not finished indexing the project.'
  }

  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines: string[] = [
    `Found ${validSymbols.length} ${plural(validSymbols.length, 'symbol')} in workspace:`,
  ]

  // Group by file
  // byFile 文件数据保存`groupByFile`，供工具调用后续处理使用。
  const byFile = groupByFile(validSymbols, cwd)

  // 循环处理 `const [filePath, symbols] of byFile`，让工具调用逐项把同类条目按顺序走完。
  for (const [filePath, symbols] of byFile) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`\n${filePath}:`)
    // 按顺序遍历 `symbols` 中的symbol，逐个交给工具调用处理。
    for (const symbol of symbols) {
      // kind保存`symbolKindToString`，供工具调用后续处理使用。
      const kind = symbolKindToString(symbol.kind)
      // line 命名 `symbol.location.range.start.line + 1`，让后续代码直接表达这个值的用途。
      const line = symbol.location.range.start.line + 1
      // symbolLine固定为 `` ${symbol.name} (${kind}) - Line ${line}``，作为工具实现 formatters后续展示或比较的基准。
      let symbolLine = `  ${symbol.name} (${kind}) - Line ${line}`

      // Add container name if available
      // 满足 `symbol.containerName` 时，工具调用执行该分支。
      if (symbol.containerName) {
        // 工具实现 formatters在这里处理 `symbolLine += ` in ${symbol.containerName}``，完成这一小步状态转换。
        symbolLine += ` in ${symbol.containerName}`
      }

      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(symbolLine)
    }
  }

  // 返回 `lines.join('\n')`，作为工具调用这次计算的结果。
  return lines.join('\n')
}

/**
 * Formats a CallHierarchyItem with its location
 * Validates URI before formatting to handle malformed LSP data
 */
// formatCallHierarchyItem 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatCallHierarchyItem(
  item: CallHierarchyItem,
  cwd?: string,
): string {
  // Validate URI - handle undefined/null gracefully
  // item.uri缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!item.uri) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'formatCallHierarchyItem: CallHierarchyItem has undefined URI',
      { level: 'warn' },
    )
    // 返回 ``${item.name} (${symbolKindToString(item.kind)}) - <unknown location>``，作为工具调用这次计算的结果。
    return `${item.name} (${symbolKindToString(item.kind)}) - <unknown location>`
  }

  // 文件路径格式化`formatUri`，供工具调用后续处理使用。
  const filePath = formatUri(item.uri, cwd)
  // line保存`item.range.start.line + 1`，供后续判断或组装使用。
  const line = item.range.start.line + 1
  // kind保存`symbolKindToString`，供工具调用后续处理使用。
  const kind = symbolKindToString(item.kind)
  // 结果保存``${item.name} (${kind}) - ${filePath}:${line}``，作为后续固定文本处理的输入。
  let result = `${item.name} (${kind}) - ${filePath}:${line}`
  // 满足 `item.detail` 时，工具调用执行该分支。
  if (item.detail) {
    // 工具实现 formatters在这里处理 `result += ` [${item.detail}]``，完成这一小步状态转换。
    result += ` [${item.detail}]`
  }
  // 返回 `result`，作为工具调用这次计算的结果。
  return result
}

/**
 * Formats prepareCallHierarchy result
 * Returns the call hierarchy item(s) at the given position
 */
// formatPrepareCallHierarchyResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatPrepareCallHierarchyResult(
  result: CallHierarchyItem[] | null,
  cwd?: string,
): string {
  // !result || result为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (!result || result.length === 0) {
    // 返回 `'No call hierarchy item found at this position'`，作为工具调用这次计算的结果。
    return 'No call hierarchy item found at this position'
  }

  // 满足 `result.length === 1` 时，工具调用执行该分支。
  if (result.length === 1) {
    // 返回 ``Call hierarchy item: ${formatCallHierarchyItem(result[0]!, cwd)}``，作为工具调用这次计算的结果。
    return `Call hierarchy item: ${formatCallHierarchyItem(result[0]!, cwd)}`
  }

  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines = [`Found ${result.length} call hierarchy items:`]
  // 按顺序遍历 `result` 中的item，逐个交给工具调用处理。
  for (const item of result) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`  ${formatCallHierarchyItem(item, cwd)}`)
  }
  // 返回 `lines.join('\n')`，作为工具调用这次计算的结果。
  return lines.join('\n')
}

/**
 * Formats incomingCalls result
 * Shows all functions/methods that call the target
 */
// formatIncomingCallsResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatIncomingCallsResult(
  result: CallHierarchyIncomingCall[] | null,
  cwd?: string,
): string {
  // !result || result为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (!result || result.length === 0) {
    // 返回 `'No incoming calls found (nothing calls this function)'`，作为工具调用这次计算的结果。
    return 'No incoming calls found (nothing calls this function)'
  }

  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines = [
    `Found ${result.length} incoming ${plural(result.length, 'call')}:`,
  ]

  // Group by file
  // byFile 文件数据构建`new Map<string, CallHierarchyIncomingCall[]>()`，供后续判断或组装使用。
  const byFile = new Map<string, CallHierarchyIncomingCall[]>()
  // 按顺序遍历 `result` 中的call，逐个交给工具调用处理。
  for (const call of result) {
    // call.from缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!call.from) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'formatIncomingCallsResult: CallHierarchyIncomingCall has undefined from field',
        { level: 'warn' },
      )
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 文件路径格式化`formatUri`，供工具调用后续处理使用。
    const filePath = formatUri(call.from.uri, cwd)
    // existing读取`byFile.get`，供工具调用后续处理使用。
    const existing = byFile.get(filePath)
    // 满足 `existing` 时，工具调用执行该分支。
    if (existing) {
      // existing追加新条目，保持收集顺序与输入顺序一致。
      existing.push(call)
    } else {
      // byFile.set 写入新的状态值，使工具调用后续读取保持一致。
      byFile.set(filePath, [call])
    }
  }

  // 循环处理 `const [filePath, calls] of byFile`，让工具调用逐项把同类条目按顺序走完。
  for (const [filePath, calls] of byFile) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`\n${filePath}:`)
    // 按顺序遍历 `calls` 中的call，逐个交给工具调用处理。
    for (const call of calls) {
      // call.from缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!call.from) {
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue // Already logged above
      }
      // kind保存`symbolKindToString`，供工具调用后续处理使用。
      const kind = symbolKindToString(call.from.kind)
      // line保存`call.from.range.start.line + 1`，供后续判断或组装使用。
      const line = call.from.range.start.line + 1
      // callLine固定为 `` ${call.from.name} (${kind}) - Line ${line}``，作为工具实现 formatters后续展示或比较的基准。
      let callLine = `  ${call.from.name} (${kind}) - Line ${line}`

      // Show call sites within the caller
      // 只有 `call.fromRanges && call.fromRanges.length > 0` 满足时，工具调用才执行该分支。
      if (call.fromRanges && call.fromRanges.length > 0) {
        // callSites 集合 命名 `call.fromRanges`，让后续代码直接表达这个值的用途。
        const callSites = call.fromRanges
          // 链式调用 map，继续加工上一行在工具调用中产生的数据。
          .map(r => `${r.start.line + 1}:${r.start.character + 1}`)
          .join(', ')
        // 工具实现 formatters在这里处理 `callLine += ` [calls at: ${callSites}]``，完成这一小步状态转换。
        callLine += ` [calls at: ${callSites}]`
      }

      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(callLine)
    }
  }

  // 返回 `lines.join('\n')`，作为工具调用这次计算的结果。
  return lines.join('\n')
}

/**
 * Formats outgoingCalls result
 * Shows all functions/methods called by the target
 */
// formatOutgoingCallsResult 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatOutgoingCallsResult(
  result: CallHierarchyOutgoingCall[] | null,
  cwd?: string,
): string {
  // !result || result为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (!result || result.length === 0) {
    // 返回 `'No outgoing calls found (this function calls nothing)'`，作为工具调用这次计算的结果。
    return 'No outgoing calls found (this function calls nothing)'
  }

  // 文本行 聚合成有序列表，保持后续遍历顺序稳定。
  const lines = [
    `Found ${result.length} outgoing ${plural(result.length, 'call')}:`,
  ]

  // Group by file
  // byFile 文件数据构建`new Map<string, CallHierarchyOutgoingCall[]>()`，供后续判断或组装使用。
  const byFile = new Map<string, CallHierarchyOutgoingCall[]>()
  // 按顺序遍历 `result` 中的call，逐个交给工具调用处理。
  for (const call of result) {
    // call.to缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!call.to) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'formatOutgoingCallsResult: CallHierarchyOutgoingCall has undefined to field',
        { level: 'warn' },
      )
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 文件路径格式化`formatUri`，供工具调用后续处理使用。
    const filePath = formatUri(call.to.uri, cwd)
    // existing读取`byFile.get`，供工具调用后续处理使用。
    const existing = byFile.get(filePath)
    // 满足 `existing` 时，工具调用执行该分支。
    if (existing) {
      // existing追加新条目，保持收集顺序与输入顺序一致。
      existing.push(call)
    } else {
      // byFile.set 写入新的状态值，使工具调用后续读取保持一致。
      byFile.set(filePath, [call])
    }
  }

  // 循环处理 `const [filePath, calls] of byFile`，让工具调用逐项把同类条目按顺序走完。
  for (const [filePath, calls] of byFile) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`\n${filePath}:`)
    // 按顺序遍历 `calls` 中的call，逐个交给工具调用处理。
    for (const call of calls) {
      // call.to缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!call.to) {
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue // Already logged above
      }
      // kind保存`symbolKindToString`，供工具调用后续处理使用。
      const kind = symbolKindToString(call.to.kind)
      // line保存`call.to.range.start.line + 1`，供后续判断或组装使用。
      const line = call.to.range.start.line + 1
      // callLine固定为 `` ${call.to.name} (${kind}) - Line ${line}``，作为工具实现 formatters后续展示或比较的基准。
      let callLine = `  ${call.to.name} (${kind}) - Line ${line}`

      // Show call sites within the current function
      // 只有 `call.fromRanges && call.fromRanges.length > 0` 满足时，工具调用才执行该分支。
      if (call.fromRanges && call.fromRanges.length > 0) {
        // callSites 集合 命名 `call.fromRanges`，让后续代码直接表达这个值的用途。
        const callSites = call.fromRanges
          // 链式调用 map，继续加工上一行在工具调用中产生的数据。
          .map(r => `${r.start.line + 1}:${r.start.character + 1}`)
          .join(', ')
        // 工具实现 formatters在这里处理 `callLine += ` [called from: ${callSites}]``，完成这一小步状态转换。
        callLine += ` [called from: ${callSites}]`
      }

      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(callLine)
    }
  }

  // 返回 `lines.join('\n')`，作为工具调用这次计算的结果。
  return lines.join('\n')
}
