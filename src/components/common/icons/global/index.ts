export const reactIconsModules = import.meta.glob('./*.[t|j]sx', { eager: true });

const reactIcons = Object.values(reactIconsModules).map((module, index) => ({
  type: 'react-icon',
  value: Object.keys(reactIconsModules)[index],
  // @ts-ignore
  Component: module.default
}));

export default reactIcons || [];
