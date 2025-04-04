import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import EcosFormUtils from '../components/EcosForm/EcosFormUtils';
import { JOURNAL_VIEW_MODE } from '../components/Journals/constants';
import DeleteAction from '../components/Records/actions/handler/executor/DeleteAction';
import EditAction from '../components/Records/actions/handler/executor/EditAction';
import recordActions from '../components/Records/actions/recordActions';
import { SourcesId } from '../constants';
import { DOCLIB_RECORDS_PREFIX, NODE_TYPES } from '../constants/docLib';
import { getSearchParams } from '../helpers/urls';
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

  static prepareFileListItem(source = {}, actions = {}, callback, { changeNode }) {
    const recordActionsList = actions[source.id] || [];
    const searchParams = getSearchParams();

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
            const localIdIdx = source.id.indexOf('$') + 1;

            if (
              get(searchParams, 'viewMode') === JOURNAL_VIEW_MODE.DOC_LIB &&
              action.type === EditAction.ACTION_ID &&
              isFunction(changeNode)
            ) {
              const recordId = source.id.substring(localIdIdx);

              EcosFormUtils.editRecord({
                recordRef: recordId,
                options: { actionRecord: recordId },
                saveOnSubmit: false,
                attributes: {},
                formContainer: true,
                onSubmit: (record, form) => {
                  const submission = get(form, 'data', {});

                  if (source.nodeType === NODE_TYPES.DIR && get(submission, '_disp')) {
                    submission.name = submission._disp;
                  }

                  changeNode({ record, submission, nodeType: source.nodeType });
                }
              });
            } else {
              recordActions.execForRecord(source.id.substring(localIdIdx), action).then(executed => {
                if (!executed) {
                  return;
                }

                if (isFunction(callback) && [EditAction.ACTION_ID, DeleteAction.ACTION_ID].includes(action.type)) {
                  callback();
                }
              });
            }
          }
        };
      })
    };
  }

  static prepareFileListItems(records = [], actions = {}, callback, otherParams) {
    return records.map(item => DocLibConverter.prepareFileListItem(item, actions, callback, otherParams));
  }

  static prepareUploadedFileDataForSaving(file = {}, uploadedData = {}) {
    const name = get(uploadedData, 'name', prepareReactKey({ prefix: 'file' }));

    return {
      submit: true,
      _name: name,
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

  static prepareUploadedDirDataForSaving(dir = {}) {
    const name = get(dir, 'name', prepareReactKey({ prefix: 'file' }));

    return {
      submit: true,
      _name: name
    };
  }
}
