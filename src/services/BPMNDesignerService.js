import { Labels, ViewTypes } from '../constants/bpmn';
import { t } from '../helpers/export/util';
import { URL } from '../constants';

export class BPMNDesignerService {
  static getMenuItems({ isAdmin, isBpmAdmin }) {
    const menuItems = [
      {
        href: URL.BPMN_DESIGNER,
        icon: 'icon-models',
        label: Labels.BaseMenu.PROCESS_MODELS,
        order: 1
      }
    ];

    return menuItems.sort((current, next) => current.order - next.order);
  }

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
}
