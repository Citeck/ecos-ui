const data = Object.freeze({
  boardList: [{ id: 'id1', name: 'name1' }, { id: 'id2', name: 'name2' }],
  boardConfig: {
    id: 'boardId',
    name: { ru: 'Русское имя', en: 'English name' },
    readOnly: true,
    typeRef: 'emodel/type@some-type',
    journalRef: 'uiserv/journal@some-journal',
    cardFormRef: 'uiserv/form@some-form',
    actions: ['uiserv/action@some-action'],
    columns: [
      {
        id: 'some-id-1',
        name: { ru: 'Русское имя', en: 'English name' }
      },
      {
        id: 'some-id-2',
        name: { ru: 'Русское имя', en: 'English name' }
      }
    ]
  },
  formConfig: {
    i18n: {},
    formDefinition: {
      components: [
        {
          label: {
            ru: 'id'
          },
          key: 'id',
          refreshOn: [],
          type: 'hidden',
          input: true
        }
      ]
    }
  },
  formFields: [],
  formProps: {},
  journalConfig: { id: 'journalId', sourceId: 'sourceId', meta: { createVariants: [], actions: [] } },
  journalSetting: { journalId: 'journalId' },
  journalData: {
    records: [
      {
        id: '1',
        attributes: {}
      },
      {
        id: '2',
        attributes: {}
      }
    ],
    totalCount: 2
  },
  journalActions: { forRecord: {} }
});

data.formProps.i18n = data.formConfig.i18n;
data.formProps.formDefinition = data.formConfig.formDefinition;
data.formProps.formFields = data.formFields;

export default data;
