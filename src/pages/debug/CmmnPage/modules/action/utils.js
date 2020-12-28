export function createAction(elementFactory, cmmnFactory) {
  return elementFactory.createShape({
    type: 'cmmn:PlanItem',
    businessObject: (function() {
      var definition = cmmnFactory.create('cmmn:Task', {
        'ecos:cmmnType': 'Action'
      });
      return cmmnFactory.create('cmmn:PlanItem', {
        definitionRef: definition
      });
    })()
  });
}

export function getEcosType(element) {
  const definition = ((element || {}).businessObject || {}).definitionRef;
  return definition && definition.get ? definition.get('ecos:cmmnType') : '';
}
