import { Labels, SectionTypes, ViewTypes } from '../constants/bpmn';
import { t } from '../helpers/export/util';
import { URL } from '../constants';

export class BPMNDesignerService {
  static getMenuItems() {
    return [
      {
        href: URL.BPMN_DESIGNER,
        label: Labels.BaseMenu.PROCESS_MODELS,
        type: SectionTypes.BPM,
        icon: 'icon-models'
      },
      {
        href: URL.DEV_TOOLS,
        type: SectionTypes.DEV_TOOLS,
        label: Labels.BaseMenu.DEV_TOOLS
      }
    ];
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
