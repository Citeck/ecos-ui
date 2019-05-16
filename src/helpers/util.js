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
  return (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
      ua
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
      ua.substr(0, 4)
    )
  );
}

export function getCurrentLocale() {
  if (!window.navigator) {
    return 'en';
  }

  const language = navigator.languages ? navigator.languages[0] : navigator.language || navigator.systemLanguage || navigator.userLanguage;

  return language.substr(0, 2).toLowerCase();
}

export function dynamicallyLoadScript(url, callback) {
  const script = document.createElement('script');
  script.src = url;

  document.body.appendChild(script);

  if (typeof callback === 'function') {
    script.onload = callback;
  }
}

// TODO
export function t(messageId, multipleValues, scope = 'global') {
  // https://dev.alfresco.com/resource/docs/aikau-jsdoc/Core.js.html
  if (!messageId) {
    return '';
  }

  const Alfresco = window.Alfresco;

  if (!Alfresco || !Alfresco.util || !Alfresco.util.message) {
    // console.warn('[t]: Alfresco.util.message is not available');
    return messageId;
  }

  const translatedMessage = Alfresco.util.message(messageId, scope, multipleValues);

  if (translatedMessage === messageId) {
    // console.warn(`[t]: looks like message '${messageId}' has not translation`);
  }

  return translatedMessage;
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

export function isPDFbyStr(str) {
  if (!str) return false;

  const pdf = 'pdf';
  const pointIdx = str.lastIndexOf(pdf);
  const format = str.substr(pointIdx);

  return format.toLowerCase() === pdf;
}

export function fileDownload(link) {
  let elLink = document.createElement('a');

  elLink.href = link;
  elLink.download = link;
  elLink.style.display = 'none';

  document.body.appendChild(elLink);
  elLink.click();
  document.body.removeChild(elLink);
}

export function openFullscreen(elem) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE/Edge */
    elem.msRequestFullscreen();
  }
}

export function closeFullscreen() {
  if (window.exitFullscreen) {
    window.exitFullscreen();
  } else if (window.mozCancelFullScreen) {
    /* Firefox */
    window.mozCancelFullScreen();
  } else if (window.webkitExitFullscreen) {
    /* Chrome, Safari and Opera */
    window.webkitExitFullscreen();
  } else if (window.msExitFullscreen) {
    /* IE/Edge */
    window.msExitFullscreen();
  }
}

export function getScale(scale = 'auto', paramsContainer, paramsScaleObject, ratioAuto = 50, paddingContainer = 0) {
  let { width: soW, height: soH } = paramsScaleObject || {};
  let { width: cW, height: cH } = paramsContainer || {};

  let calcScale = (c, so) => {
    return +Number((c - paddingContainer) / so).toFixed(1);
  };

  let fit = ratio => {
    if (Math.min(cH, cW) === cH) {
      return calcScale(cH + ratio, soH);
    }
    return calcScale(cW + ratio, soW);
  };

  switch (scale) {
    case 'page-height':
      return calcScale(cH, soH);
    case 'page-width':
      return calcScale(cW, soW);
    case 'page-fit':
      return fit(0);
    case 'auto':
      return fit(ratioAuto);
    default:
      if (scale && !Number.isNaN(parseFloat(scale))) {
        return scale;
      } else {
        console.error('Неверное значение коэффициента шасштабирования');
        return 1;
      }
  }
}
