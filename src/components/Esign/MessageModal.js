import React, { Component } from 'react';
import classNames from 'classnames';

import EcosModal from '../common/EcosModal';

export default function(props) {
  const { isOpen, onHideModal, title, description, children } = props;

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
