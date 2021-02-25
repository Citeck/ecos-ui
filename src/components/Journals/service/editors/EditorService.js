import { t } from '../../../../helpers/export/util';
import logger from '../../../../services/logger';

import editorRegistry from './registry';
import { EDITOR_SCOPE } from './constants';

/**
 * @typedef {Object} EditorServiceProps
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

  /**
   * @param {EditorServiceProps} props
   * @param {EditorScope} scope
   * @return {React.ReactNode}
   */
  static initEditor(props = {}, scope = EDITOR_SCOPE.CELL) {
    const { newEditor } = props;

    const { type, config } = newEditor;

    try {
      const editor = editorRegistry.getEditor(type);

      const editorProps = {
        editorServiceProps: props,
        value: props.value,
        scope,
        config
      };

      return editor.getControl(props, editorProps);
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
  }
}

export default EditorService;
