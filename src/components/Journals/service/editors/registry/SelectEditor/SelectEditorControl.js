import React from 'react';
import omit from 'lodash/omit';
import get from 'lodash/get';

import { Select } from '../../../../../common/form';

class SelectEditorControl /*extends BaseEditorControl*/ {
  handleChange = value => {
    const selected = Array.isArray(value) ? value : [value];

    this.setValue(selected);
  };

  render() {
    const { extraProps } = this.props;
    const props = omit(this.props, ['extraProps', 'onUpdate']);

    const { value } = extraProps;
    const multiple = this.isMultiple;
    const options = get(extraProps, 'config.options', []);

    return (
      <Select
        {...props}
        isMulti={multiple}
        autoFocus
        onChange={this.handleChange}
        className="select_extra-narrow"
        placeholder=""
        getOptionLabel={option => option.label}
        getOptionValue={option => option.value}
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
}

export default SelectEditorControl;
