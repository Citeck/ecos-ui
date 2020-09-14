import cloneDeep from 'lodash/cloneDeep';

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
  },
  {
    id: 'HEADER_TASKS',
    label: 'menu.header.tasks',
    type: 'SECTION',
    icon: 'uiserv/icon@3e0627d9-3c0b-49ac-8a11-97ae3da86527',
    config: {}
  },
  {
    id: 'JOURNAL_1',
    label: 'menu.header.tasks',
    type: 'JOURNAL',
    icon: 'uiserv/icon@3e0627d9-3c0b-49ac-8a11-97ae3da86527',
    config: {}
  },
  {
    id: 'JOURNAL_2',
    label: 'menu.header.tasks',
    type: 'JOURNAL',
    hidden: true,
    icon: 'uiserv/icon@3e0627d9-3c0b-49ac-8a11-97ae3da86527',
    config: {}
  }
];

export const ITEM_PARAMS_OUTPUT = [
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
    draggable: false
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
    draggable: false
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
    draggable: true
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
    draggable: false
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

export const ACTIONS = {
  EDIT: {
    icon: 'icon-edit',
    text: 'menu-settings.editor-items.action.edit',
    type: 'EDIT',
    when: { hidden: false }
  },
  DELETE: {
    className: 'ecos-menu-settings-editor-items__action_caution',
    icon: 'icon-delete',
    text: 'menu-settings.editor-items.action.delete',
    type: 'DELETE',
    when: { hidden: false }
  },
  ACTIVE_ON: {
    className: 'ecos-menu-settings-editor-items__action_no-hide',
    icon: 'icon-eye-show',
    text: 'menu-settings.editor-items.action.hide',
    type: 'ACTIVE'
  },
  ACTIVE_OFF: {
    className: 'ecos-menu-settings-editor-items__action_no-hide',
    icon: 'icon-eye-hide',
    text: 'menu-settings.editor-items.action.show',
    type: 'ACTIVE'
  }
};

export const ACTIONS_BY_TYPE = {
  [MenuSettings.ItemTypes.SECTION]: [ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.ACTIVE_ON],
  [MenuSettings.ItemTypes.JOURNAL]: [ACTIONS.DELETE, ACTIONS.ACTIVE_ON],
  [MenuSettings.ItemTypes.ARBITRARY]: [ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.ACTIVE_ON],
  [MenuSettings.ItemTypes.LINK_CREATE_CASE]: [ACTIONS.DELETE, ACTIONS.ACTIVE_OFF],
  [MenuSettings.ItemTypes.HEADER_DIVIDER]: [ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.ACTIVE_OFF],
  EMPTY_TYPE: [ACTIONS.DELETE, ACTIONS.ACTIVE_ON]
};

export const PERMISSIONS_BY_TYPE = {
  [MenuSettings.ItemTypes.SECTION]: {
    draggable: true,
    editable: true,
    hasIcon: true,
    hasUrl: false,
    hideable: true,
    removable: true
  },
  [MenuSettings.ItemTypes.JOURNAL]: {
    draggable: true,
    editable: false,
    hasIcon: true,
    hasUrl: false,
    hideable: true,
    removable: true
  },
  [MenuSettings.ItemTypes.ARBITRARY]: {
    draggable: true,
    editable: true,
    hasIcon: true,
    hasUrl: true,
    hideable: true,
    removable: true
  },
  [MenuSettings.ItemTypes.LINK_CREATE_CASE]: {
    draggable: true,
    editable: false,
    hasIcon: true,
    hasUrl: false,
    hideable: true,
    removable: true
  },
  [MenuSettings.ItemTypes.HEADER_DIVIDER]: {
    draggable: true,
    editable: true,
    hasIcon: false,
    hasUrl: false,
    hideable: true,
    removable: true
  }
};

export const ACTIONS_ON_MENU_ITEMS = {
  CREATE: [
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: '2bb94f18-78d4-4fb8-9e72-76601969e9de',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: '3c0c25fc-0f51-4f31-972d-2585b6f99839',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: '1ca8bfea-159a-496f-8118-12ffd26842a7',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '04b63374-4a61-498a-8cda-df299fd5600e',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        }
      ],
      action: 'CREATE',
      data: [
        { id: 'c111aeed-77be-4675-828d-2d4b20432910', label: 'Тестовый', config: { recordRef: 'uiserv/journal@Test' }, type: 'JOURNAL' }
      ],
      level: 1
    },
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: '2bb94f18-78d4-4fb8-9e72-76601969e9de',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: '3c0c25fc-0f51-4f31-972d-2585b6f99839',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: '1ca8bfea-159a-496f-8118-12ffd26842a7',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '04b63374-4a61-498a-8cda-df299fd5600e',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'c111aeed-77be-4675-828d-2d4b20432910',
          label: 'Тестовый',
          type: 'JOURNAL',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: { recordRef: 'uiserv/journal@Test' },
          items: [],
          locked: false,
          draggable: true
        }
      ],
      newItems: [
        {
          id: 'c111aeed-77be-4675-828d-2d4b20432910',
          label: 'Тестовый',
          type: 'JOURNAL',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: { recordRef: 'uiserv/journal@Test' },
          items: [],
          locked: false,
          draggable: true
        }
      ]
    }
  ],
  DELETE: [
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: '2bb94f18-78d4-4fb8-9e72-76601969e9de',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: '3c0c25fc-0f51-4f31-972d-2585b6f99839',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: '1ca8bfea-159a-496f-8118-12ffd26842a7',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '04b63374-4a61-498a-8cda-df299fd5600e',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'c111aeed-77be-4675-828d-2d4b20432910',
          label: 'Тестовый',
          type: 'JOURNAL',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: { recordRef: 'uiserv/journal@Test' },
          items: [],
          locked: false,
          draggable: true,
          dndIdx: 5
        }
      ],
      action: 'DELETE',
      id: 'c111aeed-77be-4675-828d-2d4b20432910'
    },
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: '2bb94f18-78d4-4fb8-9e72-76601969e9de',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: '3c0c25fc-0f51-4f31-972d-2585b6f99839',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: '1ca8bfea-159a-496f-8118-12ffd26842a7',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '04b63374-4a61-498a-8cda-df299fd5600e',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        }
      ]
    }
  ],
  DISPLAY_COUNT: [
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: '2bb94f18-78d4-4fb8-9e72-76601969e9de',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: '3c0c25fc-0f51-4f31-972d-2585b6f99839',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: '1ca8bfea-159a-496f-8118-12ffd26842a7',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '04b63374-4a61-498a-8cda-df299fd5600e',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'c6b743ee-8faa-4d82-841c-9afdcc56a0a6',
          label: { ru: 'Test' },
          type: 'SECTION',
          hidden: false,
          icon: { value: 'icon-empty', type: 'icon' },
          config: {},
          items: [
            {
              id: '73faa604-38c5-405d-ba60-9748e590f34d',
              label: 'Тестовый',
              type: 'JOURNAL',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { recordRef: 'uiserv/journal@Test', displayCount: false },
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 150
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 5
        }
      ],
      action: 'DISPLAY_COUNT',
      id: '73faa604-38c5-405d-ba60-9748e590f34d'
    },
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: '2bb94f18-78d4-4fb8-9e72-76601969e9de',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: '3c0c25fc-0f51-4f31-972d-2585b6f99839',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: '1ca8bfea-159a-496f-8118-12ffd26842a7',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '04b63374-4a61-498a-8cda-df299fd5600e',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'c6b743ee-8faa-4d82-841c-9afdcc56a0a6',
          label: { ru: 'Test' },
          type: 'SECTION',
          hidden: false,
          icon: { value: 'icon-empty', type: 'icon' },
          config: {},
          items: [
            {
              id: '73faa604-38c5-405d-ba60-9748e590f34d',
              label: 'Тестовый',
              type: 'JOURNAL',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { recordRef: 'uiserv/journal@Test', displayCount: true },
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 150
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 5
        }
      ]
    }
  ],
  EDIT: [
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: '2bb94f18-78d4-4fb8-9e72-76601969e9de',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: '3c0c25fc-0f51-4f31-972d-2585b6f99839',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: '1ca8bfea-159a-496f-8118-12ffd26842a7',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '04b63374-4a61-498a-8cda-df299fd5600e',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'c6b743ee-8faa-4d82-841c-9afdcc56a0a6',
          label: { ru: 'Testk' },
          type: 'SECTION',
          hidden: false,
          icon: { value: 'icon-empty', type: 'icon' },
          config: {},
          items: [
            {
              id: '45de6f76-a418-4cb8-b03a-808ac9ca575b',
              label: '123123',
              type: 'JOURNAL',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { recordRef: 'uiserv/journal@23123' },
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 150
            },
            {
              id: '73faa604-38c5-405d-ba60-9748e590f34d',
              label: 'Тестовый',
              type: 'JOURNAL',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { recordRef: 'uiserv/journal@Test', displayCount: true },
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 151
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 5
        }
      ],
      action: 'EDIT',
      id: 'c6b743ee-8faa-4d82-841c-9afdcc56a0a6',
      data: {
        label: { ru: 'Тест', en: 'Test' },
        icon: {
          value: '91ee6c3c-3ae1-4909-ab3a-3b833d3c742b',
          id: 'uiserv/icon@91ee6c3c-3ae1-4909-ab3a-3b833d3c742b',
          type: 'img',
          url:
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEyIDIgMTUuMDkgOC4yNiAyMiA5LjI3IDE3IDE0LjE0IDE4LjE4IDIxLjAyIDEyIDE3Ljc3IDUuODIgMjEuMDIgNyAxNC4xNCAyIDkuMjcgOC45MSA4LjI2IDEyIDIiPjwvcG9seWdvbj48L3N2Zz4='
        },
        type: 'SECTION'
      }
    },
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: '2bb94f18-78d4-4fb8-9e72-76601969e9de',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: '3c0c25fc-0f51-4f31-972d-2585b6f99839',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: '1ca8bfea-159a-496f-8118-12ffd26842a7',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '04b63374-4a61-498a-8cda-df299fd5600e',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'c6b743ee-8faa-4d82-841c-9afdcc56a0a6',
          label: { ru: 'Тест', en: 'Test' },
          type: 'SECTION',
          hidden: false,
          icon: {
            value: '91ee6c3c-3ae1-4909-ab3a-3b833d3c742b',
            id: 'uiserv/icon@91ee6c3c-3ae1-4909-ab3a-3b833d3c742b',
            type: 'img',
            url:
              'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEyIDIgMTUuMDkgOC4yNiAyMiA5LjI3IDE3IDE0LjE0IDE4LjE4IDIxLjAyIDEyIDE3Ljc3IDUuODIgMjEuMDIgNyAxNC4xNCAyIDkuMjcgOC45MSA4LjI2IDEyIDIiPjwvcG9seWdvbj48L3N2Zz4='
          },
          config: {},
          items: [
            {
              id: '45de6f76-a418-4cb8-b03a-808ac9ca575b',
              label: '123123',
              type: 'JOURNAL',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { recordRef: 'uiserv/journal@23123' },
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 150
            },
            {
              id: '73faa604-38c5-405d-ba60-9748e590f34d',
              label: 'Тестовый',
              type: 'JOURNAL',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { recordRef: 'uiserv/journal@Test', displayCount: true },
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 151
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 5
        }
      ],
      newItems: [
        {
          id: 'c6b743ee-8faa-4d82-841c-9afdcc56a0a6',
          label: { ru: 'Тест', en: 'Test' },
          type: 'SECTION',
          hidden: false,
          icon: {
            value: '91ee6c3c-3ae1-4909-ab3a-3b833d3c742b',
            id: 'uiserv/icon@91ee6c3c-3ae1-4909-ab3a-3b833d3c742b',
            type: 'img',
            url:
              'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEyIDIgMTUuMDkgOC4yNiAyMiA5LjI3IDE3IDE0LjE0IDE4LjE4IDIxLjAyIDEyIDE3Ljc3IDUuODIgMjEuMDIgNyAxNC4xNCAyIDkuMjcgOC45MSA4LjI2IDEyIDIiPjwvcG9seWdvbj48L3N2Zz4='
          },
          config: {},
          items: [
            {
              id: '45de6f76-a418-4cb8-b03a-808ac9ca575b',
              label: '123123',
              type: 'JOURNAL',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { recordRef: 'uiserv/journal@23123' },
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 150
            },
            {
              id: '73faa604-38c5-405d-ba60-9748e590f34d',
              label: 'Тестовый',
              type: 'JOURNAL',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { recordRef: 'uiserv/journal@Test', displayCount: true },
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 151
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 5
        }
      ]
    }
  ],
  ACTIVE_OFF: [
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: 'c8887c44-267e-45b0-bfa0-57008f1bac4f',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: 'e8f5e8f2-f602-4f36-8ed9-ac68d57ac652',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'c1ecb24b-e4af-46c6-8b05-71c4b60997ea',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '60e5be44-50d2-43be-b67e-8ea7d9bdca12',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'a32ca0d3-f98b-4add-b53e-e24596e995f7',
          label: { ru: 'rere' },
          type: 'ARBITRARY',
          hidden: false,
          icon: { value: 'icon-empty', type: 'icon' },
          config: { url: 'https://2gis.ru/kostroma?m=40.934715%2C57.766496%2F15' },
          items: [],
          locked: false,
          draggable: true,
          dndIdx: 5
        }
      ],
      action: 'ACTIVE',
      id: 'a32ca0d3-f98b-4add-b53e-e24596e995f7',
      data: {
        label: { ru: 'Test' },
        config: { url: 'https://2gis.ru/kostroma?m=40.934715%2C57.766496%2F15' },
        icon: { value: 'icon-empty', type: 'icon' },
        type: 'ARBITRARY'
      }
    },
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: 'c8887c44-267e-45b0-bfa0-57008f1bac4f',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: 'e8f5e8f2-f602-4f36-8ed9-ac68d57ac652',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'c1ecb24b-e4af-46c6-8b05-71c4b60997ea',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '60e5be44-50d2-43be-b67e-8ea7d9bdca12',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'a32ca0d3-f98b-4add-b53e-e24596e995f7',
          label: { ru: 'rere' },
          type: 'ARBITRARY',
          hidden: true,
          icon: { value: 'icon-empty', type: 'icon' },
          config: { url: 'https://2gis.ru/kostroma?m=40.934715%2C57.766496%2F15' },
          items: [],
          locked: true,
          draggable: true,
          dndIdx: 5
        }
      ]
    }
  ],
  ACTIVE_ON: [
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: 'c8887c44-267e-45b0-bfa0-57008f1bac4f',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: 'e8f5e8f2-f602-4f36-8ed9-ac68d57ac652',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'c1ecb24b-e4af-46c6-8b05-71c4b60997ea',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '60e5be44-50d2-43be-b67e-8ea7d9bdca12',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'a32ca0d3-f98b-4add-b53e-e24596e995f7',
          label: { ru: 'rere' },
          type: 'ARBITRARY',
          hidden: true,
          icon: { value: 'icon-empty', type: 'icon' },
          config: { url: 'https://2gis.ru/kostroma?m=40.934715%2C57.766496%2F15' },
          items: [],
          locked: true,
          draggable: true,
          dndIdx: 5,
          action: 'ACTIVE'
        }
      ],
      action: 'ACTIVE',
      id: 'a32ca0d3-f98b-4add-b53e-e24596e995f7',
      data: {
        label: { ru: 'Test' },
        config: { url: 'https://2gis.ru/kostroma?m=40.934715%2C57.766496%2F15' },
        icon: { value: 'icon-empty', type: 'icon' },
        type: 'ARBITRARY'
      }
    },
    {
      items: [
        {
          id: 'HEADER_TASKS',
          label: { en: 'menu.header.tasks' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'JOURNALS',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { listId: 'global-tasks', displayCount: 'true', countForJournals: 'active-tasks,subordinate-tasks' },
              items: [
                {
                  id: 'c8887c44-267e-45b0-bfa0-57008f1bac4f',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNAL_FILTERS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 300
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 200
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 100
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 0
        },
        {
          id: 'HEADER_SITES',
          label: { en: 'menu.header.sites' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'USER_SITES',
              type: 'resolver',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [
                {
                  id: 'e8f5e8f2-f602-4f36-8ed9-ac68d57ac652',
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'SITE_JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'c1ecb24b-e4af-46c6-8b05-71c4b60997ea',
                          type: 'item',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: {},
                          items: [
                            {
                              id: 'JOURNAL_FILTERS',
                              type: 'resolver',
                              hidden: false,
                              icon: { value: 'icon-empty' },
                              config: {},
                              items: [],
                              locked: false,
                              draggable: true,
                              dndIdx: 5100000
                            }
                          ],
                          locked: false,
                          draggable: true,
                          dndIdx: 410000
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 31000
                    },
                    {
                      id: 'SITE_DOCUMENT_LIBRARY',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31001
                    },
                    {
                      id: 'SITE_CALENDAR',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 31002
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2100
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 110
            },
            {
              id: 'HEADER_SITES_SEARCH',
              label: { en: 'menu.item.find-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 111
            },
            {
              id: 'HEADER_SITES_CREATE',
              label: { en: 'menu.item.create-site' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 112
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 1
        },
        {
          id: 'HEADER_ORGSTRUCT',
          label: { en: 'menu.header.orgstructure' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_ORGSTRUCT_WIDGET',
              label: { en: 'menu.header.orgstructure' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 120
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 2
        },
        {
          id: 'HEADER_MORE_MY_GROUP',
          label: { en: 'menu.header.my' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_MY_WORKFLOWS',
              label: { en: 'menu.item.my-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 130
            },
            {
              id: 'HEADER_COMPLETED_WORKFLOWS',
              label: { en: 'menu.item.completed-workflows' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 131
            },
            {
              id: 'HEADER_MY_CONTENT',
              label: { en: 'menu.item.my-content' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 132
            },
            {
              id: 'HEADER_MY_SITES',
              label: { en: 'menu.item.my-sites' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 133
            },
            {
              id: 'HEADER_MY_FILES',
              label: { en: 'menu.item.my-files' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 134
            },
            {
              id: 'HEADER_DATA_LISTS',
              label: { en: 'menu.item.data-lists' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: { hideEmpty: 'true' },
              items: [
                {
                  id: 'HEADER_COMMON_DATA_LISTS',
                  label: { en: 'menu.item.common-data-lists' },
                  type: 'item',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: 'JOURNALS',
                      type: 'resolver',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: { listId: 'global-main' },
                      items: [],
                      locked: false,
                      draggable: true,
                      dndIdx: 33500
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2350
                },
                {
                  id: 'USER_SITES_REFERENCES',
                  type: 'resolver',
                  hidden: false,
                  icon: { value: 'icon-empty' },
                  config: {},
                  items: [
                    {
                      id: '60e5be44-50d2-43be-b67e-8ea7d9bdca12',
                      type: 'item',
                      hidden: false,
                      icon: { value: 'icon-empty' },
                      config: {},
                      items: [
                        {
                          id: 'SITE_JOURNALS',
                          type: 'resolver',
                          hidden: false,
                          icon: { value: 'icon-empty' },
                          config: { listId: 'references' },
                          items: [],
                          locked: false,
                          draggable: true,
                          dndIdx: 435100
                        }
                      ],
                      locked: false,
                      draggable: true,
                      dndIdx: 33510
                    }
                  ],
                  locked: false,
                  draggable: true,
                  dndIdx: 2351
                }
              ],
              locked: false,
              draggable: true,
              dndIdx: 135
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 3
        },
        {
          id: 'HEADER_MORE_TOOLS_GROUP',
          label: { en: 'menu.header.admin-tools' },
          type: 'item',
          hidden: false,
          icon: { value: 'icon-empty' },
          config: {},
          items: [
            {
              id: 'HEADER_REPOSITORY',
              label: { en: 'menu.item.repository' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 140
            },
            {
              id: 'HEADER_APPLICATION',
              label: { en: 'menu.item.application' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 141
            },
            {
              id: 'HEADER_FLOWABLE_MODELER',
              label: { en: 'menu.item.bpmn-modeler' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 142
            },
            {
              id: 'HEADER_GROUPS',
              label: { en: 'menu.item.groups' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 143
            },
            {
              id: 'HEADER_USERS',
              label: { en: 'menu.item.users' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 144
            },
            {
              id: 'HEADER_TYPES',
              label: { en: 'menu.item.types' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 145
            },
            {
              id: 'HEADER_SYSTEM_JOURNALS',
              label: { en: 'menu.item.system-journals' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 146
            },
            {
              id: 'HEADER_META_JOURNALS',
              label: { en: 'menu.item.journal-setup' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 147
            },
            {
              id: 'HEADER_TEMPLATES',
              label: { en: 'menu.item.templates' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 148
            },
            {
              id: 'HEADER_DEV_TOOLS',
              label: { en: 'menu.item.dev-tools' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 149
            },
            {
              id: 'HEADER_MORE',
              label: { en: 'menu.item.more' },
              type: 'item',
              hidden: false,
              icon: { value: 'icon-empty' },
              config: {},
              items: [],
              locked: false,
              draggable: true,
              dndIdx: 1410
            }
          ],
          locked: false,
          draggable: true,
          dndIdx: 4
        },
        {
          id: 'a32ca0d3-f98b-4add-b53e-e24596e995f7',
          label: { ru: 'rere' },
          type: 'ARBITRARY',
          hidden: false,
          icon: { value: 'icon-empty', type: 'icon' },
          config: { url: 'https://2gis.ru/kostroma?m=40.934715%2C57.766496%2F15' },
          items: [],
          locked: false,
          draggable: true,
          dndIdx: 5,
          action: 'ACTIVE'
        }
      ]
    }
  ]
};

export const CREATE_OPTIONS = [
  { key: 'SECTION', label: 'menu-item.type.section', when: { maxLevel: 0 } },
  { key: 'HEADER-DIVIDER', label: 'menu-item.type.header-divider', when: { maxLevel: 0, minLevel: 0 } },
  { key: 'JOURNAL', label: 'menu-item.type.journal', when: { minLevel: 0 } },
  { key: 'ARBITRARY', label: 'menu-item.type.arbitrary', when: { minLevel: 0 } },
  { key: 'LINK-CREATE-CASE', label: 'menu-item.type.link-create-case', when: { minLevel: 0 } }
];

function _getAvailableOptions(items) {
  return (items || cloneDeep(CREATE_OPTIONS)).map(item => ({ ...item, id: item.label }));
}

export const AVAILABLE_CREATE_OPTIONS = [
  [undefined, undefined, _getAvailableOptions()],
  [undefined, { level: -1 }, _getAvailableOptions([CREATE_OPTIONS[0]])],
  [{ type: 'SECTION' }, { level: -1 }, _getAvailableOptions([CREATE_OPTIONS[0]])],
  [undefined, { level: 0 }, _getAvailableOptions()],
  [{ type: 'item' }, { level: 0 }, []],
  [{ type: 'SECTION' }, { level: 0 }, _getAvailableOptions()],
  [undefined, { level: 2 }, _getAvailableOptions([CREATE_OPTIONS[2], CREATE_OPTIONS[3], CREATE_OPTIONS[4]])],
  [{ type: 'SECTION' }, { level: 1 }, _getAvailableOptions([CREATE_OPTIONS[2], CREATE_OPTIONS[3], CREATE_OPTIONS[4]])],
  [{ type: 'ARBITRARY' }, { level: 3 }, []],
  [{ type: 'JOURNAL' }, { level: 2 }, []]
];
