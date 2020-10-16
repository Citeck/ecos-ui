import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { SelectOrgstruct } from '../common/form';
import { TAB_ALL_USERS } from '../common/form/SelectOrgstruct/constants';
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
    const str = [];
    const userName = get(item, 'attributes.userName');

    str.push(`${get(item, 'label', '')}`);

    if (userName) {
      str.push(`(${userName})`);
    }

    return str.join(' ');
  };

  render() {
    const { isOpen, onSelect, onCancel, defaultValue } = this.props;

    if (!isOpen) {
      return null;
    }

    return (
      <SelectOrgstruct
        defaultTab={TAB_ALL_USERS}
        defaultValue={defaultValue}
        modalTitle={CommonLabels.MODAL_SELECT_ORG_STRUCT_TITLE}
        onChange={onSelect}
        onCancelSelect={onCancel}
        renderListItem={this.renderListItem}
        isCompact
        openByDefault
        hideInputView
        hideTabSwitcher
        getFullData
        liveSearch
      />
    );
  }
}

export default SelectUserModal;
