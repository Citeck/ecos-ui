import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { ActionModes, Attributes, Permissions } from '../constants';
import { MICRO_URI, PROXY_URI } from '../constants/alfresco';
import { debounce, isExistValue, queryByCriteria, t } from '../helpers/util';
import * as ls from '../helpers/ls';
import { COLUMN_DATA_TYPE_ASSOC, PREDICATE_CONTAINS, PREDICATE_OR } from '../components/common/form/SelectJournal/predicates';
import GqlDataSource from '../components/common/grid/dataSource/GqlDataSource';
import TreeDataSource from '../components/common/grid/dataSource/TreeDataSource';
import Records from '../components/Records';
import RecordActions from '../components/Records/actions';
import { DocPreviewApi } from './docPreview';
import { RecordService } from './recordService';

export class JournalsApi extends RecordService {
  lsJournalSettingIdsKey = ls.generateKey('journal-setting-ids', true);

  getLsJournalSettingIds = () => {
    let ids = [];

    if (ls.hasData(this.lsJournalSettingIdsKey, 'array')) {
      ids = ls.getData(this.lsJournalSettingIdsKey);
    }

    return ids;
  };

  setLsJournalSettingIds = ids => {
    ls.setData(this.lsJournalSettingIdsKey, ids);
  };

  setLsJournalSettingId = (journalConfigId, journalSettingId) => {
    const ids = this.getLsJournalSettingIds().filter(j => j.key !== journalConfigId);
    ids.push({ key: journalConfigId, value: journalSettingId });
    this.setLsJournalSettingIds(ids);
  };

  getLsJournalSettingId = journalConfigId => {
    return (this.getLsJournalSettingIds().filter(j => j.key === journalConfigId)[0] || {}).value;
  };

  getRecord = ({ id, attributes, noCache = false }) => {
    return Records.get(id)
      .load(attributes, noCache)
      .then(resp => resp)
      .catch(() => null);
  };

  saveRecords = ({ id, attributes }) => {
    //todo: replace to using Records.js
    return this.mutate({ record: { id, attributes } }).catch(() => null);
  };

  deleteRecords = records => {
    //todo: replace to using Records.js
    return this.delete({ records: records });
  };

