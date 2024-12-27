import queryString from 'query-string';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';

import { SectionNewTab, SectionTypes } from '../constants/adminSection';
import { URL } from '../constants';
import { getWorkspaceId } from '../helpers/urls';
import { getEnabledWorkspaces } from '../helpers/util';

export default class AdminSectionService {
  static getSelectedSectionIndex(list, active) {
    list = list || [];
    return list.findIndex(item => isEqual(item, active));
  }

  static getActiveSectionInGroups(groups) {
    const { query } = queryString.parseUrl(window.location.href);
    let type = AdminSectionService.getActiveSectionType();
    let section;

    groups = groups || [];

    for (const group of groups) {
      section = group.sections.find(
        sec => sec.type && (sec.type === SectionTypes.JOURNAL ? query.journalId === get(sec, 'config.journalId') : sec.type === type)
      );

      if (section) {
        return section;
      }
    }
  }

  static getActiveSectionType() {
    const { query, url } = queryString.parseUrl(window.location.href);
    let type;

    if (url.includes(URL.ADMIN_PAGE)) {
      type = query.type || SectionTypes.BPM;
    } else if (url.includes(URL.DEV_TOOLS)) {
      type = SectionTypes.DEV_TOOLS;
    }

    return type;
  }

  static getTabOptions(currentType, newType) {
    const sectionNewTab = SectionNewTab;

    if (getEnabledWorkspaces()) {
      sectionNewTab.push(SectionTypes.BPM, SectionTypes.DMN, SectionTypes.BPMN_ADMIN);
    }

    const openNewTab =
      currentType !== newType &&
      (sectionNewTab.includes(newType) || (sectionNewTab.includes(currentType) && !sectionNewTab.includes(newType)));

    return { updateUrl: !openNewTab, pushHistory: true, openNewTab };
  }

  static getURLSection(info) {
    const type = get(info, 'type');
    const ws = getWorkspaceId();
    const query = { type };
    if (get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
      query.ws = ws;
    }

    switch (type) {
      case SectionTypes.JOURNAL: {
        return queryString.stringifyUrl({ url: URL.ADMIN_PAGE, query: { ...query, journalId: get(info, 'config.journalId') } });
      }
      default: {
        return queryString.stringifyUrl({ url: URL.ADMIN_PAGE, query });
      }
    }
  }
}
