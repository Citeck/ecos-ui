import ActionPalette from './ActionPalette';
import CustomRenderer from './CustomRenderer';
import CustomReplaceMenuProvider from './CustomReplaceMenuProvider';

export default {
  __init__: ['actionPalette', 'replaceMenuProvider', 'customRenderer'],
  actionPalette: ['type', ActionPalette],
  replaceMenuProvider: ['type', CustomReplaceMenuProvider],
  customRenderer: ['type', CustomRenderer]
};
