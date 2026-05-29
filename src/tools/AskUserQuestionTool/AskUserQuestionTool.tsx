// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 getAllowedChannels、getQuestionPreviewFormat，将 src/bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getAllowedChannels, getQuestionPreviewFormat } from 'src/bootstrap/state.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from 'src/components/MessageResponse.js';
// 引入 BLACK_CIRCLE，将 src/constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE } from 'src/constants/figures.js';
// 复用 getModeColor 工具函数，把通用处理留在 src/utils/permissions/PermissionMode.js 中维护。
import { getModeColor } from 'src/utils/permissions/PermissionMode.js';
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tool } from '../../Tool.js';
// 引入 buildTool、ToolDef，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { buildTool, type ToolDef } from '../../Tool.js';
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js';
// 引入 ASK_USER_QUESTION_TOOL_CHIP_WIDTH、ASK_USER_QUESTION_TOOL_NAME、ASK_USER_QUESTION_TOOL_PROMPT、DESCRIPTION、PREVIEW_FEATURE_PROMPT，将 ./prompt.js 中已经封装好的能力接到本文件流程里。
import { ASK_USER_QUESTION_TOOL_CHIP_WIDTH, ASK_USER_QUESTION_TOOL_NAME, ASK_USER_QUESTION_TOOL_PROMPT, DESCRIPTION, PREVIEW_FEATURE_PROMPT } from './prompt.js';
// questionOptionSchema保存`lazySchema`，供工具调用后续处理使用。
const questionOptionSchema = lazySchema(() => z.object({
  label: z.string().describe('The display text for this option that the user will see and select. Should be concise (1-5 words) and clearly describe the choice.'),
  description: z.string().describe('Explanation of what this option means or what will happen if chosen. Useful for providing context about trade-offs or implications.'),
  preview: z.string().optional().describe('Optional preview content rendered when this option is focused. Use for mockups, code snippets, or visual comparisons that help users compare options. See the tool description for the expected content format.')
}));
// questionSchema保存`lazySchema`，供工具调用后续处理使用。
const questionSchema = lazySchema(() => z.object({
  question: z.string().describe('The complete question to ask the user. Should be clear, specific, and end with a question mark. Example: "Which library should we use for date formatting?" If multiSelect is true, phrase it accordingly, e.g. "Which features do you want to enable?"'),
  header: z.string().describe(`Very short label displayed as a chip/tag (max ${ASK_USER_QUESTION_TOOL_CHIP_WIDTH} chars). Examples: "Auth method", "Library", "Approach".`),
  options: z.array(questionOptionSchema()).min(2).max(4).describe(`The available choices for this question. Must have 2-4 options. Each option should be a distinct, mutually exclusive choice (unless multiSelect is enabled). There should be no 'Other' option, that will be provided automatically.`),
  multiSelect: z.boolean().default(false).describe('Set to true to allow the user to select multiple options instead of just one. Use when choices are not mutually exclusive.')
}));
// annotationsSchema保存`lazySchema`，供工具调用后续处理使用。
const annotationsSchema = lazySchema(() => {
  // annotationSchema保存`z.object`，供工具调用后续处理使用。
  const annotationSchema = z.object({
    preview: z.string().optional().describe('The preview content of the selected option, if the question used previews.'),
    notes: z.string().optional().describe('Free-text notes the user added to their selection.')
  });
  // 返回 `z.record(z.string(), annotationSchema).optional().describe('Optional pe...`，作为工具调用这次计算的结果。
  return z.record(z.string(), annotationSchema).optional().describe('Optional per-question annotations from the user (e.g., notes on preview selections). Keyed by question text.');
});
// UNIQUENESS_REFINE集中保存工具实现 Ask User Question Tool要一起传递的字段。
const UNIQUENESS_REFINE = {
  // 工具实现 Ask User Question Tool在这里处理 `check: (data: {`，完成这一小步状态转换。
  check: (data: {
    questions: {
      question: string;
      options: {
        label: string;
      }[];
    }[];
  }) => {
    // questions 集合派生`questions.map`，供工具调用后续处理使用。
    const questions = data.questions.map(q => q.question);
    // `questions.length` 与 `new Set(questions).size` 不一致时刷新派生状态，避免使用过期结果。
    if (questions.length !== new Set(questions).size) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 按顺序遍历 `data.questions` 中的question，逐个交给工具调用处理。
    for (const question of data.questions) {
      // labels 集合派生`options.map`，供工具调用后续处理使用。
      const labels = question.options.map(opt => opt.label);
      // `labels.length` 与 `new Set(labels).size` 不一致时刷新派生状态，避免使用过期结果。
      if (labels.length !== new Set(labels).size) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false;
      }
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  },
  message: 'Question texts must be unique, option labels must be unique within each question'
} as const;
// commonFields 集合保存`lazySchema`，供工具调用后续处理使用。
const commonFields = lazySchema(() => ({
  answers: z.record(z.string(), z.string()).optional().describe('User answers collected by the permission component'),
  annotations: annotationsSchema(),
  metadata: z.object({
    source: z.string().optional().describe('Optional identifier for the source of this question (e.g., "remember" for /remember command). Used for analytics tracking.')
  }).optional().describe('Optional metadata for tracking and analytics purposes. Not displayed to user.')
}));
// inputSchema保存`lazySchema`，供工具调用后续处理使用。
const inputSchema = lazySchema(() => z.strictObject({
  questions: z.array(questionSchema()).min(1).max(4).describe('Questions to ask the user (1-4 questions)'),
  ...commonFields()
}).refine(UNIQUENESS_REFINE.check, {
  message: UNIQUENESS_REFINE.message
}));
// InputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type InputSchema = ReturnType<typeof inputSchema>;
// outputSchema保存`lazySchema`，供工具调用后续处理使用。
const outputSchema = lazySchema(() => z.object({
  questions: z.array(questionSchema()).describe('The questions that were asked'),
  answers: z.record(z.string(), z.string()).describe('The answers provided by the user (question text -> answer string; multi-select answers are comma-separated)'),
  annotations: annotationsSchema()
}));
// OutputSchema 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type OutputSchema = ReturnType<typeof outputSchema>;

