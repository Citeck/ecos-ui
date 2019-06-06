import { cloneDeep } from 'lodash';
import uuidV4 from 'uuid/v4';

export default class DndUtils {
  static reorder = (list, droppableSource, droppableDestination) => {
    const result = cloneDeep(list);
    const [removed] = result.splice(droppableSource.index, 1);

    result.splice(droppableDestination.index, 0, removed);

    return result;
  };

  static move = (source, destination, droppableSource, droppableDestination) => {
    source = source || [];
    destination = destination || [];

    const sourceClone = cloneDeep(source);
    const destClone = cloneDeep(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);
    const result = {};

    destClone.splice(droppableDestination.index, 0, removed);
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
  };

  static copy = (source, destination, droppableSource, droppableDestination) => {
    source = source || [];
    destination = destination || [];

    const sourceClone = cloneDeep(source);
    const destClone = cloneDeep(destination);
    const item = sourceClone[droppableSource.index];

    destClone.splice(droppableDestination.index, 0, { ...item });

    return DndUtils.setDndId(destClone);
  };

  static setDndId = items => {
    const arr = Array.from(items || []); //fixme cloneDeep

    arr.forEach(value => (value.dndId = uuidV4()));

    return arr;
  };
}
