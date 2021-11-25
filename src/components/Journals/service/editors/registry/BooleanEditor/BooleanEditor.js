import React, { useCallback, useEffect, useState } from 'react';
import isFunction from 'lodash/isFunction';
import get from 'lodash/get';

import { t } from '../../../../../../helpers/export/util';
import { getBool } from '../../../../../../helpers/util';
import ZIndex from '../../../../../../services/ZIndex';
import { Checkbox, Select } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';

const Modes = { select: 'select', checkbox: 'checkbox' };

export default class BooleanEditor extends BaseEditor {
  static TYPE = 'boolean';

  static options = [
    {
      value: null,
      get label() {
        return t('react-select.select-value.label');
      }
    },
    {
      value: true,
      get label() {
        return t('react-select.value-true.label');
      }
    },
    {
      value: false,
      get label() {
        return t('react-select.value-false.label');
      }
    }
  ];

  getControl(config, scope) {
    return ({ value, onUpdate }) => {
      const [selected, setSelected] = useState(value);
      const mode = config.mode || Modes.select;
      const _value = getBool(value);

      if (mode === Modes.checkbox) {
        return <Checkbox className="p-1" checked={_value} onChange={e => onUpdate(e.checked)} />;
      }

      useEffect(() => {
        const selected = BooleanEditor.options.find(opt => get(opt, 'value', opt) === value) || null;

        setSelected(selected);
      }, [value]);

      const onSelect = useCallback(
        selected => {
          if (isFunction(onUpdate)) {
            onUpdate(selected.value);
          }

          setSelected(selected);
        },
        [value]
      );

      return (
        <Select
          options={BooleanEditor.options}
          value={selected}
          autoFocus={scope === EditorScope.CELL}
          onChange={onSelect}
          isSearchable={false}
          className="select_narrow select_width_full ecosZIndexAnchor"
          menuPortalTarget={document.body}
          menuPlacement="auto"
          closeMenuOnScroll={(e, { innerSelect }) => !innerSelect}
          styles={{ menuPortal: base => ({ ...base, zIndex: ZIndex.calcZ() }) }}
        />
      );
    };
  }
}
