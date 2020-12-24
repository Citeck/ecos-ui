import ReplaceMenuProvider from 'cmmn-js/lib/features/popup-menu/ReplaceMenuProvider';

const originGetEntries = ReplaceMenuProvider.prototype.getEntries;

ReplaceMenuProvider.prototype.getEntries = function(element) {
  const entries = originGetEntries.call(this, element);

  console.warn('getEntries => ', { entries, element });

  return entries;
};

export default ReplaceMenuProvider;
