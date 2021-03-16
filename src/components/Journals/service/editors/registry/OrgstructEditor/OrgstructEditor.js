import React from 'react';

import BaseEditor from '../BaseEditor';
import OrgstructEditorControl from './OrgstructEditorControl';

export default class OrgstructEditor extends BaseEditor {
  static TYPE = 'orgstruct';

  getControl(config, scope) {
    return props => <OrgstructEditorControl config={config} {...props} />;
  }

  getRecordValue(record) {
    return record.value;
  }
}
