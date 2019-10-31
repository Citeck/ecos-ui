export default [
  {
    type: 'textfield',
    input: true,
    key: 'allowedAuthorityType',
    label: 'Allowed authority type',
    placeholder: 'Example: "USER, GROUP"',
    defaultValue: 'USER, GROUP',
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
    placeholder: 'Example: "ROLE, BRANCH"',
    defaultValue: 'ROLE, BRANCH',
    validate: {
      required: false
    },
    weight: 19,
    customConditional: `
      const allowedTypes = data.allowedAuthorityType.split(',').map(item => item.trim());
      show = allowedTypes.indexOf('GROUP') !== -1;
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
      show = allowedTypes.indexOf('GROUP') !== -1;
    `
  },
  {
    type: 'textfield',
    input: true,
    key: 'allUsersGroup',
    label: '"All users" tab group short name',
    placeholder: 'Example: all',
    defaultValue: 'all',
    validate: {
      required: false
    },
    weight: 21
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
    weight: 24
  }
];
