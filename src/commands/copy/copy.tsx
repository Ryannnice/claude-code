// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, writeFile } from 'fs/promises';
// 引入 marked、Tokens，将 marked 中已经封装好的能力接到本文件流程里。
import { marked, type Tokens } from 'marked';
// 引入 tmpdir，将 os 中已经封装好的能力接到本文件流程里。
import { tmpdir } from 'os';
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path';
// 引入 React、useRef，将 react 中已经封装好的能力接到本文件流程里。
import React, { useRef } from 'react';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 类型依赖 { OptionWithDescription } 来自 ../../components/CustomSelect/select.js，用于校准命令处理的数据契约。
import type { OptionWithDescription } from '../../components/CustomSelect/select.js';
// 复用 Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { Select } from '../../components/CustomSelect/select.js';
// 复用 Byline 终端界面组件，避免在这里重复拼装显示逻辑。
import { Byline } from '../../components/design-system/Byline.js';
// 复用 KeyboardShortcutHint 终端界面组件，避免在这里重复拼装显示逻辑。
import { KeyboardShortcutHint } from '../../components/design-system/KeyboardShortcutHint.js';
// 复用 Pane 终端界面组件，避免在这里重复拼装显示逻辑。
import { Pane } from '../../components/design-system/Pane.js';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准命令处理的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 复用 setClipboard 终端界面组件，避免在这里重复拼装显示逻辑。
import { setClipboard } from '../../ink/termio/osc.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 类型依赖 { LocalJSXCommandCall } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandCall } from '../../types/command.js';
// 类型依赖 { AssistantMessage, Message } 来自 ../../types/message.js，用于校准命令处理的数据契约。
import type { AssistantMessage, Message } from '../../types/message.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// 复用 extractTextContent、stripPromptXMLTags 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTextContent, stripPromptXMLTags } from '../../utils/messages.js';
// 复用 countCharInString 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { countCharInString } from '../../utils/stringUtils.js';
// COPY_DIR格式化`join`，供命令处理后续处理使用。
const COPY_DIR = join(tmpdir(), 'claude');
// RESPONSE_FILENAME 响应数据固定为 `'response.md'`，作为命令处理斜杠命令 copy后续展示或比较的基准。
const RESPONSE_FILENAME = 'response.md';
// MAX_LOOKBACK保存`20`，供命令处理斜杠命令 copy后续判断或输出使用。
const MAX_LOOKBACK = 20;
// CodeBlock 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type CodeBlock = {
  code: string;
  lang: string | undefined;
};
// extractCodeBlocks 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractCodeBlocks(markdown: string): CodeBlock[] {
  // token 列表保存`marked.lexer`，供命令处理后续处理使用。
  const tokens = marked.lexer(stripPromptXMLTags(markdown));
  // blocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const blocks: CodeBlock[] = [];
  // 按顺序遍历 `tokens` 中的token，逐个交给命令处理处理。
  for (const token of tokens) {
    // 当 `token.type` 匹配 `'code'` 时，命令处理执行对应分支。
    if (token.type === 'code') {
      // codeToken 命名 `token as Tokens.Code`，让后续代码直接表达这个值的用途。
      const codeToken = token as Tokens.Code;
      // blocks 集合追加新条目，保持收集顺序与输入顺序一致。
      blocks.push({
        code: codeToken.text,
        lang: codeToken.lang
      });
    }
  }
  // 返回 `blocks`，作为命令处理这次计算的结果。
  return blocks;
}

/**
 * Walk messages newest-first, returning text from assistant messages that
 * actually said something (skips tool-use-only turns and API errors).
 * Index 0 = latest, 1 = second-to-latest, etc. Caps at MAX_LOOKBACK.
 */
