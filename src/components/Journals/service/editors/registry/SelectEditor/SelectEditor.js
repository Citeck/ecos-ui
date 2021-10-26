import React, { useCallback, useEffect, useState } from 'react';

import logger from '../../../../../../services/logger';
import ZIndex from '../../../../../../services/ZIndex';
import { t } from '../../../../../../helpers/export/util';
import Records from '../../../../../Records';
import { Select } from '../../../../../common/form';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';

export default class SelectEditor extends BaseEditor {
  static TYPE = 'select';

  getControl(config, scope) {
    return ({ value, attribute, recordRef, multiple, onUpdate }) => {
      const [options, setOptions] = useState([]);
      const [isLoading, setLoading] = useState(false);
      const [selected, setSelected] = useState([]);

      const onSelectUpdate = useCallback(
        value => {
          if (Array.isArray(value)) {
            onUpdate(value.map(v => v.value), { options });
          } else {
            onUpdate(value.value, { options });
          }

          setSelected(value);
        },
        [options]
      );

      useEffect(() => {
        const selected = options ? options.filter(opt => (opt.value || opt) === value) : null;
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
        setSelected(selected);
      }, []);

      useEffect(() => {
        if (!options && !isLoading) {
          const optionsAtt = config.optionsAtt || `_edge.${attribute}.options[]{value:?str,label:?disp}`;

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

      useEffect(() => {
        const selected = options ? options.filter(opt => (opt.value || opt) === value) : null;

        setSelected(selected);
      }, [value, options]);

      if (isLoading) {
        return <div className="text-dark">{t('ecos-ui.select.loading-message')}</div>;
      }

      if (!options || !options.length) {
        return <div className="text-dark">{t('ecos-ui.select.no-options-message')}</div>;
      }

      return (
        <Select
          isMulti={multiple}
          autoFocus={scope === EditorScope.CELL}
          onChange={onSelectUpdate}
          className="select_narrow select_width_full ecosZIndexAnchor"
          getOptionLabel={option => option.label || option}
          getOptionValue={option => option.value || option}
          options={[{ value: null, label: t('react-select.select-value.label') }, ...options]}
          value={selected}
          menuPortalTarget={document.body}
          menuPlacement="auto"
          closeMenuOnScroll={(e, { innerSelect }) => !innerSelect}
          styles={{
            menu: css => ({
              ...css,
              zIndex: 11,
              width: 'auto',
              minWidth: '100%'
            }),
            menuPortal: base => ({
              ...base,
              zIndex: ZIndex.calcZ()
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
