import get from 'lodash/get';
import React from 'react';

import SelectOrgstruct from '../../../../../common/form/SelectOrgstruct';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER } from '../../../../../common/form/SelectOrgstruct/constants.js';
import { getCellValue } from '../../util';

import { GroupTypes } from '@/components/common/Orgstruct/constants';

class OrgstructEditorControl extends React.Component {
  _splitParams(value, defaultValue) {
    if (!value) {
      return defaultValue;
    }
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => !!item);
  }

  render() {
    const { value, config, extraProps, onBlur, onUpdate, ...props } = this.props;
    const multiple = get(config, 'multiple') || get(props, 'multiple') || false;

    const allowedAuthorityTypes = this._splitParams(get(config, 'allowedAuthorityTypes'), [AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER]);
    const allowedGroupTypes = this._splitParams(get(config, 'allowedGroupTypes'), Object.values(GroupTypes));

    return (
      <SelectOrgstruct
        {...props}
        multiple={multiple}
        isCompact
        inputViewClass="select-orgstruct__input-view_сompact-extra"
        defaultValue={getCellValue(value)}
        allowedAuthorityTypes={allowedAuthorityTypes}
        allowedGroupTypes={allowedGroupTypes}
        onChange={onUpdate}
        onCancelSelect={onBlur}
      />
    );
  }
}

export default OrgstructEditorControl;
