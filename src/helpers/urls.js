import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isUndefined from 'lodash/isUndefined';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import * as queryString from 'query-string';

import { ParserPredicate } from '../components/Filters/predicates/index';
import { JournalUrlParams, KanbanUrlParams, SourcesId, URL as Urls } from '../constants';
import { PROXY_URI } from '../constants/alfresco';
import PageService from '../services/PageService';
import PageTabList from '../services/pageTabs/PageTabList';

import { isNewVersionPage, isNewVersionSharePage } from './export/urls';
import { IS_TEST_ENV, getCurrentUserName, hasInString, getEnabledWorkspaces, getDefaultWorkspace } from './util';

const JOURNAL_ID_KEY = JournalUrlParams.JOURNAL_ID;
const DASHBOARD_ID_KEY = 'dashboardId';
const DASHBOARD_KEY_KEY = 'dashboardKey';
const RECORD_REF_KEY = JournalUrlParams.RECORD_REF;
const JOURNAL_SETTING_ID_KEY = JournalUrlParams.JOURNAL_SETTING_ID;
const KANBAN_BOARD_ID = KanbanUrlParams.BOARD_ID;
const TYPE_KEY = 'type';
const DESTINATION_KEY = 'destination';
const VIEW_MODE = 'viewMode';
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

export const openLinkWorkspace = (id, homePageLink, openNewBrowserTab) => {
  const needUpdateTabsWorkspace = id !== getWorkspaceId();
  const params = {
    openNewTab: true,
    reopen: true,
    closeActiveTab: false,
    needUpdateTabs: needUpdateTabsWorkspace
  };

  const url = getBaseUrlWorkspace(id, homePageLink, false);

  if (!openNewBrowserTab) {
    PageService.changeUrlLink(url, params);
  } else {
    PageService.changeUrlLink(url, { openNewBrowserTab });
  }
};

export const getCustomDasboardUrl = dashboardId => {
  return `${Urls.DASHBOARD}?dashboardId=${dashboardId}`;
};

export const getWikiDasboardUrl = () => {
  const workspaceId = getWorkspaceId();

  return `${Urls.DASHBOARD}?recordRef=${SourcesId.WIKI}@${workspaceId}$ROOT&ws=${workspaceId}`;
};

export const changeUrl = (url, opts = {}) => {
  if (isNewVersionSharePage() || !isNewVersionPage()) {
    window.open(url, opts.openNewTab === true ? '_blank' : '_self');
  } else {
    PageService.changeUrlLink(url, opts);
  }
};

export const createProfileUrl = userName => {
  return `${Urls.DASHBOARD}?recordRef=${SourcesId.PERSON}@${userName ? userName.toLowerCase() : ''}`;
};

export const createDocumentUrl = recordRef => {
  return `${Urls.DASHBOARD}?recordRef=${recordRef}`;
};

export const getSelectedValueLink = item => {
  switch (true) {
    // Cause: https://citeck.atlassian.net/browse/ECOSUI-2312
    case PageService.isTypeRecord(item.id):
      return item.id.replace(SourcesId.TYPE, 'emodel/types-repo');
    default:
      return item.id;
  }
};

export const createTaskUrl = (taskId, recordRef) => {
  const taskPrefix = `${SourcesId.WORKFLOW}@`;

  if (isNewVersionPage()) {
    if (!taskId.includes(taskPrefix)) {
      taskId = `${taskPrefix}${taskId}`;
    }

    return `${Urls.DASHBOARD}?recordRef=${taskId}`;
  }

  return `/citeck/components/redirect-to-task?nodeRef=${recordRef}`;
};

export const createThumbnailUrl = (url, extra) => {
  if (!url) {
    return '';
  }

  const params = { width: 150, ...extra };
  const symbol = url.includes('?') ? '&' : '?';

  return `${url}${symbol}${queryString.stringify(params)}`;
};

