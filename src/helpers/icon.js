import isString from 'lodash/isString';
import isObject from 'lodash/isObject';

import { SourcesId } from '../constants';

export function getIconObjectWeb(data) {
  let icon = { value: 'icon-empty-icon' };

  if (isString(data)) {
    const [_source, _value] = data.split('@');

    if (_value && _source) {
      icon.value = _value;
      icon.type = _source === SourcesId.ICON ? 'img' : 'icon';
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
