import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import Records from '../../Records/Records';

import { SourcesId } from '@/constants';
import { getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces } from '@/helpers/util.js';

class JournalsServiceApi {
  async getJournalConfigByType(typeRef, attributes) {
    return Records.queryOne(
      {
        sourceId: SourcesId.RESOLVED_JOURNAL,
        query: { typeRef },
        language: 'by-type'
      },
      attributes
    );
  }

  async getJournalConfig(journalId, force) {
    const { listViewInfo, json, hasWritePermission } = await Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load(
      {
        json: '.json',
        listViewInfo: 'typeRef.aspectById.listview.config?json',
        hasWritePermission: 'permissions._has.Write?bool'
      },
      force
    );

    let config = { ...json, hasWritePermission };

    if (!isEmpty(listViewInfo)) {
      config = {
        ...config,
        listViewInfo: {
          titleListView: `${listViewInfo['titleAtt']}?disp`,
          textListView: `${listViewInfo['textAtt']}?disp`,
          previewUrl: `${listViewInfo['previewAtt']}.url`,
          isTilesContent: `${get(listViewInfo, 'isTilesContent', false)}`
        }
      };
    }

    return config;
  }

  async isNotExistsJournal(journalId) {
    let id = journalId;

    if (id.indexOf(SourcesId.RESOLVED_JOURNAL) !== -1) {
      id = id.slice(id.indexOf(SourcesId.RESOLVED_JOURNAL) + SourcesId.RESOLVED_JOURNAL.length + 1);
    }

    if (id.indexOf(SourcesId.JOURNAL) === -1) {
      id = `${SourcesId.JOURNAL}@${id}`;
    }

    return Records.get(id).load('_notExists?bool');
  }

  async queryData(query, attributes) {
    let result;

    if (getEnabledWorkspaces() && !get(query, 'workspaces')) {
      query.workspaces = [getWorkspaceId()];
    }

    if (!attributes) {
      result = Records.query(query);
    } else {
      result = Records.query(query, attributes);
    }

    return result.catch(e => {
      console.error(e);
      return {
        error: e,
        records: [],
        totalCount: 0,
        attributes
      };
    });
  }

  async loadAttributes(record, attributes) {
    return Records.get(record).load(attributes);
  }
}

const INSTANCE = new JournalsServiceApi();
export default INSTANCE;
