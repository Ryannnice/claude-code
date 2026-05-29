// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
const version = process.env.CLAUDE_CODE_LOCAL_VERSION ?? '999.0.0-local';
// packageUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
const packageUrl = process.env.CLAUDE_CODE_LOCAL_PACKAGE_URL ?? 'claude-code-local';
// buildTime记录时间`Date`，供preload后续处理使用。
const buildTime = process.env.CLAUDE_CODE_LOCAL_BUILD_TIME ?? new Date().toISOString();

// preload在这里处理 `process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= '1'`，完成这一小步状态转换。
process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH ??= '1';

// 调用 Object.assign，触发preload此处需要的副作用。
Object.assign(globalThis, {
  MACRO: {
    VERSION: version,
    PACKAGE_URL: packageUrl,
    NATIVE_PACKAGE_URL: packageUrl,
    BUILD_TIME: buildTime,
    FEEDBACK_CHANNEL: 'local',
    VERSION_CHANGELOG: '',
    ISSUES_EXPLAINER: '',
  },
});
