import EcosTaskPalette from './ecosTask/EcosTaskPalette';
import EcosTaskRenderer from './ecosTask/EcosTaskRenderer';
import EcosTaskContextPad from './ecosTask/EcosTaskContextPad';
import lintModule from './linter';

export const onlyRenderer = {
  __init__: ['customRenderer'],
  customRenderer: ['type', EcosTaskRenderer]
};

export default [
  {
    __init__: ['customContextPad', 'customPalette', 'customRenderer'],
    customContextPad: ['type', EcosTaskContextPad],
    customPalette: ['type', EcosTaskPalette],
    customRenderer: ['type', EcosTaskRenderer]
  },
  lintModule
];
