import Base from 'formiojs/components/base/Base';
import NestedComponent from 'formiojs/components/nested/NestedComponent';

NestedComponent.prototype.checkConditions = function(data) {
  const result = Base.prototype.checkConditions.call(this, data);

  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2967
  if (result) {
    this.getComponents().forEach(comp => comp.checkConditions(data));
  }

  return result;
};

export default NestedComponent;
