import ActionContextPad from './ActionContextPad';
import ActionPalette from './ActionPalette';
// import ReplaceMenuProvider from './ReplaceMenu';
import CustomRules from './CustomRules';

export default {
  __init__: [
    'actionContextPad',
    'actionPalette',
    // 'replaceMenuProvider'
    'customRules'
  ],
  actionContextPad: ['type', ActionContextPad],
  actionPalette: ['type', ActionPalette],
  customRules: ['type', CustomRules]
  // replaceMenuProvider: [ 'type', ReplaceMenuProvider ]
};
