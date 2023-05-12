const getForm = () => ({
  display: 'form',
  components: [
    {
      type: 'checkbox',
      input: true,
      key: 'awayAuthDelegationEnabled',
      defaultValue: true,
      label: {
        ru: 'Делегировать выполнение задач',
        en: 'Delegate tasks execution'
      }
    }
  ]
});

export default getForm;
