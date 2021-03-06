import React from 'react';

import BaseEditor from '../BaseEditor';
import DateEditorControl from './DateEditorControl';

export default class DateEditor extends BaseEditor {
  static TYPE = 'date';

  getControl(config, scope, params) {
    return props => <DateEditorControl scope={scope} {...props} {...params} />;
  }
}
