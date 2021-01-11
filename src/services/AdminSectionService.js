import isEqual from 'lodash/isEqual';

export default class AdminSectionService {
  static getSelectedSectionIndex(list, active) {
    list = list || [];
    return list.findIndex(item => isEqual(item, active));
  }

  static getActiveSectionInGroups(groups, funCompare) {
    let section;
    groups = groups || [];

    for (const item of groups) {
      section = item.sections.find(funCompare);

      if (section) {
        return section;
      }
    }

    if (!section) {
      console.warn('Unknown section');
    }
  }
}
