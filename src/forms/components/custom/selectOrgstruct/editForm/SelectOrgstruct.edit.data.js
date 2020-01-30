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
    weight: 19
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
    weight: 20
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
    weight: 22
  }
];