export function createPrintUrl({ record, config }) {
  const nodeRef = record.id.replace('alfresco/@', '');
  const params = {
    nodeRef,
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

export const getFilterParam = options => {
  return ParserPredicate.getRowPredicates(options);
};

export const getJournalPageUrl = ({ journalId, journalSettingId, boardId, filter, search, viewMode }) => {
  let params = {
    [JOURNAL_ID_KEY]: journalId,
    [JOURNAL_SETTING_ID_KEY]: filter ? undefined : journalSettingId,
    [SEARCH_KEY]: search || filter,
    [VIEW_MODE]: viewMode
  };

  if (boardId) {
    params = { ...params, [KANBAN_BOARD_ID]: boardId };
  }

  return `${Urls.JOURNAL}?${queryString.stringify(params)}`;
};

function getValidNodeRef(nodeRef) {
  if (!nodeRef) {
    return nodeRef;
  }
  const workspaceIdx = nodeRef.indexOf('workspace://SpacesStore/');
  if (workspaceIdx !== 0) {
    nodeRef = nodeRef.substring(workspaceIdx);
  }
  return nodeRef;
}

export const getDownloadContentUrl = entityRef => {
  if (entityRef.indexOf('workspace://SpacesStore/') !== -1) {
    return `${PROXY_URI}citeck/print/content?nodeRef=${getValidNodeRef(entityRef)}`;
  }
  return `/gateway/emodel/api/ecos/webapp/content?ref=${entityRef}`;
};

export const getZipUrl = nodeRef => {
  return `${PROXY_URI}api/node/content/${getValidNodeRef(nodeRef).replace(':/', '')}/Archive.zip`;
};

export const getTemplateUrl = nodeRef => {
  return `${PROXY_URI}citeck/case/template?nodeRef=${getValidNodeRef(nodeRef)}`;
};

export const getBarcodePrintUrl = (record, settings = 'barcodeType=code-128&scale=5.0&margins=20,200,20,500') => {
  if (record.indexOf('workspace://SpacesStore/') !== -1) {
    return `${PROXY_URI}citeck/print/barcode?nodeRef=${record}&${settings}&print=true`;
  } else {
    return `/gateway/transformations/api/barcode/image?entityRef=${record}&width=100&height=100&print=true`;
  }
};

export const goToJournalsPage = options => {
  const journalPageUrl = getJournalPageUrl(options);

  if (OLD_LINKS || !isNewVersionPage()) {
    window.open(journalPageUrl, '_blank');
  } else {
    const activeTab = PageTabList.activeTab;

    changeUrl(journalPageUrl, { openNewTab: true });

    if (options.replaceJournal) {
      PageTabList.delete(activeTab);
    }
  }
};

export const goToAdminPage = options => {
  const params = queryString.stringify(options);
  let link = Urls.ADMIN_PAGE;

  if (params) {
    link += `?${params}`;
  }

  changeUrl(link, { openNewTab: true });
};

export const goToCardDetailsPage = (nodeRef, params = { openNewTab: true }) => {
  let dashboardLink = `${Urls.DASHBOARD}?recordRef=${nodeRef}`;

  if (getEnabledWorkspaces()) {
    const workspaceId = getWorkspaceId();

    if (!workspaceId.startsWith('user$')) {
      dashboardLink = getLinkWithWs(dashboardLink, workspaceId);
    }
  }

  changeUrl(dashboardLink, params);
};

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

export const getSearchParams = (params = window.location.search, options) => {
  return queryString.parse(params, options);
};

/**
 * Decode without exception
 * @param str {string}
 * @returns {string}
 */
export const decodeLink = str => {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
};

/**
 * Decoder for strings from URLSearchParams
 * @param str {string}
 * @returns {string}
 */
export const decodeLinkWithEncodeParams = str => {
  let newStr = str;

  newStr = newStr.replace(/%24/g, '$'); // $
  newStr = newStr.replace(/%40/g, '@'); // @
  newStr = newStr.replace(/%2F/g, '/'); // /
  newStr = newStr.replace(/%2B/g, '+'); // +
  newStr = newStr.replace(/%3A/g, ':'); // :
  newStr = newStr.replace(/%3F/g, '?'); // ?
  newStr = newStr.replace(/%3D/g, '='); // =
  newStr = newStr.replace(/%26/g, '&'); // &
  newStr = newStr.replace(/%25/g, '%'); // %
  newStr = newStr.replace(/%20/g, ' '); // (space)
  newStr = newStr.replace(/%2C/g, ','); // ,
  newStr = newStr.replace(/%3B/g, ';'); // ;
  newStr = newStr.replace(/%23/g, '#'); // #
  newStr = newStr.replace(/%22/g, '"'); // "
  newStr = newStr.replace(/%27/g, "'"); // '
  newStr = newStr.replace(/%5B/g, '['); // [
  newStr = newStr.replace(/%5D/g, ']'); // ]
  newStr = newStr.replace(/%7B/g, '{'); // {
  newStr = newStr.replace(/%7D/g, '}'); // }
  newStr = newStr.replace(/%7C/g, '|'); // |
  newStr = newStr.replace(/%5C/g, '\\'); // \

  return newStr;
};

/**
 * Get the last path to the segment before the query
 * @returns {string}
 */
export const getLastPathSegmentBeforeQuery = path => {
  let pathname = path || getUrlWithoutOrigin();
  if (pathname.includes('?')) {
    pathname = pathname.split('?')[0];
  }
  return pathname;
};

/**
 * Comparing two URL's with additional settings
 *
 * @param params {object}
 * - urls {array} - two compared url's
 * - ignored {array} - ignored for comparing params
 * - compareBy {array} - to compare only by set
 *
 * @returns {boolean}
 */
export const equalsQueryUrls = params => {
  const { urls = [], ignored = [], compareBy = [] } = params;

  if (!Array.isArray(urls) || urls.some(u => typeof u !== 'string' || !u.length)) {
    return false;
  }

  const [first, second] = urls;

  let firstParams = queryString.parseUrl(first).query || {};
  let secondParams = queryString.parseUrl(second).query || {};

  if (isEmpty(firstParams) || isEmpty(secondParams)) {
    return false;
  }

  if (ignored.some(key => compareBy.includes(key))) {
    console.warn("List 'ignored' has key(s) from list 'compareBy'");
  }

  if (!ignored || !ignored.length) {
    firstParams = omit(firstParams, ignored);
    secondParams = omit(secondParams, ignored);
  }

  if (!compareBy || !compareBy.length) {
    return queryString.stringify(firstParams) === queryString.stringify(secondParams);
  }

  firstParams = pick(firstParams, compareBy);
  secondParams = pick(secondParams, compareBy);

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
    return (hasInString(url, Urls.DASHBOARD) && !hasInString(url, Urls.DASHBOARD_SETTINGS)) || hasInString(url, Urls.ORGSTRUCTURE);
  }

  return false;
};

export const isHomePage = (url = window.location.href) => {
  if (!hasInString(url, Urls.DASHBOARD) || hasInString(url, Urls.DASHBOARD_SETTINGS)) {
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

export const getWorkspaceId = (defaultWorkspace = getDefaultWorkspace(), search = window.location.search) => {
  if (!getEnabledWorkspaces()) {
    return '';
  }

  const searchParams = new URLSearchParams(search);
  const wsId = searchParams.get('ws');

  if (!!wsId) {
    return wsId;
  }

  return defaultWorkspace || `user$${getCurrentUserName()}`;
};

export const getPersonalWorkspaceId = () => `user$${getCurrentUserName()}`;

if (!window.Citeck) {
  window.Citeck = {};
}

export const getLinkWithOrigin = (link = '') => {
  return link && !link.includes('http') && link[0] === '/' ? window.location.origin + link : link;
};

export const getUrlWithWorkspace = (path, urlSearch, workspaceId) => {
  const pathname = path || window.location.pathname;
  const search = isUndefined(urlSearch) ? window.location.search : urlSearch;
  const searchParams = search ? new URLSearchParams(search) : new URLSearchParams();

  if (!workspaceId) {
    console.error('This method requires the required "workspaceId" parameter');
  }

  if (!!workspaceId && !!workspaceId.trim()) {
    searchParams.set('ws', workspaceId.trim());
  }

  const newUrl = `${pathname}?${searchParams.toString()}`;

  return decodeLinkWithEncodeParams(newUrl);
};

export const getWsIdOfTabLink = (link = '') => {
  if (link && link.includes('ws=')) {
    const url = getLinkWithOrigin(link);
    const { query } = queryString.parseUrl(url);
    return get(query, 'ws', null);
  } else {
    return null;
  }
};

export const getLinkWithWs = (link = '', workspaceId = getWorkspaceId(), isFullLink = false) => {
  if (!link) {
    return link;
  }

  const url = new URL(link, window.location.origin || 'https://exmaple.com');
  const newUrl = getUrlWithWorkspace(url.pathname, url.search, workspaceId);

  return isFullLink ? url.origin + newUrl : newUrl;
};

export const getBaseUrlWorkspace = (wsId, homePageLink, withHost = true) => {
  const lastActiveTabWs = PageTabList.getLastActiveTabWs(wsId);
  const url = new URL(get(lastActiveTabWs, 'link') || homePageLink || Urls.DASHBOARD, window.location.origin);

  url.searchParams.set('ws', wsId);

  if (withHost) {
    return url.toString();
  }

  return url.pathname + url.search;
};

window.Citeck.Navigator = {
  goToDashboard: (recordRef, options) => {
    goToCardDetailsPage(recordRef, options);
  },
  getWorkspaceId: () => getWorkspaceId()
};

export const replaceHistoryLink = (history = window, link = '', force = false) => {
  if (isEmpty(history)) {
    return;
  }

  const search = get(history, 'location.search', '');
  const pathname = get(history, 'location.pathname', '');
  let pureLink = decodeLink(link);

  if (isEmpty(pureLink)) {
    pureLink = '/';
  }

  if (`${pathname}${search}` === pureLink && !force) {
    return;
  }

  window.history.replaceState({ path: pureLink }, '', pureLink);

  return pureLink;
};

export const pushHistoryLink = (history = window, linkData = {}, force = false) => {
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

  if (`${currentPathname}${currentSearch}` === newLink && !force) {
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

export const getUrlWithoutOrigin = (location = window.location) => {
  const pathname = get(location, 'pathname', window.location.pathname);
  const search = get(location, 'search', window.location.search || '');

  return `${pathname}${search}`;
};

export const getRecordRef = (sourceUrl = window.location.href) => {
  if (IS_TEST_ENV) {
    return '';
  }

  const recordRef = get(queryString.parseUrl(sourceUrl), 'query.recordRef', '');

  return isArray(recordRef) ? recordRef.shift() : recordRef;
};

export const isUrl = value => {
  const str = value.toString();

  return str.trim().startsWith('http://') || str.trim().startsWith('https://');
};
