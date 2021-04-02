import React from 'react';
import omit from 'lodash/omit';
import get from 'lodash/get';

import SelectOrgstruct from '../../../../../common/form/SelectOrgstruct';

import { getCellValue } from '../../util';

class OrgstructEditorControl /*extends BaseEditorControl*/ {
  handleChange = value => {
    const selected = Array.isArray(value) ? value : [value];
    const { onUpdate } = this.props;

    onUpdate(
      this.setValue(
        selected.map(item => ({
          value: item.id,
          disp: item.label || item.disp
        }))
      )
    );
  };

  render() {
    const { extraProps } = this.props;
    const props = omit(this.props, ['extraProps', 'onUpdate']);

    const { value } = extraProps;
    const multiple = this.isMultiple;
    const allowedAuthorityTypesStr = get(extraProps, 'config.allowedAuthorityTypes', '');
    const allowedAuthorityTypes = allowedAuthorityTypesStr.split(',').map(item => item.trim());

    return (
      <SelectOrgstruct
        {...props}
        multiple={multiple}
        isCompact
        getFullData
        inputViewClass="select-orgstruct__input-view_сompact-extra"
        defaultValue={getCellValue(value)}
        allowedAuthorityTypes={allowedAuthorityTypes}
        onChange={this.handleChange}
        onCancelSelect={props.onBlur}
      />
    );
  }
}

export default OrgstructEditorControl;
