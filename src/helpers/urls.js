import * as queryString from 'query-string';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { JournalUrlParams, SourcesId, URL } from '../constants';
import { PROXY_URI, URL_PAGECONTEXT } from '../constants/alfresco';
import { ALFRESCO_EQUAL_PREDICATES_MAP } from '../components/Records/predicates/predicates';
import { ParserPredicate } from '../components/Filters/predicates/index';
import PageService from '../services/PageService';
import { isNewVersionPage, isNewVersionSharePage } from './export/urls';
import { hasInString } from './util';

const JOURNALS_LIST_ID_KEY = JournalUrlParams.JOURNALS_LIST_ID;
const JOURNAL_ID_KEY = JournalUrlParams.JOURNAL_ID;
const DASHBOARD_ID_KEY = 'dashboardId';
const DASHBOARD_KEY_KEY = 'dashboardKey';
const RECORD_REF_KEY = JournalUrlParams.RECORD_REF;
const JOURNAL_SETTING_ID_KEY = JournalUrlParams.JOURNAL_SETTING_ID;
const TYPE_KEY = 'type';
const DESTINATION_KEY = 'destination';
const FILTER_KEY = 'filter';
const SORT_KEY = 'sortBy';
const PAGINATION_KEY = 'pagination';
const SHOW_PREVIEW_KEY = JournalUrlParams.SHOW_PREVIEW;
const SEARCH_KEY = JournalUrlParams.SEARCH;

export const SearchKeys = {
  TYPE: [TYPE_KEY],
  DESTINATION: [DESTINATION_KEY],
  FILTER: [FILTER_KEY],
  SORT: [SORT_KEY],
  SEARCH: [SEARCH_KEY],
  PAGINATION: [PAGINATION_KEY],
  RECORD_REF: [RECORD_REF_KEY],
  JOURNAL_ID: [JOURNAL_ID_KEY],
  DASHBOARD_ID: [DASHBOARD_ID_KEY],
  DASHBOARD_KEY: [DASHBOARD_KEY_KEY],
  SHOW_PREVIEW: [SHOW_PREVIEW_KEY],
  JOURNAL_SETTING_ID: [JOURNAL_SETTING_ID_KEY]
};

export const IgnoredUrlParams = [SearchKeys.PAGINATION, SearchKeys.FILTER, SearchKeys.SORT, SearchKeys.SHOW_PREVIEW];

export { NEW_VERSION_PREFIX, isNewVersionPage, isNewVersionSharePage } from './export/urls';

export const OLD_LINKS = false;

const changeUrl = (url, opts = {}) => {
  if (isNewVersionSharePage()) {
    window.open(url, opts.openNewTab === true ? '_blank' : '_self');
  } else {
    PageService.changeUrlLink(url, opts);
  }
};

export const createOldVersionUrlDocument = recordRef => {
  return `/share/page/card-details?nodeRef=${recordRef}`;
};

export const createProfileUrl = userName => {
  if (isNewVersionPage()) {
    return `${URL.DASHBOARD}?recordRef=${SourcesId.PEOPLE}@${userName}`;
  }

  return `/share/page/user/${userName}/profile`;
};

export const createDocumentUrl = recordRef => {
  if (isNewVersionPage()) {
    return `${URL.DASHBOARD}?recordRef=${recordRef}`;
  }

  return createOldVersionUrlDocument(recordRef);
};

export const createTaskUrl = (taskId, recordRef) => {
  const taskPrefix = `${SourcesId.WORKFLOW}@`;

  if (isNewVersionPage()) {
    if (!taskId.includes(taskPrefix)) {
      taskId = `${taskPrefix}${taskId}`;
    }

    return `${URL.DASHBOARD}?recordRef=${taskId}`;
  }

  return `/citeck/components/redirect-to-task?nodeRef=${recordRef}`;
};

export const createThumbnailUrl = (nodeRef, extra) => {
  const params = { property: 'ecos:photo', width: 150, ...extra, nodeRef };

  return `${PROXY_URI}citeck/ecos/image/thumbnail?` + queryString.stringify(params);
};

export function createPrintUrl({ record, config }) {
  const params = {
    nodeRef: record.id,
    print: true,
    templateType: config.templateType,
    format: config.format,
    timezone: config.timezone,
    offset: config.offset
  };

  return `${PROXY_URI}citeck/print/metadata-printpdf?` + queryString.stringify(params);
}

export function createContentUrl({ value }) {
  return `${PROXY_URI}api/node/workspace/SpacesStore/${value}/content;cm:content`;
}

const getPredicateFilterParam = options => {
  const filter = ParserPredicate.getRowPredicates(options);
  return filter ? JSON.stringify(filter) : '';
};

