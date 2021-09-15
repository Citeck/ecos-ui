import isEmpty from 'lodash/isEmpty';
import { PREFIX_ALFRESCO } from '../constants/alfresco';

export const getRefWithAlfrescoPrefix = recordRef => {
  if (isEmpty(recordRef)) {
    return recordRef;
  }

  if (recordRef.indexOf('workspace://') === 0) {
    return `${PREFIX_ALFRESCO}${recordRef}`;
  }

  return recordRef;
};

export const getRefExceptAlfrescoPrefix = recordRef => {
  if (isEmpty(recordRef)) {
    return recordRef;
  }

  recordRef.replace(PREFIX_ALFRESCO, '');

  return recordRef;
};
