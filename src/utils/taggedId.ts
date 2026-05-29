/**
 * Tagged ID encoding compatible with the API's tagged_id.py format.
 *
 * Produces IDs like "user_01PaGUP2rbg1XDh7Z9W1CEpd" from a UUID string.
 * The format is: {tag}_{version}{base58(uuid_as_128bit_int)}
 *
 * This must stay in sync with api/api/common/utils/tagged_id.py.
 */

// BASE_58_CHARS 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const BASE_58_CHARS =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
// VERSION 命名 `'01'`，让后续代码直接表达这个值的用途。
const VERSION = '01'
// ceil(128 / log2(58)) = 22
// ENCODED_LENGTH 数量 命名 `22`，让后续代码直接表达这个值的用途。
const ENCODED_LENGTH = 22

/**
 * Encode a 128-bit unsigned integer as a fixed-length base58 string.
 */
// base58Encode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function base58Encode(n: bigint): string {
  // base保存`BigInt`，供共享工具后续处理使用。
  const base = BigInt(BASE_58_CHARS.length)
  // 结果保存`fill`，供共享工具后续处理使用。
  const result = new Array<string>(ENCODED_LENGTH).fill(BASE_58_CHARS[0]!)
  // i保存`ENCODED_LENGTH - 1`，供后续判断或组装使用。
  let i = ENCODED_LENGTH - 1
  // 取值保存`n`，供共享工具 tagged Id后续判断或输出使用。
  let value = n
  // while 使用 value > 0n 完成共享工具里的对应操作。
  while (value > 0n) {
    // rem保存`Number`，供共享工具后续处理使用。
    const rem = Number(value % base)
    // result[i更新为 `BASE_58_CHARS[rem]!`，确保共享工具 tagged Id后续读取最新状态。
    result[i] = BASE_58_CHARS[rem]!
    // 取值更新为 `value / base`，确保共享工具后续读取最新状态。
    value = value / base
    // 共享工具 tagged Id在这里处理 `i--`，完成这一小步状态转换。
    i--
  }
  // 返回 `result.join('')`，作为共享工具这次计算的结果。
  return result.join('')
}

/**
 * Parse a UUID string (with or without hyphens) into a 128-bit bigint.
 */
// uuidToBigInt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function uuidToBigInt(uuid: string): bigint {
  // hex格式化`uuid.replace`，供共享工具后续处理使用。
  const hex = uuid.replace(/-/g, '')
  // `hex.length` 与 `32` 不一致时刷新派生状态，避免使用过期结果。
  if (hex.length !== 32) {
    // 抛出 new Error(`Invalid UUID hex length: ${hex.length}`)，阻止共享工具在无效状态下继续运行。
    throw new Error(`Invalid UUID hex length: ${hex.length}`)
  }
  // 返回 `BigInt('0x' + hex)`，作为共享工具这次计算的结果。
  return BigInt('0x' + hex)
}

/**
 * Convert an account UUID to a tagged ID in the API's format.
 *
 * @param tag - The tag prefix (e.g. "user", "org")
 * @param uuid - A UUID string (with or without hyphens)
 * @returns Tagged ID string like "user_01PaGUP2rbg1XDh7Z9W1CEpd"
 */
// toTaggedId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toTaggedId(tag: string, uuid: string): string {
  // n保存`uuidToBigInt`，供共享工具后续处理使用。
  const n = uuidToBigInt(uuid)
  // 返回 ``${tag}_${VERSION}${base58Encode(n)}``，作为共享工具这次计算的结果。
  return `${tag}_${VERSION}${base58Encode(n)}`
}
