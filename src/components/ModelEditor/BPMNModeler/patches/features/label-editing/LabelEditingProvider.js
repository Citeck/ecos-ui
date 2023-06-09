import LabelEditingProvider from 'bpmn-js/lib/features/label-editing/LabelEditingProvider';
import { is } from 'bpmn-js/lib/util/ModelUtil';

LabelEditingProvider.prototype.update = function(element, newLabel, _activeContextText, _bounds) {
  let newBounds;

  if (is(element, 'bpmn:TextAnnotation')) {
    newBounds = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    };
  }

  if (!newLabel || !newLabel.trim()) {
    newLabel = null;
  }

  this._modeling.updateLabel(element, newLabel, newBounds);
};

export default LabelEditingProvider;
