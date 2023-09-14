import { CITECK_URI, PROXY_URI } from '../constants/alfresco';
import { debounce } from '../helpers/util';
import * as ls from '../helpers/ls';
import TreeDataSource from '../components/common/grid/dataSource/TreeDataSource';
import Records from '../components/Records';
import { PERMISSION_WRITE_ATTR } from '../components/Records/constants';
import AttributesService from '../services/AttributesService';

import { DocPreviewApi } from './docPreview';
import { RecordService } from './recordService';

/**
 * @description Settings, Storage and special functions are actual here, other ↩
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

  fetchLinkedRefs = (recordRef, attributesToLoad) => {
    if (!attributesToLoad || !attributesToLoad.length || !recordRef) {
      return [];
    }

    const attributes = attributesToLoad.reduce((result, currAttr) => ({ ...result, [currAttr.value]: `${currAttr.value}[]?id` }), {});

    return Records.get(recordRef)
      .load(attributes)
      .then(records => {
        const recordRefs = Object.values(records)
          .reduce((result, current) => result.concat(current), [])
          .map(AttributesService.parseId);
        return recordRefs;
      })
      .catch(e => {
        console.error(e);
        return [];
      });
  };

  /** @todo replace to using Records.js */
  saveRecords = ({ id, attributes }) => {
    return this.mutate({ record: { id, attributes } }).catch(() => null);
  };

  getDashletConfig = id => {
    return this.getJson(`${CITECK_URI}dashlet/config?key=${id}`).catch(() => null);
  };

  saveDashletConfig = (config, id) => {
    return this.postJson(`${CITECK_URI}dashlet/config?key=${id}`, config);
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
      .load(PERMISSION_WRITE_ATTR)
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

  getJournalsByIds = (ids, attrs = '?json') => {
    return Records.get(ids).load(attrs);
  };

  /** @todo replace or delete
   * @deprecated use it? */
  getTreeGridData = () => {
    const dataSource = new TreeDataSource();

    return dataSource.load().then(function({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns, isTree: true };
    });
  };
}
