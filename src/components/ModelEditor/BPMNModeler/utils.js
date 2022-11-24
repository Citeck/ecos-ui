import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

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
  return function(_key, object = {}) {
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
