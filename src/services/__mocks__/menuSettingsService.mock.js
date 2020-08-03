import { TMP_ICON_EMPTY } from '../../constants';
import { MenuSettings } from '../../constants/menu';

export const ITEMS_INPUT = [
  {
    id: 'HEADER_TASKS',
    label: 'menu.header.tasks',
    type: 'item',
    hidden: false,
    icon: 'uiserv/icon@3e0627d9-3c0b-49ac-8a11-97ae3da86527',
    config: {}
  },
  {
    id: 'HEADER_ORGSTRUCT',
    label: 'menu.header.orgstructure',
    type: 'item',
    hidden: false,
    icon: 'ui/icon@icon-empty',
    config: {}
  },
  {
    id: 'HEADER-DIVIDER',
    label: 'menu.header.my',
    icon: '',
    type: 'HEADER-DIVIDER',
    hidden: false,
    config: {}
  },
  {
    id: 'ARBITRARY',
    label: 'menu.header.ARBITRARY',
    type: 'item',
    icon: '',
    hidden: false,
    config: {}
  },
  {
    id: 'HEADER_TASKS',
    label: 'menu.header.tasks',
    type: 'SECTION',
    hidden: false,
    icon: 'uiserv/icon@3e0627d9-3c0b-49ac-8a11-97ae3da86527',
    config: {}
  }
];

export const ITEMS_OUTPUT = [
  {
    id: ITEMS_INPUT[0].id,
    label: ITEMS_INPUT[0].label,
    type: ITEMS_INPUT[0].type,
    hidden: !!ITEMS_INPUT[0].hidden,
    icon: {
      type: 'img',
      value: '3e0627d9-3c0b-49ac-8a11-97ae3da86527'
    },
    config: { ...ITEMS_INPUT[0].config },
    items: [],
    locked: !!ITEMS_INPUT[0].hidden,
    draggable: ![].includes(ITEMS_INPUT[0].type)
  },
  {
    id: ITEMS_INPUT[1].id,
    label: ITEMS_INPUT[1].label,
    type: ITEMS_INPUT[1].type,
    hidden: !!ITEMS_INPUT[1].hidden,
    icon: {
      type: 'icon',
      value: 'icon-empty'
    },
    config: { ...ITEMS_INPUT[1].config },
    items: [],
    locked: !!ITEMS_INPUT[1].hidden,
    draggable: ![].includes(ITEMS_INPUT[1].type)
  },
  {
    id: ITEMS_INPUT[2].id,
    label: ITEMS_INPUT[2].label,
    type: ITEMS_INPUT[2].type,
    hidden: !!ITEMS_INPUT[2].hidden,
    icon: undefined,
    config: { ...ITEMS_INPUT[2].config },
    items: [],
    locked: !!ITEMS_INPUT[2].hidden,
    draggable: ![].includes(ITEMS_INPUT[2].type)
  },
  {
    id: ITEMS_INPUT[3].id,
    label: ITEMS_INPUT[3].label,
    type: ITEMS_INPUT[3].type,
    hidden: !!ITEMS_INPUT[3].hidden,
    icon: { value: TMP_ICON_EMPTY },
    config: { ...ITEMS_INPUT[3].config },
    items: [],
    locked: !!ITEMS_INPUT[3].hidden,
    draggable: ![].includes(ITEMS_INPUT[3].type)
  },
  {
    config: {},
    draggable: true,
    hidden: false,
    icon: { value: '3e0627d9-3c0b-49ac-8a11-97ae3da86527', type: 'img' },
    id: 'HEADER_TASKS',
    items: [],
    label: 'menu.header.tasks',
    locked: false,
    type: 'SECTION'
  }
];