const getCriteriaFilterParam = ({ row, columns, groupBy }) => {
  const criteria = [];

  if (groupBy.length) {
    groupBy = groupBy[0].split('&');
    columns = columns.filter(c => groupBy.filter(g => g === c.attribute)[0]);
  }

  for (const key in row) {
    const value = row[key];
    const type = (columns.filter(c => c.attribute === key && c.visible && c.default && c.searchable)[0] || {}).type;
    const predicate = ALFRESCO_EQUAL_PREDICATES_MAP[type];

    if (predicate) {
      criteria.push({
        field: key,
        predicate: predicate,
        persistedValue: value
      });
    }
  }

  return criteria.length ? JSON.stringify({ criteria }) : '';
};

export const getFilterUrlParam = options => {
  return OLD_LINKS ? getCriteriaFilterParam(options) : getPredicateFilterParam(options);
};

export const getJournalPageUrl = ({ journalsListId, journalId, journalSettingId, nodeRef, filter }) => {
  const qString = queryString.stringify({
    [JOURNALS_LIST_ID_KEY]: journalsListId,
    [JOURNAL_ID_KEY]: journalId,
    [JOURNAL_SETTING_ID_KEY]: filter ? '' : journalSettingId,
    [FILTER_KEY]: filter
  });
  let url;

  if (OLD_LINKS) {
    let partOfUrl;

    if (journalsListId.indexOf('global-') !== -1) {
      partOfUrl = journalsListId.replace('global-', 'journals2/list/');
    } else {
      partOfUrl = journalsListId.replace('site-', 'site/');
      partOfUrl = partOfUrl.replace('-main', '/journals2/list/main');
    }

    url = `${URL_PAGECONTEXT}${partOfUrl}#journal=${nodeRef}&${FILTER_KEY}=${filter}&settings=&skipCount=0&maxItems=10`;
  } else {
    url = `${URL.JOURNAL}?${qString}`;
  }

  return url;
};

export const getDownloadContentUrl = nodeRef => {
  return `${PROXY_URI}citeck/print/content?nodeRef=${nodeRef}`;
};

export const getCreateRecordUrl = ({ type, destination }) => {
  const qString = queryString.stringify({
    [TYPE_KEY]: type,
    [DESTINATION_KEY]: destination
  });

  return `${URL_PAGECONTEXT}node-create-page-v2?${qString}&viewId=`;
};

export const getZipUrl = nodeRef => {
  return `${PROXY_URI}api/node/content/${nodeRef.replace(':/', '')}/Archive.zip`;
};

export const getTemplateUrl = nodeRef => {
  return `${PROXY_URI}citeck/case/template?nodeRef=${nodeRef}`;
};

export const getBarcodePrintUrl = (record, settings = 'barcodeType=code-128&scale=5.0&margins=20,200,20,500') => {
  return `${PROXY_URI}citeck/print/barcode?nodeRef=${record}&${settings}&print=true`;
};

export const goToJournalsPage = options => {
  const journalPageUrl = getJournalPageUrl(options);

  if (OLD_LINKS || !isNewVersionPage()) {
    window.open(journalPageUrl, '_blank');
  } else {
    changeUrl(journalPageUrl, { openNewTab: true });
  }
};

export const goToCreateRecordPage = createVariants => window.open(getCreateRecordUrl(createVariants), '_self');

export const goToCardDetailsPage = (nodeRef, params = { openNewTab: true }) => {
  const dashboardLink = `${URL.DASHBOARD}?recordRef=${nodeRef}`;

  if (isNewVersionPage()) {
    changeUrl(dashboardLink, params);
  } else {
    window.open(`${URL_PAGECONTEXT}card-details?nodeRef=${nodeRef}`, '_blank');
  }
};

export const goToNodeEditPage = nodeRef => window.open(`${URL_PAGECONTEXT}node-edit-page-v2?nodeRef=${nodeRef}`, '_self');

export const updateCurrentUrl = (params = {}) => {
  const query = getSearchParams();

  for (let key in params) {
    query[key] = params[key];
  }

  changeUrl(queryString.stringifyUrl({ url: window.location.href, query }), { updateUrl: true });
};

/**
 * Метод перебирает и сортирует параметры из url
 *
 * @param params string
 *
 * @returns {string}
 */
export const getSortedUrlParams = (params = window.location.search) => {
  if (!params) {
    return '';
  }

  const byObject = decodeLink(params)
    .slice(1, params.length)
    .split('&')
    .map(i => i.split('='))
    .map(i => ({ [i[0]]: i[1] }))
    .reduce((r = {}, n = {}) => ({ ...r, ...n }));
  const sortedParams = Object.keys(byObject).sort((a, b) => {
    if (a.toLowerCase() < b.toLowerCase()) {
      return -1;
    }

    if (a.toLowerCase() < b.toLowerCase()) {
      return 1;
    }

    return 0;
  });

  return sortedParams.map(key => `${key}=${byObject[key]}`).join('&');
};

