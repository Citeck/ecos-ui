import ModelUtil from 'cmmn-js/lib/util/ModelUtil';

import { KEY_FIELD_NAME, ML_POSTFIX, PREFIX_FIELD, TYPE_CUSTOM } from '../../../constants/cmmn';

export function getEcosType(element) {
  const definition = ModelUtil.getDefinition(element);
  return definition && definition.get ? definition.get(TYPE_CUSTOM) : '';
}

function getName(element, key) {
  element = ModelUtil.getBusinessObject(element);

  if (ModelUtil.is(element, 'cmmndi:CMMNEdge') && element.cmmnElementRef) {
    element = element.cmmnElementRef;
  }

  let name = element.name;

  if (element.get(PREFIX_FIELD + key)) {
    name = element.get(PREFIX_FIELD + key);
  }

  if (!name) {
    if (element.definitionRef) {
      name = element.definitionRef.name;
    }
  }

  return name;
}

export function getValue(element, key) {
  if (!element || !key) {
    return;
  }

  if (key === KEY_FIELD_NAME || (key.endsWith(ML_POSTFIX) && key.replace(ML_POSTFIX, '') === KEY_FIELD_NAME)) {
    return getName(element, key);
  }

  return ModelUtil.getBusinessObject(element).get(PREFIX_FIELD + key);
}
