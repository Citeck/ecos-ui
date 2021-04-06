import UpdatePropertiesHandler from 'bpmn-js/lib/features/modeling/cmd/UpdatePropertiesHandler';

const originalExecute = UpdatePropertiesHandler.prototype.execute;

UpdatePropertiesHandler.prototype.execute = function(context) {
  const element = context.element;
  const translate = this._translate;

  if (!element) {
    throw new Error(translate('element required'));
  }

  context.element.businessObject = context.element.businessObject || context.element;

  return originalExecute.call(this, context);
};
