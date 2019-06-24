import { deepClone } from './util';

/**
 * Возвращает новый массив отсортированный по заданному полю
 * @param key {String} ключ поля
 * @param array {Array|undefined} источник если не передается используется DisplayedColumns.displayedColumns
 * @returns {Array} отсортированный массив
 */
export function sort(key, array) {
  const arr = deepClone(array);

  return deepClone(arr).sort((c, n) => c[key] - n[key]);
}

/**
 * Возвращает новый массив объектов с измененными ключами;
 * @param oKeys {Object} объект в котором ключ = ключу в объекте displayedColumns[i],
 * а значение новому ключу => {key: "newKey"}
 * @param array {Array|undefined} источник если не передается используется DisplayedColumns.displayedColumns
 * @returns {Array} массив с обновленными ключами объектов
 */
export function replaceKeys(oKeys, array) {
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
 * @param aKeys {Array} массив ключей,
 * а значение новому ключу => {key: "newKey"}
 * @param array {Array|undefined} источник если не передается используется DisplayedColumns.displayedColumns
 * @returns {Array} массив объектов с указанными ключами
 */
export function filterKeys(aKeys, array) {
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
