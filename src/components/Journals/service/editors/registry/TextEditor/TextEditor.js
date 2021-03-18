import React, { useState } from 'react';
import classNames from 'classnames';

import { Input } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';

export default class TextEditor extends BaseEditor {
  static TYPE = 'text';
  inputType = TextEditor.TYPE;

  getControl(config, scope) {
    const isCell = scope === EditorScope.CELL;

    return ({ value, onUpdate }) => {
      const [data, setData] = useState(value || '');
      let inputOnUpdate;

      if (isCell) {
        inputOnUpdate = setData;
      } else {
        inputOnUpdate = value => {
          setData(value);
          onUpdate(value);
        };
      }

      const onInputBlur = () => {
        onUpdate(data);
      };

      const onInputChange = e => {
        inputOnUpdate(e.target.value);
      };

      const onKeyPress = e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onUpdate(data);
        }
      };

      return (
        <Input
          type={this.inputType}
          defaultValue={data}
          className={classNames({
            'ecos-input_grid-editor': isCell,
            'ecos-input_narrow': !isCell
          })}
          onChange={onInputChange}
          onBlur={onInputBlur}
          onKeyPress={onKeyPress}
          autoFocus={isCell}
        />
      );
    };
  }
}
