// 类型依赖 { AddressFamily, LookupAddress as AxiosLookupAddress } 来自 axios，用于校准共享工具的数据契约。
import type { AddressFamily, LookupAddress as AxiosLookupAddress } from 'axios'
// 引入 lookup as dnsLookup，将 dns 中已经封装好的能力接到本文件流程里。
import { lookup as dnsLookup } from 'dns'
// 引入 isIP，将 net 中已经封装好的能力接到本文件流程里。
import { isIP } from 'net'

/**
 * SSRF guard for HTTP hooks.
 *
 * Blocks private, link-local, and other non-routable address ranges to prevent
 * project-configured HTTP hooks from reaching cloud metadata endpoints
 * (169.254.169.254) or internal infrastructure.
 *
 * Loopback (127.0.0.0/8, ::1) is intentionally ALLOWED — local dev policy
 * servers are a primary HTTP hook use case.
 *
 * When a global proxy or the sandbox network proxy is in use, the guard is
 * effectively bypassed for the target host because the proxy performs DNS
 * resolution. The sandbox proxy enforces its own domain allowlist.
 */

/**
 * Returns true if the address is in a range that HTTP hooks should not reach.
 *
 * Blocked IPv4:
 *   0.0.0.0/8        "this" network
 *   10.0.0.0/8       private
 *   100.64.0.0/10    shared address space / CGNAT (some cloud metadata, e.g. Alibaba 100.100.100.200)
 *   169.254.0.0/16   link-local (cloud metadata)
 *   172.16.0.0/12    private
 *   192.168.0.0/16   private
 *
 * Blocked IPv6:
 *   ::               unspecified
 *   fc00::/7         unique local
 *   fe80::/10        link-local
 *   ::ffff:<v4>      mapped IPv4 in a blocked range
 *
 * Allowed (returns false):
 *   127.0.0.0/8      loopback (local dev hooks)
 *   ::1              loopback
 *   everything else
 */
