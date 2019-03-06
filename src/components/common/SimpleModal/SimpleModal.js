import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import PropTypes from 'prop-types';
import './SimpleModal.scss';

export default class SimpleModal extends Component {
  render() {
    const { hideModal, isOpen, children, zIndex, className, title } = this.props;

    const header = title ? <ModalHeader toggle={hideModal}>{title}</ModalHeader> : null;

    return (
      <Modal isOpen={isOpen} toggle={hideModal} zIndex={zIndex} size={'lg'} className={className}>
        {header}
        <ModalBody>{children}</ModalBody>
      </Modal>
    );
  }
}

SimpleModal.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  isOpen: PropTypes.bool,
  hideModal: PropTypes.func,
  title: PropTypes.string,
  zIndex: PropTypes.number
};
