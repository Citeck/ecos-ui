import isString from 'lodash/isString';
import isObject from 'lodash/isObject';

import { SourcesId } from '../constants';

export function getIconObjectWeb(data) {
  let icon = { value: 'icon-empty-icon' };

  if (isString(data)) {
    const [source, value] = data.split('@');

    if (value && source) {
      icon.value = value;
      icon.type = source === SourcesId.ICON ? 'img' : 'icon';
    }
  } else {
    icon = { ...icon, ...data };
  }

  return icon;
}

export function getIconRef(icon) {
  if (isObject(icon)) {
    const source = icon.type === 'img' ? SourcesId.ICON : SourcesId.FONT_ICON;
    const value = icon.value;

    return `${source}@${value}`;
  }

  return icon;
}
