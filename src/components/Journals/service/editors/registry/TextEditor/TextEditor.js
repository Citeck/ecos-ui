import React, { useState } from 'react';
import classNames from 'classnames';

import { Input } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';

export default class TextEditor extends BaseEditor {
  static TYPE = 'text';

  getControl(config, scope) {
    const isCell = scope === EditorScope.CELL;

    return ({ value, onUpdate }) => {
      const [data, setData] = useState(value || '');
      const onInputBlur = () => {
        onUpdate(data);
      };
      let inputOnUpdate;
      if (isCell) {
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
          className={classNames({
            'ecos-input_grid-editor': isCell,
            'ecos-input_narrow': !isCell
          })}
          onChange={e => inputOnUpdate(e.target.value)}
          onBlur={onInputBlur}
          autoFocus
        />
      );
    };
  }
}
