import get from 'lodash/get';

import { URL as Urls } from '@/constants';
import { createDocumentUrl, getLinkWithWs, getSelectedValueLink } from '@/helpers/urls';

export const getFormatter = (linkFormatter: string): (() => string) | null => {
  let formatterFunc = null;

  if (linkFormatter) {
    try {
      formatterFunc = eval(`(${linkFormatter})`);
    } catch (err) {
      console.error('[SelectJournal] Error when parsing the link Formatter:', err);
    }
  }

  return formatterFunc;
};

export const getFormattedLink = ({
  item,
  formatterFunc
}: {
  item: {
    locatedWorkspaceId?: string;
    disp: string;
    id: string;
    canEdit: boolean;
  };
  formatterFunc?: (link: string) => string;
}): string => {
  let link = getSelectedValueLink(item);
  const workspaceId = get(item, 'locatedWorkspaceId');

  if (formatterFunc) {
    try {
      link = formatterFunc(link);
    } catch (err) {
      console.error('[SelectJournal] Error in linkFormatter method:', err);
    }
  } else {
    link = createDocumentUrl(link);
  }

  if (!!link && !link.includes(Urls.DASHBOARD) && link.includes('@')) {
    link = createDocumentUrl(link);

    if (!!workspaceId) {
      link = getLinkWithWs(link, workspaceId);
    }
  }

  return link;
};
