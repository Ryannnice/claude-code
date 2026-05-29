// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
/**
 * Constants for the official Anthropic plugins marketplace.
 *
 * The official marketplace is hosted on GitHub and provides first-party
 * plugins developed by Anthropic. This file defines the constants needed
 * to install and identify this marketplace.
 */

// 类型依赖 { MarketplaceSource } 来自 ./schemas.js，用于校准插件管理的数据契约。
import type { MarketplaceSource } from './schemas.js'

/**
 * Source configuration for the official Anthropic plugins marketplace.
 * Used when auto-installing the marketplace on startup.
 */
// OFFICIAL_MARKETPLACE_SOURCE 市场数据 集中保存插件工具 official Marketplace要一起传递的字段。
export const OFFICIAL_MARKETPLACE_SOURCE = {
  source: 'github',
  repo: 'anthropics/claude-plugins-official',
} as const satisfies MarketplaceSource

/**
 * Display name for the official marketplace.
 * This is the name under which the marketplace will be registered
 * in the known_marketplaces.json file.
 */
// OFFICIAL_MARKETPLACE_NAME 市场数据固定为 `'claude-plugins-official'`，作为插件工具 official Marketplace后续展示或比较的基准。
export const OFFICIAL_MARKETPLACE_NAME = 'claude-plugins-official'
