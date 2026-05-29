// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
const stub = { isEnabled: () => false, isHidden: true, name: 'stub' };
export default stub;
// resetLimits 集合保存`stub`，供命令处理斜杠命令 index后续判断或输出使用。
export const resetLimits = stub;
// resetLimitsNonInteractive保存`stub`，供命令处理斜杠命令 index后续判断或输出使用。
export const resetLimitsNonInteractive = stub;
