import {
  TAB_ALL_USERS,
  TAB_BY_LEVELS,
  AUTHORITY_TYPE_USER,
  AUTHORITY_TYPE_GROUP,
  GROUP_TYPE_ROLE,
  GROUP_TYPE_BRANCH
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
          value: TAB_ALL_USERS,
          label: 'All users'
        },
        {
          value: TAB_BY_LEVELS,
          label: 'By levels'
        }
      ]
    },
    defaultValue: TAB_BY_LEVELS
  },
  {
    type: 'textfield',
    input: true,
    key: 'allowedAuthorityType',
    label: 'Allowed authority type',
    placeholder: `Example: "${AUTHORITY_TYPE_USER}, ${AUTHORITY_TYPE_GROUP}"`,
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
    placeholder: `Example: "${GROUP_TYPE_ROLE}, ${GROUP_TYPE_BRANCH}"`,
    defaultValue: `${GROUP_TYPE_ROLE}, ${GROUP_TYPE_BRANCH}`,
    validate: {
      required: false
    },
    weight: 19,
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
    placeholder: 'Example: company, subdivision, manager, employee, director, department',
    defaultValue: '',
    validate: {
      required: false
    },
    weight: 20,
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
    placeholder: 'Example: groupName1, groupName2',
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
    placeholder: 'Example: groupType1, groupType2, groupSubType',
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
    placeholder: 'Example: field1, field2, field3',
    defaultValue: '',
    validate: {
      required: false
    },
    weight: 24,
    customConditional: `
      const allowedTypes = data.allowedAuthorityType.split(',').map(item => item.trim());
      show = allowedTypes.indexOf('${AUTHORITY_TYPE_USER}') !== -1;
    `
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
    weight: 25
  }
];
