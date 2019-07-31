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
  const checkNumber = num => num && isNumber(num) && num > 0;

  const fH = toFinite(fixedHeight);
  const min = toFinite(minHeight);
  const max = toFinite(maxHeight);

  let cH = toFinite(contentHeight);

  if (isMin && checkNumber(min)) {
    return min;
  }

  if (isNumber(fixedHeight)) {
    return fH;
  }

  if (checkNumber(cH)) {
    if (checkNumber(min)) {
      cH = cH < min ? min : cH;
    }

    if (checkNumber(max)) {
      return cH > max ? max : cH;
    }

    return cH;
  }
}
