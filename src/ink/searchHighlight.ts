// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  CellWidth,
  cellAtIndex,
  type Screen,
  type StylePool,
  setCellStyleId,
} from './screen.js'

/**
 * Highlight all visible occurrences of `query` in the screen buffer by
 * inverting cell styles (SGR 7). Post-render, same damage-tracking machinery
 * as applySelectionOverlay — the diff picks up highlighted cells as ordinary
 * changes, LogUpdate stays a pure diff engine.
 *
 * Case-insensitive. Handles wide characters (CJK, emoji) by building a
 * col-of-char map per row — the Nth character isn't at col N when wide chars
 * are present (each occupies 2 cells: head + SpacerTail).
 *
 * This ONLY inverts — there is no "current match" logic here. The yellow
 * current-match overlay is handled separately by applyPositionedHighlight
 * (render-to-screen.ts), which writes on top using positions scanned from
 * the target message's DOM subtree.
 *
 * Returns true if any match was highlighted (damage gate — caller forces
 * full-frame damage when true).
 */
// applySearchHighlight 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applySearchHighlight(
  screen: Screen,
  query: string,
  stylePool: StylePool,
): boolean {
  // query缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!query) return false
  // lq保存`query.toLowerCase`，供终端渲染后续处理使用。
  const lq = query.toLowerCase()
  // qlen保存 `lq.length` 的判断结果，供Ink 渲染层 search Highlight后续分支直接复用。
  const qlen = lq.length
  // w保存`screen.width`，供Ink 渲染层 search Highlight后续判断或输出使用。
  const w = screen.width
  // noSelect保存`screen.noSelect`，供Ink 渲染层 search Highlight后续判断或输出使用。
  const noSelect = screen.noSelect
  // height 命名 `screen.height`，让后续代码直接表达这个值的用途。
  const height = screen.height

  // applied标记Ink 渲染层 search Highlight是否启用对应路径。
  let applied = false
  // 按索引扫描 `height`，需要消费相邻参数时可以精确移动游标。
  for (let row = 0; row < height; row++) {
    // rowOff保存`row * w`，供后续判断或组装使用。
    const rowOff = row * w
    // Build row text (already lowercased) + code-unit→cell-index map.
    // Three skip conditions, all aligned with setCellStyleId /
    // extractRowText (selection.ts):
    //   - SpacerTail: 2nd cell of a wide char, no char of its own
    //   - SpacerHead: end-of-line padding when a wide char wraps
    //   - noSelect: gutters (⎿, line numbers) — same exclusion as
    //     applySelectionOverlay. "Highlight what you see" still holds for
    //     content; gutters aren't search targets.
    // Lowercasing per-char (not on the joined string at the end) means
    // codeUnitToCell maps positions in the LOWERCASED text — U+0130
    // (Turkish İ) lowercases to 2 code units, so lowering the joined
    // string would desync indexOf positions from the map.
    // 文本 命名 `''`，让后续代码直接表达这个值的用途。
    let text = ''
    // colOf 从空数组开始收集，后续循环会按处理顺序追加条目。
    const colOf: number[] = []
    // codeUnitToCell 从空数组开始收集，后续循环会按处理顺序追加条目。
    const codeUnitToCell: number[] = []
    // 按索引扫描 `w`，需要消费相邻参数时可以精确移动游标。
    for (let col = 0; col < w; col++) {
      // idx 命名 `rowOff + col`，让后续代码直接表达这个值的用途。
      const idx = rowOff + col
      // cell保存`cellAtIndex`，供终端渲染后续处理使用。
      const cell = cellAtIndex(screen, idx)
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        cell.width === CellWidth.SpacerTail ||
        cell.width === CellWidth.SpacerHead ||
        noSelect[idx] === 1
      ) {
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue
      }
      // lc保存`char.toLowerCase`，供终端渲染后续处理使用。
      const lc = cell.char.toLowerCase()
      // cellIdx 命名 `colOf.length`，让后续代码直接表达这个值的用途。
      const cellIdx = colOf.length
      // 按索引扫描 `lc.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < lc.length; i++) {
        // codeUnitToCell追加新条目，保持收集顺序与输入顺序一致。
        codeUnitToCell.push(cellIdx)
      }
      // Ink 渲染层 search Highlight在这里处理 `text += lc`，完成这一小步状态转换。
      text += lc
      // colOf追加新条目，保持收集顺序与输入顺序一致。
      colOf.push(col)
    }

    // pos 集合保存`text.indexOf`，供终端渲染后续处理使用。
    let pos = text.indexOf(lq)
    // while 使用 pos >= 0 完成终端渲染里的对应操作。
    while (pos >= 0) {
      // applied更新为 `true`，确保Ink 渲染层后续读取最新状态。
      applied = true
      // startCi 命名 `codeUnitToCell[pos]!`，让后续代码直接表达这个值的用途。
      const startCi = codeUnitToCell[pos]!
      // endCi读取 `codeUnitToCell[pos + qlen - 1]!` 对应条目，后续围绕该成员继续处理。
      const endCi = codeUnitToCell[pos + qlen - 1]!
      // 循环处理 `let ci = startCi; ci <= endCi; ci++`，让终端渲染逐项把同类条目按顺序走完。
      for (let ci = startCi; ci <= endCi; ci++) {
        // col保存`colOf[ci]!`，供Ink 渲染层 search Highlight后续判断或输出使用。
        const col = colOf[ci]!
        // cell保存`cellAtIndex`，供终端渲染后续处理使用。
        const cell = cellAtIndex(screen, rowOff + col)
        // setCellStyleId 写入新的状态值，使终端渲染后续读取保持一致。
        setCellStyleId(screen, col, row, stylePool.withInverse(cell.styleId))
      }
      // Non-overlapping advance (less/vim/grep/Ctrl+F). pos+1 would find
      // 'aa' at 0 AND 1 in 'aaa' → double-invert cell 1.
      // pos 集合更新为 `text.indexOf(lq, pos + qlen)`，确保Ink 渲染层后续读取最新状态。
      pos = text.indexOf(lq, pos + qlen)
    }
  }

  // 返回 `applied`，作为终端渲染这次计算的结果。
  return applied
}
