const data = Object.freeze({
  boardList: [{ id: 'id1', name: 'name1' }, { id: 'id2', name: 'name2' }],
  templateList: [{ id: 'id1', name: 'name1' }, { id: 'id2', name: 'name2' }],
  boardConfig: {
    id: 'boardId',
    name: { ru: 'Русское имя', en: 'English name' },
    readOnly: true,
    typeRef: 'emodel/type@some-type',
    templateId: 'templateId',
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

export const dataCardsWithRecords = [
  { status: 'some-id-1', records: [{ id: 'rec-1', cardId: 'rec-1' }, { id: 'rec-2', cardId: 'rec-2' }], totalCount: 2 },
  { status: 'some-id-2', records: [{ id: 'rec-3', cardId: 'rec-3' }], totalCount: 1 }
];

export const swimlaneData = {
  swimlanes: [
    {
      id: 'priority-high',
      label: 'High',
      color: '#ff0000',
      isCollapsed: false,
      cells: {
        'some-id-1': { records: [{ id: 'rec-1', cardId: 'rec-1' }, { id: 'rec-2', cardId: 'rec-2' }], totalCount: 2, pagination: { page: 0, maxItems: 10, skipCount: 0 }, isLoading: false },
        'some-id-2': { records: [{ id: 'rec-3', cardId: 'rec-3' }], totalCount: 1, pagination: { page: 0, maxItems: 10, skipCount: 0 }, isLoading: false }
      }
    },
    {
      id: 'priority-low',
      label: 'Low',
      color: null,
      isCollapsed: false,
      cells: {
        'some-id-1': { records: [{ id: 'rec-4', cardId: 'rec-4' }], totalCount: 1, pagination: { page: 0, maxItems: 10, skipCount: 0 }, isLoading: false },
        'some-id-2': { records: [], totalCount: 0, pagination: { page: 0, maxItems: 10, skipCount: 0 }, isLoading: false }
      }
    }
  ],
  swimlaneGrouping: { attribute: 'priority', label: 'Priority' }
};

export default data;
