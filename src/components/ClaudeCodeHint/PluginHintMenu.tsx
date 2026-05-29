// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// 引入 PermissionDialog，将 ../permissions/PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from '../permissions/PermissionDialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  pluginName: string;
  pluginDescription?: string;
  marketplaceName: string;
  sourceCommand: string;
  // 这个回调绑定到 onResponse: (response: 'yes' | 'no' | 'disable') => void;，负责终端渲染在该局部场景下的响应。
  onResponse: (response: 'yes' | 'no' | 'disable') => void;
};
// AUTO_DISMISS_MS 集合保存`30_000`，供后续判断或组装使用。
const AUTO_DISMISS_MS = 30_000;
// PluginHintMenu 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PluginHintMenu({
  pluginName,
  pluginDescription,
  marketplaceName,
  sourceCommand,
  onResponse
}: Props): React.ReactNode {
  // onResponseRef 引用保存`React.useRef`，供终端渲染后续处理使用。
  const onResponseRef = React.useRef(onResponse);
  // current更新为 `onResponse`，确保终端 UI后续读取最新状态。
  onResponseRef.current = onResponse;
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(() => {
    // timeoutId保存`setTimeout`，供终端渲染后续处理使用。
    const timeoutId = setTimeout(ref => ref.current('no'), AUTO_DISMISS_MS, onResponseRef);
    // 返回 `() => clearTimeout(timeoutId)`，作为终端渲染这次计算的结果。
    return () => clearTimeout(timeoutId);
  }, []);
  // onSelect 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function onSelect(value: string): void {
    // 按照 value 的取值选择终端渲染的具体处理分支。
    switch (value) {
      case 'yes':
        // 调用 onResponse，触发终端渲染此处需要的副作用。
        onResponse('yes');
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break;
      case 'disable':
        // 调用 onResponse，触发终端渲染此处需要的副作用。
        onResponse('disable');
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break;
      default:
        // 调用 onResponse，触发终端渲染此处需要的副作用。
        onResponse('no');
    }
  }
  // 选项 聚合成有序列表，保持后续遍历顺序稳定。
  const options = [{
    label: <Text>
          Yes, install <Text bold>{pluginName}</Text>
        </Text>,
    value: 'yes'
  }, {
    label: 'No',
    value: 'no'
  }, {
    label: "No, and don't show plugin installation hints again",
    value: 'disable'
  }];
  // 返回 `<PermissionDialog title="Plugin Recommendation">`，作为终端渲染这次计算的结果。
  return <PermissionDialog title="Plugin Recommendation">
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text dimColor>
            The <Text bold>{sourceCommand}</Text> command suggests installing a
            plugin.
          </Text>
        </Box>
        <Box>
          <Text dimColor>Plugin:</Text>
          <Text> {pluginName}</Text>
        </Box>
        <Box>
          <Text dimColor>Marketplace:</Text>
          <Text> {marketplaceName}</Text>
        </Box>
        {pluginDescription && <Box>
            <Text dimColor>{pluginDescription}</Text>
          </Box>}
        <Box marginTop={1}>
          <Text>Would you like to install it?</Text>
        </Box>
        <Box>
          {/* 这个回调绑定到 <Select options={options} onChange={onSelect} onCancel={() => onResponse('no')} />，负责终端渲染在该局部场景下的响应。 */}
          <Select options={options} onChange={onSelect} onCancel={() => onResponse('no')} />
        </Box>
      </Box>
    </PermissionDialog>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJTZWxlY3QiLCJQZXJtaXNzaW9uRGlhbG9nIiwiUHJvcHMiLCJwbHVnaW5OYW1lIiwicGx1Z2luRGVzY3JpcHRpb24iLCJtYXJrZXRwbGFjZU5hbWUiLCJzb3VyY2VDb21tYW5kIiwib25SZXNwb25zZSIsInJlc3BvbnNlIiwiQVVUT19ESVNNSVNTX01TIiwiUGx1Z2luSGludE1lbnUiLCJSZWFjdE5vZGUiLCJvblJlc3BvbnNlUmVmIiwidXNlUmVmIiwiY3VycmVudCIsInVzZUVmZmVjdCIsInRpbWVvdXRJZCIsInNldFRpbWVvdXQiLCJyZWYiLCJjbGVhclRpbWVvdXQiLCJvblNlbGVjdCIsInZhbHVlIiwib3B0aW9ucyIsImxhYmVsIl0sInNvdXJjZXMiOlsiUGx1Z2luSGludE1lbnUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IFBlcm1pc3Npb25EaWFsb2cgfSBmcm9tICcuLi9wZXJtaXNzaW9ucy9QZXJtaXNzaW9uRGlhbG9nLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBwbHVnaW5OYW1lOiBzdHJpbmdcbiAgcGx1Z2luRGVzY3JpcHRpb24/OiBzdHJpbmdcbiAgbWFya2V0cGxhY2VOYW1lOiBzdHJpbmdcbiAgc291cmNlQ29tbWFuZDogc3RyaW5nXG4gIG9uUmVzcG9uc2U6IChyZXNwb25zZTogJ3llcycgfCAnbm8nIHwgJ2Rpc2FibGUnKSA9PiB2b2lkXG59XG5cbmNvbnN0IEFVVE9fRElTTUlTU19NUyA9IDMwXzAwMFxuXG5leHBvcnQgZnVuY3Rpb24gUGx1Z2luSGludE1lbnUoe1xuICBwbHVnaW5OYW1lLFxuICBwbHVnaW5EZXNjcmlwdGlvbixcbiAgbWFya2V0cGxhY2VOYW1lLFxuICBzb3VyY2VDb21tYW5kLFxuICBvblJlc3BvbnNlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBvblJlc3BvbnNlUmVmID0gUmVhY3QudXNlUmVmKG9uUmVzcG9uc2UpXG4gIG9uUmVzcG9uc2VSZWYuY3VycmVudCA9IG9uUmVzcG9uc2VcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoXG4gICAgICByZWYgPT4gcmVmLmN1cnJlbnQoJ25vJyksXG4gICAgICBBVVRPX0RJU01JU1NfTVMsXG4gICAgICBvblJlc3BvbnNlUmVmLFxuICAgIClcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVvdXRJZClcbiAgfSwgW10pXG5cbiAgZnVuY3Rpb24gb25TZWxlY3QodmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIHN3aXRjaCAodmFsdWUpIHtcbiAgICAgIGNhc2UgJ3llcyc6XG4gICAgICAgIG9uUmVzcG9uc2UoJ3llcycpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdkaXNhYmxlJzpcbiAgICAgICAgb25SZXNwb25zZSgnZGlzYWJsZScpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBvblJlc3BvbnNlKCdubycpXG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb3B0aW9ucyA9IFtcbiAgICB7XG4gICAgICBsYWJlbDogKFxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBZZXMsIGluc3RhbGwgPFRleHQgYm9sZD57cGx1Z2luTmFtZX08L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICksXG4gICAgICB2YWx1ZTogJ3llcycsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ05vJyxcbiAgICAgIHZhbHVlOiAnbm8nLFxuICAgIH0sXG4gICAge1xuICAgICAgbGFiZWw6IFwiTm8sIGFuZCBkb24ndCBzaG93IHBsdWdpbiBpbnN0YWxsYXRpb24gaGludHMgYWdhaW5cIixcbiAgICAgIHZhbHVlOiAnZGlzYWJsZScsXG4gICAgfSxcbiAgXVxuXG4gIHJldHVybiAoXG4gICAgPFBlcm1pc3Npb25EaWFsb2cgdGl0bGU9XCJQbHVnaW4gUmVjb21tZW5kYXRpb25cIj5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdYPXsyfSBwYWRkaW5nWT17MX0+XG4gICAgICAgIDxCb3ggbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIFRoZSA8VGV4dCBib2xkPntzb3VyY2VDb21tYW5kfTwvVGV4dD4gY29tbWFuZCBzdWdnZXN0cyBpbnN0YWxsaW5nIGFcbiAgICAgICAgICAgIHBsdWdpbi5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlBsdWdpbjo8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+IHtwbHVnaW5OYW1lfTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+TWFya2V0cGxhY2U6PC9UZXh0PlxuICAgICAgICAgIDxUZXh0PiB7bWFya2V0cGxhY2VOYW1lfTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHtwbHVnaW5EZXNjcmlwdGlvbiAmJiAoXG4gICAgICAgICAgPEJveD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPntwbHVnaW5EZXNjcmlwdGlvbn08L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dD5Xb3VsZCB5b3UgbGlrZSB0byBpbnN0YWxsIGl0PzwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtvblNlbGVjdH1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBvblJlc3BvbnNlKCdubycpfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC9QZXJtaXNzaW9uRGlhbG9nPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxNQUFNLFFBQVEsMkJBQTJCO0FBQ2xELFNBQVNDLGdCQUFnQixRQUFRLG9DQUFvQztBQUVyRSxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsVUFBVSxFQUFFLE1BQU07RUFDbEJDLGlCQUFpQixDQUFDLEVBQUUsTUFBTTtFQUMxQkMsZUFBZSxFQUFFLE1BQU07RUFDdkJDLGFBQWEsRUFBRSxNQUFNO0VBQ3JCQyxVQUFVLEVBQUUsQ0FBQ0MsUUFBUSxFQUFFLEtBQUssR0FBRyxJQUFJLEdBQUcsU0FBUyxFQUFFLEdBQUcsSUFBSTtBQUMxRCxDQUFDO0FBRUQsTUFBTUMsZUFBZSxHQUFHLE1BQU07QUFFOUIsT0FBTyxTQUFTQyxjQUFjQSxDQUFDO0VBQzdCUCxVQUFVO0VBQ1ZDLGlCQUFpQjtFQUNqQkMsZUFBZTtFQUNmQyxhQUFhO0VBQ2JDO0FBQ0ssQ0FBTixFQUFFTCxLQUFLLENBQUMsRUFBRUwsS0FBSyxDQUFDYyxTQUFTLENBQUM7RUFDekIsTUFBTUMsYUFBYSxHQUFHZixLQUFLLENBQUNnQixNQUFNLENBQUNOLFVBQVUsQ0FBQztFQUM5Q0ssYUFBYSxDQUFDRSxPQUFPLEdBQUdQLFVBQVU7RUFFbENWLEtBQUssQ0FBQ2tCLFNBQVMsQ0FBQyxNQUFNO0lBQ3BCLE1BQU1DLFNBQVMsR0FBR0MsVUFBVSxDQUMxQkMsR0FBRyxJQUFJQSxHQUFHLENBQUNKLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFDeEJMLGVBQWUsRUFDZkcsYUFDRixDQUFDO0lBQ0QsT0FBTyxNQUFNTyxZQUFZLENBQUNILFNBQVMsQ0FBQztFQUN0QyxDQUFDLEVBQUUsRUFBRSxDQUFDO0VBRU4sU0FBU0ksUUFBUUEsQ0FBQ0MsS0FBSyxFQUFFLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQztJQUNyQyxRQUFRQSxLQUFLO01BQ1gsS0FBSyxLQUFLO1FBQ1JkLFVBQVUsQ0FBQyxLQUFLLENBQUM7UUFDakI7TUFDRixLQUFLLFNBQVM7UUFDWkEsVUFBVSxDQUFDLFNBQVMsQ0FBQztRQUNyQjtNQUNGO1FBQ0VBLFVBQVUsQ0FBQyxJQUFJLENBQUM7SUFDcEI7RUFDRjtFQUVBLE1BQU1lLE9BQU8sR0FBRyxDQUNkO0lBQ0VDLEtBQUssRUFDSCxDQUFDLElBQUk7QUFDYix1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUNwQixVQUFVLENBQUMsRUFBRSxJQUFJO0FBQ3BELFFBQVEsRUFBRSxJQUFJLENBQ1A7SUFDRGtCLEtBQUssRUFBRTtFQUNULENBQUMsRUFDRDtJQUNFRSxLQUFLLEVBQUUsSUFBSTtJQUNYRixLQUFLLEVBQUU7RUFDVCxDQUFDLEVBQ0Q7SUFDRUUsS0FBSyxFQUFFLG9EQUFvRDtJQUMzREYsS0FBSyxFQUFFO0VBQ1QsQ0FBQyxDQUNGO0VBRUQsT0FDRSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyx1QkFBdUI7QUFDbkQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRCxRQUFRLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVE7QUFDeEIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDZixhQUFhLENBQUMsRUFBRSxJQUFJLENBQUM7QUFDakQ7QUFDQSxVQUFVLEVBQUUsSUFBSTtBQUNoQixRQUFRLEVBQUUsR0FBRztBQUNiLFFBQVEsQ0FBQyxHQUFHO0FBQ1osVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUk7QUFDdEMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUNILFVBQVUsQ0FBQyxFQUFFLElBQUk7QUFDbkMsUUFBUSxFQUFFLEdBQUc7QUFDYixRQUFRLENBQUMsR0FBRztBQUNaLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxJQUFJO0FBQzNDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDRSxlQUFlLENBQUMsRUFBRSxJQUFJO0FBQ3hDLFFBQVEsRUFBRSxHQUFHO0FBQ2IsUUFBUSxDQUFDRCxpQkFBaUIsSUFDaEIsQ0FBQyxHQUFHO0FBQ2QsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQ0EsaUJBQWlCLENBQUMsRUFBRSxJQUFJO0FBQ3BELFVBQVUsRUFBRSxHQUFHLENBQ047QUFDVCxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixVQUFVLENBQUMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLElBQUk7QUFDbkQsUUFBUSxFQUFFLEdBQUc7QUFDYixRQUFRLENBQUMsR0FBRztBQUNaLFVBQVUsQ0FBQyxNQUFNLENBQ0wsT0FBTyxDQUFDLENBQUNrQixPQUFPLENBQUMsQ0FDakIsUUFBUSxDQUFDLENBQUNGLFFBQVEsQ0FBQyxDQUNuQixRQUFRLENBQUMsQ0FBQyxNQUFNYixVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFN0MsUUFBUSxFQUFFLEdBQUc7QUFDYixNQUFNLEVBQUUsR0FBRztBQUNYLElBQUksRUFBRSxnQkFBZ0IsQ0FBQztBQUV2QiIsImlnbm9yZUxpc3QiOltdfQ==