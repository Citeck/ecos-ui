import Modeling from 'bpmn-js/lib/features/modeling/Modeling';

Modeling.prototype.updateProperties = function (element, properties, withClear) {
  this._commandStack.execute('element.updateProperties', {
    element: element,
    properties: properties,
    withClear
  });
};
