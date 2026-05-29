// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 接入 queryModelWithStreaming 服务层能力，把外部通信或共享状态交给 ../services/api/claude.js 处理。
import { queryModelWithStreaming } from '../services/api/claude.js'
// 接入 autoCompactIfNeeded 服务层能力，把外部通信或共享状态交给 ../services/compact/autoCompact.js 处理。
import { autoCompactIfNeeded } from '../services/compact/autoCompact.js'
// 接入 microcompactMessages 服务层能力，把外部通信或共享状态交给 ../services/compact/microCompact.js 处理。
import { microcompactMessages } from '../services/compact/microCompact.js'

// -- deps

// I/O dependencies for query(). Passing a `deps` override into QueryParams
// lets tests inject fakes directly instead of spyOn-per-module — the most
// common mocks (callModel, autocompact) are each spied in 6-8 test files
// today with module-import-and-spy boilerplate.
//
// Using `typeof fn` keeps signatures in sync with the real implementations
// automatically. This file imports the real functions for both typing and
// the production factory — tests that import this file for typing are
// already importing query.ts (which imports everything), so there's no
// new module-graph cost.
//
// Scope is intentionally narrow (4 deps) to prove the pattern. Followup
// PRs can add runTools, handleStopHooks, logEvent, queue ops, etc.
// QueryDeps 固化deps里传递的数据形状，帮助调用方按同一结构读写字段。
export type QueryDeps = {
  // -- model
  callModel: typeof queryModelWithStreaming

  // -- compaction
  microcompact: typeof microcompactMessages
  autocompact: typeof autoCompactIfNeeded

  // -- platform
  // 这个回调绑定到 uuid: () => string，负责deps在该局部场景下的响应。
  uuid: () => string
}

// productionDeps 封装deps的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function productionDeps(): QueryDeps {
  // 返回结构化结果，集中表达deps已经整理出的状态。
  return {
    callModel: queryModelWithStreaming,
    microcompact: microcompactMessages,
    autocompact: autoCompactIfNeeded,
    uuid: randomUUID,
  }
}
