import get from 'lodash/get';
import isString from 'lodash/isString';

import { DocPreviewApi } from '../docPreview';
import { RecordService } from '../recordService';

import { PureQueryResponse } from '@/api/types';
import { WidgetsConfigType } from '@/components/Journals/JournalsPreviewWidgets/JournalsPreviewWidgets';
import { PERMISSION_WRITE_ATTR } from '@/components/Records/constants';
import Records from '@/components/Records/index';
import { ROOT_GROUP_NAME } from '@/components/common/Orgstruct/constants';
import TreeDataSource from '@/components/common/grid/dataSource/TreeDataSource';
import { SourcesId } from '@/constants';
import { CITECK_URI, PROXY_URI } from '@/constants/alfresco';
import * as ls from '@/helpers/ls';
import { LSDataType } from '@/helpers/ls';
import { getSearchParams, getWorkspaceId } from '@/helpers/urls';
import { debounce, getEnabledWorkspaces } from '@/helpers/util';
import AttributesService from '@/services/AttributesService';
import { IJournalState } from '@/types/store/journals';

export interface IJournalsApi {
  getLsJournalSettingIds: () => LSDataType;
  setLsJournalSettingIds: (ids: LSDataType) => void;
  setLsJournalSettingId: (journalConfigId: string, journalSettingId: string) => void;
  getLsJournalSettingId: (journalConfigId?: string) => void;
  getRecord: (props: { id: string; attributes: NonNullable<unknown>; noCache?: boolean }) => PureQueryResponse<NonNullable<unknown>>;
  fetchLinkedRefs: (recordRef?: string | null, attributesToLoad?: Array<{ value: string }> | null) => Promise<string[]>;
  saveRecords: (props: { id: string; attributes: Record<string, { value: string }> }) => Promise<void>;
  getAspects: (typeRef?: string) => Promise<Array<{ ref?: string }>>;
  getDashletConfig: (id: string) => Promise<NonNullable<unknown>>;
  saveDashletConfig: (config: IJournalState['config'], id: string) => Promise<void>;
  getPreviewUrl: (recordRef: string) => Promise<string>;
  getStatus: (nodeRef: string) => Promise<unknown>;
  checkRowEditRules: (recordRef: string) => Promise<boolean>;
  checkCellProtectedFromEditing: (recordRef: string, cell: string) => Promise<boolean>;
  getJournalsByIds: (ids: string[], attributes: NonNullable<unknown>) => PureQueryResponse<Array<NonNullable<unknown>>>;
  getTotalSum: (journalType: string, countFields: string[], query: NonNullable<unknown>) => Promise<Record<string, number> | null>;
  getJournalTypeRef: (journalId: string) => Promise<string>;
  deleteDownloadsProgress: (nodeRef: string) => Promise<void>;
  fetchBreadcrumbs: () => Promise<string[]>;
  getConfigWidgets: (journalId: string) => Promise<WidgetsConfigType>;
}

/**
 * @description Settings, Storage and special functions are actual here, other ↩
 * @see src/components/Journals/service
 */
export class JournalsApi extends RecordService implements IJournalsApi {
  lsJournalSettingIdsKey = ls.generateKey('journal-setting-ids', true);

  getLsJournalSettingIds: IJournalsApi['getLsJournalSettingIds'] = () => {
    let ids: LSDataType = [];

    if (ls.hasData(this.lsJournalSettingIdsKey, 'array')) {
      ids = ls.getData(this.lsJournalSettingIdsKey) || [];
    }

    return ids;
  };

  setLsJournalSettingIds: IJournalsApi['setLsJournalSettingIds'] = ids => {
    ls.setData(this.lsJournalSettingIdsKey, ids);
  };

  setLsJournalSettingId: IJournalsApi['setLsJournalSettingId'] = (journalConfigId, journalSettingId) => {
    const ids = this.getLsJournalSettingIds().filter(j => j.key !== journalConfigId);
    ids.push({ key: journalConfigId, value: journalSettingId });
    this.setLsJournalSettingIds(ids);
  };

  getLsJournalSettingId: IJournalsApi['getLsJournalSettingId'] = journalConfigId => {
    return (this.getLsJournalSettingIds().filter(j => j.key === journalConfigId)[0] || {}).value;
  };

  getRecord: IJournalsApi['getRecord'] = ({ id, attributes, noCache = false }) => {
    return Records.get(id)
      .load(attributes, noCache)
      .catch(() => null);
  };

  fetchLinkedRefs: IJournalsApi['fetchLinkedRefs'] = (recordRef, attributesToLoad) => {
    if (!attributesToLoad || !attributesToLoad.length || !recordRef) {
      return new Promise(resolve => resolve([]));
    }

    const attributes = attributesToLoad.reduce((result, currAttr) => ({ ...result, [currAttr.value]: `${currAttr.value}[]?id` }), {});

    return Records.get(recordRef)
      .load(attributes)
      .then((records: Record<string, string[]>) => {
        return Object.values(records)
          .reduce((result, current) => result.concat(current), [])
          .map(AttributesService.parseId);
      })
      .catch(e => {
        console.error(e);
        return [];
      });
  };

