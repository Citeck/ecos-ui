import { RecordService } from './recordService';
import { PROXY_URI } from '../constants/alfresco';
import dataSourceStore from '../components/common/grid/dataSource/DataSourceStore';

const testData = [
  {
    id: 'id1',
    journalId: 'journalId1',
    title: 'Без группировки',
    sortBy: [{ ascending: true, attribute: 'cm:name' }],
    groupBy: [],
    columns: [
      {
        text: 'Дата создания',
        type: 'datetime',
        editorKey: null,
        javaClass: 'java.util.Date',
        attribute: 'cm:created',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Имя',
        type: 'text',
        editorKey: null,
        javaClass: 'java.lang.String',
        attribute: 'cm:name',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Заголовок',
        type: 'mltext',
        editorKey: null,
        javaClass: 'org.alfresco.service.cmr.repository.MLText',
        attribute: 'cm:title',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Номер договора',
        type: 'text',
        editorKey: null,
        javaClass: 'java.lang.String',
        attribute: 'contracts:agreementNumber',
        schema: null,
        formatter: null,
        params: {},
        default: false,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Статус',
        type: 'assoc',
        editorKey: 'alf_icase:caseStatus',
        javaClass: 'org.alfresco.service.cmr.repository.NodeRef',
        attribute: 'icase:caseStatusAssoc',
        schema: null,
        formatter: null,
        params: { searchCriteria: '[{ attribute: "cm:title", predicate: "string-contains" }]' },
        default: true,
        sortable: false,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Юридическое лицо',
        type: 'assoc',
        editorKey: 'alf_idocs:legalEntity',
        javaClass: 'org.alfresco.service.cmr.repository.NodeRef',
        attribute: 'contracts:agreementLegalEntity',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: false,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Контрагент',
        type: 'assoc',
        editorKey: 'alf_idocs:contractor',
        javaClass: 'org.alfresco.service.cmr.repository.NodeRef',
        attribute: 'contracts:contractor',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: false,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Предмет договора',
        type: 'assoc',
        editorKey: 'alf_contracts:subject',
        javaClass: 'org.alfresco.service.cmr.repository.NodeRef',
        attribute: 'contracts:agreementSubject',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: false,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Сумма договора',
        type: 'double',
        editorKey: null,
        javaClass: 'java.lang.Double',
        attribute: 'contracts:agreementAmount',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Валюта',
        type: 'assoc',
        editorKey: 'alf_idocs:currency',
        javaClass: 'org.alfresco.service.cmr.repository.NodeRef',
        attribute: 'contracts:agreementCurrency',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: false,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Краткое содержание',
        type: 'text',
        editorKey: null,
        javaClass: 'java.lang.String',
        attribute: 'idocs:summary',
        schema: null,
        formatter: null,
        params: {},
        default: false,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Дата договора',
        type: 'date',
        editorKey: null,
        javaClass: 'java.util.Date',
        attribute: 'contracts:agreementDate',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Количество листов',
        type: 'int',
        editorKey: null,
        javaClass: 'java.lang.Integer',
        attribute: 'idocs:pagesNumber',
        schema: null,
        formatter: null,
        params: {},
        default: false,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Количество листов приложений',
        type: 'int',
        editorKey: null,
        javaClass: 'java.lang.Integer',
        attribute: 'idocs:appendixPagesNumber',
        schema: null,
        formatter: null,
        params: {},
        default: false,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Срок действия',
        type: 'date',
        editorKey: null,
        javaClass: 'java.util.Date',
        attribute: 'contracts:duration',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Подписант',
        type: 'person',
        editorKey: 'alf_cm:person',
        javaClass: 'org.alfresco.service.cmr.repository.NodeRef',
        attribute: 'idocs:signatory',
        schema: null,
        formatter: null,
        params: {},
        default: false,
        sortable: false,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Исполнитель',
        type: 'person',
        editorKey: 'alf_cm:person',
        javaClass: 'org.alfresco.service.cmr.repository.NodeRef',
        attribute: 'idocs:performer',
        schema: null,
        formatter: null,
        params: {},
        default: false,
        sortable: false,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Примечание',
        type: 'text',
        editorKey: null,
        javaClass: 'java.lang.String',
        attribute: 'idocs:note',
        schema: null,
        formatter: null,
        params: {},
        default: false,
        sortable: true,
        groupable: false,
        searchable: true,
        visible: true
      }
    ],
    predicate: { t: 'or', val: [{ t: 'or', val: [{ att: 'cm:title', t: 'contains', val: '3' }] }] },
    maxItems: 10,
    permissions: { Write: true, Delete: true }
  },
  {
    id: 'id2',
    journalId: 'journalId2',
    title: 'С группировкой',
    sortBy: [{ ascending: true, attribute: 'cm:name' }],
    groupBy: ['icase:caseStatusAssoc&contracts:contractor'],
    columns: [
      {
        text: 'Статус',
        type: 'assoc',
        editorKey: 'alf_icase:caseStatus',
        javaClass: 'org.alfresco.service.cmr.repository.NodeRef',
        attribute: 'icase:caseStatusAssoc',
        schema: null,
        formatter: null,
        params: { searchCriteria: '[{ attribute: "cm:title", predicate: "string-contains" }]' },
        default: true,
        sortable: false,
        groupable: false,
        searchable: true,
        visible: true
      },
      {
        text: 'Контрагент',
        type: 'assoc',
        editorKey: 'alf_idocs:contractor',
        javaClass: 'org.alfresco.service.cmr.repository.NodeRef',
        attribute: 'contracts:contractor',
        schema: null,
        formatter: null,
        params: {},
        default: true,
        sortable: false,
        groupable: false,
        searchable: true,
        visible: true
      },
      { attribute: '_contracts:agreementAmount', schema: 'sum(contracts:agreementAmount)', text: 'Сумма' }
    ],
    predicate: { t: 'or', val: [{ t: 'or', val: [{ att: 'cm:title', t: 'contains', val: '4' }] }] },
    maxItems: 10,
    permissions: { Write: true, Delete: true }
  }
];

