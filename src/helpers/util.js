import moment from 'moment';
import * as queryString from 'query-string';
import uuidV4 from 'uuid/v4';
import lodashGet from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';

import { DataFormatTypes, DocScaleOptions, MIN_WIDTH_DASHLET_LARGE, MOBILE_APP_USER_AGENT } from '../constants';

import { getCurrentLocale, t } from './export/util';

export { getCookie, getCurrentLocale, t } from './export/util';

const UTC_AS_LOCAL_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const BYTES_KB = 1024;
const BYTES_MB = 1048576;
const BYTES_GB = 1073741824;

const LOCALE_EN = 'en';

export function setCookie(name, value, options = {}) {
  options = {
    path: '/',
    ...options
  };

  if (options.expires && options.expires.toUTCString) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += '; ' + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += '=' + optionValue;
    }
  }

  document.cookie = updatedCookie;
}

export const utcAsLocal = jsonDate =>
  moment(jsonDate)
    .utcOffset(0)
    .format(UTC_AS_LOCAL_FORMAT);

export const revokeUtcAsLocal = jsonDate => moment(jsonDate).format(UTC_AS_LOCAL_FORMAT) + 'Z';

export const debounce = (func, ms = 0) => {
  let timer = null;
  let resolves = [];

  return function(...args) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      let result = func(...args);

      resolves.forEach(r => r(result));

      resolves = [];
    }, ms);

    return new Promise(r => resolves.push(r));
  };
};

export const queryByCriteria = criteria => {
  let query = {};

  (criteria || []).forEach((criterion, idx) => {
    query['field_' + idx] = criterion.field;
    query['predicate_' + idx] = criterion.predicate;
    query['value_' + idx] = criterion.value;
  });

  return query;
};

export const getBool = val => (val === 'false' ? false : val === 'true' ? true : val);

export function closest(node = null, selector) {
  if (!node) {
    return null;
  }

  const parent = node.parentElement;

  if (parent) {
    const className = parent.className;

    if (className && className.indexOf(selector) !== -1) {
      return parent;
    } else {
      return closest(parent, selector);
    }
  }

  return null;
}

export function getPropByStringKey(obj, strKey) {
  const keys = strKey.split('.');
  let res;

  for (let i = 0, count = keys.length; i < count; i++) {
    const key = keys[i];
    res = res ? res[key] : obj[key];
  }

  if (typeof res === 'string') {
    return t(res);
  }

  return res;
}

export function getSelectedValue(source, field, value) {
  return source.filter(option => option[field] === value);
}

export function trigger(name, data) {
  const callback = this.props[name];

  if (typeof callback === 'function') {
    callback.call(this, data);
  }
}

export const getId = () =>
  Math.random()
    .toString(36)
    .substr(2, 9);

export function applyTheme(themeName, callback) {
  document.body.classList.add(`yui-skin-${themeName}`);
}

export function placeCaretAtEnd(el) {
  // el.focus();
  if (typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined') {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (typeof document.body.createTextRange !== 'undefined') {
    const textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.collapse(false);
    textRange.select();
  }
}

export function generateSearchTerm(terms, hiddenSearchTerms) {
  let searchTerm = hiddenSearchTerms ? '(' + terms + ') ' + hiddenSearchTerms : terms;

  return encodeURIComponent(searchTerm);
}

export function isMobileDevice() {
  const ua = navigator.userAgent;
  const ecosMobileAppRegex = new RegExp(MOBILE_APP_USER_AGENT);

  return (
    ecosMobileAppRegex.test(ua) ||
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
      ua
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
      ua.substr(0, 4)
    )
  );
}

export function isMobileAppWebView() {
  return navigator.userAgent === MOBILE_APP_USER_AGENT;
}

export function getTextByLocale(data, locale = getCurrentLocale()) {
  if (isEmpty(data)) {
    return '';
  }

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => getTextByLocale(item, locale));
    }

    let text = data[locale];

    // get 'en' translation, if for current locale not found
    if (!text) {
      text = data[LOCALE_EN];

      // get first translation, if for 'en' locale not found
      if (!text) {
        text = data[Object.keys(data)[0]] || '';
      }
    }

    return text;
  }

  return data;
}