// isBlockedAddress 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBlockedAddress(address: string): boolean {
  // v保存`isIP`，供共享工具后续处理使用。
  const v = isIP(address)
  // 满足 `v === 4` 时，共享工具执行该分支。
  if (v === 4) {
    // 返回 `isBlockedV4(address)`，作为共享工具这次计算的结果。
    return isBlockedV4(address)
  }
  // 满足 `v === 6` 时，共享工具执行该分支。
  if (v === 6) {
    // 返回 `isBlockedV6(address)`，作为共享工具这次计算的结果。
    return isBlockedV6(address)
  }
  // Not a valid IP literal — let the real DNS path handle it (this function
  // is only called on results from dns.lookup, which always returns valid IPs)
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// isBlockedV4 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBlockedV4(address: string): boolean {
  // 片段列表格式化`address.split`，供共享工具后续处理使用。
  const parts = address.split('.').map(Number)
  // 从 `parts` 按位置拆出 a、b，让React hook ssrf Guard分别处理这些返回值。
  const [a, b] = parts
  // 共享工具在这里按实际状态进入对应分支。
  if (
    parts.length !== 4 ||
    a === undefined ||
    b === undefined ||
    // 调用 parts.some，触发共享工具此处需要的副作用。
    parts.some(n => Number.isNaN(n))
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Loopback explicitly allowed
  // 满足 `a === 127` 时，共享工具执行该分支。
  if (a === 127) return false

  // 0.0.0.0/8
  // 满足 `a === 0` 时，共享工具执行该分支。
  if (a === 0) return true
  // 10.0.0.0/8
  // 满足 `a === 10` 时，共享工具执行该分支。
  if (a === 10) return true
  // 169.254.0.0/16 — link-local, cloud metadata
  // 只有 `a === 169 && b === 254` 满足时，共享工具才执行该分支。
  if (a === 169 && b === 254) return true
  // 172.16.0.0/12
  // 只有 `a === 172 && b >= 16 && b <= 31` 满足时，共享工具才执行该分支。
  if (a === 172 && b >= 16 && b <= 31) return true
  // 100.64.0.0/10 — shared address space (RFC 6598, CGNAT). Some cloud
  // providers use this range for metadata endpoints (e.g. Alibaba Cloud at
  // 100.100.100.200).
  // 只有 `a === 100 && b >= 64 && b <= 127` 满足时，共享工具才执行该分支。
  if (a === 100 && b >= 64 && b <= 127) return true
  // 192.168.0.0/16
  // 只有 `a === 192 && b === 168` 满足时，共享工具才执行该分支。
  if (a === 192 && b === 168) return true

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// isBlockedV6 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBlockedV6(address: string): boolean {
  // lower保存`address.toLowerCase`，供共享工具后续处理使用。
  const lower = address.toLowerCase()

  // ::1 loopback explicitly allowed
  // 当 `lower` 匹配 `'::1'` 时，共享工具执行对应分支。
  if (lower === '::1') return false

  // :: unspecified
  // 当 `lower` 匹配 `'::'` 时，共享工具执行对应分支。
  if (lower === '::') return true

  // IPv4-mapped IPv6 (0:0:0:0:0:ffff:X:Y in any representation — ::ffff:a.b.c.d,
  // ::ffff:XXXX:YYYY, expanded, or partially expanded). Extract the embedded
  // IPv4 address and delegate to the v4 check. Without this, hex-form mapped
  // addresses (e.g. ::ffff:a9fe:a9fe = 169.254.169.254) bypass the guard.
  // mappedV4保存`extractMappedIPv4`，供共享工具后续处理使用。
  const mappedV4 = extractMappedIPv4(lower)
  // `mappedV4` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (mappedV4 !== null) {
    // 返回 `isBlockedV4(mappedV4)`，作为共享工具这次计算的结果。
    return isBlockedV4(mappedV4)
  }

  // fc00::/7 — unique local addresses (fc00:: through fdff::)
  // 只有 `lower.startsWith('fc') || lower.startsWith('fd')` 满足时，共享工具才执行该分支。
  if (lower.startsWith('fc') || lower.startsWith('fd')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // fe80::/10 — link-local. The /10 means fe80 through febf, but the first
  // hextet is always fe80 in practice (RFC 4291 requires the next 54 bits
  // to be zero). Check both to be safe.
  // firstHextet格式化`lower.split`，供共享工具后续处理使用。
  const firstHextet = lower.split(':')[0]
  // 共享工具在这里按实际状态进入对应分支。
  if (
    firstHextet &&
    firstHextet.length === 4 &&
    firstHextet >= 'fe80' &&
    firstHextet <= 'febf'
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Expand `::` and optional trailing dotted-decimal so an IPv6 address is
 * represented as exactly 8 hex groups. Returns null if expansion is not
 * well-formed (the caller has already validated with isIP, so this is
 * defensive).
 */
// expandIPv6Groups 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function expandIPv6Groups(addr: string): number[] | null {
  // Handle trailing dotted-decimal IPv4 (e.g. ::ffff:169.254.169.254).
  // Replace it with its two hex groups so the rest of the expansion is uniform.
  // tailHextets 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let tailHextets: number[] = []
  // 满足 `addr.includes('.')` 时，共享工具执行该分支。
  if (addr.includes('.')) {
    // lastColon保存`addr.lastIndexOf`，供共享工具后续处理使用。
    const lastColon = addr.lastIndexOf(':')
    // v4格式化`addr.slice`，供共享工具后续处理使用。
    const v4 = addr.slice(lastColon + 1)
    // addr更新为 `addr.slice(0, lastColon)`，确保共享工具后续读取最新状态。
    addr = addr.slice(0, lastColon)
    // octets 集合格式化`v4.split`，供共享工具后续处理使用。
    const octets = v4.split('.').map(Number)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      octets.length !== 4 ||
      // 调用 octets.some，触发共享工具此处需要的副作用。
      octets.some(n => !Number.isInteger(n) || n < 0 || n > 255)
    ) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // tailHextets 集合更新为 `[`，确保共享工具后续读取最新状态。
    tailHextets = [
      (octets[0]! << 8) | octets[1]!,
      (octets[2]! << 8) | octets[3]!,
    ]
  }

  // Expand `::` (at most one) into the right number of zero groups.
  // dbl保存`addr.indexOf`，供共享工具后续处理使用。
  const dbl = addr.indexOf('::')
  // head 先占位，稍后的条件分支会根据实际输入补齐它。
  let head: string[]
  // tail 先占位，稍后的条件分支会根据实际输入补齐它。
  let tail: string[]
  // 满足 `dbl === -1` 时，共享工具执行该分支。
  if (dbl === -1) {
    // head更新为 `addr.split(':')`，确保共享工具后续读取最新状态。
    head = addr.split(':')
    // tail更新为 `[]`，确保共享工具后续读取最新状态。
    tail = []
  } else {
    // headStr格式化`addr.slice`，供共享工具后续处理使用。
    const headStr = addr.slice(0, dbl)
    // tailStr格式化`addr.slice`，供共享工具后续处理使用。
    const tailStr = addr.slice(dbl + 2)
    // head更新为 `headStr === '' ? [] : headStr.split(':')`，确保共享工具后续读取最新状态。
    head = headStr === '' ? [] : headStr.split(':')
    // tail更新为 `tailStr === '' ? [] : tailStr.split(':')`，确保共享工具后续读取最新状态。
    tail = tailStr === '' ? [] : tailStr.split(':')
  }

  // target 命名 `8 - tailHextets.length`，让后续代码直接表达这个值的用途。
  const target = 8 - tailHextets.length
  // fill 命名 `target - head.length - tail.length`，让后续代码直接表达这个值的用途。
  const fill = target - head.length - tail.length
  // 满足 `fill < 0` 时，共享工具执行该分支。
  if (fill < 0) return null

  // hex保存`fill`，供共享工具后续处理使用。
  const hex = [...head, ...new Array<string>(fill).fill('0'), ...tail]
  // nums 集合派生`hex.map`，供共享工具后续处理使用。
  const nums = hex.map(h => parseInt(h, 16))
  // 只有 `nums.some(n => Number.isNaN(n) || n < 0 || n > 0xffff)` 满足时，共享工具才执行该分支。
  if (nums.some(n => Number.isNaN(n) || n < 0 || n > 0xffff)) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // nums 集合追加新条目，保持收集顺序与输入顺序一致。
  nums.push(...tailHextets)
  // 返回 `nums.length === 8 ? nums : null`，作为共享工具这次计算的结果。
  return nums.length === 8 ? nums : null
}

