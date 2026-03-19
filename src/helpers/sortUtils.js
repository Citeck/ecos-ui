import isNil from 'lodash/isNil';

import { COLUMN_TYPE_NEW_TO_LEGACY_MAPPING } from '@/components/Journals/service/util';

const DESCENDING_FIRST_TYPES = [
  COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.DATE,
  COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.DATETIME,
  COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.NUMBER
];

export function getDefaultSortAscending(columnType) {
  return !DESCENDING_FIRST_TYPES.includes(columnType);
}

export function getNextSortAscending(currentAscending, columnType) {
  if (isNil(currentAscending)) {
    return getDefaultSortAscending(columnType);
  }
  return !currentAscending;
}
