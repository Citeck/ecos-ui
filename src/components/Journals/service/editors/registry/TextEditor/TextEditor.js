import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';

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
      const [debounceUpdate, setDebounceUpdate] = useState();

      useEffect(() => {
        if (!isCell) {
          setDebounceUpdate(debounce(onUpdate, 500));
        }
      }, []);

      let onInputOnUpdate = value => {
        setData(value);
        debounceUpdate && debounceUpdate(value);
      };

      const onInputBlur = () => {
        onUpdate(data);
      };

      const onInputChange = e => {
        onInputOnUpdate(e.target.value);
      };

      const onKeyPress = e => {
        if (e.key === 'Enter') {
          e.stopPropagation();
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
