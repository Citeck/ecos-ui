export const GROUP_CUSTOM = 'custom';

export function getEcosType(element) {
  const definition = ((element || {}).businessObject || {}).definitionRef;

  return definition && definition.get ? definition.get('ecos:cmmnType') : '';
}
