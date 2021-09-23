import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';

import { SourcesId, TMP_ICON_EMPTY } from '../constants';

export function getIconObjectWeb(data) {
  let icon = { value: TMP_ICON_EMPTY };

  if (isString(data)) {
    if (!isEmpty(data) && !data.includes('@')) {
      icon.value = data;

      return icon;
    }

    const [_source, _value] = data.split('@');

    if (_source && _value && _value !== 'null') {
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

export function extractIcon(icon) {
  const data = getIconObjectWeb(icon);

  return data.value;
}
