import { Labels, ViewTypes } from '../constants/bpmn';
import { t } from '../helpers/export/util';
import isEqual from 'lodash/isEqual';

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

  static getViewPageTypes() {
    return [
      {
        id: 'bpmn-view-switcher-cards',
        icon: 'icon-tiles',
        type: ViewTypes.CARDS,
        title: Labels.Views.CARDS
      },
      {
        id: 'bpmn-view-switcher-list',
        icon: 'icon-list',
        type: ViewTypes.LIST,
        title: Labels.Views.LIST
      }
    ].filter(item => !item.hidden);
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
  }
}
