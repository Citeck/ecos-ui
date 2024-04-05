import BpmnColorPickerModule from 'bpmn-js-color-picker';

import EcosTaskPalette from './ecosTask/EcosTaskPalette';
import EcosTaskRenderer from './ecosTask/EcosTaskRenderer';
import EcosKPIRenderer from './ecosTask/EcosKPIRenderer';
import EcosNumberRenderer from './ecosTask/EcosNumberRenderer';
import EcosTaskContextPad from './ecosTask/EcosTaskContextPad';
import lintModule from './linter';

export const onlyRenderer = {
  __init__: ['customRenderer', 'KPIRenderer', 'numberRenderer'],
  numberRenderer: ['type', EcosNumberRenderer],
  KPIRenderer: ['type', EcosKPIRenderer],
  customRenderer: ['type', EcosTaskRenderer]
};

export default [
  {
    __init__: ['customContextPad', 'customPalette', 'customRenderer', 'KPIRenderer', 'numberRenderer'],
    customContextPad: ['type', EcosTaskContextPad],
    customPalette: ['type', EcosTaskPalette],
    numberRenderer: ['type', EcosNumberRenderer],
    KPIRenderer: ['type', EcosKPIRenderer],
    customRenderer: ['type', EcosTaskRenderer]
  },
  lintModule,
  BpmnColorPickerModule
];
