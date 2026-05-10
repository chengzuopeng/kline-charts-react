import type { EChartsOption } from 'echarts';
import { mergeOption, DATA_ZOOM_INSIDE_ID, DATA_ZOOM_SLIDER_ID } from './optionBuilder';

describe('mergeOption (safeMerge)', () => {
  it('preserves internal dataZoom IDs while applying user overrides', () => {
    const base: EChartsOption = {
      dataZoom: [
        { id: DATA_ZOOM_INSIDE_ID, type: 'inside', start: 70, end: 100 },
        { id: DATA_ZOOM_SLIDER_ID, type: 'slider', start: 70, end: 100 },
      ],
    };
    const custom: EChartsOption = {
      dataZoom: [{ id: DATA_ZOOM_SLIDER_ID, height: 30 }],
    };
    const merged = mergeOption(base, custom);
    const items = merged.dataZoom as Array<{ id?: string; type?: string; height?: number }>;

    // 内部两个 id 都还在
    expect(items.find((i) => i.id === DATA_ZOOM_INSIDE_ID)).toBeDefined();
    const slider = items.find((i) => i.id === DATA_ZOOM_SLIDER_ID);
    expect(slider).toBeDefined();
    expect(slider!.type).toBe('slider'); // 原字段保留
    expect(slider!.height).toBe(30); // 新字段被合入
  });

  it('appends user-only dataZoom items that do not collide with internal IDs', () => {
    const base: EChartsOption = {
      dataZoom: [{ id: DATA_ZOOM_INSIDE_ID, type: 'inside' }],
    };
    const custom: EChartsOption = {
      dataZoom: [{ id: 'user-extra', type: 'slider' }],
    };
    const merged = mergeOption(base, custom);
    const items = merged.dataZoom as Array<{ id?: string }>;
    expect(items.map((i) => i.id)).toEqual(
      expect.arrayContaining([DATA_ZOOM_INSIDE_ID, 'user-extra'])
    );
  });

  it('replaces the whole option when mode is "replace"', () => {
    const base: EChartsOption = { backgroundColor: '#fff' };
    const custom: EChartsOption = { backgroundColor: '#000' };
    expect(mergeOption(base, custom, 'replace')).toBe(custom);
  });

  it('shallow merges plain object fields (e.g. tooltip)', () => {
    const base: EChartsOption = { tooltip: { trigger: 'axis', show: true } };
    const custom: EChartsOption = { tooltip: { show: false } };
    const merged = mergeOption(base, custom) as { tooltip: { trigger: string; show: boolean } };
    expect(merged.tooltip.trigger).toBe('axis');
    expect(merged.tooltip.show).toBe(false);
  });
});
