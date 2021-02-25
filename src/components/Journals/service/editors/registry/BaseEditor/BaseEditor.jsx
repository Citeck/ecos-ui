import React from 'react';

import BaseEditorView from './BaseEditorView';

/**
 * @typedef {Object} EditorProps
 * @field {Any}                 value     - cell value
 * @field {EditorScope}         scope     - editor scope
 * @field {Object}              config    - config
 * @field {Object}              extra
 *
 */

export default class BaseEditor {
  static TYPE = '';

  get viewComponent() {
    return BaseEditorView;
  }

  /**
   * @param {EditorServiceProps} editorServiceProps
   * @param {EditorProps} extraProps
   * @return {React.ReactNode}
   */
  getControl(editorServiceProps, extraProps) {
    const { editorProps } = editorServiceProps;
    return <this.viewComponent {...editorProps} extraProps={extraProps} />;
  }

  /**
   * @return {String}
   */
  getType() {
    return this.constructor.TYPE || BaseEditor.TYPE;
  }

  getRecordValue(record) {
    return record;
  }

  getValueToSave(items) {
    if (Array.isArray(items)) {
      return items.map(this.getRecordValue);
    }

    return this.getRecordValue(items);
  }
}
