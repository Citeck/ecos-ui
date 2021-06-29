import React from 'react';

import Records from '../../../../../Records';
import BaseEditor from '../BaseEditor';
import OrgstructEditorControl from './OrgstructEditorControl';

export default class OrgstructEditor extends BaseEditor {
  static TYPE = 'orgstruct';

  getControl(config, scope) {
    return props => <OrgstructEditorControl config={config} {...props} />;
  }

  getDisplayName(value, config, scope, state) {
    return Records.get(value).load('?disp');
  }
}