export class JournalsApi extends RecordService {
  saveRecords = ({ id, attributes }) => {
    return this.mutate({ record: { id, attributes } });
  };

  deleteRecords = records => {
    return this.delete({ records: records });
  };

  getGridData = ({ columns, pagination, predicate, groupBy, sortBy, predicates = [] }) => {
    const query = {
      t: 'and',
      val: [
        predicate,
        ...predicates.filter(item => {
          return item.val !== '' && item.val !== null;
        })
      ]
    };

    const dataSource = new dataSourceStore['GqlDataSource']({
      url: `${PROXY_URI}citeck/ecos/records`,
      dataSourceName: 'GqlDataSource',
      ajax: {
        body: {
          query: {
            query: query,
            language: 'predicate',
            page: pagination,
            groupBy,
            sortBy
          }
        }
      },
      columns: columns || []
    });

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns };
    });
  };

  getTreeGridData = () => {
    const dataSource = new dataSourceStore['TreeDataSource']();

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns, isTree: true };
    });
  };

  getGridDataUsePredicates = ({ columns, pagination, journalConfigPredicate, predicates }) => {
    const query = {
      t: 'and',
      val: [
        journalConfigPredicate,
        ...predicates.filter(item => {
          return item.val !== '' && item.val !== null;
        })
      ]
    };

    const dataSource = new dataSourceStore['GqlDataSource']({
      url: `${PROXY_URI}citeck/ecos/records`,
      dataSourceName: 'GqlDataSource',
      ajax: {
        body: {
          query: {
            query,
            language: 'predicate',
            page: pagination,
            consistency: 'EVENTUAL'
          }
        }
      },
      columns: columns || []
    });

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns };
    });
  };

  getJournalConfig = journalId => {
    return this.getJson(`${PROXY_URI}api/journals/config?journalId=${journalId}`).then(resp => {
      return resp || {};
    });
  };

  getJournalsList = () => {
    return this.getJson(`${PROXY_URI}api/journals/lists`).then(resp => {
      return resp.journalsLists || [];
    });
  };

  getJournals = () => {
    return this.getJson(`${PROXY_URI}api/journals/all`).then(resp => {
      return resp.journals || [];
    });
  };

  getJournalsByJournalsList = journalsListId => {
    return this.getJson(`${PROXY_URI}api/journals/list?journalsList=${journalsListId}`).then(resp => {
      return resp.journals || [];
    });
  };

  getDashletConfig = id => {
    return this.getJson(`${PROXY_URI}citeck/dashlet/config?key=${id}`).then(resp => {
      return resp;
    });
  };

  saveDashletConfig = (config, id) => {
    return this.postJson(`${PROXY_URI}citeck/dashlet/config?key=${id}`, config).then(resp => {
      return resp;
    });
  };

  getJournalSettings = () => {
    return this.getJson(`${PROXY_URI}api/journals/lists`).then(resp => {
      //return this.getJson(`${PROXY_URI}citeck/micro/uiserv/api/journalprefs/list?journalId=contract-agreements&includeUserLocal=true`).then(resp => {
      return testData;
    });
  };

  getJournalSetting = id => {
    return this.getJson(`${PROXY_URI}api/journals/lists`).then(resp => {
      //return this.getJson(`${PROXY_URI}citeck/micro/uiserv/api/journalprefs?journalViewPrefsId=contract-agreements-default`).then(resp => {
      return testData.filter(t => t.id === id)[0];
    });
  };

  saveJournalSetting = ({ id, settings }) => {
    return this.postJson(`${PROXY_URI}citeck/micro/uiserv/api/journalprefs?journalId=${id}`, settings).then(resp => {
      return resp;
    });
  };
}