export function loadScript(url, callback) {
  const script = document.createElement('script');

  const prefix = url.indexOf('?') === -1 ? '?' : '&v=';
  script.src = `${url}${prefix}${process.env.REACT_APP_BUILD_VERSION}`;

  document.body.appendChild(script);

  if (typeof callback === 'function') {
    script.onload = callback;
  }
}

export function cellMsg(prefix) {
  return function(elCell, oRecord, oColumn, sData) {
    elCell.innerHTML = t(prefix + sData);
  };
}

// From FileSizeMixin.js (modified)
export function formatFileSize(fileSize, decimalPlaces) {
  decimalPlaces = decimalPlaces || 0;
  if (typeof fileSize === 'string') {
    fileSize = fileSize.replace(/,/gi, '');
    fileSize = parseInt(fileSize, 10);
  }
  if (fileSize < BYTES_KB) {
    return fileSize + ' ' + t('size.bytes');
  } else if (fileSize < BYTES_MB) {
    fileSize = (fileSize / BYTES_KB).toFixed(decimalPlaces);
    return fileSize + ' ' + t('size.kilobytes');
  } else if (fileSize < BYTES_GB) {
    fileSize = (fileSize / BYTES_MB).toFixed(decimalPlaces);
    return fileSize + ' ' + t('size.megabytes');
  } else if (isNaN(fileSize)) {
    // special case for missing content size
    return '0 ' + t('size.bytes');
  } else {
    fileSize = (fileSize / BYTES_GB).toFixed(decimalPlaces);
    return fileSize + ' ' + t('size.gigabytes');
  }
}

// From TemporalUtil.js (modified)
// TODO use moment.js in future
export function getRelativeTime(from, to) {
  const originalFrom = from;
  if (typeof from === 'string') {
    from = new Date(from);
  }

  if (!(from instanceof Date)) {
    return {
      relative: originalFrom,
      formatted: originalFrom
    };
  }

  if (typeof to === 'undefined') {
    to = new Date();
  } else if (typeof to === 'string') {
    to = new Date(to);
  }

  const seconds_ago = (to - from) / 1000;
  const minutes_ago = Math.floor(seconds_ago / 60);

  const fnTime = (...args) => {
    let locale = getCurrentLocale();
    let formatted = '';
    if (typeof from.toLocaleString === 'function') {
      formatted = from.toLocaleString(locale);
    } else {
      formatted = from.toString();
    }

    return {
      relative: t(...args),
      formatted
    };
  };

  if (minutes_ago <= 0) {
    return fnTime('relative.seconds', { value: seconds_ago });
  }
  if (minutes_ago === 1) {
    return fnTime('relative.minute');
  }
  if (minutes_ago < 45) {
    return fnTime('relative.minutes', { value: minutes_ago });
  }
  if (minutes_ago < 90) {
    return fnTime('relative.hour');
  }

  const hours_ago = Math.round(minutes_ago / 60);
  if (minutes_ago < 1440) {
    return fnTime('relative.hours', { value: hours_ago });
  }
  if (minutes_ago < 2880) {
    return fnTime('relative.day');
  }

  const days_ago = Math.round(minutes_ago / 1440);
  if (minutes_ago < 43200) {
    return fnTime('relative.days', { value: days_ago });
  }
  if (minutes_ago < 86400) {
    return fnTime('relative.month');
  }

  const months_ago = Math.round(minutes_ago / 43200);
  if (minutes_ago < 525960) {
    return fnTime('relative.months', { value: months_ago });
  }
  if (minutes_ago < 1051920) {
    return fnTime('relative.year');
  }

  const years_ago = Math.round(minutes_ago / 525960);
  return fnTime('relative.years', { value: years_ago });
}

export function getScrollbarWidth() {
  const scrollDiv = document.createElement('div');

  scrollDiv.className = 'scrollbar-measure';
  document.body.appendChild(scrollDiv);

  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

  document.body.removeChild(scrollDiv);

  return scrollbarWidth;
}

export function deepClone(data, defaultValue = '') {
  return JSON.parse(JSON.stringify(data || defaultValue));
}

export function isPDFbyStr(str) {
  if (!str) return false;

  const pdf = 'pdf';
  const pointIdx = str.lastIndexOf(pdf);
  const format = str.substr(pointIdx);

  return format.toLowerCase() === pdf;
}

/**
 * Реализация скачивания файла с добавлением в dom элемента и его удалением после скрипт-нажатия
 * @param link ссылка на файл для скачивания
 */
