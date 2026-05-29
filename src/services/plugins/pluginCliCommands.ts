/**
 * CLI command wrappers for plugin operations
 *
 * This module provides thin wrappers around the core plugin operations
 * that handle CLI-specific concerns like console output and process exit.
 *
 * For the core operations (without CLI side effects), see pluginOperations.ts
 */
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 gracefulShutdown 工具函数，把通用处理留在 ../../utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from '../../utils/gracefulShutdown.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getManagedPluginNames 工具函数，把通用处理留在 ../../utils/plugins/managedPlugins.js 中维护。
import { getManagedPluginNames } from '../../utils/plugins/managedPlugins.js'
// 复用 parsePluginIdentifier 工具函数，把通用处理留在 ../../utils/plugins/pluginIdentifier.js 中维护。
import { parsePluginIdentifier } from '../../utils/plugins/pluginIdentifier.js'
// 类型依赖 { PluginScope } 来自 ../../utils/plugins/schemas.js，用于校准服务层 plugin Cli Commands的数据契约。
import type { PluginScope } from '../../utils/plugins/schemas.js'
// 复用 writeToStdout 工具函数，把通用处理留在 ../../utils/process.js 中维护。
import { writeToStdout } from '../../utils/process.js'
// 整理这一组导入，让服务层 plugin Cli Commands后续逻辑可以直接复用这些外部能力。
import {
  buildPluginTelemetryFields,
  classifyPluginCommandError,
} from '../../utils/telemetry/pluginTelemetry.js'
// 整理这一组导入，让服务层 plugin Cli Commands后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../analytics/index.js'
// 整理这一组导入，让服务层 plugin Cli Commands后续逻辑可以直接复用这些外部能力。
import {
  disableAllPluginsOp,
  disablePluginOp,
  enablePluginOp,
  type InstallableScope,
  installPluginOp,
  uninstallPluginOp,
  updatePluginOp,
  VALID_INSTALLABLE_SCOPES,
  VALID_UPDATE_SCOPES,
} from './pluginOperations.js'

// 重新导出这一组成员，让服务层 plugin Cli Commands的公共 API 保持集中入口。
export { VALID_INSTALLABLE_SCOPES, VALID_UPDATE_SCOPES }

// PluginCliCommand 固化服务层 plugin Cli Commands里传递的数据形状，帮助调用方按同一结构读写字段。
type PluginCliCommand =
  | 'install'
  | 'uninstall'
  | 'enable'
  | 'disable'
  | 'disable-all'
  | 'update'

/**
 * Generic error handler for plugin CLI commands. Emits
 * tengu_plugin_command_failed before exit so dashboards can compute a
 * success rate against the corresponding success events.
 */
// handlePluginCommandError 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handlePluginCommandError(
  error: unknown,
  command: PluginCliCommand,
  plugin?: string,
): never {
  // 记录服务层 plugin Cli Commands运行诊断，方便排查异常路径或性能问题。
  logError(error)
  // operation保存`plugin`，供服务层 plugin Cli Commands后续判断或输出使用。
  const operation = plugin
    ? `${command} plugin "${plugin}"`
    : command === 'disable-all'
      ? 'disable all plugins'
      : `${command} plugins`
  // biome-ignore lint/suspicious/noConsole:: intentional console output
  // 调用 console.error，触发服务层 plugin Cli Commands此处需要的副作用。
  console.error(
    `${figures.cross} Failed to ${operation}: ${errorMessage(error)}`,
  )
  // telemetryFields 集合保存`plugin`，供服务层 plugin Cli Commands后续判断或输出使用。
  const telemetryFields = plugin
    // 这个回调绑定到 ? (() => {，负责服务层 plugin Cli Commands在该局部场景下的响应。
    ? (() => {
        // 从 `parsePluginIdentifier(plugin)` 解构 name、marketplace，减少服务层 plugin Cli Commands对同一对象的重复访问。
        const { name, marketplace } = parsePluginIdentifier(plugin)
        // 返回结构化结果，集中表达服务层 plugin Cli Commands已经整理出的状态。
        return {
          _PROTO_plugin_name:
            name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
          ...(marketplace && {
            _PROTO_marketplace_name:
              marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
          }),
          ...buildPluginTelemetryFields(
            name,
            marketplace,
            getManagedPluginNames(),
          ),
        }
      })()
    : {}
  // 记录服务层 plugin Cli Commands运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_plugin_command_failed', {
    command:
      command as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    error_category: classifyPluginCommandError(
      error,
    ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...telemetryFields,
  })
  // eslint-disable-next-line custom-rules/no-process-exit
  // 调用 process.exit，触发服务层 plugin Cli Commands此处需要的副作用。
  process.exit(1)
}

