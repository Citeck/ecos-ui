import isEmpty from 'lodash/isEmpty';

import { SourcesId } from '../constants';

export const getRefWithAlfrescoPrefix = recordRef => {
  if (isEmpty(recordRef)) {
    return recordRef;
  }

  if (recordRef.indexOf('workspace://') === 0) {
    return `alfresco/@${recordRef}`;
  }

  return recordRef;
};

export const getRefExceptAlfrescoPrefix = recordRef => {
  if (isEmpty(recordRef)) {
    return recordRef;
  }

  recordRef.replace('alfresco/@', '');

  return recordRef;
};

export const parseTypeId = id => id && (id.includes(SourcesId.TYPE) ? id : `${SourcesId.TYPE}@${id}`);

export const parseJournalId = id => id && (id.includes(SourcesId.JOURNAL) ? id : `${SourcesId.JOURNAL}@${id}`);
