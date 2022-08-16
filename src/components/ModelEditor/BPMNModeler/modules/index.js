import EcosTaskPalette from './ecosTask/EcosTaskPalette';
import EcosTaskRenderer from './ecosTask/EcosTaskRenderer';
import EcosTaskContextPad from './ecosTask/EcosTaskContextPad';

export default {
  __init__: ['customContextPad', 'customPalette', 'customRenderer'],
  customContextPad: ['type', EcosTaskContextPad],
  customPalette: ['type', EcosTaskPalette],
  customRenderer: ['type', EcosTaskRenderer]
};