  getGridData = ({
    columns,
    pagination,
    predicate,
    groupBy,
    sortBy,
    predicates,
    sourceId,
    recordRef,
    journalId,
    journalActions,
    queryData,
    searchPredicate
  }) => {
    const val = [predicate];

    Array.isArray(predicates) && val.push(...predicates);

    !isEmpty(searchPredicate) && val.push(...searchPredicate);

    !!recordRef &&
      val.push({
        t: PREDICATE_OR,
        val: columns
          .filter(c => c.type === COLUMN_DATA_TYPE_ASSOC)
          .map(a => ({
            t: PREDICATE_CONTAINS,
            val: recordRef,
            att: a.attribute
          }))
      });

    let query = {
      t: 'and',
      val: val.filter(item => item && isExistValue(item.t) && isExistValue(item.val) && item.val !== '')
    };
    let language = 'predicate';
    if (queryData) {
      query = {
        data: queryData,
        predicate: query
      };
      language = 'predicate-with-data';
    }

    const bodyQuery = {
      consistency: 'EVENTUAL',
      query,
      language,
      page: pagination,
      groupBy,
      sortBy
    };

    if (sourceId) {
      bodyQuery.sourceId = sourceId;
    }

    const dataSource = new GqlDataSource({
      url: `${PROXY_URI}citeck/ecos/records`,
      dataSourceName: 'GqlDataSource',
      ajax: {
        body: {
          query: bodyQuery
        }
      },
      columns: columns || [],
      permissions: [Permissions.Write]
    });

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      const actionsContext = {
        mode: ActionModes.JOURNAL,
        scope: journalId,
        actions: journalActions
      };

      return RecordActions.getActions(data, actionsContext).then(actions => ({ data, actions, total, columns }));
    });
  };

  getTreeGridData = () => {
    const dataSource = new TreeDataSource();

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns, isTree: true };
    });
  };

  getGridDataUsePredicates = ({ columns, pagination, journalPredicate, predicates, sourceId, sortBy, queryData }) => {
    const queryPredicates = journalPredicate ? [journalPredicate] : [];
    let query = {
      t: 'and',
      val: queryPredicates.concat(
        ((Array.isArray(predicates) && predicates) || []).filter(item => {
          return item.val !== '' && item.val !== null;
        })
      )
    };
    let language = 'predicate';
    if (queryData) {
      query = {
        data: queryData,
        predicate: query
      };
      language = 'predicate-with-data';
    }
    const bodyQuery = {
      query,
      language,
      page: pagination,
      consistency: 'EVENTUAL',
      sortBy: [
        {
          attribute: get(sortBy, 'attribute') || Attributes.DBID,
          ascending: get(sortBy, 'ascending') !== false
        }
      ]
    };

    if (sourceId) {
      bodyQuery['sourceId'] = sourceId;
    }

    const dataSource = new GqlDataSource({
      url: `${PROXY_URI}citeck/ecos/records`,
      dataSourceName: 'GqlDataSource',
      ajax: {
        body: {
          query: bodyQuery
        }
      },
      columns: columns || [],
      permissions: [Permissions.Write]
    });

    return dataSource.load().then(({ data, total, attributes }) => ({ data, total, attributes, columns: dataSource.getColumns() }));
  };

  getJournalConfig = journalId => {
    //return this.getJson(`${MICRO_URI}api/journalcfg?journalId=contract-agreements`).then(resp => {

    let journalRecordId = journalId;

    if (journalRecordId.indexOf('@') === -1) {
      journalRecordId = 'uiserv/journal_v1@' + journalId;
    }

    return Records.get(journalRecordId)
      .load('.json')
      .then(resp => {
        const data = resp || {};
        if (!data.columns || data.columns.length === 0) {
          throw new Error('fallback to legacy config get');
        }

        (data.columns || []).forEach((col, i) => {
          col.type = get(col, 'params.edgeType') || col.type;
        });

        return data;
      })
      .catch(() => {
        return this.getJson(`${PROXY_URI}api/journals/config?journalId=${journalId}`)
          .then(resp => {
            const data = resp || {};

            (data.columns || []).forEach((col, i) => {
              col.type = get(col, 'params.edgeType') || col.type;
            });

            return data;
          })
          .catch(() => {});
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

    let journalsFromUiserv = Records.query(
      {
        sourceId: 'uiserv/journal_v1',
        language: 'list-id',
        query: { listId: journalsListId }
      },
      { title: 'meta.title' }
    )
      .then(res => res.records)
      .catch(() => []);

    return this.getJson(`${PROXY_URI}api/journals/list?journalsList=${journalsListId}`).then(resp => {
      return journalsFromUiserv.then(uiservJournals => {
        let result = [...(resp.journals || [])];
        let journalByType = {};
        result.forEach(j => (journalByType[j.type] = j));
        for (let journal of uiservJournals) {
          let localId = journal.id.replace('uiserv/journal_v1@', '');
          let existingJournal = journalByType[localId];
          if (existingJournal != null) {
            existingJournal.nodeRef = localId;
          } else {
            result.push({
              nodeRef: localId,
              title: journal.title,
              type: localId
            });
          }
        }
        return result;
      });
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
    return this.postJson(`${MICRO_URI}api/journalprefs?journalId=${journalId}`, settings, true)
      .then(resp => {
        return resp;
      })
      .catch(() => null);
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

  getPreviewUrl = DocPreviewApi.getPreviewLinkByRecord;

  performGroupAction = ({ groupAction, selected, resolved, criteria, journalId }) => {
    const { type, params, id } = groupAction;

    if (params.js_action) {
      const actionFunction = new Function('records', 'parameters', params.js_action); //eslint-disable-line

      actionFunction(selected, params);
      return Promise.resolve([]);
    }

    return Promise.all([
      this.postJson(`${PROXY_URI}api/journals/group-action`, {
        actionId: params.actionId || id,
        groupType: type,
        journalId: journalId,
        nodes: selected,
        params: params,
        query: queryByCriteria(criteria)
      }),
      Records.get(selected).load('.disp')
    ])
      .then(resp => {
        let actionResults = (resp[0] || {}).results || [];
        let titles = resp[1] || [];

        titles = Array.isArray(titles) ? titles : [titles];

        let result = actionResults.map((a, i) => ({
          ...a,
          title: titles[i],
          status: t(`batch-edit.message.${a.status}`)
        }));

        if (resolved) {
          for (let rec of resolved) {
            result.push({
              ...rec,
              status: t(`batch-edit.message.${rec.status}`)
            });
          }
        }
        return result;
      })
      .catch(e => {
        console.log(e);
        return [];
      });
  };

  getStatus = nodeRef => {
    return this.getJson(`${PROXY_URI}api/internal/downloads/${nodeRef.replace(':/', '')}/status`)
      .then(status => {
        if (status.status !== 'DONE') {
          return debounce(this.getStatus, 500)(nodeRef);
        }

        return nodeRef;
      })
      .catch(() => null);
  };

  deleteDownloadsProgress = nodeRef => {
    return this.deleteJson(`${PROXY_URI}api/internal/downloads/${nodeRef.replace(':/', '')}`, true).then(resp => resp);
  };

  createZip = selected => {
    return this.postJson(`${PROXY_URI}api/internal/downloads`, selected.map(s => ({ nodeRef: s })))
      .then(resp => this.getStatus(resp.nodeRef))
      .catch(() => null);
  };

  /**
   * Check line edit permissions
   * true - we can edit, false - we can’t edit
   *
   * @param recordRef
   * @returns {*}
   */
  checkRowEditRules = recordRef => {
    return Records.get(recordRef)
      .load('.att(n:"permissions"){has(n:"Write")}')
      .then(response => response)
      .catch(() => null);
  };

  /**
   * Check if the cell is protected from editing or not
   * true - we can’t edit the cell, false - we can edit the cell
   *
   * @param recordRef
   * @param cell
   * @returns {*}
   */
  checkCellProtectedFromEditing = (recordRef, cell) => {
    return Records.get(recordRef)
      .load(`#${cell}?protected`)
      .then(response => response)
      .catch(() => null);
  };
}