/**
 * Extract the embedded IPv4 address from an IPv4-mapped IPv6 address
 * (0:0:0:0:0:ffff:X:Y) in any valid representation — compressed, expanded,
 * hex groups, or trailing dotted-decimal. Returns null if the address is
 * not an IPv4-mapped IPv6 address.
 */
// extractMappedIPv4 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractMappedIPv4(addr: string): string | null {
  // g保存`expandIPv6Groups`，供共享工具后续处理使用。
  const g = expandIPv6Groups(addr)
  // g缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!g) return null
  // IPv4-mapped: first 80 bits zero, next 16 bits ffff, last 32 bits = IPv4
  // 共享工具在这里按实际状态进入对应分支。
  if (
    g[0] === 0 &&
    g[1] === 0 &&
    g[2] === 0 &&
    g[3] === 0 &&
    g[4] === 0 &&
    g[5] === 0xffff
  ) {
    // hi 命名 `g[6]!`，让后续代码直接表达这个值的用途。
    const hi = g[6]!
    // lo读取 `g[7]!` 对应条目，后续围绕该成员继续处理。
    const lo = g[7]!
    // 返回 ``${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}``，作为共享工具这次计算的结果。
    return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * A dns.lookup-compatible function that resolves a hostname and rejects
 * addresses in blocked ranges. Used as the `lookup` option in axios request
 * config so that the validated IP is the one the socket connects to — no
 * rebinding window between validation and connection.
 *
 * IP literals in the hostname are validated directly without DNS.
 *
 * Signature matches axios's `lookup` config option (not Node's dns.lookup).
 */