/**
 * CLI command: Install a plugin non-interactively
 * @param plugin Plugin identifier (name or plugin@marketplace)
 * @param scope Installation scope: user, project, or local (defaults to 'user')
 */
// installPlugin 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installPlugin(
  plugin: string,
  scope: InstallableScope = 'user',
): Promise<void> {
  // 保护这一段可能失败的服务层 plugin Cli Commands操作，确保异常能进入相邻错误处理。
  try {
    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发服务层 plugin Cli Commands此处需要的副作用。
    console.log(`Installing plugin "${plugin}"...`)

    // 结果保存`installPluginOp`，供服务层 plugin Cli Commands后续处理使用。
    const result = await installPluginOp(plugin, scope)

    // result.success 集合缺失时提前走兜底路径，避免服务层 plugin Cli Commands继续依赖无效输入。
    if (!result.success) {
      // 抛出 new Error(result.message)，阻止服务层 plugin Cli Commands在无效状态下继续运行。
      throw new Error(result.message)
    }

    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发服务层 plugin Cli Commands此处需要的副作用。
    console.log(`${figures.tick} ${result.message}`)

    // _PROTO_* routes to PII-tagged plugin_name/marketplace_name BQ columns.
    // Unredacted plugin_id was previously logged to general-access
    // additional_metadata for all users — dropped in favor of the privileged
    // column route.
    // 从 `parsePluginIdentifier(` 解构 name、marketplace，减少服务层 plugin Cli Commands对同一对象的重复访问。
    const { name, marketplace } = parsePluginIdentifier(
      result.pluginId || plugin,
    )
    // 记录服务层 plugin Cli Commands运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_installed_cli', {
      _PROTO_plugin_name:
        name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      ...(marketplace && {
        _PROTO_marketplace_name:
          marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      }),
      scope: (result.scope ||
        scope) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      install_source:
        'cli-explicit' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...buildPluginTelemetryFields(name, marketplace, getManagedPluginNames()),
    })

    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发服务层 plugin Cli Commands此处需要的副作用。
    process.exit(0)
  } catch (error) {
    // 调用 handlePluginCommandError，触发服务层 plugin Cli Commands此处需要的副作用。
    handlePluginCommandError(error, 'install', plugin)
  }
}

/**
 * CLI command: Uninstall a plugin non-interactively
 * @param plugin Plugin name or plugin@marketplace identifier
 * @param scope Uninstall from scope: user, project, or local (defaults to 'user')
 */
// uninstallPlugin 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function uninstallPlugin(
  plugin: string,
  scope: InstallableScope = 'user',
  keepData = false,
): Promise<void> {
  // 保护这一段可能失败的服务层 plugin Cli Commands操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`uninstallPluginOp`，供服务层 plugin Cli Commands后续处理使用。
    const result = await uninstallPluginOp(plugin, scope, !keepData)

    // result.success 集合缺失时提前走兜底路径，避免服务层 plugin Cli Commands继续依赖无效输入。
    if (!result.success) {
      // 抛出 new Error(result.message)，阻止服务层 plugin Cli Commands在无效状态下继续运行。
      throw new Error(result.message)
    }

    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发服务层 plugin Cli Commands此处需要的副作用。
    console.log(`${figures.tick} ${result.message}`)

    // 从 `parsePluginIdentifier(` 解构 name、marketplace，减少服务层 plugin Cli Commands对同一对象的重复访问。
    const { name, marketplace } = parsePluginIdentifier(
      result.pluginId || plugin,
    )
    // 记录服务层 plugin Cli Commands运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_uninstalled_cli', {
      _PROTO_plugin_name:
        name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      ...(marketplace && {
        _PROTO_marketplace_name:
          marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      }),
      scope: (result.scope ||
        scope) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...buildPluginTelemetryFields(name, marketplace, getManagedPluginNames()),
    })

    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发服务层 plugin Cli Commands此处需要的副作用。
    process.exit(0)
  } catch (error) {
    // 调用 handlePluginCommandError，触发服务层 plugin Cli Commands此处需要的副作用。
    handlePluginCommandError(error, 'uninstall', plugin)
  }
}

