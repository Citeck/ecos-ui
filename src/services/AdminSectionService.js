import isEqual from 'lodash/isEqual';

export default class AdminSectionService {
  static getSelectedSectionIndex(list, active) {
    return list.findIndex(item => isEqual(item, active));
  }

  static getActiveSectionInGroups(groups, funCompare) {
    let section;

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
