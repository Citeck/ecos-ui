import get from 'lodash/get';
import isElement from 'lodash/isElement';
import isString from 'lodash/isString';

const DEFAULT_Z_INDEX = 10000;

export default class ZIndex {
  static topZ = DEFAULT_Z_INDEX;

  static calcZ(searchZIndexModalClassName = '', isPriorityModal = false) {
    const modalClassName = !!searchZIndexModalClassName?.trim() ? `.${searchZIndexModalClassName.trim()}` : '';
    const modals = document.querySelectorAll(`${modalClassName}.ecosZIndexAnchor`);
    let count = modals.length;

    if (isPriorityModal && modals) {
      const maxZIndex =
        Math.max(
          ...Array.from(modals)
            .map(modal => get(modal, 'style.zIndex') && Number(modal.style.zIndex))
            .filter(Boolean)
        ) || 0;

      if (maxZIndex > DEFAULT_Z_INDEX) {
        count = maxZIndex - DEFAULT_Z_INDEX;
      }
    }

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
