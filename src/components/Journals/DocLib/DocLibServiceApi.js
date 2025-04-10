import clone from 'lodash/clone';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { SourcesId } from '../../../constants';
import { getWorkspaceId } from '../../../helpers/urls';
import Records from '../../Records/Records';

class DocLibServiceApi {
  static defaultAttributes = {
    id: '?id',
    title: '?disp',
    nodeType: 'nodeType',
    hasChildrenDirs: 'hasChildrenDirs?bool',
    typeRef: '_type?id',
    modified: '_modified?str',
    name: '_name?str'
  };

  async getTypeRef(journalId) {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('typeRef?id');
  }

  async isDocLibEnabled(typeRef) {
    return Records.get(typeRef).load('docLibInfo.enabled?bool!');
  }

  async getFileTypeRefs(typeRef) {
    return Records.get(typeRef).load('docLibInfo.fileTypeRefs[]?id!');
  }

  async getDirTypeRef(typeRef) {
    return Records.get(typeRef).load('docLibInfo.dirTypeRef?id!');
  }

  async getDirPath(folderRef) {
    return Records.get(folderRef).load('path[]{disp:?disp,id:?id}');
  }

  async getDirActions(docLibRef) {
    return Records.get(`${SourcesId.TYPE}@${docLibRef}`).load('docLibInfo.dirTypeRef.actions[]?id');
  }

  async getChildren(parentRef, options = {}) {
    const { nodeType, pagination = {}, searchText = '' } = options;
    const query = { parentRef };
    if (nodeType) {
      query.nodeType = nodeType;
    }

    if (searchText.length) {
      query.recursive = true;
      query.filter = {
        t: 'contains',
        att: 'ALL',
        val: searchText
      };
    }

    const querySettings = {
      sourceId: SourcesId.DOCLIB,
      query,
      language: 'children',
      sortBy: [
        { attribute: 'nodeType', ascending: true },
        { attribute: '?disp', ascending: true }
      ]
    };

    if (get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
      querySettings.workspaces = [getWorkspaceId()];
    }

    if (!isEmpty(pagination)) {
      querySettings.page = clone(pagination);
    }

    return Records.query(querySettings, DocLibServiceApi.defaultAttributes);
  }

  async loadNode(recordRef) {
    return Records.get(recordRef).load(DocLibServiceApi.defaultAttributes);
  }

  async createChild(rootId, options) {
    const { attributes = {} } = options;
    const record = Records.get(rootId);

    Object.keys(attributes).forEach(attName => {
      record.att(attName, attributes[attName]);
    });

    return record.save();
  }

  async changeAttributesItem(id, options) {
    const { attributes = {} } = options;
    const record = Records.get(id);

    Object.keys(attributes).forEach(attName => {
      record.att(attName, attributes[attName]);
    });

    return record.save();
  }

  async getDisp(typeRef) {
    return Records.get(typeRef).load('?disp');
  }

  async getInhFormRef(typeId) {
    return Records.get(typeId).load('inhFormRef?id');
  }
}

const INSTANCE = new DocLibServiceApi();
export default INSTANCE;
