export const fakeApi = {
  getUserData: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          payload: {
            name: 'admin',
            fullName: 'Administrator',
            nodeRef: 'workspace://SpacesStore/a6ce05f5-bd4b-4196-a12f-a5601a2fa0cd',
            isAvailable: true,
            isMutable: true
          }
        });
      }, 0);
    });
  },

  getIsCascadeCreateVariantMenu: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 0);
    });
  },

  getIsExternalAuthentication: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(false);
      }, 0);
    });
  },

  getSiteMenuItems: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        const items = [
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_DASHBOARD',
            config: { id: 'HEADER_SITE_DASHBOARD', label: 'Главная страница сайта', targetUrl: 'site/contracts/dashboard', selected: false }
          },
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_DOCUMENTLIBRARY',
            config: {
              id: 'HEADER_SITE_DOCUMENTLIBRARY',
              label: 'Каталог',
              pageId: 'documentlibrary',
              targetUrl: 'site/contracts/documentlibrary',
              selected: false
            }
          },
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_JOURNALS',
            config: {
              id: 'HEADER_SITE_JOURNALS',
              label: 'Журналы',
              pageId: 'journals',
              targetUrl: 'site/contracts/journals2/list/main',
              selected: false
            }
          },
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_SITE-DOCUMENT-TYPES',
            config: {
              id: 'HEADER_SITE_SITE-DOCUMENT-TYPES',
              label: 'Управление типами кейсов на сайте',
              pageId: 'site-document-types',
              targetUrl: 'site/contracts/site-document-types',
              selected: false
            }
          },
          {
            name: 'alfresco/header/AlfMenuItem',
            id: 'HEADER_SITE_MEMBERS',
            config: { id: 'HEADER_SITE_MEMBERS', label: 'Участники сайта', targetUrl: 'site/contracts/site-members', selected: false }
          },
          {
            name: 'js/citeck/header/citeckMenuItem',
            id: 'HEADER_SITE_INVITE',
            config: {
              iconAltText: 'Добавление пользователей',
              id: 'HEADER_SITE_INVITE',
              label: 'Добавление пользователей',
              title: 'Добавление пользователей',
              targetUrl: 'site/contracts/add-users',
              iconClass: 'alf-user-icon'
            }
          },
          {
            name: 'alfresco/menus/AlfMenuItem',
            id: 'HEADER_CUSTOMIZE_SITE_DASHBOARD',
            config: {
              id: 'HEADER_CUSTOMIZE_SITE_DASHBOARD',
              label: 'customize_dashboard.label',
              targetUrl: 'site/contracts/customise-site-dashboard',
              iconClass: 'alf-cog-icon'
            }
          },
          {
            name: 'alfresco/menus/AlfMenuItem',
            id: 'HEADER_EDIT_SITE_DETAILS',
            config: {
              id: 'HEADER_EDIT_SITE_DETAILS',
              label: 'edit_site_details.label',
              publishPayload: { userFullName: 'Ivan Tkachenko', site: 'contracts', user: 'admin', siteTitle: 'Договоры' },
              iconClass: 'alf-edit-icon',
              publishTopic: 'ALF_EDIT_SITE'
            }
          },
          {
            name: 'alfresco/menus/AlfMenuItem',
            id: 'HEADER_CUSTOMIZE_SITE',
            config: {
              id: 'HEADER_CUSTOMIZE_SITE',
              label: 'customize_site.label',
              targetUrl: 'site/contracts/customise-site',
              iconClass: 'alf-cog-icon'
            }
          },
          {
            name: 'alfresco/menus/AlfMenuItem',
            id: 'HEADER_LEAVE_SITE',
            config: {
              id: 'HEADER_LEAVE_SITE',
              label: 'leave_site.label',
              publishPayload: { userFullName: 'Ivan Tkachenko', site: 'contracts', user: 'admin', siteTitle: 'Договоры' },
              iconClass: 'alf-leave-icon',
              publishTopic: 'ALF_LEAVE_SITE'
            }
          }
        ];
        resolve(items);
      }, 0);
    });
  },

  getSmallLogoSrc: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('/share/res/themes/citeckTheme/images/app-logo-mobile.png');
      }, 0);
    });
  },

  getLargeLogoSrc: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('/share/res/themes/citeckTheme/images/app-logo-48.png');
      }, 0);
    });
  },

  getSlideMenuItems: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: 'HEADER_MENU_TASKS',
            widgets: [
              {
                label: 'Текущие задачи',
                id: 'HEADER_TASKS_ACTIVE_TASKS_JOURNAL',
                widgets: [
                  {
                    label: 'Просроченные',
                    id: 'HEADER_ACTIVE_TASKS_ПРОСРОЧЕННЫЕ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-due-past'
                  },
                  {
                    label: 'Назначены мне',
                    id: 'HEADER_ACTIVE_TASKS_НАЗНАЧЕНЫ МНЕ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-mine'
                  },
                  {
                    label: 'Низкий приоритет',
                    id: 'HEADER_ACTIVE_TASKS_НИЗКИЙ ПРИОРИТЕТ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-priority-3'
                  },
                  {
                    label: 'Не назначены',
                    id: 'HEADER_ACTIVE_TASKS_НЕ НАЗНАЧЕНЫ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-unassigned'
                  },
                  {
                    label: 'Срок завтра',
                    id: 'HEADER_ACTIVE_TASKS_СРОК ЗАВТРА_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-due-tommorrow'
                  },
                  {
                    label: 'Срок на следующих 7 дней',
                    id: 'HEADER_ACTIVE_TASKS_СРОК НА СЛЕДУЮЩИХ 7 ДНЕЙ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-due-next7days'
                  },
                  {
                    label: 'Срок сегодня',
                    id: 'HEADER_ACTIVE_TASKS_СРОК СЕГОДНЯ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-due-today'
                  },
                  {
                    label: 'Без срока',
                    id: 'HEADER_ACTIVE_TASKS_БЕЗ СРОКА_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-due-none'
                  },
                  {
                    label: 'Высокий приоритет',
                    id: 'HEADER_ACTIVE_TASKS_ВЫСОКИЙ ПРИОРИТЕТ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-priority-1'
                  },
                  {
                    label: 'Средний приоритет',
                    id: 'HEADER_ACTIVE_TASKS_СРЕДНИЙ ПРИОРИТЕТ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter=workspace://SpacesStore/journal-meta-f-task-priority-2'
                  }
                ],
                url: '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-active-tasks&filter='
              },
              {
                label: 'Завершенные задачи',
                id: 'HEADER_TASKS_COMPLETED_TASKS_JOURNAL',
                widgets: [
                  {
                    label: 'Низкий приоритет',
                    id: 'HEADER_COMPLETED_TASKS_НИЗКИЙ ПРИОРИТЕТ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-completed-tasks&filter=workspace://SpacesStore/journal-meta-f-task-priority-3'
                  },
                  {
                    label: 'Высокий приоритет',
                    id: 'HEADER_COMPLETED_TASKS_ВЫСОКИЙ ПРИОРИТЕТ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-completed-tasks&filter=workspace://SpacesStore/journal-meta-f-task-priority-1'
                  },
                  {
                    label: 'Средний приоритет',
                    id: 'HEADER_COMPLETED_TASKS_СРЕДНИЙ ПРИОРИТЕТ_FILTER',
                    url:
                      '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-completed-tasks&filter=workspace://SpacesStore/journal-meta-f-task-priority-2'
                  }
                ],
                url: '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-completed-tasks&filter='
              },
              {
                label: 'На контроле',
                id: 'HEADER_TASKS_CONTROLLED_JOURNAL',
                widgets: [],
                url: '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/73ea0b20-e08e-49a8-af1c-2d06a8345bac&filter='
              },
              {
                label: 'Задачи подчиненных',
                id: 'HEADER_TASKS_SUBORDINATE_TASKS_JOURNAL',
                widgets: [],
                url: '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/journal-meta-j-subordinate-tasks&filter='
              },
              {
                label: 'Статистика по задачам',
                id: 'HEADER_TASKS_TASK_STATISTIC_JOURNAL',
                widgets: [],
                url: '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/06c055e4-c710-4525-a779-07e6a241de3e&filter='
              },
              {
                label: 'Созданные задачи',
                id: 'HEADER_TASKS_INITIATOR_TASKS_JOURNAL',
                widgets: [],
                url: '/share/page/journals2/list/tasks#journal=workspace://SpacesStore/2cd772c1-fc0d-4b23-be1a-fcd6b9a8663f&filter='
              }
            ],
            sectionTitle: 'header.tasks.label'
          },
          {
            id: 'HEADER_MENU_SITES',
            widgets: [
              {
                id: 'HEADER_CONTRACTS',
                label: 'Договоры',
                widgets: [
                  {
                    label: 'Первичные учетные документы',
                    id: 'HEADER_CONTRACTS_CONTRACTS_CLOSING_DOCUMENT_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/contracts/journals2/list/main#journal=workspace://SpacesStore/c4da4a49-8e94-4fb5-a9ba-45a20ea25798&filter='
                  },
                  {
                    label: 'Договоры',
                    id: 'HEADER_CONTRACTS_CONTRACT_AGREEMENTS_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/contracts/journals2/list/main#journal=workspace://SpacesStore/46145c74-e169-41f6-8c87-0bb7d80e3497&filter='
                  },
                  {
                    label: 'Доп. соглашения',
                    id: 'HEADER_CONTRACTS_CONTRACTS_SUPPLEMENTARY_AGREEMENT_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/contracts/journals2/list/main#journal=workspace://SpacesStore/fcf10c82-3118-488b-b0fc-e12bd4f94a60&filter='
                  },
                  {
                    label: 'Счета',
                    id: 'HEADER_CONTRACTS_PAYMENTS_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/contracts/journals2/list/main#journal=workspace://SpacesStore/0cbd47ff-cf2a-452f-8300-3d3a45f5e750&filter='
                  },
                  {
                    id: 'HEADER_CONTRACTS_DOCUMENTLIBRARY',
                    label: 'header.documentlibrary.label',
                    url: '/share/page/site/contracts/documentlibrary'
                  },
                  { id: 'HEADER_CONTRACTS_SITE_CALENDAR', label: 'header.calendar.label', url: '/share/page/site/contracts/calendar' }
                ],
                url: '/share/page?site=contracts'
              },
              {
                id: 'HEADER_CASES',
                label: 'Кейсы',
                widgets: [
                  {
                    label: 'Стандартный кейс',
                    id: 'HEADER_CASES_GENERAL_CASE_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/cases/journals2/list/main#journal=workspace://SpacesStore/9e5fff8c-7929-4537-8e70-739f4c6699af&filter='
                  },
                  {
                    id: 'HEADER_CASES_DOCUMENTLIBRARY',
                    label: 'header.documentlibrary.label',
                    url: '/share/page/site/cases/documentlibrary'
                  },
                  { id: 'HEADER_CASES_SITE_CALENDAR', label: 'header.calendar.label', url: '/share/page/site/cases/calendar' }
                ],
                url: '/share/page?site=cases'
              },
              {
                id: 'HEADER_LETTERS',
                label: 'Корреспонденция',
                widgets: [
                  {
                    label: 'Входящие',
                    id: 'HEADER_LETTERS_LETTERS_INCOME_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/letters/journals2/list/main#journal=workspace://SpacesStore/8c8d57cc-1547-47ec-85d3-bce47722d033&filter='
                  },
                  {
                    label: 'Исходящие',
                    id: 'HEADER_LETTERS_LETTERS_OUTCOME_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/letters/journals2/list/main#journal=workspace://SpacesStore/057fd884-49b1-4ff1-a340-647ac6488b6d&filter='
                  },
                  {
                    id: 'HEADER_LETTERS_DOCUMENTLIBRARY',
                    label: 'header.documentlibrary.label',
                    url: '/share/page/site/letters/documentlibrary'
                  },
                  { id: 'HEADER_LETTERS_SITE_CALENDAR', label: 'header.calendar.label', url: '/share/page/site/letters/calendar' }
                ],
                url: '/share/page?site=letters'
              },
              {
                id: 'HEADER_COMMON_DOCUMENTS',
                label: 'Общие документы',
                widgets: [
                  {
                    label: 'Документы',
                    id: 'HEADER_COMMON_DOCUMENTS_ECOS_DOCUMENTS_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/common-documents/journals2/list/main#journal=workspace://SpacesStore/41255456-48d7-4938-a22a-dccb566faee6&filter='
                  },
                  {
                    id: 'HEADER_COMMON_DOCUMENTS_DOCUMENTLIBRARY',
                    label: 'header.documentlibrary.label',
                    url: '/share/page/site/common-documents/documentlibrary'
                  },
                  {
                    id: 'HEADER_COMMON_DOCUMENTS_SITE_CALENDAR',
                    label: 'header.calendar.label',
                    url: '/share/page/site/common-documents/calendar'
                  }
                ],
                url: '/share/page?site=common-documents'
              },
              {
                id: 'HEADER_ORDERS',
                label: 'ОРД',
                widgets: [
                  {
                    label: 'Внутренний',
                    id: 'HEADER_ORDERS_ORDERS_INTERNAL_JOURNAL',
                    widgets: [
                      {
                        label: 'Я инициатор',
                        id: 'HEADER_ORDERS_INTERNAL_Я ИНИЦИАТОР_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-internal-me-init'
                      },
                      {
                        label: 'На регистрации',
                        id: 'HEADER_ORDERS_INTERNAL_НА РЕГИСТРАЦИИ_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-internal-onRegistration'
                      },
                      {
                        label: 'На утверждении',
                        id: 'HEADER_ORDERS_INTERNAL_НА УТВЕРЖДЕНИИ_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-orders-internal-onApproval'
                      },
                      {
                        label: 'На нормоконтроле',
                        id: 'HEADER_ORDERS_INTERNAL_НА НОРМОКОНТРОЛЕ_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-internal-onNormcontrol'
                      },
                      {
                        label: 'Текущие',
                        id: 'HEADER_ORDERS_INTERNAL_ТЕКУЩИЕ_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-internal-me-current'
                      },
                      {
                        label: 'На исполнении',
                        id: 'HEADER_ORDERS_INTERNAL_НА ИСПОЛНЕНИИ_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-internal-onPerformance'
                      },
                      {
                        label: 'Я регистратор',
                        id: 'HEADER_ORDERS_INTERNAL_Я РЕГИСТРАТОР_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-internal-me-reg'
                      },
                      {
                        label: 'На подписании',
                        id: 'HEADER_ORDERS_INTERNAL_НА ПОДПИСАНИИ_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-orders-internal-onSign'
                      },
                      {
                        label: 'Архив',
                        id: 'HEADER_ORDERS_INTERNAL_АРХИВ_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-internal-archive'
                      },
                      {
                        label: 'Я подписант',
                        id: 'HEADER_ORDERS_INTERNAL_Я ПОДПИСАНТ_FILTER',
                        url:
                          '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter=workspace://SpacesStore/journal-internal-me-signer'
                      }
                    ],
                    url: '/share/page/site/orders/journals2/list/main#journal=workspace://SpacesStore/journal-orders-internal&filter='
                  },
                  {
                    id: 'HEADER_ORDERS_DOCUMENTLIBRARY',
                    label: 'header.documentlibrary.label',
                    url: '/share/page/site/orders/documentlibrary'
                  },
                  { id: 'HEADER_ORDERS_SITE_CALENDAR', label: 'header.calendar.label', url: '/share/page/site/orders/calendar' }
                ],
                url: '/share/page?site=orders'
              },
              {
                id: 'HEADER_ORDER_PASS',
                label: 'Пропуска',
                widgets: [
                  {
                    label: 'Пропуска',
                    id: 'HEADER_ORDER_PASS_ORDER_PASSES_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/order-pass/journals2/list/main#journal=workspace://SpacesStore/04d6f9aa-c877-4fab-8d7a-6a7bb16f8e5a&filter='
                  },
                  {
                    id: 'HEADER_ORDER_PASS_DOCUMENTLIBRARY',
                    label: 'header.documentlibrary.label',
                    url: '/share/page/site/order-pass/documentlibrary'
                  },
                  { id: 'HEADER_ORDER_PASS_SITE_CALENDAR', label: 'header.calendar.label', url: '/share/page/site/order-pass/calendar' }
                ],
                url: '/share/page?site=order-pass'
              },
              {
                id: 'HEADER_MEETINGS',
                label: 'Совещания',
                widgets: [
                  {
                    label: 'Совещания',
                    id: 'HEADER_MEETINGS_MEETINGS_JOURNAL',
                    widgets: [],
                    url:
                      '/share/page/site/meetings/journals2/list/main#journal=workspace://SpacesStore/ae6fb7a8-9165-4f81-aecd-06557ad34677&filter='
                  },
                  {
                    id: 'HEADER_MEETINGS_DOCUMENTLIBRARY',
                    label: 'header.documentlibrary.label',
                    url: '/share/page/site/meetings/documentlibrary'
                  },
                  { id: 'HEADER_MEETINGS_SITE_CALENDAR', label: 'header.calendar.label', url: '/share/page/site/meetings/calendar' }
                ],
                url: '/share/page?site=meetings'
              },
              { id: 'HEADER_SITES_SEARCH', label: 'header.find-sites.label', url: '/share/page/custom-site-finder' },
              { clickEvent: 'Citeck.module.getCreateSiteInstance().show()', id: 'HEADER_SITES_CREATE', label: 'header.create-site.label' }
            ],
            sectionTitle: 'header.sites.label'
          },
          {
            id: 'HEADER_MENU_ORGSTRUCT',
            widgets: [{ id: 'HEADER_MENU_ORGSTRUCT_WIDGET', label: 'header.orgstruct.label', url: '/share/page/orgstruct' }],
            sectionTitle: 'header.orgstruct.label'
          },
          {
            id: 'HEADER_MORE_MY_GROUP',
            widgets: [
              {
                id: 'HEADER_MY_WORKFLOWS',
                label: 'header.my-workflows.label',
                iconImage: '/share/res/components/images/header/my-workflows.png',
                url: '/share/page/my-workflows'
              },
              {
                id: 'HEADER_COMPLETED_WORKFLOWS',
                label: 'header.completed-workflows.label',
                iconImage: '/share/res/components/images/header/completed-workflows.png',
                url: '/share/page/completed-workflows#paging=%7C&filter=workflows%7Call'
              },
              {
                id: 'HEADER_MY_CONTENT',
                label: 'header.my-content.label',
                iconImage: '/share/res/components/images/header/my-content.png',
                url: '/share/page/user/user-content'
              },
              {
                id: 'HEADER_MY_SITES',
                label: 'header.my-sites.label',
                iconImage: '/share/res/components/images/header/my-sites.png',
                url: '/share/page/user/user-sites'
              },
              {
                id: 'HEADER_MY_FILES',
                label: 'header.my-files.label',
                iconImage: '/share/res/components/images/header/my-content.png',
                url: '/share/page/context/mine/myfiles'
              },
              {
                id: 'HEADER_GLOBAL_JOURNALS2',
                label: 'header.global_journals2.label',
                iconImage: '/share/res/components/images/header/journals.png',
                url: '/share/page/journals2/list/main'
              }
            ],
            sectionTitle: 'header.my.label'
          },
          {
            id: 'HEADER_MORE_TOOLS_GROUP',
            widgets: [
              {
                id: 'HEADER_REPOSITORY',
                label: 'header.repository.label',
                iconImage: '/share/res/components/images/header/repository.png',
                url: '/share/page/repository'
              },
              {
                id: 'HEADER_APPLICATION_MENU',
                label: 'header.application.label',
                iconImage: '/share/res/components/images/header/application.png',
                url: '/share/page/console/admin-console/application'
              },
              {
                id: 'HEADER_FLOWABLE_MODELER',
                label: 'page.flowable-modeler.title',
                iconImage: '/share/res/components/images/header/application.png',
                url: '/share/page/flowable-modeler'
              },
              {
                id: 'HEADER_GROUPS',
                label: 'header.groups.label',
                iconImage: '/share/res/components/images/header/groups.png',
                url: '/share/page/console/admin-console/groups'
              },
              {
                id: 'HEADER_USERS',
                label: 'header.users.label',
                iconImage: '/share/res/components/images/header/users.png',
                url: '/share/page/console/admin-console/users'
              },
              {
                id: 'HEADER_CATEGORIES',
                label: 'header.categories.label',
                iconImage: '/share/res/components/images/header/category-manager.png',
                url: '/share/page/console/admin-console/type-manager'
              },
              {
                id: 'HEADER_SYSTEM',
                label: 'header.system.label',
                iconImage: '/share/res/components/images/header/journals.png',
                url: '/share/page/journals2/list/system'
              },
              {
                id: 'HEADER_META_JOURNALS',
                label: 'header.meta_journals.label',
                iconImage: '/share/res/components/images/header/journals.png',
                url: '/share/page/journals2/list/meta'
              },
              {
                id: 'HEADER_TEMPLATES',
                label: 'header.templates.label',
                iconImage: '/share/res/components/images/header/templates.png',
                url: '/share/page/journals2/list/templates'
              },
              {
                id: 'HEADER_MORE',
                label: 'header.more.label',
                iconImage: '/share/res/components/images/header/more.png',
                url: '/share/page/console/admin-console/'
              }
            ],
            sectionTitle: 'header.tools.label'
          }
        ]);
      }, 0);
    });
  }
};
