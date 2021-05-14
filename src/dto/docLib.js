import get from 'lodash/get';

import recordActions from '../components/Records/actions/recordActions';
import { SourcesId } from '../constants';
import { DOCLIB_RECORDS_PREFIX } from '../constants/docLib';
import { prepareReactKey } from '../helpers/util';

export default class DocLibConverter {
  static completeItemId(source = {}) {
    let id = source.id;
    if (id.startsWith(`${DOCLIB_RECORDS_PREFIX}@`)) {
      id = id.replace(DOCLIB_RECORDS_PREFIX, SourcesId.DOCLIB);
    }

    return { ...source, id };
  }

  static completeItemsIds(source = []) {
    return source.map(DocLibConverter.completeItemId);
  }

  static prepareFolderTreeItem(source = {}, parent) {
    return {
      id: source.id,
      title: source.title,
      hasChildren: source.hasChildrenDirs,
      parent,
      isChildrenLoaded: false,
      isUnfolded: false
    };
  }

  static prepareFolderTreeItems(source = [], parent) {
    return source.map(item => DocLibConverter.prepareFolderTreeItem(item, parent));
  }

  static prepareFileListItem(source = {}, actions = {}) {
    const recordActionsList = actions[source.id] || [];
    return {
      id: source.id,
      title: source.title,
      type: source.nodeType,
      modified: source.modified,
      typeRef: source.typeRef,
      actions: recordActionsList.map(action => {
        return {
          ...action,
          onClick: e => {
            e.stopPropagation();
            recordActions.execForRecord(source.id, action);
          }
        };
      })
    };
  }

  static prepareFileListItems(records = [], actions = {}) {
    return records.map(item => DocLibConverter.prepareFileListItem(item, actions));
  }

  static prepareUploadedFileDataForSaving(file = {}, uploadedData = {}) {
    const name = get(uploadedData, 'name', prepareReactKey({ prefix: 'file' }));

    return {
      submit: true,
      _disp: name,
      _content: [
        {
          data: { ...get(uploadedData, 'data', {}), ...file },
          name,
          originalName: name,
          size: get(uploadedData, 'size'),
          storage: 'url',
          type: file.type
        }
      ]
    };
  }
}