export const ACTIONS_BY_TYPE = {
  [MenuSettings.ItemTypes.SECTION]: [
    {
      icon: 'icon-edit',
      text: 'menu-settings.editor-items.action.edit',
      type: 'EDIT',
      when: { hidden: false }
    },
    {
      className: 'ecos-menu-settings-editor-items__action_caution',
      icon: 'icon-delete',
      text: 'menu-settings.editor-items.action.delete',
      type: 'DELETE',
      when: { hidden: false }
    },
    {
      className: 'ecos-menu-settings-editor-items__action_no-hide',
      icon: 'icon-on',
      text: 'menu-settings.editor-items.action.hide',
      type: 'ACTIVE'
    }
  ],
  [MenuSettings.ItemTypes.JOURNAL]: [
    {
      className: 'ecos-menu-settings-editor-items__action_caution',
      icon: 'icon-delete',
      text: 'menu-settings.editor-items.action.delete',
      type: 'DELETE',
      when: { hidden: false }
    },
    {
      className: 'ecos-menu-settings-editor-items__action_no-hide',
      icon: 'icon-on',
      text: 'menu-settings.editor-items.action.hide',
      type: 'ACTIVE'
    }
  ],
  [MenuSettings.ItemTypes.ARBITRARY]: [
    {
      icon: 'icon-edit',
      text: 'menu-settings.editor-items.action.edit',
      type: 'EDIT',
      when: { hidden: false }
    },
    {
      className: 'ecos-menu-settings-editor-items__action_caution',
      icon: 'icon-delete',
      text: 'menu-settings.editor-items.action.delete',
      type: 'DELETE',
      when: { hidden: false }
    },
    {
      className: 'ecos-menu-settings-editor-items__action_no-hide',
      icon: 'icon-on',
      text: 'menu-settings.editor-items.action.hide',
      type: 'ACTIVE'
    }
  ],
  [MenuSettings.ItemTypes.LINK_CREATE_CASE]: [
    {
      className: 'ecos-menu-settings-editor-items__action_caution',
      icon: 'icon-delete',
      text: 'menu-settings.editor-items.action.delete',
      type: 'DELETE',
      when: { hidden: false }
    },
    {
      className: 'ecos-menu-settings-editor-items__action_no-hide',
      icon: 'icon-off',
      text: 'menu-settings.editor-items.action.show',
      type: 'ACTIVE'
    }
  ],
  [MenuSettings.ItemTypes.HEADER_DIVIDER]: [
    {
      className: 'ecos-menu-settings-editor-items__action_caution',
      icon: 'icon-delete',
      text: 'menu-settings.editor-items.action.delete',
      type: 'DELETE',
      when: { hidden: false }
    },
    {
      className: 'ecos-menu-settings-editor-items__action_no-hide',
      icon: 'icon-off',
      text: 'menu-settings.editor-items.action.show',
      type: 'ACTIVE'
    }
  ],
  EMPTY_TYPE: [
    {
      className: 'ecos-menu-settings-editor-items__action_caution',
      icon: 'icon-delete',
      text: 'menu-settings.editor-items.action.delete',
      type: 'DELETE',
      when: { hidden: false }
    },
    {
      className: 'ecos-menu-settings-editor-items__action_no-hide',
      icon: 'icon-on',
      text: 'menu-settings.editor-items.action.hide',
      type: 'ACTIVE'
    }
  ]
};

export const PERMISSIONS_BY_TYPE = {
  [MenuSettings.ItemTypes.SECTION]: {
    draggable: true,
    editable: true,
    hasIcon: true,
    hideable: true,
    removable: true
  },
  [MenuSettings.ItemTypes.JOURNAL]: {
    draggable: true,
    editable: false,
    hasIcon: true,
    hideable: true,
    removable: true
  },
  [MenuSettings.ItemTypes.ARBITRARY]: {
    draggable: true,
    editable: true,
    hasIcon: true,
    hideable: true,
    removable: true
  },
  [MenuSettings.ItemTypes.LINK_CREATE_CASE]: {
    draggable: true,
    editable: false,
    hasIcon: true,
    hideable: true,
    removable: true
  },
  [MenuSettings.ItemTypes.HEADER_DIVIDER]: {
    draggable: true,
    editable: false,
    hasIcon: false,
    hideable: true,
    removable: true
  }
};
