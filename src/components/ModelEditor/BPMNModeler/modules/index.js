import BpmnColorPickerModule from 'bpmn-js-color-picker';

import EcosTaskPalette from './ecosTask/EcosTaskPalette';
import EcosTaskRenderer from './ecosTask/EcosTaskRenderer';
import EcosNumberRenderer from './ecosTask/EcosNumberRenderer';
import EcosTaskContextPad from './ecosTask/EcosTaskContextPad';
import lintModule from './linter';

export const onlyRenderer = {
  __init__: ['customRenderer', 'numberRenderer'],
  numberRenderer: ['type', EcosNumberRenderer],
  customRenderer: ['type', EcosTaskRenderer]
};

export default [
  {
    __init__: ['customContextPad', 'customPalette', 'customRenderer', 'numberRenderer'],
    customContextPad: ['type', EcosTaskContextPad],
    customPalette: ['type', EcosTaskPalette],
    numberRenderer: ['type', EcosNumberRenderer],
    customRenderer: ['type', EcosTaskRenderer]
  },
  lintModule,
  BpmnColorPickerModule
];
