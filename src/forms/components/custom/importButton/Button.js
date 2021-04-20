import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { CardSubtitle } from 'reactstrap';

import { Btn } from '../../../../components/common/btns';
import DropZone from '../../../../components/widgets/Documents/parts/DropZone';
import { EcosModal } from '../../../../components/common';
import { t } from '../../../../helpers/export/util';

class Button extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    onSelect: PropTypes.func,
    toggleModal: PropTypes.func,
    isDisabled: PropTypes.bool,
    label: PropTypes.string,
    multiple: PropTypes.bool,
    uploadedFilesInfo: PropTypes.arrayOf(PropTypes.string),
    isShowUploadedFile: PropTypes.bool
  };

  static defaultProps = {};

  fileRef = React.createRef();

  handleSelect = (files, callback) => {
    const { onSelect } = this.props;

    if (typeof onSelect === 'function') {
      onSelect(files, callback);
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

  renderUploadedFile() {
    const { isShowUploadedFile, uploadedFilesInfo } = this.props;

    if (!isShowUploadedFile || isEmpty(uploadedFilesInfo)) {
      return null;
    }

    return (
      <div className="pt-2">
        {uploadedFilesInfo.map(item => (
          <CardSubtitle className="mb-2 text-muted" key={item}>
            {item}
          </CardSubtitle>
        ))}
      </div>
    );
  }

  render() {
    const { className, isDisabled, label } = this.props;

    return (
      <>
        <Btn className={className} onClick={this.handleToggleModal} disabled={isDisabled} withoutBaseClassName>
          {t(label)}
        </Btn>
        {this.renderUploadedFile()}
        {this.renderModal()}
      </>
    );
  }
}

export default Button;
