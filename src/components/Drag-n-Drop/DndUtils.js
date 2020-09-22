import { cloneDeep } from 'lodash';
import uuidV4 from 'uuid/v4';

import { deepClone } from '../../helpers/util';

export default class DndUtils {
  static reorder = (list, startIndex, endIndex) => {
    const result = cloneDeep(list);
    const [removed] = result.splice(startIndex, 1);

    result.splice(endIndex, 0, removed);

    return result;
  };

  static move = (source = [], destination = [], droppableSource, droppableDestination) => {
    const sourceClone = cloneDeep(source);
    const destClone = cloneDeep(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);
    const result = {};

    destClone.splice(droppableDestination.index, 0, removed);
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
  };

  static copy = (source = [], destination = [], droppableSource, droppableDestination, newDndId = false) => {
    const sourceClone = cloneDeep(source);
    const destClone = cloneDeep(destination);
    const item = sourceClone[droppableSource.index];

    if (newDndId) {
      item.dndId = uuidV4();
    }

    if (!item.id) {
      item.id = uuidV4();
    }

    destClone.splice(droppableDestination.index, 0, { ...item });

    return DndUtils.setDndId(destClone);
  };

  static setDndId = items => {
    const arr = deepClone(items, []);

    arr.forEach(value => {
      if (!value.dndId) {
        value.dndId = uuidV4();
      }
    });

    return arr;
  };
}
