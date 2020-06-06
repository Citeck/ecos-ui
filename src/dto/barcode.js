import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { defaultSettings } from '../constants/barcode';

export default class BarcodeConverter {
  static getSettingsForWeb(source = {}) {
    const target = {};

    if (isEmpty(source)) {
      return source;
    }

    target.type = get(source, 'type');
    target.scale = get(source, 'scale', 100);
    target.top = get(source, 'top', 0);
    target.right = get(source, 'right', 0);
    target.bottom = get(source, 'bottom', 0);
    target.left = get(source, 'left', 0);

    return target;
  }

  static getSettingsForUrl(settings = { ...defaultSettings }) {
    const { type, scale, top = 0, right = 0, bottom = 0, left = 0 } = settings;
    const params = [];

    if (type) {
      params.push({ barcodeType: type });
    }

    if (scale) {
      params.push({ scale: parseInt(scale, 10) / 100 });
    } else {
      params.push({ scale: 1 });
    }

    params.push({ margins: [left, right, top, bottom].join(',') });

    return params
      .reduce((result, item) => {
        const keys = Object.keys(item);

        return [...result, ...keys.map(key => `${key}=${item[key]}`)];
      }, [])
      .join('&');
  }
}
