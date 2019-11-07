import React, { Component } from 'react';

import EcosModal from '../common/EcosModal';

class EsignModal extends Component {
  handleHideModal = () => {
    this.props.onHideModal();
  };

  renderList() {
    const { certificates, selected } = this.props;

    if (!certificates) {
      return null;
    }

    return (
      <ul>
        {certificates.map(item => (
          <li
            key={item.id}
            style={{
              color: item.id === selected ? '#7396CD' : 'black'
            }}
          >
            {item.name}
          </li>
        ))}
      </ul>
    );
  }

  render() {
    const { isShow, isLoading, title } = this.props;

    return (
      <EcosModal title={title} isOpen={isShow} isLoading={isLoading} hideModal={this.handleHideModal}>
        {this.renderList()}
      </EcosModal>
    );
  }
}

export default EsignModal;
