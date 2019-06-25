import { deepClone } from './util';

/**
 * Возвращает новый массив отсортированный по заданному полю
 * @param array {Array} источник
 * @param key {String} ключ поля
 * @returns {Array} отсортированный массив
 */
export function sort(array, key) {
  const arr = deepClone(array);

  return deepClone(arr).sort((c, n) => c[key] - n[key]);
}

/**
 * Возвращает новый массив объектов с измененными ключами;
 * @param array {Array} источник
 * @param oKeys {Object} объект в котором ключ = ключу в объекте массива, а значение новому ключу => {key: "newKey"}
 * @returns {Array} массив с обновленными ключами объектов
 */
export function replaceKeys(array, oKeys) {
  const arr = deepClone(array);

  if (!oKeys || (oKeys && !Object.keys(oKeys).length)) {
    return arr;
  }

  return arr.map(item => {
    const newItem = deepClone(item);

    for (const key in newItem) {
      if (newItem.hasOwnProperty(key) && oKeys.hasOwnProperty(key)) {
        newItem[oKeys[key]] = item[key];
        delete newItem[key];
      }
    }

    return newItem;
  });
}

/**
 * Фильтрация ключей
 * @param array {Array} источник
 * @param aKeys {Array} массив ключей,
 * @returns {Array} массив объектов с указанными ключами
 */
export function filterKeys(array, aKeys) {
  const arr = deepClone(array);

  return arr.map(item => {
    const newItem = {};

    for (const key in item) {
      if (item.hasOwnProperty(key) && aKeys.includes(key)) {
        newItem[key] = item[key];
      }
    }

    return newItem;
  });
}

/**
 * Возврат объекта из массива по ключу и его значению
 * @param array {Array} источник
 * @param key {String} свойство искомого объекта
 * @param value {any} значение ключа в объекте
 * @returns {{}}
 */
export function getObjectByKV(array, key, value) {
  return array.find(item => item[key] === value) || {};
}
