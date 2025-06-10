import isElement from 'lodash/isElement';
import isString from 'lodash/isString';

const DEFAULT_Z_INDEX = 10000;

export default class ZIndex {
  static topZ = DEFAULT_Z_INDEX;

  static calcZ(searchZIndexModalClassName = '') {
    const modalClassName = !!searchZIndexModalClassName?.trim() ? `.${searchZIndexModalClassName.trim()}` : '';

    const modals = document.querySelectorAll(`${modalClassName}.ecosZIndexAnchor`);
    const count = modals.length;

    ZIndex.topZ = DEFAULT_Z_INDEX + count;

    return ZIndex.topZ;
  }

  static setZ(data, zIndex) {
    const elm = isString(data) ? document.querySelector(`.${data} .ecosZIndexAnchor`) : data;

    if (isElement(elm)) {
      elm.style.zIndex = String(zIndex || ZIndex.topZ);
    }
  }
}
