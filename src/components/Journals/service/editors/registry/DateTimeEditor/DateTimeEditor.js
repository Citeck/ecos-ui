import DateEditor from '../DateEditor';
import DateTimeEditorControl from './DateTimeEditorControl';
import React from 'react';

export default class DateTimeEditor extends DateEditor {
  static TYPE = 'datetime';

  getControl(config, scope) {
    return props => <DateTimeEditorControl {...props} />;
  }
}
