import queryString from 'query-string';
import { URL_PAGECONTEXT } from '../../constants/alfresco';

const PREVIEW_KEY = 'preview';
const JOURNALS_LIST_ID_KEY = 'journalsListId';
const JOURNAL_ID_KEY = 'journalId';
const JOURNAL_SETTING_ID_KEY = 'journalSettingId';
const TYPE_KEY = 'type';
const DESTINATION_KEY = 'destination';

const getBool = str => str === 'true';

export const getJournalPage = ({ journalsListId, journalId, journalSettingId }) => {
  const qString = queryString.stringify({
    [JOURNALS_LIST_ID_KEY]: journalsListId,
    [JOURNAL_ID_KEY]: journalId,
    [JOURNAL_SETTING_ID_KEY]: journalSettingId
  });

  return `${URL_PAGECONTEXT}ui/journals?${qString}`;
};

export const getCreateRecord = ({ type, destination }) => {
  const qString = queryString.stringify({
    [TYPE_KEY]: type,
    [DESTINATION_KEY]: destination
  });

  return `${URL_PAGECONTEXT}node-create?${qString}&viewId=`;
};

export const getPreview = location => getBool(queryString.parse(location.search)[PREVIEW_KEY]);
export const getJournalsListId = location => queryString.parse(location.search)[JOURNALS_LIST_ID_KEY];
export const getJournalId = location => queryString.parse(location.search)[JOURNAL_ID_KEY];
export const getJournalSettingId = location => queryString.parse(location.search)[JOURNAL_SETTING_ID_KEY];

export const setPreview = (location, value) => {
  const params = queryString.parse(location.search);

  params[PREVIEW_KEY] = value;

  return `${location.pathname}?${queryString.stringify(params)}`;
};

export const setJournalsListId = (location, value) => {
  const params = queryString.parse(location.search);

  params[JOURNALS_LIST_ID_KEY] = value;

  return `${location.pathname}?${queryString.stringify(params)}`;
};

export const setJournalId = (location, value) => {
  const params = queryString.parse(location.search);

  params[JOURNAL_ID_KEY] = value;

  return `${location.pathname}?${queryString.stringify(params)}`;
};

export const setJournalSettingId = (location, value) => {
  const params = queryString.parse(location.search);

  params[JOURNAL_SETTING_ID_KEY] = value;

  return `${location.pathname}?${queryString.stringify(params)}`;
};
