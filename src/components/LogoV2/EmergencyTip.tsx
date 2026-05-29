// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useMemo } from 'react';
// 引入 Box、Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from 'src/ink.js';
// 接入 getDynamicConfig_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getDynamicConfig_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 src/utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from 'src/utils/config.js';
// CONFIG_NAME 配置保存`'tengu-top-of-feed-tip'`，作为后续固定文本处理的输入。
const CONFIG_NAME = 'tengu-top-of-feed-tip';
// EmergencyTip 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function EmergencyTip(): React.ReactNode {
  // tip保存`useMemo`，供终端渲染后续处理使用。
  const tip = useMemo(getTipOfFeed, []);
  // Memoize to prevent re-reads after we save - we want the value at mount time
  // lastShownTip保存`useMemo`，供终端渲染后续处理使用。
  const lastShownTip = useMemo(() => getGlobalConfig().lastShownEmergencyTip, []);

  // Only show if this is a new/different tip
  // shouldShow标记终端 UI Emergency Tip是否启用对应路径。
  const shouldShow = tip.tip && tip.tip !== lastShownTip;

  // Save the tip we're showing so we don't show it again
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 满足 `shouldShow` 时，终端渲染执行该分支。
    if (shouldShow) {
      // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
      saveGlobalConfig(current => {
        // 满足 `current.lastShownEmergencyTip === tip.tip` 时，终端渲染执行该分支。
        if (current.lastShownEmergencyTip === tip.tip) return current;
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...current,
          lastShownEmergencyTip: tip.tip
        };
      });
    }
  }, [shouldShow, tip.tip]);
  // shouldShow缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!shouldShow) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 返回 `<Box paddingLeft={2} flexDirection="column">`，作为终端渲染这次计算的结果。
  return <Box paddingLeft={2} flexDirection="column">
      <Text {...tip.color === 'warning' ? {
      color: 'warning'
    } : tip.color === 'error' ? {
      color: 'error'
    } : {
      dimColor: true
    }}>
        {tip.tip}
      </Text>
    </Box>;
}
// TipOfFeed 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TipOfFeed = {
  tip: string;
  color?: 'dim' | 'warning' | 'error';
};
// DEFAULT_TIP 集中保存终端 UI 组件 Emergency Tip要一起传递的字段。
const DEFAULT_TIP: TipOfFeed = {
  tip: '',
  color: 'dim'
};

/**
 * Get the tip of the feed from dynamic config with caching
 * Returns cached value immediately, updates in background
 */
