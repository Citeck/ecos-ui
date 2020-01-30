import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { SelectOrgstruct } from '../common/form';
import { AUTHORITY_TYPE_USER, TAB_ALL_USERS } from '../common/form/SelectOrgstruct/constants';
import { CommonLabels } from '../../helpers/timesheet/dictionary';

class SelectUserModal extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    getFullData: PropTypes.bool,
    defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    onSelect: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    isOpen: false,
    getFullData: false,
    defaultValue: '',
    onSelect: () => null,
    onCancel: () => null
  };

  renderListItem = item => {
    return `${get(item, 'label', '')} (${get(item, 'attributes.fullName', '')})`;
  };

  render() {
    const { isOpen, onSelect, onCancel, defaultValue } = this.props;

    if (!isOpen) {
      return null;
    }

    return (
      <SelectOrgstruct
        allUsersGroup={'RU_GE_Users'}
        defaultValue={defaultValue}
        allowedAuthorityTypes={[AUTHORITY_TYPE_USER]}
        onChange={onSelect}
        onCancelSelect={onCancel}
        renderListItem={this.renderListItem}
        filterFields={['label', 'attributes.fullName']}
        isCompact
        openByDefault
        withoutInput
        withoutTabs
        getFullData
        defaultTab={TAB_ALL_USERS}
        liveSearch
        modalTitle={CommonLabels.MODAL_SELECT_ORG_STRUCT_TITLE}
      />
    );
  }
}

export default React.memo(SelectUserModal);
