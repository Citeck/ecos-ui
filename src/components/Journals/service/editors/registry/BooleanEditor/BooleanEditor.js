import React from 'react';

import { t } from '../../../../../../helpers/export/util';
import { getBool } from '../../../../../../helpers/util';
import ZIndex from '../../../../../../services/ZIndex';
import { Checkbox, Select } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';

const Modes = { select: 'select', checkbox: 'checkbox' };

export default class BooleanEditor extends BaseEditor {
  static TYPE = 'boolean';

  getControl(config, scope) {
    return ({ value, onUpdate }) => {
      const mode = config.mode || Modes.select;
      const _value = getBool(value);

      if (mode === Modes.checkbox) {
        return <Checkbox className="p-1" checked={_value} onChange={e => onUpdate(e.checked)} />;
      } else {
        const options = [
          { value: null, label: t('react-select.default-value.label') },
          { value: true, label: t('react-select.value-true.label') },
          { value: false, label: t('react-select.value-false.label') }
        ];
        const selected = options.filter(opt => opt.value === _value) || options[0];

        return (
          <Select
            options={options}
            defaultValue={selected}
            autoFocus={scope === EditorScope.CELL}
            onChange={item => onUpdate(item.value)}
            isSearchable={false}
            className="select_narrow select_width_full ecosZIndexAnchor"
            menuPortalTarget={document.body}
            menuPlacement="auto"
            closeMenuOnScroll={(e, { innerSelect }) => !innerSelect}
            styles={{ menuPortal: base => ({ ...base, zIndex: ZIndex.calcZ() }) }}
          />
        );
      }
    };
  }
}
