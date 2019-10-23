import React, { Component } from 'react';
import PropTypes from 'prop-types';

import EcosModal from '../common/EcosModal';
import { SelectOrgstruct } from '../common/form';
import { AUTHORITY_TYPE_USER } from '../common/form/SelectOrgstruct/constants';

const LABELS = {
  TITLE: 'Выберите сотрудника'
};

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
        modalTitle="Выберите сотрудника"
      />
    );
  }
}

export default React.memo(SelectUserModal);
