import React from 'react';

import BaseEditor from '../BaseEditor';
import { Checkbox } from '../../../../../common/form';

export default class BooleanEditor extends BaseEditor {
  static TYPE = 'boolean';

  getControl(config, scope) {
    return ({ value, onUpdate }) => {
      const onChange = e => {
        onUpdate(e.checked);
      };

      return <Checkbox className="p-1" checked={value} onChange={onChange} />;
    };
  }
}
