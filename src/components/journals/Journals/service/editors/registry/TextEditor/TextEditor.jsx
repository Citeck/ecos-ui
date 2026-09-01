import { IGNORED_EVENT_ATTRIBUTE } from '@citeck/constants';
import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { useState } from 'react';

import { Input } from '@/components/common/form';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';

export default class TextEditor extends BaseEditor {
  static TYPE = 'text';
  inputType = TextEditor.TYPE;

  getControl(config, scope, params) {
    const isCell = scope === EditorScope.CELL;
    // a cell editor always takes the keyboard; a filter only when it asks (the column header popup)
    const autoFocus = isCell || !!get(params, 'autoFocus');

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
          autoFocus={autoFocus}
        />
      );
    };
  }
}
