import { MenuSettings } from '../../constants/menu';

export const raw = {
  0: [
    {
      id: '23179247-47a5-4e93-8a92-7e99dd78b4c1',
      label: {
        ru: 'Тест'
      },
      icon: '',
      hidden: false,
      type: MenuSettings.ItemTypes.SECTION,
      config: {},
      action: {
        type: '',
        config: {}
      },
      items: [
        {
          id: '6ec092bc-4387-415e-b40a-5ad13393f53b',
          label: {
            ru: 'коммент-репо-2'
          },
          icon: 'ui/icon@icon-empty',
          hidden: false,
          type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
          config: {
            typeRef: 'emodel/type@comment-repo2',
            variantId: 'DEFAULT',
            variantTypeRef: 'emodel/type@comment-repo2',
            variant: {
              id: 'DEFAULT',
              name: {
                ru: 'коммент-репо-2'
              },
              sourceId: 'emodel/comment-repo2',
              typeRef: 'emodel/type@comment-repo2',
              formRef: 'uiserv/form@type$comment-repo2',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: {
              ru: 'коммент-репо-2',
              en: ''
            },
            journalId: 'comment-repo2',
            createVariants: [
              {
                id: 'DEFAULT',
                name: {
                  ru: 'коммент-репо-2'
                },
                sourceId: 'emodel/comment-repo2',
                typeRef: 'emodel/type@comment-repo2',
                formRef: 'uiserv/form@type$comment-repo2'
              }
            ]
          }
        },
        {
          id: '34df9271-be26-4e1c-8ef6-756de1e89992',
          label: {
            en: 'spk-type-3'
          },
          icon: 'ui/icon@icon-empty',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@type$spk-type-3'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: null,
            journalId: 'type$spk-type-3',
            createVariants: []
          }
        },
        {
          id: '131bf253-4c2b-4fea-96f3-ebb0fe584a43',
          label: {
            ru: 'Заявка на реализацию (Из конфига)',
            en: 'Request for sales (CUSTOM FROM CONFIG)'
          },
          icon: {
            url: '',
            type: 'img',
            value: 'ebd79697-48e2-4fc9-809d-9bce83421f14'
          },
          hidden: false,
          type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
          config: {
            typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
            variantId: 'DEFAULT',
            variantTypeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
            variant: {
              id: 'DEFAULT',
              name: {
                ru: 'Заявка на реализацию',
                en: 'Request for sales'
              },
              sourceId: 'alfresco/',
              typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
              formRef: 'uiserv/form@finance-request-form',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: {
              ru: 'Заявка на реализацию',
              en: ''
            },
            journalId: 'ecos-fin-request/type-ecos-fin-request-restar',
            createVariants: [
              {
                id: 'DEFAULT',
                name: {
                  ru: 'Заявка на реализацию',
                  en: 'Request for sales'
                },
                sourceId: 'alfresco/',
                typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
                formRef: 'uiserv/form@finance-request-form'
              }
            ]
          }
        }
      ],
      allowedFor: []
    }
  ],
  1: [
    {
      id: '23179247-47a5-4e93-8a92-7e99dd78b4c1',
      label: {
        ru: 'Тест'
      },
      icon: '',
      hidden: false,
      type: MenuSettings.ItemTypes.SECTION,
      config: {},
      action: {
        type: '',
        config: {}
      },
      items: [
        {
          id: '6ec092bc-4387-415e-b40a-5ad13393f53b',
          icon: 'ui/icon@icon-empty',
          hidden: false,
          type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
          config: {
            typeRef: 'emodel/type@comment-repo2',
            variantId: 'DEFAULT',
            variantTypeRef: 'emodel/type@comment-repo2',
            variant: {
              id: 'DEFAULT',
              name: {
                ru: 'коммент-репо-2'
              },
              sourceId: 'emodel/comment-repo2',
              typeRef: 'emodel/type@comment-repo2',
              formRef: 'uiserv/form@type$comment-repo2',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: {
              ru: 'коммент-репо-2',
              en: ''
            },
            journalId: 'comment-repo2',
            createVariants: [
              {
                id: 'DEFAULT',
                name: {
                  ru: 'коммент-репо-2'
                },
                sourceId: 'emodel/comment-repo2',
                typeRef: 'emodel/type@comment-repo2',
                formRef: 'uiserv/form@type$comment-repo2'
              }
            ]
          }
        },
        {
          id: '34df9271-be26-4e1c-8ef6-756de1e89992',
          icon: 'ui/icon@icon-empty',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@type$spk-type-3'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: {
              en: 'spk-type-3'
            },
            journalId: 'type$spk-type-3',
            createVariants: []
          }
        },
        {
          id: '131bf253-4c2b-4fea-96f3-ebb0fe584a43',
          icon: {
            url: '',
            type: 'img',
            value: 'ebd79697-48e2-4fc9-809d-9bce83421f14'
          },
          hidden: false,
          type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
          config: {
            typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
            variantId: 'DEFAULT',
            variantTypeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
            variant: {
              id: 'DEFAULT',
              name: {
                ru: 'Заявка на реализацию',
                en: 'Request for sales'
              },
              sourceId: 'alfresco/',
              typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
              formRef: 'uiserv/form@finance-request-form',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: {
              ru: 'Заявка на реализацию',
              en: ''
            },
            journalId: 'ecos-fin-request/type-ecos-fin-request-restar',
            createVariants: [
              {
                id: 'DEFAULT',
                name: {
                  ru: 'Заявка на реализацию (cr)',
                  en: 'Request for sales (cr)'
                },
                sourceId: 'alfresco/',
                typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
                formRef: 'uiserv/form@finance-request-form'
              }
            ]
          }
        }
      ],
      allowedFor: []
    }
  ],
  2: [
    {
      id: 'ea691bc9-07e2-4fce-808d-494e382d685b',
      label: {
        ru: 'Задачи'
      },
      icon: '',
      hidden: false,
      type: MenuSettings.ItemTypes.SECTION,
      config: {},
      action: {
        type: '',
        config: {}
      },
      items: [
        {
          id: '0fa6410f-0155-4a04-b001-c8f159f183a5',
          label: {
            en: 'Активные задачи'
          },
          icon: 'ui/icon@i-leftmenu-current-tasks',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@active-tasks',
            displayCount: true
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: 'Активные задачи',
            journalId: 'active-tasks',
            createVariants: []
          }
        },
        {
          id: '95be4f5f-fb4d-461c-991e-17975a6ba496',
          label: {
            en: 'Завершенные задачи'
          },
          icon: 'ui/icon@i-leftmenu-completed-tasks',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@completed-tasks'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: 'Завершенные задачи',
            journalId: 'completed-tasks',
            createVariants: []
          }
        },
        {
          id: 'cbda90a8-d831-4b70-b405-41f6c004e076',
          label: {
            en: 'Созданные задачи'
          },
          icon: 'ui/icon@i-leftmenu-new-tasks-1',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@initiator-tasks'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: 'Созданные задачи',
            journalId: 'initiator-tasks',
            createVariants: []
          }
        },
        {
          id: '948fe4fa-801e-4ed2-8f45-f7c8532af483',
          label: {
            en: 'На контроле'
          },
          icon: 'ui/icon@i-leftmenu-controlled',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@controlled',
            displayCount: true
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: 'На контроле',
            journalId: 'controlled',
            createVariants: []
          }
        },
        {
          id: '67efb16e-4276-49e5-854f-9d6b2b4137df',
          label: {
            en: 'Задачи подчиненных'
          },
          icon: 'ui/icon@i-leftmenu-subordinate-tasks',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@subordinate-tasks'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: 'Задачи подчиненных',
            journalId: 'subordinate-tasks',
            createVariants: []
          }
        },
        {
          id: '1c992c3e-b20b-408c-8f33-26a1ddccfcdb',
          label: {
            en: 'Задачи разбора входящих'
          },
          icon: 'ui/icon@i-leftmenu-content',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@income-package-tasks',
            displayCount: true
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          _remoteData_: {
            label: 'Задачи разбора входящих',
            journalId: 'income-package-tasks',
            createVariants: []
          }
        }
      ],
      allowedFor: []
    }
  ]
};

