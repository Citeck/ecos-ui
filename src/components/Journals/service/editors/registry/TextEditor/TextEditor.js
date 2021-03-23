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

      const sendDate = () => {
        onUpdate(data);
      };

      const onInputChange = e => {
        setData(e.target.value);
      };

      const onKeyDown = e => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          sendDate();
        }
      };

      return (
        <Input
          type={this.inputType}
          defaultValue={data}
          className={classNames('ecos-input_hover', {
            'ecos-input_grid-editor': isCell,
            'ecos-input_narrow': !isCell
          })}
          onChange={onInputChange}
          onBlur={sendDate}
          onKeyDown={onKeyDown}
          autoFocus={isCell}
        />
      );
    };
  }
}
