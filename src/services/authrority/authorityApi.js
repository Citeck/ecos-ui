import Records from '../../components/Records/Records';

export const getAuthorityNameFromAlfresco = async nodeRef => {
  return Records.get(nodeRef).load('cm:userName!cm:authorityName');
};
