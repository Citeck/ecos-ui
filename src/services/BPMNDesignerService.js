import { DESIGNER_PAGE_CONTEXT, EDITOR_PAGE_CONTEXT, Labels, ViewTypes } from '../constants/bpmn';
import { t } from '../helpers/export/util';
import BooleanFormatter from '../components/common/grid/formatters/gql/BooleanFormatter';
import DateTimeFormatter from '../components/common/grid/formatters/gql/DateTimeFormatter';
import AssocFormatter from '../components/common/grid/formatters/gql/AssocFormatter';

export class BPMNDesignerService {
  static getMenuItems({ isAdmin, isBpmAdmin }) {
    const menuItems = [
      {
        href: DESIGNER_PAGE_CONTEXT,
        icon: 'icon-models',
        label: t(Labels.BaseMenu.PROCESS_MODELS),
        order: 1
      },
      {
        href: `${EDITOR_PAGE_CONTEXT}#/forms`,
        icon: 'icon-forms',
        label: t(Labels.BaseMenu.FORMS),
        order: 3
      }
    ];

    if (isAdmin || isBpmAdmin) {
      menuItems.push(
        {
          href: `${EDITOR_PAGE_CONTEXT}#/casemodels`,
          icon: 'icon-case-models',
          label: t(Labels.BaseMenu.CASE_MODELS),
          order: 2
        },
        {
          href: `${EDITOR_PAGE_CONTEXT}#/decision-tables`,
          icon: 'icon-decision-tables',
          label: t(Labels.BaseMenu.DECISION_TABLES),
          order: 4
        },
        {
          href: `${EDITOR_PAGE_CONTEXT}#/apps`,
          icon: 'icon-apps',
          label: t(Labels.BaseMenu.APPS),
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
        icon: 'icon-history',
        type: ViewTypes.LIST,
        title: Labels.Views.LIST,
        hidden: true
      },
      {
        id: 'bpmn-view-switcher-table',
        icon: 'icon-list',
        type: ViewTypes.TABLE,
        title: Labels.Views.TABLE
      }
    ].filter(item => !item.hidden);
  }

  static getColumns() {
    return [
      {
        dataField: 'label',
        text: t(Labels.Columns.LABEL)
      },
      {
        dataField: 'categoryId',
        text: t(Labels.Columns.CATEGORY),
        formatExtraData: {
          formatter: AssocFormatter
        }
      },
      {
        dataField: 'created',
        text: t(Labels.Columns.CREATED),
        formatExtraData: {
          formatter: DateTimeFormatter
        }
      },
      {
        dataField: 'creator',
        text: t(Labels.Columns.CREATOR)
      },
      {
        dataField: 'modified',
        text: t(Labels.Columns.MODIFIED),
        formatExtraData: {
          formatter: DateTimeFormatter
        }
      },
      {
        dataField: 'modifier',
        text: t(Labels.Columns.MODIFIER)
      },
      {
        dataField: 'description',
        text: t(Labels.Columns.DESCRIPTION)
      },
      {
        dataField: 'canWrite',
        text: t(Labels.Columns.CAN_WRITE),
        formatExtraData: {
          formatter: BooleanFormatter
        }
      },
      {
        dataField: 'hasThumbnail',
        text: t(Labels.Columns.HAS_THUMBNAIL),
        formatExtraData: {
          formatter: BooleanFormatter
        }
      }
    ];
  }

  static filterModels({ models = [], searchText }) {
    return models.filter(item => {
      const fields = Object.keys(item);
      const found = fields.filter(field =>
        String(item[field])
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
      return found.length;
    });
  }
}
