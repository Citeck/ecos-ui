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

  static getEditorControl({
    ref,
    value,
    attribute,
    recordRef,
    multiple,
    editor,
    onUpdate,
    onKeyDown,
    onBlur,
    onCancel,
    scope = EditorScope.OTHER
  }) {
    try {
      let editorConfig = editor.config || {};
      let editorInstance = editorRegistry.getEditor(editor.type);
      if (!editorInstance) {
        console.error('Editor is not found: "' + editor.type + '"', editor);
        editorInstance = editorRegistry.getEditor('text');
        editorConfig = {};
      }

      const getDisplayName =
        scope === EditorScope.CELL
          ? (v, state) => {
              return editorInstance.getDisplayName(v, editorConfig, scope, state || {});
            }
          : null;
      const multipleProp = scope === EditorScope.CELL ? multiple === true : false;

      return (
        <EditorControlWrapper
          ref={ref}
          recordRef={recordRef}
          attribute={attribute}
          value={value}
          config={editorConfig}
          onUpdate={onUpdate}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onCancel={onCancel}
          control={editorInstance.getControl(editorConfig, scope)}
          getDisplayName={getDisplayName}
          multiple={multipleProp}
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
