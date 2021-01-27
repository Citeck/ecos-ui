import formats from './font/icons/high-contrast/catalog';
import { blankFormat } from './constants';

export function detectFormat(fileName) {
  try {
    if (typeof fileName !== 'string') {
      return blankFormat;
    }

    const parts = fileName.split('.');
    if (parts.length < 2) {
      return blankFormat;
    }

    const lastPart = parts[parts.length - 1].toLowerCase();
    if (Array.from(formats).includes(lastPart)) {
      return lastPart;
    }

    return blankFormat;
  } catch (e) {
    return blankFormat;
  }
}
