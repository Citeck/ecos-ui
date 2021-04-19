import React from 'react';

import { Btn } from '../../../../components/common/btns';
import DropZone from '../../../../components/widgets/Documents/parts/DropZone';
import { EcosModal } from '../../../../components/common';
import { t } from '../../../../helpers/export/util';

class Button extends React.Component {
  fileRef = React.createRef();

  handleSelect = (...params) => {
    const { onSelect } = this.props;

    if (typeof onSelect === 'function') {
      onSelect(...params);
    }
  };

  handleToggleModal = () => {
    const { toggleModal } = this.props;

    if (typeof toggleModal === 'function') {
      toggleModal();
    }
  };

  renderModal() {
    const { label, multiple, isLoading, isOpen } = this.props;

    return (
      <EcosModal title={label} isOpen={isOpen} hideModal={this.handleToggleModal} size="md">
        <DropZone immediateUploading isLoading={isLoading} multiple={multiple} onSelect={this.handleSelect} />
      </EcosModal>
    );
  }

  render() {
    const { className, isDisabled, label } = this.props;

    return (
      <>
        <Btn className={className} onClick={this.handleToggleModal} disabled={isDisabled} withoutBaseClassName>
          {t(label)}
        </Btn>
        {this.renderModal()}
      </>
    );
  }
}

export default Button;
