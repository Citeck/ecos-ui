import { MenuSettings, MenuTypes } from '../../constants/menu';
import { ActionTypes } from '../../constants/sidebar';

export const makeUserMenuConfigs = [
  [
    [
      'admin', // userName
      true, // isAvailable
      true, // isMutable
      false // isExternalAuthentication
    ],
    [
      { id: 'HEADER_USER_MENU_MY_PROFILE', label: 'header.my-profile.label', targetUrl: '/v2/dashboard?recordRef=people@admin' },
      {
        id: 'HEADER_USER_MENU_AVAILABILITY',
        label: 'header.make-notavailable.label',
        targetUrl: '/share/page/components/deputy/make-available?available=false',
        control: {
          type: 'ALF_SHOW_MODAL_MAKE_UNAVAILABLE',
          payload: { targetUrl: '/share/page/components/deputy/make-available?available=false' }
        }
      },
      {
        id: 'HEADER_USER_MENU_FEEDBACK',
        label: 'header.feedback.label',
        targetUrl: 'https://www.citeck.ru/feedback',
        targetUrlType: 'FULL_PATH',
        target: '_blank'
      },
      {
        id: 'HEADER_USER_MENU_REPORTISSUE',
        label: 'header.reportIssue.label',
        targetUrl:
          'mailto:support@citeck.ru?subject=Ошибка в работе Citeck ECOS: краткое описание&body=Summary: Короткое описание проблемы (продублировать в теме письма)%0A%0ADescription:%0AПожалуйста, детально опишите возникшую проблему, последовательность действий, которая привела к ней. При необходимости приложите скриншоты.',
        targetUrlType: 'FULL_PATH',
        target: '_blank'
      },
      { id: 'HEADER_USER_MENU_LOGOUT', label: 'header.logout.label', control: { type: 'ALF_DOLOGOUT' } }
    ]
  ],
  [
    [
      'test-user', // userName
      true, // isAvailable
      true, // isMutable
      true // isExternalAuthentication
    ],
    [
      { id: 'HEADER_USER_MENU_MY_PROFILE', label: 'header.my-profile.label', targetUrl: '/v2/dashboard?recordRef=people@test-user' },
      {
        id: 'HEADER_USER_MENU_AVAILABILITY',
        label: 'header.make-notavailable.label',
        targetUrl: '/share/page/components/deputy/make-available?available=false',
        control: {
          type: 'ALF_SHOW_MODAL_MAKE_UNAVAILABLE',
          payload: { targetUrl: '/share/page/components/deputy/make-available?available=false' }
        }
      },
      {
        id: 'HEADER_USER_MENU_FEEDBACK',
        label: 'header.feedback.label',
        targetUrl: 'https://www.citeck.ru/feedback',
        targetUrlType: 'FULL_PATH',
        target: '_blank'
      },
      {
        id: 'HEADER_USER_MENU_REPORTISSUE',
        label: 'header.reportIssue.label',
        targetUrl:
          'mailto:support@citeck.ru?subject=Ошибка в работе Citeck ECOS: краткое описание&body=Summary: Короткое описание проблемы (продублировать в теме письма)%0A%0ADescription:%0AПожалуйста, детально опишите возникшую проблему, последовательность действий, которая привела к ней. При необходимости приложите скриншоты.',
        targetUrlType: 'FULL_PATH',
        target: '_blank'
      }
    ]
  ]
];

export const oldToNewMenu = [
  [[], []],
  [
    [
      {
        config: {
          id: 'HEADER_SITE_DASHBOARD',
          label: 'Главная страница сайта',
          selected: false,
          targetUrl: 'site/cases/dashboard'
        },
        id: 'HEADER_SITE_DASHBOARD',
        name: 'alfresco/header/AlfMenuItem'
      },
      {
        name: 'alfresco/menus/AlfMenuItem',
        id: 'HEADER_LEAVE_SITE',
        config: {
          id: 'HEADER_LEAVE_SITE',
          label: 'leave_site.label',
          publishPayload: {
            userFullName: 'Admin Administratorov',
            site: 'cases',
            user: 'admin',
            siteTitle: 'Кейсы'
          },
          iconClass: 'alf-leave-icon',
          publishTopic: 'ALF_LEAVE_SITE'
        }
      }
    ],
    [
      {
        id: 'HEADER_SITE_DASHBOARD',
        label: 'Главная страница сайта',
        isLegacy: true,
        targetUrl: '/share/page/site/cases/dashboard'
      },
      {
        id: 'HEADER_LEAVE_SITE',
        label: 'leave_site.label',
        isLegacy: true,
        control: {
          type: 'ALF_LEAVE_SITE',
          payload: {
            userFullName: 'Admin Administratorov',
            site: 'cases',
            user: 'admin',
            siteTitle: 'Кейсы'
          }
        }
      }
    ]
  ]
];

