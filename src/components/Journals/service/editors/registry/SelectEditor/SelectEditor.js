import BaseEditor from '../BaseEditor';
import Records from '../../../../../Records';
import React, { useEffect, useState } from 'react';

import logger from '../../../../../../services/logger';
import { t } from '../../../../../../helpers/export/util';
import { Select } from '../../../../../common/form';
import ClickOutside from '../../../../../ClickOutside';

export default class SelectEditor extends BaseEditor {
  static TYPE = 'select';

  getControl(config, scope) {
    return ({ value, attribute, recordRef, multiple, onUpdate }) => {
      const [options, setOptions] = useState([]);
      const [isLoading, setLoading] = useState(false);

      useEffect(() => {
        let propOptions = config.options;

        if (config.options && typeof config.options === 'string') {
          try {
            propOptions = JSON.parse(config.options);
          } catch (e) {
            logger.error('[SelectEditor config.options] error', e);
            propOptions = [];
          }
        }

        setOptions(propOptions);
      }, []);

      useEffect(() => {
        if (!options && !isLoading) {
          const optionsAtt = config.optionsAtt || `_edge.${attribute}.options{value:?str,label:?disp}`;

          setLoading(true);
          Records.get(recordRef)
            .load(optionsAtt)
            .then(res => {
              let opts;
              if (!res) {
                opts = [value];
              } else if (Array.isArray(res)) {
                opts = res;
              } else {
                opts = [res];
              }
              setOptions(opts);
              setLoading(false);
            });
        }
      }, [options]);

      const onSelectUpdate = value => {
        if (Array.isArray(value)) {
          onUpdate(value.map(v => v.value), { options });
        } else {
          onUpdate(value.value, { options });
        }
      };

      const selected = options ? options.filter(opt => (opt.value || opt) === value) : null;

      if (!options) {
        return <div className="text-dark">{t('ecos-ui.select.loading-message')}</div>;
      } else {
        return (
          <ClickOutside handleClickOutside={() => onSelectUpdate(selected)}>
            <Select
              isMulti={multiple}
              autoFocus
              onChange={onSelectUpdate}
              className="select_extra-narrow"
              getOptionLabel={option => option.label || option}
              getOptionValue={option => option.value || option}
              options={options}
              value={selected}
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
          </ClickOutside>
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
