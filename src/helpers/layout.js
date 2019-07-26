import { LAYOUT_TYPE, MIN_WIDTH_COLUMN } from '../constants/layout';
import { isNumber, toFinite } from 'lodash';

/**
 * Получение минимальной ширины колонки по виду лайоута
 * @param typeLayout {string} вид макета
 * @param colNum {number} порядковый номер колонки
 * @returns {string} мин ширина с единиц изм.
 */
export function getMinWidthColumn(typeLayout, colNum) {
  switch (typeLayout) {
    case LAYOUT_TYPE.ONE_COLUMN:
      return MIN_WIDTH_COLUMN.FULL;
    case LAYOUT_TYPE.TWO_COLUMNS_BS:
      return colNum === 0 ? MIN_WIDTH_COLUMN.THREE_QUARTERS : MIN_WIDTH_COLUMN.ONE_QUARTER;
    case LAYOUT_TYPE.TWO_COLUMNS_SB:
      return colNum === 0 ? MIN_WIDTH_COLUMN.ONE_QUARTER : MIN_WIDTH_COLUMN.THREE_QUARTERS;
    case LAYOUT_TYPE.THREE_COLUMNS_CB:
      return colNum === 1 ? MIN_WIDTH_COLUMN.TWO_QUARTERS : MIN_WIDTH_COLUMN.ONE_QUARTER;
    case LAYOUT_TYPE.FOUR_COLUMNS:
      return MIN_WIDTH_COLUMN.ONE_QUARTER;
    default:
      return MIN_WIDTH_COLUMN.ONE_QUARTER;
  }
}

export function getOptimalHeight(fixedHeight, contentHeight, minHeight, maxHeight, isMin) {
  const checkNumber = num => num && isNumber(toFinite(num)) && num > 0;

  if (isMin && checkNumber(minHeight)) {
    return toFinite(minHeight);
  }

  if (checkNumber(fixedHeight)) {
    return toFinite(fixedHeight);
  }

  if (checkNumber(contentHeight) && checkNumber(maxHeight)) {
    return toFinite(contentHeight) > toFinite(maxHeight) ? toFinite(maxHeight) : toFinite(contentHeight);
  }

  return '100%';
}