/**
 * CLI command: Enable a plugin non-interactively
 * @param plugin Plugin name or plugin@marketplace identifier
 * @param scope Optional scope. If not provided, finds the most specific scope for the current project.
 */
// enablePlugin 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function enablePlugin(
  plugin: string,
  scope?: InstallableScope,
): Promise<void> {
  // 保护这一段可能失败的服务层 plugin Cli Commands操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`enablePluginOp`，供服务层 plugin Cli Commands后续处理使用。
    const result = await enablePluginOp(plugin, scope)

    // result.success 集合缺失时提前走兜底路径，避免服务层 plugin Cli Commands继续依赖无效输入。
    if (!result.success) {
      // 抛出 new Error(result.message)，阻止服务层 plugin Cli Commands在无效状态下继续运行。
      throw new Error(result.message)
    }

    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发服务层 plugin Cli Commands此处需要的副作用。
    console.log(`${figures.tick} ${result.message}`)

    // 从 `parsePluginIdentifier(` 解构 name、marketplace，减少服务层 plugin Cli Commands对同一对象的重复访问。
    const { name, marketplace } = parsePluginIdentifier(
      result.pluginId || plugin,
    )
    // 记录服务层 plugin Cli Commands运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_enabled_cli', {
      _PROTO_plugin_name:
        name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      ...(marketplace && {
        _PROTO_marketplace_name:
          marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      }),
      scope:
        result.scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...buildPluginTelemetryFields(name, marketplace, getManagedPluginNames()),
    })

    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发服务层 plugin Cli Commands此处需要的副作用。
    process.exit(0)
  } catch (error) {
    // 调用 handlePluginCommandError，触发服务层 plugin Cli Commands此处需要的副作用。
    handlePluginCommandError(error, 'enable', plugin)
  }
}

/**
 * CLI command: Disable a plugin non-interactively
 * @param plugin Plugin name or plugin@marketplace identifier
 * @param scope Optional scope. If not provided, finds the most specific scope for the current project.
 */
// disablePlugin 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function disablePlugin(
  plugin: string,
  scope?: InstallableScope,
): Promise<void> {
  // 保护这一段可能失败的服务层 plugin Cli Commands操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`disablePluginOp`，供服务层 plugin Cli Commands后续处理使用。
    const result = await disablePluginOp(plugin, scope)

    // result.success 集合缺失时提前走兜底路径，避免服务层 plugin Cli Commands继续依赖无效输入。
    if (!result.success) {
      // 抛出 new Error(result.message)，阻止服务层 plugin Cli Commands在无效状态下继续运行。
      throw new Error(result.message)
    }

    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发服务层 plugin Cli Commands此处需要的副作用。
    console.log(`${figures.tick} ${result.message}`)

    // 从 `parsePluginIdentifier(` 解构 name、marketplace，减少服务层 plugin Cli Commands对同一对象的重复访问。
    const { name, marketplace } = parsePluginIdentifier(
      result.pluginId || plugin,
    )
    // 记录服务层 plugin Cli Commands运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_disabled_cli', {
      _PROTO_plugin_name:
        name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      ...(marketplace && {
        _PROTO_marketplace_name:
          marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      }),
      scope:
        result.scope as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...buildPluginTelemetryFields(name, marketplace, getManagedPluginNames()),
    })

    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发服务层 plugin Cli Commands此处需要的副作用。
    process.exit(0)
  } catch (error) {
    // 调用 handlePluginCommandError，触发服务层 plugin Cli Commands此处需要的副作用。
    handlePluginCommandError(error, 'disable', plugin)
  }
}

