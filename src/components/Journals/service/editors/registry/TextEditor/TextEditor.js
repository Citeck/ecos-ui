import React, { useState } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';

import { Input } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';

const debounceUpdater = debounce(update => {
  update && update();
}, 500);

export default class TextEditor extends BaseEditor {
  static TYPE = 'text';
  inputType = TextEditor.TYPE;

  getControl(config, scope) {
    const isCell = scope === EditorScope.CELL;

    return ({ value, onUpdate }) => {
      const [data, setData] = useState(value || '');

      const onInputOnUpdate = value => {
        setData(value);
        !isCell && debounceUpdater(sendDate);
      };

      const sendDate = () => {
        onUpdate(data);
      };

      const onInputChange = e => {
        onInputOnUpdate(e.target.value);
      };

      const onKeyPress = e => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          sendDate();
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
          onBlur={sendDate}
          onKeyPress={onKeyPress}
          autoFocus={isCell}
        />
      );
    };
  }
}
