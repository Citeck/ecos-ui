export const ORGSTRUCTURE_CONFIG = {
  id: 'orgstructure-dashboard',
  typeRef: 'emodel/type@person',
  appliedToRef: '',
  authority: null,
  priority: 0,
  config: {
    layouts: [
      {
        id: 'layout_bb6e6685-f802-4680-8606-007a42a8c1bd',
        tab: {
          label: 'Информация',
          idLayout: 'layout_bb6e6685-f802-4680-8606-007a42a8c1bd'
        },
        type: 'adaptive',
        columns: [
          {
            widgets: [
              {
                dndId: '127b05b7-8c32-4dcd-a55c-6dfbf87591b4',
                name: 'user-profile',
                label: 'dashboard-settings.widget.user-basic-info',
                id: '221ba692-9219-484d-849e-9462f7c93ec4',
                props: {
                  id: '221ba692-9219-484d-849e-9462f7c93ec4',
                  config: {}
                },
                description: 'Информация'
              },
              {
                name: 'properties',
                label: 'dashboard-settings.widget.properties',
                dndId: '4e44ef4b-b03a-486b-9a22-b6b9d3fbe374',
                id: '50d79720-f007-43f7-a91f-f7094f928b07',
                props: {
                  id: '50d79720-f007-43f7-a91f-f7094f928b07',
                  config: {
                    formId: 'uiserv/form@person_general',
                    titleAsFormName: true
                  }
                },
                description: 'Информация'
              },
              {
                dndId: '30c96b89-587b-4a44-afbc-fd5a3f8b1632',
                name: 'properties',
                label: 'dashboard-settings.widget.properties',
                id: '54b3425a-3798-4c26-a770-275d93039cf3',
                props: {
                  id: '54b3425a-3798-4c26-a770-275d93039cf3',
                  config: {
                    formId: 'uiserv/form@person_contacts',
                    titleAsFormName: true
                  }
                },
                description: 'Информация'
              },
              {
                name: 'properties',
                label: 'dashboard-settings.widget.properties',
                dndId: 'd3b6aaf0-61c5-48dd-b06f-0b3b1386f09d',
                id: 'ca2bb8ff-3e0b-414f-9e85-428df7d1458d',
                props: {
                  id: 'ca2bb8ff-3e0b-414f-9e85-428df7d1458d',
                  config: {
                    formId: 'uiserv/form@person_other',
                    titleAsFormName: true
                  }
                },
                description: 'Информация'
              },
              {
                name: 'properties',
                label: 'dashboard-settings.widget.properties',
                dndId: '72f7a248-1762-421b-975a-65be00f4d02b',
                id: 'f3796002-5214-47b8-9014-ce87cffe74c5',
                props: {
                  id: 'f3796002-5214-47b8-9014-ce87cffe74c5',
                  config: {
                    formId: 'uiserv/form@cm_person_user_groups',
                    titleAsFormName: true
                  }
                },
                description: 'Информация'
              },
              {
                name: 'documents',
                label: 'dashboard-settings.widget.documents',
                dndId: '60dc0b6d-53ee-43b3-bea6-f6c2a1265da9',
                id: '128e12a3-aa42-401c-b33b-b4850bc05821',
                props: {
                  id: '128e12a3-aa42-401c-b33b-b4850bc05821',
                  config: {
                    types: [],
                    isLoadChecklist: true
                  }
                },
                description: 'Информация'
              }
            ]
          }
        ]
      },
      {
        id: 'layout_2e5973c9-de99-48ca-8bda-b33590106022',
        tab: {
          label: 'Документы',
          idLayout: 'layout_2e5973c9-de99-48ca-8bda-b33590106022'
        },
        type: 'adaptive',
        columns: [
          {
            widgets: [
              {
                name: 'documents',
                label: 'dashboard-settings.widget.documents',
                dndId: '7f75ec6e-114b-49d3-83f8-3f8a0ea07e83',
                id: 'e8ac84e1-c36b-46a1-87c8-c04a70d98dd5',
                props: {
                  id: 'e8ac84e1-c36b-46a1-87c8-c04a70d98dd5',
                  config: {}
                },
                description: 'Документы'
              }
            ]
          }
        ]
      }
    ],
    mobile: [
      {
        id: 'layout_bb6e6685-f802-4680-8606-007a42a8c1bd',
        tab: {
          label: 'Информация',
          idLayout: 'layout_bb6e6685-f802-4680-8606-007a42a8c1bd'
        },
        type: 'mobile',
        columns: [
          {
            widgets: [
              {
                dndId: '127b05b7-8c32-4dcd-a55c-6dfbf87591b4',
                name: 'user-profile',
                label: 'dashboard-settings.widget.user-basic-info',
                id: '221ba692-9219-484d-849e-9462f7c93ec4',
                props: {
                  id: '221ba692-9219-484d-849e-9462f7c93ec4',
                  config: {}
                },
                description: 'Информация'
              },
              {
                name: 'properties',
                label: 'dashboard-settings.widget.properties',
                dndId: '4e44ef4b-b03a-486b-9a22-b6b9d3fbe374',
                id: '50d79720-f007-43f7-a91f-f7094f928b07',
                props: {
                  id: '50d79720-f007-43f7-a91f-f7094f928b07',
                  config: {
                    formId: 'uiserv/form@person_general',
                    titleAsFormName: true
                  }
                },
                description: 'Информация'
              },
              {
                dndId: '30c96b89-587b-4a44-afbc-fd5a3f8b1632',
                name: 'properties',
                label: 'dashboard-settings.widget.properties',
                id: '54b3425a-3798-4c26-a770-275d93039cf3',
                props: {
                  id: '54b3425a-3798-4c26-a770-275d93039cf3',
                  config: {
                    formId: 'uiserv/form@person_contacts',
                    titleAsFormName: true
                  }
                },
                description: 'Информация'
              },
              {
                name: 'properties',
                label: 'dashboard-settings.widget.properties',
                dndId: 'd3b6aaf0-61c5-48dd-b06f-0b3b1386f09d',
                id: 'ca2bb8ff-3e0b-414f-9e85-428df7d1458d',
                props: {
                  id: 'ca2bb8ff-3e0b-414f-9e85-428df7d1458d',
                  config: {
                    formId: 'uiserv/form@person_other',
                    titleAsFormName: true
                  }
                },
                description: 'Информация'
              },
              {
                name: 'properties',
                label: 'dashboard-settings.widget.properties',
                dndId: '72f7a248-1762-421b-975a-65be00f4d02b',
                id: 'f3796002-5214-47b8-9014-ce87cffe74c5',
                props: {
                  id: 'f3796002-5214-47b8-9014-ce87cffe74c5',
                  config: {
                    formId: 'uiserv/form@cm_person_user_groups',
                    titleAsFormName: true
                  }
                },
                description: 'Информация'
              },
              {
                name: 'documents',
                label: 'dashboard-settings.widget.documents',
                dndId: '60dc0b6d-53ee-43b3-bea6-f6c2a1265da9',
                id: '128e12a3-aa42-401c-b33b-b4850bc05821',
                props: {
                  id: '128e12a3-aa42-401c-b33b-b4850bc05821',
                  config: {}
                },
                description: 'Информация'
              }
            ]
          }
        ]
      },
      {
        id: 'layout_2e5973c9-de99-48ca-8bda-b33590106022',
        tab: {
          label: 'Документы',
          idLayout: 'layout_2e5973c9-de99-48ca-8bda-b33590106022'
        },
        type: 'mobile',
        columns: [
          {
            widgets: [
              {
                name: 'documents',
                label: 'dashboard-settings.widget.documents',
                dndId: '7f75ec6e-114b-49d3-83f8-3f8a0ea07e83',
                id: 'e8ac84e1-c36b-46a1-87c8-c04a70d98dd5',
                props: {
                  id: 'e8ac84e1-c36b-46a1-87c8-c04a70d98dd5',
                  config: {}
                },
                description: 'Документы'
              }
            ]
          }
        ]
      }
    ],
    version: 'v2',
    v2: {
      widgets: [
        {
          dndId: '127b05b7-8c32-4dcd-a55c-6dfbf87591b4',
          name: 'user-profile',
          label: 'dashboard-settings.widget.user-basic-info',
          id: '221ba692-9219-484d-849e-9462f7c93ec4',
          props: {
            id: '221ba692-9219-484d-849e-9462f7c93ec4',
            config: {
              widgetDisplayCondition: null,
              elementsDisplayCondition: {}
            }
          },
          description: 'Информация'
        },
        {
          name: 'properties',
          label: 'dashboard-settings.widget.properties',
          dndId: '4e44ef4b-b03a-486b-9a22-b6b9d3fbe374',
          id: '50d79720-f007-43f7-a91f-f7094f928b07',
          props: {
            id: '50d79720-f007-43f7-a91f-f7094f928b07',
            config: {
              widgetDisplayCondition: null,
              elementsDisplayCondition: {},
              formId: 'uiserv/form@person_general',
              titleAsFormName: true
            }
          },
          description: 'Информация'
        },
        {
          dndId: '30c96b89-587b-4a44-afbc-fd5a3f8b1632',
          name: 'properties',
          label: 'dashboard-settings.widget.properties',
          id: '54b3425a-3798-4c26-a770-275d93039cf3',
          props: {
            id: '54b3425a-3798-4c26-a770-275d93039cf3',
            config: {
              widgetDisplayCondition: null,
              elementsDisplayCondition: {},
              formId: 'uiserv/form@person_contacts',
              titleAsFormName: true
            }
          },
          description: 'Информация'
        },
        {
          name: 'properties',
          label: 'dashboard-settings.widget.properties',
          dndId: 'd3b6aaf0-61c5-48dd-b06f-0b3b1386f09d',
          id: 'ca2bb8ff-3e0b-414f-9e85-428df7d1458d',
          props: {
            id: 'ca2bb8ff-3e0b-414f-9e85-428df7d1458d',
            config: {
              widgetDisplayCondition: null,
              elementsDisplayCondition: {},
              formId: 'uiserv/form@person_other',
              titleAsFormName: true
            }
          },
          description: 'Информация'
        },
        {
          name: 'properties',
          label: 'dashboard-settings.widget.properties',
          dndId: '72f7a248-1762-421b-975a-65be00f4d02b',
          id: 'f3796002-5214-47b8-9014-ce87cffe74c5',
          props: {
            id: 'f3796002-5214-47b8-9014-ce87cffe74c5',
            config: {
              widgetDisplayCondition: null,
              elementsDisplayCondition: {},
              formId: 'uiserv/form@cm_person_user_groups',
              titleAsFormName: true
            }
          },
          description: 'Информация'
        },
        {
          name: 'documents',
          label: 'dashboard-settings.widget.documents',
          dndId: '60dc0b6d-53ee-43b3-bea6-f6c2a1265da9',
          id: '128e12a3-aa42-401c-b33b-b4850bc05821',
          props: {
            id: '128e12a3-aa42-401c-b33b-b4850bc05821',
            config: {
              widgetDisplayCondition: null,
              elementsDisplayCondition: {},
              types: [],
              isLoadChecklist: true
            }
          },
          description: 'Информация'
        },
        {
          name: 'documents',
          label: 'dashboard-settings.widget.documents',
          dndId: '7f75ec6e-114b-49d3-83f8-3f8a0ea07e83',
          id: 'e8ac84e1-c36b-46a1-87c8-c04a70d98dd5',
          props: {
            id: 'e8ac84e1-c36b-46a1-87c8-c04a70d98dd5',
            config: {
              widgetDisplayCondition: null,
              elementsDisplayCondition: {}
            }
          },
          description: 'Документы'
        }
      ],
      desktop: [
        {
          id: 'layout_bb6e6685-f802-4680-8606-007a42a8c1bd',
          tab: {
            label: 'Информация',
            idLayout: 'layout_bb6e6685-f802-4680-8606-007a42a8c1bd'
          },
          type: 'adaptive',
          columns: [
            {
              widgets: [
                '221ba692-9219-484d-849e-9462f7c93ec4',
                '50d79720-f007-43f7-a91f-f7094f928b07',
                '54b3425a-3798-4c26-a770-275d93039cf3',
                'ca2bb8ff-3e0b-414f-9e85-428df7d1458d',
                'f3796002-5214-47b8-9014-ce87cffe74c5',
                '128e12a3-aa42-401c-b33b-b4850bc05821'
              ]
            }
          ]
        },
        {
          id: 'layout_2e5973c9-de99-48ca-8bda-b33590106022',
          tab: {
            label: 'Документы',
            idLayout: 'layout_2e5973c9-de99-48ca-8bda-b33590106022'
          },
          type: 'adaptive',
          columns: [
            {
              widgets: ['e8ac84e1-c36b-46a1-87c8-c04a70d98dd5']
            }
          ]
        }
      ],
      mobile: [
        {
          id: 'layout_bb6e6685-f802-4680-8606-007a42a8c1bd',
          tab: {
            label: 'Информация',
            idLayout: 'layout_bb6e6685-f802-4680-8606-007a42a8c1bd'
          },
          type: 'mobile',
          columns: [
            {
              widgets: [
                '221ba692-9219-484d-849e-9462f7c93ec4',
                '50d79720-f007-43f7-a91f-f7094f928b07',
                '54b3425a-3798-4c26-a770-275d93039cf3',
                'ca2bb8ff-3e0b-414f-9e85-428df7d1458d',
                'f3796002-5214-47b8-9014-ce87cffe74c5',
                '128e12a3-aa42-401c-b33b-b4850bc05821'
              ]
            }
          ]
        },
        {
          id: 'layout_2e5973c9-de99-48ca-8bda-b33590106022',
          tab: {
            label: 'Документы',
            idLayout: 'layout_2e5973c9-de99-48ca-8bda-b33590106022'
          },
          type: 'mobile',
          columns: [
            {
              widgets: ['e8ac84e1-c36b-46a1-87c8-c04a70d98dd5']
            }
          ]
        }
      ]
    }
  },
  attributes: {}
};

