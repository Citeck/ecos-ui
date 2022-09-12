import React, { useState } from 'react';
import classNames from 'classnames';
import isFunction from 'lodash/isFunction';

import { Input } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';
import { IGNORED_EVENT_ATTRIBUTE } from '../../../../../../constants';

export default class TextEditor extends BaseEditor {
  static TYPE = 'text';
  inputType = TextEditor.TYPE;

  getControl(config, scope) {
    const isCell = scope === EditorScope.CELL;

    return ({ value, onUpdate, onKeyDown, forwardedRef }) => {
      const [data, setData] = useState(value || '');

      const sendDate = () => {
        if (typeof onUpdate === 'function') {
          onUpdate(data);
        }
      };

      const onInputChange = e => {
        setData(e.target.value);
      };

      const _onKeyDown = e => {
        if (e.key === 'Enter') {
          sendDate(true);
        }

        if (isFunction(onKeyDown)) {
          e.persist();
          onKeyDown(e);
        }
      };

      return (
        <Input
          forwardedRef={forwardedRef}
          type={this.inputType}
          defaultValue={data}
          className={classNames('ecos-input_hover', {
            'ecos-input_grid-editor': isCell,
            'ecos-input_narrow': !isCell
          })}
          onChange={onInputChange}
          onBlur={sendDate}
          onKeyDown={_onKeyDown}
          onMouseDown={e => {
            e[IGNORED_EVENT_ATTRIBUTE] = true;
          }}
          autoFocus={isCell}
        />
      );
    };
  }
}