// SDK schemas are identical to internal schemas now that `preview` and
// `annotations` are public (configurable via `toolConfig.askUserQuestion`).
// _sdkInputSchema保存`inputSchema`，供后续判断或组装使用。
export const _sdkInputSchema = inputSchema;
// _sdkOutputSchema保存`outputSchema`，供工具实现 Ask User Question Tool后续判断或输出使用。
export const _sdkOutputSchema = outputSchema;
// Question 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Question = z.infer<ReturnType<typeof questionSchema>>;
// QuestionOption 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type QuestionOption = z.infer<ReturnType<typeof questionOptionSchema>>;
// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type Output = z.infer<OutputSchema>;
// AskUserQuestionResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function AskUserQuestionResultMessage(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    answers
  } = t0;
  // t1 暂存 `<Box flexDirection="row"><Text color={getModeColor("defau...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Box flexDirection="row"><Text color={getModeColor("defau...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box flexDirection="row"><Text color={getModeColor("default")}>{BLACK_CIRCLE} </Text><Text>User answered Claude's questions:</Text></Box>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2暂存 `<Box flexDirection="column" marginTop={1}>{t1}<MessageRes...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== answers) {
    // t2暂存 `<Box flexDirection="column" marginTop={1}>{t1}<MessageRes...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box flexDirection="column" marginTop={1}>{t1}<MessageResponse><Box flexDirection="column">{Object.entries(answers).map(_temp)}</Box></MessageResponse></Box>;
    // $[1] 缓存 `answers`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = answers;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 返回 t2，把工具调用这个分支的结果交还调用方。
  return t2;
}
// _temp 承担工具调用中的独立步骤，串起工具实现 Ask User Question Tool需要的输入整理、状态更新和结果输出。
function _temp(t0) {
  // 从 `t0` 按位置拆出 questionText、answer，让工具实现 Ask User Question Tool分别处理这些返回值。
  const [questionText, answer] = t0;
  // 返回 <Text key={questionText} color="inactive">· {questionText} → {answer}</Text>，把工具调用这个分支的结果交还调用方。
  return <Text key={questionText} color="inactive">· {questionText} → {answer}</Text>;
}
// AskUserQuestionTool构建`buildTool({`，供工具实现 Ask User Question Tool后续步骤使用。
export const AskUserQuestionTool: Tool<InputSchema, Output> = buildTool({
  name: ASK_USER_QUESTION_TOOL_NAME,
  searchHint: 'prompt the user with a multiple-choice question',
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  // description 使用 无 完成工具调用里的对应操作。
  async description() {
    // 返回 DESCRIPTION，把工具调用这个分支的结果交还调用方。
    return DESCRIPTION;
  },
  // prompt 使用 无 完成工具调用里的对应操作。
  async prompt() {
    // format读取`getQuestionPreviewFormat`，供工具调用后续处理使用。
    const format = getQuestionPreviewFormat();
    // 满足 `format === undefined` 时，工具调用执行该分支。
    if (format === undefined) {
      // SDK consumer that hasn't opted into a preview format — omit preview
      // guidance (they may not render the field at all).
      // 返回 `ASK_USER_QUESTION_TOOL_PROMPT`，作为工具调用这次计算的结果。
      return ASK_USER_QUESTION_TOOL_PROMPT;
    }
    // 返回 `ASK_USER_QUESTION_TOOL_PROMPT + PREVIEW_FEATURE_PROMPT[format]`，作为工具调用这次计算的结果。
    return ASK_USER_QUESTION_TOOL_PROMPT + PREVIEW_FEATURE_PROMPT[format];
  },
  // 工具实现 Ask User Question Tool在这里处理 `get inputSchema(): InputSchema {`，完成这一小步状态转换。
  get inputSchema(): InputSchema {
    // 返回 `inputSchema()`，作为工具调用这次计算的结果。
    return inputSchema();
  },
  // 工具实现 Ask User Question Tool在这里处理 `get outputSchema(): OutputSchema {`，完成这一小步状态转换。
  get outputSchema(): OutputSchema {
    // 返回 `outputSchema()`，作为工具调用这次计算的结果。
    return outputSchema();
  },
  // userFacingName 使用 无 完成工具调用里的对应操作。
  userFacingName() {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return '';
  },
  // isEnabled 用 无 判断工具调用是否满足条件。
  isEnabled() {
    // When --channels is active the user is likely on Telegram/Discord, not
    // watching the TUI. The multiple-choice dialog would hang with nobody at
    // the keyboard. Channel permission relay already skips
    // requiresUserInteraction() tools (interactiveHandler.ts) so there's
    // no alternate approval path.
    // 只有 `(feature('KAIROS') || feature('KAIROS_CHANNELS')) && getAllowedChannels().l...` 满足时，工具调用才执行该分支。
    if ((feature('KAIROS') || feature('KAIROS_CHANNELS')) && getAllowedChannels().length > 0) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  },
  // isConcurrencySafe 用 无 判断工具调用是否满足条件。
  isConcurrencySafe() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  },
  // isReadOnly 用 无 判断工具调用是否满足条件。
  isReadOnly() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  },
  // toAutoClassifierInput 使用 input 完成工具调用里的对应操作。
  toAutoClassifierInput(input) {
    // 返回 `input.questions.map(q => q.question).join(' | ')`，作为工具调用这次计算的结果。
    return input.questions.map(q => q.question).join(' | ');
  },
  // requiresUserInteraction 使用 无 完成工具调用里的对应操作。
  requiresUserInteraction() {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  },
  async validateInput({
    questions
  }) {
    // `getQuestionPreviewFormat()` 与 `'html'` 不一致时刷新派生状态，避免使用过期结果。
    if (getQuestionPreviewFormat() !== 'html') {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        result: true
      };
    }
    // 按顺序遍历 `questions` 中的q，逐个交给工具调用处理。
    for (const q of questions) {
      // 按顺序遍历 `q.options` 中的opt，逐个交给工具调用处理。
      for (const opt of q.options) {
        // err读取`validateHtmlPreview`，供工具调用后续处理使用。
        const err = validateHtmlPreview(opt.preview);
        // 满足 `err` 时，工具调用执行该分支。
        if (err) {
          // 返回结构化结果，集中表达工具调用已经整理出的状态。
          return {
            result: false,
            message: `Option "${opt.label}" in question "${q.question}": ${err}`,
            errorCode: 1
          };
        }
      }
    }
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      result: true
    };
  },
  // checkPermissions 使用 input 完成工具调用里的对应操作。
  async checkPermissions(input) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask' as const,
      message: 'Answer questions?',
      updatedInput: input
    };
  },
  // renderToolUseMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  },
  // renderToolUseProgressMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseProgressMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  },
  renderToolResultMessage({
    answers
  }, _toolUseID) {
    // 返回 `<AskUserQuestionResultMessage answers={answers} />`，作为工具调用这次计算的结果。
    return <AskUserQuestionResultMessage answers={answers} />;
  },
  // renderToolUseRejectedMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseRejectedMessage() {
    // 返回 `<Box flexDirection="row" marginTop={1}>`，作为工具调用这次计算的结果。
    return <Box flexDirection="row" marginTop={1}>
        <Text color={getModeColor('default')}>{BLACK_CIRCLE}&nbsp;</Text>
        <Text>User declined to answer questions</Text>
      </Box>;
  },
  // renderToolUseErrorMessage 使用 无 完成工具调用里的对应操作。
  renderToolUseErrorMessage() {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  },
  async call({
    questions,
    answers = {},
    annotations
  }, _context) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      data: {
        questions,
        answers,
        ...(annotations && {
          annotations
        })
      }
    };
  },
  // 调用 mapToolResultToToolResultBlockParam，触发工具调用此处需要的副作用。
  mapToolResultToToolResultBlockParam({
    answers,
    annotations
  }, toolUseID) {
    // answersText派生`Object.entries`，供工具调用后续处理使用。
    const answersText = Object.entries(answers).map(([questionText, answer]) => {
      // annotation读取 `annotations?.[questionText]` 对应条目，后续围绕该成员继续处理。
      const annotation = annotations?.[questionText];
      // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
      const parts = [`"${questionText}"="${answer}"`];
      // 满足 `annotation?.preview` 时，工具调用执行该分支。
      if (annotation?.preview) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`selected preview:\n${annotation.preview}`);
      }
      // 满足 `annotation?.notes` 时，工具调用执行该分支。
      if (annotation?.notes) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`user notes: ${annotation.notes}`);
      }
      // 返回 `parts.join(' ')`，作为工具调用这次计算的结果。
      return parts.join(' ');
    }).join(', ');
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      type: 'tool_result',
      content: `User has answered your questions: ${answersText}. You can now continue with the user's answers in mind.`,
      tool_use_id: toolUseID
    };
  }
} satisfies ToolDef<InputSchema, Output>);

