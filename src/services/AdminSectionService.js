import isEqual from 'lodash/isEqual';
import queryString from 'query-string';
import get from 'lodash/get';

import { SectionNewTab, SectionTypes } from '../constants/adminSection';
import { URL } from '../constants';

export default class AdminSectionService {
  static getSelectedSectionIndex(list, active) {
    list = list || [];
    return list.findIndex(item => isEqual(item, active));
  }

  static getActiveSectionInGroups(groups) {
    let type = AdminSectionService.getActiveSectionType();
    let section;
    groups = groups || [];

    for (const group of groups) {
      section = group.sections.find(sec => sec.type && sec.type === type);

      if (section) {
        return section;
      }
    }

    if (!section) {
      console.warn('Unknown section');
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

    if (!type) {
      console.warn('Unknown section type');
    }

    return type;
  }

  static getTabOptions(currentType, newType) {
    const openNewTab =
      currentType !== newType &&
      (SectionNewTab.includes(newType) || (SectionNewTab.includes(currentType) && !SectionNewTab.includes(newType)));

    return { updateUrl: !openNewTab, pushHistory: true, openNewTab };
  }

  static getURLSection(info) {
    const type = get(info, 'type');

    switch (type) {
      case SectionTypes.BPM: {
        return queryString.stringifyUrl({ url: URL.ADMIN_PAGE, query: { type } });
      }
      case SectionTypes.JOURNAL: {
        return queryString.stringifyUrl({ url: URL.ADMIN_PAGE, query: { type, journalId: get(info, 'config.journalId') } });
      }
      case SectionTypes.DEV_TOOLS: {
        return URL.DEV_TOOLS;
      }
      default: {
        console.warn('Unknown section');
        return;
      }
    }
  }
}
