import React, { Component } from 'react';
import classNames from 'classnames';

import EcosModal from '../common/EcosModal';

class MessageModal extends Component {
  render() {
    const { isOpen, onHideModal, title, description, children } = this.props;

    return (
      <EcosModal
        isOpen={isOpen}
        hideModal={onHideModal}
        title={title}
        className={classNames('esign-message', {
          'esign-message_title-center': !description
        })}
        isBigHeader={!description}
      >
        <div className="esign-message__description">{description}</div>
        {children}
      </EcosModal>
    );
  }
}

export default MessageModal;