// Lightweight HTML fragment check. Not a parser — HTML5 parsers are
// error-recovering by spec and accept anything. We're checking model intent
// (did it emit HTML?) and catching the specific things we told it not to do.
// validateHtmlPreview 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateHtmlPreview(preview: string | undefined): string | null {
  // 满足 `preview === undefined` 时，工具调用执行该分支。
  if (preview === undefined) return null;
  // 满足 `/<\s*(html|body|!doctype)\b/i.test(preview)` 时，工具调用执行该分支。
  if (/<\s*(html|body|!doctype)\b/i.test(preview)) {
    // 返回 `'preview must be an HTML fragment, not a full document (no <html>, <bod...`，作为工具调用这次计算的结果。
    return 'preview must be an HTML fragment, not a full document (no <html>, <body>, or <!DOCTYPE>)';
  }
  // SDK consumers typically set this via innerHTML — disallow executable/style
  // tags so a preview can't run code or restyle the host page. Inline event
  // handlers (onclick etc.) are still possible; consumers should sanitize.
  // 满足 `/<\s*(script|style)\b/i.test(preview)` 时，工具调用执行该分支。
  if (/<\s*(script|style)\b/i.test(preview)) {
    // 返回 `'preview must not contain <script> or <style> tags. Use inline styles v...`，作为工具调用这次计算的结果。
    return 'preview must not contain <script> or <style> tags. Use inline styles via the style attribute if needed.';
  }
  // 满足 `!/<[a-z][^>]*>/i.test(preview)` 时，工具调用执行该分支。
  if (!/<[a-z][^>]*>/i.test(preview)) {
    // 返回 `'preview must contain HTML (previewFormat is set to "html"). Wrap conte...`，作为工具调用这次计算的结果。
    return 'preview must contain HTML (previewFormat is set to "html"). Wrap content in a tag like <div> or <pre>.';
  }
  // 返回 `null`，作为工具调用这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiUmVhY3QiLCJnZXRBbGxvd2VkQ2hhbm5lbHMiLCJnZXRRdWVzdGlvblByZXZpZXdGb3JtYXQiLCJNZXNzYWdlUmVzcG9uc2UiLCJCTEFDS19DSVJDTEUiLCJnZXRNb2RlQ29sb3IiLCJ6IiwiQm94IiwiVGV4dCIsIlRvb2wiLCJidWlsZFRvb2wiLCJUb29sRGVmIiwibGF6eVNjaGVtYSIsIkFTS19VU0VSX1FVRVNUSU9OX1RPT0xfQ0hJUF9XSURUSCIsIkFTS19VU0VSX1FVRVNUSU9OX1RPT0xfTkFNRSIsIkFTS19VU0VSX1FVRVNUSU9OX1RPT0xfUFJPTVBUIiwiREVTQ1JJUFRJT04iLCJQUkVWSUVXX0ZFQVRVUkVfUFJPTVBUIiwicXVlc3Rpb25PcHRpb25TY2hlbWEiLCJvYmplY3QiLCJsYWJlbCIsInN0cmluZyIsImRlc2NyaWJlIiwiZGVzY3JpcHRpb24iLCJwcmV2aWV3Iiwib3B0aW9uYWwiLCJxdWVzdGlvblNjaGVtYSIsInF1ZXN0aW9uIiwiaGVhZGVyIiwib3B0aW9ucyIsImFycmF5IiwibWluIiwibWF4IiwibXVsdGlTZWxlY3QiLCJib29sZWFuIiwiZGVmYXVsdCIsImFubm90YXRpb25zU2NoZW1hIiwiYW5ub3RhdGlvblNjaGVtYSIsIm5vdGVzIiwicmVjb3JkIiwiVU5JUVVFTkVTU19SRUZJTkUiLCJjaGVjayIsImRhdGEiLCJxdWVzdGlvbnMiLCJtYXAiLCJxIiwibGVuZ3RoIiwiU2V0Iiwic2l6ZSIsImxhYmVscyIsIm9wdCIsIm1lc3NhZ2UiLCJjb25zdCIsImNvbW1vbkZpZWxkcyIsImFuc3dlcnMiLCJhbm5vdGF0aW9ucyIsIm1ldGFkYXRhIiwic291cmNlIiwiaW5wdXRTY2hlbWEiLCJzdHJpY3RPYmplY3QiLCJyZWZpbmUiLCJJbnB1dFNjaGVtYSIsIlJldHVyblR5cGUiLCJvdXRwdXRTY2hlbWEiLCJPdXRwdXRTY2hlbWEiLCJfc2RrSW5wdXRTY2hlbWEiLCJfc2RrT3V0cHV0U2NoZW1hIiwiUXVlc3Rpb24iLCJpbmZlciIsIlF1ZXN0aW9uT3B0aW9uIiwiT3V0cHV0IiwiQXNrVXNlclF1ZXN0aW9uUmVzdWx0TWVzc2FnZSIsInQwIiwiJCIsIl9jIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJ0MiIsIk9iamVjdCIsImVudHJpZXMiLCJfdGVtcCIsInF1ZXN0aW9uVGV4dCIsImFuc3dlciIsIkFza1VzZXJRdWVzdGlvblRvb2wiLCJuYW1lIiwic2VhcmNoSGludCIsIm1heFJlc3VsdFNpemVDaGFycyIsInNob3VsZERlZmVyIiwicHJvbXB0IiwiZm9ybWF0IiwidW5kZWZpbmVkIiwidXNlckZhY2luZ05hbWUiLCJpc0VuYWJsZWQiLCJpc0NvbmN1cnJlbmN5U2FmZSIsImlzUmVhZE9ubHkiLCJ0b0F1dG9DbGFzc2lmaWVySW5wdXQiLCJpbnB1dCIsImpvaW4iLCJyZXF1aXJlc1VzZXJJbnRlcmFjdGlvbiIsInZhbGlkYXRlSW5wdXQiLCJyZXN1bHQiLCJlcnIiLCJ2YWxpZGF0ZUh0bWxQcmV2aWV3IiwiZXJyb3JDb2RlIiwiY2hlY2tQZXJtaXNzaW9ucyIsImJlaGF2aW9yIiwidXBkYXRlZElucHV0IiwicmVuZGVyVG9vbFVzZU1lc3NhZ2UiLCJyZW5kZXJUb29sVXNlUHJvZ3Jlc3NNZXNzYWdlIiwicmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UiLCJfdG9vbFVzZUlEIiwicmVuZGVyVG9vbFVzZVJlamVjdGVkTWVzc2FnZSIsInJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UiLCJjYWxsIiwiX2NvbnRleHQiLCJtYXBUb29sUmVzdWx0VG9Ub29sUmVzdWx0QmxvY2tQYXJhbSIsInRvb2xVc2VJRCIsImFuc3dlcnNUZXh0IiwiYW5ub3RhdGlvbiIsInBhcnRzIiwicHVzaCIsInR5cGUiLCJjb250ZW50IiwidG9vbF91c2VfaWQiLCJ0ZXN0Il0sInNvdXJjZXMiOlsiQXNrVXNlclF1ZXN0aW9uVG9vbC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZmVhdHVyZSB9IGZyb20gJ2J1bjpidW5kbGUnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7XG4gIGdldEFsbG93ZWRDaGFubmVscyxcbiAgZ2V0UXVlc3Rpb25QcmV2aWV3Rm9ybWF0LFxufSBmcm9tICdzcmMvYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnc3JjL2NvbXBvbmVudHMvTWVzc2FnZVJlc3BvbnNlLmpzJ1xuaW1wb3J0IHsgQkxBQ0tfQ0lSQ0xFIH0gZnJvbSAnc3JjL2NvbnN0YW50cy9maWd1cmVzLmpzJ1xuaW1wb3J0IHsgZ2V0TW9kZUNvbG9yIH0gZnJvbSAnc3JjL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25Nb2RlLmpzJ1xuaW1wb3J0IHsgeiB9IGZyb20gJ3pvZC92NCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgVG9vbCB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgeyBidWlsZFRvb2wsIHR5cGUgVG9vbERlZiB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgeyBsYXp5U2NoZW1hIH0gZnJvbSAnLi4vLi4vdXRpbHMvbGF6eVNjaGVtYS5qcydcbmltcG9ydCB7XG4gIEFTS19VU0VSX1FVRVNUSU9OX1RPT0xfQ0hJUF9XSURUSCxcbiAgQVNLX1VTRVJfUVVFU1RJT05fVE9PTF9OQU1FLFxuICBBU0tfVVNFUl9RVUVTVElPTl9UT09MX1BST01QVCxcbiAgREVTQ1JJUFRJT04sXG4gIFBSRVZJRVdfRkVBVFVSRV9QUk9NUFQsXG59IGZyb20gJy4vcHJvbXB0LmpzJ1xuXG5jb25zdCBxdWVzdGlvbk9wdGlvblNjaGVtYSA9IGxhenlTY2hlbWEoKCkgPT5cbiAgei5vYmplY3Qoe1xuICAgIGxhYmVsOiB6XG4gICAgICAuc3RyaW5nKClcbiAgICAgIC5kZXNjcmliZShcbiAgICAgICAgJ1RoZSBkaXNwbGF5IHRleHQgZm9yIHRoaXMgb3B0aW9uIHRoYXQgdGhlIHVzZXIgd2lsbCBzZWUgYW5kIHNlbGVjdC4gU2hvdWxkIGJlIGNvbmNpc2UgKDEtNSB3b3JkcykgYW5kIGNsZWFybHkgZGVzY3JpYmUgdGhlIGNob2ljZS4nLFxuICAgICAgKSxcbiAgICBkZXNjcmlwdGlvbjogelxuICAgICAgLnN0cmluZygpXG4gICAgICAuZGVzY3JpYmUoXG4gICAgICAgICdFeHBsYW5hdGlvbiBvZiB3aGF0IHRoaXMgb3B0aW9uIG1lYW5zIG9yIHdoYXQgd2lsbCBoYXBwZW4gaWYgY2hvc2VuLiBVc2VmdWwgZm9yIHByb3ZpZGluZyBjb250ZXh0IGFib3V0IHRyYWRlLW9mZnMgb3IgaW1wbGljYXRpb25zLicsXG4gICAgICApLFxuICAgIHByZXZpZXc6IHpcbiAgICAgIC5zdHJpbmcoKVxuICAgICAgLm9wdGlvbmFsKClcbiAgICAgIC5kZXNjcmliZShcbiAgICAgICAgJ09wdGlvbmFsIHByZXZpZXcgY29udGVudCByZW5kZXJlZCB3aGVuIHRoaXMgb3B0aW9uIGlzIGZvY3VzZWQuIFVzZSBmb3IgbW9ja3VwcywgY29kZSBzbmlwcGV0cywgb3IgdmlzdWFsIGNvbXBhcmlzb25zIHRoYXQgaGVscCB1c2VycyBjb21wYXJlIG9wdGlvbnMuIFNlZSB0aGUgdG9vbCBkZXNjcmlwdGlvbiBmb3IgdGhlIGV4cGVjdGVkIGNvbnRlbnQgZm9ybWF0LicsXG4gICAgICApLFxuICB9KSxcbilcblxuY29uc3QgcXVlc3Rpb25TY2hlbWEgPSBsYXp5U2NoZW1hKCgpID0+XG4gIHoub2JqZWN0KHtcbiAgICBxdWVzdGlvbjogelxuICAgICAgLnN0cmluZygpXG4gICAgICAuZGVzY3JpYmUoXG4gICAgICAgICdUaGUgY29tcGxldGUgcXVlc3Rpb24gdG8gYXNrIHRoZSB1c2VyLiBTaG91bGQgYmUgY2xlYXIsIHNwZWNpZmljLCBhbmQgZW5kIHdpdGggYSBxdWVzdGlvbiBtYXJrLiBFeGFtcGxlOiBcIldoaWNoIGxpYnJhcnkgc2hvdWxkIHdlIHVzZSBmb3IgZGF0ZSBmb3JtYXR0aW5nP1wiIElmIG11bHRpU2VsZWN0IGlzIHRydWUsIHBocmFzZSBpdCBhY2NvcmRpbmdseSwgZS5nLiBcIldoaWNoIGZlYXR1cmVzIGRvIHlvdSB3YW50IHRvIGVuYWJsZT9cIicsXG4gICAgICApLFxuICAgIGhlYWRlcjogelxuICAgICAgLnN0cmluZygpXG4gICAgICAuZGVzY3JpYmUoXG4gICAgICAgIGBWZXJ5IHNob3J0IGxhYmVsIGRpc3BsYXllZCBhcyBhIGNoaXAvdGFnIChtYXggJHtBU0tfVVNFUl9RVUVTVElPTl9UT09MX0NISVBfV0lEVEh9IGNoYXJzKS4gRXhhbXBsZXM6IFwiQXV0aCBtZXRob2RcIiwgXCJMaWJyYXJ5XCIsIFwiQXBwcm9hY2hcIi5gLFxuICAgICAgKSxcbiAgICBvcHRpb25zOiB6XG4gICAgICAuYXJyYXkocXVlc3Rpb25PcHRpb25TY2hlbWEoKSlcbiAgICAgIC5taW4oMilcbiAgICAgIC5tYXgoNClcbiAgICAgIC5kZXNjcmliZShcbiAgICAgICAgYFRoZSBhdmFpbGFibGUgY2hvaWNlcyBmb3IgdGhpcyBxdWVzdGlvbi4gTXVzdCBoYXZlIDItNCBvcHRpb25zLiBFYWNoIG9wdGlvbiBzaG91bGQgYmUgYSBkaXN0aW5jdCwgbXV0dWFsbHkgZXhjbHVzaXZlIGNob2ljZSAodW5sZXNzIG11bHRpU2VsZWN0IGlzIGVuYWJsZWQpLiBUaGVyZSBzaG91bGQgYmUgbm8gJ090aGVyJyBvcHRpb24sIHRoYXQgd2lsbCBiZSBwcm92aWRlZCBhdXRvbWF0aWNhbGx5LmAsXG4gICAgICApLFxuICAgIG11bHRpU2VsZWN0OiB6XG4gICAgICAuYm9vbGVhbigpXG4gICAgICAuZGVmYXVsdChmYWxzZSlcbiAgICAgIC5kZXNjcmliZShcbiAgICAgICAgJ1NldCB0byB0cnVlIHRvIGFsbG93IHRoZSB1c2VyIHRvIHNlbGVjdCBtdWx0aXBsZSBvcHRpb25zIGluc3RlYWQgb2YganVzdCBvbmUuIFVzZSB3aGVuIGNob2ljZXMgYXJlIG5vdCBtdXR1YWxseSBleGNsdXNpdmUuJyxcbiAgICAgICksXG4gIH0pLFxuKVxuXG5jb25zdCBhbm5vdGF0aW9uc1NjaGVtYSA9IGxhenlTY2hlbWEoKCkgPT4ge1xuICBjb25zdCBhbm5vdGF0aW9uU2NoZW1hID0gei5vYmplY3Qoe1xuICAgIHByZXZpZXc6IHpcbiAgICAgIC5zdHJpbmcoKVxuICAgICAgLm9wdGlvbmFsKClcbiAgICAgIC5kZXNjcmliZShcbiAgICAgICAgJ1RoZSBwcmV2aWV3IGNvbnRlbnQgb2YgdGhlIHNlbGVjdGVkIG9wdGlvbiwgaWYgdGhlIHF1ZXN0aW9uIHVzZWQgcHJldmlld3MuJyxcbiAgICAgICksXG4gICAgbm90ZXM6IHpcbiAgICAgIC5zdHJpbmcoKVxuICAgICAgLm9wdGlvbmFsKClcbiAgICAgIC5kZXNjcmliZSgnRnJlZS10ZXh0IG5vdGVzIHRoZSB1c2VyIGFkZGVkIHRvIHRoZWlyIHNlbGVjdGlvbi4nKSxcbiAgfSlcblxuICByZXR1cm4gelxuICAgIC5yZWNvcmQoei5zdHJpbmcoKSwgYW5ub3RhdGlvblNjaGVtYSlcbiAgICAub3B0aW9uYWwoKVxuICAgIC5kZXNjcmliZShcbiAgICAgICdPcHRpb25hbCBwZXItcXVlc3Rpb24gYW5ub3RhdGlvbnMgZnJvbSB0aGUgdXNlciAoZS5nLiwgbm90ZXMgb24gcHJldmlldyBzZWxlY3Rpb25zKS4gS2V5ZWQgYnkgcXVlc3Rpb24gdGV4dC4nLFxuICAgIClcbn0pXG5cbmNvbnN0IFVOSVFVRU5FU1NfUkVGSU5FID0ge1xuICBjaGVjazogKGRhdGE6IHtcbiAgICBxdWVzdGlvbnM6IHsgcXVlc3Rpb246IHN0cmluZzsgb3B0aW9uczogeyBsYWJlbDogc3RyaW5nIH1bXSB9W11cbiAgfSkgPT4ge1xuICAgIGNvbnN0IHF1ZXN0aW9ucyA9IGRhdGEucXVlc3Rpb25zLm1hcChxID0+IHEucXVlc3Rpb24pXG4gICAgaWYgKHF1ZXN0aW9ucy5sZW5ndGggIT09IG5ldyBTZXQocXVlc3Rpb25zKS5zaXplKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgZm9yIChjb25zdCBxdWVzdGlvbiBvZiBkYXRhLnF1ZXN0aW9ucykge1xuICAgICAgY29uc3QgbGFiZWxzID0gcXVlc3Rpb24ub3B0aW9ucy5tYXAob3B0ID0+IG9wdC5sYWJlbClcbiAgICAgIGlmIChsYWJlbHMubGVuZ3RoICE9PSBuZXcgU2V0KGxhYmVscykuc2l6ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfSxcbiAgbWVzc2FnZTpcbiAgICAnUXVlc3Rpb24gdGV4dHMgbXVzdCBiZSB1bmlxdWUsIG9wdGlvbiBsYWJlbHMgbXVzdCBiZSB1bmlxdWUgd2l0aGluIGVhY2ggcXVlc3Rpb24nLFxufSBhcyBjb25zdFxuXG5jb25zdCBjb21tb25GaWVsZHMgPSBsYXp5U2NoZW1hKCgpID0+ICh7XG4gIGFuc3dlcnM6IHpcbiAgICAucmVjb3JkKHouc3RyaW5nKCksIHouc3RyaW5nKCkpXG4gICAgLm9wdGlvbmFsKClcbiAgICAuZGVzY3JpYmUoJ1VzZXIgYW5zd2VycyBjb2xsZWN0ZWQgYnkgdGhlIHBlcm1pc3Npb24gY29tcG9uZW50JyksXG4gIGFubm90YXRpb25zOiBhbm5vdGF0aW9uc1NjaGVtYSgpLFxuICBtZXRhZGF0YTogelxuICAgIC5vYmplY3Qoe1xuICAgICAgc291cmNlOiB6XG4gICAgICAgIC5zdHJpbmcoKVxuICAgICAgICAub3B0aW9uYWwoKVxuICAgICAgICAuZGVzY3JpYmUoXG4gICAgICAgICAgJ09wdGlvbmFsIGlkZW50aWZpZXIgZm9yIHRoZSBzb3VyY2Ugb2YgdGhpcyBxdWVzdGlvbiAoZS5nLiwgXCJyZW1lbWJlclwiIGZvciAvcmVtZW1iZXIgY29tbWFuZCkuIFVzZWQgZm9yIGFuYWx5dGljcyB0cmFja2luZy4nLFxuICAgICAgICApLFxuICAgIH0pXG4gICAgLm9wdGlvbmFsKClcbiAgICAuZGVzY3JpYmUoXG4gICAgICAnT3B0aW9uYWwgbWV0YWRhdGEgZm9yIHRyYWNraW5nIGFuZCBhbmFseXRpY3MgcHVycG9zZXMuIE5vdCBkaXNwbGF5ZWQgdG8gdXNlci4nLFxuICAgICksXG59KSlcblxuY29uc3QgaW5wdXRTY2hlbWEgPSBsYXp5U2NoZW1hKCgpID0+XG4gIHpcbiAgICAuc3RyaWN0T2JqZWN0KHtcbiAgICAgIHF1ZXN0aW9uczogelxuICAgICAgICAuYXJyYXkocXVlc3Rpb25TY2hlbWEoKSlcbiAgICAgICAgLm1pbigxKVxuICAgICAgICAubWF4KDQpXG4gICAgICAgIC5kZXNjcmliZSgnUXVlc3Rpb25zIHRvIGFzayB0aGUgdXNlciAoMS00IHF1ZXN0aW9ucyknKSxcbiAgICAgIC4uLmNvbW1vbkZpZWxkcygpLFxuICAgIH0pXG4gICAgLnJlZmluZShVTklRVUVORVNTX1JFRklORS5jaGVjaywge1xuICAgICAgbWVzc2FnZTogVU5JUVVFTkVTU19SRUZJTkUubWVzc2FnZSxcbiAgICB9KSxcbilcbnR5cGUgSW5wdXRTY2hlbWEgPSBSZXR1cm5UeXBlPHR5cGVvZiBpbnB1dFNjaGVtYT5cblxuY29uc3Qgb3V0cHV0U2NoZW1hID0gbGF6eVNjaGVtYSgoKSA9PlxuICB6Lm9iamVjdCh7XG4gICAgcXVlc3Rpb25zOiB6XG4gICAgICAuYXJyYXkocXVlc3Rpb25TY2hlbWEoKSlcbiAgICAgIC5kZXNjcmliZSgnVGhlIHF1ZXN0aW9ucyB0aGF0IHdlcmUgYXNrZWQnKSxcbiAgICBhbnN3ZXJzOiB6XG4gICAgICAucmVjb3JkKHouc3RyaW5nKCksIHouc3RyaW5nKCkpXG4gICAgICAuZGVzY3JpYmUoXG4gICAgICAgICdUaGUgYW5zd2VycyBwcm92aWRlZCBieSB0aGUgdXNlciAocXVlc3Rpb24gdGV4dCAtPiBhbnN3ZXIgc3RyaW5nOyBtdWx0aS1zZWxlY3QgYW5zd2VycyBhcmUgY29tbWEtc2VwYXJhdGVkKScsXG4gICAgICApLFxuICAgIGFubm90YXRpb25zOiBhbm5vdGF0aW9uc1NjaGVtYSgpLFxuICB9KSxcbilcbnR5cGUgT3V0cHV0U2NoZW1hID0gUmV0dXJuVHlwZTx0eXBlb2Ygb3V0cHV0U2NoZW1hPlxuXG4vLyBTREsgc2NoZW1hcyBhcmUgaWRlbnRpY2FsIHRvIGludGVybmFsIHNjaGVtYXMgbm93IHRoYXQgYHByZXZpZXdgIGFuZFxuLy8gYGFubm90YXRpb25zYCBhcmUgcHVibGljIChjb25maWd1cmFibGUgdmlhIGB0b29sQ29uZmlnLmFza1VzZXJRdWVzdGlvbmApLlxuZXhwb3J0IGNvbnN0IF9zZGtJbnB1dFNjaGVtYSA9IGlucHV0U2NoZW1hXG5leHBvcnQgY29uc3QgX3Nka091dHB1dFNjaGVtYSA9IG91dHB1dFNjaGVtYVxuXG5leHBvcnQgdHlwZSBRdWVzdGlvbiA9IHouaW5mZXI8UmV0dXJuVHlwZTx0eXBlb2YgcXVlc3Rpb25TY2hlbWE+PlxuZXhwb3J0IHR5cGUgUXVlc3Rpb25PcHRpb24gPSB6LmluZmVyPFJldHVyblR5cGU8dHlwZW9mIHF1ZXN0aW9uT3B0aW9uU2NoZW1hPj5cbmV4cG9ydCB0eXBlIE91dHB1dCA9IHouaW5mZXI8T3V0cHV0U2NoZW1hPlxuXG5mdW5jdGlvbiBBc2tVc2VyUXVlc3Rpb25SZXN1bHRNZXNzYWdlKHtcbiAgYW5zd2Vycyxcbn06IHtcbiAgYW5zd2VyczogT3V0cHV0WydhbnN3ZXJzJ11cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17MX0+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIj5cbiAgICAgICAgPFRleHQgY29sb3I9e2dldE1vZGVDb2xvcignZGVmYXVsdCcpfT57QkxBQ0tfQ0lSQ0xFfSZuYnNwOzwvVGV4dD5cbiAgICAgICAgPFRleHQ+VXNlciBhbnN3ZXJlZCBDbGF1ZGUmYXBvcztzIHF1ZXN0aW9uczo8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIHtPYmplY3QuZW50cmllcyhhbnN3ZXJzKS5tYXAoKFtxdWVzdGlvblRleHQsIGFuc3dlcl0pID0+IChcbiAgICAgICAgICAgIDxUZXh0IGtleT17cXVlc3Rpb25UZXh0fSBjb2xvcj1cImluYWN0aXZlXCI+XG4gICAgICAgICAgICAgIMK3IHtxdWVzdGlvblRleHR9IOKGkiB7YW5zd2VyfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICkpfVxuICAgICAgICA8L0JveD5cbiAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIDwvQm94PlxuICApXG59XG5cbmV4cG9ydCBjb25zdCBBc2tVc2VyUXVlc3Rpb25Ub29sOiBUb29sPElucHV0U2NoZW1hLCBPdXRwdXQ+ID0gYnVpbGRUb29sKHtcbiAgbmFtZTogQVNLX1VTRVJfUVVFU1RJT05fVE9PTF9OQU1FLFxuICBzZWFyY2hIaW50OiAncHJvbXB0IHRoZSB1c2VyIHdpdGggYSBtdWx0aXBsZS1jaG9pY2UgcXVlc3Rpb24nLFxuICBtYXhSZXN1bHRTaXplQ2hhcnM6IDEwMF8wMDAsXG4gIHNob3VsZERlZmVyOiB0cnVlLFxuICBhc3luYyBkZXNjcmlwdGlvbigpIHtcbiAgICByZXR1cm4gREVTQ1JJUFRJT05cbiAgfSxcbiAgYXN5bmMgcHJvbXB0KCkge1xuICAgIGNvbnN0IGZvcm1hdCA9IGdldFF1ZXN0aW9uUHJldmlld0Zvcm1hdCgpXG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBTREsgY29uc3VtZXIgdGhhdCBoYXNuJ3Qgb3B0ZWQgaW50byBhIHByZXZpZXcgZm9ybWF0IOKAlCBvbWl0IHByZXZpZXdcbiAgICAgIC8vIGd1aWRhbmNlICh0aGV5IG1heSBub3QgcmVuZGVyIHRoZSBmaWVsZCBhdCBhbGwpLlxuICAgICAgcmV0dXJuIEFTS19VU0VSX1FVRVNUSU9OX1RPT0xfUFJPTVBUXG4gICAgfVxuICAgIHJldHVybiBBU0tfVVNFUl9RVUVTVElPTl9UT09MX1BST01QVCArIFBSRVZJRVdfRkVBVFVSRV9QUk9NUFRbZm9ybWF0XVxuICB9LFxuICBnZXQgaW5wdXRTY2hlbWEoKTogSW5wdXRTY2hlbWEge1xuICAgIHJldHVybiBpbnB1dFNjaGVtYSgpXG4gIH0sXG4gIGdldCBvdXRwdXRTY2hlbWEoKTogT3V0cHV0U2NoZW1hIHtcbiAgICByZXR1cm4gb3V0cHV0U2NoZW1hKClcbiAgfSxcbiAgdXNlckZhY2luZ05hbWUoKSB7XG4gICAgcmV0dXJuICcnXG4gIH0sXG4gIGlzRW5hYmxlZCgpIHtcbiAgICAvLyBXaGVuIC0tY2hhbm5lbHMgaXMgYWN0aXZlIHRoZSB1c2VyIGlzIGxpa2VseSBvbiBUZWxlZ3JhbS9EaXNjb3JkLCBub3RcbiAgICAvLyB3YXRjaGluZyB0aGUgVFVJLiBUaGUgbXVsdGlwbGUtY2hvaWNlIGRpYWxvZyB3b3VsZCBoYW5nIHdpdGggbm9ib2R5IGF0XG4gICAgLy8gdGhlIGtleWJvYXJkLiBDaGFubmVsIHBlcm1pc3Npb24gcmVsYXkgYWxyZWFkeSBza2lwc1xuICAgIC8vIHJlcXVpcmVzVXNlckludGVyYWN0aW9uKCkgdG9vbHMgKGludGVyYWN0aXZlSGFuZGxlci50cykgc28gdGhlcmUnc1xuICAgIC8vIG5vIGFsdGVybmF0ZSBhcHByb3ZhbCBwYXRoLlxuICAgIGlmIChcbiAgICAgIChmZWF0dXJlKCdLQUlST1MnKSB8fCBmZWF0dXJlKCdLQUlST1NfQ0hBTk5FTFMnKSkgJiZcbiAgICAgIGdldEFsbG93ZWRDaGFubmVscygpLmxlbmd0aCA+IDBcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9LFxuICBpc0NvbmN1cnJlbmN5U2FmZSgpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9LFxuICBpc1JlYWRPbmx5KCkge1xuICAgIHJldHVybiB0cnVlXG4gIH0sXG4gIHRvQXV0b0NsYXNzaWZpZXJJbnB1dChpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dC5xdWVzdGlvbnMubWFwKHEgPT4gcS5xdWVzdGlvbikuam9pbignIHwgJylcbiAgfSxcbiAgcmVxdWlyZXNVc2VySW50ZXJhY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfSxcbiAgYXN5bmMgdmFsaWRhdGVJbnB1dCh7IHF1ZXN0aW9ucyB9KSB7XG4gICAgaWYgKGdldFF1ZXN0aW9uUHJldmlld0Zvcm1hdCgpICE9PSAnaHRtbCcpIHtcbiAgICAgIHJldHVybiB7IHJlc3VsdDogdHJ1ZSB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgcSBvZiBxdWVzdGlvbnMpIHtcbiAgICAgIGZvciAoY29uc3Qgb3B0IG9mIHEub3B0aW9ucykge1xuICAgICAgICBjb25zdCBlcnIgPSB2YWxpZGF0ZUh0bWxQcmV2aWV3KG9wdC5wcmV2aWV3KVxuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiBgT3B0aW9uIFwiJHtvcHQubGFiZWx9XCIgaW4gcXVlc3Rpb24gXCIke3EucXVlc3Rpb259XCI6ICR7ZXJyfWAsXG4gICAgICAgICAgICBlcnJvckNvZGU6IDEsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHJlc3VsdDogdHJ1ZSB9XG4gIH0sXG4gIGFzeW5jIGNoZWNrUGVybWlzc2lvbnMoaW5wdXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYmVoYXZpb3I6ICdhc2snIGFzIGNvbnN0LFxuICAgICAgbWVzc2FnZTogJ0Fuc3dlciBxdWVzdGlvbnM/JyxcbiAgICAgIHVwZGF0ZWRJbnB1dDogaW5wdXQsXG4gICAgfVxuICB9LFxuICByZW5kZXJUb29sVXNlTWVzc2FnZSgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9LFxuICByZW5kZXJUb29sVXNlUHJvZ3Jlc3NNZXNzYWdlKCkge1xuICAgIHJldHVybiBudWxsXG4gIH0sXG4gIHJlbmRlclRvb2xSZXN1bHRNZXNzYWdlKHsgYW5zd2VycyB9LCBfdG9vbFVzZUlEKSB7XG4gICAgcmV0dXJuIDxBc2tVc2VyUXVlc3Rpb25SZXN1bHRNZXNzYWdlIGFuc3dlcnM9e2Fuc3dlcnN9IC8+XG4gIH0sXG4gIHJlbmRlclRvb2xVc2VSZWplY3RlZE1lc3NhZ2UoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiIG1hcmdpblRvcD17MX0+XG4gICAgICAgIDxUZXh0IGNvbG9yPXtnZXRNb2RlQ29sb3IoJ2RlZmF1bHQnKX0+e0JMQUNLX0NJUkNMRX0mbmJzcDs8L1RleHQ+XG4gICAgICAgIDxUZXh0PlVzZXIgZGVjbGluZWQgdG8gYW5zd2VyIHF1ZXN0aW9uczwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfSxcbiAgcmVuZGVyVG9vbFVzZUVycm9yTWVzc2FnZSgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9LFxuICBhc3luYyBjYWxsKHsgcXVlc3Rpb25zLCBhbnN3ZXJzID0ge30sIGFubm90YXRpb25zIH0sIF9jb250ZXh0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRhdGE6IHsgcXVlc3Rpb25zLCBhbnN3ZXJzLCAuLi4oYW5ub3RhdGlvbnMgJiYgeyBhbm5vdGF0aW9ucyB9KSB9LFxuICAgIH1cbiAgfSxcbiAgbWFwVG9vbFJlc3VsdFRvVG9vbFJlc3VsdEJsb2NrUGFyYW0oeyBhbnN3ZXJzLCBhbm5vdGF0aW9ucyB9LCB0b29sVXNlSUQpIHtcbiAgICBjb25zdCBhbnN3ZXJzVGV4dCA9IE9iamVjdC5lbnRyaWVzKGFuc3dlcnMpXG4gICAgICAubWFwKChbcXVlc3Rpb25UZXh0LCBhbnN3ZXJdKSA9PiB7XG4gICAgICAgIGNvbnN0IGFubm90YXRpb24gPSBhbm5vdGF0aW9ucz8uW3F1ZXN0aW9uVGV4dF1cbiAgICAgICAgY29uc3QgcGFydHMgPSBbYFwiJHtxdWVzdGlvblRleHR9XCI9XCIke2Fuc3dlcn1cImBdXG4gICAgICAgIGlmIChhbm5vdGF0aW9uPy5wcmV2aWV3KSB7XG4gICAgICAgICAgcGFydHMucHVzaChgc2VsZWN0ZWQgcHJldmlldzpcXG4ke2Fubm90YXRpb24ucHJldmlld31gKVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbm5vdGF0aW9uPy5ub3Rlcykge1xuICAgICAgICAgIHBhcnRzLnB1c2goYHVzZXIgbm90ZXM6ICR7YW5ub3RhdGlvbi5ub3Rlc31gKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcgJylcbiAgICAgIH0pXG4gICAgICAuam9pbignLCAnKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICd0b29sX3Jlc3VsdCcsXG4gICAgICBjb250ZW50OiBgVXNlciBoYXMgYW5zd2VyZWQgeW91ciBxdWVzdGlvbnM6ICR7YW5zd2Vyc1RleHR9LiBZb3UgY2FuIG5vdyBjb250aW51ZSB3aXRoIHRoZSB1c2VyJ3MgYW5zd2VycyBpbiBtaW5kLmAsXG4gICAgICB0b29sX3VzZV9pZDogdG9vbFVzZUlELFxuICAgIH1cbiAgfSxcbn0gc2F0aXNmaWVzIFRvb2xEZWY8SW5wdXRTY2hlbWEsIE91dHB1dD4pXG5cbi8vIExpZ2h0d2VpZ2h0IEhUTUwgZnJhZ21lbnQgY2hlY2suIE5vdCBhIHBhcnNlciDigJQgSFRNTDUgcGFyc2VycyBhcmVcbi8vIGVycm9yLXJlY292ZXJpbmcgYnkgc3BlYyBhbmQgYWNjZXB0IGFueXRoaW5nLiBXZSdyZSBjaGVja2luZyBtb2RlbCBpbnRlbnRcbi8vIChkaWQgaXQgZW1pdCBIVE1MPykgYW5kIGNhdGNoaW5nIHRoZSBzcGVjaWZpYyB0aGluZ3Mgd2UgdG9sZCBpdCBub3QgdG8gZG8uXG5mdW5jdGlvbiB2YWxpZGF0ZUh0bWxQcmV2aWV3KHByZXZpZXc6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IG51bGwge1xuICBpZiAocHJldmlldyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gbnVsbFxuICBpZiAoLzxcXHMqKGh0bWx8Ym9keXwhZG9jdHlwZSlcXGIvaS50ZXN0KHByZXZpZXcpKSB7XG4gICAgcmV0dXJuICdwcmV2aWV3IG11c3QgYmUgYW4gSFRNTCBmcmFnbWVudCwgbm90IGEgZnVsbCBkb2N1bWVudCAobm8gPGh0bWw+LCA8Ym9keT4sIG9yIDwhRE9DVFlQRT4pJ1xuICB9XG4gIC8vIFNESyBjb25zdW1lcnMgdHlwaWNhbGx5IHNldCB0aGlzIHZpYSBpbm5lckhUTUwg4oCUIGRpc2FsbG93IGV4ZWN1dGFibGUvc3R5bGVcbiAgLy8gdGFncyBzbyBhIHByZXZpZXcgY2FuJ3QgcnVuIGNvZGUgb3IgcmVzdHlsZSB0aGUgaG9zdCBwYWdlLiBJbmxpbmUgZXZlbnRcbiAgLy8gaGFuZGxlcnMgKG9uY2xpY2sgZXRjLikgYXJlIHN0aWxsIHBvc3NpYmxlOyBjb25zdW1lcnMgc2hvdWxkIHNhbml0aXplLlxuICBpZiAoLzxcXHMqKHNjcmlwdHxzdHlsZSlcXGIvaS50ZXN0KHByZXZpZXcpKSB7XG4gICAgcmV0dXJuICdwcmV2aWV3IG11c3Qgbm90IGNvbnRhaW4gPHNjcmlwdD4gb3IgPHN0eWxlPiB0YWdzLiBVc2UgaW5saW5lIHN0eWxlcyB2aWEgdGhlIHN0eWxlIGF0dHJpYnV0ZSBpZiBuZWVkZWQuJ1xuICB9XG4gIGlmICghLzxbYS16XVtePl0qPi9pLnRlc3QocHJldmlldykpIHtcbiAgICByZXR1cm4gJ3ByZXZpZXcgbXVzdCBjb250YWluIEhUTUwgKHByZXZpZXdGb3JtYXQgaXMgc2V0IHRvIFwiaHRtbFwiKS4gV3JhcCBjb250ZW50IGluIGEgdGFnIGxpa2UgPGRpdj4gb3IgPHByZT4uJ1xuICB9XG4gIHJldHVybiBudWxsXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxPQUFPLFFBQVEsWUFBWTtBQUNwQyxPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQ0VDLGtCQUFrQixFQUNsQkMsd0JBQXdCLFFBQ25CLHdCQUF3QjtBQUMvQixTQUFTQyxlQUFlLFFBQVEsbUNBQW1DO0FBQ25FLFNBQVNDLFlBQVksUUFBUSwwQkFBMEI7QUFDdkQsU0FBU0MsWUFBWSxRQUFRLHlDQUF5QztBQUN0RSxTQUFTQyxDQUFDLFFBQVEsUUFBUTtBQUMxQixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FB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QUd2QyxNQUFNLENBQUNDLE9BQU8sQ0FBQzFCLE9BQU8sQ0FBQyxDQUN4Q1YsR0FBRyxDQUFDLENBQUMsQ0FBQ3NDLFlBQVksRUFBRUMsTUFBTSxDQUFDLEtBQUs7TUFDL0IsTUFBTW9DLFVBQVUsR0FBR2hFLFdBQVcsR0FBRzJCLFlBQVksQ0FBQztNQUM5QyxNQUFNc0MsS0FBSyxHQUFHLENBQUMsSUFBSXRDLFlBQVksTUFBTUMsTUFBTSxHQUFHLENBQUM7TUFDL0MsSUFBSW9DLFVBQVUsRUFBRS9GLE9BQU8sRUFBRTtRQUN2QmdHLEtBQUssQ0FBQ0MsSUFBSSxDQUFDLHNCQUFzQkYsVUFBVSxDQUFDL0YsT0FBTyxFQUFFLENBQUM7TUFDeEQ7TUFDQSxJQUFJK0YsVUFBVSxFQUFFakYsS0FBSyxFQUFFO1FBQ3JCa0YsS0FBSyxDQUFDQyxJQUFJLENBQUMsZUFBZUYsVUFBVSxDQUFDakYsS0FBSyxFQUFFLENBQUM7TUFDL0M7TUFDQSxPQUFPa0YsS0FBSyxDQUFDdEIsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUN4QixDQUFDLENBQUMsQ0FDREEsSUFBSSxDQUFDLElBQUksQ0FBQztJQUViLE9BQU87TUFDTHdCLElBQUksRUFBRSxhQUFhO01BQ25CQyxPQUFPLEVBQUUscUNBQXFDTCxXQUFXLHlEQUF5RDtNQUNsSE0sV0FBVyxFQUFFUDtJQUNmLENBQUM7RUFDSDtBQUNGLENBQUMsV0FBVzFHLE9BQU8sQ0FBQ2tELFdBQVcsRUFBRVMsTUFBTSxDQUFDLENBQUM7O0FBRXpDO0FBQ0E7QUFDQTtBQUNBLFNBQVNpQyxtQkFBbUJBLENBQUMvRSxPQUFPLEVBQUUsTUFBTSxHQUFHLFNBQVMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUM7RUFDdkUsSUFBSUEsT0FBTyxLQUFLbUUsU0FBUyxFQUFFLE9BQU8sSUFBSTtFQUN0QyxJQUFJLDZCQUE2QixDQUFDa0MsSUFBSSxDQUFDckcsT0FBTyxDQUFDLEVBQUU7SUFDL0MsT0FBTywwRkFBMEY7RUFDbkc7RUFDQTtFQUNBO0VBQ0E7RUFDQSxJQUFJLHVCQUF1QixDQUFDcUcsSUFBSSxDQUFDckcsT0FBTyxDQUFDLEVBQUU7SUFDekMsT0FBTyx5R0FBeUc7RUFDbEg7RUFDQSxJQUFJLENBQUMsZUFBZSxDQUFDcUcsSUFBSSxDQUFDckcsT0FBTyxDQUFDLEVBQUU7SUFDbEMsT0FBTyx3R0FBd0c7RUFDakg7RUFDQSxPQUFPLElBQUk7QUFDYiIsImlnbm9yZUxpc3QiOltdfQ==