export function fileDownload(link) {
  let elLink = document.createElement('a');

  elLink.href = link;
  elLink.download = link;
  elLink.style.display = 'none';

  document.body.appendChild(elLink);
  elLink.click();
  document.body.removeChild(elLink);
}

/**
 * Варианты масштабирования объекта на странице
 * @returns {Array}
 */
export function getScaleModes() {
  return [
    { id: 'auto', title: t('doc-preview.scale.auto'), scale: DocScaleOptions.AUTO },
    { id: 'pageFit', title: t('doc-preview.scale.page-fit'), scale: DocScaleOptions.PAGE_FIT },
    { id: 'pageHeight', title: t('doc-preview.scale.page-height'), scale: DocScaleOptions.PAGE_HEIGHT },
    { id: 'pageWidth', title: t('doc-preview.scale.page-width'), scale: DocScaleOptions.PAGE_WIDTH },
    { id: '50', title: '50%', scale: 0.5 },
    { id: '75', title: '75%', scale: 0.75 },
    { id: '100', title: '100%', scale: 1 },
    { id: '125', title: '125%', scale: 1.25 },
    { id: '150', title: '150%', scale: 1.5 },
    { id: '200', title: '200%', scale: 2 },
    { id: '300', title: '300%', scale: 3 },
    { id: '400', title: '400%', scale: 4 }
  ];
}

/**
 * Вычисление масштабирования для строковых режимов
 * @param scale {Number|String} - режим см getScaleModes
 * @param paramsContainer {Object} - ширина и высота объекта масштабирования
 * @param paramsPage {Object} - ширина и высота контейнера
 * @param ratioAuto
 * @returns {Number} масштаб
 */
export function getScale(scale, paramsContainer, paramsPage, ratioAuto = 50) {
  let { origW, origH, scaleW } = paramsPage || {};
  let { width: cW, height: cH } = paramsContainer || {};

  let calcScale = (c, so) => {
    return +Number(c / so).toFixed(2);
  };

  let fit = ratio => {
    if (Math.min(cH, cW) === cH) {
      return calcScale(cH + ratio, origH);
    }

    return calcScale(cW + ratio, origW);
  };

  switch (scale) {
    case DocScaleOptions.PAGE_HEIGHT:
      return calcScale(cH, origH);
    case DocScaleOptions.PAGE_WIDTH:
      return calcScale(cW, origW);
    case DocScaleOptions.PAGE_FIT:
      return fit(0);
    case DocScaleOptions.AUTO:
      return fit(ratioAuto);
    case DocScaleOptions.PAGE_WHOLE:
      return calcScale(cW - 10, scaleW);
    default:
      if (scale && !Number.isNaN(parseFloat(scale))) {
        return scale;
      } else {
        console.error('Wrong zoom coefficient value');
        return 1;
      }
  }
}

export function getCurrentUserName() {
  return lodashGet(window, 'Alfresco.constants.USERNAME', '');
}

export const isSmallMode = width => width <= MIN_WIDTH_DASHLET_LARGE;

export function isExistIndex(idx) {
  return !(idx === null || idx === undefined || idx === -1);
}

export function isLastItem(array, idx) {
  return idx === array.length - 1;
}

/**
 * Функция склонения слов в зависимости от числительного
 *
 * @param n - числительное
 * @param textForms - массив из слов в 3х формах в соответствующем порядке:
 * именительный падеж, единственное число (в зависимости от слова, с которым употребляется)
 * родительный падеж, единственное число (в зависимости от слова, с которым употребляется)
 * родительный падеж, множественное число (в зависимости от слова, с которым употребляется)
 *
 * @returns string
 */
export function num2str(n = 0, textForms = []) {
  const number = Math.abs(n) % 100;
  const n1 = number % 10;

  if (number > 10 && number < 20) {
    return textForms[2];
  }

  if (n1 > 1 && n1 < 5) {
    return textForms[1];
  }

  if (n1 === 1) {
    return textForms[0];
  }

  return textForms[2];
}

export function arrayCompare(arr1 = [], arr2 = [], byField = '') {
  if (!byField) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }

  return JSON.stringify(arr1.map(item => item[byField])) === JSON.stringify(arr2.map(item => item[byField]));
}

