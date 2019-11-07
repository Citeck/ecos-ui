import React, { Component } from 'react';

import EcosModal from '../common/EcosModal';

class EsignModal extends Component {
  handleHideModal = () => {
    this.props.onHideModal();
  };

  render() {
    const { isShow, isLoading, title } = this.props;

    return <EcosModal title={title} isOpen={isShow} isLoading={isLoading} hideModal={this.handleHideModal} />;
  }
}

export default EsignModal;
