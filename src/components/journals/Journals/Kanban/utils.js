export function isDropDisabled({ readOnly, isLoadingCol, columnInfo }) {
  return readOnly || isLoadingCol || columnInfo.id === 'EMPTY';
}
