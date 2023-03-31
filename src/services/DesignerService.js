import { Labels, ViewTypes } from '../constants/bpmn';
import { t } from '../helpers/export/util';

export default class DesignerService {
  static getCreateVariants() {
    return [
      {
        id: 'designer-create-model',
        title: t(Labels.CreateVariants.CREATE_MODEL)
      },
      {
        id: 'designer-import-model',
        title: t(Labels.CreateVariants.IMPORT_MODEL)
      }
    ];
  }

  static getViewPageTypes() {
    return [
      {
        id: 'view-switcher-cards',
        icon: 'icon-tiles',
        type: ViewTypes.CARDS,
        title: Labels.Views.CARDS
      },
      {
        id: 'view-switcher-list',
        icon: 'icon-list',
        type: ViewTypes.LIST,
        title: Labels.Views.LIST
      }
    ];
  }
}