export const makeSiteMenuFromConfig = [
  [{}, []],
  [
    { leftMenuEditable: true, isAdmin: true },
    [
      {
        id: 'SETTINGS_MENU',
        onClick: 'function',
        label: 'header.site-menu.menu-settings'
      },
      {
        id: 'GO_ADMIN_PAGE',
        label: 'header.site-menu.admin-page',
        targetUrl: '/v2/bpmn-designer',
        targetUrlType: 'FULL_PATH'
      }
    ]
  ],
  [
    { isDashboardPage: true },
    [
      {
        id: 'SETTINGS_DASHBOARD',
        label: 'header.site-menu.page-settings',
        targetUrl: '/v2/dashboard/settings',
        targetUrlType: 'FULL_PATH'
      }
    ]
  ],
  [
    { leftMenuEditable: true, isAdmin: true, isDashboardPage: true },
    [
      {
        id: 'SETTINGS_DASHBOARD',
        label: 'header.site-menu.page-settings',
        targetUrl: '/v2/dashboard/settings',
        targetUrlType: 'FULL_PATH'
      },
      {
        id: 'SETTINGS_MENU',
        onClick: 'function',
        label: 'header.site-menu.menu-settings'
      },
      {
        id: 'GO_ADMIN_PAGE',
        label: 'header.site-menu.admin-page',
        targetUrl: '/v2/bpmn-designer',
        targetUrlType: 'FULL_PATH'
      }
    ]
  ],
  [
    { leftMenuEditable: true },
    [
      {
        id: 'SETTINGS_MENU',
        onClick: 'function',
        label: 'header.site-menu.menu-settings'
      }
    ]
  ]
];

export const iconsByMenuId = {
  HEADER_USER_MENU_MY_PROFILE: 'icon-user-normal',
  HEADER_USER_MENU_AVAILABILITY: '',
  'HEADER_USER_MENU_AVAILABILITY (with special class)': 'icon-special-class',
  HEADER_USER_MENU_PASSWORD: '',
  HEADER_USER_MENU_FEEDBACK: 'icon-notify',
  HEADER_USER_MENU_REPORTISSUE: 'icon-alert',
  HEADER_USER_MENU_LOGOUT: 'icon-exit',
  HEADER_SITE_INVITE: '',
  HEADER_CUSTOMIZE_SITE_DASHBOARD: '',
  HEADER_EDIT_SITE_DETAILS: '',
  HEADER_CUSTOMIZE_SITE: '',
  HEADER_LEAVE_SITE: '',
  HEADER_SITE_JOURNALS: '',
  'non-existent-id': ''
};

export const specialClassByState = [
  [['HEADER_USER_MENU_AVAILABILITY'], false],
  [['HEADER_USER_MENU_AVAILABILITY', { available: true }], 'icon-user-online icon_on'],
  [['HEADER_USER_MENU_AVAILABILITY', { available: false }], 'icon-user-away icon_off'],
  [['HEADER_SITE_JOURNALS', { available: false }], false],
  [['HEADER_SITE_JOURNALS', { available: true }], false],
  [['HEADER_CUSTOMIZE_SITE_DASHBOARD'], false]
];

export const menuWidth = [300, 22, 0];

export const menuWidthBySelector = [
  ['.slide-menu-1', menuWidth[0] ? -menuWidth[0] : menuWidth[0]],
  ['.slide-menu-2', menuWidth[1] ? -menuWidth[1] : menuWidth[1]],
  ['.slide-menu-3', menuWidth[2] ? -menuWidth[2] : menuWidth[2]],
  ['.unknow-slide-menu', 0]
];

export const positionAdjustmentsByType = [
  [MenuTypes.LEFT, { top: 20, left: 50 }, { top: 20, left: -50 }],
  [MenuTypes.LEFT, { top: 0, left: 0 }, { top: 0, left: 0 }],
  [MenuTypes.TOP, { top: 40, left: 80 }, { top: 0, left: 0 }],
  [MenuTypes.TOP, { top: 0, left: 0 }, { top: 0, left: 0 }]
];

export const itemsForPropsUrl = {
  JOURNAL: { type: MenuSettings.ItemTypes.JOURNAL, params: { journalId: 'journalId', journalsListId: 'journalsListId' } },
  JOURNAL_NONE: { type: MenuSettings.ItemTypes.JOURNAL, params: {} },
  ARBITRARY_SELF: { type: MenuSettings.ItemTypes.ARBITRARY, config: { url: '/dashboard' } },
  ARBITRARY_BLANK: { type: MenuSettings.ItemTypes.ARBITRARY, config: { url: 'https://ya.ru' } },
  ARBITRARY_NONE: { type: MenuSettings.ItemTypes.ARBITRARY, config: {} },
  LINK_CREATE_CASE: { type: MenuSettings.ItemTypes.LINK_CREATE_CASE, config: { url: '_' } },
  SECTION: { type: MenuSettings.ItemTypes.SECTION, config: { url: '_' } },
  HEADER_DIVIDER: { type: MenuSettings.ItemTypes.LINK_CREATE_CASE, config: { url: '_' } },
  BPMN_DESIGNER: { action: { params: { pageId: 'bpmn-designer' } } },
  PAGE_LINK: { action: { type: ActionTypes.PAGE_LINK, params: { pageId: 'page-link' } } }
};
