import isEqual from 'lodash/isEqual';

import { Labels } from '../constants/adminSection';
import { t } from '../helpers/export/util';

export default class AdminSectionService {
  static getCreateVariants() {
    return [
      {
        id: 'bpmn-designer-create-model',
        title: t(Labels.CreateVariants.CREATE_MODEL)
      },
      {
        id: 'bpmn-designer-import-model',
        title: t(Labels.CreateVariants.IMPORT_MODEL)
      }
    ];
  }

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
