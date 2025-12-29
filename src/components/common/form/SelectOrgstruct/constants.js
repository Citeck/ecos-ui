export const TabTypes = {
  LEVELS: 'TAB_BY_LEVELS',
  USERS: 'TAB_ALL_USERS',
  SELECTED: 'TAB_ONLY_SELECTED',
  ROLE: 'TAB_BY_ROLE'
};

export const ROOT_GROUP_NAME = '_orgstruct_home_';
export const ALFRESCO_ADMINISTRATORS_GROUP = 'ALFRESCO_ADMINISTRATORS';

export const ALL_USERS_GROUP_SHORT_NAME = 'all';

export const AUTHORITY_TYPE_GROUP = 'GROUP';
export const AUTHORITY_TYPE_USER = 'USER';
export const AUTHORITY_TYPE_ROLE = 'ROLE';

export const GroupTypes = {
  ROLE: 'ROLE',
  BRANCH: 'BRANCH',
  GROUP: 'GROUP'
};

export const ViewModes = {
  DEFAULT: 'default',
  LINE_SEPARATED: 'line-separated',
  TAGS: 'tags'
};

export const DataTypes = {
  NODE_REF: 'nodeRef',
  AUTHORITY: 'authority'
};

export const ITEMS_PER_PAGE = 10;
export const PAGINATION_SIZES = [
  { value: 10, label: 10 },
  { value: 20, label: 20 },
  { value: 30, label: 30 },
  { value: 40, label: 40 },
  { value: 50, label: 50 }
];

export const Modes = {
  DEFAULT: 0,
  SELECT_GROUPS: 1,
  SELECT_USERS: 2
};
