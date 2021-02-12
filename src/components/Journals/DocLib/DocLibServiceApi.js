import isEmpty from 'lodash/isEmpty';
import clone from 'lodash/clone';

import Records from '../../Records/Records';
import { SourcesId } from '../../../constants';

class DocLibServiceApi {
  static defaultAttributes = {
    id: '?id',
    title: '?disp',
    nodeType: 'nodeType',
    hasChildrenDirs: 'hasChildrenDirs?bool',
    typeRef: 'typeRef?id',
    modified: '_modified?str'
  };

  async getTypeRef(journalId) {
    return Records.get(`${SourcesId.RESOLVED_JOURNAL}@${journalId}`).load('typeRef?id');
  }

  async isDocLibEnabled(typeRef) {
    return Records.get(typeRef).load('resolvedDocLib.enabled?bool');
  }

  async getFileTypeRefs(typeRef) {
    return Records.get(typeRef).load('resolvedDocLib.fileTypeRefs[]?id');
  }

  async getDirTypeRef(typeRef) {
    return Records.get(typeRef).load('resolvedDocLib.dirTypeRef?id');
  }

  async getDirPath(typeRef) {
    return Records.get(typeRef).load('path[]{disp:?disp,id:?id}');
  }

  async getChildren(parentRef, options = {}) {
    const { nodeType, pagination = {}, searchText = '' } = options;
    const query = { parentRef };
    if (nodeType) {
      query.nodeType = nodeType;
    }

    if (searchText.length) {
      query.recursive = false;
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
      sortBy: [{ attribute: 'nodeType', ascending: true }, { attribute: '?disp', ascending: true }]
    };

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

  async getDisp(typeRef) {
    return Records.get(typeRef).load('?disp');
  }

  async getInhFormRef(typeId) {
    return Records.get(typeId).load('inhFormRef?id');
  }
}

const INSTANCE = new DocLibServiceApi();
export default INSTANCE;
