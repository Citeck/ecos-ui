import isObject from 'lodash/isObject';

/**
 * @typedef {('FILTER'|'CELL'|'OTHER')} EditorScope
 */
export const getCellValue = cell => {
  if (Array.isArray(cell)) {
    return cell.map(getCellValue);
  }

  if (isObject(cell)) {
    // return cell.value; // @todo uncomment when api is ready
    return cell.value !== undefined ? cell.value : cell.assoc; // @todo remove when api is ready
  }

  return cell;
};
