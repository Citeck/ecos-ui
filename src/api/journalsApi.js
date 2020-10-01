import get from 'lodash/get';
import set from 'lodash/set';
import { MICRO_URI, PROXY_URI } from '../constants/alfresco';
import { debounce } from '../helpers/util';
import * as ls from '../helpers/ls';
import TreeDataSource from '../components/common/grid/dataSource/TreeDataSource';
import Records from '../components/Records';
import * as RecordUtils from '../components/Records/utils/recordUtils';

import { DocPreviewApi } from './docPreview';
import { RecordService } from './recordService';

/**
 * @description Now only Settings, Storage and special functions are actual here, other ↩
 * @see src/components/Journals/service
 */
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
      .catch(() => null);
  };

  /** @todo replace to using Records.js */
  saveRecords = ({ id, attributes }) => {
    return this.mutate({ record: { id, attributes } }).catch(() => null);
  };

  /** @todo replace to using Journals/service ? */
  getTreeGridData = () => {
    const dataSource = new TreeDataSource();

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns, isTree: true };
    });
  };

  //todo remove
  getJournalConfig = async journalId => {
    const emptyConfig = {
      columns: [],
      meta: { createVariants: [] }
    };

    if (!journalId) {
      console.warn('No journalId');
      return Promise.resolve(emptyConfig);
    }

    let journalRecordId = journalId;

    if (journalRecordId.indexOf('@') === -1) {
      journalRecordId = 'uiserv/journal_v1@' + journalId;
    }

    const config = await Records.get(journalRecordId)
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
      .catch(firstE => {
        return this.getJson(`${PROXY_URI}api/journals/config?journalId=${journalId}`)
          .then(resp => {
            const data = resp || {};

            (data.columns || []).forEach((col, i) => {
              col.type = get(col, 'params.edgeType') || col.type;
            });

            return data;
          })
          .catch(secondE => {
            console.error(firstE);
            console.error(secondE);
            return emptyConfig;
          });
      });

    const updPredicate = await RecordUtils.replaceAttrValuesForRecord(get(config, 'meta.predicate'));

    set(config, 'meta.predicate', updPredicate);

    return config;
  };

  getJournalsList = () => {
    return this.getJson(`${PROXY_URI}api/journals/lists`).then(resp => resp.journalsLists || []);
  };

  getJournals = () => {
    return this.getJson(`${PROXY_URI}api/journals/all`).then(resp => resp.journals || []);
  };

  getJournalsByJournalsList = journalsListId => {
    const journalsFromUiserv = Records.query(
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
    return this.getJson(`${PROXY_URI}citeck/dashlet/config?key=${id}`).catch(() => null);
  };

  saveDashletConfig = (config, id) => {
    return this.postJson(`${PROXY_URI}citeck/dashlet/config?key=${id}`, config);
  };

  getJournalSettings = journalType => {
    return this.getJson(`${MICRO_URI}api/journalprefs/list?journalId=${journalType}`);
  };

  getJournalSetting = id => {
    return this.getJson(`${MICRO_URI}api/journalprefs?id=${id}`).catch(() => null);
  };

  saveJournalSetting = ({ id, settings }) => {
    return this.putJson(`${MICRO_URI}api/journalprefs?id=${id}`, settings, true);
  };

  createJournalSetting = ({ journalId, settings }) => {
    return this.postJson(`${MICRO_URI}api/journalprefs?journalId=${journalId}`, settings, true).catch(() => null);
  };

  deleteJournalSetting = id => {
    return this.deleteJson(`${MICRO_URI}api/journalprefs/id/${id}`, true);
  };

  getNodeContent = nodeRef => {
    return this.getJson(`${PROXY_URI}citeck/node-content?nodeRef=${nodeRef}`);
  };

  getPreviewUrl = DocPreviewApi.getPreviewLinkByRecord;

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
    return this.deleteJson(`${PROXY_URI}api/internal/downloads/${nodeRef.replace(':/', '')}`, true);
  };

  /**
   * Check line edit permissions
   * true - we can edit, false - we can’t edit
   *
   * @param recordRef
   * @returns {*}
   * @todo move to Journals/service
   */
  checkRowEditRules = recordRef => {
    return Records.get(recordRef)
      .load('.att(n:"permissions"){has(n:"Write")}')
      .catch(() => null);
  };

  /**
   * Check if the cell is protected from editing or not
   * true - we can’t edit the cell, false - we can edit the cell
   *
   * @param recordRef
   * @param cell
   * @returns {*}
   * @todo move to Journals/service
   */
  checkCellProtectedFromEditing = (recordRef, cell) => {
    return Records.get(recordRef)
      .load(`#${cell}?protected`)
      .catch(() => null);
  };
}
