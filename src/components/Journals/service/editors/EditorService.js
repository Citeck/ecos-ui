import { t } from '../../../../helpers/export/util';
import logger from '../../../../services/logger';

import editorRegistry from './registry';
import EditorScope from './EditorScope';

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

  static getEditorControl({ value, column, editor, onChange, scope = EditorScope.OTHER }) {
    try {
      const editorInstance = editorRegistry.getEditor(editor.type, config);
      if (!editorInstance) {
        console.error('Editor is not found: "' + editor.type + '"', editor);
        return EditorService.errorMessage;
      }
      return (
        <EditorControlWrapper
          value={value}
          scope={scope}
          config={editor.config}
          onChange={value => EditorService.onValueChanged(value, column, onChange, editorInstance)}
          control={editorInstance.getControl(editor.config)}
        />
      );
    } catch (e) {
      logger.error('[EditorService.initEditor] error', e);
      return EditorService.errorMessage;
    }
  }

  static onValueChanged(value, column, onChange, config, editorInstance) {
    let newValue;
    if (value === null || value === undefined) {
      if (column.multiple) {
        newValue = [];
      } else {
        newValue = null;
      }
    } else {
      if (column.multiple) {
        if (!Array.isArray(value)) {
          newValue = [value];
        } else {
          newValue = value;
        }
      } else {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            newValue = null;
          } else {
            newValue = value[0];
          }
        } else {
          newValue = value;
        }
      }
    }

    let dispName = EditorService._getDisplayName(newValue, config, editorInstance);
    if (dispName == null) {
      onChange(newValue);
    } else {
      if (dispName.then) {
        dispName.then(resp => {
          onChange({
            disp: resp || newValue
          });
        });
      }
    }
  }

  static _getDisplayName(value, config, editorInstance) {
    if (value == null) {
      return Promise.resolve(null);
    }

    if (Array.isArray(value)) {
      return Promise.all(value.map(v => this._getDisplayName(v, editorInstance)));
    }

    let dispName = editorInstance.getDisplayName(value, config);
    if (dispName == null) {
      return value;
    } else {
      if (dispName.then) {
        return dispName.then(resp => {
          return {
            disp: resp || value,
            value: value
          };
        });
      } else {
        return {
          disp: dispName || value,
          value: value
        };
      }
    }
  }

  /*  static getDisplayName(value, editor) {
    try {
      const editor = editorRegistry.getEditor(editor.type, config);
      if (!editor) {
        console.error('Editor is not found: "' + editor.type + '"', editor);
        return EditorService.errorMessage;
      }

    } catch (e) {
      logger.error('[EditorService.initEditor] error', e);
      return EditorService.errorMessage;
    }
  }

  static getValueToSave(newEditor, value, isMultiple = false) {
    const { type } = newEditor;
    try {
      const editor = editorRegistry.getEditor(type);
      const valueToSave = editor.getValueToSave(value);

      if (Array.isArray(valueToSave) && !isMultiple) {
        return valueToSave[0];
      }
      return valueToSave;

    } catch (e) {
      logger.error('[EditorService.getValueToSave] error', e);
      return value;
    }
  }*/
}

export default EditorService;