export function getSearchParams(searchString = window.location.search) {
  return queryString.parse(searchString);
}

export function getOutputFormat(format, value) {
  if (!format || !value) {
    return value || '';
  }

  switch (format) {
    case DataFormatTypes.DATE:
      return moment(value).format('DD.MM.YYYY');
    case DataFormatTypes.DATETIME:
      return moment(value).format('DD.MM.YYYY, hh:mm');
    default:
      return value;
  }
}

export const hasInString = (originalString = '', searchedString = '') => {
  return originalString.includes(searchedString);
};

export function getIconFileByMimetype(mimetype) {
  switch (mimetype) {
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return 'icon-filetype-doc';
    case 'application/pdf':
    default:
      return 'icon-filetype-none';
  }
}

/**
 * Функция для сортировки элементов массива
 *
 * @param array
 * @param indexFrom
 * @param indexTo
 * @returns {array}
 */
export function arrayMove(array, indexFrom, indexTo) {
  const newArray = deepClone(array);

  newArray.splice(indexTo < 0 ? newArray.length + indexTo : indexTo, 0, newArray.splice(indexFrom, 1)[0]);

  return newArray;
}

export function documentScrollTop() {
  const elementScrollTop = lodashGet(document.scrollingElement || document.documentElement, ['scrollTop'], 0);
  const bodyScrollTop = lodashGet(document.querySelector('body'), ['scrollTop'], 0);

  if (!elementScrollTop && !bodyScrollTop) {
    return 0;
  }

  return elementScrollTop || bodyScrollTop;
}

export function getAdaptiveNumberStr(number) {
  number = number || 0;

  let num = parseInt(number);
  if (num >= 1000) {
    let res = parseInt((num / 1000).toString());
    const end = num % 1000;
    res = (end * 2).toString().length > end.toString().length ? res + 1 : res;

    num = res.toString() + 'k';
  }

  return num.toString();
}

export function removeItemFromArray(array = [], item = '', byKey = '') {
  if (byKey) {
    return array.filter(elem => elem[byKey] !== item[byKey]);
  }

  return array.filter(elem => elem !== item);
}

export function isNodeRef(str) {
  return typeof str === 'string' && str.indexOf('workspace://SpacesStore/') === 0;
}

/**
 * Convert from ISO8601 date to JavaScript date
 */
export function fromISO8601(formattedString) {
  var isoRegExp = /^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;

  var match = isoRegExp.exec(formattedString);
  var result = null;

  if (match) {
    match.shift();
    if (match[1]) {
      match[1]--;
    } // Javascript Date months are 0-based
    if (match[6]) {
      match[6] *= 1000;
    } // Javascript Date expects fractional seconds as milliseconds

    result = new Date(match[0] || 1970, match[1] || 0, match[2] || 1, match[3] || 0, match[4] || 0, match[5] || 0, match[6] || 0);

    var offset = 0;
    var zoneSign = match[7] && match[7].charAt(0);
    if (zoneSign !== 'Z') {
      offset = (match[8] || 0) * 60 + (Number(match[9]) || 0);
      if (zoneSign !== '-') {
        offset *= -1;
      }
    }
    if (zoneSign) {
      offset -= result.getTimezoneOffset();
    }
    if (offset) {
      result.setTime(result.getTime() + offset * 60000);
    }
  }

  return result; // Date or null
}

export function animateScrollTo(element = '', scrollTo = {}) {
  if (!element) {
    return;
  }

  if (element.length) {
    element.forEach(item => animateScrollTo(item, scrollTo));
    return;
  }

  const { scrollLeft, scrollTop } = scrollTo;

  if (scrollLeft !== undefined) {
    element.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  }

  if (scrollTop !== undefined) {
    element.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  }
}

export function hasChildWithId(items, selectedId) {
  let childIndex = items.findIndex(item => item.id === selectedId);

  if (childIndex !== -1) {
    return true;
  }

  let totalItems = items.length;

  for (let i = 0; i < totalItems; i++) {
    if (!items[i].items) {
      continue;
    }

    let hasChild = hasChildWithId(items[i].items, selectedId);

    if (hasChild) {
      return true;
    }
  }

  return false;
}

export function prepareTooltipId(id = uuidV4()) {
  if (!isNaN(id[0])) {
    id = `tooltip-${id}`;
  }

  return `${id}`.replace(/[^\d\w-]/g, '');
}