export const formatted = {
  0: [
    {
      id: '23179247-47a5-4e93-8a92-7e99dd78b4c1',
      label: {
        ru: 'Тест'
      },
      icon: '',
      hidden: false,
      type: MenuSettings.ItemTypes.SECTION,
      config: {},
      action: {
        type: '',
        config: {}
      },
      items: [
        {
          id: 'createVariant1',
          label: {
            ru: 'коммент-репо-2'
          },
          icon: 'ui/icon@icon-empty',
          hidden: false,
          type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
          config: {
            typeRef: 'emodel/type@comment-repo2',
            variantId: 'DEFAULT',
            variantTypeRef: 'emodel/type@comment-repo2',
            variant: {
              id: 'DEFAULT',
              name: {
                ru: 'коммент-репо-2'
              },
              sourceId: 'emodel/comment-repo2',
              typeRef: 'emodel/type@comment-repo2',
              formRef: 'uiserv/form@type$comment-repo2',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: false,
            collapsed: false,
            createVariant: {
              id: 'DEFAULT',
              name: {
                ru: 'коммент-репо-2'
              },
              sourceId: 'emodel/comment-repo2',
              typeRef: 'emodel/type@comment-repo2',
              formRef: 'uiserv/form@type$comment-repo2',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          }
        },
        {
          id: '34df9271-be26-4e1c-8ef6-756de1e89992',
          label: {
            en: 'spk-type-3'
          },
          icon: 'ui/icon@icon-empty',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@type$spk-type-3'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: true,
            collapsed: false,
            journalId: 'type$spk-type-3'
          }
        },
        {
          id: 'createVariant2',
          label: {
            ru: 'Заявка на реализацию (Из конфига)',
            en: 'Request for sales (CUSTOM FROM CONFIG)'
          },
          icon: {
            url: '',
            type: 'img',
            value: 'ebd79697-48e2-4fc9-809d-9bce83421f14'
          },
          hidden: false,
          type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
          config: {
            typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
            variantId: 'DEFAULT',
            variantTypeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
            variant: {
              id: 'DEFAULT',
              name: {
                ru: 'Заявка на реализацию',
                en: 'Request for sales'
              },
              sourceId: 'alfresco/',
              typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
              formRef: 'uiserv/form@finance-request-form',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: false,
            collapsed: false,
            createVariant: {
              id: 'DEFAULT',
              name: {
                ru: 'Заявка на реализацию',
                en: 'Request for sales'
              },
              sourceId: 'alfresco/',
              typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
              formRef: 'uiserv/form@finance-request-form',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          }
        }
      ],
      allowedFor: [],
      params: {
        collapsible: false,
        collapsed: false
      }
    }
  ],
  1: [
    {
      id: '23179247-47a5-4e93-8a92-7e99dd78b4c1',
      label: {
        ru: 'Тест'
      },
      icon: '',
      hidden: false,
      type: MenuSettings.ItemTypes.SECTION,
      config: {},
      action: {
        type: '',
        config: {}
      },
      items: [
        {
          id: 'createVariant3',
          label: {
            ru: 'коммент-репо-2',
            en: ''
          },
          icon: 'ui/icon@icon-empty',
          hidden: false,
          type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
          config: {
            typeRef: 'emodel/type@comment-repo2',
            variantId: 'DEFAULT',
            variantTypeRef: 'emodel/type@comment-repo2',
            variant: {
              id: 'DEFAULT',
              name: {
                ru: 'коммент-репо-2'
              },
              sourceId: 'emodel/comment-repo2',
              typeRef: 'emodel/type@comment-repo2',
              formRef: 'uiserv/form@type$comment-repo2',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: false,
            collapsed: false,
            createVariant: {
              id: 'DEFAULT',
              name: {
                ru: 'коммент-репо-2'
              },
              sourceId: 'emodel/comment-repo2',
              typeRef: 'emodel/type@comment-repo2',
              formRef: 'uiserv/form@type$comment-repo2',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          }
        },
        {
          id: '34df9271-be26-4e1c-8ef6-756de1e89992',
          label: {
            en: 'spk-type-3'
          },
          icon: 'ui/icon@icon-empty',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@type$spk-type-3'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: true,
            collapsed: false,
            journalId: 'type$spk-type-3'
          }
        },
        {
          id: 'createVariant4',
          label: {
            ru: 'Заявка на реализацию',
            en: ''
          },
          icon: {
            url: '',
            type: 'img',
            value: 'ebd79697-48e2-4fc9-809d-9bce83421f14'
          },
          hidden: false,
          type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
          config: {
            typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
            variantId: 'DEFAULT',
            variantTypeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
            variant: {
              id: 'DEFAULT',
              name: {
                ru: 'Заявка на реализацию',
                en: 'Request for sales'
              },
              sourceId: 'alfresco/',
              typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
              formRef: 'uiserv/form@finance-request-form',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: false,
            collapsed: false,
            createVariant: {
              id: 'DEFAULT',
              name: {
                ru: 'Заявка на реализацию',
                en: 'Request for sales'
              },
              sourceId: 'alfresco/',
              typeRef: 'emodel/type@ecos-fin-request/type-ecos-fin-request-restar',
              formRef: 'uiserv/form@finance-request-form',
              postActionRef: '',
              formOptions: {},
              attributes: {},
              allowedFor: [],
              properties: {}
            }
          }
        }
      ],
      allowedFor: [],
      params: {
        collapsible: false,
        collapsed: false
      }
    }
  ],
  2: [
    {
      id: 'ea691bc9-07e2-4fce-808d-494e382d685b',
      label: {
        ru: 'Задачи'
      },
      icon: '',
      hidden: false,
      type: MenuSettings.ItemTypes.SECTION,
      config: {},
      action: {
        type: '',
        config: {}
      },
      items: [
        {
          id: '0fa6410f-0155-4a04-b001-c8f159f183a5',
          label: {
            en: 'Активные задачи'
          },
          icon: 'ui/icon@i-leftmenu-current-tasks',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@active-tasks',
            displayCount: true
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: true,
            collapsed: true,
            journalId: 'active-tasks'
          }
        },
        {
          id: '95be4f5f-fb4d-461c-991e-17975a6ba496',
          label: {
            en: 'Завершенные задачи'
          },
          icon: 'ui/icon@i-leftmenu-completed-tasks',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@completed-tasks'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: true,
            collapsed: true,
            journalId: 'completed-tasks'
          }
        },
        {
          id: 'cbda90a8-d831-4b70-b405-41f6c004e076',
          label: {
            en: 'Созданные задачи'
          },
          icon: 'ui/icon@i-leftmenu-new-tasks-1',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@initiator-tasks'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: true,
            collapsed: true,
            journalId: 'initiator-tasks'
          }
        },
        {
          id: '948fe4fa-801e-4ed2-8f45-f7c8532af483',
          label: {
            en: 'На контроле'
          },
          icon: 'ui/icon@i-leftmenu-controlled',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@controlled',
            displayCount: true
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: true,
            collapsed: true,
            journalId: 'controlled'
          }
        },
        {
          id: '67efb16e-4276-49e5-854f-9d6b2b4137df',
          label: {
            en: 'Задачи подчиненных'
          },
          icon: 'ui/icon@i-leftmenu-subordinate-tasks',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@subordinate-tasks'
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: true,
            collapsed: true,
            journalId: 'subordinate-tasks'
          }
        },
        {
          id: '1c992c3e-b20b-408c-8f33-26a1ddccfcdb',
          label: {
            en: 'Задачи разбора входящих'
          },
          icon: 'ui/icon@i-leftmenu-content',
          hidden: false,
          type: MenuSettings.ItemTypes.JOURNAL,
          config: {
            recordRef: 'uiserv/journal@income-package-tasks',
            displayCount: true
          },
          action: {
            type: '',
            config: {}
          },
          items: [],
          allowedFor: [],
          params: {
            collapsible: true,
            collapsed: true,
            journalId: 'income-package-tasks'
          }
        }
      ],
      allowedFor: [],
      params: {
        collapsible: false,
        collapsed: false
      }
    }
  ]
};
