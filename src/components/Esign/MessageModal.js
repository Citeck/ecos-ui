import React from 'react';
import classNames from 'classnames';

import EcosModal from '../common/EcosModal';

export default function(props) {
  const { isOpen = false, onHideModal, title = '', description = '', children = null } = props;

  return (
    <EcosModal
      isOpen={isOpen}
      hideModal={() => {
        if (typeof onHideModal === 'function') {
          onHideModal();
        }
      }}
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