export function arrayFlat({ data = [], depth = Infinity, byField = '', withParent = false }) {
  if (!data.length) {
    return [];
  }

  const array = deepClone(data);

  if (!byField) {
    return array.flat(depth);
  }

  const getChildren = child => {
    if (!child[byField].length) {
      return child;
    }

    const children = child[byField].map(getChildren);

    if (withParent) {
      children.push(child);

      return children;
    }

    return children;
  };

  return Array.prototype.flat.call(array.map(getChildren), depth);
}

export function objectCompare(obj1, obj2, params = {}) {
  const { include = [], exclude = [] } = params;
  let keys = [...new Set([...Object.keys(obj1), ...Object.keys(obj2)])];

  if (include.length) {
    keys = keys.filter(key => include.includes(key));
  }

  if (exclude.length) {
    keys = keys.filter(key => !exclude.includes(key));
  }

  const filteredFirst = Object.keys(obj1)
    .filter(key => keys.includes(key))
    .reduce((obj, key) => {
      obj[key] = obj1[key];

      return obj;
    }, {});
  const filteredSecond = Object.keys(obj2)
    .filter(key => keys.includes(key))
    .reduce((obj, key) => {
      obj[key] = obj2[key];

      return obj;
    }, {});

  return isEqual(filteredFirst, filteredSecond);
}

export function extractLabel(text) {
  let displayText = text || '';

  if (isObject(text)) {
    displayText = text[getCurrentLocale()] || text[LOCALE_EN] || '';

    if (!displayText) {
      for (const key in text) {
        if (text.hasOwnProperty(key) && isString(text[key])) {
          displayText = text[key] || '';
          break;
        }
      }
    }
  }

  return t(displayText);
}

export function getTimezoneValue() {
  let timezone, offset;

  if (Intl) {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } else {
    const numberOffset = -new Date().getTimezoneOffset();
    const hours = Math.floor(numberOffset / 60);
    const minutes = Math.floor(numberOffset - hours * 60);

    offset = 'GMT';
    offset += numberOffset > 0 ? '+' : '-';
    offset += Math.abs(hours);

    if (minutes > 0) {
      offset += ':';
      offset += minutes;
    }
  }

  return { timezone, offset };
}

/**
 * check self or closest parent on hiddens
 *
 * @param el
 * @returns {null|boolean}
 */
export function isClosestHidden(el = null) {
  let node = el;

  if (typeof node === 'string') {
    node = document.querySelector(el);
  }

  if (!node) {
    return true;
  }

  const isHidden = el => {
    return el.style.display === 'none' || el.style.visibility === 'hidden';
  };

  if (isHidden(node)) {
    return true;
  }

  const parent = node.parentElement;

  if (parent) {
    if (isHidden(parent)) {
      return true;
    } else {
      return isClosestHidden(parent);
    }
  }

  return false;
}

export function trimFields(source) {
  if (isEmpty(source)) {
    return source;
  }

  if (Array.isArray(source)) {
    return source.map(trimFields);
  }

  const keys = Object.keys(source);
  const target = {};

  if (!keys.length) {
    return target;
  }

  keys.forEach(key => {
    switch (typeof source[key]) {
      case 'string': {
        target[key] = source[key].trim();
        break;
      }
      case 'object': {
        target[key] = trimFields(source[key]);
        break;
      }
      default:
        target[key] = source[key];
    }
    if (typeof source[key] === 'string') {
      target[key] = source[key].trim();
    }
  });

  return target;
}

/**
 * Returns the first non-empty value
 * Empty values - match the docs lodash isEmpty
 * https://github.com/lodash/lodash/blob/master/isEmpty.js#L45
 * Exceptions are numbers; they are not empty values.
 *
 * @param values
 * @param defaultValue
 *
 * @returns {*}
 */
export function getFirstNonEmpty(values = [], defaultValue) {
  if (!Array.isArray(values) || !values.length) {
    return defaultValue;
  }

  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    if (typeof value === 'number' || !isEmpty(value)) {
      return value;
    }
  }

  return defaultValue;
}

export function isInViewport(element) {
  if (element) {
    const rect = element.getBoundingClientRect();
    const html = document.documentElement;

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || html.clientHeight) &&
      rect.right <= (window.innerWidth || html.clientWidth)
    );
  }
}
