import React from 'react';

import Journal from '../Journal';
import Model from '../Model';
import Settings from '../Settings';
import Widget from '../Widget';

jest.mock('../Model', () => () => null);
jest.mock('../Journal', () => () => null);
jest.mock('@/plugins', () => ({ HeatmapWrapper: jest.fn() }));
jest.mock('@/components/dashboard/widgets/BaseWidget', () => ({
  __esModule: true,
  default: class extends require('react').Component {
    reload() {}
  }
}));
jest.mock('@/components/dashboard/Dashlet', () => () => null);
jest.mock('@/components/common', () => ({ Loader: () => null }));
jest.mock('@/components/common/btns', () => ({ Btn: () => null }));
jest.mock('@/components/common/form', () => ({
  Caption: () => null,
  Checkbox: () => null,
  Field: () => null,
  Select: () => null
}));

const descendants = node => {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(descendants)];
};

describe('Process Statistics persisted mode', () => {
  test.each([
    ['EXTENDED_MODE', 'heatmap'],
    ['SIMPLIFIED_MODE', 'default'],
    ['KPI_MODE', 'kpi'],
    ['unknown-mode', 'heatmap'],
    [null, 'heatmap'],
    ['', 'heatmap'],
    [undefined, 'heatmap'],
    ['heatmap', 'heatmap'],
    ['kpi', 'kpi'],
    ['default', 'default']
  ])('loads %p safely as %p in the model and settings', (storedMode, expectedMode) => {
    const config = { formMode: storedMode, showModelDefault: true, showJournalDefault: true };
    const widget = new Widget({ id: 'mode-test', record: 'eproc/bpmn-def@assignment-process', config });
    widget.state = { ...widget.state, isAccessible: true, modelConfig: config };
    const nodes = descendants(widget.render());
    expect(nodes.find(node => node.type === Model).props.formMode).toBe(expectedMode);
    expect(nodes.some(node => node.type === Journal)).toBe(expectedMode === 'heatmap');

    const save = jest.fn();
    const settings = new Settings({ config, onSave: save });
    // Class state update is synchronous here; exercise the actual save payload.
    settings.setState = update => Object.assign(settings.state, update);
    settings.onSave();
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ formMode: expectedMode }));
    expect(config.formMode).toBe(storedMode);
  });
});

describe('Process Statistics reporting restrictions', () => {
  test.each(['EXTENDED_MODE', 'SIMPLIFIED_MODE', 'KPI_MODE', 'heatmap', 'default', 'kpi'])(
    'preserves reporting restrictions for %p',
    formMode => {
      const config = { formMode, showModelDefault: true, showHeatmapDefault: true, showCountersDefault: true, showJournalDefault: true };
      const widget = new Widget({ id: 'restricted', record: 'eproc/bpmn-def@assignment-process', config });
      widget.setState = update => Object.assign(widget.state, update);
      widget.getIsExtendedMode();
      const nodes = descendants(widget.render());
      const model = nodes.find(node => node.type === Model);
      expect(model.props.showHeatmapDefault).toBe(false);
      expect(model.props.showCountersDefault).toBe(false);
      expect(nodes.some(node => node.type === Journal)).toBe(false);
      expect(widget.dashletActions).not.toHaveProperty('settings');
    }
  );
});
