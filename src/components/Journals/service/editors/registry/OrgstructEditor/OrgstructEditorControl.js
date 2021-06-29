import React from 'react';
import get from 'lodash/get';

import SelectOrgstruct from '../../../../../common/form/SelectOrgstruct';
import { getCellValue } from '../../util';

class OrgstructEditorControl extends React.Component {
  render() {
    const { value, config, extraProps, onBlur, onUpdate, ...props } = this.props;
    const multiple = get(config, 'multiple') || false;
    const allowedAuthorityTypesStr = get(config, 'allowedAuthorityTypes') || '';
    const allowedAuthorityTypes = allowedAuthorityTypesStr.split(',').map(item => item.trim());

    return (
      <SelectOrgstruct
        {...props}
        multiple={multiple}
        isCompact
        inputViewClass="select-orgstruct__input-view_сompact-extra"
        defaultValue={getCellValue(value)}
        allowedAuthorityTypes={allowedAuthorityTypes}
        onChange={onUpdate}
        onCancelSelect={onBlur}
      />
    );
  }
}

export default OrgstructEditorControl;
