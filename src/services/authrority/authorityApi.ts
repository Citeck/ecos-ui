import Records from '../../components/Records/Records';

import { getWorkspaceId } from '@/helpers/urls';

export const getAuthorityNameFromAlfresco = async (nodeRef: string): Promise<string> => {
  return Records.get(nodeRef).load('cm:userName!cm:authorityName');
};

export const isManagerCurrentUser = async (): Promise<boolean> => {
  const wsId = getWorkspaceId();

  return Records.get(`emodel/workspace@${wsId}`).load('isCurrentUserManager?bool', true);
};
