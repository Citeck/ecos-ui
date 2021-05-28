export const GROUP_EVERYONE = 'GROUP_EVERYONE';

export const MenuTypes = {
  LEFT: 'LEFT',
  TOP: 'TOP',
  HIDDEN: 'HIDDEN'
};

export const ConfigTypes = {
  LEFT: 'left',
  CREATE: 'create'
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

export const CreateMenuTypes = {
  Custom: {
    LINK: 'link'
  }
};

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
    EDIT_RECORD: 'EDIT_RECORD'
  }
};

export const BASE_LEFT_MENU_ID = 'ecos-left-menu-id';

export const MENU_VERSION = 1;