export const getSearchParams = (params = window.location.search) => {
  return queryString.parse(params);
};

export const decodeLink = link => {
  try {
    return decodeURIComponent(link);
  } catch (e) {
    return link;
  }
};

/**
 * Comparing two URL's with additional settings
 *
 * @param params {object}
 * - urls {array} - two compared url's
 * - ignored {array} - ignored for comparing params
 * - searchBy {array} - params for comparing
 *
 * @returns {boolean}
 */
export const equalsQueryUrls = params => {
  const { urls = [], ignored = [], compareBy = [] } = params;

  if (!urls.length || (!ignored.length && compareBy.length)) {
    return false;
  }

  const [first, second] = urls;

  let firstParams = queryString.parseUrl(first).query || {};
  let secondParams = queryString.parseUrl(second).query || {};

  if (isEmpty(firstParams) || isEmpty(secondParams)) {
    return false;
  }

  ignored.forEach(param => {
    delete firstParams[param];
    delete secondParams[param];
  });

  if (!compareBy.length) {
    return queryString.stringify(firstParams) === queryString.stringify(secondParams);
  }

  for (let param in firstParams) {
    if (!compareBy.includes(param)) {
      delete firstParams[param];
    }
  }

  for (let param in secondParams) {
    if (!compareBy.includes(param)) {
      delete secondParams[param];
    }
  }

  return queryString.stringify(firstParams) === queryString.stringify(secondParams);
};

export const getLinkWithout = params => {
  const { url = '', ignored = [] } = params;

  if (!url || !ignored.length) {
    return url;
  }

  let parsed = queryString.parseUrl(url) || {};
  let query = parsed.query || {};

  if (isEmpty(query)) {
    return url;
  }

  ignored.forEach(param => {
    delete query[param];
  });

  return queryString.stringifyUrl({ url: parsed.url, query });
};

export const isDashboard = (url = window.location.href) => {
  if (isNewVersionPage()) {
    return hasInString(url, URL.DASHBOARD) && !hasInString(url, URL.DASHBOARD_SETTINGS);
  }

  return false;
};

export const isHomePage = (url = window.location.href) => {
  if (!hasInString(url, URL.DASHBOARD) || hasInString(url, URL.DASHBOARD_SETTINGS)) {
    return false;
  }

  const { query } = queryString.parseUrl(url);

  return isEmpty(query.recordRef) && isEmpty(query.nodeRef);
};

export const stringifySearchParams = (params = {}, stringifyParams = { skipEmptyString: true }) => {
  return queryString.stringify(params, stringifyParams);
};

export const isTaskDashboard = (url = window.location.href) => {
  return isDashboard(url) && hasInString(url, `${SourcesId.TASK}@`);
};

if (!window.Citeck) {
  window.Citeck = {};
}

window.Citeck.Navigator = {
  goToDashboard: (recordRef, options) => {
    goToCardDetailsPage(recordRef, options);
  }
};

export const replaceHistoryLink = (history = window, link = '') => {
  if (isEmpty(history)) {
    return;
  }

  const search = get(history, 'location.search', '');
  const pathname = get(history, 'location.pathname', '');
  let pureLink = decodeLink(link);

  if (isEmpty(pureLink)) {
    pureLink = '/';
  }

  if (`${pathname}${search}` === pureLink) {
    return;
  }

  window.history.replaceState({ path: pureLink }, '', pureLink);

  return pureLink;
};

export const pushHistoryLink = (history = window, linkData = {}) => {
  if (isEmpty(history) || isEmpty(linkData)) {
    return;
  }

  const currentSearch = get(history, 'location.search', '');
  const currentPathname = get(history, 'location.pathname', '');
  let search = get(linkData, 'search', '');
  const pathname = get(linkData, 'pathname', currentPathname);

  if (search.charAt(0) === '?') {
    search = search.slice(1);
  }

  const newLink = decodeLink([pathname, search].filter(item => !isEmpty(item)).join('?'));

  if (`${currentPathname}${currentSearch}` === newLink) {
    return;
  }

  window.history.pushState({ path: newLink }, '', newLink);

  return newLink;
};

/**
 *
 * @param {String} sourceUrl
 * @param {?Array<String>|?String} keys
 *
 * @returns {string|*}
 */
export const removeUrlSearchParams = (sourceUrl = window.location.href, keys = []) => {
  if (isEmpty(keys)) {
    return sourceUrl;
  }

  const url = queryString.parseUrl(sourceUrl);

  if (typeof keys === 'string') {
    delete url.query[keys];
  }

  if (Array.isArray(keys)) {
    keys.forEach(key => {
      delete url.query[key];
    });
  }

  return queryString.stringifyUrl(url);
};
