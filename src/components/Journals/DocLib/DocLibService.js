import { EventEmitter2 } from 'eventemitter2';
import get from 'lodash/get';

import { SourcesId } from '../../../constants';
import DocLibConverter from '../../../dto/docLib';

import { LS_UNFOLDED_PREFIX, NODE_TYPES } from '../../../constants/docLib';
import { t } from '../../../helpers/export/util';
import EcosFormUtils from '../../../components/EcosForm/EcosFormUtils';

import docLibApi from './DocLibServiceApi';

/**
 * Service to work with document library.
 */
class DocLibService {
  actionSuccessCallback = 'ACTION_SUCCESS_CALLBACK';

  constructor() {
    this.emitter = new EventEmitter2();
  }

  getRootId(typeRef) {
    return typeRef && `${SourcesId.DOCLIB}@${typeRef.replace(`${SourcesId.TYPE}@`, '')}$`;
  }

  async getTypeRef(journalId) {
    return docLibApi.getTypeRef(journalId);
  }

  async isDocLibEnabled(typeRef) {
    return docLibApi.isDocLibEnabled(typeRef);
  }

  async getFileTypeRefs(typeRef) {
    return docLibApi.getFileTypeRefs(typeRef);
  }

  async getDirTypeRef(typeRef) {
    return docLibApi.getDirTypeRef(typeRef);
  }

  async getDirPath(folderRef) {
    return docLibApi.getDirPath(folderRef);
  }

  async getChildren(id, options = {}) {
    return docLibApi.getChildren(id, options).then(result => ({
      ...result,
      records: DocLibConverter.completeItemsIds(result.records)
    }));
  }

  async loadNode(id) {
    return docLibApi.loadNode(id).then(DocLibConverter.completeItemId);
  }

  async getChildrenDirs(id) {
    return docLibApi
      .getChildren(id, { nodeType: NODE_TYPES.DIR })
      .then(result => result.records)
      .then(DocLibConverter.completeItemsIds);
  }

  async createChild(rootId, parentId, typeRef, attributes = {}) {
    const atts = {
      _parent: parentId || rootId,
      _type: typeRef,
      ...attributes
    };

    if (get(atts, 'name') && get(atts, '_content') && atts._content.length) {
      const fileName = get(atts._content[0], 'originalName', '') || get(atts._content[0], 'name', '');
      const format = fileName.split('.').pop();

      if (!!fileName && !!format) {
        atts.name += '.' + format;
      }
    }

    return docLibApi.createChild(rootId, { attributes: atts });
  }

  async getFolderTitle(typeRef) {
    return docLibApi.getDisp(typeRef);
  }

  _getLsKey(typeRef) {
    return `${LS_UNFOLDED_PREFIX}_${typeRef}`;
  }

  loadUnfoldedFolders(typeRef) {
    if (!localStorage) {
      return [];
    }

    const lsKey = this._getLsKey(typeRef);
    const lsData = localStorage.getItem(lsKey);
    if (!lsData) {
      return [];
    }

    const items = JSON.parse(lsData);
    if (!Array.isArray(items)) {
      return [];
    }

    return items;
  }

  saveUnfoldedFolders(typeRef, items) {
    if (!localStorage || !Array.isArray(items)) {
      return;
    }

    const lsKey = this._getLsKey(typeRef);
    localStorage.setItem(lsKey, JSON.stringify(items));
  }

  addUnfoldedItem(typeRef, id) {
    const items = this.loadUnfoldedFolders(typeRef);
    if (items.includes(id)) {
      return;
    }
    items.push(id);
    this.saveUnfoldedFolders(typeRef, items);
  }

  removeUnfoldedItem(typeRef, id) {
    const items = this.loadUnfoldedFolders(typeRef).filter(item => item !== id);
    this.saveUnfoldedFolders(typeRef, items);
  }

  async getCreateVariants(dirTypeRef, fileTypeRefs) {
    const cv = [];

    if (dirTypeRef) {
      cv.push({
        title: await docLibApi.getDisp(dirTypeRef),
        destination: dirTypeRef,
        nodeType: NODE_TYPES.DIR
      });
    }

    if (Array.isArray(fileTypeRefs)) {
      for (let fileTypeRef of fileTypeRefs) {
        cv.push({
          title: await docLibApi.getDisp(fileTypeRef),
          destination: fileTypeRef,
          nodeType: NODE_TYPES.FILE
        });
      }
    }

    return cv;
  }

  async getCreateFormDefinition(createVariant) {
    const nodeType = createVariant.nodeType;

    if (nodeType === NODE_TYPES.FILE) {
      const formId = await docLibApi.getInhFormRef(createVariant.destination);
      if (EcosFormUtils.isFormId(formId)) {
        return EcosFormUtils.getFormById(formId, 'definition?json');
      }
    }

    const components = [];

    if (nodeType === NODE_TYPES.FILE) {
      const fileComponentKey = '_content';
      components.push(
        {
          label: t('document-library.create-node.fields.content'),
          type: 'file',
          key: fileComponentKey,
          storage: 'url',
          url: '/gateway/emodel/api/ecos/webapp/content',
          validate: {
            required: true
          },
          input: true
        },
        {
          clearOnHide: false,
          hidden: true,
          calculateValue: `
            const content = data['${fileComponentKey}'];
            if (Array.isArray(content) && content.length) {
              value = _.get(content, '[0].originalName')
            } else {
              value = '';
            }
          `,
          key: 'name',
          type: 'textfield'
        }
      );
    } else if (nodeType === NODE_TYPES.DIR) {
      components.push({
        label: t('document-library.create-node.fields.title'),
        type: 'textfield',
        key: 'name',
        validate: {
          required: true
        }
      });
    }

    components.push({
      label: 'Columns',
      columns: [
        { sm: 12, md: 4, lg: 6, index: 0 },
        {
          sm: 12,
          md: 4,
          lg: 3,
          index: 1,
          components: [
            {
              label: t('btn.cancel.label'),
              type: 'button',
              action: 'event',
              block: true,
              event: 'cancel',
              removeIndents: true
            }
          ]
        },
        {
          sm: 12,
          md: 4,
          lg: 3,
          index: 2,
          components: [
            {
              label: t('btn.create.label'),
              type: 'button',
              theme: 'primary',
              action: 'submit',
              block: true,
              removeIndents: true
            }
          ]
        }
      ],
      type: 'columns'
    });

    return {
      display: 'form',
      components
    };
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.DocLib = window.Citeck.DocLib || new DocLibService();

export default window.Citeck.DocLib;
