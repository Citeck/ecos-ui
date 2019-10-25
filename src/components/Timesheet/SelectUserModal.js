import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SelectOrgstruct } from '../common/form';
import { AUTHORITY_TYPE_USER } from '../common/form/SelectOrgstruct/constants';
import { CommonLabels } from '../../helpers/timesheet/dictionary';

class SelectUserModal extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    onSelect: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    isOpen: false,
    onSelect: () => null,
    onCancel: () => null
  };

  render() {
    const { isOpen, onSelect, onCancel } = this.props;

    if (!isOpen) {
      return null;
    }

    return (
      <SelectOrgstruct
        allowedAuthorityTypes={[AUTHORITY_TYPE_USER]}
        onChange={onSelect}
        onCancelSelect={onCancel}
        isCompact
        openByDefault
        withoutInput
        modalTitle={CommonLabels.MODAL_SELECT_ORG_STRUCT_TITLE}
      />
    );
  }
}

export default React.memo(SelectUserModal);
