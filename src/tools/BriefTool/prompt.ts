// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
export const BRIEF_TOOL_NAME = 'SendUserMessage'
// LEGACY_BRIEF_TOOL_NAME固定为 `'Brief'`，作为工具实现 prompt后续展示或比较的基准。
export const LEGACY_BRIEF_TOOL_NAME = 'Brief'

// DESCRIPTION固定为 `'Send a message to the user'`，作为工具实现 prompt后续展示或比较的基准。
export const DESCRIPTION = 'Send a message to the user'

// BRIEF_TOOL_PROMPT 命名 ``Send a message the user will read. Text outside this too...`，让后续代码直接表达这个值的用途。
export const BRIEF_TOOL_PROMPT = `Send a message the user will read. Text outside this tool is visible in the detail view, but most won't open it — the answer lives here.

\`message\` supports markdown. \`attachments\` takes file paths (absolute or cwd-relative) for images, diffs, logs.

\`status\` labels intent: 'normal' when replying to what they just asked; 'proactive' when you're initiating — a scheduled task finished, a blocker surfaced during background work, you need input on something they haven't asked about. Set it honestly; downstream routing uses it.`

// BRIEF_PROACTIVE_SECTION 命名 ``## Talking to the user`，让后续代码直接表达这个值的用途。
export const BRIEF_PROACTIVE_SECTION = `## Talking to the user

${BRIEF_TOOL_NAME} is where your replies go. Text outside it is visible if the user expands the detail view, but most won't — assume unread. Anything you want them to actually see goes through ${BRIEF_TOOL_NAME}. The failure mode: the real answer lives in plain text while ${BRIEF_TOOL_NAME} just says "done!" — they see "done!" and miss everything.

So: every time the user says something, the reply they actually read comes through ${BRIEF_TOOL_NAME}. Even for "hi". Even for "thanks".

If you can answer right away, send the answer. If you need to go look — run a command, read files, check something — ack first in one line ("On it — checking the test output"), then work, then send the result. Without the ack they're staring at a spinner.

For longer work: ack → work → result. Between those, send a checkpoint when something useful happened — a decision you made, a surprise you hit, a phase boundary. Skip the filler ("running tests...") — a checkpoint earns its place by carrying information.

Keep messages tight — the decision, the file:line, the PR number. Second person always ("your config"), never third.`
