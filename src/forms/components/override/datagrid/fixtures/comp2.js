export default {
  label: { en: 'Children' },
  key: 'children',
  type: 'datagrid',
  input: true,
  components: [
    {
      type: 'panel',
      label: { en: 'User Information' },
      key: 'userinfo',
      components: [
        {
          label: { ru: 'Имя' },
          key: 'firstName',
          type: 'textfield',
          input: true
        },
        {
          label: { en: 'Last Name' },
          key: 'lastName',
          type: 'textfield',
          input: true
        }
      ]
    }
  ]
};
