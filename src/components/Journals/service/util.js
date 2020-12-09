export function getCreateVariantKeyField(createVariant) {
  return Object.keys(createVariant).filter(key => !!createVariant[key] && typeof createVariant[key] === 'string');
}
