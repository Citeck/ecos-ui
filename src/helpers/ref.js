import isEmpty from 'lodash/isEmpty';

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
