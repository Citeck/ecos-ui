import ActionContextPad from './ActionContextPad';
import ActionPalette from './ActionPalette';
import ReplaceMenuProvider from './ReplaceMenu';
import CustomRules from './CustomRules';
import CustomRenderer from './CustomRenderer';
import CustomElementFactory from './CustomElementFactory';
// import ReplaceMenuProvider from './ReplaceMenuProvider';

export default {
  __init__: [
    'actionContextPad',
    'actionPalette',
    'replaceMenuProvider',
    'customRules',
    'customRenderer'
    // 'elementFactory'
  ],
  actionContextPad: ['type', ActionContextPad],
  actionPalette: ['type', ActionPalette],
  customRules: ['type', CustomRules],
  replaceMenuProvider: ['type', ReplaceMenuProvider],
  customRenderer: ['type', CustomRenderer]
  // elementFactory: [ 'type', CustomElementFactory ],
};