export const ATTRIBUTES = [
  { id: 'authorityGroups', name: 'Группы', type: 'ASSOC' },

  { id: 'firstName', name: 'Имя', type: 'TEXT' },

  { id: 'lastName', name: 'Фамилия', type: 'TEXT' },

  { id: 'middleName', name: 'Отчество', type: 'TEXT' },

  { id: 'email', name: 'EMail', type: 'TEXT' },

  { id: 'jobTitle', name: 'Должность', type: 'TEXT' },

  { id: 'birthDate', name: 'Дата рождения', type: 'DATE' },
  { id: 'birthMonthDay', name: 'Birth MonthDay', type: 'NUMBER' },
  { id: 'sex', name: 'Пол', type: 'TEXT' },
  { id: 'photo', name: 'Фото', type: 'CONTENT' },

  { id: 'city', name: 'Город', type: 'TEXT' },

  { id: 'organization', name: 'Компания', type: 'TEXT' },

  { id: 'nameInGenitiveCase', name: 'ФИО в родительном падеже', type: 'TEXT' },

  { id: 'typeOfEmployment', name: 'Employment type', type: 'TEXT' },

  { id: 'phoneInternal', name: 'Внутренний телефон', type: 'TEXT' },

  { id: 'phoneWorking', name: 'Рабочий телефон', type: 'TEXT' },

  { id: 'personDisabled', name: 'Учетная запись отключена', type: 'BOOLEAN' },

  { id: 'personDisableReason', name: 'Причина отключения учетной записи', type: 'TEXT' },

  { id: 'countryCode', name: 'Код страны', type: 'TEXT' },

  { id: 'timezone', name: 'Часовой пояс', type: 'TEXT' },

  { id: 'itn', name: 'ИНН', type: 'TEXT' },

  { id: 'inila', name: 'СНИЛС', type: 'TEXT' },

  { id: 'skype', name: 'Скайп', type: 'TEXT' },

  { id: 'mobile', name: 'Телефон мобильный', type: 'TEXT' },

  { id: 'location', name: 'Местоположение', type: 'TEXT' },

  { id: 'userStatus', name: 'Статус', type: 'TEXT' },

  { id: 'workingCalendar', name: 'Рабочий календарь', type: 'ASSOC' },

  { id: 'atWorkplace', name: 'На рабочем месте', type: 'BOOLEAN' }
];
