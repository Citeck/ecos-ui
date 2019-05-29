import { RecordService } from './recordService';
import { PROXY_URI, MICRO_URI } from '../constants/alfresco';
import dataSourceStore from '../components/common/grid/dataSource/DataSourceStore';

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

  getGridDataUsePredicates = ({ columns, pagination, journalPredicate, predicates }) => {
    const query = {
      t: 'and',
      val: [
        journalPredicate,
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
    //return this.getJson(`${MICRO_URI}api/journalcfg?journalId=contract-agreements`).then(resp => {

    return this.getJson(`${PROXY_URI}api/journals/config?journalId=${journalId}`).then(resp => {
      return resp || {};
    });
  };

  getJournalsList = () => {
    //return this.getJson(`${MICRO_URI}api/journallist/list`).then(resp => {
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
    //journalsListId = 'site-contracts-main';
    //return this.getJson(`${MICRO_URI}api/journallist?listId=${journalsListId}`).then(resp => {

    return this.getJson(`${PROXY_URI}api/journals/list?journalsList=${journalsListId}`).then(resp => {
      return resp.journals || [];
    });
  };

  getDashletConfig = id => {
    return this.getJson(`${PROXY_URI}citeck/dashlet/config?key=${id}`)
      .then(resp => {
        return resp;
      })
      .catch(() => {
        return null;
      });
  };

  saveDashletConfig = (config, id) => {
    return this.postJson(`${PROXY_URI}citeck/dashlet/config?key=${id}`, config).then(resp => {
      return resp;
    });
  };

  getJournalSettings = journalType => {
    return this.getJson(`${MICRO_URI}api/journalprefs/list?journalId=${journalType}`).then(resp => {
      return resp;
    });
  };

  getJournalSetting = id => {
    return this.getJson(`${MICRO_URI}api/journalprefs?id=${id}`)
      .then(resp => {
        return resp;
      })
      .catch(() => {
        return null;
      });
  };

  saveJournalSetting = ({ id, settings }) => {
    // id = 'site-contracts-main';
    // return this.postJson(`${MICRO_URI}api/store/JOURNALLIST/${id}/override`, {
    //   "id": id,
    //   "localizedTitle": {
    //     "ru": "Тайтл"
    //   },
    //   "journalIds": ["contract-agreements"]
    // }, true).then(resp => {

    //id='contract-agreements';
    //settings={"id":"contract-agreements","sourceId":"","meta":{"nodeRef":"workspace://SpacesStore/ccd4c659-cd26-4f7c-93f6-c1ebf17b0184","criteria":[{"field":"type","predicate":"type-equals","value":"{http://www.citeck.ru/model/contracts/1.0}agreement"}],"title":"Договоры","predicate":{"att":"TYPE","val":"{http://www.citeck.ru/model/contracts/1.0}agreement","t":"eq"},"groupBy":null,"createVariants":[{"title":"Договор","destination":"workspace://SpacesStore/1457e7de-5ff6-436a-8ada-c04b32041546","type":"contracts:agreement","formId":"","isDefault":false,"canCreate":true,"createArguments":null}],"groupActions":[]},"columns":[{"text":"Дата создания","type":"datetime","editorKey":null,"javaClass":"java.util.Date","attribute":"cm:created","schema":null,"formatter":null,"params":{},"default":true,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Имя","type":"text","editorKey":null,"javaClass":"java.lang.String","attribute":"cm:name","schema":null,"formatter":null,"params":{},"default":false,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Заголовок","type":"mltext","editorKey":null,"javaClass":"org.alfresco.service.cmr.repository.MLText","attribute":"cm:title","schema":null,"formatter":null,"params":{},"default":true,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Номер договора","type":"text","editorKey":null,"javaClass":"java.lang.String","attribute":"contracts:agreementNumber","schema":null,"formatter":null,"params":{},"default":false,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Статус","type":"assoc","editorKey":"alf_icase:caseStatus","javaClass":"org.alfresco.service.cmr.repository.NodeRef","attribute":"icase:caseStatusAssoc","schema":null,"formatter":null,"params":{"searchCriteria":"[{ attribute: \"cm:title\", predicate: \"string-contains\" }]"},"default":true,"searchable":true,"visible":true,"sortable":false,"groupable":false},{"text":"Юридическое лицо","type":"assoc","editorKey":"alf_idocs:legalEntity","javaClass":"org.alfresco.service.cmr.repository.NodeRef","attribute":"contracts:agreementLegalEntity","schema":null,"formatter":null,"params":{},"default":true,"searchable":true,"visible":true,"sortable":false,"groupable":false},{"text":"Контрагент","type":"assoc","editorKey":"alf_idocs:contractor","javaClass":"org.alfresco.service.cmr.repository.NodeRef","attribute":"contracts:contractor","schema":null,"formatter":null,"params":{},"default":true,"searchable":true,"visible":true,"sortable":false,"groupable":false},{"text":"Предмет договора","type":"assoc","editorKey":"alf_contracts:subject","javaClass":"org.alfresco.service.cmr.repository.NodeRef","attribute":"contracts:agreementSubject","schema":null,"formatter":null,"params":{},"default":true,"searchable":true,"visible":true,"sortable":false,"groupable":false},{"text":"Сумма договора","type":"double","editorKey":null,"javaClass":"java.lang.Double","attribute":"contracts:agreementAmount","schema":null,"formatter":null,"params":{},"default":true,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Валюта","type":"assoc","editorKey":"alf_idocs:currency","javaClass":"org.alfresco.service.cmr.repository.NodeRef","attribute":"contracts:agreementCurrency","schema":null,"formatter":null,"params":{},"default":true,"searchable":true,"visible":true,"sortable":false,"groupable":false},{"text":"Краткое содержание","type":"text","editorKey":null,"javaClass":"java.lang.String","attribute":"idocs:summary","schema":null,"formatter":null,"params":{},"default":false,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Дата договора","type":"date","editorKey":null,"javaClass":"java.util.Date","attribute":"contracts:agreementDate","schema":null,"formatter":null,"params":{},"default":true,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Количество листов","type":"int","editorKey":null,"javaClass":"java.lang.Integer","attribute":"idocs:pagesNumber","schema":null,"formatter":null,"params":{},"default":false,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Количество листов приложений","type":"int","editorKey":null,"javaClass":"java.lang.Integer","attribute":"idocs:appendixPagesNumber","schema":null,"formatter":null,"params":{},"default":false,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Срок действия","type":"date","editorKey":null,"javaClass":"java.util.Date","attribute":"contracts:duration","schema":null,"formatter":null,"params":{},"default":true,"searchable":true,"visible":true,"sortable":true,"groupable":false},{"text":"Подписант","type":"person","editorKey":"alf_cm:person","javaClass":"org.alfresco.service.cmr.repository.NodeRef","attribute":"idocs:signatory","schema":null,"formatter":null,"params":{},"default":false,"searchable":true,"visible":true,"sortable":false,"groupable":false},{"text":"Исполнитель","type":"person","editorKey":"alf_cm:person","javaClass":"org.alfresco.service.cmr.repository.NodeRef","attribute":"idocs:performer","schema":null,"formatter":null,"params":{},"default":false,"searchable":true,"visible":true,"sortable":false,"groupable":false},{"text":"Примечание","type":"text","editorKey":null,"javaClass":"java.lang.String","attribute":"idocs:note","schema":null,"formatter":null,"params":{},"default":false,"searchable":true,"visible":true,"sortable":true,"groupable":false}],"params":{"formId":"filters","doubleClickId":"nodeRef","defaultSortBy":"[{id: 'cm:created', order: 'desc'}]","clickLinkAttribute":"cm:name, cm:title, contracts:agreementNumber","type":"contracts:agreement","doubleClickLink":"card-details?nodeRef={id}"}};
    //return this.postJson(`${MICRO_URI}api/store/JOURNALCFG/${id}/override`, settings, true).then(resp => {

    return this.putJson(`${MICRO_URI}api/journalprefs?id=${id}`, settings, true).then(resp => {
      return resp;
    });
  };

  createJournalSetting = ({ journalId, settings }) => {
    return this.postJson(`${MICRO_URI}api/journalprefs?journalId=${journalId}`, settings, true).then(resp => {
      return resp;
    });
  };

  deleteJournalSetting = id => {
    return this.deleteJson(`${MICRO_URI}api/journalprefs/id/${id}`, true).then(resp => {
      return resp;
    });
  };

  getNodeContent = nodeRef => {
    return this.getJson(`${PROXY_URI}citeck/node-content?nodeRef=${nodeRef}`).then(resp => {
      return resp;
    });
  };
}
