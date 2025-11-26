export const SortOrderOptions = {
  ASC: {
    label: 'ASC',
    value: 'asc'
  },
  DESC: {
    label: 'DESC',
    value: 'desc'
  }
};

export const TableTypes = {
  JOURNAL: 'journal',
  CUSTOM: 'custom'
};

export const DisplayModes = {
  DEFAULT: 'default',
  TABLE: 'table',
  CUSTOM: 'custom'
};

export const DataTypes = {
  ASSOC: 'assoc',
  JSON_REC: 'json-record',
  QUERY: 'query'
};

export const SearchInWorkspacePolicy = {
  ALL: 'all',
  CURRENT: 'current', // by default
  CURRENT_AND_ADDITIONAL: 'current-and-additional',
  ONLY_ADDITIONAL: 'only-aditional'
};

export const SearchWorkspacePolicyOptions = [
  {
    value: SearchInWorkspacePolicy.ALL,
    label: 'workspace-polices.all'
  },
  {
    value: SearchInWorkspacePolicy.CURRENT,
    label: 'workspace-polices.current'
  },
  {
    value: SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL,
    label: 'workspace-polices.current-and-additional'
  },
  {
    value: SearchInWorkspacePolicy.ONLY_ADDITIONAL,
    label: 'workspace-polices.only-additional'
  }
];

export const TEMPLATE_REGEX = /\$\{.*?\}/g;
