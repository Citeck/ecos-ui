import BaseEditor from '../BaseEditor';

import React, { useState } from 'react';
import { Input } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import classNames from 'classnames';

export default class TextEditor extends BaseEditor {
  static TYPE = 'text';

  getControl(config, scope) {
    const inputClassNames = scope === EditorScope.CELL ? classNames('ecos-input_grid-editor') : classNames('ecos-input_narrow');

    return ({ value, onUpdate }) => {
      const [data, setData] = useState(value || '');
      const onInputBlur = () => {
        onUpdate(data);
      };
      let inputOnUpdate;
      if (scope === EditorScope.CELL) {
        inputOnUpdate = setData;
      } else {
        inputOnUpdate = value => {
          setData(value);
          onUpdate(value);
        };
      }
      return (
        <Input
          type="text"
          value={data}
          className={inputClassNames}
          onChange={e => inputOnUpdate(e.target.value)}
          onBlur={onInputBlur}
          autoFocus
        />
      );
    };
  }
}
