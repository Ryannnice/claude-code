// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
// These constants are in a separate file to avoid circular dependency issues.
// Do NOT add imports to this file - it must remain dependency-free.

// NOTIFICATION_CHANNELS 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const NOTIFICATION_CHANNELS = [
  'auto',
  'iterm2',
  'iterm2_with_bell',
  'terminal_bell',
  'kitty',
  'ghostty',
  'notifications_disabled',
] as const

// Valid editor modes (excludes deprecated 'emacs' which is auto-migrated to 'normal')
// EDITOR_MODES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const EDITOR_MODES = ['normal', 'vim'] as const

// Valid teammate modes for spawning
// 'tmux' = traditional tmux-based teammates
// 'in-process' = in-process teammates running in same process
// 'auto' = automatically choose based on context (default)
// TEAMMATE_MODES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const TEAMMATE_MODES = ['auto', 'tmux', 'in-process'] as const
