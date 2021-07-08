import React from 'react';

import DateEditor from '../DateEditor';
import DateTimeEditorControl from './DateTimeEditorControl';

export default class DateTimeEditor extends DateEditor {
  static TYPE = 'datetime';

  getControl(config, scope, params) {
    return props => <DateTimeEditorControl scope={scope} {...props} {...params} />;
  }
}
