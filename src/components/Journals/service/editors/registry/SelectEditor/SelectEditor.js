import BaseEditor from '../BaseEditor';
import Records from '../../../../../Records';
import React, { useState } from 'react';
import { Select } from '../../../../../common/form';

export default class SelectEditor extends BaseEditor {
  static TYPE = 'select';

  getControl(config, scope) {
    return ({ value, attribute, recordRef, multiple, onUpdate }) => {
      const [options, setOptions] = useState(config.options);

      if (!options) {
        const optionsAtt = config.optionsAtt || `_edge.${attribute}.options{value:?str,label:?disp}`;
        Records.get(recordRef)
          .load(optionsAtt)
          .then(res => {
            if (!res) {
              setOptions([value]);
            } else if (Array.isArray(res)) {
              setOptions(res);
            } else {
              setOptions([res]);
            }
          });
      }

      const onSelectUpdate = value => {
        if (Array.isArray(value)) {
          onUpdate(value.map(v => v.value), { options });
        } else {
          onUpdate(value.value, { options });
        }
      };

      if (!options) {
        return 'Loading...';
      } else {
        return (
          <Select
            isMulti={multiple}
            autoFocus
            onChange={onSelectUpdate}
            className="select_extra-narrow"
            placeholder=""
            getOptionLabel={option => option.label || option}
            getOptionValue={option => option.value || option}
            options={options}
            value={value}
            styles={{
              menu: css => ({
                ...css,
                zIndex: 11,
                width: 'auto'
              }),
              dropdownIndicator: css => ({
                ...css,
                padding: '0 !important'
              }),
              valueContainer: css => ({
                ...css,
                paddingLeft: '3px !important'
              })
            }}
          />
        );
      }
    };
  }

  getDisplayName(value, config, scope, state) {
    for (let option of state.options) {
      if (option.value === value) {
        return option.label;
      }
    }
    return null;
  }
}
