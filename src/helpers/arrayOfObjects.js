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

export function getIndexObjectByKV(array, key, value) {
  return array.findIndex(item => item[key] === value);
}

/**
 * Поиск певого элемент в дереве
 * @param items {Array} источник
 * @param key {String} ключ поля,
 * @param value {number|string|boolean} значение поля,
 * @returns {Object|undefined} найденный элемент
 */
export function treeFindFirstItem({ items, key, value }) {
  for (const item of items) {
    if (item[key] === value) {
      return item;
    }

    const sub = item.items && treeFindFirstItem({ items: item.items, key, value });

    if (sub) {
      return sub;
    }
  }
}

/**
 * Удаление певого найденного элемента
 * * изменяет массив
 * @param items {Array} источник
 * @param key {String} ключ поля,
 * @param value {number|string|boolean} значение поля,
 * @returns {Object|undefined} удаленный элемент
 */
export function treeRemoveItem({ items, key, value }) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item[key] === value) {
      return items.splice(i, 1)[0];
    }

    const sub = !!item.items && treeRemoveItem({ items: item.items, key, value });

    if (sub) {
      return sub;
    }
  }
}

/**
 * Добавление элемента
 * * изменяет массив
 * key и value для поиска ветки в которую вставлять
 * @param items {Array} источник
 * @param newItem {Object} новый элемент
 * @param key {String} ключ поля,
 * @param value {number|string|boolean} значение поля,
 * @param indexTo {number|undefined} куда вставлять, если не указано использует найденный i для value,
 * @returns {boolean} успешно ли вставлено
 */
export function treeAddItem({ items, newItem, key, value, indexTo }) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item[key] === value) {
      items.splice(indexTo != null ? indexTo : i + 1, 0, newItem);
      return true;
    }

    const sub = !!item.items && treeAddItem({ items: item.items, newItem, key, value, indexTo });

    if (sub) {
      return true;
    }
  }
}

/**
 * Получение координат элемента
 * @param items {Array} источник
 * @param key {String} ключ поля
 * @param value {number|string|boolean} значение поля
 * @returns {object} {уровень, родительИндекс, индекс}
 */
export function treeGetItemCoords({ items, key, value }) {
  function find(_items, level, parent) {
    for (let i = 0; i < _items.length; i++) {
      const item = _items[i];

      if (item[key] === value) {
        return { level, parent, index: i };
      }

      const sub = !!item.items && find(item.items, level++, i);

      if (sub) {
        return sub;
      }
    }
  }

  return find(items, 0, 0) || {};
}

/**
 * Получение пути к элементу
 * @param items {Array} источник
 * @param key {String} ключ поля,
 * @param value {number|string|boolean} значение поля,
 * @param _path {string} внутренняя переменная, не следует задавать инит значение без необходимости,
 * @returns {string} путь
 */
export function treeGetPathItem({ items, key, value }, _path = '') {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item[key] === value) {
      return `${_path}[${i}]`;
    }

    const sub = !!item.items && treeGetPathItem({ items: item.items, key, value }, `${_path}[${i}]items`);

    if (sub) {
      return sub;
    }
  }
}

/**
 * Перемещение элемента из одной вветки в другую
 * путь состоит только из индексов пр. 0.1.1.0
 * @param original {Array} источник
 * @param key {String} ключ поля,
 * @param fromId {number|string|boolean} уникальное значение поля перемещаяего элемента,
 * @param toId {number|string|boolean} уникальное значение поля к которому перемещают,
 * @returns {Array} обновленное дерево
 */
export function treeMoveItem({ fromId, toId, original, key = 'id' }) {
  if (fromId === toId || !original) {
    return original;
  }

  const items = deepClone(original);

  const infoTo = treeGetItemCoords({ items, key, value: toId });
  const infoFrom = treeGetItemCoords({ items, key, value: fromId });
  const movedItem = treeRemoveItem({ items, key, value: fromId });

  treeAddItem({
    items,
    key,
    value: toId,
    newItem: movedItem,
    indexTo: infoTo.parent === infoFrom.parent ? infoTo.index : undefined
  });

  return items;
}

export function treeSetDndIndex(items, callback) {
  const _items = deepClone(items);

  const _set = (list, level, parent) => {
    list &&
      list.forEach((item, index) => {
        callback && callback(item, index);
        item.dndIdx = parseInt(`${level}${parent}${index}`, 10);
        item.items && _set(item.items, level + 1, parseInt(`${parent}${index}`));
      });
  };

  _set(_items, 0, 0);

  return _items;
}
