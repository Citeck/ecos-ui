import isNumber from 'lodash/isNumber';
import React from 'react';

type ReactIconType = {
  type: string;
  value: string;
  weight: number;
  Component: React.ComponentType;
};

export const reactIconsModules = import.meta.glob('./*.[t|j]sx', { eager: true });
export const sortReactIconModules = (a: ReactIconType, b: ReactIconType) => a.weight - b.weight;

const reactIcons: ReactIconType[] = Object.values(reactIconsModules)
  .map((module, index) => ({
    type: 'react-icon',
    value: Object.keys(reactIconsModules)[index],
    // @ts-ignore
    weight: isNumber(module.weight) ? module.weight : 9999,
    // @ts-ignore
    Component: module.default
  }))
  .sort(sortReactIconModules);

export default reactIcons || [];
