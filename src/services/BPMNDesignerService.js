import { DESIGNER_PAGE_CONTEXT, EDITOR_PAGE_CONTEXT } from '../constants/bpmn';
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
}
