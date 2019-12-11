import { URL } from '../../constants';
import { isNewVersionPage } from '../../helpers/export/urls';
import { checkFunctionalAvailabilityForUser } from '../../helpers/export/userInGroupsHelper';
import Records from '../../components/Records';

const prepareJournalLinkParams = params => {
  let listId = params.listId || params.journalsListId;
  let siteId = params.siteId || params.siteName;
  let journalId = params.journalId || params.journalRef;

  if (listId) {
    let tokens = listId.split('-');

    if (tokens.length > 1) {
      if (tokens[0] === 'site') {
        siteId = listId.substring('site-'.length, listId.length - tokens[tokens.length - 1].length - 1);
        listId = tokens[tokens.length - 1];
      } else if (tokens[0] === 'global') {
        siteId = null;
        listId = listId.substring('global-'.length);
      }
    }
  } else {
    listId = 'main';
  }

  let settingsId = params.filter ? '' : params.journalSettingsId || params.settings || '';
  let filter = params.filter || '';
  let filterRef = params.filterRef || '';
  let skipCount = params.skipCount || 0;
  let maxItems = params.maxItems || 10;

  return {
    skipCount,
    maxItems,
    filterRef,
    listId,
    siteId,
    journalId,
    filter,
    settingsId
  };
};

let firstJournalByList = {};

const getFirstJournalByList = listId => {
  let fromCache = firstJournalByList[listId];
  if (fromCache) {
    return fromCache;
  }

  let request = fetch(`/share/proxy/alfresco/api/journals/list?journalsList=${listId}`, {
    credentials: 'include'
  })
    .then(response => {
      if (response.status >= 200 && response.status < 300) {
        return response.json();
      }
      return { journals: [{ type: '' }] };
    })
    .then(json => {
      return json.journals[0].type;
    })
    .catch(e => {
      console.error(e);
      return '';
    });

  firstJournalByList[listId] = request;
  return request;
};

const getNewPageUrl = params => {
  const { journalId, siteId, listId, settingsId } = params;

  let journalsListId = 'main';
  if (siteId) {
    journalsListId = 'site-' + siteId + '-' + listId;
  } else {
    journalsListId = 'global-' + listId;
  }

  let notNullJournalId;
  if (journalId) {
    notNullJournalId = Promise.resolve(journalId);
  } else {
    notNullJournalId = getFirstJournalByList(journalsListId);
  }

  return notNullJournalId.then(journalId => {
    return `${URL.JOURNAL}?journalId=${journalId}&journalSettingId=${settingsId}&journalsListId=${journalsListId}`;
  });
};

const getOldPageUrl = params => {
  const { journalId, siteId, listId, filterRef, settingsId, skipCount, maxItems } = params;

  let targetUrl = '/share/page';
  if (siteId) {
    targetUrl += `/site/${siteId}`;
  }
  targetUrl += `/journals2/list/${listId}#`;

  if (journalId) {
    targetUrl += `journal=${journalId}`;
  }

  if (filterRef) {
    targetUrl += `&filter=${filterRef}`;
  } else {
    targetUrl += `&filter=`;
  }

  if (settingsId) {
    targetUrl += `&settings=${settingsId}`;
  }

  if (skipCount) {
    targetUrl += `&skipCount=${skipCount}`;
  }

  if (maxItems) {
    targetUrl += `&maxItems=${maxItems}`;
  }

  return targetUrl;
};

export const getJournalPageUrl = params => {
  const preparedParams = prepareJournalLinkParams(params);

  if (isNewVersionPage()) {
    const isNewJournalPageEnable = Records.get('ecos-config@new-journals-page-enable').load('.bool');
    const isJournalAvailibleForUser = checkFunctionalAvailabilityForUser('default-ui-new-journals-access-groups');

    return Promise.all([isNewJournalPageEnable, isJournalAvailibleForUser]).then(values =>
      values.includes(true) ? getNewPageUrl(preparedParams) : getOldPageUrl(preparedParams)
    );
  }
};
