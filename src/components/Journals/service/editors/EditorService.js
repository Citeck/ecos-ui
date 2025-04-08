import React from 'react';

import { t } from '../../../../helpers/export/util';

import EditorControlWrapper from './EditorControlWrapper';
import EditorScope from './EditorScope';
import { DEFAULT_EDITOR_TYPE } from './constants';
import { getEditorValue } from './editorUtils';
import editorRegistry from './registry';
import JournalEditor from './registry/JournalEditor';
import OrgstructEditor from './registry/OrgstructEditor';

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

  static isRegistered(type) {
    return !!editorRegistry.getEditor(type);
  }

  static getEditorControl({
    ref,
    forwardedRef,
    value,
    attribute,
    recordRef,
    multiple,
    editor,
    onUpdate,
    onKeyDown,
    onBlur,
    onCancel,
    scope = EditorScope.OTHER,
    controlProps,
    isRelativeToParent
  }) {
    try {
      let editorConfig = editor.config || {};
      let editorInstance = editorRegistry.getEditor(editor.type);

      if (!editorInstance) {
        console.error('Editor is not found: "' + editor.type + '"', editor);
        editorInstance = editorRegistry.getEditor(DEFAULT_EDITOR_TYPE);
        editorConfig = {};
      }

      const getDisplayName =
        scope === EditorScope.CELL ? (v, state) => editorInstance.getDisplayName(v, editorConfig, scope, state || {}) : null;
      const multipleProp =
        scope === EditorScope.CELL ? multiple === true : [OrgstructEditor.TYPE, JournalEditor.TYPE].includes(editor.type);
      const control = editorInstance.getControl(editorConfig, scope, controlProps);

      if (!control) {
        return <div className="text-warning">{t('journal.generated-field.editor.not-exist')}</div>;
      }

      return (
        <EditorControlWrapper
          ref={ref}
          isRelativeToParent={isRelativeToParent}
          forwardedRef={forwardedRef}
          recordRef={recordRef}
          attribute={attribute}
          value={value}
          config={editorConfig}
          onUpdate={onUpdate}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onCancel={onCancel}
          control={control}
          getDisplayName={getDisplayName}
          multiple={multipleProp}
          deps={{ value, ...controlProps }}
        />
      );
    } catch (e) {
      console.error('[EditorService.initEditor] error', e);
      return EditorService.errorMessage;
    }
  }

  static getValueToSave(value, multiple) {
    return getEditorValue(value, multiple);
  }
}

export default EditorService;
