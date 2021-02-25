import ModelUtil from 'cmmn-js/lib/util/ModelUtil';
import { KEY_FIELD_NAME, PREFIX_FIELD, TYPE_CUSTOM } from '../../constants/cmmn';

export function getEcosType(element) {
  const definition = ModelUtil.getDefinition(element);
  return definition && definition.get ? definition.get(TYPE_CUSTOM) : '';
}

export function getValue(element, key) {
  if (!element || !key) {
    return;
  }

  if (key === KEY_FIELD_NAME) {
    return ModelUtil.getName(element);
  }

  return ModelUtil.getBusinessObject(element).get(PREFIX_FIELD + key);
}
