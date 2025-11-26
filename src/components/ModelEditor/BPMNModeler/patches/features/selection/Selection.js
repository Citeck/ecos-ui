import Selection from 'diagram-js/lib/features/selection/Selection';

import { getRecordRef } from '@/helpers/urls';

// Cause: https://citeck.atlassian.net/browse/ECOSUI-2701
Selection.prototype.get = function () {
  const recordRef = getRecordRef();

  return this._selectedElements.filter(element => element.recordRef === recordRef);
};

export default Selection;
