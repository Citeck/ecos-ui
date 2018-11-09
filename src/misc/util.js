export function generateSearchTerm(terms, hiddenSearchTerms) {
  let searchTerm = hiddenSearchTerms ? '(' + terms + ') ' + hiddenSearchTerms : terms;

  return encodeURIComponent(searchTerm);
}

export function getCurrentLocale() {
  if (!window.navigator) {
    return 'en';
  }

  const language = navigator.languages ? navigator.languages[0] : navigator.language || navigator.systemLanguage || navigator.userLanguage;

  return language.substr(0, 2).toLowerCase();
}

// TODO
export function t(messageId, multipleValues, scope = 'global') {
  // https://dev.alfresco.com/resource/docs/aikau-jsdoc/Core.js.html
  if (!messageId) {
    return '';
  }

  if (!window.Alfresco) {
    return messageId;
  }

  return window.Alfresco.util.message(messageId, scope, multipleValues);
}

const BYTES_KB = 1024;
const BYTES_MB = 1048576;
const BYTES_GB = 1073741824;

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
    return fnTime('relative.seconds', seconds_ago);
  }
  if (minutes_ago === 1) {
    return fnTime('relative.minute');
  }
  if (minutes_ago < 45) {
    return fnTime('relative.minutes', minutes_ago);
  }
  if (minutes_ago < 90) {
    return fnTime('relative.hour');
  }

  const hours_ago = Math.round(minutes_ago / 60);
  if (minutes_ago < 1440) {
    return fnTime('relative.hours', hours_ago);
  }
  if (minutes_ago < 2880) {
    return fnTime('relative.day');
  }

  const days_ago = Math.round(minutes_ago / 1440);
  if (minutes_ago < 43200) {
    return fnTime('relative.days', days_ago);
  }
  if (minutes_ago < 86400) {
    return fnTime('relative.month');
  }

  const months_ago = Math.round(minutes_ago / 43200);
  if (minutes_ago < 525960) {
    return fnTime('relative.months', months_ago);
  }
  if (minutes_ago < 1051920) {
    return fnTime('relative.year');
  }

  const years_ago = Math.round(minutes_ago / 525960);
  return fnTime('relative.years', years_ago);
}
