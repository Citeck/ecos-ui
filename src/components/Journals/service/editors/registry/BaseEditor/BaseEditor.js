import React from 'react';

import BaseEditorControl from './BaseEditorControl';

/**
 * @typedef {Object} EditorProps
 * @field {Any}                 value     - cell value
 * @field {EditorScope}         scope     - editor scope
 * @field {Object}              config    - config
 * @field {Boolean}             multiple  - multiple
 */
export default class BaseEditor {
  static TYPE = '';

  getControl(config) {
    return BaseEditorControl;
  }

  /**
   * @return {String}
   */
  getType() {
    return this.constructor.TYPE;
  }

  getDisplayName(value, config) {
    return null;
  }
}
