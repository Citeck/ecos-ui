import LabelEditingProvider from 'bpmn-js/lib/features/label-editing/LabelEditingProvider';
import { is } from 'bpmn-js/lib/util/ModelUtil';

import { TYPE_BPMN_ANNOTATION } from '@/constants/bpmn';

// TODO separate update logic from editior and formio
LabelEditingProvider.prototype.update = function (element, newLabel, _activeContextText, _bounds) {
  let newBounds;

  if (is(element, TYPE_BPMN_ANNOTATION)) {
    newBounds = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };
  }

  if (!newLabel || !newLabel.trim()) {
    newLabel = null;
  }

  this._modeling.updateLabel(element, newLabel, newBounds);
};

export default LabelEditingProvider;
