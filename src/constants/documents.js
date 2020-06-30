import { t } from '../helpers/util';

export const statusesKeys = {
  ALL: 'all',
  FILE_ADDED: 'file-added',
  MULTI_FILES_ADDED: 'multi-files-added',
  NEED_ADD_FILES: 'need-add-files',
  NEED_ADD_FILE: 'need-add-file',
  CAN_ADD_FILES: 'can-add-files',
  CAN_ADD_FILE: 'can-add-file'
};

export const typesStatuses = {
  [statusesKeys.ALL]: 'documents-widget.types-statuses.all',
  [statusesKeys.FILE_ADDED]: 'documents-widget.types-statuses.file-added',
  [statusesKeys.MULTI_FILES_ADDED]: 'documents-widget.types-statuses.multiple-files-added',
  [statusesKeys.NEED_ADD_FILES]: 'documents-widget.types-statuses.need-add-files',
  [statusesKeys.NEED_ADD_FILE]: 'documents-widget.types-statuses.need-add-file',
  [statusesKeys.CAN_ADD_FILE]: 'documents-widget.types-statuses.can-add-file',
  [statusesKeys.CAN_ADD_FILES]: 'documents-widget.types-statuses.can-add-files'
};

export const typeStatusesByFields = Object.keys(typesStatuses).map(key => ({
  key,
  value: typesStatuses[key]
}));

export const tooltips = {
  SETTINGS: t('documents-widget.tooltip.settings')
};

export const documentFields = {
  id: '__id',
  name: '__name',
  modified: '__modified',
  loadedBy: '__loadedBy'
};

export const tableFields = {
  ALL: [
    {
      name: 'type',
      label: 'documents-widget.table-fields.settings'
    },
    {
      name: documentFields.loadedBy,
      label: 'documents-widget.table-fields.uploaded-by'
    },
    {
      name: documentFields.modified,
      label: 'documents-widget.table-fields.updated-at'
    },
    {
      name: 'count',
      label: ''
    }
  ],
  DEFAULT: [
    {
      name: documentFields.name,
      label: 'documents-widget.table-fields.name'
    },
    {
      name: documentFields.loadedBy,
      label: 'documents-widget.table-fields.uploaded-by'
    },
    {
      name: documentFields.modified,
      label: 'documents-widget.table-fields.updated-at'
    }
  ]
};

export const errorTypes = Object.freeze({
  UPLOAD: 'uploadError',
  COUNT_FILES: 'countFilesError'
});

export const documentActions = [
  'uiserv/action@content-download',
  'uiserv/action@content-preview-modal',
  'uiserv/action@edit',
  'uiserv/action@delete'
];

export const NULL_FORM = 'uiserv/eform@null';
export const DATE_FORMAT = 'DD.MM.YYYY HH:mm';
export const DEFAULT_REF = 'dict@cm:content';
