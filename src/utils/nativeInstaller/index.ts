// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
/**
 * Native Installer - Public API
 *
 * This is the barrel file that exports only the functions actually used by external modules.
 * External modules should only import from this file.
 */

// Re-export only the functions that are actually used
// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export {
  checkInstall,
  cleanupNpmInstallations,
  cleanupOldVersions,
  cleanupShellAliases,
  installLatest,
  lockCurrentVersion,
  removeInstalledSymlink,
  type SetupMessage,
} from './installer.js'
