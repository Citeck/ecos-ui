export default {
  conditional: {
    eq: '',
    when: null,
    show: ''
  },
  tags: [],
  type: 'select',
  validate: {
    required: false
  },
  tabindex: '10',
  persistent: true,
  unique: false,
  protected: false,
  multiple: false,
  template: '<span>{{ item.label }}</span>',
  authenticate: false,
  filter: '',
  refreshOn: '',
  defaultValue: '',
  valueProperty: '',
  dataSrc: 'values',
  data: {
    custom: '',
    resource: '',
    url: '',
    json: '',
    values: [
      {
        label: 'Red',
        value: 'red'
      },
      {
        label: 'Blue',
        value: 'blue'
      },
      {
        label: 'Green',
        value: 'green'
      },
      {
        label: 'Yellow',
        value: 'yellow'
      },
      {
        label: 'Purple',
        value: 'purple'
      },
      {
        label: 'Orange',
        value: 'orange'
      },
      {
        label: 'Black',
        value: 'black'
      }
    ]
  },
  placeholder: 'Enter your favorite color',
  key: 'favoriteColor',
  label: 'Favorite Color',
  tableView: true,
  input: true
};