// getTipOfFeed 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTipOfFeed(): TipOfFeed {
  // 返回 `getDynamicConfig_CACHED_MAY_BE_STALE<TipOfFeed>(CONFIG_NAME, DEFAULT_TI...`，作为终端渲染这次计算的结果。
  return getDynamicConfig_CACHED_MAY_BE_STALE<TipOfFeed>(CONFIG_NAME, DEFAULT_TIP);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJCb3giLCJUZXh0IiwiZ2V0RHluYW1pY0NvbmZpZ19DQUNIRURfTUFZX0JFX1NUQUxFIiwiZ2V0R2xvYmFsQ29uZmlnIiwic2F2ZUdsb2JhbENvbmZpZyIsIkNPTkZJR19OQU1FIiwiRW1lcmdlbmN5VGlwIiwiUmVhY3ROb2RlIiwidGlwIiwiZ2V0VGlwT2ZGZWVkIiwibGFzdFNob3duVGlwIiwibGFzdFNob3duRW1lcmdlbmN5VGlwIiwic2hvdWxkU2hvdyIsImN1cnJlbnQiLCJjb2xvciIsImRpbUNvbG9yIiwiVGlwT2ZGZWVkIiwiREVGQVVMVF9USVAiXSwic291cmNlcyI6WyJFbWVyZ2VuY3lUaXAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICdzcmMvaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0RHluYW1pY0NvbmZpZ19DQUNIRURfTUFZX0JFX1NUQUxFIH0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9ncm93dGhib29rLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnLCBzYXZlR2xvYmFsQ29uZmlnIH0gZnJvbSAnc3JjL3V0aWxzL2NvbmZpZy5qcydcblxuY29uc3QgQ09ORklHX05BTUUgPSAndGVuZ3UtdG9wLW9mLWZlZWQtdGlwJ1xuXG5leHBvcnQgZnVuY3Rpb24gRW1lcmdlbmN5VGlwKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHRpcCA9IHVzZU1lbW8oZ2V0VGlwT2ZGZWVkLCBbXSlcbiAgLy8gTWVtb2l6ZSB0byBwcmV2ZW50IHJlLXJlYWRzIGFmdGVyIHdlIHNhdmUgLSB3ZSB3YW50IHRoZSB2YWx1ZSBhdCBtb3VudCB0aW1lXG4gIGNvbnN0IGxhc3RTaG93blRpcCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gZ2V0R2xvYmFsQ29uZmlnKCkubGFzdFNob3duRW1lcmdlbmN5VGlwLFxuICAgIFtdLFxuICApXG5cbiAgLy8gT25seSBzaG93IGlmIHRoaXMgaXMgYSBuZXcvZGlmZmVyZW50IHRpcFxuICBjb25zdCBzaG91bGRTaG93ID0gdGlwLnRpcCAmJiB0aXAudGlwICE9PSBsYXN0U2hvd25UaXBcblxuICAvLyBTYXZlIHRoZSB0aXAgd2UncmUgc2hvd2luZyBzbyB3ZSBkb24ndCBzaG93IGl0IGFnYWluXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHNob3VsZFNob3cpIHtcbiAgICAgIHNhdmVHbG9iYWxDb25maWcoY3VycmVudCA9PiB7XG4gICAgICAgIGlmIChjdXJyZW50Lmxhc3RTaG93bkVtZXJnZW5jeVRpcCA9PT0gdGlwLnRpcCkgcmV0dXJuIGN1cnJlbnRcbiAgICAgICAgcmV0dXJuIHsgLi4uY3VycmVudCwgbGFzdFNob3duRW1lcmdlbmN5VGlwOiB0aXAudGlwIH1cbiAgICAgIH0pXG4gICAgfVxuICB9LCBbc2hvdWxkU2hvdywgdGlwLnRpcF0pXG5cbiAgaWYgKCFzaG91bGRTaG93KSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBwYWRkaW5nTGVmdD17Mn0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPFRleHRcbiAgICAgICAgey4uLih0aXAuY29sb3IgPT09ICd3YXJuaW5nJ1xuICAgICAgICAgID8geyBjb2xvcjogJ3dhcm5pbmcnIH1cbiAgICAgICAgICA6IHRpcC5jb2xvciA9PT0gJ2Vycm9yJ1xuICAgICAgICAgICAgPyB7IGNvbG9yOiAnZXJyb3InIH1cbiAgICAgICAgICAgIDogeyBkaW1Db2xvcjogdHJ1ZSB9KX1cbiAgICAgID5cbiAgICAgICAge3RpcC50aXB9XG4gICAgICA8L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxudHlwZSBUaXBPZkZlZWQgPSB7XG4gIHRpcDogc3RyaW5nXG4gIGNvbG9yPzogJ2RpbScgfCAnd2FybmluZycgfCAnZXJyb3InXG59XG5cbmNvbnN0IERFRkFVTFRfVElQOiBUaXBPZkZlZWQgPSB7IHRpcDogJycsIGNvbG9yOiAnZGltJyB9XG5cbi8qKlxuICogR2V0IHRoZSB0aXAgb2YgdGhlIGZlZWQgZnJvbSBkeW5hbWljIGNvbmZpZyB3aXRoIGNhY2hpbmdcbiAqIFJldHVybnMgY2FjaGVkIHZhbHVlIGltbWVkaWF0ZWx5LCB1cGRhdGVzIGluIGJhY2tncm91bmRcbiAqL1xuZnVuY3Rpb24gZ2V0VGlwT2ZGZWVkKCk6IFRpcE9mRmVlZCB7XG4gIHJldHVybiBnZXREeW5hbWljQ29uZmlnX0NBQ0hFRF9NQVlfQkVfU1RBTEU8VGlwT2ZGZWVkPihcbiAgICBDT05GSUdfTkFNRSxcbiAgICBERUZBVUxUX1RJUCxcbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFNBQVMsRUFBRUMsT0FBTyxRQUFRLE9BQU87QUFDMUMsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsWUFBWTtBQUN0QyxTQUFTQyxvQ0FBb0MsUUFBUSxzQ0FBc0M7QUFDM0YsU0FBU0MsZUFBZSxFQUFFQyxnQkFBZ0IsUUFBUSxxQkFBcUI7QUFFdkUsTUFBTUMsV0FBVyxHQUFHLHVCQUF1QjtBQUUzQyxPQUFPLFNBQVNDLFlBQVlBLENBQUEsQ0FBRSxFQUFFVCxLQUFLLENBQUNVLFNBQVMsQ0FBQztFQUM5QyxNQUFNQyxHQUFHLEdBQUdULE9BQU8sQ0FBQ1UsWUFBWSxFQUFFLEVBQUUsQ0FBQztFQUNyQztFQUNBLE1BQU1DLFlBQVksR0FBR1gsT0FBTyxDQUMxQixNQUFNSSxlQUFlLENBQUMsQ0FBQyxDQUFDUSxxQkFBcUIsRUFDN0MsRUFDRixDQUFDOztFQUVEO0VBQ0EsTUFBTUMsVUFBVSxHQUFHSixHQUFHLENBQUNBLEdBQUcsSUFBSUEsR0FBRyxDQUFDQSxHQUFHLEtBQUtFLFlBQVk7O0VBRXREO0VBQ0FaLFNBQVMsQ0FBQyxNQUFNO0lBQ2QsSUFBSWMsVUFBVSxFQUFFO01BQ2RSLGdCQUFnQixDQUFDUyxPQUFPLElBQUk7UUFDMUIsSUFBSUEsT0FBTyxDQUFDRixxQkFBcUIsS0FBS0gsR0FBRyxDQUFDQSxHQUFHLEVBQUUsT0FBT0ssT0FBTztRQUM3RCxPQUFPO1VBQUUsR0FBR0EsT0FBTztVQUFFRixxQkFBcUIsRUFBRUgsR0FBRyxDQUFDQTtRQUFJLENBQUM7TUFDdkQsQ0FBQyxDQUFDO0lBQ0o7RUFDRixDQUFDLEVBQUUsQ0FBQ0ksVUFBVSxFQUFFSixHQUFHLENBQUNBLEdBQUcsQ0FBQyxDQUFDO0VBRXpCLElBQUksQ0FBQ0ksVUFBVSxFQUFFO0lBQ2YsT0FBTyxJQUFJO0VBQ2I7RUFFQSxPQUNFLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxRQUFRO0FBQy9DLE1BQU0sQ0FBQyxJQUFJLENBQ0gsSUFBS0osR0FBRyxDQUFDTSxLQUFLLEtBQUssU0FBUyxHQUN4QjtNQUFFQSxLQUFLLEVBQUU7SUFBVSxDQUFDLEdBQ3BCTixHQUFHLENBQUNNLEtBQUssS0FBSyxPQUFPLEdBQ25CO01BQUVBLEtBQUssRUFBRTtJQUFRLENBQUMsR0FDbEI7TUFBRUMsUUFBUSxFQUFFO0lBQUssQ0FBRSxDQUFDO0FBRWxDLFFBQVEsQ0FBQ1AsR0FBRyxDQUFDQSxHQUFHO0FBQ2hCLE1BQU0sRUFBRSxJQUFJO0FBQ1osSUFBSSxFQUFFLEdBQUcsQ0FBQztBQUVWO0FBRUEsS0FBS1EsU0FBUyxHQUFHO0VBQ2ZSLEdBQUcsRUFBRSxNQUFNO0VBQ1hNLEtBQUssQ0FBQyxFQUFFLEtBQUssR0FBRyxTQUFTLEdBQUcsT0FBTztBQUNyQyxDQUFDO0FBRUQsTUFBTUcsV0FBVyxFQUFFRCxTQUFTLEdBQUc7RUFBRVIsR0FBRyxFQUFFLEVBQUU7RUFBRU0sS0FBSyxFQUFFO0FBQU0sQ0FBQzs7QUFFeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTTCxZQUFZQSxDQUFBLENBQUUsRUFBRU8sU0FBUyxDQUFDO0VBQ2pDLE9BQU9kLG9DQUFvQyxDQUFDYyxTQUFTLENBQUMsQ0FDcERYLFdBQVcsRUFDWFksV0FDRixDQUFDO0FBQ0giLCJpZ25vcmVMaXN0IjpbXX0=