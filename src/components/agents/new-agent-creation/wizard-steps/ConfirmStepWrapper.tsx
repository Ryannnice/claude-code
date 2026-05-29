// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 React、ReactNode、useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode, useCallback, useState } from 'react';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 引入 useSetAppState，将 src/state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useSetAppState } from 'src/state/AppState.js';
// 类型依赖 { Tools } 来自 ../../../../Tool.js，用于校准终端渲染的数据契约。
import type { Tools } from '../../../../Tool.js';
// 类型依赖 { AgentDefinition } 来自 ../../../../tools/AgentTool/loadAgentsDir.js，用于校准终端渲染的数据契约。
import type { AgentDefinition } from '../../../../tools/AgentTool/loadAgentsDir.js';
// 接入 getActiveAgentsFromList 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getActiveAgentsFromList } from '../../../../tools/AgentTool/loadAgentsDir.js';
// 复用 editFileInEditor 工具函数，把通用处理留在 ../../../../utils/promptEditor.js 中维护。
import { editFileInEditor } from '../../../../utils/promptEditor.js';
// 引入 useWizard，将 ../../../wizard/index.js 中已经封装好的能力接到本文件流程里。
import { useWizard } from '../../../wizard/index.js';
// 引入 getNewAgentFilePath、saveAgentToFile，将 ../../agentFileUtils.js 中已经封装好的能力接到本文件流程里。
import { getNewAgentFilePath, saveAgentToFile } from '../../agentFileUtils.js';
// 类型依赖 { AgentWizardData } 来自 ../types.js，用于校准终端渲染的数据契约。
import type { AgentWizardData } from '../types.js';
// 引入 ConfirmStep，将 ./ConfirmStep.js 中已经封装好的能力接到本文件流程里。
import { ConfirmStep } from './ConfirmStep.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  tools: Tools;
  existingAgents: AgentDefinition[];
  // 这个回调绑定到 onComplete: (message: string) => void;，负责终端渲染在该局部场景下的响应。
  onComplete: (message: string) => void;
};
// ConfirmStepWrapper 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ConfirmStepWrapper({
  tools,
  existingAgents,
  onComplete
}: Props): ReactNode {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    wizardData
  } = useWizard<AgentWizardData>();
  // saveError 错误信息 由 React state 持有，setSaveError 会在用户操作或异步结果返回时触发刷新。
  const [saveError, setSaveError] = useState<string | null>(null);
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState();
  // saveAgent保存`useCallback`，供终端渲染后续处理使用。
  const saveAgent = useCallback(async (openInEditor: boolean): Promise<void> => {
    // 满足 `!wizardData?.finalAgent` 时，终端渲染执行该分支。
    if (!wizardData?.finalAgent) return;
    // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `saveAgentToFile(wizardData.location!, wizardData.finalAgent.agentType, ...` 完成，再继续终端 UI 组件 Confirm Step Wrapper的异步流程。
      await saveAgentToFile(wizardData.location!, wizardData.finalAgent.agentType, wizardData.finalAgent.whenToUse, wizardData.finalAgent.tools, wizardData.finalAgent.getSystemPrompt(), true, wizardData.finalAgent.color, wizardData.finalAgent.model, wizardData.finalAgent.memory);
      // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
      setAppState(state => {
        // wizardData.finalAgent缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!wizardData.finalAgent) return state;
        // allAgents 集合保存`allAgents.concat`，供终端渲染后续处理使用。
        const allAgents = state.agentDefinitions.allAgents.concat(wizardData.finalAgent);
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...state,
          agentDefinitions: {
            ...state.agentDefinitions,
            activeAgents: getActiveAgentsFromList(allAgents),
            allAgents
          }
        };
      });
      // 满足 `openInEditor` 时，终端渲染执行该分支。
      if (openInEditor) {
        // 文件路径读取`getNewAgentFilePath`，供终端渲染后续处理使用。
        const filePath = getNewAgentFilePath({
          source: wizardData.location!,
          agentType: wizardData.finalAgent.agentType
        });
        // 等待 `editFileInEditor(filePath)` 完成，再继续终端 UI 组件 Confirm Step Wrapper的异步流程。
        await editFileInEditor(filePath);
      }
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_agent_created', {
        agent_type: wizardData.finalAgent.agentType,
        generation_method: wizardData.wasGenerated ? 'generated' : 'manual',
        source: wizardData.location!,
        tool_count: wizardData.finalAgent.tools?.length ?? 'all',
        has_custom_model: !!wizardData.finalAgent.model,
        has_custom_color: !!wizardData.finalAgent.color,
        has_memory: !!wizardData.finalAgent.memory,
        memory_scope: wizardData.finalAgent.memory ?? 'none',
        ...(openInEditor ? {
          opened_in_editor: true
        } : {})
      } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS);
      // 消息保存`chalk.bold`，供终端渲染后续处理使用。
      const message = openInEditor ? `Created agent: ${chalk.bold(wizardData.finalAgent.agentType)} and opened in editor. ` + `If you made edits, restart to load the latest version.` : `Created agent: ${chalk.bold(wizardData.finalAgent.agentType)}`;
      // 调用 onComplete，触发终端渲染此处需要的副作用。
      onComplete(message);
    } catch (err) {
      // setSaveError 写入新的状态值，使终端渲染后续读取保持一致。
      setSaveError(err instanceof Error ? err.message : 'Failed to save agent');
    }
  }, [wizardData, onComplete, setAppState]);
  // handleSave保存`useCallback`，供终端渲染后续处理使用。
  const handleSave = useCallback(() => saveAgent(false), [saveAgent]);
  // handleSaveAndEdit保存`useCallback`，供终端渲染后续处理使用。
  const handleSaveAndEdit = useCallback(() => saveAgent(true), [saveAgent]);
  // 返回 `<ConfirmStep tools={tools} existingAgents={existingAgents} onSave={hand...`，作为终端渲染这次计算的结果。
  return <ConfirmStep tools={tools} existingAgents={existingAgents} onSave={handleSave} onSaveAndEdit={handleSaveAndEdit} error={saveError} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsIlJlYWN0IiwiUmVhY3ROb2RlIiwidXNlQ2FsbGJhY2siLCJ1c2VTdGF0ZSIsIkFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMiLCJsb2dFdmVudCIsInVzZVNldEFwcFN0YXRlIiwiVG9vbHMiLCJBZ2VudERlZmluaXRpb24iLCJnZXRBY3RpdmVBZ2VudHNGcm9tTGlzdCIsImVkaXRGaWxlSW5FZGl0b3IiLCJ1c2VXaXphcmQiLCJnZXROZXdBZ2VudEZpbGVQYXRoIiwic2F2ZUFnZW50VG9GaWxlIiwiQWdlbnRXaXphcmREYXRhIiwiQ29uZmlybVN0ZXAiLCJQcm9wcyIsInRvb2xzIiwiZXhpc3RpbmdBZ2VudHMiLCJvbkNvbXBsZXRlIiwibWVzc2FnZSIsIkNvbmZpcm1TdGVwV3JhcHBlciIsIndpemFyZERhdGEiLCJzYXZlRXJyb3IiLCJzZXRTYXZlRXJyb3IiLCJzZXRBcHBTdGF0ZSIsInNhdmVBZ2VudCIsIm9wZW5JbkVkaXRvciIsIlByb21pc2UiLCJmaW5hbEFnZW50IiwibG9jYXRpb24iLCJhZ2VudFR5cGUiLCJ3aGVuVG9Vc2UiLCJnZXRTeXN0ZW1Qcm9tcHQiLCJjb2xvciIsIm1vZGVsIiwibWVtb3J5Iiwic3RhdGUiLCJhbGxBZ2VudHMiLCJhZ2VudERlZmluaXRpb25zIiwiY29uY2F0IiwiYWN0aXZlQWdlbnRzIiwiZmlsZVBhdGgiLCJzb3VyY2UiLCJhZ2VudF90eXBlIiwiZ2VuZXJhdGlvbl9tZXRob2QiLCJ3YXNHZW5lcmF0ZWQiLCJ0b29sX2NvdW50IiwibGVuZ3RoIiwiaGFzX2N1c3RvbV9tb2RlbCIsImhhc19jdXN0b21fY29sb3IiLCJoYXNfbWVtb3J5IiwibWVtb3J5X3Njb3BlIiwib3BlbmVkX2luX2VkaXRvciIsImJvbGQiLCJlcnIiLCJFcnJvciIsImhhbmRsZVNhdmUiLCJoYW5kbGVTYXZlQW5kRWRpdCJdLCJzb3VyY2VzIjpbIkNvbmZpcm1TdGVwV3JhcHBlci50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJ1xuaW1wb3J0IFJlYWN0LCB7IHR5cGUgUmVhY3ROb2RlLCB1c2VDYWxsYmFjaywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7XG4gIHR5cGUgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgbG9nRXZlbnQsXG59IGZyb20gJ3NyYy9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQgeyB1c2VTZXRBcHBTdGF0ZSB9IGZyb20gJ3NyYy9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgVG9vbHMgfSBmcm9tICcuLi8uLi8uLi8uLi9Ub29sLmpzJ1xuaW1wb3J0IHR5cGUgeyBBZ2VudERlZmluaXRpb24gfSBmcm9tICcuLi8uLi8uLi8uLi90b29scy9BZ2VudFRvb2wvbG9hZEFnZW50c0Rpci5qcydcbmltcG9ydCB7IGdldEFjdGl2ZUFnZW50c0Zyb21MaXN0IH0gZnJvbSAnLi4vLi4vLi4vLi4vdG9vbHMvQWdlbnRUb29sL2xvYWRBZ2VudHNEaXIuanMnXG5pbXBvcnQgeyBlZGl0RmlsZUluRWRpdG9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvcHJvbXB0RWRpdG9yLmpzJ1xuaW1wb3J0IHsgdXNlV2l6YXJkIH0gZnJvbSAnLi4vLi4vLi4vd2l6YXJkL2luZGV4LmpzJ1xuaW1wb3J0IHsgZ2V0TmV3QWdlbnRGaWxlUGF0aCwgc2F2ZUFnZW50VG9GaWxlIH0gZnJvbSAnLi4vLi4vYWdlbnRGaWxlVXRpbHMuanMnXG5pbXBvcnQgdHlwZSB7IEFnZW50V2l6YXJkRGF0YSB9IGZyb20gJy4uL3R5cGVzLmpzJ1xuaW1wb3J0IHsgQ29uZmlybVN0ZXAgfSBmcm9tICcuL0NvbmZpcm1TdGVwLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICB0b29sczogVG9vbHNcbiAgZXhpc3RpbmdBZ2VudHM6IEFnZW50RGVmaW5pdGlvbltdXG4gIG9uQ29tcGxldGU6IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENvbmZpcm1TdGVwV3JhcHBlcih7XG4gIHRvb2xzLFxuICBleGlzdGluZ0FnZW50cyxcbiAgb25Db21wbGV0ZSxcbn06IFByb3BzKTogUmVhY3ROb2RlIHtcbiAgY29uc3QgeyB3aXphcmREYXRhIH0gPSB1c2VXaXphcmQ8QWdlbnRXaXphcmREYXRhPigpXG4gIGNvbnN0IFtzYXZlRXJyb3IsIHNldFNhdmVFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBzZXRBcHBTdGF0ZSA9IHVzZVNldEFwcFN0YXRlKClcblxuICBjb25zdCBzYXZlQWdlbnQgPSB1c2VDYWxsYmFjayhcbiAgICBhc3luYyAob3BlbkluRWRpdG9yOiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgICBpZiAoIXdpemFyZERhdGE/LmZpbmFsQWdlbnQpIHJldHVyblxuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBzYXZlQWdlbnRUb0ZpbGUoXG4gICAgICAgICAgd2l6YXJkRGF0YS5sb2NhdGlvbiEsXG4gICAgICAgICAgd2l6YXJkRGF0YS5maW5hbEFnZW50LmFnZW50VHlwZSxcbiAgICAgICAgICB3aXphcmREYXRhLmZpbmFsQWdlbnQud2hlblRvVXNlLFxuICAgICAgICAgIHdpemFyZERhdGEuZmluYWxBZ2VudC50b29scyxcbiAgICAgICAgICB3aXphcmREYXRhLmZpbmFsQWdlbnQuZ2V0U3lzdGVtUHJvbXB0KCksXG4gICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICB3aXphcmREYXRhLmZpbmFsQWdlbnQuY29sb3IsXG4gICAgICAgICAgd2l6YXJkRGF0YS5maW5hbEFnZW50Lm1vZGVsLFxuICAgICAgICAgIHdpemFyZERhdGEuZmluYWxBZ2VudC5tZW1vcnksXG4gICAgICAgIClcblxuICAgICAgICBzZXRBcHBTdGF0ZShzdGF0ZSA9PiB7XG4gICAgICAgICAgaWYgKCF3aXphcmREYXRhLmZpbmFsQWdlbnQpIHJldHVybiBzdGF0ZVxuXG4gICAgICAgICAgY29uc3QgYWxsQWdlbnRzID0gc3RhdGUuYWdlbnREZWZpbml0aW9ucy5hbGxBZ2VudHMuY29uY2F0KFxuICAgICAgICAgICAgd2l6YXJkRGF0YS5maW5hbEFnZW50LFxuICAgICAgICAgIClcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgICAgICBhZ2VudERlZmluaXRpb25zOiB7XG4gICAgICAgICAgICAgIC4uLnN0YXRlLmFnZW50RGVmaW5pdGlvbnMsXG4gICAgICAgICAgICAgIGFjdGl2ZUFnZW50czogZ2V0QWN0aXZlQWdlbnRzRnJvbUxpc3QoYWxsQWdlbnRzKSxcbiAgICAgICAgICAgICAgYWxsQWdlbnRzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKG9wZW5JbkVkaXRvcikge1xuICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TmV3QWdlbnRGaWxlUGF0aCh7XG4gICAgICAgICAgICBzb3VyY2U6IHdpemFyZERhdGEubG9jYXRpb24hLFxuICAgICAgICAgICAgYWdlbnRUeXBlOiB3aXphcmREYXRhLmZpbmFsQWdlbnQuYWdlbnRUeXBlLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgYXdhaXQgZWRpdEZpbGVJbkVkaXRvcihmaWxlUGF0aClcbiAgICAgICAgfVxuXG4gICAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9hZ2VudF9jcmVhdGVkJywge1xuICAgICAgICAgIGFnZW50X3R5cGU6IHdpemFyZERhdGEuZmluYWxBZ2VudC5hZ2VudFR5cGUsXG4gICAgICAgICAgZ2VuZXJhdGlvbl9tZXRob2Q6IHdpemFyZERhdGEud2FzR2VuZXJhdGVkID8gJ2dlbmVyYXRlZCcgOiAnbWFudWFsJyxcbiAgICAgICAgICBzb3VyY2U6IHdpemFyZERhdGEubG9jYXRpb24hLFxuICAgICAgICAgIHRvb2xfY291bnQ6IHdpemFyZERhdGEuZmluYWxBZ2VudC50b29scz8ubGVuZ3RoID8/ICdhbGwnLFxuICAgICAgICAgIGhhc19jdXN0b21fbW9kZWw6ICEhd2l6YXJkRGF0YS5maW5hbEFnZW50Lm1vZGVsLFxuICAgICAgICAgIGhhc19jdXN0b21fY29sb3I6ICEhd2l6YXJkRGF0YS5maW5hbEFnZW50LmNvbG9yLFxuICAgICAgICAgIGhhc19tZW1vcnk6ICEhd2l6YXJkRGF0YS5maW5hbEFnZW50Lm1lbW9yeSxcbiAgICAgICAgICBtZW1vcnlfc2NvcGU6IHdpemFyZERhdGEuZmluYWxBZ2VudC5tZW1vcnkgPz8gJ25vbmUnLFxuICAgICAgICAgIC4uLihvcGVuSW5FZGl0b3IgPyB7IG9wZW5lZF9pbl9lZGl0b3I6IHRydWUgfSA6IHt9KSxcbiAgICAgICAgfSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTKVxuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBvcGVuSW5FZGl0b3JcbiAgICAgICAgICA/IGBDcmVhdGVkIGFnZW50OiAke2NoYWxrLmJvbGQod2l6YXJkRGF0YS5maW5hbEFnZW50LmFnZW50VHlwZSl9IGFuZCBvcGVuZWQgaW4gZWRpdG9yLiBgICtcbiAgICAgICAgICAgIGBJZiB5b3UgbWFkZSBlZGl0cywgcmVzdGFydCB0byBsb2FkIHRoZSBsYXRlc3QgdmVyc2lvbi5gXG4gICAgICAgICAgOiBgQ3JlYXRlZCBhZ2VudDogJHtjaGFsay5ib2xkKHdpemFyZERhdGEuZmluYWxBZ2VudC5hZ2VudFR5cGUpfWBcbiAgICAgICAgb25Db21wbGV0ZShtZXNzYWdlKVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHNldFNhdmVFcnJvcihcbiAgICAgICAgICBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogJ0ZhaWxlZCB0byBzYXZlIGFnZW50JyxcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH0sXG4gICAgW3dpemFyZERhdGEsIG9uQ29tcGxldGUsIHNldEFwcFN0YXRlXSxcbiAgKVxuXG4gIGNvbnN0IGhhbmRsZVNhdmUgPSB1c2VDYWxsYmFjaygoKSA9PiBzYXZlQWdlbnQoZmFsc2UpLCBbc2F2ZUFnZW50XSlcblxuICBjb25zdCBoYW5kbGVTYXZlQW5kRWRpdCA9IHVzZUNhbGxiYWNrKCgpID0+IHNhdmVBZ2VudCh0cnVlKSwgW3NhdmVBZ2VudF0pXG5cbiAgcmV0dXJuIChcbiAgICA8Q29uZmlybVN0ZXBcbiAgICAgIHRvb2xzPXt0b29sc31cbiAgICAgIGV4aXN0aW5nQWdlbnRzPXtleGlzdGluZ0FnZW50c31cbiAgICAgIG9uU2F2ZT17aGFuZGxlU2F2ZX1cbiAgICAgIG9uU2F2ZUFuZEVkaXQ9e2hhbmRsZVNhdmVBbmRFZGl0fVxuICAgICAgZXJyb3I9e3NhdmVFcnJvcn1cbiAgICAvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLE9BQU9DLEtBQUssSUFBSSxLQUFLQyxTQUFTLEVBQUVDLFdBQVcsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDcEUsU0FDRSxLQUFLQywwREFBMEQsRUFDL0RDLFFBQVEsUUFDSCxpQ0FBaUM7QUFDeEMsU0FBU0MsY0FBYyxRQUFRLHVCQUF1QjtBQUN0RCxjQUFjQyxLQUFLLFFBQVEscUJBQXFCO0FBQ2hELGNBQWNDLGVBQWUsUUFBUSw4Q0FBOEM7QUFDbkYsU0FBU0MsdUJBQXVCLFFBQVEsOENBQThDO0FBQ3RGLFNBQVNDLGdCQUFnQixRQUFRLG1DQUFtQztBQUNwRSxTQUFTQyxTQUFTLFFBQVEsMEJBQTBCO0FBQ3BELFNBQVNDLG1CQUFtQixFQUFFQyxlQUFlLFFBQVEseUJBQXlCO0FBQzlFLGNBQWNDLGVBQWUsUUFBUSxhQUFhO0FBQ2xELFNBQVNDLFdBQVcsUUFBUSxrQkFBa0I7QUFFOUMsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLEtBQUssRUFBRVYsS0FBSztFQUNaVyxjQUFjLEVBQUVW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