export function matchCardDetailsLinkFormatterColumn(column) {
  return column.attribute === 'cm:name' || column.attribute === 'cm:title';
}
