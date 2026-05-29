// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash, randomBytes } from 'crypto'

// base64URLEncode 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function base64URLEncode(buffer: Buffer): string {
  // 返回 `buffer`，作为服务层 crypto这次计算的结果。
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// generateCodeVerifier 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateCodeVerifier(): string {
  // 返回 `base64URLEncode(randomBytes(32))`，作为服务层 crypto这次计算的结果。
  return base64URLEncode(randomBytes(32))
}

// generateCodeChallenge 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateCodeChallenge(verifier: string): string {
  // hash构建`createHash`，供服务层 crypto后续处理使用。
  const hash = createHash('sha256')
  // 调用 hash.update，触发服务层 crypto此处需要的副作用。
  hash.update(verifier)
  // 返回 `base64URLEncode(hash.digest())`，作为服务层 crypto这次计算的结果。
  return base64URLEncode(hash.digest())
}

// generateState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateState(): string {
  // 返回 `base64URLEncode(randomBytes(32))`，作为服务层 crypto这次计算的结果。
  return base64URLEncode(randomBytes(32))
}
