import queryString from 'query-string';
import { URL_PAGECONTEXT, PROXY_URI } from './alfresco';
import { ALFRESCO_EQUAL_PREDICATES_MAP } from '../components/common/form/SelectJournal/predicates';
import { ParserPredicate } from '../components/Filters/predicates';

const JOURNALS_LIST_ID_KEY = 'journalsListId';
const JOURNAL_ID_KEY = 'journalId';
const JOURNAL_SETTING_ID_KEY = 'journalSettingId';
const TYPE_KEY = 'type';
const DESTINATION_KEY = 'destination';
const FILTER_KEY = 'filter';

export const OLD_LINKS = false;

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
    url = `${URL_PAGECONTEXT}ui/journals?${qString}`;
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

  return `${URL_PAGECONTEXT}node-create?${qString}&viewId=`;
};

export const goToJournalsPage = options => window.open(getJournalPageUrl(options), '_blank');
export const goToCreateRecordPage = createVariants => window.open(getCreateRecordUrl(createVariants), '_blank');
export const goToCardDetailsPage = nodeRef => window.open(`${URL_PAGECONTEXT}card-details?nodeRef=${nodeRef}`, '_blank');
export const goToNodeEditPage = nodeRef => window.open(`${URL_PAGECONTEXT}node-edit-page?nodeRef=${nodeRef}`, '_blank');
