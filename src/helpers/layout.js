import { isNumber, isSafeInteger, toFinite } from 'lodash';

import { Layouts, LayoutTypes, MinColumnWidths } from '../constants/layout';

/**
 * Получение минимальной ширины колонки по виду лайоута
 * @param typeLayout {string} вид макета
 * @param colNum {number} порядковый номер колонки
 * @returns {string} мин ширина с единиц изм.
 */
export function getMinWidthColumn(typeLayout, colNum) {
  switch (typeLayout) {
    case LayoutTypes.ONE_COLUMN:
      return MinColumnWidths.FULL;
    case LayoutTypes.TWO_COLUMNS_BS:
      return colNum === 0 ? MinColumnWidths.THREE_QUARTERS : MinColumnWidths.ONE_QUARTER;
    case LayoutTypes.TWO_COLUMNS_SB:
      return colNum === 0 ? MinColumnWidths.ONE_QUARTER : MinColumnWidths.THREE_QUARTERS;
    case LayoutTypes.THREE_COLUMNS_CB:
      return colNum === 1 ? MinColumnWidths.TWO_QUARTERS : MinColumnWidths.ONE_QUARTER;
    case LayoutTypes.FOUR_COLUMNS:
      return MinColumnWidths.ONE_QUARTER;
    case LayoutTypes.MOBILE:
      return MinColumnWidths.AUTO;
    default:
      return MinColumnWidths.ONE_QUARTER;
  }
}

export function getOptimalHeight(fixedHeight, contentHeight, minHeight, maxHeight, isMin) {
  const checkNumber = num => num && isNumber(num) && num > 0;

  const min = toFinite(minHeight);
  const max = toFinite(maxHeight);

  let cH = toFinite(contentHeight);

  if (isMin && checkNumber(min)) {
    return min;
  }

  if (isSafeInteger(parseInt(fixedHeight))) {
    return fixedHeight;
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

  return min;
}

export function getLayouts(dashboardType) {
  if (!dashboardType) {
    return Layouts;
  }

  return Layouts.filter(layout => {
    if (!layout.allowedDashboards.length) {
      return true;
    }

    return layout.allowedDashboards.includes(dashboardType);
  });
}