// collectRecentAssistantTexts 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function collectRecentAssistantTexts(messages: Message[]): string[] {
  // texts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const texts: string[] = [];
  // 循环处理 `let i = messages.length - 1; i >= 0 && texts.leng`，让命令处理逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0 && texts.length < MAX_LOOKBACK; i--) {
    // 消息保存`messages[i]`，供命令处理斜杠命令 copy后续判断或输出使用。
    const msg = messages[i];
    // `msg?.type` 与 `'assistant' || msg.isApiErrorMe...` 不一致时刷新派生状态，避免使用过期结果。
    if (msg?.type !== 'assistant' || msg.isApiErrorMessage) continue;
    // 文本内容 命名 `(msg as AssistantMessage).message.content`，让后续代码直接表达这个值的用途。
    const content = (msg as AssistantMessage).message.content;
    // 满足 `!Array.isArray(content)` 时，命令处理执行该分支。
    if (!Array.isArray(content)) continue;
    // 文本保存`extractTextContent`，供命令处理后续处理使用。
    const text = extractTextContent(content, '\n\n');
    // 满足 `text) texts.push(text` 时，命令处理执行该分支。
    if (text) texts.push(text);
  }
  // 返回 `texts`，作为命令处理这次计算的结果。
  return texts;
}
// fileExtension 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function fileExtension(lang: string | undefined): string {
  // 满足 `lang` 时，命令处理执行该分支。
  if (lang) {
    // Sanitize to prevent path traversal (e.g. ```../../etc/passwd)
    // Language identifiers are alphanumeric: python, tsx, jsonc, etc.
    // sanitized格式化`lang.replace`，供命令处理后续处理使用。
    const sanitized = lang.replace(/[^a-zA-Z0-9]/g, '');
    // `sanitized && sanitized` 与 `'plaintext'` 不一致时刷新派生状态，避免使用过期结果。
    if (sanitized && sanitized !== 'plaintext') {
      // 返回 ``.${sanitized}``，作为命令处理这次计算的结果。
      return `.${sanitized}`;
    }
  }
  // 返回 `'.txt'`，作为命令处理这次计算的结果。
  return '.txt';
}
// writeToFile 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeToFile(text: string, filename: string): Promise<string> {
  // 文件路径格式化`join`，供命令处理后续处理使用。
  const filePath = join(COPY_DIR, filename);
  // 等待 `mkdir(COPY_DIR, {` 完成，再继续斜杠命令 copy的异步流程。
  await mkdir(COPY_DIR, {
    recursive: true
  });
  // 等待 `writeFile(filePath, text, 'utf-8')` 完成，再继续斜杠命令 copy的异步流程。
  await writeFile(filePath, text, 'utf-8');
  // 返回 `filePath`，作为命令处理这次计算的结果。
  return filePath;
}
// copyOrWriteToFile 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function copyOrWriteToFile(text: string, filename: string): Promise<string> {
  // 原始文本保存`setClipboard`，供命令处理后续处理使用。
  const raw = await setClipboard(text);
  // 满足 `raw) process.stdout.write(raw` 时，命令处理执行该分支。
  if (raw) process.stdout.write(raw);
  // lineCount 数量统计`countCharInString`，供命令处理后续处理使用。
  const lineCount = countCharInString(text, '\n') + 1;
  // charCount 数量记录 `text.length` 是否成立，下一步按该结果分支。
  const charCount = text.length;
  // Also write to a temp file — clipboard paths are best-effort (OSC 52 needs
  // terminal support), so the file provides a reliable fallback.
  // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
  try {
    // 文件路径保存`writeToFile`，供命令处理后续处理使用。
    const filePath = await writeToFile(text, filename);
    // 返回 ``Copied to clipboard (${charCount} characters, ${lineCount} lines)\nAls...`，作为命令处理这次计算的结果。
    return `Copied to clipboard (${charCount} characters, ${lineCount} lines)\nAlso written to ${filePath}`;
  } catch {
    // 返回 ``Copied to clipboard (${charCount} characters, ${lineCount} lines)``，作为命令处理这次计算的结果。
    return `Copied to clipboard (${charCount} characters, ${lineCount} lines)`;
  }
}
// truncateLine 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function truncateLine(text: string, maxLen: number): string {
  // firstLine格式化`text.split`，供命令处理后续处理使用。
  const firstLine = text.split('\n')[0] ?? '';
  // 满足 `stringWidth(firstLine) <= maxLen` 时，命令处理执行该分支。
  if (stringWidth(firstLine) <= maxLen) {
    // 返回 `firstLine`，作为命令处理这次计算的结果。
    return firstLine;
  }
  // 结果保存`''`，作为后续固定文本处理的输入。
  let result = '';
  // width保存`0`，供命令处理斜杠命令 copy后续判断或输出使用。
  let width = 0;
  // targetWidth保存`maxLen - 1`，供命令处理斜杠命令 copy后续判断或输出使用。
  const targetWidth = maxLen - 1;
  // 按顺序遍历 `firstLine` 中的char，逐个交给命令处理处理。
  for (const char of firstLine) {
    // charWidth保存`stringWidth`，供命令处理后续处理使用。
    const charWidth = stringWidth(char);
    // 满足 `width + charWidth > targetWidth` 时，命令处理执行该分支。
    if (width + charWidth > targetWidth) break;
    // 斜杠命令 copy在这里处理 `result += char`，完成这一小步状态转换。
    result += char;
    // 斜杠命令 copy在这里处理 `width += charWidth`，完成这一小步状态转换。
    width += charWidth;
  }
  // 返回 `result + '\u2026'`，作为命令处理这次计算的结果。
  return result + '\u2026';
}
// PickerProps 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type PickerProps = {
  fullText: string;
  codeBlocks: CodeBlock[];
  messageAge: number;
  onDone: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
};
// PickerSelection 固化命令处理里传递的数据形状，帮助调用方按同一结构读写字段。
type PickerSelection = number | 'full' | 'always';
// CopyPicker 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function CopyPicker(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(33);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    fullText,
    codeBlocks,
    messageAge,
    onDone
  } = t0;
  // focusedRef 引用保存`useRef`，供命令处理后续处理使用。
  const focusedRef = useRef("full");
  // 临时值 t1统计`countCharInString`，供命令处理后续处理使用。
  const t1 = `${fullText.length} chars, ${countCharInString(fullText, "\n") + 1} lines`;
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t1) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      label: "Full response",
      value: "full" as const,
      description: t1
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== codeBlocks || $[3] !== t2) {
    // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t4 = {
        label: "Always copy full response",
        value: "always" as const,
        description: "Skip this picker in the future (revert via /config)"
      };
      // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[5];
    }
    // t3 暂存 `[t2, ...codeBlocks.map(_temp), t4]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [t2, ...codeBlocks.map(_temp), t4];
    // $[2] 缓存 `codeBlocks`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = codeBlocks;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 选项沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const options = t3;
  // t4 暂存 `function getSelectionContent(selected) {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== codeBlocks || $[7] !== fullText) {
    // t4 暂存 `function getSelectionContent(selected) {` 生成的渲染片段，后续返回路径直接复用。
    t4 = function getSelectionContent(selected) {
      // 当 `selected` 匹配 `"full" || selected === "alw...` 时，命令处理执行对应分支。
      if (selected === "full" || selected === "always") {
        // 返回结构化结果，集中表达命令处理已经整理出的状态。
        return {
          text: fullText,
          filename: RESPONSE_FILENAME
        };
      }
      // block_0读取 `codeBlocks[selected]` 对应条目，后续围绕该成员继续处理。
      const block_0 = codeBlocks[selected];
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        text: block_0.code,
        filename: `copy${fileExtension(block_0.lang)}`,
        blockIndex: selected
      };
    };
    // $[6] 缓存 `codeBlocks`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = codeBlocks;
    // $[7] 缓存 `fullText`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = fullText;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // getSelectionContent保存`t4`，作为后续临时缓存值处理的输入。
  const getSelectionContent = t4;
  // t5 暂存 `async function handleSelect(selected_0) {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== codeBlocks.length || $[10] !== getSelectionContent || $[11] !== messageAge || $[12] !== onDone) {
    // t5 暂存 `async function handleSelect(selected_0) {` 生成的渲染片段，后续返回路径直接复用。
    t5 = async function handleSelect(selected_0) {
      // 文本内容读取`getSelectionContent`，供命令处理后续处理使用。
      const content = getSelectionContent(selected_0);
      // 当 `selected_0` 匹配 `"always"` 时，命令处理执行对应分支。
      if (selected_0 === "always") {
        // 满足 `!getGlobalConfig().copyFullResponse` 时，命令处理执行该分支。
        if (!getGlobalConfig().copyFullResponse) {
          // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
          saveGlobalConfig(_temp2);
        }
        // 记录命令处理运行诊断，方便排查异常路径或性能问题。
        logEvent("tengu_copy", {
          block_count: codeBlocks.length,
          always: true,
          message_age: messageAge
        });
        // 结果保存`copyOrWriteToFile`，供命令处理后续处理使用。
        const result = await copyOrWriteToFile(content.text, content.filename);
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone(`${result}\nPreference saved. Use /config to change copyFullResponse`);
        // 斜杠命令 copy在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_copy", {
        selected_block: content.blockIndex,
        block_count: codeBlocks.length,
        message_age: messageAge
      });
      // result_0保存`copyOrWriteToFile`，供命令处理后续处理使用。
      const result_0 = await copyOrWriteToFile(content.text, content.filename);
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(result_0);
    };
    // $[9] 缓存 `codeBlocks.length`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = codeBlocks.length;
    // $[10] 缓存 `getSelectionContent`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = getSelectionContent;
    // $[11] 缓存 `messageAge`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = messageAge;
    // $[12] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onDone;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[13];
  }
  // handleSelect沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSelect = t5;
  // t6 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== codeBlocks.length || $[15] !== getSelectionContent || $[16] !== messageAge || $[17] !== onDone) {
    // handleWrite保存`handleWrite`，供命令处理后续处理使用。
    const handleWrite = async function handleWrite(selected_1) {
      // content_0读取`getSelectionContent`，供命令处理后续处理使用。
      const content_0 = getSelectionContent(selected_1);
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_copy", {
        selected_block: content_0.blockIndex,
        block_count: codeBlocks.length,
        message_age: messageAge,
        write_shortcut: true
      });
      // 斜杠命令 copy在这里处理 ``，完成这一小步状态转换。
      ;
      // 保护这一段可能失败的命令处理操作，确保异常能进入相邻错误处理。
      try {
        // 文件路径保存`writeToFile`，供命令处理后续处理使用。
        const filePath = await writeToFile(content_0.text, content_0.filename);
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone(`Written to ${filePath}`);
      } catch (t7) {
        // e 命名 `t7`，让后续代码直接表达这个值的用途。
        const e = t7;
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone(`Failed to write file: ${e instanceof Error ? e.message : e}`);
      }
    };
    // t6 暂存 `function handleKeyDown(e_0) {` 生成的渲染片段，后续返回路径直接复用。
    t6 = function handleKeyDown(e_0) {
      // 当 `e_0.key` 匹配 `"w"` 时，命令处理执行对应分支。
      if (e_0.key === "w") {
        // 调用 e_0.preventDefault，触发命令处理此处需要的副作用。
        e_0.preventDefault();
        // 调用 handleWrite，触发命令处理此处需要的副作用。
        handleWrite(focusedRef.current);
      }
    };
    // $[14] 缓存 `codeBlocks.length`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = codeBlocks.length;
    // $[15] 缓存 `getSelectionContent`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = getSelectionContent;
    // $[16] 缓存 `messageAge`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = messageAge;
    // $[17] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = onDone;
    // $[18] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[18];
  }
  // handleKeyDown 命名 `t6`，让后续代码直接表达这个值的用途。
  const handleKeyDown = t6;
  // t7 暂存 `<Text dimColor={true}>Select content to copy:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Text dimColor={true}>Select content to copy:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text dimColor={true}>Select content to copy:</Text>;
    // $[19] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[19];
  }
  // t8 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = value => {
      // current更新为 `value`，确保斜杠命令后续读取最新状态。
      focusedRef.current = value;
    };
    // $[20] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[20];
  }
  // t9 暂存 `selected_2 => {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== handleSelect) {
    // t9 暂存 `selected_2 => {` 生成的渲染片段，后续返回路径直接复用。
    t9 = selected_2 => {
      // 调用 handleSelect，触发命令处理此处需要的副作用。
      handleSelect(selected_2);
    };
    // $[21] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = handleSelect;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[22];
  }
  // t10 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== onDone) {
    // t10 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t10 = () => {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone("Copy cancelled", {
        display: "system"
      });
    };
    // $[23] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = onDone;
    // $[24] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[24];
  }
  // t11 暂存 `<Select options={options} hideIndexes={false} onFocus={t8...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== options || $[26] !== t10 || $[27] !== t9) {
    // t11 暂存 `<Select options={options} hideIndexes={false} onFocus={t8...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Select options={options} hideIndexes={false} onFocus={t8} onChange={t9} onCancel={t10} />;
    // $[25] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = options;
    // $[26] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t10;
    // $[27] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t9;
    // $[28] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[28];
  }
  // t12 暂存 `<Text dimColor={true}><Byline><KeyboardShortcutHint short...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
    // t12 暂存 `<Text dimColor={true}><Byline><KeyboardShortcutHint short...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Text dimColor={true}><Byline><KeyboardShortcutHint shortcut="enter" action="copy" /><KeyboardShortcutHint shortcut="w" action="write to file" /><KeyboardShortcutHint shortcut="esc" action="cancel" /></Byline></Text>;
    // $[29] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[29];
  }
  // t13 暂存 `<Pane><Box flexDirection="column" gap={1} tabIndex={0} au...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== handleKeyDown || $[31] !== t11) {
    // t13 暂存 `<Pane><Box flexDirection="column" gap={1} tabIndex={0} au...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Pane><Box flexDirection="column" gap={1} tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t7}{t11}{t12}</Box></Pane>;
    // $[30] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = handleKeyDown;
    // $[31] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t11;
    // $[32] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[32];
  }
  // 返回 `t13`，作为命令处理这次计算的结果。
  return t13;
}
// _temp2 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(c) {
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    ...c,
    copyFullResponse: true
  };
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(block, index) {
  // blockLines 集合统计`countCharInString`，供命令处理后续处理使用。
  const blockLines = countCharInString(block.code, "\n") + 1;
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    label: truncateLine(block.code, 60),
    value: index,
    description: [block.lang, blockLines > 1 ? `${blockLines} lines` : undefined].filter(Boolean).join(", ") || undefined
  };
}
// 这个回调绑定到 export const call: LocalJSXCommandCall = async (onDone, context, args) => {，负责命令处理在该局部场景下的响应。
export const call: LocalJSXCommandCall = async (onDone, context, args) => {
  // texts 集合保存`collectRecentAssistantTexts`，供命令处理后续处理使用。
  const texts = collectRecentAssistantTexts(context.messages);
  // texts 集合为空时立即返回或跳过，避免命令处理把空集合当成可处理内容。
  if (texts.length === 0) {
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone('No assistant message to copy');
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }

  // /copy N reaches back N-1 messages (1 = latest, 2 = second-to-latest, ...)
  // age保存`0`，供命令处理斜杠命令 copy后续判断或输出使用。
  let age = 0;
  // 当前参数格式化`trim`，供命令处理后续处理使用。
  const arg = args?.trim();
  // 满足 `arg` 时，命令处理执行该分支。
  if (arg) {
    // n保存`Number`，供命令处理后续处理使用。
    const n = Number(arg);
    // 只有 `!Number.isInteger(n) || n < 1` 满足时，命令处理才执行该分支。
    if (!Number.isInteger(n) || n < 1) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Usage: /copy [N] where N is 1 (latest), 2, 3, \u2026 Got: ${arg}`);
      // 返回 `null`，作为命令处理这次计算的结果。
      return null;
    }
    // 满足 `n > texts.length` 时，命令处理执行该分支。
    if (n > texts.length) {
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(`Only ${texts.length} assistant ${texts.length === 1 ? 'message' : 'messages'} available to copy`);
      // 返回 `null`，作为命令处理这次计算的结果。
      return null;
    }
    // age更新为 `n - 1`，确保斜杠命令后续读取最新状态。
    age = n - 1;
  }
  // 文本内容读取 `texts[age]!` 对应条目，后续围绕该成员继续处理。
  const text = texts[age]!;
  // codeBlocks 集合保存`extractCodeBlocks`，供命令处理后续处理使用。
  const codeBlocks = extractCodeBlocks(text);
  // 配置读取`getGlobalConfig`，供命令处理后续处理使用。
  const config = getGlobalConfig();
  // 只有 `codeBlocks.length === 0 || config.copyFullResponse` 满足时，命令处理才执行该分支。
  if (codeBlocks.length === 0 || config.copyFullResponse) {
    // 记录命令处理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_copy', {
      always: config.copyFullResponse,
      block_count: codeBlocks.length,
      message_age: age
    });
    // 结果保存`copyOrWriteToFile`，供命令处理后续处理使用。
    const result = await copyOrWriteToFile(text, RESPONSE_FILENAME);
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(result);
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // 返回 `<CopyPicker fullText={text} codeBlocks={codeBlocks} messageAge={age} on...`，作为命令处理这次计算的结果。
  return <CopyPicker fullText={text} codeBlocks={codeBlocks} messageAge={age} onDone={onDone} />;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJta2RpciIsIndyaXRlRmlsZSIsIm1hcmtlZCIsIlRva2VucyIsInRtcGRpciIsImpvaW4iLCJSZWFjdCIsInVzZVJlZiIsIkNvbW1hbmRSZXN1bHREaXNwbGF5IiwiT3B0aW9uV2l0aERlc2NyaXB0aW9uIiwiU2VsZWN0IiwiQnlsaW5lIiwiS2V5Ym9hcmRTaG9ydGN1dEhpbnQiLCJQYW5lIiwiS2V5Ym9hcmRFdmVudCIsInN0cmluZ1dpZHRoIiwic2V0Q2xpcGJvYXJkIiwiQm94IiwiVGV4dCIsImxvZ0V2ZW50IiwiTG9jYWxKU1hDb21tYW5kQ2FsbCIsIkFzc2lzdGFudE1lc3NhZ2UiLCJNZXNzYWdlIiwiZ2V0R2xvYmFsQ29uZmlnIiwic2F2ZUdsb2JhbENvbmZpZyIsImV4dHJhY3RUZXh0Q29udGVudCIsInN0cmlwUHJvbXB0WE1MVGFncyIsImNvdW50Q2hhckluU3RyaW5nIiwiQ09QWV9ESVIiLCJSRVNQT05TRV9GSUxFTkFNRSIsIk1BWF9MT09LQkFDSyIsIkNvZGVCbG9jayIsImNvZGUiLCJsYW5nIiwiZXh0cmFjdENvZGVCbG9ja3MiLCJtYXJrZG93biIsInRva2VucyIsImxleGVyIiwiYmxvY2tzIiwidG9rZW4iLCJ0eXBlIiwiY29kZVRva2VuIiwiQ29kZSIsInB1c2giLCJ0ZXh0IiwiY29sbGVjdFJlY2VudEFzc2lzdGFudFRleHRzIiwibWVzc2FnZXMiLCJ0ZXh0cyIsImkiLCJsZW5ndGgiLCJtc2ciLCJpc0FwaUVycm9yTWVzc2FnZSIsImNvbnRlbnQiLCJtZXNzYWdlIiwiQXJyYXkiLCJpc0FycmF5IiwiZmlsZUV4dGVuc2lvbiIsInNhbml0aXplZCIsInJlcGxhY2UiLCJ3cml0ZVRvRmlsZSIsImZpbGVuYW1lIiwiUHJvbWlzZSIsImZpbGVQYXRoIiwicmVjdXJzaXZlIiwiY29weU9yV3JpdGVUb0ZpbGUiLCJyYXciLCJwcm9jZXNzIiwic3Rkb3V0Iiwid3JpdGUiLCJsaW5lQ291bnQiLCJjaGFyQ291bnQiLCJ0cnVuY2F0ZUxpbmUiLCJtYXhMZW4iLCJmaXJzdExpbmUiLCJzcGxpdCIsInJlc3VsdCIsIndpZHRoIiwidGFyZ2V0V2lkdGgiLCJjaGFyIiwiY2hhcldpZHRoIiwiUGlja2VyUHJvcHMiLCJmdWxsVGV4dCIsImNvZGVCbG9ja3MiLCJtZXNzYWdlQWdlIiwib25Eb25lIiwib3B0aW9ucyIsImRpc3BsYXkiLCJQaWNrZXJTZWxlY3Rpb24iLCJDb3B5UGlja2VyIiwidDAiLCIkIiwiX2MiLCJmb2N1c2VkUmVmIiwidDEiLCJ0MiIsImxhYmVsIiwidmFsdWUiLCJjb25zdCIsImRlc2NyaXB0aW9uIiwidDMiLCJ0NCIsIlN5bWJvbCIsImZvciIsIm1hcCIsIl90ZW1wIiwiZ2V0U2VsZWN0aW9uQ29udGVudCIsInNlbGVjdGVkIiwiYmxvY2tfMCIsImJsb2NrIiwiYmxvY2tJbmRleCIsInQ1IiwiaGFuZGxlU2VsZWN0Iiwic2VsZWN0ZWRfMCIsImNvcHlGdWxsUmVzcG9uc2UiLCJfdGVtcDIiLCJibG9ja19jb3VudCIsImFsd2F5cyIsIm1lc3NhZ2VfYWdlIiwic2VsZWN0ZWRfYmxvY2siLCJyZXN1bHRfMCIsInQ2IiwiaGFuZGxlV3JpdGUiLCJzZWxlY3RlZF8xIiwiY29udGVudF8wIiwid3JpdGVfc2hvcnRjdXQiLCJ0NyIsImUiLCJFcnJvciIsImhhbmRsZUtleURvd24iLCJlXzAiLCJrZXkiLCJwcmV2ZW50RGVmYXVsdCIsImN1cnJlbnQiLCJ0OCIsInQ5Iiwic2VsZWN0ZWRfMiIsInQxMCIsInQxMSIsInQxMiIsInQxMyIsImMiLCJpbmRleCIsImJsb2NrTGluZXMiLCJ1bmRlZmluZWQiLCJmaWx0ZXIiLCJCb29sZWFuIiwiY2FsbCIsImNvbnRleHQiLCJhcmdzIiwiYWdlIiwiYXJnIiwidHJpbSIsIm4iLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJjb25maWciXSwic291cmNlcyI6WyJjb3B5LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBta2Rpciwgd3JpdGVGaWxlIH0gZnJvbSAnZnMvcHJvbWlzZXMnXG5pbXBvcnQgeyBtYXJrZWQsIHR5cGUgVG9rZW5zIH0gZnJvbSAnbWFya2VkJ1xuaW1wb3J0IHsgdG1wZGlyIH0gZnJvbSAnb3MnXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCdcbmltcG9ydCBSZWFjdCwgeyB1c2VSZWYgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgQ29tbWFuZFJlc3VsdERpc3BsYXkgfSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcbmltcG9ydCB0eXBlIHsgT3B0aW9uV2l0aERlc2NyaXB0aW9uIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgQnlsaW5lIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9kZXNpZ24tc3lzdGVtL0J5bGluZS5qcydcbmltcG9ydCB7IEtleWJvYXJkU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgUGFuZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvZGVzaWduLXN5c3RlbS9QYW5lLmpzJ1xuaW1wb3J0IHR5cGUgeyBLZXlib2FyZEV2ZW50IH0gZnJvbSAnLi4vLi4vaW5rL2V2ZW50cy9rZXlib2FyZC1ldmVudC5qcydcbmltcG9ydCB7IHN0cmluZ1dpZHRoIH0gZnJvbSAnLi4vLi4vaW5rL3N0cmluZ1dpZHRoLmpzJ1xuaW1wb3J0IHsgc2V0Q2xpcGJvYXJkIH0gZnJvbSAnLi4vLi4vaW5rL3Rlcm1pby9vc2MuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBsb2dFdmVudCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB0eXBlIHsgTG9jYWxKU1hDb21tYW5kQ2FsbCB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5pbXBvcnQgdHlwZSB7IEFzc2lzdGFudE1lc3NhZ2UsIE1lc3NhZ2UgfSBmcm9tICcuLi8uLi90eXBlcy9tZXNzYWdlLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnLCBzYXZlR2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHsgZXh0cmFjdFRleHRDb250ZW50LCBzdHJpcFByb21wdFhNTFRhZ3MgfSBmcm9tICcuLi8uLi91dGlscy9tZXNzYWdlcy5qcydcbmltcG9ydCB7IGNvdW50Q2hhckluU3RyaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc3RyaW5nVXRpbHMuanMnXG5cbmNvbnN0IENPUFlfRElSID0gam9pbih0bXBkaXIoKSwgJ2NsYXVkZScpXG5jb25zdCBSRVNQT05TRV9GSUxFTkFNRSA9ICdyZXNwb25zZS5tZCdcbmNvbnN0IE1BWF9MT09LQkFDSyA9IDIwXG5cbnR5cGUgQ29kZUJsb2NrID0ge1xuICBjb2RlOiBzdHJpbmdcbiAgbGFuZzogc3RyaW5nIHwgdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RDb2RlQmxvY2tzKG1hcmtkb3duOiBzdHJpbmcpOiBDb2RlQmxvY2tbXSB7XG4gIGNvbnN0IHRva2VucyA9IG1hcmtlZC5sZXhlcihzdHJpcFByb21wdFhNTFRhZ3MobWFya2Rvd24pKVxuICBjb25zdCBibG9ja3M6IENvZGVCbG9ja1tdID0gW11cbiAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICBpZiAodG9rZW4udHlwZSA9PT0gJ2NvZGUnKSB7XG4gICAgICBjb25zdCBjb2RlVG9rZW4gPSB0b2tlbiBhcyBUb2tlbnMuQ29kZVxuICAgICAgYmxvY2tzLnB1c2goeyBjb2RlOiBjb2RlVG9rZW4udGV4dCwgbGFuZzogY29kZVRva2VuLmxhbmcgfSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJsb2Nrc1xufVxuXG4vKipcbiAqIFdhbGsgbWVzc2FnZXMgbmV3ZXN0LWZpcnN0LCByZXR1cm5pbmcgdGV4dCBmcm9tIGFzc2lzdGFudCBtZXNzYWdlcyB0aGF0XG4gKiBhY3R1YWxseSBzYWlkIHNvbWV0aGluZyAoc2tpcHMgdG9vbC11c2Utb25seSB0dXJucyBhbmQgQVBJIGVycm9ycykuXG4gKiBJbmRleCAwID0gbGF0ZXN0LCAxID0gc2Vjb25kLXRvLWxhdGVzdCwgZXRjLiBDYXBzIGF0IE1BWF9MT09LQkFDSy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RSZWNlbnRBc3Npc3RhbnRUZXh0cyhtZXNzYWdlczogTWVzc2FnZVtdKTogc3RyaW5nW10ge1xuICBjb25zdCB0ZXh0czogc3RyaW5nW10gPSBbXVxuICBmb3IgKFxuICAgIGxldCBpID0gbWVzc2FnZXMubGVuZ3RoIC0gMTtcbiAgICBpID49IDAgJiYgdGV4dHMubGVuZ3RoIDwgTUFYX0xPT0tCQUNLO1xuICAgIGktLVxuICApIHtcbiAgICBjb25zdCBtc2cgPSBtZXNzYWdlc1tpXVxuICAgIGlmIChtc2c/LnR5cGUgIT09ICdhc3Npc3RhbnQnIHx8IG1zZy5pc0FwaUVycm9yTWVzc2FnZSkgY29udGludWVcbiAgICBjb25zdCBjb250ZW50ID0gKG1zZyBhcyBBc3Npc3RhbnRNZXNzYWdlKS5tZXNzYWdlLmNvbnRlbnRcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29udGVudCkpIGNvbnRpbnVlXG4gICAgY29uc3QgdGV4dCA9IGV4dHJhY3RUZXh0Q29udGVudChjb250ZW50LCAnXFxuXFxuJylcbiAgICBpZiAodGV4dCkgdGV4dHMucHVzaCh0ZXh0KVxuICB9XG4gIHJldHVybiB0ZXh0c1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsZUV4dGVuc2lvbihsYW5nOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAobGFuZykge1xuICAgIC8vIFNhbml0aXplIHRvIHByZXZlbnQgcGF0aCB0cmF2ZXJzYWwgKGUuZy4gYGBgLi4vLi4vZXRjL3Bhc3N3ZClcbiAgICAvLyBMYW5ndWFnZSBpZGVudGlmaWVycyBhcmUgYWxwaGFudW1lcmljOiBweXRob24sIHRzeCwganNvbmMsIGV0Yy5cbiAgICBjb25zdCBzYW5pdGl6ZWQgPSBsYW5nLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnJylcbiAgICBpZiAoc2FuaXRpemVkICYmIHNhbml0aXplZCAhPT0gJ3BsYWludGV4dCcpIHtcbiAgICAgIHJldHVybiBgLiR7c2FuaXRpemVkfWBcbiAgICB9XG4gIH1cbiAgcmV0dXJuICcudHh0J1xufVxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZVRvRmlsZSh0ZXh0OiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBmaWxlUGF0aCA9IGpvaW4oQ09QWV9ESVIsIGZpbGVuYW1lKVxuICBhd2FpdCBta2RpcihDT1BZX0RJUiwgeyByZWN1cnNpdmU6IHRydWUgfSlcbiAgYXdhaXQgd3JpdGVGaWxlKGZpbGVQYXRoLCB0ZXh0LCAndXRmLTgnKVxuICByZXR1cm4gZmlsZVBhdGhcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29weU9yV3JpdGVUb0ZpbGUoXG4gIHRleHQ6IHN0cmluZyxcbiAgZmlsZW5hbWU6IHN0cmluZyxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHJhdyA9IGF3YWl0IHNldENsaXBib2FyZCh0ZXh0KVxuICBpZiAocmF3KSBwcm9jZXNzLnN0ZG91dC53cml0ZShyYXcpXG4gIGNvbnN0IGxpbmVDb3VudCA9IGNvdW50Q2hhckluU3RyaW5nKHRleHQsICdcXG4nKSArIDFcbiAgY29uc3QgY2hhckNvdW50ID0gdGV4dC5sZW5ndGhcbiAgLy8gQWxzbyB3cml0ZSB0byBhIHRlbXAgZmlsZSDigJQgY2xpcGJvYXJkIHBhdGhzIGFyZSBiZXN0LWVmZm9ydCAoT1NDIDUyIG5lZWRzXG4gIC8vIHRlcm1pbmFsIHN1cHBvcnQpLCBzbyB0aGUgZmlsZSBwcm92aWRlcyBhIHJlbGlhYmxlIGZhbGxiYWNrLlxuICB0cnkge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gYXdhaXQgd3JpdGVUb0ZpbGUodGV4dCwgZmlsZW5hbWUpXG4gICAgcmV0dXJuIGBDb3BpZWQgdG8gY2xpcGJvYXJkICgke2NoYXJDb3VudH0gY2hhcmFjdGVycywgJHtsaW5lQ291bnR9IGxpbmVzKVxcbkFsc28gd3JpdHRlbiB0byAke2ZpbGVQYXRofWBcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGBDb3BpZWQgdG8gY2xpcGJvYXJkICgke2NoYXJDb3VudH0gY2hhcmFjdGVycywgJHtsaW5lQ291bnR9IGxpbmVzKWBcbiAgfVxufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZUxpbmUodGV4dDogc3RyaW5nLCBtYXhMZW46IG51bWJlcik6IHN0cmluZyB7XG4gIGNvbnN0IGZpcnN0TGluZSA9IHRleHQuc3BsaXQoJ1xcbicpWzBdID8/ICcnXG4gIGlmIChzdHJpbmdXaWR0aChmaXJzdExpbmUpIDw9IG1heExlbikge1xuICAgIHJldHVybiBmaXJzdExpbmVcbiAgfVxuICBsZXQgcmVzdWx0ID0gJydcbiAgbGV0IHdpZHRoID0gMFxuICBjb25zdCB0YXJnZXRXaWR0aCA9IG1heExlbiAtIDFcbiAgZm9yIChjb25zdCBjaGFyIG9mIGZpcnN0TGluZSkge1xuICAgIGNvbnN0IGNoYXJXaWR0aCA9IHN0cmluZ1dpZHRoKGNoYXIpXG4gICAgaWYgKHdpZHRoICsgY2hhcldpZHRoID4gdGFyZ2V0V2lkdGgpIGJyZWFrXG4gICAgcmVzdWx0ICs9IGNoYXJcbiAgICB3aWR0aCArPSBjaGFyV2lkdGhcbiAgfVxuICByZXR1cm4gcmVzdWx0ICsgJ1xcdTIwMjYnXG59XG5cbnR5cGUgUGlja2VyUHJvcHMgPSB7XG4gIGZ1bGxUZXh0OiBzdHJpbmdcbiAgY29kZUJsb2NrczogQ29kZUJsb2NrW11cbiAgbWVzc2FnZUFnZTogbnVtYmVyXG4gIG9uRG9uZTogKFxuICAgIHJlc3VsdD86IHN0cmluZyxcbiAgICBvcHRpb25zPzogeyBkaXNwbGF5PzogQ29tbWFuZFJlc3VsdERpc3BsYXkgfSxcbiAgKSA9PiB2b2lkXG59XG5cbnR5cGUgUGlja2VyU2VsZWN0aW9uID0gbnVtYmVyIHwgJ2Z1bGwnIHwgJ2Fsd2F5cydcblxuZnVuY3Rpb24gQ29weVBpY2tlcih7XG4gIGZ1bGxUZXh0LFxuICBjb2RlQmxvY2tzLFxuICBtZXNzYWdlQWdlLFxuICBvbkRvbmUsXG59OiBQaWNrZXJQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGZvY3VzZWRSZWYgPSB1c2VSZWY8UGlja2VyU2VsZWN0aW9uPignZnVsbCcpXG5cbiAgY29uc3Qgb3B0aW9uczogT3B0aW9uV2l0aERlc2NyaXB0aW9uPFBpY2tlclNlbGVjdGlvbj5bXSA9IFtcbiAgICB7XG4gICAgICBsYWJlbDogJ0Z1bGwgcmVzcG9uc2UnLFxuICAgICAgdmFsdWU6ICdmdWxsJyBhcyBjb25zdCxcbiAgICAgIGRlc2NyaXB0aW9uOiBgJHtmdWxsVGV4dC5sZW5ndGh9IGNoYXJzLCAke2NvdW50Q2hhckluU3RyaW5nKGZ1bGxUZXh0LCAnXFxuJykgKyAxfSBsaW5lc2AsXG4gICAgfSxcbiAgICAuLi5jb2RlQmxvY2tzLm1hcCgoYmxvY2ssIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBibG9ja0xpbmVzID0gY291bnRDaGFySW5TdHJpbmcoYmxvY2suY29kZSwgJ1xcbicpICsgMVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWw6IHRydW5jYXRlTGluZShibG9jay5jb2RlLCA2MCksXG4gICAgICAgIHZhbHVlOiBpbmRleCxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgW2Jsb2NrLmxhbmcsIGJsb2NrTGluZXMgPiAxID8gYCR7YmxvY2tMaW5lc30gbGluZXNgIDogdW5kZWZpbmVkXVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLmpvaW4oJywgJykgfHwgdW5kZWZpbmVkLFxuICAgICAgfVxuICAgIH0pLFxuICAgIHtcbiAgICAgIGxhYmVsOiAnQWx3YXlzIGNvcHkgZnVsbCByZXNwb25zZScsXG4gICAgICB2YWx1ZTogJ2Fsd2F5cycgYXMgY29uc3QsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NraXAgdGhpcyBwaWNrZXIgaW4gdGhlIGZ1dHVyZSAocmV2ZXJ0IHZpYSAvY29uZmlnKScsXG4gICAgfSxcbiAgXVxuXG4gIGZ1bmN0aW9uIGdldFNlbGVjdGlvbkNvbnRlbnQoc2VsZWN0ZWQ6IFBpY2tlclNlbGVjdGlvbik6IHtcbiAgICB0ZXh0OiBzdHJpbmdcbiAgICBmaWxlbmFtZTogc3RyaW5nXG4gICAgYmxvY2tJbmRleD86IG51bWJlclxuICB9IHtcbiAgICBpZiAoc2VsZWN0ZWQgPT09ICdmdWxsJyB8fCBzZWxlY3RlZCA9PT0gJ2Fsd2F5cycpIHtcbiAgICAgIHJldHVybiB7IHRleHQ6IGZ1bGxUZXh0LCBmaWxlbmFtZTogUkVTUE9OU0VfRklMRU5BTUUgfVxuICAgIH1cbiAgICBjb25zdCBibG9jayA9IGNvZGVCbG9ja3Nbc2VsZWN0ZWRdIVxuICAgIHJldHVybiB7XG4gICAgICB0ZXh0OiBibG9jay5jb2RlLFxuICAgICAgZmlsZW5hbWU6IGBjb3B5JHtmaWxlRXh0ZW5zaW9uKGJsb2NrLmxhbmcpfWAsXG4gICAgICBibG9ja0luZGV4OiBzZWxlY3RlZCxcbiAgICB9XG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVTZWxlY3Qoc2VsZWN0ZWQ6IFBpY2tlclNlbGVjdGlvbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBnZXRTZWxlY3Rpb25Db250ZW50KHNlbGVjdGVkKVxuICAgIGlmIChzZWxlY3RlZCA9PT0gJ2Fsd2F5cycpIHtcbiAgICAgIGlmICghZ2V0R2xvYmFsQ29uZmlnKCkuY29weUZ1bGxSZXNwb25zZSkge1xuICAgICAgICBzYXZlR2xvYmFsQ29uZmlnKGMgPT4gKHsgLi4uYywgY29weUZ1bGxSZXNwb25zZTogdHJ1ZSB9KSlcbiAgICAgIH1cbiAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9jb3B5Jywge1xuICAgICAgICBibG9ja19jb3VudDogY29kZUJsb2Nrcy5sZW5ndGgsXG4gICAgICAgIGFsd2F5czogdHJ1ZSxcbiAgICAgICAgbWVzc2FnZV9hZ2U6IG1lc3NhZ2VBZ2UsXG4gICAgICB9KVxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY29weU9yV3JpdGVUb0ZpbGUoY29udGVudC50ZXh0LCBjb250ZW50LmZpbGVuYW1lKVxuICAgICAgb25Eb25lKFxuICAgICAgICBgJHtyZXN1bHR9XFxuUHJlZmVyZW5jZSBzYXZlZC4gVXNlIC9jb25maWcgdG8gY2hhbmdlIGNvcHlGdWxsUmVzcG9uc2VgLFxuICAgICAgKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGxvZ0V2ZW50KCd0ZW5ndV9jb3B5Jywge1xuICAgICAgc2VsZWN0ZWRfYmxvY2s6IGNvbnRlbnQuYmxvY2tJbmRleCxcbiAgICAgIGJsb2NrX2NvdW50OiBjb2RlQmxvY2tzLmxlbmd0aCxcbiAgICAgIG1lc3NhZ2VfYWdlOiBtZXNzYWdlQWdlLFxuICAgIH0pXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY29weU9yV3JpdGVUb0ZpbGUoY29udGVudC50ZXh0LCBjb250ZW50LmZpbGVuYW1lKVxuICAgIG9uRG9uZShyZXN1bHQpXG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVXcml0ZShzZWxlY3RlZDogUGlja2VyU2VsZWN0aW9uKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY29udGVudCA9IGdldFNlbGVjdGlvbkNvbnRlbnQoc2VsZWN0ZWQpXG4gICAgbG9nRXZlbnQoJ3Rlbmd1X2NvcHknLCB7XG4gICAgICBzZWxlY3RlZF9ibG9jazogY29udGVudC5ibG9ja0luZGV4LFxuICAgICAgYmxvY2tfY291bnQ6IGNvZGVCbG9ja3MubGVuZ3RoLFxuICAgICAgbWVzc2FnZV9hZ2U6IG1lc3NhZ2VBZ2UsXG4gICAgICB3cml0ZV9zaG9ydGN1dDogdHJ1ZSxcbiAgICB9KVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlUGF0aCA9IGF3YWl0IHdyaXRlVG9GaWxlKGNvbnRlbnQudGV4dCwgY29udGVudC5maWxlbmFtZSlcbiAgICAgIG9uRG9uZShgV3JpdHRlbiB0byAke2ZpbGVQYXRofWApXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgb25Eb25lKGBGYWlsZWQgdG8gd3JpdGUgZmlsZTogJHtlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBlfWApXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlS2V5RG93bihlOiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgaWYgKGUua2V5ID09PSAndycpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgdm9pZCBoYW5kbGVXcml0ZShmb2N1c2VkUmVmLmN1cnJlbnQpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8UGFuZT5cbiAgICAgIDxCb3hcbiAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgIGdhcD17MX1cbiAgICAgICAgdGFiSW5kZXg9ezB9XG4gICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICBvbktleURvd249e2hhbmRsZUtleURvd259XG4gICAgICA+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlNlbGVjdCBjb250ZW50IHRvIGNvcHk6PC9UZXh0PlxuICAgICAgICA8U2VsZWN0PFBpY2tlclNlbGVjdGlvbj5cbiAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgIGhpZGVJbmRleGVzPXtmYWxzZX1cbiAgICAgICAgICBvbkZvY3VzPXt2YWx1ZSA9PiB7XG4gICAgICAgICAgICBmb2N1c2VkUmVmLmN1cnJlbnQgPSB2YWx1ZVxuICAgICAgICAgIH19XG4gICAgICAgICAgb25DaGFuZ2U9e3NlbGVjdGVkID0+IHtcbiAgICAgICAgICAgIHZvaWQgaGFuZGxlU2VsZWN0KHNlbGVjdGVkKVxuICAgICAgICAgIH19XG4gICAgICAgICAgb25DYW5jZWw9eygpID0+IHtcbiAgICAgICAgICAgIG9uRG9uZSgnQ29weSBjYW5jZWxsZWQnLCB7IGRpc3BsYXk6ICdzeXN0ZW0nIH0pXG4gICAgICAgICAgfX1cbiAgICAgICAgLz5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgPEJ5bGluZT5cbiAgICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cImVudGVyXCIgYWN0aW9uPVwiY29weVwiIC8+XG4gICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJ3XCIgYWN0aW9uPVwid3JpdGUgdG8gZmlsZVwiIC8+XG4gICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJlc2NcIiBhY3Rpb249XCJjYW5jZWxcIiAvPlxuICAgICAgICAgIDwvQnlsaW5lPlxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L1BhbmU+XG4gIClcbn1cblxuZXhwb3J0IGNvbnN0IGNhbGw6IExvY2FsSlNYQ29tbWFuZENhbGwgPSBhc3luYyAob25Eb25lLCBjb250ZXh0LCBhcmdzKSA9PiB7XG4gIGNvbnN0IHRleHRzID0gY29sbGVjdFJlY2VudEFzc2lzdGFudFRleHRzKGNvbnRleHQubWVzc2FnZXMpXG5cbiAgaWYgKHRleHRzLmxlbmd0aCA9PT0gMCkge1xuICAgIG9uRG9uZSgnTm8gYXNzaXN0YW50IG1lc3NhZ2UgdG8gY29weScpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIC9jb3B5IE4gcmVhY2hlcyBiYWNrIE4tMSBtZXNzYWdlcyAoMSA9IGxhdGVzdCwgMiA9IHNlY29uZC10by1sYXRlc3QsIC4uLilcbiAgbGV0IGFnZSA9IDBcbiAgY29uc3QgYXJnID0gYXJncz8udHJpbSgpXG4gIGlmIChhcmcpIHtcbiAgICBjb25zdCBuID0gTnVtYmVyKGFyZylcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIobikgfHwgbiA8IDEpIHtcbiAgICAgIG9uRG9uZShgVXNhZ2U6IC9jb3B5IFtOXSB3aGVyZSBOIGlzIDEgKGxhdGVzdCksIDIsIDMsIFxcdTIwMjYgR290OiAke2FyZ31gKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgaWYgKG4gPiB0ZXh0cy5sZW5ndGgpIHtcbiAgICAgIG9uRG9uZShcbiAgICAgICAgYE9ubHkgJHt0ZXh0cy5sZW5ndGh9IGFzc2lzdGFudCAke3RleHRzLmxlbmd0aCA9PT0gMSA/ICdtZXNzYWdlJyA6ICdtZXNzYWdlcyd9IGF2YWlsYWJsZSB0byBjb3B5YCxcbiAgICAgIClcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICAgIGFnZSA9IG4gLSAxXG4gIH1cblxuICBjb25zdCB0ZXh0ID0gdGV4dHNbYWdlXSFcbiAgY29uc3QgY29kZUJsb2NrcyA9IGV4dHJhY3RDb2RlQmxvY2tzKHRleHQpXG4gIGNvbnN0IGNvbmZpZyA9IGdldEdsb2JhbENvbmZpZygpXG5cbiAgaWYgKGNvZGVCbG9ja3MubGVuZ3RoID09PSAwIHx8IGNvbmZpZy5jb3B5RnVsbFJlc3BvbnNlKSB7XG4gICAgbG9nRXZlbnQoJ3Rlbmd1X2NvcHknLCB7XG4gICAgICBhbHdheXM6IGNvbmZpZy5jb3B5RnVsbFJlc3BvbnNlLFxuICAgICAgYmxvY2tfY291bnQ6IGNvZGVCbG9ja3MubGVuZ3RoLFxuICAgICAgbWVzc2FnZV9hZ2U6IGFnZSxcbiAgICB9KVxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNvcHlPcldyaXRlVG9GaWxlKHRleHQsIFJFU1BPTlNFX0ZJTEVOQU1FKVxuICAgIG9uRG9uZShyZXN1bHQpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPENvcHlQaWNrZXJcbiAgICAgIGZ1bGxUZXh0PXt0ZXh0fVxuICAgICAgY29kZUJsb2Nrcz17Y29kZUJsb2Nrc31cbiAgICAgIG1lc3NhZ2VBZ2U9e2FnZX1cbiAgICAgIG9uRG9uZT17b25Eb25lfVxuICAgIC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLEtBQUssRUFBRUMsU0FBUyxRQUFRLGFBQWE7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