/**
 * CLI command: Disable all enabled plugins non-interactively
 */
// disableAllPlugins 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function disableAllPlugins(): Promise<void> {
  // 保护这一段可能失败的服务层 plugin Cli Commands操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`disableAllPluginsOp`，供服务层 plugin Cli Commands后续处理使用。
    const result = await disableAllPluginsOp()

    // result.success 集合缺失时提前走兜底路径，避免服务层 plugin Cli Commands继续依赖无效输入。
    if (!result.success) {
      // 抛出 new Error(result.message)，阻止服务层 plugin Cli Commands在无效状态下继续运行。
      throw new Error(result.message)
    }

    // biome-ignore lint/suspicious/noConsole:: intentional console output
    // 调用 console.log，触发服务层 plugin Cli Commands此处需要的副作用。
    console.log(`${figures.tick} ${result.message}`)

    // 记录服务层 plugin Cli Commands运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_plugin_disabled_all_cli', {})

    // eslint-disable-next-line custom-rules/no-process-exit
    // 调用 process.exit，触发服务层 plugin Cli Commands此处需要的副作用。
    process.exit(0)
  } catch (error) {
    // 调用 handlePluginCommandError，触发服务层 plugin Cli Commands此处需要的副作用。
    handlePluginCommandError(error, 'disable-all')
  }
}

/**
 * CLI command: Update a plugin non-interactively
 * @param plugin Plugin name or plugin@marketplace identifier
 * @param scope Scope to update
 */
// updatePluginCli 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updatePluginCli(
  plugin: string,
  scope: PluginScope,
): Promise<void> {
  // 保护这一段可能失败的服务层 plugin Cli Commands操作，确保异常能进入相邻错误处理。
  try {
    // 调用 writeToStdout，触发服务层 plugin Cli Commands此处需要的副作用。
    writeToStdout(
      `Checking for updates for plugin "${plugin}" at ${scope} scope…\n`,
    )

    // 结果保存`updatePluginOp`，供服务层 plugin Cli Commands后续处理使用。
    const result = await updatePluginOp(plugin, scope)

    // result.success 集合缺失时提前走兜底路径，避免服务层 plugin Cli Commands继续依赖无效输入。
    if (!result.success) {
      // 抛出 new Error(result.message)，阻止服务层 plugin Cli Commands在无效状态下继续运行。
      throw new Error(result.message)
    }

    // 调用 writeToStdout，触发服务层 plugin Cli Commands此处需要的副作用。
    writeToStdout(`${figures.tick} ${result.message}\n`)

    // result.alreadyUpToDate缺失时提前走兜底路径，避免服务层 plugin Cli Commands继续依赖无效输入。
    if (!result.alreadyUpToDate) {
      // 从 `parsePluginIdentifier(` 解构 name、marketplace，减少服务层 plugin Cli Commands对同一对象的重复访问。
      const { name, marketplace } = parsePluginIdentifier(
        result.pluginId || plugin,
      )
      // 记录服务层 plugin Cli Commands运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_plugin_updated_cli', {
        _PROTO_plugin_name:
          name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
        ...(marketplace && {
          _PROTO_marketplace_name:
            marketplace as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
        }),
        old_version: (result.oldVersion ||
          'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        new_version: (result.newVersion ||
          'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...buildPluginTelemetryFields(
          name,
          marketplace,
          getManagedPluginNames(),
        ),
      })
    }

    // 等待 `gracefulShutdown(0)` 完成，再继续服务层 plugin Cli Commands的异步流程。
    await gracefulShutdown(0)
  } catch (error) {
    // 调用 handlePluginCommandError，触发服务层 plugin Cli Commands此处需要的副作用。
    handlePluginCommandError(error, 'update', plugin)
  }
}