  /** @todo replace to using Records.js */
  saveRecords: IJournalsApi['saveRecords'] = ({ id, attributes }) => {
    return this.mutate({ record: { id, attributes } }).catch(() => null);
  };

  getAspects: IJournalsApi['getAspects'] = typeRef => {
    return Records.get(typeRef).load('aspects[]?json');
  };

  getDashletConfig: IJournalsApi['getDashletConfig'] = id => {
    return this.getJson(`${CITECK_URI}dashlet/config?key=${id}`).catch(() => null);
  };

  saveDashletConfig: IJournalsApi['saveDashletConfig'] = (config, id) => {
    return this.postJson(`${CITECK_URI}dashlet/config?key=${id}`, config);
  };

  getPreviewUrl: IJournalsApi['getPreviewUrl'] = DocPreviewApi.getPreviewLinkByRecord;

  getStatus: IJournalsApi['getStatus'] = nodeRef => {
    return this.getJson(`${PROXY_URI}api/internal/downloads/${nodeRef.replace(':/', '')}/status`)
      .then(status => {
        if (status.status !== 'DONE') {
          // @ts-ignore
          return debounce(this.getStatus, 500)(nodeRef);
        }

        return nodeRef;
      })
      .catch(() => null);
  };

  deleteDownloadsProgress: IJournalsApi['deleteDownloadsProgress'] = nodeRef => {
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
  checkRowEditRules: IJournalsApi['checkRowEditRules'] = recordRef => {
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
  checkCellProtectedFromEditing: IJournalsApi['checkCellProtectedFromEditing'] = (recordRef, cell) => {
    return Records.get(recordRef)
      .load(`#${cell}?protected`)
      .catch(() => null);
  };

  getJournalsByIds: IJournalsApi['getJournalsByIds'] = (ids, attrs = '?json') => {
    return Records.get(ids).load(attrs);
  };

  /** @todo replace or delete
   * @deprecated use it? */
  getTreeGridData = () => {
    const dataSource = new TreeDataSource();

    return dataSource.load().then(function ({ data, total }) {
      const columns = dataSource.getColumns();
      return { data, total, columns, isTree: true };
    });
  };

  getTotalSum: IJournalsApi['getTotalSum'] = (journalType, countFields, query = {}) => {
    if (!journalType || !countFields) {
      return new Promise(resolve => resolve(null));
    }

    const attributes = countFields.map(field => `sum(${field})`);
    const sourceId = journalType.replace('type@', '');

    return Records.queryOne(
      {
        sourceId,
        query,
        language: 'predicate',
        groupBy: ['*'],
        workspaces: [`${getWorkspaceId()}`]
      },
      attributes
    );
  };

  getJournalTypeRef: IJournalsApi['getJournalTypeRef'] = journalId => {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('typeRef?str');
  };

  static saveConfigWidgets = ({ config, journalId = '' }: { journalId: string; config?: NonNullable<unknown> }): Promise<void> => {
    const record = Records.get(`${SourcesId.DASHBOARD}@`);
    const recordRef = journalId.includes('@') ? journalId : `${SourcesId.JOURNAL}@${journalId}`;

    if (config) {
      record.att('config?json', config);
    }

    record.att('authority?str', ROOT_GROUP_NAME);

    if (recordRef) {
      record.att('appliedToRef?str', recordRef);
    }

    record.att('scope', 'journal');

    if (getEnabledWorkspaces()) {
      record.att('workspace', getWorkspaceId());
    }

    return record.save();
  };

  getConfigWidgets = (journalId = '') => {
    const recordRef = journalId.includes('@') ? journalId : `${SourcesId.JOURNAL}@${journalId}`;

    let query;
    const baseQuery = {
      scope: 'journal',
      authority: ROOT_GROUP_NAME,
      recordRef
    };

    if (getEnabledWorkspaces()) {
      query = {
        ...baseQuery,
        workspace: getWorkspaceId()
      };
    } else {
      query = baseQuery;
    }

    return Records.queryOne(
      {
        sourceId: SourcesId.DASHBOARD,
        query
      },
      'config?json'
    );
  };

  fetchBreadcrumbs = () => {
    const searchParams = getSearchParams();
    const categoryRef = get(searchParams, 'recordRef');

    if (isString(categoryRef) && categoryRef !== 'null') {
      return Records.get(categoryRef).load('_pathByAssoc._parent[]{id:?id,disp:?disp}');
    }

    return new Promise(resolve => resolve([]));
  };
}
