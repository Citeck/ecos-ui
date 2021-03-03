import React from 'react';

import { t } from '../../../../helpers/export/util';
import logger from '../../../../services/logger';

import editorRegistry from './registry';
import EditorScope from './EditorScope';
import { getEditorValue } from './editorUtils';

import EditorControlWrapper from './EditorControlWrapper';

/**
 * @typedef {Object} EditorServiceProps
 * @param {EditorScope} scope
 * @field {Object}      editorProps
 * @field {Any}         value
 * @field {Object}      row
 * @field {Object}      column
 * @field {Number}      rowIndex
 * @field {Number}      columnIndex
 * @field {Object}      newEditor
 */

class EditorService {
  static get errorMessage() {
    return `#${t('error').toUpperCase()}`;
  }

  static getEditorControl({ ref, value, multiple, editor, onUpdate, onKeyDown, onBlur, onCancel, scope = EditorScope.OTHER }) {
    try {
      const editorInstance = editorRegistry.getEditor(editor.type);
      if (!editorInstance) {
        console.error('Editor is not found: "' + editor.type + '"', editor);
        return EditorService.errorMessage;
      }

      const getDisplayName = scope === EditorScope.CELL ? v => editorInstance.getDisplayName(v, editor.config, scope) : null;
      const multipleProp = scope === EditorScope.CELL ? multiple === true : false;
      const statelessControl = editorInstance.isStatelessControl(editor.config, scope);

      return (
        <EditorControlWrapper
          ref={ref}
          value={value}
          config={editor.config}
          onUpdate={onUpdate}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onCancel={onCancel}
          control={editorInstance.getControl(editor.config, scope)}
          getDisplayName={getDisplayName}
          multiple={multipleProp}
          statelessControl={statelessControl}
        />
      );
    } catch (e) {
      logger.error('[EditorService.initEditor] error', e);
      return EditorService.errorMessage;
    }
  }

  static getValueToSave(value, multiple) {
    return getEditorValue(value, multiple);
  }
}

export default EditorService;
