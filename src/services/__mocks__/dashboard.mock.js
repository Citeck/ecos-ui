import { t } from '../../helpers/export/util';
import { LayoutTypes } from '../../constants/layout';
import { SourcesId } from '../../constants';

export const getDefaultDashboardConfig = idLayout => ({
  layout: {
    id: idLayout,
    tab: {
      idLayout,
      label: t('page-tabs.tab-name-default')
    },
    type: LayoutTypes.TWO_COLUMNS_BS,
    columns: [
      {
        width: '30%',
        widgets: []
      },
      {
        widgets: []
      }
    ]
  }
});

export const FULL_DASHBOARD_ID = `${SourcesId.DASHBOARD}@8af93eae-b6ed-4667-8d90-df99c2ad22ff`;
export const SHORT_DASHBOARD_ID = '8af93eae-b6ed-4667-8d90-df99c2ad22ff';

export const WIDGETS_BY_ID = [
  [
    [
      { id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc', name: 'comments' },
      { id: '8be5eae5-a476-41d9-a457-3fee665173d5', name: 'doc-status' },
      { id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b', name: 'web-page' }
    ],
    {
      '0cf75efa-30f8-470a-b9aa-5e13d18b96cc': { id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc', name: 'comments' },
      '8be5eae5-a476-41d9-a457-3fee665173d5': { id: '8be5eae5-a476-41d9-a457-3fee665173d5', name: 'doc-status' },
      '568f40b4-e0f2-42f5-ba18-bd7507319d1b': { id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b', name: 'web-page' }
    }
  ]
];

export const CONFIGS = [
  [
    [
      {
        id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
        columns: [{ widgets: ['widget-0-documents', 'widget-0-web-page'] }, { widgets: ['widget-1-journals', 'widget-1-comments'] }],
        tab: { label: 'Вкладка 1' }
      }
    ],
    [
      {
        columns: [
          {
            widgets: ['widget-0-documents', 'widget-0-web-page', 'widget-1-journals', 'widget-1-comments']
          }
        ],
        id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
        tab: {
          idLayout: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
          label: 'Вкладка 1'
        },
        type: LayoutTypes.MOBILE
      }
    ]
  ]
];

export const OLD_TO_NEW_CONFIG = [
  [
    {
      layouts: [
        {
          id: 'layout_799ac5e5-9eab-4c08-af80-5ed48d768229',
          tab: { label: 'Основное', idLayout: 'layout_799ac5e5-9eab-4c08-af80-5ed48d768229' },
          type: '2-columns-big-small-with-footer',
          columns: [
            [
              {
                widgets: [
                  {
                    dndId: '077bcf0e-5f7e-4f6d-abca-f996d243ea1d',
                    name: 'tasks',
                    label: 'dashboard-settings.widget.tasks',
                    id: 'd5b4372a-cb41-4370-b66e-5580a52aaa6f',
                    props: { id: 'd5b4372a-cb41-4370-b66e-5580a52aaa6f', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    name: 'properties',
                    label: 'dashboard-settings.widget.properties',
                    dndId: '5da54e6e-674e-43af-b1ec-c54d594ea296',
                    id: '68279cb4-8710-4f47-b766-16a29bd48514',
                    props: {
                      id: '68279cb4-8710-4f47-b766-16a29bd48514',
                      config: { widgetDisplayCondition: '', formId: null, titleAsFormName: false }
                    }
                  },
                  {
                    dndId: 'aa0deb44-527e-4244-85cc-89757c0e07eb',
                    name: 'comments',
                    label: 'dashboard-settings.widget.comments',
                    id: '291afa3a-50c1-4a3a-9700-8b85767926af',
                    props: { id: '291afa3a-50c1-4a3a-9700-8b85767926af', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '0d0dfc44-20ca-482b-adb8-61aa346a0913',
                    name: 'doc-preview',
                    label: 'dashboard-settings.widget.preview',
                    id: '921c9b5b-2d6c-49a2-9aad-c2c0f2841ade',
                    props: { id: '921c9b5b-2d6c-49a2-9aad-c2c0f2841ade', config: { widgetDisplayCondition: '', link: '' } }
                  }
                ]
              },
              {
                widgets: [
                  {
                    name: 'doc-status',
                    label: 'dashboard-settings.widget.doc-status',
                    dndId: '0a4f8d1e-7074-41b6-9702-01b63faa26d6',
                    id: '272cf8b6-6652-4cea-8986-5757acc9e7cb',
                    props: { id: '272cf8b6-6652-4cea-8986-5757acc9e7cb', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '68d2228b-5972-4b90-b465-d317e5f3d0a6',
                    name: 'current-tasks',
                    label: 'dashboard-settings.widget.current-tasks',
                    id: '6d9d1e54-0c77-4990-9aed-228bec1614f4',
                    props: { id: '6d9d1e54-0c77-4990-9aed-228bec1614f4', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '8ecb125c-7a47-4d3b-b871-5868fbe76498',
                    name: 'record-actions',
                    label: 'dashboard-settings.widget.actions',
                    id: '6cb0726f-07c2-4388-84bc-6651823e2ba9',
                    props: { id: '6cb0726f-07c2-4388-84bc-6651823e2ba9', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '951e31ba-70c0-4cab-988b-9d271cfa3632',
                    name: 'doc-associations',
                    label: 'dashboard-settings.widget.doc-associations',
                    id: 'c0a9aeee-a536-400d-ae80-326e77ce5202',
                    props: { id: 'c0a9aeee-a536-400d-ae80-326e77ce5202', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '667f668d-b568-4914-84a8-475f122d98f4',
                    name: 'versions-journal',
                    label: 'dashboard-settings.widget.versions-journal',
                    id: 'c726daad-06e9-4636-b4b1-7d7ee73c101c',
                    props: { id: 'c726daad-06e9-4636-b4b1-7d7ee73c101c', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '4f314f37-e0df-4df3-970a-b1fa6c545c2e',
                    name: 'barcode',
                    label: 'dashboard-settings.widget.barcode',
                    id: '46b2bc89-1502-4959-8c2b-2a105c6c61a5',
                    props: {
                      id: '46b2bc89-1502-4959-8c2b-2a105c6c61a5',
                      config: {
                        widgetDisplayCondition: '',
                        settings: { scale: 500, top: 20, left: 20, right: 200, bottom: 50, type: 'code-128' }
                      }
                    }
                  }
                ],
                width: '25%'
              }
            ],
            [
              {
                widgets: [
                  {
                    name: 'documents',
                    label: 'dashboard-settings.widget.documents',
                    dndId: 'f5cb90ee-fecb-483d-836a-930d07853804',
                    id: '3934417c-8ef9-4064-96b0-f5b7f93d90bd',
                    props: {
                      id: '3934417c-8ef9-4064-96b0-f5b7f93d90bd',
                      config: {
                        widgetDisplayCondition: '',
                        types: [
                          { type: 'emodel/type@category-document-type/kind-d-scan-documents', multiple: true, mandatory: true },
                          { type: 'emodel/type@category-document-type/kind-d-counterparty-documents', multiple: true, mandatory: true },
                          {
                            type: 'emodel/type@category-document-type/cat-document-accounting-documents',
                            multiple: false,
                            mandatory: false
                          }
                        ],
                        isLoadChecklist: true,
                        isPossibleUploadFile: true
                      }
                    }
                  },
                  {
                    dndId: '7569abc1-0015-49da-a9de-1cfb0f42096e',
                    name: 'events-history',
                    label: 'dashboard-settings.widget.events-history',
                    id: '1ab254c7-6bc7-421c-ba90-da266648c22e',
                    props: { id: '1ab254c7-6bc7-421c-ba90-da266648c22e', config: { widgetDisplayCondition: '' } }
                  }
                ]
              }
            ]
          ]
        },
        {
          id: 'layout_35cd006c-9ae1-4148-9e25-3a78989fd690',
          tab: { label: 'Документы', idLayout: 'layout_35cd006c-9ae1-4148-9e25-3a78989fd690' },
          type: '1-column',
          columns: [
            {
              widgets: [
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '8137728d-f75c-441d-9ec4-95e1d110a763',
                  id: '52481d7d-b3a8-4291-bda2-bb3826d90493',
                  props: {
                    id: '52481d7d-b3a8-4291-bda2-bb3826d90493',
                    config: {
                      widgetDisplayCondition: '',
                      types: [
                        { type: 'emodel/type@ecos-fin-request-attachments', multiple: false, mandatory: false, canUpload: true },
                        {
                          type: 'emodel/type@category-document-type/kind-d-scan-documents',
                          multiple: true,
                          mandatory: true,
                          canUpload: true
                        },
                        { type: 'emodel/type@category-document-type/cat-document-other', multiple: true, mandatory: true, canUpload: true }
                      ],
                      isLoadChecklist: true
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'layout_0c2838b6-1205-4c64-b3cd-a2022ae7c40d',
          tab: { label: 'empty', idLayout: 'layout_0c2838b6-1205-4c64-b3cd-a2022ae7c40d' },
          type: '2-columns-big-small',
          columns: [{ widgets: [] }, { widgets: [], width: '25%' }]
        },
        {
          id: 'layout_6fb20286-5d7c-4119-9d18-92ecc5ab6df5',
          tab: { label: 'test', idLayout: 'layout_6fb20286-5d7c-4119-9d18-92ecc5ab6df5' },
          type: '2-columns-big-small',
          columns: [
            {
              widgets: [
                {
                  name: 'doc-status',
                  label: 'dashboard-settings.widget.doc-status',
                  dndId: 'd83ac567-ade7-4a41-98da-a39ab0ff9963',
                  id: 'cef64316-9c9a-4f15-a67f-c92bb484987a',
                  props: { id: 'cef64316-9c9a-4f15-a67f-c92bb484987a', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'comments',
                  label: 'dashboard-settings.widget.comments',
                  dndId: '369099e0-f27e-4573-a1ba-21336a5b38c6',
                  id: '11adfea8-5582-4234-97f2-dcbccfbeecb6',
                  props: { id: '11adfea8-5582-4234-97f2-dcbccfbeecb6', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'versions-journal',
                  label: 'dashboard-settings.widget.versions-journal',
                  dndId: 'b5ac58c4-9705-4c84-bf02-0b03005f7085',
                  id: '1f0d7c0f-8250-4ce6-90c7-42abc23da29d',
                  props: { id: '1f0d7c0f-8250-4ce6-90c7-42abc23da29d', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'journal',
                  label: 'dashboard-settings.widget.journal',
                  dndId: '930b7818-13b9-4ab3-843d-c29677fbd0c9',
                  id: '433eff18-15f0-4f8a-a8a5-de6e308022aa',
                  props: {
                    id: '433eff18-15f0-4f8a-a8a5-de6e308022aa',
                    config: {
                      widgetDisplayCondition: '',
                      journalsListId: 'contractor-documents',
                      journalId: 'workspace://SpacesStore/journal-meta-j-journals',
                      journalType: 'journals',
                      journalSettingId: '',
                      onlyLinked: false,
                      customJournalMode: false
                    }
                  }
                },
                {
                  name: 'tasks',
                  label: 'dashboard-settings.widget.tasks',
                  dndId: 'fa5c2f77-c30c-4082-af00-f47534d2f598',
                  id: 'b68cd3d2-6471-475e-84dc-04504dd181e8',
                  props: { id: 'b68cd3d2-6471-475e-84dc-04504dd181e8', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'events-history',
                  label: 'dashboard-settings.widget.events-history',
                  dndId: '125b5b32-5145-4169-9dd0-eb8a844ecb9b',
                  id: '883cee90-cf63-4971-ad65-676b7caa3eb2',
                  props: { id: '883cee90-cf63-4971-ad65-676b7caa3eb2', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '960d5d6e-93bc-4274-90a4-b13b17a03e40',
                  id: '250764c7-cba6-4f6c-bebf-e686498eb6e7',
                  props: { id: '250764c7-cba6-4f6c-bebf-e686498eb6e7', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'doc-constructor',
                  label: 'dashboard-settings.widget.doc-constructor',
                  dndId: '2c476f1f-611c-40e4-aab6-6a314f559dd7',
                  id: '701a542f-0571-44f8-b6d3-97b714f4a75c',
                  props: { id: '701a542f-0571-44f8-b6d3-97b714f4a75c', config: { widgetDisplayCondition: '' } }
                }
              ]
            },
            {
              widgets: [
                {
                  name: 'web-page',
                  label: 'dashboard-settings.widget.web-page',
                  dndId: '3915f10e-994f-4b32-896d-9443c7243729',
                  id: '30902945-ceca-412e-9664-79ba828be482',
                  props: {
                    id: '30902945-ceca-412e-9664-79ba828be482',
                    config: { widgetDisplayCondition: '', url: 'https://www.detmir.ru/', title: 'https://www.detmir.ru/' }
                  }
                },
                {
                  name: 'doc-preview',
                  label: 'dashboard-settings.widget.preview',
                  dndId: '9be1e828-f1ef-4cbc-a825-f3a547061666',
                  id: '42edc16e-53fc-429d-a47d-e0901127d8c7',
                  props: { id: '42edc16e-53fc-429d-a47d-e0901127d8c7', config: { widgetDisplayCondition: '', link: '' } }
                },
                {
                  name: 'properties',
                  label: 'dashboard-settings.widget.properties',
                  dndId: 'c58d2360-34c2-4e0e-b6c7-aa00b8fa04e8',
                  id: 'bdb0d47c-9c5a-4cf8-8cb2-021310f75de7',
                  props: { id: 'bdb0d47c-9c5a-4cf8-8cb2-021310f75de7', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'current-tasks',
                  label: 'dashboard-settings.widget.current-tasks',
                  dndId: '8d11e5e5-c196-4f06-b35f-9e576e289357',
                  id: 'd2b1f87d-4c52-4799-900d-095ee3ca3a34',
                  props: { id: 'd2b1f87d-4c52-4799-900d-095ee3ca3a34', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'doc-status',
                  label: 'dashboard-settings.widget.doc-status',
                  dndId: '0a0779f3-c836-4cf1-aac9-5c67b4f01859',
                  id: '42f6340e-c269-4381-85e2-19133d2f60a5',
                  props: { id: '42f6340e-c269-4381-85e2-19133d2f60a5', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'doc-associations',
                  label: 'dashboard-settings.widget.doc-associations',
                  dndId: '8ec789de-c655-4ebb-b527-c4e5f8e898b4',
                  id: '54580e9b-493a-4abc-9c1b-2d387740cfce',
                  props: { id: '54580e9b-493a-4abc-9c1b-2d387740cfce', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'record-actions',
                  label: 'dashboard-settings.widget.actions',
                  dndId: '0e72a35b-699f-4a52-af4e-04f2a55f6b28',
                  id: 'bd5468d5-fb0a-4f03-b286-c7425ac5d3c0',
                  props: { id: 'bd5468d5-fb0a-4f03-b286-c7425ac5d3c0', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'barcode',
                  label: 'dashboard-settings.widget.barcode',
                  dndId: 'c628c11c-3007-4b13-977c-4dd463722bbb',
                  id: '8fc06553-203c-4e04-87d7-ce133dc12d15',
                  props: { id: '8fc06553-203c-4e04-87d7-ce133dc12d15', config: { widgetDisplayCondition: '' } }
                }
              ],
              width: '25%'
            }
          ]
        }
      ],
      mobile: [
        {
          id: 'layout_4aa7fed6-d601-45ae-9b26-a1d896646afd',
          tab: { label: 'Вкладка 1', idLayout: 'layout_4aa7fed6-d601-45ae-9b26-a1d896646afd' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '892a87c8-0bbd-4bf0-9bd6-72da1584f1bf',
                  id: '7656cb22-d23a-4b94-a847-d845e085e778',
                  props: {
                    id: '7656cb22-d23a-4b94-a847-d845e085e778',
                    config: {
                      widgetDisplayCondition: '',
                      types: [
                        { type: 'emodel/type@base', multiple: false, mandatory: false, canUpload: true },
                        { type: 'emodel/type@file-import-task', multiple: false, mandatory: false, canUpload: true },
                        { type: 'emodel/type@menu', multiple: false, mandatory: false, canUpload: true }
                      ],
                      isLoadChecklist: true
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      layouts: [
        {
          id: 'layout_799ac5e5-9eab-4c08-af80-5ed48d768229',
          tab: { label: 'Основное', idLayout: 'layout_799ac5e5-9eab-4c08-af80-5ed48d768229' },
          type: '2-columns-big-small-with-footer',
          columns: [
            [
              {
                widgets: [
                  {
                    dndId: '077bcf0e-5f7e-4f6d-abca-f996d243ea1d',
                    name: 'tasks',
                    label: 'dashboard-settings.widget.tasks',
                    id: 'd5b4372a-cb41-4370-b66e-5580a52aaa6f',
                    props: { id: 'd5b4372a-cb41-4370-b66e-5580a52aaa6f', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    name: 'properties',
                    label: 'dashboard-settings.widget.properties',
                    dndId: '5da54e6e-674e-43af-b1ec-c54d594ea296',
                    id: '68279cb4-8710-4f47-b766-16a29bd48514',
                    props: {
                      id: '68279cb4-8710-4f47-b766-16a29bd48514',
                      config: { widgetDisplayCondition: '', formId: null, titleAsFormName: false }
                    }
                  },
                  {
                    dndId: 'aa0deb44-527e-4244-85cc-89757c0e07eb',
                    name: 'comments',
                    label: 'dashboard-settings.widget.comments',
                    id: '291afa3a-50c1-4a3a-9700-8b85767926af',
                    props: { id: '291afa3a-50c1-4a3a-9700-8b85767926af', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '0d0dfc44-20ca-482b-adb8-61aa346a0913',
                    name: 'doc-preview',
                    label: 'dashboard-settings.widget.preview',
                    id: '921c9b5b-2d6c-49a2-9aad-c2c0f2841ade',
                    props: { id: '921c9b5b-2d6c-49a2-9aad-c2c0f2841ade', config: { widgetDisplayCondition: '', link: '' } }
                  }
                ]
              },
              {
                widgets: [
                  {
                    name: 'doc-status',
                    label: 'dashboard-settings.widget.doc-status',
                    dndId: '0a4f8d1e-7074-41b6-9702-01b63faa26d6',
                    id: '272cf8b6-6652-4cea-8986-5757acc9e7cb',
                    props: { id: '272cf8b6-6652-4cea-8986-5757acc9e7cb', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '68d2228b-5972-4b90-b465-d317e5f3d0a6',
                    name: 'current-tasks',
                    label: 'dashboard-settings.widget.current-tasks',
                    id: '6d9d1e54-0c77-4990-9aed-228bec1614f4',
                    props: { id: '6d9d1e54-0c77-4990-9aed-228bec1614f4', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '8ecb125c-7a47-4d3b-b871-5868fbe76498',
                    name: 'record-actions',
                    label: 'dashboard-settings.widget.actions',
                    id: '6cb0726f-07c2-4388-84bc-6651823e2ba9',
                    props: { id: '6cb0726f-07c2-4388-84bc-6651823e2ba9', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '951e31ba-70c0-4cab-988b-9d271cfa3632',
                    name: 'doc-associations',
                    label: 'dashboard-settings.widget.doc-associations',
                    id: 'c0a9aeee-a536-400d-ae80-326e77ce5202',
                    props: { id: 'c0a9aeee-a536-400d-ae80-326e77ce5202', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '667f668d-b568-4914-84a8-475f122d98f4',
                    name: 'versions-journal',
                    label: 'dashboard-settings.widget.versions-journal',
                    id: 'c726daad-06e9-4636-b4b1-7d7ee73c101c',
                    props: { id: 'c726daad-06e9-4636-b4b1-7d7ee73c101c', config: { widgetDisplayCondition: '' } }
                  },
                  {
                    dndId: '4f314f37-e0df-4df3-970a-b1fa6c545c2e',
                    name: 'barcode',
                    label: 'dashboard-settings.widget.barcode',
                    id: '46b2bc89-1502-4959-8c2b-2a105c6c61a5',
                    props: {
                      id: '46b2bc89-1502-4959-8c2b-2a105c6c61a5',
                      config: {
                        widgetDisplayCondition: '',
                        settings: { scale: 500, top: 20, left: 20, right: 200, bottom: 50, type: 'code-128' }
                      }
                    }
                  }
                ],
                width: '25%'
              }
            ],
            [
              {
                widgets: [
                  {
                    name: 'documents',
                    label: 'dashboard-settings.widget.documents',
                    dndId: 'f5cb90ee-fecb-483d-836a-930d07853804',
                    id: '3934417c-8ef9-4064-96b0-f5b7f93d90bd',
                    props: {
                      id: '3934417c-8ef9-4064-96b0-f5b7f93d90bd',
                      config: {
                        widgetDisplayCondition: '',
                        types: [
                          { type: 'emodel/type@category-document-type/kind-d-scan-documents', multiple: true, mandatory: true },
                          { type: 'emodel/type@category-document-type/kind-d-counterparty-documents', multiple: true, mandatory: true },
                          {
                            type: 'emodel/type@category-document-type/cat-document-accounting-documents',
                            multiple: false,
                            mandatory: false
                          }
                        ],
                        isLoadChecklist: true,
                        isPossibleUploadFile: true
                      }
                    }
                  },
                  {
                    dndId: '7569abc1-0015-49da-a9de-1cfb0f42096e',
                    name: 'events-history',
                    label: 'dashboard-settings.widget.events-history',
                    id: '1ab254c7-6bc7-421c-ba90-da266648c22e',
                    props: { id: '1ab254c7-6bc7-421c-ba90-da266648c22e', config: { widgetDisplayCondition: '' } }
                  }
                ]
              }
            ]
          ]
        },
        {
          id: 'layout_35cd006c-9ae1-4148-9e25-3a78989fd690',
          tab: { label: 'Документы', idLayout: 'layout_35cd006c-9ae1-4148-9e25-3a78989fd690' },
          type: '1-column',
          columns: [
            {
              widgets: [
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '8137728d-f75c-441d-9ec4-95e1d110a763',
                  id: '52481d7d-b3a8-4291-bda2-bb3826d90493',
                  props: {
                    id: '52481d7d-b3a8-4291-bda2-bb3826d90493',
                    config: {
                      widgetDisplayCondition: '',
                      types: [
                        { type: 'emodel/type@ecos-fin-request-attachments', multiple: false, mandatory: false, canUpload: true },
                        {
                          type: 'emodel/type@category-document-type/kind-d-scan-documents',
                          multiple: true,
                          mandatory: true,
                          canUpload: true
                        },
                        { type: 'emodel/type@category-document-type/cat-document-other', multiple: true, mandatory: true, canUpload: true }
                      ],
                      isLoadChecklist: true
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'layout_0c2838b6-1205-4c64-b3cd-a2022ae7c40d',
          tab: { label: 'empty', idLayout: 'layout_0c2838b6-1205-4c64-b3cd-a2022ae7c40d' },
          type: '2-columns-big-small',
          columns: [{ widgets: [] }, { widgets: [], width: '25%' }]
        },
        {
          id: 'layout_6fb20286-5d7c-4119-9d18-92ecc5ab6df5',
          tab: { label: 'test', idLayout: 'layout_6fb20286-5d7c-4119-9d18-92ecc5ab6df5' },
          type: '2-columns-big-small',
          columns: [
            {
              widgets: [
                {
                  name: 'doc-status',
                  label: 'dashboard-settings.widget.doc-status',
                  dndId: 'd83ac567-ade7-4a41-98da-a39ab0ff9963',
                  id: 'cef64316-9c9a-4f15-a67f-c92bb484987a',
                  props: { id: 'cef64316-9c9a-4f15-a67f-c92bb484987a', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'comments',
                  label: 'dashboard-settings.widget.comments',
                  dndId: '369099e0-f27e-4573-a1ba-21336a5b38c6',
                  id: '11adfea8-5582-4234-97f2-dcbccfbeecb6',
                  props: { id: '11adfea8-5582-4234-97f2-dcbccfbeecb6', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'versions-journal',
                  label: 'dashboard-settings.widget.versions-journal',
                  dndId: 'b5ac58c4-9705-4c84-bf02-0b03005f7085',
                  id: '1f0d7c0f-8250-4ce6-90c7-42abc23da29d',
                  props: { id: '1f0d7c0f-8250-4ce6-90c7-42abc23da29d', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'journal',
                  label: 'dashboard-settings.widget.journal',
                  dndId: '930b7818-13b9-4ab3-843d-c29677fbd0c9',
                  id: '433eff18-15f0-4f8a-a8a5-de6e308022aa',
                  props: {
                    id: '433eff18-15f0-4f8a-a8a5-de6e308022aa',
                    config: {
                      widgetDisplayCondition: '',
                      journalsListId: 'contractor-documents',
                      journalId: 'workspace://SpacesStore/journal-meta-j-journals',
                      journalType: 'journals',
                      journalSettingId: '',
                      onlyLinked: false,
                      customJournalMode: false
                    }
                  }
                },
                {
                  name: 'tasks',
                  label: 'dashboard-settings.widget.tasks',
                  dndId: 'fa5c2f77-c30c-4082-af00-f47534d2f598',
                  id: 'b68cd3d2-6471-475e-84dc-04504dd181e8',
                  props: { id: 'b68cd3d2-6471-475e-84dc-04504dd181e8', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'events-history',
                  label: 'dashboard-settings.widget.events-history',
                  dndId: '125b5b32-5145-4169-9dd0-eb8a844ecb9b',
                  id: '883cee90-cf63-4971-ad65-676b7caa3eb2',
                  props: { id: '883cee90-cf63-4971-ad65-676b7caa3eb2', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '960d5d6e-93bc-4274-90a4-b13b17a03e40',
                  id: '250764c7-cba6-4f6c-bebf-e686498eb6e7',
                  props: { id: '250764c7-cba6-4f6c-bebf-e686498eb6e7', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'doc-constructor',
                  label: 'dashboard-settings.widget.doc-constructor',
                  dndId: '2c476f1f-611c-40e4-aab6-6a314f559dd7',
                  id: '701a542f-0571-44f8-b6d3-97b714f4a75c',
                  props: { id: '701a542f-0571-44f8-b6d3-97b714f4a75c', config: { widgetDisplayCondition: '' } }
                }
              ]
            },
            {
              widgets: [
                {
                  name: 'web-page',
                  label: 'dashboard-settings.widget.web-page',
                  dndId: '3915f10e-994f-4b32-896d-9443c7243729',
                  id: '30902945-ceca-412e-9664-79ba828be482',
                  props: {
                    id: '30902945-ceca-412e-9664-79ba828be482',
                    config: { widgetDisplayCondition: '', url: 'https://www.detmir.ru/', title: 'https://www.detmir.ru/' }
                  }
                },
                {
                  name: 'doc-preview',
                  label: 'dashboard-settings.widget.preview',
                  dndId: '9be1e828-f1ef-4cbc-a825-f3a547061666',
                  id: '42edc16e-53fc-429d-a47d-e0901127d8c7',
                  props: { id: '42edc16e-53fc-429d-a47d-e0901127d8c7', config: { widgetDisplayCondition: '', link: '' } }
                },
                {
                  name: 'properties',
                  label: 'dashboard-settings.widget.properties',
                  dndId: 'c58d2360-34c2-4e0e-b6c7-aa00b8fa04e8',
                  id: 'bdb0d47c-9c5a-4cf8-8cb2-021310f75de7',
                  props: { id: 'bdb0d47c-9c5a-4cf8-8cb2-021310f75de7', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'current-tasks',
                  label: 'dashboard-settings.widget.current-tasks',
                  dndId: '8d11e5e5-c196-4f06-b35f-9e576e289357',
                  id: 'd2b1f87d-4c52-4799-900d-095ee3ca3a34',
                  props: { id: 'd2b1f87d-4c52-4799-900d-095ee3ca3a34', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'doc-status',
                  label: 'dashboard-settings.widget.doc-status',
                  dndId: '0a0779f3-c836-4cf1-aac9-5c67b4f01859',
                  id: '42f6340e-c269-4381-85e2-19133d2f60a5',
                  props: { id: '42f6340e-c269-4381-85e2-19133d2f60a5', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'doc-associations',
                  label: 'dashboard-settings.widget.doc-associations',
                  dndId: '8ec789de-c655-4ebb-b527-c4e5f8e898b4',
                  id: '54580e9b-493a-4abc-9c1b-2d387740cfce',
                  props: { id: '54580e9b-493a-4abc-9c1b-2d387740cfce', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'record-actions',
                  label: 'dashboard-settings.widget.actions',
                  dndId: '0e72a35b-699f-4a52-af4e-04f2a55f6b28',
                  id: 'bd5468d5-fb0a-4f03-b286-c7425ac5d3c0',
                  props: { id: 'bd5468d5-fb0a-4f03-b286-c7425ac5d3c0', config: { widgetDisplayCondition: '' } }
                },
                {
                  name: 'barcode',
                  label: 'dashboard-settings.widget.barcode',
                  dndId: 'c628c11c-3007-4b13-977c-4dd463722bbb',
                  id: '8fc06553-203c-4e04-87d7-ce133dc12d15',
                  props: { id: '8fc06553-203c-4e04-87d7-ce133dc12d15', config: { widgetDisplayCondition: '' } }
                }
              ],
              width: '25%'
            }
          ]
        }
      ],
      mobile: [
        {
          id: 'layout_4aa7fed6-d601-45ae-9b26-a1d896646afd',
          tab: { label: 'Вкладка 1', idLayout: 'layout_4aa7fed6-d601-45ae-9b26-a1d896646afd' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '892a87c8-0bbd-4bf0-9bd6-72da1584f1bf',
                  id: '7656cb22-d23a-4b94-a847-d845e085e778',
                  props: {
                    id: '7656cb22-d23a-4b94-a847-d845e085e778',
                    config: {
                      widgetDisplayCondition: '',
                      types: [
                        { type: 'emodel/type@base', multiple: false, mandatory: false, canUpload: true },
                        { type: 'emodel/type@file-import-task', multiple: false, mandatory: false, canUpload: true },
                        { type: 'emodel/type@menu', multiple: false, mandatory: false, canUpload: true }
                      ],
                      isLoadChecklist: true
                    }
                  }
                }
              ]
            }
          ]
        }
      ],
      version: 'v2',
      v2: {
        mobile: [
          {
            id: 'layout_4aa7fed6-d601-45ae-9b26-a1d896646afd',
            tab: { label: 'Вкладка 1', idLayout: 'layout_4aa7fed6-d601-45ae-9b26-a1d896646afd' },
            type: 'mobile',
            columns: [
              {
                widgets: [
                  {
                    name: 'documents',
                    label: 'dashboard-settings.widget.documents',
                    dndId: '892a87c8-0bbd-4bf0-9bd6-72da1584f1bf',
                    id: '7656cb22-d23a-4b94-a847-d845e085e778',
                    props: {
                      id: '7656cb22-d23a-4b94-a847-d845e085e778',
                      config: {
                        widgetDisplayCondition: '',
                        types: [
                          { type: 'emodel/type@base', multiple: false, mandatory: false, canUpload: true },
                          { type: 'emodel/type@file-import-task', multiple: false, mandatory: false, canUpload: true },
                          { type: 'emodel/type@menu', multiple: false, mandatory: false, canUpload: true }
                        ],
                        isLoadChecklist: true
                      }
                    }
                  }
                ]
              }
            ]
          }
        ],
        desktop: [
          {
            id: 'layout_799ac5e5-9eab-4c08-af80-5ed48d768229',
            tab: { label: 'Основное', idLayout: 'layout_799ac5e5-9eab-4c08-af80-5ed48d768229' },
            type: '2-columns-big-small-with-footer',
            columns: [
              [
                {
                  widgets: [
                    'd5b4372a-cb41-4370-b66e-5580a52aaa6f',
                    '68279cb4-8710-4f47-b766-16a29bd48514',
                    '291afa3a-50c1-4a3a-9700-8b85767926af',
                    '921c9b5b-2d6c-49a2-9aad-c2c0f2841ade'
                  ]
                },
                {
                  widgets: [
                    '272cf8b6-6652-4cea-8986-5757acc9e7cb',
                    '6d9d1e54-0c77-4990-9aed-228bec1614f4',
                    '6cb0726f-07c2-4388-84bc-6651823e2ba9',
                    'c0a9aeee-a536-400d-ae80-326e77ce5202',
                    'c726daad-06e9-4636-b4b1-7d7ee73c101c',
                    '46b2bc89-1502-4959-8c2b-2a105c6c61a5'
                  ],
                  width: '25%'
                }
              ],
              [{ widgets: ['3934417c-8ef9-4064-96b0-f5b7f93d90bd', '1ab254c7-6bc7-421c-ba90-da266648c22e'] }]
            ]
          },
          {
            id: 'layout_35cd006c-9ae1-4148-9e25-3a78989fd690',
            tab: { label: 'Документы', idLayout: 'layout_35cd006c-9ae1-4148-9e25-3a78989fd690' },
            type: '1-column',
            columns: [{ widgets: ['52481d7d-b3a8-4291-bda2-bb3826d90493'] }]
          },
          {
            id: 'layout_0c2838b6-1205-4c64-b3cd-a2022ae7c40d',
            tab: { label: 'empty', idLayout: 'layout_0c2838b6-1205-4c64-b3cd-a2022ae7c40d' },
            type: '2-columns-big-small',
            columns: [{ widgets: [] }, { widgets: [], width: '25%' }]
          },
          {
            id: 'layout_6fb20286-5d7c-4119-9d18-92ecc5ab6df5',
            tab: { label: 'test', idLayout: 'layout_6fb20286-5d7c-4119-9d18-92ecc5ab6df5' },
            type: '2-columns-big-small',
            columns: [
              {
                widgets: [
                  'cef64316-9c9a-4f15-a67f-c92bb484987a',
                  '11adfea8-5582-4234-97f2-dcbccfbeecb6',
                  '1f0d7c0f-8250-4ce6-90c7-42abc23da29d',
                  '433eff18-15f0-4f8a-a8a5-de6e308022aa',
                  'b68cd3d2-6471-475e-84dc-04504dd181e8',
                  '883cee90-cf63-4971-ad65-676b7caa3eb2',
                  '250764c7-cba6-4f6c-bebf-e686498eb6e7',
                  '701a542f-0571-44f8-b6d3-97b714f4a75c'
                ]
              },
              {
                widgets: [
                  '30902945-ceca-412e-9664-79ba828be482',
                  '42edc16e-53fc-429d-a47d-e0901127d8c7',
                  'bdb0d47c-9c5a-4cf8-8cb2-021310f75de7',
                  'd2b1f87d-4c52-4799-900d-095ee3ca3a34',
                  '42f6340e-c269-4381-85e2-19133d2f60a5',
                  '54580e9b-493a-4abc-9c1b-2d387740cfce',
                  'bd5468d5-fb0a-4f03-b286-c7425ac5d3c0',
                  '8fc06553-203c-4e04-87d7-ce133dc12d15'
                ],
                width: '25%'
              }
            ]
          }
        ],
        widgets: [
          {
            dndId: '077bcf0e-5f7e-4f6d-abca-f996d243ea1d',
            name: 'tasks',
            label: 'dashboard-settings.widget.tasks',
            id: 'd5b4372a-cb41-4370-b66e-5580a52aaa6f',
            props: { id: 'd5b4372a-cb41-4370-b66e-5580a52aaa6f', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'properties',
            label: 'dashboard-settings.widget.properties',
            dndId: '5da54e6e-674e-43af-b1ec-c54d594ea296',
            id: '68279cb4-8710-4f47-b766-16a29bd48514',
            props: {
              id: '68279cb4-8710-4f47-b766-16a29bd48514',
              config: { widgetDisplayCondition: '', formId: null, titleAsFormName: false }
            }
          },
          {
            dndId: 'aa0deb44-527e-4244-85cc-89757c0e07eb',
            name: 'comments',
            label: 'dashboard-settings.widget.comments',
            id: '291afa3a-50c1-4a3a-9700-8b85767926af',
            props: { id: '291afa3a-50c1-4a3a-9700-8b85767926af', config: { widgetDisplayCondition: '' } }
          },
          {
            dndId: '0d0dfc44-20ca-482b-adb8-61aa346a0913',
            name: 'doc-preview',
            label: 'dashboard-settings.widget.preview',
            id: '921c9b5b-2d6c-49a2-9aad-c2c0f2841ade',
            props: { id: '921c9b5b-2d6c-49a2-9aad-c2c0f2841ade', config: { widgetDisplayCondition: '', link: '' } }
          },
          {
            name: 'doc-status',
            label: 'dashboard-settings.widget.doc-status',
            dndId: '0a4f8d1e-7074-41b6-9702-01b63faa26d6',
            id: '272cf8b6-6652-4cea-8986-5757acc9e7cb',
            props: { id: '272cf8b6-6652-4cea-8986-5757acc9e7cb', config: { widgetDisplayCondition: '' } }
          },
          {
            dndId: '68d2228b-5972-4b90-b465-d317e5f3d0a6',
            name: 'current-tasks',
            label: 'dashboard-settings.widget.current-tasks',
            id: '6d9d1e54-0c77-4990-9aed-228bec1614f4',
            props: { id: '6d9d1e54-0c77-4990-9aed-228bec1614f4', config: { widgetDisplayCondition: '' } }
          },
          {
            dndId: '8ecb125c-7a47-4d3b-b871-5868fbe76498',
            name: 'record-actions',
            label: 'dashboard-settings.widget.actions',
            id: '6cb0726f-07c2-4388-84bc-6651823e2ba9',
            props: { id: '6cb0726f-07c2-4388-84bc-6651823e2ba9', config: { widgetDisplayCondition: '' } }
          },
          {
            dndId: '951e31ba-70c0-4cab-988b-9d271cfa3632',
            name: 'doc-associations',
            label: 'dashboard-settings.widget.doc-associations',
            id: 'c0a9aeee-a536-400d-ae80-326e77ce5202',
            props: { id: 'c0a9aeee-a536-400d-ae80-326e77ce5202', config: { widgetDisplayCondition: '' } }
          },
          {
            dndId: '667f668d-b568-4914-84a8-475f122d98f4',
            name: 'versions-journal',
            label: 'dashboard-settings.widget.versions-journal',
            id: 'c726daad-06e9-4636-b4b1-7d7ee73c101c',
            props: { id: 'c726daad-06e9-4636-b4b1-7d7ee73c101c', config: { widgetDisplayCondition: '' } }
          },
          {
            dndId: '4f314f37-e0df-4df3-970a-b1fa6c545c2e',
            name: 'barcode',
            label: 'dashboard-settings.widget.barcode',
            id: '46b2bc89-1502-4959-8c2b-2a105c6c61a5',
            props: {
              id: '46b2bc89-1502-4959-8c2b-2a105c6c61a5',
              config: { widgetDisplayCondition: '', settings: { scale: 500, top: 20, left: 20, right: 200, bottom: 50, type: 'code-128' } }
            }
          },
          {
            name: 'documents',
            label: 'dashboard-settings.widget.documents',
            dndId: 'f5cb90ee-fecb-483d-836a-930d07853804',
            id: '3934417c-8ef9-4064-96b0-f5b7f93d90bd',
            props: {
              id: '3934417c-8ef9-4064-96b0-f5b7f93d90bd',
              config: {
                widgetDisplayCondition: '',
                types: [
                  { type: 'emodel/type@category-document-type/kind-d-scan-documents', multiple: true, mandatory: true },
                  { type: 'emodel/type@category-document-type/kind-d-counterparty-documents', multiple: true, mandatory: true },
                  { type: 'emodel/type@category-document-type/cat-document-accounting-documents', multiple: false, mandatory: false }
                ],
                isLoadChecklist: true,
                isPossibleUploadFile: true
              }
            }
          },
          {
            dndId: '7569abc1-0015-49da-a9de-1cfb0f42096e',
            name: 'events-history',
            label: 'dashboard-settings.widget.events-history',
            id: '1ab254c7-6bc7-421c-ba90-da266648c22e',
            props: { id: '1ab254c7-6bc7-421c-ba90-da266648c22e', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'documents',
            label: 'dashboard-settings.widget.documents',
            dndId: '8137728d-f75c-441d-9ec4-95e1d110a763',
            id: '52481d7d-b3a8-4291-bda2-bb3826d90493',
            props: {
              id: '52481d7d-b3a8-4291-bda2-bb3826d90493',
              config: {
                widgetDisplayCondition: '',
                types: [
                  { type: 'emodel/type@ecos-fin-request-attachments', multiple: false, mandatory: false, canUpload: true },
                  { type: 'emodel/type@category-document-type/kind-d-scan-documents', multiple: true, mandatory: true, canUpload: true },
                  { type: 'emodel/type@category-document-type/cat-document-other', multiple: true, mandatory: true, canUpload: true }
                ],
                isLoadChecklist: true
              }
            }
          },
          {
            name: 'doc-status',
            label: 'dashboard-settings.widget.doc-status',
            dndId: 'd83ac567-ade7-4a41-98da-a39ab0ff9963',
            id: 'cef64316-9c9a-4f15-a67f-c92bb484987a',
            props: { id: 'cef64316-9c9a-4f15-a67f-c92bb484987a', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'comments',
            label: 'dashboard-settings.widget.comments',
            dndId: '369099e0-f27e-4573-a1ba-21336a5b38c6',
            id: '11adfea8-5582-4234-97f2-dcbccfbeecb6',
            props: { id: '11adfea8-5582-4234-97f2-dcbccfbeecb6', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'versions-journal',
            label: 'dashboard-settings.widget.versions-journal',
            dndId: 'b5ac58c4-9705-4c84-bf02-0b03005f7085',
            id: '1f0d7c0f-8250-4ce6-90c7-42abc23da29d',
            props: { id: '1f0d7c0f-8250-4ce6-90c7-42abc23da29d', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'journal',
            label: 'dashboard-settings.widget.journal',
            dndId: '930b7818-13b9-4ab3-843d-c29677fbd0c9',
            id: '433eff18-15f0-4f8a-a8a5-de6e308022aa',
            props: {
              id: '433eff18-15f0-4f8a-a8a5-de6e308022aa',
              config: {
                widgetDisplayCondition: '',
                journalsListId: 'contractor-documents',
                journalId: 'workspace://SpacesStore/journal-meta-j-journals',
                journalType: 'journals',
                journalSettingId: '',
                onlyLinked: false,
                customJournalMode: false
              }
            }
          },
          {
            name: 'tasks',
            label: 'dashboard-settings.widget.tasks',
            dndId: 'fa5c2f77-c30c-4082-af00-f47534d2f598',
            id: 'b68cd3d2-6471-475e-84dc-04504dd181e8',
            props: { id: 'b68cd3d2-6471-475e-84dc-04504dd181e8', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'events-history',
            label: 'dashboard-settings.widget.events-history',
            dndId: '125b5b32-5145-4169-9dd0-eb8a844ecb9b',
            id: '883cee90-cf63-4971-ad65-676b7caa3eb2',
            props: { id: '883cee90-cf63-4971-ad65-676b7caa3eb2', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'documents',
            label: 'dashboard-settings.widget.documents',
            dndId: '960d5d6e-93bc-4274-90a4-b13b17a03e40',
            id: '250764c7-cba6-4f6c-bebf-e686498eb6e7',
            props: { id: '250764c7-cba6-4f6c-bebf-e686498eb6e7', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'doc-constructor',
            label: 'dashboard-settings.widget.doc-constructor',
            dndId: '2c476f1f-611c-40e4-aab6-6a314f559dd7',
            id: '701a542f-0571-44f8-b6d3-97b714f4a75c',
            props: { id: '701a542f-0571-44f8-b6d3-97b714f4a75c', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'web-page',
            label: 'dashboard-settings.widget.web-page',
            dndId: '3915f10e-994f-4b32-896d-9443c7243729',
            id: '30902945-ceca-412e-9664-79ba828be482',
            props: {
              id: '30902945-ceca-412e-9664-79ba828be482',
              config: { widgetDisplayCondition: '', url: 'https://www.detmir.ru/', title: 'https://www.detmir.ru/' }
            }
          },
          {
            name: 'doc-preview',
            label: 'dashboard-settings.widget.preview',
            dndId: '9be1e828-f1ef-4cbc-a825-f3a547061666',
            id: '42edc16e-53fc-429d-a47d-e0901127d8c7',
            props: { id: '42edc16e-53fc-429d-a47d-e0901127d8c7', config: { widgetDisplayCondition: '', link: '' } }
          },
          {
            name: 'properties',
            label: 'dashboard-settings.widget.properties',
            dndId: 'c58d2360-34c2-4e0e-b6c7-aa00b8fa04e8',
            id: 'bdb0d47c-9c5a-4cf8-8cb2-021310f75de7',
            props: { id: 'bdb0d47c-9c5a-4cf8-8cb2-021310f75de7', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'current-tasks',
            label: 'dashboard-settings.widget.current-tasks',
            dndId: '8d11e5e5-c196-4f06-b35f-9e576e289357',
            id: 'd2b1f87d-4c52-4799-900d-095ee3ca3a34',
            props: { id: 'd2b1f87d-4c52-4799-900d-095ee3ca3a34', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'doc-status',
            label: 'dashboard-settings.widget.doc-status',
            dndId: '0a0779f3-c836-4cf1-aac9-5c67b4f01859',
            id: '42f6340e-c269-4381-85e2-19133d2f60a5',
            props: { id: '42f6340e-c269-4381-85e2-19133d2f60a5', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'doc-associations',
            label: 'dashboard-settings.widget.doc-associations',
            dndId: '8ec789de-c655-4ebb-b527-c4e5f8e898b4',
            id: '54580e9b-493a-4abc-9c1b-2d387740cfce',
            props: { id: '54580e9b-493a-4abc-9c1b-2d387740cfce', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'record-actions',
            label: 'dashboard-settings.widget.actions',
            dndId: '0e72a35b-699f-4a52-af4e-04f2a55f6b28',
            id: 'bd5468d5-fb0a-4f03-b286-c7425ac5d3c0',
            props: { id: 'bd5468d5-fb0a-4f03-b286-c7425ac5d3c0', config: { widgetDisplayCondition: '' } }
          },
          {
            name: 'barcode',
            label: 'dashboard-settings.widget.barcode',
            dndId: 'c628c11c-3007-4b13-977c-4dd463722bbb',
            id: '8fc06553-203c-4e04-87d7-ce133dc12d15',
            props: { id: '8fc06553-203c-4e04-87d7-ce133dc12d15', config: { widgetDisplayCondition: '' } }
          }
        ]
      }
    }
  ],
  [
    {
      layouts: [
        {
          id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
          tab: { label: 'Вкладка', idLayout: 'layout_0ecdb374-d44f-47ce-a130-901047237da9' },
          type: '2-columns-big-small',
          columns: [
            {
              widgets: [
                {
                  name: 'current-tasks',
                  label: 'dashboard-settings.widget.current-tasks',
                  dndId: 'd2f3fc01-d7f0-4db2-8dd6-d71754a7f105',
                  id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
                  props: { id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'barcode',
                  label: 'dashboard-settings.widget.barcode',
                  dndId: 'a84572b6-4fca-4ab5-8ba9-c2b20f880c46',
                  id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
                  props: { id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'doc-constructor',
                  label: 'dashboard-settings.widget.doc-constructor',
                  dndId: '37f24140-8b24-4466-973b-5ac59ea3cf72',
                  id: 'db7ecda2-4645-4285-9d78-d25fa563caef',
                  props: { id: 'db7ecda2-4645-4285-9d78-d25fa563caef', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                }
              ]
            },
            {
              widgets: [
                {
                  name: 'comments',
                  label: 'dashboard-settings.widget.comments',
                  dndId: '29bd4385-216d-4db1-a5bd-8c816e851359',
                  id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc',
                  props: { id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'doc-status',
                  label: 'dashboard-settings.widget.doc-status',
                  dndId: 'ab6726f7-4992-4087-a1e4-52a8f7f968da',
                  id: '8be5eae5-a476-41d9-a457-3fee665173d5',
                  props: { id: '8be5eae5-a476-41d9-a457-3fee665173d5', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                }
              ],
              width: '25%'
            }
          ]
        },
        {
          id: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32',
          tab: { label: 'Вкладка 2', idLayout: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32' },
          type: '3-columns-center-big-with-footer',
          columns: [
            [
              { widgets: [], width: '20%' },
              {
                widgets: [
                  {
                    name: 'doc-associations',
                    label: 'dashboard-settings.widget.doc-associations',
                    dndId: '99bffe20-cc46-45ed-8230-18833fff3bc3',
                    id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce',
                    props: { id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce', config: { widgetDisplayCondition: '' } },
                    description: 'Вкладка 2'
                  }
                ]
              },
              { widgets: [], width: '20%' }
            ],
            [{ widgets: [] }]
          ]
        },
        {
          id: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219',
          tab: { label: 'ups', idLayout: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219' },
          type: 'classic-site',
          columns: [
            [
              {
                widgets: [
                  {
                    name: 'current-tasks',
                    label: 'dashboard-settings.widget.current-tasks',
                    dndId: 'd52d0cb3-4f53-41e8-896d-ec8e28aae5d2',
                    id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc',
                    props: { id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  }
                ]
              }
            ],
            [
              {
                widgets: [
                  {
                    name: 'comments',
                    label: 'dashboard-settings.widget.comments',
                    dndId: '1a0a2d2d-5d51-412b-b959-d8041979fa6b',
                    id: '7d9b1829-478f-42ba-9a55-b85e3d45034d',
                    props: { id: '7d9b1829-478f-42ba-9a55-b85e3d45034d', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  }
                ]
              },
              {
                widgets: [
                  {
                    name: 'web-page',
                    label: 'dashboard-settings.widget.web-page',
                    dndId: 'ae259be0-486e-4ccb-94f0-97a292c343c9',
                    id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                    props: {
                      id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                      config: { widgetDisplayCondition: '', url: 'https://www.vesti.ru/', title: 'vesti' }
                    },
                    description: 'ups'
                  }
                ]
              },
              {
                widgets: [
                  {
                    name: 'record-actions',
                    label: 'dashboard-settings.widget.actions',
                    dndId: 'd63c9c5c-6c3f-4b7c-8ada-f12adac762d4',
                    id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc',
                    props: { id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  },
                  {
                    name: 'barcode',
                    label: 'dashboard-settings.widget.barcode',
                    dndId: 'dde2ca94-6ddb-48d4-b0bd-7a44eb6a140c',
                    id: '7ed30684-ac30-48bc-a316-821abe964996',
                    props: { id: '7ed30684-ac30-48bc-a316-821abe964996', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  }
                ]
              }
            ],
            [
              {
                widgets: [
                  {
                    name: 'documents',
                    label: 'dashboard-settings.widget.documents',
                    dndId: '3e3df126-c86d-4861-ae9b-6659f2b69fed',
                    id: '9197fbec-0842-4dda-835b-949ab7bed0c4',
                    props: { id: '9197fbec-0842-4dda-835b-949ab7bed0c4', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  }
                ]
              }
            ]
          ]
        },
        {
          id: 'layout_d8affa56-f386-497c-a416-71b2d4bd06e3',
          tab: { label: 'test', idLayout: 'layout_d8affa56-f386-497c-a416-71b2d4bd06e3' },
          type: '2-columns-big-small',
          columns: [
            {
              widgets: [
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '5e25a9d6-e410-46ab-a5fc-9ccf23537acb',
                  id: '2603f06a-3e4d-4fd9-b9e3-238a44f9e72c',
                  props: { id: '2603f06a-3e4d-4fd9-b9e3-238a44f9e72c', config: { widgetDisplayCondition: '' } }
                }
              ]
            },
            { widgets: [], width: '25%' }
          ]
        }
      ],
      mobile: [
        {
          id: 'layout_5484100d-3a73-4238-8542-8337cace4969',
          tab: { label: 'test', idLayout: 'layout_5484100d-3a73-4238-8542-8337cace4969' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '84f3bf6b-21f7-4117-bfba-d1a09c4de787',
                  id: 'd6503c57-edc8-4ede-b62f-d73494e59df3',
                  props: { id: 'd6503c57-edc8-4ede-b62f-d73494e59df3', config: { widgetDisplayCondition: '' } }
                }
              ]
            }
          ]
        },
        {
          id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
          tab: { label: 'Вкладка', idLayout: 'layout_0ecdb374-d44f-47ce-a130-901047237da9' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'current-tasks',
                  label: 'dashboard-settings.widget.current-tasks',
                  dndId: 'd2f3fc01-d7f0-4db2-8dd6-d71754a7f105',
                  id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
                  props: { id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'barcode',
                  label: 'dashboard-settings.widget.barcode',
                  dndId: 'a84572b6-4fca-4ab5-8ba9-c2b20f880c46',
                  id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
                  props: { id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'doc-constructor',
                  label: 'dashboard-settings.widget.doc-constructor',
                  dndId: '37f24140-8b24-4466-973b-5ac59ea3cf72',
                  id: 'db7ecda2-4645-4285-9d78-d25fa563caef',
                  props: { id: 'db7ecda2-4645-4285-9d78-d25fa563caef', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'comments',
                  label: 'dashboard-settings.widget.comments',
                  dndId: '29bd4385-216d-4db1-a5bd-8c816e851359',
                  id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc',
                  props: { id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'doc-status',
                  label: 'dashboard-settings.widget.doc-status',
                  dndId: 'ab6726f7-4992-4087-a1e4-52a8f7f968da',
                  id: '8be5eae5-a476-41d9-a457-3fee665173d5',
                  props: { id: '8be5eae5-a476-41d9-a457-3fee665173d5', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                }
              ]
            }
          ]
        },
        {
          id: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32',
          tab: { label: 'Вкладка 2', idLayout: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'doc-associations',
                  label: 'dashboard-settings.widget.doc-associations',
                  dndId: '99bffe20-cc46-45ed-8230-18833fff3bc3',
                  id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce',
                  props: { id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка 2'
                }
              ]
            }
          ]
        },
        {
          id: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219',
          tab: { label: 'ups', idLayout: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'current-tasks',
                  label: 'dashboard-settings.widget.current-tasks',
                  dndId: 'd52d0cb3-4f53-41e8-896d-ec8e28aae5d2',
                  id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc',
                  props: { id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                },
                {
                  name: 'comments',
                  label: 'dashboard-settings.widget.comments',
                  dndId: '1a0a2d2d-5d51-412b-b959-d8041979fa6b',
                  id: '7d9b1829-478f-42ba-9a55-b85e3d45034d',
                  props: { id: '7d9b1829-478f-42ba-9a55-b85e3d45034d', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                },
                {
                  name: 'web-page',
                  label: 'dashboard-settings.widget.web-page',
                  dndId: 'ae259be0-486e-4ccb-94f0-97a292c343c9',
                  id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                  props: {
                    id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                    config: { widgetDisplayCondition: '', url: 'https://tass.ru/', title: 'tass.ru - 77' }
                  },
                  description: 'ups'
                },
                {
                  name: 'record-actions',
                  label: 'dashboard-settings.widget.actions',
                  dndId: 'd63c9c5c-6c3f-4b7c-8ada-f12adac762d4',
                  id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc',
                  props: { id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                },
                {
                  name: 'barcode',
                  label: 'dashboard-settings.widget.barcode',
                  dndId: 'dde2ca94-6ddb-48d4-b0bd-7a44eb6a140c',
                  id: '7ed30684-ac30-48bc-a316-821abe964996',
                  props: { id: '7ed30684-ac30-48bc-a316-821abe964996', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                },
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '3e3df126-c86d-4861-ae9b-6659f2b69fed',
                  id: '9197fbec-0842-4dda-835b-949ab7bed0c4',
                  props: { id: '9197fbec-0842-4dda-835b-949ab7bed0c4', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                }
              ]
            }
          ]
        }
      ],
      v2: {
        widgets: [
          {
            name: 'current-tasks',
            label: 'dashboard-settings.widget.current-tasks',
            dndId: 'd2f3fc01-d7f0-4db2-8dd6-d71754a7f105',
            id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
            props: { id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'barcode',
            label: 'dashboard-settings.widget.barcode',
            dndId: 'a84572b6-4fca-4ab5-8ba9-c2b20f880c46',
            id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
            props: { id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'doc-constructor',
            label: 'dashboard-settings.widget.doc-constructor',
            dndId: '37f24140-8b24-4466-973b-5ac59ea3cf72',
            id: 'db7ecda2-4645-4285-9d78-d25fa563caef',
            props: { id: 'db7ecda2-4645-4285-9d78-d25fa563caef', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'comments',
            label: 'dashboard-settings.widget.comments',
            dndId: '29bd4385-216d-4db1-a5bd-8c816e851359',
            id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc',
            props: { id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'doc-status',
            label: 'dashboard-settings.widget.doc-status',
            dndId: 'ab6726f7-4992-4087-a1e4-52a8f7f968da',
            id: '8be5eae5-a476-41d9-a457-3fee665173d5',
            props: { id: '8be5eae5-a476-41d9-a457-3fee665173d5', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'doc-associations',
            label: 'dashboard-settings.widget.doc-associations',
            dndId: '99bffe20-cc46-45ed-8230-18833fff3bc3',
            id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce',
            props: { id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка 2'
          },
          {
            name: 'current-tasks',
            label: 'dashboard-settings.widget.current-tasks',
            dndId: 'd52d0cb3-4f53-41e8-896d-ec8e28aae5d2',
            id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc',
            props: { id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'comments',
            label: 'dashboard-settings.widget.comments',
            dndId: '1a0a2d2d-5d51-412b-b959-d8041979fa6b',
            id: '7d9b1829-478f-42ba-9a55-b85e3d45034d',
            props: { id: '7d9b1829-478f-42ba-9a55-b85e3d45034d', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'web-page',
            label: 'dashboard-settings.widget.web-page',
            dndId: 'ae259be0-486e-4ccb-94f0-97a292c343c9',
            id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
            props: {
              id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
              config: { widgetDisplayCondition: '', url: 'https://www.vesti.ru/', title: 'vesti' }
            },
            description: 'ups'
          },
          {
            name: 'record-actions',
            label: 'dashboard-settings.widget.actions',
            dndId: 'd63c9c5c-6c3f-4b7c-8ada-f12adac762d4',
            id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc',
            props: { id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'barcode',
            label: 'dashboard-settings.widget.barcode',
            dndId: 'dde2ca94-6ddb-48d4-b0bd-7a44eb6a140c',
            id: '7ed30684-ac30-48bc-a316-821abe964996',
            props: { id: '7ed30684-ac30-48bc-a316-821abe964996', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'documents',
            label: 'dashboard-settings.widget.documents',
            dndId: '3e3df126-c86d-4861-ae9b-6659f2b69fed',
            id: '9197fbec-0842-4dda-835b-949ab7bed0c4',
            props: { id: '9197fbec-0842-4dda-835b-949ab7bed0c4', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'documents',
            label: 'dashboard-settings.widget.documents',
            dndId: '5e25a9d6-e410-46ab-a5fc-9ccf23537acb',
            id: '2603f06a-3e4d-4fd9-b9e3-238a44f9e72c',
            props: { id: '2603f06a-3e4d-4fd9-b9e3-238a44f9e72c', config: { widgetDisplayCondition: '' } },
            description: 'test'
          }
        ],
        desktop: [
          {
            id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
            tab: { label: 'Вкладка', idLayout: 'layout_0ecdb374-d44f-47ce-a130-901047237da9' },
            type: '2-columns-big-small',
            columns: [
              {
                widgets: [
                  '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
                  'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
                  'db7ecda2-4645-4285-9d78-d25fa563caef'
                ]
              },
              { widgets: ['0cf75efa-30f8-470a-b9aa-5e13d18b96cc', '8be5eae5-a476-41d9-a457-3fee665173d5'], width: '25%' }
            ]
          },
          {
            id: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32',
            tab: { label: 'Вкладка 2', idLayout: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32' },
            type: '3-columns-center-big-with-footer',
            columns: [
              [{ widgets: [], width: '20%' }, { widgets: ['78ad6b4e-b191-4522-83eb-aa966fdd7cce'] }, { widgets: [], width: '20%' }],
              [{ widgets: [] }]
            ]
          },
          {
            id: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219',
            tab: { label: 'ups', idLayout: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219' },
            type: 'classic-site',
            columns: [
              [{ widgets: ['d8fe3456-9bae-4902-b7cd-031fbc8e40cc'] }],
              [
                { widgets: ['7d9b1829-478f-42ba-9a55-b85e3d45034d'] },
                { widgets: ['568f40b4-e0f2-42f5-ba18-bd7507319d1b'] },
                { widgets: ['51762b29-fa0b-477a-948e-c6cb65ccc3fc', '7ed30684-ac30-48bc-a316-821abe964996'] }
              ],
              [{ widgets: ['9197fbec-0842-4dda-835b-949ab7bed0c4'] }]
            ]
          },
          {
            id: 'layout_d8affa56-f386-497c-a416-71b2d4bd06e3',
            tab: { label: 'test', idLayout: 'layout_d8affa56-f386-497c-a416-71b2d4bd06e3' },
            type: '2-columns-big-small',
            columns: [{ widgets: ['2603f06a-3e4d-4fd9-b9e3-238a44f9e72c'] }, { widgets: [], width: '25%' }]
          }
        ],
        mobile: [
          {
            id: 'layout_5484100d-3a73-4238-8542-8337cace4969',
            tab: { label: 'test', idLayout: 'layout_5484100d-3a73-4238-8542-8337cace4969' },
            type: 'mobile',
            columns: [{ widgets: ['9197fbec-0842-4dda-835b-949ab7bed0c4'] }]
          },
          {
            id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
            tab: { label: 'Вкладка', idLayout: 'layout_0ecdb374-d44f-47ce-a130-901047237da9' },
            type: 'mobile',
            columns: [
              {
                widgets: [
                  '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
                  'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
                  'db7ecda2-4645-4285-9d78-d25fa563caef',
                  '0cf75efa-30f8-470a-b9aa-5e13d18b96cc',
                  '8be5eae5-a476-41d9-a457-3fee665173d5'
                ]
              }
            ]
          },
          {
            id: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32',
            tab: { label: 'Вкладка 2', idLayout: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32' },
            type: 'mobile',
            columns: [{ widgets: ['78ad6b4e-b191-4522-83eb-aa966fdd7cce'] }]
          },
          {
            id: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219',
            tab: { label: 'ups', idLayout: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219' },
            type: 'mobile',
            columns: [
              {
                widgets: [
                  'd8fe3456-9bae-4902-b7cd-031fbc8e40cc',
                  '7d9b1829-478f-42ba-9a55-b85e3d45034d',
                  '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                  '51762b29-fa0b-477a-948e-c6cb65ccc3fc',
                  '7ed30684-ac30-48bc-a316-821abe964996',
                  '9197fbec-0842-4dda-835b-949ab7bed0c4'
                ]
              }
            ]
          }
        ]
      },
      version: 'v2'
    },
    {
      layouts: [
        {
          id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
          tab: { label: 'Вкладка', idLayout: 'layout_0ecdb374-d44f-47ce-a130-901047237da9' },
          type: '2-columns-big-small',
          columns: [
            {
              widgets: [
                {
                  name: 'current-tasks',
                  label: 'dashboard-settings.widget.current-tasks',
                  dndId: 'd2f3fc01-d7f0-4db2-8dd6-d71754a7f105',
                  id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
                  props: { id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'barcode',
                  label: 'dashboard-settings.widget.barcode',
                  dndId: 'a84572b6-4fca-4ab5-8ba9-c2b20f880c46',
                  id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
                  props: { id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'doc-constructor',
                  label: 'dashboard-settings.widget.doc-constructor',
                  dndId: '37f24140-8b24-4466-973b-5ac59ea3cf72',
                  id: 'db7ecda2-4645-4285-9d78-d25fa563caef',
                  props: { id: 'db7ecda2-4645-4285-9d78-d25fa563caef', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                }
              ]
            },
            {
              widgets: [
                {
                  name: 'comments',
                  label: 'dashboard-settings.widget.comments',
                  dndId: '29bd4385-216d-4db1-a5bd-8c816e851359',
                  id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc',
                  props: { id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'doc-status',
                  label: 'dashboard-settings.widget.doc-status',
                  dndId: 'ab6726f7-4992-4087-a1e4-52a8f7f968da',
                  id: '8be5eae5-a476-41d9-a457-3fee665173d5',
                  props: { id: '8be5eae5-a476-41d9-a457-3fee665173d5', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                }
              ],
              width: '25%'
            }
          ]
        },
        {
          id: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32',
          tab: { label: 'Вкладка 2', idLayout: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32' },
          type: '3-columns-center-big-with-footer',
          columns: [
            [
              { widgets: [], width: '20%' },
              {
                widgets: [
                  {
                    name: 'doc-associations',
                    label: 'dashboard-settings.widget.doc-associations',
                    dndId: '99bffe20-cc46-45ed-8230-18833fff3bc3',
                    id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce',
                    props: { id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce', config: { widgetDisplayCondition: '' } },
                    description: 'Вкладка 2'
                  }
                ]
              },
              { widgets: [], width: '20%' }
            ],
            [{ widgets: [] }]
          ]
        },
        {
          id: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219',
          tab: { label: 'ups', idLayout: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219' },
          type: 'classic-site',
          columns: [
            [
              {
                widgets: [
                  {
                    name: 'current-tasks',
                    label: 'dashboard-settings.widget.current-tasks',
                    dndId: 'd52d0cb3-4f53-41e8-896d-ec8e28aae5d2',
                    id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc',
                    props: { id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  }
                ]
              }
            ],
            [
              {
                widgets: [
                  {
                    name: 'comments',
                    label: 'dashboard-settings.widget.comments',
                    dndId: '1a0a2d2d-5d51-412b-b959-d8041979fa6b',
                    id: '7d9b1829-478f-42ba-9a55-b85e3d45034d',
                    props: { id: '7d9b1829-478f-42ba-9a55-b85e3d45034d', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  }
                ]
              },
              {
                widgets: [
                  {
                    name: 'web-page',
                    label: 'dashboard-settings.widget.web-page',
                    dndId: 'ae259be0-486e-4ccb-94f0-97a292c343c9',
                    id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                    props: {
                      id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                      config: { widgetDisplayCondition: '', url: 'https://www.vesti.ru/', title: 'vesti' }
                    },
                    description: 'ups'
                  }
                ]
              },
              {
                widgets: [
                  {
                    name: 'record-actions',
                    label: 'dashboard-settings.widget.actions',
                    dndId: 'd63c9c5c-6c3f-4b7c-8ada-f12adac762d4',
                    id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc',
                    props: { id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  },
                  {
                    name: 'barcode',
                    label: 'dashboard-settings.widget.barcode',
                    dndId: 'dde2ca94-6ddb-48d4-b0bd-7a44eb6a140c',
                    id: '7ed30684-ac30-48bc-a316-821abe964996',
                    props: { id: '7ed30684-ac30-48bc-a316-821abe964996', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  }
                ]
              }
            ],
            [
              {
                widgets: [
                  {
                    name: 'documents',
                    label: 'dashboard-settings.widget.documents',
                    dndId: '3e3df126-c86d-4861-ae9b-6659f2b69fed',
                    id: '9197fbec-0842-4dda-835b-949ab7bed0c4',
                    props: { id: '9197fbec-0842-4dda-835b-949ab7bed0c4', config: { widgetDisplayCondition: '' } },
                    description: 'ups'
                  }
                ]
              }
            ]
          ]
        },
        {
          id: 'layout_d8affa56-f386-497c-a416-71b2d4bd06e3',
          tab: { label: 'test', idLayout: 'layout_d8affa56-f386-497c-a416-71b2d4bd06e3' },
          type: '2-columns-big-small',
          columns: [
            {
              widgets: [
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '5e25a9d6-e410-46ab-a5fc-9ccf23537acb',
                  id: '2603f06a-3e4d-4fd9-b9e3-238a44f9e72c',
                  props: { id: '2603f06a-3e4d-4fd9-b9e3-238a44f9e72c', config: { widgetDisplayCondition: '' } }
                }
              ]
            },
            { widgets: [], width: '25%' }
          ]
        }
      ],
      mobile: [
        {
          id: 'layout_5484100d-3a73-4238-8542-8337cace4969',
          tab: { label: 'test', idLayout: 'layout_5484100d-3a73-4238-8542-8337cace4969' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '84f3bf6b-21f7-4117-bfba-d1a09c4de787',
                  id: 'd6503c57-edc8-4ede-b62f-d73494e59df3',
                  props: { id: 'd6503c57-edc8-4ede-b62f-d73494e59df3', config: { widgetDisplayCondition: '' } }
                }
              ]
            }
          ]
        },
        {
          id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
          tab: { label: 'Вкладка', idLayout: 'layout_0ecdb374-d44f-47ce-a130-901047237da9' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'current-tasks',
                  label: 'dashboard-settings.widget.current-tasks',
                  dndId: 'd2f3fc01-d7f0-4db2-8dd6-d71754a7f105',
                  id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
                  props: { id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'barcode',
                  label: 'dashboard-settings.widget.barcode',
                  dndId: 'a84572b6-4fca-4ab5-8ba9-c2b20f880c46',
                  id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
                  props: { id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'doc-constructor',
                  label: 'dashboard-settings.widget.doc-constructor',
                  dndId: '37f24140-8b24-4466-973b-5ac59ea3cf72',
                  id: 'db7ecda2-4645-4285-9d78-d25fa563caef',
                  props: { id: 'db7ecda2-4645-4285-9d78-d25fa563caef', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'comments',
                  label: 'dashboard-settings.widget.comments',
                  dndId: '29bd4385-216d-4db1-a5bd-8c816e851359',
                  id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc',
                  props: { id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                },
                {
                  name: 'doc-status',
                  label: 'dashboard-settings.widget.doc-status',
                  dndId: 'ab6726f7-4992-4087-a1e4-52a8f7f968da',
                  id: '8be5eae5-a476-41d9-a457-3fee665173d5',
                  props: { id: '8be5eae5-a476-41d9-a457-3fee665173d5', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка'
                }
              ]
            }
          ]
        },
        {
          id: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32',
          tab: { label: 'Вкладка 2', idLayout: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'doc-associations',
                  label: 'dashboard-settings.widget.doc-associations',
                  dndId: '99bffe20-cc46-45ed-8230-18833fff3bc3',
                  id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce',
                  props: { id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce', config: { widgetDisplayCondition: '' } },
                  description: 'Вкладка 2'
                }
              ]
            }
          ]
        },
        {
          id: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219',
          tab: { label: 'ups', idLayout: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219' },
          type: 'mobile',
          columns: [
            {
              widgets: [
                {
                  name: 'current-tasks',
                  label: 'dashboard-settings.widget.current-tasks',
                  dndId: 'd52d0cb3-4f53-41e8-896d-ec8e28aae5d2',
                  id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc',
                  props: { id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                },
                {
                  name: 'comments',
                  label: 'dashboard-settings.widget.comments',
                  dndId: '1a0a2d2d-5d51-412b-b959-d8041979fa6b',
                  id: '7d9b1829-478f-42ba-9a55-b85e3d45034d',
                  props: { id: '7d9b1829-478f-42ba-9a55-b85e3d45034d', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                },
                {
                  name: 'web-page',
                  label: 'dashboard-settings.widget.web-page',
                  dndId: 'ae259be0-486e-4ccb-94f0-97a292c343c9',
                  id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                  props: {
                    id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                    config: { widgetDisplayCondition: '', url: 'https://tass.ru/', title: 'tass.ru - 77' }
                  },
                  description: 'ups'
                },
                {
                  name: 'record-actions',
                  label: 'dashboard-settings.widget.actions',
                  dndId: 'd63c9c5c-6c3f-4b7c-8ada-f12adac762d4',
                  id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc',
                  props: { id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                },
                {
                  name: 'barcode',
                  label: 'dashboard-settings.widget.barcode',
                  dndId: 'dde2ca94-6ddb-48d4-b0bd-7a44eb6a140c',
                  id: '7ed30684-ac30-48bc-a316-821abe964996',
                  props: { id: '7ed30684-ac30-48bc-a316-821abe964996', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                },
                {
                  name: 'documents',
                  label: 'dashboard-settings.widget.documents',
                  dndId: '3e3df126-c86d-4861-ae9b-6659f2b69fed',
                  id: '9197fbec-0842-4dda-835b-949ab7bed0c4',
                  props: { id: '9197fbec-0842-4dda-835b-949ab7bed0c4', config: { widgetDisplayCondition: '' } },
                  description: 'ups'
                }
              ]
            }
          ]
        }
      ],
      v2: {
        widgets: [
          {
            name: 'current-tasks',
            label: 'dashboard-settings.widget.current-tasks',
            dndId: 'd2f3fc01-d7f0-4db2-8dd6-d71754a7f105',
            id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
            props: { id: '4f41d4af-39a9-4421-b5d3-4cadbf4a5577', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'barcode',
            label: 'dashboard-settings.widget.barcode',
            dndId: 'a84572b6-4fca-4ab5-8ba9-c2b20f880c46',
            id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
            props: { id: 'f36f3c68-1c5e-4bee-915e-2b7848fca0eb', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'doc-constructor',
            label: 'dashboard-settings.widget.doc-constructor',
            dndId: '37f24140-8b24-4466-973b-5ac59ea3cf72',
            id: 'db7ecda2-4645-4285-9d78-d25fa563caef',
            props: { id: 'db7ecda2-4645-4285-9d78-d25fa563caef', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'comments',
            label: 'dashboard-settings.widget.comments',
            dndId: '29bd4385-216d-4db1-a5bd-8c816e851359',
            id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc',
            props: { id: '0cf75efa-30f8-470a-b9aa-5e13d18b96cc', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'doc-status',
            label: 'dashboard-settings.widget.doc-status',
            dndId: 'ab6726f7-4992-4087-a1e4-52a8f7f968da',
            id: '8be5eae5-a476-41d9-a457-3fee665173d5',
            props: { id: '8be5eae5-a476-41d9-a457-3fee665173d5', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка'
          },
          {
            name: 'doc-associations',
            label: 'dashboard-settings.widget.doc-associations',
            dndId: '99bffe20-cc46-45ed-8230-18833fff3bc3',
            id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce',
            props: { id: '78ad6b4e-b191-4522-83eb-aa966fdd7cce', config: { widgetDisplayCondition: '' } },
            description: 'Вкладка 2'
          },
          {
            name: 'current-tasks',
            label: 'dashboard-settings.widget.current-tasks',
            dndId: 'd52d0cb3-4f53-41e8-896d-ec8e28aae5d2',
            id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc',
            props: { id: 'd8fe3456-9bae-4902-b7cd-031fbc8e40cc', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'comments',
            label: 'dashboard-settings.widget.comments',
            dndId: '1a0a2d2d-5d51-412b-b959-d8041979fa6b',
            id: '7d9b1829-478f-42ba-9a55-b85e3d45034d',
            props: { id: '7d9b1829-478f-42ba-9a55-b85e3d45034d', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'web-page',
            label: 'dashboard-settings.widget.web-page',
            dndId: 'ae259be0-486e-4ccb-94f0-97a292c343c9',
            id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
            props: {
              id: '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
              config: { widgetDisplayCondition: '', url: 'https://www.vesti.ru/', title: 'vesti' }
            },
            description: 'ups'
          },
          {
            name: 'record-actions',
            label: 'dashboard-settings.widget.actions',
            dndId: 'd63c9c5c-6c3f-4b7c-8ada-f12adac762d4',
            id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc',
            props: { id: '51762b29-fa0b-477a-948e-c6cb65ccc3fc', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'barcode',
            label: 'dashboard-settings.widget.barcode',
            dndId: 'dde2ca94-6ddb-48d4-b0bd-7a44eb6a140c',
            id: '7ed30684-ac30-48bc-a316-821abe964996',
            props: { id: '7ed30684-ac30-48bc-a316-821abe964996', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'documents',
            label: 'dashboard-settings.widget.documents',
            dndId: '3e3df126-c86d-4861-ae9b-6659f2b69fed',
            id: '9197fbec-0842-4dda-835b-949ab7bed0c4',
            props: { id: '9197fbec-0842-4dda-835b-949ab7bed0c4', config: { widgetDisplayCondition: '' } },
            description: 'ups'
          },
          {
            name: 'documents',
            label: 'dashboard-settings.widget.documents',
            dndId: '5e25a9d6-e410-46ab-a5fc-9ccf23537acb',
            id: '2603f06a-3e4d-4fd9-b9e3-238a44f9e72c',
            props: { id: '2603f06a-3e4d-4fd9-b9e3-238a44f9e72c', config: { widgetDisplayCondition: '' } },
            description: 'test'
          }
        ],
        desktop: [
          {
            id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
            tab: { label: 'Вкладка', idLayout: 'layout_0ecdb374-d44f-47ce-a130-901047237da9' },
            type: '2-columns-big-small',
            columns: [
              {
                widgets: [
                  '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
                  'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
                  'db7ecda2-4645-4285-9d78-d25fa563caef'
                ]
              },
              { widgets: ['0cf75efa-30f8-470a-b9aa-5e13d18b96cc', '8be5eae5-a476-41d9-a457-3fee665173d5'], width: '25%' }
            ]
          },
          {
            id: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32',
            tab: { label: 'Вкладка 2', idLayout: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32' },
            type: '3-columns-center-big-with-footer',
            columns: [
              [{ widgets: [], width: '20%' }, { widgets: ['78ad6b4e-b191-4522-83eb-aa966fdd7cce'] }, { widgets: [], width: '20%' }],
              [{ widgets: [] }]
            ]
          },
          {
            id: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219',
            tab: { label: 'ups', idLayout: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219' },
            type: 'classic-site',
            columns: [
              [{ widgets: ['d8fe3456-9bae-4902-b7cd-031fbc8e40cc'] }],
              [
                { widgets: ['7d9b1829-478f-42ba-9a55-b85e3d45034d'] },
                { widgets: ['568f40b4-e0f2-42f5-ba18-bd7507319d1b'] },
                { widgets: ['51762b29-fa0b-477a-948e-c6cb65ccc3fc', '7ed30684-ac30-48bc-a316-821abe964996'] }
              ],
              [{ widgets: ['9197fbec-0842-4dda-835b-949ab7bed0c4'] }]
            ]
          },
          {
            id: 'layout_d8affa56-f386-497c-a416-71b2d4bd06e3',
            tab: { label: 'test', idLayout: 'layout_d8affa56-f386-497c-a416-71b2d4bd06e3' },
            type: '2-columns-big-small',
            columns: [{ widgets: ['2603f06a-3e4d-4fd9-b9e3-238a44f9e72c'] }, { widgets: [], width: '25%' }]
          }
        ],
        mobile: [
          {
            id: 'layout_5484100d-3a73-4238-8542-8337cace4969',
            tab: { label: 'test', idLayout: 'layout_5484100d-3a73-4238-8542-8337cace4969' },
            type: 'mobile',
            columns: [{ widgets: ['9197fbec-0842-4dda-835b-949ab7bed0c4'] }]
          },
          {
            id: 'layout_0ecdb374-d44f-47ce-a130-901047237da9',
            tab: { label: 'Вкладка', idLayout: 'layout_0ecdb374-d44f-47ce-a130-901047237da9' },
            type: 'mobile',
            columns: [
              {
                widgets: [
                  '4f41d4af-39a9-4421-b5d3-4cadbf4a5577',
                  'f36f3c68-1c5e-4bee-915e-2b7848fca0eb',
                  'db7ecda2-4645-4285-9d78-d25fa563caef',
                  '0cf75efa-30f8-470a-b9aa-5e13d18b96cc',
                  '8be5eae5-a476-41d9-a457-3fee665173d5'
                ]
              }
            ]
          },
          {
            id: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32',
            tab: { label: 'Вкладка 2', idLayout: 'layout_d8ee0844-0684-4632-9051-8f71b1f97e32' },
            type: 'mobile',
            columns: [{ widgets: ['78ad6b4e-b191-4522-83eb-aa966fdd7cce'] }]
          },
          {
            id: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219',
            tab: { label: 'ups', idLayout: 'layout_c4f7d15b-80cf-4d7a-a0f1-5f7a5f7f5219' },
            type: 'mobile',
            columns: [
              {
                widgets: [
                  'd8fe3456-9bae-4902-b7cd-031fbc8e40cc',
                  '7d9b1829-478f-42ba-9a55-b85e3d45034d',
                  '568f40b4-e0f2-42f5-ba18-bd7507319d1b',
                  '51762b29-fa0b-477a-948e-c6cb65ccc3fc',
                  '7ed30684-ac30-48bc-a316-821abe964996',
                  '9197fbec-0842-4dda-835b-949ab7bed0c4'
                ]
              }
            ]
          }
        ]
      },
      version: 'v2'
    }
  ]
];
