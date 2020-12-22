import { DESIGNER_PAGE_CONTEXT, EDITOR_PAGE_CONTEXT, ViewTypes } from '../constants/bpmn';
import { t } from '../helpers/export/util';

export class BPMNDesignerService {
  static getMenuItems({ isAdmin, isBpmAdmin }) {
    const menuItems = [
      {
        href: DESIGNER_PAGE_CONTEXT,
        icon: 'icon-models',
        label: t('bpmn-designer.right-menu.process-models'),
        order: 1
      },
      {
        href: `${EDITOR_PAGE_CONTEXT}#/forms`,
        icon: 'icon-forms',
        label: t('bpmn-designer.right-menu.forms'),
        order: 3
      }
    ];

    if (isAdmin || isBpmAdmin) {
      menuItems.push(
        {
          href: `${EDITOR_PAGE_CONTEXT}#/casemodels`,
          icon: 'icon-case-models',
          label: t('bpmn-designer.right-menu.case-models'),
          order: 2
        },
        {
          href: `${EDITOR_PAGE_CONTEXT}#/decision-tables`,
          icon: 'icon-decision-tables',
          label: t('bpmn-designer.right-menu.decision-tables'),
          order: 4
        },
        {
          href: `${EDITOR_PAGE_CONTEXT}#/apps`,
          icon: 'icon-apps',
          label: t('bpmn-designer.right-menu.apps'),
          order: 5
        }
      );
    }

    return menuItems.sort((current, next) => current.order - next.order);
  }

  static getCreateVariants() {
    return [
      {
        id: 'bpmn-designer-create-model',
        title: t('bpmn-designer.create-model')
      },
      {
        id: 'bpmn-designer-import-model',
        title: t('bpmn-designer.import-model')
      }
    ];
  }

  static getViewPageTypes() {
    return [
      {
        id: 'bpmn-view-switcher-cards',
        icon: 'icon-tiles',
        type: ViewTypes.CARDS,
        title: 'bpmn-designer.view-mode.cards'
      },
      {
        id: 'bpmn-view-switcher-list',
        icon: 'icon-history',
        type: ViewTypes.LIST,
        title: 'bpmn-designer.view-mode.list',
        hidden: true
      },
      {
        id: 'bpmn-view-switcher-table',
        icon: 'icon-list',
        type: ViewTypes.TABLE,
        title: 'bpmn-designer.view-mode.table'
      }
    ].filter(item => !item.hidden);
  }
}
