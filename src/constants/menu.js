export const GROUP_EVERYONE = 'GROUP_EVERYONE';

export const BASE_LEFT_MENU_ID = 'ecos-left-menu-id';

export const MENU_VERSION = 1;

export const MenuTypes = {
  LEFT: 'LEFT',
  TOP: 'TOP',
  HIDDEN: 'HIDDEN'
};

export const ConfigTypes = {
  LEFT: 'left',
  CREATE: 'create',
  USER: 'user'
};

export const MenuTypesView = [
  {
    position: 0,
    type: MenuTypes.LEFT,
    description: 'menu-settings.location.type.left'
  },
  {
    position: 1,
    type: MenuTypes.TOP,
    description: 'menu-settings.location.type.top-buttons'
  }
  // {
  //   position: 2,
  //   type: MenuTypes.HIDDEN,
  //   description: 'menu-settings.location.type.hidden'
  // }
];

export const MenuSettings = {
  ActionTypes: {
    ACTIVE: 'ACTIVE',
    CREATE: 'CREATE',
    EDIT: 'EDIT',
    DELETE: 'DELETE',
    DISPLAY_COUNT: 'DISPLAY_COUNT'
  },
  ItemTypes: {
    SECTION: 'SECTION',
    JOURNAL: 'JOURNAL',
    ARBITRARY: 'ARBITRARY',
    LINK_CREATE_CASE: 'LINK-CREATE-CASE',
    HEADER_DIVIDER: 'HEADER-DIVIDER',
    CREATE_IN_SECTION: 'CREATE_IN_SECTION',
    EDIT_RECORD: 'EDIT_RECORD',
    START_WORKFLOW: 'START_WORKFLOW',
    USER_PROFILE: 'USER-PROFILE',
    USER_STATUS: 'USER-STATUS',
    USER_CHANGE_PASSWORD: 'USER-CHANGE-PASSWORD',
    USER_FEEDBACK: 'USER-FEEDBACK',
    USER_SEND_PROBLEM_REPORT: 'USER-SEND-PROBLEM-REPORT',
    USER_LOGOUT: 'USER-LOGOUT'
  }
};

export const CreateOptions = {
  SECTION: {
    key: MenuSettings.ItemTypes.SECTION,
    label: 'menu-item.type.section'
  },
  HEADER_DIVIDER: {
    key: MenuSettings.ItemTypes.HEADER_DIVIDER,
    label: 'menu-item.type.header-divider'
  },
  JOURNAL: {
    key: MenuSettings.ItemTypes.JOURNAL,
    label: 'menu-item.type.journal'
  },
  ARBITRARY: {
    key: MenuSettings.ItemTypes.ARBITRARY,
    label: 'menu-item.type.arbitrary'
  },
  LINK_CREATE_CASE: {
    key: MenuSettings.ItemTypes.LINK_CREATE_CASE,
    label: 'menu-item.type.link-create-case'
  },
  CREATE_IN_SECTION: {
    key: MenuSettings.ItemTypes.CREATE_IN_SECTION,
    label: 'menu-item.type.create-in-section'
  },
  EDIT_RECORD: {
    key: MenuSettings.ItemTypes.EDIT_RECORD,
    label: 'menu-item.type.edit-record'
  },
  START_WORKFLOW: {
    key: MenuSettings.ItemTypes.START_WORKFLOW,
    label: 'menu-item.type.start-workflow'
  }
};

export const UserOptions = {
  USER_PROFILE: {
    key: MenuSettings.ItemTypes.USER_PROFILE,
    label: 'menu-item.type.user-profile'
  },
  USER_STATUS: {
    key: MenuSettings.ItemTypes.USER_STATUS,
    label: 'menu-item.type.user-status'
  },
  USER_CHANGE_PASSWORD: {
    key: MenuSettings.ItemTypes.USER_CHANGE_PASSWORD,
    label: 'menu-item.type.user-change-password'
  },
  USER_FEEDBACK: {
    key: MenuSettings.ItemTypes.USER_FEEDBACK,
    label: 'menu-item.type.user-feedback'
  },
  USER_SEND_PROBLEM_REPORT: {
    key: MenuSettings.ItemTypes.USER_SEND_PROBLEM_REPORT,
    label: 'menu-item.type.user-send-problem-report'
  },
  USER_LOGOUT: {
    key: MenuSettings.ItemTypes.USER_LOGOUT,
    label: 'menu-item.type.user-logout'
  },
  ARBITRARY: {
    key: MenuSettings.ItemTypes.ARBITRARY,
    label: 'menu-item.type.arbitrary'
  }
};
