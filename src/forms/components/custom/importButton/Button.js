import React from 'react';
import get from 'lodash/get';

import { Btn } from '../../../../components/common/btns';
import { t } from '../../../../helpers/export/util';
import DropZone from '../../../../components/widgets/Documents/parts/DropZone';
import { EcosModal } from '../../../../components/common';

class Button extends React.Component {
  fileRef = React.createRef();

  state = {
    isOpenModal: false
  };

  handleClick = () => {
    const input = get(this.fileRef, 'current');

    if (input) {
      input.value = '';
      input.click();
    }
  };

  handleChange = () => {
    const { onChange } = this.props;
    const files = get(this.fileRef, 'current.files');

    if (typeof onChange === 'function') {
      onChange(files);
    }
  };

  handleToggleModal = () => {
    this.setState(state => ({ isOpenModal: !state.isOpenModal }));
  };

  renderModal() {
    const { onChange, className, isDisabled, label, multiple } = this.props;
    const { isOpenModal } = this.state;

    return (
      <EcosModal
        title={label}
        isOpen={isOpenModal}
        // isLoading={isLoadingUploadingModal}
        // className="ecos-docs__modal-upload"
        hideModal={this.handleToggleModal}
        size="md"
        // noHeader
      >
        <DropZone multiple={multiple} onSelect={onChange} />
      </EcosModal>
    );
  }

  render() {
    const { onChange, className, isDisabled, label, multiple } = this.props;

    return (
      <>
        <Btn className={className} onClick={this.handleToggleModal} disabled={isDisabled} withoutBaseClassName>
          {t(label)}
        </Btn>
        {this.renderModal()}
      </>
    );
  }

  // render() {
  //   const { onChange, className, isDisabled, label, multiple } = this.props;
  //
  //   return (
  //     <>
  //       <input
  //         type="file"
  //         tabIndex="-1"
  //         onChange={onChange}
  //         style={{
  //           position: 'absolute',
  //           opacity: 0,
  //           width: 0
  //         }}
  //         ref={this.fileRef}
  //         multiple={multiple}
  //       />
  //       <Btn className={className} onClick={this.handleClick} disabled={isDisabled} withoutBaseClassName>
  //         {t(label)}
  //       </Btn>
  //     </>
  //   );
  // }
}

export default Button;
