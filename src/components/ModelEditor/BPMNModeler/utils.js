import { getBusinessObject } from 'cmmn-js/lib/util/ModelUtil';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import uuidV4 from 'uuidv4';

import { getName } from '../CMMNModeler/utils';

import { PARTICIPANT_TYPE } from '@/constants/bpmn';
import { KEY_FIELD_NAME, ML_POSTFIX, PREFIX_FIELD } from '@/constants/cmmn';

export function createReviver(moddle) {
  const elCache = {};

  /**
   * The actual reviewer that creates model instances
   * for elements with a $type attribute.
   *
   * Elements with ids will be re-used, if already
   * created.
   *
   * @param  {String} key
   * @param  {Object} object
   *
   * @return {Object} actual element
   */
  return function (_key, object = {}) {
    if (!isEmpty(object) && isString(object.$type)) {
      const objectId = object.id;

      if (objectId && elCache[objectId]) {
        return elCache[objectId];
      }

      const type = object.$type;
      const attrs = Object.assign({}, object);

      delete attrs.$type;

      const newEl = moddle.create(type, attrs);

      if (objectId) {
        elCache[objectId] = newEl;
      }

      return newEl;
    }

    return object;
  };
}

export function getValue(element, key) {
  if (!element || !key) {
    return;
  }

  if (key === KEY_FIELD_NAME || (key.endsWith(ML_POSTFIX) && key.replace(ML_POSTFIX, '') === KEY_FIELD_NAME)) {
    return getName(element, key);
  }

  if (element.type === PARTICIPANT_TYPE && key === 'processRef') {
    return get(getBusinessObject(element), 'processRef.id', `Process_${uuidV4()}`);
  }

  if (element.type === PARTICIPANT_TYPE && key === 'ecosType') {
    return get(getBusinessObject(element.parent), '$parent.$attrs["ecos:ecosType"]', '');
  }

  return getBusinessObject(element).get(PREFIX_FIELD + key);
}

export function isEventSubProcess(element) {
  return element && !!getBusinessObject(element).triggeredByEvent;
}
