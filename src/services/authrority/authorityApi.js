import Records from '../../components/Records/Records';

export const getAuthorityNameFromAlfresco = nodeRef => {
  return Records.get(nodeRef).load('cm:userName!cm:authorityName');
};