// ssrfGuardedLookup 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ssrfGuardedLookup(
  hostname: string,
  options: object,
  // React hook ssrf Guard在这里处理 `callback: (`，完成这一小步状态转换。
  callback: (
    err: Error | null,
    address: AxiosLookupAddress | AxiosLookupAddress[],
    family?: AddressFamily,
  ) => void,
): void {
  // wantsAll标记共享工具React hook ssrf Guard是否启用对应路径。
  const wantsAll = 'all' in options && options.all === true

  // If hostname is already an IP literal, validate it directly. dns.lookup
  // would short-circuit too, but checking here gives a clearer error and
  // avoids any platform-specific lookup behavior for literals.
  // ipVersion保存`isIP`，供共享工具后续处理使用。
  const ipVersion = isIP(hostname)
  // `ipVersion` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (ipVersion !== 0) {
    // 满足 `isBlockedAddress(hostname)` 时，共享工具执行该分支。
    if (isBlockedAddress(hostname)) {
      // 调用 callback，触发共享工具此处需要的副作用。
      callback(ssrfError(hostname, hostname), '')
      // React hook ssrf Guard在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // family标记共享工具React hook ssrf Guard是否启用对应路径。
    const family = ipVersion === 6 ? 6 : 4
    // 满足 `wantsAll` 时，共享工具执行该分支。
    if (wantsAll) {
      // 调用 callback，触发共享工具此处需要的副作用。
      callback(null, [{ address: hostname, family }])
    } else {
      // 调用 callback，触发共享工具此处需要的副作用。
      callback(null, hostname, family)
    }
    // React hook ssrf Guard在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 调用 dnsLookup，触发共享工具此处需要的副作用。
  dnsLookup(hostname, { all: true }, (err, addresses) => {
    // 满足 `err` 时，共享工具执行该分支。
    if (err) {
      // 调用 callback，触发共享工具此处需要的副作用。
      callback(err, '')
      // React hook ssrf Guard在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 循环处理 `const { address } of addresses`，让共享工具逐项把同类条目按顺序走完。
    for (const { address } of addresses) {
      // 满足 `isBlockedAddress(address)` 时，共享工具执行该分支。
      if (isBlockedAddress(address)) {
        // 调用 callback，触发共享工具此处需要的副作用。
        callback(ssrfError(hostname, address), '')
        // React hook ssrf Guard在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }

    // first 命名 `addresses[0]`，让后续代码直接表达这个值的用途。
    const first = addresses[0]
    // first缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!first) {
      // 调用 callback，触发共享工具此处需要的副作用。
      callback(
        Object.assign(new Error(`ENOTFOUND ${hostname}`), {
          code: 'ENOTFOUND',
          hostname,
        }),
        '',
      )
      // React hook ssrf Guard在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // family标记共享工具React hook ssrf Guard是否启用对应路径。
    const family = first.family === 6 ? 6 : 4
    // 满足 `wantsAll` 时，共享工具执行该分支。
    if (wantsAll) {
      // 调用 callback，触发共享工具此处需要的副作用。
      callback(
        null,
        // 调用 addresses.map，触发共享工具此处需要的副作用。
        addresses.map(a => ({
          address: a.address,
          family: a.family === 6 ? 6 : 4,
        })),
      )
    } else {
      // 调用 callback，触发共享工具此处需要的副作用。
      callback(null, first.address, family)
    }
  })
}

// ssrfError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ssrfError(hostname: string, address: string): NodeJS.ErrnoException {
  // err保存`Error`，供共享工具后续处理使用。
  const err = new Error(
    `HTTP hook blocked: ${hostname} resolves to ${address} (private/link-local address). Loopback (127.0.0.1, ::1) is allowed for local dev.`,
  )
  // 返回 `Object.assign(err, {`，作为共享工具这次计算的结果。
  return Object.assign(err, {
    code: 'ERR_HTTP_HOOK_BLOCKED_ADDRESS',
    hostname,
    address,
  })
}
