import {
  AUTHORITY_TYPE_GROUP,
  AUTHORITY_TYPE_USER,
  GroupTypes,
  ROOT_GROUP_NAME,
  TabTypes
} from '../../../../../components/common/form/SelectOrgstruct/constants';

export default [
  {
    type: 'textfield',
    input: true,
    key: 'modalTitle',
    label: 'Modal title (optional)',
    weight: 13
  },
  {
    type: 'checkbox',
    input: true,
    key: 'hideTabSwitcher',
    label: 'Hide Tab Switcher in Modal',
    weight: 13,
    defaultValue: false
  },
  {
    type: 'select',
    input: true,
    label: 'Default Tab',
    key: 'defaultTab',
    weight: 14,
    data: {
      values: [
        {
          value: TabTypes.USERS,
          label: 'All users'
        },
        {
          value: TabTypes.LEVELS,
          label: 'By levels'
        }
      ]
    },
    defaultValue: TabTypes.LEVELS
  },
  {
    type: 'textfield',
    input: true,
    key: 'allowedAuthorityType',
    label: 'Allowed authority type',
    description: `Available types: ${AUTHORITY_TYPE_USER}, ${AUTHORITY_TYPE_GROUP}`,
    defaultValue: `${AUTHORITY_TYPE_USER}, ${AUTHORITY_TYPE_GROUP}`,
    validate: {
      required: false
    },
    weight: 18
  },
  {
    type: 'textfield',
    input: true,
    key: 'allowedGroupType',
    label: 'Allowed group type',
    description: `Available types: ${Object.values(GroupTypes).join(', ')}`,
    defaultValue: `${GroupTypes.ROLE}, ${GroupTypes.BRANCH}`,
    weight: 19,
    tooltip: 'only if Allowed authority type has ' + AUTHORITY_TYPE_GROUP,
    customConditional: `
      const allowedTypes = data.allowedAuthorityType.split(',').map(item => item.trim());
      show = allowedTypes.indexOf('${AUTHORITY_TYPE_GROUP}') !== -1;
    `
  },
  {
    type: 'textfield',
    input: true,
    key: 'rootGroupName',
    label: 'Root group name',
    description: "If it's empty, default: " + ROOT_GROUP_NAME,
    defaultValue: `${ROOT_GROUP_NAME}`,
    validate: {
      required: false
    },
    weight: 20,
    tooltip: 'only if Allowed authority type has ' + AUTHORITY_TYPE_GROUP,
    customConditional: `
      const allowedTypes = data.allowedAuthorityType.split(',').map(item => item.trim());
      show = allowedTypes.indexOf('${AUTHORITY_TYPE_GROUP}') !== -1;
    `
  },
  {
    type: 'textfield',
    input: true,
    key: 'allowedGroupSubType',
    label: 'Allowed group subtype',
    description: 'Example: company, subdivision, manager, employee, director, department',
    defaultValue: '',
    validate: {
      required: false
    },
    weight: 20,
    tooltip: 'only if Allowed authority type has ' + AUTHORITY_TYPE_GROUP,
    customConditional: `
      const allowedTypes = data.allowedAuthorityType.split(',').map(item => item.trim());
      show = allowedTypes.indexOf('${AUTHORITY_TYPE_GROUP}') !== -1;
    `
  },
  {
    type: 'textfield',
    input: true,
    key: 'excludeAuthoritiesByName',
    label: 'Exclude authorities by name',
    description: 'Example: groupName1, groupName2',
    defaultValue: '',
    validate: {
      required: false
    },
    weight: 22
  },
  {
    type: 'textfield',
    input: true,
    key: 'excludeAuthoritiesByType',
    label: 'Exclude authorities by group type or subtype',
    description: 'Example: groupType1, groupType2, groupSubType',
    defaultValue: '',
    validate: {
      required: false
    },
    weight: 23
  },
  {
    type: 'textfield',
    input: true,
    key: 'userSearchExtraFields',
    label: 'User search: extra fields',
    description: 'Example: field1, field2, field3',
    defaultValue: '',
    validate: {
      required: false
    },
    weight: 24,
    tooltip: 'only if Allowed authority type has ' + AUTHORITY_TYPE_USER,
    customConditional: `
      const allowedTypes = data.allowedAuthorityType.split(',').map(item => item.trim());
      show = allowedTypes.indexOf('${AUTHORITY_TYPE_USER}') !== -1;
    `
  },
  {
    label: 'Include Admin group',
    labelPosition: 'left-left',
    tableView: true,
    alwaysEnabled: false,
    type: 'checkbox',
    input: true,
    key: 'isIncludedAdminGroup',
    defaultValue: false,
    weight: 25
  },
  {
    label: 'Current user by default',
    labelPosition: 'left-left',
    tooltip: 'Set current user by default when form is in create mode',
    shortcut: '',
    tableView: true,
    alwaysEnabled: false,
    type: 'checkbox',
    input: true,
    key: 'currentUserByDefault',
    defaultValue: false,
    weight: 26
  }
];
