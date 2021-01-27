export default {
  tags: [],
  type: 'textfield',
  conditional: {
    eq: '',
    when: null,
    show: ''
  },
  validate: {
    customPrivate: false,
    custom: '',
    pattern: '',
    maxLength: 0,
    minLength: 0,
    required: false
  },
  persistent: true,
  unique: false,
  protected: false,
  defaultValue: '',
  multiple: false,
  suffix: '',
  prefix: '',
  placeholder: { en: '', ru: 'Введите...' },
  key: 'firstName',
  label: { en: 'Name', ru: 'Имя' },
  inputMask: '',
  inputType: 'text',
  tableView: true,
  input: true,
  description: { en: 'Description' },
  tooltip: { ru: 'Имя пользователя' }
};
