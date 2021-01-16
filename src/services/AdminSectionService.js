import isEqual from 'lodash/isEqual';
import queryString from 'query-string';
import { SectionTypes } from '../constants/adminSection';
import { URL } from '../constants';

export default class AdminSectionService {
  static getSelectedSectionIndex(list, active) {
    list = list || [];
    return list.findIndex(item => isEqual(item, active));
  }

  static getActiveSectionInGroups(groups) {
    const { query, url } = queryString.parseUrl(window.location.href);
    let type = AdminSectionService.getActiveSectionType();
    let section;
    groups = groups || [];

    for (const group of groups) {
      section = group.sections.find(sec => (type === SectionTypes.JOURNAL ? sec.config.journalId === query.journalId : sec.type === type));

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

    if (url.includes(URL.BPMN_DESIGNER)) {
      if (query.journalId) {
        type = SectionTypes.JOURNAL;
      } else {
        type = SectionTypes.BPM;
      }
    } else if (url.includes(URL.DEV_TOOLS)) {
      type = SectionTypes.DEV_TOOLS;
    }

    if (!type) {
      console.warn('Unknown section type');
    }

    return type;
  }
}
